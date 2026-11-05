// Partes comunes de todas las páginas: cursor, fondo, barra de navegación y pie.
// Están aquí para cambiarlas en un solo sitio.
//
// Cada página indica en <body> qué pestaña marcar: data-page="juegos".

const SITE_NAME = 'NadineRoss';

// Luna menguante junto al nombre, con la misma forma que el favicon
const MOON_ICON = `
  <svg class="moon-icon" viewBox="5 5 38 54" aria-hidden="true">
    <path fill="currentColor" d="M42 7A26 26 0 1 0 42 57 30 30 0 0 1 42 7Z" />
  </svg>
`;

// Pestañas del menú. En sections van los apartados de esa página:
// id es el id de la <section> a la que se desplaza.
const NAV_LINKS = [
  {
    id: 'inicio',
    label: 'Inicio',
    href: 'index.html',
    sections: [
      { id: 'sobre-mi', label: 'Sobre mí' },
      { id: 'proyectos', label: 'Proyectos' },
      { id: 'contacto', label: 'Contacto' },
    ],
  },
  { id: 'juegos', label: 'Juegos', href: 'juegos.html' },
  { id: 'aplicaciones', label: 'Aplicaciones', href: 'aplicaciones.html' },
  { id: 'mi-pet', label: 'Mi Pet', href: 'mi-pet.html' },
  { id: 'jaja-que-tonto', label: 'jaja, que tonto', href: 'jaja-que-tonto.html' },
];

// Cambia los "#" por las direcciones de tus perfiles
const SOCIAL_LINKS = [
  { short: 'IG', label: 'Instagram', href: '#' },
  { short: 'GH', label: 'GitHub', href: '#' },
];

function navLinksHtml(currentPage) {
  return NAV_LINKS.map(({ id, label, href, sections = [] }) => {
    const isCurrent = id === currentPage;
    const current = isCurrent ? ' aria-current="page"' : '';
    // En la propia página basta el #: con la dirección completa el navegador
    // recargaría la página en vez de desplazarse suavemente
    const base = isCurrent ? '' : href;
    const sectionLinks = sections.map((section) => (
      `<a href="${base}#${section.id}">${section.label}</a>`
    ));
    const submenu = sectionLinks.length ? `<div class="site-submenu">${sectionLinks.join('')}</div>` : '';

    return `<a href="${href}"${current}>${label}</a>${submenu}`;
  }).join('');
}

function headerHtml(currentPage) {
  const links = navLinksHtml(currentPage);
  const socials = SOCIAL_LINKS.map(({ short, label, href }) => (
    `<a href="${href}" class="social-pill" aria-label="${label}">${short}</a>`
  ));

  return `
    <header class="navbar" id="navbar">
      <button class="hamburger" id="hamburger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="site-menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <a href="index.html" class="logo">
        ${MOON_ICON}
        <span class="logo-name">${SITE_NAME}</span>
      </a>

      <div class="nav-actions">
        <div class="nav-socials">${socials.join('')}</div>
        ${themeSwitchHtml()}
      </div>
    </header>

    <div class="site-menu" id="site-menu">
      <nav aria-label="Navegación principal">${links}</nav>
    </div>
  `;
}

function themeSwitchHtml() {
  return `
    <button class="theme-switch" id="theme-switch" type="button" role="switch" aria-label="Modo oscuro" aria-checked="false">
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
        <span class="footer-copy">© ${new Date().getFullYear()} — Todos los derechos reservados</span>
        <a href="#top" class="footer-top">Volver arriba ↑</a>
      </div>
      <div class="footer-deco" aria-hidden="true">${SITE_NAME}</div>
    </footer>
  `;
}

function renderLayout() {
  const { page } = document.body.dataset;

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="cursor-dot" aria-hidden="true"></div>
    <div class="cursor-ring" aria-hidden="true"></div>
    <div class="sky" id="sky" aria-hidden="true"></div>
    ${headerHtml(page)}
  `);
  document.body.insertAdjacentHTML('beforeend', footerHtml());
}

renderLayout();
