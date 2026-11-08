// Cursor personalizado
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const root = document.documentElement;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = reducedMotion ? 1 : 0.12;

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  const place = (el, x, y) => {
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  root.classList.add('has-custom-cursor');

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // En el primer movimiento el círculo aparece ya junto al punto
    if (!root.classList.contains('cursor-visible')) {
      ringX = mouseX;
      ringY = mouseY;
      root.classList.add('cursor-visible');
    }

    place(dot, mouseX, mouseY);
  });

  root.addEventListener('mouseleave', () => root.classList.remove('cursor-visible'));

  document.addEventListener('mouseover', (e) => {
    root.classList.toggle('cursor-hover', Boolean(e.target.closest('a, button')));
  });

  const animateRing = () => {
    ringX += (mouseX - ringX) * lerp;
    ringY += (mouseY - ringY) * lerp;
    place(ring, ringX, ringY);
    requestAnimationFrame(animateRing);
  };

  animateRing();
}

// Efecto .scrolled de la navbar
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const update = () => navbar.classList.toggle('scrolled', window.scrollY > 60);

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// Menú de pestañas: en ordenador se despliega al acercar el ratón a las tres rayitas
// o al borde izquierdo; en móvil y tableta, al pulsarlas
function initMenu() {
  const NEAR_EDGE_PX = 28;
  const NEAR_BUTTON_X_PX = 130;
  const NEAR_BUTTON_Y_PX = 90;

  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('site-menu');
  const hoverMode = window.matchMedia('(min-width: 1001px) and (hover: hover)');
  // El panel que se abría al acercar el ratón al borde queda apagado: en ordenador
  // las pestañas ya se ven en la barra. Cambia a true para recuperarlo.
  const EDGE_MENU = false;

  const isOpen = () => menu.classList.contains('open');

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.dataset.i18nAria = open ? 'menu.close' : 'menu.open';
    hamburger.setAttribute('aria-label', i18n.t(hamburger.dataset.i18nAria));
  };

  hamburger.addEventListener('click', (event) => {
    // Con ratón ya está abierto al llegar al botón. Un clic de teclado tiene detail 0.
    if (EDGE_MENU && hoverMode.matches && event.detail > 0) return;

    setOpen(!isOpen());

    // Con teclado, el foco salta a las pestañas en vez de recorrer antes la barra
    if (isOpen() && event.detail === 0) menu.querySelector('a').focus();
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('mousemove', (event) => {
    if (!EDGE_MENU || !hoverMode.matches) return;

    const { clientX: x, clientY: y } = event;
    const nearButton = x < NEAR_BUTTON_X_PX && y < NEAR_BUTTON_Y_PX;

    if (x < NEAR_EDGE_PX || nearButton) {
      setOpen(true);
    } else if (isOpen() && x > menu.offsetWidth) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      hamburger.focus();
    }
  });
}

// Aplica un cambio visual con fundido, salvo que se prefiera reducir el movimiento
function withFade(update) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (document.startViewTransition && !reducedMotion) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

// Interruptor de modo claro/oscuro con fundido entre temas
function initThemeSwitch() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-switch');

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    toggle.setAttribute('aria-checked', String(theme === 'dark'));
    localStorage.setItem('theme', theme);
  };

  toggle.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    withFade(() => setTheme(next));
  });
}

// Botón para cambiar entre español e inglés
function initLanguageSwitch() {
  document.getElementById('lang-switch').addEventListener('click', () => {
    const next = i18n.lang === 'es' ? 'en' : 'es';
    withFade(() => i18n.setLanguage(next));
  });
}

// Sol de día o luna de noche, que aparece en el fondo al hacer scroll
function initSky() {
  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 20;
  const REVEAL_VIEWPORTS = 0.6; // Pantallas de scroll hasta que se ve del todo

  const SUN = `
    <svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="46" fill="currentColor" />
      <path d="M100 12v28M100 160v28M12 100h28M160 100h28M38 38l20 20M142 142l20 20M38 162l20-20M142 58l20-20"
        stroke="currentColor" stroke-width="10" stroke-linecap="round" />
    </svg>
  `;
  const MOON = `
    <svg viewBox="0 0 64 64">
      <path fill="currentColor" d="M42 7A26 26 0 1 0 42 57 30 30 0 0 1 42 7Z" />
    </svg>
  `;

  const sky = document.getElementById('sky');
  const hour = new Date().getHours();
  const isDay = hour >= DAY_START_HOUR && hour < DAY_END_HOUR;

  sky.innerHTML = isDay ? SUN : MOON;
  sky.classList.add(isDay ? 'sky-sun' : 'sky-moon');

  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    // En páginas cortas se revela con el scroll disponible
    const revealDistance = Math.min(window.innerHeight * REVEAL_VIEWPORTS, maxScroll) || 1;
    const progress = Math.min(window.scrollY / revealDistance, 1);

    sky.style.setProperty('--sky-progress', progress);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

initCursor();
initNavbar();
initMenu();
initThemeSwitch();
initLanguageSwitch();
initSky();
