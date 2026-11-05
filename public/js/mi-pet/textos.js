// Textos de la interfaz del juego en ambos idiomas. Los de contenido (objetos, diálogos…)
// están con sus datos en server/mi-pet/data/.
//
// T('clave') devuelve el texto en el idioma actual; {x} se sustituye con T('clave', { x }).

const TEXTS = {
  es: {
    'nav.home': 'Mascota', 'nav.shop': 'Tienda', 'nav.inventory': 'Inventario', 'nav.room': 'Habitación',
    'nav.arcade': 'Arcade', 'nav.explore': 'Explorar', 'nav.collection': 'Colección',
    'nav.achievements': 'Logros', 'nav.journal': 'Diario', 'nav.profile': 'Perfil',
    'nav.label': 'Secciones del juego',

    'stat.happiness': 'Felicidad', 'stat.hunger': 'Hambre', 'stat.energy': 'Energía',
    'stat.hygiene': 'Higiene', 'stat.fun': 'Diversión', 'stat.affection': 'Cariño', 'stat.health': 'Salud',

    'mood.sleeping': 'Dormido', 'mood.sick': 'Enfermo', 'mood.hungry': 'Hambriento', 'mood.tired': 'Cansado',
    'mood.dirty': 'Sucio', 'mood.bored': 'Aburrido', 'mood.inLove': 'Enamorado de ti', 'mood.veryHappy': 'Muy feliz',
    'mood.happy': 'Feliz', 'mood.neutral': 'Tranquilo',

    'act.feed': 'Comer', 'act.play': 'Jugar', 'act.bath': 'Bañar', 'act.sleep': 'Dormir', 'act.wake': 'Despertar',
    'act.clean': 'Limpiar', 'act.photo': 'Foto', 'act.pet': 'Acariciar', 'act.talk': 'Hablar', 'act.greet': 'Saludar',
    'act.tickle': 'Cosquillas', 'act.hug': 'Abrazar', 'act.sheet': 'Ficha', 'act.daily': 'Recompensa diaria',
    'act.dailyDone': 'Diaria reclamada', 'act.event': '¡Algo ha pasado!', 'care.title': 'Cuidados', 'love.title': 'Mimos',

    'home.missions': 'Misiones de hoy', 'home.level': 'Nivel', 'home.away': '{pet} está de expedición en {zone}.',
    'home.back': 'Ver expedición', 'home.noFood': 'No tienes comida. La tienda abre las 24 horas.',
    'home.goShop': 'Ir a la tienda', 'home.feedTitle': '¿Qué le das?', 'home.kit': 'Botiquín de urgencia gratis',
    'home.critical': '{pet} está muy grave. Necesita una medicina ya.', 'home.sick': '{pet} está enfermo.',
    'home.useMedicine': 'Dar medicina', 'home.buyMedicine': 'Comprar medicina',

    'sheet.species': 'Especie', 'sheet.personality': 'Personalidad', 'sheet.affinity': 'Afinidad', 'sheet.age': 'Edad',
    'sheet.days': '{n} días', 'sheet.careDays': 'Días de cuidados', 'sheet.equipped': 'Lleva puesto', 'sheet.nothing': 'Nada. Va a lo natural.',
    'sheet.rename': 'Cambiar nombre', 'sheet.evolutions': 'Evolución', 'sheet.evolve': 'Evolucionar',
    'sheet.evolved': 'Ya ha evolucionado: {name}.', 'sheet.remove': 'Quitar',
    'trait.care': 'Cariñosa', 'trait.smart': 'Inteligente', 'trait.adventure': 'Aventurera', 'trait.neglect': 'Descuidada',
    'tier.stranger': 'Desconocidos', 'tier.acquaintance': 'Conocidos', 'tier.friend': 'Amigos', 'tier.bestFriend': 'Mejores amigos', 'tier.soulmate': 'Almas gemelas',
    'req.level': 'Nivel {n}', 'req.careDays': '{n} días de cuidados', 'req.personality': 'Personalidad adecuada', 'req.stat': 'Estadística alta',
    'req.potion': 'Necesitas una Poción de crecimiento.',

    'common.close': 'Cerrar', 'common.cancel': 'Cancelar', 'common.confirm': 'Confirmar', 'common.buy': 'Comprar',
    'common.use': 'Usar', 'common.equip': 'Equipar', 'common.unequip': 'Quitar', 'common.place': 'Colocar',
    'common.save': 'Guardar', 'common.all': 'Todo', 'common.level': 'Nivel {n}', 'common.owned': 'Ya es tuyo', 'common.have': 'Tienes: {n}',
    'common.locked': 'Bloqueado', 'common.retry': 'Otra vez', 'common.start': 'Empezar', 'common.loading': 'Cargando…', 'common.today': 'Hoy',

    'shop.search': 'Buscar en la tienda', 'shop.filter': 'Filtro', 'shop.filter.all': 'Todo', 'shop.filter.afford': 'Me lo puedo permitir',
    'shop.filter.new': 'Sin adquirir', 'shop.empty': 'Nada por aquí. Prueba con otra búsqueda.', 'shop.qty': 'Cantidad', 'shop.total': 'Total',
    'shop.needLevel': 'Requiere nivel {n}', 'shop.poor': 'No te llega el saldo.', 'shop.bought': '¡Comprado! Ya está en tu inventario.',
    'shop.confirm': 'Comprar por {n} 🍈', 'cat.food': 'Comida', 'cat.drink': 'Bebidas', 'cat.medicine': 'Medicinas', 'cat.furniture': 'Muebles',
    'cat.accessory': 'Accesorios', 'cat.special': 'Especiales', 'cat.all': 'Todo',

    'inv.empty': 'Esta categoría está vacía.', 'inv.placed': 'Colocados: {n}', 'inv.goRoom': 'Ir a la habitación', 'inv.confirmUse': '¿Usar {item}?',
    'inv.worn': 'Puesto', 'inv.notUsable': 'Se usa desde la ficha de la mascota, cuando pueda evolucionar.', 'inv.ticket': 'Se gasta al usarlo.',

    'room.furniture': 'Muebles', 'room.theme': 'Tema', 'room.light': 'Luz', 'room.place': 'Elige un mueble y pulsa en la habitación.',
    'room.placing': 'Colocando: {item}. Pulsa un hueco de la habitación.', 'room.cancel': 'Cancelar colocación', 'room.none': 'No tienes muebles sin colocar. Pásate por la tienda.',
    'room.selected': 'Seleccionado: {item}', 'room.moveHint': 'Pulsa otro sitio o usa las flechas para moverlo.', 'room.remove': 'Retirar',
    'room.use': 'Usar', 'room.moved': 'Movido.', 'room.canvas': 'Habitación de {pet}', 'room.unlock': 'Desbloquear por {n} 🍈', 'room.apply': 'Usar tema', 'room.current': 'En uso',
    'light.auto': 'Según la hora', 'light.warm': 'Cálida', 'light.cool': 'Fría', 'light.party': 'Fiesta', 'light.dim': 'Tenue',
    'dir.up': 'Arriba', 'dir.down': 'Abajo', 'dir.left': 'Izquierda', 'dir.right': 'Derecha',

    'arcade.intro': 'Gana meloncillos jugando. Cada juego tiene un tope diario, así que mañana habrá más.',
    'arcade.today': 'Hoy: {n} / {max} 🍈', 'arcade.record': 'Récord: {n}', 'arcade.play': 'Jugar', 'arcade.needsLevel': 'Requiere nivel {n}',
    'arcade.needsFurniture': 'Necesitas: {item}', 'arcade.result': 'Fin de la partida', 'arcade.score': 'Puntuación: {n}', 'arcade.earned': '+{n} 🍈',
    'arcade.capped': 'Tope diario alcanzado: esta partida paga menos.', 'arcade.rejected': 'Esa puntuación no cuadra con el tiempo jugado. Sin recompensa.',
    'arcade.record.new': '¡Nuevo récord!', 'arcade.difficulty': 'Dificultad', 'diff.easy': 'Fácil', 'diff.normal': 'Normal', 'diff.hard': 'Difícil',
    'game.snake': 'Snake', 'game.memory': 'Memory', 'game.fishing': 'Pesca', 'game.clicker': 'Clicker', 'game.dodge': 'Esquivar', 'game.guess': 'Adivina el número', 'game.minesweeper': 'Buscaminas',
    'game.snake.help': 'Come bits sin chocar. Flechas, WASD o botones táctiles.',
    'game.memory.help': 'Encuentra todas las parejas con los mínimos movimientos.',
    'game.fishing.help': 'Lanza, espera y pulsa rápido cuando pique.',
    'game.clicker.help': 'Pulsa todo lo que puedas antes de que se acabe el tiempo.',
    'game.dodge.help': 'Muévete a los lados y aguanta sin que te alcance nada.',
    'game.guess.help': 'Adivina el número con las pistas de mayor o menor.',
    'game.minesweeper.help': 'Abre todas las casillas sin mina. Clic derecho o modo bandera para marcar.',
    'g.score': 'Puntos', 'g.time': 'Tiempo', 'g.moves': 'Movimientos', 'g.pairs': 'Parejas', 'g.goal': 'Objetivo', 'g.mines': 'Minas', 'g.tries': 'Intentos',
    'g.up': 'Arriba', 'g.down': 'Abajo', 'g.left': 'Izquierda', 'g.right': 'Derecha', 'g.card': 'Carta {n}', 'g.cell': 'Casilla {x}, {y}',
    'g.cast': 'Lanzar caña', 'g.reel': '¡Recoger!', 'g.waiting': 'Esperando… no hagas ruido.', 'g.bite': '¡HA PICADO!', 'g.tooSoon': 'Te has adelantado y el pez se ha ido.',
    'g.tooLate': 'Demasiado tarde: se ha llevado el cebo.', 'g.caught': 'Has pescado: {fish}', 'rarity.junk': 'Basura', 'rarity.common': 'Común', 'rarity.rare': 'Raro', 'rarity.legendary': 'Legendario',
    'g.click': '¡Pulsa!', 'g.guess': 'Probar', 'g.guessInput': 'Tu número entre {min} y {max}', 'g.higher': 'Es mayor que {n}.', 'g.lower': 'Es menor que {n}.', 'g.right2': '¡Era el {n}!', 'g.wrong': 'Era el {n}.',
    'g.flagMode': 'Modo bandera', 'g.lost': 'Vaya. Pisaste una mina.', 'g.won': '¡Lo has conseguido!',

    'explore.intro': 'Manda a tu mascota de expedición. Vuelve sola, con historias y algo en los bolsillos.',
    'explore.duration': '{n} min', 'explore.energy': 'Energía: {n}', 'explore.go': 'Salir de expedición', 'explore.needAch': 'Requiere el logro «{name}»',
    'explore.running': 'Expedición en curso: {zone}', 'explore.left': 'Vuelve en {time}', 'explore.claim': 'Recibirla en casa', 'explore.report': 'Vuelta de {zone}',
    'explore.found': 'Encontrado', 'explore.nothing': 'Solo arena y buenos recuerdos.', 'explore.reward': 'Recompensa: {coins} 🍈 y {xp} XP',

    'col.pets': 'Mis mascotas', 'col.species': 'Especies', 'col.evolutions': 'Evoluciones', 'col.items': 'Coleccionables', 'col.grave': 'Cementerio',
    'col.active': 'Activa', 'col.switch': 'Cuidar', 'col.adopt': 'Adoptar', 'col.adoptFor': 'Adoptar por {n} 🍈', 'col.nursery': 'Las demás descansan en la guardería: solo pasa el tiempo para la activa.',
    'col.unknown': '???', 'col.discovered': 'Descubiertas: {n} / {max}', 'col.noItems': 'Aún no has encontrado nada. Prueba a explorar.', 'col.noGrave': 'Nadie descansa aquí todavía. Que dure.',
    'col.born': 'Nació el {date}', 'col.died': 'Se fue el {date}', 'col.owned': 'Ya la tienes', 'unlock.level': 'Nivel {n}', 'unlock.coins': '{n} 🍈', 'unlock.achievement': 'Logro: {name}',
    'unlock.ticket': 'Ticket dorado', 'unlock.flagOrLevel': 'Un hallazgo misterioso o nivel {n}',

    'ach.progress': '{a} / {b}', 'ach.unlockedOn': 'Conseguido el {date}', 'ach.reward': 'Recompensa: {n} 🍈', 'ach.count': '{a} de {b} logros', 'ach.hidden': 'Logro oculto',

    'journal.diary': 'Diario', 'journal.album': 'Álbum', 'journal.empty': 'Todavía no ha pasado nada. Paciencia.', 'journal.noPhotos': 'Sin fotos. Pulsa «Foto» en la habitación.',
    'photo.adopted': 'El día de la adopción', 'photo.evolved': 'Evolución', 'photo.photo': 'Un momento cualquiera',

    'prof.title': 'Perfil de {user}', 'prof.stats': 'Estadísticas', 'prof.levels': 'Recompensas por nivel', 'prof.settings': 'Ajustes', 'prof.next': 'Siguiente recompensa: nivel {n}', 'prof.max': 'Nivel máximo',
    'prof.xp': '{a} / {b} XP', 'prof.volume': 'Volumen', 'prof.mute': 'Silenciar todo', 'prof.music': 'Música de fondo', 'prof.widget': 'Mostrar la mascota en otras páginas', 'prof.logout': 'Cerrar sesión',
    's.daysPlayed': 'Días jugados', 's.playMs': 'Tiempo total', 's.coinsEarned': 'Meloncillos ganados', 's.coinsSpent': 'Meloncillos gastados', 's.gamesPlayed': 'Minijuegos completados',
    's.itemsBought': 'Objetos comprados', 's.petsAdopted': 'Mascotas adoptadas', 's.evolutions': 'Evoluciones', 's.discovered': 'Evoluciones descubiertas', 's.expeditions': 'Expediciones',

    'adopt.title': 'Bienvenido al universo', 'adopt.intro1': 'Detrás de esta ventana hay un pequeño universo digital. Las criaturas que viven en él nacen de archivos olvidados, ventiladores viejos y alguna que otra pestaña sin cerrar.',
    'adopt.intro2': 'Una de ellas lleva tiempo esperando a alguien. Promete dar la lata, pedir comida y quererte mucho. Cuídala y seguirá viviendo aunque cierres la página.',
    'adopt.next': 'Elegir mascota', 'adopt.choose': 'Elige a tu compañero', 'adopt.nameLabel': 'Ponle nombre', 'adopt.color': 'Color', 'adopt.confirm': 'Adoptar', 'adopt.back': 'Volver',
    'adopt.traits': 'Personalidad', 'adopt.funeral': 'En memoria', 'adopt.funeralText': '{pet} se ha ido para siempre. Descansa en el cementerio de la colección.', 'adopt.continue': 'Seguir adelante',
    'adopt.recovered': 'Tu partida estaba dañada y se ha recuperado la última copia válida.',

    'daily.title': 'Recompensa diaria', 'daily.claim': 'Reclamar', 'daily.claimed': 'Ya has reclamado la de hoy. Mañana habrá otra.', 'daily.note': 'Avanza solo cuando reclamas: no pasa nada por faltar un día.', 'daily.day': 'Día {n}',
    'event.title': 'Evento', 'event.claim': 'Aceptar',
    'toast.level': '¡Nivel {n}!', 'toast.achievement': 'Logro: {name}', 'toast.mission': 'Misión completada: {name}', 'toast.item': 'Has conseguido: {item}', 'toast.affinity': 'Vuestra relación ha crecido: {tier}. +Regalo',
    'toast.sick': '{pet} se ha puesto enfermo.', 'toast.critical': '¡{pet} está muy grave!', 'toast.photo': 'Foto guardada en el álbum.', 'toast.personality': 'Nueva personalidad: {trait}', 'toast.restored': 'Recuperado: {stat}', 'toast.species': 'Especie desbloqueada: {name}',
    'evo.title': '¡Evolución!', 'evo.text': '{pet} ahora es {name}.',
    'trivia.title': 'Curiosidad',
    'a11y.pet': 'Tu mascota, {pet}, en estado {mood}', 'a11y.coins': '{n} meloncillos', 'a11y.sound': 'Activar o silenciar el sonido', 'a11y.widget': 'Mascota',

    'err.not_enough_coins': 'No tienes suficientes meloncillos.', 'err.item_missing': 'No tienes ese objeto disponible.', 'err.level_too_low': 'Aún no tienes nivel para eso.',
    'err.already_owned': 'Ya lo tienes.', 'err.not_for_sale': 'Esto no se vende.', 'err.on_cooldown': 'Dale un momento, por favor.', 'err.too_tired': 'Está demasiado cansado.',
    'err.pet_away': 'Está de expedición.', 'err.no_pet': 'No tienes ninguna mascota activa.', 'err.pet_not_sick': 'No está enfermo: no malgastes la medicina.', 'err.position_taken': 'Ese sitio está ocupado.',
    'err.position_invalid': 'Ahí no cabe.', 'err.room_already_clean': 'La habitación ya está limpia.', 'err.theme_locked': 'Aún no tienes ese tema.', 'err.needs_furniture': 'Te falta el mueble necesario.',
    'err.species_locked': 'Esa especie sigue bloqueada.', 'err.species_owned': 'Ya tienes esa especie.', 'err.evolution_not_ready': 'Todavía no cumple los requisitos.', 'err.needs_growth_potion': 'Necesitas una Poción de crecimiento.',
    'err.expedition_running': 'Ya hay una expedición en curso.', 'err.no_expedition': 'No hay ninguna expedición.', 'err.zone_locked': 'Esa zona está bloqueada.', 'err.pet_is_sick': 'Está enfermo: no puede salir.',
    'err.daily_claimed': 'Ya has reclamado la de hoy.', 'err.no_event': 'El evento ha terminado.', 'err.no_game_session': 'Esa partida ya no es válida.', 'err.item_not_usable': 'Ese objeto no se usa así.',
    'err.use_evolution_panel': 'Se usa desde la ficha de la mascota.', 'err.kit_not_needed': 'No necesitas el botiquín.', 'err.kit_used_today': 'Ya has usado el botiquín hoy.', 'err.pet_name_invalid': 'El nombre debe tener de 1 a 24 caracteres.',
    'err.save_unavailable': 'No se ha podido abrir la partida. Inténtalo más tarde.', 'err.too_many_attempts': 'Demasiado rápido. Espera un poco.', 'err.database_unavailable': 'El juego no está disponible ahora mismo.',
    'err.connection': 'No hay conexión con el servidor.', 'err.generic': 'Algo ha salido mal.',
  },
  en: {
    'nav.home': 'Pet', 'nav.shop': 'Shop', 'nav.inventory': 'Inventory', 'nav.room': 'Room',
    'nav.arcade': 'Arcade', 'nav.explore': 'Explore', 'nav.collection': 'Collection',
    'nav.achievements': 'Achievements', 'nav.journal': 'Diary', 'nav.profile': 'Profile',
    'nav.label': 'Game sections',

    'stat.happiness': 'Happiness', 'stat.hunger': 'Hunger', 'stat.energy': 'Energy',
    'stat.hygiene': 'Hygiene', 'stat.fun': 'Fun', 'stat.affection': 'Affection', 'stat.health': 'Health',

    'mood.sleeping': 'Asleep', 'mood.sick': 'Sick', 'mood.hungry': 'Hungry', 'mood.tired': 'Tired',
    'mood.dirty': 'Dirty', 'mood.bored': 'Bored', 'mood.inLove': 'In love with you', 'mood.veryHappy': 'Very happy',
    'mood.happy': 'Happy', 'mood.neutral': 'Calm',

    'act.feed': 'Feed', 'act.play': 'Play', 'act.bath': 'Bath', 'act.sleep': 'Sleep', 'act.wake': 'Wake up',
    'act.clean': 'Clean', 'act.photo': 'Photo', 'act.pet': 'Pet', 'act.talk': 'Talk', 'act.greet': 'Greet',
    'act.tickle': 'Tickle', 'act.hug': 'Hug', 'act.sheet': 'Profile', 'act.daily': 'Daily reward',
    'act.dailyDone': 'Daily claimed', 'act.event': 'Something happened!', 'care.title': 'Care', 'love.title': 'Cuddles',

    'home.missions': 'Today\'s missions', 'home.level': 'Level', 'home.away': '{pet} is on an expedition to {zone}.',
    'home.back': 'See expedition', 'home.noFood': 'You have no food. The shop is open 24 hours.',
    'home.goShop': 'Go to shop', 'home.feedTitle': 'What will you give it?', 'home.kit': 'Free emergency kit',
    'home.critical': '{pet} is in a very bad way. It needs medicine now.', 'home.sick': '{pet} is sick.',
    'home.useMedicine': 'Give medicine', 'home.buyMedicine': 'Buy medicine',

    'sheet.species': 'Species', 'sheet.personality': 'Personality', 'sheet.affinity': 'Affinity', 'sheet.age': 'Age',
    'sheet.days': '{n} days', 'sheet.careDays': 'Days of care', 'sheet.equipped': 'Wearing', 'sheet.nothing': 'Nothing. Keeping it natural.',
    'sheet.rename': 'Rename', 'sheet.evolutions': 'Evolution', 'sheet.evolve': 'Evolve',
    'sheet.evolved': 'Already evolved: {name}.', 'sheet.remove': 'Remove',
    'trait.care': 'Loving', 'trait.smart': 'Clever', 'trait.adventure': 'Adventurous', 'trait.neglect': 'Neglected',
    'tier.stranger': 'Strangers', 'tier.acquaintance': 'Acquaintances', 'tier.friend': 'Friends', 'tier.bestFriend': 'Best friends', 'tier.soulmate': 'Soulmates',
    'req.level': 'Level {n}', 'req.careDays': '{n} days of care', 'req.personality': 'Matching personality', 'req.stat': 'High stat',
    'req.potion': 'You need a Growth potion.',

    'common.close': 'Close', 'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.buy': 'Buy',
    'common.use': 'Use', 'common.equip': 'Equip', 'common.unequip': 'Remove', 'common.place': 'Place',
    'common.save': 'Save', 'common.all': 'All', 'common.level': 'Level {n}', 'common.owned': 'Owned', 'common.have': 'You have: {n}',
    'common.locked': 'Locked', 'common.retry': 'Again', 'common.start': 'Start', 'common.loading': 'Loading…', 'common.today': 'Today',

    'shop.search': 'Search the shop', 'shop.filter': 'Filter', 'shop.filter.all': 'All', 'shop.filter.afford': 'I can afford it',
    'shop.filter.new': 'Not owned', 'shop.empty': 'Nothing here. Try another search.', 'shop.qty': 'Quantity', 'shop.total': 'Total',
    'shop.needLevel': 'Requires level {n}', 'shop.poor': 'Not enough balance.', 'shop.bought': 'Bought! It is in your inventory.',
    'shop.confirm': 'Buy for {n} 🍈', 'cat.food': 'Food', 'cat.drink': 'Drinks', 'cat.medicine': 'Medicine', 'cat.furniture': 'Furniture',
    'cat.accessory': 'Accessories', 'cat.special': 'Special', 'cat.all': 'All',

    'inv.empty': 'This category is empty.', 'inv.placed': 'Placed: {n}', 'inv.goRoom': 'Go to room', 'inv.confirmUse': 'Use {item}?',
    'inv.worn': 'Worn', 'inv.notUsable': 'Used from the pet profile, when it can evolve.', 'inv.ticket': 'Consumed on use.',

    'room.furniture': 'Furniture', 'room.theme': 'Theme', 'room.light': 'Light', 'room.place': 'Choose a piece and tap the room.',
    'room.placing': 'Placing: {item}. Tap a free spot in the room.', 'room.cancel': 'Cancel placing', 'room.none': 'No unplaced furniture. Visit the shop.',
    'room.selected': 'Selected: {item}', 'room.moveHint': 'Tap another spot or use the arrows to move it.', 'room.remove': 'Remove',
    'room.use': 'Use', 'room.moved': 'Moved.', 'room.canvas': '{pet}\'s room', 'room.unlock': 'Unlock for {n} 🍈', 'room.apply': 'Use theme', 'room.current': 'In use',
    'light.auto': 'By the clock', 'light.warm': 'Warm', 'light.cool': 'Cool', 'light.party': 'Party', 'light.dim': 'Dim',
    'dir.up': 'Up', 'dir.down': 'Down', 'dir.left': 'Left', 'dir.right': 'Right',

    'arcade.intro': 'Earn meloncillos by playing. Each game has a daily cap, so there will be more tomorrow.',
    'arcade.today': 'Today: {n} / {max} 🍈', 'arcade.record': 'Record: {n}', 'arcade.play': 'Play', 'arcade.needsLevel': 'Requires level {n}',
    'arcade.needsFurniture': 'You need: {item}', 'arcade.result': 'Game over', 'arcade.score': 'Score: {n}', 'arcade.earned': '+{n} 🍈',
    'arcade.capped': 'Daily cap reached: this game pays less.', 'arcade.rejected': 'That score does not match the time played. No reward.',
    'arcade.record.new': 'New record!', 'arcade.difficulty': 'Difficulty', 'diff.easy': 'Easy', 'diff.normal': 'Normal', 'diff.hard': 'Hard',
    'game.snake': 'Snake', 'game.memory': 'Memory', 'game.fishing': 'Fishing', 'game.clicker': 'Clicker', 'game.dodge': 'Dodge', 'game.guess': 'Guess the number', 'game.minesweeper': 'Minesweeper',
    'game.snake.help': 'Eat bits without crashing. Arrows, WASD or touch buttons.',
    'game.memory.help': 'Find every pair in as few moves as you can.',
    'game.fishing.help': 'Cast, wait and tap quickly when it bites.',
    'game.clicker.help': 'Tap as much as you can before time runs out.',
    'game.dodge.help': 'Move sideways and last as long as you can.',
    'game.guess.help': 'Guess the number with higher or lower hints.',
    'game.minesweeper.help': 'Open every safe cell. Right click or flag mode to mark mines.',
    'g.score': 'Score', 'g.time': 'Time', 'g.moves': 'Moves', 'g.pairs': 'Pairs', 'g.goal': 'Goal', 'g.mines': 'Mines', 'g.tries': 'Tries',
    'g.up': 'Up', 'g.down': 'Down', 'g.left': 'Left', 'g.right': 'Right', 'g.card': 'Card {n}', 'g.cell': 'Cell {x}, {y}',
    'g.cast': 'Cast line', 'g.reel': 'Reel in!', 'g.waiting': 'Waiting… stay quiet.', 'g.bite': 'IT BIT!', 'g.tooSoon': 'Too soon: the fish swam away.',
    'g.tooLate': 'Too late: it stole the bait.', 'g.caught': 'You caught: {fish}', 'rarity.junk': 'Junk', 'rarity.common': 'Common', 'rarity.rare': 'Rare', 'rarity.legendary': 'Legendary',
    'g.click': 'Tap!', 'g.guess': 'Try', 'g.guessInput': 'Your number between {min} and {max}', 'g.higher': 'It is higher than {n}.', 'g.lower': 'It is lower than {n}.', 'g.right2': 'It was {n}!', 'g.wrong': 'It was {n}.',
    'g.flagMode': 'Flag mode', 'g.lost': 'Oops. That was a mine.', 'g.won': 'You did it!',

    'explore.intro': 'Send your pet on an expedition. It comes back alone, with stories and something in its pockets.',
    'explore.duration': '{n} min', 'explore.energy': 'Energy: {n}', 'explore.go': 'Set off', 'explore.needAch': 'Requires the "{name}" achievement',
    'explore.running': 'Expedition under way: {zone}', 'explore.left': 'Back in {time}', 'explore.claim': 'Welcome it home', 'explore.report': 'Back from {zone}',
    'explore.found': 'Found', 'explore.nothing': 'Just sand and good memories.', 'explore.reward': 'Reward: {coins} 🍈 and {xp} XP',

    'col.pets': 'My pets', 'col.species': 'Species', 'col.evolutions': 'Evolutions', 'col.items': 'Collectibles', 'col.grave': 'Graveyard',
    'col.active': 'Active', 'col.switch': 'Care for', 'col.adopt': 'Adopt', 'col.adoptFor': 'Adopt for {n} 🍈', 'col.nursery': 'The others rest in the nursery: time only passes for the active one.',
    'col.unknown': '???', 'col.discovered': 'Discovered: {n} / {max}', 'col.noItems': 'Nothing found yet. Try exploring.', 'col.noGrave': 'Nobody rests here yet. Long may it last.',
    'col.born': 'Born on {date}', 'col.died': 'Left on {date}', 'col.owned': 'Already yours', 'unlock.level': 'Level {n}', 'unlock.coins': '{n} 🍈', 'unlock.achievement': 'Achievement: {name}',
    'unlock.ticket': 'Golden ticket', 'unlock.flagOrLevel': 'A mysterious find or level {n}',

    'ach.progress': '{a} / {b}', 'ach.unlockedOn': 'Earned on {date}', 'ach.reward': 'Reward: {n} 🍈', 'ach.count': '{a} of {b} achievements', 'ach.hidden': 'Hidden achievement',

    'journal.diary': 'Diary', 'journal.album': 'Album', 'journal.empty': 'Nothing has happened yet. Be patient.', 'journal.noPhotos': 'No photos. Press "Photo" in the room.',
    'photo.adopted': 'Adoption day', 'photo.evolved': 'Evolution', 'photo.photo': 'Just a moment',

    'prof.title': '{user}\'s profile', 'prof.stats': 'Statistics', 'prof.levels': 'Level rewards', 'prof.settings': 'Settings', 'prof.next': 'Next reward: level {n}', 'prof.max': 'Max level',
    'prof.xp': '{a} / {b} XP', 'prof.volume': 'Volume', 'prof.mute': 'Mute everything', 'prof.music': 'Background music', 'prof.widget': 'Show the pet on other pages', 'prof.logout': 'Sign out',
    's.daysPlayed': 'Days played', 's.playMs': 'Total time', 's.coinsEarned': 'Meloncillos earned', 's.coinsSpent': 'Meloncillos spent', 's.gamesPlayed': 'Minigames completed',
    's.itemsBought': 'Items bought', 's.petsAdopted': 'Pets adopted', 's.evolutions': 'Evolutions', 's.discovered': 'Evolutions discovered', 's.expeditions': 'Expeditions',

    'adopt.title': 'Welcome to the universe', 'adopt.intro1': 'Behind this window is a tiny digital universe. The creatures living in it are born from forgotten files, old fans and the odd tab nobody closed.',
    'adopt.intro2': 'One of them has been waiting for someone. It promises to be a nuisance, ask for food and love you very much. Look after it and it will go on living even when you close the page.',
    'adopt.next': 'Choose a pet', 'adopt.choose': 'Choose your companion', 'adopt.nameLabel': 'Give it a name', 'adopt.color': 'Color', 'adopt.confirm': 'Adopt', 'adopt.back': 'Back',
    'adopt.traits': 'Personality', 'adopt.funeral': 'In memory', 'adopt.funeralText': '{pet} is gone for good. It rests in the collection graveyard.', 'adopt.continue': 'Carry on',
    'adopt.recovered': 'Your save was damaged, so the last valid copy has been restored.',

    'daily.title': 'Daily reward', 'daily.claim': 'Claim', 'daily.claimed': 'Already claimed today. Another one tomorrow.', 'daily.note': 'It only advances when you claim: missing a day costs nothing.', 'daily.day': 'Day {n}',
    'event.title': 'Event', 'event.claim': 'Accept',
    'toast.level': 'Level {n}!', 'toast.achievement': 'Achievement: {name}', 'toast.mission': 'Mission complete: {name}', 'toast.item': 'You got: {item}', 'toast.affinity': 'Your bond has grown: {tier}. +Gift',
    'toast.sick': '{pet} has fallen ill.', 'toast.critical': '{pet} is in a very bad way!', 'toast.photo': 'Photo saved to the album.', 'toast.personality': 'New personality: {trait}', 'toast.restored': 'Restored: {stat}', 'toast.species': 'Species unlocked: {name}',
    'evo.title': 'Evolution!', 'evo.text': '{pet} is now {name}.',
    'trivia.title': 'Did you know?',
    'a11y.pet': 'Your pet, {pet}, currently {mood}', 'a11y.coins': '{n} meloncillos', 'a11y.sound': 'Turn sound on or off', 'a11y.widget': 'Pet',

    'err.not_enough_coins': 'Not enough meloncillos.', 'err.item_missing': 'You do not have that item available.', 'err.level_too_low': 'Your level is too low for that.',
    'err.already_owned': 'You already own it.', 'err.not_for_sale': 'This is not for sale.', 'err.on_cooldown': 'Give it a moment, please.', 'err.too_tired': 'It is too tired.',
    'err.pet_away': 'It is on an expedition.', 'err.no_pet': 'You have no active pet.', 'err.pet_not_sick': 'It is not sick: do not waste the medicine.', 'err.position_taken': 'That spot is taken.',
    'err.position_invalid': 'It does not fit there.', 'err.room_already_clean': 'The room is already clean.', 'err.theme_locked': 'You do not own that theme yet.', 'err.needs_furniture': 'You are missing the required furniture.',
    'err.species_locked': 'That species is still locked.', 'err.species_owned': 'You already have that species.', 'err.evolution_not_ready': 'It does not meet the requirements yet.', 'err.needs_growth_potion': 'You need a Growth potion.',
    'err.expedition_running': 'An expedition is already under way.', 'err.no_expedition': 'There is no expedition.', 'err.zone_locked': 'That zone is locked.', 'err.pet_is_sick': 'It is sick: it cannot go out.',
    'err.daily_claimed': 'Already claimed today.', 'err.no_event': 'The event is over.', 'err.no_game_session': 'That game is no longer valid.', 'err.item_not_usable': 'That item is not used like that.',
    'err.use_evolution_panel': 'Used from the pet profile.', 'err.kit_not_needed': 'You do not need the kit.', 'err.kit_used_today': 'You already used the kit today.', 'err.pet_name_invalid': 'The name must be 1 to 24 characters long.',
    'err.save_unavailable': 'The save could not be opened. Try again later.', 'err.too_many_attempts': 'Too fast. Wait a moment.', 'err.database_unavailable': 'The game is unavailable right now.',
    'err.connection': 'No connection to the server.', 'err.generic': 'Something went wrong.',
  },
};

export function T(key, vars = {}) {
  const text = TEXTS[i18n.lang]?.[key] ?? TEXTS.es[key] ?? key;

  return text.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
}

export const hasText = (key) => Boolean(TEXTS.es[key]);

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Todo texto escrito por el jugador debe pasar por aquí antes de ir a innerHTML
export const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
