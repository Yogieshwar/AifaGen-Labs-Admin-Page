import {
  internalJobListings,
  jobListings,
  jobSourceRecentRuns,
  jobSourceRecords,
  mockPayments,
  mockUsers,
} from './Data.js'

const USERS_KEY = 'aifagen-admin-users-v1'
const AUDIT_LOG_KEY = 'aifagen-admin-audit-log-v1'
const PAYMENTS_KEY = 'aifagen-admin-payments-v1'
const JOBS_KEY = 'aifagen-admin-jobs-v1'
const INTERNAL_JOBS_KEY = 'aifagen-admin-internal-jobs-v1'
const JOB_SOURCES_KEY = 'aifagen-admin-job-sources-v1'
const ADMINS_KEY = 'aifagen-admin-admins-v1'
const RECRUITERS_KEY = 'aifagen-admin-recruiters-v1'

const defaultAdmins = [
  { id: 'admin-owner', email: 'admin@aifagen.com', addedAt: '2025-12-11', isCurrent: true },
  { id: 'admin-priya', email: 'priya@aifagen.com', addedAt: '2026-02-09', isCurrent: false },
  { id: 'admin-rohan', email: 'rohan@aifagen.com', addedAt: '2026-06-09', isCurrent: false },
]

const defaultRecruiters = {
  recruiters: [
    {
      id: 'recruiter-jordan-lee',
      name: 'Jordan Lee',
      email: 'jordan.lee@talentbridge.example',
      phone: '+1 (415) 555-0134',
      location: 'San Francisco, CA',
      title: 'Senior Technical Recruiter',
      createdAt: '2026-04-12',
      isOnline: true,
      presence: 'Online',
      lastLoginAt: '2026-10-09T08:12:00-07:00',
      lastLogoutAt: '2026-10-08T17:34:00-07:00',
      lastActivityAt: '2026-10-09T10:26:00-07:00',
      sessionsToday: 2,
      avgSessionMinutes: 198,
      attendanceDays: 7,
      attendanceMonth: '2026-10',
      attendanceTodayDate: '2026-10-09',
      todayApplications: 163,
      applicationsTodayDate: '2026-10-09',
      monthApplications: 3210,
      assignedCandidateIds: ['user-1', 'user-2', 'user-3', 'user-4'],
      applicationStatsByCandidate: {
        'user-1': { today: 42, month: 870, interviewInvites: 18, callbacks: 12, replies: 390, rejections: 126, invalidOrDuplicate: 8 },
        'user-2': { today: 37, month: 720, interviewInvites: 14, callbacks: 9, replies: 310, rejections: 108, invalidOrDuplicate: 6 },
        'user-3': { today: 55, month: 1120, interviewInvites: 23, callbacks: 16, replies: 510, rejections: 165, invalidOrDuplicate: 11 },
        'user-4': { today: 29, month: 500, interviewInvites: 11, callbacks: 7, replies: 220, rejections: 78, invalidOrDuplicate: 4 },
      },
      attendanceLog: ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'],
      sessionHistory: [
        { loginAt: '2026-10-09T08:12:00-07:00', logoutAt: null, durationMinutes: null },
        { loginAt: '2026-10-09T06:40:00-07:00', logoutAt: '2026-10-09T07:35:00-07:00', durationMinutes: 55 },
        { loginAt: '2026-10-08T08:05:00-07:00', logoutAt: '2026-10-08T17:34:00-07:00', durationMinutes: 569 },
      ],
    },
    {
      id: 'recruiter-morgan-diaz',
      name: 'Morgan Diaz',
      email: 'morgan.diaz@talentbridge.example',
      phone: '+1 (512) 555-0179',
      location: 'Austin, TX',
      title: 'Recruiter',
      createdAt: '2026-05-03',
      isOnline: true,
      presence: 'Online',
      lastLoginAt: '2026-10-09T07:48:00-05:00',
      lastLogoutAt: '2026-10-08T18:02:00-05:00',
      lastActivityAt: '2026-10-09T09:55:00-05:00',
      sessionsToday: 1,
      avgSessionMinutes: 224,
      attendanceDays: 7,
      attendanceMonth: '2026-10',
      attendanceTodayDate: '2026-10-09',
      todayApplications: 181,
      applicationsTodayDate: '2026-10-09',
      monthApplications: 3440,
      assignedCandidateIds: ['user-5', 'user-6', 'user-7', 'user-8'],
      applicationStatsByCandidate: {
        'user-5': { today: 42, month: 790, interviewInvites: 17, callbacks: 11, replies: 350, rejections: 115, invalidOrDuplicate: 7 },
        'user-6': { today: 37, month: 810, interviewInvites: 19, callbacks: 13, replies: 372, rejections: 120, invalidOrDuplicate: 5 },
        'user-7': { today: 55, month: 1050, interviewInvites: 25, callbacks: 17, replies: 482, rejections: 158, invalidOrDuplicate: 10 },
        'user-8': { today: 47, month: 790, interviewInvites: 16, callbacks: 10, replies: 360, rejections: 112, invalidOrDuplicate: 8 },
      },
      attendanceLog: ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'],
      sessionHistory: [
        { loginAt: '2026-10-09T07:48:00-05:00', logoutAt: null, durationMinutes: null },
        { loginAt: '2026-10-08T07:52:00-05:00', logoutAt: '2026-10-08T18:02:00-05:00', durationMinutes: 610 },
      ],
    },
    {
      id: 'recruiter-taylor-brooks',
      name: 'Taylor Brooks',
      email: 'taylor.brooks@talentbridge.example',
      phone: '+1 (212) 555-0162',
      location: 'New York, NY',
      title: 'Healthcare Recruiter',
      createdAt: '2026-06-18',
      isOnline: false,
      presence: 'Offline',
      lastLoginAt: '2026-10-08T08:20:00-04:00',
      lastLogoutAt: '2026-10-08T17:41:00-04:00',
      lastActivityAt: '2026-10-08T17:41:00-04:00',
      sessionsToday: 0,
      avgSessionMinutes: 201,
      attendanceDays: 6,
      attendanceMonth: '2026-10',
      attendanceTodayDate: '2026-10-08',
      todayApplications: 125,
      applicationsTodayDate: '2026-10-08',
      monthApplications: 2370,
      assignedCandidateIds: ['user-9', 'user-10', 'user-11', 'user-12'],
      applicationStatsByCandidate: {
        'user-9': { today: 37, month: 760, interviewInvites: 15, callbacks: 10, replies: 340, rejections: 112, invalidOrDuplicate: 6 },
        'user-10': { today: 18, month: 430, interviewInvites: 8, callbacks: 5, replies: 190, rejections: 70, invalidOrDuplicate: 5 },
        'user-11': { today: 45, month: 720, interviewInvites: 14, callbacks: 9, replies: 325, rejections: 108, invalidOrDuplicate: 7 },
        'user-12': { today: 25, month: 460, interviewInvites: 10, callbacks: 6, replies: 205, rejections: 74, invalidOrDuplicate: 4 },
      },
      attendanceLog: ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'],
      sessionHistory: [
        { loginAt: '2026-10-08T08:20:00-04:00', logoutAt: '2026-10-08T17:41:00-04:00', durationMinutes: 561 },
      ],
    },
  ],
  assignmentHistory: [],
}

// function loadValue(key, initialValue) {
//   const savedValue = window.localStorage.getItem(key)
//   return savedValue === null ? initialValue : JSON.parse(savedValue)
// }

export function loadUsers() {
  return loadValue(USERS_KEY, mockUsers)
}

export function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// export function loadAuditLog() {
//   console.log(`--- 🔍 Checking Log Key: "${AUDIT_LOG_KEY}" ---`);
//    const savedValue = window.localStorage.getItem(AUDIT_LOG_KEY);
//     console.log("Raw value sitting in LocalStorage:", savedValue);
//   return loadValue(AUDIT_LOG_KEY,defaultAuditLogs)
// }

export function loadAuditLog() {
  try {
    const savedValue = window.localStorage.getItem(AUDIT_LOG_KEY)

    // First visit: load the default audit logs.
    if (savedValue === null) {
      return defaultAuditLogs
    }

    const parsed = JSON.parse(savedValue)

    // Recover if the saved data is invalid or not an array.
    if (!Array.isArray(parsed)) {
      return defaultAuditLogs
    }

    // Merge default logs with saved logs without duplicating IDs.
    const logsById = new Map(
      defaultAuditLogs.map((entry) => [entry.id, entry])
    )

    parsed.forEach((entry) => {
      if (entry?.id) {
        logsById.set(entry.id, entry)
      }
    })

    // Display the newest events first.
    return [...logsById.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    return defaultAuditLogs
  }
}

export function saveAuditLog(entries) {
  window.localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(entries))
}

export function loadPayments() {
  return loadValue(PAYMENTS_KEY, mockPayments)
}

export function savePayments(payments) {
  window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
}

export function loadJobs() {
  const savedJobs = loadValue(JOBS_KEY, jobListings)
  const savedJobsById = new Map(savedJobs.map((job) => [job.id, job]))
  return jobListings.map((job) => ({
    ...job,
    visible: savedJobsById.get(job.id)?.visible ?? job.visible,
  }))
}

export function saveJobs(jobs) {
  window.localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
}

export function loadInternalJobs() {
  return loadValue(INTERNAL_JOBS_KEY, internalJobListings)
}

export function saveInternalJobs(jobs) {
  window.localStorage.setItem(INTERNAL_JOBS_KEY, JSON.stringify(jobs))
}

export function loadJobSources() {
  return loadValue(JOB_SOURCES_KEY, {
    sources: jobSourceRecords,
    recentRuns: jobSourceRecentRuns,
  })
}

export function saveJobSources(jobSourceData) {
  window.localStorage.setItem(JOB_SOURCES_KEY, JSON.stringify(jobSourceData))
}

export function loadAdmins() {
  return loadValue(ADMINS_KEY, defaultAdmins)
}
function loadValue(key, initialValue) {
  const savedValue = window.localStorage.getItem(key)
  
  // If nothing is saved, return the default values immediately
  if (savedValue === null) return initialValue;
  
  try {
    const parsed = JSON.parse(savedValue);
    
    // Check if the data is an empty array or an empty object
    if (Array.isArray(parsed) && parsed.length === 0) return initialValue;
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length === 0) return initialValue;
    
    return parsed;
  } catch (error) {
    console.error(`Error parsing LocalStorage key "${key}":`, error);
    return initialValue; // Fallback to defaults on JSON errors
  }
}


export function saveAdmins(admins) {
  window.localStorage.setItem(ADMINS_KEY, JSON.stringify(admins))
}

export function loadRecruiters() {
  const savedData = loadValue(RECRUITERS_KEY, null)
  if (!savedData) return defaultRecruiters

  const defaultRecruitersById = new Map(defaultRecruiters.recruiters.map((recruiter) => [recruiter.id, recruiter]))
  return {
    ...defaultRecruiters,
    ...savedData,
    recruiters: (savedData.recruiters ?? []).map((savedRecruiter) => {
      const defaults = defaultRecruitersById.get(savedRecruiter.id)
      if (!defaults) return savedRecruiter
      return {
        ...defaults,
        ...savedRecruiter,
        applicationStatsByCandidate: {
          ...Object.fromEntries(Object.entries(defaults.applicationStatsByCandidate).map(([candidateId, defaultStats]) => [
            candidateId,
            { ...defaultStats, ...savedRecruiter.applicationStatsByCandidate?.[candidateId] },
          ])),
          ...Object.fromEntries(Object.entries(savedRecruiter.applicationStatsByCandidate ?? {}).filter(([candidateId]) => (
            !defaults.applicationStatsByCandidate[candidateId]
          ))),
        },
        attendanceLog: savedRecruiter.attendanceLog ?? defaults.attendanceLog,
        sessionHistory: savedRecruiter.sessionHistory ?? defaults.sessionHistory,
        sessionsToday: savedRecruiter.sessionsToday ?? defaults.sessionsToday,
        avgSessionMinutes: savedRecruiter.avgSessionMinutes ?? defaults.avgSessionMinutes,
        attendanceDays: defaults.attendanceDays,
        presence: defaults.presence,
      }
    }),
  }
}

export function saveRecruiters(recruiterData) {
  window.localStorage.setItem(RECRUITERS_KEY, JSON.stringify(recruiterData))
}
const defaultAuditLogs = [
  // 0: User Plan & Status Update
  {
    id: "user-10-1792074387679",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-15T14:26:27.679Z",
    newPlan: "Standard",
    newStatus: "Inactive",
    previousPlan: "None",
    previousStatus: "Inactive",
    reason: "contacted through email",
    userId: "user-10",
    userName: "Sanya Das"
  },
  // 1: User Plan & Status Update (Alternative Variant)
  {
    id: "user-6-1792074350418",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-15T14:25:50.418Z",
    newPlan: "Standard",
    newStatus: "Active",
    previousPlan: "Basic",
    previousStatus: "Active",
    reason: "contacted through email fro changing plan",
    userId: "user-6",
    userName: "Pooja Chopra"
  },
  // 2: Admin Management (Removal Event)
  {
    id: "admin-removed-admin-1792010150486-1792010159599",
    eventType: "admin_management",
    action: "Admin Access Revoked",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T20:35:59.599Z",
    targetAdminEmail: "rohan@aifagen.com",
    reason: "Offboarding or team reassignment"
  },
  // 3: Admin Management (Addition Event)
  {
    id: "admin-added-admin-1792010150486-1792010150487",
    eventType: "admin_management",
    action: "New Admin Provisioned",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T20:35:50.487Z",
    targetAdminEmail: "priya@aifagen.com",
    roleAssigned: "Manager Access"
  },
  // 4 & 5 & 6: Job Visibility Toggles (Pipeline Scrapers)
  {
    id: "job-visibility-1792002999783",
    eventType: "job_visibility",
    action: "Job visibility hidden",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T18:36:39.783Z",
    jobId: "tech-lead-09",
    jobTitle: "Senior DevOps Engineer",
    reason: "Marked as duplicate from external source pipeline sync"
  },
  {
    id: "job-visibility-1792002998800",
    eventType: "job_visibility",
    action: "Job visibility activated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T18:36:38.800Z",
    jobId: "qa-eng-404",
    jobTitle: "Staff Automation Lead",
    reason: "Manual review verification success"
  },
  {
    id: "job-visibility-1792002998583",
    eventType: "job_visibility",
    action: "Job visibility hidden",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T18:36:38.583Z",
    jobId: "intern-992",
    jobTitle: "Frontend Engineering Intern",
    reason: "Application deadline reached on source board"
  },
  // 12 & 13: Recruiter Candidate Assignments
  {
    id: "recruiter-1791903972273-ua5bx",
    eventType: "recruiter_assignment",
    action: "Candidate queue modified",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-13T15:06:12.273Z",
    recruiterId: "recruiter-jordan-lee",
    userName: "Jordan Lee",
    details: "Assigned candidate 'user-3' to monitor application limits",
    reason: "Load rebalancing across technical recruitment team"
  },
  {
    id: "recruiter-1791903919842-fr9ix",
    eventType: "recruiter_assignment",
    action: "Candidate queue modified",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-13T15:05:19.842Z",
    recruiterId: "recruiter-morgan-diaz",
    userName: "Morgan Diaz",
    details: "Assigned candidate 'user-7' to active track pipeline",
    reason: "Requested secondary engineering pipeline coverage"
  },
  // 14: Recruiter Management (Profile Tweak)
  {
    id: "recruiter-1791903901358-l0sy5",
    eventType: "recruiter_management",
    action: "Recruiter Profile Updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-13T15:05:01.358Z",
    userName: "Taylor Brooks",
    details: "Updated primary focus title sector to 'Healthcare Recruiter'",
    reason: "Department operational restructuring changes"
  },
  // 16 & 17: Recruiter Applications Sync metrics
  {
    id: "recruiter-1791492539786-uua3w",
    eventType: "recruiter_application",
    action: "Application processing synced",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T20:48:59.786Z",
    userName: "Jordan Lee",
    details: "Processed 163 total submitted apps for candidate pool today",
    reason: "Automated end-of-day workflow tally verification"
  },
  {
    id: "recruiter-1791492539502-kx3m2",
    eventType: "recruiter_application",
    action: "Application processing synced",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T20:48:59.502Z",
    userName: "Morgan Diaz",
    details: "Processed 181 total submitted apps for candidate pool today",
    reason: "Automated end-of-day workflow tally verification"
  },
  // 20 & 21: Recruiter Session Actions
  {
    id: "recruiter-1791492536063-wiabs",
    eventType: "recruiter_session",
    action: "Session override handled",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T20:48:56.063Z",
    userName: "Taylor Brooks",
    details: "Forced clock-out adjustment duration marked at 561 minutes",
    reason: "System idle cleanup routine timeout"
  },
  // 28: Payment Refund Events
  {
    id: "refund-pay_00046-1791485449119",
    eventType: "payment_refund",
    action: "Transaction payment reversed",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T18:50:49.119Z",
    paymentId: "pay_00046",
    refundAmount: "$199.00",
    userName: "Nikhil Sharma",
    reason: "Accidental double subscription charge customer ticket support"
  },
  // 29 & 30: Historic Older Logs
  {
    id: "user-1-1791485398827",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T18:49:58.827Z",
    newPlan: "Premium",
    newStatus: "Active",
    previousPlan: "Standard",
    previousStatus: "Active",
    reason: "Enterprise trial contract upgrade validation",
    userId: "user-1",
    userName: "Arjun Verma"
  },
  {
    id: "user-26-1791481600527",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-08T17:46:40.527Z",
    newPlan: "None",
    newStatus: "Inactive",
    previousPlan: "Standard",
    previousStatus: "Active",
    reason: "User closed billing account cancellation",
    userId: "user-26",
    userName: "Kiran Shah"
  },
  
  {
    id: "user-102-1792104521000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-15T14:26:27.679Z", // Today afternoon
    newPlan: "Premium",
    newStatus: "Active",
    previousPlan: "Free Trial",
    previousStatus: "Active",
    reason: "Completed 14-day trial evaluation and converted via self-service checkout",
    userId: "user-102",
    userName: "Sanya Das"
  },
  {
    id: "user-304-1792098411000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-15T09:12:05.340Z", // Today morning
    newPlan: "Enterprise",
    newStatus: "Active",
    previousPlan: "Standard",
    previousStatus: "Active",
    reason: "Upgraded via corporate purchase order and contract validation agreement",
    userId: "user-304",
    userName: "Aditya Verma"
  },
  {
    id: "user-881-1792084532000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-14T16:45:11.230Z", // Yesterday
    newPlan: "Standard",
    newStatus: "Active",
    previousPlan: "Free Trial",
    previousStatus: "Active",
    reason: "Converted to paid monthly plan following product demo session",
    userId: "user-881",
    userName: "Pooja Chopra"
  },
  {
    id: "user-412-1792062145000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-13T23:59:59.000Z", // 2 days ago
    newPlan: "None",
    newStatus: "Inactive",
    previousPlan: "Free Trial",
    previousStatus: "Active",
    reason: "Trial period expired without conversion to a paid tier subscription",
    userId: "user-412",
    userName: "Rian Hidayat"
  },
  {
    id: "user-511-1792031124000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-12T10:15:34.112Z", // 3 days ago
    newPlan: "Standard",
    newStatus: "Active",
    previousPlan: "Premium",
    previousStatus: "Active",
    reason: "Voluntary downgrade request due to localized team budget tracking limits",
    userId: "user-511",
    userName: "Siti Aminah"
  },
  {
    id: "user-620-1791845400000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-09T08:22:15.450Z", // 6 days ago
    newPlan: "Premium",
    newStatus: "Active",
    previousPlan: "Basic",
    previousStatus: "Active",
    reason: "Requested feature access to AI workflow automations",
    userId: "user-620",
    userName: "Budi Santoso"
  },
  {
    id: "user-15-1791535800000",
    action: "Plan and status updated",
    actor: "admin@aifagen.com",
    createdAt: "2026-10-05T19:30:00.000Z", // 10 days ago
    newPlan: "Premium",
    newStatus: "Active",
    previousPlan: "Standard",
    previousStatus: "Active",
    reason: "Automated renewal charge successful for annual commitment",
    userId: "user-15",
    userName: "Dewi Lestari"
  }

];
