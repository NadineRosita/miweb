// Pruebas de la lectura de poemas. No necesitan red ni GitHub: npm test

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const express = require('express');
const { esIdValido, idDeArchivo, leerPoema, ordenarPublicados } = require('../../server/poemas/formato');
const { createPoemasService, createRouter } = require('../../server/poemas');

const MAREA = '---\ntitulo: Marea\nfecha: 2026-11-09\nborrador: false\n---\nLa luna sube\ny baja el mar.\n\nSegunda estrofa.\n';

describe('formato de un poema', () => {
  it('lee una cabecera válida y respeta saltos de línea y estrofas', () => {
    assert.deepEqual(leerPoema('marea', MAREA), {
      id: 'marea',
      titulo: 'Marea',
      fecha: '2026-11-09',
      borrador: false,
      texto: 'La luna sube\ny baja el mar.\n\nSegunda estrofa.',
    });
  });

  it('acepta CRLF, BOM, comillas y borrador ausente', () => {
    const poema = leerPoema('a', '﻿---\r\ntitulo: "Con: dos puntos"\r\nfecha: 2026-01-02\r\n---\r\nUno\r\nDos\r\n');
    assert.equal(poema.titulo, 'Con: dos puntos');
    assert.equal(poema.borrador, false);
    assert.equal(poema.texto, 'Uno\nDos');
  });

  it('marca los borradores', () => {
    assert.equal(leerPoema('b', MAREA.replace('borrador: false', 'borrador: true')).borrador, true);
  });

  it('ignora los archivos mal escritos', () => {
    const malos = [
      'sin cabecera',
      '---\ntitulo: Sin cierre\nfecha: 2026-01-01\nTexto',
      '---\nfecha: 2026-01-01\n---\nSin título',
      '---\ntitulo: X\n---\nSin fecha',
      '---\ntitulo: X\nfecha: 2026-02-30\n---\nFecha imposible',
      '---\ntitulo: X\nfecha: ayer\n---\nFecha rara',
      '---\ntitulo: X\nfecha: 2026-01-01\nborrador: quizá\n---\nBorrador raro',
      '---\ntitulo: X\nfecha: 2026-01-01\n---\n\n\n',
      '---\ntitulo X\nfecha: 2026-01-01\n---\nLínea sin dos puntos',
    ];
    malos.forEach((contenido) => assert.equal(leerPoema('x', contenido), null, contenido));
    assert.equal(leerPoema('x', undefined), null);
  });

  it('ordena por fecha, el más reciente primero, y oculta borradores', () => {
    const poema = (id, fecha, borrador = false) => ({ id, titulo: id, fecha, borrador, texto: 't' });
    const orden = ordenarPublicados([
      poema('viejo', '2025-01-01'),
      poema('nuevo', '2026-11-09'),
      poema('oculto', '2026-12-01', true),
      null,
      poema('medio', '2026-03-05'),
    ]);
    assert.deepEqual(orden.map((p) => p.id), ['nuevo', 'medio', 'viejo']);
  });

  it('solo admite identificadores de minúsculas, números y guiones', () => {
    ['marea', 'mar-2', '2026-11-09'].forEach((id) => assert.equal(esIdValido(id), true, id));
    ['', 'Marea', '../secreto', 'a/b', 'a.md', 'a b', 'ñu', '%2e%2e', null, undefined, 'a'.repeat(101)]
      .forEach((id) => assert.equal(esIdValido(id), false, String(id)));
  });

  it('saca el identificador del nombre del archivo', () => {
    assert.equal(idDeArchivo('marea.md'), 'marea');
    ['README.md', 'marea.txt', 'a b.md', '.md', 'marea'].forEach((nombre) => assert.equal(idDeArchivo(nombre), null, nombre));
  });
});

// GitHub simulado: devuelve el listado de la carpeta y cada archivo
function fakeGithub(archivos, { fallar = false, carpeta = '' } = {}) {
  const llamadas = [];
  const fetchImpl = async (url, opciones) => {
    llamadas.push({ url, opciones });
    if (fallar) throw new Error('sin red: ghp_SECRETO');

    const ruta = url.split('/contents/')[1];
    if (ruta === carpeta) {
      return new Response(JSON.stringify(Object.keys(archivos).map((name) => ({ name, type: 'file' }))), { status: 200 });
    }

    const contenido = archivos[carpeta ? ruta.replace(`${carpeta}/`, '') : ruta];
    if (contenido === undefined) return new Response('{}', { status: 404 });
    return new Response(contenido, { status: 200 });
  };
  return { fetchImpl, llamadas };
}

const ARCHIVOS = {
  'marea.md': MAREA,
  'alba.md': '---\ntitulo: Alba\nfecha: 2026-12-01\n---\nLuz.',
  'oculto.md': '---\ntitulo: Oculto\nfecha: 2027-01-01\nborrador: true\n---\nNo.',
  'roto.md': 'esto no es un poema',
  'LEEME.md': '---\ntitulo: X\nfecha: 2026-01-01\n---\nNo es un id válido',
  'notas.txt': 'nada',
};

function servicio(opciones = {}) {
  const github = fakeGithub(opciones.archivos ?? ARCHIVOS, opciones);
  const reloj = { t: 1_000_000 };
  const service = createPoemasService({
    fetchImpl: github.fetchImpl,
    getToken: () => ('token' in opciones ? opciones.token : 'ghp_SECRETO'),
    now: () => reloj.t,
  });
  return { service, reloj, ...github };
}

describe('servicio de poemas', () => {
  it('lista los poemas publicados por fecha, sin borradores ni archivos rotos', async () => {
    const { service } = servicio();
    assert.deepEqual(await service.list(), [
      { id: 'alba', titulo: 'Alba', fecha: '2026-12-01' },
      { id: 'marea', titulo: 'Marea', fecha: '2026-11-09' },
    ]);
  });

  it('devuelve un poema con su texto', async () => {
    const { service } = servicio();
    const poema = await service.get('marea');
    assert.equal(poema.texto, 'La luna sube\ny baja el mar.\n\nSegunda estrofa.');
  });

  it('no encuentra un borrador ni un poema que no existe', async () => {
    const { service } = servicio();
    await assert.rejects(service.get('oculto'), { code: 'poem_not_found', status: 404 });
    await assert.rejects(service.get('nada'), { code: 'poem_not_found', status: 404 });
  });

  it('rechaza identificadores no válidos sin pedir nada a GitHub', async () => {
    const { service, llamadas } = servicio();
    for (const id of ['../x', 'Marea', 'a/b', 'marea.md', '']) {
      await assert.rejects(service.get(id), { code: 'invalid_request', status: 400 });
    }
    assert.equal(llamadas.length, 0);
  });

  it('guarda 1 minuto la respuesta y luego vuelve a pedirla', async () => {
    const { service, reloj, llamadas } = servicio();
    await service.list();
    const primeras = llamadas.length;
    await service.get('marea');
    reloj.t += 50 * 1000;
    await service.list();
    assert.equal(llamadas.length, primeras);

    reloj.t += 20 * 1000;
    await service.list();
    assert.equal(llamadas.length, primeras * 2);
  });

  it('visitas simultáneas comparten una sola lectura', async () => {
    const { service, llamadas } = servicio();
    await Promise.all([service.list(), service.list(), service.get('marea')]);
    assert.equal(llamadas.length, 5); // el listado y los 4 archivos .md con nombre válido
  });

  it('sirve la copia vieja cuando GitHub deja de responder', async () => {
    let caido = false;
    const github = fakeGithub(ARCHIVOS);
    const reloj = { t: 0 };
    const service = createPoemasService({
      fetchImpl: (...args) => (caido ? Promise.reject(new Error('caído')) : github.fetchImpl(...args)),
      getToken: () => 'ghp_SECRETO',
      now: () => reloj.t,
    });

    assert.equal((await service.list()).length, 2);
    caido = true;
    reloj.t += 70 * 1000;
    assert.equal((await service.list()).length, 2);
  });

  it('sin token da un error claro y no llama a GitHub', async () => {
    const { service, llamadas } = servicio({ token: undefined });
    await assert.rejects(service.list(), { code: 'poemas_unavailable', status: 503 });
    assert.equal(llamadas.length, 0);
  });

  it('usa el token solo en la cabecera hacia GitHub', async () => {
    const { service, llamadas } = servicio();
    await service.list();
    assert.equal(llamadas[0].opciones.headers.Authorization, 'Bearer ghp_SECRETO');
    assert.match(llamadas[0].url, /^https:\/\/api\.github\.com\/repos\/NadineRosita\/poemas\/contents\/$/);
  });
});

describe('carpeta del repo', () => {
  it('si los poemas están dentro de una carpeta, la lee', async () => {
    const github = fakeGithub(ARCHIVOS, { carpeta: 'poemas' });
    const service = createPoemasService({ fetchImpl: github.fetchImpl, getToken: () => 'tok', folder: 'poemas' });
    assert.equal((await service.list()).length, 2);
    assert.match(github.llamadas[1].url, /contents\/poemas\/[a-z]+\.md$/);
  });
});

describe('API de poemas', () => {
  async function conServidor(service, prueba) {
    const app = express();
    app.use('/api/poemas', createRouter(service));
    const server = app.listen(0);
    try {
      await prueba(`http://127.0.0.1:${server.address().port}/api/poemas`);
    } finally {
      server.close();
    }
  }

  it('responde la lista y un poema', async () => {
    await conServidor(servicio().service, async (base) => {
      const lista = await (await fetch(base)).json();
      assert.equal(lista[0].id, 'alba');

      const poema = await (await fetch(`${base}/marea`)).json();
      assert.equal(poema.titulo, 'Marea');
    });
  });

  it('solo se puede leer: escribir, editar o borrar no existe', async () => {
    await conServidor(servicio().service, async (base) => {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        assert.equal((await fetch(`${base}/marea`, { method })).status, 404, method);
      }
    });
  });

  it('un identificador no válido da 400 y uno inexistente 404', async () => {
    await conServidor(servicio().service, async (base) => {
      assert.equal((await fetch(`${base}/Marea`)).status, 400);
      assert.equal((await fetch(`${base}/..%2Fsecreto`)).status, 400);
      assert.equal((await fetch(`${base}/nada`)).status, 404);
    });
  });

  it('si todo falla responde un error en JSON sin filtrar el token ni detalles', async () => {
    await conServidor(servicio({ fallar: true }).service, async (base) => {
      const respuesta = await fetch(base);
      const texto = await respuesta.text();
      assert.equal(respuesta.status, 503);
      assert.deepEqual(JSON.parse(texto), { error: 'poemas_unavailable' });
      assert.doesNotMatch(texto, /ghp_|SECRETO|red/);
    });
  });

  it('sin token responde el mismo error claro', async () => {
    await conServidor(servicio({ token: '' }).service, async (base) => {
      const respuesta = await fetch(base);
      assert.equal(respuesta.status, 503);
      assert.deepEqual(await respuesta.json(), { error: 'poemas_unavailable' });
    });
  });
});
