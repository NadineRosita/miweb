// Físicas de las piezas sueltas al acabar la partida.
//
// Cogida: la pieza cuelga del punto donde se pulsó, como un péndulo que sigue al puntero
// y se balancea con sus tirones. Soltada: sale lanzada con la velocidad que llevaba,
// rebota en los bordes de la página y se va frenando hasta quedar flotando derecha.

const GRAVITY = 2600; // px/s², solo mientras cuelga
const PIVOT_FOLLOW = 22; // Lo rápido que el punto de agarre alcanza al puntero (1/s)
const HANG_DAMPING = 4.5; // Frena el balanceo mientras cuelga (1/s)
const MAX_ACCEL = 3500; // Limita los tirones para que no se dispare
const AIR_DRAG = 1.1; // Frena la pieza lanzada (1/s)
const SPIN_DAMPING = 5;
const UPRIGHT_SPRING = 14; // Tira de la pieza lanzada hasta enderezarla
const BOUNCE = 0.55;
const MAX_SPEED = 3500;
const MAX_SPIN = 18;
const MIN_HANG_ARM = 0.32; // Mínima distancia del punto de agarre al centro, en tamaños de pieza
const TAU = Math.PI * 2;

const bodies = new Set();
let frame = 0;
let lastTime = 0;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

function draw(body) {
  const half = body.size / 2;

  body.el.style.transform = `translate(${body.cx - half}px, ${body.cy - half}px) rotate(${body.angle}rad)`;
}

export function addBody(el, cx, cy, size) {
  const body = {
    el, cx, cy, size, vx: 0, vy: 0, angle: 0, omega: 0, held: false, moving: false,
  };

  bodies.add(body);
  draw(body);
  return body;
}

export function removeBody(body) {
  bodies.delete(body);
}

function wake() {
  if (frame) return;

  lastTime = performance.now();
  frame = requestAnimationFrame(tick);
}

// Coge la pieza por el punto (clientX, clientY)
export function grab(body, clientX, clientY) {
  const x = clientX + window.scrollX;
  const y = clientY + window.scrollY;
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const dx = x - body.cx;
  const dy = y - body.cy;
  const arm = body.size * MIN_HANG_ARM;

  // Punto de agarre en el marco de la pieza. Siempre queda por encima del centro, para que
  // la pieza cuelgue derecha: colgando del centro o de más abajo se daría la vuelta
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  const ux = Math.min(Math.max(localX, -body.size * 0.35), body.size * 0.35);
  const uy = -Math.min(Math.max(Math.abs(localY), arm), body.size * 0.45);

  body.pivot = { x: ux, y: uy };
  body.px = body.cx + ux * cos - uy * sin;
  body.py = body.cy + ux * sin + uy * cos;
  body.pvx = 0;
  body.pvy = 0;
  body.clientX = clientX;
  body.clientY = clientY;
  body.vx = 0;
  body.vy = 0;
  body.omega = 0;
  body.held = true;
  body.moving = false;
  wake();
}

export function pull(body, clientX, clientY) {
  body.clientX = clientX;
  body.clientY = clientY;
}

// Suelta la pieza: sale lanzada con la velocidad que llevaba
export function release(body) {
  const speed = Math.hypot(body.vx, body.vy);

  if (speed > MAX_SPEED) {
    body.vx *= MAX_SPEED / speed;
    body.vy *= MAX_SPEED / speed;
  }

  body.omega = clamp(body.omega, MAX_SPIN);
  body.held = false;
  body.moving = true;
  wake();
}

function stepHeld(body, dt) {
  const targetX = Math.min(Math.max(body.clientX + window.scrollX, 0), document.documentElement.clientWidth);
  const targetY = Math.min(
    Math.max(body.clientY + window.scrollY, 0),
    Math.max(document.documentElement.scrollHeight, window.innerHeight),
  );
  const follow = 1 - Math.exp(-PIVOT_FOLLOW * dt);
  const nextX = body.px + (targetX - body.px) * follow;
  const nextY = body.py + (targetY - body.py) * follow;
  const velX = (nextX - body.px) / dt;
  const velY = (nextY - body.py) / dt;
  const accelX = clamp((velX - body.pvx) / dt, MAX_ACCEL);
  const accelY = clamp((velY - body.pvy) / dt, MAX_ACCEL);
  const { x: ux, y: uy } = body.pivot;
  const armX = -ux;
  const armY = -uy;
  const previousX = body.cx;
  const previousY = body.cy;

  body.px = nextX;
  body.py = nextY;
  body.pvx = velX;
  body.pvy = velY;

  // Vector del punto de agarre al centro, girado con la pieza
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const rx = armX * cos - armY * sin;
  const ry = armX * sin + armY * cos;

  // Gravedad menos la aceleración del punto de agarre: así se balancea con los tirones
  const forceX = -accelX;
  const forceY = GRAVITY - accelY;
  const inertia = armX * armX + armY * armY + (body.size * body.size) / 6;

  body.omega += ((rx * forceY - ry * forceX) / inertia) * dt;
  body.omega *= Math.exp(-HANG_DAMPING * dt);
  body.angle += body.omega * dt;

  const nextCos = Math.cos(body.angle);
  const nextSin = Math.sin(body.angle);

  body.cx = body.px + armX * nextCos - armY * nextSin;
  body.cy = body.py + armX * nextSin + armY * nextCos;

  // Velocidad del centro, suavizada, para lanzarla al soltar
  body.vx += ((body.cx - previousX) / dt - body.vx) * 0.4;
  body.vy += ((body.cy - previousY) / dt - body.vy) * 0.4;
}

function stepFree(body, dt) {
  const half = body.size / 2;
  const maxX = document.documentElement.clientWidth - half;
  const maxY = Math.max(document.documentElement.scrollHeight, window.innerHeight) - half;
  const drag = Math.exp(-AIR_DRAG * dt);

  body.cx += body.vx * dt;
  body.cy += body.vy * dt;
  body.vx *= drag;
  body.vy *= drag;

  if (body.cx < half || body.cx > maxX) {
    body.cx = Math.min(Math.max(body.cx, half), maxX);
    body.vx *= -BOUNCE;
    body.omega *= 0.8;
  }

  if (body.cy < half || body.cy > maxY) {
    body.cy = Math.min(Math.max(body.cy, half), maxY);
    body.vy *= -BOUNCE;
    body.omega *= 0.8;
  }

  const upright = Math.round(body.angle / TAU) * TAU;

  body.omega += -UPRIGHT_SPRING * (body.angle - upright) * dt;
  body.omega *= Math.exp(-SPIN_DAMPING * dt);
  body.angle += body.omega * dt;

  if (Math.hypot(body.vx, body.vy) < 6 && Math.abs(body.omega) < 0.05 && Math.abs(body.angle - upright) < 0.01) {
    body.vx = 0;
    body.vy = 0;
    body.omega = 0;
    body.angle = 0;
    body.moving = false;
  }
}

function tick(time) {
  const dt = Math.min((time - lastTime) / 1000, 1 / 30) || 1 / 60;
  let active = false;

  lastTime = time;

  bodies.forEach((body) => {
    if (body.held) stepHeld(body, dt);
    else if (body.moving) stepFree(body, dt);
    else return;

    active = true;
    draw(body);
  });

  frame = active ? requestAnimationFrame(tick) : 0;
}
