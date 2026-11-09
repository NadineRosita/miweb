// API de solo lectura de los poemas. Viven en otro repositorio de GitHub que solo
// edita su dueña: aquí únicamente se leen (no hay POST, PUT ni DELETE).
//
//   GET /api/poemas       lista: identificador, titulo y fecha
//   GET /api/poemas/:id   un poema: titulo, fecha y texto
//
// Se necesita la variable de entorno POEMAS_GITHUB_TOKEN (token con permiso de
// lectura del repositorio). Los errores nunca incluyen el token ni detalles internos.

const express = require('express');
const { esIdValido, idDeArchivo, leerPoema, ordenarPublicados } = require('./formato');

// ---------- Dónde están los poemas (cámbialo aquí) ----------
const REPO_OWNER = 'NadineRosita';
const REPO_NAME = 'poemas';
const REPO_FOLDER = ''; // carpeta dentro del repo; vacío = la raíz (usa 'poemas' si están en una carpeta)

const CACHE_MS = 60 * 1000; // lo que dura la copia en memoria
const RETRY_MS = 60 * 1000; // tras un fallo, no se vuelve a insistir antes de esto
const REQUEST_TIMEOUT_MS = 8000;
const MAX_FILES = 300;

// Solo para los logs del servidor (nunca llega al navegador ni incluye el token)
const HINTS = {
  401: ' (el token no es válido o ha caducado)',
  403: ' (el token no tiene permiso, o se agotó el límite de GitHub)',
  404: ' (la carpeta no existe, o el token no tiene acceso a ese repo: GitHub responde 404 en ambos casos)',
};

function logProblem(message) {
  console.error(`[poemas] ${message}`);
}

class PoemasError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function createPoemasService({
  fetchImpl = globalThis.fetch,
  getToken = () => process.env.POEMAS_GITHUB_TOKEN,
  now = Date.now,
  owner = REPO_OWNER,
  repo = REPO_NAME,
  folder = REPO_FOLDER,
} = {}) {
  let copy = null; // { poems: [...ya ordenados], at }
  let retryAt = 0;
  let loading = null;

  async function github(path, accept) {
    const token = getToken();
    if (!token) {
      logProblem('falta la variable POEMAS_GITHUB_TOKEN');
      throw new PoemasError('poemas_unavailable', 503);
    }

    const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept,
        'User-Agent': 'nadineross-web',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      logProblem(`GitHub respondió ${response.status} al leer ${owner}/${repo}/${path}${HINTS[response.status] ?? ''}`);
      throw new PoemasError('poemas_unavailable', 503);
    }
    return response;
  }

  async function download() {
    const listing = await (await github(folder, 'application/vnd.github+json')).json();
    if (!Array.isArray(listing)) throw new PoemasError('poemas_unavailable', 503);

    const files = listing
      .filter((entry) => entry && entry.type === 'file')
      .map((entry) => ({ id: idDeArchivo(entry.name), name: entry.name }))
      .filter((file) => file.id)
      .slice(0, MAX_FILES);

    // Si un archivo no se puede descargar falla todo: mejor la copia vieja que una lista incompleta
    const poems = await Promise.all(files.map(async ({ id, name }) => {
      const response = await github([folder, name].filter(Boolean).join('/'), 'application/vnd.github.raw+json');
      return leerPoema(id, await response.text());
    }));

    return ordenarPublicados(poems);
  }

  async function load() {
    const time = now();
    if (copy && time - copy.at < CACHE_MS) return copy.poems;
    if (time < retryAt) {
      if (copy) return copy.poems;
      throw new PoemasError('poemas_unavailable', 503);
    }

    // Visitas a la vez comparten una sola petición a GitHub
    loading ??= download()
      .then((poems) => {
        copy = { poems, at: now() };
        retryAt = 0;
        return poems;
      })
      .catch((error) => {
        // Si GitHub falla y hay copia, se sirve la copia
        if (!(error instanceof PoemasError)) logProblem(`no se pudo conectar con GitHub (${error.name})`);
        retryAt = now() + RETRY_MS;
        if (copy) return copy.poems;
        throw error instanceof PoemasError ? error : new PoemasError('poemas_unavailable', 503);
      })
      .finally(() => {
        loading = null;
      });

    return loading;
  }

  return {
    async list() {
      return (await load()).map(({ id, titulo, fecha }) => ({ id, titulo, fecha }));
    },
    async get(id) {
      if (!esIdValido(id)) throw new PoemasError('invalid_request', 400);

      const poem = (await load()).find((item) => item.id === id);
      if (!poem) throw new PoemasError('poem_not_found', 404);
      return { id: poem.id, titulo: poem.titulo, fecha: poem.fecha, texto: poem.texto };
    },
  };
}

function createRouter(service = createPoemasService()) {
  const router = express.Router();

  function answer(action) {
    return async (req, res) => {
      res.set('Cache-Control', 'no-store');
      try {
        res.json(await action(req));
      } catch (error) {
        if (error instanceof PoemasError) {
          res.status(error.status).json({ error: error.code });
          return;
        }
        res.status(503).json({ error: 'poemas_unavailable' });
      }
    };
  }

  router.get('/', answer(() => service.list()));
  router.get('/:id', answer((req) => service.get(req.params.id)));

  return router;
}

module.exports = { createPoemasService, createRouter, PoemasError };
