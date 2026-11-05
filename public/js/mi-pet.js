// Página Mi Pet: inicio de sesión. Al entrar, arranca el juego (public/js/mi-pet/juego.js).

const authView = document.getElementById('pet-auth');
const gameView = document.getElementById('pet-game');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const section = document.getElementById('pet-section');

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error);
    error.status = response.status;
    throw error;
  }
  return data;
}

// Muestra el error marcado con su clave, para que cambie también con el idioma.
// Los fallos de red no traen estado HTTP.
const showError = (element, error) => {
  element.dataset.i18n = `error.${error.status ? error.message : 'connection'}`;
  element.textContent = i18n.t(element.dataset.i18n);
};

const clearError = (element) => {
  delete element.dataset.i18n;
  element.textContent = '';
};

function showAuth() {
  gameView.hidden = true;
  section.classList.remove('pet-playing');
  authView.hidden = false;
}

async function logout() {
  showAuth();

  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (error) {
    showError(authError, error);
  }
}

async function showGame(username) {
  // El juego solo se descarga cuando hace falta
  const { startGame } = await import('./mi-pet/juego.js');

  authView.hidden = true;
  gameView.hidden = false;
  section.classList.add('pet-playing');
  await startGame({ root: gameView, username, onSignedOut: showAuth, onLogout: logout });
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(authError);

  const { username, password } = Object.fromEntries(new FormData(authForm));
  const mode = event.submitter.value; // "login" o "register"

  try {
    const user = await api(`/auth/${mode}`, { method: 'POST', body: { username, password } });
    authForm.reset();
    await showGame(user.username);
  } catch (error) {
    showError(authError, error);
  }
});

// Al cargar, recupera la sesión si ya la había
async function initPet() {
  try {
    const user = await api('/auth/me');
    await showGame(user.username);
  } catch (error) {
    showAuth();
    if (error.status !== 401) showError(authError, error);
  }
}

initPet();
