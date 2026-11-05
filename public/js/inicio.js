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

function renderAbout({ titulo, parrafos }) {
  document.getElementById('sobre-mi').append(
    createElement('h2', 'section-title', titulo),
    ...parrafos.map((parrafo) => createElement('p', 'section-text', parrafo)),
  );
}

function renderProject({ nombre, descripcion, etiquetas, enlace }) {
  const card = createElement('article', 'card');
  const tags = createElement('ul', 'tag-list');

  tags.append(...etiquetas.map((etiqueta) => createElement('li', 'tag', etiqueta)));
  card.append(createElement('h3', 'card-title', nombre), createElement('p', 'card-text', descripcion), tags);

  if (enlace) card.append(createLink(enlace, 'card-link', 'Ver proyecto →'));
  return card;
}

function renderProjects({ titulo, introduccion, lista }) {
  const grid = createElement('div', 'card-grid');

  grid.append(...lista.map(renderProject));
  document.getElementById('proyectos').append(
    createElement('h2', 'section-title', titulo),
    createElement('p', 'section-text', introduccion),
    grid,
  );
}

function renderContact({ titulo, texto, enlaces }) {
  const list = createElement('div', 'contact-links');

  list.append(...enlaces.map(({ etiqueta, url }) => createLink(url, 'button-link', etiqueta)));
  document.getElementById('contacto').append(
    createElement('h2', 'section-title', titulo),
    createElement('p', 'section-text', texto),
    list,
  );
}

renderAbout(CONTENIDO_INICIO.sobreMi);
renderProjects(CONTENIDO_INICIO.proyectos);
renderContact(CONTENIDO_INICIO.contacto);
