import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const dateRanges = [
  { label: 'Last 24 hours', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

const palette = ['#14b8a6', '#818cf8', '#f59e0b', '#f472b6', '#38bdf8', '#a78bfa', '#fb7185']

const avatarColors = ['bg-teal-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700', 'bg-sky-700', 'bg-violet-700']

// Prices are USD per 1M tokens (input / output). Used only when an event has no cost.
const MODELS = [
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inPrice: 3, outPrice: 15, weight: 17, latency: 1400 },
  { name: 'Claude 3 Haiku', provider: 'Anthropic', inPrice: 0.25, outPrice: 1.25, weight: 31, latency: 450 },
  { name: 'GPT-4o', provider: 'OpenAI', inPrice: 2.5, outPrice: 10, weight: 18, latency: 1300 },
  { name: 'GPT-4o Mini', provider: 'OpenAI', inPrice: 0.15, outPrice: 0.6, weight: 29, latency: 500 },
  { name: 'Gemini 1.5 Pro', provider: 'Google', inPrice: 1.25, outPrice: 5, weight: 14, latency: 2100 },
  { name: 'Gemini 1.5 Flash', provider: 'Google', inPrice: 0.075, outPrice: 0.3, weight: 30, latency: 400 },
  { name: 'Mistral Large', provider: 'Mistral', inPrice: 2, outPrice: 6, weight: 15, latency: 1100 },
  { name: 'Llama 3.3 70B', provider: 'Meta', inPrice: 0.6, outPrice: 0.8, weight: 33, latency: 700 },
]

const DEMO_FEATURES = [
  'Resume ATS Tailoring',
  'Job Matching Score',
  'Mock Interview Copilot',
  'Skills Gap Analyzer',
  'Cover Letter Generator',
  'Visa Requirements Evaluation',
]

const DEMO_ACTORS = [
  { id: 'a1', firstName: 'Ananya', lastName: 'Sharma', email: 'ananya.s@outlook.in', type: 'User' },
  { id: 'a2', firstName: 'Alex', lastName: 'Morgan', email: 'alex.morgan@aifagen.internal', type: 'Admin' },
  { id: 'a3', firstName: 'Crawler', lastName: 'Auto-Tagger', email: 'crawler-bot@aifagen.internal', type: 'Admin' },
  { id: 'a4', firstName: 'Mei-Ling', lastName: 'Zhou', email: 'meiling.z@gmail.com', type: 'User' },
  { id: 'a5', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@aifagen.internal', type: 'Employee' },
  { id: 'a6', firstName: 'David', lastName: 'Kalu', email: 'd.kalu@aifagen.internal', type: 'Employee' },
  { id: 'a7', firstName: 'Ops', lastName: 'Lead', email: 'admin@aifagen.com', type: 'Admin' },
  { id: 'a8', firstName: 'Aarav', lastName: 'Patel', email: 'aarav.p@outlook.com', type: 'User' },
  { id: 'a9', firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@yahoo.com', type: 'User' },
  { id: 'a10', firstName: 'Tariq', lastName: 'Mansoor', email: 't.mansoor@techmail.io', type: 'User' },
]

const PROVIDER_TONE = { Anthropic: 'amber', OpenAI: 'teal', Google: 'sky', Mistral: 'rose', Meta: 'violet' }

const TONES = {
  teal: 'bg-teal-500/10 text-teal-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
  sky: 'bg-sky-500/10 text-sky-500',
  violet: 'bg-violet-500/10 text-violet-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  slate: 'bg-slate-500/10 text-slate-500',
  dark: 'bg-slate-900 text-white',
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getTheme = (isDark) => ({
  text: isDark ? 'text-slate-100' : 'text-slate-900',
  muted: isDark ? 'text-slate-400' : 'text-slate-500',
  line: isDark ? 'border-slate-800' : 'border-slate-100',
  head: isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-100 bg-slate-50/80 text-slate-500',
  rowHover: isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80',
  panel: isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/80',
  input: isDark ? 'border-slate-700 bg-[#111c2e] text-slate-100' : 'border-slate-200 bg-white text-slate-800',
  ghost: isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50',
  axis: isDark ? '#94a3b8' : '#64748b',
  grid: isDark ? '#26364d' : '#e2e8f0',
})

function hashStr(value) {
  let h = 2166136261
  for (const char of String(value)) {
    h ^= char.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const formatCompact = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return String(Math.round(v))
}

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')

const formatDay = (ms) =>
  new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const formatDateTime = (ms) =>
  new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const formatLatency = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`)

function timeAgo(ms, nowMs) {
  const diff = Math.max(0, nowMs - ms)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Unknown user'

function getInitials(user) {
  const first = user.firstName?.trim() || ''
  const last = user.lastName?.trim() || ''
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  return (first || last || user.email || '?').slice(0, 2).toUpperCase()
}

function getAvatarColor(user) {
  const id = String(user.id ?? user.email ?? '')
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0)
  return avatarColors[hash % avatarColors.length]
}

function actorTypeOf(user) {
  const raw = String(user?.type ?? user?.role ?? '').toLowerCase()
  if (raw.includes('admin') || raw.includes('system')) return 'Admin'
  if (raw.includes('recruiter')) return 'Recruiter'
  if (raw.includes('employee') || raw.includes('staff')) return 'Employee'
  if (String(user?.email ?? '').includes('@aifagen')) return 'Employee'
  return 'User'
}

function actorGroupOf(type) {
  if (type === 'Admin') return 'System & Admins'
  if (type === 'Recruiter' || type === 'Employee') return 'Recruiters & Staff'
  return 'Candidates (Users)'
}

function estimateCost(model, input, output) {
  return (input * model.inPrice + output * model.outPrice) / 1e6
}

function buildDemoEvents(actors, count = 187, priorCount = 164) {
  const rng = mulberry32(2026)
  const now = Date.now()
  const actorWeights = actors.map((_, i) => (i === 0 ? 6 : i === 1 ? 5 : 1 + (i % 3)))
  const actorTotal = actorWeights.reduce((a, b) => a + b, 0)
  const modelTotal = MODELS.reduce((a, m) => a + m.weight, 0)

  const pickActor = () => {
    let r = rng() * actorTotal
    for (let i = 0; i < actors.length; i += 1) {
      r -= actorWeights[i]
      if (r <= 0) return actors[i]
    }
    return actors[0]
  }
  const pickModel = () => {
    let r = rng() * modelTotal
    for (const m of MODELS) {
      r -= m.weight
      if (r <= 0) return m
    }
    return MODELS[0]
  }

  return Array.from({ length: count + priorCount }, (_, i) => {
    const actor = pickActor()
    const model = pickModel()
    const failed = rng() < 0.043
    const input = Math.round(900 + rng() * 3600)
    const output = failed ? 0 : Math.round(150 + rng() * 1650)
    // The first `count` events fill the last 29 days; the rest fill the 30 days before that (for the trend badge).
    const ts =
      i === 0
        ? now - 12 * 60000
        : i < count
          ? now - 20 * 60000 - Math.pow(rng(), 1.3) * 29 * 86400000
          : now - 30 * 86400000 - rng() * 29 * 86400000
    return {
      id: `demo-${i}`,
      userId: actor.id,
      feature: DEMO_FEATURES[Math.floor(rng() * DEMO_FEATURES.length)],
      provider: model.provider,
      model: model.name,
      inputTokens: input,
      outputTokens: output,
      cost: estimateCost(model, input, output),
      latencyMs: Math.round(model.latency * (0.6 + rng() * 0.9)),
      status: failed ? 'Failed' : 'Success',
      timestamp: new Date(ts).toISOString(),
    }
  })
}

function normalizeEvent(event, index, actorsById) {
  const h = hashStr(event.id ?? `${event.userId}-${event.date}-${index}`)
  const candidates = MODELS.filter((m) => !event.provider || m.provider === event.provider)
  const model =
    MODELS.find((m) => m.name === event.model) ||
    candidates[h % (candidates.length || 1)] ||
    MODELS[h % MODELS.length]

  const rawTs = event.timestamp ?? event.createdAt
  const fallbackTs = `${event.date}T${String(h % 24).padStart(2, '0')}:${String((h >> 5) % 60).padStart(2, '0')}:00Z`
  const tsMs = Date.parse(rawTs ?? fallbackTs)

  const inputTokens = Number(event.inputTokens ?? 800 + (h % 3200))
  const outputTokens = Number(event.outputTokens ?? 150 + ((h >> 3) % 1200))
  const cost = event.cost === undefined || event.cost === null ? estimateCost(model, inputTokens, outputTokens) : Number(event.cost)
  const failed = ['failed', 'error'].includes(String(event.status ?? '').toLowerCase())
  const actor = actorsById.get(String(event.userId))

  return {
    id: String(event.id ?? `evt-${index}`),
    requestId: `req_${h.toString(16).padStart(8, '0').slice(0, 8)}`,
    userId: event.userId,
    actor,
    actorType: actorTypeOf(actor),
    feature: event.feature || 'Unknown feature',
    provider: event.provider || model.provider,
    model: model.name,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost,
    latencyMs: Number(event.latencyMs ?? 350 + ((h >> 6) % 2000)),
    status: failed ? 'Failed' : 'Success',
    tsMs,
  }
}

function downloadCsv(rows, filename) {
  const header = ['Request ID', 'Actor', 'Email', 'Actor type', 'Feature', 'Provider', 'Model', 'Input tokens', 'Output tokens', 'Total tokens', 'Estimated cost', 'Latency (ms)', 'Status', 'Timestamp (UTC)']
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((e) =>
    [e.requestId, fullName(e.actor), e.actor?.email, e.actorType, e.feature, e.provider, e.model, e.inputTokens, e.outputTokens, e.totalTokens, e.cost.toFixed(6), e.latencyMs, e.status, new Date(e.tsMs).toISOString()]
      .map(escape)
      .join(','),
  )
  const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Card({ children, isDark, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6 ${
        isDark ? 'border-slate-800 bg-[#111c2e]' : 'border-slate-200 bg-white'
      } ${className}`}
    >
      {children}
    </section>
  )
}

function Tag({ children, tone = 'teal', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

function SectionTitle({ children, isDark, subtitle, tag, tagTone }) {
  const t = getTheme(isDark)
  return (
    <div>
      {tag && <Tag tone={tagTone} className="mb-2">{tag}</Tag>}
      <h2 className={`text-sm font-semibold ${t.text}`}>{children}</h2>
      {subtitle && <p className={`mt-1 text-xs ${t.muted}`}>{subtitle}</p>}
    </div>
  )
}

function Segmented({ options, value, onChange, isDark, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex rounded-xl border p-0.5 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
              active
                ? 'bg-teal-500 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, isDark, className = '' }) {
  const t = getTheme(isDark)
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 ${t.input} ${className}`}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}

function SortHead({ label, sortKey, sort, onSort, align = 'right', isDark }) {
  const active = sort.key === sortKey
  return (
    <th className={`px-4 py-3 text-${align}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider focus:outline-none focus-visible:underline ${active ? 'text-teal-500' : ''}`}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )
}

function ChartTooltip({ active, payload, label, isDark, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className={`min-w-[150px] rounded-xl border px-3 py-2.5 text-xs shadow-xl ${
        isDark ? 'border-slate-700 bg-[#0b1220] text-slate-100' : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      {label && <p className="mb-1.5 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 py-0.5">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.payload?.color || p.color }} />
          <span className="truncate">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold">{formatValue ? formatValue(p.value) : formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function EmptyState({ isDark, height = 'h-[260px]' }) {
  const t = getTheme(isDark)
  return (
    <div className={`flex ${height} flex-col items-center justify-center gap-2 ${t.muted}`}>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-500/10 text-xl">∅</span>
      <p className="text-sm font-medium">No usage data available</p>
      <p className="text-xs">Try another date range or clear the filters.</p>
    </div>
  )
}

function Spark({ data, color, id }) {
  return (
    <div className="h-9 w-24 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MetricCard({ label, value, icon, accent, isDark, badge, badgeTone, note, subnote, spark, sparkId }) {
  const t = getTheme(isDark)
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        isDark ? 'border-slate-800 bg-[#111c2e]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-medium ${t.muted}`}>{label}</p>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
          style={{ color: accent, backgroundColor: `${accent}18` }}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className={`break-words text-2xl font-bold tracking-tight tabular-nums ${t.text}`}>{value}</p>
        {badge && <Tag tone={badgeTone} className="normal-case tracking-normal">{badge}</Tag>}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-xs font-medium ${t.text}`}>{note}</p>
          <p className={`mt-0.5 truncate text-[11px] ${t.muted}`}>{subnote}</p>
        </div>
        {spark && <Spark data={spark} color={accent} id={sparkId} />}
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-12 rounded-r-full" style={{ backgroundColor: accent }} />
    </article>
  )
}

function Avatar({ user, size = 'size-9' }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${getAvatarColor(user)}`}>
      {getInitials(user)}
    </div>
  )
}

function ActorCell({ user, isDark }) {
  const t = getTheme(isDark)
  if (!user) return <span className={`text-xs ${t.muted}`}>Unknown user</span>
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar user={user} />
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold ${t.text}`}>{fullName(user)}</p>
        <p className={`mt-0.5 truncate text-xs ${t.muted}`}>{user.email}</p>
      </div>
    </div>
  )
}

function TypeBadge({ type }) {
  const tone = type === 'Admin' ? 'dark' : type === 'User' ? 'slate' : 'amber'
  return <Tag tone={tone} className="normal-case tracking-normal">{type}</Tag>
}

function StatusBadge({ status }) {
  return <Tag tone={status === 'Failed' ? 'rose' : 'emerald'} className="normal-case tracking-normal">{status}</Tag>
}

function RateBadge({ rate }) {
  const tone = rate >= 98 ? 'emerald' : rate >= 93 ? 'amber' : 'rose'
  return <Tag tone={tone} className="normal-case tracking-normal">{rate.toFixed(1).replace('.0', '')}%</Tag>
}

function TraceDialog({ event, onClose, isDark, money }) {
  const t = getTheme(isDark)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = [
    ['Request ID', event.requestId],
    ['Actor', `${fullName(event.actor)} (${event.actorType})`],
    ['Feature', event.feature],
    ['Provider / model', `${event.provider}: ${event.model}`],
    ['Input tokens', formatNumber(event.inputTokens)],
    ['Output tokens', formatNumber(event.outputTokens)],
    ['Total tokens', formatNumber(event.totalTokens)],
    ['Estimated cost', money(event.cost, 4)],
    ['Latency', formatLatency(event.latencyMs)],
    ['Time', formatDateTime(event.tsMs)],
  ]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close trace" className="absolute inset-0 bg-slate-950/60" onClick={onClose} type="button" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-title"
        className={`relative w-full max-w-lg rounded-2xl border p-5 shadow-2xl sm:p-6 ${
          isDark ? 'border-slate-800 bg-[#111c2e] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Tag tone="sky" className="mb-2">Trace inspector</Tag>
            <h2 id="trace-title" className="text-base font-semibold">{event.feature}</h2>
          </div>
          <StatusBadge status={event.status} />
        </div>
        <dl className={`mt-4 divide-y text-sm ${t.line}`}>
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className={t.muted}>{k}</dt>
              <dd className="break-words text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className={`mt-3 text-xs leading-5 ${t.muted}`}>
          Prompt and response payloads are not stored in the usage events. Connect your logging store to show them here.
        </p>
        <div className="mt-5 flex justify-end">
          <button ref={closeRef} type="button" onClick={onClose} className={`h-10 rounded-xl border px-4 text-sm font-medium ${t.ghost}`}>
            Close
          </button>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AIUsage({
  users = [],
  usageEvents = [],
  isDark = false,
  currency = 'USD',
  monthlyBudget = 2000,
  onBudgetChange,
}) {
  const t = getTheme(isDark)
  const logRef = useRef(null)

  const [rangeDays, setRangeDays] = useState(30)
  const [providerFilter, setProviderFilter] = useState('all')
  const [featureFilter, setFeatureFilter] = useState('all')
  const [trendMetric, setTrendMetric] = useState('requests')
  const [trendMode, setTrendMode] = useState('bars')
  const [consumerSort, setConsumerSort] = useState('tokens')
  const [modelSort, setModelSort] = useState({ key: 'requests', dir: 'desc' })
  const [modelProvider, setModelProvider] = useState('all')
  const [budget, setBudget] = useState({ monthly: monthlyBudget, warn: 75, crit: 90 })
  const [showBudgetConfig, setShowBudgetConfig] = useState(false)
  const [trace, setTrace] = useState(null)

  const [logSearch, setLogSearch] = useState('')
  const [logType, setLogType] = useState('all')
  const [logFeature, setLogFeature] = useState('all')
  const [logProvider, setLogProvider] = useState('all')
  const [logStatus, setLogStatus] = useState('all')
  const [logActorId, setLogActorId] = useState(null)
  const [logSort, setLogSort] = useState({ key: 'tsMs', dir: 'desc' })
  const [logPage, setLogPage] = useState(1)
  const [logPageSize, setLogPageSize] = useState(10)

  const nowMs = useMemo(() => Date.now(), [])

  const money = (value, digits = 2) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)

  /* ---------- data preparation ---------- */

  const actors = users.length ? users : DEMO_ACTORS
  const actorsById = useMemo(() => new Map(actors.map((u) => [String(u.id), u])), [actors])

  const allEvents = useMemo(() => {
    const source = usageEvents.length ? usageEvents : buildDemoEvents(actors)
    return source
      .map((event, i) => normalizeEvent(event, i, actorsById))
      .filter((e) => Number.isFinite(e.tsMs) && Number.isFinite(e.cost) && e.cost >= 0 && e.tsMs <= nowMs + 60000)
  }, [usageEvents, actors, actorsById, nowMs])

  const isDemo = !usageEvents.length

  // Anchor the window to the latest recorded usage so stale data never looks empty.
  const endMs = useMemo(
    () => Math.min(nowMs, allEvents.reduce((latest, e) => Math.max(latest, e.tsMs), 0) || nowMs),
    [allEvents, nowMs],
  )
  const endDate = new Date(endMs).toISOString().slice(0, 10)
  const startMs =
    rangeDays === 1 ? endMs - 86400000 : Date.parse(`${endDate}T00:00:00Z`) - (rangeDays - 1) * 86400000
  const spanMs = endMs - startMs

  const providerOptions = useMemo(() => [...new Set(allEvents.map((e) => e.provider))].sort(), [allEvents])
  const featureOptions = useMemo(() => [...new Set(allEvents.map((e) => e.feature))].sort(), [allEvents])

  const matchesGlobal = (e) =>
    (providerFilter === 'all' || e.provider === providerFilter) &&
    (featureFilter === 'all' || e.feature === featureFilter)

  const filteredEvents = useMemo(
    () => allEvents.filter((e) => e.tsMs >= startMs && e.tsMs <= endMs && matchesGlobal(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, startMs, endMs, providerFilter, featureFilter],
  )

  const previousEvents = useMemo(
    () => allEvents.filter((e) => e.tsMs >= startMs - spanMs && e.tsMs < startMs && matchesGlobal(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, startMs, spanMs, providerFilter, featureFilter],
  )

  /* ---------- summary numbers ---------- */

  const total = filteredEvents.length
  const sum = (list, key) => list.reduce((s, e) => s + e[key], 0)
  const totalInput = sum(filteredEvents, 'inputTokens')
  const totalOutput = sum(filteredEvents, 'outputTokens')
  const totalTokens = totalInput + totalOutput
  const totalCost = sum(filteredEvents, 'cost')
  const failedCount = filteredEvents.filter((e) => e.status === 'Failed').length
  const successCount = total - failedCount
  const successRate = total ? (successCount / total) * 100 : 0
  const avgCost = total ? totalCost / total : 0
  const avgTokens = total ? totalTokens / total : 0
  const avgLatency = total ? sum(filteredEvents, 'latencyMs') / total : 0

  const delta = previousEvents.length ? ((total - previousEvents.length) / previousEvents.length) * 100 : null

  /* ---------- time buckets ---------- */

  const bucketCount = rangeDays === 1 ? 24 : rangeDays
  const bucketSize = rangeDays === 1 ? 3600000 : 86400000

  const buckets = useMemo(() => {
    const list = Array.from({ length: bucketCount }, (_, i) => {
      const ms = startMs + i * bucketSize
      return {
        ms,
        name: rangeDays === 1 ? `${String(new Date(ms).getHours()).padStart(2, '0')}:00` : formatDay(ms),
        requests: 0,
        tokens: 0,
        cost: 0,
        failed: 0,
        byModel: {},
      }
    })
    filteredEvents.forEach((e) => {
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((e.tsMs - startMs) / bucketSize)))
      const b = list[index]
      b.requests += 1
      b.tokens += e.totalTokens
      b.cost += e.cost
      if (e.status === 'Failed') b.failed += 1
      const m = (b.byModel[e.model] ??= { requests: 0, tokens: 0, cost: 0 })
      m.requests += 1
      m.tokens += e.totalTokens
      m.cost += e.cost
    })
    return list
  }, [filteredEvents, startMs, bucketCount, bucketSize, rangeDays])

  const topModels = useMemo(() => {
    const counts = new Map()
    filteredEvents.forEach((e) => counts.set(e.model, (counts.get(e.model) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name)
  }, [filteredEvents])

  const trendData = useMemo(
    () =>
      buckets.map((b) => {
        const row = { name: b.name }
        topModels.forEach((model) => {
          row[model] = b.byModel[model]?.[trendMetric] ?? 0
        })
        row.total = b[trendMetric]
        return row
      }),
    [buckets, topModels, trendMetric],
  )

  const trendFormat =
    trendMetric === 'cost' ? (v) => money(v, v < 1 ? 4 : 2) : trendMetric === 'tokens' ? formatCompact : formatNumber
  const trendPeak = trendData.reduce((peak, row) => Math.max(peak, row.total), 0)

  /* ---------- breakdowns ---------- */

  const actorSplit = useMemo(() => {
    const groups = new Map([
      ['Candidates (Users)', 0],
      ['Recruiters & Staff', 0],
      ['System & Admins', 0],
    ])
    filteredEvents.forEach((e) => {
      const group = actorGroupOf(e.actorType)
      groups.set(group, groups.get(group) + 1)
    })
    const colors = ['#14b8a6', '#f59e0b', '#818cf8']
    return [...groups.entries()].map(([name, calls], i) => ({
      name,
      calls,
      color: colors[i],
      pct: total ? (calls / total) * 100 : 0,
    }))
  }, [filteredEvents, total])

  const consumers = useMemo(() => {
    const map = new Map()
    const mid = startMs + spanMs / 2
    filteredEvents.forEach((e) => {
      const row = map.get(String(e.userId)) ?? { requests: 0, tokens: 0, cost: 0, features: new Map(), early: 0, late: 0 }
      row.requests += 1
      row.tokens += e.totalTokens
      row.cost += e.cost
      row.features.set(e.feature, (row.features.get(e.feature) ?? 0) + 1)
      if (e.tsMs < mid) row.early += 1
      else row.late += 1
      map.set(String(e.userId), row)
    })
    return [...map.entries()]
      .map(([id, row]) => ({
        id,
        user: actorsById.get(id),
        ...row,
        topFeature: [...row.features.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
        trend: row.late > row.early * 1.2 ? 'Rising' : row.late < row.early * 0.8 ? 'Falling' : 'Steady',
      }))
      .filter((row) => row.user)
      .sort((a, b) => b[consumerSort] - a[consumerSort])
      .slice(0, 7)
  }, [filteredEvents, actorsById, consumerSort, startMs, spanMs])

  const modelRows = useMemo(() => {
    const map = new Map()
    filteredEvents.forEach((e) => {
      const row = map.get(e.model) ?? { model: e.model, provider: e.provider, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, ok: 0, latency: 0 }
      row.requests += 1
      row.inputTokens += e.inputTokens
      row.outputTokens += e.outputTokens
      row.totalTokens += e.totalTokens
      row.latency += e.latencyMs
      if (e.status === 'Success') row.ok += 1
      map.set(e.model, row)
    })
    const dir = modelSort.dir === 'asc' ? 1 : -1
    return [...map.values()]
      .filter((r) => modelProvider === 'all' || r.provider === modelProvider)
      .map((r) => ({ ...r, successRate: (r.ok / r.requests) * 100, avgLatency: r.latency / r.requests }))
      .sort((a, b) => {
        const x = a[modelSort.key]
        const y = b[modelSort.key]
        return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir
      })
  }, [filteredEvents, modelSort, modelProvider])

  // Budget is tracked per calendar month (UTC), independent of the date range filter.
  const monthKey = endDate.slice(0, 7)
  const monthEvents = useMemo(
    () => allEvents.filter((e) => new Date(e.tsMs).toISOString().slice(0, 7) === monthKey),
    [allEvents, monthKey],
  )
  const monthCost = sum(monthEvents, 'cost')
  const budgetPct = budget.monthly > 0 ? (monthCost / budget.monthly) * 100 : 0
  const budgetTone = budgetPct >= budget.crit ? '#fb7185' : budgetPct >= budget.warn ? '#f59e0b' : '#14b8a6'
  const providerCost = useMemo(() => {
    const map = new Map()
    monthEvents.forEach((e) => map.set(e.provider, (map.get(e.provider) ?? 0) + e.cost))
    return [...map.entries()]
      .map(([name, cost]) => ({ name, cost, pct: monthCost ? (cost / monthCost) * 100 : 0 }))
      .sort((a, b) => b.cost - a.cost)
  }, [monthEvents, monthCost])

  const recent = useMemo(() => [...filteredEvents].sort((a, b) => b.tsMs - a.tsMs).slice(0, 5), [filteredEvents])

  /* ---------- call log ---------- */

  const logRows = useMemo(() => {
    const query = logSearch.trim().toLowerCase()
    const dir = logSort.dir === 'asc' ? 1 : -1
    return filteredEvents
      .filter(
        (e) =>
          (logType === 'all' || e.actorType === logType) &&
          (logFeature === 'all' || e.feature === logFeature) &&
          (logProvider === 'all' || e.provider === logProvider) &&
          (logStatus === 'all' || e.status === logStatus) &&
          (!logActorId || String(e.userId) === logActorId) &&
          (!query ||
            [fullName(e.actor), e.actor?.email, e.requestId, e.feature, e.model, e.provider]
              .join(' ')
              .toLowerCase()
              .includes(query)),
      )
      .sort((a, b) => (a[logSort.key] - b[logSort.key]) * dir)
  }, [filteredEvents, logSearch, logType, logFeature, logProvider, logStatus, logActorId, logSort])

  const totalPages = Math.max(1, Math.ceil(logRows.length / logPageSize))
  const page = Math.min(logPage, totalPages)
  const pageRows = logRows.slice((page - 1) * logPageSize, page * logPageSize)
  const hasLogFilters = logSearch || logType !== 'all' || logFeature !== 'all' || logProvider !== 'all' || logStatus !== 'all' || logActorId

  const withReset = (setter) => (value) => {
    setter(value)
    setLogPage(1)
  }

  function clearLogFilters() {
    setLogSearch('')
    setLogType('all')
    setLogFeature('all')
    setLogProvider('all')
    setLogStatus('all')
    setLogActorId(null)
    setLogPage(1)
  }

  function toggleSort(setter) {
    return (key) => setter((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }))
  }

  function showActorCalls(id) {
    clearLogFilters()
    setLogActorId(id)
    logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function updateBudget(key, value) {
    const next = { ...budget, [key]: Math.max(0, Number(value) || 0) }
    setBudget(next)
    onBudgetChange?.(next)
  }

  /* ---------- KPI definitions ---------- */

  const metrics = [
    {
      label: 'Total AI requests',
      value: formatNumber(total),
      icon: '↗',
      accent: '#38bdf8',
      badge: delta === null ? null : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
      badgeTone: delta !== null && delta < 0 ? 'rose' : 'emerald',
      note: 'Across all models & environments',
      subnote: `${formatNumber(new Set(filteredEvents.map((e) => e.userId)).size)} active users`,
      spark: buckets.map((b) => ({ v: b.requests })),
    },
    {
      label: 'Total tokens consumed',
      value: formatCompact(totalTokens),
      icon: '◫',
      accent: '#f59e0b',
      note: `Input: ${formatCompact(totalInput)} • Output: ${formatCompact(totalOutput)}`,
      subnote: 'Split by prompt & completion',
      spark: buckets.map((b) => ({ v: b.tokens })),
    },
    {
      label: 'Estimated AI spend',
      value: money(totalCost),
      icon: currency === 'INR' ? '₹' : '$',
      accent: '#14b8a6',
      badge: 'Unit priced',
      badgeTone: 'teal',
      note: `Avg. ${money(avgCost, 4)} / request`,
      subnote: 'Based on active unit rates',
      spark: buckets.map((b) => ({ v: b.cost })),
    },
    {
      label: 'Success rate',
      value: `${successRate.toFixed(1)}%`,
      icon: '✓',
      accent: '#a78bfa',
      badge: failedCount ? `${failedCount} failed` : 'No failures',
      badgeTone: failedCount ? 'amber' : 'emerald',
      note: `${formatNumber(successCount)} success • ${formatNumber(failedCount)} error`,
      subnote: 'SLA target: 98.0% availability',
      spark: buckets.map((b) => ({ v: b.requests ? ((b.requests - b.failed) / b.requests) * 100 : 100 })),
    },
  ]

  const rangeLabel = dateRanges.find((r) => r.days === rangeDays)?.label ?? ''
  const monthLabel = new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

  /* ---------- render ---------- */

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="amber">Operational telemetry</Tag>
            <span className={`text-xs ${t.muted}`}>{monthLabel} · {isDemo ? 'Sample data' : 'Live sync'}</span>
          </div>
          <h1 className={`mt-2 text-2xl font-bold tracking-tight ${t.text}`}>AI Usage</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>Monitor AI consumption, model performance, request activity and operational costs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            isDark={isDark}
            label="AI usage date range"
            value={rangeDays}
            onChange={(v) => setRangeDays(Number(v))}
            options={dateRanges.map((r) => ({ value: r.days, label: r.label }))}
          />
          <FilterSelect
            isDark={isDark}
            label="Filter by provider"
            value={providerFilter}
            onChange={(v) => { setProviderFilter(v); setLogPage(1) }}
            options={[{ value: 'all', label: 'All providers' }, ...providerOptions.map((p) => ({ value: p, label: p }))]}
          />
          <FilterSelect
            isDark={isDark}
            label="Filter by feature"
            value={featureFilter}
            onChange={(v) => { setFeatureFilter(v); setLogPage(1) }}
            options={[{ value: 'all', label: 'All features' }, ...featureOptions.map((f) => ({ value: f, label: f }))]}
          />
          <button
            type="button"
            onClick={() => downloadCsv([...filteredEvents].sort((a, b) => b.tsMs - a.tsMs), `ai-usage-${endDate}.csv`)}
            className={`h-10 rounded-xl border px-4 text-sm font-medium transition ${t.ghost}`}
          >
            Export CSV
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <section aria-label="AI usage summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, i) => (
          <MetricCard key={metric.label} {...metric} sparkId={`aiSpark${i}`} isDark={isDark} />
        ))}
      </section>

      {/* Trend + actor split */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card isDark={isDark} className="xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle isDark={isDark} tag="Multi-model telemetry" tagTone="amber" subtitle="Throughput, invocation volume and unit spend compared across models">
              AI usage trend
            </SectionTitle>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <Segmented isDark={isDark} label="Chart type" value={trendMode} onChange={setTrendMode} options={[{ value: 'bars', label: 'Bars' }, { value: 'lines', label: 'Lines' }]} />
                <Segmented isDark={isDark} label="Metric" value={trendMetric} onChange={setTrendMetric} options={[{ value: 'requests', label: 'Requests' }, { value: 'tokens', label: 'Tokens' }, { value: 'cost', label: 'Cost' }]} />
              </div>
              <Segmented
                isDark={isDark}
                label="Time range"
                value={rangeDays}
                onChange={setRangeDays}
                options={[{ value: 1, label: '24h' }, { value: 7, label: '7d' }, { value: 30, label: '30d' }, { value: 90, label: '90d' }]}
              />
            </div>
          </div>

          {total ? (
            <>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {topModels.map((model, i) => (
                  <span key={model} className={`inline-flex items-center gap-1.5 text-xs ${t.muted}`}>
                    <span className="size-2.5 rounded-sm" style={{ backgroundColor: palette[i] }} />
                    {model}
                  </span>
                ))}
              </div>

              <div className="mt-3 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {trendMode === 'bars' ? (
                    <BarChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={1}>
                      <CartesianGrid stroke={t.grid} strokeDasharray="3 5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={trendMetric === 'cost' ? (v) => money(v, 2) : formatCompact} />
                      <Tooltip content={<ChartTooltip isDark={isDark} formatValue={trendFormat} />} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                      {topModels.map((model, i) => (
                        <Bar key={model} dataKey={model} name={model} fill={palette[i]} radius={[3, 3, 0, 0]} maxBarSize={12} />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke={t.grid} strokeDasharray="3 5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={trendMetric === 'cost' ? (v) => money(v, 2) : formatCompact} />
                      <Tooltip content={<ChartTooltip isDark={isDark} formatValue={trendFormat} />} cursor={{ stroke: t.grid, strokeDasharray: '4 4' }} />
                      {topModels.map((model, i) => (
                        <Line key={model} type="monotone" dataKey={model} name={model} stroke={palette[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className={`mt-3 flex flex-wrap justify-between gap-2 border-t pt-3 text-xs ${t.line} ${t.muted}`}>
                <span>Selected cycle: {rangeLabel} telemetry window</span>
                <span>
                  Peak: <strong className={t.text}>{trendFormat(trendPeak)}</strong> · Active metric:{' '}
                  <strong className={t.text}>{trendMetric}</strong>
                </span>
              </div>
            </>
          ) : (
            <EmptyState isDark={isDark} />
          )}
        </Card>

        <Card isDark={isDark} className="xl:col-span-2">
          <SectionTitle isDark={isDark} tag="Consumer split" tagTone="emerald" subtitle="Invocation volume and telemetry distributed by role">
            Usage by actor type
          </SectionTitle>

          {total ? (
            <>
              <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="relative mx-auto h-[190px] w-full max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={actorSplit} dataKey="calls" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">
                        {actorSplit.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip isDark={isDark} formatValue={(v) => `${formatNumber(v)} calls`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>Total calls</span>
                    <span className={`text-2xl font-bold ${t.text}`}>{formatNumber(total)}</span>
                    <span className={`text-[11px] ${t.muted}`}>100% volume</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {actorSplit.map((row) => (
                    <li key={row.name} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${t.panel}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                        <div className="min-w-0">
                          <p className={`truncate text-xs font-semibold ${t.text}`}>{row.name}</p>
                          <p className={`text-[11px] ${t.muted}`}>Volume: {formatNumber(row.calls)} calls</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${t.text}`}>{row.pct.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ['Avg cost / req', money(avgCost, 4)],
                  ['Avg tokens / req', formatNumber(Math.round(avgTokens))],
                  ['Avg latency', formatLatency(avgLatency)],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-xl border px-3 py-2.5 text-center ${t.panel}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>{label}</p>
                    <p className={`mt-1 text-sm font-bold tabular-nums ${t.text}`}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState isDark={isDark} />
          )}
        </Card>
      </section>

      {/* Consumers + cost management */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card isDark={isDark} className="!p-0 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
            <SectionTitle isDark={isDark} tag="High volume actors" tagTone="sky" subtitle="Ranked by compute intensity and operational spend">
              Top AI consumers
            </SectionTitle>
            <Segmented
              isDark={isDark}
              label="Rank consumers by"
              value={consumerSort}
              onChange={setConsumerSort}
              options={[{ value: 'tokens', label: 'Tokens' }, { value: 'cost', label: 'Cost' }, { value: 'requests', label: 'Requests' }]}
            />
          </div>

          <div>
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[21%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className={`border-y text-[11px] font-semibold uppercase tracking-wider ${t.head}`}>
                  <th className="px-1.5 py-3">Rank</th>
                  <th className="px-1.5 py-3">Actor / user</th>
                  <th className="px-1.5 py-3">Type</th>
                  <th className="px-1.5 py-3 text-right">Requests</th>
                  <th className="px-1.5 py-3 text-right">Total tokens</th>
                  <th className="px-1.5 py-3 text-right">Est. cost</th>
                  <th className="px-1.5 py-3">Top feature</th>
                  <th className="px-1.5 py-3">Trend</th>
                  <th className="px-1.5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {consumers.map((row, index) => (
                  <tr key={row.id} className={`border-b transition-colors last:border-b-0 ${t.line} ${t.rowHover}`}>
                    <td className="px-1.5 py-3.5">
                      <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${index === 0 ? 'bg-amber-500/15 text-amber-500' : t.muted}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-1.5 py-3.5"><ActorCell user={row.user} isDark={isDark} /></td>
                    <td className="px-1.5 py-3.5 [&>span]:!px-1 [&>span]:!text-[9px]"><TypeBadge type={actorTypeOf(row.user)} /></td>
                    <td className={`break-words px-1.5 py-3.5 text-right text-xs font-semibold tabular-nums ${t.text}`}>{formatNumber(row.requests)}</td>
                    <td className="break-words px-1.5 py-3.5 text-right text-xs font-semibold tabular-nums text-amber-500">{formatNumber(row.tokens)}</td>
                    <td className={`break-words px-1.5 py-3.5 text-right text-xs font-semibold tabular-nums ${t.text}`}>{money(row.cost)}</td>
                    <td className={`break-words px-1.5 py-3.5 text-xs ${t.muted}`}>{row.topFeature}</td>
                    <td className="px-1.5 py-3.5">
                      <Tag tone={row.trend === 'Rising' ? 'emerald' : row.trend === 'Falling' ? 'rose' : 'slate'} className="normal-case tracking-normal">
                        {row.trend === 'Rising' ? '↗' : row.trend === 'Falling' ? '↘' : '→'} {row.trend}
                      </Tag>
                    </td>
                    <td className="px-1.5 py-3.5 text-right">
                      <button type="button" onClick={() => showActorCalls(row.id)} className={`rounded-lg border px-1 py-1.5 text-[9px] font-medium ${t.ghost}`}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {!consumers.length && (
                  <tr><td colSpan={9} className="px-5 py-2"><EmptyState isDark={isDark} height="h-[200px]" /></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={`flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-xs ${t.line} ${t.muted}`}>
            <span>Showing top {consumers.length} heavy actors</span>
            <span>Ranked by: {consumerSort.toUpperCase()}</span>
          </div>
        </Card>

        <Card isDark={isDark} className="xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <SectionTitle isDark={isDark} tag="Budget governance" tagTone="violet" subtitle="Spend ceilings, burn pacing and model quotas">
              AI cost management
            </SectionTitle>
            <button type="button" aria-expanded={showBudgetConfig} onClick={() => setShowBudgetConfig((v) => !v)} className={`h-9 shrink-0 rounded-xl border px-3 text-xs font-medium ${t.ghost}`}>
              Configure
            </button>
          </div>

          {showBudgetConfig && (
            <div className={`mt-4 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-3 ${t.panel}`}>
              {[
                ['Monthly budget', 'monthly', 1],
                ['Warn at (%)', 'warn', 1],
                ['Critical at (%)', 'crit', 1],
              ].map(([label, key, min]) => (
                <label key={key} className="block">
                  <span className={`mb-1 block text-[11px] font-semibold ${t.muted}`}>{label}</span>
                  <input
                    type="number"
                    min={min}
                    value={budget[key]}
                    onChange={(e) => updateBudget(key, e.target.value)}
                    className={`h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 ${t.input}`}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              ['Monthly budget', money(budget.monthly)],
              ['Estimated spend', money(monthCost)],
              ['Remaining budget', money(Math.max(0, budget.monthly - monthCost))],
              ['Consumed', `${budgetPct.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className={`rounded-xl border px-3.5 py-3 ${t.panel}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>{label}</p>
                <p className={`mt-1 text-base font-bold tabular-nums ${t.text}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className={`font-medium ${t.text}`}>Budget utilization</span>
              <span className={t.muted}>{budgetPct.toFixed(1)}% of {money(budget.monthly, 0)} ceiling</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.round(budgetPct))}
              aria-label="Budget utilization"
              className={`relative h-2.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
            >
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(budgetPct, 0.8))}%`, backgroundColor: budgetTone }} />
              {[budget.warn, budget.crit].map((mark) => (
                <span key={mark} className={`absolute top-0 h-full w-px ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} style={{ left: `${Math.min(100, mark)}%` }} />
              ))}
            </div>
            <div className={`relative mt-1.5 h-4 text-[10px] ${t.muted}`}>
              <span className="absolute left-0">0%</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${Math.min(100, budget.warn)}%` }}>Warn: {budget.warn}%</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${Math.min(96, budget.crit)}%` }}>Crit: {budget.crit}%</span>
              <span className="absolute right-0">100%</span>
            </div>
          </div>

          <div className={`mt-4 border-t pt-4 ${t.line}`}>
            <p className={`text-xs font-semibold ${t.text}`}>Cost breakdown by provider</p>
            <ul className="mt-3 space-y-3">
              {providerCost.map((p, i) => (
                <li key={p.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                      <span className={`truncate ${t.text}`}>{p.name}</span>
                    </span>
                    <span className={t.muted}>
                      <strong className={t.text}>{money(p.cost)}</strong> ({p.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: palette[i % palette.length] }} />
                  </div>
                </li>
              ))}
              {!providerCost.length && <li className={`text-xs ${t.muted}`}>No spend recorded this month.</li>}
            </ul>
          </div>

          <p className={`mt-4 rounded-xl border px-3 py-2.5 text-xs leading-5 ${t.panel} ${t.muted}`}>
            Threshold warnings monitor spend velocity without interrupting active model requests.
          </p>
        </Card>
      </section>

      {/* Model performance + recent requests */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card isDark={isDark} className="!p-0 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
            <SectionTitle isDark={isDark} tag="Foundation models" tagTone="amber" subtitle="Unit economics, token throughput and latency across active models">
              Provider & model performance
            </SectionTitle>
            <FilterSelect
              isDark={isDark}
              label="Filter models by provider"
              value={modelProvider}
              onChange={setModelProvider}
              options={[{ value: 'all', label: 'All configured providers' }, ...providerOptions.map((p) => ({ value: p, label: p }))]}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className={`border-y text-[11px] font-semibold ${t.head}`}>
                  <SortHead isDark={isDark} align="left" label="Provider / model" sortKey="model" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Requests" sortKey="requests" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Input" sortKey="inputTokens" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Output" sortKey="outputTokens" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Total" sortKey="totalTokens" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Success" sortKey="successRate" sort={modelSort} onSort={toggleSort(setModelSort)} />
                  <SortHead isDark={isDark} label="Avg latency" sortKey="avgLatency" sort={modelSort} onSort={toggleSort(setModelSort)} />
                </tr>
              </thead>
              <tbody>
                {modelRows.map((row) => (
                  <tr key={row.model} className={`border-b transition-colors last:border-b-0 ${t.line} ${t.rowHover}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Tag tone={PROVIDER_TONE[row.provider] ?? 'slate'} className="normal-case tracking-normal">{row.provider}</Tag>
                        <span className={`text-sm font-semibold ${t.text}`}>{row.model}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right text-sm font-semibold tabular-nums ${t.text}`}>{formatNumber(row.requests)}</td>
                    <td className={`px-4 py-3.5 text-right text-sm tabular-nums ${t.muted}`}>{formatNumber(row.inputTokens)}</td>
                    <td className={`px-4 py-3.5 text-right text-sm tabular-nums ${t.muted}`}>{formatNumber(row.outputTokens)}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-amber-500">{formatNumber(row.totalTokens)}</td>
                    <td className="px-4 py-3.5 text-right"><RateBadge rate={row.successRate} /></td>
                    <td className={`px-4 py-3.5 text-right text-sm tabular-nums ${t.text}`}>{formatLatency(row.avgLatency)}</td>
                  </tr>
                ))}
                {!modelRows.length && (
                  <tr><td colSpan={7} className="px-5 py-2"><EmptyState isDark={isDark} height="h-[200px]" /></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={`flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-xs ${t.line} ${t.muted}`}>
            <span>{modelRows.length} active models benchmarked</span>
            <span>Sorted by: {modelSort.key} ({modelSort.dir})</span>
          </div>
        </Card>

        <Card isDark={isDark} className="xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <SectionTitle isDark={isDark} tag="Live stream" tagTone="emerald" subtitle="Latest inference telemetry traces">
              Recent AI requests
            </SectionTitle>
            <button type="button" onClick={() => logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-xs font-semibold text-teal-500 hover:underline">
              View all
            </button>
          </div>

          <ul className={`mt-4 divide-y ${t.line}`}>
            {recent.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setTrace(e)} className={`flex w-full items-center gap-3 rounded-lg py-3 text-left transition ${t.rowHover}`}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-sm text-amber-500`}>✦</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${t.text}`}>
                      {e.feature} <span className={`text-[11px] font-normal ${t.muted}`}>{e.model}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-xs ${t.muted}`}>{fullName(e.actor)} • {timeAgo(e.tsMs, nowMs)}</span>
                  </span>
                  <StatusBadge status={e.status} />
                </button>
              </li>
            ))}
            {!recent.length && <li><EmptyState isDark={isDark} height="h-[200px]" /></li>}
          </ul>

          <p className={`mt-3 flex justify-between gap-2 border-t pt-3 text-xs ${t.line} ${t.muted}`}>
            <span>Select a row to open its trace</span>
            <span className="font-semibold text-teal-500">Trace inspector</span>
          </p>
        </Card>
      </section>

      {/* Call log */}
      <Card isDark={isDark} className="!p-0">
        <div ref={logRef} className="scroll-mt-5 space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle isDark={isDark} tag="Invocation log" tagTone="sky" subtitle="Granular log of inference calls, token telemetry and execution traces">
              AI call activity table
            </SectionTitle>
            <Tag tone="amber" className="normal-case tracking-normal">Matching records: {formatNumber(logRows.length)}</Tag>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Search AI calls"
              value={logSearch}
              onChange={(e) => withReset(setLogSearch)(e.target.value)}
              placeholder="Search by actor, email, request ID, feature, model…"
              className={`h-10 min-w-[220px] flex-1 rounded-xl border px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 ${t.input}`}
            />
            <FilterSelect isDark={isDark} label="Actor type" value={logType} onChange={withReset(setLogType)} options={[{ value: 'all', label: 'All actor types' }, 'User', 'Employee', 'Recruiter', 'Admin']} />
            <FilterSelect isDark={isDark} label="Feature" value={logFeature} onChange={withReset(setLogFeature)} options={[{ value: 'all', label: 'All features' }, ...featureOptions.map((f) => ({ value: f, label: f }))]} />
            <FilterSelect isDark={isDark} label="Provider" value={logProvider} onChange={withReset(setLogProvider)} options={[{ value: 'all', label: 'All providers' }, ...providerOptions.map((p) => ({ value: p, label: p }))]} />
            <FilterSelect isDark={isDark} label="Status" value={logStatus} onChange={withReset(setLogStatus)} options={[{ value: 'all', label: 'All statuses' }, 'Success', 'Failed']} />
            <button type="button" onClick={clearLogFilters} disabled={!hasLogFilters} className={`h-10 rounded-xl px-3 text-sm font-medium disabled:opacity-40 ${t.muted} hover:underline`}>
              Clear filters
            </button>
            <button type="button" onClick={() => downloadCsv(logRows, `ai-calls-${endDate}.csv`)} className={`h-10 rounded-xl border px-4 text-sm font-medium ${t.ghost}`}>
              Export filtered CSV
            </button>
          </div>

          {logActorId && (
            <p className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${t.panel} ${t.text}`}>
              Showing calls for <strong>{fullName(actorsById.get(logActorId))}</strong>
              <button type="button" aria-label="Clear actor filter" onClick={() => withReset(setLogActorId)(null)} className="font-bold text-teal-500">×</button>
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className={`border-y text-[11px] font-semibold ${t.head}`}>
                <th className="px-5 py-3 uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 uppercase tracking-wider">Feature</th>
                <th className="px-4 py-3 uppercase tracking-wider">Provider / model</th>
                <SortHead isDark={isDark} label="Input" sortKey="inputTokens" sort={logSort} onSort={toggleSort(setLogSort)} />
                <SortHead isDark={isDark} label="Output" sortKey="outputTokens" sort={logSort} onSort={toggleSort(setLogSort)} />
                <SortHead isDark={isDark} label="Total" sortKey="totalTokens" sort={logSort} onSort={toggleSort(setLogSort)} />
                <SortHead isDark={isDark} label="Est. cost" sortKey="cost" sort={logSort} onSort={toggleSort(setLogSort)} />
                <SortHead isDark={isDark} label="Latency" sortKey="latencyMs" sort={logSort} onSort={toggleSort(setLogSort)} />
                <SortHead isDark={isDark} align="left" label="Date & time" sortKey="tsMs" sort={logSort} onSort={toggleSort(setLogSort)} />
                <th className="px-5 py-3 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => (
                <tr
                  key={e.id}
                  tabIndex={0}
                  onClick={() => setTrace(e)}
                  onKeyDown={(ev) => ev.key === 'Enter' && setTrace(e)}
                  className={`cursor-pointer border-b transition-colors last:border-b-0 focus:outline-none focus-visible:bg-teal-500/5 ${t.line} ${t.rowHover}`}
                >
                  <td className="px-5 py-3"><ActorCell user={e.actor} isDark={isDark} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'}`}>{e.feature}</span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${t.muted}`}>
                    {e.provider}: <strong className={t.text}>{e.model}</strong>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm tabular-nums ${t.muted}`}>{formatNumber(e.inputTokens)}</td>
                  <td className={`px-4 py-3 text-right text-sm tabular-nums ${t.muted}`}>{formatNumber(e.outputTokens)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-amber-500">{formatNumber(e.totalTokens)}</td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${t.text}`}>{money(e.cost, 4)}</td>
                  <td className={`px-4 py-3 text-right text-sm tabular-nums ${t.muted}`}>{formatLatency(e.latencyMs)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-xs tabular-nums ${t.muted}`}>{formatDateTime(e.tsMs)}</td>
                  <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
              {!pageRows.length && (
                <tr><td colSpan={10} className="px-5 py-2"><EmptyState isDark={isDark} height="h-[200px]" /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs ${t.line} ${t.muted}`}>
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={logPageSize}
              onChange={(e) => { setLogPageSize(Number(e.target.value)); setLogPage(1) }}
              className={`h-8 rounded-lg border px-2 text-xs outline-none ${t.input}`}
            >
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span>
            Showing {logRows.length ? (page - 1) * logPageSize + 1 : 0} to {Math.min(page * logPageSize, logRows.length)} of {formatNumber(logRows.length)} entries
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setLogPage(page - 1)} className={`h-8 rounded-lg border px-3 font-medium disabled:opacity-40 ${t.ghost}`}>Previous</button>
            <span className="tabular-nums">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setLogPage(page + 1)} className={`h-8 rounded-lg border px-3 font-medium disabled:opacity-40 ${t.ghost}`}>Next</button>
          </div>
        </div>
      </Card>

      <p className={`px-1 text-xs ${t.muted}`}>
        Costs are estimates from recorded usage and may differ from provider billing.
        {isDemo && ' Sample data is shown because no usage events were supplied.'}
      </p>

      {trace && <TraceDialog event={trace} onClose={() => setTrace(null)} isDark={isDark} money={money} />}
    </div>
  )
}

export default AIUsage
