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
  },
  {
    clase: 'frio',
    titulo: '¿Qué tal el tiempo por ahí?',
    parrafos: [
      '[[Todos los domingos|domingos]], mi madre me [[llama|llamar]] desde Sevilla. Siempre [[empieza igual|igual]]:',
      '—Hola, [[hija|hija]]. ¿Qué tal el tiempo por ahí?',
      'Yo vivo en Burgos, en el [[norte|norte]], y en [[invierno|invierno]] aquí hace mucho frío. Hoy estamos a dos bajo cero y hay niebla en [[toda la ciudad|ciudad]].',
      '—¡Qué frío! —dice mi madre—. Aquí hace sol y estamos a dieciocho grados. Ahora estoy en la [[terraza|terraza]] con un café.',
      '—Pues yo tengo frío [[hasta en casa|hasta]]. La [[calefacción|calefaccion]] no [[funciona|funcionar]] bien.',
      '—¿Y tu café? ¿Está caliente?',
      '—[[Ya no|yano]]. Está frío, [[como yo|como]].',
      'Mi madre [[me cuenta|contar]] que en Sevilla dicen que mañana llueve. Para ella es una [[buena noticia|noticia]]: [[allí|alli]] [[casi nunca|casinunca]] llueve y [[el campo|campo]] [[necesita|necesitar]] agua.',
      '—¿Y en Burgos? ¿Qué dicen para mañana?',
      '—Ya está nublado, y parece que va a nevar [[esta noche|noche]].',
      '—¡[[Nieve|nieve]]! Qué [[bonito|bonito]].',
      '—Bonito para ti, mamá. Yo mañana voy a trabajar [[en bici|bici]].',
      '[[Antes de|antes]] [[colgar|colgar]], mi madre dice [[lo de siempre|siempre]]:',
      '—[[Ponte el abrigo|abrigo]], hija.'
    ],
    glosario: {
      domingos:   { es: 'cada domingo, una vez a la semana',
                    it: 'tutte le domeniche', en: 'every Sunday' },
      llamar:     { es: 'llamar por teléfono',
                    it: 'chiamare (al telefono)', en: 'to call (on the phone)' },
      igual:      { es: 'dice lo mismo para empezar',
                    it: 'comincia allo stesso modo', en: 'starts the same way' },
      hija:       { es: 'la madre habla con su hija; aquí es una forma cariñosa de llamarla',
                    it: 'figlia (qui, in modo affettuoso)', en: 'daughter (here, said affectionately)' },
      norte:      { es: 'la parte de arriba del mapa',
                    it: 'il nord', en: 'the north' },
      invierno:   { es: 'la estación del frío: diciembre, enero, febrero',
                    it: 'l’inverno', en: 'winter' },
      ciudad:     { es: 'en todas las calles de la ciudad',
                    it: 'in tutta la città', en: 'all over the city' },
      terraza:    { es: 'un espacio fuera de la casa, al aire libre',
                    it: 'la terrazza', en: 'the terrace, the balcony' },
      hasta:      { es: 'también dentro de casa (y eso es raro)',
                    it: 'perfino in casa', en: 'even at home' },
      calefaccion:{ es: 'el sistema que da calor a la casa',
                    it: 'il riscaldamento', en: 'the heating' },
      funcionar:  { es: 'no va bien, tiene un problema',
                    it: 'non funziona', en: 'doesn’t work' },
      yano:       { es: 'antes sí, ahora no',
                    it: 'non più', en: 'not any more' },
      como:       { es: 'igual que yo',
                    it: 'come me', en: 'like me' },
      contar:     { es: 'me dice, me explica',
                    it: 'mi racconta', en: 'she tells me' },
      noticia:    { es: 'algo nuevo que te alegra',
                    it: 'una buona notizia', en: 'good news' },
      alli:       { es: 'en ese sitio (Sevilla)',
                    it: 'lì', en: 'there' },
      casinunca:  { es: 'muy pocas veces',
                    it: 'quasi mai', en: 'hardly ever' },
      campo:      { es: 'la tierra fuera de las ciudades, donde crecen las plantas',
                    it: 'la campagna, i campi', en: 'the countryside, the fields' },
      necesitar:  { es: 'le hace falta',
                    it: 'ha bisogno di', en: 'needs' },
      noche:      { es: 'hoy, cuando no hay sol',
                    it: 'stanotte, stasera', en: 'tonight' },
      nieve:      { es: 'lo que cae cuando nieva',
                    it: 'neve', en: 'snow' },
      bonito:     { es: 'que es agradable de ver',
                    it: 'bello', en: 'pretty, lovely' },
      bici:       { es: 'en bicicleta',
                    it: 'in bici', en: 'by bike' },
      antes:      { es: 'primero esto, después lo otro',
                    it: 'prima di', en: 'before' },
      colgar:     { es: 'terminar la llamada de teléfono',
                    it: 'riattaccare', en: 'to hang up' },
      siempre:    { es: 'lo que dice siempre',
                    it: 'la solita cosa', en: 'the usual thing' },
      abrigo:     { es: 'llévate el abrigo, la ropa para el frío',
                    it: 'mettiti il cappotto', en: 'put your coat on' }
    },
    preguntas: [
      { tipo: 'elige', p: '¿Qué tiempo hace hoy en Burgos?',
        trad: { it: 'Che tempo fa oggi a Burgos?', en: 'What’s the weather like in Burgos today?' },
        opciones: ['Hace sol y dieciocho grados', 'Hay niebla y dos bajo cero', 'Llueve'],
        ok: 'Hay niebla y dos bajo cero' },
      { tipo: 'escribe', p: 'Escribe la palabra, como en el texto: «Hoy estamos a dos ___ cero.»',
        trad: { it: 'Scrivi la parola, come nel testo: «Oggi siamo a due ___ zero.»',
                en: 'Write the word, as in the text: “Today it’s two ___ zero.”' },
        ok: 'bajo' },
      { tipo: 'elige', p: '¿Quién tiene frío?',
        trad: { it: 'Chi ha freddo?', en: 'Who is cold?' },
        opciones: ['La madre', 'La hija', 'Las dos'], ok: 'La hija' },
      { tipo: 'elige', p: '«Está frío, como yo.» ¿Qué está frío?',
        trad: { it: '«È freddo, come me.» Che cosa è freddo?', en: '“It’s cold, like me.” What is cold?' },
        opciones: ['El tiempo', 'El café', 'La calefacción'], ok: 'El café' },
      { tipo: 'elige', p: '¿Qué tiempo va a hacer mañana en Sevilla?',
        trad: { it: 'Che tempo farà domani a Siviglia?', en: 'What will the weather be like in Seville tomorrow?' },
        opciones: ['Va a hacer sol', 'Dicen que llueve', 'Va a nevar'], ok: 'Dicen que llueve' },
      { tipo: 'escribe', p: 'Escribe <i>hace</i>, <i>hay</i> o <i>está</i>, como en el texto: «En Burgos ya ___ nublado.»',
        trad: { it: 'Scrivi hace, hay o está, come nel testo: «A Burgos ___ già nuvoloso.»',
                en: 'Write hace, hay or está, as in the text: “In Burgos it ___ already cloudy.”' },
        ok: 'está|esta' },
      { tipo: 'elige', p: '¿Está nevando ahora en Burgos?',
        trad: { it: 'Sta nevicando adesso a Burgos?', en: 'Is it snowing in Burgos right now?' },
        opciones: ['Sí', 'No, pero parece que va a nevar', 'El texto no lo dice'],
        ok: 'No, pero parece que va a nevar' },
      { tipo: 'elige', p: '¿Por qué la lluvia es una buena noticia para la madre?',
        trad: { it: 'Perché la pioggia è una buona notizia per la madre?', en: 'Why is the rain good news for the mother?' },
        opciones: ['Porque no le gusta el sol', 'Porque el campo necesita agua', 'Porque su hija va en bici'],
        ok: 'Porque el campo necesita agua' }
    ],
    escribir: {
      es: '¿Qué tiempo hace hoy donde vives? ¿Y qué dicen para mañana? Escribe un mensaje de cinco o seis frases a un amigo, con <i>hace</i>, <i>hay</i>, <i>está</i> y <i>va a</i>, y dile cuántos grados hace. Termina con un <i>¡qué…!</i>',
      it: 'Che tempo fa oggi dove vivi? E cosa dicono per domani? Scrivi a un amico un messaggio di cinque o sei frasi, con hace, hay, está e va a, e digli quanti gradi ci sono. Finisci con un ¡qué…!',
      en: 'What’s the weather like today where you live? And what do they say for tomorrow? Write a message of five or six sentences to a friend, using hace, hay, está and va a, and tell them how many degrees it is. Finish with a ¡qué…!'
    }
  }
];

// La lectura de una clase, o null si todavía no tiene.
window.jnLecturaDe = function(claseId){
  return (window.JN_LECTURAS || []).find(l => l.clase === claseId) || null;
};
