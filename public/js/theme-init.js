// Fija el tema antes de pintar la página para que no parpadee el equivocado al cargar.
// Por eso se carga sin defer, antes que styles.css.
document.documentElement.dataset.theme = localStorage.getItem('theme')
  || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
