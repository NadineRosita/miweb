// Conexión con una sala: mantiene el WebSocket abierto y se reconecta sola.
// Los tokens se guardan en este navegador, así que recargar devuelve a la partida.

const TOKEN_PREFIX = 'ajedrez-sala-';
const SOCKET_PATH = '/ws/ajedrez';
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 10000;

export const savedToken = (code) => localStorage.getItem(TOKEN_PREFIX + code);
export const saveToken = (code, token) => localStorage.setItem(TOKEN_PREFIX + code, token);
export const forgetToken = (code) => localStorage.removeItem(TOKEN_PREFIX + code);

export class RoomConnection {
  constructor({ code, token, onState, onError, onConnection }) {
    Object.assign(this, { code, token, onState, onError, onConnection });
    this.closed = false;
    this.retryMs = RECONNECT_MIN_MS;
    this.open();
  }

  open() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${location.host}${SOCKET_PATH}`);

    this.socket = socket;

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'hello', code: this.code, token: this.token }));
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'state') {
        this.retryMs = RECONNECT_MIN_MS;
        this.onConnection(true);
        this.onState(message);
      } else if (message.type === 'error') {
        this.onError(message.code);
      }
    });

    socket.addEventListener('close', () => {
      if (this.closed) return;

      this.onConnection(false);
      setTimeout(() => {
        if (!this.closed) this.open();
      }, this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, RECONNECT_MAX_MS);
    });
  }

  send(message) {
    if (this.socket.readyState !== WebSocket.OPEN) return false;

    this.socket.send(JSON.stringify(message));
    return true;
  }

  close() {
    this.closed = true;
    this.socket.close();
  }
}
