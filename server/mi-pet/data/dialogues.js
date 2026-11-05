// Diálogos predefinidos. El navegador elige la frase según el contexto
// (ver elegirFrase en public/js/mi-pet/dialogos.js).
//
// Cada grupo es una lista de frases [español, inglés]. {pet} es el nombre de la mascota
// y {user} el del jugador.
//
// common     frases de cualquier especie, por estado, momento o reacción
// species    frases propias de cada especie: idle (sueltas) y sus reacciones
// affinity   frases que se desbloquean al subir de afinidad
// branch     frases de cada rama de evolución

const common = {
  idle: [
    ['Llevo tres horas mirando esta pared. Es fascinante.', 'I have been staring at this wall for three hours. Fascinating.'],
    ['He encontrado una moneda debajo de la cama. No preguntes.', 'I found a coin under the bed. Do not ask.'],
    ['Creo que necesito unas vacaciones.', 'I think I need a vacation.'],
    ['¿Podemos comprar otra lámpara? Esta habitación es deprimente.', 'Can we buy another lamp? This room is depressing.'],
    ['Hoy he intentado programar. Ahora tengo más preguntas que respuestas.', 'I tried programming today. Now I have more questions than answers.'],
    ['He soñado que tenía un ordenador. Era precioso.', 'I dreamed I had a computer. It was beautiful.'],
    ['¿Podemos adoptar otro amigo?', 'Can we adopt another friend?'],
    ['Si cierras la pestaña, ¿yo sigo existiendo? Es por saber.', 'If you close the tab, do I still exist? Just curious.'],
    ['He leído las condiciones de uso. No las recomiendo.', 'I read the terms of service. Would not recommend.'],
    ['Todo funcionaba hasta que has mirado.', 'Everything worked until you looked at it.'],
  ],
  morning: [
    ['Buenos días, {user}. He dormido en modo ahorro de energía.', 'Good morning, {user}. I slept in power-saving mode.'],
    ['Es por la mañana. Qué concepto tan agresivo.', 'It is morning. What an aggressive concept.'],
    ['El sol ha salido sin consultarme.', 'The sun came up without consulting me.'],
  ],
  afternoon: [
    ['Tarde de productividad. O de mirar al techo. Lo mismo.', 'Productive afternoon. Or staring at the ceiling. Same thing.'],
    ['¿Ya has comido, {user}? Yo te vigilo.', 'Have you eaten yet, {user}? I am watching.'],
  ],
  night: [
    ['Ya es de noche. Las sombras se han puesto cómodas.', 'It is nighttime. The shadows are getting comfortable.'],
    ['Me está entrando sueño, pero quiero que conste que no es culpa tuya.', 'I am getting sleepy, but for the record it is not your fault.'],
  ],
  lateNight: [
    ['¿Qué haces despierto, {user}? Mañana te vas a arrepentir.', 'Why are you awake, {user}? You will regret this tomorrow.'],
    ['A estas horas solo estamos tú, yo y el ventilador del ordenador.', 'At this hour it is just you, me and the computer fan.'],
  ],

  // Estados
  hungry: [
    ['Tengo tanta hambre que me comería un disquete.', 'I am so hungry I could eat a floppy disk.'],
    ['Mi estómago está haciendo ruido de módem.', 'My stomach is making dial-up noises.'],
    ['Comida. Por favor. Es para un amigo. Yo soy el amigo.', 'Food. Please. It is for a friend. I am the friend.'],
  ],
  tired: [
    ['*bostezo de 56 kilobits*', '*56-kilobit yawn*'],
    ['Si parpadeo más despacio cuenta como dormir, ¿no?', 'If I blink slower it counts as sleeping, right?'],
    ['Batería baja. Conéctame a una siesta.', 'Low battery. Plug me into a nap.'],
  ],
  dirty: [
    ['Huelo a archivo temporal.', 'I smell like a temp file.'],
    ['Creo que tengo polvo en sitios que no sabía que tenía.', 'I think I have dust in places I did not know I had.'],
    ['Un baño no estaría mal. Lo digo por tu nariz.', 'A bath would be nice. I say this for your nose.'],
  ],
  bored: [
    ['Eh. Eh. Eh. Eh. ¿Jugamos?', 'Hey. Hey. Hey. Hey. Wanna play?'],
    ['He contado los píxeles de la pared. Otra vez.', 'I counted the wall pixels. Again.'],
    ['Me aburro tanto que he empezado a leer la documentación.', 'I am so bored I started reading the documentation.'],
  ],
  sick: [
    ['No me encuentro bien. Creo que tengo un virus. Del malo.', 'I do not feel well. I think I have a virus. The bad kind.'],
    ['Me duelen los bits.', 'My bits hurt.'],
    ['Necesito medicina. Y que me digas que todo va a salir bien.', 'I need medicine. And for you to tell me it will be okay.'],
  ],
  critical: [
    ['{user}… no quiero asustarte, pero veo una lucecita blanca. O es la pantalla.', '{user}… I do not want to scare you, but I see a little white light. Or it is the screen.'],
    ['Estoy muy flojito. De verdad necesito una medicina.', 'I am very weak. I really need medicine.'],
  ],
  sleeping: [
    ['Zzz… sudo hazme un bocadillo… zzz', 'Zzz… sudo make me a sandwich… zzz'],
    ['Zzz… no… esa tecla no… zzz', 'Zzz… no… not that key… zzz'],
    ['Zzz…', 'Zzz…'],
  ],
  happy: [
    ['Hoy es un buen día. Lo he comprobado dos veces.', 'Today is a good day. I checked twice.'],
    ['No tengo quejas. Qué raro. Déjame pensar.', 'I have no complaints. How odd. Let me think.'],
  ],
  veryHappy: [
    ['¡TODO ME PARECE MARAVILLOSO, INCLUSO ESTA PARED!', 'EVERYTHING IS WONDERFUL, EVEN THIS WALL!'],
    ['Me siento tan bien que podría perdonar a la impresora.', 'I feel so good I could forgive the printer.'],
  ],
  inLove: [
    ['Eres mi humano favorito. También el único. Pero favorito.', 'You are my favorite human. Also the only one. But favorite.'],
    ['He guardado tu cara en mi carpeta de cosas importantes.', 'I saved your face in my important things folder.'],
  ],
  missedYou: [
    ['¡Has vuelto! Creía que te había borrado el recolector de basura.', 'You came back! I thought the garbage collector got you.'],
    ['He hecho una lista de lo que ha pasado en tu ausencia. Solo pone «nada».', 'I made a list of what happened while you were gone. It just says "nothing".'],
    ['Te he echado de menos. Unos 3 terabytes.', 'I missed you. About 3 terabytes.'],
  ],

  // Reacciones
  pet: [['Ahí. Justo ahí. Sigue.', 'There. Right there. Keep going.'], ['Mmm, caricia recibida con éxito.', 'Mmm, pet received successfully.'], ['Mi nivel de cariño sube un 2 %.', 'My love level is up 2%.']],
  talk: [['¿Sabes qué? No sé. Pero sigue hablando.', 'You know what? I do not know. But keep talking.'], ['Interesante. Lo apuntaré en el diario.', 'Interesting. I will put that in my diary.'], ['Sí, sí, te escucho. ¿Quieres algo de comer?', 'Yes, yes, I am listening. Do you want a snack?']],
  greet: [['¡Hola, {user}! ¡Justo estaba pensando en ti!', 'Hi, {user}! I was just thinking about you!'], ['Hola. Ya me has saludado antes, pero me gusta.', 'Hello. You greeted me before, but I like it.']],
  tickle: [['¡JA JA JA NO! ¡SÍ! ¡NO!', 'HA HA HA NO! YES! NO!'], ['¡Eso no es un comportamiento documentado!', 'That is not documented behavior!']],
  hug: [['Abrazo guardado en la memoria permanente.', 'Hug saved to permanent memory.'], ['Podría quedarme así hasta el próximo reinicio.', 'I could stay like this until the next reboot.']],
  feed: [['Ñam. Reseña: cinco estrellas.', 'Yum. Review: five stars.'], ['¡Comida! Ahora entiendo el sentido de la vida.', 'Food! Now I understand the meaning of life.'], ['Eso ha sido delicioso. ¿Hay más?', 'That was delicious. Is there more?']],
  play: [['¡Otra vez! ¡Otra vez! ¡Otra vez!', 'Again! Again! Again!'], ['He ganado. No sé a qué, pero he ganado.', 'I won. I do not know what, but I won.']],
  bath: [['¡Agua! ¡Traición!', 'Water! Betrayal!'], ['Ya huelo a recién instalado.', 'I now smell freshly installed.']],
  sleep: [['Buenas noches. No toques nada.', 'Good night. Do not touch anything.'], ['Entrando en modo reposo…', 'Entering sleep mode…']],
  wake: [['¡Estoy despierto! ¡Nunca he estado dormido!', 'I am awake! I was never asleep!'], ['¿Qué? ¿Quién? ¿Dónde está mi bocadillo?', 'What? Who? Where is my sandwich?']],
  clean: [['La habitación brilla. Yo sigo igual.', 'The room is sparkling. I remain the same.'], ['¿Quién ha dejado eso ahí? Yo no.', 'Who left that there? Not me.']],
  medicine: [['Puaj. Pero gracias.', 'Yuck. But thank you.'], ['Ya me encuentro mejor. Ha sido un virus pasajero.', 'I already feel better. It was a passing virus.']],
  gift: [['¿Para mí? ¿Seguro? ¡No lo devuelvo!', 'For me? Are you sure? I am not giving it back!']],
  evolve: [['Me siento… distinto. ¿He cambiado de versión?', 'I feel… different. Did I get a version update?']],
  levelUp: [['¡Hemos subido de nivel! Ni idea de qué significa.', 'We leveled up! No idea what that means.']],
  renamed: [['¿Ese es mi nombre nuevo? Tendré que actualizar mis tarjetas.', 'Is that my new name? I will need new business cards.']],
  back: [['He vuelto. El mundo es enorme y yo tengo hambre.', 'I am back. The world is huge and I am hungry.']],
  expedition: [['Estoy fuera. Si llaman, di que estoy explorando.', 'I am out. If anyone calls, say I am exploring.']],
};

const species = {
  slime: {
    idle: [
      ['He intentado saltar más alto. Ahora soy más ancho.', 'I tried jumping higher. Now I am wider.'],
      ['*te mira fijamente*', '*stares at you intensely*'],
      ['*te sigue mirando*', '*keeps staring at you*'],
      ['Me he comido algo del suelo. Era el suelo.', 'I ate something off the floor. It was the floor.'],
      ['¿Tú también tiemblas al caminar o solo yo?', 'Do you also wobble when you walk or is it just me?'],
    ],
    hungry: [['Puedo comer. Sé hacerlo muy bien. Mira.', 'I can eat. I am very good at it. Watch.']],
    feed: [['¡BLUP! Esto se queda en mi interior, literalmente.', 'BLOOP! This stays inside me, literally.']],
    pet: [['*tiembla feliz*', '*wobbles happily*']],
  },
  ghost: {
    idle: [
      ['He atravesado el armario. Dentro no hay nada, como en mí.', 'I went through the wardrobe. It is empty inside, like me.'],
      ['Quizá morí de aburrimiento. Quizá no. Da igual.', 'Maybe I died of boredom. Maybe not. Whatever.'],
      ['Hoy he asustado a una tostada.', 'Today I scared a slice of toast.'],
      ['Soy transparente en mis emociones. Y en lo demás.', 'I am transparent with my emotions. And everything else.'],
      ['Bu. Perdón. Costumbre.', 'Boo. Sorry. Force of habit.'],
    ],
    tired: [['Voy a dormir flotando. O a flotar durmiendo.', 'I will sleep floating. Or float sleeping.']],
    pet: [['Tu mano me ha atravesado. Ha sido bonito.', 'Your hand went right through me. It was nice.']],
  },
  alien: {
    idle: [
      ['¿Sabías que los humanos tenéis demasiados huesos?', 'Did you know humans have too many bones?'],
      ['Pregunta: ¿por qué pagáis por dormir sobre rectángulos?', 'Question: why do you pay to sleep on rectangles?'],
      ['He estudiado vuestro «lunes». Recomiendo eliminarlo.', 'I have studied your "Monday". I recommend removing it.'],
      ['¿Qué es un «impuesto»? Mis antenas no lo captan.', 'What is a "tax"? My antennae cannot pick it up.'],
      ['En mi planeta esto se considera un saludo. *mueve antenas*', 'On my planet this counts as a greeting. *wiggles antennae*'],
    ],
    talk: [['Estoy tomando notas para mi informe. Sales bien.', 'I am taking notes for my report. You come off well.']],
    pet: [['Las antenas no. Bueno, un poco sí.', 'Not the antennae. Okay, a little.']],
  },
  robot: {
    idle: [
      ['He ordenado tus calcetines por valor hexadecimal.', 'I sorted your socks by hex value.'],
      ['Eficiencia actual: 73 %. Se recomienda snack.', 'Current efficiency: 73%. Snack recommended.'],
      ['Beep. Eso no significa nada, es para ambientar.', 'Beep. It means nothing, it is for atmosphere.'],
    ],
    dirty: [['Polvo detectado. Iniciando protocolo de indignación.', 'Dust detected. Starting indignation protocol.']],
  },
  bat: {
    idle: [
      ['El día está sobrevalorado.', 'Daytime is overrated.'],
      ['Sé lo que hiciste el verano pasado. Te oí con el sónar.', 'I know what you did last summer. I heard it on sonar.'],
      ['Cuelgo boca abajo para ver el mundo como es en realidad.', 'I hang upside down to see the world as it truly is.'],
    ],
    morning: [['Demasiada luz. Avísame cuando se apague el cielo.', 'Too much light. Tell me when the sky turns off.']],
    lateNight: [['Por fin. Esta es mi hora. ¿Qué secreto quieres?', 'Finally. This is my hour. What secret do you want?']],
  },
  mushling: {
    idle: [
      ['He pensado en moverme. Lo dejo para mañana.', 'I thought about moving. I will do it tomorrow.'],
      ['Las esporas me dicen que todo irá bien. También dicen «humedad».', 'The spores say all will be well. They also say "humidity".'],
      ['Crecer es mirar hacia arriba muy despacio.', 'Growing is looking up very slowly.'],
    ],
  },
  frog: {
    idle: [
      ['¡He saltado sobre un charco y he visto otro mundo! Era la habitación.', 'I leaped into a puddle and saw another world! It was the room.'],
      ['Croac. Eso significa «vámonos de aventura».', 'Ribbit. That means "let\'s go on an adventure".'],
      ['Te reto a una carrera. Empezamos cuando yo gane.', 'I challenge you to a race. It starts when I win.'],
    ],
  },
  snail: {
    idle: [
      ['Tranquilo…', 'Easy…'],
      ['Estaba… a punto… de decirte… algo…', 'I was… about… to tell you… something…'],
      ['Llegaré a la alfombra en marzo.', 'I will reach the rug by March.'],
      ['La prisa es una opinión.', 'Haste is an opinion.'],
    ],
  },
  cat: {
    idle: [
      ['Puedes seguir admirándome. Tienes permiso.', 'You may continue admiring me. Permission granted.'],
      ['Tiraré esa estrella de la mesa cuando me apetezca.', 'I shall knock that star off the table when I please.'],
      ['Mi constelación es más bonita que tu currículum.', 'My constellation is prettier than your résumé.'],
      ['No te necesito. Pero ponme comida.', 'I do not need you. But do feed me.'],
    ],
    pet: [['Tres caricias. Ni una más. …Vale, una más.', 'Three pets. No more. …Fine, one more.']],
  },
  experiment: {
    idle: [
      ['¡HOY TENGO CINCO OPINIONES Y TODAS GRITAN!', 'TODAY I HAVE FIVE OPINIONS AND THEY ARE ALL SHOUTING!'],
      ['Uno de mis ojos quiere pizza. Los otros dos, venganza.', 'One of my eyes wants pizza. The other two want revenge.'],
      ['No recuerdo quién me hizo, pero tiene mala letra.', 'I do not remember who made me, but they have bad handwriting.'],
      ['glub. perdón. eso era otra personalidad.', 'glub. sorry. that was another personality.'],
    ],
  },
  octopus: {
    idle: [
      ['He abierto todos los tarros de la casa. Solo por demostrarlo.', 'I opened every jar in the house. Just to prove it.'],
      ['Si tengo tres corazones, ¿por qué me duelen los tres?', 'If I have three hearts, why do all three hurt?'],
      ['Estoy escribiendo con cuatro brazos y borrando con otros cuatro.', 'I am typing with four arms and deleting with the other four.'],
    ],
  },
};

const affinity = {
  acquaintance: [['Ya sé cómo suenan tus pasos. Bueno, tus clics.', 'I know the sound of your footsteps now. Well, your clicks.']],
  friend: [
    ['Siempre vienes a verme. Lo he apuntado.', 'You always come to see me. I wrote it down.'],
    ['Eres de las pocas cosas que no necesitan actualización.', 'You are one of the few things that need no update.'],
  ],
  bestFriend: [
    ['Te he guardado el mejor sitio de la alfombra.', 'I saved you the best spot on the rug.'],
    ['Si alguien te hace algo, tengo un plan. Es morder. Pero tengo un plan.', 'If anyone hurts you, I have a plan. It is biting. But I have a plan.'],
  ],
  soulmate: [
    ['Cuando te vas, dejo la luz encendida. Por si acaso.', 'When you leave, I keep the light on. Just in case.'],
    ['Gracias por cuidarme, {user}. Lo digo en serio, sin ningún chiste.', 'Thank you for looking after me, {user}. I mean it, no joke.'],
  ],
};

const branch = {
  happy: [['Brillo en doce colores. Es agotador y maravilloso.', 'I glow in twelve colors. It is exhausting and wonderful.']],
  smart: [['He optimizado mi forma de pestañear. Ahora ahorro 3 ms.', 'I optimized my blinking. It saves 3 ms.']],
  adventurous: [['Esta habitación se me queda pequeña. Hay mapas que rellenar.', 'This room is too small for me. There are maps to fill in.']],
  dark: [['Ahora entiendo lo que es esperar.', 'Now I understand what waiting means.'], ['No estoy enfadado. Solo he cambiado de paleta.', 'I am not angry. I just changed palettes.']],
};

// Plantillas del diario. La partida guarda la clave y los datos, y cada frase se pinta en el
// idioma elegido. Si hay varias, se escoge una según la entrada.
const diary = {
  adopted: [['Hoy {user} me ha adoptado. Dice que me llamo {pet}. Lo aceptaré de momento.', 'Today {user} adopted me. They say my name is {pet}. I will accept this for now.']],
  renamed: [['Ahora me llamo {pet}. Tengo que avisar a mi banco.', 'My name is now {pet}. I need to tell my bank.']],
  level: [['Hemos llegado al nivel {value}. Me siento igual, pero con más autoestima.', 'We reached level {value}. I feel the same, but with more self-esteem.']],
  furniture: [['Hoy {user} me ha comprado esto: {item}. Creo que voy a usarlo durante las próximas 48 horas.', 'Today {user} bought me this: {item}. I think I will use it for the next 48 hours.']],
  item: [['Tengo algo nuevo: {item}. Lo he olido por si acaso.', 'I have something new: {item}. I sniffed it, just in case.']],
  accessory: [['Me he puesto esto: {item}. Estoy increíble.', 'I am now wearing this: {item}. I look incredible.']],
  evolved: [['Algo ha cambiado. Ahora soy {value}. El espejo está muy sorprendido.', 'Something changed. I am now {value}. The mirror is very surprised.']],
  achievement: [['Logro conseguido: {value}. Lo pondré en mi currículum.', 'Achievement unlocked: {value}. I will add it to my résumé.']],
  event: [['Hoy ha pasado algo: {value}', 'Something happened today: {value}']],
  expedition: [['He ido a {value}. Traigo arena en sitios raros.', 'I went to {value}. I brought sand in odd places.']],
  metPet: [['He conocido a {value}. Se queda con nosotros. Tendré que compartir la alfombra.', 'I met {value}. They are staying with us. I will have to share the rug.']],
  sick: [['Hoy me he puesto enfermo. Todo da vueltas, y no solo la pantalla.', 'I got sick today. Everything is spinning, not just the screen.']],
  cured: [['Ya estoy mejor. Gracias, {user}.', 'I am better now. Thank you, {user}.']],
  affinity: [['{user} y yo somos más cercanos. No se lo digas.', '{user} and I have grown closer. Do not tell them.']],
  absence: [['{user} ha vuelto después de mucho tiempo. No estoy enfadado. Solo he estado mirando la puerta.', '{user} came back after a long time. I am not mad. I have just been staring at the door.']],
  photo: [['{user} me ha hecho una foto. Ha salido mi lado bueno. Todos lo son.', '{user} took my picture. It caught my good side. They all are.']],
};

// Epitafios del cementerio
const epitaphs = [
  ['Aquí descansa {pet}. Sus bits ya no duelen.', 'Here rests {pet}. Its bits no longer hurt.'],
  ['{pet} se ha ido a un servidor mejor.', '{pet} has gone to a better server.'],
  ['En memoria de {pet}, que nunca aprendió a cerrar sesión.', 'In memory of {pet}, who never learned to log out.'],
];

module.exports = { DIALOGUES: { common, species, affinity, branch }, DIARY: diary, EPITAPHS: epitaphs };
