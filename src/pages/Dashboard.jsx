import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../auth.js'
import dashboardData, { aiUsageEvents } from '../store/Data.js'
import JobsAndSources from './JobsAndSources.jsx'
import {
  loadAuditLog,
  loadAdmins,
  loadInternalJobs,
  loadJobSources,
  loadJobs,
  loadPayments,
  loadRecruiters,
  loadUsers,
  saveAuditLog,
  saveAdmins,
  saveInternalJobs,
  saveJobSources,
  saveJobs,
  savePayments,
  saveRecruiters,
  saveUsers,
} from '../store/userStore.js'
import Sidebar from './Sidebar.jsx'
import AdminNotifications from './AdminNotifications.jsx'
import { adminPages } from './adminPages.js'
import AuditLog from './AuditLog.jsx'
import Settings from './Settings.jsx'
import Users from './Users.jsx'
import AifaAssistant from './AifaAssistant.jsx'

const SignupChart = lazy(() => import('./SignupChart.jsx'))
const PlanSplitChart = lazy(() => import('./PlanSplitChart.jsx'))
const Jobs = lazy(() => import('./Jobs.jsx'))
const InternalJobs = lazy(() => import('./InternalJobs.jsx'))
const JobSources = lazy(() => import('./JobSources.jsx'))
const AIUsage = lazy(() => import('./AIUsage.jsx'))
const Payments = lazy(() => import('./Payments.jsx'))
const Recruiters = lazy(() => import('./Recruiters.jsx'))

const metricIcons = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  paying: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  revenue: (
    <>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  newUsers: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2M19 8v6M16 11h6" />
    </>
  ),
}

function MetricIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {metricIcons[name]}
    </svg>
  )
}

function getDaysUntil(dateString) {
  const [day, month, year] = dateString.split(' ')
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month)
  const expiryDate = Date.UTC(Number(year), monthIndex, Number(day))
  const today = new Date()
  const todayDate = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

  return Math.ceil((expiryDate - todayDate) / 86400000)
}

function Dashboard() {
  const [isDark, setIsDark] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [users, setUsers] = useState(loadUsers)
  const [auditEntries, setAuditEntries] = useState(loadAuditLog)
  const [admins, setAdmins] = useState(loadAdmins)
  const [internalJobs, setInternalJobs] = useState(loadInternalJobs)
  const [jobSourceData, setJobSourceData] = useState(loadJobSources)
  const [jobs, setJobs] = useState(loadJobs)
  const [payments, setPayments] = useState(loadPayments)
  const [recruiterData, setRecruiterData] = useState(loadRecruiters)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const currentPage = adminPages.find((page) => page.path === location.pathname) ?? adminPages[0]
  const previousPath = useRef(location.pathname)
  const sourcesNeedingAttention = jobSourceData.sources.filter((source) => source.status !== 'Working')
  const operationalSources = jobSourceData.sources.length - sourcesNeedingAttention.length
  const operationalPercent = jobSourceData.sources.length
    ? Math.round((operationalSources / jobSourceData.sources.length) * 100)
    : 0
  const plansEndingSoon = dashboardData.plansEndingSoon
    .map((plan) => ({ ...plan, daysLeft: getDaysUntil(plan.endingOn) }))
    .filter((plan) => plan.daysLeft >= 0 && plan.daysLeft <= 30)
    .sort((first, second) => first.daysLeft - second.daysLeft)

  useLayoutEffect(() => {
    if (previousPath.current === location.pathname) return undefined

    previousPath.current = location.pathname
    setIsPageLoading(true)
    const timeoutId = window.setTimeout(() => setIsPageLoading(false), 300)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname])

  useEffect(() => {
    saveUsers(users)
  }, [users])

  useEffect(() => {
    saveAuditLog(auditEntries)
  }, [auditEntries])

  useEffect(() => {
    saveAdmins(admins)
  }, [admins])

  useEffect(() => {
    savePayments(payments)
  }, [payments])

  useEffect(() => {
    saveJobs(jobs)
  }, [jobs])

  useEffect(() => {
    saveInternalJobs(internalJobs)
  }, [internalJobs])

  useEffect(() => {
    saveJobSources(jobSourceData)
  }, [jobSourceData])

  useEffect(() => {
    saveRecruiters(recruiterData)
  }, [recruiterData])

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  function handlePlanChange(user, change) {
    setUsers((current) =>
      current.map((entry) =>
        entry.id === user.id ? { ...entry, plan: change.plan, status: change.status } : entry,
      ),
    )
    setAuditEntries((current) => [
      {
        id: `${user.id}-${Date.now()}`,
        actor: 'admin@aifagen.com',
        createdAt: new Date().toISOString(),
        action: 'Plan and status updated',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        previousPlan: user.plan,
        newPlan: change.plan,
        previousStatus: user.status,
        newStatus: change.status,
        reason: change.reason,
      },
      ...current,
    ])
  }

  function handleProfileEdit(user, updatedUser) {
    const profileFields = [
      ['firstName', 'First name'],
      ['lastName', 'Last name'],
      ['email', 'Email / login email'],
      ['mobile', 'Mobile'],
      ['areaOfInterest', 'Area of interest'],
      ['headline', 'Headline'],
      ['location', 'Location'],
    ]
    const changedFields = profileFields
      .filter(([field]) => user[field] !== updatedUser[field])
      .map(([field, label]) => ({
        label,
        previousValue: user[field],
        newValue: updatedUser[field],
      }))

    if (changedFields.length) {
      setAuditEntries((current) => [
        {
          id: `profile-${user.id}-${Date.now()}`,
          eventType: 'profile_edit',
          actor: 'admin@aifagen.com',
          createdAt: new Date().toISOString(),
          action: 'Profile updated',
          userName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          changedFields,
          reason: 'Profile details updated by an administrator.',
        },
        ...current,
      ])
    }
  }

  function handleRefund(payment, refund) {
    setAuditEntries((current) => [
      {
        id: `refund-${payment.id}-${Date.now()}`,
        eventType: 'payment_refund',
        actor: 'admin@aifagen.com',
        createdAt: refund.createdAt,
        action: 'Payment refunded',
        userName: payment.userName,
        paymentId: payment.id,
        amount: refund.amount,
        reason: refund.reason,
      },
      ...current,
    ])
  }

  function handleJobVisibility(changes, jobType) {
    if (!changes.length) return
    const isVisible = changes[0].visible
    const action = `${changes.length > 1 ? 'Jobs' : 'Job'} ${isVisible ? 'shown' : 'hidden'}`
    const subject = changes.length === 1
      ? changes[0].title
      : `${changes.length} ${jobType} job listings`
    setAuditEntries((current) => [
      {
        id: `job-visibility-${Date.now()}`,
        eventType: 'job_visibility',
        actor: 'admin@aifagen.com',
        createdAt: new Date().toISOString(),
        action,
        userName: subject,
        jobType,
        jobChanges: changes,
      },
      ...current,
    ])
  }

  function handleAdminChange(change) {
    setAdmins((current) => change.type === 'added'
      ? [...current, change.admin]
      : current.filter((admin) => admin.id !== change.admin.id))
    setAuditEntries((current) => [
      {
        id: `admin-${change.type}-${change.admin.id}-${Date.now()}`,
        eventType: 'admin_management',
        actor: 'admin@aifagen.com',
        createdAt: new Date().toISOString(),
        action: change.type === 'added' ? 'Admin added' : 'Admin removed',
        userName: change.admin.email,
        adminEmail: change.admin.email,
        adminChange: change.type,
        reason: change.type === 'added' ? 'Admin access granted.' : 'Admin access removed.',
      },
      ...current,
    ])
  }

  function handleRecruiterAudit(event) {
    setAuditEntries((current) => [
      {
        id: `recruiter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventType: event.eventType,
        actor: 'admin@aifagen.com',
        createdAt: new Date().toISOString(),
        action: event.action,
        userName: event.userName,
        reason: event.reason,
        recruiterDetails: event.details,
      },
      ...current,
    ])
  }

  return (
    <div className={`app-shell min-h-screen ${isDark ? 'app-shell--dark bg-[#0c1326] text-slate-100' : 'app-shell--light bg-white text-[#111827]'}`}>
      <Sidebar
        activePage={currentPage.label}
        isDark={isDark}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onPageChange={navigate}
        onSignOut={handleSignOut}
        onThemeToggle={() => setIsDark((current) => !current)}
      />

      <div className={`app-content min-h-screen md:ml-[72px] ${isDark ? 'bg-[#0c1326] text-slate-100' : ''}`}>
        <AdminNotifications
          isDark={isDark}
          jobsAndSources={jobSourceData}
          onNavigate={navigate}
          payments={payments}
          recruiterData={recruiterData}
          users={users}
        />
        <header
          className={`app-mobile-header flex h-14 items-center border-b px-5 md:hidden ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'
            }`}
        >
          <button
            aria-label="Open navigation menu"
            className={`mr-3 rounded-md p-2 ${isDark ? 'text-[#91a9c9] hover:bg-[#18243a]' : 'text-[#62768f] hover:bg-[#f0f4f8]'
              }`}
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold">{currentPage.label}</span>
        </header>




        <main aria-busy={isPageLoading} className="p-5 md:p-9">
          {isPageLoading ? (
            <div
              aria-live="polite"
              className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
              role="status"
            >
              <span
                aria-hidden="true"
                className={`size-9 animate-spin rounded-full border-[3px] border-current border-r-transparent ${isDark ? 'text-[#91a9c9]' : 'text-[#516984]'
                  }`}
              />
              <p className={`text-sm font-medium ${isDark ? 'text-[#91a9c9]' : 'text-[#62768f]'}`}>
                Loading {currentPage.label}...
              </p>
            </div>
          ) : (
            currentPage.path === '/recruiters' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading recruiters"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <Recruiters
                  candidates={users}
                  isDark={isDark}
                  onRecruiterAudit={handleRecruiterAudit}
                  onRecruiterDataChange={setRecruiterData}
                  recruiterData={recruiterData}
                />
              </Suspense>
            ) : currentPage.path === '/users' ? (
              <Users
                isDark={isDark}
                onPlanChange={handlePlanChange}
                onProfileEdit={handleProfileEdit}
                onUsersChange={setUsers}
                users={users}
              />
            ) : currentPage.path === '/jobs' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading jobs"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <Jobs
                  isDark={isDark}
                  jobs={jobs}
                  onJobsChange={setJobs}
                  onVisibilityChange={handleJobVisibility}
                />
              </Suspense>
            ) : currentPage.path === '/JobsAndSources' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading jobs"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <JobsAndSources
                  isDark={isDark}
                  jobs={jobs}
                  onJobsChange={setJobs}
                  onVisibilityChange={handleJobVisibility}
                  onSourceDataChange={setJobSourceData}
                  sourceData={jobSourceData}
                />
              </Suspense>
            ) : currentPage.path === '/internal-jobs' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading internal jobs"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <InternalJobs
                  isDark={isDark}
                  jobs={internalJobs}
                  onJobsChange={setInternalJobs}
                  onVisibilityChange={handleJobVisibility}
                />
              </Suspense>
            ) : currentPage.path === '/job-sources' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading job sources"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <JobSources
                  isDark={isDark}
                  onSourceDataChange={setJobSourceData}
                  sourceData={jobSourceData}
                />
              </Suspense>
            ) : currentPage.path === '/ai-usage' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading AI usage"
                    className={`mx-auto h-[640px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <AIUsage isDark={isDark} usageEvents={aiUsageEvents} users={users} />
              </Suspense>
            ) : currentPage.path === '/payments' ? (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading payments"
                    className={`mx-auto h-[520px] max-w-[1600px] animate-pulse rounded-xl ${isDark ? 'bg-[#10192d]' : 'bg-slate-100'
                      }`}
                  />
                }
              >
                <Payments
                  isDark={isDark}
                  onPaymentsChange={setPayments}
                  onRefund={handleRefund}
                  payments={payments}
                />
              </Suspense>
            ) : currentPage.path === '/audit-log' ? (
              <AuditLog entries={auditEntries} isDark={isDark} />
            ) : currentPage.path === '/settings' ? (
              <Settings
                admins={admins}
                isDark={isDark}
                onAdminChange={handleAdminChange}
                sourceData={jobSourceData}
              />
            ) : currentPage.path === '/dashboard' ? (
              <div className="dashboard-overview mx-auto max-w-[1600px] space-y-1">
                {/* <header className="mb-7">
                  <h1 className={`text-[28px] leading-9 font-bold tracking-[-0.04em] sm:text-[32px] ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                    Dashboard
                  </h1>
                  <p className={`mt-1.5 max-w-xl text-sm leading-6 ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                    A quick view of how the platform is doing.
                  </p>
                </header> */}


                <header
                  className={`mb-6 rounded-xl border p-5 sm:p-6 ${isDark
                      ? 'border-[#30332e] bg-[#151713]'
                      : 'border-[#e5e4de] bg-[#faf9f6]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg ${isDark
                          ? 'bg-[#292c25] text-[#d4d5c8]'
                          : 'bg-[#292b25] text-[#f8f7f2]'
                        }`}
                    >
                      <svg
                        aria-hidden="true"
                        className="size-[18px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                      </svg>
                    </span>

                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-[#a7a99c]' : 'text-[#77776c]'
                        }`}
                    >
                      AIFAGEN / Admin
                    </span>

                    <span
                      className={`ml-auto flex items-center gap-2 text-xs ${isDark ? 'text-[#b8baae]' : 'text-[#66675e]'
                        }`}
                    >
                      <span className="size-1.5 rounded-full bg-[#68866a]" />
                      Overview
                    </span>
                  </div>

                  <div
                    className={`mt-5 border-t pt-5 ${isDark ? 'border-[#30332e]' : 'border-[#e5e4de]'
                      }`}
                  >
                    <h1
                      className={`text-[30px] font-semibold leading-tight tracking-[-0.045em] sm:text-[36px] ${isDark ? 'text-[#f0f0e9]' : 'text-[#25261f]'
                        }`}
                    >
                      Dashboard
                    </h1>

                    <p
                      className={`mt-2 max-w-xl text-sm leading-6 ${isDark ? 'text-[#a5a79b]' : 'text-[#77776c]'
                        }`}
                    >
                      A clear view of your platform's performance.
                    </p>
                  </div>

                  <div
                    className={`mt-5 flex items-center justify-between border-t pt-3 ${isDark ? 'border-[#30332e]' : 'border-[#e5e4de]'
                      }`}
                  >
                    <span
                      className={`text-[10px] font-semibold tracking-[0.13em] ${isDark ? 'text-[#898c80]' : 'text-[#858579]'
                        }`}
                    >
                      PLATFORM ANALYTICS
                    </span>
                    <span
                      className={`text-[10px] ${isDark ? 'text-[#898c80]' : 'text-[#858579]'
                        }`}
                    >
                      ADMIN WORKSPACE
                    </span>
                  </div>
                </header>



                <section aria-label="Platform summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {dashboardData.metrics.map((metric) => (
                    <article
                      className={`dashboard-metric-card group relative min-h-[136px] overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'border-[#263249] bg-[#10192d] hover:border-[#3a4b67] hover:shadow-black/10' : 'border-[#e2e8f0] bg-white hover:border-[#cad5e2] hover:shadow-slate-200/60'
                        }`}
                      key={metric.label}
                    >
                      <div className="flex items-center justify-between">
                        <h2 className={`text-xs font-semibold tracking-wide uppercase ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                          {metric.label}
                        </h2>
                        <span className={`dashboard-metric-icon flex size-10 items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[#18243a] text-[#91a9c9] group-hover:bg-[#202d43]' : 'bg-[#f0f4f8] text-[#516984] group-hover:bg-[#e7edf4]'}`}>
                          <MetricIcon name={metric.icon} />
                        </span>
                      </div>
                      <p className={`mt-5 text-[30px] leading-9 font-bold tracking-[-0.035em] tabular-nums ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                        {metric.value}
                      </p>
                    </article>
                  ))}
                </section>

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <section
                    aria-labelledby="signups-title"
                    className={`rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e2e8f0] bg-white'
                      }`}
                  >
                    {/* <div className="mb-4">
                      <h2 id="signups-title" className="text-sm font-semibold">
                        Sign-ups
                      </h2>
                      <p className={`mt-1 text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                        Daily registrations · last 30 days
                      </p>
                    </div> */}
                    <Suspense
                      fallback={
                        <div
                          aria-label="Loading sign-ups chart"
                          className={`h-[290px] animate-pulse rounded-lg ${isDark ? 'bg-[#18243a]' : 'bg-slate-100'
                            }`}
                        />
                      }
                    >
                      <SignupChart isDark={isDark} />
                    </Suspense>
                  </section>

                  <section
                    aria-labelledby="plan-split-title"
                    className={`rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e2e8f0] bg-white'
                      }`}
                  >
                    {/* <div className="mb-4">
                      <h2 id="plan-split-title" className="text-sm font-semibold">
                        Users by plan
                      </h2>
                      <p className={`mt-1 text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                        Current plan distribution
                      </p>
                    </div> */}
                    <Suspense
                      fallback={
                        <div
                          aria-label="Loading plan split chart"
                          className={`h-[290px] animate-pulse rounded-lg ${isDark ? 'bg-[#18243a]' : 'bg-slate-100'
                            }`}
                        />
                      }
                    >
                      <PlanSplitChart auditEntries={auditEntries} isDark={isDark} />
                    </Suspense>
                  </section>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
                  <section
                    aria-labelledby="plans-ending-title"
                    className={`min-w-0 rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e2e8f0] bg-white'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#18243a] text-[#91a9c9]' : 'bg-slate-100 text-[#516984]'}`}>
                          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 11h18M12 14v4M10 16h4" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <h2 id="plans-ending-title" className="text-base font-semibold">
                            Plans ending in the next 30 days
                          </h2>
                          <p className={`mt-1 text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                            Upcoming renewals · Earliest first
                          </p>
                        </div>
                      </div>
                      <button
                        className={`inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${isDark ? 'text-slate-200 hover:bg-[#18243a]' : 'text-[#334155] hover:bg-slate-100'}`}
                        onClick={() => navigate('/users')}
                        type="button"
                      >
                        View users
                        <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M7 17 17 7M8 7h9v9" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full min-w-[540px] border-collapse text-left">
                        <thead>
                          <tr className={`border-b text-[11px] font-semibold  ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-[#e2e8f0] text-[#718096]'}`}>
                            <th className="py-3 pr-4 pl-2" scope="col">Account</th>
                            <th className="py-3 pr-4" scope="col">Plan</th>
                            <th className="py-3 pr-2 text-right" scope="col">Expires</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plansEndingSoon.map((plan) => {
                            const { daysLeft } = plan
                            const initials = plan.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')

                            return (
                              <tr className={`border-b last:border-0 ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'}`} key={plan.email}>
                                <td className="py-3.5 pr-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${isDark ? 'border-[#263249] bg-[#18243a] text-[#91a9c9]' : 'border-[#e2e8f0] bg-slate-100 text-[#718096]'}`}>
                                      {initials}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-semibold">{plan.name}</span>
                                      <span className={`mt-0.5 block truncate text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                                        {plan.email}
                                      </span>
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${plan.plan === 'Premium'
                                    ? isDark ? 'text-violet-300' : 'text-violet-700'
                                    : isDark ? 'text-emerald-300' : 'text-emerald-700'
                                    }`}>
                                    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                                      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                                      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
                                    </svg>
                                    {plan.plan}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right">
                                  <time className={`block whitespace-nowrap text-xs font-medium ${isDark ? 'text-slate-100' : 'text-[#334155]'}`}>
                                    {plan.endingOn}
                                  </time>
                                  <span className={`mt-1 inline-flex items-center justify-end gap-1 text-xs ${daysLeft < 0
                                    ? isDark ? 'text-red-300' : 'text-red-700'
                                    : daysLeft <= 7
                                      ? isDark ? 'text-amber-300' : 'text-amber-700'
                                      : isDark ? 'text-[#91a9c9]' : 'text-[#718096]'
                                    }`}>
                                    <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="9" />
                                      <path d="M12 7v5l3 2" />
                                    </svg>
                                    {daysLeft < 0
                                      ? `Expired ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'} ago`
                                      : daysLeft === 0
                                        ? 'Ends today'
                                        : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                          {!plansEndingSoon.length && (
                            <tr>
                              <td className={`py-5 text-center text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`} colSpan="3">
                                No plans ending in the next 30 days.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section
                    aria-labelledby="job-health-title"
                    className={`min-w-0 rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm md:p-6 ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e2e8f0] bg-white'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#18243a] text-[#91a9c9]' : 'bg-slate-100 text-[#516984]'}`}>
                          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M5 19a2 2 0 0 1 2-2M5 13a8 8 0 0 1 8 8M5 7a14 14 0 0 1 14 14" />
                            <circle cx="5" cy="21" r="1" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <h2 id="job-health-title" className="text-base font-semibold">Job health</h2>
                          <p className={`mt-1 text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                            Listings &amp; source activity
                          </p>
                        </div>
                      </div>
                      <svg aria-label={sourcesNeedingAttention.length ? 'Job sources need attention' : 'All job sources operational'} className={`mt-1 size-5 shrink-0 ${sourcesNeedingAttention.length ? isDark ? 'text-amber-300' : 'text-amber-700' : isDark ? 'text-emerald-300' : 'text-emerald-700'}`} fill="none" role="img" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>

                    <div className={`mt-5 border-y py-5 ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`flex items-center gap-2 text-xs font-semibold ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                              <rect x="3" y="7" width="18" height="14" rx="2" />
                              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
                            </svg>
                            Active jobs
                          </p>
                          <p className={`mt-2 text-4xl leading-none font-medium tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                            {dashboardData.jobHealth.activeJobs.toLocaleString('en-US')}
                          </p>
                        </div>
                        <button
                          aria-label="View job sources"
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors ${isDark ? 'border-[#263249] text-slate-100 hover:bg-[#18243a]' : 'border-[#e2e8f0] text-[#334155] hover:bg-slate-50'}`}
                          onClick={() => navigate('/JobsAndSources')}
                          type="button"
                        >
                          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M7 17 17 7M8 7h9v9" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <p className={`flex items-center gap-2 ${operationalSources === jobSourceData.sources.length
                          ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                          : isDark ? 'text-[#91a9c9]' : 'text-[#718096]'
                          }`}>
                          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                          {operationalSources} of {jobSourceData.sources.length} sources operational
                        </p>
                        <span className={`tabular-nums ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                          {operationalPercent}%
                        </span>
                      </div>
                      <div aria-label={`${operationalPercent}% of job sources operational`} className="mt-3 flex gap-1.5" role="img">
                        {jobSourceData.sources.map((source) => (
                          <span
                            className={`h-1.5 min-w-0 flex-1 rounded-full ${source.status === 'Working'
                              ? 'bg-emerald-700'
                              : source.status === 'Blocked'
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                              }`}
                            key={source.id}
                            title={`${source.name}: ${source.status}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <svg aria-hidden="true" className={`size-[18px] ${sourcesNeedingAttention.length
                            ? isDark ? 'text-amber-300' : 'text-amber-700'
                            : isDark ? 'text-emerald-300' : 'text-emerald-700'
                            }`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                          {sourcesNeedingAttention.length ? 'Needs attention' : 'All sources operational'}
                        </h3>
                        <span className={`text-xs tabular-nums ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                          {String(sourcesNeedingAttention.length).padStart(2, '0')}
                        </span>
                      </div>
                      {sourcesNeedingAttention.length ? (
                        <ul>
                          {sourcesNeedingAttention.map((source) => (
                            <li className={`border-b py-3 last:border-0 ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'}`} key={source.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <svg aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 ${source.status === 'Blocked'
                                    ? isDark ? 'text-red-300' : 'text-red-700'
                                    : isDark ? 'text-amber-300' : 'text-amber-700'
                                    }`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                                    {source.status === 'Blocked'
                                      ? <><path d="M4 4l16 16M7 7a10 10 0 0 1 13 5s-1.2 2.4-3.7 4" /><path d="M3 12s1.2-2.4 3.7-4" /></>
                                      : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
                                  </svg>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold">{source.name}</p>
                                    <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                                      {source.note !== '—' ? source.note : `Source status: ${source.status}.`}
                                    </p>
                                  </div>
                                </div>
                                <span className={`shrink-0 pt-0.5 text-xs font-semibold ${source.status === 'Blocked'
                                  ? isDark ? 'text-red-300' : 'text-red-700'
                                  : isDark ? 'text-amber-300' : 'text-amber-700'
                                  }`}>
                                  {source.status}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`py-3 text-xs ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
                          No job sources need attention right now.
                        </p>
                      )}
                    </div>

                    <button
                      className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${isDark ? 'border-[#263249] text-slate-100 hover:bg-[#18243a]' : 'border-[#e2e8f0] text-[#334155] hover:bg-slate-50'}`}
                      onClick={() => navigate('/JobsAndSources')}
                      type="button"
                    >
                      Review job sources
                      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </button>
                  </section>
                </div>
              </div>
            ) : (
              <h1 className={`text-[28px] leading-9 font-bold tracking-[-0.04em] sm:text-[32px] ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                Welcome to {currentPage.label}
              </h1>
            )
          )}
        </main>
      </div>
      <AifaAssistant isDark={isDark} />
    </div>
  )
}

export default Dashboard
 