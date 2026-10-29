// How the product is built, served and branded for the capture. Adjust per product.
// The defaults capture examples/acme-desk (the demo app of this repo). See skills/pv-capture/SKILL.md.

export const CONFIG = {
  // Demo hostname (resolved to 127.0.0.1) so the app doesn't think it runs on localhost.
  host: 'app.demo.test',
  // Capture viewport. deviceScaleFactor 2 = 3840×2160 PNGs.
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  // Video language → browser locale (dates and numbers as your users see them) and LANG env.
  locales: { en: { lang: 'en-US', env: 'en_US.UTF-8' }, es: { lang: 'es-AR', env: 'es_AR.UTF-8' } },
  timezone: 'America/New_York',
  // Build the frontend into a static folder (receives the destination folder; runs at the product root).
  // Vite: (out) => ['npx', 'vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'warn']
  // The demo app is plain static files, so "building" is copying app/.
  buildCmd: (out) => ['sh', '-c', `rm -rf "${out}" && mkdir -p "${out}" && cp -R app/. "${out}"`],
  // Prefix of the API routes that are intercepted and mocked with demo-data.mjs.
  apiPrefix: '/api/',
  // How to open a shot's route (hash router: `#/${route}`; history router: `/${route}`).
  routeUrl: (base, route) => (route ? `${base}/#/${route}` : `${base}/`),
  // What goes into localStorage/sessionStorage before the page loads (language, demo session, UI state).
  storage: (lang, loggedIn) => ({
    local: { 'acme.lang': lang },
    session: loggedIn ? { 'acme.token': 'demo-token' } : {},
  }),
  // Login endpoint, answered separately so the frontend believes it signed in.
  loginPath: '/api/login',
  loginBody: () => ({ token: 'demo-token' }),
  // CSS injected into every capture (loading overlays, blinking caret).
  css: '*{caret-color:transparent!important}',
  // Measured on every signed-in shot, for PV.navIntro: the sidebar and the last menu item.
  sidebar: '.sidebar',
  navEnd: '.nav .nav-item:last-of-type',
  brand: {
    // The product CSS whose first :root block holds its tokens (null = use lib/theme.css only).
    styleCss: 'app/style.css',
    // Video token → product token (or any CSS value). Unmapped tokens keep lib/theme.css defaults.
    map: {
      ground: 'var(--bg)', popover: 'var(--surface-2)', 'on-accent': 'var(--on-accent)',
      action: 'var(--accent)', brand: 'var(--brand)', data: 'var(--info)', special: 'var(--chat)', danger: 'var(--danger)',
    },
    // The product logo (SVG or PNG). Written as assets/brand/logo.png (SVG is rasterized).
    logo: 'app/logo.svg',
  },
  // Shots also captured from an earlier version (--legacy-ref <commit>), for a before/after.
  legacyIds: ['dashboard'],
};
