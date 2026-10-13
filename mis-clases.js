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
      hoy: 'hoy', anteriores: 'Clases anteriores', sinF: 'sin fecha'
    },
    it: {
      titulo: 'Le tue lezioni',
      subMuchas: 'Il tuo percorso con José.',
      subPocas: 'Hai appena iniziato.',
      clases: 'lezioni', clase: 'lezione',
      temas: 'argomenti visti', tema: 'argomento visto',
      meses: 'mesi insieme', mes: 'mese insieme', sinFecha: 'da confermare',
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
      hoy: 'oggi', anteriores: 'Lezioni precedenti', sinF: 'senza data'
    },
    en: {
      titulo: 'Your classes',
      subMuchas: 'Your journey with José.',
      subPocas: 'You’ve just started.',
      clases: 'classes', clase: 'class',
      temas: 'topics covered', tema: 'topic covered',
      meses: 'months together', mes: 'month together', sinFecha: 'to be confirmed',
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
      hoy: 'today', anteriores: 'Earlier classes', sinF: 'no date'
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

  function tarjeta(n, etiqueta, apagada){
    return '<div class="cl-num' + (apagada ? ' sin' : '') + '">' +
           '<span class="n">' + esc(n) + '</span>' +
           '<span class="l">' + esc(etiqueta) + '</span></div>';
  }

  function render(asignadas){
    // cada asignación: {id, fecha, nota}. La nota es de José y aquí no se usa.
    const filas = asignadas.map(a => {
      // una clase rápida se guarda entera dentro de la asignación; una del
      // catálogo solo por id, y el contenido vive en clases.js
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
      const cab = '<span class="cl-fecha">' + esc(cuando) + '</span>' +
                  '<span class="cl-tit">' + esc(f.titulo) + '</span>' +
                  '<span class="cl-temas">' + chips + '</span>';
      if(!f.rapida){
        return '<a class="' + clases + '" href="' + esc(f.href) + '" data-busca="' + esc(busca) + '">' +
               cab + '<i class="ti ti-chevron-right cl-flecha" aria-hidden="true"></i></a>';
      }
      return '<div class="' + clases + '" data-busca="' + esc(busca) + '" tabindex="0" role="button">' +
             cab + '<i class="ti ti-chevron-down cl-flecha" aria-hidden="true"></i>' +
             '<div class="cl-detalle">' + detalleRapida(f.rapida) + '</div></div>';
    }).join('\n');

    pinta(
      '<p class="subtitle" style="margin-bottom:18px">' +
        esc(filas.length >= 4 ? T.subMuchas : T.subPocas) + '</p>' +
      '<div class="cl-nums">' + nums + '</div>' + prox +
      '<div class="cl-buscar"><i class="ti ti-search" aria-hidden="true"></i>' +
      '<input type="text" id="cl-filtro" placeholder="' + esc(T.buscar) + '" autocomplete="off"></div>' +
      '<div class="cl-lista" id="cl-lista">' + lista + '</div>' +
      '<p class="panel-empty" id="cl-vacio" style="display:none;margin-top:14px">' + esc(T.nada) + '</p>'
    );
    filtro();
    document.querySelectorAll('.cl-abre').forEach(function(el){
      el.addEventListener('click', function(){ el.classList.toggle('abierta'); });
      el.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); el.classList.toggle('abierta'); }
      });
    });
  }

  // El contenido de una clase rápida: la regla de cada tema, con sus enlaces.
  // La regla vive en temas.js, así que si se mejora, mejora en todas.
  function detalleRapida(r){
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
        '<a href="ejercicios-' + track + '.html?tema=' + esc(t.ejercicios || t.id) + '">' +
        '<i class="ti ti-pencil" aria-hidden="true"></i> ' + esc(T.practicar) + '</a>';
      return '<div class="cl-bloque"><b>' + esc(nom) + '</b><p>' + reg + '</p>' +
             '<div class="cl-links">' + links + '</div></div>';
    }).join('');
    const deb = r.deberes
      ? '<div class="cl-deberes"><b>' + esc(T.deberes) + '</b><p>' + esc(r.deberes) + '</p></div>'
      : '';
    return bloques + deb;
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
          .then(doc => render((doc && Array.isArray(doc.clases)) ? doc.clases : []))
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
