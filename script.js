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

initCursor();
initNavbar();
initMobileMenu();
