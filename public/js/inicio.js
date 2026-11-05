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

function createTagList(tags, learningTags = []) {
  const list = createElement('ul', 'tag-list');

  list.append(
    ...tags.map((tag) => createElement('li', 'tag', tag)),
    ...learningTags.map((tag) => createElement('li', 'tag tag-learning', tag)),
  );
  return list;
}

function createParagraphs(paragraphs) {
  return paragraphs.map((paragraph) => createElement('p', 'section-text', paragraph));
}

function renderIntro({ frase, fraseDestacada, subtitulo }) {
  const title = createElement('h1', 'hero-title', frase);
  const roles = createElement('ul', 'hero-roles');

  title.append(' ', createElement('span', 'hero-highlight', fraseDestacada));
  roles.append(...subtitulo.map((rol) => createElement('li', '', rol)));
  document.getElementById('presentacion').append(title, roles);
}

function renderPillar({ nombre, texto }) {
  const card = createElement('article', 'card');

  card.append(createElement('h3', 'card-title', nombre), createElement('p', 'card-text', texto));
  return card;
}

function renderAbout({ titulo, parrafos, pilares }) {
  const pillars = createElement('div', 'card-grid');

  pillars.append(...pilares.map(renderPillar));
  document.getElementById('sobre-mi').append(
    createElement('h2', 'section-title', titulo),
    ...createParagraphs(parrafos),
    pillars,
  );
}

function renderSkillCategory({ nombre, descripcion, usadas, aprendiendo }) {
  const card = createElement('article', 'card');

  card.append(
    createElement('h3', 'card-title', nombre),
    createElement('p', 'card-text', descripcion),
    createTagList(usadas, aprendiendo),
  );
  return card;
}

function renderSkills({ titulo, introduccion, leyenda, categorias }) {
  const grid = createElement('div', 'card-grid');
  const legend = createElement('p', 'skills-legend');

  legend.append(createElement('span', 'tag tag-learning', leyenda));
  grid.append(...categorias.map(renderSkillCategory), legend);
  document.getElementById('conocimientos').append(
    createElement('h2', 'section-title', titulo),
    createElement('p', 'section-text', introduccion),
    grid,
  );
}

function renderProject({ nombre, descripcion, etiquetas, enlace }) {
  const card = createElement('article', 'card');

  card.append(
    createElement('h3', 'card-title', nombre),
    createElement('p', 'card-text', descripcion),
    createTagList(etiquetas),
  );

  if (enlace) card.append(createLink(enlace, 'card-link', i18n.t('home.viewProject')));
  return card;
}

function renderProjects({ titulo, introduccion, lista }) {
  const grid = createElement('div', 'card-grid card-grid-wide');

  grid.append(...lista.map(renderProject));
  document.getElementById('proyectos').append(
    createElement('h2', 'section-title', titulo),
    createElement('p', 'section-text', introduccion),
    grid,
  );
}

function renderContact({ titulo, parrafos, enlaces }) {
  const list = createElement('div', 'contact-links');

  list.append(...enlaces.map(({ etiqueta, url }) => createLink(url, 'button-link', etiqueta)));
  document.getElementById('contacto').append(
    createElement('h2', 'section-title', titulo),
    ...createParagraphs(parrafos),
    list,
  );
}

// Pinta Inicio en el idioma actual. Se repite al cambiar de idioma.
function renderHome() {
  const content = CONTENIDO_INICIO[i18n.lang];

  ['presentacion', 'sobre-mi', 'conocimientos', 'proyectos', 'contacto'].forEach((id) => {
    document.getElementById(id).replaceChildren();
  });

  renderIntro(content.presentacion);
  renderAbout(content.sobreMi);
  renderSkills(content.conocimientos);
  renderProjects(content.proyectos);
  renderContact(content.contacto);
}

i18n.onChange(renderHome);
renderHome();
