import { useId, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const DAY_MS = 86400000
const ALL_SOURCES = 'All sources'
const RANGES = [7, 14, 30]
const MODES = [
  { id: 'listings', label: 'Posted' },
  { id: 'runs', label: 'Collected' },
]
/* Platform colors are assigned by alphabetical position, so a platform keeps its color when you filter. */
const palette = ['#2dd4bf', '#f59e0b', '#a78bfa', '#60a5fa', '#f472b6', '#34d399', '#fb923c', '#facc15']
const otherColor = '#94a3b8'
const numberFormat = new Intl.NumberFormat('en-IN')

function toTimestamp(date) {
  return Date.parse(`${date}T00:00:00Z`)
}

function toIso(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function formatTick(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatLongDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    arrow: <><path d="M7 17 17 7M8 7h9v9" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function FetchTooltip({ active, payload, isDark, series, unit }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const rows = series
    .map((item) => ({ ...item, value: row[item.key] ?? 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className={`min-w-[160px] rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-[#34445e] bg-[#18243a] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}>
      <p className="mb-1.5 font-medium">{formatLongDate(row.date)}</p>
      <p className="font-semibold tabular-nums">{numberFormat.format(row.total)} {unit}</p>
      {rows.length > 1 && (
        <ul className="mt-1.5 space-y-1">
          {rows.map((item) => (
            <li className="flex items-center gap-2" key={item.key}>
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className={isDark ? 'text-[#91a9c9]' : 'text-slate-500'}>{item.name}</span>
              <span className="ml-auto tabular-nums">{numberFormat.format(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Props
 * - jobs:           every job (used for the date window and platform counts)
 * - filteredJobs:   jobs after all table filters (drives the "Posted" view)
 * - sourceFilter:   current platform filter value ('All sources' or a source name)
 * - onSourceChange: called with a source name or 'All sources' when a chip is clicked
 * - sourceData:     optional, enables the "Collected" view from refresh runs
 * - embedded:       true when rendered inside another card (no border, chips shown first)
 */
function JobsFetchedChart({
  jobs = [],
  filteredJobs = [],
  sourceFilter = ALL_SOURCES,
  onSourceChange,
  sourceData,
  isDark,
  embedded = false,
}) {
  const uid = useId().replace(/:/g, '')
  const [mode, setMode] = useState('listings')
  const [range, setRange] = useState(14)

  const runsAvailable = Array.isArray(sourceData?.recentRuns)
  const activeMode = runsAvailable ? mode : 'listings'
  const unit = activeMode === 'runs' ? 'new jobs' : 'listings'
  const scopeLabel = sourceFilter === ALL_SOURCES ? 'All platforms' : sourceFilter

  const sourceNames = useMemo(() => {
    const names = new Set(jobs.map((job) => job.source))
    ;(sourceData?.sources ?? []).forEach((source) => names.add(source.name))
    return [...names].filter(Boolean).sort()
  }, [jobs, sourceData])

  const jobCountBySource = useMemo(() => {
    const counts = new Map()
    jobs.forEach((job) => counts.set(job.source, (counts.get(job.source) ?? 0) + 1))
    return counts
  }, [jobs])

  const colorFor = (name) =>
    name === 'Other' ? otherColor : palette[Math.max(0, sourceNames.indexOf(name)) % palette.length]

  const model = useMemo(() => {
    const isFiltered = sourceFilter !== ALL_SOURCES
    let events
    let anchorDates

    if (activeMode === 'runs') {
      const sourceLabels = new Map((sourceData?.sources ?? []).map((source) => [source.id, source.name]))
      const all = (sourceData?.recentRuns ?? [])
        .filter((run) => run.status === 'Success')
        .map((run) => ({
          date: String(run.finishedAt || run.startedAt || '').slice(0, 10),
          source: sourceLabels.get(run.sourceId) ?? 'Unknown',
          count: Number(run.newJobs) || 0,
        }))
        .filter((event) => event.date)
      anchorDates = all.map((event) => event.date)
      events = isFiltered ? all.filter((event) => event.source === sourceFilter) : all
    } else {
      anchorDates = jobs.map((job) => job.postedAt).filter(Boolean)
      events = filteredJobs
        .filter((job) => job.postedAt)
        .map((job) => ({ date: job.postedAt, source: job.source, count: 1 }))
    }

    // Anchor the window on the newest data (not today) so demo data always shows.
    const latest = anchorDates.reduce((best, date) => (date > best ? date : best), '')
    if (!latest) return null

    const endTimestamp = toTimestamp(latest)
    const startTimestamp = endTimestamp - (range - 1) * DAY_MS
    const previousStart = startTimestamp - range * DAY_MS

    const windowEvents = []
    let previousTotal = 0
    events.forEach((event) => {
      const timestamp = toTimestamp(event.date)
      if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
        windowEvents.push(event)
      } else if (timestamp >= previousStart && timestamp < startTimestamp) {
        previousTotal += event.count
      }
    })

    const series = [{
      key: 'total',
      name: scopeLabel,
      color: isFiltered ? colorFor(sourceFilter) : palette[0],
    }]

    const rows = new Map()
    for (let index = 0; index < range; index += 1) {
      const date = toIso(startTimestamp + index * DAY_MS)
      const row = { date, total: 0 }
      rows.set(date, row)
    }
    windowEvents.forEach((event) => {
      const row = rows.get(event.date)
      if (!row) return
      row.total += event.count
    })

    const data = [...rows.values()]
    const total = data.reduce((sum, row) => sum + row.total, 0)
    const peak = data.reduce((best, row) => (row.total > best.total ? row : best), data[0])

    return {
      data,
      series,
      total,
      average: total / range,
      peak,
      change: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
      runCount: activeMode === 'runs' ? (sourceData?.recentRuns ?? []).filter((run) => run.status === 'Success').length : 0,
    }
    // colorFor depends only on sourceNames, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, filteredJobs, jobs, range, sourceData, sourceFilter, sourceNames])

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const innerBorder = isDark ? 'border-[#34445e]' : 'border-slate-200'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const axisColor = isDark ? '#91a9c9' : '#718096'
  const gridColor = isDark ? '#29364d' : '#dce5f0'
  const dotStroke = isDark ? '#10192d' : '#ffffff'
  const hasData = Boolean(model && model.total > 0)

  const segmentClass = (active) =>
    `rounded-md px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? isDark ? 'bg-[#26344e] text-white' : 'bg-slate-100 text-slate-900'
        : `${muted} ${isDark ? 'hover:bg-[#18243a]' : 'hover:bg-slate-50'}`
    }`

  const chipClass = (active) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
      active
        ? isDark ? 'border-[#53657d] bg-[#202d43] text-white' : 'border-slate-400 bg-slate-100 text-slate-900'
        : isDark ? 'border-[#34445e] text-[#b8c9df] hover:bg-[#18243a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
    }`

  const trendUp = (model?.change ?? 0) >= 0

  const chips = (
    <div aria-label="Filter by platform" className="flex flex-wrap gap-2" role="group">
      <button aria-pressed={sourceFilter === ALL_SOURCES} className={chipClass(sourceFilter === ALL_SOURCES)} onClick={() => onSourceChange?.(ALL_SOURCES)} type="button">
        All platforms
        <span className={`tabular-nums ${muted}`}>{numberFormat.format(jobs.length)}</span>
      </button>
      {sourceNames.map((name) => (
        <button aria-pressed={sourceFilter === name} className={chipClass(sourceFilter === name)} key={name} onClick={() => onSourceChange?.(name)} type="button">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colorFor(name) }} />
          {name}
          <span className={`tabular-nums ${muted}`}>{numberFormat.format(jobCountBySource.get(name) ?? 0)}</span>
        </button>
      ))}
    </div>
  )

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={embedded ? 'p-4 md:p-5' : `mb-4 rounded-xl border p-4 shadow-sm md:p-5 ${surface}`}
    >
      {/* Embedded: the platform filter leads, so it reads as part of the filter bar above */}
      {embedded && (
        <div className={`mb-5 flex flex-wrap items-center gap-2 border-b pb-4 ${innerBorder}`}>
          <span className={`mr-1 text-xs font-medium ${muted}`}>Platform</span>
          {chips}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight" id={`${uid}-title`}>Jobs fetched</h3>
          <p className={`mt-1 flex flex-wrap items-center gap-2 text-sm ${muted}`}>
            {activeMode === 'runs' ? 'New jobs collected by refresh runs' : 'Listings by posted date'}
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-[#202d43] text-[#b8c9df]' : 'bg-slate-100 text-slate-600'}`}>
              {scopeLabel} · last {range} days
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {runsAvailable && (
            <div aria-label="Data view" className={`inline-flex rounded-lg border p-0.5 ${innerBorder}`} role="group">
              {MODES.map((item) => (
                <button aria-pressed={activeMode === item.id} className={segmentClass(activeMode === item.id)} key={item.id} onClick={() => setMode(item.id)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <div aria-label="Date range" className={`inline-flex rounded-lg border p-0.5 ${innerBorder}`} role="group">
            {RANGES.map((value) => (
              <button aria-pressed={range === value} className={segmentClass(range === value)} key={value} onClick={() => setRange(value)} type="button">
                {value}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform chips (standalone layout): same filter as the table below */}
      {!embedded && <div className="mt-4 flex flex-wrap gap-2">{chips}</div>}

      {/* Stats */}
      <dl className="mt-5 flex flex-wrap items-stretch gap-x-6 gap-y-3">
        <div>
          <dt className={`text-sm ${muted}`}>Total in period</dt>
          <dd className="mt-0.5 flex items-center gap-2 text-3xl font-bold tabular-nums">
            {numberFormat.format(model?.total ?? 0)}
            <span className={`text-sm font-normal ${muted}`}>{unit}</span>
            {model?.change != null && (
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                trendUp
                  ? isDark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  : isDark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-100 text-rose-700'
              }`} title="Compared with the previous period of the same length">
                {Math.abs(model.change).toFixed(1)}%
                <Icon className={`size-3.5 ${trendUp ? '' : 'rotate-90'}`} name="arrow" />
                <span className="sr-only">{trendUp ? 'up' : 'down'} compared with the previous period</span>
              </span>
            )}
          </dd>
        </div>
        <div className={`border-l pl-6 ${innerBorder}`}>
          <dt className={`text-sm ${muted}`}>Daily average</dt>
          <dd className="mt-0.5 text-3xl font-bold tabular-nums">
            {(model?.average ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            <span className={`ml-1.5 text-sm font-normal ${muted}`}>per day</span>
          </dd>
        </div>
        {hasData && (
          <div className={`hidden border-l pl-6 sm:block ${innerBorder}`}>
            <dt className={`text-sm ${muted}`}>Busiest day</dt>
            <dd className="mt-0.5 text-3xl font-bold tabular-nums">
              {numberFormat.format(model.peak.total)}
              <span className={`ml-1.5 text-sm font-normal ${muted}`}>{formatTick(model.peak.date)}</span>
            </dd>
          </div>
        )}
      </dl>

      {/* Chart */}
      <div
        aria-label={`${unit} for ${scopeLabel} over the last ${range} days, ${model?.total ?? 0} in total`}
        className="mt-4 h-[260px] w-full sm:h-[300px]"
        role="img"
      >
        {!hasData ? (
          <div className={`flex h-full items-center justify-center rounded-lg px-4 text-center text-sm ${isDark ? 'bg-[#121e33] text-[#91a9c9]' : 'bg-slate-50 text-slate-500'}`}>
            No {unit} for {scopeLabel} in this period. Try a longer range or clear a filter.
          </div>
        ) : (
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <LineChart data={model.data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={gridColor} strokeOpacity={0.8} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={formatTick}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, (max) => Math.max(3, Math.ceil(max * 1.1))]}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                tickMargin={8}
                width={44}
              />
              <Tooltip
                content={<FetchTooltip isDark={isDark} series={model.series} unit={unit} />}
                cursor={{ stroke: axisColor, strokeDasharray: '4 4', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Line
                activeDot={{ fill: model.series[0].color, r: 4, stroke: dotStroke, strokeWidth: 2 }}
                animationDuration={600}
                dataKey="total"
                dot={false}
                name={model.series[0].name}
                stroke={model.series[0].color}
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend for the layers (only when more than one platform is shown) */}
      {hasData && model.series.length > 1 && (
        <ul aria-label="Platform legend" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {model.series.map((item) => (
            <li className={`flex items-center gap-1.5 text-xs ${muted}`} key={item.key}>
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </li>
          ))}
        </ul>
      )}

      <p className={`mt-3 text-xs ${muted}`}>
        {activeMode === 'runs'
          ? `Counts new jobs from the latest ${model?.runCount ?? 0} successful refresh runs. Only the platform filter applies to this view.`
          : 'Counts follow every filter in the table below: search, visibility, work mode and platform.'}
      </p>
    </section>
  )
}

export default JobsFetchedChart
