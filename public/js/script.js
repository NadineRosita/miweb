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

// Apertura y cierre del menú móvil
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');

  if (!hamburger) return; // La página del escape room no tiene menú

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };

  hamburger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

// Interruptor de modo claro/oscuro con fundido entre temas
function initThemeSwitch() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-switch');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    toggle.setAttribute('aria-checked', String(theme === 'dark'));
    localStorage.setItem('theme', theme);
  };

  toggle.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

    if (document.startViewTransition && !reducedMotion.matches) {
      document.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
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
initMobileMenu();
initThemeSwitch();
initSky();
