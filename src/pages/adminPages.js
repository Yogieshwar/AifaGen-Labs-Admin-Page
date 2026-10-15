const adminSections = [
  {
    name: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'dashboard' }],
  },
  {
    name: 'Revenue',
    items: [
      { label: 'Users', path: '/users', icon: 'users' },
      { label: 'Ledger', path: '/payments', icon: 'payments' },
    ],
  },
  {
    name: 'Data Management',
    items: [
      { label: 'Pipelines', path: '/JobsAndSources', icon: 'jobs' },
      // { label: 'Jobs', path: '/jobs', icon: 'jobs' },
      { label: 'Internal Jobs', path: '/internal-jobs', icon: 'internal' },
      // { label: 'Job Sources', path: '/job-sources', icon: 'sources' },
    ],
  },
  {
    name: 'Operations',
    items: [
      { label: 'Talent Partners', path: '/recruiters', icon: 'recruiters' },
      { label: 'AI Usage', path: '/ai-usage', icon: 'sparkles' },
      { label: 'Audit Log', path: '/audit-log', icon: 'audit' },
      { label: 'System Config', path: '/settings', icon: 'settings' },
    ],
  },
]

const adminPages = adminSections.flatMap((section) => section.items)

export { adminPages, adminSections }
