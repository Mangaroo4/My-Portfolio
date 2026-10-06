// =====================================================================
//  Portfolio content. Edit this file to change what the site shows.
//  Everything below marked SAMPLE is placeholder content: replace it
//  with your real projects, history and numbers before publishing.
// =====================================================================

const PROFILE = {
  name: 'Alex Morgan',
  handle: 'alex',
  role: 'Junior Backend Developer',
  email: 'hello@example.com',
  location: 'Remote · UTC+7',
  status: 'Open to junior backend & IT support roles',
  // Only links with a URL are shown. Add yours (e.g. LinkedIn, CV).
  links: [
    { label: 'GitHub', url: 'https://github.com/Mangaroo4' },
    { label: 'LinkedIn', url: '' },
    { label: 'Resume', url: '' },
  ],
};

// Words cycled in the hero headline.
const ROLES = ['backend systems', 'REST APIs', 'reliable services', 'IT solutions', 'automation scripts'];

// SAMPLE numbers.
const STATS = [
  { value: 12, suffix: '+', label: 'Projects shipped' },
  { value: 500, suffix: '+', label: 'Support tickets closed' },
  { value: 99.9, suffix: '%', label: 'Uptime on my services', decimals: 1 },
  { value: 3, suffix: '', label: 'Years writing code' },
];

const SKILL_GROUPS = [
  {
    id: 'languages',
    label: 'Languages',
    skills: [
      { name: 'JavaScript', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'SQL', level: 65 },
      { name: 'Bash / PowerShell', level: 60 },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    skills: [
      { name: 'Node.js', level: 82 },
      { name: 'Express / Fastify', level: 78 },
      { name: 'REST API design', level: 75 },
      { name: 'Auth (JWT, sessions)', level: 68 },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    skills: [
      { name: 'PostgreSQL', level: 70 },
      { name: 'Prisma ORM', level: 66 },
      { name: 'Redis', level: 52 },
      { name: 'MongoDB', level: 55 },
    ],
  },
  {
    id: 'ops',
    label: 'DevOps',
    skills: [
      { name: 'Git & GitHub', level: 82 },
      { name: 'Docker', level: 60 },
      { name: 'Linux servers', level: 64 },
      { name: 'CI with GitHub Actions', level: 55 },
    ],
  },
  {
    id: 'support',
    label: 'IT Support',
    skills: [
      { name: 'Troubleshooting', level: 88 },
      { name: 'Windows & Active Directory', level: 74 },
      { name: 'Networking basics', level: 66 },
      { name: 'User onboarding', level: 80 },
    ],
  },
];

// SAMPLE projects. `category` drives the filter buttons.
const PROJECTS = [
  {
    id: 'helpdesk-api',
    title: 'Helpdesk Ticket API',
    category: 'api',
    year: 2026,
    summary: 'REST API for IT support tickets with roles, SLA timers and email alerts.',
    problem: 'Support requests arrived by chat and email and were easy to lose track of.',
    solution: 'A typed Express API with JWT auth, agent/user roles, SLA timers that escalate overdue tickets, and an audit log.',
    result: 'Every request is tracked in one place, with automatic alerts before an SLA is missed.',
    stack: ['TypeScript', 'Express', 'PostgreSQL', 'Prisma', 'JWT'],
    repo: '',
    demo: '',
  },
  {
    id: 'uptime-monitor',
    title: 'Uptime Monitor',
    category: 'tools',
    year: 2026,
    summary: 'Pings services on a schedule and alerts a Discord channel when something goes down.',
    problem: 'Outages were noticed by users before the team knew about them.',
    solution: 'A Node.js worker that checks HTTP endpoints and ports on a cron schedule, stores response times and sends alerts with retries to avoid false alarms.',
    result: 'Downtime is reported within a minute, with a small dashboard of response-time history.',
    stack: ['Node.js', 'TypeScript', 'SQLite', 'Discord webhooks'],
    repo: '',
    demo: '',
  },
  {
    id: 'asset-tracker',
    title: 'IT Asset Tracker',
    category: 'support',
    year: 2025,
    summary: 'Tracks laptops, licences and who has what, with CSV import and warranty reminders.',
    problem: 'Hardware and licences were tracked in a spreadsheet that was always out of date.',
    solution: 'A small backend with a clean data model for devices, people and licences, CSV import from the old sheet, and warranty-expiry reminders.',
    result: 'Onboarding and offboarding checklists now take minutes instead of an afternoon.',
    stack: ['Node.js', 'Fastify', 'Prisma', 'PostgreSQL'],
    repo: '',
    demo: '',
  },
  {
    id: 'auth-service',
    title: 'Auth Microservice',
    category: 'api',
    year: 2025,
    summary: 'Login, refresh tokens and rate limiting as a standalone service.',
    problem: 'Each side project re-implemented login slightly differently, and slightly insecurely.',
    solution: 'One service with hashed passwords, short-lived access tokens, rotating refresh tokens and Redis-backed rate limiting.',
    result: 'Reused across three projects, with brute-force attempts blocked automatically.',
    stack: ['TypeScript', 'Express', 'Redis', 'bcrypt', 'Docker'],
    repo: '',
    demo: '',
  },
  {
    id: 'log-cli',
    title: 'Log Lens CLI',
    category: 'tools',
    year: 2025,
    summary: 'Command-line tool that turns noisy server logs into a readable error summary.',
    problem: 'Finding the cause of an incident meant scrolling through thousands of log lines.',
    solution: 'A TypeScript CLI that streams log files, groups repeated errors, and prints the top offenders with first and last seen times.',
    result: 'Incident triage starts with a one-screen summary instead of raw logs.',
    stack: ['TypeScript', 'Node streams', 'Commander'],
    repo: '',
    demo: '',
  },
  {
    id: 'onboarding-scripts',
    title: 'Onboarding Automation',
    category: 'support',
    year: 2024,
    summary: 'Scripts that set up new staff accounts, mailboxes and laptops in one run.',
    problem: 'New starters waited hours for accounts and software to be set up by hand.',
    solution: 'PowerShell and Node scripts driven by a single form: create accounts, assign groups, install the standard software list.',
    result: 'Setup went from about half a day to under 30 minutes per person.',
    stack: ['PowerShell', 'Node.js', 'Active Directory'],
    repo: '',
    demo: '',
  },
];

const PROJECT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'api', label: 'APIs' },
  { id: 'tools', label: 'Tools' },
  { id: 'support', label: 'IT Support' },
];

// SAMPLE history, newest first.
const TIMELINE = [
  {
    when: '2026 — now',
    title: 'Junior Backend Developer',
    org: 'Freelance & personal projects',
    text: 'Building APIs and internal tools in TypeScript, with a focus on tests, clear docs and boring, reliable deploys.',
  },
  {
    when: '2024 — 2026',
    title: 'IT Support Specialist',
    org: 'Small business support team',
    text: 'First-line and second-line support for around 80 staff: hardware, accounts, networking and automating the repetitive parts.',
  },
  {
    when: '2023',
    title: 'Started writing JavaScript',
    org: 'Self-taught',
    text: 'Moved from fixing systems to building them: online courses, small scripts, then the first real Node.js project.',
  },
];

const SERVICES = [
  { code: '01', title: 'API development', text: 'REST APIs in Node.js and TypeScript with validation, auth and clear documentation.' },
  { code: '02', title: 'Database design', text: 'Schemas, migrations and queries that stay fast and understandable as the data grows.' },
  { code: '03', title: 'IT support', text: 'Calm troubleshooting for hardware, accounts and networks, explained in plain words.' },
  { code: '04', title: 'Automation', text: 'Scripts and small tools that remove the repetitive work from a team’s week.' },
];

// The guide character shown in the intro, the hero card and the bottom corner.
// Each line can set the character's mood: neutral, happy, excited, curious, surprised,
// thinking, sleepy, embarrassed, annoyed, sad, wink, proud.
const GUIDE = {
  name: 'KAI',
  title: 'System guide',
  intro: [
    { mood: 'happy', text: 'Link established. I’m KAI, the guide for this system.' },
    { mood: 'proud', text: `You’re inside the portfolio of ${PROFILE.name}: ${PROFILE.role.toLowerCase()} and IT support specialist.` },
    { mood: 'wink', text: 'I’ll stay in the corner and flag the important parts. Scroll to explore, or open the command menu with Ctrl + K.' },
  ],
  sections: {
    home: { mood: 'happy', text: 'Main node. Backend systems, built to stay up.' },
    stats: { mood: 'excited', text: 'Telemetry. These numbers update live as you scroll in.' },
    skills: { mood: 'proud', text: 'Skill matrix. Switch categories with the tabs.' },
    projects: { mood: 'curious', text: 'Project archive. Filter it, then open any card for the full breakdown.' },
    experience: { mood: 'thinking', text: 'Timeline. From fixing systems to building them.' },
    services: { mood: 'wink', text: 'Services. What I can take off your plate.' },
    terminal: { mood: 'excited', text: 'Live terminal. Try typing “help”.' },
    contact: { mood: 'happy', text: 'Uplink. Send a message and it opens in your mail app.' },
  },
  chatter: [
    { mood: 'proud', text: 'TypeScript: JavaScript with a safety system enabled.' },
    { mood: 'curious', text: 'Tip: press Ctrl + K anywhere to jump between sections.' },
    { mood: 'sleepy', text: 'Have you tried turning it off and on again? Works more often than it should.' },
    { mood: 'wink', text: 'Try “sudo hire” in the terminal.' },
    { mood: 'thinking', text: 'Logs don’t lie. People forget; logs remember.' },
    { mood: 'embarrassed', text: 'Y-you keep poking me. Are you testing my hitbox?' },
    { mood: 'annoyed', text: 'Production deploy on a Friday? Absolutely not.' },
    { mood: 'surprised', text: 'Whoa! Did you see that uptime number?' },
    { mood: 'sad', text: 'Nobody reads the documentation… except you. Thank you.' },
  ],
  // Quick reactions to things you do on the page.
  reactions: {
    copied: { mood: 'wink', text: 'Email copied. Smooth.' },
    sent: { mood: 'excited', text: 'Message ready to transmit! Fingers crossed.' },
    invalid: { mood: 'annoyed', text: 'That form needs a little more info.' },
    palette: { mood: 'curious', text: 'Command menu. Where to?' },
    hire: { mood: 'embarrassed', text: 'S-sudo hire?! …accepted.' },
    error: { mood: 'surprised', text: 'Unknown command! Try “help”.' },
  },
};
