// Página Mi Pet: inicio de sesión y estado de la mascota.
// El estado se guarda en el servidor (ver server/pet.js).
// El futuro juego se construye dentro de <section id="pet-game"> en mi-pet.html.

const authView = document.getElementById('pet-auth');
const gameView = document.getElementById('pet-game');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const gameError = document.getElementById('game-error');

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

function renderPet(pet) {
  document.getElementById('pet-name').textContent = pet.name;

  ['food', 'happiness', 'energy'].forEach((stat) => {
    const bar = document.getElementById(`stat-${stat}`);
    bar.value = pet[stat];
    bar.textContent = `${pet[stat]} %`;
  });
}

function showAuth() {
  gameView.hidden = true;
  authView.hidden = false;
}

async function showGame(username) {
  renderPet(await api('/pet'));
  document.getElementById('pet-user').textContent = username;
  authView.hidden = true;
  gameView.hidden = false;
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

document.querySelectorAll('[data-pet-action]').forEach((button) => {
  button.addEventListener('click', async () => {
    clearError(gameError);

    try {
      renderPet(await api(`/pet/actions/${button.dataset.petAction}`, { method: 'POST' }));
    } catch (error) {
      if (error.status === 401) showAuth();
      else showError(gameError, error);
    }
  });
});

document.getElementById('logout').addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
    showAuth();
  } catch (error) {
    showError(gameError, error);
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
