// Escapa texto antes de insertarlo en HTML (atributos data-* y contenido):
// sin esto, una respuesta u opción con comillas dobles (p. ej. «"buen provecho"»)
// rompe el atributo data-answer/data-value a la mitad y el ejercicio deja de
// poder marcarse como correcto nunca, aunque se elija la opción correcta.
function jnEscapeHtml(s){
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ¿En qué idioma le hablamos a quien está delante?
//
// Hasta ahora, en todos los sitios donde la web le habla al alumno, la regla
// era «jn_track, y si no hay, español». Pero jn_track solo existe cuando ya
// ha elegido recorrido, y un alumno nuevo todavía no ha elegido nada: a uno
// de Reino Unido que entró por primera vez el cartel de acceso —el que dice
// que le mando el enlace— le salió en español.
//
// El orden es: lo que haya elegido él, que manda sobre todo lo demás; si no,
// el idioma de su navegador; si no, el de la página (una -it o una -en lo son
// de verdad); y español como último recurso, que es el idioma de la casa.
//
// OJO: esto es para el texto que le decimos nosotros. NO sirve para decidir
// qué contenido existe ni qué resultados enseña el buscador: ahí «no ha
// elegido» significa «enséñalo todo», y adivinar escondería páginas.
window.jnIdioma = function(){
  const elegido = localStorage.getItem('jn_track');
  if(elegido === 'es' || elegido === 'it' || elegido === 'en') return elegido;
  const delNavegador = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || ''];
  for(let i = 0; i < delNavegador.length; i++){
    const c = String(delNavegador[i]).slice(0, 2).toLowerCase();
    if(c === 'es' || c === 'it' || c === 'en') return c;
  }
  const dePagina = (document.documentElement.getAttribute('lang') || '').slice(0, 2);
  if(dePagina === 'it' || dePagina === 'en') return dePagina;
  return 'es';
};

// Registra una visita (una vez al día por alumno, no en cada página que abra
// el mismo día) para que el profesor pueda ver en el panel quién entra en la
// web pero nunca llega a hacer ejercicios. firebase-sync.js es un módulo y
// se carga después de este script clásico, así que se espera (con límite) a
// que window.jnCloud* aparezca; si Firebase no está disponible, no hace nada.
function jnRegisterVisit(email){
  if(!email) return;
  const start = Date.now();
  (function poll(){
    if(window.jnCloudGetStudentDoc && window.jnCloudSetFields){
      window.jnCloudGetStudentDoc(email).then(cloud => {
        const todayStr = new Date().toISOString().slice(0, 10);
        if(!cloud || cloud.lastVisitDate !== todayStr){
          return window.jnCloudSetFields(email, {
            visitCount: ((cloud && cloud.visitCount) || 0) + 1,
            lastVisitDate: todayStr
          });
        }
      }).catch(() => {});
      return;
    }
    if(Date.now() - start > 6000) return;
    setTimeout(poll, 50);
  })();
}


document.querySelectorAll(".grammar-section").forEach(section=>{
const buttons=section.querySelectorAll(".tab-btn");
buttons.forEach(btn=>{
btn.addEventListener("click",()=>{
buttons.forEach(b=>b.classList.remove("active"));
section.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
btn.classList.add("active");
document.getElementById(btn.dataset.tab).classList.add("active");
});
});
});

// --- Selector de grupo (tiempos simples / compuestos) ---
document.querySelectorAll(".tense-group-toggle").forEach(toggle=>{
const groupBtns = toggle.querySelectorAll(".group-btn");
const section = toggle.closest(".grammar-section") || toggle.parentElement;
groupBtns.forEach(gbtn=>{
gbtn.addEventListener("click",()=>{
groupBtns.forEach(b=>b.classList.remove("active"));
gbtn.classList.add("active");
const group = gbtn.dataset.group;
section.querySelectorAll(".tabs[data-group]").forEach(tabRow=>{
tabRow.style.display = (tabRow.dataset.group === group) ? "" : "none";
});
const firstTab = section.querySelector(`.tabs[data-group="${group}"] .tab-btn`);
if(firstTab) firstTab.click();
});
});
});

// Marca en los paneles del menú la página en la que estás y despliega su
// materia, para que al abrir «Teoría» se vea enseguida dónde estás.
(function(){
const current=location.pathname.split("/").pop()||"index.html";
// los enlaces no tienen href real (son track-link con data-base), así que se
// comparan por patrón base-it.html / base-en.html
// Cloudflare sirve las páginas sin el «.html»: vale con y sin él
const m = current.match(/^(.+)-(it|en|es)(?:\.html)?$/);
if(m){
document.querySelectorAll(".panel-menu a.track-link:not([data-q])").forEach(a=>{
if(a.dataset.base !== m[1]) return;
a.classList.add("current-page");
const g = a.closest(".panel-grupo");
if(g){
g.classList.add("abierto");
g.querySelector(".panel-mat").setAttribute("aria-expanded","true");
}
});
}
// «Práctica»: los tres modos son la misma página (ejercicios-xx.html) con
// ?modo=…; se marca el que está abierto. El hub avisa con «jn-modo» cuando
// se cambia de modo sin salir de la página.
function marcaModo(modo){
document.querySelectorAll(".panel-menu a[data-q]").forEach(a=>{
a.classList.toggle("current-page", !!(m && a.dataset.base === m[1] && modo && a.dataset.q === "modo=" + modo));
});
}
marcaModo(new URLSearchParams(location.search).get("modo"));
document.addEventListener("jn-modo", e => marcaModo(e.detail));
})();

// --- Selector de recorrido (italiano / inglés) para el contenido de verbos ---
(function(){
  const KEY = 'jn_track'; // 'it' o 'en'

  function getTrack(){ return localStorage.getItem(KEY); }
  function setTrack(t){ localStorage.setItem(KEY, t); renderLangButtons(); updateHeroBio(); applyI18n(); }

  function updateHeroBio(){
    const es = document.querySelector('.hero-bio-es');
    const it = document.querySelector('.hero-bio-it');
    const en = document.querySelector('.hero-bio-en');
    const translation = document.querySelector('.hero-bio-translation');
    if(!es) return; // esta página no tiene presentación bilingüe
    const t = getTrack();
    const showTranslated = t === 'it' || t === 'en';
    es.style.display = showTranslated ? 'none' : '';
    if(it) it.style.display = t === 'it' ? '' : 'none';
    if(en) en.style.display = t === 'en' ? '' : 'none';
    if(translation) translation.style.display = showTranslated ? '' : 'none';
  }

  // Motor genérico: cualquier elemento con class="i18n" y data-es/data-it/data-en
  // cambia de texto según el idioma elegido (si no hay idioma elegido, se queda en español).
  // El rótulo que no es texto a la vista: el que sale al pasar el ratón por
  // el interruptor de tema. Va escrito en español en las páginas. (Los de
  // los botones del menú los pone el propio menú, más abajo.)
  const ROTULOS = {
    es: { tema: 'Modo oscuro' },
    it: { tema: 'Modalità scura' },
    en: { tema: 'Dark mode' }
  };

  function applyI18n(){
    const t = getTrack();
    // las páginas comunes (portada, «Sobre mí»…) van en el idioma del alumno:
    // así un lector de pantalla no lee el italiano o el inglés con voz española.
    // Las de cada pista (-it.html, -en.html) ya lo llevan puesto.
    if(!/-(es|it|en)(?:\.html)?$/.test(location.pathname)) document.documentElement.lang = (t === 'it' || t === 'en') ? t : 'es';
    document.querySelectorAll('.i18n').forEach(el=>{
      const val = t === 'it' ? el.dataset.it : t === 'en' ? el.dataset.en : el.dataset.es;
      if(val) el.textContent = val;
    });
    // las banderas dicen el país en el idioma de la página
    document.querySelectorAll('img[data-alt-es]').forEach(el=>{
      el.alt = el.title = el.getAttribute('data-alt-' + t) || el.dataset.altEs;
    });
    const r = ROTULOS[t] || ROTULOS.es;
    const tema = document.querySelector('.theme-switch');
    if(tema) tema.title = r.tema;
  }

  function goTo(base, track, q){
    window.location.href = base + '-' + track + '.html' + (q ? '?' + q : '');
  }

  // La ventana que pregunta el idioma sale justo cuando todavía no se sabe
  // cuál es: antes iba solo en español, y a un alumno inglés que empieza de
  // cero le preguntaba «¿En qué idioma quieres las explicaciones?» en el
  // único que no entiende. Ahora se la decimos en el de su navegador
  // (window.jnIdioma), y cada idioma se llama como se llama a sí mismo.
  const MODAL = {
    es: { h: '¿En qué idioma quieres las explicaciones?',
          p: 'Te lo explico todo en tu idioma; en español queda solo lo que estás aprendiendo. ' +
             'Puedes cambiarlo cuando quieras con los botones de arriba.' },
    it: { h: 'In che lingua vuoi le spiegazioni?',
          p: 'Ti spiego tutto nella tua lingua; in spagnolo resta solo quello che stai imparando. ' +
             'Puoi cambiarla quando vuoi con i pulsanti in alto.' },
    en: { h: 'Which language do you want the explanations in?',
          p: 'I’ll explain everything in your language; only what you’re learning stays in Spanish. ' +
             'You can change it any time with the buttons at the top.' }
  };

  function openModal(onChoose){
    const m = MODAL[window.jnIdioma()] || MODAL.es;
    const overlay = document.createElement('div');
    overlay.className = 'track-modal-overlay';
    overlay.innerHTML = `
      <div class="track-modal">
        <h3>${m.h}</h3>
        <p>${m.p}</p>
        <div class="track-modal-buttons">
          <button data-track="es"><img class="bandera" src="banderas/es.svg" width="21" height="14" alt=""> Español</button>
          <button data-track="it"><img class="bandera" src="banderas/it.svg" width="21" height="14" alt=""> Italiano</button>
          <button data-track="en"><img class="bandera" src="banderas/gb.svg" width="21" height="14" alt=""> English</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=>{
        const t = b.dataset.track;
        setTrack(t);
        document.body.removeChild(overlay);
        onChoose(t);
      });
    });
  }

  // El selector de arriba a la derecha: marca el recorrido activo, y si la página
  // actual tiene versión -it/-en, te lleva directo a la equivalente en el otro idioma.
  function renderLangButtons(){
    const t = getTrack();
    document.querySelectorAll('.lang-track-btn').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.track === t);
    });
    document.querySelectorAll('.track-only').forEach(el=>{
      el.style.display = (!t || el.dataset.trackShow === t) ? '' : 'none';
    });
    document.querySelectorAll('.hide-on-es').forEach(el=>{
      el.style.display = (t === 'es') ? 'none' : '';
    });
    // Bloques largos escritos tres veces, uno por idioma: se enseña el que
    // toca y se esconden los otros dos. Para textos que no caben en un
    // atributo data-es/data-it/data-en, como la política de privacidad.
    // Sin idioma elegido todavía, se queda el español.
    document.querySelectorAll('.idioma-bloque').forEach(el=>{
      el.style.display = (el.dataset.idioma === (t || 'es')) ? '' : 'none';
    });
  }

  // Cuando la página no existe en el idioma que acaba de elegir: se queda
  // donde estaba, con el resto de la web ya en su idioma, y se le explica.
  const IDIOMAS = {
    es: { es: 'español', it: 'italiano', en: 'inglés' },
    it: { es: 'spagnolo', it: 'italiano', en: 'inglese' },
    en: { es: 'Spanish', it: 'Italian', en: 'English' }
  };
  const AVISO = {
    es: function(pide, hay){ return 'Esta página no existe en ' + IDIOMAS.es[pide] +
      '. La tienes en ' + IDIOMAS.es[hay] + ', y el resto de la web ya está en ' +
      IDIOMAS.es[pide] + '.'; },
    it: function(pide, hay){ return 'Questa pagina non esiste in ' + IDIOMAS.it[pide] +
      '. Ce l’hai in ' + IDIOMAS.it[hay] + ', e il resto del sito è già in ' +
      IDIOMAS.it[pide] + '.'; },
    en: function(pide, hay){ return 'This page is not available in ' + IDIOMAS.en[pide] +
      '. You have it in ' + IDIOMAS.en[hay] + ', and the rest of the site is now in ' +
      IDIOMAS.en[pide] + '.'; }
  };

  function avisaFaltaIdioma(pide, hay){
    const zona = document.querySelector('.language-selector');
    if(!zona) return;
    const viejo = document.querySelector('.track-aviso');
    if(viejo) viejo.remove();
    const caja = document.createElement('p');
    caja.className = 'track-aviso';
    caja.setAttribute('role', 'status');
    caja.textContent = (AVISO[pide] || AVISO.es)(pide, hay);
    zona.parentNode.insertBefore(caja, zona.nextSibling);
    setTimeout(function(){ caja.remove(); }, 9000);
  }

  document.addEventListener('click', function(e){
    const trackLink = e.target.closest('.track-link');
    if(trackLink){
      e.preventDefault();
      const base = trackLink.dataset.base;
      const q = trackLink.dataset.q || '';
      const existing = getTrack();
      if(existing){ goTo(base, existing, q); } else { openModal((t)=> goTo(base, t, q)); }
      return;
    }

    const langBtn = e.target.closest('.lang-track-btn');
    if(langBtn){
      const t = langBtn.dataset.track;
      setTrack(t);
      const current = location.pathname.split('/').pop() || '';
      // en Cloudflare la dirección llega sin «.html» (clase-motor-it): antes
      // no cuadraba y el botón cambiaba el idioma pero no la página
      const m = current.match(/^(.+)-(it|en|es)(?:\.html)?$/);
      if(m && m[2] !== t){
        // No todas las páginas existen en los tres idiomas: las clases para
        // angloparlantes solo en inglés, los false friends no en español.
        // Antes se saltaba a ciegas y el alumno acababa en un 404.
        // con «.html» o sin él, como venga la de ahora: así Cloudflare no
        // tiene que redirigir (y el ?clase= de una lectura no se arriesga)
        const destino = m[1] + '-' + t + (/\.html$/.test(current) ? '.html' : '');
        fetch(destino, { method: 'HEAD' })
          .then(function(r){
            // la lectura es una sola página para todas: el ?clase= dice cuál,
            // y sin él la otra pista no sabría qué texto enseñar
            if(r.ok) window.location.href = destino + (m[1] === 'lectura' ? location.search : '');
            else avisaFaltaIdioma(t, m[2]);
          })
          // sin conexión no podemos comprobarlo: se intenta igual, como antes
          .catch(function(){ window.location.href = destino + (m[1] === 'lectura' ? location.search : ''); });
      }
      return;
    }
  });

  renderLangButtons();
  updateHeroBio();
  applyI18n();
})();


// --- Motor de ejercicios (rellenar huecos, opción múltiple, traducción) ---
(function(){
  // El ánimo y la solución van en el idioma del alumno: si estás empezando,
  // "Casi, prueba otra vez (respuesta: fui)" no te dice nada.
  const MSGS = {
    es: {
      ok: ['¡Muy bien!','¡Perfecto!','¡Excelente!','¡Así se hace!','¡Genial, sigue así!','¡Correcto!'],
      ko: ['Casi, prueba otra vez','No es eso, ¡tú puedes!','Sigue intentando','Revísalo con calma'],
      answer: 'respuesta',
      racha0: 'Todavía no has hecho ningún ejercicio.',
      racha1: 'Llevas {n} ejercicio hecho.',
      rachaN: 'Llevas {n} ejercicios hechos.',
      rachaPie: 'Haz unos cuantos más y sube el número. Eliges tema o nivel, o te los mezclo yo.',
      rachaPie0: 'Empieza por unos pocos: el número sube solo con cada uno que aciertes.',
      rachaBtn: 'Más ejercicios'
    },
    it: {
      ok: ['Molto bene!','Perfetto!','Eccellente!','Così si fa!','Ottimo, continua così!','Corretto!'],
      ko: ['Ci sei quasi, riprova','Non è questo, ce la fai!','Continua a provare','Rileggilo con calma'],
      answer: 'risposta',
      racha0: 'Non hai ancora fatto nessun esercizio.',
      racha1: 'Sei a {n} esercizio fatto.',
      rachaN: 'Sei a {n} esercizi fatti.',
      rachaPie: 'Fanne qualcuno in più e alza il numero. Scegli argomento o livello, o te li mescolo io.',
      rachaPie0: 'Comincia con qualcuno: il numero sale da solo a ogni risposta giusta.',
      rachaBtn: 'Altri esercizi'
    },
    en: {
      ok: ['Well done!','Perfect!','Excellent!','That’s the way!','Great, keep going!','Correct!'],
      ko: ['Almost, try again','Not that one, you can do it!','Keep trying','Take another careful look'],
      racha0: 'You haven’t done any exercises yet.',
      racha1: 'You’re on {n} exercise done.',
      rachaN: 'You’re on {n} exercises done.',
      rachaPie: 'Do a few more and push the number up. Pick a topic or a level, or I’ll mix them for you.',
      rachaPie0: 'Start with a handful: the number goes up on its own with every one you get right.',
      rachaBtn: 'More exercises',
      answer: 'answer'
    }
  };
  function msgs(){ return MSGS[window.jnIdioma()] || MSGS.es; }
  // lo usa también el modo curso al reanudar un paso a medias
  window.jnPraise = function(){ return randomOf(msgs().ok); };
  const pageKey = 'ex_done_' + (location.pathname.split('/').pop() || 'home');

  // contador global de ejercicios acertados (motiva en el hub, ver "jn-counter-updated")
  const COUNTER_KEY = 'jn_total_done';
  window.jnGetExerciseCount = function(){
    return parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  };
  window.jnCountExercise = function(){
    const n = window.jnGetExerciseCount() + 1;
    localStorage.setItem(COUNTER_KEY, String(n));
    document.dispatchEvent(new CustomEvent('jn-counter-updated', { detail: { count: n } }));
    const email = localStorage.getItem('jn_student_email');
    if(email && window.jnCloudSetFields) window.jnCloudSetFields(email, { exerciseCount: n }).catch(() => {});
    return n;
  };

  function getDone(){
    try { return JSON.parse(localStorage.getItem(pageKey) || '[]'); } catch(e){ return []; }
  }
  // Devuelve true solo la primera vez que se acierta ESE ejercicio en ESTA
  // página. De eso depende el contador: antes subía en cada acierto, así que
  // pulsar «Comprobar» cuatro veces sobre una respuesta ya buena sumaba
  // cuatro, y recargar y repetir sumaba otra vez. El número que ve José en la
  // ficha del alumno tiene que ser ejercicios hechos, no clics.
  function markDone(id){
    const done = getDone();
    const primera = !done.includes(id);
    if(primera){ done.push(id); localStorage.setItem(pageKey, JSON.stringify(done)); }
    updateProgress();
    return primera;
  }
  function updateProgress(){
    const total = document.querySelectorAll('.exercise-block').length;
    const done = getDone().filter(id => document.querySelector(`.exercise-block[data-exid="${id}"]`)).length;
    const countEl = document.getElementById('ex-progress-count');
    const totalEl = document.getElementById('ex-progress-total');
    if(countEl) countEl.textContent = done;
    if(totalEl) totalEl.textContent = total;
  }
  function randomOf(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // Al fallar NO se enseña la respuesta a la primera: antes bastaba con
  // equivocarse una vez, leer la solución y pulsarla para dar el ejercicio
  // por bueno, así que se podía recorrer un curso entero sin saber nada.
  // Devuelve true si esta vez sí se ha revelado la respuesta.
  function showFeedback(block, ok){
    const fb = block.querySelector('.exercise-feedback');
    if(!fb) return false;
    if(ok){
      fb.textContent = randomOf(msgs().ok);
      fb.className = 'exercise-feedback correct';
      block.classList.add('is-done');
      block.dataset.tries = '0';
      if(markDone(block.dataset.exid)) window.jnCountExercise();
      return false;
    }
    const tries = parseInt(block.dataset.tries || '0', 10) + 1;
    block.dataset.tries = String(tries);
    const reveal = tries >= 2;
    const answer = block.dataset.answer.split('|')[0];
    const m = msgs();
    fb.textContent = randomOf(m.ko) + (reveal ? ' (' + m.answer + ': ' + answer + ')' : '');
    fb.className = 'exercise-feedback incorrect';
    return reveal;
  }

  // ─── Contador de ejercicios, en cualquier página ───
  // El del hub (#ex-global-counter) solo vive dentro del hub. Este funciona
  // allá donde se ponga un <div class="jn-racha" data-ir="ejercicios-XX.html">,
  // y se actualiza en el momento en que el alumno acierta: terminar los
  // ejercicios de una clase y ver el número subir es justo lo que invita a
  // seguir, y el botón de al lado le dice adónde.
  function pintaRacha(){
    const caja = document.querySelector('.jn-racha');
    if(!caja) return;
    const m = msgs();
    if(!m.rachaBtn) return;   // idioma sin textos de contador
    const n = window.jnGetExerciseCount ? window.jnGetExerciseCount() : 0;
    const txt = (n === 0 ? m.racha0 : n === 1 ? m.racha1 : m.rachaN)
      .replace('{n}', '<strong>' + n + '</strong>');
    const ir = caja.dataset.ir || 'ejercicios-es.html';
    caja.innerHTML =
      '<div class="jn-racha-txt"><p class="jn-racha-n">' +
        '<span aria-hidden="true">🔥</span> ' + txt + '</p>' +
        '<p class="jn-racha-pie">' + (n === 0 ? m.rachaPie0 : m.rachaPie) + '</p></div>' +
      '<a class="button button-primary" href="' + ir + '">' + m.rachaBtn +
        ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a>';
  }
  document.addEventListener('jn-counter-updated', pintaRacha);
  pintaRacha();

  // El número de ejercicios acertados vive en el navegador, pero también en
  // la ficha del alumno, para que no empiece de cero al estrenar móvil. Se
  // traía solo dentro del hub, así que en una clase o en «Mis clases» salía
  // el número del dispositivo y no el suyo de verdad. Se queda siempre con
  // el más alto de los dos: así no se le quita nunca nada de lo hecho.
  function traeContadorDeLaNube(){
    const email = localStorage.getItem('jn_student_email');
    if(!email || !window.jnCloudGetStudentDoc) return;
    window.jnCloudGetStudentDoc(email).then(function(cloud){
      if(!cloud || typeof cloud.exerciseCount !== 'number') return;
      if(cloud.exerciseCount > window.jnGetExerciseCount()){
        localStorage.setItem(COUNTER_KEY, String(cloud.exerciseCount));
        document.dispatchEvent(new CustomEvent('jn-counter-updated',
          { detail: { count: cloud.exerciseCount } }));
      }
    }).catch(function(){ /* sin Firebase se sigue con lo del navegador */ });
  }
  (function esperaNube(){
    const desde = Date.now();
    (function poll(){
      if(window.jnCloudGetStudentDoc) return traeContadorDeLaNube();
      if(Date.now() - desde > 8000) return;
      setTimeout(poll, 60);
    })();
  })();
  // y otra vez cuando el alumno acaba de entrar, que entonces ya sabemos quién es
  document.addEventListener('jn-access-granted', traeContadorDeLaNube);

  const ACCENT_APOSTROPHE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  function normalizeAnswer(s){
    return s.trim().toLowerCase()
      .replace(/([aeiou])['’]/g, (_, v) => ACCENT_APOSTROPHE[v])
      .replace(/[¿¡]/g, '').replace(/[.!?]+$/, '').trim();
  }
  // la usa también el examen de nivel (ejercicios.js): una sola regla para
  // decidir si una respuesta escrita es buena
  window.jnNormalizeAnswer = normalizeAnswer;

  function checkTextAnswer(block){
    const input = block.querySelector('.exercise-input');
    if(!input) return;
    const accepted = block.dataset.answer.split('|').map(s => normalizeAnswer(s));
    const val = normalizeAnswer(input.value);
    showFeedback(block, accepted.includes(val));
  }

  function orderAnswerText(block){
    return [...block.querySelectorAll('.order-answer-area .order-word')].map(w => w.dataset.word).join(' ');
  }

  document.addEventListener('click', function(e){
    const checkBtn = e.target.closest('.exercise-check');
    if(checkBtn){
      checkTextAnswer(checkBtn.closest('.exercise-block'));
      return;
    }
    const bankWord = e.target.closest('.order-word-bank .order-word');
    if(bankWord){
      const area = bankWord.closest('.exercise-block').querySelector('.order-answer-area');
      area.appendChild(bankWord);
      return;
    }
    const answerWord = e.target.closest('.order-answer-area .order-word');
    if(answerWord){
      const bank = answerWord.closest('.exercise-block').querySelector('.order-word-bank');
      bank.appendChild(answerWord);
      return;
    }
    const resetBtn = e.target.closest('.order-reset');
    if(resetBtn){
      const block = resetBtn.closest('.exercise-block');
      const bank = block.querySelector('.order-word-bank');
      block.querySelectorAll('.order-answer-area .order-word').forEach(w => bank.appendChild(w));
      block.querySelector('.exercise-feedback').textContent = '';
      block.querySelector('.exercise-feedback').className = 'exercise-feedback';
      return;
    }
    const orderCheckBtn = e.target.closest('.order-check');
    if(orderCheckBtn){
      const block = orderCheckBtn.closest('.exercise-block');
      const built = normalizeAnswer(orderAnswerText(block));
      // la solución puede traer su versión sin tildes detrás de «|», como las
      // de escribir; comparada entera, no la acertaba nadie
      const accepted = block.dataset.answer.split('|').map(s => normalizeAnswer(s));
      showFeedback(block, accepted.includes(built));
      return;
    }
    const matchItem = e.target.closest('.match-item');
    if(matchItem && !matchItem.classList.contains('matched')){
      const block = matchItem.closest('.match-block');
      const selected = block.querySelector('.match-item.selected');
      if(selected === matchItem){
        matchItem.classList.remove('selected');
        return;
      }
      if(!selected){
        matchItem.classList.add('selected');
        return;
      }
      if(selected.closest('.match-col') === matchItem.closest('.match-col')){
        selected.classList.remove('selected');
        matchItem.classList.add('selected');
        return;
      }
      if(selected.dataset.key === matchItem.dataset.key){
        selected.classList.remove('selected');
        selected.classList.add('matched');
        matchItem.classList.add('matched');
        const total = parseInt(block.dataset.pairs, 10);
        const matchedCount = block.querySelectorAll('.match-item.matched').length / 2;
        if(matchedCount >= total) showFeedback(block, true);
      } else {
        selected.classList.add('wrong-flash');
        matchItem.classList.add('wrong-flash');
        setTimeout(() => {
          selected.classList.remove('selected', 'wrong-flash');
          matchItem.classList.remove('wrong-flash');
        }, 500);
      }
      return;
    }
    const optBtn = e.target.closest('.option-btn');
    if(optBtn){
      const block = optBtn.closest('.exercise-block');
      const correct = block.dataset.answer.trim().toLowerCase();
      const chosen = optBtn.dataset.value.trim().toLowerCase();
      // las opciones ya probadas se quedan marcadas: así se ve lo que has
      // descartado en vez de empezar de cero en cada intento
      const ok = chosen === correct;
      optBtn.classList.add(ok ? 'correct' : 'incorrect');
      const reveal = showFeedback(block, ok);
      if(ok || reveal){
        const rightBtn = [...block.querySelectorAll('.option-btn')].find(b => b.dataset.value.trim().toLowerCase() === correct);
        if(rightBtn) rightBtn.classList.add('correct');
      }
    }
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && e.target.classList.contains('exercise-input')){
      checkTextAnswer(e.target.closest('.exercise-block'));
    }
  });

  // marca como completados los que ya se resolvieron en visitas anteriores
  document.addEventListener('DOMContentLoaded', function(){
    const done = getDone();
    done.forEach(id => {
      const block = document.querySelector(`.exercise-block[data-exid="${id}"]`);
      if(block) block.classList.add('is-done');
    });
    updateProgress();
  });
  updateProgress();
})();

// --- Puerta de acceso para alumnos ---
// Se entra con un enlace por correo: el alumno escribe su email, le llega un
// enlace, lo pulsa y vuelve aquí ya dentro. Lo hace todo firebase-sync.js;
// aquí solo está la ventanita y la decisión de dejar pasar o no.
//
// Quién puede entrar es su ficha en Firebase: tiene ficha y no está dado de
// baja. Antes era una hoja de Google, y antes de eso bastaba con escribir un
// email de la lista — ahora hay que poder abrir ese correo.
(function(){
  const ACCESS_GATE_ENABLED = true; // ponlo en false para abrir la web a todos
  const ACCESS_KEY = 'jn_access_granted';
  // El profesor. Se guarda aparte de los alumnos a propósito: esta marca abre
  // la puerta pero no convierte a nadie en alumno. Esto es la ventanita, no
  // la cerradura: quien decide de verdad quién lee qué son las reglas de
  // Firestore, que ya le dejan leerlo todo a él y solo lo suyo a cada alumno.
  const PROFESOR = 'ncjosemaria@gmail.com';

  const PROFE_KEY = 'jn_profe';

  // De quién es la ficha que toca enseñar en «Mis clases» y en los apuntes.
  //
  // A José no se le guarda nunca jn_student_email: es a propósito, para que
  // sus visitas y los ejercicios que hace probando no se sumen a ninguna
  // ficha. Pero eso dejaba su propia página de clases vacía —se asignaba
  // clases para probar y no las veía—, así que aquí se dice que la suya es
  // la suya. El contador y las visitas siguen leyendo jn_student_email a
  // pelo, o sea que lo que él haga probando sigue sin contar.
  window.jnEmailFicha = function(){
    const e = localStorage.getItem('jn_student_email');
    if(e) return e;
    return localStorage.getItem(PROFE_KEY) === 'true' ? PROFESOR : '';
  };

  if(!ACCESS_GATE_ENABLED) return;

  // Los textos, en las tres pistas. La puerta sale antes que nada, así que no
  // puede depender del sistema de i18n del resto de la web.
  const T = {
    es: { titulo:'Acceso para alumnos', ph:'tu@email.com',
          pide:'Escribe el email con el que reservas tus clases. Te mando un enlace para entrar.',
          boton:'Mandarme el enlace', mandando:'Mandando...',
          vacio:'Escribe tu email.',
          mirado:'Mira tu correo',
          enviado:'Te he mandado un enlace a <b>%s</b>. Ábrelo y entras directamente, sin contraseñas. Si no lo ves, mira en spam.',
          otro:'Usar otro email',
          fuera:'Ese email no está en la lista. Escribe a José si crees que es un error.',
          nocomp:'No se ha podido comprobar el acceso. Revisa tu conexión y vuelve a intentarlo.',
          nomanda:'No se ha podido mandar el enlace. Inténtalo de nuevo en un momento.',
          caduco:'Ese enlace ya no vale (se usan una sola vez y caducan). Pide uno nuevo.',
          confirma:'Confirma tu email',
          confirmap:'Has abierto el enlace en otro navegador, así que no sé de quién es. Escribe el mismo email al que te lo mandé y entras.',
          confirmab:'Entrar',
          nocuadra:'Ese no es el email al que mandé este enlace. Escribe el mismo, o pide uno nuevo.',
          enotro:'Si puedes, ábrelo en este mismo navegador: si lo abres en otro te pediré el email otra vez.',
          app:'Estás usando la web desde la pantalla de inicio. No pulses el enlace del correo, porque se abriría en el navegador: mantén el dedo sobre él, elige «Copiar» y vuelve aquí.',
          pega:'Pegar el enlace', pegaph:'Pega aquí el enlace', entrando:'Entrando...',
          nopega:'No encuentro el enlace en lo que has copiado. Vuelve al correo, mantén el dedo sobre el enlace y elige «Copiar».' },
    it: { titulo:'Accesso per studenti', ph:'tua@email.com',
          pide:'Scrivi l’email con cui prenoti le lezioni. Ti mando un link per entrare.',
          boton:'Mandami il link', mandando:'Invio...',
          vacio:'Scrivi la tua email.',
          mirado:'Guarda la tua posta',
          enviado:'Ti ho mandato un link a <b>%s</b>. Aprilo ed entri direttamente, senza password. Se non lo vedi, guarda nello spam.',
          otro:'Usare un’altra email',
          fuera:'Questa email non è in lista. Scrivi a José se pensi che sia un errore.',
          nocomp:'Non si è potuto verificare l’accesso. Controlla la connessione e riprova.',
          nomanda:'Non si è potuto mandare il link. Riprova tra un momento.',
          caduco:'Quel link non vale più (si usano una volta sola e scadono). Chiedine uno nuovo.',
          confirma:'Conferma la tua email',
          confirmap:'Hai aperto il link in un altro browser, quindi non so di chi è. Scrivi la stessa email a cui te l’ho mandato ed entri.',
          confirmab:'Entra',
          nocuadra:'Non è l’email a cui ho mandato questo link. Scrivi la stessa, o chiedine uno nuovo.',
          enotro:'Se puoi, aprilo in questo stesso browser: se lo apri in un altro ti richiederò l’email.',
          app:'Stai usando il sito dalla schermata Home. Non toccare il link nella mail, perché si aprirebbe nel browser: tieni il dito premuto sopra, scegli «Copia» e torna qui.',
          pega:'Incolla il link', pegaph:'Incolla qui il link', entrando:'Entro...',
          nopega:'Non trovo il link in quello che hai copiato. Torna alla mail, tieni il dito premuto sul link e scegli «Copia».' },
    en: { titulo:'Student access', ph:'you@email.com',
          pide:'Enter the email you book your lessons with. I’ll send you a link to get in.',
          boton:'Send me the link', mandando:'Sending...',
          vacio:'Enter your email.',
          mirado:'Check your inbox',
          enviado:'I’ve sent a link to <b>%s</b>. Open it and you’re straight in, no password. If you can’t see it, check your spam.',
          otro:'Use a different email',
          fuera:'That email isn’t on the list. Write to José if you think this is a mistake.',
          nocomp:'Couldn’t check your access. Check your connection and try again.',
          nomanda:'Couldn’t send the link. Try again in a moment.',
          caduco:'That link no longer works (they’re single-use and they expire). Ask for a new one.',
          confirma:'Confirm your email',
          confirmap:'You opened the link in a different browser, so I don’t know whose it is. Enter the same email I sent it to and you’re in.',
          confirmab:'Come in',
          nocuadra:'That isn’t the email I sent this link to. Enter the same one, or ask for a new link.',
          enotro:'If you can, open it in this same browser: if you open it elsewhere I’ll ask for your email again.',
          app:'You’re using the site from your Home Screen. Don’t tap the link in the email, as it would open in the browser: press and hold it, choose “Copy” and come back here.',
          pega:'Paste the link', pegaph:'Paste the link here', entrando:'Signing in...',
          nopega:'I can’t find the link in what you copied. Go back to the email, press and hold the link and choose “Copy”.' }
  };
  let t = T[window.jnIdioma()] || T.es;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
  }

  // firebase-sync.js es un módulo y se carga después de este script clásico.
  function esperaNube(ms){
    const desde = Date.now();
    return new Promise(function(ok, mal){
      (function poll(){
        if(window.jnCloudReady && window.jnCloudEnviaEnlace) return ok();
        if(Date.now() - desde > ms) return mal(new Error('Firebase no disponible'));
        setTimeout(poll, 50);
      })();
    });
  }

  // ───────────────── la ventanita ─────────────────
  let overlay = null, input = null, btn = null, errorEl = null, cuerpo = null;

  function abrePuerta(aviso){
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'access-gate-overlay';
      overlay.innerHTML =
        '<img class="access-gate-logo" src="logo-apilado.svg" width="181" height="140" alt="Habla español con José">' +
        '<div class="access-gate-modal" role="dialog" aria-modal="true">' +
          '<img class="access-gate-foto" src="profile.jpg" width="340" height="340" alt="José">' +
          '<div class="access-gate-body"></div>' +
        '</div>';
      document.body.appendChild(overlay);
      cuerpo = overlay.querySelector('.access-gate-body');
    }
    pidePaso(aviso);
  }

  function cierraPuerta(){
    if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function pidePaso(aviso){
    cuerpo.innerHTML =
      '<h3>' + esc(t.titulo) + '</h3>' +
      '<p>' + esc(t.pide) + '</p>' +
      '<input type="email" class="access-gate-input" placeholder="' + esc(t.ph) + '" autocomplete="email">' +
      '<button class="access-gate-btn">' + esc(t.boton) + '</button>' +
      '<p class="access-gate-error"></p>' +
      '<div class="access-gate-idiomas">' +
        [['es','es','Español'],['it','it','Italiano'],['en','gb','English']].map(function(l){
          return '<button type="button" data-idioma="' + l[0] + '"' +
            (T[l[0]] === t ? ' class="activo" aria-pressed="true"' : ' aria-pressed="false"') +
            '><img class="bandera" src="banderas/' + l[1] + '.svg" width="21" height="14" alt=""> ' + l[2] + '</button>';
        }).join('') +
      '</div>';
    input = cuerpo.querySelector('.access-gate-input');
    btn = cuerpo.querySelector('.access-gate-btn');
    errorEl = cuerpo.querySelector('.access-gate-error');
    if(aviso) errorEl.textContent = aviso;
    // Quien llega por primera vez elige aquí su idioma: la puerta cambia en
    // el sitio y la web queda ya en su pista (lo mismo que los botones de
    // arriba, que hacen el resto: textos de la página y versión -it/-en).
    cuerpo.querySelectorAll('[data-idioma]').forEach(function(b){
      b.addEventListener('click', function(){
        const l = b.dataset.idioma;
        const escrito = input.value;
        t = T[l];
        const arriba = document.querySelector('.lang-track-btn[data-track="' + l + '"]');
        if(arriba) arriba.click(); else localStorage.setItem('jn_track', l);
        pidePaso(''); // un aviso que hubiera estaba en el otro idioma
        input.value = escrito;
      });
    });
    btn.addEventListener('click', manda);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') manda(); });
    input.focus();
  }

  // ¿La web está abierta desde el icono de la pantalla de inicio?
  function desdeIcono(){
    try {
      return window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
    } catch(e){ return false; }
  }

  function esperaPaso(email){
    if(desdeIcono()) return esperaPasoIcono(email);
    cuerpo.innerHTML =
      '<h3>' + esc(t.mirado) + '</h3>' +
      '<p>' + t.enviado.replace('%s', esc(email)) + '</p>' +
      '<p style="font-size:13.5px">' + esc(t.enotro) + '</p>' +
      '<button class="access-gate-btn access-gate-otro">' + esc(t.otro) + '</button>';
    cuerpo.querySelector('.access-gate-otro').addEventListener('click', () => pidePaso(''));
  }

  // Desde el icono, el enlace del correo nunca vuelve aquí (se abre en el
  // navegador), así que se copia y se pega. El botón lee lo copiado; si el
  // teléfono no le deja, aparece una casilla para pegarlo a mano.
  function esperaPasoIcono(email){
    cuerpo.innerHTML =
      '<h3>' + esc(t.mirado) + '</h3>' +
      '<p>' + t.enviado.replace('%s', esc(email)) + '</p>' +
      '<p class="access-gate-app">' + esc(t.app) + '</p>' +
      '<button class="access-gate-btn access-gate-pega">' + esc(t.pega) + '</button>' +
      '<input type="url" class="access-gate-input access-gate-pegado" placeholder="' + esc(t.pegaph) + '" hidden>' +
      '<p class="access-gate-error"></p>' +
      '<button class="access-gate-btn access-gate-otro">' + esc(t.otro) + '</button>';
    const pega = cuerpo.querySelector('.access-gate-pega');
    const casilla = cuerpo.querySelector('.access-gate-pegado');
    const error = cuerpo.querySelector('.access-gate-error');
    cuerpo.querySelector('.access-gate-otro').addEventListener('click', () => pidePaso(''));

    function usa(texto){
      if(!texto || pega.disabled) return;
      error.textContent = '';
      pega.disabled = true;
      pega.textContent = t.entrando;
      window.jnCloudEntraConPegado(texto).then(function(quien){
        return compruebaFicha(quien);
      }, function(err){
        const codigo = err && err.code;
        if(codigo === 'jn/falta-email'){ confirmaPaso(''); return; }
        pega.disabled = false;
        pega.textContent = t.pega;
        const sinRed = !codigo && /timeout/.test(String(err && err.message));
        if(codigo === 'jn/sin-enlace'){
          error.textContent = t.nopega;
          casilla.value = '';
          return;
        }
        // enlace gastado o caducado: hay que pedir otro
        pidePaso(sinRed ? t.nocomp : t.caduco);
      });
    }
    function aMano(){
      casilla.hidden = false;
      casilla.focus();
    }
    pega.addEventListener('click', function(){
      const portapapeles = navigator.clipboard && navigator.clipboard.readText;
      if(!portapapeles){ aMano(); return; }
      navigator.clipboard.readText().then(function(texto){
        if(texto) usa(texto); else { error.textContent = t.nopega; aMano(); }
      }, aMano);
    });
    casilla.addEventListener('input', function(){ usa(casilla.value); });
  }

  // Cuando el enlace se abre en un navegador distinto del que lo pidió, hay
  // que confirmar de quién es. Antes lo preguntaba window.prompt: una
  // ventanita sin estilo, siempre en español y que parece de una web
  // sospechosa justo en el momento de entrar.
  function confirmaPaso(aviso){
    cuerpo.innerHTML =
      '<h3>' + esc(t.confirma) + '</h3>' +
      '<p>' + esc(t.confirmap) + '</p>' +
      '<input type="email" class="access-gate-input" placeholder="' + esc(t.ph) + '" autocomplete="email">' +
      '<button class="access-gate-btn">' + esc(t.confirmab) + '</button>' +
      '<p class="access-gate-error"></p>';
    input = cuerpo.querySelector('.access-gate-input');
    btn = cuerpo.querySelector('.access-gate-btn');
    errorEl = cuerpo.querySelector('.access-gate-error');
    if(aviso) errorEl.textContent = aviso;
    function completa(){
      const email = (input.value || '').trim().toLowerCase();
      if(!email || email.indexOf('@') < 0){ errorEl.textContent = t.vacio; return; }
      btn.disabled = true;
      window.jnCloudEntraConEnlace(email).then(function(){
        return compruebaFicha(email);
      }, function(err){
        // Hay que pedir otro enlace en los dos casos, pero diciendo la verdad:
        // «no es ese email» solo si Firebase dice que el email no cuadra. Un
        // enlace viejo —ya usado o caducado— falla con cualquier email, y
        // decirle que se ha equivocado de dirección le hacía dudar de la suya.
        const noCuadra = err && err.code === 'auth/invalid-email';
        // y si lo que ha pasado es que Firebase no ha contestado, tampoco es
        // culpa del enlace
        const sinRed = err && !err.code && /timeout/.test(String(err.message));
        pidePaso(noCuadra ? t.nocuadra : sinRed ? t.nocomp : t.caduco);
      });
    }
    btn.addEventListener('click', completa);
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter') completa(); });
    input.focus();
  }

  function manda(){
    const email = (input.value || '').trim().toLowerCase();
    if(!email || email.indexOf('@') < 0){ errorEl.textContent = t.vacio; return; }
    btn.disabled = true;
    btn.textContent = t.mandando;
    window.jnCloudEnviaEnlace(email).then(function(){
      esperaPaso(email);
    }, function(){
      errorEl.textContent = t.nomanda;
      btn.disabled = false;
      btn.textContent = t.boton;
    });
  }

  // ───────────────── dejar pasar o no ─────────────────
  function dentro(email){
    localStorage.setItem(ACCESS_KEY, 'true');
    localStorage.setItem('jn_student_email', email);
    cierraPuerta();
    jnRegisterVisit(email);
    document.dispatchEvent(new CustomEvent('jn-access-granted'));
  }

  function fuera(aviso){
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem('jn_student_email');
    localStorage.removeItem(PROFE_KEY);
    abrePuerta(aviso);
  }

  function compruebaFicha(email){
    // El profesor entra en las páginas de clase sin tener ficha de alumno:
    // son suyas, y desde el panel abre la clase de cada alumno para verla.
    // Se le abre la puerta pero NO se le apunta como alumno: ni visita, ni
    // jn_student_email, porque si no aparecería en su propia lista y sus
    // ejercicios de prueba se sumarían a una ficha fantasma.
    if(email === PROFESOR){
      localStorage.setItem(PROFE_KEY, 'true');
      cierraPuerta();
      return Promise.resolve();
    }
    // Quién entra no es lo mismo que quién está de alta. Un alumno de baja
    // puede seguir viendo la web si José lo deja así —para acabar lo que
    // tenía a medias— y uno de alta puede quedarse fuera un tiempo. El campo
    // «acceso» manda; si no está puesto, se sigue mirando «activo», que es
    // como se portaba antes y así ninguna ficha vieja cambia sola.
    return window.jnCloudGetStudentDoc(email).then(function(ficha){
      const entra = ficha && (typeof ficha.acceso === 'boolean'
        ? ficha.acceso : ficha.activo !== false);
      if(entra){ dentro(email); return; }
      // ha entrado con un email que no es de alumno, o está de baja
      return window.jnCloudSal().then(function(){ fuera(t.fuera); });
    });
  }

  // La pista de la última vez: si este navegador ya entró, la página se ve
  // enseguida y la comprobación va por detrás. Si no, la puerta sale cerrada
  // desde el principio. Así no parpadea ni se enseña el contenido a quien no
  // debe verlo.
  const pista = localStorage.getItem(PROFE_KEY) === 'true' ||
    (localStorage.getItem(ACCESS_KEY) === 'true' && localStorage.getItem('jn_student_email'));
  if(!pista) abrePuerta('');

  esperaNube(10000)
    .then(function(){ return window.jnCloudReady; })
    .then(function(email){
      if(window.jnCloudFalloEnlace && !email){
        fuera(t.caduco);
        return;
      }
      if(window.jnCloudPideEmail){
        // hay enlace del correo, pero abierto en otro navegador
        abrePuerta('');
        confirmaPaso('');
        return;
      }
      if(!email){
        // no ha entrado nadie: la puerta, sin tratarlo como un error
        if(pista) fuera('');
        // Desde el icono, ir al correo a copiar el enlace puede hacer que el
        // iPhone cierre la web; al volver, se sigue donde estaba (pegar el
        // enlace) en vez de pedir el email otra vez.
        const pedido = window.jnCloudPendiente && window.jnCloudPendiente();
        if(pedido && desdeIcono() && overlay) esperaPaso(pedido);
        return;
      }
      return compruebaFicha(email);
    })
    .catch(function(){
      // No se ha podido preguntar: sin red, Firebase bloqueado... Al que ya
      // estaba dentro NO se le echa; al que llega de nuevas se le dice que no
      // se sabe, en vez de dejarle pasar.
      if(!pista) abrePuerta(t.nocomp);
    });
})();

// --- El hub de ejercicios vive en ejercicios.js ---
// Lo cargan solo las tres páginas del hub, con su propia etiqueta <script>
// detrás de este archivo.
//
// Red de seguridad: si la página del hub que tiene el navegador es de antes
// de ese cambio —guardada en caché, o una pestaña que llevaba abierta— trae
// los ejercicios pero no la etiqueta, y con este script.js nuevo el hub se
// quedaría sin arrancar. Se mira al terminar de leer la página, cuando una
// etiqueta que existiera ya se habría ejecutado, y solo si falta se carga.
(function(){
  if(!window.EXERCISE_HUB_CONFIG) return;   // no es el hub
  document.addEventListener('DOMContentLoaded', function(){
    if(window.jnHubCargado) return;
    const s = document.createElement('script');
    s.src = 'ejercicios.js';
    document.body.appendChild(s);
  });
})();

// --- Modo oscuro ---
(function(){
  const checkbox = document.getElementById('theme-toggle');
  if(!checkbox) return;

  function apply(theme){
    if(theme === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
      checkbox.checked = true;
    } else {
      document.documentElement.removeAttribute('data-theme');
      checkbox.checked = false;
    }
  }

  apply(localStorage.getItem('jn_theme') === 'dark' ? 'dark' : 'light');

  checkbox.addEventListener('change', function(){
    const next = checkbox.checked ? 'dark' : 'light';
    localStorage.setItem('jn_theme', next);
    apply(next);
  });
})();

// --- Motor de audio (lee texto en español en voz alta, usando el navegador) ---
(function(){
  let voice = null;
  function pickVoice(){
    const voices = speechSynthesis.getVoices();
    const esVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));
    // prioriza voces de red (Google/Microsoft), que suenan mucho más naturales que las locales del sistema
    voice = esVoices.find(v => v.lang === 'es-ES' && /Google|Microsoft/i.test(v.name))
         || esVoices.find(v => /Google|Microsoft/i.test(v.name))
         || esVoices.find(v => v.lang === 'es-ES')
         || esVoices[0]
         || null;
  }
  if('speechSynthesis' in window){
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  window.jnSpeak = function(text, btn){
    if(!('speechSynthesis' in window)){
      if(btn) btn.title = 'Tu navegador no soporta la lectura en voz alta';
      return;
    }
    speechSynthesis.cancel(); // corta cualquier lectura anterior antes de empezar una nueva
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    if(voice) utter.voice = voice;
    utter.rate = 0.95;
    if(btn){
      btn.classList.add('is-speaking');
      utter.onend = () => btn.classList.remove('is-speaking');
      utter.onerror = () => btn.classList.remove('is-speaking');
    }
    speechSynthesis.speak(utter);
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.speak-btn');
    if(!btn) return;
    const text = btn.dataset.text || btn.closest('[data-speak-text]')?.dataset.speakText;
    if(text) window.jnSpeak(text, btn);
  });
})();

// --- Título escrito a mano por sección (traducido según el idioma activo) ---
// Da la sensación de cuaderno escrito a mano. Se quitó con el estilo sobrio
// y José lo echó de menos: vuelve (noviembre 2026). Es además el camino de
// vuelta a la portada de la sección: en el ordenador ya no hay ruta arriba
// («Inicio / Verbos / …»), que repetía lo mismo que este título.
(function(){
  const header = document.querySelector('.page-header');
  const cat = document.body.dataset.category;
  if(!header || !cat) return;
  const labels = {
    verbos: {es:'Verbos', it:'Verbi', en:'Verbs'},
    gramatica: {es:'Gramática', it:'Grammatica', en:'Grammar'},
    vocabulario: {es:'Vocabulario', it:'Vocabolario', en:'Vocabulary'},
    expresiones: {es:'Expresiones', it:'Espressioni', en:'Expressions'},
    atencion: {es:'Especial atención', it:'Attenzione a questi', en:'Watch out for this'},
    profesional: {es:'Español profesional', it:'Spagnolo al lavoro', en:'Business Spanish'},
    clases: {es:'Mis clases', it:'Le mie lezioni', en:'My classes'},
    ejercicios: {es:'Práctica', it:'Pratica', en:'Practice'}
  };
  // adónde lleva: la primera página de cada sección, la misma que en la portada
  const portada = {
    verbos: 'tiempos-verbales', gramatica: 'articulos', vocabulario: 'vocabulario',
    expresiones: 'expresiones-comunes', profesional: 'profesional',
    clases: 'mis-clases', ejercicios: 'ejercicios'
  };
  const l = labels[cat];
  if(!l) return;
  const track = window.jnIdioma();
  const span = document.createElement(portada[cat] ? 'a' : 'span');
  if(portada[cat]){
    // .track-link: el enlace se rehace solo al cambiar de idioma
    span.href = portada[cat] + '-' + track + '.html';
    span.dataset.base = portada[cat];
  }
  span.className = 'handwritten-title i18n' + (portada[cat] ? ' track-link' : '');
  span.dataset.es = l.es; span.dataset.it = l.it; span.dataset.en = l.en;
  span.textContent = l[track] || l.es;
  header.insertBefore(span, header.firstChild);
})();

// --- El menú: una columna con tres botones y los paneles de Práctica y Teoría ---
// «Mis clases» lleva directo. «Práctica» y «Teoría» abren su panel, que sale
// flotando y se cierra al elegir o al pulsar fuera. La chincheta lo deja fijo
// al lado y la página se aparta; eso se recuerda (jn_menu_fijo) y lo vuelve a
// poner, antes de pintar, el script corto que va al principio de cada página.
// En el móvil la columna es una barra abajo, el panel una hoja que sube, y el
// idioma y el modo oscuro van en una cajita que abre un botón de arriba.
(function(){
  const menu = document.querySelector('aside.menu');
  if(!menu) return;
  const body = document.body;
  const movil = window.matchMedia('(max-width:900px)');
  const KEY = 'jn_menu_fijo';
  const SECCIONES = ['ejer', 'teoria'];
  const botones = [...menu.querySelectorAll('button.riel-btn[data-sec]')];
  const chinchetas = [...menu.querySelectorAll('.panel-fijar')];
  const ajustes = menu.querySelector('.ajustes-movil');

  function leeFijo(){
    try { const f = localStorage.getItem(KEY); return SECCIONES.indexOf(f) >= 0 ? f : ''; }
    catch(e){ return ''; }
  }
  function guardaFijo(v){
    try { if(v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch(e){}
  }
  const TXT = {
    es: { fijar: 'Dejar el menú fijo', soltar: 'Quitar el menú fijo', ajustes: 'Idioma y modo oscuro' },
    it: { fijar: 'Tieni fisso il menù', soltar: 'Togli il menù fisso', ajustes: 'Lingua e modalità scura' },
    en: { fijar: 'Keep the menu open', soltar: 'Unpin the menu', ajustes: 'Language and dark mode' }
  };
  function txt(){
    let t = null;
    try { t = localStorage.getItem('jn_track'); } catch(e){}
    return TXT[t] || TXT.es;
  }
  function fijo(){ return body.classList.contains('menu-fijo'); }
  function abierto(){ return body.getAttribute('data-panel') || ''; }
  function rotula(){
    const r = fijo() ? txt().soltar : txt().fijar;
    chinchetas.forEach(b => {
      b.setAttribute('aria-label', r);
      b.title = r;
      b.setAttribute('aria-pressed', fijo() ? 'true' : 'false');
    });
    if(ajustes) ajustes.setAttribute('aria-label', txt().ajustes);
  }
  function pon(sec, quedaFijo){
    if(sec) body.setAttribute('data-panel', sec); else body.removeAttribute('data-panel');
    body.classList.toggle('menu-fijo', !!sec && !!quedaFijo && !movil.matches);
    botones.forEach(b => b.setAttribute('aria-expanded', b.dataset.sec === sec ? 'true' : 'false'));
    rotula();
  }

  botones.forEach(b => b.addEventListener('click', () => {
    const sec = b.dataset.sec;
    const eraFijo = fijo();
    if(abierto() === sec){
      // pulsar otra vez el botón de su panel lo cierra (y, si estaba fijo, lo suelta)
      pon('', false);
      if(eraFijo) guardaFijo('');
      return;
    }
    pon(sec, eraFijo);
    if(eraFijo) guardaFijo(sec);
  }));
  chinchetas.forEach(b => b.addEventListener('click', () => {
    if(fijo()){ guardaFijo(''); pon('', false); }
    else { guardaFijo(abierto()); pon(abierto(), true); }
  }));
  // las materias de la teoría se despliegan y se pliegan
  menu.querySelectorAll('.panel-grupo > .panel-mat').forEach(b => b.addEventListener('click', () => {
    const g = b.parentElement;
    const si = !g.classList.contains('abierto');
    g.classList.toggle('abierto', si);
    b.setAttribute('aria-expanded', si ? 'true' : 'false');
  }));
  // pulsar fuera del panel lo cierra, salvo que esté fijo
  document.addEventListener('click', e => {
    if(abierto() && !fijo() && !e.target.closest('.panel-menu, .riel-btn')) pon('', false);
    if(body.classList.contains('ajustes-abierto') && !e.target.closest('.ajustes-pop, .ajustes-movil')) abreAjustes(false);
  });
  document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    if(abierto() && !fijo()) pon('', false);
    abreAjustes(false);
  });
  // al cambiar de idioma sin recargar, los rótulos también
  document.addEventListener('click', e => { if(e.target.closest('.lang-track-btn')) setTimeout(rotula, 0); });

  // la sección de la página, marcada en la columna
  const cat = body.dataset.category;
  const suya = !cat ? '' : cat === 'clases' ? 'clases' : cat === 'ejercicios' ? 'ejer' : 'teoria';
  menu.querySelectorAll('.riel-btn').forEach(b => b.classList.toggle('actual', b.dataset.sec === suya));

  // el idioma y el modo oscuro: arriba a la derecha en el ordenador; en el
  // móvil, en la cajita del botón de arriba (ocupaban una franja entera)
  const pop = document.createElement('div');
  pop.className = 'ajustes-pop';
  const barra = menu.querySelector('.menu-movil');
  if(barra) barra.appendChild(pop);
  const selector = document.querySelector('.page-header .language-selector');
  const casa = selector && selector.parentNode;
  const sitio = selector && selector.nextSibling;
  function colocaIdioma(){
    if(!selector) return;
    if(movil.matches){ if(selector.parentNode !== pop) pop.appendChild(selector); }
    else if(selector.parentNode !== casa) casa.insertBefore(selector, sitio);
  }
  function abreAjustes(si){
    body.classList.toggle('ajustes-abierto', !!si);
    if(ajustes) ajustes.setAttribute('aria-expanded', si ? 'true' : 'false');
  }
  if(ajustes) ajustes.addEventListener('click', () => abreAjustes(!body.classList.contains('ajustes-abierto')));
  if(!selector && ajustes) ajustes.hidden = true;

  // al empezar: el panel fijo que dejó el alumno (solo en el ordenador)
  function empieza(){
    const f = leeFijo();
    if(f && !movil.matches) pon(f, true); else pon('', false);
    colocaIdioma();
    abreAjustes(false);
  }
  empieza();
  movil.addEventListener('change', empieza);
})();

// --- Carrusel de reseñas (portada) ---
(function(){
  const track = document.getElementById('reviews-track');
  if(!track) return;
  const cards = [...track.children];
  const dotsWrap = document.getElementById('reviews-dots');
  const prevBtn = document.querySelector('.reviews-prev');
  const nextBtn = document.querySelector('.reviews-next');
  // Dos reseñas por página en pantalla ancha y una en el móvil (lo decide el
  // CSS, a 760px). Antes iba siempre de dos en dos, y en el móvil, con una
  // por pantalla, la mitad de las reseñas no salía nunca.
  const estrecho = window.matchMedia('(max-width:760px)');
  let perPage, pages, dots, index = 0;

  function monta(){
    const primera = cards[index * (perPage || 1)];
    perPage = estrecho.matches ? 1 : 2;
    pages = Math.ceil(cards.length / perPage);
    index = Math.floor(cards.indexOf(primera) / perPage) || 0;
    dotsWrap.innerHTML = Array.from({length: pages}, (_, i) => `<button class="dot-btn" data-i="${i}"></button>`).join('');
    dots = [...dotsWrap.children];
    dots.forEach(d => d.addEventListener('click', () => { index = parseInt(d.dataset.i); update(); }));
    update();
  }
  function update(){
    // se mueve hasta la primera tarjeta de la página: así cuenta también el hueco entre tarjetas
    track.style.transform = `translateX(-${(cards[index * perPage].offsetLeft - cards[0].offsetLeft)}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function go(delta){
    index = (index + delta + pages) % pages;
    update();
  }
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  estrecho.addEventListener('change', monta);
  window.addEventListener('resize', update);
  monta();
})();

// --- Buscador del menú lateral (busca en el texto real de cada página) ---
// Antes era un campo grande arriba del menú y se llevaba toda la atención.
// Ahora es una lupa: en el ordenador, abajo a la izquierda del menú, y al
// pulsarla se estira para escribir; en el móvil, junto al botón del menú,
// y abre una ventana en el centro. Cada resultado dice de qué sección es.
(function(){
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  if(!input || !results) return;
  const caja = input.closest('.sidebar-search');
  const movil = window.matchMedia('(max-width:900px)');

  const lupa = document.createElement('button');
  lupa.type = 'button';
  lupa.className = 'lupa-btn';
  lupa.innerHTML = '<i class="ti ti-search" aria-hidden="true"></i>';
  caja.insertBefore(lupa, caja.firstChild);
  // la del móvil va en la barra de arriba, al lado del botón del menú
  const lupaMovil = lupa.cloneNode(true);
  lupaMovil.className = 'lupa-movil';
  document.body.appendChild(lupaMovil);
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'lupa-cerrar';
  cerrar.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
  caja.appendChild(cerrar);

  function abre(){
    caja.classList.add('abierta');
    document.body.classList.toggle('busca-abierta', movil.matches);
    input.focus();
  }
  function cierra(){
    caja.classList.remove('abierta');
    document.body.classList.remove('busca-abierta');
    results.classList.remove('active');
    input.value = '';
    results.innerHTML = '';
  }
  lupa.addEventListener('click', function(){ caja.classList.contains('abierta') ? cierra() : abre(); });
  lupaMovil.addEventListener('click', abre);
  cerrar.addEventListener('click', cierra);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && caja.classList.contains('abierta')) cierra();
  });
  // en el móvil, tocar el velo de detrás también cierra
  caja.addEventListener('click', function(e){ if(e.target === caja && movil.matches) cierra(); });
  movil.addEventListener('change', cierra);

  // Lo que el buscador le dice al alumno, en su idioma. Sigue la misma regla
  // que el resto del menú: el recorrido elegido y, si no hay, español.
  const TXT = {
    es: { buscar: 'Buscar...', nada: 'Sin resultados para', lupa: 'Buscar', cerrar: 'Cerrar',
          teoria: 'Teoría', ejercicios: 'Ejercicios', clase: 'Clase' },
    it: { buscar: 'Cerca...', nada: 'Nessun risultato per', lupa: 'Cerca', cerrar: 'Chiudi',
          teoria: 'Teoria', ejercicios: 'Esercizi', clase: 'Lezione' },
    en: { buscar: 'Search...', nada: 'No results for', lupa: 'Search', cerrar: 'Close',
          teoria: 'Theory', ejercicios: 'Exercises', clase: 'Class' }
  };
  function txt(){ return TXT[localStorage.getItem('jn_track')] || TXT.es; }
  function rotula(){
    input.placeholder = txt().buscar;
    input.setAttribute('aria-label', txt().buscar);
    lupa.setAttribute('aria-label', txt().lupa);
    lupaMovil.setAttribute('aria-label', txt().lupa);
    cerrar.setAttribute('aria-label', txt().cerrar);
  }
  rotula();
  // al cambiar de idioma con los botones de arriba, sin recargar la página
  document.addEventListener('click', function(e){
    if(e.target.closest('.lang-track-btn')) setTimeout(rotula, 0);
  });

  function normalize(s){
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  // El índice no se carga hasta que el usuario toca el buscador, y va
  // partido: uno por pista y uno con las páginas que no son de ninguna. Con
  // pista elegida se bajan el suyo y el común; sin ella, los cuatro, porque
  // entonces se busca en todas. Antes era un solo archivo de 450 KB con las
  // tres pistas. El ?v= de cada uno lo pone herramientas/versiones.py.
  const PARTES = {
    comun: 'search-index-comun.js?v=f3afcfaca9',
    es: 'search-index-es.js?v=b8fda19107',
    it: 'search-index-it.js?v=3d42cdaef8',
    en: 'search-index-en.js?v=174ea5cf50'
  };
  const pedidas = {};   // parte → promesa de su descarga
  function pide(parte){
    if(!pedidas[parte]){
      pedidas[parte] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PARTES[parte];
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).then(() => {
        // tildes y mayúsculas se quitan UNA vez, al llegar: antes se hacía
        // con todas las páginas enteras en cada letra que se tecleaba
        ((window.JN_INDICE || {})[parte] || []).forEach(entry => {
          entry._title = normalize(entry.title);
          entry._text = normalize(entry.text);
        });
      });
      // si falla la descarga, que el siguiente intento vuelva a pedirla
      pedidas[parte].catch(() => { delete pedidas[parte]; });
    }
    return pedidas[parte];
  }

  function partesQueTocan(){
    const t = localStorage.getItem('jn_track');
    return PARTES[t] && t !== 'comun' ? ['comun', t] : ['comun', 'es', 'it', 'en'];
  }

  let juntas = null, juntasDe = '';
  function loadIndex(){
    const partes = partesQueTocan();
    return Promise.all(partes.map(pide)).then(() => {
      const clave = partes.join(',');
      if(juntasDe !== clave){
        // en el orden de siempre, por nombre de página: es el que decide qué
        // diez resultados salen cuando hay más de diez
        juntas = [].concat.apply([], partes.map(p => window.JN_INDICE[p] || []))
          .sort((x, y) => (x.url < y.url ? -1 : x.url > y.url ? 1 : 0));
        juntasDe = clave;
      }
      window.SEARCH_INDEX = juntas;
    });
  }

  function trackOf(url){
    const m = url.match(/-(it|en|es)\.html$/);
    return m ? m[1] : null;
  }

  // de qué sección es cada página, para su etiqueta de color
  function seccion(url){
    const pag = url.split('/').pop();
    if(/^clase-|^mis-clases-/.test(pag)) return 'clase';
    if(/^ejercicios-/.test(pag)) return 'ejercicios';
    if(/^(index|sobre-mi|privacidad)\.html/.test(pag)) return '';
    return 'teoria';
  }

  function snippetAround(text, normText, q){
    const i = normText.indexOf(q);
    if(i === -1) return text.slice(0, 90) + '…';
    const start = Math.max(0, i - 40);
    const end = Math.min(text.length, i + q.length + 50);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function render(query){
    const qRaw = query.trim();
    const q = normalize(qRaw);
    if(!q){ results.classList.remove('active'); results.innerHTML = ''; return; }
    if(!window.SEARCH_INDEX) return; // aún cargando el índice

    const currentTrack = localStorage.getItem('jn_track');
    let matches = window.SEARCH_INDEX.filter(entry => {
      const t = trackOf(entry.url);
      // si la página pertenece a un idioma, solo la mostramos si coincide con el elegido (o si no hay ninguno elegido, mostramos todas)
      if(t && currentTrack && t !== currentTrack) return false;
      return entry._title.includes(q) || entry._text.includes(q);
    });

    // prioriza coincidencias en el título
    matches.sort((a, b) => (a._title.includes(q) ? 0 : 1) - (b._title.includes(q) ? 0 : 1));
    matches = matches.slice(0, 10);

    // Todo lo que se pinta va escapado: lo que teclea el alumno y también el
    // texto de las páginas, que en el índice ya no lleva entidades —un «<» de
    // una explicación se habría leído como etiqueta—.
    if(!matches.length){
      results.innerHTML = '<div class="search-empty">' + jnEscapeHtml(txt().nada + ' "' + qRaw + '"') + '</div>';
    } else {
      const FLAGS = { es: 'es', it: 'it', en: 'gb' };   // banderas dibujadas: en Windows los emoji salen como letras
      results.innerHTML = matches.map(entry => {
        const inTitle = entry._title.includes(q);
        const snippet = inTitle ? '' : `<span class="search-snippet">${jnEscapeHtml(snippetAround(entry.text, entry._text, q))}</span>`;
        // sin idioma elegido, varias páginas (ES/IT/EN) pueden compartir título — se añade la bandera para distinguirlas
        const t = trackOf(entry.url);
        const flag = (!currentTrack && t && FLAGS[t]) ? '<img class="bandera" src="banderas/' + FLAGS[t] + '.svg" width="21" height="14" alt=""> ' : '';
        const sec = seccion(entry.url);
        const pill = sec ? `<span class="search-sec search-sec-${sec}">${jnEscapeHtml(txt()[sec])}</span>` : '';
        return `<a href="${jnEscapeHtml(entry.url)}">${pill}<span class="search-title">${flag}${jnEscapeHtml(entry.title)}</span>${snippet}</a>`;
      }).join('');
    }
    results.classList.add('active');
  }

  function busca(){ loadIndex().then(() => render(input.value)).catch(() => {}); }
  input.addEventListener('focus', busca);
  input.addEventListener('input', busca);
  document.addEventListener('click', (e) => {
    if(e.target.closest('.lupa-movil')) return;
    if(!e.target.closest('.sidebar-search')){
      results.classList.remove('active');
      // en el ordenador, si no se ha escrito nada, la barra vuelve a ser lupa
      if(!input.value.trim()) cierra();
    }
  });
})();
