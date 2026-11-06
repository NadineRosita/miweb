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
  ajedrez.html              Ajedrez, contra la máquina o por salas
  ciudadelas.html           Ciudadelas: salas de 2 a 7 jugadores, bots y tutorial
  jaja-que-tonto.html       Futuro escape room (de momento, «Próximamente»)
  css/styles.css            Estilos y colores de los temas
  css/mi-pet.css            Estilos del juego Mi Pet
  css/mi-pet-widget.css     Mascota flotante de las demás páginas
  css/ciudadelas.css        Estilos de Ciudadelas
  imagenes/                 Imágenes y favicon
  js/
    contenido-inicio.js     Textos de Inicio en español e inglés (edita este para cambiarlos)
    i18n.js                 Resto de textos en ambos idiomas y cambio de idioma
    layout.js               Barra de navegación y pie, comunes a todas las páginas
    script.js               Cursor, menú, tema claro/oscuro y sol/luna de fondo
    theme-init.js           Aplica el tema guardado antes de pintar la página
    inicio.js               Pinta las secciones de Inicio
    mi-pet.js               Inicio de sesión de Mi Pet; al entrar arranca el juego
    mi-pet/                 El juego en el navegador (ver «Mi Pet» más abajo)
    ajedrez/                Tablero, partida, conexión con salas y motor de la máquina
    ciudadelas/             Menú, partida, cartas, textos (es/en) y consejos del tutorial
server/                     Backend
  index.js                  Arranque del servidor
  db.js                     Conexión a PostgreSQL
  auth.js                   Cuentas y sesiones
  pet.js                    API de Mi Pet
  mi-pet/                   Reglas y datos del juego (ver «Mi Pet» más abajo)
  chess.js                  Salas de ajedrez: API y WebSocket
  chess-rooms.js            Reglas de las salas: jugadas, reloj y guardado
  ciudadelas.js             Salas de Ciudadelas: API y WebSocket
  ciudadelas/               Reglas (game.js), bots, cartas y salas en memoria
  sockets.js                Reparte los WebSocket entre ajedrez y Ciudadelas
db/
  migrate.js                Aplica las migraciones pendientes
  migrations/               Cambios de la base de datos, en orden
test/
  mi-pet/                   Pruebas de las reglas del juego (npm test)
  ciudadelas/               Pruebas de Ciudadelas: partidas completas de bots de 2 a 7 jugadores
```

## Tareas habituales

| Quiero cambiar…                    | Dónde                                        |
| ---------------------------------- | -------------------------------------------- |
| Textos de Sobre mí, Proyectos…     | `public/js/contenido-inicio.js`              |
| Pestañas y enlaces de redes        | `public/js/layout.js`                        |
| Textos de menú, pie y mensajes     | `public/js/i18n.js`                          |
| Velocidades, topes y pagos del juego | `server/mi-pet/config.js`                  |
| Objetos y precios de Mi Pet        | `server/mi-pet/data/items.js`                |
| Especies y evoluciones             | `server/mi-pet/data/species.js`              |
| Diálogos de las mascotas           | `server/mi-pet/data/dialogues.js`            |
| Logros, eventos, zonas y misiones  | `server/mi-pet/data/world.js`                |
| Dibujo de una mascota              | `public/js/mi-pet/sprites.js`                |
| Textos de la interfaz del juego    | `public/js/mi-pet/textos.js`                 |
| Horas del sol y la luna            | `initSky` en `public/js/script.js`           |
| Intensidad del sol y la luna       | `--sky-opacity` en `public/css/styles.css`   |
| Animaciones del final de partida   | `public/js/ajedrez/final.js`                 |
| Dificultad de la máquina           | `LEVELS` en `public/js/ajedrez/motor.js` |
| Tablas de la base de datos         | Archivo nuevo en `db/migrations/` (`004_…`)  |

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

## Mi Pet

Mi Pet es un juego de mascotas virtuales dentro de la web. Lo que hay que saber para tocarlo:

```
server/mi-pet/
  config.js      Todos los números del juego
  data/          Objetos, especies, diálogos, logros, eventos, zonas…
  catalog.js     Reúne los datos y los índices; es lo que recibe el navegador
  save.js        Formato de la partida, validación y migraciones
  sim.js         El paso del tiempo y los estados de la mascota
  progress.js    Monedas, experiencia, logros, misiones y requisitos
  actions.js     Todo lo que puede hacer el jugador
  view.js        Lo que se envía al navegador
public/js/mi-pet/
  juego.js       Armazón: estado, navegación, avisos y ventanas
  vistas/        Una pantalla por archivo
  minijuegos/    Un minijuego por archivo
  pixel.js       Pincel de pixel art
  sprites.js     Mascotas · muebles.js: muebles y fondos · iconos.js: iconos
  escena.js      La habitación viva · retrato.js: mascotas sueltas
  dialogos.js    Elige qué dice la mascota
  sonido.js      Sonidos sintetizados
  widget.js      Mascota flotante en las demás páginas
```

Decisiones que conviene conocer:

- **Las reglas están en el servidor.** El navegador pide acciones (`POST /api/pet/action`) y nunca fija
  un valor. Cada acción bloquea la fila de la partida, así que dos pestañas no gastan dos veces lo mismo.
- **La partida va en PostgreSQL, ligada a la cuenta**, no en LocalStorage: se conserva al cambiar de
  navegador. Es un JSON con versión en `pet_saves`, junto a la copia anterior válida. LocalStorage solo
  guarda dos marcas sin datos de partida, para que el widget sepa si debe cargarse.
- **Para cambiar el formato de la partida** sube `SAVE_VERSION` y añade una función a `MIGRATIONS` en
  `save.js`. Un campo nuevo opcional no lo necesita: `sanitizeSave` rellena lo que falte. Si llega una
  partida más nueva que el código, se rechaza sin escribir para no destruirla.
- **El tiempo no depende de tener la página abierta.** Cada petición simula lo transcurrido desde la
  última, hasta 48 horas. Una ausencia nunca baja una necesidad de 10.
- **La muerte es permanente pero difícil.** Enfermar exige varias necesidades muy bajas durante horas, y
  morir, además, muchas horas enferma sin medicina. Una sola ausencia no puede matarla, y si no te llega
  para la medicina hay un botiquín gratis al día.
- **Experiencia y nivel son del jugador**, no de cada mascota, para no perder el progreso si muere una.
  Cariño, personalidad, días de cuidados y habitación sí son de cada mascota.
- **Con varias mascotas, solo la activa pasa el tiempo.** Las demás están en la guardería. Exigir cuidar
  once a la vez sería una obligación, no un juego.
- **Los minijuegos corren en el navegador**, así que su puntuación no es de fiar del todo: el servidor
  rechaza lo imposible para el tiempo jugado, y los topes diarios limitan lo que se puede ganar con trampas.
  La captura de la pesca sí la decide el servidor.
- **Los gráficos se dibujan por código**, sin archivos de imagen: son originales y comparten pincel, silueta
  y paleta. Las fotos del álbum guardan la escena, no una imagen, y se vuelven a dibujar.
- **El juego tiene su propio aspecto en ambos temas**: es una pantalla azul encendida dentro de la página.
  Lo que la une al resto de la web es el color de acento en las barras de ventana.

Las pruebas de las reglas no necesitan base de datos:

```bash
npm test
```

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
