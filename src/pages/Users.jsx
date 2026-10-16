import { useEffect, useMemo, useState } from 'react'

const pageSize = 25
const plans = ['Monthly', 'Basic', 'Standard', 'None']
const statuses = ['Active', 'Inactive', 'Past due', 'Cancelled']
const STATUS_DOT = { Active: 'bg-emerald-500', Inactive: 'bg-slate-400', 'Past due': 'bg-amber-500', Cancelled: 'bg-rose-500' }

/* ---------- helpers ---------- */

function fieldClass(isDark) {
  return `h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? 'border-[#34445e] bg-[#0c1326] text-slate-100 focus:border-[#53657d] focus:ring-[#53657d]'
      : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'
  }`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(value) {
  if (!value) return null
  const end = new Date(`${value}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((end - today) / 86400000)
}

const displayName = (user) => `${user.firstName} ${user.lastName}`
const initialsOf = (user) => `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'

/* [light, dark] class pairs */
const TONES = {
  sky: ['bg-sky-100 text-sky-800', 'bg-sky-400/15 text-sky-200'],
  violet: ['bg-violet-100 text-violet-800', 'bg-violet-400/15 text-violet-200'],
  green: ['bg-emerald-100 text-emerald-800', 'bg-emerald-400/15 text-emerald-200'],
  amber: ['bg-amber-100 text-amber-800', 'bg-amber-400/15 text-amber-200'],
  rose: ['bg-rose-100 text-rose-800', 'bg-rose-400/15 text-rose-200'],
  indigo: ['bg-indigo-100 text-indigo-800', 'bg-indigo-400/15 text-indigo-200'],
}
const AVATAR_TONES = Object.keys(TONES)

function avatarTone(seed = '') {
  let hash = 0
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function statusStyle(status, isDark) {
  const styles = {
    Active: isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    Inactive: isDark ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-600',
    'Past due': isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700',
    Cancelled: isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-700',
  }
  return styles[status] ?? styles.Inactive
}

function planStyle(plan, isDark) {
  const styles = {
    Monthly: isDark ? 'bg-indigo-400/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700',
    Basic: isDark ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-50 text-sky-700',
    Standard: isDark ? 'bg-violet-400/10 text-violet-300' : 'bg-violet-50 text-violet-700',
    None: isDark ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-600',
  }
  return styles[plan] ?? styles.None
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

/* ---------- small pieces ---------- */

function Icon({ name, className = 'size-4' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    check: <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></>,
    pause: <><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>,
    alert: <><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16h.01" /></>,
    cancel: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4Z" />,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="m19 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    swap: <><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></>,
  }
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function Avatar({ user, isDark, size = 'size-9', text = 'text-xs' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex ${size} shrink-0 items-center justify-center rounded-full ${text} font-semibold ${TONES[avatarTone(user.id ?? user.email)][isDark ? 1 : 0]}`}
    >
      {initialsOf(user)}
    </span>
  )
}

function DetailSection({ title, icon, isDark, children }) {
  return (
    <section className={`rounded-xl border p-4 ${isDark ? 'border-[#263249] bg-[#121e33]' : 'border-slate-200 bg-white'}`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className={isDark ? 'text-[#91a9c9]' : 'text-slate-500'}><Icon name={icon} /></span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailValue({ label, value, isDark }) {
  return (
    <div className="min-w-0">
      <dt className={`text-xs font-medium ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>{label}</dt>
      <dd className="mt-1 break-words text-sm">{value || '—'}</dd>
    </div>
  )
}

function UserDetailsPanel({ user, isDark, onClose }) {
  useEscape(onClose)
  const name = displayName(user)
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const row = `flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 ${isDark ? 'bg-[#0c1326]' : 'bg-slate-50'}`

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button aria-label="Close user details" className="absolute inset-0 bg-slate-950/40" onClick={onClose} tabIndex={-1} type="button" />
      <aside
        aria-label={`${name} details`}
        aria-modal="true"
        className={`relative flex h-full w-full max-w-[660px] flex-col shadow-2xl ${isDark ? 'bg-[#0c1326] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}
        role="dialog"
      >
        <header className={`flex items-center justify-between gap-3 border-b px-5 py-4 md:px-7 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar isDark={isDark} size="size-12" text="text-sm" user={user} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{name}</h2>
              <p className={`truncate text-xs ${muted}`}>{user.email}</p>
              <div className="mt-1.5 flex gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${planStyle(user.plan, isDark)}`}>{user.plan === 'None' ? 'No plan' : user.plan}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(user.status, isDark)}`}>{user.status}</span>
              </div>
            </div>
          </div>
          <button aria-label="Close details" className={`rounded-lg p-2 ${muted} ${isDark ? 'hover:bg-[#18243a]' : 'hover:bg-slate-100'}`} onClick={onClose} type="button">
            <Icon className="size-5" name="close" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 md:p-7">
          <DetailSection icon="calendar" isDark={isDark} title="Account information">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DetailValue isDark={isDark} label="Date joined" value={formatDate(user.dateJoined)} />
              <DetailValue isDark={isDark} label="Plan" value={user.plan} />
              <DetailValue isDark={isDark} label="Status" value={user.status} />
              <DetailValue isDark={isDark} label="Plan end date" value={formatDate(user.planEndDate)} />
              <DetailValue isDark={isDark} label="Last payment" value={user.lastPayment?.amount ? `₹${user.lastPayment.amount.toLocaleString('en-IN')} · ${formatDate(user.lastPayment.date)}` : 'No payment recorded'} />
            </dl>
          </DetailSection>

          <DetailSection icon="users" isDark={isDark} title="Contact and profile">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailValue isDark={isDark} label="Email / login" value={user.email} />
              <DetailValue isDark={isDark} label="Mobile" value={user.mobile} />
              <DetailValue isDark={isDark} label="Area of interest" value={user.areaOfInterest} />
              <DetailValue isDark={isDark} label="Headline" value={user.headline} />
              <DetailValue isDark={isDark} label="Location" value={user.location} />
            </dl>
          </DetailSection>

          <DetailSection icon="file" isDark={isDark} title={`Uploaded resumes (${user.resumes.length})`}>
            <div className="space-y-2">
              {user.resumes.map((resume) => (
                <div className={row} key={resume.fileName}>
                  <div>
                    <p className="text-sm font-medium">{resume.fileName}</p>
                    <p className={`mt-1 text-xs ${muted}`}>Uploaded {formatDate(resume.uploadedOn)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resume.score >= 80 ? (isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700') : (isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700')}`}>
                    Score {resume.score}/100
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection icon="briefcase" isDark={isDark} title={`Job applications (${user.jobApplications.length})`}>
            <div className="space-y-2">
              {user.jobApplications.map((application) => (
                <div className={row} key={`${application.title}-${application.company}`}>
                  <div>
                    <p className="text-sm font-medium">{application.title}</p>
                    <p className={`mt-1 text-xs ${muted}`}>{application.company} · {formatDate(application.appliedOn)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${isDark ? 'bg-[#202d43] text-[#b8c9df]' : 'bg-white text-slate-600'}`}>{application.status}</span>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection icon="bookmark" isDark={isDark} title={`Saved jobs (${user.savedJobs.length})`}>
            <ul className="space-y-2">
              {user.savedJobs.map((job) => (
                <li className={`rounded-lg px-3 py-2.5 text-sm ${isDark ? 'bg-[#0c1326]' : 'bg-slate-50'}`} key={`${job.title}-${job.company}`}>
                  <span className="font-medium">{job.title}</span>
                  <span className={`ml-2 text-xs ${muted}`}>{job.company}</span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection icon="pin" isDark={isDark} title="Job preferences">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailValue isDark={isDark} label="Target roles" value={user.jobPreferences.roles.join(', ')} />
              <DetailValue isDark={isDark} label="Preferred locations" value={user.jobPreferences.locations.join(', ')} />
              <DetailValue isDark={isDark} label="Work type" value={user.jobPreferences.workType} />
              <DetailValue isDark={isDark} label="Salary range" value={user.jobPreferences.salaryRange} />
            </dl>
          </DetailSection>

          <DetailSection icon="sparkles" isDark={isDark} title="AI usage, last 30 days">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DetailValue isDark={isDark} label="Total actions" value={user.aiUsage.total} />
              <DetailValue isDark={isDark} label="Resume reviews" value={user.aiUsage.resumeReviews} />
              <DetailValue isDark={isDark} label="Cover letters" value={user.aiUsage.coverLetters} />
              <DetailValue isDark={isDark} label="Mock interviews" value={user.aiUsage.interviewSessions} />
              <DetailValue isDark={isDark} label="AI chats" value={user.aiUsage.chatMessages} />
            </dl>
          </DetailSection>
        </div>
      </aside>
    </div>
  )
}

function UserEditModal({ user, users, isDark, onClose, onSave }) {
  useEscape(onClose)
  const [emailError, setEmailError] = useState('')
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    areaOfInterest: user.areaOfInterest,
    headline: user.headline,
    location: user.location,
  })

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (event.target.name === 'email') setEmailError('')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close edit profile form" className="absolute inset-0 bg-slate-950/45" onClick={onClose} tabIndex={-1} type="button" />
      <section aria-labelledby="edit-user-title" aria-modal="true" className={`relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border p-5 shadow-2xl md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} role="dialog">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar isDark={isDark} user={user} />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold" id="edit-user-title">Edit profile</h2>
              <p className={`text-xs ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>Changing the email also changes the user's login email.</p>
            </div>
          </div>
          <button aria-label="Close" className={`rounded-lg p-2 ${isDark ? 'text-[#91a9c9] hover:bg-[#18243a]' : 'text-slate-500 hover:bg-slate-100'}`} onClick={onClose} type="button"><Icon name="close" /></button>
        </header>
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            const normalizedEmail = form.email.trim().toLowerCase()
            const exists = users.some((u) => u.id !== user.id && u.email.toLowerCase() === normalizedEmail)
            if (exists) {
              setEmailError('Another account already uses this email address.')
              return
            }
            onSave({ ...user, ...form })
          }}
        >
          {[
            ['firstName', 'First name', 'text'],
            ['lastName', 'Last name', 'text'],
            ['email', 'Email / login email', 'email'],
            ['mobile', 'Mobile', 'tel'],
            ['areaOfInterest', 'Area of interest', 'text'],
            ['headline', 'Headline', 'text'],
            ['location', 'Location', 'text'],
          ].map(([name, label, type]) => (
            <label className={`block text-xs font-medium ${isDark ? 'text-[#b8c9df]' : 'text-slate-600'} ${name === 'headline' ? 'sm:col-span-2' : ''}`} htmlFor={`edit-${name}`} key={name}>
              {label}
              <input className={`${fieldClass(isDark)} mt-1.5`} id={`edit-${name}`} name={name} onChange={updateField} required type={type} value={form[name]} />
              {name === 'email' && emailError && <span className="mt-1 block text-xs text-rose-500" role="alert">{emailError}</span>}
            </label>
          ))}
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button className={`rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-[#34445e] text-slate-200 hover:bg-[#18243a]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-[#172033] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26344e]" type="submit">Save profile</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ChangePlanModal({ user, isDark, onClose, onSave }) {
  useEscape(onClose)
  const [plan, setPlan] = useState(user.plan)
  const [status, setStatus] = useState(user.status)
  const [reason, setReason] = useState('')
  const label = `block text-xs font-medium ${isDark ? 'text-[#b8c9df]' : 'text-slate-600'}`
  const unchanged = plan === user.plan && status === user.status

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close change plan form" className="absolute inset-0 bg-slate-950/45" onClick={onClose} tabIndex={-1} type="button" />
      <section aria-labelledby="change-plan-title" aria-modal="true" className={`relative w-full max-w-[460px] rounded-2xl border p-5 shadow-2xl md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} role="dialog">
        <div className="flex items-center gap-3">
          <Avatar isDark={isDark} user={user} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold" id="change-plan-title">Change plan</h2>
            <p className={`truncate text-sm ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>{displayName(user)}, currently {user.plan === 'None' ? 'no plan' : user.plan} ({user.status})</p>
          </div>
        </div>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({ plan, status, reason: reason.trim() })
          }}
        >
          <label className={label}>
            Plan
            <select className={`${fieldClass(isDark)} mt-1.5`} onChange={(event) => setPlan(event.target.value)} value={plan}>
              {plans.map((option) => <option key={option} value={option}>{option === 'None' ? 'No plan' : option}</option>)}
            </select>
          </label>
          <label className={label}>
            Status
            <select className={`${fieldClass(isDark)} mt-1.5`} onChange={(event) => setStatus(event.target.value)} value={status}>
              {statuses.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className={label}>
            Reason <span className="text-rose-500">*</span>
            <textarea className={`mt-1.5 min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100 focus:border-[#53657d] focus:ring-[#53657d]' : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'}`} onChange={(event) => setReason(event.target.value)} placeholder="Why is this change needed?" required value={reason} />
            <span className={`mt-1 block font-normal ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>Recorded in the audit log.</span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button className={`rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-[#34445e] text-slate-200 hover:bg-[#18243a]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-[#172033] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26344e] disabled:cursor-not-allowed disabled:opacity-50" disabled={unchanged} type="submit">Save changes</button>
          </div>
        </form>
      </section>
    </div>
  )
}

/* ---------- page ---------- */

function SortHeader({ label, sortKey, sort, onSort, align = 'left', t }) {
  const active = sort.key === sortKey
  return (
    <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-4 py-3 font-semibold ${align === 'center' ? 'text-center' : ''}`} scope="col">
      <button className={`inline-flex items-center gap-1 rounded transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${active ? t.head : ''}`} onClick={() => onSort(sortKey)} type="button">
        {label}
        <span aria-hidden="true" className={active ? '' : 'opacity-30'}>{active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}

function Users({ users, onUsersChange, onPlanChange, onProfileEdit, isDark }) {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All plans')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [panel, setPanel] = useState(null)

  const t = isDark
    ? { panel: 'border-[#263249] bg-[#10192d]', line: 'border-[#263249]', gap: 'bg-[#263249]', cell: 'bg-[#10192d] hover:bg-[#141f36]', head: 'text-white', muted: 'text-[#91a9c9]', hover: 'hover:bg-[#121e33]', thead: 'bg-[#121e33]', divide: 'divide-[#263249]', btn: 'border-[#34445e] hover:bg-[#18243a]', icon: 'text-[#91a9c9] hover:bg-[#202d43] hover:text-white', select: 'border-[#34445e] bg-[#10192d] text-slate-100' }
    : { panel: 'border-slate-200 bg-white', line: 'border-slate-200', gap: 'bg-slate-200', cell: 'bg-white hover:bg-slate-50', head: 'text-slate-900', muted: 'text-slate-500', hover: 'hover:bg-slate-50/70', thead: 'bg-slate-50', divide: 'divide-slate-100', btn: 'border-slate-200 hover:bg-slate-50', icon: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900', select: 'border-slate-200 bg-white text-slate-800' }

  const counts = useMemo(() => {
    const result = Object.fromEntries(statuses.map((s) => [s, 0]))
    users.forEach((u) => { if (u.status in result) result[u.status] += 1 })
    return result
  }, [users])
  const total = users.length
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = users.filter((user) => {
      const matches = !query || displayName(user).toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.mobile.toLowerCase().includes(query)
      return matches && (planFilter === 'All plans' || user.plan === planFilter) && (statusFilter === 'All statuses' || user.status === statusFilter)
    })
    if (!sort.key) return list
    const dir = sort.dir === 'asc' ? 1 : -1
    const value = { name: (u) => displayName(u).toLowerCase(), ai: (u) => u.aiUsage.total, joined: (u) => u.dateJoined ?? '' }[sort.key]
    return [...list].sort((a, b) => (value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0))
  }, [users, search, planFilter, statusFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const startResult = filteredUsers.length ? (currentPage - 1) * pageSize + 1 : 0
  const endResult = Math.min(currentPage * pageSize, filteredUsers.length)
  const filtersActive = Boolean(search.trim()) || planFilter !== 'All plans' || statusFilter !== 'All statuses'

  function toggleSort(key) {
    setSort((current) => current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' })
  }
  function pickStatus(status) {
    setStatusFilter((current) => (current === status ? 'All statuses' : status))
    setPage(1)
  }
  function resetFilters() {
    setSearch(''); setPlanFilter('All plans'); setStatusFilter('All statuses'); setPage(1)
  }

  function exportCsv() {
    const headers = ['Name', 'Email', 'Mobile', 'Area of interest', 'Plan', 'Status', 'Plan end date', 'AI use in last 30 days', 'Date joined']
    const rows = filteredUsers.map((u) => [displayName(u), u.email, u.mobile, u.areaOfInterest, u.plan, u.status, u.planEndDate, u.aiUsage.total, u.dateJoined])
    const csvCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aifagen-users.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const cellFocus = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500'
  const iconBtn = `rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 ${t.icon}`

  return (
    <div className={`mx-auto max-w-[1600px] ${isDark ? 'text-slate-100' : 'text-[#111827]'}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Users</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>Manage user accounts, plans, activity, and profile details.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172033] px-4 text-sm font-semibold text-white transition hover:bg-[#26344e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={!filteredUsers.length} onClick={exportCsv} type="button">
          <Icon name="download" />
          Export {filtersActive ? `${filteredUsers.length} users` : 'CSV'}
        </button>
      </header>

      <section aria-label="Users overview" className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total users', value: total, caption: 'All accounts', icon: 'users', status: 'All statuses', tone: 'text-sky-600 bg-sky-500/10' },
          { label: 'Active', value: counts.Active, caption: `${pct(counts.Active)}% of users`, icon: 'check', status: 'Active', tone: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Inactive', value: counts.Inactive, caption: `${pct(counts.Inactive)}% of users`, icon: 'pause', status: 'Inactive', tone: 'text-slate-500 bg-slate-500/10' },
          { label: 'Past due', value: counts['Past due'], caption: `${pct(counts['Past due'])}% of users`, icon: 'alert', status: 'Past due', tone: 'text-amber-600 bg-amber-500/10' },
          { label: 'Cancelled', value: counts.Cancelled, caption: `${pct(counts.Cancelled)}% of users`, icon: 'cancel', status: 'Cancelled', tone: 'text-rose-600 bg-rose-500/10' },
        ].map((card) => {
          const selected = statusFilter === card.status
          return (
            <button
              aria-pressed={selected}
              className={`group rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-5 ${t.panel} ${t.cell} ${cellFocus} ${selected ? (isDark ? 'border-sky-400/50 shadow-md' : 'border-sky-300 shadow-md') : ''}`}
              key={card.status}
              onClick={() => {
                if (card.status === 'All statuses') {
                  setStatusFilter('All statuses')
                  setPage(1)
                } else {
                  pickStatus(card.status)
                }
              }}
              type="button"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`text-xs font-medium ${t.muted}`}>{card.label}</span>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${card.tone}`}>
                  <Icon className="size-[18px]" name={card.icon} />
                </span>
              </span>
              <span className={`mt-2 block text-[28px] leading-9 font-bold tracking-tight tabular-nums ${t.head}`}>
                {card.value.toLocaleString('en-IN')}
              </span>
              <span className={`mt-1 block text-xs ${t.muted}`}>{card.caption}</span>
            </button>
          )
        })}
      </section>

      <section aria-label="Users list" className={`overflow-hidden rounded-xl border ${t.panel}`}>
        <div className={`flex flex-wrap items-center gap-2 border-b p-3 md:p-4 ${t.line}`}>
          <label className="relative min-w-[220px] flex-1 md:max-w-[340px]">
            <span className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${t.muted}`}><Icon name="search" /></span>
            <input
              aria-label="Search by name, email or mobile"
              className={`h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-2 ${isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]' : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'}`}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Search name, email or mobile"
              type="search"
              value={search}
            />
          </label>
          <select aria-label="Filter by plan" className={`h-10 rounded-lg border px-3 text-sm outline-none ${t.select}`} onChange={(event) => { setPlanFilter(event.target.value); setPage(1) }} value={planFilter}>
            <option>All plans</option>
            {plans.map((plan) => <option key={plan} value={plan}>{plan === 'None' ? 'No plan' : plan}</option>)}
          </select>
          <select aria-label="Filter by status" className={`h-10 rounded-lg border px-3 text-sm outline-none ${t.select}`} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} value={statusFilter}>
            <option>All statuses</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          {filtersActive && (
            <button className={`h-10 rounded-lg px-3 text-xs font-semibold ${t.muted} ${t.hover}`} onClick={resetFilters} type="button">Clear filters</button>
          )}
          <span aria-live="polite" className={`ml-auto px-2 text-xs tabular-nums ${t.muted}`}>{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className={t.thead}>
              <tr className={`border-b text-xs ${t.line} ${t.muted}`}>
                <SortHeader label="User" onSort={toggleSort} sort={sort} sortKey="name" t={t} />
                <th className="px-4 py-3 font-semibold" scope="col">Plan</th>
                <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                <th className="px-4 py-3 font-semibold" scope="col">Area of interest</th>
                <SortHeader align="center" label="AI use (30d)" onSort={toggleSort} sort={sort} sortKey="ai" t={t} />
                <th className="px-4 py-3 font-semibold" scope="col">Plan ends</th>
                <SortHeader label="Joined" onSort={toggleSort} sort={sort} sortKey="joined" t={t} />
                <th className="px-4 py-3 font-semibold" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t.divide}`}>
              {pageUsers.map((user) => {
                const left = user.plan !== 'None' ? daysUntil(user.planEndDate) : null
                const ending = left !== null && left >= 0 && left <= 7
                return (
                  <tr
                    aria-label={`View details for ${displayName(user)}`}
                    className={`cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500 ${t.hover}`}
                    key={user.id}
                    onClick={() => setPanel({ mode: 'view', user })}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        setPanel({ mode: 'view', user })
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar isDark={isDark} user={user} />
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{displayName(user)}</span>
                          <span className={`mt-0.5 block truncate text-xs ${t.muted}`}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${planStyle(user.plan, isDark)}`}>{user.plan === 'None' ? 'No plan' : user.plan}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(user.status, isDark)}`}>
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_DOT[user.status] ?? STATUS_DOT.Inactive}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${t.muted}`}>{user.areaOfInterest || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs tabular-nums">{user.aiUsage.total}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <span className={ending ? (isDark ? 'font-medium text-amber-300' : 'font-medium text-amber-700') : t.muted}>{formatDate(user.planEndDate)}</span>
                      {ending && <span className={`block text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{left === 0 ? 'Ends today' : `${left} ${left === 1 ? 'day' : 'days'} left`}</span>}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-xs ${t.muted}`}>{formatDate(user.dateJoined)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button aria-label={`Edit profile for ${displayName(user)}`} className={iconBtn} onClick={(event) => { event.stopPropagation(); setPanel({ mode: 'edit', user }) }} title="Edit profile" type="button">
                          <Icon name="edit" />
                        </button>
                        <button aria-label={`Change plan for ${displayName(user)}`} className={iconBtn} onClick={(event) => { event.stopPropagation(); setPanel({ mode: 'plan', user }) }} title="Change plan" type="button">
                          <Icon name="swap" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!pageUsers.length && (
                <tr>
                  <td className="px-4 py-14 text-center" colSpan="8">
                    <p className="text-sm font-medium">No users match these filters</p>
                    <p className={`mt-1 text-sm ${t.muted}`}>Try a different search, plan or status.</p>
                    {filtersActive && <button className={`mt-4 rounded-lg border px-3 py-2 text-xs font-medium ${t.btn}`} onClick={resetFilters} type="button">Clear filters</button>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${t.line}`}>
          <p className={`text-xs tabular-nums ${t.muted}`}>Showing {startResult}–{endResult} of {filteredUsers.length}</p>
          <div className="flex items-center gap-2">
            <button className={`rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${t.btn}`} disabled={currentPage <= 1} onClick={() => setPage((c) => Math.max(1, c - 1))} type="button">Previous</button>
            <span className={`min-w-20 text-center text-xs tabular-nums ${t.muted}`}>Page {currentPage} of {pageCount}</span>
            <button className={`rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${t.btn}`} disabled={currentPage >= pageCount} onClick={() => setPage((c) => Math.min(pageCount, c + 1))} type="button">Next</button>
          </div>
        </footer>
      </section>

      {panel?.mode === 'view' && <UserDetailsPanel isDark={isDark} onClose={() => setPanel(null)} user={panel.user} />}
      {panel?.mode === 'edit' && (
        <UserEditModal
          isDark={isDark}
          key={panel.user.id}
          onClose={() => setPanel(null)}
          onSave={(updatedUser) => {
            onProfileEdit(panel.user, updatedUser)
            onUsersChange((current) => current.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
            setPanel(null)
          }}
          user={panel.user}
          users={users}
        />
      )}
      {panel?.mode === 'plan' && (
        <ChangePlanModal
          isDark={isDark}
          key={panel.user.id}
          onClose={() => setPanel(null)}
          onSave={(change) => {
            onPlanChange(panel.user, change)
            setPanel(null)
          }}
          user={panel.user}
        />
      )}
    </div>
  )
}

export default Users
