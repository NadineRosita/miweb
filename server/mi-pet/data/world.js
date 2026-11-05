// Mundo del juego: logros, eventos, zonas, recompensas, misiones y habitaciones.
// Los textos van como [español, inglés].

// Cada logro se comprueba contra los contadores de la partida.
// stat: contador; goal: valor que alcanzar. Los que dependen de algo puntual usan
// flag: se activa con una marca en la partida.
const ACHIEVEMENTS = [
  { id: 'firstPet', icon: 'heart', name: ['Primera mascota', 'First pet'], desc: ['Adopta tu primera criatura digital.', 'Adopt your first digital creature.'], stat: 'petsAdopted', goal: 1, coins: 20 },
  { id: 'firstBite', icon: 'food', name: ['Buen provecho', 'Bon appétit'], desc: ['Da de comer 10 veces.', 'Feed your pet 10 times.'], stat: 'itemsConsumed', goal: 10, coins: 15 },
  { id: 'sevenDays', icon: 'calendar', name: ['Siete días jugando', 'Seven days in'], desc: ['Juega durante 7 días distintos.', 'Play on 7 different days.'], stat: 'daysPlayed', goal: 7, coins: 60 },
  { id: 'arcade10', icon: 'joystick', name: ['Insertar moneda', 'Insert coin'], desc: ['Completa 10 minijuegos.', 'Complete 10 minigames.'], stat: 'gamesPlayed', goal: 10, coins: 30 },
  { id: 'arcade100', icon: 'joystick', name: ['Cien partidas', 'Hundred games'], desc: ['Completa 100 minijuegos.', 'Complete 100 minigames.'], stat: 'gamesPlayed', goal: 100, coins: 150 },
  { id: 'firstEvolution', icon: 'star', name: ['Primera evolución', 'First evolution'], desc: ['Haz evolucionar a una mascota.', 'Evolve a pet.'], stat: 'evolutions', goal: 1, coins: 80 },
  { id: 'shopper', icon: 'bag', name: ['Cincuenta compras', 'Fifty purchases'], desc: ['Compra 50 objetos.', 'Buy 50 items.'], stat: 'itemsBought', goal: 50, coins: 80 },
  { id: 'collector', icon: 'trophy', name: ['Coleccionista', 'Collector'], desc: ['Consigue 10 mascotas.', 'Get 10 pets.'], stat: 'petsAdopted', goal: 10, coins: 300 },
  { id: 'millionaire', icon: 'melon', name: ['Millonario', 'Millionaire'], desc: ['Acumula 1000 meloncillos a la vez.', 'Hold 1000 meloncillos at once.'], stat: 'peakCoins', goal: 1000, coins: 100 },
  { id: 'goodKeeper', icon: 'shield', name: ['Buen cuidador', 'Good keeper'], desc: ['Mantén las necesidades por encima de 80 en 5 días distintos.', 'Keep all needs above 80 on 5 different days.'], stat: 'goodCareDays', goal: 5, coins: 100 },
  { id: 'decorator', icon: 'sofa', name: ['Decorador', 'Decorator'], desc: ['Coloca 10 muebles.', 'Place 10 pieces of furniture.'], stat: 'furniturePlaced', goal: 10, coins: 50 },
  { id: 'explorerAch', icon: 'compass', name: ['Explorador', 'Explorer'], desc: ['Prueba 8 actividades diferentes.', 'Try 8 different activities.'], stat: 'activitiesTried', goal: 8, coins: 50 },
  { id: 'nightOwl', icon: 'moon', name: ['Noctámbulo', 'Night owl'], desc: ['Cuida a tu mascota de madrugada. Desbloquea al Murciélago.', 'Care for your pet in the small hours. Unlocks the Bat.'], flag: 'nightVisit', coins: 25 },
  { id: 'forestFriend', icon: 'leaf', name: ['Amigo del bosque', 'Forest friend'], desc: ['Completa 3 expediciones al Bosque. Desbloquea al Mushling.', 'Complete 3 Forest expeditions. Unlocks the Mushling.'], stat: 'zone_forest', goal: 3, coins: 40 },
  { id: 'deepDiver', icon: 'wave', name: ['Buzo profundo', 'Deep diver'], desc: ['Vuelve del Mundo submarino. Desbloquea al Pulpo.', 'Return from the Underwater World. Unlocks the Octopus.'], stat: 'zone_underwater', goal: 1, coins: 60 },
  { id: 'worldTour', icon: 'map', name: ['Vuelta al mundo', 'World tour'], desc: ['Visita las 6 zonas.', 'Visit all 6 zones.'], stat: 'zonesVisited', goal: 6, coins: 120 },
  { id: 'soulmates', icon: 'heart', name: ['Almas gemelas', 'Soulmates'], desc: ['Alcanza el máximo nivel de afinidad.', 'Reach the top affinity tier.'], flag: 'soulmate', coins: 120 },
  { id: 'streak7', icon: 'calendar', name: ['Sin faltar', 'Perfect attendance'], desc: ['Reclama 7 recompensas diarias.', 'Claim 7 daily rewards.'], stat: 'dailyClaims', goal: 7, coins: 40 },
  { id: 'fisher', icon: 'fish', name: ['Pescador legendario', 'Legendary angler'], desc: ['Pesca algo legendario.', 'Catch something legendary.'], flag: 'legendaryCatch', coins: 60 },
  { id: 'farewell', icon: 'skull', name: ['Hasta siempre', 'Farewell'], desc: ['Algunos logros no se quieren conseguir.', 'Some achievements nobody wants.'], flag: 'funeral', coins: 10, hidden: true },
];

// Eventos aleatorios. Se elige uno por peso; cambia los pesos para hacerlos más o menos raros.
const EVENTS = [
  {
    id: 'coin', icon: 'melon', weight: 30, reward: { coins: [5, 15] },
    text: ['{pet} ha encontrado meloncillos debajo de la cama. No preguntes.', '{pet} found meloncillos under the bed. Do not ask.'],
  },
  {
    id: 'box', icon: 'box', weight: 12, reward: { item: 'mysteryBox' },
    text: ['Ha aparecido una caja misteriosa en la habitación. Hace un ruidito.', 'A mystery box has appeared in the room. It is making a small noise.'],
  },
  {
    id: 'visit', icon: 'heart', weight: 14, reward: { stats: { happiness: 12, fun: 12 } },
    text: ['Un primo lejano de {pet} ha venido de visita y se ha comido todo el protagonismo.', 'A distant cousin of {pet} dropped by and stole the whole show.'],
  },
  {
    id: 'lost', icon: 'bag', weight: 12, reward: { randomItem: ['apple', 'strawberries', 'candy', 'coffee'] },
    text: ['{pet} ha encontrado un objeto perdido. Dice que estaba «abandonado». Lo estaba agarrando alguien.', '{pet} found a lost item. It says it was "abandoned". Someone was holding it.'],
  },
  {
    id: 'dream', icon: 'moon', weight: 14, reward: { stats: { energy: 15 }, xp: 10 },
    text: ['{pet} ha tenido un sueño extraño: tenía un ordenador. Era precioso.', '{pet} had a strange dream: it owned a computer. It was beautiful.'],
  },
  {
    id: 'discover', icon: 'map', weight: 8, reward: { xp: 25, coins: [5, 10] },
    text: ['{pet} ha descubierto una zona nueva detrás del armario. Era otro armario.', '{pet} discovered a new area behind the wardrobe. It was another wardrobe.'],
  },
  {
    id: 'gift', icon: 'box', weight: 8, reward: { randomItem: ['cake', 'pizza', 'luckyCharm', 'rainbowPotion'] },
    text: ['Ha llegado un paquete sin remitente. {pet} ya lo ha abierto con los dientes.', 'A parcel arrived with no sender. {pet} already opened it with its teeth.'],
  },
  {
    id: 'testTube', icon: 'flask', weight: 2, reward: { flag: 'testTube', xp: 20 },
    text: ['{pet} ha encontrado un tubo de ensayo que brilla. Algo dentro te ha saludado. Experimento desbloqueado.', '{pet} found a glowing test tube. Something inside waved at you. Experiment unlocked.'],
  },
];

// Zonas de exploración. minutes: duración de la expedición.
// loot: coins es el rango de meloncillos; items, lo que se puede encontrar, con su probabilidad.
const ZONES = [
  {
    id: 'forest', name: ['Bosque', 'Forest'], minutes: 15, energy: 15, level: 1, xp: 15, coins: [8, 18],
    desc: ['Árboles de un solo píxel de grosor y un silencio sospechoso.', 'One-pixel-wide trees and a suspicious silence.'],
    items: [{ id: 'strawberries', chance: 0.4 }, { id: 'apple', chance: 0.4 }],
    collectibles: ['leaf', 'acorn'],
    stories: [
      ['{pet} se ha hecho amigo de una ardilla. La ardilla no lo sabe.', '{pet} befriended a squirrel. The squirrel does not know.'],
      ['{pet} ha abrazado un árbol durante veinte minutos. El árbol ha ganado.', '{pet} hugged a tree for twenty minutes. The tree won.'],
      ['Un búho ha mirado a {pet} con desaprobación. Se han entendido.', 'An owl looked at {pet} with disapproval. They understood each other.'],
    ],
  },
  {
    id: 'beach', name: ['Playa', 'Beach'], minutes: 25, energy: 18, level: 3, xp: 22, coins: [12, 24],
    desc: ['Arena en cada carpeta del sistema. Merece la pena.', 'Sand in every system folder. Worth it.'],
    items: [{ id: 'soda', chance: 0.35 }, { id: 'candy', chance: 0.3 }],
    collectibles: ['shell', 'bottle'],
    stories: [
      ['{pet} ha construido un castillo de arena con cortafuegos.', '{pet} built a sandcastle with a firewall.'],
      ['Un cangrejo ha negociado con {pet} y ha salido perdiendo.', 'A crab negotiated with {pet} and lost.'],
      ['{pet} ha intentado tomar el sol. El sol no ha dado permiso.', '{pet} tried to sunbathe. The sun did not grant permission.'],
    ],
  },
  {
    id: 'city', name: ['Ciudad', 'City'], minutes: 35, energy: 20, level: 5, xp: 28, coins: [18, 32],
    desc: ['Semáforos, palomas y wifi gratis de contraseña dudosa.', 'Traffic lights, pigeons and free wifi with a dubious password.'],
    items: [{ id: 'pizza', chance: 0.4 }, { id: 'coffee', chance: 0.4 }],
    collectibles: ['ticket', 'keychain'],
    stories: [
      ['{pet} ha pedido un café y le han escrito mal el nombre.', '{pet} ordered a coffee and they misspelled its name.'],
      ['{pet} ha visto a una paloma con más confianza que nadie.', '{pet} saw a pigeon with more confidence than anyone alive.'],
      ['{pet} se ha perdido en el metro y ha vuelto con un amigo.', '{pet} got lost in the subway and came back with a friend.'],
    ],
  },
  {
    id: 'mountain', name: ['Montaña', 'Mountain'], minutes: 50, energy: 28, level: 8, xp: 38, coins: [24, 42],
    desc: ['Mucho más alta en persona. Hay vistas y falta de aire.', 'Much taller in person. Views included, air not.'],
    items: [{ id: 'milk', chance: 0.4 }, { id: 'medicine', chance: 0.25 }],
    collectibles: ['crystal', 'flag'],
    stories: [
      ['{pet} ha llegado a la cima y ha gritado su propio nombre. El eco le ha corregido.', '{pet} reached the top and shouted its name. The echo corrected it.'],
      ['Una cabra le ha enseñado a {pet} a mirar al infinito.', 'A goat taught {pet} how to stare into the distance.'],
      ['{pet} ha encontrado un refugio con un calendario de 1998.', '{pet} found a shelter with a 1998 calendar.'],
    ],
  },
  {
    id: 'underwater', name: ['Mundo submarino', 'Underwater World'], minutes: 70, energy: 30, level: 10, xp: 50, coins: [32, 54],
    desc: ['Azul sobre azul. Algo te observa desde abajo, pero con educación.', 'Blue on blue. Something watches from below, politely.'],
    items: [{ id: 'potion', chance: 0.3 }, { id: 'mysteryBox', chance: 0.3 }],
    collectibles: ['pearl', 'anchor'],
    stories: [
      ['{pet} ha contado burbujas. Eran muchas.', '{pet} counted bubbles. There were many.'],
      ['Un pez abisal le ha preguntado a {pet} por la superficie. Le ha mentido.', 'A deep-sea fish asked {pet} about the surface. It lied.'],
      ['{pet} ha encontrado un cofre con un cable USB dentro.', '{pet} found a chest containing a USB cable.'],
    ],
  },
  {
    id: 'space', name: ['Espacio', 'Space'], minutes: 90, energy: 35, level: 12, achievement: 'deepDiver', xp: 65, coins: [42, 72],
    desc: ['Hace frío y no hay wifi. Las vistas compensan.', 'It is cold and there is no wifi. The views make up for it.'],
    items: [{ id: 'timeMachine', chance: 0.2 }, { id: 'luckyCharm', chance: 0.25 }, { id: 'goldenTicket', chance: 0.06 }],
    collectibles: ['meteor', 'satellite'],
    stories: [
      ['{pet} ha flotado sin rumbo. Dice que es su nueva personalidad.', '{pet} floated aimlessly. It says this is its new personality.'],
      ['{pet} ha saludado a un satélite. Le ha devuelto un 404.', '{pet} waved at a satellite. It returned a 404.'],
      ['{pet} ha visto la Tierra desde lejos: era muy pequeña y muy ruidosa.', '{pet} saw Earth from afar: very small, very loud.'],
    ],
  },
];

// Nombre de los coleccionables de exploración
const COLLECTIBLES = {
  leaf: ['Hoja perfecta', 'Perfect leaf'], acorn: ['Bellota antigua', 'Ancient acorn'],
  shell: ['Concha parlante', 'Talking shell'], bottle: ['Mensaje en botella', 'Message in a bottle'],
  ticket: ['Billete de metro', 'Subway ticket'], keychain: ['Llavero sin llaves', 'Keyless keychain'],
  crystal: ['Cristal de cuarzo', 'Quartz crystal'], flag: ['Banderín de cima', 'Summit pennant'],
  pearl: ['Perla azul', 'Blue pearl'], anchor: ['Ancla diminuta', 'Tiny anchor'],
  meteor: ['Trozo de meteorito', 'Meteorite chunk'], satellite: ['Tornillo de satélite', 'Satellite bolt'],
};

// Calendario de recompensa diaria: se repite cada 7 días reclamados, sin penalizar los días
// que no entres (por eso no hay racha que se rompa).
const DAILY_REWARDS = [
  { coins: 20 },
  { item: 'apple', qty: 3 },
  { coins: 30 },
  { item: 'coffee', qty: 2 },
  { coins: 40 },
  { item: 'mysteryBox', qty: 1 },
  { coins: 60, item: 'candy', qty: 2 },
];

// Misiones del día: se eligen count al azar; stat es un contador de ese día
const MISSIONS = {
  count: 3,
  pool: [
    { id: 'feed', stat: 'consumed', goal: 2, coins: 10, xp: 8, text: ['Dale de comer 2 veces', 'Feed it twice'] },
    { id: 'interact', stat: 'interactions', goal: 5, coins: 8, xp: 8, text: ['Interactúa 5 veces', 'Interact 5 times'] },
    { id: 'arcade', stat: 'games', goal: 2, coins: 12, xp: 10, text: ['Juega 2 partidas en el Arcade', 'Play 2 Arcade games'] },
    { id: 'bath', stat: 'baths', goal: 1, coins: 6, xp: 6, text: ['Báñala una vez', 'Give it a bath'] },
    { id: 'explore', stat: 'expeditions', goal: 1, coins: 15, xp: 10, text: ['Completa una expedición', 'Complete an expedition'] },
    { id: 'play', stat: 'plays', goal: 2, coins: 8, xp: 8, text: ['Juega con ella 2 veces', 'Play with it twice'] },
    { id: 'clean', stat: 'cleans', goal: 1, coins: 6, xp: 6, text: ['Limpia la habitación', 'Clean the room'] },
  ],
};

// Lo que desbloquea cada nivel. Se muestra en el perfil.
const LEVEL_REWARDS = {
  1: { text: ['Adopción', 'Adoption'] },
  3: { text: ['Accesorios en la tienda y juego de pesca', 'Accessories in the shop and the fishing game'] },
  5: { text: ['Nuevos objetos y el Robot en venta', 'New items and the Robot for sale'], coins: 30 },
  7: { text: ['Más decoración y accesorios', 'More decor and accessories'], coins: 40 },
  10: { text: ['Nuevas habitaciones y Poción de crecimiento', 'New rooms and the Growth potion'], coins: 60 },
  15: { text: ['Evoluciones', 'Evolutions'], coins: 100, item: 'growthPotion' },
  20: { text: ['Mascotas especiales: Experimento', 'Special pets: Experiment'], coins: 150 },
};

// Temas de la habitación y luces
const ROOM_THEMES = [
  { id: 'basic', name: ['Básica', 'Basic'], level: 1 },
  { id: 'gamer', name: ['Gamer', 'Gamer'], level: 10, price: 150 },
  { id: 'nature', name: ['Natural', 'Nature'], level: 10, price: 120 },
  { id: 'night', name: ['Nocturna', 'Night'], level: 10, price: 120 },
  { id: 'magic', name: ['Mágica', 'Magic'], level: 14, price: 200 },
  { id: 'space', name: ['Espacial', 'Space'], level: 16, price: 250 },
];
const ROOM_LIGHTS = ['auto', 'warm', 'cool', 'party', 'dim'];

// Peces y objetos del juego de pesca, con su peso y valor
const FISH = [
  { id: 'boot', rarity: 'junk', weight: 14, score: 2, name: ['Bota vieja', 'Old boot'] },
  { id: 'cable', rarity: 'junk', weight: 10, score: 3, name: ['Cable USB enredado', 'Tangled USB cable'] },
  { id: 'minnow', rarity: 'common', weight: 30, score: 6, name: ['Pececillo', 'Minnow'] },
  { id: 'carp', rarity: 'common', weight: 22, score: 9, name: ['Carpa de bits', 'Bit carp'] },
  { id: 'puffer', rarity: 'rare', weight: 12, score: 16, name: ['Pez globo', 'Pufferfish'] },
  { id: 'koi', rarity: 'rare', weight: 8, score: 20, name: ['Koi de neón', 'Neon koi'] },
  { id: 'kraken', rarity: 'legendary', weight: 2, score: 30, name: ['Bebé kraken', 'Baby kraken'] },
  { id: 'melonfish', rarity: 'legendary', weight: 2, score: 30, name: ['Pez meloncillo', 'Meloncillo fish'] },
];

// Curiosidades de la estantería
const TRIVIA = [
  ['Un byte son ocho bits. Nadie ha explicado por qué no invitaron al noveno.', 'A byte is eight bits. Nobody explained why the ninth was not invited.'],
  ['El primer «bug» documentado fue una polilla real dentro de un ordenador.', 'The first documented "bug" was an actual moth inside a computer.'],
  ['Los pulpos tienen tres corazones. Dos dejan de latir cuando nadan.', 'Octopuses have three hearts. Two stop beating when they swim.'],
  ['Los caracoles pueden dormir hasta tres años seguidos. Es una meta.', 'Snails can sleep for up to three years. Goals.'],
  ['Los murciélagos son los únicos mamíferos que vuelan de verdad.', 'Bats are the only mammals capable of true flight.'],
  ['Las setas están más cerca de los animales que de las plantas.', 'Mushrooms are closer to animals than to plants.'],
  ['El símbolo de guardar sigue siendo un disquete. Hay gente que no ha visto ninguno.', 'The save icon is still a floppy disk. Some people have never seen one.'],
  ['Hay más estrellas en el universo que granos de arena en la Tierra.', 'There are more stars in the universe than grains of sand on Earth.'],
  ['Las ranas no beben: absorben el agua por la piel.', 'Frogs do not drink: they absorb water through their skin.'],
  ['El apagar y encender funciona porque limpia la memoria temporal. Y porque sí.', 'Turning it off and on works because it clears temporary memory. And because it just does.'],
];

const PERSONALITIES = ['care', 'smart', 'adventure', 'neglect'];

module.exports = {
  ACHIEVEMENTS, EVENTS, ZONES, COLLECTIBLES, DAILY_REWARDS, MISSIONS, LEVEL_REWARDS,
  ROOM_THEMES, ROOM_LIGHTS, FISH, TRIVIA, PERSONALITIES,
};
