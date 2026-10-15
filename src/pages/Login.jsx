import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated, signIn } from '../auth.js'

function Login() {
  const [email, setEmail] = useState('admin@aifagen.com')
  const [password, setPassword] = useState('password')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (email.trim().toLowerCase() !== 'admin@aifagen.com') {
      setIsError(true)
      setMessage('Use the demo email address shown below.')
      return
    }

    signIn()
    setIsError(false)
    navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
  }

  return (
    <main className="login-page flex min-h-screen items-center justify-center bg-[#0c1326] px-4 py-8 text-slate-100">
      <section
        aria-labelledby="login-title"
        className="login-card w-full max-w-[452px] rounded-2xl border border-[#232c40] bg-[#10192d] px-7 py-7 shadow-[0_2px_5px_rgba(0,0,0,0.12)]"
      >
        <header className="mb-7 text-center">
          <div
            aria-hidden="true"
            className="login-mark mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-200 text-lg font-bold text-[#10192d]"
          >
            AI
          </div>
          <h1 id="login-title" className="text-[22px] leading-7 font-bold tracking-tight">
            AIFAGen Admin Portal
          </h1>
          <p className="mt-1 text-base leading-6 text-[#91a9c9]">
            Internal tool — sign in with your admin account
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email" className="mb-1 block text-base font-semibold">
              Email
            </label>
            <input
              autoComplete="username"
              className="h-[43px] w-full rounded-[11px] border border-[#2a3449] bg-transparent px-3.5 text-base text-[#91a9c9] outline-none transition focus:border-[#91a9c9] focus:ring-2 focus:ring-[#91a9c9]/20"
              id="login-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-base font-semibold">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-[43px] w-full rounded-[11px] border border-[#2a3449] bg-transparent px-3.5 text-base text-[#91a9c9] outline-none transition focus:border-[#91a9c9] focus:ring-2 focus:ring-[#91a9c9]/20"
              id="login-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <button
            className="login-primary-button h-[43px] w-full rounded-[11px] bg-slate-200 text-base font-semibold text-[#10192d] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 active:scale-[0.99]"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <p
          aria-live="polite"
          className={`mt-4 min-h-5 text-center text-sm leading-5 ${
            message ? (isError ? 'text-rose-300' : 'text-emerald-300') : 'text-[#91a9c9]'
          }`}
        >
          {message || (
            <>
              Demo: use <span className="font-mono">admin@aifagen.com</span> with any password.
            </>
          )}
        </p>
      </section>
    </main>
  )
}

export default Login
