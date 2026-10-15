import { useId, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dashboardData from '../store/Data.js'

/* ------------------------------------------------------------------ */
/* Tweak these to change the look. For amber-only (like the old bar    */
/* chart), set every stop color to '#f59e0b'.                          */
/* ------------------------------------------------------------------ */
const strokeStops = [
  { at: 0, color: '#2dd4bf' }, // teal
  { at: 0.5, color: '#f59e0b' }, // amber (your existing accent)
  { at: 1, color: '#a78bfa' }, // violet
]
const activeColor = '#3b82f6'
const RANGES = [7, 14, 30]
const numberFormat = new Intl.NumberFormat('en-IN')

function toDate(date) {
  return new Date(`${date}T00:00:00`)
}

function formatTick(date) {
  return toDate(date)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    .toUpperCase()
}

function formatLongDate(date) {
  return toDate(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function colorAt(ratio) {
  return strokeStops.reduce((best, stop) =>
    Math.abs(stop.at - ratio) < Math.abs(best.at - ratio) ? stop : best,
  ).color
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>,
    arrow: <><path d="M7 17 17 7M8 7h9v9" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function SignupsTooltip({ active, payload, average, peakDate }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  const diff = Math.round((item.count - average) * 10) / 10
  const note =
    item.note ??
    (item.date === peakDate
      ? 'Highest day in this range.'
      : diff === 0
        ? 'Right on the daily average.'
        : `${diff > 0 ? '+' : ''}${diff} vs daily average.`)

  // Light card on purpose: it stands out against both themes, like the reference.
  return (
    <div className="min-w-[190px] max-w-[230px] rounded-xl border border-[#dedbd2] bg-[#fffefa] px-4 py-3 text-[#20211e] shadow-xl shadow-black/25">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#68665f]">{formatTick(item.date)}</p>
      <p className="flex items-center gap-2 text-sm">
        <Icon className="size-4 text-[#68665f]" name="user" />
        <span>Sign-ups:</span>
        <strong className="tabular-nums">{item.count}</strong>
      </p>
      <p className="mt-2 flex items-start gap-2 text-xs leading-snug text-[#3d3e39]">
        <Icon className="mt-0.5 size-3.5 shrink-0 text-[#68665f]" name="rocket" />
        <span><strong>Note:</strong> {note}</span>
      </p>
    </div>
  )
}

function SignupChart({ isDark }) {
  const uid = useId().replace(/:/g, '')
  const [range, setRange] = useState(30)

  const allSignups = dashboardData.signupsLast30Days ?? []
  const signups = useMemo(() => allSignups.slice(-range), [allSignups, range])

  const text = isDark ? 'text-[#f2f0e9]' : 'text-[#20211e]'
  const muted = isDark ? 'text-[#a7a49b]' : 'text-[#68665f]'
  const axisColor = isDark ? '#a7a49b' : '#68665f'
  const gridColor = isDark ? '#42433d' : '#dedbd2'
  const markerFill = isDark ? '#242521' : '#fffefa'
  const divider = isDark ? 'border-[#42433d]' : 'border-[#dedbd2]'

  const stats = useMemo(() => {
    if (!signups.length) return { total: 0, average: 0, peakIndex: -1, peakDate: null, peakCount: 0, trend: null }

    const counts = signups.map((item) => Number(item.count) || 0)
    const total = counts.reduce((sum, value) => sum + value, 0)
    const peakCount = Math.max(...counts)
    const peakIndex = counts.indexOf(peakCount)

    // Trend = second half of the range vs. the first half.
    const half = Math.floor(counts.length / 2)
    const mean = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0)
    const previous = mean(counts.slice(0, half))
    const recent = mean(counts.slice(counts.length - half))
    const trend = half > 0 && previous > 0 ? ((recent - previous) / previous) * 100 : null

    return {
      total,
      average: Math.round((total / signups.length) * 10) / 10,
      peakIndex,
      peakDate: signups[peakIndex].date,
      peakCount,
      trend,
    }
  }, [signups])

  // Which points get an avatar marker: the peak plus a few evenly spaced points.
  const markerIndexes = useMemo(() => {
    const set = new Set()
    if (signups.length < 5) return set
    const last = signups.length - 1
    ;[0.15, 0.35, 0.6, 0.85].forEach((ratio) => set.add(Math.round(last * ratio)))
    set.add(stats.peakIndex)
    return set
  }, [signups.length, stats.peakIndex])

  const renderDot = ({ cx, cy, index }) => {
    const key = `marker-${index}`
    if (!markerIndexes.has(index) || cx == null || cy == null) return <g key={key} />
    const ring = colorAt(index / Math.max(1, signups.length - 1))

    return (
      <g key={key}>
        <circle cx={cx} cy={cy} fill={markerFill} r={11} stroke={ring} strokeWidth={2} />
        <circle cx={cx} cy={cy - 2.6} fill={axisColor} r={2.4} />
        <path d={`M${cx - 4.4} ${cy + 5.4}a4.4 4.4 0 0 1 8.8 0z`} fill={axisColor} />
      </g>
    )
  }

  const renderActiveDot = ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} fill={activeColor} opacity={0.22} r={17} />
      <circle cx={cx} cy={cy} fill={activeColor} r={8} stroke="#ffffff" strokeWidth={2.5} />
    </g>
  )

  function exportCsv() {
    const rows = [['Date', 'Sign-ups'], ...signups.map((item) => [item.date, item.count])]
    const csv = rows.map((row) => row.join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `signups-last-${range}-days.csv`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const trendUp = (stats.trend ?? 0) >= 0
  const trendStyle = trendUp
    ? isDark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    : isDark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-100 text-rose-700'

  return (
    <div className={text}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Sign-up growth</h2>
          <p className={`mt-1 flex items-center gap-2 text-sm ${muted}`}>
            Users signed up daily
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-[#30312c] text-[#d6d3c9]' : 'bg-[#eee9df] text-[#3d3e39]'}`}>
              last {signups.length} days
            </span>
          </p>
        </div>

        <div
          aria-label="Date range"
          className={`inline-flex rounded-lg border p-0.5 text-xs font-medium ${divider}`}
          role="group"
        >
          {RANGES.map((value) => (
            <button
              aria-pressed={range === value}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                range === value
                  ? isDark ? 'bg-[#30312c] text-[#f2f0e9]' : 'bg-[#eee9df] text-[#20211e]'
                  : `${muted} ${isDark ? 'hover:bg-[#2b2c27]' : 'hover:bg-[#f8f6f0]'}`
              }`}
              key={value}
              onClick={() => setRange(value)}
              type="button"
            >
              {value}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <dl className="mt-5 flex flex-wrap items-stretch gap-x-6 gap-y-3">
        <div>
          <dt className={`text-sm ${muted}`}>Total count</dt>
          <dd className="mt-0.5 text-3xl font-bold tabular-nums">
            {numberFormat.format(stats.total)}
            <span className={`ml-1.5 text-sm font-normal ${muted}`}>in {signups.length} days</span>
          </dd>
        </div>
        <div className={`border-l pl-6 ${divider}`}>
          <dt className={`text-sm ${muted}`}>Daily average</dt>
          <dd className="mt-0.5 text-3xl font-bold tabular-nums">
            {numberFormat.format(stats.average)}
            <span className={`ml-1.5 text-sm font-normal ${muted}`}>users/day</span>
          </dd>
        </div>
        {stats.peakDate && (
          <div className={`hidden border-l pl-6 sm:block ${divider}`}>
            <dt className={`text-sm ${muted}`}>Peak day</dt>
            <dd className="mt-0.5 text-3xl font-bold tabular-nums">
              {stats.peakCount}
              <span className={`ml-1.5 text-sm font-normal ${muted}`}>{formatTick(stats.peakDate)}</span>
            </dd>
          </div>
        )}
      </dl>

      {/* Chart */}
      <div
        aria-label={`Area chart showing daily sign-ups over the last ${signups.length} days`}
        className="relative mt-4 h-[300px] w-full sm:h-[340px]"
        role="img"
      >
        {stats.trend !== null && (
          <span className={`absolute left-11 top-1 z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${trendStyle}`}>
            trend {Math.abs(stats.trend).toFixed(1)}%
            <Icon className={`size-3.5 ${trendUp ? '' : 'rotate-90'}`} name="arrow" />
          </span>
        )}

        {signups.length === 0 ? (
          <div className={`flex h-full items-center justify-center text-sm ${muted}`}>No sign-up data for this period.</div>
        ) : (
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <AreaChart accessibilityLayer data={signups} margin={{ top: 16, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id={`${uid}-stroke`} x1="0" x2="1" y1="0" y2="0">
                  {strokeStops.map((stop) => (
                    <stop key={stop.at} offset={`${stop.at * 100}%`} stopColor={stop.color} />
                  ))}
                </linearGradient>
                <linearGradient id={`${uid}-fill`} x1="0" x2="1" y1="0" y2="0">
                  {strokeStops.map((stop) => (
                    <stop key={stop.at} offset={`${stop.at * 100}%`} stopColor={stop.color} />
                  ))}
                </linearGradient>
              </defs>

              <CartesianGrid stroke={gridColor} strokeOpacity={0.7} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                interval="preserveStartEnd"
                minTickGap={36}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={formatTick}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, 'dataMax + 1']}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                tickMargin={10}
                width={40}
              />
              <Tooltip
                content={<SignupsTooltip average={stats.average} peakDate={stats.peakDate} />}
                cursor={{ stroke: activeColor, strokeWidth: 1.5 }}
                isAnimationActive={false}
                offset={18}
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                activeDot={renderActiveDot}
                animationDuration={700}
                dataKey="count"
                dot={renderDot}
                fill={`url(#${uid}-fill)`}
                fillOpacity={isDark ? 0.28 : 0.22}
                name="Sign-ups"
                stroke={`url(#${uid}-stroke)`}
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      {/* <div className="mt-4 flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          onClick={exportCsv}
          type="button"
        >
          <Icon className="size-3.5" name="download" />
          Export data
        </button>
      </div> */}

      {/* Screen-reader data table */}
      <ul className="sr-only">
        {signups.map(({ date, count }) => (
          <li key={date}>{formatLongDate(date)}: {count} sign-ups</li>
        ))}
      </ul>
    </div>
  )
}

export default SignupChart
