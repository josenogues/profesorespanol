// La página de una lectura: lectura-XX.html?clase=<id de la clase>.
//
// Una sola página por pista para todas las lecturas: el contenido vive en
// lecturas.js y aquí se pinta. Va ANTES de script.js, así que los ejercicios
// ya están en la página cuando el motor que corrige los busca (lo hace al
// pulsar, por delegación, y marca al cargar los que ya se acertaron).
//
// La escritura libre es el recuadro de los apuntes (apuntes.js) con la clave
// 'lectura-<clase>': se guarda solo y José la lee en el panel.

(function(){
  const cont = document.getElementById('lec-cont');
  if(!cont) return;

  // Cloudflare sirve las páginas sin el «.html» (lectura-it en vez de
  // lectura-it.html): el idioma tiene que leerse con y sin él
  const track = (location.pathname.match(/-(es|it|en)(?:\.html)?$/) || [])[1] || 'es';
  const T = {
    es: { eyebrow: 'Lectura', de: 'Lectura de la clase', leer: 'Lee el texto. Si una palabra subrayada no la entiendes, tócala.',
          preguntas: 'Preguntas', pregSub: 'Todas sobre el texto: vuelve a él siempre que quieras.',
          elige: 'Elige', escribe: 'Escríbelo', hecho: 'Hecho', placeholder: 'Escribe la respuesta', comprobar: 'Comprobar',
          trad: 'Traducción', escribir: 'Ahora escribe tú',
          escribirNota: 'Se guarda solo, aunque cierres la página. Lo vemos juntos en la próxima clase.',
          sitio: 'Escribe aquí…', verClase: 'Ver la clase', volver: 'Volver a mis clases',
          noHay: 'Esta lectura todavía no existe.' },
    it: { eyebrow: 'Lettura', de: 'Lettura della lezione', leer: 'Leggi il testo. Se non capisci una parola sottolineata, toccala.',
          preguntas: 'Domande', pregSub: 'Tutte sul testo: tornaci ogni volta che vuoi. Se non capisci una domanda, premi «Traduzione».',
          elige: 'Scegli', escribe: 'Scrivilo', hecho: 'Fatto', placeholder: 'Scrivi la risposta', comprobar: 'Controlla',
          trad: 'Traduzione', escribir: 'Ora scrivi tu',
          escribirNota: 'Si salva da solo, anche se chiudi la pagina. Lo guardiamo insieme alla prossima lezione.',
          sitio: 'Scrivi qui in spagnolo…', verClase: 'Vedi la lezione', volver: 'Torna alle mie lezioni',
          noHay: 'Questa lettura non esiste ancora.' },
    en: { eyebrow: 'Reading', de: 'Reading from the class', leer: 'Read the text. If you don’t understand an underlined word, tap it.',
          preguntas: 'Questions', pregSub: 'All about the text: go back to it whenever you like. If a question is unclear, press “Translation”.',
          elige: 'Choose', escribe: 'Write it', hecho: 'Done', placeholder: 'Type your answer', comprobar: 'Check',
          trad: 'Translation', escribir: 'Now you write',
          escribirNota: 'It saves by itself, even if you close the page. We’ll go over it together in our next class.',
          sitio: 'Write here in Spanish…', verClase: 'See the class', volver: 'Back to my classes',
          noHay: 'This reading doesn’t exist yet.' }
  }[track];

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const id = new URLSearchParams(location.search).get('clase') || '';
  const lec = window.jnLecturaDe && window.jnLecturaDe(id);
  const clase = window.jnClasePorId && window.jnClasePorId(id);
  if(!lec || !clase){
    cont.innerHTML = '<div class="placeholder-box">' + esc(T.noHay) +
      '<p style="margin:16px 0 0"><a class="button button-secondary" href="mis-clases-' + track + '.html">' +
      esc(T.volver) + '</a></p></div>';
    return;
  }

  const nomClase = (clase.titulo && (clase.titulo[track] || clase.titulo.es)) || clase.id;
  // una clase solo para angloparlantes no tiene página en italiano
  const pistaClase = (clase.pistas && clase.pistas.indexOf(track) < 0) ? clase.pistas[0] : track;
  document.title = lec.titulo + ' · ' + T.eyebrow + ' | Habla Español con José';
  const miga = document.getElementById('lec-miga');
  if(miga) miga.textContent = T.eyebrow + ': ' + lec.titulo;

  // [[palabra|clave]] → la palabra, que al tocarla enseña su traducción. El
  // texto es nuestro (lecturas.js), así que el HTML que trae se respeta.
  function conGlosas(html){
    return html.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function(_, pal, k){
      return lec.glosario[k]
        ? '<button type="button" class="lec-pal" data-g="' + esc(k) + '" aria-expanded="false">' + pal + '</button>'
        : pal;
    });
  }

  // la traducción de una pregunta o de la consigna, escondida tras un botón;
  // en la pista en español no hay nada que traducir
  function trad(txt){
    if(track === 'es' || !txt) return '';
    return '<button type="button" class="lec-trad-btn" aria-expanded="false">' +
      '<i class="ti ti-language" aria-hidden="true"></i> ' + esc(T.trad) + '</button>' +
      '<p class="lec-trad" hidden>' + esc(txt) + '</p>';
  }

  const texto = '<article class="lec-texto" lang="es">' +
    lec.parrafos.map(p => '<p>' + conGlosas(p) + '</p>').join('') + '</article>';

  const preguntas = lec.preguntas.map(function(q, i){
    const exid = 'lec-' + lec.clase + '-' + (i + 1);
    const cab = '<div class="exercise-kicker"><span>' + esc(q.tipo === 'elige' ? T.elige : T.escribe) + '</span>' +
      '<span class="exercise-done-badge"><i class="ti ti-check"></i> ' + esc(T.hecho) + '</span></div>' +
      '<p class="exercise-prompt" lang="es"><b>' + (i + 1) + '.</b> ' + q.p + '</p>' +
      trad(q.trad && q.trad[track]);
    const cuerpo = q.tipo === 'elige'
      ? '<div class="exercise-options">' + q.opciones.map(o =>
          '<button class="option-btn" data-value="' + esc(o) + '" lang="es">' + esc(o) + '</button>').join('') + '</div>'
      : '<div class="exercise-row exercise-row-fill"><input type="text" class="exercise-input" lang="es" ' +
          'autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(T.placeholder) + '">' +
          '<button class="exercise-check">' + esc(T.comprobar) + '</button></div>';
    return '<div class="exercise-block" data-exid="' + esc(exid) + '" data-answer="' + esc(q.ok) + '">' +
      cab + cuerpo + '<p class="exercise-feedback"></p></div>';
  }).join('');

  cont.innerHTML =
    '<h3 class="lec-h" lang="es">' + esc(lec.titulo) + '</h3>' +
    '<p class="subtitle lec-de"><i class="ti ti-book" aria-hidden="true"></i> ' + esc(T.de) + ' <a href="' + esc(clase.pagina + '-' + pistaClase + '.html') + '">' +
      esc(nomClase) + '</a></p>' +
    '<p class="lec-leer">' + esc(T.leer) + '</p>' +
    '<div class="lec-grid">' + texto +
      '<div class="lec-preg"><div class="topic-card"><h4>' +
        '<i class="ti ti-pencil" aria-hidden="true"></i> ' + esc(T.preguntas) + '</h4>' +
        '<p class="subtitle">' + esc(T.pregSub) + '</p>' + preguntas + '</div></div>' +
    '</div>' +
    '<div class="topic-card lec-escribe"><h4><i class="ti ti-notebook" aria-hidden="true"></i> ' + esc(T.escribir) + '</h4>' +
      '<p class="lec-consigna" lang="es">' + lec.escribir.es + '</p>' + trad(lec.escribir[track] && lec.escribir[track].replace(/<[^>]+>/g, '')) +
      '<div class="cl-apu-caja" id="lec-apu"></div>' +
      '<p class="lec-nota">' + esc(T.escribirNota) + '</p></div>' +
    '<p class="lec-pie"><a class="button button-secondary" href="mis-clases-' + track + '.html">' +
      '<i class="ti ti-arrow-left" aria-hidden="true"></i> ' + esc(T.volver) + '</a></p>';

  // ── las palabras del glosario: una burbuja con la traducción ──
  const burbuja = document.createElement('div');
  burbuja.className = 'lec-burbuja';
  burbuja.setAttribute('role', 'status');
  burbuja.hidden = true;
  document.body.appendChild(burbuja);
  let abierta = null;
  function cierra(){
    if(abierta) abierta.setAttribute('aria-expanded', 'false');
    abierta = null;
    burbuja.hidden = true;
  }
  function abre(btn){
    const g = lec.glosario[btn.dataset.g];
    burbuja.innerHTML = '<b lang="es">' + btn.innerHTML + '</b> ' + esc(g[track] || g.es);
    burbuja.hidden = false;
    const r = btn.getBoundingClientRect();
    const ancho = Math.min(300, document.documentElement.clientWidth - 24);
    burbuja.style.maxWidth = ancho + 'px';
    const izq = Math.max(12, Math.min(r.left + scrollX, scrollX + document.documentElement.clientWidth - burbuja.offsetWidth - 12));
    burbuja.style.left = izq + 'px';
    burbuja.style.top = (r.bottom + scrollY + 8) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    abierta = btn;
  }
  document.addEventListener('click', function(e){
    const pal = e.target.closest('.lec-pal');
    if(pal){ if(abierta === pal) cierra(); else { cierra(); abre(pal); } return; }
    if(!e.target.closest('.lec-burbuja')) cierra();
    const tb = e.target.closest('.lec-trad-btn');
    if(tb){
      const p = tb.nextElementSibling;
      p.hidden = !p.hidden;
      tb.setAttribute('aria-expanded', String(!p.hidden));
    }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cierra(); });
  window.addEventListener('resize', cierra);
  const caja = cont.querySelector('.lec-texto');
  caja.addEventListener('scroll', cierra);

  // ── la escritura: el recuadro de los apuntes, que llega con apuntes.js ──
  document.addEventListener('DOMContentLoaded', function(){
    const hueco = document.getElementById('lec-apu');
    if(!hueco || !window.jnApuntesCaja) return;
    window.jnApuntesCaja('lectura-' + lec.clase, hueco);
    const area = hueco.querySelector('textarea');
    if(area){ area.placeholder = T.sitio; area.setAttribute('lang', 'es'); area.spellcheck = false; }
  });
})();
