// Escape room de "jaja, que tonto": hasta resolver todos los acertijos
// no aparece el enlace de vuelta a Inicio.
//
// Para ampliarlo, añade bloques a ACERTIJOS. Estos tres son de ejemplo.
// Las respuestas son visibles en el código del navegador: sirven para un juego
// como este, pero no para proteger nada de verdad.

const ACERTIJOS = [
  {
    pregunta: 'Tengo agujas, pero no sé coser. ¿Qué soy?',
    respuestas: ['reloj'],
    pista: 'Me miras cuando llegas tarde.',
  },
  {
    pregunta: 'Cuanto más me quitas, más grande me hago. ¿Qué soy?',
    respuestas: ['agujero', 'hoyo'],
    pista: 'Se hace con una pala.',
  },
  {
    pregunta: 'Te sigo a todas partes, pero desaparezco en la oscuridad. ¿Qué soy?',
    respuestas: ['sombra'],
    pista: 'Necesito luz para existir.',
  },
];

// Ignora mayúsculas, tildes, espacios sobrantes y un artículo inicial
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/^(el|la|un|una)\s+/, '');
}

function initEscapeRoom() {
  const form = document.getElementById('riddle-form');
  const input = document.getElementById('riddle-answer');
  const question = document.getElementById('riddle-question');
  const progress = document.getElementById('riddle-progress');
  const feedback = document.getElementById('riddle-feedback');
  const hintButton = document.getElementById('riddle-hint');
  const exit = document.getElementById('riddle-exit');

  let current = 0;

  const showRiddle = () => {
    progress.textContent = `Acertijo ${current + 1} de ${ACERTIJOS.length}`;
    question.textContent = ACERTIJOS[current].pregunta;
    feedback.textContent = '';
    form.reset();
    input.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!ACERTIJOS[current].respuestas.includes(normalize(input.value))) {
      feedback.textContent = 'jaja, que tonto. Prueba otra vez.';
      return;
    }

    current += 1;

    if (current < ACERTIJOS.length) {
      showRiddle();
    } else {
      form.hidden = true;
      question.hidden = true;
      progress.hidden = true;
      feedback.textContent = '';
      exit.hidden = false;
    }
  });

  hintButton.addEventListener('click', () => {
    feedback.textContent = `Pista: ${ACERTIJOS[current].pista}`;
  });

  showRiddle();
}

initEscapeRoom();
