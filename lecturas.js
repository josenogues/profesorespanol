// Lecturas: un texto por clase, con sus preguntas y un cuadro para escribir.
//
// Cada lectura cuelga de UNA clase del catálogo (`clase`, el id de clases.js)
// y se le pone al alumno desde el panel con el botón «Lectura», igual que el
// repaso. No se mezclan clases en una lectura: para mezclar, José pone dos.
//
// Todo lo que se aprende va en español: el texto, las preguntas y la consigna
// para escribir. Lo que va en el idioma del alumno:
//   - `glosario`: las palabras difíciles del texto. En el texto se marcan con
//     [[palabra|clave]] y al tocarlas sale su traducción (en la pista en
//     español, una explicación en español). El texto NO se traduce entero:
//     es un ejercicio de lectura.
//   - `trad` de cada pregunta y de la consigna: escondida tras un botón, en
//     todos los niveles; cada alumno decide si la mira.
//
// Preguntas: `tipo` 'elige' (opciones) o 'escribe' (una palabra). `ok` es la
// respuesta; en 'escribe' admite variantes separadas por | (con y sin tilde).
// Las corrige el mismo motor que los ejercicios de las clases, sin nota final.
//
// La escritura libre se guarda como los apuntes, con la clave
// 'lectura-<clase>': José la ve en el panel, dentro de esa clase, y la
// corrige en la clase en vídeo. Sin «hecho» ni «pendiente».

window.JN_LECTURAS = [
  {
    clase: 'si-tuviera',
    titulo: 'El décimo',
    parrafos: [
      'Todos los años, a finales de noviembre, mi abuelo Julián compra un [[décimo|decimo]] de la Lotería de Navidad en el bar de la esquina. Siempre el mismo número, desde hace cuarenta años, y nunca [[le ha tocado|tocar]] nada. Este año, mientras tomábamos un café, le pregunté qué haría si le tocara [[el Gordo|gordo]].',
      '—Si me tocara, no cambiaría casi nada —me contestó—. Arreglaría el [[tejado|tejado]] de la casa del pueblo, eso sí, e invitaría a comer a toda la familia. Pero seguiría viniendo a este bar todas las mañanas.',
      'Mi prima Irene, que es de Pamplona y estaba con nosotros, [[se echó a reír|reir]]:',
      '—Pues yo, si tendría ese dinero, dejaría el trabajo [[mañana mismo|manana]].',
      'El abuelo la miró como si fuera una alumna suya. Fue maestro durante treinta años y [[no lo puede evitar|evitar]]:',
      '—Si <i>tuviera</i>, Irene. Si <i>tuviera</i> ese dinero.',
      'Luego [[me tocó a mí|turno]]. Este año el abuelo me ha regalado una [[participación|participacion]] de su décimo, así que lo mío no es solo un sueño: si tenemos suerte, me iré un año a viajar por Sudamérica. Pero si de verdad me tocara mucho dinero, creo que me daría un poco de miedo. ¿Sabría quiénes son mis amigos de verdad?',
      'Al salir, el abuelo guardó el décimo en la [[cartera|cartera]], como cada año.',
      '—Ojalá nos toque —dijo Irene.',
      '—Ojalá tuviera veinte años menos —contestó él—. Eso no me lo da ninguna lotería.'
    ],
    glosario: {
      decimo:  { es: 'un billete de lotería (es la décima parte de un número entero)',
                 it: 'un biglietto della lotteria (la decima parte di un numero)',
                 en: 'a lottery ticket (a tenth share of a number)' },
      tocar:   { es: 'tocar la lotería: ganar un premio',
                 it: 'vincere (alla lotteria)',
                 en: 'to win (the lottery)' },
      gordo:   { es: 'el primer premio de la Lotería de Navidad',
                 it: 'il primo premio della lotteria di Natale',
                 en: 'the jackpot of the Christmas lottery' },
      tejado:  { es: 'la parte de arriba de la casa, que la cubre',
                 it: 'il tetto',
                 en: 'the roof' },
      reir:    { es: 'empezó a reír de repente',
                 it: 'è scoppiata a ridere',
                 en: 'burst out laughing' },
      manana:  { es: 'ya, sin esperar: mañana, no más tarde',
                 it: 'domani stesso, subito',
                 en: 'tomorrow, no later' },
      evitar:  { es: 'lo hace sin querer, no puede parar',
                 it: 'non riesce a farne a meno',
                 en: 'he can’t help it' },
      turno:   { es: 'era mi turno (aquí tocar no es ganar)',
                 it: 'era il mio turno (qui tocar non è vincere)',
                 en: 'it was my turn (here tocar doesn’t mean to win)' },
      participacion: { es: 'una parte pequeña de un décimo, que se comparte',
                 it: 'una quota di un biglietto, condivisa',
                 en: 'a small share of a ticket' },
      cartera: { es: 'donde se guardan el dinero y las tarjetas',
                 it: 'il portafoglio',
                 en: 'the wallet' }
    },
    preguntas: [
      { tipo: 'elige', p: '¿Le ha tocado alguna vez la lotería al abuelo?',
        trad: { it: 'Il nonno ha mai vinto alla lotteria?', en: 'Has the grandfather ever won the lottery?' },
        opciones: ['Sí, hace cuarenta años', 'No, nunca', 'El texto no lo dice'], ok: 'No, nunca' },
      { tipo: 'elige', p: 'Si le tocara el Gordo, el abuelo…',
        trad: { it: 'Se vincesse il primo premio, il nonno…', en: 'If he won the jackpot, the grandfather…' },
        opciones: ['se compraría una casa en el pueblo', 'arreglaría el tejado de la casa del pueblo', 'dejaría de ir al bar'],
        ok: 'arreglaría el tejado de la casa del pueblo' },
      { tipo: 'escribe', p: 'Escribe la palabra, como en el texto: «Si me tocara, no ___ casi nada.» <i>(cambiar)</i>',
        trad: { it: 'Scrivi la parola, come nel testo: «Se vincessi, non ___ quasi niente.» (cambiare)',
                en: 'Write the word, as in the text: “If I won, I ___ hardly anything.” (to change)' },
        ok: 'cambiaría|cambiaria' },
      { tipo: 'elige', p: '¿Por qué corrige el abuelo a Irene?',
        trad: { it: 'Perché il nonno corregge Irene?', en: 'Why does the grandfather correct Irene?' },
        opciones: ['Porque no quiere que deje el trabajo', 'Porque ha dicho «si tendría» y se dice «si tuviera»', 'Porque es de Pamplona'],
        ok: 'Porque ha dicho «si tendría» y se dice «si tuviera»' },
      { tipo: 'elige', p: '«La miró como si fuera una alumna suya.» ¿Irene es alumna del abuelo?',
        trad: { it: '«La guardò come se fosse una sua alunna.» Irene è un’alunna del nonno?',
                en: '“He looked at her as if she were one of his pupils.” Is Irene his pupil?' },
        opciones: ['Sí', 'No', 'El texto no lo dice'], ok: 'No' },
      { tipo: 'escribe', p: 'Escríbelo como lo diría el abuelo: «Si yo ___ ese dinero, dejaría el trabajo.» <i>(tener)</i>',
        trad: { it: 'Scrivilo come lo direbbe il nonno: «Se io ___ quei soldi, lascerei il lavoro.» (avere)',
                en: 'Write it the way the grandfather would say it: “If I ___ that money, I would quit my job.” (to have)' },
        ok: 'tuviera' },
      { tipo: 'elige', p: 'En «Luego me tocó a mí», <i>tocar</i> significa…',
        trad: { it: 'In «Luego me tocó a mí», tocar significa…', en: 'In “Luego me tocó a mí”, tocar means…' },
        opciones: ['ganar la lotería', 'que es el turno de alguien', 'tocar algo con la mano'],
        ok: 'que es el turno de alguien' },
      { tipo: 'elige', p: '«Ojalá nos toque» y «Ojalá tuviera veinte años menos». ¿Cuál de las dos cosas puede pasar todavía?',
        trad: { it: '«Ojalá nos toque» e «Ojalá tuviera veinte años menos». Quale delle due cose può ancora succedere?',
                en: '“Ojalá nos toque” and “Ojalá tuviera veinte años menos”. Which of the two can still happen?' },
        opciones: ['Que les toque la lotería', 'Tener veinte años menos', 'Las dos'], ok: 'Que les toque la lotería' }
    ],
    escribir: {
      es: 'Y tú, ¿qué harías si te tocara el Gordo? ¿Qué no cambiarías nunca? Escribe cinco o seis frases con <i>si + tuviera…</i> y, si te atreves, termina con un <i>ojalá</i>.',
      it: 'E tu, cosa faresti se vincessi il primo premio? Cosa non cambieresti mai? Scrivi cinque o sei frasi con si + tuviera… e, se te la senti, finisci con un ojalá.',
      en: 'And you, what would you do if you won the jackpot? What would you never change? Write five or six sentences with si + tuviera… and, if you dare, finish with an ojalá.'
    }
  }
];

// La lectura de una clase, o null si todavía no tiene.
window.jnLecturaDe = function(claseId){
  return (window.JN_LECTURAS || []).find(l => l.clase === claseId) || null;
};
