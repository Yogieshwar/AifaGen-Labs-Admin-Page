import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const dailyApplicationsPerCandidate = 50
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const numberFormat = new Intl.NumberFormat('en-US')
const tabs = ['Overview', 'Candidates', 'Attendance', 'Activity']
const presenceFilters = ['All', 'Online', 'Away', 'Offline']
const emptyForm = { name: '', email: '', password: '', phone: '', title: 'Recruiter', location: '', avatarUrl: '' }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isoDateFromTime(timestamp) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp)
  const part = (type) => parts.find((entry) => entry.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function formatDateTime(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatRelativeTime(value, now) {
  if (!value) return '—'
  const elapsedMinutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m ago`
  return formatDateTime(value)
}

function candidateName(candidate) {
  return `${candidate.firstName} ${candidate.lastName}`
}

function presenceOf(recruiter) {
  return recruiter.presence ?? (recruiter.isOnline ? 'Online' : 'Offline')
}

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
}

function hashString(value) {
  let hash = 0
  for (const character of String(value)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

/* Crops to a square and shrinks to 160px so the stored photo stays small. */
function resizeImageFile(file, size = 160) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file (JPG or PNG).'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Use an image under 5 MB.'))
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const side = Math.min(image.width, image.height)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d').drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be read.'))
    }
    image.src = url
  })
}

const iconPaths = {
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m10.85 12.15 8.3-8.3M15 8l3 3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  left: <><path d="m15 18-6-6 6-6" /></>,
  right: <><path d="m9 18 6-6-6-6" /></>,
}

function Icon({ name, className = 'size-4' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

const avatarPalettes = [
  { light: 'bg-[#f3e3da] text-[#8f452d]', dark: 'bg-[#3a2a22] text-[#e0a087]' },
  { light: 'bg-[#dcefe8] text-[#1f6b57]', dark: 'bg-[#1d3a33] text-[#7fd1b8]' },
  { light: 'bg-[#dfe7f5] text-[#2f4e8a]', dark: 'bg-[#1f2c47] text-[#9db8ee]' },
  { light: 'bg-[#efe3f3] text-[#6d3a86]', dark: 'bg-[#32223b] text-[#cfa3e3]' },
  { light: 'bg-[#f5ecd2] text-[#7a5a12]', dark: 'bg-[#3a3118] text-[#e3c978]' },
]

/* Photo if the recruiter has one, otherwise their initials on a stable color. */
function Avatar({ recruiter, size = 'md', showPresence = true, isDark, ringClass }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const sizes = {
    sm: { box: 'size-10 text-sm', dot: 'size-3' },
    md: { box: 'size-12 text-base', dot: 'size-3.5' },
    lg: { box: 'size-16 text-xl', dot: 'size-4' },
  }
  const { box, dot } = sizes[size]
  const palette = avatarPalettes[hashString(recruiter.id ?? recruiter.name) % avatarPalettes.length]
  const presence = presenceOf(recruiter)
  const showImage = Boolean(recruiter.avatarUrl) && failedUrl !== recruiter.avatarUrl
  const presenceColor = presence === 'Online' ? 'bg-emerald-500' : presence === 'Away' ? 'bg-amber-500' : 'bg-stone-400'

  return (
    <span className="relative inline-flex shrink-0">
      {showImage ? (
        <img
          alt=""
          className={`${box} rounded-full object-cover`}
          onError={() => setFailedUrl(recruiter.avatarUrl)}
          src={recruiter.avatarUrl}
        />
      ) : (
        <span aria-hidden="true" className={`${box} grid place-items-center rounded-full font-semibold ${isDark ? palette.dark : palette.light}`}>
          {initialsOf(recruiter.name)}
        </span>
      )}
      {showPresence && (
        <span
          aria-hidden="true"
          className={`absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ${dot} ${presenceColor} ${ringClass ?? (isDark ? 'ring-[#10192d]' : 'ring-white')}`}
        />
      )}
    </span>
  )
}

function ProgressBar({ value, isDark, label }) {
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-[#45463f]' : 'bg-[#e5e1d8]'}`}
      role="progressbar"
    >
      <div className={`h-full rounded-full ${value >= 100 ? 'bg-emerald-600' : 'bg-[#a94f32]'}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function Stat({ label, value, hint, muted }) {
  return (
    <div>
      <dt className={`text-xs font-medium ${muted}`}>{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className={`mt-0.5 text-xs ${muted}`}>{hint}</p>}
    </div>
  )
}

function StatusPill({ presence, isDark }) {
  const styles = {
    Online: isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    Away: isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700',
    Offline: isDark ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-600',
  }
  const dot = presence === 'Online' ? 'bg-emerald-500' : presence === 'Away' ? 'bg-amber-500' : 'bg-stone-400'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[presence] ?? styles.Offline}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} />
      {presence}
    </span>
  )
}

/* Secondary account actions live behind one menu so the header stays calm. */
function ActionMenu({ label, items, isDark }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    wrapperRef.current?.querySelector('[role="menuitem"]')?.focus()

    function handlePointer(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      wrapperRef.current?.querySelector('button')?.focus()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleMenuKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const entries = [...wrapperRef.current.querySelectorAll('[role="menuitem"]')]
    const current = entries.indexOf(document.activeElement)
    const next = event.key === 'ArrowDown' ? (current + 1) % entries.length : (current - 1 + entries.length) % entries.length
    entries[next]?.focus()
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={`recruiter-glass-control inline-flex size-9 items-center justify-center rounded-lg border ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Icon name="more" />
      </button>
      {open && (
        <div
          className={`absolute right-0 z-20 mt-2 w-52 rounded-xl border p-1 shadow-lg ${isDark ? 'border-[#3b3c36] bg-[#242521]' : 'border-[#dedbd2] bg-[#fffefa]'}`}
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          {items.map((item) => (
            <button
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#a94f32] ${isDark ? 'hover:bg-[#30312c]' : 'hover:bg-[#f3efe6]'}`}
              key={item.label}
              onClick={() => { setOpen(false); item.onSelect() }}
              role="menuitem"
              type="button"
            >
              <Icon className="size-4 opacity-70" name={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Recruiter details: one panel with header, tabs and content          */
/* ------------------------------------------------------------------ */

function RecruiterDetails({
  recruiter,
  candidates,
  isDark,
  currentTime,
  activeTab,
  onTabChange,
  filteredRecruiters,
  onNavigate,
  onExport,
  onEdit,
  onAccountAction,
  assignmentCandidateId,
  onAssignmentCandidateChange,
  onRequestAssignment,
  assignmentsByCandidate,
  pendingReassignment,
  onConfirmReassignment,
  onCancelReassignment,
  assignmentHistory,
}) {
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const line = isDark ? 'border-[#263249]' : 'border-slate-200'
  const inner = isDark ? 'border-[#3b3c36] bg-[#1d1e1b]' : 'border-[#dedbd2] bg-[#f8f6f0]'
  const iconButton = `recruiter-glass-control inline-flex size-9 items-center justify-center rounded-lg border disabled:opacity-40 ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`
  const secondaryButton = `recruiter-glass-control inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`

  const presence = presenceOf(recruiter)
  const assignedCandidates = recruiter.assignedCandidateIds
    .map((candidateId) => candidates.find((candidate) => candidate.id === candidateId))
    .filter(Boolean)
  const applicationStats = recruiter.applicationStatsByCandidate ?? {}
  const today = isoDateFromTime(currentTime)

  const monthParts = (recruiter.attendanceMonth ?? today.slice(0, 7)).split('-')
  const year = Number(monthParts[0])
  const monthIndex = Number(monthParts[1]) - 1
  const daysPerMonth = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const daysInMonth = daysPerMonth[monthIndex] ?? 30
  const weekdayOffsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const adjustedYear = monthIndex < 2 ? year - 1 : year
  const firstWeekday = (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + weekdayOffsets[monthIndex]) % 7
  const attendanceDates = new Set(recruiter.attendanceLog ?? [])
  const daysPresent = attendanceDates.size || recruiter.attendanceDays || 0

  const totalToday = assignedCandidates.reduce((total, candidate) => total + (applicationStats[candidate.id]?.today ?? 0), 0)
  const totalMonth = assignedCandidates.reduce((total, candidate) => total + (applicationStats[candidate.id]?.month ?? 0), 0)
  const qualityTotals = assignedCandidates.reduce((total, candidate) => {
    const stats = applicationStats[candidate.id] ?? {}
    const reported = typeof stats.replies === 'number'
    return {
      applications: total.applications + (reported ? (stats.month ?? 0) : 0),
      reportedCandidates: total.reportedCandidates + (reported ? 1 : 0),
      interviewInvites: total.interviewInvites + (reported ? (stats.interviewInvites ?? 0) : 0),
      callbacks: total.callbacks + (reported ? (stats.callbacks ?? 0) : 0),
      replies: total.replies + (reported ? stats.replies : 0),
      rejections: total.rejections + (reported ? (stats.rejections ?? 0) : 0),
      invalidOrDuplicate: total.invalidOrDuplicate + (reported ? (stats.invalidOrDuplicate ?? 0) : 0),
    }
  }, { applications: 0, reportedCandidates: 0, interviewInvites: 0, callbacks: 0, replies: 0, rejections: 0, invalidOrDuplicate: 0 })
  const hasQuality = qualityTotals.reportedCandidates > 0
  const responseRate = qualityTotals.applications ? Math.round((qualityTotals.replies / qualityTotals.applications) * 100) : null
  const dailyGoal = assignedCandidates.length * dailyApplicationsPerCandidate
  const dailyProgress = dailyGoal ? Math.min(100, Math.round((totalToday / dailyGoal) * 100)) : 0
  const averageSessionMinutes = recruiter.avgSessionMinutes ?? 0

  const recruiterIndex = filteredRecruiters.findIndex((entry) => entry.id === recruiter.id)
  const recruiterHistory = assignmentHistory
    .filter((entry) => entry.fromRecruiterId === recruiter.id || entry.toRecruiterId === recruiter.id)
    .slice(0, 8)
  const qualityValue = (value) => (hasQuality ? numberFormat.format(value) : '—')

  function handleTabKeyDown(event, index) {
    let nextIndex = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    onTabChange(tabs[nextIndex])
    document.getElementById(`recruiter-tab-${tabs[nextIndex].toLowerCase()}`)?.focus()
  }

  return (
    <div className={`recruiter-panel rounded-xl border shadow-sm ${surface}`}>
      {/* Mobile: quick switcher, since the team list sits far above on small screens */}
      <label className={`flex items-center gap-3 border-b p-4 text-xs font-medium md:hidden ${line} ${muted}`} htmlFor="mobile-recruiter-switch">
        Switch recruiter
        <select className={`h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`} id="mobile-recruiter-switch" onChange={(event) => onNavigate(event.target.value)} value={recruiter.id}>
          {filteredRecruiters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </label>

      {/* Profile header: identity on the left, three actions on the right */}
      <header className="flex flex-wrap items-start gap-4 p-4 md:p-5">
        <Avatar isDark={isDark} recruiter={recruiter} size="lg" />
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{recruiter.name}</h2>
            <StatusPill isDark={isDark} presence={presence} />
          </div>
          <p className={`mt-0.5 text-sm ${muted}`}>{recruiter.title}{recruiter.location ? ` · ${recruiter.location}` : ''}</p>
          <p className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${muted}`}>
            <a className="inline-flex items-center gap-1.5 break-all hover:underline" href={`mailto:${recruiter.email}`}>
              <Icon className="size-3.5 shrink-0" name="mail" />{recruiter.email}
            </a>
            {recruiter.phone && (
              <a className="inline-flex items-center gap-1.5 hover:underline" href={`tel:${recruiter.phone}`}>
                <Icon className="size-3.5 shrink-0" name="phone" />{recruiter.phone}
              </a>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filteredRecruiters.length > 1 && (
            <div className="flex items-center gap-1" role="group" aria-label="Switch recruiter">
              <button aria-label="Previous recruiter" className={iconButton} disabled={recruiterIndex <= 0} onClick={() => onNavigate(filteredRecruiters[recruiterIndex - 1]?.id)} type="button"><Icon name="left" /></button>
              <span className={`min-w-12 text-center text-xs tabular-nums ${muted}`}>{recruiterIndex + 1} of {filteredRecruiters.length}</span>
              <button aria-label="Next recruiter" className={iconButton} disabled={recruiterIndex < 0 || recruiterIndex >= filteredRecruiters.length - 1} onClick={() => onNavigate(filteredRecruiters[recruiterIndex + 1]?.id)} type="button"><Icon name="right" /></button>
            </div>
          )}
          <button className={secondaryButton} onClick={() => onExport(recruiter)} type="button"><Icon name="download" />Export</button>
          <button className="recruiter-primary-button inline-flex h-9 items-center rounded-lg bg-[#172033] px-3 text-sm font-semibold text-white transition hover:bg-[#26344e]" onClick={() => onEdit(recruiter)} type="button">Edit profile</button>
          <ActionMenu
            isDark={isDark}
            items={[
              { label: 'Reset password', icon: 'key', onSelect: () => onAccountAction(recruiter, 'password_reset') },
              { label: 'Resend invite', icon: 'mail', onSelect: () => onAccountAction(recruiter, 'invite') },
            ]}
            label="More account actions"
          />
        </div>
      </header>

      {/* Tabs */}
      <div aria-label="Recruiter details sections" className={`flex gap-1 overflow-x-auto border-b px-4 md:px-5 ${line}`} role="tablist">
        {tabs.map((tab, index) => {
          const slug = tab.toLowerCase()
          const selected = activeTab === tab
          return (
            <button
              aria-controls={`recruiter-panel-${slug}`}
              aria-selected={selected}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${selected ? 'border-[#a94f32] text-[#a94f32]' : `border-transparent ${muted} hover:text-inherit`}`}
              id={`recruiter-tab-${slug}`}
              key={tab}
              onClick={() => onTabChange(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {tab}
              {tab === 'Candidates' && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${isDark ? 'bg-[#30312c]' : 'bg-[#eee9df]'}`}>{assignedCandidates.length}</span>
              )}
            </button>
          )
        })}
      </div>

      <div
        aria-labelledby={`recruiter-tab-${activeTab.toLowerCase()}`}
        className="p-4 md:p-5"
        id={`recruiter-panel-${activeTab.toLowerCase()}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeTab === 'Overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section aria-label="Today's application target" className={`rounded-xl border p-4 ${inner}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">Today’s application target</h3>
                  <span className="text-sm font-semibold tabular-nums">{dailyProgress}%</span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {numberFormat.format(totalToday)}
                  <span className={`ml-1.5 text-base font-medium ${muted}`}>/ {numberFormat.format(dailyGoal)}</span>
                </p>
                <div className="mt-3"><ProgressBar isDark={isDark} label="Daily application target progress" value={dailyProgress} /></div>
                <p className={`mt-2 text-xs ${muted}`}>
                  {dailyGoal
                    ? `${numberFormat.format(Math.max(0, dailyGoal - totalToday))} remaining · ${assignedCandidates.length} candidates × ${dailyApplicationsPerCandidate} per day`
                    : 'No assigned candidates yet'}
                </p>
              </section>

              <section aria-label="Recent activity" className={`rounded-xl border p-4 ${inner}`}>
                <h3 className="text-sm font-semibold">Activity</h3>
                <dl className="mt-3 space-y-2.5 text-sm">
                  {[
                    ['Last active', recruiter.lastActivityAt ? formatRelativeTime(recruiter.lastActivityAt, currentTime) : 'No recent activity'],
                    ['Sessions today', recruiter.sessionsToday ?? 0],
                    ['Average session', `${Math.floor(averageSessionMinutes / 60)}h ${averageSessionMinutes % 60}m`],
                  ].map(([label, value]) => (
                    <div className="flex items-baseline justify-between gap-3" key={label}>
                      <dt className={muted}>{label}</dt>
                      <dd className="font-medium tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            <section aria-label="This month" className={`rounded-xl border ${line}`}>
              <div className={`border-b px-4 py-3 ${line}`}>
                <h3 className="text-sm font-semibold">This month</h3>
              </div>
              <div className="space-y-5 p-4">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stat label="Applications" muted={muted} value={numberFormat.format(totalMonth)} />
                  <Stat label="Assigned candidates" muted={muted} value={numberFormat.format(assignedCandidates.length)} />
                  <Stat label="Days present" muted={muted} value={daysPresent} />
                </dl>
                <div className={`border-t pt-5 ${line}`}>
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <Stat label="Interview invites" muted={muted} value={qualityValue(qualityTotals.interviewInvites)} />
                    <Stat label="Callbacks" muted={muted} value={qualityValue(qualityTotals.callbacks)} />
                    <Stat hint="Replies ÷ applications" label="Response rate" muted={muted} value={responseRate === null ? '—' : `${responseRate}%`} />
                    <Stat label="Rejected" muted={muted} value={qualityValue(qualityTotals.rejections)} />
                    <Stat label="Invalid / duplicate" muted={muted} value={qualityValue(qualityTotals.invalidOrDuplicate)} />
                  </dl>
                  <p className={`mt-4 text-xs ${muted}`}>
                    Outcome metrics are reported for {qualityTotals.reportedCandidates} of {assignedCandidates.length} candidates.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Candidates' && (
          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Assigned candidates</h3>
                <p className={`mt-1 text-xs ${muted}`}>Month to date · daily target is {dailyApplicationsPerCandidate} applications per candidate</p>
              </div>
              <button className="recruiter-primary-button inline-flex h-9 items-center gap-2 rounded-lg bg-[#172033] px-3 text-sm font-semibold text-white transition hover:bg-[#26344e]" onClick={() => onAssignmentCandidateChange(assignmentCandidateId === null ? '' : null)} type="button">
                <Icon name={assignmentCandidateId === null ? 'plus' : 'close'} />
                {assignmentCandidateId === null ? 'Assign candidate' : 'Close'}
              </button>
            </div>

            {assignmentCandidateId !== null && (
              <form className={`mb-4 grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] ${inner}`} onSubmit={onRequestAssignment}>
                <label className={`text-xs font-medium ${muted}`} htmlFor="assignment-candidate">Candidate
                  <select className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`} id="assignment-candidate" onChange={(event) => onAssignmentCandidateChange(event.target.value)} required value={assignmentCandidateId}>
                    <option value="">Select a candidate</option>
                    {candidates.map((candidate) => {
                      const assignedRecruiter = assignmentsByCandidate.get(candidate.id)
                      return <option key={candidate.id} value={candidate.id}>{candidateName(candidate)} · {assignedRecruiter ? `Assigned to ${assignedRecruiter.name}` : 'Unassigned'}</option>
                    })}
                  </select>
                </label>
                <button className="recruiter-primary-button self-end rounded-lg bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white" type="submit">Assign to {recruiter.name.split(' ')[0]}</button>
              </form>
            )}

            {pendingReassignment?.nextRecruiter.id === recruiter.id && (
              <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${isDark ? 'border-amber-900/70 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`} role="alert">
                <p>Reassign <strong>{candidateName(pendingReassignment.candidate)}</strong> from <strong>{pendingReassignment.currentRecruiter.name}</strong> to <strong>{pendingReassignment.nextRecruiter.name}</strong>?</p>
                <div className="flex gap-2">
                  <button className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-[#34445e]' : 'border-slate-300 bg-white'}`} onClick={onCancelReassignment} type="button">Cancel</button>
                  <button className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800" onClick={onConfirmReassignment} type="button">Confirm reassignment</button>
                </div>
              </div>
            )}

            {assignedCandidates.length === 0 ? (
              <div className={`rounded-xl border border-dashed p-10 text-center ${line}`}>
                <p className="text-sm font-semibold">No candidates assigned yet</p>
                <p className={`mt-1 text-xs ${muted}`}>Use “Assign candidate” to give {recruiter.name.split(' ')[0]} their first candidate.</p>
              </div>
            ) : (
              <div className={`overflow-x-auto rounded-xl border ${line}`}>
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className={`recruiter-table-head ${isDark ? 'bg-[#121e33]' : 'bg-slate-50'}`}>
                    <tr className={`border-b text-xs font-semibold ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Today / {dailyApplicationsPerCandidate}</th>
                      <th className="px-4 py-3 text-right">This month</th>
                      <th className="px-4 py-3 text-right">Interviews</th>
                      <th className="px-4 py-3 text-right">Callbacks</th>
                      <th className="px-4 py-3 text-right">Response</th>
                      <th className="px-4 py-3 text-right">Rejected</th>
                      <th className="px-4 py-3 text-right">Invalid / dup.</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
                    {assignedCandidates.map((candidate) => {
                      const stats = applicationStats[candidate.id] ?? { today: 0, month: 0 }
                      const reported = typeof stats.replies === 'number'
                      const candidateResponseRate = reported && stats.month ? Math.round((stats.replies / stats.month) * 100) : null
                      const progress = Math.min(100, Math.round((stats.today / dailyApplicationsPerCandidate) * 100))
                      const cell = (value) => (value == null ? '—' : numberFormat.format(value))
                      return (
                        <tr className="recruiter-data-row" key={candidate.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{candidateName(candidate)}</p>
                            <p className={`mt-0.5 text-xs ${muted}`}>{candidate.areaOfInterest} · {candidate.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="min-w-32">
                              <div className="flex items-baseline justify-between text-sm">
                                <span className="font-semibold tabular-nums">{numberFormat.format(stats.today)}</span>
                                <span className={`text-xs tabular-nums ${muted}`}>{progress}%</span>
                              </div>
                              <div className="mt-1.5"><ProgressBar isDark={isDark} label={`${candidateName(candidate)} daily target progress`} value={progress} /></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{numberFormat.format(stats.month)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{cell(stats.interviewInvites)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{cell(stats.callbacks)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{candidateResponseRate === null ? '—' : `${candidateResponseRate}%`}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{cell(stats.rejections)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{cell(stats.invalidOrDuplicate)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className={`recruiter-table-head ${isDark ? 'bg-[#121e33]' : 'bg-slate-50'}`}>
                    <tr className="text-xs font-semibold">
                      <td className="px-4 py-3">Total · {dailyGoal} daily goal</td>
                      <td className="px-4 py-3 tabular-nums">{numberFormat.format(totalToday)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{numberFormat.format(totalMonth)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{qualityValue(qualityTotals.interviewInvites)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{qualityValue(qualityTotals.callbacks)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{responseRate === null ? '—' : `${responseRate}%`}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{qualityValue(qualityTotals.rejections)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{qualityValue(qualityTotals.invalidOrDuplicate)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {recruiterHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold">Recent assignment changes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className={muted}>
                      <tr className="text-xs"><th className="pb-2 pr-3 font-medium">Candidate</th><th className="pb-2 pr-3 font-medium">Previous recruiter</th><th className="pb-2 pr-3 font-medium">New recruiter</th><th className="pb-2 font-medium">Changed</th></tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
                      {recruiterHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2 pr-3 font-medium">{entry.candidateName}</td>
                          <td className={`py-2 pr-3 ${muted}`}>{entry.fromRecruiterName ?? '—'}</td>
                          <td className="py-2 pr-3">{entry.toRecruiterName}</td>
                          <td className={`py-2 text-xs ${muted}`}>{formatDateTime(entry.changedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Attendance' && (
          <section aria-label="Monthly attendance">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(year, monthIndex, 1))}</h3>
                <p className={`mt-1 text-xs ${muted}`}>{daysPresent} {daysPresent === 1 ? 'day' : 'days'} present</p>
              </div>
              <div className={`flex items-center gap-4 text-xs ${muted}`}>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded bg-emerald-500" />Present</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded ring-2 ring-[#a94f32]" />Today</span>
              </div>
            </div>
            <div className={`mt-4 grid max-w-lg grid-cols-7 gap-1.5 text-center text-xs ${muted}`}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="py-1" key={day}>{day}</span>)}
              {Array.from({ length: firstWeekday }, (_, index) => <span aria-hidden="true" className="py-2" key={`empty-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1
                const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const attended = attendanceDates.has(date)
                return (
                  <span
                    className={`rounded-md py-2 text-sm font-medium tabular-nums ${attended ? 'bg-emerald-500 text-white' : isDark ? 'bg-[#121e33]' : 'bg-[#f3efe6]'} ${date === today ? 'ring-2 ring-[#a94f32] ring-offset-1' : ''}`}
                    key={date}
                    title={attended ? `Present · ${formatDate(date)}` : formatDate(date)}
                  >
                    {day}
                  </span>
                )
              })}
            </div>
            <p className={`mt-4 text-xs ${muted}`}>Attendance is read-only demo data, intended to come from backend login records.</p>
          </section>
        )}

        {activeTab === 'Activity' && (
          <section aria-label="Login activity">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Latest login" muted={muted} value={<span className="text-lg">{formatDateTime(recruiter.lastLoginAt)}</span>} />
              <Stat label="Latest logout" muted={muted} value={<span className="text-lg">{formatDateTime(recruiter.lastLogoutAt)}</span>} />
              <Stat label="Last activity" muted={muted} value={<span className="text-lg">{formatRelativeTime(recruiter.lastActivityAt, currentTime)}</span>} />
            </dl>
            <h3 className="mt-6 text-sm font-semibold">Sessions</h3>
            <p className={`mt-1 text-xs ${muted}`}>{recruiter.sessionsToday ?? 0} today · average {Math.floor(averageSessionMinutes / 60)}h {averageSessionMinutes % 60}m</p>
            <div className={`mt-3 overflow-x-auto rounded-xl border ${line}`}>
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className={`recruiter-table-head ${isDark ? 'bg-[#121e33] text-[#91a9c9]' : 'bg-slate-50 text-slate-500'}`}>
                  <tr className="text-xs"><th className="px-4 py-2.5 font-semibold">Login</th><th className="px-4 py-2.5 font-semibold">Logout</th><th className="px-4 py-2.5 font-semibold">Duration</th><th className="px-4 py-2.5 font-semibold">Date</th></tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
                  {(recruiter.sessionHistory ?? []).map((session, index) => (
                    <tr className="recruiter-data-row" key={`${session.loginAt}-${index}`}>
                      <td className="px-4 py-3">{formatTime(session.loginAt)}</td>
                      <td className="px-4 py-3">{formatTime(session.logoutAt)}</td>
                      <td className="px-4 py-3">{session.durationMinutes == null ? 'Active' : `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m`}</td>
                      <td className={`px-4 py-3 ${muted}`}>{formatDate(session.loginAt)}</td>
                    </tr>
                  ))}
                  {!(recruiter.sessionHistory ?? []).length && <tr><td className={`px-4 py-8 text-center ${muted}`} colSpan="4">No login history available.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Recruiters({ recruiterData, candidates, isDark, onRecruiterDataChange, onRecruiterAudit }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRecruiterId, setEditingRecruiterId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [assignmentCandidateId, setAssignmentCandidateId] = useState(null)
  const [pendingReassignment, setPendingReassignment] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [notice, setNotice] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchParams, setSearchParams] = useSearchParams()
  const recruiterListRef = useRef(null)

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => window.clearInterval(timerId)
  }, [])

  const recruiters = recruiterData.recruiters
  const assignmentsByCandidate = useMemo(() => {
    const assignmentMap = new Map()
    recruiters.forEach((recruiter) => {
      recruiter.assignedCandidateIds.forEach((candidateId) => {
        assignmentMap.set(candidateId, recruiter)
      })
    })
    return assignmentMap
  }, [recruiters])

  const presenceCounts = useMemo(() => {
    const counts = { All: recruiters.length, Online: 0, Away: 0, Offline: 0 }
    recruiters.forEach((recruiter) => { counts[presenceOf(recruiter)] += 1 })
    return counts
  }, [recruiters])

  const filteredRecruiters = useMemo(() => {
    const query = search.trim().toLowerCase()
    return recruiters.filter((recruiter) => {
      if (statusFilter !== 'All' && presenceOf(recruiter) !== statusFilter) return false
      if (!query) return true
      return [recruiter.name, recruiter.email, recruiter.title, recruiter.location]
        .some((value) => (value ?? '').toLowerCase().includes(query))
    })
  }, [recruiters, search, statusFilter])

  const requestedRecruiterId = searchParams.get('recruiter')
  const selectedRecruiter = filteredRecruiters.find((recruiter) => recruiter.id === requestedRecruiterId)
    ?? filteredRecruiters[0]
    ?? null

  function clearPendingAssignment() {
    setAssignmentCandidateId(null)
    setPendingReassignment(null)
  }

  function selectRecruiter(recruiterId) {
    if (!recruiterId || recruiterId === requestedRecruiterId) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('recruiter', recruiterId)
    setSearchParams(nextParams)
    clearPendingAssignment()
  }

  useEffect(() => {
    if (requestedRecruiterId === (selectedRecruiter?.id ?? null)) return
    const nextParams = new URLSearchParams(searchParams)
    if (selectedRecruiter) nextParams.set('recruiter', selectedRecruiter.id)
    else nextParams.delete('recruiter')
    setSearchParams(nextParams, { replace: true })
  }, [requestedRecruiterId, selectedRecruiter, searchParams, setSearchParams])

  useEffect(() => {
    window.addEventListener('popstate', clearPendingAssignment)
    return () => window.removeEventListener('popstate', clearPendingAssignment)
  }, [])

  const today = isoDateFromTime(currentTime)
  function getCandidateStats(recruiter, candidateId) {
    const stats = recruiter.applicationStatsByCandidate?.[candidateId]
    if (stats) return stats
    return recruiter.applicationsTodayDate === today
      ? { today: recruiter.todayApplications, month: recruiter.monthApplications }
      : { today: 0, month: recruiter.monthApplications }
  }

  function getRecruiterStats(recruiter) {
    return recruiter.assignedCandidateIds.reduce((total, candidateId) => {
      const stats = getCandidateStats(recruiter, candidateId)
      return { today: total.today + stats.today, month: total.month + stats.month }
    }, { today: 0, month: 0 })
  }

  const todayApplications = recruiters.reduce((total, recruiter) => total + getRecruiterStats(recruiter).today, 0)
  const totalAssignedCandidates = recruiters.reduce((total, recruiter) => total + recruiter.assignedCandidateIds.length, 0)
  const onlineRecruiters = presenceCounts.Online
  const awayRecruiters = presenceCounts.Away
  const metTargetCount = recruiters.reduce((total, recruiter) => {
    return total + recruiter.assignedCandidateIds.filter((candidateId) => getCandidateStats(recruiter, candidateId).today >= dailyApplicationsPerCandidate).length
  }, 0)
  const averageSessionMinutes = recruiters.length
    ? Math.round(recruiters.reduce((total, recruiter) => total + (recruiter.avgSessionMinutes ?? 0), 0) / recruiters.length)
    : 0

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const listDivider = isDark ? 'divide-[#3b3c36]' : 'divide-[#dedbd2]'
  const inputClass = `h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 ${isDark
    ? 'border-[#34445e] bg-[#0c1326] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-200'
    }`

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setFormError('')
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const avatarUrl = await resizeImageFile(file)
      setForm((current) => ({ ...current, avatarUrl }))
      setFormError('')
    } catch (error) {
      setFormError(error.message)
    }
  }

  function closeForm() {
    setShowCreateForm(false)
    setEditingRecruiterId(null)
    setForm(emptyForm)
    setFormError('')
  }

  function submitRecruiterForm(event) {
    event.preventDefault()
    const normalizedEmail = form.email.trim().toLowerCase()
    if (!emailPattern.test(normalizedEmail)) {
      setFormError('Enter a valid work email address.')
      return
    }
    if (!editingRecruiterId && form.password.length < 8) {
      setFormError('Use a temporary password with at least 8 characters.')
      return
    }
    if (recruiters.some((recruiter) => recruiter.id !== editingRecruiterId && recruiter.email.toLowerCase() === normalizedEmail)) {
      setFormError('A recruiter already exists with this email address.')
      return
    }

    if (editingRecruiterId) {
      const originalRecruiter = recruiters.find((recruiter) => recruiter.id === editingRecruiterId)
      if (!originalRecruiter) {
        setFormError('This recruiter could not be found. Refresh the page and try again.')
        return
      }
      const updatedRecruiter = {
        ...originalRecruiter,
        name: form.name.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        title: form.title.trim() || 'Recruiter',
        location: form.location.trim(),
        avatarUrl: form.avatarUrl,
      }
      onRecruiterDataChange({
        ...recruiterData,
        recruiters: recruiters.map((recruiter) => (recruiter.id === editingRecruiterId ? updatedRecruiter : recruiter)),
      })
      onRecruiterAudit({
        eventType: 'recruiter_management',
        action: 'Recruiter profile updated',
        userName: updatedRecruiter.name,
        details: `${updatedRecruiter.email} · ${updatedRecruiter.title}`,
        reason: 'Recruiter profile details updated by an administrator.',
      })
      setNotice(`Profile updated for ${updatedRecruiter.name}.`)
      closeForm()
      return
    }

    const now = new Date()
    const newRecruiter = {
      id: `recruiter-${now.getTime()}`,
      name: form.name.trim(),
      email: normalizedEmail,
      phone: form.phone.trim(),
      title: form.title.trim() || 'Recruiter',
      location: form.location.trim(),
      avatarUrl: form.avatarUrl,
      createdAt: now.toISOString().slice(0, 10),
      isOnline: false,
      presence: 'Offline',
      lastLoginAt: null,
      lastLogoutAt: null,
      lastActivityAt: null,
      sessionsToday: 0,
      avgSessionMinutes: 0,
      attendanceDays: 0,
      attendanceMonth: now.toISOString().slice(0, 7),
      attendanceTodayDate: null,
      todayApplications: 0,
      applicationsTodayDate: now.toISOString().slice(0, 10),
      monthApplications: 0,
      assignedCandidateIds: [],
      applicationStatsByCandidate: {},
      attendanceLog: [],
      sessionHistory: [],
    }
    onRecruiterDataChange({ ...recruiterData, recruiters: [...recruiters, newRecruiter] })
    onRecruiterAudit({
      eventType: 'recruiter_management',
      action: 'Recruiter account created',
      userName: newRecruiter.name,
      details: `${newRecruiter.email} · ${newRecruiter.title}`,
      reason: 'Recruiter profile created by an administrator. Login email delivery requires backend integration.',
    })
    setNotice(`Recruiter profile created for ${newRecruiter.name}. Login email will be sent after backend setup.`)
    closeForm()
  }

  function editRecruiter(recruiter) {
    setForm({
      name: recruiter.name,
      email: recruiter.email,
      password: '',
      phone: recruiter.phone ?? '',
      title: recruiter.title ?? 'Recruiter',
      location: recruiter.location ?? '',
      avatarUrl: recruiter.avatarUrl ?? '',
    })
    setEditingRecruiterId(recruiter.id)
    setFormError('')
    setShowCreateForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleRecruiterAccountAction(recruiter, action) {
    const isInvite = action === 'invite'
    onRecruiterAudit({
      eventType: 'recruiter_management',
      action: isInvite ? 'Recruiter invitation resend requested' : 'Recruiter password reset requested',
      userName: recruiter.name,
      details: recruiter.email,
      reason: `Demo mode: request recorded locally; no ${isInvite ? 'invitation email was sent' : 'password was changed or reset email sent'}. Connect an authentication backend and email provider to complete this action.`,
    })
    setNotice(`Request recorded for ${recruiter.name}. Demo mode: no email was sent and no password was changed. Connect the authentication and email services to complete this action.`)
  }

  function requestAssignment(event) {
    event.preventDefault()
    const candidate = candidates.find((entry) => entry.id === assignmentCandidateId)
    const nextRecruiter = selectedRecruiter
    if (!candidate || !nextRecruiter) {
      setNotice('Select a candidate and recruiter before assigning.')
      return
    }

    const currentRecruiter = assignmentsByCandidate.get(candidate.id)
    if (currentRecruiter?.id === nextRecruiter.id) {
      setNotice(`${candidateName(candidate)} is already assigned to ${nextRecruiter.name}.`)
      return
    }
    if (currentRecruiter) {
      setPendingReassignment({ candidate, currentRecruiter, nextRecruiter })
      return
    }
    commitAssignment(candidate, null, nextRecruiter)
  }

  function commitAssignment(candidate, currentRecruiter, nextRecruiter) {
    const now = new Date().toISOString()
    const historyEntry = {
      id: `assignment-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidateName(candidate),
      fromRecruiterId: currentRecruiter?.id ?? null,
      fromRecruiterName: currentRecruiter?.name ?? null,
      toRecruiterId: nextRecruiter.id,
      toRecruiterName: nextRecruiter.name,
      changedAt: now,
    }
    onRecruiterDataChange({
      ...recruiterData,
      recruiters: recruiters.map((recruiter) => {
        const assignedCandidateIds = recruiter.assignedCandidateIds.filter((id) => id !== candidate.id)
        return recruiter.id === nextRecruiter.id
          ? { ...recruiter, assignedCandidateIds: [...assignedCandidateIds, candidate.id] }
          : { ...recruiter, assignedCandidateIds }
      }),
      assignmentHistory: [historyEntry, ...(recruiterData.assignmentHistory ?? [])],
    })
    onRecruiterAudit({
      eventType: 'recruiter_assignment',
      action: currentRecruiter ? 'Candidate reassigned' : 'Candidate assigned',
      userName: candidateName(candidate),
      details: currentRecruiter
        ? `${currentRecruiter.name} → ${nextRecruiter.name}`
        : `Assigned to ${nextRecruiter.name}`,
      reason: 'Candidate assignment updated by an administrator.',
    })
    setNotice(`${candidateName(candidate)} assigned to ${nextRecruiter.name}.`)
    clearPendingAssignment()
  }

  function exportCsv(recruitersToExport = filteredRecruiters) {
    const rows = [
      ['Recruiter', 'Email', 'Status', 'Login time', 'Last active', 'Logout time', 'Sessions today', 'Applications today', 'Applications this month', 'Candidates with quality metrics', 'Interview invites this month', 'Callbacks this month', 'Replies this month', 'Response rate this month', 'Rejections this month', 'Invalid or duplicate this month', 'Assigned candidates', 'Monthly attendance days'],
      ...recruitersToExport.map((recruiter) => {
        const stats = getRecruiterStats(recruiter)
        const quality = recruiter.assignedCandidateIds.reduce((total, candidateId) => {
          const candidateStats = recruiter.applicationStatsByCandidate?.[candidateId] ?? {}
          if (typeof candidateStats.replies !== 'number') return total
          return {
            applications: total.applications + (candidateStats.month ?? 0),
            interviewInvites: total.interviewInvites + (candidateStats.interviewInvites ?? 0),
            callbacks: total.callbacks + (candidateStats.callbacks ?? 0),
            replies: total.replies + candidateStats.replies,
            rejections: total.rejections + (candidateStats.rejections ?? 0),
            invalidOrDuplicate: total.invalidOrDuplicate + (candidateStats.invalidOrDuplicate ?? 0),
            reportedCandidates: total.reportedCandidates + 1,
          }
        }, { applications: 0, interviewInvites: 0, callbacks: 0, replies: 0, rejections: 0, invalidOrDuplicate: 0, reportedCandidates: 0 })
        const qualityResponseRate = quality.applications ? `${Math.round((quality.replies / quality.applications) * 100)}%` : '—'
        return [
          recruiter.name,
          recruiter.email,
          presenceOf(recruiter),
          formatTime(recruiter.lastLoginAt),
          formatRelativeTime(recruiter.lastActivityAt, currentTime),
          formatTime(recruiter.lastLogoutAt),
          recruiter.sessionsToday ?? 0,
          stats.today,
          quality.applications,
          quality.reportedCandidates,
          quality.reportedCandidates ? quality.interviewInvites : '—',
          quality.reportedCandidates ? quality.callbacks : '—',
          quality.reportedCandidates ? quality.replies : '—',
          qualityResponseRate,
          quality.reportedCandidates ? quality.rejections : '—',
          quality.reportedCandidates ? quality.invalidOrDuplicate : '—',
          recruiter.assignedCandidateIds.length,
          recruiter.attendanceDays,
        ]
      }),
    ]
    const csv = rows.map((row) => row.map((value) => {
      const text = String(value ?? '')
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aifagen-recruiters.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className={`recruiter-dashboard mx-auto max-w-[1600px] space-y-5 ${isDark ? 'recruiter-dashboard--dark' : 'recruiter-dashboard--light'}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Recruiters</h1>
          <p className={`mt-1 max-w-3xl text-sm ${muted}`}>
            Manage recruiter accounts, candidate assignments, activity, attendance, and application targets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`recruiter-glass-control inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`}
            onClick={() => exportCsv()}
            type="button"
          >
            <Icon name="download" />
            Export CSV
          </button>
          <button
            className="recruiter-primary-button inline-flex h-10 items-center gap-2 rounded-lg bg-[#172033] px-4 text-sm font-semibold text-white transition hover:bg-[#26344e]"
            onClick={() => {
              if (showCreateForm && !editingRecruiterId) {
                closeForm()
                return
              }
              setEditingRecruiterId(null)
              setForm(emptyForm)
              setFormError('')
              setShowCreateForm(true)
            }}
            type="button"
          >
            <Icon name="plus" />
            {showCreateForm && !editingRecruiterId ? 'Close form' : 'Add recruiter'}
          </button>
        </div>
      </header>

      {notice && (
        <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${isDark ? 'border-emerald-900/70 bg-emerald-950/30 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role="status">
          <span>{notice}</span>
          <button aria-label="Dismiss notification" className="shrink-0" onClick={() => setNotice('')} type="button"><Icon name="close" /></button>
        </div>
      )}

      {showCreateForm && (
        <section className={`recruiter-panel rounded-xl border p-5 shadow-sm ${surface}`}>
          <div className="mb-4">
            <h2 className="text-base font-semibold">{editingRecruiterId ? 'Edit recruiter profile' : 'Create recruiter profile'}</h2>
            <p className={`mt-1 text-xs ${muted}`}>{editingRecruiterId
              ? 'Update the recruiter’s photo, contact and role details.'
              : 'Password is used only for this form session and is never stored by this demo.'}</p>
          </div>
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={submitRecruiterForm}>
            <div className="flex flex-wrap items-center gap-4 sm:col-span-2 xl:col-span-3">
              <Avatar
                isDark={isDark}
                recruiter={{ id: editingRecruiterId ?? 'new-recruiter', name: form.name || 'New recruiter', avatarUrl: form.avatarUrl }}
                showPresence={false}
                size="lg"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <input accept="image/*" className="peer sr-only" id="recruiter-photo" onChange={handlePhotoChange} type="file" />
                  <label
                    className={`recruiter-glass-control inline-flex h-9 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#a94f32] ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`}
                    htmlFor="recruiter-photo"
                  >
                    {form.avatarUrl ? 'Change photo' : 'Upload photo'}
                  </label>
                  {form.avatarUrl && (
                    <button className={`h-9 rounded-lg px-3 text-sm font-semibold ${muted}`} onClick={() => setForm((current) => ({ ...current, avatarUrl: '' }))} type="button">Remove</button>
                  )}
                </div>
                <p className={`mt-1.5 text-xs ${muted}`}>Optional. Without a photo, the recruiter’s initials are shown.</p>
              </div>
            </div>
            {[
              ['name', 'Full name', 'text'],
              ['email', 'Work email', 'email'],
              ...(!editingRecruiterId ? [['password', 'Temporary password', 'password']] : []),
              ['phone', 'Phone number', 'tel'],
              ['title', 'Role / specialty', 'text'],
              ['location', 'City, State', 'text'],
            ].map(([name, label, type]) => (
              <label className={`text-xs font-medium ${muted}`} htmlFor={`recruiter-${name}`} key={name}>
                {label}
                <input
                  autoComplete={name === 'password' ? 'new-password' : name === 'email' ? 'email' : 'off'}
                  className={`${inputClass} mt-1.5`}
                  id={`recruiter-${name}`}
                  name={name}
                  onChange={updateForm}
                  required
                  type={type}
                  value={form[name]}
                />
              </label>
            ))}
            {formError && <p className="text-xs text-rose-500 sm:col-span-2 xl:col-span-3" role="alert">{formError}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2 xl:col-span-3">
              <button className={`rounded-lg border px-4 py-2 text-sm ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`} onClick={closeForm} type="button">Cancel</button>
              <button className="recruiter-primary-button inline-flex items-center gap-2 rounded-lg bg-[#172033] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26344e]" type="submit">
                <Icon name={editingRecruiterId ? 'check' : 'mail'} />
                {editingRecruiterId ? 'Save changes' : 'Create account'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section aria-label="Recruiter overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Online now', value: onlineRecruiters, icon: 'people', caption: `${awayRecruiters} away · ${recruiters.length - onlineRecruiters - awayRecruiters} offline` },
          { label: 'Applications today', value: numberFormat.format(todayApplications), icon: 'clock', caption: `Across ${recruiters.length} recruiters` },
          { label: 'Candidates at target', value: `${metTargetCount} / ${totalAssignedCandidates}`, icon: 'target', caption: `${dailyApplicationsPerCandidate} applications per candidate / day` },
          { label: 'Avg. session length', value: `${Math.floor(averageSessionMinutes / 60)}h ${averageSessionMinutes % 60}m`, icon: 'calendar', caption: 'Across recruiter sessions' },
        ].map((metric) => (
          <article className={`recruiter-panel recruiter-metric rounded-xl border p-4 shadow-sm ${surface}`} key={metric.label}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{metric.label}</h2>
              <span className={muted}><Icon name={metric.icon} /></span>
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums">{metric.value}</p>
            <p className={`mt-1 text-xs ${muted}`}>{metric.caption}</p>
          </article>
        ))}
      </section>

      <section aria-label="Recruiter team and selected recruiter details" className="recruiter-workspace grid grid-cols-1 items-start gap-4 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Team list */}
        <div className={`recruiter-team-panel recruiter-panel flex flex-col overflow-hidden rounded-xl border md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] ${surface}`}>
          <div className={`recruiter-panel-header border-b p-4 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>
            <h2 className="font-semibold">Team</h2>
            <label className="relative mt-3 block">
              <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}><Icon name="search" /></span>
              <input
                aria-label="Search recruiters"
                className={`${inputClass} pl-9`}
                onChange={(event) => { setSearch(event.target.value); clearPendingAssignment() }}
                placeholder="Search recruiter..."
                value={search}
              />
            </label>
            <div aria-label="Filter by status" className="mt-3 flex flex-wrap gap-1.5" role="group">
              {presenceFilters.map((option) => {
                const active = statusFilter === option
                return (
                  <button
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${active
                      ? isDark ? 'border-[#a94f32] bg-[#30312c] text-[#e0a087]' : 'border-[#a94f32] bg-[#f3e3da] text-[#8f452d]'
                      : isDark ? 'border-[#3b3c36] text-[#b8c9df] hover:bg-[#2b2c27]' : 'border-[#dedbd2] text-slate-600 hover:bg-[#f8f6f0]'
                      }`}
                    key={option}
                    onClick={() => { setStatusFilter(option); clearPendingAssignment() }}
                    type="button"
                  >
                    {option}
                    <span className="tabular-nums opacity-80">{presenceCounts[option]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <ul aria-label="Recruiters" className={`recruiter-list min-h-0 flex-1 divide-y overflow-y-auto ${listDivider}`} ref={recruiterListRef}>
            {filteredRecruiters.map((recruiter, index) => {
              const presence = presenceOf(recruiter)
              const total = getRecruiterStats(recruiter).today
              const dailyGoal = recruiter.assignedCandidateIds.length * dailyApplicationsPerCandidate
              const progress = dailyGoal ? Math.min(100, Math.round((total / dailyGoal) * 100)) : 0
              const isSelected = recruiter.id === selectedRecruiter?.id

              return (
                <li key={recruiter.id}>
                  <button
                    aria-current={isSelected ? 'true' : undefined}
                    className={`recruiter-list-item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#a94f32] ${isSelected
                      ? isDark ? 'bg-[#30312c]' : 'bg-[#eee9df]'
                      : isDark ? 'hover:bg-[#2b2c27]' : 'hover:bg-[#f8f6f0]'
                      }`}
                    id={`recruiter-option-${encodeURIComponent(recruiter.id)}`}
                    onClick={() => selectRecruiter(recruiter.id)}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                      event.preventDefault()
                      const nextIndex = Math.max(0, Math.min(filteredRecruiters.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
                      selectRecruiter(filteredRecruiters[nextIndex].id)
                      recruiterListRef.current?.querySelectorAll('button')[nextIndex]?.focus()
                    }}
                    type="button"
                  >
                    <Avatar
                      isDark={isDark}
                      recruiter={recruiter}
                      ringClass={isSelected ? (isDark ? 'ring-[#30312c]' : 'ring-[#eee9df]') : undefined}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{recruiter.name}</span>
                        <span className={`shrink-0 text-xs ${muted}`}>{presence}</span>
                      </span>
                      <span className={`block truncate text-xs ${muted}`}>{recruiter.title}</span>
                      <span className="mt-2 flex items-center gap-2">
                        <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-[#45463f]' : 'bg-[#e5e1d8]'}`}>
                          <span className={`block h-full rounded-full ${progress >= 100 ? 'bg-emerald-600' : 'bg-[#a94f32]'}`} style={{ width: `${progress}%` }} />
                        </span>
                        <span className={`shrink-0 text-xs tabular-nums ${muted}`}>{numberFormat.format(total)} / {dailyGoal}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            {!filteredRecruiters.length && (
              <li className={`px-4 py-10 text-center text-sm ${muted}`}>No recruiters match your filters.</li>
            )}
          </ul>
        </div>

        {/* Selected recruiter */}
        <div className="min-w-0">
          <p aria-live="polite" className="sr-only" role="status">
            {selectedRecruiter ? `Showing ${selectedRecruiter.name}` : 'No recruiter selected'}
          </p>
          {selectedRecruiter ? (
            <RecruiterDetails
              activeTab={activeTab}
              assignmentCandidateId={assignmentCandidateId}
              assignmentHistory={recruiterData.assignmentHistory ?? []}
              assignmentsByCandidate={assignmentsByCandidate}
              candidates={candidates}
              currentTime={currentTime}
              filteredRecruiters={filteredRecruiters}
              isDark={isDark}
              onAccountAction={handleRecruiterAccountAction}
              onAssignmentCandidateChange={setAssignmentCandidateId}
              onCancelReassignment={() => setPendingReassignment(null)}
              onConfirmReassignment={() => commitAssignment(pendingReassignment.candidate, pendingReassignment.currentRecruiter, pendingReassignment.nextRecruiter)}
              onEdit={editRecruiter}
              onExport={(recruiter) => exportCsv([recruiter])}
              onNavigate={selectRecruiter}
              onRequestAssignment={requestAssignment}
              onTabChange={setActiveTab}
              pendingReassignment={pendingReassignment}
              recruiter={selectedRecruiter}
            />
          ) : (
            <div className={`rounded-xl border p-8 text-center text-sm ${muted} ${surface}`}>No recruiters match your filters.</div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Recruiters
