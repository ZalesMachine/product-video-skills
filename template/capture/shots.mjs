// Which screens to capture and which elements to measure. See skills/pv-capture/SKILL.md.
// The defaults capture examples/acme-desk; replace them with your product's routes and selectors.
//
// Each shot: id, route, selector to wait for, actions before the capture (`before`), extra CSS,
// `fullPage` (scroll plane), `settle` (ms to wait), `probe` (class prefixes for --probe) and
// `targets` (name → selector; "selector@n" = the n-th match, zero-based).
//
// Conventions the scenes expect:
// - `navItem` in every section shot (PV.navIntro). `sidebar` and `navEnd` are measured
//   automatically from config.mjs.
// - A normal shot and a `-full` one (fullPage, sidebar hidden) per view that scrolls.
// - Per-row/card/kpi targets numbered from 1: row1..n, card1..n, kpi1..n.

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
// "selector@n" (zero-based) does NOT accept descendants: `.row@1 .status` gives null. For a child of
// the n-th match use `:nth-child(n)` on the parent. In single-page apps hidden views stay in the DOM:
// prefix with the view's container (`#view-dashboard .page-head`).

export const SHOTS = [
  { id: 'login', route: null, wait: '.login-card', targets: { card: '.login-card' } },
  {
    id: 'dashboard', route: 'dashboard', wait: '.kpi-strip', settle: 300,
    probe: ['kpi', 'card', 'chart'],
    targets: {
      head: '#view-dashboard .page-head', navItem: '.nav-item[data-route="dashboard"]',
      kpis: '.kpi-strip', chart: '.chart-card', channels: '.channels', topics: '.topics', team: '.team', exportBtn: '.page-head .btn.primary',
      ...Object.fromEntries(range(4).map((i) => [`kpi${i}`, `.kpi-strip > :nth-child(${i})`])),
    },
  },
  {
    id: 'tickets', route: 'tickets', wait: '.ticket-table', settle: 300,
    probe: ['ticket', 'badge', 'tabs'],
    targets: {
      head: '#view-tickets .page-head', navItem: '.nav-item[data-route="tickets"]', table: '.table-card', thead: '.ticket-table thead', tabs: '.tabs',
      ...Object.fromEntries(range(10).map((i) => [`row${i}`, `.ticket-table tbody tr:nth-child(${i})`])),
      ...Object.fromEntries(range(10).map((i) => [`st${i}`, `.ticket-table tbody tr:nth-child(${i}) .badge`])),
    },
  },
  {
    id: 'customers', route: 'customers', wait: '.cust-grid', settle: 300,
    targets: {
      head: '#view-customers .page-head', navItem: '.nav-item[data-route="customers"]', grid: '.cust-grid',
      ...Object.fromEntries(range(8).map((i) => [`card${i}`, `.cust-grid > :nth-child(${i})`])),
    },
  },
];
