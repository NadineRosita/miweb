// Partes comunes de todas las páginas: cursor, fondo, barra de navegación y pie.
// Están aquí para cambiarlas en un solo sitio.
//
// Cada página indica en <body> qué pestaña marcar: data-page="juegos".
// Una subpágina puede marcar la de su sección con data-tab="juegos".

const SITE_NAME = 'NadineRoss';

// Luna menguante junto al nombre, con la misma forma que el favicon
const MOON_ICON = `
  <svg class="moon-icon" viewBox="5 5 38 54" aria-hidden="true">
    <path fill="currentColor" d="M42 7A26 26 0 1 0 42 57 30 30 0 0 1 42 7Z" />
  </svg>
`;

// Pestañas del menú. Sus textos son nav.<id> en i18n.js.
// En sections van los apartados de esa página: id es el de su <section>.
const NAV_LINKS = [
  {
    id: 'inicio',
    href: 'index.html',
    sections: [
      { id: 'proyectos' },
      { id: 'sobre-mi' },
      { id: 'conocimientos' },
      { id: 'contacto' },
    ],
  },
  { id: 'juegos', href: 'juegos.html' },
  { id: 'aplicaciones', href: 'aplicaciones.html' },
  { id: 'mi-pet', href: 'mi-pet.html' },
  { id: 'jaja-que-tonto', href: 'https://youtu.be/xvFZjo5PgG0?si=hXCOP_HBWY98CeIc' },
];

// Redes de la barra superior. Para añadir una, copia la línea con su dirección real.
const SOCIAL_LINKS = [
  { short: 'IG', label: 'Instagram', href: 'https://www.instagram.com/_just.nad/' },
  { short: 'GH', label: 'GitHub', href: 'https://github.com/NadineRosita' },
  { short: 'DC', label: 'Discord', href: 'https://discord.com/users/428102550349414407' },
];

function navLinksHtml(currentPage) {
  return NAV_LINKS.map(({ id, href, sections = [] }) => {
    const isCurrent = id === currentPage;
    const current = isCurrent ? ' aria-current="page"' : '';
    // En la propia página basta el #: con la dirección completa el navegador
    // recargaría la página en vez de desplazarse suavemente
    const base = isCurrent ? '' : href;
    const sectionLinks = sections.map((section) => (
      `<a href="${base}#${section.id}" data-i18n="nav.${section.id}"></a>`
    ));
    const submenu = sectionLinks.length ? `<div class="site-submenu">${sectionLinks.join('')}</div>` : '';

    return `<a href="${href}"${current} data-i18n="nav.${id}"></a>${submenu}`;
  }).join('');
}

// Pestañas siempre visibles en ordenador (sin submenús): que se vea que hay juegos
function inlineNavHtml(currentPage) {
  return NAV_LINKS.map(({ id, href }) => {
    const current = id === currentPage ? ' aria-current="page"' : '';
    return `<a href="${href}"${current} data-i18n="nav.${id}"></a>`;
  }).join('');
}

function headerHtml(currentPage) {
  const links = navLinksHtml(currentPage);
  const socials = SOCIAL_LINKS.map(({ short, label, href }) => (
    `<a href="${href}" class="social-pill" aria-label="${label}" target="_blank" rel="noopener">${short}</a>`
  ));

  return `
    <header class="navbar" id="navbar">
      <button class="hamburger" id="hamburger" type="button" data-i18n-aria="menu.open" aria-expanded="false" aria-controls="site-menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <a href="index.html" class="logo">
        ${MOON_ICON}
        <span class="logo-name">${SITE_NAME}</span>
      </a>

      <nav class="nav-inline" data-i18n-aria="nav.label">${inlineNavHtml(currentPage)}</nav>

      <div class="nav-actions">
        <div class="nav-socials">${socials.join('')}</div>
        <button class="social-pill lang-switch" id="lang-switch" type="button" data-i18n="lang.button" data-i18n-aria="lang.label"></button>
        ${themeSwitchHtml()}
      </div>
    </header>

    <div class="site-menu" id="site-menu">
      <nav data-i18n-aria="nav.label">${links}</nav>
    </div>
  `;
}

function themeSwitchHtml() {
  return `
    <button class="theme-switch" id="theme-switch" type="button" role="switch" data-i18n-aria="theme.label" aria-checked="false">
      <span class="theme-switch-thumb">
        <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
        </svg>
        <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
    </button>
  `;
}

function footerHtml() {
  return `
    <footer class="footer">
      <div class="footer-row">
        <span class="footer-name">${MOON_ICON} ${SITE_NAME}</span>
        <span class="footer-copy">© ${new Date().getFullYear()} — <span data-i18n="footer.rights"></span></span>
        <a href="#top" class="footer-top" data-i18n="footer.top"></a>
      </div>
      <div class="footer-deco" aria-hidden="true">${SITE_NAME}</div>
    </footer>
  `;
}

function renderLayout() {
  const { page, tab = page } = document.body.dataset;

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="cursor-dot" aria-hidden="true"></div>
    <div class="cursor-ring" aria-hidden="true"></div>
    <div class="sky" id="sky" aria-hidden="true"></div>
    ${headerHtml(tab)}
  `);
  document.body.insertAdjacentHTML('beforeend', footerHtml());
  i18n.apply();
}

// Mascota flotante: solo para quien ya juega, y nunca dentro del propio juego
function loadPetWidget() {
  if (document.body.dataset.page === 'mi-pet' || localStorage.getItem('mipet-widget') !== '1') return;

  import('./mi-pet/widget.js').catch(() => {});
}

renderLayout();
loadPetWidget();
