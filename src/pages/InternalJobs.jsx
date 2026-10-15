import { useEffect, useMemo, useRef, useState } from 'react'

const pageSize = 10
const workModes = ['On-site', 'Hybrid', 'Remote']
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary']
const applicationStatuses = ['New', 'In review', 'Shortlisted']
const visibilityOptions = ['All', 'Visible', 'Hidden']
const sortOptions = [
  { id: 'newest', label: 'Newest first' },
  { id: 'applicants', label: 'Most applicants' },
  { id: 'new', label: 'Most new applicants' },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
}

function countByStatus(job, status) {
  return job.applications.filter((applicant) => applicant.applicationStatus === status).length
}

/* score is null when the job lists no required skills, so we never show a misleading 0%. */
function calculateMatch(job, applicant) {
  const requiredSkills = job.requiredSkills.map((skill) => skill.trim().toLowerCase()).filter(Boolean)
  if (!requiredSkills.length) return { score: null, matched: [], missing: [] }
  const applicantSkills = new Set(applicant.skills.map((skill) => skill.toLowerCase()))
  const matched = requiredSkills.filter((skill) => applicantSkills.has(skill))
  const missing = requiredSkills.filter((skill) => !applicantSkills.has(skill))
  const skillsScore = Math.round((matched.length / requiredSkills.length) * 85)
  const experienceScore = Math.min(15, Math.round((applicant.experienceYears / 6) * 15))
  return { score: Math.min(100, skillsScore + experienceScore), matched, missing }
}

function escapePdfText(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function downloadResumePdf(applicant, job) {
  const match = calculateMatch(job, applicant)
  const lines = [
    applicant.name,
    applicant.headline,
    `Email: ${applicant.email}`,
    `Phone: ${applicant.mobile}`,
    `Location: ${applicant.location}`,
    `Experience: ${applicant.experienceYears} years`,
    `Education: ${applicant.education}`,
    `Skills: ${applicant.skills.join(', ')}`,
    `Applied for: ${job.title} at ${job.consultant}`,
    `Resume match score: ${match.score === null ? 'N/A' : `${match.score}%`}`,
  ]
  const textCommands = lines
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 11} Tf 52 ${760 - index * 34} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n')
  const stream = `${textCommands}\n`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = applicant.resume.fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const iconPaths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  right: <><path d="m9 18 6-6-6-6" /></>,
}

function Icon({ name, className = 'size-4' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  )
}

function fieldClass(isDark) {
  return `h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 ${isDark
    ? 'border-[#34445e] bg-[#0c1326] text-slate-100 focus:border-[#53657d] focus:ring-[#53657d]'
    : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'
    }`
}

/* Escape closes, Tab stays inside, focus returns to the button that opened the dialog. */
function useDialog(onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const node = ref.current
    const previouslyFocused = document.activeElement
    const focusables = () => (node
      ? [...node.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      : [])
    ;(focusables()[0] ?? node)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return ref
}

/* One control for visibility: the switch shows the state and changes it. */
function Switch({ checked, label, onChange, isDark }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 motion-reduce:transition-none ${
        checked ? 'bg-emerald-500' : isDark ? 'bg-[#34445e]' : 'bg-slate-300'
      }`}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/* The page's main call to action: filled accent color, larger, with a lift on hover. */
function AddJobButton({ onClick, label = 'Add job' }) {
  return (
    <button
      className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-xl bg-[#a8462b] pr-5 pl-3 text-sm font-semibold text-white shadow-md shadow-[#a8462b]/25 transition hover:-translate-y-0.5 hover:bg-[#8f3a22] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8462b] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-white/20">
        <Icon className="size-4" name="add" />
      </span>
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Add / edit job dialog                                               */
/* ------------------------------------------------------------------ */

function JobForm({ job, isDark, onClose, onSave }) {
  const dialogRef = useDialog(onClose)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => ({
    title: job?.title ?? '',
    consultant: job?.consultant ?? '',
    location: job?.location ?? '',
    workMode: job?.workMode ?? 'Hybrid',
    employmentType: job?.employmentType ?? 'Full-time',
    description: job?.description ?? '',
    requiredSkills: job?.requiredSkills.join(', ') ?? '',
    visible: job?.visible ?? true,
  }))

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const labelClass = `block text-xs font-medium ${isDark ? 'text-[#b8c9df]' : 'text-slate-600'}`
  const modalSurface = isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'

  function handleSubmit(event) {
    event.preventDefault()
    const requiredSkills = [...new Set(form.requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean))]
    if (!requiredSkills.length) {
      setError('Add at least one required skill, separated by commas.')
      return
    }
    onSave({
      ...job,
      ...form,
      company: 'AIFAGen Consulting',
      requiredSkills,
      applications: job?.applications ?? [],
      id: job?.id ?? `internal-job-${Date.now()}`,
      postedAt: job?.postedAt ?? new Date().toISOString().slice(0, 10),
      visible: form.visible,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <section aria-labelledby="internal-job-form-title" aria-modal="true" className={`relative flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border p-5 shadow-2xl md:p-6 ${modalSurface}`} ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className="mb-5">
          <h2 className="text-lg font-semibold" id="internal-job-form-title">{job ? 'Edit internal job' : 'Add internal job'}</h2>
          <p className={`mt-1 text-xs ${muted}`}>Share the consultant requirement with candidates on your platform.</p>
        </header>
        <form className="grid min-h-0 flex-1 content-start grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className={labelClass}>
            Job title
            <input className={`${fieldClass(isDark)} mt-1.5`} name="title" onChange={updateField} required value={form.title} />
          </label>
          <label className={labelClass}>
            Consultant / client
            <input className={`${fieldClass(isDark)} mt-1.5`} name="consultant" onChange={updateField} required value={form.consultant} />
          </label>
          <label className={labelClass}>
            Location
            <input className={`${fieldClass(isDark)} mt-1.5`} name="location" onChange={updateField} required value={form.location} />
          </label>
          <label className={labelClass}>
            Work mode
            <select className={`${fieldClass(isDark)} mt-1.5`} name="workMode" onChange={updateField} value={form.workMode}>
              {workModes.map((mode) => <option key={mode}>{mode}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Employment type
            <select className={`${fieldClass(isDark)} mt-1.5`} name="employmentType" onChange={updateField} value={form.employmentType}>
              {employmentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Required skills <span className="font-normal">(comma separated)</span>
            <input className={`${fieldClass(isDark)} mt-1.5`} name="requiredSkills" onChange={updateField} placeholder="React, JavaScript, REST APIs" required value={form.requiredSkills} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Job description
            <textarea className={`mt-1.5 min-h-28 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100 focus:border-[#53657d] focus:ring-[#53657d]' : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'}`} name="description" onChange={updateField} required value={form.description} />
          </label>

          <div className={`flex items-center justify-between gap-4 rounded-lg border p-3 sm:col-span-2 ${isDark ? 'border-[#3b3c36] bg-[#1d1e1b]' : 'border-[#dedbd2] bg-[#f8f6f0]'}`}>
            <div>
              <p className="text-sm font-medium">Visible on website</p>
              <p className={`mt-0.5 text-xs ${muted}`}>Hidden jobs are saved but not shown to candidates.</p>
            </div>
            <Switch
              checked={form.visible}
              isDark={isDark}
              label="Visible on website"
              onChange={() => setForm((current) => ({ ...current, visible: !current.visible }))}
            />
          </div>

          {error && <p className="text-xs text-rose-500 sm:col-span-2" role="alert">{error}</p>}
          <div className={`sticky bottom-0 flex justify-end gap-2 border-t pt-3 sm:col-span-2 ${modalSurface}`}>
            <button className={`rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-[#a8462b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f3a22]" type="submit">{job ? 'Save changes' : 'Post job'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Applicants drawer                                                   */
/* ------------------------------------------------------------------ */

function MatchBadge({ score, isDark }) {
  const tone = score === null
    ? isDark ? 'bg-[#202d43] text-[#b8c9df]' : 'bg-slate-100 text-slate-600'
    : score >= 75
      ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
      : score >= 50
        ? isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'
        : isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-700'

  return (
    <div className={`rounded-xl px-3 py-2 text-center ${tone}`}>
      <p className="text-xs font-semibold">Resume match</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{score === null ? 'N/A' : `${score}%`}</p>
    </div>
  )
}

function ApplicantsPanel({ job, isDark, onClose, onStatusChange }) {
  const dialogRef = useDialog(onClose)
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('match')
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const line = isDark ? 'border-[#263249]' : 'border-slate-200'
  const panelSurface = isDark ? 'border-[#263249] bg-[#0c1326] text-slate-100' : 'border-slate-200 bg-[#f8fafc] text-slate-900'

  const statusCounts = useMemo(() => ({
    All: job.applications.length,
    ...Object.fromEntries(applicationStatuses.map((status) => [status, countByStatus(job, status)])),
  }), [job])

  const applicants = useMemo(() => {
    const rows = job.applications
      .filter((applicant) => statusFilter === 'All' || applicant.applicationStatus === statusFilter)
      .map((applicant) => ({ applicant, match: calculateMatch(job, applicant) }))
    rows.sort((a, b) => (sortBy === 'match'
      ? (b.match.score ?? -1) - (a.match.score ?? -1)
      : (b.applicant.appliedAt ?? '').localeCompare(a.applicant.appliedAt ?? '')))
    return rows
  }, [job, statusFilter, sortBy])

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <aside aria-label={`Applications for ${job.title}`} aria-modal="true" className={`relative flex h-full w-full max-w-[760px] flex-col shadow-2xl ${panelSurface}`} ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className={`flex items-start justify-between gap-3 border-b px-5 py-4 md:px-7 ${line}`}>
          <div className="min-w-0">
            <p className={`text-sm font-medium ${muted}`}>{job.applications.length} {job.applications.length === 1 ? 'application' : 'applications'}</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{job.title}</h2>
            <p className={`mt-1 text-sm ${muted}`}>{job.consultant} · {job.location}</p>
          </div>
          <button aria-label="Close applications" className={`rounded-lg p-2 ${muted} ${isDark ? 'hover:bg-[#18243a]' : 'hover:bg-slate-100'}`} onClick={onClose} type="button">
            <Icon className="size-5" name="close" />
          </button>
        </header>

        <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 md:px-7 ${line}`}>
          <div aria-label="Filter by application status" className="flex flex-wrap gap-1.5" role="group">
            {['All', ...applicationStatuses].map((status) => {
              const active = statusFilter === status
              return (
                <button
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                    ? isDark ? 'border-[#a8462b] bg-[#30312c] text-[#e0a087]' : 'border-[#a8462b] bg-[#f3e3da] text-[#8f3a22]'
                    : isDark ? 'border-[#34445e] text-[#b8c9df] hover:bg-[#18243a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status}
                  <span className="tabular-nums opacity-80">{statusCounts[status]}</span>
                </button>
              )
            })}
          </div>
          <label className={`flex items-center gap-2 text-xs ${muted}`}>
            Sort by
            <select
              className={`h-8 rounded-lg border px-2 text-xs outline-none ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="match">Best match</option>
              <option value="recent">Most recent</option>
            </select>
          </label>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
          {applicants.length ? applicants.map(({ applicant, match }) => {
            const unmatchedSkills = applicant.skills.filter((skill) => !match.matched.includes(skill.toLowerCase()))
            const matchedSkills = applicant.skills.filter((skill) => match.matched.includes(skill.toLowerCase()))
            return (
              <article className={`rounded-xl border p-4 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'}`} key={applicant.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isDark ? 'bg-[#202d43] text-slate-100' : 'bg-[#f3e3da] text-[#8f3a22]'}`}>
                      {initialsOf(applicant.name)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{applicant.name}</h3>
                      <p className={`mt-0.5 text-sm ${muted}`}>{applicant.headline}</p>
                      <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs ${muted}`}>
                        <a className="break-all hover:underline" href={`mailto:${applicant.email}`}>{applicant.email}</a>
                        <a className="hover:underline" href={`tel:${applicant.mobile.replaceAll(' ', '')}`}>{applicant.mobile}</a>
                        <span>{applicant.location}</span>
                      </div>
                    </div>
                  </div>
                  <MatchBadge isDark={isDark} score={match.score} />
                </div>

                <div className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-3 ${isDark ? 'border-[#263249]' : 'border-slate-100'}`}>
                  <label className={`flex items-center gap-2 text-xs font-medium ${muted}`} htmlFor={`application-status-${applicant.id}`}>
                    Status
                    <select
                      className={`h-8 rounded-lg border px-2 text-xs outline-none ${isDark ? 'border-[#34445e] bg-[#0c1326] text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}
                      id={`application-status-${applicant.id}`}
                      onChange={(event) => onStatusChange(applicant.id, event.target.value)}
                      value={applicant.applicationStatus}
                    >
                      {applicationStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    {[
                      ['Experience', `${applicant.experienceYears} years`],
                      ['Education', applicant.education],
                      ['Applied', formatDate(applicant.appliedAt)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className={muted}>{label}</dt>
                        <dd className="mt-0.5 font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-3">
                  <p className={`text-xs font-medium ${muted}`}>Skills on resume</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {[...matchedSkills, ...unmatchedSkills].map((skill) => {
                      const isMatch = match.matched.includes(skill.toLowerCase())
                      return (
                        <li className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isMatch ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700' : isDark ? 'bg-[#202d43] text-[#b8c9df]' : 'bg-slate-100 text-slate-600'}`} key={skill}>
                          {isMatch && <Icon className="size-3" name="check" />}
                          {skill}
                          {isMatch && <span className="sr-only"> (required by this job)</span>}
                        </li>
                      )
                    })}
                  </ul>
                  {match.missing.length > 0 && (
                    <p className={`mt-2 text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      <span className="font-semibold">Missing required:</span> {match.missing.join(', ')}
                    </p>
                  )}
                </div>

                <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 ${isDark ? 'border-[#263249]' : 'border-slate-100'}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={muted}><Icon name="file" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{applicant.resume.fileName}</p>
                      <p className={`mt-0.5 text-xs ${muted}`}>PDF · {applicant.resume.fileSizeKb} KB · Uploaded {formatDate(applicant.resume.uploadedAt)}</p>
                    </div>
                  </div>
                  <button className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => downloadResumePdf(applicant, job)} type="button">
                    <Icon className="size-3.5" name="file" />
                    Download resume PDF
                  </button>
                </div>
              </article>
            )
          }) : (
            <div className={`rounded-xl border border-dashed px-5 py-14 text-center ${isDark ? 'border-[#34445e]' : 'border-slate-300'}`}>
              <p className="text-sm font-semibold">{job.applications.length ? `No ${statusFilter.toLowerCase()} applications` : 'No applications yet'}</p>
              <p className={`mt-1 text-xs ${muted}`}>
                {job.applications.length
                  ? 'Try another status filter.'
                  : 'Candidate applications will appear here when submitted on your website.'}
              </p>
            </div>
          )}
          <p className={`pt-1 text-xs ${muted}`}>Demo candidate records; sample resume PDFs are generated for download.</p>
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function InternalJobs({ jobs, onJobsChange, onVisibilityChange, isDark }) {
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [jobToEdit, setJobToEdit] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [jobToDelete, setJobToDelete] = useState(null)
  const [viewJobId, setViewJobId] = useState(null)

  // Derived from the live list, so the drawer never shows a stale copy of the job.
  const jobToView = jobs.find((job) => job.id === viewJobId) ?? null

  const visibleCount = jobs.filter((job) => job.visible).length
  const hiddenCount = jobs.length - visibleCount
  const applicationCount = jobs.reduce((total, job) => total + job.applications.length, 0)
  const newApplicationCount = jobs.reduce((total, job) => total + countByStatus(job, 'New'), 0)
  const shortlistedCount = jobs.reduce((total, job) => total + countByStatus(job, 'Shortlisted'), 0)
  const visibilityCounts = { All: jobs.length, Visible: visibleCount, Hidden: hiddenCount }

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = jobs.filter((job) => {
      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.consultant.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      const matchesVisibility =
        visibilityFilter === 'All' ||
        (visibilityFilter === 'Visible' ? job.visible : !job.visible)
      return matchesQuery && matchesVisibility
    })
    const byNewest = (a, b) => b.postedAt.localeCompare(a.postedAt)
    const sorters = {
      newest: byNewest,
      applicants: (a, b) => b.applications.length - a.applications.length || byNewest(a, b),
      new: (a, b) => countByStatus(b, 'New') - countByStatus(a, 'New') || byNewest(a, b),
    }
    return [...matches].sort(sorters[sortBy])
  }, [jobs, search, visibilityFilter, sortBy])

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const line = isDark ? 'border-[#263249]' : 'border-slate-200'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'

  function toggleVisibility(job) {
    const visible = !job.visible
    onJobsChange((current) => current.map((entry) => (entry.id === job.id ? { ...entry, visible } : entry)))
    onVisibilityChange([{ id: job.id, title: job.title, previousVisible: job.visible, visible }], 'internal')
  }

  function saveJob(updatedJob) {
    onJobsChange((current) => {
      const exists = current.some((job) => job.id === updatedJob.id)
      return exists
        ? current.map((job) => (job.id === updatedJob.id ? updatedJob : job))
        : [updatedJob, ...current]
    })
    setShowForm(false)
    setJobToEdit(null)
    setPage(1)
  }

  function deleteJob() {
    if (!jobToDelete) return
    onJobsChange((current) => current.filter((job) => job.id !== jobToDelete.id))
    setJobToDelete(null)
  }

  function updateApplicationStatus(applicantId, status) {
    onJobsChange((current) => current.map((job) => (job.id === viewJobId
      ? {
        ...job,
        applications: job.applications.map((applicant) => (applicant.id === applicantId ? { ...applicant, applicationStatus: status } : applicant)),
      }
      : job)))
  }

  function clearFilters() {
    setSearch('')
    setVisibilityFilter('All')
    setPage(1)
  }

  const kpis = [
    { label: 'Visible jobs', value: visibleCount, caption: `of ${jobs.length} total · ${hiddenCount} hidden`, icon: 'eye' },
    { label: 'Applications', value: applicationCount, caption: newApplicationCount ? `${newApplicationCount} new to review` : 'All reviewed', icon: 'user' },
    { label: 'Shortlisted', value: shortlistedCount, caption: 'Candidates shortlisted', icon: 'check' },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Single header: title on the left, the main action on the right */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#172033]'}`}>Internal jobs</h1>
          <p className={`mt-1 max-w-xl text-sm ${muted}`}>
            Post consultant requirements, control what shows on your website, and review who applied.
          </p>
        </div>
        <AddJobButton onClick={() => setShowForm(true)} />
      </header>

      <section aria-label="Internal job summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((item) => (
          <article
            className={`admin-summary-card rounded-xl border p-5 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e4ded3] bg-white'}`}
            key={item.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={`text-sm font-medium ${muted}`}>{item.label}</h2>
                <p className={`mt-2 text-3xl font-bold tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-[#172033]'}`}>{item.value.toLocaleString()}</p>
                <p className={`mt-1.5 text-xs ${muted}`}>{item.caption}</p>
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-[#202d43] text-[#e0a087]' : 'bg-[#f3e9e0] text-[#a8462b]'}`}>
                <Icon className="size-5" name={item.icon} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {jobs.length === 0 ? (
        <section aria-label="Internal jobs list" className={`rounded-xl border border-dashed px-6 py-16 text-center ${surface}`}>
          <p className="text-base font-semibold">No internal jobs yet</p>
          <p className={`mx-auto mt-1 max-w-sm text-sm ${muted}`}>Post your first consultant requirement and candidates can start applying from your website.</p>
          <div className="mt-5 flex justify-center"><AddJobButton label="Post your first job" onClick={() => setShowForm(true)} /></div>
        </section>
      ) : (
        <section aria-label="Internal jobs list" className={`overflow-hidden rounded-xl border shadow-sm ${surface}`}>
          <div className={`flex flex-wrap items-center gap-3 border-b p-3 md:p-4 ${line}`}>
            <label className="relative block min-w-[220px] flex-1 md:max-w-[360px]">
              <span className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${muted}`}><Icon name="search" /></span>
              <input
                aria-label="Search internal jobs by title, consultant, or location"
                className={`h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-2 ${isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]' : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'}`}
                onChange={(event) => { setSearch(event.target.value); setPage(1) }}
                placeholder="Search title, consultant, or location..."
                type="search"
                value={search}
              />
            </label>

            <div aria-label="Filter by visibility" className="flex flex-wrap gap-1.5" role="group">
              {visibilityOptions.map((option) => {
                const active = visibilityFilter === option
                return (
                  <button
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active
                      ? isDark ? 'border-[#a8462b] bg-[#30312c] text-[#e0a087]' : 'border-[#a8462b] bg-[#f3e3da] text-[#8f3a22]'
                      : isDark ? 'border-[#34445e] text-[#b8c9df] hover:bg-[#18243a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    key={option}
                    onClick={() => { setVisibilityFilter(option); setPage(1) }}
                    type="button"
                  >
                    {option}
                    <span className="tabular-nums opacity-80">{visibilityCounts[option]}</span>
                  </button>
                )
              })}
            </div>

            <label className="ml-auto flex items-center gap-2">
              <span className="sr-only">Sort jobs</span>
              <select
                aria-label="Sort jobs"
                className={`${fieldClass(isDark)} w-auto`}
                onChange={(event) => { setSortBy(event.target.value); setPage(1) }}
                value={sortBy}
              >
                {sortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
                <tr className={`border-b text-xs font-semibold ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>
                  {['Job', 'Location', 'Posted', 'Applicants', 'Visible on website', ''].map((column, index) => (
                    <th className="px-4 py-3 font-semibold" key={column || index} scope="col">
                      {column || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
                {pageJobs.map((job) => {
                  const applicantCount = job.applications.length
                  const newCount = countByStatus(job, 'New')
                  const modeLabel = job.location.toLowerCase().includes(job.workMode.toLowerCase()) ? null : job.workMode
                  return (
                    <tr
                      className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50/70'}`}
                      key={job.id}
                      onClick={() => setViewJobId(job.id)}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8462b]"
                          onClick={(event) => { event.stopPropagation(); setViewJobId(job.id) }}
                          type="button"
                        >
                          <span className="block text-sm font-semibold hover:underline">{job.title}</span>
                          <span className={`mt-0.5 block text-xs ${muted}`}>{job.consultant}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{job.location}</p>
                        <p className={`mt-0.5 text-xs ${muted}`}>{[modeLabel, job.employmentType].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-xs ${muted}`}>{formatDate(job.postedAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          aria-label={`View ${applicantCount} ${applicantCount === 1 ? 'applicant' : 'applicants'} for ${job.title}${newCount ? `, ${newCount} new` : ''}`}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                          onClick={(event) => { event.stopPropagation(); setViewJobId(job.id) }}
                          type="button"
                        >
                          <Icon className={`size-4 ${muted}`} name="user" />
                          <span className={`font-semibold tabular-nums ${applicantCount ? '' : muted}`}>{applicantCount}</span>
                          {newCount > 0 && (
                            <span className="rounded-full bg-[#a8462b] px-2 py-0.5 text-xs font-semibold text-white">{newCount} new</span>
                          )}
                          <Icon className={`size-3.5 ${muted}`} name="right" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5" onClick={(event) => event.stopPropagation()}>
                          <Switch
                            checked={job.visible}
                            isDark={isDark}
                            label={`${job.title} at ${job.consultant}: ${job.visible ? 'visible, switch to hide' : 'hidden, switch to show'}`}
                            onChange={() => toggleVisibility(job)}
                          />
                          <span className={`text-xs ${muted}`}>{job.visible ? 'Visible' : 'Hidden'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button aria-label={`Edit ${job.title}`} className={`rounded-md p-2 ${muted} ${isDark ? 'hover:bg-[#202d43]' : 'hover:bg-slate-100'}`} onClick={(event) => { event.stopPropagation(); setJobToEdit(job) }} title="Edit job" type="button"><Icon name="edit" /></button>
                          <button aria-label={`Delete ${job.title}`} className={`rounded-md p-2 ${muted} hover:bg-rose-50 hover:text-rose-600 ${isDark ? 'hover:bg-rose-400/10 hover:text-rose-300' : ''}`} onClick={(event) => { event.stopPropagation(); setJobToDelete(job) }} title="Delete job" type="button"><Icon name="trash" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!pageJobs.length && (
                  <tr>
                    <td className={`px-4 py-12 text-center text-sm ${muted}`} colSpan="6">
                      No internal jobs match your search and filters.{' '}
                      <button className="font-semibold underline underline-offset-2" onClick={clearFilters} type="button">Clear filters</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${line}`}>
            <p className={`text-xs ${muted}`}>Showing {filteredJobs.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs</p>
            <div className="flex items-center gap-2">
              <button className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`} disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
              <span className={`min-w-16 text-center text-xs ${muted}`}>Page {currentPage} of {pageCount}</span>
              <button className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`} disabled={currentPage >= pageCount} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
            </div>
          </footer>
        </section>
      )}

      {(showForm || jobToEdit) && (
        <JobForm isDark={isDark} job={jobToEdit} onClose={() => { setShowForm(false); setJobToEdit(null) }} onSave={saveJob} />
      )}
      {jobToView && (
        <ApplicantsPanel
          isDark={isDark}
          job={jobToView}
          onClose={() => setViewJobId(null)}
          onStatusChange={updateApplicationStatus}
        />
      )}
      {jobToDelete && (
        <DeleteDialog isDark={isDark} job={jobToDelete} onCancel={() => setJobToDelete(null)} onConfirm={deleteJob} />
      )}
    </div>
  )
}

function DeleteDialog({ job, isDark, onCancel, onConfirm }) {
  const dialogRef = useDialog(onCancel)
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/45" onClick={onCancel} />
      <section aria-labelledby="delete-job-title" aria-modal="true" className={`relative w-full max-w-[420px] rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`} ref={dialogRef} role="dialog" tabIndex={-1}>
        <h2 className="text-lg font-semibold" id="delete-job-title">Delete internal job?</h2>
        <p className={`mt-2 text-sm ${muted}`}>“{job.title}” and its {job.applications.length} demo {job.applications.length === 1 ? 'application' : 'applications'} will be removed. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className={`rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'}`} onClick={onCancel} type="button">Cancel</button>
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" onClick={onConfirm} type="button">Delete job</button>
        </div>
      </section>
    </div>
  )
}

export default InternalJobs
