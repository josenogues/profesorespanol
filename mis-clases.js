// «Mis clases»: la lista de clases que José le ha asignado a este alumno.
//
// El catálogo (qué clases existen) está en clases.js, que es código. Lo que
// viene de Firebase es solo la asignación: qué clases tiene ESTE alumno y
// con qué fecha. Así una clase se corrige una vez y mejora para todos.

(function(){
  const cont = document.getElementById('mc-cont');
  if(!cont) return;

  const track = localStorage.getItem('jn_track') || 'es';
  const LOCALE = { es: 'es-ES', it: 'it-IT', en: 'en-GB' }[track] || 'es-ES';

  const T = {
    es: {
      titulo: 'Tus clases',
      subMuchas: 'Tu camino con José.',
      subPocas: 'Acabas de empezar.',
      clases: 'clases', clase: 'clase',
      temas: 'temas tocados', tema: 'tema tocado',
      meses: 'meses juntos', mes: 'mes juntos', sinFecha: 'por confirmar',
      ejercicios: 'ejercicios hechos', ejercicio: 'ejercicio hecho',
      proxima: 'La próxima:', porDefinir: 'por definir',
      buscar: 'Buscar por tema: subjuntivo, pasados, por/para...',
      nada: 'Ninguna de tus clases habla de eso.',
      sinClases: 'Todavía no hay nada aquí',
      sinClasesP: 'En cuanto deis una clase, José la pondrá aquí: lo que visteis, ' +
                  'las reglas para repasarlo y los deberes de ese día.',
      irEj: 'Mientras tanto, practica',
      cargando: 'Cargando tus clases...',
      sinAcceso: 'Entra con tu email para ver tus clases.',
      error: 'No se han podido cargar tus clases. Revisa tu conexión y vuelve a intentarlo.',
      teoria: 'Teoría', practicar: 'Practicar', deberes: 'Deberes',
      hoy: 'hoy', anteriores: 'Clases anteriores', sinF: 'sin fecha',
      apuntes: 'Mis apuntes', conApuntes: 'Tienes apuntes en esta clase',
      bajarTodo: 'Descargar todos mis apuntes'
    },
    it: {
      titulo: 'Le tue lezioni',
      subMuchas: 'Il tuo percorso con José.',
      subPocas: 'Hai appena iniziato.',
      clases: 'lezioni', clase: 'lezione',
      temas: 'argomenti visti', tema: 'argomento visto',
      meses: 'mesi insieme', mes: 'mese insieme', sinFecha: 'da confermare',
      ejercicios: 'esercizi fatti', ejercicio: 'esercizio fatto',
      proxima: 'La prossima:', porDefinir: 'da definire',
      buscar: 'Cerca per argomento: subjuntivo, pasados, por/para...',
      nada: 'Nessuna delle tue lezioni parla di questo.',
      sinClases: 'Qui non c’è ancora niente',
      sinClasesP: 'Appena farete una lezione, José la metterà qui: quello che avete visto, ' +
                  'le regole per ripassare e i compiti di quel giorno.',
      irEj: 'Intanto, esercitati',
      cargando: 'Carico le tue lezioni...',
      sinAcceso: 'Entra con la tua email per vedere le tue lezioni.',
      error: 'Non è stato possibile caricare le tue lezioni. Controlla la connessione e riprova.',
      teoria: 'Teoria', practicar: 'Esercitati', deberes: 'Compiti',
      hoy: 'oggi', anteriores: 'Lezioni precedenti', sinF: 'senza data',
      apuntes: 'I miei appunti', conApuntes: 'Hai appunti in questa lezione',
      bajarTodo: 'Scarica tutti i miei appunti'
    },
    en: {
      titulo: 'Your classes',
      subMuchas: 'Your journey with José.',
      subPocas: 'You’ve just started.',
      clases: 'classes', clase: 'class',
      temas: 'topics covered', tema: 'topic covered',
      meses: 'months together', mes: 'month together', sinFecha: 'to be confirmed',
      ejercicios: 'exercises done', ejercicio: 'exercise done',
      proxima: 'Next up:', porDefinir: 'to be decided',
      buscar: 'Search by topic: subjuntivo, pasados, por/para...',
      nada: 'None of your classes is about that.',
      sinClases: 'Nothing here yet',
      sinClasesP: 'As soon as you have a class, José will put it here: what you covered, ' +
                  'the rules to go over it again and that day’s homework.',
      irEj: 'In the meantime, practise',
      cargando: 'Loading your classes...',
      sinAcceso: 'Sign in with your email to see your classes.',
      error: 'Your classes could not be loaded. Check your connection and try again.',
      teoria: 'Theory', practicar: 'Practise', deberes: 'Homework',
      hoy: 'today', anteriores: 'Earlier classes', sinF: 'no date',
      apuntes: 'My notes', conApuntes: 'You have notes in this class',
      bajarTodo: 'Download all my notes'
    }
  }[track] || {};

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function pinta(html){ cont.innerHTML = html; }

  function aviso(txt){
    pinta('<div class="placeholder-box">' + esc(txt) + '</div>');
  }

  // «2026-10-12» → «12 de octubre». Si la fecha no vale, devuelve null.
  function fechaLarga(iso){
    if(!iso) return null;
    const d = new Date(iso + 'T12:00:00');
    if(isNaN(d)) return null;
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' });
  }

  function hoyISO(){ return new Date().toISOString().slice(0, 10); }

  function mesesDesde(iso){
    const d = new Date(iso + 'T12:00:00');
    if(isNaN(d)) return null;
    const h = new Date();
    return Math.max(1, (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth()));
  }

  function tarjeta(n, etiqueta, apagada, id){
    return '<div class="cl-num' + (apagada ? ' sin' : '') + '"' +
           (id ? ' id="' + id + '"' : '') + '>' +
           '<span class="n">' + esc(n) + '</span>' +
           '<span class="l">' + esc(etiqueta) + '</span></div>';
  }

  // El contador de ejercicios puede subir después de pintar: cuando el alumno
  // acierta uno en otra pestaña, o cuando la nube trae un número más alto que
  // el del navegador. Así la tarjeta no se queda con un número viejo.
  function refrescaEjercicios(){
    const caja = document.getElementById('cl-ejercicios');
    if(!caja) return;
    const n = window.jnGetExerciseCount ? window.jnGetExerciseCount() : 0;
    caja.querySelector('.n').textContent = n;
    caja.querySelector('.l').textContent = n === 1 ? T.ejercicio : T.ejercicios;
  }
  document.addEventListener('jn-counter-updated', refrescaEjercicios);

  // Clave con la que se guardan los apuntes de una clase. Las del catálogo
  // tienen id; una rápida lleva el suyo desde que se crea, y las creadas
  // antes de que existiera el cuaderno se apañan con fecha + título.
  function claveApuntes(a){
    if(!a.rapida) return a.id;
    return a.rapida.rid || ('r-' + (a.fecha || 'sinfecha') + '-' +
      (a.rapida.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24));
  }

  function render(asignadas, apuntes){
    apuntes = apuntes || {};
    const hayApuntes = function(clave){
      const n = apuntes[clave];
      return !!(n && typeof n.t === 'string' && n.t.trim());
    };
    // cada asignación: {id, fecha, nota}. La nota es de José y aquí no se usa.
    const filas = asignadas.map(a => {
      // una clase rápida se guarda entera dentro de la asignación; una del
      // catálogo solo por id, y el contenido vive en clases.js
      const clave = claveApuntes(a);
      if(a.rapida){
        const r = a.rapida;
        const auto = [];
        (r.temas || []).forEach(id => {
          const t = window.jnTemaPorId && window.jnTemaPorId(id);
          (t ? t.etiquetas : []).forEach(e => { if(auto.indexOf(e) < 0) auto.push(e); });
        });
        return {
          titulo: r.titulo || (fechaLarga(a.fecha) || T.sinF),
          href: null,
          rapida: r,
          clave: clave,
          conApuntes: hayApuntes(clave),
          etiquetas: auto.concat(r.extra || []),
          fecha: a.fecha || ''
        };
      }
      const c = window.jnClasePorId(a.id);
      if(!c) return null;                       // clase retirada del catálogo
      // una clase que solo existe en una pista (las de angloparlantes) se le
      // sigue enseñando al alumno aunque cambie el idioma de la web: José se
      // la asignó, y es peor que le desaparezca de la lista
      const pista = (c.pistas && c.pistas.indexOf(track) < 0) ? c.pistas[0] : track;
      return {
        titulo: (c.titulo && (c.titulo[track] || c.titulo.es)) || a.id,
        href: c.pagina + '-' + pista + '.html',
        clave: clave,
        conApuntes: hayApuntes(clave),
        etiquetas: c.etiquetas || [],
        fecha: a.fecha || ''
      };
    }).filter(Boolean);

    if(!filas.length){
      pinta('<div class="placeholder-box">' +
        '<i class="ti ti-notebook" style="font-size:42px;color:#7A5230;display:block;margin-bottom:14px"></i>' +
        '<h3 style="font-size:20px;margin-bottom:10px;color:var(--text)">' + esc(T.sinClases) + '</h3>' +
        '<p style="max-width:520px;margin:0 auto 22px;font-weight:400">' + esc(T.sinClasesP) + '</p>' +
        '<a href="ejercicios-' + track + '.html" class="button button-primary">' +
        '<i class="ti ti-pencil"></i> ' + esc(T.irEj) + '</a></div>');
      return;
    }

    // las fechadas primero, de la más reciente a la más antigua; las que no
    // tienen fecha, al final: no sabemos cuándo fueron y no deben colarse arriba
    const conF = filas.filter(f => f.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const sinF = filas.filter(f => !f.fecha);
    const orden = conF.concat(sinF);

    const hoy = hoyISO();
    const futuras = conF.filter(f => f.fecha > hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const proxima = futuras[0] || null;

    const temas = new Set();
    filas.forEach(f => f.etiquetas.forEach(t => temas.add(t)));

    const masAntigua = conF.length ? conF[conF.length - 1].fecha : null;
    const meses = masAntigua ? mesesDesde(masAntigua) : null;

    let nums = tarjeta(filas.length, filas.length === 1 ? T.clase : T.clases) +
               tarjeta(temas.size, temas.size === 1 ? T.tema : T.temas);
    nums += meses ? tarjeta(meses, meses === 1 ? T.mes : T.meses)
                  : tarjeta('—', T.sinFecha, true);
    // los ejercicios acertados, junto a las clases y los meses: es el número
    // que el alumno puede subir él solo, y aquí lo tiene a la vista cada vez
    // que entra a mirar sus clases
    const hechos = window.jnGetExerciseCount ? window.jnGetExerciseCount() : 0;
    nums += tarjeta(hechos, hechos === 1 ? T.ejercicio : T.ejercicios, false, 'cl-ejercicios');

    const prox = proxima
      ? '<p class="cl-prox"><i class="ti ti-calendar-event" aria-hidden="true"></i> <b>' +
        esc(T.proxima) + '</b> ' + esc(proxima.titulo) +
        ' &nbsp;<span class="cl-cuando">' + esc(fechaLarga(proxima.fecha)) + '</span></p>'
      : '<p class="cl-prox sin"><i class="ti ti-calendar-event" aria-hidden="true"></i> <b>' +
        esc(T.proxima) + '</b> ' + esc(T.porDefinir) + '</p>';

    const lista = orden.map(f => {
      const chips = f.etiquetas.map(t => '<span class="cl-chip">' + esc(t) + '</span>').join('');
      const busca = (f.titulo + ' ' + f.etiquetas.join(' ')).toLowerCase();
      const cuando = f.fecha ? (fechaLarga(f.fecha) || f.fecha) : T.sinF;
      const pendiente = f.fecha && f.fecha > hoy;
      const clases = 'cl-row' + (pendiente ? ' cl-prox-row' : '') + (f.rapida ? ' cl-abre' : '');
      const marca = f.conApuntes
        ? '<i class="ti ti-note cl-apu-marca" title="' + esc(T.conApuntes) + '" aria-label="' +
          esc(T.conApuntes) + '"></i>'
        : '';
      const cab = '<span class="cl-fecha">' + esc(cuando) + '</span>' +
                  '<span class="cl-tit">' + esc(f.titulo) + marca + '</span>' +
                  '<span class="cl-temas">' + chips + '</span>';
      if(!f.rapida){
        return '<a class="' + clases + '" href="' + esc(f.href) + '" data-busca="' + esc(busca) + '">' +
               cab + '<i class="ti ti-chevron-right cl-flecha" aria-hidden="true"></i></a>';
      }
      return '<div class="' + clases + '" data-busca="' + esc(busca) + '" tabindex="0" role="button">' +
             cab + '<i class="ti ti-chevron-down cl-flecha" aria-hidden="true"></i>' +
             '<div class="cl-detalle">' + detalleRapida(f.rapida, f.clave) + '</div></div>';
    }).join('\n');

    pinta(
      '<p class="subtitle" style="margin-bottom:18px">' +
        esc(filas.length >= 4 ? T.subMuchas : T.subPocas) + '</p>' +
      '<div class="cl-nums">' + nums + '</div>' + prox +
      '<div class="cl-buscar"><i class="ti ti-search" aria-hidden="true"></i>' +
      '<input type="text" id="cl-filtro" placeholder="' + esc(T.buscar) + '" autocomplete="off"></div>' +
      '<div class="cl-lista" id="cl-lista">' + lista + '</div>' +
      (filas.some(f => f.conApuntes)
        ? '<p style="margin:16px 0 0"><button type="button" id="cl-bajar" ' +
          'class="button button-secondary"><i class="ti ti-download"></i> ' +
          esc(T.bajarTodo) + '</button></p>'
        : '') +
      '<p class="panel-empty" id="cl-vacio" style="display:none;margin-top:14px">' + esc(T.nada) + '</p>'
    );
    const bajar = document.getElementById('cl-bajar');
    if(bajar) bajar.addEventListener('click', function(){
      // un archivo con todo, en el mismo orden en que ve las clases
      const trozos = orden.filter(f => f.conApuntes).map(function(f){
        const n = apuntes[f.clave];
        const cuando = f.fecha ? (fechaLarga(f.fecha) || f.fecha) : T.sinF;
        return f.titulo + '\n' + cuando + '\n\n' + n.t;
      });
      if(!trozos.length || !window.jnApuntesDescarga) return;
      window.jnApuntesDescarga('mis-apuntes-' + hoyISO(),
        trozos.join('\n\n' + '─'.repeat(40) + '\n\n') + '\n');
    });

    filtro();
    document.querySelectorAll('[data-apu]').forEach(function(hueco){
      window.jnApuntesCaja(hueco.dataset.apu, hueco);
    });
    document.querySelectorAll('.cl-abre').forEach(function(el){
      el.addEventListener('click', function(ev){
        // escribir en los apuntes no debe plegar la clase
        if(ev.target.closest('.cl-apuntes')) return;
        el.classList.toggle('abierta');
      });
      el.addEventListener('keydown', function(ev){
        if(ev.target.closest('.cl-apuntes')) return;
        if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); el.classList.toggle('abierta'); }
      });
    });
  }

  // El contenido de una clase rápida: la regla de cada tema, con sus enlaces.
  // La regla vive en temas.js, así que si se mejora, mejora en todas.
  function detalleRapida(r, clave){
    const bloques = (r.temas || []).map(id => {
      const t = window.jnTemaPorId && window.jnTemaPorId(id);
      if(!t) return '';
      const nom = (t.nombre && (t.nombre[track] || t.nombre.es)) || id;
      const reg = (t.regla && (t.regla[track] || t.regla.es)) || '';
      // falsos amigos solo tiene página en italiano e inglés
      const hayPagina = !t.pistas || t.pistas.indexOf(track) >= 0;
      const links =
        (hayPagina ? '<a href="' + esc(t.pagina) + '-' + track + '.html">' +
                     '<i class="ti ti-book-2" aria-hidden="true"></i> ' + esc(T.teoria) + '</a>' : '') +
        // los temas finos (por/para, gustar...) no son un tema del hub de
        // ejercicios, viven dentro de uno: el enlace tiene que ir al suyo o
        // llega a la página y no selecciona nada
        '<a href="ejercicios-' + track + '.html?tema=' + esc(t.ejercicios || t.id) +
        // un tema fino es un sub-grupo dentro de otro: &g lo acota a él solo,
        // en vez de abrir el bloque entero
        (t.ejercicios && t.g && hayPagina ? '&g=' + esc(t.g) : '') + '">' +
        '<i class="ti ti-pencil" aria-hidden="true"></i> ' + esc(T.practicar) + '</a>';
      return '<div class="cl-bloque"><b>' + esc(nom) + '</b><p>' + reg + '</p>' +
             '<div class="cl-links">' + links + '</div></div>';
    }).join('');
    const deb = r.deberes
      ? '<div class="cl-deberes"><b>' + esc(T.deberes) + '</b><p>' + esc(r.deberes) + '</p></div>'
      : '';
    // el recuadro se rellena después de pintar: aquí solo queda el hueco
    const apu = window.jnApuntesCaja
      ? '<div class="cl-apuntes"><b>' + esc(T.apuntes) + '</b>' +
        '<div class="cl-apu-caja" data-apu="' + esc(clave) + '"></div></div>'
      : '';
    return bloques + deb + apu;
  }

  function filtro(){
    const inp = document.getElementById('cl-filtro');
    const lista = document.getElementById('cl-lista');
    const vacio = document.getElementById('cl-vacio');
    if(!inp) return;
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    inp.addEventListener('input', function(){
      const q = norm(inp.value.trim());
      let n = 0;
      lista.querySelectorAll('.cl-row').forEach(function(r){
        const ok = !q || norm(r.dataset.busca).includes(q);
        r.style.display = ok ? '' : 'none';
        if(ok) n++;
      });
      vacio.style.display = n ? 'none' : '';
    });
  }

  // firebase-sync.js es un módulo y carga después de este script, así que se
  // espera a que aparezca. Si no llega, se avisa en vez de dejar «Cargando».
  function arranca(){
    const email = localStorage.getItem('jn_student_email');
    if(!email){ aviso(T.sinAcceso); return; }
    const t0 = Date.now();
    (function poll(){
      if(window.jnCloudGetStudentDoc){
        window.jnCloudGetStudentDoc(email)
          .then(doc => render((doc && Array.isArray(doc.clases)) ? doc.clases : [],
                              doc && doc.apuntes))
          .catch(() => aviso(T.error));
        return;
      }
      if(Date.now() - t0 > 8000){ aviso(T.error); return; }
      setTimeout(poll, 120);
    })();
  }

  aviso(T.cargando);
  arranca();
  // si el alumno acaba de meter su email, se pinta sin recargar
  document.addEventListener('jn-access-granted', arranca);
})();
