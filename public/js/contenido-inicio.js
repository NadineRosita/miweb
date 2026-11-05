// ============================================================
//  TEXTOS DE LA PÁGINA DE INICIO
//  Edita solo este archivo para cambiar lo que dice la web:
//  el diseño se adapta solo. Recuerda mantener las comillas
//  y las comas tal como están.
// ============================================================

const CONTENIDO_INICIO = {
  // ---------- Sobre mí ----------
  sobreMi: {
    titulo: 'Sobre mí',
    // Cada texto entre comillas es un párrafo. Añade o quita los que quieras.
    parrafos: [
      'Hola, soy NadineRoss. Sustituye este texto por tu presentación.',
      'Aquí puedes contar a qué te dedicas, qué te interesa y qué vas a encontrar en esta web.',
    ],
  },

  // ---------- Proyectos ----------
  proyectos: {
    titulo: 'Proyectos',
    introduccion: 'Una selección de cosas en las que he trabajado.',
    // Cada bloque { ... } es una tarjeta. Copia uno entero para añadir un proyecto.
    // Si un proyecto no tiene enlace, deja enlace: ''
    lista: [
      {
        nombre: 'Proyecto de ejemplo 1',
        descripcion: 'Describe en una o dos frases de qué trata este proyecto.',
        etiquetas: ['HTML', 'CSS'],
        enlace: '',
      },
      {
        nombre: 'Proyecto de ejemplo 2',
        descripcion: 'Describe en una o dos frases de qué trata este proyecto.',
        etiquetas: ['JavaScript'],
        enlace: '',
      },
      {
        nombre: 'Proyecto de ejemplo 3',
        descripcion: 'Describe en una o dos frases de qué trata este proyecto.',
        etiquetas: ['Node.js', 'PostgreSQL'],
        enlace: '',
      },
    ],
  },

  // ---------- Contacto ----------
  contacto: {
    titulo: 'Contacto',
    texto: '¿Quieres hablar conmigo? Puedes encontrarme aquí.',
    // Para un correo, escribe la dirección con mailto: delante
    enlaces: [
      { etiqueta: 'Correo', url: 'mailto:tu-correo@ejemplo.com' },
      { etiqueta: 'GitHub', url: 'https://github.com/tu-usuario' },
      { etiqueta: 'Instagram', url: 'https://instagram.com/tu-usuario' },
    ],
  },
};
