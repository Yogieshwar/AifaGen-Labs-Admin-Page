import { useEffect, useMemo, useRef, useState } from 'react'

function AdminNotifications({
  isDark,
  jobsAndSources,
  onNavigate,
  payments,
  recruiterData,
  users,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const notifications = useMemo(() => {
    const latestRunBySource = new Map()
    const recentRuns = jobsAndSources.recentRuns ?? []

    recentRuns.forEach((run) => {
      const current = latestRunBySource.get(run.sourceId)
      if (
        !current ||
        (Number.isFinite(Date.parse(run.finishedAt)) &&
          Date.parse(run.finishedAt) > Date.parse(current.finishedAt))
      ) {
        latestRunBySource.set(run.sourceId, run)
      }
    })

    const sourceNames = new Map(
      (jobsAndSources.sources ?? []).map((source) => [source.id, source.name]),
    )
    const jobNotifications = [...latestRunBySource.entries()]
      .filter(([, latestRun]) => String(latestRun.status).toLowerCase() === 'failed')
      .map(([sourceId, latestRun]) => ({
        id: `job-fetch-${sourceId}`,
        title: `${sourceNames.get(sourceId) ?? sourceId} fetch failed`,
        detail: latestRun.note || 'A job source fetch failed.',
        path: '/JobsAndSources',
      }))

    const assignedCandidateIds = new Set(
      (recruiterData.recruiters ?? []).flatMap(
        (recruiter) => recruiter.assignedCandidateIds ?? [],
      ).map(String),
    )
    const unassignedCount = users.filter(
      (user) => !assignedCandidateIds.has(String(user.id)),
    ).length

    if (unassignedCount) {
      jobNotifications.push({
        id: 'unassigned-candidates',
        title: `${unassignedCount.toLocaleString('en-IN')} unassigned candidate${unassignedCount === 1 ? '' : 's'}`,
        detail: 'Candidates are not assigned to a recruiter.',
        path: '/recruiters',
      })
    }

    const failedPaymentCount = payments.filter(
      (payment) => String(payment.status).toLowerCase() === 'failed',
    ).length

    if (failedPaymentCount) {
      jobNotifications.push({
        id: 'failed-payments',
        title: `${failedPaymentCount.toLocaleString('en-IN')} failed payment${failedPaymentCount === 1 ? '' : 's'}`,
        detail: 'Payment processing needs attention.',
        path: '/payments',
      })
    }

    return jobNotifications
  }, [jobsAndSources, payments, recruiterData, users])

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const surface = isDark
    ? 'border-[#3b3c36] bg-[#20211e] text-[#f2f0e9]'
    : 'border-[#dedbd2] bg-[#f8f6f0] text-[#25261f]'
  const muted = isDark ? 'text-[#a5a79b]' : 'text-[#77776c]'

  return (
    <div className="fixed right-4 top-2.5 z-50 md:right-6 md:top-4" ref={containerRef}>
      <button
        aria-controls="admin-notifications-panel"
        aria-expanded={isOpen}
        aria-label={`Admin notifications${notifications.length ? `, ${notifications.length} active` : ''}`}
        className={`relative flex size-9 items-center justify-center rounded-lg border shadow-sm transition-colors ${
          isDark
            ? 'border-[#3b3c36] bg-[#20211e] text-[#d4d5c8] hover:bg-[#30312c]'
            : 'border-[#dedbd2] bg-[#f8f6f0] text-[#51615a] hover:bg-white'
        }`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
          viewBox="0 0 24 24"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-4 text-white">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Admin notifications"
          className={`absolute right-0 top-11 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-xl ${surface}`}
          id="admin-notifications-panel"
        >
          <header className={`border-b px-4 py-3 ${isDark ? 'border-[#3b3c36]' : 'border-[#dedbd2]'}`}>
            <h2 className="text-sm font-semibold">Admin notifications</h2>
            <p className={`mt-0.5 text-xs ${muted}`}>
              {notifications.length
                ? `${notifications.length} active alert${notifications.length === 1 ? '' : 's'}`
                : 'No active alerts'}
            </p>
          </header>

          {notifications.length ? (
            <ul className="max-h-[min(24rem,70vh)] overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    className={`flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 ${
                      isDark
                        ? 'border-[#30312c] hover:bg-[#292c25]'
                        : 'border-[#e8e5dc] hover:bg-white'
                    }`}
                    onClick={() => {
                      setIsOpen(false)
                      onNavigate(notification.path)
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{notification.title}</span>
                      <span className={`mt-1 block text-xs leading-5 ${muted}`}>{notification.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`px-4 py-5 text-center text-xs ${muted}`}>
              Current job, candidate, and payment data needs no attention.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default AdminNotifications
