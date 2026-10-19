// Catálogo de clases.
//
// Vive en código y no en la base de datos a propósito: las clases son
// contenido de la web, igual que las páginas de teoría. Lo que sí vive en
// Firebase es a QUIÉN se le ha asignado cada una, que es lo que cambia a
// diario.
//
// Las etiquetas van en español en las tres pistas: son el nombre de lo que
// se está aprendiendo, y es lo que el alumno ve escrito en la ficha.
//
// `num` es el número de la clase, y es para José: los títulos están escritos
// para el alumno y a él no le dicen de cuál se trata. Se pone una vez y no se
// mueve nunca —ni se recalcula ni se reutiliza— porque es la referencia con
// la que se acuerda de cada una. Una clase nueva coge el siguiente libre.
//
// `pistas` limita en qué idiomas existe una clase. Las clases para
// angloparlantes están construidas sobre «en inglés dirías…», así que solo
// tienen página en inglés. Si falta el campo, la clase vale para las tres.

window.JN_CLASES = [
  {
    num: 1,
    id: 'sonidos',
    pagina: 'clase-sonidos',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Sonidos españoles, no ingleses',
      it: 'Suoni spagnoli, non inglesi',
      en: 'Spanish sounds, not English sounds'
    },
    etiquetas: ['pronunciación', 'fonética', 'vocales', 'la jota', 'be y uve',
                'pero y perro', 'erre', 'hache muda', 'que y qui', 'gue y gui',
                'diéresis', 'pingüino', 'tilde', 'acento']
  },
  {
    num: 2,
    id: 'saludos',
    pagina: 'clase-saludos',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Los dos primeros minutos',
      it: 'I primi due minuti',
      en: 'The first two minutes'
    },
    etiquetas: ['saludos', 'tú y usted', 'buenos días', 'buenas tardes', 'buenas noches',
                'encantado', 'me llamo', 'hasta luego', 'despedirse']
  },
  {
    num: 3,
    id: 'sobre-ti',
    pagina: 'clase-sobre-ti',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Háblame de ti',
      it: 'Parlami di te',
      en: 'Tell me about you'
    },
    etiquetas: ['presentarse', 'de dónde eres', 'a qué te dedicas', 'cuántos años tienes',
                'soy ingeniero', 'tengo treinta años', 'trabajo en', 'trabajo de',
                'estoy casado', 'por la mañana', 'mi familia']
  },
  {
    num: 4,
    id: 'presente',
    pagina: 'clase-presente',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'El presente, y los que lo rompen',
      it: 'Il presente, e quelli che lo rompono',
      en: 'The present, and the ones that break it'
    },
    etiquetas: ['presente', 'conjugación', 'regulares', 'irregulares', 'hago', 'salgo',
                'e→ie', 'o→ue', 'ser', 'estar', 'ir', 'tener']
  },
  {
    num: 5,
    id: 'to-be',
    pagina: 'clase-to-be',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Un «to be» inglés, tres españoles',
      it: 'Un «to be» inglese, tre spagnoli',
      en: 'One «to be» in English, three in Spanish'
    },
    etiquetas: ['ser', 'estar', 'hay', 'to be', 'soy', 'estoy', 'there is']
  },
  {
    num: 6,
    id: 'frio',
    pagina: 'clase-frio',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Frío de tres maneras',
      it: 'Freddo in tre modi',
      en: 'Cold in three ways'
    },
    etiquetas: ['tener frío', 'hace frío', 'tener hambre', 'tener años',
                'el tiempo', 'hace sol']
  },
  {
    num: 7,
    id: 'sin-do',
    pagina: 'clase-sin-do',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Aquí no existe el «do»',
      it: 'Qui non esiste il «do»',
      en: 'There is no «do» here'
    },
    etiquetas: ['preguntas', 'negación', 'no', 'nada', 'nadie', 'nunca', '¿verdad?']
  },
  {
    num: 8,
    id: 'gustar',
    pagina: 'clase-gustar',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Las cosas te gustan a ti',
      it: 'Le cose piacciono a te',
      en: 'Things please you'
    },
    etiquetas: ['gustar', 'me gusta', 'encantar', 'doler', 'apetecer', 'pronombres']
  },
  {
    num: 9,
    id: 'bando',
    pagina: 'clase-bando',
    nivel: 'A1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Cada palabra elige bando',
      it: 'Ogni parola sceglie una squadra',
      en: 'Every noun picks a team'
    },
    etiquetas: ['género', 'concordancia', 'el', 'la', 'adjetivos', 'plural', 'el agua']
  },
  {
    num: 10,
    id: 'costumbre',
    pagina: 'clase-costumbre',
    nivel: 'A1–A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Tres verbos que llevan a otro',
      it: 'Tre verbi che ne portano un altro',
      en: 'Three verbs that carry another one'
    },
    etiquetas: ['soler', 'ir a + infinitivo', 'tener que', 'hay que', 'perífrasis',
                'costumbre', 'obligación']
  },

  // ─── Español para el trabajo ───,
  {
    num: 11,
    id: 'futuro',
    pagina: 'clase-futuro',
    nivel: 'A1–A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'El futuro, y lo que se dice en su lugar',
      it: 'Il futuro, e quello che si dice al suo posto',
      en: 'The future, and what people say instead'
    },
    etiquetas: ['futuro simple', 'hablaré', 'ir a', 'voy a', 'tendré', 'haré',
                'futuro irregular', 'planes', 'predicciones', 'serán las tres',
                'futuro de probabilidad']
  },
  {
    num: 12,
    id: 'marcadores',
    pagina: 'clase-marcadores',
    nivel: 'A1–A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Las palabras que sujetan una historia',
      it: 'Le parole che reggono una storia',
      en: 'The words that hold a story together'
    },
    etiquetas: ['marcadores temporales', 'conectores', 'anteayer', 'pasado mañana',
                'hace tres días', 'dentro de tres días', 'sin embargo', 'así que',
                'porque', 'como']
  },
  {
    num: 13,
    id: 'menos-piezas',
    pagina: 'clase-menos-piezas',
    nivel: 'A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Quita el «yo», quita el «estoy»',
      it: 'Togli lo «yo», togli lo «estoy»',
      en: 'Drop the «yo», drop the «estoy»'
    },
    etiquetas: ['sujeto innecesario', 'yo', 'estar + gerundio', 'estoy hablando',
                'presente', 'me duele la cabeza']
  },
  {
    num: 14,
    id: 'dos-sentidos',
    pagina: 'clase-dos-sentidos',
    nivel: 'A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Cuando ser y estar cambian lo que dices',
      it: 'Quando ser ed estar cambiano il senso',
      en: 'One adjective, two meanings'
    },
    etiquetas: ['ser', 'estar', 'es aburrido', 'está aburrido', 'es listo',
                'está bueno', 'adjetivos']
  },
  {
    num: 15,
    id: 'dos-verbos',
    pagina: 'clase-dos-verbos',
    nivel: 'A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Un verbo en inglés, dos en español',
      it: 'Un verbo in inglese, due in spagnolo',
      en: 'One English verb, two Spanish ones'
    },
    etiquetas: ['saber', 'conocer', 'pedir', 'preguntar', 'traer', 'llevar',
                'ir', 'venir', 'tiempo', 'hora', 'vez', 'funcionar']
  },
  {
    num: 16,
    id: 'falsos-amigos-en',
    pagina: 'clase-falsos-amigos',
    nivel: 'A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Las que parecen inglesas y no lo son',
      it: 'Quelle che sembrano inglesi e non lo sono',
      en: 'The words that look English and aren’t'
    },
    etiquetas: ['falsos amigos', 'embarazada', 'constipado', 'éxito',
                'actualmente', 'sensible', 'librería', 'molestar']
  },
  {
    num: 17,
    id: 'por-para',
    pagina: 'clase-por-para',
    nivel: 'A2',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Por y para, de una vez',
      it: 'Por e para, una volta per tutte',
      en: 'Por and para, once and for all'
    },
    etiquetas: ['por', 'para', 'preposiciones', 'gracias por', 'por favor',
                'para siempre', 'trabajo para', 'trabajo por', 'por la mañana',
                'para qué', 'por qué']
  },
  {
    num: 18,
    id: 'la-a',
    pagina: 'clase-la-a',
    nivel: 'A2–B1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'La «a» que el inglés no tiene, y lo, la, le',
      it: 'La «a» che l’inglese non ha, e lo, la, le',
      en: 'The little «a», and lo, la, le'
    },
    etiquetas: ['a personal', 'veo a María', 'pronombres de objeto', 'lo', 'la',
                'le', 'les', 'se lo', 'cómpralas', 'orden de las palabras']
  },
  {
    num: 19,
    id: 'would',
    pagina: 'clase-would',
    nivel: 'A2–B1',
    perfil: 'angloparlantes',
    pistas: ['en'],
    titulo: {
      es: 'Would, could, should',
      it: 'Would, could, should',
      en: 'Would, could, should'
    },
    etiquetas: ['condicional', 'hablaría', 'podría', 'debería', 'me gustaría',
                'tendría que', 'quería un café', 'cortesía', 'imperfecto',
                'de niño iba']
  },
  {
    num: 20,
    id: 'formas-pasado',
    pagina: 'clase-formas-pasado',
    nivel: 'A2–B1',
    perfil: 'cualquiera',
    titulo: {
      es: 'Las formas del pasado',
      it: 'Le forme del passato',
      en: 'The forms of the past'
    },
    etiquetas: ['conjugación del pasado', 'participios irregulares',
                'verbos irregulares', 'fui', 'hice', 'dije',
                'busqué', 'leyó', 'durmió']
  },

  // ─── Para angloparlantes de nivel básico. Solo en inglés. ───,
  {
    num: 21,
    id: 'tres-pasados',
    pagina: 'clase-tres-pasados',
    nivel: 'A2–B1',
    perfil: 'cualquiera',
    titulo: {
      es: 'Los tres pasados en la misma mesa',
      it: 'I tre passati sullo stesso tavolo',
      en: 'The three pasts on one table'
    },
    etiquetas: ['indefinido', 'imperfecto', 'perfecto compuesto',
                'hablé', 'he hablado', 'hablaba']
  },
  {
    num: 22,
    id: 'seis-formas',
    pagina: 'clase-seis-formas',
    nivel: 'A2–B1',
    perfil: 'cualquiera',
    titulo: {
      es: 'Las seis formas que lo dicen todo',
      it: 'Le sei forme che dicono tutto',
      en: 'The six forms that say it all'
    },
    etiquetas: ['pretérito perfecto', 'estar + gerundio', 'ir a + infinitivo',
                'haber', 'estar', 'ir']
  },
  {
    num: 23,
    id: 'motor',
    pagina: 'clase-motor',
    nivel: 'B1–B2',
    perfil: 'cualquiera',
    titulo: {
      es: 'El motor manda',
      it: 'Il motore comanda',
      en: 'The engine is in charge'
    },
    etiquetas: ['había comido', 'estaba comiendo', 'iba a comer',
                'pluscuamperfecto', 'imperfecto continuo']
  },
  {
    num: 24,
    id: 'llamada',
    pagina: 'clase-llamada',
    nivel: 'B1–B2',
    perfil: 'trabajo',
    titulo: {
      es: 'Una llamada de principio a fin',
      it: 'Una telefonata dall’inizio alla fine',
      en: 'A phone call from start to finish'
    },
    etiquetas: ['teléfono', 'deletrear', 'recado', 'contestador', 'números',
                '¿de parte de quién?']
  },
  {
    num: 25,
    id: 'suavizar',
    pagina: 'clase-suavizar',
    nivel: 'B1–B2',
    perfil: 'trabajo',
    titulo: {
      es: 'Decirlo sin que suene a orden',
      it: 'Dirlo senza che suoni come un ordine',
      en: 'Saying it without sounding like an order'
    },
    etiquetas: ['cortesía', 'condicional', 'imperfecto de cortesía', 'subjuntivo',
                'pedir', 'discrepar']
  },
  {
    num: 26,
    id: 'reunion',
    pagina: 'clase-reunion',
    nivel: 'B2',
    perfil: 'trabajo',
    titulo: {
      es: 'La reunión: entrar, opinar y cerrar',
      it: 'La riunione: entrare, opinare e chiudere',
      en: 'Meetings: getting in, weighing in, wrapping up'
    },
    etiquetas: ['reuniones', 'pedir la palabra', 'interrumpir', 'opinar', 'acuerdo',
                'repartir tareas', 'videollamada']
  },
  {
    num: 27,
    id: 'italiano-trabajo',
    pagina: 'clase-italiano-trabajo',
    nivel: 'B2',
    perfil: 'italianos',
    pistas: ['it'],
    titulo: {
      es: 'Cuando el italiano te traiciona',
      it: 'Quando l’italiano ti tradisce',
      en: 'When Italian trips you up'
    },
    etiquetas: ['interferencias', 'italiano', 'teléfono', 'videollamada', 'falsos amigos']
  }
];

// Busca una clase por su id. Devuelve null si ya no existe (por ejemplo,
// si se retira una clase del catálogo pero algún alumno la tenía asignada).
window.jnClasePorId = function(id){
  return (window.JN_CLASES || []).find(c => c.id === id) || null;
};
