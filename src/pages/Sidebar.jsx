import { adminSections } from './adminPages.js'
import JobsAndSources from './JobsAndSources.jsx'

const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  jobs: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v5" />
    </>
  ),
  internal: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M7 8V5h10v3M8 12v5M12 12v5M16 12v5M3 12h18" />
    </>
  ),
  sources: (
    <>
      <path d="M5 19a2 2 0 1 0 0 .01M5 5a14 14 0 0 1 14 14M5 12a7 7 0 0 1 7 7" />
    </>
  ), JobsAndSources: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M7 8V5h10v3M8 12v5M12 12v5M16 12v5M3 12h18" />
    </>

  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14ZM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2Z" />
    </>
  ),
  audit: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h3M3 7v12" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9L16 21h-3l-.3-1.9a8 8 0 0 1-1.7-.9l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-.9L13 8h3l.3 1.9a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.2 1.4Z" />
    </>
  ),
  recruiters: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 8v6M17 11h6" />
    </>
  ),
}

function Icon({ name, className = 'size-[18px]' }) {
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
      {iconPaths[name]}
    </svg>
  )
}

function Sidebar({
  activePage,
  isDark,
  isOpen,
  onClose,
  onPageChange,
  onSignOut,
  onThemeToggle,
}) {
  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/35 md:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-dvh max-h-dvh w-[266px] flex-col overflow-hidden border-r transition-transform duration-200 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isDark ? 'border-[#263249] bg-[#10192d]' : 'border-[#e2e8f0] bg-white'}`}
      >
        <div
          className={`app-sidebar-brand flex h-20 shrink-0 items-center gap-3 border-b px-[22px] ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'
            }`}
        >
          <div className={`flex size-9 items-center justify-center rounded-[10px]  text-sm font-bold  ${isDark ? 'bg-white text-[#10192d]' : 'bg-[#10192d] text-white'}`}>
            AI
          </div>
          <div>
            <p className={` leading-5 tracking-tight font-bold text-lg ${isDark ? 'text-slate-100' : 'text-[#111827]'}`}>
              AIFAGen
            </p>
            <p className={`text-xs leading-4 font-mono ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
              Admin Portal
            </p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-hidden px-[13px] py-2">
          {adminSections.map((section) => (
            <div className="mb-4" key={section.name}>
              <h2
                className={`px-[9px] pt-2 pb-1.5 text-xs leading-5 font-semibold tracking-wide uppercase ${isDark ? 'text-[#91a9c9]' : 'text-[#6b7c93]'
                  }`}
              >
                {section.name}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activePage === item.label
                  const activeClasses = isDark
                    ? 'bg-[#202d43] font-medium text-slate-100'
                    : 'bg-[#f0f4f8] font-medium text-[#516984]'
                  const inactiveClasses = isDark
                    ? 'text-[#91a9c9] hover:bg-[#18243a] hover:text-white'
                    : 'text-[#62768f] hover:bg-[#f7f9fb] hover:text-[#334155]'

                  return (
                    <li key={item.label}>
                      <button
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#7589a4] ${isActive ? activeClasses : inactiveClasses
                          }`}
                        onClick={() => {
                          onPageChange(item.path)
                          onClose()
                        }}
                        title={item.label}
                        type="button"
                      >
                        <Icon name={item.icon} />
                        <span className="app-sidebar-label">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <footer
          className={`shrink-0 border-t px-[17px] pt-3 pb-4 ${isDark ? 'border-[#263249]' : 'border-[#e2e8f0]'
            }`}
        >
          <p className={`app-sidebar-email truncate text-xs leading-5 ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}>
            admin@aifagen.com
          </p>
          <div className="mt-2 flex items-center justify-between">
            <button
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              aria-pressed={isDark}
              className={`flex items-center gap-2 ${isDark ? 'text-[#91a9c9]' : 'text-[#718096]'}`}
              onClick={onThemeToggle}
              type="button"
            >
              <span aria-hidden="true" className="app-sidebar-theme-icon text-sm">
                ☼
              </span>
              <span
                className={`app-sidebar-theme-switch relative h-[22px] w-10 rounded-full transition-colors ${isDark ? 'bg-[#53657d]' : 'bg-[#e2e8f0]'
                  }`}
              >
                <span
                  className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-[left] ${isDark ? 'left-[21px]' : 'left-[3px]'
                    }`}
                />
              </span>
            </button>
            <button
              aria-label="Sign out"
              className={`app-sidebar-signout flex items-center gap-0 text-xs font-medium transition ${isDark ? 'text-[#91a9c9] hover:text-white' : 'text-[#62768f] hover:text-[#172033]'
                }`}
              onClick={onSignOut}
              title="Sign out"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />
              </svg>
              <span className="app-sidebar-label ">Sign out</span>
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}

export default Sidebar
