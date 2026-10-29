// Acme Desk · a fictional helpdesk used as the demo product of product-video-skills.
// A tiny hash-routed app that reads everything from /api/*. In the video pipeline those calls are
// answered by video/capture/demo-data.mjs: there is no real backend.

const STR = {
  en: {
    'nav.label': 'Workspace', 'nav.dashboard': 'Dashboard', 'nav.tickets': 'Tickets', 'nav.customers': 'Customers',
    'nav.automations': 'Automations', 'nav.reports': 'Reports', 'nav.settings': 'Settings',
    'dash.sub': 'Last 7 days', 'range.7': '7 days', 'range.30': '30 days', 'range.90': '90 days', export: 'Export',
    'kpi.open': 'Open tickets', 'kpi.solved': 'Solved this week', 'kpi.reply': 'First reply (median)', 'kpi.csat': 'Satisfaction (CSAT)',
    'kpi.vs': 'vs last week', min: 'min',
    'chart.title': 'Tickets by day', 'chart.new': 'New', 'chart.solved': 'Solved',
    'chan.title': 'By channel', 'chan.email': 'Email', 'chan.chat': 'Chat', 'chan.phone': 'Phone',
    'topics.title': 'Top topics', 'team.title': 'Team this week', 'team.solved': 'solved', 'team.reply': 'first reply',
    'tk.sub': (o, u) => `${o} open · ${u} unassigned`, 'tk.search': 'Search tickets…', 'tk.new': 'New ticket',
    'tk.all': 'All', 'tk.mine': 'Mine', 'tk.unassigned': 'Unassigned', 'tk.solved': 'Solved',
    'th.id': 'ID', 'th.subject': 'Subject', 'th.customer': 'Customer', 'th.channel': 'Channel', 'th.priority': 'Priority', 'th.status': 'Status', 'th.agent': 'Agent', 'th.updated': 'Updated',
    'st.new': 'New', 'st.open': 'Open', 'st.pending': 'Pending', 'st.solved': 'Solved',
    'pr.urgent': 'Urgent', 'pr.high': 'High', 'pr.normal': 'Normal', 'pr.low': 'Low',
    'cu.sub': (n) => `${n} accounts`, 'cu.open': 'Open tickets', 'cu.csat': 'CSAT', 'cu.health': 'Health', 'cu.last': 'Last ticket', 'cu.search': 'Search customers…',
    'chan.note': (m) => `Chat replies are <b>${m}× faster</b> than email this week.`,
    ago: (m) => (m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`),
    'login.title': 'Sign in to Acme Desk', 'login.sub': 'Welcome back. Your queue is waiting.', 'login.email': 'Work email', 'login.password': 'Password',
    'login.go': 'Sign in', 'login.sso': 'Use single sign-on (SSO)',
  },
  es: {
    'nav.label': 'Espacio de trabajo', 'nav.dashboard': 'Panel', 'nav.tickets': 'Tickets', 'nav.customers': 'Clientes',
    'nav.automations': 'Automatizaciones', 'nav.reports': 'Reportes', 'nav.settings': 'Ajustes',
    'dash.sub': 'Últimos 7 días', 'range.7': '7 días', 'range.30': '30 días', 'range.90': '90 días', export: 'Exportar',
    'kpi.open': 'Tickets abiertos', 'kpi.solved': 'Resueltos esta semana', 'kpi.reply': 'Primera respuesta (mediana)', 'kpi.csat': 'Satisfacción (CSAT)',
    'kpi.vs': 'vs. semana pasada', min: 'min',
    'chart.title': 'Tickets por día', 'chart.new': 'Nuevos', 'chart.solved': 'Resueltos',
    'chan.title': 'Por canal', 'chan.email': 'Email', 'chan.chat': 'Chat', 'chan.phone': 'Teléfono',
    'topics.title': 'Temas principales', 'team.title': 'Equipo esta semana', 'team.solved': 'resueltos', 'team.reply': 'primera respuesta',
    'tk.sub': (o, u) => `${o} abiertos · ${u} sin asignar`, 'tk.search': 'Buscar tickets…', 'tk.new': 'Nuevo ticket',
    'tk.all': 'Todos', 'tk.mine': 'Míos', 'tk.unassigned': 'Sin asignar', 'tk.solved': 'Resueltos',
    'th.id': 'ID', 'th.subject': 'Asunto', 'th.customer': 'Cliente', 'th.channel': 'Canal', 'th.priority': 'Prioridad', 'th.status': 'Estado', 'th.agent': 'Agente', 'th.updated': 'Actualizado',
    'st.new': 'Nuevo', 'st.open': 'Abierto', 'st.pending': 'Pendiente', 'st.solved': 'Resuelto',
    'pr.urgent': 'Urgente', 'pr.high': 'Alta', 'pr.normal': 'Normal', 'pr.low': 'Baja',
    'cu.sub': (n) => `${n} cuentas`, 'cu.open': 'Tickets abiertos', 'cu.csat': 'CSAT', 'cu.health': 'Salud', 'cu.last': 'Último ticket', 'cu.search': 'Buscar clientes…',
    'chan.note': (m) => `Esta semana el chat responde <b>${m}× más rápido</b> que el email.`,
    ago: (m) => (m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`),
    'login.title': 'Ingresá a Acme Desk', 'login.sub': 'Hola de nuevo. Tu bandeja te espera.', 'login.email': 'Email de trabajo', 'login.password': 'Contraseña',
    'login.go': 'Ingresar', 'login.sso': 'Ingresar con SSO',
  },
};
const LANG = STR[localStorage.getItem('acme.lang')] ? localStorage.getItem('acme.lang') : 'en';
const LOCALE = LANG === 'es' ? 'es-AR' : 'en-US';
const T = (k, ...a) => { const v = STR[LANG][k] ?? STR.en[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
const fmt = (n, d = 0) => Number(n).toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
document.documentElement.lang = LANG;

const ICON = {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
  tickets: '<svg viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M13 5v14" stroke-dasharray="2 2.5"/></svg>',
  customers: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/></svg>',
  automations: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  reports: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};
const CHANNEL_COLOR = { email: 'var(--info)', chat: 'var(--chat)', phone: 'var(--faint)' };
const PRIORITY_COLOR = { urgent: 'var(--danger)', high: 'var(--accent)', normal: 'var(--info)', low: 'var(--faint)' };
const AVATAR = ['var(--brand)', 'var(--info)', 'var(--accent)', 'var(--chat)', 'var(--ok)'];
const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

async function api(path, init) {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

const route = () => location.hash.replace(/^#\/?/, '') || 'dashboard';

function shell(me, view, body) {
  const items = ['dashboard', 'tickets', 'customers', 'automations', 'reports', 'settings'];
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><img src="logo.svg" alt="" />Acme Desk</div>
      <div class="workspace"><span class="ws-dot">${esc(initials(me.workspace))}</span><b>${esc(me.workspace)}</b></div>
      <nav class="nav">
        <div class="nav-label">${T('nav.label')}</div>
        ${items.map((id) => `<a class="nav-item${id === view ? ' active' : ''}" data-route="${id}" href="#/${id}">${ICON[id]}${T(`nav.${id}`)}${id === 'tickets' ? `<span class="count num">${fmt(me.openTickets)}</span>` : ''}</a>`).join('')}
      </nav>
      <div class="me"><span class="avatar" style="background:var(--brand)">${esc(initials(me.name))}</span><div class="who"><b>${esc(me.name)}</b><span>${esc(me.role)}</span></div></div>
    </aside>
    <main class="main" id="view-${view}">${body}</main>
  </div>`;
}

function dashboard(d) {
  const max = Math.max(...d.days.flatMap((x) => [x.new, x.solved]));
  const dayName = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(LOCALE, { weekday: 'short' });
  return `
    <header class="page-head">
      <div><h1>${T('nav.dashboard')}</h1><p>${esc(d.workspace)} · ${T('dash.sub')}</p></div>
      <div class="actions"><div class="seg"><span class="on">${T('range.7')}</span><span>${T('range.30')}</span><span>${T('range.90')}</span></div><button class="btn primary">${T('export')}</button></div>
    </header>
    <section class="kpi-strip">
      <div class="card kpi"><span class="label">${T('kpi.open')}</span><span class="value num">${fmt(d.kpis.open)}</span><span class="delta good">−${fmt(d.kpis.openDelta)}% ${T('kpi.vs')}</span></div>
      <div class="card kpi"><span class="label">${T('kpi.solved')}</span><span class="value num">${fmt(d.kpis.solved)}</span><span class="delta good">+${fmt(d.kpis.solvedDelta)}% ${T('kpi.vs')}</span></div>
      <div class="card kpi"><span class="label">${T('kpi.reply')}</span><span class="value num">${fmt(d.kpis.firstReply)}<small>${T('min')}</small></span><span class="delta good">−${fmt(d.kpis.replyDelta)} ${T('min')}</span></div>
      <div class="card kpi hi"><span class="label">${T('kpi.csat')}</span><span class="value num">${fmt(d.kpis.csat)}%</span><span class="delta good">+${fmt(d.kpis.csatDelta)} pts</span></div>
    </section>
    <section class="dash-row">
      <div class="card chart-card">
        <h2>${T('chart.title')}<span class="legend"><span><i style="background:var(--brand)"></i>${T('chart.new')}</span><span><i style="background:var(--info)"></i>${T('chart.solved')}</span></span></h2>
        <div class="chart">${d.days.map((x) => `<div class="day"><div class="bars"><span class="bar new" style="height:${(x.new / max) * 100}%"></span><span class="bar solved" style="height:${(x.solved / max) * 100}%"></span></div></div>`).join('')}</div>
        <div class="chart-days">${d.days.map((x) => `<span>${dayName(x.date)}</span>`).join('')}</div>
      </div>
      <div class="card channels">
        <h2>${T('chan.title')}</h2>
        ${d.channels.map((c) => `<div class="channel"><span class="name"><span class="dotc" style="background:${CHANNEL_COLOR[c.id]}"></span>${T(`chan.${c.id}`)}</span><span class="pct num">${fmt(c.share)}%</span><span class="track"><span class="fill" style="width:${c.share}%;background:${CHANNEL_COLOR[c.id]}"></span></span></div>`).join('')}
        <p class="note">${T('chan.note', fmt(d.chatSpeedup, 1))}</p>
      </div>
    </section>
    <section class="dash-row half">
      <div class="card topics">
        <h2>${T('topics.title')}</h2>
        <div class="list">${d.topics.map((t) => `<div class="item"><span class="grow">${esc(t.name)}</span><span class="bar-mini"><i style="width:${(t.count / d.topics[0].count) * 100}%"></i></span><b class="num">${fmt(t.count)}</b></div>`).join('')}</div>
      </div>
      <div class="card team">
        <h2>${T('team.title')}</h2>
        <div class="list">${d.team.map((a, i) => `<div class="item"><span class="avatar sm" style="background:${AVATAR[i % AVATAR.length]}">${esc(initials(a.name))}</span><span class="grow">${esc(a.name)}</span><span class="meta num">${fmt(a.reply)} ${T('min')} ${T('team.reply')}</span><b class="num">${fmt(a.solved)} ${T('team.solved')}</b></div>`).join('')}</div>
      </div>
    </section>`;
}

function tickets(d) {
  return `
    <header class="page-head">
      <div><h1>${T('nav.tickets')}</h1><p>${T('tk.sub', fmt(d.open), fmt(d.unassigned))}</p></div>
      <div class="actions"><div class="search">${ICON.search}${T('tk.search')}</div><button class="btn primary">${T('tk.new')}</button></div>
    </header>
    <div class="tabs"><span class="on">${T('tk.all')} <em class="num">${fmt(d.open)}</em></span><span>${T('tk.mine')} <em class="num">${fmt(d.mine)}</em></span><span>${T('tk.unassigned')} <em class="num">${fmt(d.unassigned)}</em></span><span>${T('tk.solved')}</span></div>
    <div class="card table-card">
      <table class="ticket-table">
        <thead><tr><th>${T('th.id')}</th><th>${T('th.subject')}</th><th>${T('th.customer')}</th><th>${T('th.channel')}</th><th>${T('th.priority')}</th><th>${T('th.status')}</th><th>${T('th.agent')}</th><th style="text-align:right">${T('th.updated')}</th></tr></thead>
        <tbody>${d.tickets.map((t, i) => `<tr>
          <td class="id">#${t.id}</td>
          <td class="subject">${esc(t.subject)}</td>
          <td class="customer">${esc(t.customer)}</td>
          <td><span class="chan"><span class="dotc" style="background:${CHANNEL_COLOR[t.channel]}"></span>${T(`chan.${t.channel}`)}</span></td>
          <td><span class="prio"><span class="dotc" style="background:${PRIORITY_COLOR[t.priority]}"></span>${T(`pr.${t.priority}`)}</span></td>
          <td><span class="badge st-${t.status}">${T(`st.${t.status}`)}</span></td>
          <td>${t.agent ? `<span class="avatar sm" style="background:${AVATAR[(t.agent.length + i) % AVATAR.length]}">${esc(initials(t.agent))}</span>` : '<span class="customer">—</span>'}</td>
          <td class="upd">${T('ago', t.minutesAgo)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function customers(d) {
  return `
    <header class="page-head">
      <div><h1>${T('nav.customers')}</h1><p>${T('cu.sub', fmt(d.total))}</p></div>
      <div class="actions"><div class="search">${ICON.search}${T('cu.search')}</div></div>
    </header>
    <section class="cust-grid">${d.customers.map((c, i) => `<div class="card cust">
      <div class="top"><span class="logo" style="background:${AVATAR[i % AVATAR.length]}">${esc(initials(c.name))}</span><div><div class="nm">${esc(c.name)}</div><div class="plan">${esc(c.plan)} · ${esc(c.country)}</div></div></div>
      <div class="stats"><div class="stat"><span>${T('cu.open')}</span><b class="num">${fmt(c.open)}</b></div><div class="stat"><span>${T('cu.csat')}</span><b class="num">${fmt(c.csat)}%</b></div></div>
      <div class="health"><span>${T('cu.health')}</span><span class="track"><span class="fill" style="width:${c.health}%"></span></span></div>
      <div class="last">${T('cu.last')}: ${esc(c.last)}</div>
    </div>`).join('')}</section>`;
}

function login() {
  return `<div class="login"><form class="login-card" onsubmit="return false">
    <div class="brand"><img src="logo.svg" alt="" />Acme Desk</div>
    <h1>${T('login.title')}</h1><p>${T('login.sub')}</p>
    <label class="field">${T('login.email')}<span class="input">sam@harborpine.example</span></label>
    <label class="field">${T('login.password')}<span class="input">••••••••••••</span></label>
    <button class="btn primary" id="sign-in">${T('login.go')}</button>
    <div class="sso">${T('login.sso')}</div>
  </form></div>`;
}

const VIEWS = { dashboard: ['/api/dashboard', dashboard], tickets: ['/api/tickets', tickets], customers: ['/api/customers', customers] };

async function render() {
  const app = document.getElementById('app');
  if (!sessionStorage.getItem('acme.token')) {
    app.innerHTML = login();
    document.getElementById('sign-in').addEventListener('click', async () => {
      const { token } = await api('/api/login', { method: 'POST', body: '{}' });
      sessionStorage.setItem('acme.token', token);
      render();
    });
    return;
  }
  const view = VIEWS[route()] ? route() : 'dashboard';
  const [path, draw] = VIEWS[view];
  const [me, data] = await Promise.all([api('/api/me'), api(path)]);
  app.innerHTML = shell(me, view, draw(data));
}

window.addEventListener('hashchange', render);
render();
