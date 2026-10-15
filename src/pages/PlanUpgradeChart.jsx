import { useId, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dashboardData from '../store/Data.js'

/* Plans that can convert up to Standard (counted as Premium). */
const upgradeSources = [
  { name: 'Monthly', color: '#2dd4bf' },
  { name: 'Basic', color: '#f59e0b' },
]
const targetPlan = 'Standard'
const targetColor = '#a78bfa'
const numberFormat = new Intl.NumberFormat('en-IN')

function Icon({ name, className = 'size-4' }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function UpgradeTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-[#3b3c36] bg-[#242521] text-[#f2f0e9]' : 'border-[#dedbd2] bg-[#fffefa] text-[#20211e]'}`}>
      <p className="flex items-center gap-1.5 font-semibold">
        <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
        {item.name} to {targetPlan}
      </p>
      <p className="mt-1 tabular-nums">{numberFormat.format(item.users)} unique users · {Math.round(item.share)}% of upgrades</p>
    </div>
  )
}

function PlanUpgradeChart({ auditEntries = [], isDark }) {
  const uid = useId().replace(/:/g, '')
  const [activeName, setActiveName] = useState(null)

  const { upgradeData, totalUpgraded } = useMemo(() => {
    // Reuse the plan colors from the plan split chart so both charts agree.
    const planColors = new Map((dashboardData.plansSplit ?? []).map((plan) => [plan.name, plan.color]))
    const usersBySource = new Map(upgradeSources.map((source) => [source.name, new Set()]))
    const allUsers = new Set()

    auditEntries.forEach((entry) => {
      if (entry.newPlan !== targetPlan || !usersBySource.has(entry.previousPlan)) return
      const userKey = entry.userId || entry.userName?.trim().toLowerCase()
      if (!userKey) return
      usersBySource.get(entry.previousPlan).add(userKey)
      allUsers.add(userKey)
    })

    const rows = upgradeSources.map((source) => ({
      name: source.name,
      color: planColors.get(source.name) ?? source.color,
      users: usersBySource.get(source.name).size,
    }))
    const pathTotal = rows.reduce((sum, row) => sum + row.users, 0)

    return {
      totalUpgraded: allUsers.size,
      upgradeData: rows.map((row) => ({ ...row, share: pathTotal ? (row.users / pathTotal) * 100 : 0 })),
    }
  }, [auditEntries])

  const topSource = upgradeData.reduce(
    (best, item) => (item.users > (best?.users ?? 0) ? item : best),
    null,
  )

  const text = isDark ? 'text-[#f2f0e9]' : 'text-[#20211e]'
  const muted = isDark ? 'text-[#a7a49b]' : 'text-[#68665f]'
  const divider = isDark ? 'border-[#42433d]' : 'border-[#dedbd2]'
  const axisColor = isDark ? '#a7a49b' : '#68665f'
  const gridColor = isDark ? '#42433d' : '#dedbd2'
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(32,33,30,0.07)'
  const labelColor = isDark ? '#f2f0e9' : '#20211e'

  return (
    <div className={text}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Plan upgrades</h2>
        <p className={`mt-1 flex flex-wrap items-center gap-2 text-sm ${muted}`}>
          Users who moved up to {targetPlan}
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-[#30312c] text-[#d6d3c9]' : 'bg-[#eee9df] text-[#3d3e39]'}`}>
            from Monthly and Basic
          </span>
        </p>
      </div>

      {/* Stats */}
      <dl className="mt-5 flex flex-wrap items-stretch gap-x-6 gap-y-3">
        <div>
          <dt className={`text-sm ${muted}`}>Total upgraded</dt>
          <dd className="mt-0.5 text-3xl font-bold tabular-nums">
            {numberFormat.format(totalUpgraded)}
            <span className={`ml-1.5 text-sm font-normal ${muted}`}>unique users</span>
          </dd>
        </div>
        {topSource && (
          <div className={`border-l pl-6 ${divider}`}>
            <dt className={`text-sm ${muted}`}>Top source</dt>
            <dd className="mt-0.5 text-3xl font-bold">
              {topSource.name}
              <span className={`ml-1.5 text-sm font-normal tabular-nums ${muted}`}>
                {numberFormat.format(topSource.users)} · {Math.round(topSource.share)}%
              </span>
            </dd>
          </div>
        )}
      </dl>

      {/* Chart */}
      {totalUpgraded === 0 ? (
        <p className={`py-14 text-center text-sm ${muted}`}>No upgrades to {targetPlan} in the plan-change history yet.</p>
      ) : (
        <>
          <div
            aria-label={`Unique users upgraded to ${targetPlan}: ${upgradeData.map((item) => `${item.name}, ${item.users}`).join('; ')}`}
            className="mt-4 w-full"
            role="img"
            style={{ height: Math.max(170, upgradeData.length * 84 + 40) }}
          >
            <ResponsiveContainer height="100%" minWidth={0} width="100%">
              <BarChart
                accessibilityLayer
                data={upgradeData}
                layout="vertical"
                margin={{ top: 8, right: 40, bottom: 4, left: 4 }}
              >
                <defs>
                  {upgradeData.map((item) => (
                    <linearGradient id={`${uid}-${item.name}`} key={item.name} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid horizontal={false} stroke={gridColor} strokeOpacity={0.7} />
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  domain={[0, (max) => Math.max(4, Math.ceil(max * 1.15))]}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickLine={false}
                  tickMargin={8}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  tickLine={false}
                  tickMargin={8}
                  type="category"
                  width={66}
                />
                <Tooltip
                  content={<UpgradeTooltip isDark={isDark} />}
                  cursor={false}
                  isAnimationActive={false}
                />
                <Bar
                  animationDuration={700}
                  background={{ fill: trackColor, radius: 10 }}
                  barSize={18}
                  dataKey="users"
                  minPointSize={2}
                  onMouseEnter={(entry) => setActiveName(entry?.payload?.name ?? entry?.name ?? null)}
                  onMouseLeave={() => setActiveName(null)}
                  radius={[0, 10, 10, 0]}
                >
                  {upgradeData.map((item) => (
                    <Cell
                      fill={`url(#${uid}-${item.name})`}
                      key={item.name}
                      opacity={activeName && activeName !== item.name ? 0.35 : 1}
                      style={{
                        filter: isDark ? `drop-shadow(0 0 6px ${item.color}99)` : 'none',
                        transition: 'opacity 150ms',
                      }}
                    />
                  ))}
                  <LabelList
                    dataKey="users"
                    fill={labelColor}
                    fontSize={13}
                    fontWeight={600}
                    formatter={(value) => numberFormat.format(value)}
                    offset={10}
                    position="right"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend: where everyone ends up */}
          <p className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${muted}`}>
            {upgradeData.map((item, index) => (
              <span className="inline-flex items-center gap-1.5" key={item.name}>
                {index > 0 && <span aria-hidden="true">·</span>}
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
            ))}
            <Icon className="size-3.5" name="arrow" />
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: targetColor }} />
              {targetPlan}
            </span>
          </p>
        </>
      )}

      <p className={`mt-3 text-[11px] ${muted}`}>
        {targetPlan} is counted as Premium. Counts use available plan-change audit history.
      </p>
    </div>
  )
}

export default PlanUpgradeChart
