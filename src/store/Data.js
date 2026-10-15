const dashboardData = {
  metrics: [
    { label: 'Total users', value: '2400', icon: 'users' },
    { label: 'Paying users', value: '1380', icon: 'paying' },
    { label: 'Revenue · 30d', value: '₹70,172.00', icon: 'revenue' },
    { label: 'New users · 30d', value: '20', icon: 'newUsers' },
  ],
  plansSplit: [
    { name: 'Monthly', users: 1000, color: '#64748b' },
    { name: 'Basic', users: 900, color: '#009f8f' },
    { name: 'Standard', users: 500, color: '#f4511e' },
  ],
  jobHealth: {
    activeJobs: 1860,
    sourcesNeedingAttention: 3,
    totalSources: 12,
  },
  signupsLast30Days: [
    { date: '2026-09-09', count: 0 },
    { date: '2026-09-10', count: 1 },
    { date: '2026-09-11', count: 2 },
    { date: '2026-09-12', count: 0 },
    { date: '2026-09-13', count: 1 },
    { date: '2026-09-14', count: 2 },
    { date: '2026-09-15', count: 1 },
    { date: '2026-09-16', count: 0 },
    { date: '2026-09-17', count: 6 },
    { date: '2026-09-18', count: 1 },
    { date: '2026-09-19', count: 1 },
    { date: '2026-09-20', count: 0 },
    { date: '2026-09-21', count: 0 },
    { date: '2026-09-22', count: 1 },
    { date: '2026-09-23', count: 1 },
    { date: '2026-09-24', count: 0 },
    { date: '2026-09-25', count: 3 },
    { date: '2026-09-26', count: 0 },
    { date: '2026-09-27', count: 0 },
    { date: '2026-09-28', count: 1 },
    { date: '2026-09-29', count: 2 },
    { date: '2026-09-30', count: 1 },
    { date: '2026-10-01', count: 0 },
    { date: '2026-10-02', count: 3 },
    { date: '2026-10-03', count: 0 },
    { date: '2026-10-04', count: 0 },
    { date: '2026-10-05', count: 1 },
    { date: '2026-10-06', count: 0 },
    { date: '2026-10-07', count: 1 },
    { date: '2026-10-08', count: 0 },
    { date: '2026-10-09', count: 2 },
    { date: '2026-10-10', count: 5 },
  ],
  plansEndingSoon: [
    {
      name: 'Tarun Iyer',
      email: 'tarun.iyer17@example.com',
      plan: 'Basic',
      endingOn: '12 Oct 2026',
    },
    {
      name: 'Maya Patel',
      email: 'maya.patel@example.com',
      plan: 'Standard',
      endingOn: '15 Oct 2026',
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      plan: 'Basic',
      endingOn: '19 Oct 2026',
    },
    {
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      plan: 'Standard',
      endingOn: '22 Oct 2026',
    },
    {
      name: 'Rohan Shah',
      email: 'rohan.shah@example.com',
      plan: 'Basic',
      endingOn: '24 Oct 2026',
    },
    {
      name: 'Ananya Rao',
      email: 'ananya.rao@example.com',
      plan: 'Standard',
      endingOn: '27 Oct 2026',
    },
    {
      name: 'Kabir Singh',
      email: 'kabir.singh@example.com',
      plan: 'Basic',
      endingOn: '30 Oct 2026',
    },
  ],
}

const areasOfInterest = [
  'SAP',
  'AI / ML',
  'Full Stack',
  'Data Center Technician',
  'Data Scientist',
  'DevOps',
  'Data Analyst',
  'IT Support',
  'Business Analyst',
  'Software Engineer',
  'Product Management',
  'UX Design',
  'Cloud Engineering',
]
const firstNames = [
  'Neha', 'Rohan', 'Lakshmi', 'Ananya', 'Simran', 'Pooja', 'Rehan', 'Farhan', 'Diya', 'Sanya',
  'Om', 'Harsh', 'Gauri', 'Priya', 'Kabir', 'Maya', 'Arjun', 'Tarun', 'Kavya', 'Aarav',
  'Ishita', 'Dev', 'Meera', 'Aditya', 'Vikram', 'Aisha', 'Nikhil', 'Shreya', 'Rahul', 'Kiara',
]
const lastNames = ['Chopra', 'Bose', 'Mehta', 'Verma', 'Nair', 'Rao', 'Iyer', 'Shah']
const referenceNames = [
  ['Neha', 'Chopra'],
  ['Rohan', 'Bose'],
  ['Lakshmi', 'Mehta'],
  ['Ananya', 'Verma'],
  ['Simran', 'Nair'],
  ['Pooja', 'Chopra'],
  ['Rehan', 'Nair'],
  ['Farhan', 'Iyer'],
  ['Diya', 'Reddy'],
  ['Sanya', 'Das'],
  ['Om', 'Kulkarni'],
  ['Harsh', 'Singh'],
  ['Rehan', 'Rao'],
  ['Lakshmi', 'Bose'],
  ['Diya', 'Chopra'],
  ['Neha', 'Khan'],
  ['Gauri', 'Sharma'],
  ['Rohan', 'Das'],
  ['Priya', 'Chopra'],
  ['Kabir', 'Patel'],
  ['Maya', 'Iyer'],
  ['Arjun', 'Mehta'],
  ['Tarun', 'Iyer'],
  ['Ananya', 'Rao'],
  ['Kavya', 'Shah'],
  ['Aarav', 'Nair'],
  ['Ishita', 'Verma'],
  ['Dev', 'Malhotra'],
  ['Meera', 'Joshi'],
  ['Aditya', 'Reddy'],
]
const statuses = ['Past due', 'Active', 'Active', 'Cancelled', 'Active', 'Active', 'Inactive', 'Active', 'Cancelled', 'Inactive']
const locations = ['Bengaluru, India', 'Mumbai, India', 'Pune, India', 'Hyderabad, India', 'Delhi, India', 'Chennai, India']

const mockUsers = Array.from({ length: 240 }, (_, index) => {
  const [firstName, lastName] = index < referenceNames.length
    ? referenceNames[index]
    : [
        firstNames[index % firstNames.length],
        lastNames[(Math.floor(index / firstNames.length) + Math.floor((index % firstNames.length) / 8)) % lastNames.length],
      ]
  const emailName = `${firstName}.${lastName}${index ? index + 1 : ''}`.toLowerCase()
  const resumeReviews = (index * 3) % 12
  const coverLetters = (index * 2 + 1) % 9
  const interviewSessions = index % 5
  const chatMessages = (index * 4 + 2) % 18
  const plan = index < 102 ? 'Monthly' : index < 192 ? 'Basic' : 'Standard'

  return {
    id: `user-${index + 1}`,
    firstName,
    lastName,
    email: `${emailName}@example.com`,
    mobile: `+91 ${String(7500000000 + index * 17389).replace(/(\d{5})(\d{5})/, '$1 $2')}`,
    areaOfInterest: areasOfInterest[index % areasOfInterest.length],
    plan,
    status: statuses[index % statuses.length],
    dateJoined: new Date(Date.UTC(2024 + Math.floor(index / 60), (index * 3) % 12, (index * 7) % 27 + 1))
      .toISOString()
      .slice(0, 10),
    planEndDate: new Date(Date.UTC(2026, 9 + (index % 3), (index * 4) % 27 + 1))
      .toISOString()
      .slice(0, 10),
    lastPayment: {
      amount: [0, 499, 1299, 2499][index % 4],
      date: new Date(Date.UTC(2026, 8, (index * 2) % 28 + 1)).toISOString().slice(0, 10),
    },
    headline: [
      'Aspiring software engineer building useful products',
      'Data professional focused on practical insights',
      'Career changer exploring technology opportunities',
      'Experienced specialist seeking the next challenge',
    ][index % 4],
    location: locations[index % locations.length],
    resumes: [
      {
        fileName: `${firstName}_${lastName}_Resume.pdf`,
        uploadedOn: new Date(Date.UTC(2026, 8, (index * 2) % 28 + 1)).toISOString().slice(0, 10),
        score: 62 + ((index * 7) % 37),
      },
      ...(index % 3 === 0
        ? [
            {
              fileName: `${firstName}_${lastName}_Resume_v2.pdf`,
              uploadedOn: new Date(Date.UTC(2026, 9, (index * 3) % 27 + 1)).toISOString().slice(0, 10),
              score: 68 + ((index * 5) % 31),
            },
          ]
        : []),
    ],
    jobApplications: [
      {
        title: ['Frontend Developer', 'Data Analyst', 'Product Associate'][index % 3],
        company: ['Northstar Labs', 'Brightpath', 'Orbit Systems'][index % 3],
        status: ['In review', 'Interview', 'Applied'][index % 3],
        appliedOn: new Date(Date.UTC(2026, 8, (index * 2) % 28 + 1)).toISOString().slice(0, 10),
      },
      {
        title: ['Junior Engineer', 'Business Analyst', 'Cloud Support Engineer'][(index + 1) % 3],
        company: ['Maple Works', 'Cedar Tech', 'Bluepeak'][index % 3],
        status: ['Applied', 'In review', 'Interview'][(index + 1) % 3],
        appliedOn: new Date(Date.UTC(2026, 7, (index * 3) % 27 + 1)).toISOString().slice(0, 10),
      },
    ],
    savedJobs: [
      { title: 'Associate Software Engineer', company: 'Northstar Labs' },
      { title: 'Graduate Data Analyst', company: 'Brightpath' },
      { title: 'Technology Support Specialist', company: 'Orbit Systems' },
    ].slice(0, 1 + (index % 3)),
    jobPreferences: {
      roles: [areasOfInterest[index % areasOfInterest.length], 'Junior Associate'],
      locations: [locations[index % locations.length], 'Remote'],
      workType: ['Hybrid', 'Remote', 'On-site'][index % 3],
      salaryRange: ['₹6–9 LPA', '₹9–14 LPA', '₹14–20 LPA'][index % 3],
    },
    aiUsage: {
      resumeReviews,
      coverLetters,
      interviewSessions,
      chatMessages,
      total: resumeReviews + coverLetters + interviewSessions + chatMessages,
    },
  }
})

const paymentMethods = ['RuPay •••• 8810', 'UPI', 'Visa •••• 4242', 'Mastercard •••• 5577', 'Amex •••• 0005']
const planAmounts = { Monthly: 189, Basic: 1299, Standard: 2499 }
const mockPayments = Array.from({ length: 93 }, (_, index) => {
  const user = mockUsers[index % mockUsers.length]
  const transactionDate = new Date(Date.UTC(2026, 8, 9 + (index % 30)))
  const status = index === 31 ? 'refunded' : index % 7 === 0 ? 'failed' : 'paid'
  const amount = status === 'refunded' ? 1249 : planAmounts[user.plan] ?? 499

  return {
    id: `pay_${String(index + 1).padStart(5, '0')}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    amount,
    currency: 'INR',
    status,
    method: paymentMethods[index % paymentMethods.length],
    date: transactionDate.toISOString().slice(0, 10),
    plan: user.plan,
  }
})

const upcomingRenewals = mockUsers
  .filter((user) => user.plan !== 'None' && user.status === 'Active')
  .sort((first, second) => first.planEndDate.localeCompare(second.planEndDate))
  .slice(0, 8)
  .map((user) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    plan: user.plan,
    renewalDate: user.planEndDate,
    amount: planAmounts[user.plan],
  }))

const jobSeeds = [
  ['Senior Frontend Engineer', 'Northstar Labs', 'Bengaluru, Karnataka', 'Hybrid', 'Company career pages'],
  ['Product Designer', 'Pixel & Co.', 'Remote · India', 'Remote', 'LinkedIn'],
  ['Backend Engineer (Node.js)', 'Finspire', 'Mumbai, Maharashtra', 'On-site', 'Naukri'],
  ['Data Analyst', 'Orbit Health', 'Hyderabad, Telangana', 'Hybrid', 'Glassdoor'],
  ['React Developer', 'Brightworks', 'Pune, Maharashtra', 'On-site', 'Indeed'],
  ['Customer Success Manager', 'CloudHarbor', 'Remote · India', 'Remote', 'LinkedIn'],
  ['Machine Learning Engineer', 'Quanta AI', 'Bengaluru, Karnataka', 'Hybrid', 'Instahyre'],
  ['UX Researcher', 'Mosaic Digital', 'Delhi, India', 'Hybrid', 'Naukri'],
  ['Full Stack Developer', 'Craftline', 'Chennai, Tamil Nadu', 'On-site', 'Indeed'],
  ['Engineering Manager', 'Relay Systems', 'Remote · India', 'Remote', 'LinkedIn'],
  ['Marketing Specialist', 'Goodroot', 'Mumbai, Maharashtra', 'Hybrid', 'Glassdoor'],
  ['QA Automation Engineer', 'Finspire', 'Pune, Maharashtra', 'Hybrid', 'Naukri'],
  ['iOS Engineer', 'Northstar Labs', 'Bengaluru, Karnataka', 'On-site', 'Company career pages'],
  ['Operations Associate', 'Orbit Health', 'Hyderabad, Telangana', 'On-site', 'Instahyre'],
  ['Content Strategist', 'Mosaic Digital', 'Remote · India', 'Remote', 'LinkedIn'],
  ['Platform Engineer', 'Relay Systems', 'Chennai, Tamil Nadu', 'Hybrid', 'Naukri'],
  ['Sales Development Representative', 'CloudHarbor', 'Delhi, India', 'On-site', 'Glassdoor'],
  ['Business Intelligence Analyst', 'Quanta AI', 'Remote · India', 'Remote', 'Company career pages'],
  ['Visual Designer', 'Pixel & Co.', 'Pune, Maharashtra', 'Hybrid', 'LinkedIn'],
  ['Technical Recruiter', 'Brightworks', 'Mumbai, Maharashtra', 'Hybrid', 'Naukri'],
  ['DevOps Engineer', 'Craftline', 'Bengaluru, Karnataka', 'Hybrid', 'Glassdoor'],
  ['Finance Analyst', 'Goodroot', 'Remote · India', 'Remote', 'Instahyre'],
  ['Technical Writer', 'Relay Systems', 'Hyderabad, Telangana', 'On-site', 'LinkedIn'],
  ['Product Manager', 'Finspire', 'Bengaluru, Karnataka', 'Hybrid', 'Indeed'],
]

const jobsPerDay = [
  10, 12, 7, 11, 9, 13, 6, 10, 8, 12, 5, 11, 7, 9,
  8, 8, 9, 7, 8, 6, 8, 8, 9, 7, 8, 6, 8, 10,
]
const jobPostedDates = jobsPerDay.flatMap((count, daysAgo) => (
  Array.from({ length: count }, () => new Date(Date.UTC(2026, 9, 8 - daysAgo)).toISOString().slice(0, 10))
))

const jobListings = Array.from({ length: 240 }, (_, index) => {
  const [title, company, location, workMode, source] = jobSeeds[index % jobSeeds.length]
  return {
    id: `job_${String(index + 1).padStart(4, '0')}`,
    title,
    company,
    location,
    workMode,
    source,
    postedAt: jobPostedDates[index],
    visible: index % 7 !== 5,
  }
})

const internalJobSeeds = [
  {
    title: 'Senior React Developer',
    company: 'AIFAGen Consulting',
    consultant: 'Northstar Labs',
    location: 'Bengaluru, Karnataka',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    description: 'Build and maintain responsive customer-facing applications with a small product team.',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'REST APIs'],
  },
  {
    title: 'Node.js Backend Engineer',
    company: 'AIFAGen Consulting',
    consultant: 'Finspire',
    location: 'Mumbai, Maharashtra',
    workMode: 'On-site',
    employmentType: 'Contract',
    description: 'Develop reliable services and integrations for a growing fintech platform.',
    requiredSkills: ['Node.js', 'JavaScript', 'Express', 'MongoDB', 'REST APIs'],
  },
  {
    title: 'Data Analyst',
    company: 'AIFAGen Consulting',
    consultant: 'Orbit Health',
    location: 'Hyderabad, Telangana',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    description: 'Turn product and operations data into clear reporting and actionable insights.',
    requiredSkills: ['SQL', 'Python', 'Excel', 'Power BI', 'Data visualization'],
  },
  {
    title: 'Product Designer',
    company: 'AIFAGen Consulting',
    consultant: 'Pixel & Co.',
    location: 'Remote · India',
    workMode: 'Remote',
    employmentType: 'Full-time',
    description: 'Own end-to-end user flows and deliver accessible, high-fidelity product experiences.',
    requiredSkills: ['Figma', 'User research', 'Prototyping', 'Design systems', 'Accessibility'],
  },
  {
    title: 'Cloud DevOps Engineer',
    company: 'AIFAGen Consulting',
    consultant: 'Relay Systems',
    location: 'Pune, Maharashtra',
    workMode: 'Hybrid',
    employmentType: 'Contract',
    description: 'Improve deployment reliability and cloud infrastructure for multiple engineering teams.',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
  },
  {
    title: 'Technical Recruiter',
    company: 'AIFAGen Consulting',
    consultant: 'Brightworks',
    location: 'Delhi, India',
    workMode: 'On-site',
    employmentType: 'Full-time',
    description: 'Partner with hiring managers to source and guide technical candidates through hiring.',
    requiredSkills: ['Technical sourcing', 'Interview coordination', 'ATS', 'Stakeholder management', 'Communication'],
  },
]

const applicantProfiles = [
  {
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    mobile: '+91 98765 01432',
    location: 'Bengaluru, Karnataka',
    headline: 'Software engineer focused on scalable web products',
    experienceYears: 6,
    education: 'B.Tech, Computer Science · NIT Karnataka',
    skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'REST APIs', 'Node.js', 'Figma'],
  },
  {
    name: 'Mira Shah',
    email: 'mira.shah@example.com',
    mobile: '+91 98221 06418',
    location: 'Mumbai, Maharashtra',
    headline: 'Backend developer building secure financial services',
    experienceYears: 5,
    education: 'MCA · University of Mumbai',
    skills: ['Node.js', 'JavaScript', 'Express', 'MongoDB', 'REST APIs', 'Docker', 'AWS'],
  },
  {
    name: 'Kabir Nair',
    email: 'kabir.nair@example.com',
    mobile: '+91 98450 27139',
    location: 'Hyderabad, Telangana',
    headline: 'Data analyst translating complex data into decisions',
    experienceYears: 4,
    education: 'B.Sc, Statistics · Osmania University',
    skills: ['SQL', 'Python', 'Excel', 'Power BI', 'Data visualization', 'AWS'],
  },
  {
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    mobile: '+91 99860 43712',
    location: 'Pune, Maharashtra',
    headline: 'Product designer creating accessible digital experiences',
    experienceYears: 5,
    education: 'B.Des, Interaction Design · Srishti Institute',
    skills: ['Figma', 'User research', 'Prototyping', 'Design systems', 'Accessibility', 'CSS'],
  },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@example.com',
    mobile: '+91 97910 52834',
    location: 'Chennai, Tamil Nadu',
    headline: 'Cloud engineer automating infrastructure and delivery',
    experienceYears: 7,
    education: 'B.E, Information Technology · Anna University',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Python', 'Node.js'],
  },
  {
    name: 'Diya Kapoor',
    email: 'diya.kapoor@example.com',
    mobile: '+91 98110 86325',
    location: 'Delhi, India',
    headline: 'Talent partner connecting product teams with great people',
    experienceYears: 4,
    education: 'MBA, Human Resources · Delhi University',
    skills: ['Technical sourcing', 'Interview coordination', 'ATS', 'Stakeholder management', 'Communication', 'SQL'],
  },
  {
    name: 'Ishaan Verma',
    email: 'ishaan.verma@example.com',
    mobile: '+91 99000 72816',
    location: 'Remote · India',
    headline: 'Full-stack developer with a product-first approach',
    experienceYears: 3,
    education: 'B.Tech, Information Technology · VIT',
    skills: ['React', 'JavaScript', 'CSS', 'Node.js', 'Express', 'MongoDB', 'REST APIs'],
  },
  {
    name: 'Sara Thomas',
    email: 'sara.thomas@example.com',
    mobile: '+91 98470 65231',
    location: 'Kochi, Kerala',
    headline: 'Business analyst with strong reporting and research skills',
    experienceYears: 2,
    education: 'B.Com, Finance · Kerala University',
    skills: ['Excel', 'SQL', 'Power BI', 'Communication', 'User research', 'Prototyping'],
  },
]

const internalJobListings = internalJobSeeds.map((job, jobIndex) => ({
  ...job,
  id: `internal-job-${String(jobIndex + 1).padStart(3, '0')}`,
  postedAt: new Date(Date.UTC(2026, 8, 26 - jobIndex * 3)).toISOString().slice(0, 10),
  visible: jobIndex !== 4,
  applications: applicantProfiles
    .slice(jobIndex % 3, jobIndex % 3 + 5)
    .map((profile, applicantIndex) => ({
      ...profile,
      id: `${job.id}-applicant-${applicantIndex + 1}`,
      appliedAt: new Date(Date.UTC(2026, 9, 8 - ((jobIndex + applicantIndex * 2) % 9))).toISOString().slice(0, 10),
      applicationStatus: ['New', 'In review', 'Shortlisted', 'New', 'In review'][applicantIndex],
      resume: {
        fileName: `${profile.name.replaceAll(' ', '_')}_Resume.pdf`,
        uploadedAt: new Date(Date.UTC(2026, 9, 7 - applicantIndex)).toISOString().slice(0, 10),
        fileSizeKb: 180 + applicantIndex * 37 + jobIndex * 11,
      },
    })),
}))

const jobSourceRecords = [
  {
    id: 'wellfound',
    name: 'Wellfound',
    status: 'No jobs',
    lastRunAt: '2026-10-06T04:30:00+05:30',
    durationSeconds: 625,
    jobsSaved: 0,
    newJobs: 0,
    jobsLast24h: 268,
    note: 'Last 3 runs returned zero listings.',
    refreshResult: 'empty',
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    status: 'Blocked',
    lastRunAt: '2026-10-06T08:30:00+05:30',
    durationSeconds: 110,
    jobsSaved: 614,
    newJobs: 114,
    jobsLast24h: 0,
    note: 'Source is rate-limiting our requests (HTTP 429).',
    refreshResult: 'blocked',
  },
  {
    id: 'company-career-pages',
    name: 'Company career pages',
    status: 'Stalled',
    lastRunAt: '2026-10-06T13:30:00+05:30',
    durationSeconds: 294,
    jobsSaved: 442,
    newJobs: 49,
    jobsLast24h: 97,
    note: 'Run has exceeded 4× its normal duration.',
    refreshResult: 'stalled',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    status: 'Working',
    lastRunAt: '2026-10-07T00:30:00+05:30',
    durationSeconds: 532,
    jobsSaved: 658,
    newJobs: 9,
    jobsLast24h: 376,
    note: '—',
    refreshResult: 'success',
  },
  {
    id: 'indeed',
    name: 'Indeed',
    status: 'Working',
    lastRunAt: '2026-10-06T14:30:00+05:30',
    durationSeconds: 300,
    jobsSaved: 307,
    newJobs: 23,
    jobsLast24h: 50,
    note: '—',
    refreshResult: 'success',
  },
  {
    id: 'naukri',
    name: 'Naukri',
    status: 'Working',
    lastRunAt: '2026-10-07T08:30:00+05:30',
    durationSeconds: 722,
    jobsSaved: 708,
    newJobs: 70,
    jobsLast24h: 250,
    note: '—',
    refreshResult: 'success',
  },
  {
    id: 'instahyre',
    name: 'Instahyre',
    status: 'Working',
    lastRunAt: '2026-10-07T07:30:00+05:30',
    durationSeconds: 580,
    jobsSaved: 198,
    newJobs: 27,
    jobsLast24h: 250,
    note: '—',
    refreshResult: 'success',
  },
]

const jobSourceRecentRuns = [
  ['wellfound', '2026-10-07T13:30:00+05:30', '2026-10-07T13:31:02+05:30', 'Failed', 0, 0, 'Last 3 runs returned zero listings.'],
  ['instahyre', '2026-10-07T12:30:00+05:30', '2026-10-07T12:34:00+05:30', 'Success', 479, 32, '—'],
  ['linkedin', '2026-10-07T09:30:00+05:30', '2026-10-07T09:40:00+05:30', 'Success', 548, 75, '—'],
  ['indeed', '2026-10-07T09:30:00+05:30', '2026-10-07T09:33:00+05:30', 'Success', 152, 80, '—'],
  ['company-career-pages', '2026-10-07T09:30:00+05:30', '2026-10-07T09:44:00+05:30', 'Failed', 0, 0, 'Run has exceeded 4× its normal duration.'],
  ['naukri', '2026-10-07T08:30:00+05:30', '2026-10-07T08:40:00+05:30', 'Success', 338, 120, '—'],
  ['glassdoor', '2026-10-07T06:30:00+05:30', '2026-10-07T06:43:00+05:30', 'Failed', 0, 0, 'Source is rate-limiting our requests (HTTP 429).'],
  ['linkedin', '2026-10-06T13:30:00+05:30', '2026-10-06T13:41:00+05:30', 'Success', 283, 97, '—'],
  ['naukri', '2026-10-06T13:30:00+05:30', '2026-10-06T13:30:30+05:30', 'Success', 571, 108, '—'],
  ['company-career-pages', '2026-10-06T13:30:00+05:30', '2026-10-06T13:37:00+05:30', 'Success', 342, 21, '—'],
  ['wellfound', '2026-10-06T12:30:00+05:30', '2026-10-06T12:36:00+05:30', 'Success', 207, 64, '—'],
  ['instahyre', '2026-10-06T08:30:00+05:30', '2026-10-06T08:36:00+05:30', 'Success', 446, 59, '—'],
].map(([sourceId, startedAt, finishedAt, status, jobsSaved, newJobs, note], index) => ({
  id: `source-run-seed-${index + 1}`,
  sourceId,
  startedAt,
  finishedAt,
  status,
  jobsSaved,
  newJobs,
  note,
}))

const aiUsageFeatures = ['Resume analysis', 'Cover letter', 'Job matching', 'Interview prep']
const aiUsageProviders = [
  { name: 'Google', costPerCall: 4.49 },
  { name: 'OpenAI', costPerCall: 4.37 },
  { name: 'Anthropic', costPerCall: 4.22 },
]
const recentDailyCallCounts = [15, 16, 14, 18, 17, 16, 18]
const aiUsageEvents = Array.from({ length: 90 }, (_, dayIndex) => {
  const daysAgo = 89 - dayIndex
  const date = new Date(Date.UTC(2026, 9, 9 - daysAgo)).toISOString().slice(0, 10)
  const callCount = daysAgo < recentDailyCallCounts.length
    ? recentDailyCallCounts[recentDailyCallCounts.length - 1 - daysAgo]
    : 11 + ((dayIndex * 7 + 3) % 11)

  return Array.from({ length: callCount }, (_, callIndex) => {
    const userIndex = (dayIndex * 13 + callIndex * 17 + callIndex ** 2) % mockUsers.length
    const provider = aiUsageProviders[(dayIndex * 2 + callIndex * 5) % aiUsageProviders.length]
    return {
      id: `ai-call-${dayIndex}-${callIndex}`,
      date,
      userId: mockUsers[userIndex].id,
      feature: aiUsageFeatures[(dayIndex + callIndex * 3) % aiUsageFeatures.length],
      provider: provider.name,
      cost: Number((provider.costPerCall * (0.45 + ((dayIndex * 11 + callIndex * 7) % 12) / 10)).toFixed(2)),
    }
  })
}).flat()

export { mockUsers }
export {
  aiUsageEvents,
  internalJobListings,
  jobListings,
  jobSourceRecentRuns,
  jobSourceRecords,
  mockPayments,
  upcomingRenewals,
}
export default dashboardData
