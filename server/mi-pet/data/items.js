// Catálogo de objetos. Los nombres van como [español, inglés].
//
// cat       categoría de la tienda y el inventario
// price     precio en meloncillos (null: no se vende, solo se consigue jugando)
// effect    lo que hace al usarlo: estadísticas sumadas, cure o health
// action    objetos especiales: qué acción dispara al usarlo
// level     nivel mínimo para comprarlo
// slot      accesorios: dónde se lleva. Solo uno por hueco.
// layer     muebles: wall (pared), floor (suelo) o rug (bajo los demás)
// w, h      muebles: celdas que ocupa en esa capa
// use       muebles: qué pasa al pulsarlo en la habitación

const food = (id, name, price, effect, desc, extra = {}) => ({ id, cat: 'food', name, price, effect, desc, ...extra });
const drink = (id, name, price, effect, desc, extra = {}) => ({ id, cat: 'drink', name, price, effect, desc, ...extra });
const med = (id, name, price, effect, desc, extra = {}) => ({ id, cat: 'medicine', name, price, effect, desc, ...extra });
const acc = (id, name, price, slot, desc, level = 3) => ({ id, cat: 'accessory', name, price, slot, level, desc });
const fur = (id, name, price, layer, w, h, desc, extra = {}) => ({ id, cat: 'furniture', name, price, layer, w, h, desc, ...extra });
const special = (id, name, price, action, desc, extra = {}) => ({ id, cat: 'special', name, price, action, desc, ...extra });

const ITEMS = [
  food('apple', ['Manzana', 'Apple'], 5, { hunger: 10 }, ['Crujiente. Sin gusanos, casi seguro.', 'Crunchy. Worm-free, almost certainly.']),
  food('strawberries', ['Fresas', 'Strawberries'], 8, { hunger: 15 }, ['Un puñado de felicidad roja.', 'A handful of red joy.']),
  food('pizza', ['Pizza', 'Pizza'], 15, { hunger: 25 }, ['Con piña. No abras ese debate.', 'Pineapple on top. Do not open that debate.']),
  food('cake', ['Tarta', 'Cake'], 20, { hunger: 20, happiness: 10 }, ['Para celebrar que es martes.', 'To celebrate it being Tuesday.']),
  food('candy', ['Chuches', 'Candy'], 10, { happiness: 15 }, ['Nutritivamente discutible. Emocionalmente perfecto.', 'Nutritionally debatable. Emotionally perfect.']),
  food('cookie', ['Galleta del sistema', 'System cookie'], 6, { hunger: 8, fun: 4 }, ['Aceptar todas las galletas.', 'Accept all cookies.'], { level: 5 }),
  food('ramen', ['Ramen de medianoche', 'Midnight ramen'], 18, { hunger: 30, energy: 5 }, ['Tres minutos de espera. Una eternidad.', 'Three minutes of waiting. An eternity.'], { level: 5 }),
  drink('coffee', ['Café', 'Coffee'], 12, { energy: 20 }, ['Compila mascotas en tiempo real.', 'Compiles pets in real time.']),
  drink('milk', ['Leche de estrellas', 'Star milk'], 9, { energy: 8, hunger: 8 }, ['Agitar antes de contemplar el cosmos.', 'Shake before contemplating the cosmos.']),
  drink('soda', ['Refresco pixelado', 'Pixel soda'], 11, { fun: 10, energy: 8 }, ['Las burbujas son cuadradas.', 'The bubbles are square.'], { level: 5 }),
  drink('potion', ['Poción mágica', 'Magic potion'], 35, { hunger: 20, energy: 20, hygiene: 20, fun: 20, happiness: 10 }, ['Recupera varias estadísticas. Sabe a lunes.', 'Restores several stats. Tastes like Monday.']),
  med('medicine', ['Medicina', 'Medicine'], 25, { cure: true }, ['Cura cualquier enfermedad. Efecto secundario: cara de asco.', 'Cures any illness. Side effect: disgusted face.']),
  med('bandage', ['Tirita de bits', 'Bit bandage'], 12, { health: 20, happiness: 4 }, ['Recupera salud. No arregla errores 404.', 'Restores health. Does not fix 404 errors.']),
  med('elixir', ['Antivirus concentrado', 'Concentrated antivirus'], 60, { cure: true, health: 100, hygiene: 30 }, ['Cura y deja la salud como recién instalada.', 'Cures and restores health like a fresh install.'], { level: 5 }),

  acc('sunglasses', ['Gafas de sol', 'Sunglasses'], 45, 'eyes', ['Para ignorar los problemas con estilo.', 'To ignore problems with style.']),
  acc('heartGlasses', ['Gafas de corazón', 'Heart glasses'], 55, 'eyes', ['Todo se ve mejor así.', 'Everything looks better like this.']),
  acc('beanie', ['Gorrito', 'Beanie'], 35, 'head', ['Calentito y algo torcido.', 'Toasty and slightly crooked.']),
  acc('partyHat', ['Gorrito de fiesta', 'Party hat'], 40, 'head', ['Siempre es el cumpleaños de alguien.', 'It is always someone\'s birthday.']),
  acc('headphones', ['Auriculares', 'Headphones'], 60, 'head', ['Lo-fi beats para mascotas que estudian.', 'Lo-fi beats for pets who study.']),
  acc('crown', ['Corona', 'Crown'], 150, 'head', ['Monarquía absoluta de la habitación.', 'Absolute monarchy of the room.'], 7),
  acc('bow', ['Lazo', 'Bow'], 30, 'neck', ['Un detalle adorable.', 'An adorable touch.']),
  acc('scarf', ['Bufanda', 'Scarf'], 40, 'neck', ['Aunque haga calor. Es por la estética.', 'Even when it is hot. It is for the aesthetic.']),
  acc('wings', ['Alas', 'Wings'], 110, 'back', ['Decorativas. No lo intentes desde la estantería.', 'Decorative. Do not try it from the shelf.'], 7),
  acc('backpack', ['Mochila', 'Backpack'], 65, 'back', ['Contiene merienda y sueños.', 'Contains snacks and dreams.']),
  acc('costume', ['Disfraz de sábana', 'Bedsheet costume'], 90, 'body', ['Bu. O algo así.', 'Boo. Or something like that.'], 7),

  fur('bedBasic', ['Cama básica', 'Basic bed'], 30, 'floor', 3, 2, ['Duerme un 20 % mejor.', 'Sleep 20% better.'], { sleepBonus: 1.2 }),
  fur('bedCloud', ['Cama de nube', 'Cloud bed'], 100, 'floor', 3, 2, ['Duerme un 60 % mejor. Puede llover un poco.', 'Sleep 60% better. May drizzle.'], { sleepBonus: 1.6 }),
  fur('rug', ['Alfombra', 'Rug'], 20, 'rug', 4, 2, ['Da unidad a toda la habitación.', 'Really ties the room together.']),
  fur('sofa', ['Sofá', 'Sofa'], 50, 'floor', 3, 1, ['Divierte un poco al usarlo.', 'A little fun when used.'], { use: 'sofa' }),
  fur('shelf', ['Estantería', 'Bookshelf'], 40, 'floor', 2, 1, ['Permite consultar curiosidades.', 'Lets you read trivia.'], { use: 'trivia' }),
  fur('computer', ['Ordenador gaming', 'Gaming computer'], 150, 'floor', 2, 1, ['Da acceso al Arcade y desbloquea el Buscaminas.', 'Opens the Arcade and unlocks Minesweeper.'], { use: 'computer' }),
  fur('aquarium', ['Acuario', 'Aquarium'], 80, 'floor', 2, 1, ['Mirar peces divierte mucho. Científicamente.', 'Watching fish is very fun. Scientifically.'], { use: 'aquarium' }),
  fur('arcadeMachine', ['Máquina recreativa', 'Arcade machine'], 120, 'floor', 2, 1, ['Desbloquea el juego Esquivar.', 'Unlocks the Dodge game.'], { use: 'arcade' }),
  fur('window', ['Ventana con vistas', 'Window with a view'], 60, 'wall', 3, 2, ['Muestra el cielo de verdad, según tu hora.', 'Shows the real sky, based on your clock.']),
  fur('starLamp', ['Lámpara de estrellas', 'Star lamp'], 45, 'floor', 1, 1, ['Da una luz muy cósmica.', 'Gives a very cosmic light.']),
  fur('poster', ['Póster retro', 'Retro poster'], 25, 'wall', 2, 2, ['«Keep calm and ctrl+z».', '"Keep calm and ctrl+z".'], { level: 7 }),
  fur('plant', ['Planta de oficina', 'Office plant'], 28, 'floor', 1, 1, ['Sobrevive a todo, como el software antiguo.', 'Survives everything, like legacy software.'], { level: 7 }),

  special('growthPotion', ['Poción de crecimiento', 'Growth potion'], 120, 'evolve', ['Permite evolucionar a la mascota si cumple los requisitos.', 'Lets your pet evolve if it meets the requirements.'], { level: 10 }),
  special('rainbowPotion', ['Poción arcoíris', 'Rainbow potion'], 50, 'rainbow', ['Cambia sus colores durante 24 horas.', 'Changes its colors for 24 hours.']),
  special('personalityCrystal', ['Cristal de personalidad', 'Personality crystal'], 90, 'personality', ['Modifica su personalidad. No admite devoluciones.', 'Changes its personality. No refunds.']),
  special('timeMachine', ['Máquina del tiempo', 'Time machine'], 70, 'timeMachine', ['Rellena la necesidad más baja.', 'Refills the lowest need.']),
  special('mysteryBox', ['Caja misteriosa', 'Mystery box'], 40, 'mystery', ['Contiene un objeto aleatorio. O una decepción.', 'Contains a random item. Or a disappointment.']),
  special('luckyCharm', ['Amuleto de la suerte', 'Lucky charm'], 80, 'luck', ['Mejora las recompensas durante 12 horas.', 'Boosts rewards for 12 hours.']),
  special('goldenTicket', ['Ticket dorado', 'Golden ticket'], null, 'ticket', ['Desbloquea una mascota especial. Solo se encuentra, no se compra.', 'Unlocks a special pet. It can only be found, not bought.']),
];

// Lo que puede salir de una caja misteriosa, con su peso
const MYSTERY_POOL = [
  { id: 'apple', weight: 14 }, { id: 'strawberries', weight: 12 }, { id: 'pizza', weight: 10 },
  { id: 'cake', weight: 9 }, { id: 'candy', weight: 12 }, { id: 'coffee', weight: 10 },
  { id: 'medicine', weight: 7 }, { id: 'potion', weight: 6 }, { id: 'timeMachine', weight: 5 },
  { id: 'luckyCharm', weight: 4 }, { id: 'rainbowPotion', weight: 5 }, { id: 'goldenTicket', weight: 1 },
  { id: 'bow', weight: 3 }, { id: 'beanie', weight: 2 },
];

module.exports = { ITEMS, MYSTERY_POOL };
