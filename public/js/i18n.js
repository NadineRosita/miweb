// Traducción de la web a español e inglés.
//
// Aquí están los textos de la interfaz: menú, pie, páginas y mensajes de error.
// Los textos largos de Inicio están en contenido-inicio.js.
//
// En el HTML, un elemento se traduce indicando su clave:
//   data-i18n="clave"          su texto
//   data-i18n-aria="clave"     su aria-label
//   data-i18n-content="clave"  su atributo content (como la descripción de la página)
//
// Se carga sin defer para fijar el idioma antes de pintar la página.

const i18n = (() => {
  const STORAGE_KEY = 'lang';

  const TEXTS = {
    es: {
      'title.inicio': 'NadineRoss',
      'title.juegos': 'Juegos — NadineRoss',
      'title.aplicaciones': 'Aplicaciones — NadineRoss',
      'title.mi-pet': 'Mi Pet — NadineRoss',
      'title.jaja-que-tonto': 'jaja, que tonto — NadineRoss',
      'meta.description': 'Portfolio de Nadine Ross, estudiante de Ingeniería del Software en la Universidad de Sevilla y desarrolladora en formación.',

      'nav.inicio': 'Inicio',
      'nav.juegos': 'Juegos',
      'nav.aplicaciones': 'Aplicaciones',
      'nav.mi-pet': 'Mi Pet',
      'nav.jaja-que-tonto': 'jaja, que tonto',
      'nav.sobre-mi': 'Sobre mí',
      'nav.conocimientos': 'Conocimientos',
      'nav.proyectos': 'Proyectos',
      'nav.contacto': 'Contacto',
      'nav.label': 'Navegación principal',

      'menu.open': 'Abrir menú',
      'menu.close': 'Cerrar menú',
      'theme.label': 'Modo oscuro',
      'lang.button': 'EN',
      'lang.label': 'Switch to English',

      'footer.rights': 'Todos los derechos reservados',
      'footer.top': 'Volver arriba ↑',

      'home.viewProject': 'Ver proyecto →',
      'common.comingSoon': 'Próximamente.',

      'pet.signIn': 'Entra en tu cuenta para cuidar de tu mascota. Tu progreso se guarda solo.',
      'pet.username': 'Usuario',
      'pet.password': 'Contraseña',
      'pet.login': 'Entrar',
      'pet.register': 'Crear cuenta',
      'pet.hello': 'Hola,',
      'pet.intro': '. Esta es tu mascota:',
      'pet.food': 'Comida',
      'pet.happiness': 'Felicidad',
      'pet.energy': 'Energía',
      'pet.feed': 'Dar de comer',
      'pet.play': 'Jugar',
      'pet.sleep': 'Dormir',
      'pet.logout': 'Cerrar sesión',

      // Los códigos coinciden con los que envía el servidor
      'error.connection': 'No se ha podido conectar con el servidor.',
      'error.login_required': 'Tienes que iniciar sesión.',
      'error.too_many_attempts': 'Demasiados intentos. Prueba de nuevo en unos minutos.',
      'error.username_invalid': 'El usuario debe tener de 3 a 24 letras, números o guiones bajos.',
      'error.password_invalid': 'La contraseña debe tener de 8 a 72 caracteres.',
      'error.username_taken': 'Ese nombre de usuario ya existe.',
      'error.credentials_missing': 'Escribe tu usuario y tu contraseña.',
      'error.credentials_wrong': 'Usuario o contraseña incorrectos.',
      'error.pet_name_invalid': 'El nombre debe tener de 1 a 24 caracteres.',
      'error.action_invalid': 'Esa acción no existe.',
      'error.database_unavailable': 'Mi Pet no está disponible: falta la base de datos.',
      'error.not_found': 'Esta ruta no existe.',
      'error.invalid_request': 'La petición no es válida.',
      'error.server_error': 'Algo ha fallado en el servidor.',
    },

    en: {
      'title.inicio': 'NadineRoss',
      'title.juegos': 'Games — NadineRoss',
      'title.aplicaciones': 'Apps — NadineRoss',
      'title.mi-pet': 'My Pet — NadineRoss',
      'title.jaja-que-tonto': 'haha, how silly — NadineRoss',
      'meta.description': 'Portfolio of Nadine Ross, a Software Engineering student at the University of Seville and developer in progress.',

      'nav.inicio': 'Home',
      'nav.juegos': 'Games',
      'nav.aplicaciones': 'Apps',
      'nav.mi-pet': 'My Pet',
      'nav.jaja-que-tonto': 'haha, how silly',
      'nav.sobre-mi': 'About me',
      'nav.conocimientos': 'Skills',
      'nav.proyectos': 'Projects',
      'nav.contacto': 'Contact',
      'nav.label': 'Main navigation',

      'menu.open': 'Open menu',
      'menu.close': 'Close menu',
      'theme.label': 'Dark mode',
      'lang.button': 'ES',
      'lang.label': 'Cambiar a español',

      'footer.rights': 'All rights reserved',
      'footer.top': 'Back to top ↑',

      'home.viewProject': 'View project →',
      'common.comingSoon': 'Coming soon.',

      'pet.signIn': 'Sign in to look after your pet. Your progress saves automatically.',
      'pet.username': 'Username',
      'pet.password': 'Password',
      'pet.login': 'Sign in',
      'pet.register': 'Create account',
      'pet.hello': 'Hi,',
      'pet.intro': '. This is your pet:',
      'pet.food': 'Food',
      'pet.happiness': 'Happiness',
      'pet.energy': 'Energy',
      'pet.feed': 'Feed',
      'pet.play': 'Play',
      'pet.sleep': 'Sleep',
      'pet.logout': 'Sign out',

      'error.connection': 'Could not connect to the server.',
      'error.login_required': 'You need to sign in.',
      'error.too_many_attempts': 'Too many attempts. Please try again in a few minutes.',
      'error.username_invalid': 'Usernames must be 3 to 24 letters, numbers or underscores.',
      'error.password_invalid': 'Passwords must be 8 to 72 characters long.',
      'error.username_taken': 'That username is already taken.',
      'error.credentials_missing': 'Enter your username and password.',
      'error.credentials_wrong': 'Incorrect username or password.',
      'error.pet_name_invalid': 'The name must be 1 to 24 characters long.',
      'error.action_invalid': 'That action does not exist.',
      'error.database_unavailable': 'My Pet is unavailable: the database is missing.',
      'error.not_found': 'This route does not exist.',
      'error.invalid_request': 'The request is not valid.',
      'error.server_error': 'Something went wrong on the server.',
    },
  };

  const listeners = [];

  function detectLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (Object.hasOwn(TEXTS, saved)) return saved;
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  let lang = detectLanguage();
  document.documentElement.lang = lang;

  const t = (key) => TEXTS[lang][key] ?? TEXTS.es[key] ?? key;

  // Traduce todo lo marcado en la página
  function apply() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-content]').forEach((element) => {
      element.setAttribute('content', t(element.dataset.i18nContent));
    });
    document.title = t(`title.${document.body.dataset.page}`);
  }

  function setLanguage(next) {
    lang = next;
    document.documentElement.lang = next;
    localStorage.setItem(STORAGE_KEY, next);
    apply();
    listeners.forEach((listener) => listener());
  }

  return {
    get lang() {
      return lang;
    },
    t,
    apply,
    setLanguage,
    // Para las partes de la página que se vuelven a pintar al cambiar de idioma
    onChange: (listener) => listeners.push(listener),
  };
})();
