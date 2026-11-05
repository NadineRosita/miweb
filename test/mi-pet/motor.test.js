// Pruebas de las reglas de Mi Pet. No necesitan base de datos: npm test

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { applyAction } = require('../../server/mi-pet/actions');
const {
  ACHIEVEMENT, DIALOGUES, EVENT, ITEM, ITEMS, SPECIES, SPECIES_BY_ID, ZONE, ZONES,
} = require('../../server/mi-pet/catalog');
const config = require('../../server/mi-pet/config');
const { addXp, spendCoins, xpToNext, GameError, evolutionStatus } = require('../../server/mi-pet/progress');
const { createSave, loadSave, sanitizeSave } = require('../../server/mi-pet/save');
const { moodOf, tick } = require('../../server/mi-pet/sim');
const { view } = require('../../server/mi-pet/view');

const { HOUR } = config;
const NOW = Date.UTC(2026, 5, 15, 12);
const never = () => 0.999; // Ningún suceso aleatorio ocurre
const always = () => 0;

function newGame(species = 'slime', now = NOW) {
  const save = createSave(now);
  const fx = [];

  tick(save, now, never, fx);
  applyAction(save, 'adopt', { species, name: 'Bloop' }, { now, rng: never, fx });
  return save;
}

const act = (save, type, payload = {}, now = NOW, rng = never) => {
  const fx = [];
  tick(save, now, rng, fx);
  applyAction(save, type, payload, { now, rng, fx });
  return fx;
};

const failsWith = (fn, code) => assert.throws(fn, (error) => error instanceof GameError && error.code === code);
const activePet = (save) => save.pets[save.activePetId];

describe('adopción', () => {
  it('la primera mascota inicial es gratis y queda activa con su cama', () => {
    const save = newGame();
    const pet = activePet(save);

    assert.equal(pet.name, 'Bloop');
    assert.equal(save.coins, config.start.coins + ACHIEVEMENT.firstPet.coins);
    assert.equal(pet.room.items[0].id, 'bedBasic');
    assert.ok(save.achievements.firstPet);
  });

  it('no se puede adoptar una especie bloqueada ni repetir especie', () => {
    const save = newGame();
    failsWith(() => act(save, 'adopt', { species: 'cat', name: 'Michi' }), 'species_locked');
    failsWith(() => act(save, 'adopt', { species: 'slime', name: 'Otro' }), 'species_owned');
  });

  it('una especie de pago no sale gratis aunque sea la primera mascota', () => {
    const save = createSave(NOW);
    tick(save, NOW, never);
    save.coins = 0;

    failsWith(() => act(save, 'adopt', { species: 'snail', name: 'Lento' }), 'not_enough_coins');
    assert.deepEqual(save.pets, {});

    save.coins = SPECIES_BY_ID.snail.unlock.coins;
    act(save, 'adopt', { species: 'snail', name: 'Lento' });
    assert.equal(activePet(save).species, 'snail');
    assert.ok(save.coins < SPECIES_BY_ID.snail.unlock.coins);
  });

  it('rechaza nombres vacíos o demasiado largos', () => {
    const save = createSave(NOW);
    tick(save, NOW, never);
    failsWith(() => act(save, 'adopt', { species: 'slime', name: '   ' }), 'pet_name_invalid');
    failsWith(() => act(save, 'adopt', { species: 'slime', name: 'x'.repeat(25) }), 'pet_name_invalid');
  });

  it('la mascota antigua pasa su estado a la primera adopción', () => {
    const save = createSave(NOW, { name: 'Vieja', food: 11, happiness: 22, energy: 33 });
    tick(save, NOW, never);
    act(save, 'adopt', { species: 'ghost', name: 'Vieja' });
    const { stats } = activePet(save);

    assert.deepEqual([stats.hunger, stats.happiness, stats.energy], [11, 22, 33]);
    assert.equal(save.legacy, null);
  });
});

describe('tiempo', () => {
  it('las necesidades bajan con el tiempo aunque no haya página abierta', () => {
    const save = newGame();
    const before = { ...activePet(save).stats };

    tick(save, NOW + 2 * HOUR, never);
    const { stats } = activePet(save);

    assert.ok(stats.hunger < before.hunger);
    assert.ok(stats.fun < before.fun);
    assert.ok(stats.hygiene < before.hygiene);
  });

  it('una ausencia larga no deja ninguna necesidad por debajo del suelo', () => {
    const save = newGame();

    tick(save, NOW + 30 * 24 * HOUR, never);
    Object.entries(activePet(save).stats)
      .filter(([key]) => ['hunger', 'energy', 'hygiene', 'fun'].includes(key))
      .forEach(([, value]) => assert.ok(value >= config.time.offlineFloor));
  });

  it('una ausencia larga, por sí sola, no mata a la mascota aunque enferme', () => {
    const save = newGame();

    tick(save, NOW + 365 * 24 * HOUR, always);
    assert.ok(activePet(save));
    assert.equal(save.pendingFuneral, null);
  });

  it('un reloj que retrocede no rompe nada', () => {
    const save = newGame();
    const before = { ...activePet(save).stats };

    tick(save, NOW - 5 * HOUR, never);
    assert.deepEqual(activePet(save).stats, before);
  });

  it('al volver tras un día o más la mascota dice que te ha echado de menos', () => {
    const save = newGame();
    const fx = tick(save, NOW + 30 * HOUR, never);

    assert.ok(fx.some((entry) => entry.type === 'missedYou'));
  });

  it('dormir recupera energía y hay despertar automático', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.stats.energy = 20;
    pet.asleep = true;
    save.tz = 0;
    tick(save, NOW + 4 * HOUR, never); // Mediodía: no es hora de dormir
    assert.ok(pet.stats.energy > 80);
    assert.equal(pet.asleep, false);
  });

  it('el murciélago duerme de día', () => {
    const save = createSave(NOW);
    tick(save, NOW, never);
    save.unlockedSpecies.push('bat');
    act(save, 'adopt', { species: 'bat', name: 'Noct' });
    const pet = activePet(save);

    pet.stats.energy = 30;
    tick(save, NOW + 5 * 60000, never);
    assert.equal(pet.asleep, true);
  });
});

describe('enfermedad y muerte', () => {
  const neglect = (save) => {
    const pet = activePet(save);

    Object.assign(pet.stats, { hunger: 1, energy: 1, hygiene: 1, fun: 1 });
    return pet;
  };

  it('enferma si varias necesidades pasan demasiado tiempo muy bajas', () => {
    const save = newGame();
    const pet = neglect(save);

    let now = NOW;
    for (let i = 0; i < 40 && !pet.sick; i += 1) {
      now += 0.4 * HOUR; // Pasos cortos: no hay suelo de ausencia
      Object.assign(pet.stats, { hunger: 1, hygiene: 1, fun: 1, energy: 1 });
      tick(save, now, always);
    }
    assert.equal(pet.sick, true);
  });

  it('la medicina la cura y no se malgasta si está sana', () => {
    const save = newGame();
    const pet = activePet(save);

    save.inventory.medicine = 1;
    failsWith(() => act(save, 'useItem', { itemId: 'medicine' }), 'pet_not_sick');
    assert.equal(save.inventory.medicine, 1);

    pet.sick = true;
    act(save, 'useItem', { itemId: 'medicine' });
    assert.equal(pet.sick, false);
    assert.equal(save.inventory.medicine, undefined);
  });

  it('sin atención muere de forma permanente y pasa al cementerio', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.sick = true;
    pet.health = 1;
    const fx = tick(save, NOW + 5 * HOUR, never);

    assert.ok(fx.some((entry) => entry.type === 'death'));
    assert.equal(save.activePetId, null);
    assert.equal(save.graveyard[0].name, 'Bloop');
    assert.equal(save.pendingFuneral.name, 'Bloop');
  });

  it('el botiquín de urgencia solo existe si no te llega para la medicina', () => {
    const save = newGame();
    activePet(save).sick = true;
    save.coins = 500;
    failsWith(() => act(save, 'emergencyKit'), 'kit_not_needed');

    save.coins = 0;
    act(save, 'emergencyKit');
    assert.equal(save.inventory.medicine, 1);

    delete save.inventory.medicine;
    failsWith(() => act(save, 'emergencyKit'), 'kit_used_today');
  });
});

describe('economía', () => {
  it('comprar descuenta el precio y añade al inventario', () => {
    const save = newGame();
    const { coins } = save;

    act(save, 'buy', { itemId: 'pizza', qty: 2 });
    assert.equal(save.coins, coins - 30);
    assert.equal(save.inventory.pizza, 2);
  });

  it('sin saldo no se compra y el saldo nunca es negativo', () => {
    const save = newGame();
    save.coins = 3;

    failsWith(() => act(save, 'buy', { itemId: 'pizza' }), 'not_enough_coins');
    assert.equal(save.coins, 3);
    assert.equal(save.inventory.pizza, undefined);
    assert.throws(() => spendCoins(save, 4));
    assert.throws(() => spendCoins(save, -5));
  });

  it('rechaza cantidades raras, objetos que no se venden y niveles insuficientes', () => {
    const save = newGame();
    save.coins = 9999;

    ['abc', -1, 0, 1.5, 999].forEach((qty) => failsWith(() => act(save, 'buy', { itemId: 'apple', qty }), 'invalid_request'));
    failsWith(() => act(save, 'buy', { itemId: 'goldenTicket' }), 'not_for_sale');
    failsWith(() => act(save, 'buy', { itemId: 'crown' }), 'level_too_low');
  });

  it('un accesorio solo se compra una vez', () => {
    const save = newGame();
    save.level = 10;
    save.coins = 9999;

    act(save, 'buy', { itemId: 'bow' });
    failsWith(() => act(save, 'buy', { itemId: 'bow' }), 'already_owned');
  });

  it('todos los precios del encargo coinciden', () => {
    const prices = {
      apple: 5, strawberries: 8, pizza: 15, cake: 20, coffee: 12, potion: 35, candy: 10,
      bedBasic: 30, bedCloud: 100, rug: 20, sofa: 50, shelf: 40, computer: 150, aquarium: 80,
      arcadeMachine: 120, window: 60, starLamp: 45,
    };

    Object.entries(prices).forEach(([id, price]) => assert.equal(ITEM[id].price, price, id));
  });
});

describe('objetos', () => {
  it('los consumibles aplican su efecto y desaparecen', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.stats.hunger = 10;
    act(save, 'useItem', { itemId: 'apple' });
    assert.ok(pet.stats.hunger >= 19.9);
    assert.equal(save.inventory.apple, 2);
  });

  it('las estadísticas no pasan de 100', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.stats.energy = 95;
    act(save, 'useItem', { itemId: 'coffee' });
    assert.equal(pet.stats.energy, 100);
  });

  it('los accesorios se equipan sin consumirse y ocupan su hueco', () => {
    const save = newGame();
    save.inventory.bow = 1;
    save.inventory.scarf = 1;

    act(save, 'equip', { itemId: 'bow' });
    act(save, 'equip', { itemId: 'scarf' });
    assert.equal(activePet(save).equipped.neck, 'scarf');
    assert.equal(save.inventory.bow, 1);

    act(save, 'unequip', { slot: 'neck' });
    assert.equal(activePet(save).equipped.neck, undefined);
  });

  it('la caja misteriosa entrega un objeto', () => {
    const save = newGame();
    save.inventory.mysteryBox = 1;
    const fx = act(save, 'useItem', { itemId: 'mysteryBox' });

    assert.equal(save.inventory.mysteryBox, undefined);
    assert.ok(fx.some((entry) => entry.type === 'item'));
  });

  it('la máquina del tiempo rellena la necesidad más baja', () => {
    const save = newGame();
    const pet = activePet(save);

    save.inventory.timeMachine = 1;
    pet.stats.hygiene = 5;
    act(save, 'useItem', { itemId: 'timeMachine' });
    assert.equal(pet.stats.hygiene, 100);
  });
});

describe('habitación', () => {
  const room = () => {
    const save = newGame();
    Object.assign(save.inventory, { sofa: 2, window: 1, rug: 1 });
    return save;
  };

  it('coloca, mueve y retira sin perder el mueble', () => {
    const save = room();

    act(save, 'placeFurniture', { itemId: 'sofa', x: 8, y: 6 });
    const { uid } = activePet(save).room.items.at(-1);

    act(save, 'moveFurniture', { uid, x: 10, y: 7 });
    assert.equal(activePet(save).room.items.at(-1).x, 10);

    act(save, 'removeFurniture', { uid });
    assert.equal(activePet(save).room.items.length, 1);
    assert.equal(save.inventory.sofa, 2);
  });

  it('dos muebles no pueden ocupar el mismo sitio', () => {
    const save = room();

    act(save, 'placeFurniture', { itemId: 'sofa', x: 8, y: 6 });
    failsWith(() => act(save, 'placeFurniture', { itemId: 'sofa', x: 9, y: 6 }), 'position_taken');
  });

  it('una alfombra sí puede ir debajo de un mueble', () => {
    const save = room();

    act(save, 'placeFurniture', { itemId: 'sofa', x: 8, y: 6 });
    act(save, 'placeFurniture', { itemId: 'rug', x: 8, y: 6 });
    assert.equal(activePet(save).room.items.length, 3);
  });

  it('respeta los límites y la capa de cada mueble', () => {
    const save = room();

    failsWith(() => act(save, 'placeFurniture', { itemId: 'sofa', x: 14, y: 6 }), 'position_invalid');
    failsWith(() => act(save, 'placeFurniture', { itemId: 'sofa', x: 2, y: 2 }), 'position_invalid');
    failsWith(() => act(save, 'placeFurniture', { itemId: 'window', x: 2, y: 7 }), 'position_invalid');
  });

  it('no se coloca más de lo que se tiene', () => {
    const save = room();

    act(save, 'placeFurniture', { itemId: 'window', x: 2, y: 1 });
    failsWith(() => act(save, 'placeFurniture', { itemId: 'window', x: 8, y: 1 }), 'item_missing');
  });

  it('los temas se compran y solo se usan los comprados', () => {
    const save = room();

    save.level = 10;
    save.coins = 500;
    failsWith(() => act(save, 'setRoom', { theme: 'gamer' }), 'theme_locked');
    act(save, 'buyTheme', { theme: 'gamer' });
    act(save, 'setRoom', { theme: 'gamer', light: 'party' });
    assert.equal(activePet(save).room.theme, 'gamer');
    assert.equal(activePet(save).room.light, 'party');
  });
});

describe('arcade', () => {
  const play = (save, game, score, seconds, extra = {}) => {
    act(save, 'arcadeStart', { game });
    return act(save, 'arcadeFinish', { game, score, ...extra }, NOW + seconds * 1000);
  };
  const result = (fx) => fx.find((entry) => entry.type === 'arcade');

  it('paga según el rendimiento y guarda el récord', () => {
    const save = newGame();
    const low = result(play(save, 'snake', 5, 30));
    const high = result(play(save, 'snake', 30, 60));

    assert.ok(high.coins > low.coins);
    assert.equal(save.records.snake, 30);
  });

  it('rechaza puntuaciones imposibles para el tiempo jugado', () => {
    const save = newGame();
    const { coins } = save;
    const entry = result(play(save, 'snake', 5000, 4));

    assert.equal(entry.rejected, true);
    assert.equal(save.coins, coins);
    assert.equal(save.records.snake, undefined);
  });

  it('terminar una partida exige haberla empezado', () => {
    const save = newGame();
    failsWith(() => act(save, 'arcadeFinish', { game: 'snake', score: 5 }), 'no_game_session');
  });

  it('no se puede cobrar dos veces la misma partida', () => {
    const save = newGame();
    play(save, 'snake', 5, 30);
    failsWith(() => act(save, 'arcadeFinish', { game: 'snake', score: 5 }, NOW + 40000), 'no_game_session');
  });

  it('el tope diario limita lo que paga un juego y se reinicia al día siguiente', () => {
    const save = newGame();
    const cap = config.arcade.games.clicker.dailyCap;
    const total = (fxList) => fxList.reduce((sum, fx) => sum + result(fx).coins, 0);
    const runs = Array.from({ length: 10 }, () => play(save, 'clicker', 150, 15));

    assert.equal(total(runs), cap);

    const nextDay = NOW + 25 * HOUR;
    act(save, 'arcadeStart', { game: 'clicker' }, nextDay);
    const fx = act(save, 'arcadeFinish', { game: 'clicker', score: 150 }, nextDay + 15000);
    assert.ok(result(fx).coins > 0);
  });

  it('los juegos con requisito lo comprueban', () => {
    const save = newGame();

    failsWith(() => act(save, 'arcadeStart', { game: 'minesweeper' }), 'needs_furniture');
    failsWith(() => act(save, 'arcadeStart', { game: 'dodge' }), 'needs_furniture');
    failsWith(() => act(save, 'arcadeStart', { game: 'fishing' }), 'level_too_low');
    save.inventory.computer = 1;
    act(save, 'arcadeStart', { game: 'minesweeper' });
  });

  it('la pesca decide la captura en el servidor', () => {
    const save = newGame();
    save.level = 3;
    const fx = play(save, 'fishing', 999999, 5);

    assert.ok(fx.some((entry) => entry.type === 'fish'));
    assert.ok(result(fx).score < 100);
  });
});

describe('progresión', () => {
  it('cada nivel cuesta más que el anterior', () => {
    for (let level = 1; level < config.level.max - 1; level += 1) {
      assert.ok(xpToNext(level + 1) > xpToNext(level));
    }
  });

  it('subir de nivel conserva la experiencia sobrante y paga', () => {
    const save = newGame();
    const fx = [];

    save.xp = 0;
    save.level = 1;
    const { coins } = save;
    addXp(save, xpToNext(1) + 5, fx, NOW);

    assert.equal(save.level, 2);
    assert.equal(save.xp, 5);
    assert.ok(save.coins > coins);
  });

  it('los logros se desbloquean solos, una vez y con fecha', () => {
    const save = newGame();

    save.stats.gamesPlayed = 9;
    save.coins = 0;
    act(save, 'arcadeStart', { game: 'guess' });
    act(save, 'arcadeFinish', { game: 'guess', score: 10 }, NOW + 5000);
    const date = save.achievements.arcade10;

    assert.equal(date, NOW + 5000);
    const fx = act(save, 'interact', { kind: 'greet' }, NOW + 6000);
    assert.equal(fx.filter((entry) => entry.type === 'achievement' && entry.id === 'arcade10').length, 0);
  });

  it('todos los logros usan condiciones reales', () => {
    Object.values(ACHIEVEMENT).forEach((achievement) => {
      assert.ok(achievement.flag || (achievement.stat && achievement.goal), achievement.id);
    });
  });

  it('una evolución exige todos sus requisitos y la poción', () => {
    const save = newGame();
    const pet = activePet(save);

    failsWith(() => act(save, 'evolve', { branch: 'happy' }), 'evolution_not_ready');

    save.level = config.evolution.level;
    pet.careDays = config.evolution.careDays;
    pet.traits.care = 20;
    pet.stats.happiness = 90;
    failsWith(() => act(save, 'evolve', { branch: 'happy' }), 'needs_growth_potion');
    failsWith(() => act(save, 'evolve', { branch: 'smart' }), 'evolution_not_ready');

    save.inventory.growthPotion = 1;
    act(save, 'evolve', { branch: 'happy' });
    assert.equal(pet.evolution, 'happy');
    assert.equal(save.inventory.growthPotion, undefined);
    assert.ok(save.discoveredEvolutions.includes('slime:happy'));
    assert.ok(evolutionStatus(save, pet).every((entry) => !entry.ready));
  });

  it('el cristal de personalidad cambia la personalidad dominante', () => {
    const save = newGame();
    const pet = activePet(save);

    save.inventory.personalityCrystal = 1;
    pet.traits.care = 10;
    act(save, 'useItem', { itemId: 'personalityCrystal' });
    assert.equal(view(save, NOW).pets[pet.id].personality, 'smart');
  });

  it('el Experimento se desbloquea con el tubo de ensayo o en el nivel 20', () => {
    const save = newGame();
    const status = () => view(save, NOW).speciesStatus.find((entry) => entry.id === 'experiment');

    assert.equal(status().unlocked, false);
    save.flags.testTube = true;
    assert.equal(status().unlocked, true);
    save.flags.testTube = false;
    save.level = 20;
    assert.equal(status().unlocked, true);
  });

  it('el ticket dorado desbloquea el Gato cósmico', () => {
    const save = newGame();

    save.inventory.goldenTicket = 1;
    act(save, 'useItem', { itemId: 'goldenTicket' });
    assert.ok(view(save, NOW).speciesStatus.find((entry) => entry.id === 'cat').unlocked);
  });

  it('el coleccionista se puede conseguir: hay al menos 10 especies adoptables', () => {
    assert.ok(SPECIES.length >= ACHIEVEMENT.collector.goal);
  });
});

describe('estados', () => {
  const moodWith = (changes) => {
    const save = newGame();
    const pet = activePet(save);

    Object.assign(pet.stats, { hunger: 80, energy: 80, hygiene: 80, fun: 80, happiness: 60 });
    Object.assign(pet.stats, changes);
    return moodOf(pet);
  };

  it('cada umbral activa su estado', () => {
    assert.equal(moodWith({ hunger: 10 }), 'hungry');
    assert.equal(moodWith({ energy: 10 }), 'tired');
    assert.equal(moodWith({ hygiene: 10 }), 'dirty');
    assert.equal(moodWith({ fun: 10 }), 'bored');
    assert.equal(moodWith({ happiness: 60 }), 'happy');
    assert.equal(moodWith({ happiness: 90 }), 'veryHappy');
    assert.equal(moodWith({ happiness: 80, affection: 95 }), 'inLove');
  });

  it('la enfermedad y el sueño tienen prioridad', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.sick = true;
    assert.equal(moodOf(pet), 'sick');
    pet.asleep = true;
    assert.equal(moodOf(pet), 'sleeping');
  });
});

describe('interacciones', () => {
  it('tienen cooldown y suben el cariño', () => {
    const save = newGame();
    const before = activePet(save).stats.affection;

    act(save, 'interact', { kind: 'pet' });
    assert.ok(activePet(save).stats.affection > before);
    failsWith(() => act(save, 'interact', { kind: 'pet' }), 'on_cooldown');
  });

  it('una petición inventada no pasa', () => {
    const save = newGame();

    failsWith(() => act(save, 'interact', { kind: 'constructor' }), 'invalid_request');
    failsWith(() => act(save, 'hackear'), 'invalid_request');
    failsWith(() => act(save, '__proto__'), 'invalid_request');
  });

  it('el tope diario impide farmear experiencia con caricias', () => {
    const save = newGame();
    const { xpCap } = config.interactionDaily;
    let total = 0;

    for (let index = 0; index < 200; index += 1) {
      const fx = act(save, 'interact', { kind: 'greet' }, NOW + index * 10000);
      total += fx.filter((entry) => entry.type === 'xp').reduce((sum, entry) => sum + entry.amount, 0);
    }
    assert.ok(total <= xpCap + 5);
  });
});

describe('eventos, misiones y diaria', () => {
  it('la recompensa diaria se reclama una vez al día', () => {
    const save = newGame();
    const { coins } = save;

    act(save, 'dailyClaim');
    assert.ok(save.coins >= coins + 20);
    failsWith(() => act(save, 'dailyClaim'), 'daily_claimed');
    act(save, 'dailyClaim', {}, NOW + 25 * HOUR);
    assert.equal(save.dailyClaims, 2);
  });

  it('saltarse días no reinicia el calendario', () => {
    const save = newGame();

    act(save, 'dailyClaim');
    act(save, 'dailyClaim', {}, NOW + 10 * 24 * HOUR);
    assert.equal(save.dailyClaims, 2);
  });

  it('los eventos respetan su espera y no se acumulan', () => {
    const save = newGame();

    tick(save, NOW + 0.5 * HOUR, always);
    assert.equal(save.pendingEvent, null); // Aún en espera

    tick(save, NOW + 5 * HOUR, always);
    assert.ok(EVENT[save.pendingEvent.id]);
    const { id } = save.pendingEvent;
    tick(save, NOW + 6 * HOUR, always);
    assert.equal(save.pendingEvent.id, id);
  });

  it('reclamar un evento entrega su recompensa una sola vez', () => {
    const save = newGame();

    save.pendingEvent = { id: 'box', at: NOW };
    act(save, 'eventClaim');
    assert.equal(save.inventory.mysteryBox, 1);
    failsWith(() => act(save, 'eventClaim'), 'no_event');
  });

  it('las misiones se completan y pagan una vez', () => {
    const save = newGame();

    save.daily.missions = [{ id: 'bath', done: false }];
    const fx = act(save, 'bath');
    assert.ok(fx.some((entry) => entry.type === 'mission'));
    assert.equal(save.daily.missions[0].done, true);
  });
});

describe('exploración', () => {
  it('una expedición termina a su hora y da recompensas', () => {
    const save = newGame();
    const zone = ZONE.forest;
    const { coins } = save;

    act(save, 'exploreStart', { zone: 'forest' });
    failsWith(() => act(save, 'exploreClaim', {}, NOW + 60000), 'expedition_running');
    failsWith(() => act(save, 'exploreStart', { zone: 'forest' }), 'expedition_running');

    const fx = act(save, 'exploreClaim', {}, NOW + zone.minutes * 60000);
    assert.ok(save.coins >= coins + zone.coins[0]);
    assert.ok(fx.some((entry) => entry.type === 'expedition'));
    assert.equal(save.expedition, null);
  });

  it('las zonas exigen nivel o logro', () => {
    const save = newGame();

    failsWith(() => act(save, 'exploreStart', { zone: 'beach' }), 'level_too_low');
    save.level = 50;
    failsWith(() => act(save, 'exploreStart', { zone: 'space' }), 'zone_locked');
  });

  it('no se puede explorar sin energía ni enferma', () => {
    const save = newGame();
    const pet = activePet(save);

    pet.stats.energy = 2;
    failsWith(() => act(save, 'exploreStart', { zone: 'forest' }), 'too_tired');
    pet.stats.energy = 90;
    pet.sick = true;
    failsWith(() => act(save, 'exploreStart', { zone: 'forest' }), 'pet_is_sick');
  });

  it('cada zona tiene datos completos', () => {
    assert.equal(ZONES.length, 6);
    ZONES.forEach((zone) => {
      zone.items.forEach(({ id }) => assert.ok(ITEM[id], id));
      assert.ok(zone.stories.length);
    });
  });
});

describe('guardado', () => {
  it('sobrevive a pasar por JSON', () => {
    const save = newGame();
    const copy = loadSave(JSON.parse(JSON.stringify(save)), null, NOW);

    assert.equal(copy.pets[copy.activePetId].name, 'Bloop');
    assert.equal(copy.coins, save.coins);
  });

  it('repara campos dañados sin perder el resto', () => {
    const save = newGame();
    const raw = JSON.parse(JSON.stringify(save));

    raw.coins = -500;
    raw.pets[raw.activePetId].stats.hunger = 9999;
    raw.pets[raw.activePetId].stats.energy = 'mucho';
    raw.inventory.objetoInventado = 5;
    raw.inventory.apple = -2;
    raw.pets[raw.activePetId].room.items.push({ id: 'noExiste', uid: 1, x: 1, y: 1 });
    const clean = sanitizeSave(raw, NOW);
    const pet = clean.pets[clean.activePetId];

    assert.equal(clean.coins, 0);
    assert.equal(pet.stats.hunger, 100);
    assert.equal(typeof pet.stats.energy, 'number');
    assert.equal(clean.inventory.objetoInventado, undefined);
    assert.equal(clean.inventory.apple, undefined);
    assert.equal(pet.room.items.length, 1);
  });

  it('si la partida está destrozada, recupera la copia anterior', () => {
    const save = newGame();
    const backup = JSON.parse(JSON.stringify(save));
    const recovered = loadSave({ basura: true }, backup, NOW);

    assert.equal(recovered.pets[recovered.activePetId].name, 'Bloop');
    assert.equal(recovered.recovered, true);
  });

  it('sin copia válida empieza de cero y lo indica', () => {
    const fresh = loadSave('nada', null, NOW);

    assert.deepEqual(fresh.pets, {});
    assert.equal(fresh.recovered, false);
    assert.equal(loadSave({ basura: true }, null, NOW).recovered, true);
  });

  it('una partida de una versión futura no se toca', () => {
    assert.throws(() => loadSave({ version: 999, pets: {} }, null, NOW));
  });

  it('un reloj futuro guardado no da tiempo extra', () => {
    const save = newGame();
    const raw = JSON.parse(JSON.stringify(save));

    raw.lastTick = NOW + 1000 * HOUR;
    assert.equal(sanitizeSave(raw, NOW).lastTick, NOW);
  });
});

describe('datos', () => {
  it('cada especie tiene diálogos propios, paleta y cuatro evoluciones', () => {
    SPECIES.forEach(({ id, palette, evolutions }) => {
      assert.ok(DIALOGUES.species[id]?.idle?.length >= 3, id);
      assert.ok(palette.body && palette.shade && palette.light, id);
      assert.equal(Object.keys(evolutions).length, 4, id);
    });
  });

  it('hay tres iniciales y ocho desbloqueables', () => {
    assert.equal(SPECIES.filter((species) => species.starter).length, 3);
    assert.equal(SPECIES.filter((species) => !species.starter).length, 8);
    SPECIES.filter((species) => !species.starter).forEach((species) => assert.ok(species.unlock, species.id));
  });

  it('los desbloqueos por logro apuntan a logros que existen', () => {
    Object.values(SPECIES_BY_ID).forEach(({ unlock }) => {
      if (unlock?.achievement) assert.ok(ACHIEVEMENT[unlock.achievement]);
    });
  });

  it('los ids de objeto son únicos y cada uno tiene nombre y descripción en dos idiomas', () => {
    assert.equal(new Set(ITEMS.map((item) => item.id)).size, ITEMS.length);
    ITEMS.forEach((item) => {
      assert.equal(item.name.length, 2, item.id);
      assert.equal(item.desc.length, 2, item.id);
    });
  });
});
