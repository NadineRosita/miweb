// Varios WebSocket (ajedrez, Ciudadelas) comparten el mismo servidor HTTP.
// Cada uno se registra con su ruta y aquí se reparte cada conexión entrante.

const handlers = new WeakMap(); // servidor HTTP -> Map de ruta -> WebSocketServer

function registerSocketServer(server, path, sockets) {
  let routes = handlers.get(server);

  if (!routes) {
    routes = new Map();
    handlers.set(server, routes);

    server.on('upgrade', (request, socket, head) => {
      const target = routes.get(new URL(request.url, 'http://localhost').pathname);

      if (!target) {
        socket.destroy();
        return;
      }
      target.handleUpgrade(request, socket, head, (ws) => target.emit('connection', ws, request));
    });
  }

  routes.set(path, sockets);
}

module.exports = { registerSocketServer };
