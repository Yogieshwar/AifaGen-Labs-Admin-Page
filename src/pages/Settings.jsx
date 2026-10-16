import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const signedInAdminEmail = 'admin@aifagen.com'

/* ---------- constants ---------- */

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/New_York', label: 'US Eastern (New York)' },
  { value: 'America/Chicago', label: 'US Central (Chicago)' },
  { value: 'America/Denver', label: 'US Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles)' },
  { value: 'Europe/London', label: 'United Kingdom (London)' },
  { value: 'Europe/Berlin', label: 'Central Europe (Berlin)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (Sydney)' },
]

const DATE_FORMATS = ['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

const DEFAULT_SETTINGS = {
  general: {
    platformName: 'AIFAGEN Labs',
    supportEmail: 'support@aifagen.com',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12h',
    language: 'en',
    currency: 'INR',
    weekStart: 'monday',
  },
  platform: {
    maintenanceMode: false,
    maintenanceMessage: 'We are making improvements and will be back shortly.',
    allowRegistration: true,
    requireEmailVerification: true,
    defaultPlan: 'free',
    sessionTimeout: '60',
    allowResumeUploads: true,
  },
  profile: {
    displayName: 'Admin',
    phone: '',
    jobTitle: 'Platform administrator',
    twoFactor: false,
  },
  notifications: {
    jobFailure: true,
    failureThreshold: '3',
    sourceBlocked: true,
    paymentFailed: true,
    newSignupDigest: false,
    digestFrequency: 'daily',
    emailRecipients: 'admin@aifagen.com',
    slackWebhook: '',
    quietHours: false,
    quietFrom: '22:00',
    quietTo: '07:00',
  },
  api: {
    webhookUrl: '',
    webhookEvents: { 'user.created': true, 'payment.succeeded': true, 'job.failed': false },
    rateLimit: '600',
    allowedOrigins: '',
  },
  aggregation: {
    autoSync: true,
    interval: '60',
    maxJobsPerRun: '500',
    removeDuplicates: true,
    pauseAfterFailures: '5',
    expireAfterDays: '45',
    retryFailed: true,
    sourceEnabled: {},
  },
  cloud: {
    environment: 'production',
    region: 'ap-south-1',
    backupFrequency: 'daily',
    backupRetention: '30',
    logRetention: '90',
    cdn: true,
    storageBucket: '',
  },
}

/* ---------- helpers ---------- */

function formatAddedDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPreview(date, timezone, dateFormat, timeFormat) {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
        .formatToParts(date)
        .map((p) => [p.type, p.value])
    )
    const monthShort = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, month: 'short' }).format(date)
    const dayNum = String(Number(parts.day))
    const dateText = {
      'DD MMM YYYY': `${dayNum} ${monthShort} ${parts.year}`,
      'DD/MM/YYYY': `${parts.day}/${parts.month}/${parts.year}`,
      'MM/DD/YYYY': `${parts.month}/${parts.day}/${parts.year}`,
      'YYYY-MM-DD': `${parts.year}-${parts.month}-${parts.day}`,
    }[dateFormat]
    const timeText = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: timeFormat === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: timeFormat === '12h',
    }).format(date)
    return { dateText, timeText }
  } catch {
    return { dateText: '—', timeText: '—' }
  }
}

function makeApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 32; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return `aif_live_${out}`
}

function Icon({ name, className = 'size-4' }) {
  const paths = {
    add: <><path d="M12 5v14M5 12h14" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    warning: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    server: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
    cloud: <><path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7Z" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  }
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name] || paths.server}
    </svg>
  )
}

/* ---------- shared building blocks ---------- */

const ThemeContext = createContext({})

function Card({ icon, title, description, children, aside }) {
  const { surface, divider, chip, muted } = useContext(ThemeContext)
  return (
    <section className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6 ${divider}`}>
        <div className="flex items-start gap-3">
          <span className={`rounded-xl p-2.5 ${chip}`}>
            <Icon name={icon} className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>{description}</p>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Field({ id, label, hint, children }) {
  const { muted } = useContext(ThemeContext)
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold">{label}</label>
      {children}
      {hint && <p className={`mt-1.5 text-xs leading-5 ${muted}`}>{hint}</p>}
    </div>
  )
}

function Select({ id, value, onChange, options }) {
  const { inputClass } = useContext(ThemeContext)
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ id, checked, onChange, label, description, danger }) {
  const { muted, isDark } = useContext(ThemeContext)
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        {description && <p className={`mt-1 text-xs leading-5 ${muted}`}>{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          checked
            ? danger ? 'bg-amber-500 focus-visible:ring-amber-500' : isDark ? 'bg-emerald-500 focus-visible:ring-emerald-500' : 'bg-[#172033] focus-visible:ring-slate-500'
            : isDark ? 'bg-[#34445e] focus-visible:ring-slate-400' : 'bg-slate-300 focus-visible:ring-slate-400'
        } ${isDark ? 'focus-visible:ring-offset-[#10192d]' : 'focus-visible:ring-offset-white'}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

/* ---------- Settings ---------- */

function Settings({
  admins = [],
  onAdminChange,
  sourceData = { sources: [] },
  isDark,
  initialSettings,
  onSaveSettings,
}) {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState(() => mergeDefaults(initialSettings))
  const [savedSettings, setSavedSettings] = useState(() => mergeDefaults(initialSettings))
  const [now, setNow] = useState(() => new Date())
  const [notice, setNotice] = useState('')

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [adminToRemove, setAdminToRemove] = useState(null)
  const [searchAdmin, setSearchAdmin] = useState('')
  const removeCancelRef = useRef(null)

  const [apiKeys, setApiKeys] = useState([])
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState(null)
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false)

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const divider = isDark ? 'border-[#263249]' : 'border-slate-200'
  const strong = isDark ? 'text-white' : 'text-slate-900'
  const chip = isDark ? 'bg-[#202d43] text-slate-200' : 'bg-slate-100 text-slate-700'
  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? 'border-[#34445e] bg-[#0c1326] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]'
      : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-200'
  }`
  const buttonSecondary = `inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
    isDark ? 'border-[#34445e] text-slate-200 hover:bg-[#18243a]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
  }`
  const buttonPrimary = `inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
    isDark ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-[#172033] text-white hover:bg-[#26344e]'
  }`

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  const sources = sourceData?.sources ?? []
  const attentionSources = sources.filter((s) => ['Blocked', 'Stalled'].includes(s.status))

  const connectedServices = [
    { name: 'Payment provider', provider: 'Razorpay', description: 'Payment provider credentials are not connected.', status: 'Not connected', ok: false },
    { name: 'Email delivery', provider: 'Resend', description: 'Sender domain and delivery credentials are not connected.', status: 'Not connected', ok: false },
    { name: 'AI gateway', provider: 'AI provider', description: 'Usage charts currently use simulated provider data.', status: 'Demo data', ok: false },
    {
      name: 'Job source workers',
      provider: 'Job collection',
      description: attentionSources.length
        ? `${attentionSources.length} source${attentionSources.length === 1 ? '' : 's'} need attention: ${attentionSources.map((s) => s.name).join(', ')}.`
        : 'No blocked or stalled sources are currently reported.',
      status: attentionSources.length ? 'Needs attention' : 'No issues detected',
      ok: attentionSources.length === 0,
    },
    { name: 'Object storage', provider: 'Resume files', description: 'Resume downloads use demo PDFs; no storage bucket is connected.', status: 'Not connected', ok: false },
    { name: 'Error tracking', provider: 'Sentry', description: 'The production DSN is not configured.', status: 'Not configured', ok: false },
  ]
  const connectedCount = connectedServices.filter((s) => s.ok).length
  const attentionCount = connectedServices.length - connectedCount

  const filteredAdmins = useMemo(() => {
    const query = searchAdmin.trim().toLowerCase()
    if (!query) return admins
    return admins.filter((a) => a.email?.toLowerCase().includes(query))
  }, [admins, searchAdmin])

  const preview = formatPreview(now, settings.general.timezone, settings.general.dateFormat, settings.general.timeFormat)

  useEffect(() => {
    if (activeSection !== 'general') return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [activeSection])

  useEffect(() => {
    if (!adminToRemove) return
    removeCancelRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') setAdminToRemove(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [adminToRemove])

  function mergeDefaults(saved = {}) {
    const out = {}
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      out[key] = { ...DEFAULT_SETTINGS[key], ...(saved[key] || {}) }
    })
    return out
  }

  function update(section, key, value) {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }

  function updateNested(section, key, nestedKey, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: { ...prev[section][key], [nestedKey]: value } },
    }))
  }

  function saveSettings() {
    onSaveSettings?.(settings)
    setSavedSettings(settings)
    setNotice('Settings saved.')
  }

  function discardChanges() {
    setSettings(savedSettings)
  }

  function toggleMaintenance(next) {
    if (next) {
      setMaintenanceConfirm(true)
      return
    }
    update('platform', 'maintenanceMode', false)
  }

  function addAdmin(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.')
      return
    }
    if (admins.some((a) => a.email?.toLowerCase() === normalizedEmail)) {
      setEmailError('This email is already an admin.')
      return
    }
    const newAdmin = {
      id: `admin-${Date.now()}`,
      email: normalizedEmail,
      addedAt: new Date().toISOString().slice(0, 10),
      isCurrent: false,
    }
    onAdminChange?.({ type: 'added', admin: newAdmin })
    setEmail('')
    setEmailError('')
    setNotice(`${normalizedEmail} added to the admin list.`)
  }

  function confirmRemoveAdmin() {
    if (!adminToRemove || adminToRemove.email?.toLowerCase() === signedInAdminEmail || admins.length <= 1) {
      setAdminToRemove(null)
      return
    }
    onAdminChange?.({ type: 'removed', admin: adminToRemove })
    setNotice(`${adminToRemove.email} removed from the admin list.`)
    setAdminToRemove(null)
  }

  function createApiKey(event) {
    event.preventDefault()
    const name = newKeyName.trim()
    if (!name) return
    const key = makeApiKey()
    setApiKeys((prev) => [
      { id: `key-${Date.now()}`, name, prefix: key.slice(0, 13), createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ])
    setRevealedKey(key)
    setNewKeyName('')
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(revealedKey)
      setNotice('API key copied to clipboard.')
    } catch {
      setNotice('Copy failed. Select the key and copy it manually.')
    }
  }

  const navItems = [
    { id: 'general', label: 'General & regional', icon: 'globe' },
    { id: 'platform', label: 'Platform', icon: 'sliders' },
    { id: 'profile', label: 'My profile', icon: 'user' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'api', label: 'API & webhooks', icon: 'key' },
    { id: 'aggregation', label: 'Job aggregation', icon: 'layers' },
    { id: 'cloud', label: 'Cloud & storage', icon: 'cloud' },
    { id: 'admins', label: 'Admin access', icon: 'users' },
    { id: 'services', label: 'Connected services', icon: 'shield' },
  ]

  const { general, platform, profile, notifications, api, aggregation, cloud } = settings

  /* ---------- section renderers ---------- */

  const sectionGeneral = (
    <Card icon="globe" title="General & regional" description="Set how dates, times and money appear across the dashboard and in emails.">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className={`space-y-4 border-b p-5 sm:p-6 xl:border-b-0 xl:border-r ${divider}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="platform-name" label="Platform name">
              <input id="platform-name" className={inputClass} value={general.platformName} onChange={(e) => update('general', 'platformName', e.target.value)} />
            </Field>
            <Field id="support-email" label="Support email">
              <input id="support-email" type="email" className={inputClass} value={general.supportEmail} onChange={(e) => update('general', 'supportEmail', e.target.value)} />
            </Field>
          </div>
          <Field id="timezone" label="Time zone" hint="Used for schedules, reports and timestamps shown to admins.">
            <Select id="timezone" value={general.timezone} onChange={(v) => update('general', 'timezone', v)} options={TIMEZONES} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="date-format" label="Date format">
              <Select id="date-format" value={general.dateFormat} onChange={(v) => update('general', 'dateFormat', v)} options={DATE_FORMATS.map((f) => ({ value: f, label: f }))} />
            </Field>
            <Field id="time-format" label="Time format">
              <Select id="time-format" value={general.timeFormat} onChange={(v) => update('general', 'timeFormat', v)} options={[{ value: '12h', label: '12-hour (3:45 PM)' }, { value: '24h', label: '24-hour (15:45)' }]} />
            </Field>
            <Field id="language" label="Language">
              <Select id="language" value={general.language} onChange={(v) => update('general', 'language', v)} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'te', label: 'Telugu' }]} />
            </Field>
            <Field id="currency" label="Currency">
              <Select id="currency" value={general.currency} onChange={(v) => update('general', 'currency', v)} options={[{ value: 'INR', label: 'Indian rupee (₹)' }, { value: 'USD', label: 'US dollar ($)' }, { value: 'EUR', label: 'Euro (€)' }, { value: 'GBP', label: 'Pound sterling (£)' }]} />
            </Field>
            <Field id="week-start" label="Week starts on">
              <Select id="week-start" value={general.weekStart} onChange={(v) => update('general', 'weekStart', v)} options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} />
            </Field>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <p className={`mt-1 text-xs ${muted}`}>Updates as you change the options.</p>
          <div className={`mt-4 rounded-xl border p-4 ${isDark ? 'border-[#263249] bg-[#121e33]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs ${muted}`}>Current time in {general.timezone}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${strong}`}>{preview.timeText}</p>
            <p className={`mt-1 text-sm tabular-nums ${muted}`}>{preview.dateText}</p>
          </div>
          <dl className={`mt-4 divide-y text-sm ${divider}`}>
            <div className="flex justify-between gap-3 py-2.5">
              <dt className={muted}>Sample revenue</dt>
              <dd className="font-medium tabular-nums">
                {new Intl.NumberFormat(general.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: general.currency, maximumFractionDigits: 0 }).format(124500)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-2.5">
              <dt className={muted}>Sample sign-up date</dt>
              <dd className="font-medium tabular-nums">{formatPreview(new Date(Date.now() - 86400000 * 12), general.timezone, general.dateFormat, general.timeFormat).dateText}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  )

  const sectionPlatform = (
    <div className="space-y-5">
      {platform.maintenanceMode && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-amber-900/60 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`} role="status">
          <Icon name="warning" className="mt-0.5 size-4 shrink-0" />
          <span>Maintenance mode is on. Visitors and users see the maintenance message; admins can still sign in.</span>
        </div>
      )}
      <Card icon="sliders" title="Platform preferences" description="Control who can use the platform and how it behaves for users.">
        <div className={`divide-y px-5 sm:px-6 ${divider}`}>
          <Toggle id="maintenance" danger checked={platform.maintenanceMode} onChange={toggleMaintenance} label="Maintenance mode" description="Takes the user-facing site offline and shows a maintenance page. Admin sign-in stays available." />
          {platform.maintenanceMode && (
            <div className="py-4">
              <Field id="maintenance-message" label="Message shown to users">
                <textarea id="maintenance-message" rows={3} className={`${inputClass} h-auto py-2.5`} value={platform.maintenanceMessage} onChange={(e) => update('platform', 'maintenanceMessage', e.target.value)} />
              </Field>
            </div>
          )}
          <Toggle id="registration" checked={platform.allowRegistration} onChange={(v) => update('platform', 'allowRegistration', v)} label="Enable user registration" description="When off, the sign-up page is closed and only existing users can sign in." />
          <Toggle id="verify-email" checked={platform.requireEmailVerification} onChange={(v) => update('platform', 'requireEmailVerification', v)} label="Require email verification" description="New users must confirm their email before they can apply to jobs." />
          <Toggle id="resume-uploads" checked={platform.allowResumeUploads} onChange={(v) => update('platform', 'allowResumeUploads', v)} label="Allow resume uploads" description="Users can upload and replace their resume from their dashboard." />
        </div>
        <div className={`grid grid-cols-1 gap-4 border-t p-5 sm:grid-cols-2 sm:p-6 ${divider}`}>
          <Field id="default-plan" label="Default plan for new users">
            <Select id="default-plan" value={platform.defaultPlan} onChange={(v) => update('platform', 'defaultPlan', v)} options={[{ value: 'free', label: 'Free' }, { value: 'trial', label: '7-day trial' }, { value: 'basic', label: 'Basic' }]} />
          </Field>
          <Field id="session-timeout" label="Admin session timeout">
            <Select id="session-timeout" value={platform.sessionTimeout} onChange={(v) => update('platform', 'sessionTimeout', v)} options={[{ value: '15', label: '15 minutes' }, { value: '60', label: '1 hour' }, { value: '480', label: '8 hours' }, { value: '1440', label: '24 hours' }]} />
          </Field>
        </div>
      </Card>
    </div>
  )

  const sectionProfile = (
    <Card icon="user" title="My profile" description="Your details as they appear in the audit log and on admin actions.">
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <span className={`flex size-20 items-center justify-center rounded-2xl text-3xl font-semibold ${chip}`}>
            {(profile.displayName || signedInAdminEmail).charAt(0).toUpperCase()}
          </span>
          <p className={`text-xs ${muted}`}>Initial from your name</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="display-name" label="Display name">
              <input id="display-name" className={inputClass} value={profile.displayName} onChange={(e) => update('profile', 'displayName', e.target.value)} />
            </Field>
            <Field id="job-title" label="Job title">
              <input id="job-title" className={inputClass} value={profile.jobTitle} onChange={(e) => update('profile', 'jobTitle', e.target.value)} />
            </Field>
            <Field id="profile-email" label="Email" hint="Sign-in email can only be changed by another admin.">
              <input id="profile-email" className={`${inputClass} opacity-70`} value={signedInAdminEmail} readOnly />
            </Field>
            <Field id="profile-phone" label="Phone number">
              <input id="profile-phone" type="tel" className={inputClass} placeholder="+91 98765 43210" value={profile.phone} onChange={(e) => update('profile', 'phone', e.target.value)} />
            </Field>
          </div>
          <div className={`divide-y rounded-xl border px-4 ${divider}`}>
            <Toggle id="two-factor" checked={profile.twoFactor} onChange={(v) => update('profile', 'twoFactor', v)} label="Two-factor authentication" description="Ask for a code from your authenticator app when you sign in." />
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-semibold">Password</p>
                <p className={`mt-1 text-xs ${muted}`}>Send a reset link to {signedInAdminEmail}.</p>
              </div>
              <button type="button" className={buttonSecondary} onClick={() => setNotice(`Password reset link requested for ${signedInAdminEmail}.`)}>
                Send reset link
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  const sectionNotifications = (
    <Card icon="bell" title="Notifications" description="Choose which events alert you, and where the alerts go.">
      <div className={`divide-y px-5 sm:px-6 ${divider}`}>
        <Toggle id="n-job-failure" checked={notifications.jobFailure} onChange={(v) => update('notifications', 'jobFailure', v)} label="Job failure alerts" description="Alert me when a job fetch or application run fails." />
        {notifications.jobFailure && (
          <div className="py-4 sm:max-w-xs">
            <Field id="n-threshold" label="Alert after consecutive failures" hint="Avoids noise from one-off errors.">
              <Select id="n-threshold" value={notifications.failureThreshold} onChange={(v) => update('notifications', 'failureThreshold', v)} options={[{ value: '1', label: '1 failure' }, { value: '3', label: '3 failures' }, { value: '5', label: '5 failures' }, { value: '10', label: '10 failures' }]} />
            </Field>
          </div>
        )}
        <Toggle id="n-source-blocked" checked={notifications.sourceBlocked} onChange={(v) => update('notifications', 'sourceBlocked', v)} label="Source blocked or stalled" description="Alert me when a job source is blocked or stops returning jobs." />
        <Toggle id="n-payment-failed" checked={notifications.paymentFailed} onChange={(v) => update('notifications', 'paymentFailed', v)} label="Payment failures" description="Alert me when a subscription payment fails or is refunded." />
        <Toggle id="n-digest" checked={notifications.newSignupDigest} onChange={(v) => update('notifications', 'newSignupDigest', v)} label="Sign-up summary" description="Receive a summary of new users and plan changes." />
        {notifications.newSignupDigest && (
          <div className="py-4 sm:max-w-xs">
            <Field id="n-digest-frequency" label="Summary frequency">
              <Select id="n-digest-frequency" value={notifications.digestFrequency} onChange={(v) => update('notifications', 'digestFrequency', v)} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />
            </Field>
          </div>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-4 border-t p-5 sm:p-6 lg:grid-cols-2 ${divider}`}>
        <Field id="n-recipients" label="Email recipients" hint="Separate multiple addresses with commas.">
          <input id="n-recipients" className={inputClass} value={notifications.emailRecipients} onChange={(e) => update('notifications', 'emailRecipients', e.target.value)} />
        </Field>
        <Field id="n-slack" label="Slack webhook URL" hint="Optional. Alerts are also posted to this channel.">
          <input id="n-slack" type="url" className={inputClass} placeholder="https://hooks.slack.com/services/…" value={notifications.slackWebhook} onChange={(e) => update('notifications', 'slackWebhook', e.target.value)} />
        </Field>
      </div>
      <div className={`border-t px-5 sm:px-6 ${divider}`}>
        <Toggle id="n-quiet" checked={notifications.quietHours} onChange={(v) => update('notifications', 'quietHours', v)} label="Quiet hours" description={`Hold non-critical alerts. Times follow ${general.timezone}.`} />
        {notifications.quietHours && (
          <div className="grid grid-cols-2 gap-4 pb-5 sm:max-w-sm">
            <Field id="n-quiet-from" label="From">
              <input id="n-quiet-from" type="time" className={inputClass} value={notifications.quietFrom} onChange={(e) => update('notifications', 'quietFrom', e.target.value)} />
            </Field>
            <Field id="n-quiet-to" label="To">
              <input id="n-quiet-to" type="time" className={inputClass} value={notifications.quietTo} onChange={(e) => update('notifications', 'quietTo', e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </Card>
  )

  const sectionApi = (
    <div className="space-y-5">
      <Card icon="key" title="API keys" description="Create keys for scripts and partner systems. A key is shown once, so copy it when it is created.">
        <div className="p-5 sm:p-6">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={createApiKey}>
            <label className="sr-only" htmlFor="api-key-name">Key name</label>
            <input id="api-key-name" className={inputClass} placeholder="Key name, e.g. Reporting script" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            <button type="submit" className={`${buttonPrimary} shrink-0`} disabled={!newKeyName.trim()}>
              <Icon name="add" />
              Create key
            </button>
          </form>

          {revealedKey && (
            <div className={`mt-4 rounded-xl border p-4 ${isDark ? 'border-emerald-900/60 bg-emerald-950/30' : 'border-emerald-100 bg-emerald-50'}`}>
              <p className={`text-xs font-semibold ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>Copy your new key now. It will not be shown again.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className={`min-w-0 flex-1 break-all rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-[#0c1326] text-slate-100' : 'bg-white text-slate-800'}`}>{revealedKey}</code>
                <button type="button" className={buttonSecondary} onClick={copyKey}><Icon name="copy" />Copy</button>
                <button type="button" className={buttonSecondary} onClick={() => setRevealedKey(null)}>Done</button>
              </div>
            </div>
          )}

          <ul className={`mt-4 divide-y ${divider}`}>
            {apiKeys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 py-3.5">
                <span className={`rounded-lg p-2 ${chip}`}><Icon name="key" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{key.name}</p>
                  <p className={`mt-0.5 text-xs ${muted}`}>{key.prefix}… · Created {formatAddedDate(key.createdAt)}</p>
                </div>
                <button type="button" className={`${buttonSecondary} ${isDark ? 'text-rose-300' : 'text-rose-600'}`} onClick={() => setApiKeys((prev) => prev.filter((k) => k.id !== key.id))}>
                  Revoke
                </button>
              </li>
            ))}
            {!apiKeys.length && <li className={`py-8 text-center text-sm ${muted}`}>No API keys yet. Create one to connect an external system.</li>}
          </ul>
        </div>
      </Card>

      <Card icon="server" title="Webhooks & limits" description="Send platform events to your own systems and control API usage.">
        <div className="space-y-4 p-5 sm:p-6">
          <Field id="webhook-url" label="Webhook endpoint" hint="We send a signed POST request to this URL for each selected event.">
            <input id="webhook-url" type="url" className={inputClass} placeholder="https://example.com/hooks/aifagen" value={api.webhookUrl} onChange={(e) => update('api', 'webhookUrl', e.target.value)} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold">Events</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(api.webhookEvents).map(([evt, on]) => (
                <label key={evt} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${divider} ${on ? chip : muted}`}>
                  <input type="checkbox" className="size-3.5" checked={on} onChange={(e) => updateNested('api', 'webhookEvents', evt, e.target.checked)} />
                  {evt}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="rate-limit" label="Rate limit (requests per minute)">
              <input id="rate-limit" type="number" min="10" className={inputClass} value={api.rateLimit} onChange={(e) => update('api', 'rateLimit', e.target.value)} />
            </Field>
            <Field id="allowed-origins" label="Allowed origins" hint="Comma-separated. Leave empty to allow all.">
              <input id="allowed-origins" className={inputClass} placeholder="https://www.aifagenlabs.com" value={api.allowedOrigins} onChange={(e) => update('api', 'allowedOrigins', e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>
    </div>
  )

  const sectionAggregation = (
    <div className="space-y-5">
      <Card icon="layers" title="Job aggregation" description="Control how often jobs are collected, cleaned and removed.">
        <div className={`divide-y px-5 sm:px-6 ${divider}`}>
          <Toggle id="auto-sync" checked={aggregation.autoSync} onChange={(v) => update('aggregation', 'autoSync', v)} label="Automatic sync" description="Fetch new jobs from all enabled sources on a schedule." />
          <Toggle id="dedupe" checked={aggregation.removeDuplicates} onChange={(v) => update('aggregation', 'removeDuplicates', v)} label="Remove duplicate jobs" description="Merge the same job posted on several platforms into one listing." />
          <Toggle id="retry" checked={aggregation.retryFailed} onChange={(v) => update('aggregation', 'retryFailed', v)} label="Retry failed fetches" description="Try a failed source again before counting it as a failure." />
        </div>
        <div className={`grid grid-cols-1 gap-4 border-t p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4 ${divider}`}>
          <Field id="agg-interval" label="Sync interval">
            <Select id="agg-interval" value={aggregation.interval} onChange={(v) => update('aggregation', 'interval', v)} options={[{ value: '15', label: 'Every 15 minutes' }, { value: '30', label: 'Every 30 minutes' }, { value: '60', label: 'Every hour' }, { value: '360', label: 'Every 6 hours' }, { value: '1440', label: 'Daily' }]} />
          </Field>
          <Field id="agg-max" label="Max jobs per run">
            <input id="agg-max" type="number" min="50" className={inputClass} value={aggregation.maxJobsPerRun} onChange={(e) => update('aggregation', 'maxJobsPerRun', e.target.value)} />
          </Field>
          <Field id="agg-pause" label="Pause source after" hint="Consecutive failures.">
            <input id="agg-pause" type="number" min="1" className={inputClass} value={aggregation.pauseAfterFailures} onChange={(e) => update('aggregation', 'pauseAfterFailures', e.target.value)} />
          </Field>
          <Field id="agg-expire" label="Expire jobs after" hint="Days since posting.">
            <input id="agg-expire" type="number" min="1" className={inputClass} value={aggregation.expireAfterDays} onChange={(e) => update('aggregation', 'expireAfterDays', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card icon="server" title="Sources" description="Turn individual job sources on or off for automatic sync.">
        <ul className={`divide-y px-5 sm:px-6 ${divider}`}>
          {sources.map((source) => {
            const enabled = aggregation.sourceEnabled[source.name] ?? true
            return (
              <li key={source.id ?? source.name}>
                <Toggle
                  id={`source-${source.name}`}
                  checked={enabled}
                  onChange={(v) => updateNested('aggregation', 'sourceEnabled', source.name, v)}
                  label={source.name}
                  description={source.status ? `Current status: ${source.status}` : undefined}
                />
              </li>
            )
          })}
          {!sources.length && <li className={`py-8 text-center text-sm ${muted}`}>No job sources are available yet.</li>}
        </ul>
      </Card>
    </div>
  )

  const sectionCloud = (
    <Card icon="cloud" title="Cloud & storage" description="Hosting region, file storage, backups and log retention for the platform.">
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Field id="cloud-env" label="Environment">
          <Select id="cloud-env" value={cloud.environment} onChange={(v) => update('cloud', 'environment', v)} options={[{ value: 'production', label: 'Production' }, { value: 'staging', label: 'Staging' }, { value: 'development', label: 'Development' }]} />
        </Field>
        <Field id="cloud-region" label="Primary region">
          <Select id="cloud-region" value={cloud.region} onChange={(v) => update('cloud', 'region', v)} options={[{ value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' }, { value: 'us-east-1', label: 'US East (N. Virginia)' }, { value: 'us-west-2', label: 'US West (Oregon)' }, { value: 'eu-west-1', label: 'Europe (Ireland)' }]} />
        </Field>
        <Field id="cloud-bucket" label="Storage bucket" hint="Where resumes and exports are stored.">
          <input id="cloud-bucket" className={inputClass} placeholder="aifagen-resumes-prod" value={cloud.storageBucket} onChange={(e) => update('cloud', 'storageBucket', e.target.value)} />
        </Field>
        <Field id="cloud-backup" label="Backup frequency">
          <Select id="cloud-backup" value={cloud.backupFrequency} onChange={(v) => update('cloud', 'backupFrequency', v)} options={[{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />
        </Field>
        <Field id="cloud-backup-ret" label="Keep backups for (days)">
          <input id="cloud-backup-ret" type="number" min="1" className={inputClass} value={cloud.backupRetention} onChange={(e) => update('cloud', 'backupRetention', e.target.value)} />
        </Field>
        <Field id="cloud-log-ret" label="Keep logs for (days)">
          <input id="cloud-log-ret" type="number" min="1" className={inputClass} value={cloud.logRetention} onChange={(e) => update('cloud', 'logRetention', e.target.value)} />
        </Field>
      </div>
      <div className={`border-t px-5 sm:px-6 ${divider}`}>
        <Toggle id="cloud-cdn" checked={cloud.cdn} onChange={(v) => update('cloud', 'cdn', v)} label="Serve files through a CDN" description="Speeds up resume and asset downloads for users in other regions." />
      </div>
    </Card>
  )

  const sectionAdmins = (
    <section aria-labelledby="admins-title" className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6 ${divider}`}>
        <div className="flex items-start gap-3">
          <span className={`rounded-xl p-2.5 ${chip}`}><Icon name="users" className="size-5" /></span>
          <div>
            <h2 id="admins-title" className="text-base font-semibold">Admin access</h2>
            <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>Add trusted administrators and review who can manage this workspace.</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isDark ? 'border-[#34445e] text-slate-300' : 'border-slate-200 text-slate-600'}`}>
          {admins.length} member{admins.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`border-b p-5 sm:p-6 xl:border-b-0 xl:border-r ${divider}`}>
          <h3 className="text-sm font-semibold">Add an administrator</h3>
          <p className={`mt-1 text-sm leading-5 ${muted}`}>Enter the email address of the teammate who should receive admin access.</p>
          <form className="mt-5 space-y-3" onSubmit={addAdmin}>
            <label htmlFor="new-admin-email" className="block text-xs font-semibold">Work email address</label>
            <input
              id="new-admin-email"
              aria-describedby={emailError ? 'new-admin-error' : 'admin-email-help'}
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              className={inputClass}
              onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
              placeholder="teammate@aifagen.com"
              required
              type="email"
              value={email}
            />
            {emailError ? (
              <p id="new-admin-error" className="text-xs text-rose-500" role="alert">{emailError}</p>
            ) : (
              <p id="admin-email-help" className={`text-xs leading-5 ${muted}`}>Use a valid email. Duplicate addresses are not allowed.</p>
            )}
            <button className={`${buttonPrimary} h-11 w-full sm:w-auto`} type="submit">
              <Icon name="add" />
              Add administrator
            </button>
          </form>
          <div className={`mt-5 rounded-xl border p-3 ${isDark ? 'border-[#263249] bg-[#121e33]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-start gap-2.5">
              <Icon name="shield" className={`mt-0.5 size-4 shrink-0 ${muted}`} />
              <p className={`text-xs leading-5 ${muted}`}>Admins may have access to sensitive candidate and payment information. Grant access only to people who need it.</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Current administrators</h3>
              <p className={`mt-1 text-xs ${muted}`}>Manage existing workspace access.</p>
            </div>
            <label className="relative block w-full sm:max-w-[220px]">
              <span className="sr-only">Search administrators</span>
              <input className={inputClass} onChange={(e) => setSearchAdmin(e.target.value)} placeholder="Find admin..." type="search" value={searchAdmin} />
            </label>
          </div>

          <ul className={`mt-4 divide-y ${divider}`}>
            {filteredAdmins.map((admin) => {
              const isCurrent = admin.email?.toLowerCase() === signedInAdminEmail
              const cannotRemove = isCurrent || admins.length <= 1
              return (
                <li key={admin.id ?? admin.email} className="flex min-w-0 items-center gap-3 py-4">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${chip}`}>
                    {(admin.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold">
                      {admin.email}
                      {isCurrent && <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-[#263249] text-slate-200' : 'bg-slate-100 text-slate-600'}`}>You</span>}
                    </p>
                    <p className={`mt-1 text-xs ${muted}`}>Added {formatAddedDate(admin.addedAt)}</p>
                  </div>
                  <button
                    aria-label={`Remove admin ${admin.email}`}
                    className={`shrink-0 rounded-xl border p-2.5 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                      cannotRemove
                        ? isDark ? 'border-[#263249] text-slate-500' : 'border-slate-200 text-slate-400'
                        : isDark ? 'border-[#34445e] text-rose-300 hover:bg-rose-400/10' : 'border-slate-200 text-rose-600 hover:bg-rose-50'
                    }`}
                    disabled={cannotRemove}
                    onClick={() => setAdminToRemove(admin)}
                    title={cannotRemove ? 'You cannot remove yourself or the last admin' : 'Remove admin'}
                    type="button"
                  >
                    <Icon name="trash" />
                  </button>
                </li>
              )
            })}
            {!filteredAdmins.length && (
              <li className={`py-10 text-center text-sm ${muted}`}>
                {admins.length ? 'No administrators match this search.' : 'No administrators found.'}
              </li>
            )}
          </ul>
          <p className={`mt-3 text-xs leading-5 ${muted}`}>You cannot remove your own account or the last remaining administrator.</p>
        </div>
      </div>
    </section>
  )

  const sectionServices = (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Administrators', value: admins.length, note: 'People with admin access in this view', icon: 'users' },
          { label: 'Healthy integrations', value: connectedCount, total: connectedServices.length, note: 'Based on current configuration checks', icon: 'check' },
          { label: 'Needs attention', value: attentionCount, note: 'Demo or unconfigured services included', icon: 'warning' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm ${muted}`}>{stat.label}</p>
              <span className={`rounded-lg p-2 ${chip}`}><Icon name={stat.icon} /></span>
            </div>
            <p className={`mt-3 text-3xl font-semibold tracking-tight ${strong}`}>
              {stat.value}
              {stat.total && <span className={`ml-1 text-base font-medium ${muted}`}>/ {stat.total}</span>}
            </p>
            <p className={`mt-1 text-xs ${muted}`}>{stat.note}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="services-title" className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
        <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6 ${divider}`}>
          <div className="flex items-start gap-3">
            <span className={`rounded-xl p-2.5 ${chip}`}><Icon name="server" className="size-5" /></span>
            <div>
              <h2 id="services-title" className="text-base font-semibold">Connected services</h2>
              <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>Review the current configuration status of services used by the application.</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
            attentionCount
              ? isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'
              : isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <span className={`size-1.5 rounded-full ${attentionCount ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {attentionCount ? 'Configuration required' : 'All checks clear'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
          {connectedServices.map((service, index) => (
            <div
              key={service.name}
              className={`flex min-w-0 gap-3 p-5 sm:p-6 ${index % 2 === 0 ? `md:border-r ${divider}` : ''} ${index >= 2 ? `border-t ${divider}` : ''}`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                service.ok
                  ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  : isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'
              }`}>
                <Icon name={service.ok ? 'check' : 'warning'} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{service.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    service.ok
                      ? isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {service.status}
                  </span>
                </div>
                <p className={`mt-1 text-xs font-medium ${muted}`}>{service.provider}</p>
                <p className={`mt-2 text-sm leading-5 ${muted}`}>{service.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`border-t px-5 py-3 sm:px-6 ${divider}`}>
          <p className={`text-xs leading-5 ${muted}`}>These indicators reflect the configuration information currently available to this page; they are not live connectivity tests.</p>
        </div>
      </section>
    </div>
  )

  const sections = {
    general: sectionGeneral,
    platform: sectionPlatform,
    profile: sectionProfile,
    notifications: sectionNotifications,
    api: sectionApi,
    aggregation: sectionAggregation,
    cloud: sectionCloud,
    admins: sectionAdmins,
    services: sectionServices,
  }

  // Admin access and Connected services save immediately; the rest use the save bar.
  const usesSaveBar = !['admins', 'services'].includes(activeSection)

  return (
    <ThemeContext.Provider value={{ surface, divider, chip, muted, inputClass, isDark }}>
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${muted}`}>
            <Icon name="shield" className="size-3.5" />
            Workspace administration
          </div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Settings</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>
            Configure the platform, manage administrator access and monitor the integrations that power your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('services')}
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${surface}`}
        >
          <span className={`size-2 rounded-full ${attentionCount ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {attentionCount} integration{attentionCount === 1 ? '' : 's'} need attention
        </button>
      </header>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDark ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200' : 'border-emerald-100 bg-emerald-50 text-emerald-800'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <Icon name="check" />
            <span>{notice}</span>
          </div>
          <button aria-label="Dismiss notification" className="rounded-md px-2 py-1 text-xs font-semibold hover:underline" onClick={() => setNotice('')} type="button">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-5">
          <nav aria-label="Settings sections" className={`flex gap-1 overflow-x-auto rounded-2xl border p-2 lg:flex-col lg:overflow-visible ${surface}`}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                  activeSection === item.id
                    ? isDark ? 'bg-[#202d43] text-white' : 'bg-slate-100 text-slate-900'
                    : `${muted} ${isDark ? 'hover:bg-[#18243a] hover:text-slate-100' : 'hover:bg-slate-50 hover:text-slate-900'}`
                }`}
              >
                <Icon name={item.icon} className="size-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-5">
          {sections[activeSection]}

          {usesSaveBar && (
            <div className={`sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg ${surface}`}>
              <p className={`text-sm ${isDirty ? strong : muted}`}>
                {isDirty ? 'You have unsaved changes.' : 'All changes are saved.'}
              </p>
              <div className="flex gap-2">
                <button type="button" className={`${buttonSecondary} disabled:opacity-40`} disabled={!isDirty} onClick={discardChanges}>
                  Discard
                </button>
                <button type="button" className={`${buttonPrimary} disabled:opacity-40`} disabled={!isDirty} onClick={saveSettings}>
                  Save changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {maintenanceConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button aria-label="Cancel" className="absolute inset-0 bg-slate-950/60" onClick={() => setMaintenanceConfirm(false)} type="button" />
          <section aria-modal="true" role="dialog" aria-labelledby="maint-title" className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6 ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
            <div className={`flex size-11 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
              <Icon name="warning" className="size-5" />
            </div>
            <h2 id="maint-title" className="mt-4 text-lg font-semibold">Turn on maintenance mode?</h2>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              Users will not be able to use the site until you turn this off again. Save your settings to apply the change.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={buttonSecondary} onClick={() => setMaintenanceConfirm(false)}>Cancel</button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700"
                onClick={() => { update('platform', 'maintenanceMode', true); setMaintenanceConfirm(false) }}
              >
                Turn on
              </button>
            </div>
          </section>
        </div>
      )}

      {adminToRemove && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button aria-label="Cancel admin removal" className="absolute inset-0 bg-slate-950/60" onClick={() => setAdminToRemove(null)} type="button" />
          <section
            aria-labelledby="remove-admin-title"
            aria-modal="true"
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6 ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
            role="dialog"
          >
            <div className={`flex size-11 items-center justify-center rounded-xl ${isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>
              <Icon name="warning" className="size-5" />
            </div>
            <h2 id="remove-admin-title" className="mt-4 text-lg font-semibold">Remove administrator?</h2>
            <p className={`mt-2 break-words text-sm leading-6 ${muted}`}>
              Remove <span className="font-semibold">{adminToRemove.email}</span> from the admin list? This action should also revoke their permissions in your backend.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={removeCancelRef} className={buttonSecondary} onClick={() => setAdminToRemove(null)} type="button">Cancel</button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700" onClick={confirmRemoveAdmin} type="button">
                <Icon name="trash" />
                Remove admin
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
    </ThemeContext.Provider>
  )
}

export default Settings
