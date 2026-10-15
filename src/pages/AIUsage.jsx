
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const dateRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

const palette = [
  '#14b8a6',
  '#818cf8',
  '#f59e0b',
  '#f472b6',
  '#38bdf8',
  '#a78bfa',
  '#fb7185',
]

const avatarColors = [
  'bg-teal-700',
  'bg-indigo-700',
  'bg-rose-700',
  'bg-amber-700',
  'bg-sky-700',
  'bg-violet-700',
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

function getInitials(user) {
  const first = user.firstName?.trim() || ''
  const last = user.lastName?.trim() || ''

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase()
  }

  const name = first || last || user.email || '?'
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(user) {
  const id = String(user.id ?? user.email ?? '')
  const hash = [...id].reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  )

  return avatarColors[hash % avatarColors.length]
}

function Card({ children, isDark, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6 ${
        isDark
          ? 'border-slate-800 bg-[#111c2e]'
          : 'border-slate-200 bg-white'
      } ${className}`}
    >
      {children}
    </section>
  )
}

function SectionTitle({ children, isDark, subtitle }) {
  return (
    <div>
      <h2
        className={`text-sm font-semibold ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        {children}
      </h2>
      {subtitle && (
        <p
          className={`mt-1 text-xs ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  isDark,
  valueLabel = 'calls',
  currency = false,
}) {
  if (!active || !payload?.length) return null

  const value = payload[0].value

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-xs shadow-xl ${
        isDark
          ? 'border-slate-700 bg-[#0b1220] text-slate-100'
          : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      <p className="mb-1 font-medium">{label}</p>
      <p className="font-semibold">
        {currency
          ? formatCurrency(value)
          : Number(value).toLocaleString('en-IN')}
        {!currency && ` ${valueLabel}`}
      </p>
    </div>
  )
}

function EmptyState({ isDark }) {
  return (
    <div
      className={`flex h-[260px] flex-col items-center justify-center gap-2 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-500/10 text-xl">
        ∅
      </span>
      <p className="text-sm font-medium">No usage data available</p>
      <p className="text-xs">Try another date range.</p>
    </div>
  )
}

function MetricCard({ label, value, icon, accent, isDark }) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        isDark
          ? 'border-slate-800 bg-[#111c2e]'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-xs font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {label}
        </p>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
          style={{
            color: accent,
            backgroundColor: `${accent}18`,
          }}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-4 break-words text-2xl font-bold tracking-tight tabular-nums ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {value}
      </p>

      <div
        className="absolute bottom-0 left-0 h-[3px] w-12 rounded-r-full"
        style={{ backgroundColor: accent }}
      />
    </article>
  )
}

function AIUsage({ users = [], usageEvents = [], isDark = false }) {
  const [dateRange, setDateRange] = useState('Last 7 days')

  const selectedDays =
    dateRanges.find((range) => range.label === dateRange)?.days ?? 7

  // Normalize dates in UTC to avoid timezone-dependent filtering.
  const latestUsageDate = useMemo(
    () =>
      usageEvents.reduce(
        (latest, event) =>
          event.date && event.date > latest ? event.date : latest,
        '',
      ),
    [usageEvents],
  )

  const today = new Date().toISOString().slice(0, 10)

  // Anchor the range to the latest recorded usage so stale data does not
  // make the chart appear empty for days with no events loaded yet.
  const endDate = latestUsageDate && latestUsageDate < today
    ? latestUsageDate
    : today
  const startDate = useMemo(() => {
    const date = new Date(`${endDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() - selectedDays + 1)
    return date.toISOString().slice(0, 10)
  }, [endDate, selectedDays])

  const filteredEvents = useMemo(
    () =>
      usageEvents.filter(
        (event) =>
          event.date >= startDate &&
          event.date <= endDate &&
          event.date <= today &&
          Number.isFinite(Number(event.cost)) &&
          Number(event.cost) >= 0,
      ),
    [usageEvents, startDate, endDate, today],
  )

  const totalCost = filteredEvents.reduce(
    (sum, event) => sum + Number(event.cost),
    0,
  )

  const activeUserCount = new Set(
    filteredEvents.map((event) => event.userId),
  ).size

  const averageCost = filteredEvents.length
    ? totalCost / filteredEvents.length
    : 0

  const featureData = useMemo(() => {
    const counts = new Map()

    filteredEvents.forEach((event) => {
      const name = event.feature || 'Unknown feature'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })

    return [...counts.entries()]
      .map(([name, calls]) => ({ name, calls }))
      .sort((a, b) => b.calls - a.calls)
  }, [filteredEvents])

  const providerData = useMemo(() => {
    const counts = new Map()

    filteredEvents.forEach((event) => {
      const name = event.provider || 'Unknown provider'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })

    return [...counts.entries()]
      .map(([name, calls]) => ({ name, calls }))
      .sort((a, b) => b.calls - a.calls)
  }, [filteredEvents])

  const dailyData = useMemo(() => {
    const counts = new Map()

    filteredEvents.forEach((event) => {
      counts.set(event.date, (counts.get(event.date) ?? 0) + 1)
    })

    // Include dates with zero calls so gaps are visible in the trend.
    const result = []

    for (let i = 0; i < selectedDays; i += 1) {
      const date = new Date(`${startDate}T00:00:00Z`)
      date.setUTCDate(date.getUTCDate() + i)
      const key = date.toISOString().slice(0, 10)

      result.push({
        date: key,
        name: formatDate(key),
        calls: counts.get(key) ?? 0,
      })
    }

    return result
  }, [filteredEvents, startDate, selectedDays])

  const costByUser = useMemo(() => {
    const totals = new Map()

    filteredEvents.forEach((event) => {
      const current = totals.get(event.userId) ?? {
        calls: 0,
        cost: 0,
      }

      current.calls += 1
      current.cost += Number(event.cost)
      totals.set(event.userId, current)
    })

    return [...totals.entries()]
      .map(([userId, total]) => ({
        user: users.find(
          (item) => String(item.id) === String(userId),
        ),
        ...total,
      }))
      .filter((row) => row.user)
      .sort(
        (a, b) =>
          b.calls - a.calls || b.cost - a.cost,
      )
      .slice(0, 10)
  }, [filteredEvents, users])

  const axisColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#26364d' : '#e2e8f0'
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputStyle = isDark
    ? 'border-slate-700 bg-[#111c2e] text-slate-100'
    : 'border-slate-200 bg-white text-slate-800'

  const metrics = [
    {
      label: `Total AI calls · ${selectedDays} days`,
      value: filteredEvents.length.toLocaleString('en-IN'),
      icon: '↗',
      accent: '#38bdf8',
    },
    {
      label: 'Estimated spend',
      value: formatCurrency(totalCost),
      icon: '₹',
      accent: '#14b8a6',
    },
    {
      label: 'Average cost per call',
      value: formatCurrency(averageCost),
      icon: '◎',
      accent: '#a78bfa',
    },
    {
      label: 'Active AI users',
      value: activeUserCount.toLocaleString('en-IN'),
      icon: '♙',
      accent: '#f59e0b',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight ${textColor}`}>
              AI Usage
            </h1>
            <span className="rounded-md bg-teal-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-500">
              Analytics
            </span>
          </div>
          <p className={`mt-1 text-sm ${mutedColor}`}>
            Monitor AI adoption, activity and estimated spend.
          </p>
        </div>

        <label className="flex items-center gap-3">
          <span className={`text-xs font-medium ${mutedColor}`}>
            Date range
          </span>
          <select
            aria-label="AI usage date range"
            className={`h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 ${inputStyle}`}
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
          >
            {dateRanges.map((range) => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Estimated data notice
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
          isDark
            ? 'border-sky-900/60 bg-sky-950/30 text-sky-200'
            : 'border-sky-100 bg-sky-50 text-sky-800'
        }`}
      >
        {/* <span className="text-sm">ⓘ</span>
        <p className="text-xs leading-5">
          <strong>Estimated usage data.</strong> Costs are calculated
          from recorded usage events and may differ from actual
          provider billing.
        </p> */}
      {/* </div> */} 

      {/* KPI cards */}
      <section
        aria-label="AI usage summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            isDark={isDark}
          />
        ))}
      </section>

      {/* Usage trend */}
      <Card isDark={isDark}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle
            isDark={isDark}
            subtitle="Number of recorded AI requests per day"
          >
            AI activity over time
          </SectionTitle>
          <span className={`text-xs ${mutedColor}`}>
            {selectedDays}-day overview
          </span>
        </div>

        {filteredEvents.length ? (
          <div className="mt-5 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="aiUsageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={gridColor}
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={12}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  content={<ChartTooltip isDark={isDark} />}
                  cursor={{
                    stroke: gridColor,
                    strokeDasharray: '4 4',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="AI calls"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fill="url(#aiUsageGradient)"
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState isDark={isDark} />
        )}
      </Card>

      {/* Feature and provider breakdown */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card isDark={isDark} className="xl:col-span-3">
          <SectionTitle
            isDark={isDark}
            subtitle="Features ranked by total recorded calls"
          >
            Usage by feature
          </SectionTitle>

          {featureData.length ? (
            <div className="mt-5 h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureData.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 5"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={112}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip isDark={isDark} />}
                    cursor={{
                      fill: isDark ? '#1e293b' : '#f1f5f9',
                    }}
                  />
                  <Bar
                    dataKey="calls"
                    name="AI calls"
                    fill="#14b8a6"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState isDark={isDark} />
          )}
        </Card>

        <Card isDark={isDark} className="xl:col-span-2">
          <SectionTitle
            isDark={isDark}
            subtitle="Share of recorded requests by provider"
          >
            Provider distribution
          </SectionTitle>

          {providerData.length ? (
            <>
              <div className="relative mt-3 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      dataKey="calls"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={57}
                      outerRadius={83}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {providerData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={palette[index % palette.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip isDark={isDark} />}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${textColor}`}>
                    {filteredEvents.length.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-xs ${mutedColor}`}>
                    Total calls
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-3">
                {providerData.map((provider, index) => {
                  const percentage =
                    (provider.calls / filteredEvents.length) * 100

                  return (
                    <div key={provider.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                palette[index % palette.length],
                            }}
                          />
                          <span className={`truncate text-xs ${textColor}`}>
                            {provider.name}
                          </span>
                        </div>
                        <span className={`shrink-0 text-xs ${mutedColor}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className={`h-1.5 overflow-hidden rounded-full ${
                          isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              palette[index % palette.length],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyState isDark={isDark} />
          )}
        </Card>
      </section>

      {/* Top users */}
      <Card isDark={isDark} className="!p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <SectionTitle
            isDark={isDark}
            subtitle="Ranked by number of recorded AI calls"
          >
            Top users by AI usage
          </SectionTitle>
          <span
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Top {costByUser.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-left">
            <thead>
              <tr
                className={`border-y text-[11px] font-semibold uppercase tracking-wider ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                    : 'border-slate-100 bg-slate-50/80 text-slate-500'
                }`}
              >
                <th className="px-5 py-3 pl-5">User</th>
                <th className="px-4 py-3 text-right">AI calls</th>
                <th className="px-5 py-3 text-right">Estimated cost</th>
              </tr>
            </thead>

            <tbody>
              {costByUser.map(({ user, calls, cost }, index) => (
                <tr
                  key={user.id}
                  className={`border-b transition-colors last:border-b-0 ${
                    isDark
                      ? 'border-slate-800/80 hover:bg-slate-800/40'
                      : 'border-slate-100 hover:bg-slate-50/80'
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ${
                          getAvatarColor(user)
                        } ${
                          isDark
                            ? 'ring-slate-700/70'
                            : 'ring-white'
                        }`}
                      >
                        {getInitials(user)}
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${textColor}`}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className={`mt-1 truncate text-xs ${mutedColor}`}>
                          {user.email}
                        </p>
                      </div>
                      {index === 0 && (
                        <span className="hidden rounded-md bg-amber-500/10 px-1.5 py-1 text-[10px] font-semibold text-amber-500 sm:inline">
                          TOP
                        </span>
                      )}
                    </div>
                  </td>

                  <td className={`px-4 py-4 text-right text-sm font-semibold tabular-nums ${textColor}`}>
                    {calls.toLocaleString('en-IN')}
                  </td>

                  <td className={`px-5 py-4 text-right text-sm font-semibold tabular-nums ${textColor}`}>
                    {formatCurrency(cost)}
                  </td>
                </tr>
              ))}

              {!costByUser.length && (
                <tr>
                  <td colSpan={3} className="px-5 py-2">
                    <EmptyState isDark={isDark} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className={`border-t px-5 py-3 ${
            isDark
              ? 'border-slate-800 text-slate-500'
              : 'border-slate-100 text-slate-400'
          }`}
        >
          <p className="text-xs">
            Costs are estimates. Only users matched to the supplied
            user list are displayed.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default AIUsage
