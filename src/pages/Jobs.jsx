import { useEffect, useMemo, useRef, useState } from 'react'

const pageSize = 12

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    hidden: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.2 3.9M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.2 3-.5" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
}

function Jobs({ jobs, onJobsChange, onVisibilityChange, isDark }) {
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('All jobs')
  const [workModeFilter, setWorkModeFilter] = useState('All work modes')
  const [sourceFilter, setSourceFilter] = useState('All sources')
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
        (sourceFilter === 'All sources' || job.source === sourceFilter)
      )
    })
  }, [jobs, search, visibilityFilter, workModeFilter, sourceFilter])

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allFilteredSelected =
    filteredJobs.length > 0 && filteredJobs.every((job) => selectedIds.has(job.id))
  const someFilteredSelected =
    filteredJobs.some((job) => selectedIds.has(job.id)) && !allFilteredSelected
  const selectedJobs = jobs.filter((job) => selectedIds.has(job.id))
  const visibleCount = jobs.filter((job) => job.visible).length
  const hiddenCount = jobs.length - visibleCount
  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const selectClass = `h-10 rounded-lg border px-3 text-sm outline-none ${
    isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-800'
  }`

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  function updateFilters(update) {
    setPage(1)
    setSelectedIds(new Set())
    update()
  }

  function toggleOne(job) {
    const visible = !job.visible
    onJobsChange((current) =>
      current.map((entry) => entry.id === job.id ? { ...entry, visible } : entry),
    )
    onVisibilityChange([{ id: job.id, title: job.title, previousVisible: job.visible, visible }], 'platform')
  }

  function toggleSelected(visible) {
    const selected = new Set(selectedIds)
    const changedJobs = selectedJobs
      .filter((job) => job.visible !== visible)
      .map((job) => ({ id: job.id, title: job.title, previousVisible: job.visible, visible }))
    onJobsChange((current) =>
      current.map((job) => selected.has(job.id) ? { ...job, visible } : job),
    )
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

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5">
        <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Jobs</h1>
        <p className={`mt-1 text-sm ${muted}`}>All job listings on the platform. Search, filter, hide, or show jobs individually or in bulk.</p>
      </header>

      <section aria-label="Job listing summary" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total listings', value: jobs.length, icon: 'briefcase' },
          { label: 'Visible to users', value: visibleCount, icon: 'eye' },
          { label: 'Hidden listings', value: hiddenCount, icon: 'hidden' },
        ].map((metric) => (
          <article className={`rounded-xl border p-4 shadow-sm ${surface}`} key={metric.label}>
            <div className="flex items-center justify-between">
              <h2 className={`text-[11px] font-semibold tracking-wide uppercase ${muted}`}>{metric.label}</h2>
              <span className={muted}><Icon name={metric.icon} /></span>
            </div>
            <p className={`mt-2 text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#172033]'}`}>{metric.value}</p>
          </article>
        ))}
      </section>

      <section aria-label="Jobs list" className={`overflow-hidden rounded-xl border shadow-sm ${surface}`}>
        <div className={`flex flex-wrap items-center gap-2 border-b p-3 md:p-4 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>
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
          <label className="sr-only" htmlFor="jobs-source-filter">Filter by source</label>
          <select className={selectClass} id="jobs-source-filter" onChange={(event) => updateFilters(() => setSourceFilter(event.target.value))} value={sourceFilter}>
            <option>All sources</option>
            {[...new Set(jobs.map((job) => job.source))].sort().map((source) => <option key={source}>{source}</option>)}
          </select>
          <span className={`ml-auto px-2 text-xs ${muted}`}>{filteredJobs.length} jobs</span>
        </div>

        {selectedJobs.length > 0 && (
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${isDark ? 'bg-[#121e33]' : 'bg-slate-50'}`}>
            <span className={`text-sm font-medium ${muted}`}>{selectedJobs.length} selected</span>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 hover:bg-white'
                }`}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
              <tr className={`border-b text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>
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
                {['Job listing', 'Location', 'Source', 'Posted', 'Visibility', 'Action'].map((column) => (
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
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      job.visible
                        ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      aria-label={`${job.visible ? 'Hide' : 'Show'} ${job.title} at ${job.company}`}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                        isDark ? 'text-[#b8c9df] hover:bg-[#202d43] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      onClick={() => toggleOne(job)}
                      type="button"
                    >
                      <Icon name={job.visible ? 'hidden' : 'eye'} className="size-3.5" />
                      {job.visible ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {!pageJobs.length && (
                <tr>
                  <td className={`px-4 py-12 text-center text-sm ${muted}`} colSpan="7">No jobs match your search and filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>
          <p className={`text-xs ${muted}`}>Showing {filteredJobs.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs</p>
          <div className="flex items-center gap-2">
            <button
              className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`}
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              Previous
            </button>
            <span className={`min-w-16 text-center text-xs ${muted}`}>Page {currentPage} of {pageCount}</span>
            <button
              className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`}
              disabled={currentPage >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default Jobs
