import { useEffect, useMemo, useRef, useState } from 'react'

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

function Icon({ name, className = 'size-4' }) {
  const paths = {
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
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

function JobSources({ sourceData, onSourceDataChange, isDark }) {
  const [checkingIds, setCheckingIds] = useState(() => new Set())
  const [refreshingIds, setRefreshingIds] = useState(() => new Set())
  const [notice, setNotice] = useState('')
  const timers = useRef(new Map())
  const sources = sourceData.sources
  const sourceNames = useMemo(() => new Map(sources.map((source) => [source.id, source.name])), [sources])
  const workingCount = sources.filter((source) => source.status === 'Working').length
  const attentionCount = sources.length - workingCount
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
        sources: current.sources.map((entry) => entry.id === source.id ? { ...entry, lastCheckedAt: checkedAt } : entry),
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
        sources: current.sources.map((entry) => entry.id === source.id
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
          : entry),
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
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5">
        <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Job Sources</h1>
        <p className={`mt-1 text-sm ${muted}`}>{workingCount} working · {attentionCount} need attention</p>
      </header>

      <div className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${isDark ? 'border-sky-900/60 bg-sky-950/30 text-sky-200' : 'border-sky-100 bg-sky-50 text-sky-800'}`}>
        <span className="mt-0.5"><Icon name="clock" /></span>
        <p>Status checks and refreshes run in demo mode and update local sample data; they do not connect to external job boards.</p>
      </div>

      {notice && (
        <div className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${isDark ? 'border-[#34445e] bg-[#121e33] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`} role="status">
          <span>{notice}</span>
          <button aria-label="Dismiss notification" className={`shrink-0 text-xs font-semibold ${muted}`} onClick={() => setNotice('')} type="button">Dismiss</button>
        </div>
      )}

      <section aria-label="Job source health" className={`overflow-hidden rounded-xl border shadow-sm ${surface}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr className={`border-b text-xs font-semibold ${borderColor} ${muted}`}>
                {['Source', 'Status', 'Last run', 'Duration', 'Jobs saved (new)', 'Last 24h', 'Note', 'Actions'].map((heading) => (
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
                    <td className={`whitespace-nowrap px-3 py-3 text-sm ${muted}`}>{formatDateTime(source.lastRunAt)}</td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm ${muted}`}>{formatDuration(source.durationSeconds)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-center text-sm tabular-nums">
                      {source.jobsSaved.toLocaleString('en-IN')} <span className={muted}>({source.newJobs.toLocaleString('en-IN')} new)</span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm tabular-nums">{source.jobsLast24h.toLocaleString('en-IN')}</td>
                    <td className={`max-w-[280px] px-3 py-3 text-xs ${muted}`}>{source.note || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50'}`}
                          disabled={isChecking || isRefreshing}
                          onClick={() => checkStatus(source)}
                          type="button"
                        >
                          <Icon name="check" className="size-3.5" />
                          {isChecking ? 'Checking…' : 'Check status'}
                        </button>
                        <button
                          className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50'}`}
                          disabled={isRefreshing || isChecking}
                          onClick={() => startRefresh(source)}
                          type="button"
                        >
                          <Icon name="refresh" className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {isRefreshing ? 'Refreshing…' : 'Start refresh'}
                        </button>
                      </div>
                      {source.lastCheckedAt && (
                        <p className={`mt-1 text-right text-[10px] ${muted}`}>Checked {formatDateTime(source.lastCheckedAt)}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="recent-source-runs" className={`mt-5 overflow-hidden rounded-xl border shadow-sm ${surface}`}>
        <header className={`border-b px-4 py-4 md:px-5 ${borderColor}`}>
          <h2 className="text-sm font-semibold" id="recent-source-runs">Recent runs</h2>
          <p className={`mt-1 text-xs ${muted}`}>Latest refresh activity across all job sources.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>
              <tr className={`border-b text-xs font-semibold ${borderColor} ${muted}`}>
                {['Source', 'Started', 'Finished', 'Status', 'Jobs saved (new)', 'Note'].map((heading) => (
                  <th className="px-4 py-3 font-semibold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>
              {sourceData.recentRuns.length ? sourceData.recentRuns.map((run) => (
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
      </section>
    </div>
  )
}

export default JobSources
