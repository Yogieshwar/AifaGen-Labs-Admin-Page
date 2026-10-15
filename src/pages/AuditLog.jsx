import { useEffect, useMemo, useRef, useState } from 'react'

const fallbackActor = 'admin@aifagen.com'
const PAGE_SIZE = 40
const BURST_WINDOW_MS = 10 * 60 * 1000

const CATEGORIES = {
  billing: { label: 'Billing', dot: 'bg-emerald-500' },
  users: { label: 'Users', dot: 'bg-sky-500' },
  jobs: { label: 'Jobs', dot: 'bg-violet-500' },
  recruiters: { label: 'Recruiters', dot: 'bg-amber-500' },
  access: { label: 'Admin access', dot: 'bg-rose-500' },
  sources: { label: 'Job sources', dot: 'bg-slate-400' },
}

/* ---------- helpers ---------- */

function categoryOf(entry) {
  if (entry.eventType === 'profile_edit') return 'users'
  if (entry.eventType === 'job_visibility') return 'jobs'
  if (entry.eventType === 'admin_management') return 'access'
  if (entry.eventType === 'job_source_refresh') return 'sources'
  if (entry.eventType?.startsWith('recruiter_')) return 'recruiters'
  return 'billing'
}

const isSensitive = (entry) => entry.eventType === 'payment_refund' || entry.eventType === 'admin_management'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN')
}

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function dayKey(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Undated'
  const key = dayKey(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const full = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (key === dayKey(today)) return `Today, ${full}`
  if (key === dayKey(yesterday)) return `Yesterday, ${full}`
  return full
}

function formatSpan(ms) {
  const seconds = Math.max(1, Math.round(ms / 1000))
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)} min`
}

function describeChange(entry) {
  if (entry.eventType === 'payment_refund') {
    return `${formatCurrency(entry.amount)} refunded · Payment ${entry.paymentId}`
  }
  if (entry.eventType === 'profile_edit') {
    const fields = (entry.changedFields ?? []).map((field) => field.label)
    return fields.length ? `Profile fields updated: ${fields.join(', ')}` : 'Profile details updated'
  }
  if (entry.eventType === 'job_visibility') {
    const jobCount = entry.jobChanges?.length ?? 0
    const visibility = entry.jobChanges?.[0]?.visible ? 'shown' : 'hidden'
    return `${jobCount} ${entry.jobType ?? ''} ${jobCount === 1 ? 'job' : 'jobs'} ${visibility}`.replace(/\s+/g, ' ').trim()
  }
  if (entry.eventType === 'admin_management') {
    return entry.adminChange === 'added' ? 'Admin access granted' : 'Admin access removed'
  }
  if (entry.eventType?.startsWith('recruiter_')) {
    return entry.recruiterDetails || entry.reason || 'Recruiter record updated'
  }
  if (entry.eventType === 'job_source_refresh') {
    return `${entry.sourceName} refresh · ${entry.result}`
  }
  return `Plan ${entry.previousPlan} → ${entry.newPlan} · Status ${entry.previousStatus} → ${entry.newStatus}`
}

function csvCell(value) {
  const text = String(value ?? '')
  const safeValue = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeValue.replaceAll('"', '""')}"`
}

function exportCsv(entries) {
  const rows = [
    ['Admin', 'Category', 'Action', 'Subject', 'What changed', 'Reason', 'Date and time'],
    ...entries.map((entry) => [
      entry.actor || fallbackActor,
      CATEGORIES[categoryOf(entry)].label,
      entry.action,
      entry.userName,
      describeChange(entry),
      entry.reason,
      formatDate(entry.createdAt),
    ]),
  ]
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'aifagen-audit-log.csv'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* Group a newest-first list into days, and merge rapid repeats on the same subject into one cluster. */
function buildDays(items) {
  const days = []
  for (const item of items) {
    let day = days.at(-1)
    if (!day || day.key !== item.day) {
      day = { key: item.day, label: dayLabel(item.e.createdAt), clusters: [] }
      days.push(day)
    }
    const last = day.clusters.at(-1)
    const prev = last?.items.at(-1)
    const gap = prev ? Math.abs(new Date(prev.e.createdAt) - new Date(item.e.createdAt)) : Infinity
    if (last && prev.e.eventType === item.e.eventType && prev.e.userName === item.e.userName && gap <= BURST_WINDOW_MS) {
      last.items.push(item)
    } else {
      day.clusters.push({ items: [item] })
    }
  }
  return days
}

/* ---------- small pieces ---------- */

function Icon({ name, className = 'size-4' }) {
  const paths = {
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    chevron: <path d="m6 9 6 6 6-6" />,
  }
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function Field({ label, children, t, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className={`text-xs font-medium ${t.muted}`}>{label}</dt>
      <dd className="mt-1 break-words text-sm">{children}</dd>
    </div>
  )
}

function ChangeDetails({ entry, t }) {
  const box = `rounded-lg border p-4 ${t.line} ${t.sub}`

  if (entry.eventType === 'payment_refund') {
    return (
      <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${box}`}>
        <Field label="Payment ID" t={t}>{entry.paymentId}</Field>
        <Field label="Refund amount" t={t}><strong>{formatCurrency(entry.amount)}</strong></Field>
        <Field label="Reason" t={t} wide>{entry.reason || '—'}</Field>
      </dl>
    )
  }

  if (entry.eventType === 'profile_edit') {
    return (
      <div className={`overflow-hidden rounded-lg border ${t.line}`}>
        {(entry.changedFields ?? []).map((field) => (
          <div className={`grid grid-cols-1 gap-1 border-b p-3 last:border-0 sm:grid-cols-[150px_1fr_1fr] sm:gap-3 ${t.line}`} key={field.label}>
            <span className={`text-xs font-semibold ${t.muted}`}>{field.label}</span>
            <span className={`break-words text-xs ${t.muted}`}>Before: {field.previousValue || '—'}</span>
            <span className="break-words text-xs">After: {field.newValue || '—'}</span>
          </div>
        ))}
        <p className={`p-3 text-sm ${t.sub}`}>{entry.reason || 'Profile details updated by an administrator.'}</p>
      </div>
    )
  }

  if (entry.eventType === 'job_visibility') {
    return (
      <div className={`overflow-hidden rounded-lg border ${t.line}`}>
        {(entry.jobChanges ?? []).map((change) => (
          <div className={`flex items-center justify-between gap-3 border-b px-3 py-3 last:border-0 ${t.line}`} key={change.id}>
            <span className="break-words text-sm">{change.title}</span>
            <span className="whitespace-nowrap text-xs font-medium">
              {change.previousVisible ? 'Visible' : 'Hidden'} → {change.visible ? 'Visible' : 'Hidden'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (entry.eventType === 'admin_management') {
    return (
      <dl className={`grid gap-4 ${box}`}>
        <Field label={entry.adminChange === 'added' ? 'Admin added' : 'Admin removed'} t={t}>{entry.adminEmail}</Field>
        <Field label="Reason" t={t}>{entry.reason || '—'}</Field>
      </dl>
    )
  }

  if (entry.eventType?.startsWith('recruiter_')) {
    return (
      <dl className={`grid gap-4 ${box}`}>
        <Field label="Recruiter activity" t={t}>{entry.recruiterDetails || entry.action}</Field>
        <Field label="Reason" t={t}>{entry.reason || '—'}</Field>
      </dl>
    )
  }

  return (
    <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${box}`}>
      <Field label="Previous plan" t={t}>{entry.previousPlan}</Field>
      <Field label="New plan" t={t}><strong>{entry.newPlan}</strong></Field>
      <Field label="Previous status" t={t}>{entry.previousStatus}</Field>
      <Field label="New status" t={t}><strong>{entry.newStatus}</strong></Field>
      <Field label="Reason" t={t} wide>{entry.reason || '—'}</Field>
    </dl>
  )
}

function EventRow({ item, t, showActor, onOpen, nested }) {
  const { e, cat, sens } = item
  return (
    <button
      className={`flex w-full items-start gap-3 py-3 pr-4 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500 ${nested ? 'pl-11' : 'pl-4'} ${t.hover}`}
      onClick={() => onOpen(e)}
      type="button"
    >
      <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${CATEGORIES[cat].dot}`} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{e.action}</span>
          <span className="text-sm">{e.userName}</span>
          {sens && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${t.flag}`}>Sensitive</span>}
        </span>
        <span className={`mt-0.5 block truncate text-xs ${t.muted}`}>{describeChange(e)}</span>
      </span>
      {showActor && <span className={`hidden max-w-[200px] truncate text-xs md:block ${t.muted}`}>{e.actor || fallbackActor}</span>}
      <time className={`shrink-0 pt-0.5 text-xs tabular-nums ${t.muted}`} dateTime={e.createdAt} title={formatDate(e.createdAt)}>
        {formatTime(e.createdAt)}
      </time>
    </button>
  )
}

function ClusterRow({ cluster, t, showActor, onOpen }) {
  const [open, setOpen] = useState(false)
  if (cluster.items.length === 1) {
    return <li><EventRow item={cluster.items[0]} onOpen={onOpen} showActor={showActor} t={t} /></li>
  }
  const { items } = cluster
  const first = items[0]
  const span = Math.abs(new Date(items[0].e.createdAt) - new Date(items.at(-1).e.createdAt))
  const actions = [...new Set(items.map((i) => i.e.action))]
  const title = actions.length <= 2 ? actions.join(' and ') : `${actions[0]} and ${actions.length - 1} other actions`
  return (
    <li>
      <button
        aria-expanded={open}
        className={`flex w-full items-start gap-3 py-3 pr-4 pl-4 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500 ${t.hover}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${CATEGORIES[first.cat].dot}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-sm">{first.e.userName}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${t.chipOff}`}>{items.length} events</span>
          </span>
          <span className={`mt-0.5 block text-xs ${t.muted}`}>{items.length} changes within {formatSpan(span)}. {open ? 'Hide' : 'Show'} each change.</span>
        </span>
        <time className={`shrink-0 pt-0.5 text-xs tabular-nums ${t.muted}`}>{formatTime(first.e.createdAt)}</time>
        <Icon className={`mt-0.5 size-4 shrink-0 transition-transform ${t.muted} ${open ? 'rotate-180' : ''}`} name="chevron" />
      </button>
      {open && (
        <ul className={`border-t ${t.line} ${t.sub} divide-y ${t.divide}`}>
          {items.map((item) => (
            <li key={item.e.id}><EventRow item={item} nested onOpen={onOpen} showActor={showActor} t={t} /></li>
          ))}
        </ul>
      )}
    </li>
  )
}

function DetailDrawer({ entry, onClose, t }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    closeRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  const cat = CATEGORIES[categoryOf(entry)]
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button aria-label="Close audit event details" className="absolute inset-0 bg-slate-950/45" onClick={onClose} tabIndex={-1} type="button" />
      <section
        aria-labelledby="audit-event-title"
        aria-modal="true"
        className={`relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l p-5 shadow-2xl md:p-6 ${t.panel} ${t.text}`}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className={`flex items-center gap-2 text-xs font-medium ${t.muted}`}>
              <span aria-hidden="true" className={`size-2 rounded-full ${cat.dot}`} />
              {cat.label}
            </p>
            <h2 className="mt-1 text-xl font-semibold" id="audit-event-title">{entry.action}</h2>
            <p className={`mt-1 text-sm ${t.muted}`}>{describeChange(entry)}</p>
          </div>
          <button aria-label="Close details" className={`rounded-lg p-2 ${t.muted} ${t.hover}`} onClick={onClose} ref={closeRef} type="button">
            <Icon className="size-5" name="close" />
          </button>
        </header>

        <dl className={`mt-6 grid grid-cols-1 gap-4 border-y py-4 sm:grid-cols-2 ${t.line}`}>
          <Field label="Done by" t={t}>{entry.actor || fallbackActor}</Field>
          <Field label="Subject" t={t}>{entry.userName}</Field>
          <Field label="When" t={t}>{formatDate(entry.createdAt)}</Field>
          <Field label="Event ID" t={t}><span className="font-mono text-xs">{entry.id}</span></Field>
        </dl>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold">What changed</h3>
          <ChangeDetails entry={entry} t={t} />
        </div>
      </section>
    </div>
  )
}

/* ---------- page ---------- */

function AuditLog({ entries = [], isDark }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedDay, setSelectedDay] = useState(null)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [selectedEntry, setSelectedEntry] = useState(null)

  // console.log('[AuditLog] Received entries:', entries.length);
  // console.log('[AuditLog] First entry:', entries[0]);

  const t = isDark
    ? {
      panel: 'border-[#263249] bg-[#10192d]', sub: 'bg-[#121e33]', line: 'border-[#263249]', divide: 'divide-[#263249]',
      hover: 'hover:bg-[#121e33]', text: 'text-slate-100', muted: 'text-[#91a9c9]', head: 'text-white',
      chipOn: 'border-sky-400 bg-sky-400 text-slate-900', chipOff: 'border-[#34445e] bg-transparent text-slate-200',
      chipHover: 'hover:bg-[#18243a]', bar: 'bg-[#34445e]', barOn: 'bg-sky-400', flag: 'bg-rose-400/15 text-rose-300',
      input: 'border-[#34445e] bg-[#10192d] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]',
    }
    : {
      panel: 'border-slate-200 bg-white', sub: 'bg-slate-50', line: 'border-slate-200', divide: 'divide-slate-100',
      hover: 'hover:bg-slate-50', text: 'text-slate-900', muted: 'text-slate-500', head: 'text-[#111827]',
      chipOn: 'border-[#172033] bg-[#172033] text-white', chipOff: 'border-slate-200 bg-transparent text-slate-700',
      chipHover: 'hover:bg-slate-50', bar: 'bg-slate-200', barOn: 'bg-[#172033]', flag: 'bg-rose-50 text-rose-700',
      input: 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200',
    }

  const items = useMemo(
    () =>
      entries
        .map((e) => ({
          e,
          cat: categoryOf(e),
          sens: isSensitive(e),
          day: dayKey(e.createdAt),
          hay: [e.actor || fallbackActor, e.action, e.userName, describeChange(e), e.reason].map((v) => String(v ?? '')).join(' ').toLowerCase(),
        }))
        .sort((a, b) => new Date(b.e.createdAt) - new Date(a.e.createdAt)),
    [entries],
  )

  const query = search.trim().toLowerCase()
  const searched = useMemo(() => (query ? items.filter((i) => i.hay.includes(query)) : items), [items, query])
  const categorized = useMemo(() => (category === 'all' ? searched : searched.filter((i) => i.cat === category)), [searched, category])
  const visibleAll = useMemo(() => (selectedDay ? categorized.filter((i) => i.day === selectedDay) : categorized), [categorized, selectedDay])
  const visible = visibleAll.slice(0, limit)
  const days = useMemo(() => buildDays(visible), [visible])

  const categoryCounts = useMemo(() => {
    const counts = {}
    searched.forEach((i) => { counts[i.cat] = (counts[i.cat] ?? 0) + 1 })
    return counts
  }, [searched])

  const actors = useMemo(() => new Set(entries.map((e) => e.actor || fallbackActor)), [entries])
  const showActor = actors.size > 1

  const stats = useMemo(() => {
    const sensitive = items.filter((i) => i.sens).length
    const latest = items[0]?.e.createdAt
    return [
      { label: 'Total events', value: items.length },
      { label: 'Sensitive actions', value: sensitive, hint: 'Refunds and admin access' },
      { label: actors.size === 1 ? 'Active admin' : 'Active admins', value: actors.size },
      { label: 'Last activity', value: latest ? `${dayKey(latest) === dayKey(new Date()) ? 'Today' : new Date(latest).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${formatTime(latest)}` : '—', small: true },
    ]
  }, [items, actors])

  const bars = useMemo(() => {
    const list = []
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      list.push({ key: dayKey(d), date: d, count: 0 })
    }
    categorized.forEach((i) => {
      const bar = list.find((b) => b.key === i.day)
      if (bar) bar.count += 1
    })
    return list
  }, [categorized])
  const maxBar = Math.max(1, ...bars.map((b) => b.count))

  const filtersActive = Boolean(query) || category !== 'all' || Boolean(selectedDay)
  const resetFilters = () => { setSearch(''); setCategory('all'); setSelectedDay(null); setLimit(PAGE_SIZE) }
  const closeDrawer = () => setSelectedEntry(null)
  const chip = (on) => `inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${on ? t.chipOn : `${t.chipOff} ${t.chipHover}`}`

  return (
    <div className={`mx-auto max-w-[1200px] ${t.text}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${t.head}`}>Audit log</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>Every important admin action: who did it, what changed, and when.</p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172033] px-4 text-sm font-semibold text-white transition hover:bg-[#26344e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!visibleAll.length}
          onClick={() => exportCsv(visibleAll.map((i) => i.e))}
          type="button"
        >
          <Icon name="download" />
          Export {filtersActive ? `${visibleAll.length} events` : 'CSV'}
        </button>
      </header>

      <section aria-label="Activity summary" className={`mb-5 grid gap-6 rounded-xl border p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] ${t.panel}`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className={`text-xs font-medium ${t.muted}`}>{s.label}</dt>
              <dd className={`mt-1 font-semibold tabular-nums ${s.small ? 'text-base leading-8' : 'text-[28px] leading-8'}`}>{s.value}</dd>
              {s.hint && <p className={`mt-0.5 text-xs ${t.muted}`}>{s.hint}</p>}
            </div>
          ))}
        </dl>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Activity, last 14 days</h2>
            <span className={`text-xs ${t.muted}`}>Select a day to filter</span>
          </div>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {bars.map((b) => {
              const on = selectedDay === b.key
              const label = `${b.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${b.count} ${b.count === 1 ? 'event' : 'events'}`
              return (
                <button
                  aria-label={label}
                  aria-pressed={on}
                  className="group flex h-full flex-1 items-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-default"
                  disabled={!b.count}
                  key={b.key}
                  onClick={() => { setSelectedDay(on ? null : b.key); setLimit(PAGE_SIZE) }}
                  title={label}
                  type="button"
                >
                  <span
                    className={`block w-full rounded-sm transition-colors ${on || (!selectedDay && b.count) ? t.barOn : t.bar} ${!on && selectedDay ? 'opacity-40' : ''}`}
                    style={{ height: `${b.count ? Math.max(10, (b.count / maxBar) * 100) : 4}%` }}
                  />
                </button>
              )
            })}
          </div>
          <div className={`mt-1.5 flex justify-between text-[11px] ${t.muted}`}>
            <span>{bars[0].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <section aria-label="Administrative audit events" className={`overflow-hidden rounded-xl border ${t.panel}`}>
        <div className={`space-y-3 border-b p-3 md:p-4 ${t.line}`}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full min-w-0 sm:max-w-[440px]">
              <span className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${t.muted}`}><Icon name="search" /></span>
              <input
                aria-label="Search audit events"
                className={`h-10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 ${t.input}`}
                onChange={(event) => { setSearch(event.target.value); setLimit(PAGE_SIZE) }}
                placeholder="Search admin, subject, action or details"
                type="search"
                value={search}
              />
            </label>
            <div className="ml-auto flex items-center gap-3">
              {selectedDay && (
                <button className={chip(true)} onClick={() => setSelectedDay(null)} type="button">
                  {dayLabel(`${selectedDay}T00:00:00`).replace(/^(Today|Yesterday), /, '')}
                  <Icon className="size-3" name="close" />
                </button>
              )}
              <span aria-live="polite" className={`text-xs tabular-nums ${t.muted}`}>
                {visibleAll.length} {visibleAll.length === 1 ? 'event' : 'events'}
              </span>
            </div>
          </div>

          <div aria-label="Filter by category" className="flex flex-wrap gap-2" role="group">
            <button aria-pressed={category === 'all'} className={chip(category === 'all')} onClick={() => { setCategory('all'); setLimit(PAGE_SIZE) }} type="button">
              All <span className="tabular-nums opacity-70">{searched.length}</span>
            </button>
            {Object.entries(CATEGORIES).map(([key, c]) => {
              const count = categoryCounts[key] ?? 0
              if (!count && category !== key) return null
              return (
                <button aria-pressed={category === key} className={chip(category === key)} key={key} onClick={() => { setCategory(key); setLimit(PAGE_SIZE) }} type="button">
                  <span aria-hidden="true" className={`size-2 rounded-full ${c.dot}`} />
                  {c.label} <span className="tabular-nums opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {days.map((day) => (
          <div key={day.key}>
            <h2 className={`sticky top-0 z-10 border-b px-4 py-2 text-xs font-semibold ${t.line} ${t.sub} ${t.muted}`}>{day.label}</h2>
            <ul className={`divide-y border-b last:border-0 ${t.divide} ${t.line}`}>
              {day.clusters.map((cluster) => (
                <ClusterRow cluster={cluster} key={cluster.items[0].e.id} onOpen={setSelectedEntry} showActor={showActor} t={t} />
              ))}
            </ul>
          </div>
        ))}

        {!visible.length && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium">{entries.length ? 'No events match these filters' : 'No audit events yet'}</p>
            <p className={`mt-1 text-sm ${t.muted}`}>
              {entries.length ? 'Try a different search or category.' : 'Admin actions will appear here as they happen.'}
            </p>
            {filtersActive && (
              <button className={`${chip(false)} ${t.chipHover} mt-4`} onClick={resetFilters} type="button">Clear filters</button>
            )}
          </div>
        )}

        {visibleAll.length > limit && (
          <div className={`flex items-center justify-between border-t px-4 py-3 ${t.line}`}>
            <span className={`text-xs tabular-nums ${t.muted}`}>Showing {limit} of {visibleAll.length}</span>
            <button className={`${chip(false)} ${t.chipHover}`} onClick={() => setLimit((n) => n + PAGE_SIZE)} type="button">Show more</button>
          </div>
        )}
      </section>

      {selectedEntry && <DetailDrawer entry={selectedEntry} onClose={closeDrawer} t={t} />}
    </div>
  )
}

export default AuditLog
