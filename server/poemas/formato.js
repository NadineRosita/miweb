// Lectura del formato de un poema (un archivo .md con cabecera). Sin red ni
// dependencias: solo recibe texto y devuelve datos, para poder probarlo solo.
//
//   ---
//   titulo: Marea
//   fecha: 2026-11-09
//   borrador: false
//   ---
//   (el poema, tal cual)

const ID_VALIDO = /^[a-z0-9-]+$/;
const FECHA_VALIDA = /^(\d{4})-(\d{2})-(\d{2})$/;
const CABECERA = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

function esIdValido(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100 && ID_VALIDO.test(id);
}

function esFechaReal(fecha) {
  const partes = FECHA_VALIDA.exec(fecha);
  if (!partes) return false;

  const [, anyo, mes, dia] = partes.map(Number);
  const fechaUtc = new Date(Date.UTC(anyo, mes - 1, dia));
  return fechaUtc.getUTCFullYear() === anyo && fechaUtc.getUTCMonth() === mes - 1 && fechaUtc.getUTCDate() === dia;
}

function quitarComillas(valor) {
  const comillas = valor.match(/^(["'])(.*)\1$/);
  return comillas ? comillas[2] : valor;
}

// Nombre de archivo -> identificador, o null si no es un .md con nombre válido
function idDeArchivo(nombre) {
  if (typeof nombre !== 'string' || !nombre.endsWith('.md')) return null;

  const id = nombre.slice(0, -3);
  return esIdValido(id) ? id : null;
}

// Devuelve { id, titulo, fecha, borrador, texto }, o null si el archivo está mal escrito
function leerPoema(id, contenido) {
  if (!esIdValido(id) || typeof contenido !== 'string') return null;

  const limpio = contenido.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const cabecera = CABECERA.exec(limpio);
  if (!cabecera) return null;

  const campos = {};
  for (const linea of cabecera[1].split('\n')) {
    if (!linea.trim()) continue;

    const separador = linea.indexOf(':');
    if (separador === -1) return null;
    campos[linea.slice(0, separador).trim().toLowerCase()] = quitarComillas(linea.slice(separador + 1).trim());
  }

  const { titulo, fecha } = campos;
  if (!titulo || !fecha || !esFechaReal(fecha)) return null;

  const borrador = (campos.borrador ?? 'false').toLowerCase();
  if (borrador !== 'true' && borrador !== 'false') return null;

  // Se quitan las líneas vacías de los extremos; los saltos y las estrofas de dentro se respetan
  const texto = limpio.slice(cabecera[0].length).replace(/^(?:[ \t]*\n)+/, '').trimEnd();
  if (!texto) return null;

  return { id, titulo, fecha, borrador: borrador === 'true', texto };
}

// Quita borradores y ordena por fecha, el más reciente primero
function ordenarPublicados(poemas) {
  return poemas
    .filter((poema) => poema && !poema.borrador)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id));
}

module.exports = { esIdValido, idDeArchivo, leerPoema, ordenarPublicados };
