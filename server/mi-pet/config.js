// Ajustes del juego: si quieres cambiar cuánto baja una barra, cuánto paga algo
// o cada cuánto ocurre un evento, es aquí. Ningún otro archivo debe tener estos números.

const HOUR = 60 * 60 * 1000;

module.exports = {
  HOUR,
  SAVE_VERSION: 1,

  start: { coins: 60, stats: { happiness: 70, hunger: 70, energy: 80, hygiene: 80, fun: 70, affection: 10 } },

  name: { max: 24 },
  adoption: { starterPrice: 100 }, // Volver a adoptar una especie inicial teniendo otra mascota

  // Puntos que pierde cada necesidad por hora. Dormido, se multiplican por sleepFactor.
  decayPerHour: { hunger: 5.5, energy: 4, hygiene: 3, fun: 4.5 },
  sleepFactor: { hunger: 0.5, hygiene: 0.5, fun: 0.25 },
  energyPerHourAsleep: 22,
  // La felicidad persigue la media de las necesidades a esta velocidad
  happinessFollowPerHour: 7,
  affectionDecayPerHour: 0.15,
  affectionGraceHours: 36, // Sin atender durante este tiempo no baja el cariño

  time: {
    maxOfflineHours: 48, // Lo que pase de aquí no se simula
    offlineFloor: 10, // En una ausencia, ninguna necesidad baja de aquí
    missYouHours: 24, // Desde aquí, la mascota dice que te ha echado de menos
    stepMinutes: 15, // Tamaño de cada paso de la simulación
  },

  // Dormir solo
  nightSleep: { fromHour: 1, toHour: 7, energyBelow: 60, wakeAtEnergy: 95 },
  dayHours: { morning: 7, afternoon: 13, night: 20, lateNight: 1 },

  // Umbrales de estado (sobre 100)
  states: {
    hungry: 30, tired: 25, dirty: 30, bored: 30,
    happy: 55, veryHappy: 85,
    inLoveAffection: 90, inLoveHappiness: 70,
  },
  // Penalización de la felicidad objetivo por estado, en puntos
  statePenalty: { dirty: 6, sick: 25 },

  sickness: {
    lowNeed: 15, // Una necesidad "muy baja"
    lowNeedsRequired: 3, // Cuántas a la vez
    neglectHours: 6, // Tiempo acumulado antes de que pueda enfermar
    chancePerHour: 0.35,
    decayFactor: 1.3,
    happinessCap: 40,
    healthLossPerHour: 1.5,
    healthRegenPerHour: 2,
    criticalHealth: 30, // Por debajo se avisa al jugador
    emergencyKitPerDay: 1, // Medicina gratis si no te llega para comprarla
  },

  actions: {
    bath: { hygiene: 45, happiness: -3, xp: 4, cooldownMin: 20 },
    cleanRoom: { hygiene: 15, happiness: 4, xp: 4, coins: 2, perMess: 1 },
    petPlay: { fun: 18, happiness: 10, energy: -8, hunger: -4, xp: 5, cooldownMin: 3 },
    furniture: { cooldownMin: 45, xp: 3 },
  },

  // Interacciones: cooldown en segundos
  interactions: {
    pet: { happiness: 4, affection: 1.2, xp: 2, cooldownSec: 8 },
    talk: { fun: 3, affection: 1, xp: 2, cooldownSec: 8 },
    greet: { happiness: 2, affection: 0.6, xp: 1, cooldownSec: 8 },
    tickle: { fun: 5, happiness: 3, energy: -1, affection: 0.8, xp: 2, cooldownSec: 8 },
    hug: { happiness: 6, affection: 2, xp: 3, cooldownSec: 30 },
  },
  interactionDaily: { xpCap: 40, affectionCap: 12, coinsEvery: 6, coins: 2, coinsCap: 12 },

  mess: { perHours: 8, max: 5 }, // Una caquita de bits cada tantas horas

  level: {
    max: 50,
    base: 40, // XP del nivel 1 al 2
    growth: 1.16,
    coinsPerLevel: 15,
  },

  affinityTiers: [
    { id: 'stranger', min: 0 },
    { id: 'acquaintance', min: 20 },
    { id: 'friend', min: 45 },
    { id: 'bestFriend', min: 70 },
    { id: 'soulmate', min: 90 },
  ],
  affinityGift: { coins: 25, item: 'candy' },

  evolution: { level: 15, careDays: 3, statMin: 60 },
  personalityPoints: { care: 1, smart: 1, adventure: 3, neglect: 2 },

  events: {
    chancePerHour: 0.3,
    cooldownHours: 3,
    expiresHours: 24,
  },

  arcade: {
    dailyCoinsCap: 120,
    // minSeconds y maxScorePerSecond rechazan puntuaciones imposibles.
    // coinsPerPoint/maxCoins definen el pago; dailyCap limita cada juego.
    games: {
      snake: { minSeconds: 3, maxScorePerSecond: 2, coinsPerPoint: 0.6, xpPerGame: 6, maxCoins: 25, dailyCap: 45 },
      memory: { minSeconds: 5, maxScorePerSecond: 20, coinsPerPoint: 0.25, xpPerGame: 6, maxCoins: 25, dailyCap: 45 },
      fishing: { level: 3, minSeconds: 2, maxScorePerSecond: 1000, coinsPerPoint: 1, xpPerGame: 4, maxCoins: 30, dailyCap: 50 },
      clicker: { minSeconds: 8, maxScorePerSecond: 16, coinsPerPoint: 0.25, xpPerGame: 4, maxCoins: 15, dailyCap: 30 },
      dodge: { furniture: 'arcadeMachine', minSeconds: 3, maxScorePerSecond: 1.1, coinsPerPoint: 0.5, xpPerGame: 6, maxCoins: 25, dailyCap: 45 },
      guess: { minSeconds: 2, maxScorePerSecond: 30, coinsPerPoint: 0.2, xpPerGame: 4, maxCoins: 15, dailyCap: 30 },
      minesweeper: { furniture: 'computer', minSeconds: 3, maxScorePerSecond: 50, coinsPerPoint: 0.3, xpPerGame: 8, maxCoins: 30, dailyCap: 50 },
    },
    sessionMaxHours: 2, // Una partida abierta más tiempo ya no paga
    needs: { fun: 8, energy: -3 }, // Jugar entretiene y cansa un poco
    difficulty: { easy: 1, normal: 1.4, hard: 1.9 },
  },

  luck: { hours: 12, multiplier: 1.5 },
  rainbow: { hours: 24 },
  explorationBoostPercent: 25,

  limits: {
    diary: 200, album: 40, cart: 20,
  },
  room: { cols: 16, rows: 9, wallRows: 5 },
};
