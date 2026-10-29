// Demo data to capture the product without real data. See skills/pv-capture/SKILL.md.
// The defaults answer the endpoints of examples/acme-desk; replace them with your product's.
//
// A fictional account ("Harbor & Pine", a customer of the fictional Acme Desk): nothing here comes
// from a real database. Shapes replicate the real responses of each endpoint the frontend reads
// (look at its types). Everything is deterministic (no Math.random, no clock except TODAY): two
// captures in a row produce the same screens. Copy exists in every language of the video.
// The big numbers the video shows (1,284 solved, 14 min, 96 %) come from here: if you change them,
// change the scenes too.

export const ACCOUNT = 'Harbor & Pine';
export const TODAY = '2026-10-01';

const pick = (lang, en, es) => (lang === 'es' ? es : en);
const isoDaysAgo = (n) => {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

const CUSTOMERS = [
  ['Grupo Ceres', 'Business', 'MX'], ['Bluefin Logistics', 'Enterprise', 'US'], ['Cedar Health', 'Business', 'CA'],
  ['Distribuidora Andina', 'Pro', 'CO'], ['Orchard Labs', 'Pro', 'UK'], ['Mercantil Sur', 'Enterprise', 'AR'],
  ['Retail Norte', 'Starter', 'CL'], ['Logística Austral', 'Business', 'AR'], ['Kestrel Studio', 'Pro', 'ES'],
  ['Puerto Verde', 'Starter', 'UY'], ['Northfield Dental', 'Business', 'US'], ['Lumbre Café', 'Starter', 'MX'],
];
const AGENTS = ['Sam Rivera', 'Lucía Méndez', 'Diego Castro', 'Priya Nair'];
const SUBJECTS = [
  ["Can't export the March invoice", 'No puedo exportar la factura de marzo'],
  ['Refund for a duplicate charge', 'Reembolso por un cobro duplicado'],
  ['Password reset link expired', 'Expiró el link para cambiar la contraseña'],
  ['Add a second admin to our account', 'Sumar un segundo admin a la cuenta'],
  ['Shipping label shows the wrong address', 'La etiqueta de envío tiene otra dirección'],
  ['API returns 429 during the nightly sync', 'La API devuelve 429 en la sincronización nocturna'],
  ['Switch our plan to annual billing', 'Pasar el plan a facturación anual'],
  ['Order arrived damaged', 'El pedido llegó dañado'],
  ['SSO login loops back to sign-in', 'El login con SSO vuelve a la pantalla de ingreso'],
  ['Update the VAT number on invoices', 'Actualizar el CUIT en las facturas'],
  ['Webhook retries are delayed', 'Los reintentos del webhook llegan tarde'],
  ['Bulk import fails at row 2,041', 'La importación masiva falla en la fila 2.041'],
  ['Cancel order #88213', 'Cancelar el pedido #88213'],
  ['Slack integration disconnected', 'Se desconectó la integración con Slack'],
];
const CHANNELS = ['email', 'chat', 'email', 'phone', 'chat', 'email', 'email'];
const PRIORITIES = ['high', 'normal', 'urgent', 'normal', 'low', 'high', 'normal'];
const STATUSES = ['new', 'open', 'open', 'pending', 'new', 'open', 'solved', 'pending', 'open', 'solved', 'new', 'open', 'pending', 'open'];
const MINUTES = [2, 6, 11, 18, 24, 37, 52, 75, 110, 140, 185, 230, 290, 360];

function dashboard(lang) {
  const nw = [172, 191, 180, 205, 183, 120, 97];
  const solved = [186, 204, 197, 212, 199, 148, 138];   // sums to 1,284
  return {
    workspace: ACCOUNT,
    kpis: { open: 128, openDelta: 9, solved: 1284, solvedDelta: 18, firstReply: 14, replyDelta: 6, csat: 96, csatDelta: 3 },
    days: nw.map((n, i) => ({ date: isoDaysAgo(6 - i), new: n, solved: solved[i] })),
    channels: [{ id: 'email', share: 54 }, { id: 'chat', share: 31 }, { id: 'phone', share: 15 }],
    chatSpeedup: 2.4,
    topics: [
      { name: pick(lang, 'Billing & invoices', 'Facturación'), count: 312 },
      { name: pick(lang, 'Login & SSO', 'Ingreso y SSO'), count: 198 },
      { name: pick(lang, 'Shipping', 'Envíos'), count: 164 },
      { name: pick(lang, 'Integrations', 'Integraciones'), count: 121 },
      { name: pick(lang, 'Refunds', 'Reembolsos'), count: 87 },
    ],
    team: [
      { name: AGENTS[0], solved: 341, reply: 11 }, { name: AGENTS[3], solved: 329, reply: 13 },
      { name: AGENTS[1], solved: 318, reply: 12 }, { name: AGENTS[2], solved: 296, reply: 15 },
    ],
  };
}

function tickets(lang) {
  return {
    open: 128, unassigned: 23, mine: 31,
    tickets: SUBJECTS.map(([en, es], i) => ({
      id: 4821 - i * 3,
      subject: pick(lang, en, es),
      customer: CUSTOMERS[(i * 3) % CUSTOMERS.length][0],
      channel: CHANNELS[i % CHANNELS.length],
      priority: PRIORITIES[i % PRIORITIES.length],
      status: STATUSES[i],
      agent: i % 5 === 4 ? null : AGENTS[i % AGENTS.length],
      minutesAgo: MINUTES[i],
    })),
  };
}

function customers(lang) {
  return {
    total: 48,
    customers: CUSTOMERS.map(([name, plan, country], i) => ({
      name, plan, country,
      open: [12, 9, 4, 7, 3, 15, 2, 6, 5, 1, 8, 2][i],
      csat: [97, 94, 99, 95, 98, 92, 100, 96, 97, 100, 93, 98][i],
      health: [88, 74, 96, 81, 92, 67, 99, 85, 90, 97, 72, 94][i],
      last: pick(lang, ...SUBJECTS[(i * 5) % SUBJECTS.length]),
    })),
  };
}

/** Mocks for one language: respond(pathname, searchParams, body) → JSON, or null if there is no mock. */
export function createDemo(lang = 'en') {
  return {
    respond(pathname) {
      switch (pathname) {
        case '/api/me': return { name: AGENTS[0], role: pick(lang, 'Support lead', 'Líder de soporte'), workspace: ACCOUNT, openTickets: 128 };
        case '/api/dashboard': return dashboard(lang);
        case '/api/tickets': return tickets(lang);
        case '/api/customers': return customers(lang);
        default: return null;   // the capture warns "! no mock: GET /api/..."
      }
    },
  };
}
