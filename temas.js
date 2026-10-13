// Catálogo de temas, para montar clases rápidas.
//
// Cada tema trae su regla de una línea: la que se le enseña al alumno en la
// ficha de la clase. No es la teoría completa —esa está en su página, a un
// clic— sino lo que tiene que recordar.
//
// Los temas de vocabulario no llevan regla sino una frase de qué hay dentro:
// una lista de palabras no tiene truco que recordar.

window.JN_TEMAS = [

// ─────────────────────────────── VERBOS ───────────────────────────────
{ id:'ser-estar', pagina:'ser-estar', cat:'verbos', etiquetas:['ser','estar'],
  nombre:{es:'Ser y estar', it:'Ser y estar', en:'Ser and estar'},
  regla:{es:'<b>Ser</b> es lo que eres; <b>estar</b> es cómo estás o dónde estás.',
         it:'<b>Ser</b> è quello che sei; <b>estar</b> è come stai o dove sei.',
         en:'<b>Ser</b> is what you are; <b>estar</b> is how or where you are.'} },

{ id:'haber-tener', pagina:'haber-tener', cat:'verbos', etiquetas:['haber','tener','hay'],
  nombre:{es:'Haber y tener', it:'Haber y tener', en:'Haber and tener'},
  regla:{es:'<b>Hay</b> = existe, sin decir de quién. <b>Tener</b> = es de alguien.',
         it:'<b>Hay</b> = esiste, senza dire di chi. <b>Tener</b> = è di qualcuno.',
         en:'<b>Hay</b> = there is, no owner. <b>Tener</b> = somebody has it.'} },

{ id:'regulares', pagina:'verbos-regulares', cat:'verbos', etiquetas:['verbos regulares','-ar','-er','-ir'],
  nombre:{es:'Verbos regulares', it:'Verbi regolari', en:'Regular verbs'},
  regla:{es:'Quitas <b>-ar, -er, -ir</b> y pegas la terminación. Si te la sabes para uno, te la sabes para miles.',
         it:'Togli <b>-ar, -er, -ir</b> e attacchi la desinenza. Se la sai per uno, la sai per migliaia.',
         en:'Drop <b>-ar, -er, -ir</b> and add the ending. Learn it for one verb and you have thousands.'} },

{ id:'irregulares', pagina:'verbos-irregulares', cat:'verbos', etiquetas:['verbos irregulares'],
  nombre:{es:'Verbos irregulares', it:'Verbi irregolari', en:'Irregular verbs'},
  regla:{es:'No hay regla, y son justo los que más se usan. Se aprenden como palabras sueltas.',
         it:'Non c’è regola, e sono proprio i più usati. Si imparano come parole singole.',
         en:'There is no rule, and they are the most used ones. Learn them as words.'} },

{ id:'indicativo', pagina:'indicativo', cat:'verbos', etiquetas:['indicativo','presente','pasado','futuro'],
  nombre:{es:'Indicativo', it:'Indicativo', en:'Indicative'},
  regla:{es:'El modo de los hechos: lo que pasa, lo que pasó y lo que pasará.',
         it:'Il modo dei fatti: quello che succede, è successo e succederà.',
         en:'The mood of facts: what happens, what happened and what will happen.'} },

{ id:'subjuntivo', pagina:'subjuntivo', cat:'verbos', etiquetas:['subjuntivo'],
  nombre:{es:'Subjuntivo', it:'Congiuntivo', en:'Subjunctive'},
  regla:{es:'El modo de lo que <b>no</b> es un hecho: deseos, dudas y lo que todavía no ha pasado.',
         it:'Il modo di ciò che <b>non</b> è un fatto: desideri, dubbi e ciò che non è ancora successo.',
         en:'The mood for what is <b>not</b> a fact: wishes, doubts and what hasn’t happened yet.'} },

{ id:'imperativo', pagina:'imperativo', cat:'verbos', etiquetas:['imperativo'],
  nombre:{es:'Imperativo', it:'Imperativo', en:'Imperative'},
  regla:{es:'Para dar órdenes, instrucciones y consejos. Y el pronombre va pegado detrás: <b>dímelo</b>.',
         it:'Per dare ordini, istruzioni e consigli. E il pronome si attacca dietro: <b>dímelo</b>.',
         en:'For orders, instructions and advice. The pronoun sticks to the end: <b>dímelo</b>.'} },

{ id:'reflexivos', pagina:'verbos-reflexivos', cat:'verbos', etiquetas:['verbos reflexivos','se'],
  nombre:{es:'Verbos reflexivos', it:'Verbi riflessivi', en:'Reflexive verbs'},
  regla:{es:'La acción vuelve sobre ti: <b>lavar</b> el coche frente a <b>lavarte</b> tú.',
         it:'L’azione torna su di te: <b>lavar</b> la macchina contro <b>lavarte</b> tu.',
         en:'The action comes back to you: <b>lavar</b> the car versus <b>lavarte</b> yourself.'} },

{ id:'formas-impersonales', pagina:'formas-impersonales', cat:'verbos',
  etiquetas:['infinitivo','gerundio','participio'],
  nombre:{es:'Formas impersonales', it:'Forme impersonali', en:'Non-finite forms'},
  regla:{es:'Infinitivo, gerundio y participio: las tres formas del verbo que no se conjugan.',
         it:'Infinito, gerundio e participio: le tre forme del verbo che non si coniugano.',
         en:'Infinitive, gerund and participle: the three verb forms that never conjugate.'} },

{ id:'perifrasis', pagina:'perifrasis', ejercicios:'formas-impersonales', cat:'verbos',
  etiquetas:['perífrasis','tener que','hay que','ir a','estar + gerundio','volver a','soler'],
  nombre:{es:'Perífrasis verbales', it:'Perifrasi verbali', en:'Verbal periphrases'},
  regla:{es:'Dos verbos seguidos: el primero manda (persona y tiempo), el segundo dice qué pasa.',
         it:'Due verbi di fila: il primo comanda (persona e tempo), il secondo dice cosa succede.',
         en:'Two verbs in a row: the first one is in charge (person and tense), the second says what happens.'} },

{ id:'estilo-indirecto', pagina:'estilo-indirecto', cat:'verbos', etiquetas:['estilo indirecto'],
  nombre:{es:'Estilo indirecto', it:'Discorso indiretto', en:'Reported speech'},
  regla:{es:'Contar lo que otro dijo: cambian los tiempos, las personas y el aquí y el ahora.',
         it:'Raccontare quello che ha detto un altro: cambiano i tempi, le persone e il qui e ora.',
         en:'Reporting what someone said: tenses, persons and the here-and-now all shift.'} },

{ id:'atn-verbos', pagina:'especial-atencion-verbos', cat:'verbos',
  etiquetas:['traer','llevar','venir','ir','pedir','preguntar','dejar','recordar'],
  nombre:{es:'Verbos que se confunden', it:'Verbi che si confondono', en:'Verbs that get mixed up'},
  regla:{es:'Parejas que en otros idiomas son un verbo solo y en español son dos.',
         it:'Coppie che in altre lingue sono un verbo solo e in spagnolo sono due.',
         en:'Pairs that are a single verb in other languages and two in Spanish.'} },

// ─────────────────────────────── GRAMÁTICA ───────────────────────────────
{ id:'articulos', pagina:'articulos', cat:'gramatica', etiquetas:['artículos','el','la','al','del'],
  nombre:{es:'Artículos', it:'Articoli', en:'Articles'},
  regla:{es:'<b>El, la, los, las</b> y <b>un, una, unos, unas</b>. Y dos contracciones: <b>al</b> y <b>del</b>.',
         it:'<b>El, la, los, las</b> e <b>un, una, unos, unas</b>. E due contrazioni: <b>al</b> e <b>del</b>.',
         en:'<b>El, la, los, las</b> and <b>un, una, unos, unas</b>. Plus two contractions: <b>al</b> and <b>del</b>.'} },

{ id:'genero-numero', pagina:'genero-numero', cat:'gramatica', etiquetas:['género','número','concordancia'],
  nombre:{es:'Género y número', it:'Genere e numero', en:'Gender and number'},
  regla:{es:'Casi todo en <b>-o</b> es masculino y en <b>-a</b> femenino. Y el adjetivo acompaña al nombre.',
         it:'Quasi tutto in <b>-o</b> è maschile e in <b>-a</b> femminile. E l’aggettivo segue il nome.',
         en:'Almost everything in <b>-o</b> is masculine and in <b>-a</b> feminine. The adjective follows the noun.'} },

{ id:'pronombres', pagina:'pronombres', cat:'gramatica', etiquetas:['pronombres','yo','tú','lo','le'],
  nombre:{es:'Pronombres', it:'Pronomi', en:'Pronouns'},
  regla:{es:'Yo, tú, él... y los que sustituyen al nombre para no repetirlo: <b>lo, la, le</b>.',
         it:'Yo, tú, él... e quelli che sostituiscono il nome per non ripeterlo: <b>lo, la, le</b>.',
         en:'Yo, tú, él... and the ones that replace the noun so you don’t repeat it: <b>lo, la, le</b>.'} },

{ id:'preposiciones', pagina:'preposiciones', cat:'gramatica', etiquetas:['preposiciones','a','de','en'],
  nombre:{es:'Preposiciones', it:'Preposizioni', en:'Prepositions'},
  regla:{es:'<b>a, de, en, con, por, para</b>: las palabras pequeñas que más se fallan.',
         it:'<b>a, de, en, con, por, para</b>: le parole piccole che si sbagliano di più.',
         en:'<b>a, de, en, con, por, para</b>: the small words people get wrong most.'} },

{ id:'conectores', pagina:'conectores', cat:'gramatica', etiquetas:['conectores','además','sin embargo'],
  nombre:{es:'Conectores', it:'Connettori', en:'Connectors'},
  regla:{es:'Las palabras que unen ideas: <b>además, sin embargo, por eso</b>. Sin ellas hablas a frases sueltas.',
         it:'Le parole che uniscono le idee: <b>además, sin embargo, por eso</b>. Senza, parli a frasi staccate.',
         en:'The words that join ideas: <b>además, sin embargo, por eso</b>. Without them you speak in fragments.'} },

{ id:'fonetica', pagina:'fonetica', cat:'gramatica', etiquetas:['pronunciación','acento','tilde'],
  nombre:{es:'Fonética', it:'Fonetica', en:'Phonetics'},
  regla:{es:'Cómo suena lo que lees: la <b>j</b>, la <b>ll</b>, la <b>rr</b> y dónde cae el acento.',
         it:'Come suona quello che leggi: la <b>j</b>, la <b>ll</b>, la <b>rr</b> e dove cade l’accento.',
         en:'How what you read sounds: <b>j</b>, <b>ll</b>, <b>rr</b> and where the stress falls.'} },

{ id:'atn-gramatica', pagina:'especial-atencion-gramatica', cat:'gramatica',
  etiquetas:['por','para','mucho','muy','pero','sino'],
  nombre:{es:'Gramática que delata', it:'Grammatica che ti tradisce', en:'Grammar that gives you away'},
  regla:{es:'<b>Por o para</b>, <b>mucho o muy</b>, <b>pero o sino</b>: donde casi todo el mundo falla.',
         it:'<b>Por o para</b>, <b>mucho o muy</b>, <b>pero o sino</b>: dove quasi tutti sbagliano.',
         en:'<b>Por or para</b>, <b>mucho or muy</b>, <b>pero or sino</b>: where almost everyone slips.'} },

// ─────────────────────────────── EXPRESIONES ───────────────────────────────
{ id:'expresiones-comunes', pagina:'expresiones-comunes', cat:'expresiones', etiquetas:['expresiones comunes'],
  nombre:{es:'Expresiones comunes', it:'Espressioni comuni', en:'Common expressions'},
  regla:{es:'Lo que se dice todos los días y no sale en los libros.',
         it:'Quello che si dice tutti i giorni e non c’è sui libri.',
         en:'What people actually say every day and books don’t teach.'} },

{ id:'modismos', pagina:'modismos', cat:'expresiones', etiquetas:['modismos','frases hechas'],
  nombre:{es:'Modismos', it:'Modi di dire', en:'Idioms and sayings'},
  regla:{es:'Frases hechas: traducidas palabra por palabra no significan nada.',
         it:'Frasi fatte: tradotte parola per parola non significano niente.',
         en:'Set phrases: translated word for word they mean nothing.'} },

{ id:'falsos-amigos', pagina:'falsos-amigos', cat:'expresiones', etiquetas:['falsos amigos'],
  pistas:['it','en'],
  nombre:{es:'Falsos amigos', it:'Falsi amici', en:'False friends'},
  regla:{es:'Se parecen a una palabra de tu idioma y significan otra cosa.',
         it:'Somigliano a una parola della tua lingua e significano un’altra cosa.',
         en:'They look like a word in your language and mean something else.'} },

// ─────────────────────────────── VOCABULARIO ───────────────────────────────
{ id:'vida-cotidiana', pagina:'vida-cotidiana', cat:'vocabulario', etiquetas:['vida cotidiana'],
  nombre:{es:'Vida cotidiana', it:'Vita quotidiana', en:'Everyday life'},
  regla:{es:'Las palabras del día a día: la rutina, la compra, el barrio.',
         it:'Le parole di tutti i giorni: la routine, la spesa, il quartiere.',
         en:'Everyday words: your routine, the shopping, the neighbourhood.'} },

{ id:'viajes', pagina:'viajes', cat:'vocabulario', etiquetas:['viajes','aeropuerto','hotel'],
  nombre:{es:'Viajes', it:'Viaggi', en:'Travel'},
  regla:{es:'Aeropuerto, hotel, billetes y todo lo que hace falta para moverse.',
         it:'Aeroporto, hotel, biglietti e tutto quello che serve per spostarsi.',
         en:'Airport, hotel, tickets and everything you need to get around.'} },

{ id:'trabajo', pagina:'trabajo', cat:'vocabulario', etiquetas:['trabajo'],
  nombre:{es:'Trabajo', it:'Lavoro', en:'Work'},
  regla:{es:'El vocabulario de la oficina, el contrato y el día a día laboral.',
         it:'Il vocabolario dell’ufficio, del contratto e della giornata di lavoro.',
         en:'Office vocabulary, contracts and the working day.'} },

{ id:'restaurante', pagina:'restaurante', cat:'vocabulario', etiquetas:['restaurante','pedir'],
  nombre:{es:'Restaurante', it:'Ristorante', en:'Restaurant'},
  regla:{es:'Pedir, preguntar por el plato del día y pagar sin apuros.',
         it:'Ordinare, chiedere il piatto del giorno e pagare senza affanni.',
         en:'Ordering, asking for the dish of the day and paying without stress.'} },

{ id:'casa', pagina:'casa', cat:'vocabulario', etiquetas:['casa','piso'],
  nombre:{es:'Casa', it:'Casa', en:'Home'},
  regla:{es:'Las habitaciones, los muebles y lo que hace falta para buscar piso.',
         it:'Le stanze, i mobili e quello che serve per cercare casa.',
         en:'Rooms, furniture and what you need to go flat-hunting.'} },

{ id:'comidas-bebidas', pagina:'comidas-bebidas', cat:'vocabulario', etiquetas:['comida','bebida'],
  nombre:{es:'Comidas y bebidas', it:'Cibi e bevande', en:'Food and drink'},
  regla:{es:'Lo que se come y se bebe, y cómo se pide en una tienda o un bar.',
         it:'Quello che si mangia e si beve, e come si chiede in un negozio o un bar.',
         en:'What people eat and drink, and how to ask for it in a shop or a bar.'} },

{ id:'deportes', pagina:'deportes', cat:'vocabulario', etiquetas:['deportes'],
  nombre:{es:'Deportes', it:'Sport', en:'Sports'},
  regla:{es:'Jugar, practicar, hacer: cada deporte lleva su verbo.',
         it:'Jugar, practicar, hacer: ogni sport ha il suo verbo.',
         en:'Jugar, practicar, hacer: each sport takes its own verb.'} },

{ id:'clima', pagina:'clima', cat:'vocabulario', etiquetas:['clima','tiempo'],
  nombre:{es:'El clima', it:'Il clima', en:'The weather'},
  regla:{es:'El tiempo que hace, que es de lo que más se habla sin conocerse.',
         it:'Il tempo che fa, l’argomento con cui si rompe il ghiaccio.',
         en:'The weather — what people talk about when they don’t know each other yet.'} },

{ id:'temperatura', pagina:'temperatura', cat:'vocabulario', etiquetas:['temperatura','frío','calor'],
  nombre:{es:'Sobre temperatura', it:'Sulla temperatura', en:'About temperature'},
  regla:{es:'Frío, calor, fresco, templado: y con qué verbo va cada uno.',
         it:'Freddo, caldo, fresco, mite: e con che verbo va ciascuno.',
         en:'Cold, hot, cool, mild — and which verb goes with each.'} },

{ id:'cuerpo-humano', pagina:'cuerpo-humano', cat:'vocabulario', etiquetas:['cuerpo','médico','dolor'],
  nombre:{es:'El cuerpo humano', it:'Il corpo umano', en:'The human body'},
  regla:{es:'Las partes del cuerpo y cómo decir dónde te duele.',
         it:'Le parti del corpo e come dire dove ti fa male.',
         en:'Parts of the body and how to say where it hurts.'} },

{ id:'la-hora', pagina:'la-hora', cat:'vocabulario', etiquetas:['la hora'],
  nombre:{es:'La hora', it:'L’ora', en:'Telling the time'},
  regla:{es:'<b>Es la una</b>, pero <b>son las dos</b>. Y de ahí en adelante, siempre en plural.',
         it:'<b>Es la una</b>, ma <b>son las dos</b>. E da lì in poi, sempre al plurale.',
         en:'<b>Es la una</b>, but <b>son las dos</b>. From two onwards, always plural.'} },

{ id:'las-fechas', pagina:'las-fechas', cat:'vocabulario', etiquetas:['fechas','días','meses'],
  nombre:{es:'Las fechas', it:'Le date', en:'Dates'},
  regla:{es:'Días, meses y años. Y los meses van en minúscula: <b>el 3 de marzo</b>.',
         it:'Giorni, mesi e anni. E i mesi vanno in minuscolo: <b>el 3 de marzo</b>.',
         en:'Days, months and years. Months are lower case: <b>el 3 de marzo</b>.'} },

{ id:'moverse-ciudad', pagina:'moverse-ciudad', cat:'vocabulario', etiquetas:['transporte','direcciones'],
  nombre:{es:'Moverte por la ciudad', it:'Muoverti in città', en:'Getting around town'},
  regla:{es:'Pedir y entender direcciones, y coger el transporte sin perderte.',
         it:'Chiedere e capire indicazioni, e prendere i mezzi senza perderti.',
         en:'Asking for and following directions, and using transport without getting lost.'} },

{ id:'papeleo', pagina:'papeleo', cat:'vocabulario', etiquetas:['papeleo','NIE','cita previa'],
  nombre:{es:'Papeleo y cita previa', it:'Burocrazia e cita previa', en:'Paperwork and appointments'},
  regla:{es:'NIE, empadronamiento, ventanilla: las palabras que te van a soltar en una oficina.',
         it:'NIE, empadronamiento, ventanilla: le parole che ti diranno in un ufficio.',
         en:'NIE, empadronamiento, ventanilla: the words they will throw at you in an office.'} },

// ─────────────────────────────── PROFESIONAL ───────────────────────────────
{ id:'profesional-registro', pagina:'profesional-registro', cat:'profesional', etiquetas:['tú','usted','registro'],
  nombre:{es:'Registro y tono', it:'Registro e tono', en:'Register and tone'},
  regla:{es:'Con compañeros, <b>tú</b>. Con un cliente nuevo, <b>usted</b> hasta que te tuteen.',
         it:'Con i colleghi, <b>tú</b>. Con un cliente nuovo, <b>usted</b> finché non ti danno del tu.',
         en:'With colleagues, <b>tú</b>. With a new client, <b>usted</b> until they switch.'} },

{ id:'profesional-email', pagina:'profesional-email', cat:'profesional', etiquetas:['email','saludo','despedida'],
  nombre:{es:'El email profesional', it:'L’email professionale', en:'The professional email'},
  regla:{es:'El saludo lleva <b>dos puntos</b>, no coma. Y <b>«Un saludo,»</b> vale para el 80% de los correos.',
         it:'Il saluto vuole i <b>due punti</b>, non la virgola. E <b>«Un saludo,»</b> va bene nell’80% dei casi.',
         en:'The greeting takes a <b>colon</b>, not a comma. And <b>«Un saludo,»</b> works for 80% of emails.'} },

{ id:'profesional-emails-modelo', pagina:'profesional-emails-modelo', cat:'profesional', etiquetas:['emails modelo'],
  nombre:{es:'Emails modelo', it:'Email modello', en:'Model emails'},
  regla:{es:'Correos enteros para copiar: pedir algo, reclamar, disculparse, cerrar un tema.',
         it:'Email intere da copiare: chiedere, sollecitare, scusarsi, chiudere una questione.',
         en:'Whole emails to copy: asking, chasing, apologising, closing a matter.'} },

{ id:'profesional-chat', pagina:'profesional-chat', cat:'profesional', etiquetas:['chat','Teams','Slack'],
  nombre:{es:'Chat de trabajo', it:'Chat di lavoro', en:'Work chat'},
  regla:{es:'Más corto que un email y más formal que un WhatsApp. Y casi siempre de <b>tú</b>.',
         it:'Più corto di un’email e più formale di un WhatsApp. E quasi sempre col <b>tú</b>.',
         en:'Shorter than an email, more formal than WhatsApp. And almost always <b>tú</b>.'} },

{ id:'profesional-telefono', pagina:'profesional-telefono', cat:'profesional', etiquetas:['teléfono'],
  nombre:{es:'El teléfono', it:'Il telefono', en:'On the phone'},
  regla:{es:'Sin cara ni gestos: <b>«¿Me lo puedes repetir, por favor?»</b> es la frase que más te va a salvar.',
         it:'Senza volto né gesti: <b>«¿Me lo puedes repetir, por favor?»</b> è la frase che ti salverà di più.',
         en:'No face, no gestures: <b>«¿Me lo puedes repetir, por favor?»</b> is the phrase that saves you most.'} },

{ id:'profesional-reuniones', pagina:'profesional-reuniones', cat:'profesional', etiquetas:['reuniones'],
  nombre:{es:'Reuniones', it:'Riunioni', en:'Meetings'},
  regla:{es:'Pedir la palabra, estar de acuerdo a medias y discrepar sin ofender.',
         it:'Chiedere la parola, essere d’accordo a metà e dissentire senza offendere.',
         en:'Taking the floor, half-agreeing and disagreeing without offending.'} },

{ id:'profesional-presentaciones', pagina:'profesional-presentaciones', cat:'profesional', etiquetas:['presentaciones'],
  nombre:{es:'Presentaciones', it:'Presentazioni', en:'Presentations'},
  regla:{es:'Abrir, encadenar y cerrar. Y se dice <b>diapositiva</b>, no «slide».',
         it:'Aprire, concatenare e chiudere. E si dice <b>diapositiva</b>, non «slide».',
         en:'Opening, linking and closing. And it’s <b>diapositiva</b>, not «slide».'} },

{ id:'profesional-cv', pagina:'profesional-cv', cat:'profesional', etiquetas:['CV','carta de presentación'],
  nombre:{es:'El CV y la carta', it:'Il CV e la lettera', en:'The CV and cover letter'},
  regla:{es:'Una página, dos como máximo. Y ya no se pone ni el estado civil ni la fecha de nacimiento.',
         it:'Una pagina, due al massimo. E non si mettono più stato civile né data di nascita.',
         en:'One page, two at most. And marital status and date of birth are no longer included.'} },

{ id:'profesional-entrevista', pagina:'profesional-entrevista', cat:'profesional', etiquetas:['entrevista'],
  nombre:{es:'La entrevista', it:'Il colloquio', en:'The job interview'},
  regla:{es:'Empiezas de <b>usted</b> y cambias en cuanto te tuteen. Y no se dice «trabajo desde cuatro años».',
         it:'Inizi con <b>usted</b> e cambi appena ti danno del tu. E non si dice «trabajo desde cuatro años».',
         en:'Start with <b>usted</b> and switch as soon as they do. And you don’t say «trabajo desde cuatro años».'} },

// ──────── Los finos: las parejas concretas, que es como se dan en clase ────────
// Viven dentro de las páginas de «especial atención», pero como temas sueltos
// porque nadie dice «hoy vemos gramática que delata»: dice «vemos por/para».

{ id:'por-para', pagina:'especial-atencion-gramatica', ejercicios:'atn-gramatica', cat:'gramatica', etiquetas:['por','para'],
  nombre:{es:'Por o para', it:'Por o para', en:'Por or para'},
  regla:{es:'Si cabe «a causa de» → <b>por</b>. Si cabe «con el fin de» → <b>para</b>.',
         it:'Se ci sta «a causa di» → <b>por</b>. Se ci sta «allo scopo di» → <b>para</b>.',
         en:'If «because of» fits → <b>por</b>. If «in order to» fits → <b>para</b>.'} },

{ id:'mucho-muy', pagina:'especial-atencion-gramatica', ejercicios:'atn-gramatica', cat:'gramatica', etiquetas:['mucho','muy'],
  nombre:{es:'Mucho o muy', it:'Mucho o muy', en:'Mucho or muy'},
  regla:{es:'Delante de un adjetivo o un adverbio, <b>muy</b>. Con un nombre o un verbo, <b>mucho</b>.',
         it:'Davanti a un aggettivo o un avverbio, <b>muy</b>. Con un nome o un verbo, <b>mucho</b>.',
         en:'Before an adjective or adverb, <b>muy</b>. With a noun or a verb, <b>mucho</b>.'} },

{ id:'pero-sino', pagina:'especial-atencion-gramatica', ejercicios:'atn-gramatica', cat:'gramatica', etiquetas:['pero','sino','sino que'],
  nombre:{es:'Pero, sino, sino que', it:'Pero, sino, sino que', en:'Pero, sino, sino que'},
  regla:{es:'Tras una negación y sin verbo nuevo, <b>sino</b>. Si detrás viene un verbo conjugado, <b>sino que</b>. En lo demás, <b>pero</b>.',
         it:'Dopo una negazione e senza verbo nuovo, <b>sino</b>. Se dietro c’è un verbo coniugato, <b>sino que</b>. Altrimenti, <b>pero</b>.',
         en:'After a negative with no new verb, <b>sino</b>. If a conjugated verb follows, <b>sino que</b>. Otherwise, <b>pero</b>.'} },

{ id:'traer-llevar', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['traer','llevar'],
  nombre:{es:'Traer o llevar', it:'Traer o llevar', en:'Traer or llevar'},
  regla:{es:'¿Acaba el movimiento donde estoy yo? Sí → <b>traer</b>. No → <b>llevar</b>.',
         it:'Il movimento finisce dove sono io? Sì → <b>traer</b>. No → <b>llevar</b>.',
         en:'Does the movement end where I am? Yes → <b>traer</b>. No → <b>llevar</b>.'} },

{ id:'venir-ir', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['venir','ir'],
  nombre:{es:'Venir o ir', it:'Venir o ir', en:'Venir or ir'},
  regla:{es:'Solo se «viene» adonde está quien habla. A cualquier otro sitio, se «va».',
         it:'Si «viene» solo dove si trova chi parla. In qualunque altro posto, si «va».',
         en:'You only «come» to where the speaker is. Anywhere else, you «go».'} },

{ id:'pedir-preguntar', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['pedir','preguntar'],
  nombre:{es:'Pedir o preguntar', it:'Pedir o preguntar', en:'Pedir or preguntar'},
  regla:{es:'Si la respuesta es una cosa o una acción, <b>pedir</b>. Si es un dato, <b>preguntar</b>.',
         it:'Se la risposta è una cosa o un’azione, <b>pedir</b>. Se è un’informazione, <b>preguntar</b>.',
         en:'If the answer is a thing or an action, <b>pedir</b>. If it’s information, <b>preguntar</b>.'} },

{ id:'dejar', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['dejar','dejar de'],
  nombre:{es:'Los mil usos de «dejar»', it:'I mille usi di «dejar»', en:'The many uses of «dejar»'},
  regla:{es:'<b>Dejar de</b> corta algo que venías haciendo. Sin el «de» significa poner, prestar o permitir.',
         it:'<b>Dejar de</b> interrompe qualcosa che facevi. Senza «de» significa posare, prestare o permettere.',
         en:'<b>Dejar de</b> stops something you were doing. Without «de» it means put, lend or allow.'} },

{ id:'recordar-acordarse', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['recordar','acordarse'],
  nombre:{es:'Recordar o acordarse', it:'Recordar o acordarse', en:'Recordar or acordarse'},
  regla:{es:'<b>Recordar algo</b>, sin pronombre. <b>Acordarse de algo</b>, con pronombre y con «de». «Me recuerdo» no existe.',
         it:'<b>Recordar algo</b>, senza pronome. <b>Acordarse de algo</b>, con pronome e con «de». «Me recuerdo» non esiste.',
         en:'<b>Recordar algo</b>, no pronoun. <b>Acordarse de algo</b>, with pronoun and «de». «Me recuerdo» doesn’t exist.'} },

{ id:'verbos-cambio', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos',
  etiquetas:['hacerse','ponerse','volverse','quedarse'],
  nombre:{es:'Hacerse, ponerse, volverse', it:'Hacerse, ponerse, volverse', en:'Hacerse, ponerse, volverse'},
  regla:{es:'<b>Ponerse</b> pasajero, <b>hacerse</b> buscado, <b>volverse</b> involuntario y <b>quedarse</b> por una pérdida.',
         it:'<b>Ponerse</b> passeggero, <b>hacerse</b> voluto, <b>volverse</b> involontario e <b>quedarse</b> per una perdita.',
         en:'<b>Ponerse</b> temporary, <b>hacerse</b> deliberate, <b>volverse</b> involuntary, <b>quedarse</b> after a loss.'} },

{ id:'gerundio', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['gerundio','-ando','-iendo'],
  nombre:{es:'El gerundio', it:'Il gerundio', en:'The gerund'},
  regla:{es:'No vale como adjetivo ni como sujeto: ahí van <b>infinitivo</b> o <b>que + verbo</b>.',
         it:'Non vale come aggettivo né come soggetto: lì ci vanno <b>infinito</b> o <b>que + verbo</b>.',
         en:'It can’t be an adjective or a subject: there you need an <b>infinitive</b> or <b>que + verb</b>.'} },

{ id:'gustar', pagina:'especial-atencion-verbos', ejercicios:'atn-verbos', cat:'verbos', etiquetas:['gustar','me gusta'],
  nombre:{es:'Gustar y los que van al revés', it:'Gustar e quelli al contrario', en:'Gustar and the backwards verbs'},
  regla:{es:'No eres tú quien gusta: te gusta algo. <b>Me gusta</b> una cosa, <b>me gustan</b> varias.',
         it:'Non sei tu che piaci: ti piace qualcosa. <b>Me gusta</b> una cosa, <b>me gustan</b> più cose.',
         en:'You don’t like — something pleases you. <b>Me gusta</b> for one thing, <b>me gustan</b> for several.'} },

{ id:'sujeto-innecesario', pagina:'especial-atencion-gramatica', ejercicios:'atn-gramatica', cat:'gramatica', etiquetas:['sujeto','yo','tú'],
  nombre:{es:'El sujeto que no hace falta', it:'Il soggetto che non serve', en:'The subject you don’t need'},
  regla:{es:'La terminación ya dice quién es: <b>soy italiano</b>, no «yo soy italiano».',
         it:'La desinenza dice già chi è: <b>soy italiano</b>, non «yo soy italiano».',
         en:'The ending already says who: <b>soy italiano</b>, not «yo soy italiano».'} },

{ id:'orden-adjetivo', pagina:'especial-atencion-gramatica', ejercicios:'atn-gramatica', cat:'gramatica', etiquetas:['adjetivo','orden'],
  nombre:{es:'Dónde va el adjetivo', it:'Dove va l’aggettivo', en:'Where the adjective goes'},
  regla:{es:'Detrás del nombre: <b>un coche rojo</b>. Delante cambia el sentido o suena a poesía.',
         it:'Dopo il nome: <b>un coche rojo</b>. Davanti cambia il senso o suona poetico.',
         en:'After the noun: <b>un coche rojo</b>. Before it, the meaning shifts or it sounds poetic.'} }

];

window.jnTemaPorId = function(id){
  return (window.JN_TEMAS || []).find(t => t.id === id) || null;
};
