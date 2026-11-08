// La luna de Inicio.
//
// La página es una noche de observación: arriba está en luna nueva y llega a
// luna llena en Contacto. La luna grande del fondo cambia de fase con el scroll
// y la barra de fases sirve a la vez de índice y de «estás aquí».
//
// También calcula la fase real de hoy para la frase de la presentación.

const Luna = (() => {
  const SYNODIC_DAYS = 29.530588853;
  // Una luna nueva conocida: 6 de enero de 2000, 18:14 UTC
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  // La página no empieza en negro total: un hilo de luz para que se vea la luna
  const FIRST_PHASE = 0.04;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Dibujo ----------
  // phase va de 0 (nueva) a 1 (llena), siempre creciendo: la luz entra por la derecha.
  // La parte iluminada es medio círculo más media elipse (el terminador).
  function litPath(phase, r) {
    const angle = Math.PI * Math.min(Math.max(phase, 0), 1);
    const rx = Math.abs(Math.cos(angle)) * r;
    const sweep = angle < Math.PI / 2 ? 0 : 1;
    if (phase <= 0.001) return '';
    return `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} 0 ${-r}Z`;
  }

  // Cráteres: posición y radio relativos al radio de la luna
  // Mares: manchas grandes y suaves, como las que se ven a simple vista
  const MARIA = [
    [0.22, -0.3, 0.3, 0.22], [-0.25, -0.22, 0.26, 0.3], [0.32, 0.18, 0.22, 0.16],
    [-0.05, 0.32, 0.2, 0.14], [-0.42, 0.22, 0.14, 0.2],
  ];
  // Cráteres pequeños
  const CRATERS = [
    [0.12, 0.6, 0.06], [-0.18, -0.62, 0.045], [0.55, -0.35, 0.04], [-0.6, -0.05, 0.035], [0.4, 0.5, 0.03],
  ];

  function moonSvg({ r = 100, withCraters = true, className = '' } = {}) {
    const id = `luz-${Math.random().toString(36).slice(2, 8)}`;
    const surface = withCraters ? `
      ${MARIA.map(([x, y, rx, ry]) => `<ellipse cx="${x * r}" cy="${y * r}" rx="${rx * r}" ry="${ry * r}" />`).join('')}
      ${CRATERS.map(([x, y, cr]) => `<circle cx="${x * r}" cy="${y * r}" r="${cr * r}" />`).join('')}
    ` : '';

    // La superficie se ve en la parte iluminada y, muy tenue, en la sombra (luz cenicienta)
    return `
      <svg class="${className}" viewBox="${-r} ${-r} ${2 * r} ${2 * r}" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="${id}"><path class="luna-luz-clip" d="" /></clipPath>
          <radialGradient id="${id}-volumen" cx="0.42" cy="0.4" r="0.62">
            <stop offset="0.55" stop-color="#000" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity="0.16" />
          </radialGradient>
          <filter id="${id}-suave"><feGaussianBlur stdDeviation="${r * 0.035}" /></filter>
        </defs>
        <circle class="luna-sombra" r="${r - 0.5}" />
        <g class="luna-ceniza" filter="url(#${id}-suave)">${surface}</g>
        <path class="luna-luz" d="" />
        <g clip-path="url(#${id})">
          <g class="luna-crateres" filter="url(#${id}-suave)">${surface}</g>
          ${withCraters ? `<circle r="${r}" fill="url(#${id}-volumen)" />` : ''}
        </g>
        <circle class="luna-borde" r="${r - 0.5}" />
      </svg>
    `;
  }

  function setPhase(svg, phase) {
    const r = -svg.viewBox.baseVal.x;
    const d = litPath(phase, r);
    svg.querySelector('.luna-luz').setAttribute('d', d);
    svg.querySelector('.luna-luz-clip').setAttribute('d', d);
  }

  // ---------- La luna real de hoy ----------
  function today(date = new Date()) {
    const age = (((date - KNOWN_NEW_MOON) / 86400000) % SYNODIC_DAYS + SYNODIC_DAYS) % SYNODIC_DAYS;
    const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_DAYS)) / 2;
    // Ocho nombres, cada uno centrado en su momento del ciclo
    const index = Math.round((age / SYNODIC_DAYS) * 8) % 8;
    return { illumination, index };
  }

  const PHASE_NAMES = {
    es: ['nueva', 'creciente', 'en cuarto creciente', 'gibosa creciente',
      'llena', 'gibosa menguante', 'en cuarto menguante', 'menguante'],
    en: ['new', 'a waxing crescent', 'first quarter', 'waxing gibbous',
      'full', 'waning gibbous', 'last quarter', 'a waning crescent'],
  };

  function todayText(template, lang) {
    const { illumination, index } = today();
    return template
      .replace('{fase}', PHASE_NAMES[lang][index])
      .replace('{porcentaje}', Math.round(illumination * 100));
  }

  // ---------- Scroll ----------
  // Cada sección es una fase clara: nueva, creciente, cuarto, gibosa y llena.
  // Entre una sección y la siguiente la luna crece poco a poco.
  function initScroll({ moon, rail, sections }) {
    let shown = reducedMotion() ? null : 0; // La primera vez sale de luna nueva
    let anchors = [];
    let target = FIRST_PHASE;
    let frame = 0;

    const sectionPhase = (index) => (
      sections.length > 1 ? FIRST_PHASE + ((1 - FIRST_PHASE) * index) / (sections.length - 1) : 1
    );

    // Dónde «empieza» cada sección al hacer scroll; la última, al final de la página
    const measure = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      anchors = sections.map((section, index) => {
        if (index === 0) return 0;
        if (index === sections.length - 1) return max;
        const top = section.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
        return Math.min(Math.max(top, 0), max);
      });
    };

    const phaseAt = (y) => {
      for (let i = anchors.length - 1; i > 0; i -= 1) {
        if (y >= anchors[i - 1]) {
          const span = anchors[i] - anchors[i - 1] || 1;
          const t = Math.min(Math.max((y - anchors[i - 1]) / span, 0), 1);
          return sectionPhase(i - 1) + (sectionPhase(i) - sectionPhase(i - 1)) * t;
        }
      }
      return FIRST_PHASE;
    };

    // Las lunitas del índice muestran la fase que tendrá la grande al llegar
    const drawRail = () => {
      rail.querySelectorAll('[data-section]').forEach((link, index) => {
        setPhase(link.querySelector('svg'), sectionPhase(index));
      });
    };

    const markCurrent = () => {
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = sections[0];

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      if (atBottom) current = sections[sections.length - 1];

      rail.querySelectorAll('[data-section]').forEach((link) => {
        if (link.dataset.section === current.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      rail.style.setProperty('--fill', (target - FIRST_PHASE) / (1 - FIRST_PHASE));
    };

    // La luna grande se acerca a su fase con suavidad en vez de saltar
    const animate = () => {
      if (shown === null) {
        setPhase(moon, target);
        moon.style.setProperty('--luz', target);
        frame = 0;
        return;
      }
      shown += (target - shown) * 0.1;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      setPhase(moon, shown);
      moon.style.setProperty('--luz', shown);
      frame = shown === target ? 0 : requestAnimationFrame(animate);
    };

    const update = () => {
      target = phaseAt(window.scrollY);
      markCurrent();
      if (!frame) frame = requestAnimationFrame(animate);
    };

    const redraw = () => {
      measure();
      drawRail();
      update();
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', redraw);
    // Las letras cambian la altura de las secciones al cargar
    if (document.fonts) document.fonts.ready.then(redraw);
    redraw();

    return { redraw };
  }

  return { moonSvg, setPhase, todayText, initScroll };
})();
