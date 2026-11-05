// Ejecuta el motor en segundo plano, en el navegador de quien juega:
// no carga el servidor y la página no se congela mientras piensa.
//
// Recibe { id, fen, level } y responde { id, move: { from, to, promotion } }.
// Para cambiarlo por otro motor basta con mantener ese mismo intercambio de mensajes.

import { chooseMove } from './motor.js';

onmessage = ({ data: { id, fen, level } }) => {
  postMessage({ id, move: chooseMove(fen, level) });
};
