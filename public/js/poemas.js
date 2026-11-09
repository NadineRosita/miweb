// Página de poemas: la lista y cada poema, a partir de /api/poemas.
// El poema abierto va en la dirección (poemas.html#identificador).
// Todo lo que viene del servidor se inserta con textContent, nunca como HTML.
// Los poemas se muestran tal como están escritos: la interfaz se traduce, ellos no.

const root = document.getElementById('poemas');

// Pasos para ignorar respuestas viejas si se cambia de vista mientras carga
let view = 0;
let list = null;

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function link(href, text, className) {
  const anchor = el('a', className, text);
  anchor.href = href;
  return anchor;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(i18n.lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function dateElement(date, className) {
  const time = el('time', `poemas-fecha ${className ?? ''}`.trim(), formatDate(date));
  time.dateTime = date;
  return time;
}

async function request(path) {
  let response;
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('connection');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'server_error');
  return body;
}

async function loadList() {
  list = await request('/api/poemas');
  return list;
}

// Cambia lo que se ve y lleva la vista y el foco al principio
function show(title, ...content) {
  root.replaceChildren(title, ...content);
  window.scrollTo(0, 0);
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

function showMessage(text) {
  root.replaceChildren(el('p', 'poemas-aviso', text));
}

function showError(code, retry) {
  const known = ['connection', 'poemas_unavailable', 'poem_not_found'];
  const key = known.includes(code) ? code : 'server_error';
  const box = el('div', 'poemas-error');
  const button = el('button', 'boton', i18n.t('poemas.retry'));

  button.type = 'button';
  button.addEventListener('click', retry);
  box.append(el('p', '', i18n.t(`error.${key}`)), button);

  root.replaceChildren(
    el('h1', 'poemas-titulo', i18n.t('poemas.title')),
    box,
  );
  document.title = i18n.t('title.poemas');
}

// ---------- Lista ----------
async function showList() {
  const step = ++view;
  document.title = i18n.t('title.poemas');
  showMessage(i18n.t('poemas.loading'));

  try {
    await loadList();
  } catch (error) {
    if (step === view) showError(error.message, route);
    return;
  }
  if (step !== view) return;

  const title = el('h1', 'poemas-titulo', i18n.t('poemas.title'));
  if (!list.length) {
    show(title, el('p', 'poemas-aviso', i18n.t('poemas.empty')));
    return;
  }

  const items = el('ul', 'poemas-lista');
  list.forEach(({ id, titulo, fecha }) => {
    const row = el('li');
    const anchor = link(`#${id}`);
    anchor.append(el('span', 'poemas-lista-titulo', titulo), dateElement(fecha));
    row.append(anchor);
    items.append(row);
  });
  show(title, items);
}

// ---------- Un poema ----------
function renderPoem(poem) {
  // La lista va de más reciente a más antiguo: el anterior es el que se escribió antes
  const index = list ? list.findIndex((item) => item.id === poem.id) : -1;
  const older = index >= 0 ? list[index + 1] : null;
  const newer = index > 0 ? list[index - 1] : null;
  const footer = el('nav', 'poema-pie');

  footer.setAttribute('aria-label', i18n.t('poemas.nav'));
  if (older) footer.append(link(`#${older.id}`, i18n.t('poemas.prev')));
  if (newer) footer.append(link(`#${newer.id}`, i18n.t('poemas.next')));
  footer.append(link('#', i18n.t('poemas.all'), 'poema-pie-todos'));

  document.title = `${poem.titulo} — NadineRoss`;
  show(
    el('h1', 'poema-titulo', poem.titulo),
    dateElement(poem.fecha, 'poema-fecha'),
    el('div', 'poema-texto', poem.texto),
    footer,
  );
}

async function showPoem(id) {
  const step = ++view;
  showMessage(i18n.t('poemas.loading'));

  try {
    // La lista sirve para el anterior y el siguiente; si falla, el poema se lee igual
    const [poem] = await Promise.all([
      request(`/api/poemas/${encodeURIComponent(id)}`),
      list ? null : loadList().catch(() => {}),
    ]);
    if (step === view) renderPoem(poem);
  } catch (error) {
    if (step === view) showError(error.message === 'invalid_request' ? 'poem_not_found' : error.message, route);
  }
}

function route() {
  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // una dirección mal escrita: se pide tal cual y el servidor la rechaza
  }
  if (id) {
    showPoem(id);
  } else {
    showList();
  }
}

window.addEventListener('hashchange', route);
i18n.onChange(route);
route();
