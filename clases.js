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
// `pistas` limita en qué idiomas existe una clase. Las clases para
// angloparlantes están construidas sobre «en inglés dirías…», así que solo
// tienen página en inglés. Si falta el campo, la clase vale para las tres.

window.JN_CLASES = [
  {
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

  // ─── Para angloparlantes de nivel básico. Solo en inglés. ───
  {
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

  // ─── Español para el trabajo ───
  {
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
