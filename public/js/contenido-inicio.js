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
      frase: 'Convirtiendo ideas en software,',
      // Esta parte de la frase va en letra cursiva y color de acento
      fraseDestacada: 'un proyecto cada vez.',
      subtitulo: [
        'Estudiante de Ingeniería del Software',
        'Desarrolladora en formación',
        'Entusiasta de la tecnología',
      ],
    },

    // ---------- Sobre mí ----------
    sobreMi: {
      titulo: 'Sobre mí',
      // Cada texto entre comillas es un párrafo. Añade o quita los que quieras.
      parrafos: [
        'Soy Nadine Ross y estudio Ingeniería del Software en la Universidad de Sevilla. Soy curiosa, creativa y bastante autodidacta: si algo me llama la atención, acabo abriendo el editor para probarlo.',
        'Me interesan el desarrollo de software, las aplicaciones, los sistemas y las bases de datos. Aprendo haciendo: elijo una idea, la convierto en proyecto y descubro por el camino todo lo que me falta por saber.',
        'Estoy construyendo mi trayectoria como desarrolladora paso a paso, y cada proyecto de esta web es uno de esos pasos.',
      ],
      // Las tres ideas que definen el portfolio
      pilares: [
        { nombre: 'Curiosidad', texto: 'Explorar tecnologías nuevas y seguir aprendiendo siempre.' },
        { nombre: 'Creatividad', texto: 'Imaginar proyectos propios y atreverme a construirlos.' },
        { nombre: 'Crecimiento', texto: 'Evolucionar en cada paso como futura ingeniera de software.' },
      ],
    },

    // ---------- Conocimientos ----------
    conocimientos: {
      titulo: 'Conocimientos',
      introduccion: 'Las herramientas de mi caja por ahora. Sin barras de nivel: prefiero que hablen los proyectos.',
      leyenda: 'Lo que sigo explorando',
      // usadas: etiquetas normales. aprendiendo: etiquetas con borde punteado.
      // Para cambiar una tecnología de grupo, muévela de una lista a la otra.
      categorias: [
        {
          nombre: 'Lenguajes',
          descripcion: 'Fundamentos de programación, aplicaciones y orientación a objetos.',
          usadas: ['Python', 'Java'],
          aprendiendo: ['JavaScript'],
        },
        {
          nombre: 'Web y apps',
          descripcion: 'Páginas web y aplicaciones multiplataforma.',
          usadas: ['HTML', 'CSS', 'Expo', 'React Native'],
          aprendiendo: [],
        },
        {
          nombre: 'Datos y backend',
          descripcion: 'Bases de datos, backend y gestión de datos.',
          usadas: ['SQL', 'Supabase'],
          aprendiendo: [],
        },
        {
          nombre: 'Flujo de trabajo',
          descripcion: 'Control de versiones, gestión de proyectos y pruebas automatizadas.',
          usadas: ['Git', 'GitHub', 'pytest'],
          aprendiendo: [],
        },
        {
          nombre: 'Escritorio e IA local',
          descripcion: 'Interfaces gráficas y modelos de lenguaje en mi propio equipo.',
          usadas: ['PySide6', 'Ollama'],
          aprendiendo: [],
        },
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
          nombre: 'DND Campaign Manager',
          descripcion: 'Una aplicación de línea de comandos en Python para organizar campañas de Dungeons & Dragons. Hoy gestiona personajes y los guarda en JSON; campañas y sesiones son los siguientes pasos. Aquí he cuidado la estructura del código, las pruebas con pytest y la documentación.',
          etiquetas: ['Python', 'pytest', 'Git', 'GitHub'],
          enlace: ENLACES.dnd,
        },
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
        'Las buenas ideas empiezan con una conversación. Ya sea sobre tecnología, una colaboración o esa idea curiosa que no te sacas de la cabeza, mi bandeja de entrada siempre está abierta.',
        'Siempre me apetece conocer a otros desarrolladores y encontrar proyectos interesantes, oportunidades para aprender y nuevas experiencias en tecnología.',
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
      frase: 'Building ideas into software,',
      fraseDestacada: 'one project at a time.',
      subtitulo: [
        'Software Engineering Student',
        'Developer in Progress',
        'Tech Enthusiast',
      ],
    },

    sobreMi: {
      titulo: 'About me',
      parrafos: [
        'I\'m Nadine Ross, a Software Engineering student at the University of Seville. I\'m curious, creative and largely self-taught: if something catches my eye, I usually end up opening the editor to try it.',
        'I\'m interested in software development, applications, systems and databases. I learn by doing: I pick an idea, turn it into a project and discover along the way everything I still have to learn.',
        'I\'m building my path as a developer step by step, and every project on this site is one of those steps.',
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
          nombre: 'DND Campaign Manager',
          descripcion: 'A Python command-line app for organising Dungeons & Dragons campaigns. Today it manages characters and saves them to JSON; campaigns and sessions come next. Here I focused on code structure, testing with pytest and documentation.',
          etiquetas: ['Python', 'pytest', 'Git', 'GitHub'],
          enlace: ENLACES.dnd,
        },
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
        'Good ideas start with a conversation. Whether it\'s about technology, collaboration, or a random interesting idea, my inbox is always open.',
        'I\'m always happy to meet other developers and find interesting projects, chances to learn and new experiences in tech.',
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
