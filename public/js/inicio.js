// Pinta las secciones de Inicio a partir de contenido-inicio.js.
// Los textos se insertan como texto plano: un carácter como < no rompe el diseño.

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createLink(url, className, text) {
  const link = createElement('a', className, text);
  link.href = url;

  if (url.startsWith('http')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  return link;
}

function fromHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// ---------- Presentación ----------
function renderIntro({ nombre, frase, botonPrincipal, botonSecundario, lunaDeHoy }) {
  const intro = document.getElementById('presentacion');
  const actions = createElement('div', 'acciones');
  const tonight = createElement('p', 'luna-hoy');
  const smallMoon = fromHtml(Luna.moonSvg({ r: 20, withCraters: false, className: 'luna-mini' }));

  actions.append(
    createLink('#proyectos', 'boton boton-luz', botonPrincipal),
    createLink(`mailto:${ENLACES.correo}`, 'boton', botonSecundario),
  );

  // La lunita de la frase es la de verdad, también cuando mengua
  const { illumination, waning } = lunaRealDeHoy();
  Luna.setPhase(smallMoon, Math.acos(1 - 2 * illumination) / Math.PI);
  if (waning) smallMoon.classList.add('luna-menguando');
  tonight.append(smallMoon, createElement('span', '', Luna.todayText(lunaDeHoy, i18n.lang)));

  intro.append(
    createElement('h1', 'nombre', nombre),
    createElement('p', 'entradilla', frase),
    actions,
    tonight,
  );
}

function lunaRealDeHoy() {
  const SYNODIC_DAYS = 29.530588853;
  const age = ((((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  return {
    illumination: (1 - Math.cos((2 * Math.PI * age) / SYNODIC_DAYS)) / 2,
    waning: age > SYNODIC_DAYS / 2,
  };
}

// ---------- Lo que he hecho ----------
function renderStatus(estado, estados) {
  const status = createElement('p', `estado estado-${estado}`);
  status.append(createElement('span', 'estado-punto'), createElement('span', '', estados[estado]));
  return status;
}

function renderStack(etiquetas) {
  const list = createElement('ul', 'pila');
  list.append(...etiquetas.map((tag) => createElement('li', '', tag)));
  return list;
}

function renderObservation(project, texts, featured) {
  const { nombre, estado, descripcion, porDentro, etiquetas, enlace, accion } = project;
  const entry = createElement('article', featured ? 'obs obs-destacada' : 'obs');
  const body = createElement('div', 'obs-cuerpo');

  body.append(
    createElement(featured ? 'h3' : 'h4', 'obs-titulo', nombre),
    createElement('p', 'obs-texto', descripcion),
  );

  if (porDentro) {
    const inside = createElement('p', 'obs-dentro');
    inside.append(createElement('strong', '', `${texts.porDentroTitulo}. `), porDentro);
    body.append(inside);
  }

  body.append(renderStack(etiquetas));
  if (enlace) body.append(createLink(enlace, featured ? 'boton' : 'enlace', accion));

  entry.append(renderStatus(estado, texts.estados), body);
  return entry;
}

function renderProjects(texts) {
  const { titulo, introduccion, lista, otrosTitulo } = texts;
  const featured = createElement('div', 'obs-lista obs-lista-destacada');
  const others = createElement('div', 'obs-lista');

  lista.forEach((project) => {
    (project.destacado ? featured : others).append(renderObservation(project, texts, project.destacado));
  });

  document.getElementById('proyectos').append(
    createElement('h2', 'titulo-seccion', titulo),
    createElement('p', 'texto-seccion', introduccion),
    featured,
    createElement('h3', 'subtitulo', otrosTitulo),
    others,
  );
}

// ---------- Sobre mí ----------
function renderAbout({ titulo, parrafos, notas }) {
  const notes = createElement('dl', 'notas');

  notas.forEach(({ dato, valor }) => {
    const row = createElement('div', 'nota');
    row.append(createElement('dt', '', dato), createElement('dd', '', valor));
    notes.append(row);
  });

  document.getElementById('sobre-mi').append(
    createElement('h2', 'titulo-seccion', titulo),
    ...parrafos.map((text) => createElement('p', 'texto-seccion', text)),
    notes,
  );
}

// ---------- Herramientas ----------
function renderSkills({ titulo, introduccion, categorias }) {
  const list = createElement('dl', 'notas herramientas');

  categorias.forEach(({ nombre, usadas, aprendiendo }) => {
    const row = createElement('div', 'nota');
    const tools = createElement('dd');
    const items = [
      ...usadas.map((tool) => createElement('span', '', tool)),
      ...aprendiendo.map((tool) => createElement('em', '', tool)),
    ];

    items.forEach((item, index) => {
      if (index) tools.append(', ');
      tools.append(item);
    });
    row.append(createElement('dt', '', nombre), tools);
    list.append(row);
  });

  document.getElementById('conocimientos').append(
    createElement('h2', 'titulo-seccion', titulo),
    createElement('p', 'texto-seccion', introduccion),
    list,
  );
}

// ---------- Contacto ----------
function joinWithAnd(nodes) {
  const and = i18n.lang === 'es' ? ' y ' : ' and ';
  return nodes.flatMap((node, index) => {
    if (index === 0) return [node];
    return [index === nodes.length - 1 ? and : ', ', node];
  });
}

function renderContact({ titulo, texto, copiar, copiado, abrir, otros, redes }) {
  const email = createLink(`mailto:${ENLACES.correo}`, 'correo', ENLACES.correo);
  const actions = createElement('div', 'acciones');
  const copy = createElement('button', 'boton boton-luz', copiar);
  const status = createElement('p', 'aviso');
  const socials = createElement('p', 'redes');

  copy.type = 'button';
  status.setAttribute('role', 'status');

  // Copiar y confirmar con el mismo verbo que el botón
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(ENLACES.correo);
      copy.textContent = copiado;
      status.textContent = copiado;
      setTimeout(() => {
        copy.textContent = copiar;
        status.textContent = '';
      }, 2400);
    } catch {
      window.location.href = `mailto:${ENLACES.correo}`;
    }
  });

  actions.append(copy, createLink(`mailto:${ENLACES.correo}`, 'boton', abrir));
  socials.append(
    `${otros} `,
    ...joinWithAnd(redes.map(({ etiqueta, url }) => createLink(url, 'enlace', etiqueta))),
    '.',
  );

  document.getElementById('contacto').append(
    createElement('h2', 'titulo-seccion titulo-contacto', titulo),
    createElement('p', 'texto-seccion', texto),
    email,
    actions,
    status,
    socials,
  );
}

// ---------- Índice de fases ----------
function renderRail(fases) {
  const rail = document.getElementById('fases');
  const list = createElement('ol');

  rail.setAttribute('aria-label', fases.etiqueta);
  HOME_SECTIONS.forEach(({ id, key }) => {
    const item = createElement('li');
    const link = createLink(`#${id}`, 'fase');

    link.dataset.section = id;
    link.append(
      fromHtml(Luna.moonSvg({ r: 10, withCraters: false, className: 'luna-fase' })),
      createElement('span', 'fase-nombre', fases[key]),
    );
    item.append(link);
    list.append(item);
  });

  rail.replaceChildren(list);
}

// Cada sección de la página con su bloque de contenido-inicio.js, en orden de fase.
// Si se borra un bloque de ese archivo, la sección simplemente no aparece.
const HOME_SECTIONS = [
  { id: 'presentacion', key: 'presentacion', render: renderIntro },
  { id: 'proyectos', key: 'proyectos', render: renderProjects },
  { id: 'sobre-mi', key: 'sobreMi', render: renderAbout },
  { id: 'conocimientos', key: 'conocimientos', render: renderSkills },
  { id: 'contacto', key: 'contacto', render: renderContact },
];

let lunaScroll = null;

// Pinta Inicio en el idioma actual. Se repite al cambiar de idioma.
function renderHome() {
  const content = CONTENIDO_INICIO[i18n.lang];

  HOME_SECTIONS.forEach(({ id, key, render }) => {
    document.getElementById(id).replaceChildren();
    if (content[key]) render(content[key]);
  });
  renderRail(content.fases);

  if (lunaScroll) {
    lunaScroll.redraw();
  } else {
    const moon = document.querySelector('#luna-grande svg');
    lunaScroll = Luna.initScroll({
      moon,
      rail: document.getElementById('fases'),
      sections: HOME_SECTIONS.map(({ id }) => document.getElementById(id)),
    });
  }
}

document.getElementById('luna-grande').innerHTML = Luna.moonSvg({ r: 100, className: 'luna-svg' });
i18n.onChange(renderHome);
renderHome();
