// Sonidos sintetizados con Web Audio: no hay archivos que descargar.
// El contexto de audio solo se crea tras un gesto del jugador, como exigen los navegadores.

// Cada sonido es una lista de notas: [frecuencia, duración en s, retardo en s, tipo de onda]
const SOUNDS = {
  click: [[520, 0.05, 0, 'square']],
  coin: [[880, 0.07, 0, 'square'], [1320, 0.12, 0.07, 'square']],
  buy: [[660, 0.08, 0, 'triangle'], [880, 0.08, 0.08, 'triangle'], [1100, 0.12, 0.16, 'triangle']],
  eat: [[220, 0.06, 0, 'square'], [180, 0.06, 0.1, 'square'], [240, 0.06, 0.2, 'square']],
  evolve: [[330, 0.14, 0, 'triangle'], [440, 0.14, 0.14, 'triangle'], [660, 0.14, 0.28, 'triangle'], [880, 0.3, 0.42, 'triangle']],
  achievement: [[523, 0.1, 0, 'square'], [659, 0.1, 0.1, 'square'], [784, 0.1, 0.2, 'square'], [1047, 0.24, 0.3, 'square']],
  level: [[392, 0.1, 0, 'square'], [523, 0.1, 0.1, 'square'], [784, 0.22, 0.2, 'square']],
  game: [[660, 0.05, 0, 'square']],
  win: [[523, 0.09, 0, 'triangle'], [784, 0.09, 0.09, 'triangle'], [1047, 0.2, 0.18, 'triangle']],
  lose: [[300, 0.14, 0, 'sawtooth'], [220, 0.2, 0.14, 'sawtooth']],
  pet: [[700, 0.06, 0, 'sine'], [900, 0.08, 0.06, 'sine']],
  error: [[160, 0.14, 0, 'square']],
};

// Melodía de fondo, muy discreta y en bucle
const MELODY = [392, 0, 494, 523, 0, 494, 392, 0, 330, 0, 392, 440, 0, 392, 330, 0];
const BASS = [131, 165, 110, 147];
const STEP_SECONDS = 0.32;

let context = null;
let master = null;
let settings = { volume: 0.5, muted: false, music: false };
let musicTimer = null;
let step = 0;

function ensureContext() {
  if (context) return true;

  const AudioEngine = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioEngine) return false;

  context = new AudioEngine();
  master = context.createGain();
  master.connect(context.destination);
  applyVolume();
  return true;
}

function applyVolume() {
  if (master) master.gain.value = settings.muted ? 0 : settings.volume * 0.35;
}

function note(frequency, duration, delay, wave, level = 1) {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(level, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function playSound(name) {
  if (settings.muted || !ensureContext()) return;
  if (context.state === 'suspended') context.resume();

  (SOUNDS[name] ?? SOUNDS.click).forEach(([frequency, duration, delay, wave]) => note(frequency, duration, delay, wave, 0.5));
}

function musicStep() {
  if (document.hidden) return;

  const frequency = MELODY[step % MELODY.length];

  if (frequency) note(frequency, STEP_SECONDS * 0.8, 0, 'triangle', 0.16);
  if (step % 4 === 0) note(BASS[(step / 4) % BASS.length], STEP_SECONDS * 2.4, 0, 'sine', 0.2);
  step += 1;
}

function syncMusic() {
  const shouldPlay = settings.music && !settings.muted && context;

  if (shouldPlay && !musicTimer) {
    musicTimer = setInterval(musicStep, STEP_SECONDS * 1000);
  } else if (!shouldPlay && musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// Aplica los ajustes guardados. La música no arranca hasta que el jugador haya pulsado algo.
export function configureSound(next) {
  settings = { ...settings, ...next };
  applyVolume();
  syncMusic();
}

export function unlockAudio() {
  if (ensureContext() && context.state === 'suspended') context.resume();
  syncMusic();
}

export function stopAudio() {
  settings = { ...settings, music: false };
  syncMusic();
}
