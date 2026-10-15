export const assistantWelcomeMessage = 'Hi! 👋 I\'m Aifa, your AI-powered assistant for the Aifa Gen Labs admin dashboard. I can help you navigate jobs, candidates, recruiters, payments, and AI usage. Choose a suggested question or type what you would like to know to get started.'

export const assistantData = [
  {
    id: 'what-can-you-help-with',
    question: 'What can you help me with?',
    answer: 'I can guide you through the Aifa admin dashboard. You can ask me about jobs, candidates, recruiters, payments, reports, notifications, and AI usage.',
    keywords: ['dashboard', 'jobs', 'candidates', 'recruiters', 'payments', 'reports', 'notifications', 'ai usage'],
    relatedPage: 'Overview',
  },
  {
    id: 'failed-payments',
    question: 'How do I find failed payments?',
    answer: 'Open the Ledger page, then use the available payment filters to review transactions marked as failed. You can inspect the details to understand the issue and next steps.',
    keywords: ['failed', 'payments', 'ledger'],
    relatedPage: 'Ledger',
  },
  {
    id: 'unassigned-candidates',
    question: 'Where can I find unassigned candidates?',
    answer: 'Open the Talent Partners page to review candidates that are not assigned to a recruiter. The exact filters depend on the current dashboard implementation, but the assignment overview is the quickest place to check.',
    keywords: ['unassigned', 'candidates', 'recruiter', 'talent'],
    relatedPage: 'Talent Partners',
  },
  {
    id: 'payment-reports',
    question: 'How do I download payment reports?',
    answer: 'Open the Ledger page and use the Save Report as PDF option to generate and download a structured payment report. This is the export option currently available in the dashboard.',
    keywords: ['download', 'payment', 'report', 'pdf'],
    relatedPage: 'Ledger',
  },
  {
    id: 'job-fetching-failures',
    question: 'How do I check job-fetching failures?',
    answer: 'Use the notification bell in the dashboard header to review urgent alerts, including job-fetching failures. Select the relevant alert to open the associated dashboard page and investigate the issue.',
    keywords: ['job', 'fetching', 'failures', 'notification', 'alert'],
    relatedPage: 'Pipelines',
  },
  {
    id: 'recruiter-activity',
    question: 'How do I view recruiter activity?',
    answer: 'Open the Talent Partners page to review recruiter details, assigned candidates, and the available recruiter information. Use the table and profile details to inspect each recruiter\'s activity in context.',
    keywords: ['recruiter', 'activity', 'talent', 'partners'],
    relatedPage: 'Talent Partners',
  },
  {
    id: 'ai-usage-page',
    question: 'What is the AI Usage page?',
    answer: 'The AI Usage page provides an overview of AI usage metrics available in the dashboard. Open it to inspect the current statistics and charts implemented for the platform.',
    keywords: ['ai', 'usage', 'page', 'metrics', 'charts'],
    relatedPage: 'AI Usage',
  },
  {
    id: 'jobs-fetched-today',
    question: 'How do I find jobs fetched today?',
    answer: 'Open the Pipelines page and review the current job-fetching analytics or date-based metrics to find the jobs processed today. The exact view depends on the active dashboard metrics.',
    keywords: ['jobs', 'today', 'fetched', 'pipeline', 'date'],
    relatedPage: 'Pipelines',
  },
  {
    id: 'hidden-jobs',
    question: 'How do I check hidden jobs?',
    answer: 'Open the Pipelines page and choose the Hidden option in the visibility filter, if it is available in the current view. That is the dashboard control used to review jobs that are hidden from the main listing.',
    keywords: ['hidden', 'jobs', 'visibility', 'pipeline'],
    relatedPage: 'Pipelines',
  },
  {
    id: 'navigate-dashboard',
    question: 'How do I navigate the dashboard?',
    answer: 'Use the sidebar navigation menu to move between sections such as Dashboard, Users, Ledger, Pipelines, Talent Partners, AI Usage, and System Config. Each item opens the relevant dashboard view for your work.',
    keywords: ['navigate', 'dashboard', 'sidebar', 'menu', 'go', 'open'],
    relatedPage: 'Dashboard',
  },
]

export const fallbackAssistantResponse = 'I\'m still learning the available dashboard questions. Please choose one of the suggested questions, or try asking about jobs, candidates, recruiters, payments, reports, notifications, or AI usage.'

export default assistantData
