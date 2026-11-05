// Especies y evoluciones. El dibujo está en public/js/mi-pet/sprites.js,
// identificado por el id de cada especie; los colores, aquí.
//
// stats     estadísticas iniciales distintas de las generales (ver config.start)
// mods      multiplicadores propios sobre la velocidad a la que bajan las necesidades
// nocturnal duerme de día y está activo de noche
// unlock    cómo se desbloquea: level, coins, achievement, flag (hallazgo) o ticket.
//           Si hay flag y level, basta con cualquiera de los dos.

// Las cuatro ramas de evolución son comunes; cada especie les pone nombre.
const BRANCHES = {
  happy: {
    icon: 'heart', personality: 'care', stat: 'happiness', perk: 'funDecay',
    perkText: ['Se aburre un 20 % más despacio.', 'Gets bored 20% slower.'],
    hint: ['Mucho cariño y felicidad.', 'Lots of love and happiness.'],
  },
  smart: {
    icon: 'chip', personality: 'smart', stat: 'fun', perk: 'xpBonus',
    perkText: ['Gana un 15 % más de experiencia.', 'Earns 15% more experience.'],
    hint: ['Muchas partidas en el Arcade.', 'Plenty of Arcade games.'],
  },
  adventurous: {
    icon: 'compass', personality: 'adventure', stat: 'energy', perk: 'fastExplore',
    perkText: ['Sus expediciones duran un 25 % menos.', 'Its expeditions take 25% less time.'],
    hint: ['Muchas expediciones.', 'Many expeditions.'],
  },
  dark: {
    icon: 'skull', personality: 'neglect', stat: null, perk: 'hungerDecay',
    perkText: ['Tiene un 20 % menos de hambre. No preguntes por qué.', 'Gets 20% less hungry. Do not ask why.'],
    hint: ['Dicen que nace del abandono.', 'They say it is born from neglect.'],
  },
};

const evo = (happy, smart, adventurous, dark) => ({ happy, smart, adventurous, dark });

const SPECIES = [
  {
    id: 'slime', starter: true, name: ['Slime', 'Slime'],
    personality: ['Adorable, curioso y algo torpe', 'Adorable, curious and a bit clumsy'],
    desc: ['Una gota de gelatina con opiniones. Se mueve a saltitos, le encanta comer y puede pasarse horas mirándote fijamente.', 'A blob of jelly with opinions. It hops around, loves eating and can stare at you for hours.'],
    palette: { body: '#6fd3c7', shade: '#3f9fa8', light: '#b6f2e4' },
    variants: [
      { body: '#f4a6c8', shade: '#c96f9f', light: '#fbd3e4' },
      { body: '#a79bf0', shade: '#7464c8', light: '#d5cdfb' },
      { body: '#f2d27a', shade: '#c89e4a', light: '#fbecb9' },
    ],
    stats: { hunger: 60, fun: 75 }, mods: { hunger: 1.2, hygiene: 1.1 },
    evolutions: evo(['Slime arcoíris', 'Rainbow Slime'], ['Slime tecnológico', 'Tech Slime'], ['Slime explorador', 'Explorer Slime'], ['Slime oscuro', 'Dark Slime']),
  },
  {
    id: 'ghost', starter: true, name: ['Fantasma', 'Ghost'],
    personality: ['Tímido, perezoso y misterioso', 'Shy, lazy and mysterious'],
    desc: ['Flota, atraviesa muebles y a veces desaparece sin avisar. Nadie sabe de quién es fantasma, ni siquiera él.', 'It floats, phases through furniture and sometimes vanishes. Nobody knows whose ghost it is, not even itself.'],
    palette: { body: '#e8e6f7', shade: '#a9a6d6', light: '#ffffff' },
    variants: [{ body: '#c8dcfb', shade: '#8ea9e0', light: '#eef5ff' }, { body: '#f6d3e6', shade: '#c99bbd', light: '#fff0f8' }],
    stats: { energy: 60, hygiene: 100 }, mods: { hygiene: 0.5, energy: 1.2 },
    evolutions: evo(['Fantasma risueño', 'Giggling Ghost'], ['Espectro binario', 'Binary Wraith'], ['Alma errante', 'Wandering Soul'], ['Poltergeist', 'Poltergeist']),
  },
  {
    id: 'alien', starter: true, name: ['Alienígena', 'Alien'],
    personality: ['Curioso, inteligente y despistado', 'Curious, smart and absent-minded'],
    desc: ['Vino a estudiar a los humanos y se quedó por los snacks. Sus antenas delatan todo lo que piensa.', 'It came to study humans and stayed for the snacks. Its antennae give away everything it thinks.'],
    palette: { body: '#9be36b', shade: '#5fae4e', light: '#d1f7a8' },
    variants: [{ body: '#7fd4f2', shade: '#4f9dc4', light: '#c0eeff' }, { body: '#c9a5f2', shade: '#9270c6', light: '#e8d6ff' }],
    stats: { fun: 60, energy: 85 }, mods: { fun: 1.2 },
    evolutions: evo(['Embajador galáctico', 'Galactic Ambassador'], ['Gran cerebro', 'Big Brain'], ['Piloto estelar', 'Star Pilot'], ['Invasor', 'Invader']),
  },
  {
    id: 'robot', name: ['Robot', 'Robot'],
    personality: ['Inteligente y ordenado', 'Smart and tidy'],
    desc: ['Lo clasifica todo por orden alfabético, incluidos tus sentimientos. Le molesta el polvo.', 'It sorts everything alphabetically, including your feelings. Dust annoys it.'],
    palette: { body: '#b4c0d8', shade: '#7486a8', light: '#e2e9f7' },
    stats: { energy: 90 }, mods: { hunger: 0.8, energy: 1.2 },
    unlock: { level: 5, coins: 150 },
    evolutions: evo(['Androide cariñoso', 'Caring Android'], ['Superordenador', 'Supercomputer'], ['Rover', 'Rover'], ['Unidad corrupta', 'Corrupted Unit']),
  },
  {
    id: 'bat', name: ['Murciélago', 'Bat'], nocturnal: true,
    personality: ['Nocturno y misterioso', 'Nocturnal and mysterious'],
    desc: ['De día duerme boca abajo; de noche te cuenta secretos que no has pedido.', 'It sleeps upside down all day; at night it tells you secrets you never asked for.'],
    palette: { body: '#7d6bb0', shade: '#54467f', light: '#ab9bd8' },
    stats: { energy: 70 }, mods: {},
    unlock: { achievement: 'nightOwl' },
    evolutions: evo(['Murciélago lunar', 'Moon Bat'], ['Sónar viviente', 'Living Sonar'], ['Viajero nocturno', 'Night Traveler'], ['Vampiro', 'Vampire']),
  },
  {
    id: 'mushling', name: ['Mushling', 'Mushling'],
    personality: ['Tranquilo y amante de la naturaleza', 'Calm and nature-loving'],
    desc: ['Una setita que camina muy poco y piensa mucho. Dice que te entiende. Es mentira.', 'A little mushroom that walks little and thinks a lot. It says it understands you. It does not.'],
    palette: { body: '#f0dcc0', shade: '#c8a884', light: '#fff2df', cap: '#d9685e', capShade: '#a8473f' },
    stats: { fun: 80 }, mods: { hunger: 0.8, fun: 0.8 },
    unlock: { achievement: 'forestFriend' },
    evolutions: evo(['Seta florida', 'Blooming Shroom'], ['Micelio sabio', 'Wise Mycelium'], ['Trufa viajera', 'Roaming Truffle'], ['Seta venenosa', 'Toadstool']),
  },
  {
    id: 'frog', name: ['Ranita', 'Froggy'],
    personality: ['Aventurera y juguetona', 'Adventurous and playful'],
    desc: ['Cree que cada charco es un portal. A veces acierta.', 'It believes every puddle is a portal. Sometimes it is right.'],
    palette: { body: '#7bd18a', shade: '#4a9c62', light: '#bff0c4' },
    stats: { fun: 60, energy: 90 }, mods: { fun: 1.15, hygiene: 1.1 },
    unlock: { level: 8 },
    evolutions: evo(['Príncipe rana', 'Frog Prince'], ['Rana hacker', 'Hacker Frog'], ['Rana intrépida', 'Daring Frog'], ['Rana del pantano', 'Swamp Frog']),
  },
  {
    id: 'snail', name: ['Caracol', 'Snail'],
    personality: ['Extremadamente tranquilo', 'Extremely calm'],
    desc: ['Lleva en camino desde 2009. No tiene prisa. Tú tampoco deberías.', 'It has been on its way since 2009. No rush. You should not rush either.'],
    palette: { body: '#e8c98f', shade: '#b8975f', light: '#f8e6bd', shell: '#c98a6b', shellShade: '#96604a' },
    stats: { energy: 100 }, mods: { hunger: 0.7, energy: 0.6, fun: 0.7, hygiene: 0.8 },
    unlock: { coins: 350 },
    evolutions: evo(['Caracol zen', 'Zen Snail'], ['Caracol con turbo', 'Turbo Snail'], ['Caracol nómada', 'Nomad Snail'], ['Babosa del vacío', 'Void Slug']),
  },
  {
    id: 'cat', name: ['Gato cósmico', 'Cosmic Cat'],
    personality: ['Independiente y algo arrogante', 'Independent and rather arrogant'],
    desc: ['Te permite vivir en su habitación. Tiene una constelación en el lomo y ninguna intención de darte las gracias.', 'It allows you to live in its room. It has a constellation on its back and no intention of thanking you.'],
    palette: { body: '#2f3a6b', shade: '#1f2750', light: '#6474c0', star: '#f7e08a' },
    stats: { affection: 0 }, mods: { fun: 0.8 },
    unlock: { ticket: true },
    evolutions: evo(['Gato nebulosa', 'Nebula Cat'], ['Gato cuántico', 'Quantum Cat'], ['Gato cometa', 'Comet Cat'], ['Agujero gato', 'Black Hole Cat']),
  },
  {
    id: 'experiment', name: ['Experimento', 'Experiment'],
    personality: ['Impredecible', 'Unpredictable'],
    desc: ['Nadie recuerda quién lo creó. Tiene tres ojos y cambia de humor cada vez que parpadea con alguno.', 'Nobody remembers who made it. It has three eyes and a mood swing each time one blinks.'],
    palette: { body: '#e887c8', shade: '#b0569a', light: '#f8c2e6' },
    stats: {}, mods: { hunger: 1.3, fun: 1.3 },
    unlock: { flag: 'testTube', level: 20 },
    evolutions: evo(['Mutación adorable', 'Adorable Mutation'], ['Mente colmena', 'Hive Mind'], ['Fugitivo del laboratorio', 'Lab Escapee'], ['Error fatal', 'Fatal Error']),
  },
  {
    id: 'octopus', name: ['Pulpo', 'Octopus'],
    personality: ['Inteligente y curioso', 'Smart and curious'],
    desc: ['Tres corazones y todos con dudas existenciales. Abre cualquier tarro.', 'Three hearts, all with existential doubts. It can open any jar.'],
    palette: { body: '#ef8f7a', shade: '#b85f52', light: '#fbc2b3' },
    stats: { hygiene: 100 }, mods: { hygiene: 0.8, fun: 1.1 },
    unlock: { achievement: 'deepDiver' },
    evolutions: evo(['Pulpo abrazos', 'Hug Octopus'], ['Pulpo profesor', 'Professor Octopus'], ['Pulpo pirata', 'Pirate Octopus'], ['Kraken', 'Kraken']),
  },
];

// Colores de cada rama de evolución
const EVOLUTION_LOOK = {
  happy: { rainbow: true },
  smart: { body: '#7fb4f0', shade: '#4a78c0', light: '#c8e2ff' },
  adventurous: { body: '#d9a860', shade: '#a67a3e', light: '#f3d59a' },
  dark: { body: '#4a3f6b', shade: '#2e2648', light: '#7a6aa0' },
};

module.exports = { SPECIES, BRANCHES, EVOLUTION_LOOK };
