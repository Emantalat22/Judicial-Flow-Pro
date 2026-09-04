// ─────────────────────────────────────────────────────────────────
//  Judicial Flow Pro — Dashboard Demo Data
//  All demonstration data is centralised here.
//  Replace exports with API calls when backend is ready.
// ─────────────────────────────────────────────────────────────────

// ── KPI Statistics ────────────────────────────────────────────────
export const statsCards = [
  {
    id: 1,
    label: 'Active Cases',
    value: 142,
    delta: '↑ 8 this month',
    deltaType: 'up',
    iconKey: 'briefcase',
    accent: 'navy',
    spark: [118, 122, 127, 125, 133, 138, 142],
  },
  {
    id: 2,
    label: 'Pending Review',
    value: 37,
    delta: '↑ 3 this week',
    deltaType: 'up',
    iconKey: 'clock',
    accent: 'gold',
    spark: [29, 33, 31, 36, 34, 35, 37],
  },
  {
    id: 3,
    label: "Today's Hearings",
    value: 9,
    delta: '2 in next hour',
    deltaType: 'neutral',
    iconKey: 'calendar',
    accent: 'royal',
    spark: [6, 8, 7, 9, 8, 10, 9],
  },
  {
    id: 4,
    label: 'Cases Resolved',
    value: 318,
    delta: '↑ 24 this month',
    deltaType: 'up',
    iconKey: 'check',
    accent: 'green',
    spark: [252, 265, 278, 289, 301, 310, 318],
  },
]

// ── Case Workflow Stages ──────────────────────────────────────────
// Live stage counts are computed from /api/cases in useCaseStats.js

// ── Recent Cases ─────────────────────────────────────────────────
export const recentCases = [
  {
    id: 1,
    caseNumber: 'JFP-2025-0187',
    title: 'State v. Harrington',
    type: 'Criminal',
    status: 'hearing',
    priority: 'high',
    nextHearing: 'Aug 29, 2026',
  },
  {
    id: 2,
    caseNumber: 'JFP-2025-0183',
    title: 'Al-Rashid v. City Planning Board',
    type: 'Administrative',
    status: 'assigned',
    priority: 'medium',
    nextHearing: 'Sep 03, 2026',
  },
  {
    id: 3,
    caseNumber: 'JFP-2025-0179',
    title: 'Westfield Holdings LLC v. Nguyen',
    type: 'Civil',
    status: 'review',
    priority: 'medium',
    nextHearing: 'Sep 10, 2026',
  },
  {
    id: 4,
    caseNumber: 'JFP-2025-0175',
    title: 'In re: Estate of Marchetti',
    type: 'Probate',
    status: 'decision',
    priority: 'low',
    nextHearing: 'Sep 15, 2026',
  },
  {
    id: 5,
    caseNumber: 'JFP-2025-0168',
    title: 'Okonkwo v. Metropolitan Insurance',
    type: 'Civil',
    status: 'hearing',
    priority: 'high',
    nextHearing: 'Aug 30, 2026',
  },
  {
    id: 6,
    caseNumber: 'JFP-2025-0161',
    title: 'Rodriguez Family Trust Dispute',
    type: 'Family',
    status: 'filed',
    priority: 'medium',
    nextHearing: 'Sep 22, 2026',
  },
]

// ── Upcoming Hearings ─────────────────────────────────────────────
export const upcomingHearings = [
  {
    id: 1,
    dayAbbr: 'THU',
    dayNum: '29',
    month: 'AUG',
    time: '09:30 AM',
    caseTitle: 'State v. Harrington',
    caseNumber: 'JFP-2025-0187',
    type: 'Criminal',
    courtroom: 'Courtroom 3B',
    status: 'confirmed',
  },
  {
    id: 2,
    dayAbbr: 'THU',
    dayNum: '29',
    month: 'AUG',
    time: '11:00 AM',
    caseTitle: 'Okonkwo v. Metropolitan Insurance',
    caseNumber: 'JFP-2025-0168',
    type: 'Civil',
    courtroom: 'Courtroom 2A',
    status: 'confirmed',
  },
  {
    id: 3,
    dayAbbr: 'FRI',
    dayNum: '30',
    month: 'AUG',
    time: '02:00 PM',
    caseTitle: 'Al-Rashid v. City Planning Board',
    caseNumber: 'JFP-2025-0183',
    type: 'Administrative',
    courtroom: 'Courtroom 1C',
    status: 'pending',
  },
]

// ── Priority Actions ──────────────────────────────────────────────
export const priorityActions = [
  {
    id: 1,
    urgency: 'high',
    iconKey: 'calendar',
    title: 'Hearing tomorrow',
    caseNumber: 'JFP-2025-0187',
    description: 'Hearing tomorrow — preparation required',
    date: 'Aug 29, 2026',
    actionLabel: 'Open',
  },
  {
    id: 2,
    urgency: 'medium',
    iconKey: 'documentCheck',
    title: 'Document verification required',
    caseNumber: 'JFP-2025-0183',
    description: 'Document verification — 3 items pending',
    date: 'Due today',
    actionLabel: 'Open',
  },
  {
    id: 3,
    urgency: 'medium',
    iconKey: 'gavel',
    title: 'Decision pending',
    caseNumber: 'JFP-2025-0175',
    description: 'Decision pending — ruling draft awaiting signature',
    date: 'Sep 1, 2026',
    actionLabel: 'Open',
  },
]

// ── Case Analytics ─────────────────────────────────────────────
// Live status distribution and filings trend are computed
// from /api/cases in useCaseStats.js / CaseAnalytics.jsx

// ── AI Assistant Stats (compact 3-metric display) ─────────────────
// Removed — AI Assistant is unimplemented; AICard now lists planned
// capabilities instead of fabricated metrics.

// ── AI Assistant Insights (legacy — kept for AIAssistant page) ────
export const aiInsights = [
  { id: 1, metric: 12, label: 'Documents analysed today' },
  { id: 2, metric: 4,  label: 'Pending actions detected' },
  { id: 3, metric: 2,  label: 'Upcoming deadlines flagged' },
]

// ── Quick Actions ─────────────────────────────────────────────────
export const quickActions = [
  { id: 1, label: 'New Case',         iconKey: 'plus',      to: '/cases'     },
  { id: 2, label: 'Schedule Hearing', iconKey: 'calendar',  to: '/hearings'  },
  { id: 3, label: 'Upload Document',  iconKey: 'upload',    to: '/documents' },
  { id: 4, label: 'Ask Judicial AI',  iconKey: 'sparkles',  to: '/ai'        },
]
