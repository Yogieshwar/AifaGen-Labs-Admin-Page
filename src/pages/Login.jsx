import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signIn } from '../auth.js'
import logo from '../assets/aifa-logo-mark.jfif'

const DEFAULT_DEMO_EMAIL = 'admin@aifagen.com'
const DEFAULT_DEMO_PASSWORD = 'password'

const features = [
  {
    icon: 'users',
    title: 'Candidate pipeline',
    text: 'Follow every applicant from sourcing to placement.',
  },
  {
    icon: 'feed',
    title: 'Job source monitoring',
    text: 'See which feeds are healthy, stalled or blocked.',
  },
  {
    icon: 'chart',
    title: 'Placement analytics',
    text: 'Conversion, revenue and recruiter performance in one view.',
  },
]

function Icon({ name, className = 'size-4' }) {
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6A16.5 16.5 0 0 0 2 12s3.6 6 10 6a9.6 9.6 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    feed: <><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></>,
  }
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a1f] to-[#0e0e12] shadow-[0_0_0_1px_rgba(234,88,12,0.25),0_8px_24px_-8px_rgba(234,88,12,0.45)]">
        <img src={logo} alt="" className="size-7 object-contain" />
      </span>
      <div>
        <p className="text-lg font-bold leading-none tracking-wide text-white">AIFA GEN LABS</p>
        {!compact && <p className="mt-1.5 text-xs text-orange-400">Recruitment operations</p>}
      </div>
    </div>
  )
}

/**
 * Props
 *  - onLogin({ email, password, remember }) => Promise  (throw an Error to show its message)
 *  - demoEmail?: string   (shows a "use demo email" shortcut; omit in production)
 *  - demoPassword?: string
 *  - onForgotPassword?: () => void
 */
function Login({
  onLogin,
  onForgotPassword,
  demoEmail = DEFAULT_DEMO_EMAIL,
  demoPassword = DEFAULT_DEMO_PASSWORD,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  async function loginWithCredentials(loginEmail, loginPassword) {
    const cleanEmail = loginEmail.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (!loginPassword) {
      setError('Enter your password.')
      return
    }

    setError('')
    setLoading(true)
    try {
      if (onLogin) {
        await onLogin({ email: cleanEmail, password: loginPassword, remember })
      } else {
        if (cleanEmail.toLowerCase() !== demoEmail.toLowerCase()) {
          setError('Use the demo email address shown below.')
          return
        }
        signIn()
      }
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'We could not sign you in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    return loginWithCredentials(email, password)
  }

  function handleDemoLogin() {
    setEmail(demoEmail)
    setPassword(demoPassword)
    return loginWithCredentials(demoEmail, demoPassword)
  }

  const inputWrap =
    'group flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/15'

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#09090c] text-white lg:grid-cols-[1.15fr_0.85fr]">
      {/* background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), radial-gradient(60% 50% at 18% 0%, rgba(234,88,12,0.18), transparent 70%)',
          backgroundSize: '28px 28px, 100% 100%',
        }}
      />

      {/* left: brand story */}
      <section className="relative hidden flex-col justify-between p-12 lg:flex xl:p-16">
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[min(70vw,34rem)] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] grayscale"
        />
        <div className="relative z-10">
          <Brand />
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Hire smarter.
            <span className="block text-orange-500">Place faster.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            The AIFA Gen Labs admin workspace for managing candidates, job sources and platform performance in one place.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-400">
                  <Icon name={f.icon} className="size-[18px]" />
                </span>
                <p className="pt-0.5 text-sm leading-6 text-slate-400">
                  <span className="font-semibold text-white">{f.title}</span>
                  <span className="mx-2 text-slate-600">—</span>
                  {f.text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} AIFA Gen Labs. Authorized staff only.</p>
      </section>

      {/* right: sign-in card */}
      <section className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Brand compact />
        </div>

        <div className="w-full max-w-[460px] rounded-[28px] bg-white p-7 text-slate-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-10">
          <p className="text-sm font-semibold text-orange-600">Admin workspace</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#0b1020]">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to the AIFA Gen Labs admin workspace.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
              <div className={inputWrap}>
                <Icon name="mail" className="size-[18px] shrink-0 text-slate-400 group-focus-within:text-orange-600" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@aifagen.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-800">Password</label>
              <div className={inputWrap}>
                <Icon name="lock" className="size-[18px] shrink-0 text-slate-400 group-focus-within:text-orange-600" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-[18px] rounded border-slate-300 accent-orange-600"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="rounded-md text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(234,88,12,0.7)] transition hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          {demoEmail && demoPassword && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="min-w-0">
                Demo: <span className="font-medium text-slate-700">{demoEmail}</span>
                <span className="mx-1">/</span>
                <span className="font-medium text-slate-700">{demoPassword}</span>
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={handleDemoLogin}
                className="shrink-0 font-semibold text-orange-600 hover:text-orange-700"
              >
                Demo login
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-slate-500 lg:hidden">© {new Date().getFullYear()} AIFA Gen Labs</p>
      </section>
    </div>
  )
}

export default Login
