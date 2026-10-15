import { useId, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const DAY_MS = 86400000
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* Short labels for the period toggle. Falls back to the full label. */
const periodShortLabels = {
  'Last 7 days': '7D',
  'Last 30 days': '1M',
  'Last 90 days': '3M',
  'All time': 'All',
}

/* Colors per trend type. `paid` follows the reference (green with amber glow). */
const tones = {
  paid: { line: '#0b6b4f', lineDark: '#34d399', area: '#10b981', coinLight: '#34d399', coinDark: '#065f46', arrow: '#22c55e' },
  failed: { line: '#be123c', lineDark: '#fb7185', area: '#f43f5e', coinLight: '#fb7185', coinDark: '#9f1239', arrow: '#fb7185' },
  refunded: { line: '#475569', lineDark: '#94a3b8', area: '#64748b', coinLight: '#94a3b8', coinDark: '#334155', arrow: '#94a3b8' },
}

const copy = {
  paid: {
    title: 'Revenue trend (INR)',
    description: 'Successful payments over the selected period.',
    total: 'Collected revenue',
    stat: 'Revenue this period (₹)',
    labels: { best: 'Best day', high: 'High collection', target: 'Target met' },
  },
  failed: {
    title: 'Failed payment trend (INR)',
    description: 'Failed payment amounts over the selected period.',
    total: 'Failed amount',
    stat: 'Failed this period (₹)',
    labels: { best: 'Worst day', high: 'High failures' },
  },
  refunded: {
    title: 'Refund trend (INR)',
    description: 'Refunded payment amounts over the selected period.',
    total: 'Refunded amount',
    stat: 'Refunded this period (₹)',
    labels: { best: 'Peak refunds', high: 'High refunds' },
  },
}

function getRefundedAmount(payment) {
  if (Number.isFinite(payment.refundedAmount)) return payment.refundedAmount
  return payment.status === 'refunded' ? payment.amount : 0
}

/* Same rules the Payments page already uses for each trend type. */
function amountFor(payment, trendStatus) {
  const refundedAmount = getRefundedAmount(payment)
  if (trendStatus === 'paid') {
    return ['paid', 'partially_refunded'].includes(payment.status) ? payment.amount - refundedAmount : 0
  }
  if (trendStatus === 'refunded') return refundedAmount
  return payment.status === trendStatus ? payment.amount : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
}

function formatWhole(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function compactInr(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `₹${Math.round(value)}`
}

function monthDay(iso) {
  const [, month, day] = iso.split('-')
  return `${monthNames[Number(month) - 1]} ${day}`
}

function segmentLabel(startIso, endIso) {
  if (startIso === endIso) return monthDay(startIso)
  const [, startMonth] = startIso.split('-')
  const [, endMonth, endDay] = endIso.split('-')
  return startMonth === endMonth ? `${monthDay(startIso)}–${endDay}` : `${monthDay(startIso)}–${monthDay(endIso)}`
}

/* Splits the series into up to 5 equal chunks for the strip under the chart. */
function buildSegments(series) {
  const count = series.length <= 7 ? series.length : 5
  if (!count) return []
  const size = series.length / count

  return Array.from({ length: count }, (_, index) => {
    const from = Math.round(index * size)
    const to = Math.max(from, Math.round((index + 1) * size) - 1)
    const slice = series.slice(from, to + 1)
    return {
      label: segmentLabel(series[from].date, series[to].date),
      total: slice.reduce((sum, item) => sum + item.amount, 0),
    }
  })
}

/* Picks which points get coin markers, labels and rising arrows. */
function pickMarkers(values, labels, dailyTarget) {
  const markers = new Map()
  const count = values.length
  const max = Math.max(0, ...values)
  if (count < 5 || max <= 0) return markers

  const peaks = []
  const troughs = []
  for (let i = 1; i < count - 1; i += 1) {
    if (values[i] > values[i - 1] && values[i] >= values[i + 1]) peaks.push(i)
    else if (values[i] < values[i - 1] && values[i] <= values[i + 1]) troughs.push(i)
  }

  const gap = Math.max(2, Math.round(count / 10))
  const choose = (candidates, compare, limit) => {
    const chosen = []
    ;[...candidates].sort(compare).forEach((index) => {
      if (chosen.length < limit && chosen.every((other) => Math.abs(other - index) >= gap)) chosen.push(index)
    })
    return chosen
  }

  const peakIndexes = choose(peaks, (a, b) => values[b] - values[a], 6)
  const troughIndexes = choose(troughs, (a, b) => values[a] - values[b], 4)

  const labelGap = Math.max(gap, Math.round(count / 5))
  const labeled = []
  peakIndexes.forEach((index) => {
    if (labeled.length < 3 && values[index] >= max * 0.6 && labeled.every((other) => Math.abs(other - index) >= labelGap)) {
      labeled.push(index)
    }
  })

  peakIndexes.forEach((index) => markers.set(index, { type: 'peak', label: null }))
  labeled.forEach((index, order) => {
    const hitTarget = dailyTarget && labels.target && values[index] >= dailyTarget
    markers.set(index, { type: 'peak', label: hitTarget ? labels.target : order === 0 ? labels.best : labels.high })
  })
  troughIndexes.forEach((index) => markers.set(index, { type: 'trough' }))

  // A rising arrow halfway between each trough and the next peak.
  troughIndexes.forEach((trough) => {
    const nextPeak = peakIndexes.filter((peak) => peak > trough).sort((a, b) => a - b)[0]
    if (nextPeak === undefined || nextPeak - trough < 3) return
    const middle = Math.floor((trough + nextPeak) / 2)
    if (!markers.has(middle)) markers.set(middle, { type: 'arrow' })
  })

  return markers
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function RevenueTooltip({ active, payload, isDark, totalLabel, average }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const difference = average > 0 ? Math.round(((item.amount - average) / average) * 100) : null

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-[#34445e] bg-[#18243a] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}>
      <p className="mb-1 font-medium">{formatDate(item.date)}</p>
      <p className="font-semibold tabular-nums">{totalLabel}: {formatCurrency(item.amount)}</p>
      {difference !== null && (
        <p className={`mt-1 tabular-nums ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>
          {difference >= 0 ? '+' : ''}{difference}% vs daily average
        </p>
      )}
    </div>
  )
}

function RevenueTrendCard({
  payments = [],
  isDark,
  trendStatus = 'paid',
  dateRange,
  dateRanges = [],
  onDateRangeChange,
  dailyTarget,
}) {
  const uid = useId().replace(/:/g, '')
  const text = copy[trendStatus] ?? copy.paid
  const tone = tones[trendStatus] ?? tones.paid
  const lineColor = isDark ? tone.lineDark : tone.line
  const days = dateRanges.find((range) => range.label === dateRange)?.days ?? 30

  const model = useMemo(() => {
    const latest = payments.reduce((best, payment) => (payment.date > best ? payment.date : best), '')
    if (!latest) return null

    const toTimestamp = (date) => Date.parse(`${date}T00:00:00Z`)
    const toIso = (timestamp) => new Date(timestamp).toISOString().slice(0, 10)
    const earliest = payments.reduce((best, payment) => (!best || payment.date < best ? payment.date : best), '')

    const endTimestamp = toTimestamp(latest)
    const startTimestamp = days ? endTimestamp - (days - 1) * DAY_MS : toTimestamp(earliest)
    const dayCount = Math.round((endTimestamp - startTimestamp) / DAY_MS) + 1

    const dailyTotals = new Map()
    let previousTotal = 0
    payments.forEach((payment) => {
      const amount = amountFor(payment, trendStatus)
      if (amount <= 0) return
      const timestamp = toTimestamp(payment.date)
      if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
        dailyTotals.set(payment.date, (dailyTotals.get(payment.date) ?? 0) + amount)
      } else if (days && timestamp >= startTimestamp - dayCount * DAY_MS && timestamp < startTimestamp) {
        previousTotal += amount
      }
    })

    // One point per day, including days with no payments, so the shape is honest.
    const series = Array.from({ length: dayCount }, (_, index) => {
      const date = toIso(startTimestamp + index * DAY_MS)
      return { date, amount: dailyTotals.get(date) ?? 0 }
    })
    const total = series.reduce((sum, item) => sum + item.amount, 0)
    const average = total / dayCount

    return {
      series,
      total,
      average,
      change: days && previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
      segments: buildSegments(series),
      markers: pickMarkers(
        series.map((item) => item.amount),
        text.labels,
        trendStatus === 'paid' ? dailyTarget : undefined,
      ),
    }
  }, [payments, days, trendStatus, text.labels, dailyTarget])

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const innerBorder = isDark ? 'border-[#263249]' : 'border-slate-200'
  const divide = isDark ? 'divide-[#263249]' : 'divide-slate-200'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const axisColor = isDark ? '#91a9c9' : '#718096'
  const gridColor = isDark ? '#29364d' : '#dce5f0'
  const coinRing = isDark ? '#a7f3d0' : '#d1fae5'
  const warmOpacity = isDark ? 0.14 : 0.22

  const orderedRanges = [...dateRanges].sort((a, b) => (a.days || Infinity) - (b.days || Infinity))
  const hasData = Boolean(model && model.total > 0)
  const changeIsGood = trendStatus === 'paid' ? (model?.change ?? 0) >= 0 : (model?.change ?? 0) <= 0

  const renderDot = ({ cx, cy, index }) => {
    const key = `marker-${index}`
    const marker = model?.markers.get(index)
    if (!marker || cx == null || cy == null) return <g key={key} />

    if (marker.type === 'arrow') {
      return (
        <path
          d={`M${cx} ${cy - 7}V${cy - 17}M${cx - 4} ${cy - 13}L${cx} ${cy - 17.5}L${cx + 4} ${cy - 13}`}
          fill="none"
          key={key}
          stroke={tone.arrow}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      )
    }

    const radius = marker.type === 'peak' ? 10 : 8
    const ratio = index / Math.max(1, model.series.length - 1)
    const anchor = ratio > 0.85 ? 'end' : ratio < 0.15 ? 'start' : 'middle'
    const textX = anchor === 'end' ? cx + 12 : anchor === 'start' ? cx - 12 : cx

    return (
      <g key={key}>
        <circle cx={cx} cy={cy} fill={tone.coinLight} opacity={0.2} r={radius + 4} />
        <circle cx={cx} cy={cy} fill={`url(#${uid}-coin)`} r={radius} stroke={coinRing} strokeWidth={1.5} />
        <text dominantBaseline="central" fill="#ffffff" fontSize={radius * 1.1} fontWeight={700} textAnchor="middle" x={cx} y={cy + 0.5}>₹</text>
        {marker.label && (
          <text fontSize={13} textAnchor={anchor} x={textX} y={cy - radius - 10}>
            <tspan fill={lineColor} fontWeight={700}>{compactInr(model.series[index].amount)}</tspan>
            <tspan fill={axisColor}> ({marker.label})</tspan>
          </text>
        )}
      </g>
    )
  }

  const renderActiveDot = ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} fill={tone.coinLight} opacity={0.25} r={14} />
      <circle cx={cx} cy={cy} fill={lineColor} r={6} stroke={isDark ? '#10192d' : '#ffffff'} strokeWidth={2.5} />
    </g>
  )

  return (
    <section aria-labelledby="revenue-trend-title" className={`payment-panel mt-4 rounded-xl border p-4 md:p-5 ${surface}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full text-2xl font-bold text-white"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${tone.coinLight}, ${tone.coinDark})`,
              border: `2px solid ${coinRing}`,
              boxShadow: isDark ? `0 0 20px ${tone.coinLight}66` : `0 0 18px ${tone.coinLight}55`,
            }}
          >
            ₹
          </span> */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight" id="revenue-trend-title">{text.title}</h2>
              <span className="group relative inline-flex">
                <button
                  aria-describedby={`${uid}-info`}
                  aria-label={`Show total ${text.total.toLowerCase()}`}
                  className={`rounded-full ${muted} focus-visible:outline-2 focus-visible:outline-offset-2`}
                  type="button"
                >
                  <Icon className="size-[18px]" name="info" />
                </button>
                <span
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  id={`${uid}-info`}
                  role="tooltip"
                >
                  Total {text.total} (INR): <strong className="tabular-nums">{formatCurrency(model?.total ?? 0)}</strong>
                </span>
              </span>
            </div>
            <p className={`mt-1 text-sm ${muted}`}>{text.description}</p>
          </div>
        </div>

        {orderedRanges.length > 0 && (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${muted}`}>Period</span>
            <div aria-label="Revenue period" className={`inline-flex rounded-lg border p-0.5 ${innerBorder}`} role="group">
              {orderedRanges.map((range) => (
                <button
                  aria-pressed={range.label === dateRange}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    range.label === dateRange
                      ? isDark ? 'bg-[#26344e] text-white' : 'bg-slate-100 text-[#172033]'
                      : `${muted} ${isDark ? 'hover:bg-[#18243a]' : 'hover:bg-slate-50'}`
                  }`}
                  key={range.label}
                  onClick={() => onDateRangeChange?.(range.label)}
                  title={range.label}
                  type="button"
                >
                  {periodShortLabels[range.label] ?? range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div
        aria-label={`${text.total} trend, ${formatWhole(model?.total ?? 0)} over ${model?.series.length ?? 0} days`}
        className="mt-4 h-[300px] w-full sm:h-[340px]"
        role="img"
      >
        {!hasData ? (
          <div className={`flex h-full items-center justify-center rounded-lg text-sm ${isDark ? 'bg-[#121e33] text-[#91a9c9]' : 'bg-slate-50 text-slate-500'}`}>
            No {trendStatus} transactions in this date range.
          </div>
        ) : (
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <AreaChart data={model.series} margin={{ top: 48, right: 16, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id={`${uid}-fill`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={tone.area} stopOpacity={isDark ? 0.55 : 0.6} />
                  <stop offset="55%" stopColor={tone.area} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={tone.area} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${uid}-warm`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0} />
                  <stop offset="32%" stopColor="#f59e0b" stopOpacity={0} />
                  <stop offset="45%" stopColor="#f59e0b" stopOpacity={warmOpacity} />
                  <stop offset="58%" stopColor="#f59e0b" stopOpacity={0} />
                  <stop offset="78%" stopColor="#f59e0b" stopOpacity={0} />
                  <stop offset="88%" stopColor="#f59e0b" stopOpacity={warmOpacity * 0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <radialGradient cx="35%" cy="30%" id={`${uid}-coin`} r="75%">
                  <stop offset="0%" stopColor={tone.coinLight} />
                  <stop offset="100%" stopColor={tone.coinDark} />
                </radialGradient>
              </defs>

              <CartesianGrid stroke={gridColor} strokeOpacity={0.8} vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                axisLine={false}
                domain={[0, (max) => Math.max(1, Math.ceil(max * 1.08))]}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickCount={5}
                tickFormatter={compactInr}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<RevenueTooltip average={model.average} isDark={isDark} totalLabel={text.total} />}
                cursor={{ stroke: lineColor, strokeDasharray: '4 4', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              {/* Soft amber glow behind the main area */}
              <Area
                activeDot={false}
                dataKey="amount"
                dot={false}
                fill={`url(#${uid}-warm)`}
                isAnimationActive={false}
                legendType="none"
                stroke="none"
                tooltipType="none"
                type="monotone"
              />
              <Area
                activeDot={renderActiveDot}
                animationDuration={700}
                dataKey="amount"
                dot={renderDot}
                fill={`url(#${uid}-fill)`}
                name={text.total}
                stroke={lineColor}
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer: period breakdown + totals */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <ul aria-label="Period breakdown" className={`flex divide-x rounded-xl border ${innerBorder} ${divide}`}>
          {(model?.segments ?? []).map((segment) => (
            <li className="min-w-0 flex-1 px-2 py-3 text-center" key={segment.label}>
              <p className="truncate text-sm font-medium">{segment.label}</p>
              <p className={`mt-0.5 text-xs tabular-nums ${muted}`}>{compactInr(segment.total)}</p>
            </li>
          ))}
        </ul>

        <dl className={`flex divide-x rounded-xl border ${innerBorder} ${divide}`}>
          <div className="px-4 py-3">
            <dt className={`text-xs ${muted}`}>{text.stat}</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold tabular-nums">{formatWhole(model?.total ?? 0)}</span>
              {model?.change != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                    changeIsGood
                      ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                  }`}
                  title="Compared with the previous period of the same length"
                >
                  {model.change >= 0 ? '+' : ''}{model.change.toFixed(1)}%
                  <span className="sr-only"> compared with the previous period</span>
                </span>
              )}
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className={`text-xs ${muted}`}>Avg. daily (₹)</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums">{formatWhole(model?.average ?? 0)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default RevenueTrendCard
