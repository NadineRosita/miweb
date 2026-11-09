# Poemas: cómo se gestionan

Los poemas viven en el repo **NadineRosita/poemas**, en la carpeta `poemas/`. La web solo los lee: todo
se hace desde GitHub (en el navegador o en la app del móvil). Un archivo `.md` = un poema.
`marea.md`, en esta carpeta, es un ejemplo.

## Formato

```
---
titulo: Marea
fecha: 2026-11-09
borrador: false
---
El poema, tal cual, con sus saltos de línea.

Las estrofas se separan con una línea en blanco.
```

- El **identificador** es el nombre del archivo sin `.md`, y solo puede llevar letras minúsculas, números y
  guiones (`marea.md`, `mar-de-fondo.md`). Con otro nombre, el poema se ignora.
- `fecha` va como `AAAA-MM-DD`. Los poemas salen ordenados por fecha, el más reciente primero.
- Un archivo mal escrito (sin cabecera, sin título, con fecha rara…) se ignora; no rompe los demás.

## Añadir
Repo `poemas` → carpeta `poemas/` → **Add file → Create new file** → nombre `algo.md` → pega el formato → **Commit changes**.
En la app de GitHub del móvil: abre el repo, entra en `poemas/`, pulsa **+** (o el menú **⋯**) → **New file**, escribe y haz commit.

## Editar
Abre el archivo → icono del lápiz (en la app: **⋯ → Edit file**) → cambia lo que quieras → **Commit changes**.

## Ocultar (borrador)
Pon `borrador: true` en la cabecera y haz commit. El poema deja de verse en la web, pero sigue guardado.
Para volver a mostrarlo, vuelve a poner `borrador: false`.

## Borrar
Abre el archivo → **⋯ → Delete file** → **Commit changes**. (Si te arrepientes, el historial de GitHub lo conserva.)

## ¿Cuándo se ve el cambio?
La web guarda una copia de 1 minuto, así que **un cambio puede tardar hasta 1 minuto** en aparecer.
