import { useMemo, useState } from 'react'
import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import dashboardData from '../store/Data.js'

/* Used only when a plan in Data.js has no `color`. Matches the reference. */
const fallbackColors = ['#2dd4bf', '#f59e0b', '#a78bfa', '#60a5fa', '#f472b6']
const numberFormat = new Intl.NumberFormat('en-IN')

function Icon({ name, className = 'size-4' }) {
  const paths = {
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function PlanTooltip({ active, payload, isDark, mode }) {
  if (!active || !payload?.length) return null
  const plan = payload[0].payload

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-[#3b3c36] bg-[#242521] text-[#f2f0e9]' : 'border-[#dedbd2] bg-[#fffefa] text-[#20211e]'}`}>
      <p className="flex items-center gap-1.5 font-semibold">
        <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: plan.color }} />
        {mode === 'plans' ? plan.name : `${plan.name} to Standard`}
      </p>
      <p className="mt-1 tabular-nums">{numberFormat.format(plan.users)} {mode === 'plans' ? 'users' : 'unique users converted'} · {Math.round(plan.share)}%</p>
    </div>
  )
}

function PlanSplitChart({ isDark, auditEntries = [] }) {
  const [activeName, setActiveName] = useState(null)
  const [mode, setMode] = useState('plans')

  const { plans, totalUsers, conversions, totalConversions } = useMemo(() => {
    const source = dashboardData.plansSplit ?? []
    const total = source.reduce((sum, plan) => sum + (Number(plan.users) || 0), 0)

    const plans = source.map((plan, index) => {
      const users = Number(plan.users) || 0
      return {
        ...plan,
        users,
        color: plan.color ?? fallbackColors[index % fallbackColors.length],
        share: total ? (users / total) * 100 : 0,
      }
    })

    // Use real audit history; never inflate conversion analytics with synthetic counts.
    const usersBySource = new Map()
    const allConvertedUsers = new Set()
    auditEntries.forEach((entry) => {
      if (!entry.previousPlan || entry.newPlan !== 'Standard' || entry.previousPlan === 'Standard') return
      const userKey = entry.userId || entry.userName?.trim().toLowerCase()
      if (!userKey) return
      if (!usersBySource.has(entry.previousPlan)) usersBySource.set(entry.previousPlan, new Set())
      usersBySource.get(entry.previousPlan).add(userKey)
      allConvertedUsers.add(userKey)
    })
    const conversions = [...usersBySource.entries()].map(([name, users], index) => ({
      name,
      users: users.size,
      color: source.find((plan) => plan.name === name)?.color ?? fallbackColors[index % fallbackColors.length],
    })).sort((a, b) => b.users - a.users)

    return {
      totalUsers: total,
      plans,
      totalConversions: allConvertedUsers.size,
      conversions: conversions.map((row) => ({
        ...row,
        share: allConvertedUsers.size ? (row.users / allConvertedUsers.size) * 100 : 0,
      })),
    }
  }, [auditEntries])

  const displayedRows = mode === 'plans' ? plans : conversions
  const displayedTotal = mode === 'plans' ? totalUsers : totalConversions
  const title = mode === 'plans' ? 'Users by plan' : 'Plan conversions'
  const description = mode === 'plans'
    ? 'Current plan distribution'
    : 'Unique users upgraded to Standard, grouped by previous plan'
  const ringData = useMemo(() => [...displayedRows].reverse(), [displayedRows])

  const text = isDark ? 'text-[#f2f0e9]' : 'text-[#20211e]'
  const muted = isDark ? 'text-[#a7a49b]' : 'text-[#68665f]'
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(32,33,30,0.07)'
  const barTrack = isDark ? 'bg-[#3b3c36]' : 'bg-[#e5e1d8]'
  const cardClass = isDark
    ? 'border-[#3b3c36] bg-[#242521]'
    : 'border-[#dedbd2] bg-[#fffefa]'

  const dimmed = (name) => activeName !== null && activeName !== name
  const hoverHandlers = (name) => ({
    onMouseEnter: () => setActiveName(name),
    onMouseLeave: () => setActiveName(null),
  })

  return (
    <div className={text}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className={`mt-1 text-sm ${muted}`}>{description}</p>
        </div>
        <div aria-label="Plan chart view" className={`inline-flex rounded-lg border p-1 ${isDark ? 'border-[#3b3c36] bg-[#1b1c18]' : 'border-[#dedbd2] bg-[#f4f1e9]'}`} role="group">
          <button aria-pressed={mode === 'plans'} className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${mode === 'plans' ? (isDark ? 'bg-[#3a3c33] text-[#f2f0e9] shadow-sm' : 'bg-white text-[#20211e] shadow-sm') : muted}`} onClick={() => { setMode('plans'); setActiveName(null) }} type="button">Users by plan</button>
          <button aria-pressed={mode === 'conversions'} className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${mode === 'conversions' ? (isDark ? 'bg-[#3a3c33] text-[#f2f0e9] shadow-sm' : 'bg-white text-[#20211e] shadow-sm') : muted}`} onClick={() => { setMode('conversions'); setActiveName(null) }} type="button">Conversions</button>
        </div>
      </div>

      {displayedRows.length === 0 || displayedTotal === 0 ? (
        <p className={`py-16 text-center text-sm ${muted}`}>{mode === 'plans' ? 'No plan data yet.' : 'No recorded upgrades to Standard in the plan-change history yet.'}</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Rings + legend */}
          <div>
            <div
              aria-label={mode === 'plans' ? `Plan distribution: ${plans.map((plan) => `${plan.name}, ${plan.users} users`).join('; ')}` : `Upgrades to Standard: ${conversions.map((plan) => `${plan.name}, ${plan.users} users`).join('; ')}`}
              className="relative mx-auto h-[260px] w-full max-w-[320px] sm:h-[300px] sm:max-w-[360px]"
              role="img"
            >
              <ResponsiveContainer height="100%" minWidth={0} width="100%">
                <RadialBarChart
                  data={ringData}
                  endAngle={-270}
                  innerRadius="34%"
                  outerRadius="100%"
                  startAngle={90}
                >
                  <PolarAngleAxis angleAxisId={0} domain={[0, 100]} tick={false} type="number" />
                  <Tooltip
                    content={<PlanTooltip isDark={isDark} mode={mode} />}
                    cursor={false}
                    isAnimationActive={false}
                  />
                  <RadialBar
                    angleAxisId={0}
                    animationDuration={800}
                    background={{ fill: trackColor }}
                    barSize={plans.length > 4 ? 10 : 15}
                    cornerRadius={20}
                    dataKey="share"
                    onMouseEnter={(entry) => setActiveName(entry?.payload?.name ?? entry?.name ?? null)}
                    onMouseLeave={() => setActiveName(null)}
                  >
                    {ringData.map((plan) => (
                      <Cell
                        fill={plan.color}
                        key={plan.name}
                        opacity={dimmed(plan.name) ? 0.3 : 1}
                        style={{
                          filter: isDark ? `drop-shadow(0 0 6px ${plan.color}aa)` : 'none',
                          transition: 'opacity 150ms',
                        }}
                      />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>

              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[9px] font-medium uppercase tracking-[0.14em] ${muted}`}>{mode === 'plans' ? 'Total users' : 'Conversions'}</span>
                <span
                  className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl"
                  style={isDark ? { textShadow: '0 0 18px rgba(255,255,255,0.3)' } : undefined}
                >
                  {numberFormat.format(displayedTotal)}
                </span>
              </div>
            </div>

            <ul aria-label={mode === 'plans' ? 'Plan legend' : 'Conversion legend'} className="mx-auto mt-4 max-w-[360px] space-y-2.5">
              {displayedRows.map((plan) => (
                <li
                  className={`grid grid-cols-[auto_8.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-xs transition-opacity ${dimmed(plan.name) ? 'opacity-50' : ''}`}
                  key={plan.name}
                  {...hoverHandlers(plan.name)}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="truncate">{mode === 'plans' ? plan.name : `${plan.name} → Standard`}: {numberFormat.format(plan.users)}</span>
                  <span className={`h-1.5 overflow-hidden rounded-full ${barTrack}`}>
                    <span className="block h-full rounded-full" style={{ width: `${plan.share}%`, backgroundColor: plan.color }} />
                  </span>
                  <span className={`text-right tabular-nums ${muted}`}>{Math.round(plan.share)}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan cards */}
          <ul aria-label={mode === 'plans' ? 'Plan details' : 'Conversion details'} className="space-y-3">
            {displayedRows.map((plan) => (
              <li
                className={`rounded-xl border px-4 py-3 transition-opacity ${cardClass} ${dimmed(plan.name) ? 'opacity-50' : ''}`}
                key={plan.name}
                {...hoverHandlers(plan.name)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full border-2"
                    style={{
                      borderColor: plan.color,
                      color: plan.color,
                      boxShadow: isDark ? `0 0 10px ${plan.color}55` : 'none',
                    }}
                  >
                    <Icon name="user" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {mode === 'plans' ? plan.name : `${plan.name} → Standard`}: <strong className="tabular-nums">{numberFormat.format(plan.users)}</strong>
                  </p>
                  <span className={`text-sm tabular-nums ${muted}`}>{Math.round(plan.share)}%</span>
                </div>
                <div className={`mt-3 h-2 overflow-hidden rounded-full ${barTrack}`}>
                  <div className="h-full rounded-full" style={{ width: `${plan.share}%`, backgroundColor: plan.color }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mode === 'conversions' && (
        <p className={`mt-3 text-[11px] ${muted}`}>Counts use unique users in available plan-change audit history; conversion totals are not estimated or artificially increased.</p>
      )}
    </div>
  )
}

export default PlanSplitChart
