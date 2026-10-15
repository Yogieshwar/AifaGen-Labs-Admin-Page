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

function loadValue(key, initialValue) {
  const savedValue = window.localStorage.getItem(key)
  return savedValue === null ? initialValue : JSON.parse(savedValue)
}

export function loadUsers() {
  return loadValue(USERS_KEY, mockUsers)
}

export function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadAuditLog() {
  return loadValue(AUDIT_LOG_KEY, [])
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
