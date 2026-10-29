/* On-screen copy per language. Same keys in every language; PV.t(key) returns the active
 * language's text and falls back to `fallback` when a key is missing. Section names are the
 * product's own (what the viewer reads on screen matches what they see in the capture).
 * Acme Desk is fictional; so is every name and number on screen (see ../../README.md). */
window.PV_I18N = {
  // Product URL (same in every language, without https://).
  url: 'acme-desk.example',
  // Video languages → number/date locale. render.mjs renders one video per language listed here.
  locales: { en: 'en-US', es: 'es-AR' },
  fallback: 'en',
  en: {
    'hook.your': 'Your',
    'hook.tokens': ['tickets', 'customers', 'replies', 'metrics'],
    'hook.intro1': 'Introducing',
    'hook.intro2': 'the new',
    'hook.product': 'Acme Desk',
    'new': 'New',
    'soonTag': 'Coming soon',

    'dash.title': 'Dashboard',
    'dash.caps': ['Live numbers', 'Day by day', 'Channel by channel'],
    'dash.kpis': ['Solved this week', 'First reply', 'Satisfaction'],
    'dash.units': ['', ' min', '%'],

    'tk.title': 'Tickets',
    'tk.caps': ['Every ticket', 'At a glance', 'Solved in a click'],

    'end.line1': 'Every ticket,',
    'end.line2': 'one desk.',
  },
  es: {
    'hook.your': 'Tus',
    'hook.tokens': ['tickets', 'clientes', 'respuestas', 'métricas'],
    'hook.intro1': 'Presentamos',
    'hook.intro2': 'el nuevo',
    'hook.product': 'Acme Desk',
    'new': 'Nuevo',
    'soonTag': 'Próximamente',

    'dash.title': 'Panel',
    'dash.caps': ['Números en vivo', 'Día por día', 'Canal por canal'],
    'dash.kpis': ['Resueltos esta semana', 'Primera respuesta', 'Satisfacción'],
    'dash.units': ['', ' min', ' %'],

    'tk.title': 'Tickets',
    'tk.caps': ['Cada ticket', 'De un vistazo', 'Resuelto en un clic'],

    'end.line1': 'Cada ticket,',
    'end.line2': 'un solo lugar.',
  },
};
