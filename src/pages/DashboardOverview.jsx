import { Suspense, lazy, useMemo } from 'react'
import dashboardData from '../store/Data.js'

const SignupChart = lazy(() => import('./SignupChart.jsx'))
const PlanSplitChart = lazy(() => import('./PlanSplitChart.jsx'))
const PlanUpgradeChart = lazy(() => import('./PlanUpgradeChart.jsx'))

/* ---------- helpers ---------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getDaysUntil(dateString) {
  const [day, month, year] = dateString.split(' ')
  const expiry = Date.UTC(Number(year), MONTHS.indexOf(month), Number(day))
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((expiry - today) / 86400000)
}

const toNumber = (value) => Number(String(value).replace(/[^\d.]/g, '')) || 0

function formatMetric(value) {
  if (typeof value === 'number') return value.toLocaleString('en-IN')
  const text = String(value)
  if (/^\d+$/.test(text)) return Number(text).toLocaleString('en-IN')
  return text.replace(/\.00$/, '')
}

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
}

function daysLabel(days) {
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
  if (days === 0) return 'Ends today'
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/* [light, dark] class pairs */
const TONES = {
  red: ['bg-red-50 text-red-700', 'bg-red-400/15 text-red-300'],
  amber: ['bg-amber-50 text-amber-700', 'bg-amber-400/15 text-amber-300'],
  green: ['bg-emerald-50 text-emerald-700', 'bg-emerald-400/15 text-emerald-300'],
  violet: ['bg-violet-50 text-violet-700', 'bg-violet-400/15 text-violet-300'],
  sky: ['bg-sky-50 text-sky-700', 'bg-sky-400/15 text-sky-300'],
  slate: ['bg-slate-100 text-slate-600', 'bg-slate-400/15 text-slate-300'],
}
const AVATAR_TONES = ['sky', 'violet', 'green', 'amber', 'red', 'slate']
const PLAN_TONES = { Standard: 'violet', Premium: 'violet', Monthly: 'sky', Basic: 'slate' }

function toneClass(name, isDark) {
  return TONES[name][isDark ? 1 : 0]
}

function avatarTone(seed = '') {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

/* ---------- small pieces ---------- */

function Icon({ d, className = 'size-4' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {d}
    </svg>
  )
}

const chevron = <path d="m9 6 6 6-6 6" />
const check = <path d="m5 12 4 4L19 6" />

function Pill({ tone, isDark, children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${toneClass(tone, isDark)}`}>
      {children}
    </span>
  )
}

function Avatar({ name, isDark, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${toneClass(avatarTone(name), isDark)} ${className}`}
    >
      {initialsOf(name)}
    </span>
  )
}

function PanelHeader({ title, subtitle, action, muted, linkHover }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className={`mt-0.5 text-xs ${muted}`}>{subtitle}</p>}
      </div>
      {action && (
        <button
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${muted} ${linkHover}`}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
          <Icon className="size-3.5" d={chevron} />
        </button>
      )}
    </div>
  )
}

/* ---------- page ---------- */

function DashboardOverview({ auditEntries, isDark, onNavigate, sourceData }) {
  const t = isDark
    ? { panel: 'border-[#263249] bg-[#10192d]', line: 'border-[#263249]', gap: 'bg-[#263249]', cell: 'bg-[#10192d]', head: 'text-white', muted: 'text-[#91a9c9]', hover: 'hover:bg-[#18243a]', skeleton: 'bg-[#18243a]', segOff: 'bg-[#263249]' }
    : { panel: 'border-[#e2e8f0] bg-white', line: 'border-[#e2e8f0]', gap: 'bg-[#e2e8f0]', cell: 'bg-white', head: 'text-[#111827]', muted: 'text-[#718096]', hover: 'hover:bg-slate-50', skeleton: 'bg-slate-100', segOff: 'bg-slate-200' }
  const panel = `min-w-0 rounded-xl border p-5 md:p-6 ${t.panel}`

  const plans = useMemo(
    () =>
      dashboardData.plansEndingSoon
        .map((plan) => ({ ...plan, daysLeft: getDaysUntil(plan.endingOn) }))
        .filter((plan) => plan.daysLeft >= 0 && plan.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [],
  )

  const sources = sourceData?.sources ?? []
  const problemSources = sources.filter((s) => s.status !== 'Working')
  const workingCount = sources.length - problemSources.length
  const urgentPlans = plans.filter((p) => p.daysLeft <= 7)

  const attention = []
  if (problemSources.length) {
    attention.push({
      key: 'sources',
      tone: problemSources.some((s) => s.status === 'Blocked') ? 'bg-red-500' : 'bg-amber-500',
      title: `${problemSources.length} job ${problemSources.length === 1 ? 'source needs' : 'sources need'} attention`,
      detail: problemSources.map((s) => s.name).join(', '),
      to: '/JobsAndSources',
    })
  }
  if (urgentPlans.length) {
    const names = urgentPlans.slice(0, 2).map((p) => p.name).join(', ')
    attention.push({
      key: 'plans',
      tone: urgentPlans.some((p) => p.daysLeft === 0) ? 'bg-red-500' : 'bg-amber-500',
      title: `${urgentPlans.length} ${urgentPlans.length === 1 ? 'plan ends' : 'plans end'} within 7 days`,
      detail: urgentPlans.length > 2 ? `${names} and ${urgentPlans.length - 2} more` : names,
      to: '/users',
    })
  }

  const metrics = dashboardData.metrics
  const total = toNumber(metrics.find((m) => /total/i.test(m.label))?.value)
  const paying = toNumber(metrics.find((m) => /paying/i.test(m.label))?.value)
  const payingShare = total && paying ? `${((paying / total) * 100).toFixed(1)}% of all users` : null

  const fallback = (label, height) => (
    <div aria-label={label} className={`animate-pulse rounded-lg ${t.skeleton}`} style={{ height }} />
  )

  return (
    <div className={`mx-auto max-w-[1600px] space-y-5 ${isDark ? 'text-slate-100' : 'text-[#111827]'}`}>
      <header>
        <h1 className={`text-[28px] leading-9 font-bold tracking-tight ${t.head}`}>Dashboard</h1>
        <p className={`mt-1 text-sm ${t.muted}`}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      <section aria-label="Needs attention" className={`overflow-hidden rounded-xl border ${t.panel}`}>
        {attention.length ? (
          <ul className={`grid divide-y ${attention.length > 1 ? 'md:grid-cols-2 md:divide-x md:divide-y-0' : ''} ${isDark ? 'divide-[#263249]' : 'divide-[#e2e8f0]'}`}>
            {attention.map((item) => (
              <li key={item.key}>
                <button
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500 ${t.hover}`}
                  onClick={() => onNavigate(item.to)}
                  type="button"
                >
                  <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${item.tone}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className={`mt-0.5 block truncate text-xs ${t.muted}`}>{item.detail}</span>
                  </span>
                  <Icon className={`size-4 shrink-0 ${t.muted}`} d={chevron} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`flex items-center gap-2 px-5 py-4 text-sm ${t.muted}`}>
            <Icon className="size-4 text-emerald-500" d={check} />
            All clear. No sources need attention and no plans end this week.
          </p>
        )}
      </section>

      <section aria-label="Platform summary" className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border xl:grid-cols-4 ${t.line} ${t.gap}`}>
        {metrics.map((metric) => (
          <div className={`p-5 md:p-6 ${t.cell}`} key={metric.label}>
            <p className={`text-xs font-medium ${t.muted}`}>{metric.label}</p>
            <p className={`mt-2 text-[30px] leading-9 font-bold tracking-tight tabular-nums ${t.head}`}>{formatMetric(metric.value)}</p>
            {/paying/i.test(metric.label) && payingShare && <p className={`mt-1 text-xs ${t.muted}`}>{payingShare}</p>}
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className={panel}>
          <Suspense fallback={fallback('Loading sign-ups chart', 290)}><SignupChart isDark={isDark} /></Suspense>
        </section>
        <section className={panel}>
          <Suspense fallback={fallback('Loading plan split chart', 290)}><PlanSplitChart isDark={isDark} /></Suspense>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
        <section aria-labelledby="plans-ending-title" className={panel}>
          <PanelHeader
            action={{ label: 'View users', onClick: () => onNavigate('/users') }}
            linkHover={t.hover}
            muted={t.muted}
            subtitle="Next 30 days, earliest first"
            title={<span id="plans-ending-title">Plans ending soon</span>}
          />
          {plans.length ? (
            <ul className={`divide-y border-t ${t.line} ${isDark ? 'divide-[#263249]' : 'divide-[#e2e8f0]'}`}>
              {plans.map((plan) => (
                <li className="flex items-center gap-3 py-3.5" key={plan.email}>
                  <Avatar className="plans-ending-avatar" isDark={isDark} name={plan.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{plan.name}</p>
                    <p className={`truncate text-xs ${t.muted}`}>{plan.email}</p>
                  </div>
                  <span className="hidden sm:block"><Pill isDark={isDark} tone={PLAN_TONES[plan.plan] ?? 'slate'}>{plan.plan}</Pill></span>
                  <div className="w-[112px] shrink-0 text-right">
                    <time className="block whitespace-nowrap text-xs font-medium tabular-nums">{plan.endingOn}</time>
                    <span className={`mt-1 inline-block text-xs ${plan.daysLeft === 0 ? (isDark ? 'text-red-300' : 'text-red-700') : plan.daysLeft <= 7 ? (isDark ? 'text-amber-300' : 'text-amber-700') : t.muted}`}>
                      {daysLabel(plan.daysLeft)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`border-t py-8 text-center text-sm ${t.line} ${t.muted}`}>No plans ending in the next 30 days.</p>
          )}
        </section>

        <section aria-labelledby="job-health-title" className={panel}>
          <PanelHeader
            action={{ label: 'View sources', onClick: () => onNavigate('/JobsAndSources') }}
            linkHover={t.hover}
            muted={t.muted}
            subtitle="Listings and source activity"
            title={<span id="job-health-title">Job health</span>}
          />
          <div className={`border-t pt-4 ${t.line}`}>
            <p className={`text-xs font-medium ${t.muted}`}>Active jobs</p>
            <p className={`mt-1 text-4xl leading-none font-bold tracking-tight tabular-nums ${t.head}`}>
              {Number(dashboardData.jobHealth.activeJobs).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm">
              <span className="font-semibold tabular-nums">{workingCount} of {sources.length}</span>
              <span className={t.muted}> sources working</span>
            </p>
            <div aria-hidden="true" className="mt-2.5 flex gap-1.5">
              {sources.map((s) => (
                <span
                  className={`h-1.5 min-w-0 flex-1 rounded-full ${s.status === 'Working' ? 'bg-emerald-600' : s.status === 'Blocked' ? 'bg-red-500' : 'bg-amber-500'}`}
                  key={s.id}
                  title={`${s.name}: ${s.status}`}
                />
              ))}
            </div>
          </div>

          {problemSources.length > 0 && (
            <ul className={`mt-4 divide-y border-t ${t.line} ${isDark ? 'divide-[#263249]' : 'divide-[#e2e8f0]'}`}>
              {problemSources.map((s) => (
                <li className="flex items-start justify-between gap-3 py-3" key={s.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className={`mt-0.5 text-xs leading-5 ${t.muted}`}>{s.note !== '—' ? s.note : `Source status: ${s.status}.`}</p>
                  </div>
                  <Pill isDark={isDark} tone={s.status === 'Blocked' ? 'red' : 'amber'}>{s.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={panel}>
        <Suspense fallback={fallback('Loading premium upgrades chart', 220)}>
          <PlanUpgradeChart auditEntries={auditEntries} isDark={isDark} />
        </Suspense>
      </section>
    </div>
  )
}

export default DashboardOverview
