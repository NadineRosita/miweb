// Lienzo de pixel art: una rejilla de colores con primitivas pequeñas.
// Todos los gráficos del juego (mascotas, muebles, iconos) se dibujan con esto, para que
// compartan resolución, silueta y sombreado. Son originales: no hay imágenes externas.

export const OUTLINE = '#1a1a3a';

export class Pixels {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(null);
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.cells[y * this.width + x];
  }

  px(x, y, color) {
    const col = Math.round(x);
    const row = Math.round(y);

    if (col < 0 || row < 0 || col >= this.width || row >= this.height) return this;
    this.cells[row * this.width + col] = color;
    return this;
  }

  rect(x, y, w, h, color) {
    for (let row = 0; row < h; row += 1) {
      for (let col = 0; col < w; col += 1) this.px(x + col, y + row, color);
    }
    return this;
  }

  ellipse(cx, cy, rx, ry, color) {
    const left = Math.floor(cx - rx);
    const right = Math.ceil(cx + rx);
    const top = Math.floor(cy - ry);
    const bottom = Math.ceil(cy + ry);

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const dx = (x - cx) / (rx + 0.25);
        const dy = (y - cy) / (ry + 0.25);
        if (dx * dx + dy * dy <= 1) this.px(x, y, color);
      }
    }
    return this;
  }

  // Elipse cortada por abajo: la forma base de gotas y cabezas
  dome(cx, baseY, rx, ry, color) {
    for (let y = Math.floor(baseY - ry); y <= baseY; y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / (rx + 0.25);
        const dy = (y - baseY) / (ry + 0.25);
        if (dx * dx + dy * dy <= 1) this.px(x, y, color);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, color) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);

    for (let step = 0; step <= steps; step += 1) {
      this.px(x0 + ((x1 - x0) * step) / steps, y0 + ((y1 - y0) * step) / steps, color);
    }
    return this;
  }

  triangle(ax, ay, bx, by, cx, cy, color) {
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1) * 2;

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      this.line(ax + (bx - ax) * t, ay + (by - ay) * t, cx, cy, color);
    }
    return this;
  }

  // Convierte en sombra el borde inferior y en brillo el superior izquierdo de un color
  shade(main, dark, light) {
    const original = [...this.cells];
    const at = (x, y) => (x < 0 || y < 0 || x >= this.width || y >= this.height ? null : original[y * this.width + x]);

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (at(x, y) === main) {
          if (at(x, y + 2) !== main || at(x + 3, y) !== main) this.cells[y * this.width + x] = dark;
          else if (light && (at(x - 2, y - 2) === null) && at(x, y - 1) !== null) this.cells[y * this.width + x] = light;
        }
      }
    }
    return this;
  }

  // Silueta oscura alrededor de todo lo dibujado
  outline(color = OUTLINE) {
    const original = [...this.cells];
    const filled = (x, y) => x >= 0 && y >= 0 && x < this.width && y < this.height && original[y * this.width + x] !== null;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) {
          this.cells[y * this.width + x] = color;
        }
      }
    }
    return this;
  }

  // Cambia un color por lo que devuelva fn(x, y)
  recolor(color, fn) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.cells[y * this.width + x] === color) this.cells[y * this.width + x] = fn(x, y);
      }
    }
    return this;
  }

  blit(other, x, y) {
    for (let row = 0; row < other.height; row += 1) {
      for (let col = 0; col < other.width; col += 1) {
        const color = other.get(col, row);
        if (color) this.px(x + col, y + row, color);
      }
    }
    return this;
  }

  toCanvas(flip = false) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const color = this.cells[y * this.width + x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(flip ? this.width - 1 - x : x, y, 1, 1);
        }
      }
    }
    return canvas;
  }
}

// Mezcla dos colores #rrggbb; amount 1 da el segundo
export function mix(a, b, amount) {
  const channel = (color, index) => parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
  const part = (index) => Math.round(channel(a, index) + (channel(b, index) - channel(a, index)) * amount)
    .toString(16).padStart(2, '0');

  return `#${part(0)}${part(1)}${part(2)}`;
}
