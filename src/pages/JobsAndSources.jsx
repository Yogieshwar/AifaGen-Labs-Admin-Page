import { useEffect, useMemo, useRef, useState } from 'react'
import JobsFetchedChart from './JobsFetchedChart'

const pageSize = 12
const ALL_SOURCES = 'All sources'
const sections = [
  { id: 'listings', label: 'Listings' },
  { id: 'sources', label: 'Sources' },
  { id: 'runs', label: 'Runs' },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
    chevron: <><path d="m6 9 6 6 6-6" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
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

function IconButton({ label, onClick, disabled, isDark, children }) {
  return (
    <span className="group relative inline-flex">
      <button
        aria-label={label}
        className={`inline-flex size-9 items-center justify-center rounded-lg border transition disabled:cursor-wait disabled:opacity-60 ${
          isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50'
        }`}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

function SourceStatus({ status, isDark }) {
  const palette = {
    Working: isDark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'No jobs': isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700',
    Blocked: isDark ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700',
    Stalled: isDark ? 'border-orange-400/30 bg-orange-400/10 text-orange-300' : 'border-orange-200 bg-orange-50 text-orange-700',
  }

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${palette[status] ?? palette.Working}`}>
      {status}
    </span>
  )
}

function RunStatus({ status, isDark }) {
  const succeeded = status === 'Success'
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
      succeeded
        ? isDark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : isDark ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'
    }`}>
      {status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Job listings: toolbar, platform chips, chart and table in one card  */
/* ------------------------------------------------------------------ */

function Jobs({ jobs, onJobsChange, onVisibilityChange, sourceData, isDark }) {
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('All jobs')
  const [workModeFilter, setWorkModeFilter] = useState('All work modes')
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCES)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [page, setPage] = useState(1)
  const selectAllRef = useRef(null)

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      const matchesVisibility =
        visibilityFilter === 'All jobs' ||
        (visibilityFilter === 'Visible' ? job.visible : !job.visible)
      return (
        matchesSearch &&
        matchesVisibility &&
        (workModeFilter === 'All work modes' || job.workMode === workModeFilter) &&
        (sourceFilter === ALL_SOURCES || job.source === sourceFilter)
      )
    })
  }, [jobs, search, visibilityFilter, workModeFilter, sourceFilter])

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allFilteredSelected = filteredJobs.length > 0 && filteredJobs.every((job) => selectedIds.has(job.id))
  const someFilteredSelected = filteredJobs.some((job) => selectedIds.has(job.id)) && !allFilteredSelected
  const selectedJobs = jobs.filter((job) => selectedIds.has(job.id))
  const visibleCount = jobs.filter((job) => job.visible).length
  const hiddenCount = jobs.length - visibleCount

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const divider = isDark ? 'border-[#263249]' : 'border-slate-200'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const selectClass = `h-10 rounded-lg border px-3 text-sm outline-none ${
    isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-800'
  }`
  const ghostButton = `rounded-lg border px-3 py-2 text-xs font-semibold transition ${
    isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 bg-white hover:bg-slate-50'
  }`

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  function updateFilters(update) {
    setPage(1)
    setSelectedIds(new Set())
    update()
  }

  function clearFilters() {
    updateFilters(() => {
      setSearch('')
      setVisibilityFilter('All jobs')
      setWorkModeFilter('All work modes')
      setSourceFilter(ALL_SOURCES)
    })
  }

  function toggleOne(job) {
    const visible = !job.visible
    onJobsChange((current) => current.map((entry) => (entry.id === job.id ? { ...entry, visible } : entry)))
    onVisibilityChange([{ id: job.id, title: job.title, previousVisible: job.visible, visible }], 'platform')
  }

  function toggleSelected(visible) {
    const selected = new Set(selectedIds)
    const changedJobs = selectedJobs
      .filter((job) => job.visible !== visible)
      .map((job) => ({ id: job.id, title: job.title, previousVisible: job.visible, visible }))
    onJobsChange((current) => current.map((job) => (selected.has(job.id) ? { ...job, visible } : job)))
    if (changedJobs.length) onVisibilityChange(changedJobs, 'platform')
    setSelectedIds(new Set())
  }

  function toggleJobSelection(jobId) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allFilteredSelected) filteredJobs.forEach((job) => next.delete(job.id))
      else filteredJobs.forEach((job) => next.add(job.id))
      return next
    })
  }

  function exportCsv() {
    const rows = [
      ['Title', 'Company', 'Location', 'Work mode', 'Source', 'Posted', 'Visibility'],
      ...filteredJobs.map((job) => [job.title, job.company, job.location, job.workMode, job.source, job.postedAt, job.visible ? 'Visible' : 'Hidden']),
    ]
    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '')
            const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
            return `"${safe.replaceAll('"', '""')}"`
          })
          .join(','),
      )
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'jobs.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section aria-labelledby="listings-title" className={`scroll-mt-20 overflow-hidden rounded-xl border shadow-sm ${surface}`} id="listings">
      {/* Title row: one line, no eyebrow or description */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 md:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight" id="listings-title">Job listings</h2>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            isDark ? 'border-[#293854] text-slate-300' : 'border-slate-200 text-slate-600'
          }`}>
            <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
            {visibleCount} visible · {hiddenCount} hidden
          </span>
        </div>
        <button className={`inline-flex items-center gap-2 ${ghostButton}`} onClick={exportCsv} type="button">
          <Icon className="size-3.5" name="download" />
          Export CSV
        </button>
      </header>

      {/* Filters. The platform filter is the chip row inside the chart block below. */}
      <div className="flex flex-wrap items-center gap-2 p-4 md:px-5">
        <label className="relative min-w-[220px] flex-1 md:max-w-[340px]">
          <span className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${muted}`}><Icon name="search" /></span>
          <input
            aria-label="Search jobs by title, company, or location"
            className={`h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-2 ${
              isDark
                ? 'border-[#34445e] bg-[#10192d] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]'
                : 'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-200'
            }`}
            onChange={(event) => updateFilters(() => setSearch(event.target.value))}
            placeholder="Search title, company, or location..."
            type="search"
            value={search}
          />
        </label>

        <label className="sr-only" htmlFor="jobs-visibility-filter">Filter by visibility</label>
        <select className={selectClass} id="jobs-visibility-filter" onChange={(event) => updateFilters(() => setVisibilityFilter(event.target.value))} value={visibilityFilter}>
          {['All jobs', 'Visible', 'Hidden'].map((option) => <option key={option}>{option}</option>)}
        </select>

        <label className="sr-only" htmlFor="jobs-work-mode-filter">Filter by work mode</label>
        <select className={selectClass} id="jobs-work-mode-filter" onChange={(event) => updateFilters(() => setWorkModeFilter(event.target.value))} value={workModeFilter}>
          {['All work modes', 'On-site', 'Hybrid', 'Remote'].map((option) => <option key={option}>{option}</option>)}
        </select>

        <span className={`ml-auto px-2 text-xs ${muted}`}>{filteredJobs.length} jobs</span>
      </div>

      {/* Chart block: platform chips lead, then the chart */}
      <div className={`border-t ${divider}`}>
        <JobsFetchedChart
          embedded
          filteredJobs={filteredJobs}
          isDark={isDark}
          jobs={jobs}
          onSourceChange={(value) => updateFilters(() => setSourceFilter(value))}
          sourceData={sourceData}
          sourceFilter={sourceFilter}
        />
      </div>

      {selectedJobs.length > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 md:px-5 ${divider} ${isDark ? 'bg-[#121e33]' : 'bg-slate-50'}`}>
          <span className={`text-sm font-medium ${muted}`}>{selectedJobs.length} selected</span>
          <div className="flex flex-wrap gap-2">
            <button
              className={`${ghostButton} disabled:cursor-not-allowed disabled:opacity-40`}
              disabled={!selectedJobs.some((job) => job.visible)}
              onClick={() => toggleSelected(false)}
              type="button"
            >
              Hide selected
            </button>
            <button
              className="rounded-lg bg-[#172033] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#26344e] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!selectedJobs.some((job) => !job.visible)}
              onClick={() => toggleSelected(true)}
              type="button"
            >
              Show selected
            </button>
            <button className={`rounded-lg px-3 py-2 text-xs font-semibold ${muted}`} onClick={() => setSelectedIds(new Set())} type="button">
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-x-auto border-t ${divider}`}>
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
            <tr className={`border-b text-xs font-semibold ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>
              <th className="w-10 px-4 py-3">
                <input
                  aria-label="Select all filtered jobs"
                  checked={allFilteredSelected}
                  className="size-4 accent-[#172033]"
                  onChange={toggleAllFiltered}
                  ref={selectAllRef}
                  type="checkbox"
                />
              </th>
              {['Job listing', 'Location', 'Source', 'Posted', 'Visible to users'].map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
            {pageJobs.map((job) => (
              <tr className={isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50/70'} key={job.id}>
                <td className="px-4 py-3">
                  <input
                    aria-label={`Select ${job.title} at ${job.company}`}
                    checked={selectedIds.has(job.id)}
                    className="size-4 accent-[#172033]"
                    onChange={() => toggleJobSelection(job.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{job.title}</p>
                  <p className={`mt-0.5 text-xs ${muted}`}>{job.company} · {job.workMode}</p>
                </td>
                <td className={`px-4 py-3 text-xs ${muted}`}>{job.location}</td>
                <td className={`px-4 py-3 text-xs ${muted}`}>{job.source}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-xs ${muted}`}>{formatDate(job.postedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Switch
                      checked={job.visible}
                      isDark={isDark}
                      label={`${job.title} at ${job.company}: ${job.visible ? 'visible, switch to hide' : 'hidden, switch to show'}`}
                      onChange={() => toggleOne(job)}
                    />
                    <span className={`text-xs ${muted}`}>{job.visible ? 'Visible' : 'Hidden'}</span>
                  </div>
                </td>
              </tr>
            ))}
            {!pageJobs.length && (
              <tr>
                <td className={`px-4 py-12 text-center text-sm ${muted}`} colSpan="6">
                  No jobs match your search and filters.{' '}
                  <button className="font-semibold underline underline-offset-2" onClick={clearFilters} type="button">Clear filters</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 md:px-5 ${divider}`}>
        <p className={`text-xs ${muted}`}>
          Showing {filteredJobs.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
        </p>
        <div className="flex items-center gap-2">
          <button className={`${ghostButton} disabled:opacity-40`} disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
          <span className={`min-w-16 text-center text-xs ${muted}`}>Page {currentPage} of {pageCount}</span>
          <button className={`${ghostButton} disabled:opacity-40`} disabled={currentPage >= pageCount} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
        </div>
      </footer>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Job sources + recent runs                                           */
/* ------------------------------------------------------------------ */

function JobSources({ sourceData, onSourceDataChange, runsOpen, onRunsOpenChange, isDark }) {
  const [checkingIds, setCheckingIds] = useState(() => new Set())
  const [refreshingIds, setRefreshingIds] = useState(() => new Set())
  const [notice, setNotice] = useState('')
  const timers = useRef(new Map())
  const sources = sourceData.sources
  const sourceNames = useMemo(() => new Map(sources.map((source) => [source.id, source.name])), [sources])
  const attentionCount = sources.filter((source) => source.status !== 'Working').length
  const runs = sourceData.recentRuns
  const failedRuns = runs.filter((run) => run.status !== 'Success').length
  const latestRun = runs[0]

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const borderColor = isDark ? 'border-[#263249]' : 'border-slate-200'

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  function checkStatus(source) {
    setNotice('')
    setCheckingIds((current) => new Set(current).add(source.id))
    const timer = window.setTimeout(() => {
      const checkedAt = new Date().toISOString()
      onSourceDataChange((current) => ({
        ...current,
        sources: current.sources.map((entry) => (entry.id === source.id ? { ...entry, lastCheckedAt: checkedAt } : entry)),
      }))
      setCheckingIds((current) => {
        const next = new Set(current)
        next.delete(source.id)
        return next
      })
      setNotice(`${source.name}: status checked — ${source.status}.`)
      timers.current.delete(`check-${source.id}`)
    }, 500)
    timers.current.set(`check-${source.id}`, timer)
  }

  function startRefresh(source) {
    setNotice('')
    setRefreshingIds((current) => new Set(current).add(source.id))
    const startedAt = new Date().toISOString()
    const timer = window.setTimeout(() => {
      const finishedAt = new Date().toISOString()
      const failed = source.refreshResult !== 'success'
      const newJobs = failed ? 0 : 12 + (source.jobsSaved % 37)
      const savedJobs = failed ? 0 : newJobs + 80 + (source.jobsSaved % 110)
      const note = source.refreshResult === 'blocked'
        ? 'Source is rate-limiting our requests (HTTP 429).'
        : source.refreshResult === 'stalled'
          ? 'Run has exceeded 4× its normal duration.'
          : source.refreshResult === 'empty'
            ? 'Refresh completed but returned zero listings.'
            : '—'
      const run = {
        id: `source-run-${source.id}-${Date.now()}`,
        sourceId: source.id,
        startedAt,
        finishedAt,
        status: failed ? 'Failed' : 'Success',
        jobsSaved: savedJobs,
        newJobs,
        note,
      }
      const durationSeconds = Math.max(10, Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000))

      onSourceDataChange((current) => ({
        sources: current.sources.map((entry) => (entry.id === source.id
          ? {
            ...entry,
            lastRunAt: finishedAt,
            durationSeconds,
            jobsSaved: failed ? entry.jobsSaved : entry.jobsSaved + savedJobs,
            newJobs,
            jobsLast24h: failed ? entry.jobsLast24h : entry.jobsLast24h + newJobs,
            note,
            lastCheckedAt: finishedAt,
          }
          : entry)),
        recentRuns: [run, ...current.recentRuns].slice(0, 40),
      }))
      setRefreshingIds((current) => {
        const next = new Set(current)
        next.delete(source.id)
        return next
      })
      setNotice(failed
        ? `${source.name} refresh failed in demo mode. ${note}`
        : `${source.name} refresh completed in demo mode. ${savedJobs} jobs saved, including ${newJobs} new.`)
      timers.current.delete(`refresh-${source.id}`)
    }, 1100)
    timers.current.set(`refresh-${source.id}`, timer)
  }

  return (
    <>
      <section aria-labelledby="sources-title" className={`scroll-mt-20 overflow-hidden rounded-xl border shadow-sm ${surface}`} id="sources">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
          <h2 className="text-lg font-semibold tracking-tight" id="sources-title">Job sources</h2>
          {attentionCount > 0 && (
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
              isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {attentionCount} need attention
            </span>
          )}
        </header>

        {notice && (
          <div className={`flex items-start justify-between gap-3 border-t px-4 py-3 text-sm md:px-5 ${borderColor} ${isDark ? 'bg-[#121e33] text-slate-200' : 'bg-slate-50 text-slate-700'}`} role="status">
            <span>{notice}</span>
            <button aria-label="Dismiss notification" className={`shrink-0 text-xs font-semibold ${muted}`} onClick={() => setNotice('')} type="button">Dismiss</button>
          </div>
        )}

        <div className={`overflow-x-auto border-t ${borderColor}`}>
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
              <tr className={`border-b text-xs font-semibold ${borderColor} ${muted}`}>
                {['Source', 'Status', 'Last run', 'Jobs saved (new)', 'Last 24h', 'Note', 'Actions'].map((heading) => (
                  <th className={`px-3 py-3 font-semibold ${heading === 'Actions' ? 'text-right' : ''}`} key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-200'}`}>
              {sources.map((source) => {
                const isChecking = checkingIds.has(source.id)
                const isRefreshing = refreshingIds.has(source.id)
                return (
                  <tr className={isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50/70'} key={source.id}>
                    <td className="px-3 py-3 text-sm font-semibold">{source.name}</td>
                    <td className="px-3 py-3"><SourceStatus isDark={isDark} status={source.status} /></td>
                    <td className="px-3 py-3">
                      <p className="whitespace-nowrap text-sm">{formatDateTime(source.lastRunAt)}</p>
                      <p className={`mt-0.5 whitespace-nowrap text-xs ${muted}`}>
                        {formatDuration(source.durationSeconds)}
                        {source.lastCheckedAt ? ` · checked ${formatDateTime(source.lastCheckedAt)}` : ''}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center text-sm tabular-nums">
                      {source.jobsSaved.toLocaleString('en-IN')} <span className={muted}>({source.newJobs.toLocaleString('en-IN')} new)</span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm tabular-nums">{source.jobsLast24h.toLocaleString('en-IN')}</td>
                    <td className={`max-w-[260px] px-3 py-3 text-xs ${muted}`}>
                      <p className="line-clamp-2" title={source.note || undefined}>{source.note || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton disabled={isChecking || isRefreshing} isDark={isDark} label={isChecking ? 'Checking…' : 'Check status'} onClick={() => checkStatus(source)}>
                          <Icon className="size-4" name="check" />
                        </IconButton>
                        <IconButton disabled={isRefreshing || isChecking} isDark={isDark} label={isRefreshing ? 'Refreshing…' : 'Start refresh'} onClick={() => startRefresh(source)}>
                          <Icon className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} name="refresh" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className={`border-t px-4 py-3 text-xs md:px-5 ${borderColor} ${muted}`}>
          {/* Demo mode: status checks and refreshes update local sample data and do not contact external job boards. */}
        </p>
      </section>

      {/* Recent runs: collapsed by default */}
      <section className={`scroll-mt-20 overflow-hidden rounded-xl border shadow-sm ${surface}`} id="runs">
        <h2>
          <button
            aria-controls="runs-panel"
            aria-expanded={runsOpen}
            className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition md:px-5 ${isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50'}`}
            onClick={() => onRunsOpenChange(!runsOpen)}
            type="button"
          >
            <span>
              <span className="block text-lg font-semibold tracking-tight">Recent runs</span>
              <span className={`mt-0.5 block text-xs font-normal ${muted}`}>
                {runs.length} runs · {failedRuns} failed
                {latestRun ? ` · latest: ${sourceNames.get(latestRun.sourceId) ?? 'Unknown source'}, ${latestRun.status.toLowerCase()}, ${formatDateTime(latestRun.finishedAt)}` : ''}
              </span>
            </span>
            <Icon className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${muted} ${runsOpen ? 'rotate-180' : ''}`} name="chevron" />
          </button>
        </h2>

        {runsOpen && (
          <div className={`overflow-x-auto border-t ${borderColor}`} id="runs-panel">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
                <tr className={`border-b text-xs font-semibold ${borderColor} ${muted}`}>
                  {['Source', 'Started', 'Finished', 'Status', 'Jobs saved (new)', 'Note'].map((heading) => (
                    <th className="px-4 py-3 font-semibold" key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
                {runs.length ? runs.map((run) => (
                  <tr className={isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50/70'} key={run.id}>
                    <td className="px-4 py-3 text-sm font-medium">{sourceNames.get(run.sourceId) ?? 'Unknown source'}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-sm ${muted}`}>{formatDateTime(run.startedAt)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-sm ${muted}`}>{formatDateTime(run.finishedAt)}</td>
                    <td className="px-4 py-3"><RunStatus isDark={isDark} status={run.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums">
                      {run.jobsSaved.toLocaleString('en-IN')} <span className={muted}>({run.newJobs.toLocaleString('en-IN')} new)</span>
                    </td>
                    <td className={`max-w-[360px] px-4 py-3 text-xs ${muted}`}>{run.note || '—'}</td>
                  </tr>
                )) : (
                  <tr><td className={`px-4 py-10 text-center text-sm ${muted}`} colSpan="6">No source runs recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * Combined single-page view for the Jobs and Job Sources dashboards.
 * Pass the same props that were previously passed to each page.
 */
export default function JobsAndSources({
  jobs,
  onJobsChange,
  onVisibilityChange,
  sourceData,
  onSourceDataChange,
  isDark,
}) {
  const [activeSection, setActiveSection] = useState('listings')
  const [runsOpen, setRunsOpen] = useState(false)
  const lockUntil = useRef(0)

  const workingSources = sourceData.sources.filter((source) => source.status === 'Working').length
  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'

  // Highlight the section that is currently near the top of the screen.
  useEffect(() => {
    const elements = sections.map((section) => document.getElementById(section.id)).filter(Boolean)
    if (!('IntersectionObserver' in window) || !elements.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return
        const inBand = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (inBand[0]) setActiveSection(inBand[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  function jumpTo(id) {
    lockUntil.current = Date.now() + 900
    setActiveSection(id)
    if (id === 'runs') setRunsOpen(true)
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <div className={`mx-auto max-w-[1600px] space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* The only big header on the page */}
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Jobs &amp; Sources
          </h1>
          <p className={`mt-2 max-w-xl text-sm leading-6 sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage job listings, control which are visible, and keep an eye on your collection pipeline.
          </p>
        </div>

        <dl className={`flex divide-x self-start rounded-xl border shadow-sm lg:self-auto ${surface} ${isDark ? 'divide-[#263249]' : 'divide-slate-200'}`}>
          <div className="px-5 py-3">
            <dt className={`text-xs ${muted}`}>Total listings</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{jobs.length.toLocaleString('en-IN')}</dd>
          </div>
          <div className="px-5 py-3">
            <dt className={`text-xs ${muted}`}>Healthy sources</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">
              {workingSources}
              <span className={`ml-1 text-sm font-medium ${muted}`}>/ {sourceData.sources.length}</span>
            </dd>
          </div>
        </dl>
      </header>

      {/* Sticky section nav */}
      <nav
        aria-label="Page sections"
        className={`sticky top-2 z-30 flex w-fit items-center gap-1 rounded-xl border p-1 shadow-sm backdrop-blur ${
          isDark ? 'border-[#263249] bg-[#10192d]/90' : 'border-slate-200 bg-white/90'
        }`}
      >
        {sections.map((section) => (
          <button
            aria-current={activeSection === section.id ? 'location' : undefined}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              activeSection === section.id
                ? isDark ? 'bg-[#26344e] text-white' : 'bg-[#172033] text-white'
                : `${muted} ${isDark ? 'hover:bg-[#18243a]' : 'hover:bg-slate-100'}`
            }`}
            key={section.id}
            onClick={() => jumpTo(section.id)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </nav>

      <Jobs
        isDark={isDark}
        jobs={jobs}
        onJobsChange={onJobsChange}
        onVisibilityChange={onVisibilityChange}
        sourceData={sourceData}
      />

      <JobSources
        isDark={isDark}
        onRunsOpenChange={setRunsOpen}
        onSourceDataChange={onSourceDataChange}
        runsOpen={runsOpen}
        sourceData={sourceData}
      />
    </div>
  )
}
