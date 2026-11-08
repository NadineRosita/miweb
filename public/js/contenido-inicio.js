// ============================================================
//  TEXTOS DE LA PÁGINA DE INICIO («Cuaderno de observación»)
//  Edita solo este archivo para cambiar lo que dice la web:
//  el diseño se adapta solo. Recuerda mantener las comillas
//  y las comas tal como están.
//
//  Hay dos bloques iguales: es (español) y en (inglés).
//  Si cambias algo en uno, cámbialo también en el otro.
//  Dentro de un texto en inglés, un apóstrofo se escribe \'
//
//  El orden de las secciones es el de la luna: la página empieza
//  en luna nueva y llega a luna llena en Contacto.
// ============================================================

// Tus enlaces, compartidos por los dos idiomas
const ENLACES = {
  correo: 'nadinecodinghere@gmail.com',
  github: 'https://github.com/NadineRosita',
  instagram: 'https://www.instagram.com/_just.nad/',
  discord: 'https://discord.com/users/428102550349414407',
  pomodoro: 'https://github.com/NadineRosita/my-pomodoro-timer',
};

const CONTENIDO_INICIO = {
  // ============================ ESPAÑOL ============================
  es: {
    // Nombre de cada sección en la barra de fases de la luna
    fases: {
      etiqueta: 'Secciones de la página',
      presentacion: 'Hola',
      proyectos: 'Lo que he hecho',
      sobreMi: 'Sobre mí',
      conocimientos: 'Herramientas',
      contacto: 'Contacto',
    },

    // ---------- Presentación (lo primero que se ve) ----------
    presentacion: {
      nombre: 'Nadia Coronel',
      frase: 'Estudio Ingeniería del Software en la Universidad de Sevilla. Hago juegos multijugador, apps y herramientas pequeñas, y casi todo se puede probar en esta web.',
      botonPrincipal: 'Ver lo que he hecho',
      botonSecundario: 'Escríbeme',
      // {fase} y {porcentaje} se calculan solos con la luna real de hoy
      lunaDeHoy: 'Esta noche la luna está {fase}, iluminada al {porcentaje} %.',
    },

    // ---------- Lo que he hecho ----------
    proyectos: {
      titulo: 'Lo que he hecho',
      introduccion: 'Los tres primeros funcionan aquí mismo: ábrelos y juega.',
      // destacado: true los pone grandes, arriba. enlace: '' si no tiene.
      lista: [
        {
          nombre: 'Ajedrez',
          estado: 'jugable',
          destacado: true,
          descripcion: 'Juega contra la máquina, o crea una sala y pásale el código a quien quieras.',
          porDentro: 'Motor propio (negamax con poda alfa-beta) en un Web Worker, salas en tiempo real con WebSocket, reloj y partidas guardadas en PostgreSQL.',
          etiquetas: ['JavaScript', 'Node.js', 'WebSocket', 'PostgreSQL'],
          enlace: 'ajedrez.html',
          accion: 'Jugar al ajedrez',
        },
        {
          nombre: 'Ciudadelas',
          estado: 'jugable',
          destacado: true,
          descripcion: 'Cartas y estrategia para 2 a 7 jugadores, con salas, bots y un tutorial guiado.',
          porDentro: 'Las reglas viven en el servidor; los tests juegan partidas completas de bots con 2 a 7 jugadores.',
          etiquetas: ['JavaScript', 'Node.js', 'WebSocket', 'node:test'],
          enlace: 'ciudadelas.html',
          accion: 'Jugar a Ciudadelas',
        },
        {
          nombre: 'Mi Pet',
          estado: 'jugable',
          destacado: true,
          descripcion: 'Adopta una mascota, cuídala y juega a sus minijuegos. Tu progreso se guarda en tu cuenta.',
          porDentro: 'Cuentas con sesiones, la simulación de la mascota en el servidor, sprites en pixel art y siete minijuegos.',
          etiquetas: ['JavaScript', 'Express', 'PostgreSQL'],
          enlace: 'mi-pet.html',
          accion: 'Adoptar una mascota',
        },
        {
          nombre: 'ASTRAmentor',
          estado: 'desarrollo',
          descripcion: 'App para ASTRA, asociación de estudiantes de la ETSII, que conecta a quien acaba de llegar con mentores según afinidad: perfiles con roles, solicitudes y categorías de asignaturas y vida universitaria.',
          etiquetas: ['Expo', 'React Native', 'Supabase'],
          enlace: '',
        },
        {
          nombre: 'Melón',
          estado: 'desarrollo',
          descripcion: 'Mi asistente personal en Python, inspirado en las IA de la ciencia ficción: reconocimiento y síntesis de voz con modelos de lenguaje locales.',
          etiquetas: ['Python', 'PySide6', 'Ollama'],
          enlace: '',
        },
        {
          nombre: 'Aesthetic Pomodoro',
          estado: 'codigo',
          descripcion: 'Un temporizador Pomodoro en el que el diseño importa tanto como el reloj.',
          etiquetas: ['HTML', 'CSS', 'JavaScript'],
          enlace: ENLACES.pomodoro,
          accion: 'Ver el código',
        },
      ],
      // Cómo se lee cada estado
      estados: {
        jugable: 'Se puede jugar',
        desarrollo: 'En desarrollo',
        codigo: 'Código en GitHub',
      },
      porDentroTitulo: 'Por dentro',
      otrosTitulo: 'También en el cuaderno',
    },

    // ---------- Sobre mí ----------
    sobreMi: {
      titulo: 'Sobre mí',
      parrafos: [
        'Me llamo Nadia Coronel, aunque casi todo el mundo me llama Nadine (y mis amigos, Meloncilla). Me interesan el desarrollo de aplicaciones, los sistemas y las bases de datos, y aprendo mejor construyendo cosas que otros puedan usar.',
      ],
      // Retrato: la imagen está en public/imagenes/
      foto: { src: 'imagenes/nadia.jpg', alt: 'Retrato de Nadia, con el pelo pelirrojo suelto y un colgante.' },
      // Pares de dato y valor
      notas: [
        { dato: 'Estudio', valor: 'Ingeniería del Software, Universidad de Sevilla' },
        { dato: 'Presido', valor: 'ASTRA, asociación de estudiantes de la ETSII' },
        { dato: 'Busco', valor: 'Proyectos y oportunidades para seguir aprendiendo' },
        { dato: 'Fuera de clase', valor: 'Escribo, observo la luna, hago fotos y juego a Hollow Knight' },
      ],
    },

    // ---------- Herramientas ----------
    conocimientos: {
      titulo: 'Herramientas',
      introduccion: 'Las que ya he usado en proyectos, y en cursiva las que estoy explorando.',
      categorias: [
        { nombre: 'Lenguajes', usadas: ['Python', 'Java'], aprendiendo: ['JavaScript'] },
        { nombre: 'Web y apps', usadas: ['HTML', 'CSS', 'Expo', 'React Native'], aprendiendo: [] },
        { nombre: 'Datos y backend', usadas: ['SQL', 'Supabase'], aprendiendo: [] },
        { nombre: 'Forma de trabajar', usadas: ['Git', 'GitHub', 'pytest'], aprendiendo: [] },
        { nombre: 'Escritorio e IA local', usadas: ['PySide6', 'Ollama'], aprendiendo: [] },
      ],
    },

    // ---------- Contacto ----------
    contacto: {
      titulo: 'Escríbeme',
      texto: 'Me apetece conocer a otros desarrolladores y encontrar proyectos y oportunidades para aprender. Contesto antes por correo.',
      copiar: 'Copiar correo',
      copiado: 'Correo copiado',
      abrir: 'Abrir en tu correo',
      otros: 'También estoy en',
      redes: [
        { etiqueta: 'GitHub', url: ENLACES.github },
        { etiqueta: 'Instagram', url: ENLACES.instagram },
        { etiqueta: 'Discord', url: ENLACES.discord },
      ],
    },
  },

  // ============================ INGLÉS =============================
  en: {
    fases: {
      etiqueta: 'Page sections',
      presentacion: 'Hello',
      proyectos: 'What I\'ve made',
      sobreMi: 'About me',
      conocimientos: 'Tools',
      contacto: 'Contact',
    },

    presentacion: {
      nombre: 'Nadia Coronel',
      frase: 'I study Software Engineering at the University of Seville. I make multiplayer games, apps and small tools, and you can try most of them right here.',
      botonPrincipal: 'See what I\'ve made',
      botonSecundario: 'Email me',
      lunaDeHoy: 'Tonight the moon is {fase}, {porcentaje}% lit.',
    },

    proyectos: {
      titulo: 'What I\'ve made',
      introduccion: 'The first three run right here: open one and play.',
      lista: [
        {
          nombre: 'Chess',
          estado: 'jugable',
          destacado: true,
          descripcion: 'Play against the computer, or create a room and send the code to whoever you like.',
          porDentro: 'My own engine (negamax with alpha-beta pruning) in a Web Worker, real-time rooms over WebSocket, a game clock and games saved in PostgreSQL.',
          etiquetas: ['JavaScript', 'Node.js', 'WebSocket', 'PostgreSQL'],
          enlace: 'ajedrez.html',
          accion: 'Play chess',
        },
        {
          nombre: 'Citadels',
          estado: 'jugable',
          destacado: true,
          descripcion: 'A card and strategy game for 2 to 7 players, with rooms, bots and a guided tutorial.',
          porDentro: 'The rules live on the server; the tests play full bot games with 2 to 7 players.',
          etiquetas: ['JavaScript', 'Node.js', 'WebSocket', 'node:test'],
          enlace: 'ciudadelas.html',
          accion: 'Play Citadels',
        },
        {
          nombre: 'My Pet',
          estado: 'jugable',
          destacado: true,
          descripcion: 'Adopt a pet, look after it and play its minigames. Your progress is saved to your account.',
          porDentro: 'Accounts with sessions, the pet simulation on the server, pixel-art sprites and seven minigames.',
          etiquetas: ['JavaScript', 'Express', 'PostgreSQL'],
          enlace: 'mi-pet.html',
          accion: 'Adopt a pet',
        },
        {
          nombre: 'ASTRAmentor',
          estado: 'desarrollo',
          descripcion: 'An app for ASTRA, a student association at ETSII, that matches newcomers with mentors by affinity: role-based profiles, requests, and categories for courses and university life.',
          etiquetas: ['Expo', 'React Native', 'Supabase'],
          enlace: '',
        },
        {
          nombre: 'Melón',
          estado: 'desarrollo',
          descripcion: 'My personal assistant in Python, inspired by science-fiction AIs: speech recognition and synthesis with local language models.',
          etiquetas: ['Python', 'PySide6', 'Ollama'],
          enlace: '',
        },
        {
          nombre: 'Aesthetic Pomodoro',
          estado: 'codigo',
          descripcion: 'A Pomodoro timer where the design matters as much as the clock.',
          etiquetas: ['HTML', 'CSS', 'JavaScript'],
          enlace: ENLACES.pomodoro,
          accion: 'View the code',
        },
      ],
      estados: {
        jugable: 'Playable now',
        desarrollo: 'In progress',
        codigo: 'Code on GitHub',
      },
      porDentroTitulo: 'Under the hood',
      otrosTitulo: 'Also in the notebook',
    },

    sobreMi: {
      titulo: 'About me',
      parrafos: [
        'I\'m Nadia Coronel, though almost everyone calls me Nadine (and my friends, Meloncilla). I\'m into application development, systems and databases, and I learn best by building things other people can use.',
      ],
      foto: { src: 'imagenes/nadia.jpg', alt: 'Portrait of Nadia, with loose red hair and a pendant necklace.' },
      notas: [
        { dato: 'Studying', valor: 'Software Engineering, University of Seville' },
        { dato: 'Leading', valor: 'ASTRA, a student association at ETSII' },
        { dato: 'Looking for', valor: 'Projects and opportunities to keep learning' },
        { dato: 'Outside class', valor: 'I write, watch the moon, take photos and play Hollow Knight' },
      ],
    },

    conocimientos: {
      titulo: 'Tools',
      introduccion: 'The ones I\'ve already used in projects, and in italics the ones I\'m exploring.',
      categorias: [
        { nombre: 'Languages', usadas: ['Python', 'Java'], aprendiendo: ['JavaScript'] },
        { nombre: 'Web and apps', usadas: ['HTML', 'CSS', 'Expo', 'React Native'], aprendiendo: [] },
        { nombre: 'Data and backend', usadas: ['SQL', 'Supabase'], aprendiendo: [] },
        { nombre: 'Workflow', usadas: ['Git', 'GitHub', 'pytest'], aprendiendo: [] },
        { nombre: 'Desktop and local AI', usadas: ['PySide6', 'Ollama'], aprendiendo: [] },
      ],
    },

    contacto: {
      titulo: 'Email me',
      texto: 'I\'d love to meet other developers and find projects and opportunities to learn. Email is the fastest way to reach me.',
      copiar: 'Copy email',
      copiado: 'Email copied',
      abrir: 'Open in your email app',
      otros: 'I\'m also on',
      redes: [
        { etiqueta: 'GitHub', url: ENLACES.github },
        { etiqueta: 'Instagram', url: ENLACES.instagram },
        { etiqueta: 'Discord', url: ENLACES.discord },
      ],
    },
  },
};
