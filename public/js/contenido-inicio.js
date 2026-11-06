// ============================================================
//  TEXTOS DE LA PÁGINA DE INICIO
//  Edita solo este archivo para cambiar lo que dice la web:
//  el diseño se adapta solo. Recuerda mantener las comillas
//  y las comas tal como están.
//
//  Hay dos bloques iguales: es (español) y en (inglés).
//  Si cambias algo en uno, cámbialo también en el otro.
//  Dentro de un texto en inglés, un apóstrofo se escribe \'
// ============================================================

// Tus enlaces, compartidos por los dos idiomas
const ENLACES = {
  correo: 'mailto:nadinecodinghere@gmail.com',
  github: 'https://github.com/NadineRosita',
  instagram: 'https://www.instagram.com/_just.nad/',
  discord: 'https://discord.com/users/428102550349414407',
  dnd: 'https://github.com/NadineRosita/dnd-campaign-manager',
  pomodoro: 'https://github.com/NadineRosita/my-pomodoro-timer',
};

const CONTENIDO_INICIO = {
  // ============================ ESPAÑOL ============================
  es: {
    // ---------- Presentación (lo primero que se ve) ----------
    presentacion: {
      frase: 'Nadia Coronel,',
      // Esta parte de la frase va en letra cursiva y color de acento
      fraseDestacada: 'Ingeniera del Software, gamer, melómana.',
      subtitulo: [
        'Estudiante de Ingeniería del Software',
        'Presidenta de la asociación: ASTRA',
        'Meloncilla',
      ],
    },

    // ---------- Sobre mí ----------
    sobreMi: {
      titulo: 'Sobre mí',
      // Cada texto entre comillas es un párrafo. Añade o quita los que quieras.
      parrafos: [
        'Soy Nadia Coronel, también puedes llamarme Nadine, y estudio Ingeniería del Software en la Universidad de Sevilla. Estoy aprendiendo mientras exploro diferentes áreas y creo mis primeros proyectos.',
        'Me interesan el desarrollo de software, las aplicaciones, los sistemas y las bases de datos.',
        'Además de la carrera, me encanta observar la luna, la fotografía y el Hollow Knight xd.',
      ],
      // Las tres ideas que definen el portfolio
      pilares: [
        { nombre: 'Curiosidad', texto: 'Explorar tecnologías nuevas y seguir aprendiendo siempre.' },
        { nombre: 'Creatividad', texto: 'Imaginar proyectos propios y atreverme a construirlos.' },
        { nombre: 'Crecimiento', texto: 'Evolucionar en cada paso como futura ingeniera de software.' },
      ],
    },

    // ---------- Proyectos ----------
    proyectos: {
      titulo: 'Proyectos',
      introduccion: 'Ideas que se han convertido en código, y algunas que siguen creciendo.',
      // Cada bloque { ... } es una tarjeta. Copia uno entero para añadir un proyecto.
      // Si un proyecto no tiene enlace, deja enlace: ''
      lista: [
        {
          nombre: 'ASTRAmentor',
          descripcion: 'Una app para ASTRA, asociación universitaria de la ETSII de la Universidad de Sevilla, que conecta estudiantes y mentores y ayuda a integrarse a quienes acaban de llegar. Incluye perfiles con roles, solicitudes de mentoría, categorías de asignaturas y vida universitaria, y recomendaciones por afinidad.',
          etiquetas: ['Expo', 'React Native', 'Supabase'],
          enlace: '',
        },
        {
          nombre: 'Melón – Personal Assistant',
          descripcion: 'Mi asistente personal en Python, inspirado en las inteligencias artificiales de la ciencia ficción. Un campo de pruebas para experimentar con reconocimiento y síntesis de voz, modelos de lenguaje locales e interfaces gráficas.',
          etiquetas: ['Python', 'PySide6', 'Ollama'],
          enlace: '',
        },
        {
          nombre: 'Aesthetic Pomodoro',
          descripcion: 'Un temporizador Pomodoro en el que el diseño importa tanto como el reloj. Proyecto personal para experimentar con interfaces, productividad y experiencia de usuario.',
          etiquetas: ['HTML', 'CSS', 'JavaScript'],
          enlace: ENLACES.pomodoro,
        },
      ],
    },

    // ---------- Contacto ----------
    contacto: {
      titulo: 'Contacto',
      parrafos: [
        'Siempre me apetece conocer a otros desarrolladores y encontrar proyectos interesantes, oportunidades para aprender y nuevas experiencias en tecnología. Si te interesa hablar conmigo puedes contactarme:',
      ],
      enlaces: [
        { etiqueta: 'Correo', url: ENLACES.correo },
        { etiqueta: 'GitHub', url: ENLACES.github },
        { etiqueta: 'Instagram', url: ENLACES.instagram },
        { etiqueta: 'Discord', url: ENLACES.discord },
      ],
    },
  },

  // ============================ INGLÉS =============================
  en: {
    presentacion: {
      frase: 'Nadia Coronel,',
      fraseDestacada: 'Software Engineer, gamer, music lover.',
      subtitulo: [
        'Software Engineering Student',
        'President of: ASTRA students club',
        'Meloncilla',
      ],
    },

    sobreMi: {
      titulo: 'About me',
      parrafos: [
        'I\'m Nadia Coronel, you can also call me Nadine, a Software Engineering student at the University of Seville. I\m learning while I explore different areas and create my own little projects.',
        'I\'m interested in software development, applications, systems and databases.',
        'Outside of my studies, I love observing the moon, photography, and playing Hollow Knight!',
      ],
      pilares: [
        { nombre: 'Curiosity', texto: 'Exploring new technologies and never stopping learning.' },
        { nombre: 'Creativity', texto: 'Imagining my own projects and daring to build them.' },
        { nombre: 'Growth', texto: 'Evolving with every step as a future software engineer.' },
      ],
    },

    conocimientos: {
      titulo: 'Skills',
      introduccion: 'The tools in my toolbox so far. No skill bars: I\'d rather let the projects do the talking.',
      leyenda: 'Still exploring',
      categorias: [
        {
          nombre: 'Languages',
          descripcion: 'Programming fundamentals, applications and object-oriented programming.',
          usadas: ['Python', 'Java'],
          aprendiendo: ['JavaScript'],
        },
        {
          nombre: 'Web & apps',
          descripcion: 'Websites and cross-platform applications.',
          usadas: ['HTML', 'CSS', 'Expo', 'React Native'],
          aprendiendo: [],
        },
        {
          nombre: 'Data & backend',
          descripcion: 'Databases, backend and data management.',
          usadas: ['SQL', 'Supabase'],
          aprendiendo: [],
        },
        {
          nombre: 'Workflow',
          descripcion: 'Version control, project management and automated testing.',
          usadas: ['Git', 'GitHub', 'pytest'],
          aprendiendo: [],
        },
        {
          nombre: 'Desktop & local AI',
          descripcion: 'Graphical interfaces and language models on my own machine.',
          usadas: ['PySide6', 'Ollama'],
          aprendiendo: [],
        },
      ],
    },

    proyectos: {
      titulo: 'Projects',
      introduccion: 'Ideas that turned into code, and a few that are still growing.',
      lista: [
        {
          nombre: 'ASTRAmentor',
          descripcion: 'An app for ASTRA, a student association at the University of Seville\'s School of Computer Engineering, that connects students with mentors and helps newcomers settle in. It includes role-based profiles, mentoring requests, categories for subjects and university life, and affinity-based recommendations.',
          etiquetas: ['Expo', 'React Native', 'Supabase'],
          enlace: '',
        },
        {
          nombre: 'Melón – Personal Assistant',
          descripcion: 'My personal assistant in Python, inspired by the AIs of science fiction. A playground for experimenting with speech recognition, speech synthesis, local language models and graphical interfaces.',
          etiquetas: ['Python', 'PySide6', 'Ollama'],
          enlace: '',
        },
        {
          nombre: 'Aesthetic Pomodoro',
          descripcion: 'A Pomodoro timer where the design matters as much as the clock. A personal project for experimenting with interfaces, productivity and user experience.',
          etiquetas: ['HTML', 'CSS', 'JavaScript'],
          enlace: ENLACES.pomodoro,
        },
      ],
    },

    contacto: {
      titulo: 'Contact',
      parrafos: [
        'I\'m always happy to meet other developers and find interesting projects, chances to learn and new experiences in tech. If you\d like to talk, feel free to get in touch:',
      ],
      enlaces: [
        { etiqueta: 'Email', url: ENLACES.correo },
        { etiqueta: 'GitHub', url: ENLACES.github },
        { etiqueta: 'Instagram', url: ENLACES.instagram },
        { etiqueta: 'Discord', url: ENLACES.discord },
      ],
    },
  },
};
