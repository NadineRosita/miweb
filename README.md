# NadineRoss

Web personal con páginas estáticas y un pequeño servidor para las cuentas y la mascota de Mi Pet.

- **Frontend:** HTML, CSS y JavaScript sin frameworks.
- **Backend:** Node.js, Express y PostgreSQL.
- **Despliegue:** Railway.

## Dónde está cada cosa

```
public/                     Todo lo que ve el navegador
  index.html                Inicio: Sobre mí, Proyectos y Contacto
  juegos.html               Juegos
  aplicaciones.html         Aplicaciones
  mi-pet.html               Mi Pet: acceso y mascota
  jaja-que-tonto.html       Futuro escape room (de momento, «Próximamente»)
  css/styles.css            Estilos y colores de los temas
  imagenes/                 Imágenes y favicon
  js/
    contenido-inicio.js     Textos de Inicio en español e inglés (edita este para cambiarlos)
    i18n.js                 Resto de textos en ambos idiomas y cambio de idioma
    layout.js               Barra de navegación y pie, comunes a todas las páginas
    script.js               Cursor, menú, tema claro/oscuro y sol/luna de fondo
    theme-init.js           Aplica el tema guardado antes de pintar la página
    inicio.js               Pinta las secciones de Inicio
    mi-pet.js               Lógica de la página Mi Pet
server/                     Backend
  index.js                  Arranque del servidor
  db.js                     Conexión a PostgreSQL
  auth.js                   Cuentas y sesiones
  pet.js                    Estado y acciones de la mascota
db/
  migrate.js                Aplica las migraciones pendientes
  migrations/               Cambios de la base de datos, en orden
```

## Tareas habituales

| Quiero cambiar…                    | Dónde                                        |
| ---------------------------------- | -------------------------------------------- |
| Textos de Sobre mí, Proyectos…     | `public/js/contenido-inicio.js`              |
| Pestañas y enlaces de redes        | `public/js/layout.js`                        |
| Textos de menú, pie y mensajes     | `public/js/i18n.js`                          |
| Efecto de las acciones de Mi Pet   | `ACTIONS` en `server/pet.js`                 |
| Horas del sol y la luna            | `initSky` en `public/js/script.js`           |
| Intensidad del sol y la luna       | `--sky-opacity` en `public/css/styles.css`   |
| Tablas de la base de datos         | Archivo nuevo en `db/migrations/` (`003_…`)  |

No edites una migración ya aplicada, porque no se volvería a ejecutar. Añade siempre una nueva.

## Trabajar en local

Necesitas Node.js 22 o superior.

```bash
npm install
npm run dev
```

La web queda en <http://localhost:3000>. Sin base de datos funciona todo menos Mi Pet.

Para probar Mi Pet en local necesitas un PostgreSQL propio: copia `.env.example` como `.env`
y pon tu `DATABASE_URL`. Las migraciones se aplican solas al arrancar.

## Desplegar en Railway

Las migraciones **se ejecutan solas cada vez que arranca el servidor** y no repiten las ya
aplicadas. No hay que lanzar ningún comando: solo crear la base de datos y conectarla.

No se usa `railway.json`: Railway ha dejado obsoleto ese formato y los servicios nuevos ya no
pueden usarlo.

### 1. Sube el código a GitHub

Railway despliega desde el repositorio, así que tus cambios deben estar en GitHub.

### 2. Crea el servicio de la web

Si ya lo tienes, salta al paso 3.

1. En [railway.com](https://railway.com), pulsa **New Project → Deploy from GitHub repo**.
2. Elige el repositorio `miweb`.

### 3. Añade PostgreSQL

1. Dentro del proyecto, pulsa **+ New → Database → PostgreSQL** (también con `Ctrl + K`).
2. Espera a que el servicio aparezca como activo.

### 4. Conecta la web con la base de datos

1. Abre el servicio de la web, no el de PostgreSQL, y entra en **Variables**.
2. Pulsa **New Variable** y añade:

   | Nombre         | Valor                          |
   | -------------- | ------------------------------ |
   | `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` |

   Si tu servicio de base de datos tiene otro nombre, cambia `Postgres` por ese nombre.
3. Pulsa **Deploy** para aplicar los cambios. Las variables no surten efecto hasta entonces.

No hace falta definir `PORT`: Railway lo pone por ti.

### 5. Publica la web

1. En el servicio de la web, entra en **Settings → Networking**.
2. Pulsa **Generate Domain**.

### 6. Comprueba que funciona

1. Abre `https://TU-DOMINIO/api/health`. Debe mostrar `{"status":"ok","database":true}`.
2. Entra en Mi Pet, crea una cuenta y recarga la página: debes seguir dentro con tu progreso.

Opcional: en **Settings → Deploy**, pon `/api/health` como *Healthcheck Path* para que Railway
solo publique versiones que arrancan bien.

### Si algo falla

| Síntoma                                       | Causa probable y solución                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/api/health` muestra `"database":false`      | Falta `DATABASE_URL` en el servicio de la web, o no se ha desplegado el cambio (paso 4).       |
| El despliegue falla con `No se pudo arrancar` | No conecta con PostgreSQL o falló una migración. Mira **Deploy Logs** y revisa el valor del paso 4. |
| La web no arranca o sale una página antigua   | Si este servicio era estático, deja vacío **Start Command** en **Settings** para usar `npm start`. |
| Mi Pet dice «Demasiados intentos»             | Es el límite de 20 intentos cada 15 minutos. Espera y vuelve a probar.                         |
