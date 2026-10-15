import { useEffect, useMemo, useRef, useState } from 'react'

const signedInAdminEmail = 'admin@aifagen.com'

function formatAddedDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
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
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name] || paths.server}
    </svg>
  )
}

function Settings({ admins = [], onAdminChange, sourceData = { sources: [] }, isDark }) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [adminToRemove, setAdminToRemove] = useState(null)
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [searchAdmin, setSearchAdmin] = useState('')
  const removeCancelRef = useRef(null)

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'
  const divider = isDark ? 'border-[#263249]' : 'border-slate-200'
  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? 'border-[#34445e] bg-[#0c1326] text-slate-100 placeholder:text-[#91a9c9] focus:border-[#53657d] focus:ring-[#53657d]'
      : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-200'
  }`
  const buttonSecondary = `inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
    isDark
      ? 'border-[#34445e] text-slate-200 hover:bg-[#18243a]'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
  }`

  const attentionSources = (sourceData?.sources ?? []).filter((source) =>
    ['Blocked', 'Stalled'].includes(source.status)
  )

  const connectedServices = [
    {
      name: 'Payment provider',
      provider: 'Razorpay',
      description: 'Payment provider credentials are not connected.',
      status: 'Not connected',
      ok: false,
    },
    {
      name: 'Email delivery',
      provider: 'Resend',
      description: 'Sender domain and delivery credentials are not connected.',
      status: 'Not connected',
      ok: false,
    },
    {
      name: 'AI gateway',
      provider: 'AI provider',
      description: 'Usage charts currently use simulated provider data.',
      status: 'Demo data',
      ok: false,
    },
    {
      name: 'Job source workers',
      provider: 'Job collection',
      description: attentionSources.length
        ? `${attentionSources.length} source${attentionSources.length === 1 ? '' : 's'} need attention: ${attentionSources.map((source) => source.name).join(', ')}.`
        : 'No blocked or stalled sources are currently reported.',
      status: attentionSources.length ? 'Needs attention' : 'No issues detected',
      ok: attentionSources.length === 0,
    },
    {
      name: 'Object storage',
      provider: 'Resume files',
      description: 'Resume downloads use demo PDFs; no storage bucket is connected.',
      status: 'Not connected',
      ok: false,
    },
    {
      name: 'Error tracking',
      provider: 'Sentry',
      description: 'The production DSN is not configured.',
      status: 'Not configured',
      ok: false,
    },
  ]

  const filteredAdmins = useMemo(() => {
    const query = searchAdmin.trim().toLowerCase()
    if (!query) return admins
    return admins.filter((admin) => admin.email?.toLowerCase().includes(query))
  }, [admins, searchAdmin])

  const connectedCount = connectedServices.filter((service) => service.ok).length
  const attentionCount = connectedServices.length - connectedCount

  useEffect(() => {
    if (!adminToRemove) return
    removeCancelRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setAdminToRemove(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [adminToRemove])

  function addAdmin(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.')
      return
    }

    if (admins.some((admin) => admin.email?.toLowerCase() === normalizedEmail)) {
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
    if (
      !adminToRemove ||
      adminToRemove.email?.toLowerCase() === signedInAdminEmail ||
      admins.length <= 1
    ) {
      setAdminToRemove(null)
      return
    }

    onAdminChange?.({ type: 'removed', admin: adminToRemove })
    setNotice(`${adminToRemove.email} removed from the admin list.`)
    setAdminToRemove(null)
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'server' },
    { id: 'admins', label: 'Admin access', icon: 'users' },
    { id: 'services', label: 'Connected services', icon: 'shield' },
  ]

  function goToSection(id) {
    setActiveSection(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${muted}`}>
            <Icon name="shield" className="size-3.5" />
            Workspace administration
          </div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
            Settings
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>
            Manage administrator access and monitor the integrations that power your workspace.
          </p>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${surface}`}>
          <span className={`size-2 rounded-full ${attentionCount ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {attentionCount} integration{attentionCount === 1 ? '' : 's'} need attention
        </div>
      </header>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDark
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
              : 'border-emerald-100 bg-emerald-50 text-emerald-800'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <Icon name="check" />
            <span>{notice}</span>
          </div>
          <button
            aria-label="Dismiss notification"
            className="rounded-md px-2 py-1 text-xs font-semibold hover:underline"
            onClick={() => setNotice('')}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      
        <aside className="h-fit lg:sticky lg:top-5">
          {/* <nav aria-label="Settings sections" className={`rounded-2xl border p-2 ${surface}`}>
            <p className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>
              Settings menu
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToSection(item.id)}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeSection === item.id
                    ? isDark
                      ? 'bg-[#202d43] text-white'
                      : 'bg-slate-100 text-slate-900'
                    : `${muted} ${isDark ? 'hover:bg-[#18243a] hover:text-slate-100' : 'hover:bg-slate-50 hover:text-slate-900'}`
                }`}
              >
                <Icon name={item.icon} className="size-4 shrink-0" />
                {item.label}
                {activeSection === item.id && (
                  <span className={`ml-auto size-1.5 rounded-full ${isDark ? 'bg-slate-200' : 'bg-slate-700'}`} />
                )}
              </button>
            ))}
            <div className={`mx-3 my-3 border-t ${divider}`} />
            <div className={`px-3 pb-2 text-xs leading-5 ${muted}`}>
              Keep access limited to trusted team members and review integrations before production use.
            </div>
          </nav> */}
        </aside>

        <main className="min-w-0 space-y-5">
          <section id="settings-overview" className="scroll-mt-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${muted}`}>Administrators</p>
                  <span className={`rounded-lg p-2 ${isDark ? 'bg-[#202d43] text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon name="users" />
                  </span>
                </div>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {admins.length}
                </p>
                <p className={`mt-1 text-xs ${muted}`}>People with admin access in this view</p>
              </div>

              <div className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${muted}`}>Healthy integrations</p>
                  <span className={`rounded-lg p-2 ${isDark ? 'bg-[#202d43] text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon name="check" />
                  </span>
                </div>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {connectedCount}<span className={`ml-1 text-base font-medium ${muted}`}>/ {connectedServices.length}</span>
                </p>
                <p className={`mt-1 text-xs ${muted}`}>Based on current configuration checks</p>
              </div>

              <div className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${muted}`}>Needs attention</p>
                  <span className={`rounded-lg p-2 ${isDark ? 'bg-[#202d43] text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon name="warning" />
                  </span>
                </div>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {attentionCount}
                </p>
                <p className={`mt-1 text-xs ${muted}`}>Demo or unconfigured services included</p>
              </div>
            </div>
          </section>

          <section id="settings-admins" aria-labelledby="admins-title" className={`scroll-mt-5 overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
            <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6 ${divider}`}>
              <div className="flex items-start gap-3">
                <span className={`rounded-xl p-2.5 ${isDark ? 'bg-[#202d43] text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
                  <Icon name="users" className="size-5" />
                </span>
                <div>
                  <h2 id="admins-title" className="text-base font-semibold">Admin access</h2>
                  <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>
                    Add trusted administrators and review who can manage this workspace.
                  </p>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isDark ? 'border-[#34445e] text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                {admins.length} member{admins.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className={`border-b p-5 sm:p-6 xl:border-b-0 xl:border-r ${divider}`}>
                <h3 className="text-sm font-semibold">Add an administrator</h3>
                <p className={`mt-1 text-sm leading-5 ${muted}`}>
                  Enter the email address of the teammate who should receive admin access.
                </p>

                <form className="mt-5 space-y-3" onSubmit={addAdmin}>
                  <label htmlFor="new-admin-email" className="block text-xs font-semibold">
                    Work email address
                  </label>
                  <input
                    id="new-admin-email"
                    aria-describedby={emailError ? 'new-admin-error' : 'admin-email-help'}
                    aria-invalid={Boolean(emailError)}
                    autoComplete="email"
                    className={inputClass}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setEmailError('')
                    }}
                    placeholder="teammate@aifagen.com"
                    required
                    type="email"
                    value={email}
                  />
                  {emailError ? (
                    <p id="new-admin-error" className="text-xs text-rose-500" role="alert">{emailError}</p>
                  ) : (
                    <p id="admin-email-help" className={`text-xs leading-5 ${muted}`}>
                      Use a valid email. Duplicate addresses are not allowed.
                    </p>
                  )}
                  <button
                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:w-auto ${
                      isDark
                        ? 'bg-slate-100 text-slate-900 hover:bg-white'
                        : 'bg-[#172033] text-white hover:bg-[#26344e]'
                    }`}
                    type="submit"
                  >
                    <Icon name="add" />
                    Add administrator
                  </button>
                </form>

                <div className={`mt-5 rounded-xl border p-3 ${isDark ? 'border-[#263249] bg-[#121e33]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start gap-2.5">
                    <Icon name="shield" className={`mt-0.5 size-4 shrink-0 ${muted}`} />
                    <p className={`text-xs leading-5 ${muted}`}>
                      Admins may have access to sensitive candidate and payment information. Grant access only to people who need it.
                    </p>
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
                    <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}>
                      <Icon name="server" />
                    </span>
                    <input
                      className={`${inputClass} pl-9`}
                      onChange={(event) => setSearchAdmin(event.target.value)}
                      placeholder="Find admin..."
                      type="search"
                      value={searchAdmin}
                    />
                  </label>
                </div>

                <ul className={`mt-4 divide-y ${divider}`}>
                  {filteredAdmins.map((admin) => {
                    const isCurrent = admin.email?.toLowerCase() === signedInAdminEmail
                    const cannotRemove = isCurrent || admins.length <= 1
                    return (
                      <li key={admin.id ?? admin.email} className="flex min-w-0 items-center gap-3 py-4">
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                          isDark ? 'bg-[#202d43] text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}>
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
                <p className={`mt-3 text-xs leading-5 ${muted}`}>
                  You cannot remove your own account or the last remaining administrator.
                </p>
              </div>
            </div>
          </section>

          <section id="settings-services" aria-labelledby="services-title" className={`scroll-mt-5 overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
            <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6 ${divider}`}>
              <div className="flex items-start gap-3">
                <span className={`rounded-xl p-2.5 ${isDark ? 'bg-[#202d43] text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
                  <Icon name="server" className="size-5" />
                </span>
                <div>
                  <h2 id="services-title" className="text-base font-semibold">Connected services</h2>
                  <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>
                    Review the current configuration status of services used by the application.
                  </p>
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
                  className={`flex min-w-0 gap-3 p-5 sm:p-6 ${
                    index % 2 === 0 ? isDark ? 'md:border-r md:border-[#263249]' : 'md:border-r md:border-slate-200' : ''
                  } ${
                    index >= 2 ? isDark ? 'border-t border-[#263249]' : 'border-t border-slate-200' : ''
                  }`}
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
              <p className={`text-xs leading-5 ${muted}`}>
                These indicators reflect the configuration information currently available to this page; they are not live connectivity tests.
              </p>
            </div>
          </section>
        </main>
      

      {adminToRemove && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            aria-label="Cancel admin removal"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setAdminToRemove(null)}
            type="button"
          />
          <section
            aria-labelledby="remove-admin-title"
            aria-modal="true"
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6 ${
              isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
            }`}
            role="dialog"
          >
            <div className={`flex size-11 items-center justify-center rounded-xl ${
              isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-600'
            }`}>
              <Icon name="warning" className="size-5" />
            </div>
            <h2 id="remove-admin-title" className="mt-4 text-lg font-semibold">Remove administrator?</h2>
            <p className={`mt-2 break-words text-sm leading-6 ${muted}`}>
              Remove <span className="font-semibold">{adminToRemove.email}</span> from the admin list? This action should also revoke their permissions in your backend.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={removeCancelRef}
                className={buttonSecondary}
                onClick={() => setAdminToRemove(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                onClick={confirmRemoveAdmin}
                type="button"
              >
                <Icon name="trash" />
                Remove admin
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Settings
