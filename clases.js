// Catálogo de clases.
//
// Vive en código y no en la base de datos a propósito: las clases son
// contenido de la web, igual que las páginas de teoría. Lo que sí vive en
// Firebase es a QUIÉN se le ha asignado cada una, que es lo que cambia a
// diario.
//
// Las etiquetas van en español en las tres pistas: son el nombre de lo que
// se está aprendiendo, y es lo que el alumno ve escrito en la ficha.

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
  }
];

// Busca una clase por su id. Devuelve null si ya no existe (por ejemplo,
// si se retira una clase del catálogo pero algún alumno la tenía asignada).
window.jnClasePorId = function(id){
  return (window.JN_CLASES || []).find(c => c.id === id) || null;
};
