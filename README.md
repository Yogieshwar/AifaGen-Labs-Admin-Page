# AIFAGen Admin Portal

A responsive admin dashboard for reviewing platform activity and managing users, payments, job listings, recruiters, AI usage, and administrative settings. The app is built with React, Vite, and Tailwind CSS.

## Getting started

### Requirements

- Node.js
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

### Sign in

On the login page, use:

- **Email:** `admin@aifagen.com`
- **Password:** any non-empty value

This is demo authentication: the email is checked, but the password is not verified against a server or account.
### Other commands

```bash
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

## Pages and features

After signing in, use the sidebar to navigate between these pages.

### Dashboard — `/dashboard`

- View summary metrics for the platform, including users, paying users, and revenue.
- Review sign-up and plan distribution charts.
- See plans ending soon and jump to user management.
- Check active job and source health, with links to job pipelines when a source needs attention.
- Follow attention items to the relevant part of the admin portal.

### Users — `/users`

- Search users by name, email, or mobile number.
- Filter the user list by plan and account status.
- Open a user's profile to inspect account and contact details, resumes, applications, saved jobs, job preferences, and recent AI usage.
- Edit a user profile or change their plan and status.

### Ledger (Payments) — `/payments`

- Review payment and revenue summary metrics and trends.
- Search and filter payment records.
- Inspect transactions and issue partial or full refunds with a reason.
- Review upcoming renewals and send renewal reminders.
- Save Reports as PDF: Download structured PDF reports containing payment records, revenue summaries, and transaction details for reporting   and record-keeping.

### Pipelines — `/JobsAndSources`

- **Listings:** search and filter jobs by visibility, work mode, and platform; show or hide individual jobs or selected jobs; export the filtered list.
- **Jobs fetched chart:** compare posted listings or jobs collected by refresh runs, choose a date range, and filter by platform.
- **Sources:** review job-source status, recent checks, refresh information, and jobs collected; run demo status checks or refreshes.
- **Runs:** inspect recent source refresh runs, their outcomes, and job counts.

### Internal Jobs — `/internal-jobs`

- Post, edit, show, or hide internal consulting roles.
- Search, filter, and sort the job list and review job/application summaries.
- Open a job's applications, review candidate profiles and resume-match information, and update application statuses.
- Delete jobs when they are no longer needed.

### Talent Partners — `/recruiters`

- Search and filter the recruiter team by status.
- View recruiter profiles, application targets, activity, monthly performance, assigned candidates, and assignment history.
- Review attendance and login/session activity.
- Create or edit recruiter profiles and manage candidate assignments.

### AI Usage — `/ai-usage`

- Choose a reporting date range and review AI usage metrics.
- Explore daily activity over time.
- Compare usage by feature and provider, and review ranked user activity and estimated spend.

### Audit Log — `/audit-log`

- Search and filter administrative events by category.
- Review recent activity summaries and a 14-day activity view.
- Open an event to inspect its details and the changes recorded.

### System Config — `/settings`

- Add, search, and remove administrator accounts.
- Review the status of connected job-source services.

### Notifications & Alerts

- **Sticky Notification Icon:** A persistent notification icon is accessible across admin portal pages for quick access to important alerts.
- **Urgent Attention Alerts:** Displays critical issues that require administrator attention, such as failed job-fetching processes, failed payments, and candidates awaiting recruiter assignment.
- **Direct Page Navigation:** Clicking a notification redirects the administrator to the relevant page or section, making it easier to investigate and resolve issues quickly.

## Shared controls

- The sidebar includes light/dark theme switching and sign out.
- Admin records and dashboard data are stored in browser `localStorage` for this demo. There is no backend service, so changes are local to the current browser.

## Technology

- React 19
- Vite
- React Router
- Recharts
- Tailwind CSS
