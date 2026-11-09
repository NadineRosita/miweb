// La puerta a los poemas: una palabra de Inicio que hay que MANTENER pulsada.
//
// En contenido-inicio.js, lo que va entre llaves en un texto es la puerta:
//   '{Escribo}, observo la luna…'
// Aquí se convierte ese fragmento en la palabra con su mancha de tinta.
//
// Se mantiene 1,2 s con ratón, con el dedo o con Espacio / Intro. Mientras tanto la
// tinta se extiende desde la palabra (esa es la guía); si se suelta antes, se recoge.
// Al completarse cubre la pantalla con var(--noche) y se abre poemas.html.

const Puerta = (() => {
  const DESTINO = 'poemas.html';
  const HOLD_MS = 1200;
  const RETRACT_SPEED = 3; // recoger la tinta es más rápido que extenderla
  const FADE_MS = 280; // el fundido simple cuando se piden menos movimientos
  const KEYS = new Set([' ', 'Enter']);

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createDoor(word) {
    const door = document.createElement('span');
    door.className = 'puerta';
    door.textContent = word;
    door.tabIndex = 0;
    door.setAttribute('role', 'button');
    door.setAttribute('aria-label', i18n.t('poemas.puerta'));
    // En el móvil, la pulsación larga no debe seleccionar texto ni abrir el menú del navegador
    door.addEventListener('contextmenu', (event) => event.preventDefault());
    attachHold(door);
    return door;
  }

  // Cubre la pantalla con la noche: un círculo de tinta que crece desde la palabra,
  // o, sin movimiento, una capa que se funde.
  function createInk(door) {
    const rects = door.getClientRects();
    const rect = rects[rects.length - 1] ?? door.getBoundingClientRect();
    const x = rect.right;
    const y = rect.top + rect.height / 2;
    const ink = document.createElement('div');
    ink.className = 'tinta-puerta';
    ink.setAttribute('aria-hidden', 'true');

    if (reducedMotion()) {
      ink.classList.add('tinta-puerta-fundido');
      document.body.append(ink);
      return { ink, frames: [{ opacity: 0 }, { opacity: 1 }], duration: FADE_MS };
    }

    // El radio llega a la esquina más lejana: al final no queda nada sin cubrir
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    ink.style.cssText = `left:${x}px;top:${y}px;width:${radius * 2}px;height:${radius * 2}px;margin:${-radius}px 0 0 ${-radius}px;`;
    document.body.append(ink);
    return { ink, frames: [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], duration: HOLD_MS };
  }

  function attachHold(door) {
    let holding = null; // { ink, animation, source }
    let done = false;

    function begin(source) {
      if (done || holding) return;

      const { ink, frames, duration } = createInk(door);
      const animation = ink.animate(frames, { duration, easing: 'ease-in', fill: 'both' });
      const fadeOnly = reducedMotion();

      holding = { ink, animation, source };
      door.classList.add('puerta-pulsada');

      // Sin tinta que guíe, el fundido empieza solo al cumplirse el tiempo pulsado
      const timer = fadeOnly ? setTimeout(() => finish(), HOLD_MS) : null;
      holding.timer = timer;

      animation.onfinish = () => {
        if (animation.playbackRate > 0) {
          if (!fadeOnly) finish();
        } else {
          ink.remove();
        }
      };
      if (fadeOnly) animation.pause();
    }

    function finish() {
      if (!holding || done) return;

      done = true;
      const { animation } = holding;
      holding.timer = null;
      if (animation.playState === 'paused') {
        animation.onfinish = () => open();
        animation.play();
      } else {
        open();
      }
    }

    function open() {
      window.location.href = DESTINO;
    }

    function release() {
      if (!holding || done) return;

      const { ink, animation, timer } = holding;
      clearTimeout(timer);
      holding = null;
      door.classList.remove('puerta-pulsada');

      // Soltar antes de tiempo: la tinta se recoge y no pasa nada
      if (animation.playState === 'paused' || animation.currentTime === 0) {
        ink.remove();
        return;
      }
      animation.updatePlaybackRate(-RETRACT_SPEED);
    }

    door.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary) return;

      // Con el puntero capturado, soltar fuera de la palabra también cuenta
      door.setPointerCapture?.(event.pointerId);
      begin('pointer');
    });
    door.addEventListener('pointerup', release);
    door.addEventListener('pointercancel', release);
    door.addEventListener('lostpointercapture', release);

    door.addEventListener('keydown', (event) => {
      if (!KEYS.has(event.key)) return;

      event.preventDefault(); // Espacio no debe desplazar la página
      if (!event.repeat) begin('key');
    });
    door.addEventListener('keyup', (event) => {
      if (KEYS.has(event.key) && holding?.source === 'key') release();
    });
    door.addEventListener('blur', release);

    // Al volver con «atrás» la página puede reaparecer con la tinta puesta
    door.addEventListener('reiniciar', () => {
      document.querySelectorAll('.tinta-puerta').forEach((ink) => ink.remove());
      holding = null;
      done = false;
      door.classList.remove('puerta-pulsada');
    });
  }

  // Convierte un texto con {puertas} en nodos: texto suelto y la palabra con su mancha
  function nodes(text) {
    return text.split(/\{([^{}]+)\}/).map((part, index) => (index % 2 ? createDoor(part) : part)).filter(Boolean);
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.querySelectorAll('.puerta').forEach((door) => door.dispatchEvent(new Event('reiniciar')));
  });

  return { nodes };
})();
