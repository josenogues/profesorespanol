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

document.querySelectorAll(".menu-button").forEach(button=>{
if(button.tagName==="BUTTON"){
button.addEventListener("click",()=>button.parentElement.classList.toggle("active"));
}
});


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

// Resalta el enlace de la página actual en el menú lateral y abre su submenú
(function(){
const current=location.pathname.split("/").pop()||"index.html";
document.querySelectorAll(".submenu a, a.menu-button").forEach(a=>{
const href=a.getAttribute("href");
if(href===current){
a.classList.add("current-page");
a.closest(".menu-item").classList.add("active","current-section");
}
});
// las de "Verbos" no tienen href real (son track-link con data-base), así que se comparan por patrón base-it.html / base-en.html
const m = current.match(/^(.+)-(it|en|es)\.html$/);
if(m){
document.querySelectorAll(".submenu a.track-link, a.menu-button.track-link").forEach(a=>{
if(a.dataset.base === m[1]){
a.classList.add("current-page");
a.closest(".menu-item").classList.add("active","current-section");
}
});
}
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
  function applyI18n(){
    const t = getTrack();
    document.querySelectorAll('.i18n').forEach(el=>{
      const val = t === 'it' ? el.dataset.it : t === 'en' ? el.dataset.en : el.dataset.es;
      if(val) el.textContent = val;
    });
  }

  function goTo(base, track){
    window.location.href = base + '-' + track + '.html';
  }

  function openModal(onChoose){
    const overlay = document.createElement('div');
    overlay.className = 'track-modal-overlay';
    overlay.innerHTML = `
      <div class="track-modal">
        <h3>¿En qué idioma quieres las explicaciones?</h3>
        <p>Así te muestro las explicaciones de verbos adaptadas a tu idioma. Puedes cambiarlo cuando quieras desde el selector de arriba.</p>
        <div class="track-modal-buttons">
          <button data-track="es">🇪🇸 Español</button>
          <button data-track="it">🇮🇹 Italiano</button>
          <button data-track="en">🇬🇧 Inglés</button>
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
      const existing = getTrack();
      if(existing){ goTo(base, existing); } else { openModal((t)=> goTo(base, t)); }
      return;
    }

    const langBtn = e.target.closest('.lang-track-btn');
    if(langBtn){
      const t = langBtn.dataset.track;
      setTrack(t);
      const current = location.pathname.split('/').pop() || '';
      const m = current.match(/^(.+)-(it|en|es)\.html$/);
      if(m && m[2] !== t){
        // No todas las páginas existen en los tres idiomas: las clases para
        // angloparlantes solo en inglés, los false friends no en español.
        // Antes se saltaba a ciegas y el alumno acababa en un 404.
        const destino = m[1] + '-' + t + '.html';
        fetch(destino, { method: 'HEAD' })
          .then(function(r){
            if(r.ok) window.location.href = destino;
            else avisaFaltaIdioma(t, m[2]);
          })
          // sin conexión no podemos comprobarlo: se intenta igual, como antes
          .catch(function(){ window.location.href = destino; });
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
      const correct = normalizeAnswer(block.dataset.answer);
      showFeedback(block, built === correct);
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

// --- Generador de ejercicios nuevos (verbos regulares) ---
(function(){
  const VERBS = [
    'hablar','caminar','trabajar','escuchar','comprar','bailar','llamar','mirar','estudiar',
    'comer','beber','correr','vender','aprender','entender','temer','prometer',
    'vivir','escribir','abrir','subir','recibir','decidir','existir','descubrir'
  ];
  const SUBJECTS = ['Yo','Tú','Él / Ella','Nosotros','Vosotros','Ellos / Ellas'];
  const TENSES = {
    presente: {label:'presente'},
    pps: {label:'pretérito perfecto simple'},
    imperfecto: {label:'pretérito imperfecto'},
    futuro: {label:'futuro simple'},
    condicional: {label:'condicional simple'}
  };
  const LEVEL_TENSES = { basico:['presente'], intermedio:['pps','imperfecto'], avanzado:['futuro','condicional'] };

  function conjugate(inf, tense, p){
    const stem = inf.slice(0, -2);
    const group = inf.slice(-2); // ar / er / ir
    if(tense === 'futuro'){
      return inf + ['é','ás','á','emos','éis','án'][p];
    }
    if(tense === 'condicional'){
      return inf + ['ía','ías','ía','íamos','íais','ían'][p];
    }
    if(tense === 'presente'){
      const e = group === 'ar' ? ['o','as','a','amos','áis','an']
              : group === 'er' ? ['o','es','e','emos','éis','en']
              : ['o','es','e','imos','ís','en'];
      return stem + e[p];
    }
    if(tense === 'pps'){
      const e = group === 'ar' ? ['é','aste','ó','amos','asteis','aron']
                                : ['í','iste','ió','imos','isteis','ieron'];
      return stem + e[p];
    }
    if(tense === 'imperfecto'){
      const e = group === 'ar' ? ['aba','abas','aba','ábamos','abais','aban']
                                : ['ía','ías','ía','íamos','íais','ían'];
      return stem + e[p];
    }
  }

  const TRANSLATE_BANK = {
    it: {
      basico: [ ['«Lei parla italiano»','ella habla italiano|habla italiano'], ['«Noi viviamo qui»','vivimos aquí|nosotros vivimos aquí'], ['«Tu mangi la pizza»','tú comes la pizza|comes la pizza'], ['«Loro studiano spagnolo»','ellos estudian español|estudian español'] ],
      intermedio: [ ['«Noi vivevamo a Madrid»','vivíamos en madrid|nosotros vivíamos en madrid'], ['«Ho parlato con lei ieri»','hablé con ella ayer'], ['«Lui viveva a Roma»','él vivía en roma'], ['«Abbiamo mangiato bene»','comimos bien'] ],
      avanzado: [ ["«Domani parlerò con l'insegnante»",'mañana hablaré con el profesor|hablaré con el profesor'], ['«Vivrei in Spagna se potessi»','viviría en españa si pudiera'], ['«Mangeremmo di più»','comeríamos más'], ['«Loro vivranno qui»','ellos vivirán aquí|vivirán aquí'] ]
    },
    en: {
      basico: [ ['“She speaks Italian”','ella habla italiano|habla italiano'], ['“We live here”','vivimos aquí|nosotros vivimos aquí'], ['“You eat pizza”','tú comes la pizza|comes la pizza'], ['“They study Spanish”','ellos estudian español|estudian español'] ],
      intermedio: [ ['“We used to live in Madrid”','vivíamos en madrid|nosotros vivíamos en madrid'], ['“I spoke with her yesterday”','hablé con ella ayer'], ['“He used to live in Rome”','él vivía en roma'], ['“We ate well”','comimos bien'] ],
      avanzado: [ ['“Tomorrow I will speak with the teacher”','mañana hablaré con el profesor|hablaré con el profesor'], ['“I would live in Spain if I could”','viviría en españa si pudiera'], ['“We would eat more”','comeríamos más'], ['“They will live here”','ellos vivirán aquí|vivirán aquí'] ]
    }
  };

  function sample(arr, n){
    const copy = [...arr];
    const out = [];
    while(out.length < n && copy.length){
      out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);
    }
    return out;
  }
  function uid(){ return Math.random().toString(36).slice(2,9); }

  function fillHtml(exid, prompt, answer, kicker){
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${jnEscapeHtml(answer)}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">${prompt}</p>
<div class="exercise-row exercise-row-fill"><input type="text" class="exercise-input" placeholder="Escribe la respuesta"><button class="exercise-check">Comprobar</button></div>
<p class="exercise-feedback"></p></div>`;
  }
  function choiceHtml(exid, prompt, options, answer, kicker){
    const opts = options.map(o => `<button class="option-btn" data-value="${jnEscapeHtml(o)}">${jnEscapeHtml(o)}</button>`).join('');
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${jnEscapeHtml(answer)}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">${prompt}</p>
<div class="exercise-options">${opts}</div>
<p class="exercise-feedback"></p></div>`;
  }
  function translateHtml(exid, promptSentence, answer, kicker, verb){
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${jnEscapeHtml(answer)}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">Traduce: <em>${promptSentence}</em></p>
<div class="exercise-row exercise-row-fill"><input type="text" class="exercise-input" placeholder="Escribe la traducción"><button class="exercise-check">Comprobar</button></div>
<p class="exercise-feedback"></p></div>`;
  }

  function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }

  function generateLevel(levelKey, track, kickerFill, kickerChoice, kickerTranslate){
    const tenses = LEVEL_TENSES[levelKey];
    const used = new Set();
    let html = '';

    // 3 fill-in-the-blank
    for(let i=0;i<3;i++){
      let verb, tense, p, key;
      do {
        verb = VERBS[Math.floor(Math.random()*VERBS.length)];
        tense = tenses[Math.floor(Math.random()*tenses.length)];
        p = Math.floor(Math.random()*6);
        key = verb+tense+p;
      } while(used.has(key));
      used.add(key);
      const answer = conjugate(verb, tense, p);
      const prompt = `${SUBJECTS[p]} ___ <em>(${verb} · ${TENSES[tense].label})</em>`;
      html += fillHtml('gen-'+uid(), prompt, answer, kickerFill);
    }

    // 3 multiple choice
    for(let i=0;i<3;i++){
      let verb, tense, p, key;
      do {
        verb = VERBS[Math.floor(Math.random()*VERBS.length)];
        tense = tenses[Math.floor(Math.random()*tenses.length)];
        p = Math.floor(Math.random()*6);
        key = verb+tense+p;
      } while(used.has(key));
      used.add(key);
      const correct = conjugate(verb, tense, p);
      const wrongPersons = shuffle([0,1,2,3,4,5].filter(x=>x!==p)).slice(0,2);
      const options = shuffle([correct, conjugate(verb,tense,wrongPersons[0]), conjugate(verb,tense,wrongPersons[1])]);
      const prompt = `¿Cuál es la forma de <b>${verb}</b> (${TENSES[tense].label}) para <b>${SUBJECTS[p]}</b>?`;
      html += choiceHtml('gen-'+uid(), prompt, options, correct, kickerChoice);
    }

    // 3 translate from bank
    const bank = TRANSLATE_BANK[track][levelKey];
    sample(bank, Math.min(3, bank.length)).forEach(([sentence, answer]) => {
      html += translateHtml('gen-'+uid(), sentence, answer, kickerTranslate);
    });

    return html;
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.generate-btn');
    if(!btn) return;
    const panel = document.getElementById(btn.dataset.panel);
    if(!panel) return;
    const track = btn.dataset.track;
    const level = btn.dataset.level;
    const kFill = btn.dataset.kfill, kChoice = btn.dataset.kchoice, kTrans = btn.dataset.ktrans;
    panel.innerHTML = generateLevel(level, track, kFill, kChoice, kTrans);
  });

  // Variante para el hub de ejercicios: devuelve DATOS (no HTML), para que el motor del hub los renderice y mezcle con otros temas.
  const LEVEL_MAP = { A1:'basico', A2:'intermedio', B1:'avanzado' };
  window.generateRegularVerbItems = function(hubLevel, lang){
    const levelKeys = hubLevel ? [LEVEL_MAP[hubLevel]] : ['basico','intermedio','avanzado'];
    const items = [];
    levelKeys.forEach(levelKey => {
      const cefr = Object.keys(LEVEL_MAP).find(k => LEVEL_MAP[k] === levelKey);
      const tenses = LEVEL_TENSES[levelKey];
      const used = new Set();
      for(let i=0;i<2;i++){
        let verb, tense, p, key;
        do { verb = VERBS[Math.floor(Math.random()*VERBS.length)]; tense = tenses[Math.floor(Math.random()*tenses.length)]; p = Math.floor(Math.random()*6); key = verb+tense+p; } while(used.has(key));
        used.add(key);
        items.push({ type:'fill', level:cefr, exid:'reg', answer: conjugate(verb, tense, p),
          prompt: `${SUBJECTS[p]} ___ <em>(${verb} · ${TENSES[tense].label})</em>` });
      }
      for(let i=0;i<2;i++){
        let verb, tense, p, key;
        do { verb = VERBS[Math.floor(Math.random()*VERBS.length)]; tense = tenses[Math.floor(Math.random()*tenses.length)]; p = Math.floor(Math.random()*6); key = verb+tense+p; } while(used.has(key));
        used.add(key);
        const correct = conjugate(verb, tense, p);
        const wrongPersons = shuffle([0,1,2,3,4,5].filter(x=>x!==p)).slice(0,2);
        const options = shuffle([correct, conjugate(verb,tense,wrongPersons[0]), conjugate(verb,tense,wrongPersons[1])]);
        items.push({ type:'choice', level:cefr, exid:'reg', answer: correct, options,
          prompt: `¿Cuál es la forma de <b>${verb}</b> (${TENSES[tense].label}) para <b>${SUBJECTS[p]}</b>?` });
      }
      const bank = TRANSLATE_BANK[lang] && TRANSLATE_BANK[lang][levelKey];
      if(bank){
        sample(bank, Math.min(2, bank.length)).forEach(([sentence, answer]) => {
        items.push({ type:'translate', level:cefr, exid:'reg', answer, prompt: `${lang==='it'?'Traduci':'Translate'}: <em>${sentence}</em>` });
        });
      }
    });
    return items;
  };
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

  if(!ACCESS_GATE_ENABLED) return;

  // Los textos, en las tres pistas. La puerta sale antes que nada, así que no
  // puede depender del sistema de i18n del resto de la web.
  const T = {
    es: { titulo:'Acceso para alumnos',
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
          enotro:'Si puedes, ábrelo en este mismo navegador: si lo abres en otro te pediré el email otra vez.' },
    it: { titulo:'Accesso per studenti',
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
          enotro:'Se puoi, aprilo in questo stesso browser: se lo apri in un altro ti richiederò l’email.' },
    en: { titulo:'Student access',
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
          enotro:'If you can, open it in this same browser: if you open it elsewhere I’ll ask for your email again.' }
  };
  const t = T[window.jnIdioma()] || T.es;

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
        '<div class="access-gate-modal">' +
          '<div class="logo-mark">🇪🇸 Aprende Español</div>' +
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
      '<input type="email" class="access-gate-input" placeholder="tu@email.com" autocomplete="email">' +
      '<button class="access-gate-btn">' + esc(t.boton) + '</button>' +
      '<p class="access-gate-error"></p>';
    input = cuerpo.querySelector('.access-gate-input');
    btn = cuerpo.querySelector('.access-gate-btn');
    errorEl = cuerpo.querySelector('.access-gate-error');
    if(aviso) errorEl.textContent = aviso;
    btn.addEventListener('click', manda);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') manda(); });
    input.focus();
  }

  function esperaPaso(email){
    cuerpo.innerHTML =
      '<h3>' + esc(t.mirado) + '</h3>' +
      '<p>' + t.enviado.replace('%s', esc(email)) + '</p>' +
      '<p style="font-size:13.5px">' + esc(t.enotro) + '</p>' +
      '<button class="access-gate-btn access-gate-otro">' + esc(t.otro) + '</button>';
    cuerpo.querySelector('.access-gate-otro').addEventListener('click', () => pidePaso(''));
  }

  // Cuando el enlace se abre en un navegador distinto del que lo pidió, hay
  // que confirmar de quién es. Antes lo preguntaba window.prompt: una
  // ventanita sin estilo, siempre en español y que parece de una web
  // sospechosa justo en el momento de entrar.
  function confirmaPaso(aviso){
    cuerpo.innerHTML =
      '<h3>' + esc(t.confirma) + '</h3>' +
      '<p>' + esc(t.confirmap) + '</p>' +
      '<input type="email" class="access-gate-input" placeholder="tu@email.com" autocomplete="email">' +
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
      }, function(){
        // el enlace ya se ha gastado al fallar: hay que pedir otro
        pidePaso(t.nocuadra);
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

// --- Hub de ejercicios: elige materia, luego subtema, o mezcla al azar de todo ---
(function(){
  if(!window.EXERCISE_HUB_CONFIG) return; // esta página no es el hub de ejercicios

  const cfg = window.EXERCISE_HUB_CONFIG; // { categories:[{key,label,color,topics:[...]}], topics:{key:{items,generator?}}, labels:{...} }
  const container = document.getElementById('ex-hub-container');
  const catBtns = document.querySelectorAll('.ex-cat-card:not(.ex-level-card)');
  const levelBtns = document.querySelectorAll('.ex-level-card');
  const pillsWrap = document.getElementById('ex-topic-pills');
  const step2 = document.getElementById('ex-step2');
  const levelFilterStep = document.getElementById('ex-level-filter-step');
  const levelFilterPillsWrap = document.getElementById('ex-level-filter-pills');
  const generateBtn = document.getElementById('ex-hub-generate');
  const mixBtn = document.getElementById('ex-hub-mix');
  const modeGrid = document.getElementById('ex-mode-grid');
  const modeCards = document.querySelectorAll('.ex-mode-card');
  const panelNivel = document.getElementById('ex-mode-panel-nivel');
  const panelTema = document.getElementById('ex-mode-panel-tema');
  const modeBackBtns = document.querySelectorAll('.ex-mode-back');
  const hubToolbar = document.getElementById('ex-hub-toolbar');
  const step2Label = document.getElementById('ex-step2-label');
  const levelCatStep = document.getElementById('ex-level-cat-step');
  const levelCatGrid = document.getElementById('ex-level-cat-grid');
  const levelExamStep = document.getElementById('ex-level-exam-step');
  const examCtaTitle = document.getElementById('ex-exam-cta-title');
  const examCtaDesc = document.getElementById('ex-exam-cta-desc');
  const examStartBtn = document.getElementById('ex-exam-start-btn');
  const examRunner = document.getElementById('ex-exam-runner');
  const examQuestionEl = document.getElementById('ex-exam-question');
  const examProgressFill = document.getElementById('ex-exam-progress-fill');
  const examProgressLabel = document.getElementById('ex-exam-progress-label');
  const examExitBtn = document.getElementById('ex-exam-exit');
  const examOverlay = document.getElementById('ex-exam-overlay');
  const globalCounterEl = document.getElementById('ex-global-counter');
  const levelPracticeSublabel = document.getElementById('ex-level-practice-sublabel');

  // mapa tema -> categoría, para poder colorear cada resultado aunque venga de la mezcla al azar
  const topicToCat = {};
  (cfg.categories || []).forEach(cat => (cat.topics || []).forEach(t => { topicToCat[t] = cat; }));

  let activeCategory = null; // key de la categoría elegida en el paso 1
  let activeTopics = new Set(); // subtemas activos dentro de esa categoría (vacío = todos los de la categoría)
  // Sub-grupo dentro de un tema: «por/para» dentro de «Gramática que delata».
  // Los ejercicios lo llevan en el campo g, que ya usan los pasos de curso.
  let activeGroup = null;
  let activeLevelsFilter = new Set(); // niveles activos en "ejercicios libres" (vacío = todos los niveles); admite varios a la vez
  let mixMode = false;
  let activeLevel = null; // "A1".."C1" cuando se practica por nivel (recorrido completo, cruza todas las materias)
  let activeLevelCategory = null; // materia elegida dentro del nivel activo (máximo 4, como el menú)

  // temas cuyo slug de página no coincide con la key del tema en el hub de ejercicios
  const TOPIC_PAGE_SLUG = {
    regulares: 'conjugaciones',
    irregulares: 'conjugaciones',
    reflexivos: 'verbos-reflexivos',
    'atn-verbos': 'especial-atencion-verbos',
    'atn-gramatica': 'especial-atencion-gramatica'
  };

  const ACCENT_APOSTROPHE2 = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  function normalizeAnswer(s){
    return s.trim().toLowerCase()
      .replace(/([aeiou])['’]/g, (_, v) => ACCENT_APOSTROPHE2[v])
      .replace(/[¿¡]/g, '').replace(/[.!?]+$/, '').trim();
  }

  function theoryLinkHTML(item){
    const cat = item._cat;
    if(!item._topicKey || !cat) return '';
    const slug = TOPIC_PAGE_SLUG[item._topicKey] || item._topicKey;
    const topicLabel = cfg.topicLabels[item._topicKey] || item._topicKey;
    const href = `${slug}-${cfg.lang}.html`;
    // en otra pestaña a propósito: si se navega, al volver se pierde la tanda
    return `<a class="exercise-theory-link" href="${href}" target="_blank" rel="noopener"><i class="ti ti-book-2" aria-hidden="true"></i> ${cfg.labels.theoryPrefix || 'Teoría'}: ${cat.label} › ${topicLabel}</a>`;
  }

  function kickerFor(type){
    return type === 'fill' ? cfg.labels.kickerFill
      : type === 'choice' ? cfg.labels.kickerChoice
      : type === 'correct' ? cfg.labels.kickerCorrect
      : type === 'transform' ? cfg.labels.kickerTransform
      : cfg.labels.kickerTranslate;
  }

  function renderItemHTML(item){
    const kicker = kickerFor(item.type);
    const hint = item.hint ? `<p class="exercise-hint">${item.hint}</p>` : '';
    const cat = item._cat;
    const catTag = cat ? `<p class="exercise-cat-tag" style="color:${cat.color}">${cat.label}</p>` : '';
    const borderStyle = cat ? `style="border-left:4px solid ${cat.color}"` : '';
    const levelBadge = item.level ? `<span class="exercise-level-badge">${item.level}</span>` : '';
    if(item.type === 'order'){
      const words = shuffle([...item.words]);
      const bank = words.map(w => `<button class="order-word" data-word="${jnEscapeHtml(w)}">${jnEscapeHtml(w)}</button>`).join('');
      return `<div class="exercise-block" ${borderStyle} data-exid="${item.exid}" data-answer="${jnEscapeHtml(item.answer)}">
${catTag}<div class="exercise-kicker"><span>${cfg.labels.kickerOrder}${levelBadge}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>${hint}
<div class="order-answer-area" data-placeholder="${cfg.labels.orderPlaceholder}"></div>
<div class="order-word-bank">${bank}</div>
<div class="exercise-row"><button class="order-check">${cfg.labels.check}</button><button class="order-reset">${cfg.labels.orderReset}</button></div>
<p class="exercise-feedback"></p>${theoryLinkHTML(item)}</div>`;
    }
    if(item.type === 'choice'){
      // barajar SIEMPRE: en los datos la respuesta correcta va la primera,
      // así que sin esto bastaba con pulsar la primera opción para acertar
      const opts = shuffle([...item.options]).map(o => `<button class="option-btn" data-value="${jnEscapeHtml(o)}">${jnEscapeHtml(o)}</button>`).join('');
      return `<div class="exercise-block" ${borderStyle} data-exid="${item.exid}" data-answer="${jnEscapeHtml(item.answer)}">
${catTag}<div class="exercise-kicker"><span>${kicker}${levelBadge}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>${hint}
<div class="exercise-options">${opts}</div>
<p class="exercise-feedback"></p>${theoryLinkHTML(item)}</div>`;
    }
    if(item.type === 'match'){
      const leftItems = shuffle(item.pairs.map((p, i) => ({ text: p[0], key: i })));
      const rightItems = shuffle(item.pairs.map((p, i) => ({ text: p[1], key: i })));
      const colHtml = list => list.map(x => `<button class="match-item" data-key="${x.key}">${jnEscapeHtml(x.text)}</button>`).join('');
      return `<div class="exercise-block match-block" ${borderStyle} data-exid="${item.exid}" data-pairs="${item.pairs.length}">
${catTag}<div class="exercise-kicker"><span>${cfg.labels.kickerMatch}${levelBadge}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>${hint}
<div class="match-columns"><div class="match-col">${colHtml(leftItems)}</div><div class="match-col">${colHtml(rightItems)}</div></div>
<p class="exercise-feedback"></p>${theoryLinkHTML(item)}</div>`;
    }
    const placeholder = item.type === 'translate' ? cfg.labels.placeholderTranslate : item.type === 'correct' ? cfg.labels.placeholderCorrect : item.type === 'transform' ? cfg.labels.placeholderTransform : cfg.labels.placeholderFill;
    return `<div class="exercise-block" ${borderStyle} data-exid="${item.exid}" data-answer="${jnEscapeHtml(item.answer)}">
${catTag}<div class="exercise-kicker"><span>${kicker}${levelBadge}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>${hint}
<div class="exercise-row exercise-row-fill"><input type="text" class="exercise-input" placeholder="${placeholder}"><button class="exercise-check">${cfg.labels.check}</button></div>
<p class="exercise-feedback"></p>${theoryLinkHTML(item)}</div>`;
  }

  function shuffle(arr){
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function uid(){ return Math.random().toString(36).slice(2,9); }

  function collectPool(topicKeys){
    let pool = [];
    topicKeys.forEach(key => {
      const topic = cfg.topics[key];
      if(!topic) return;
      const cat = topicToCat[key];
      let items = [];
      if(topic.generator && window.generateRegularVerbItems){
        items = window.generateRegularVerbItems(null, cfg.lang);
      } else if(topic.items){
        items = topic.items;
      }
      pool = pool.concat(items.map(it => Object.assign({}, it, { _cat: cat, _topicKey: key })));
    });
    return pool;
  }

  function sample(arr, n){
    const copy = [...arr];
    const out = [];
    while(out.length < n && copy.length){
      out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);
    }
    return out;
  }

  let activeReadingLevel = null;

  function pickAndRenderReading(){
    const pool = (cfg.readings || {})[activeReadingLevel] || [];
    if(!pool.length){ container.innerHTML = ''; return; }
    const r = pool[Math.floor(Math.random() * pool.length)];
    const listenHTML = `<button class="speak-btn speak-btn-all" id="reading-listen-all" data-text="${r.text.replace(/"/g,'&quot;')}"><i class="ti ti-volume"></i> ${cfg.labels.listenAll}</button>`;
    const qHTML = r.questions.map(q => {
      const withId = Object.assign({}, q, {
        exid: 'read-' + uid(),
        prompt: q[`hint_${cfg.lang}`] || q.prompt,
        hint: null
      });
      return renderItemHTML(withId);
    }).join('');
    container.innerHTML = `<div class="reading-card">
<p class="reading-level-badge">${cfg.labels['level_' + activeReadingLevel] || activeReadingLevel}</p>
<h3 class="reading-title">${r.title}</h3>
<p class="reading-paragraph">${r.text}</p>
${listenHTML}
</div>
<p class="ex-step-label" style="margin-top:20px">${cfg.labels.questions}</p>
${qHTML}`;
  }

  function renderReadingPicker(){
    if(!cfg.readings) return;
    const levels = ['principiante','intermedio','avanzado'];
    const readingColor = ((cfg.categories || []).find(c => c.key === 'lectura') || {}).color || '#0F6E56';
    pillsWrap.innerHTML = levels.map(lv =>
      `<button class="ex-pill" data-level="${lv}">${cfg.labels['level_' + lv] || lv}</button>`
    ).join('');
    step2.style.display = '';
    function markActive(btn){
      pillsWrap.querySelectorAll('.ex-pill').forEach(b => { b.classList.remove('active'); b.style.background=''; b.style.borderColor=''; });
      btn.classList.add('active');
      btn.style.background = readingColor;
      btn.style.borderColor = readingColor;
    }
    pillsWrap.querySelectorAll('.ex-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        markActive(btn);
        activeReadingLevel = btn.dataset.level;
        pickAndRenderReading();
      });
    });
    // muestra el nivel principiante por defecto
    activeReadingLevel = levels[0];
    markActive(pillsWrap.querySelector('.ex-pill'));
    pickAndRenderReading();
  }

  function render(){
    let topicKeys;
    if(activeLevel){
      const levelCat = (cfg.categories || []).find(c => c.key === activeLevelCategory);
      topicKeys = levelCat ? levelCat.topics : [];
    } else if(mixMode){
      topicKeys = Object.keys(cfg.topics);
    } else if(activeCategory){
      const cat = (cfg.categories || []).find(c => c.key === activeCategory);
      topicKeys = activeTopics.size ? [...activeTopics] : (cat ? cat.topics : []);
    } else {
      topicKeys = [];
    }
    const count = mixMode ? 20 : (activeLevel ? 30 : 12);
    let pool = collectPool(topicKeys);
    if(activeGroup) pool = pool.filter(it => it.g === activeGroup);
    if(activeLevel) pool = pool.filter(it => it.level === activeLevel);
    else if(activeLevelsFilter.size) pool = pool.filter(it => activeLevelsFilter.has(it.level));
    const picked = sample(pool, Math.min(count, pool.length));
    container.innerHTML = picked.map(item => {
      const withId = Object.assign({}, item, { exid: (item.exid||'ex') + '-' + uid() });
      return renderItemHTML(withId);
    }).join('') || (topicKeys.length ? '' : `<p class="subtitle">${cfg.labels.empty}</p>`);
  }

  // Avisa de que la tanda está acotada a un sub-grupo y deja quitarlo: si no
  // se ve, el alumno cree que al tema le faltan ejercicios.
  const SOLO = { es: 'Solo', it: 'Solo', en: 'Only' };
  function pintaGrupo(){
    let chapa = document.getElementById('ex-solo');
    if(!activeGroup){ if(chapa) chapa.remove(); return; }
    const t = window.jnTemaPorId && window.jnTemaPorId(activeGroup);
    const nombre = (t && t.nombre && (t.nombre[cfg.lang] || t.nombre.es)) || activeGroup;
    if(!chapa){
      chapa = document.createElement('div');
      chapa.id = 'ex-solo';
      chapa.className = 'ex-solo';
      container.parentNode.insertBefore(chapa, container);
    }
    chapa.innerHTML = '<span>' + (SOLO[cfg.lang] || SOLO.es) + ': <b></b></span>' +
      '<button type="button" aria-label="\u00d7">\u00d7</button>';
    chapa.querySelector('b').textContent = nombre;
    chapa.querySelector('button').addEventListener('click', function(){
      limpiaGrupo();
      render();
    });
  }

  function limpiaGrupo(){
    if(!activeGroup) return;
    activeGroup = null;
    pintaGrupo();
  }

  function renderPills(){
    const cat = (cfg.categories || []).find(c => c.key === activeCategory);
    if(!cat){ step2.style.display = 'none'; return; }
    if(step2Label) step2Label.textContent = cfg.labels.stepTopicOptional || step2Label.textContent;
    pillsWrap.innerHTML = cat.topics.map(key => {
      const label = cfg.topicLabels[key] || key;
      const active = activeTopics.has(key);
      return `<button class="ex-pill${active ? ' active' : ''}" data-topic="${key}" style="${active ? `background:${cat.color};border-color:${cat.color}` : ''}">${label}</button>`;
    }).join('');
    step2.style.display = '';
    pillsWrap.querySelectorAll('.ex-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.topic;
        if(activeTopics.has(key)) activeTopics.delete(key); else activeTopics.add(key);
        limpiaGrupo();
        renderPills();
        render();
      });
    });
  }

  // filtro de nivel en "ejercicios libres": admite varios niveles a la vez (p.ej. A1+A2 de vocabulario),
  // porque un mismo tema puede tener ejercicios repartidos en varios niveles
  function renderLevelFilterPills(){
    if(!levelFilterPillsWrap) return;
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    levelFilterPillsWrap.innerHTML = levels.map(lv => {
      const active = activeLevelsFilter.has(lv);
      return `<button class="ex-pill${active ? ' active' : ''}" data-level-filter="${lv}" style="${active ? 'background:var(--primary);border-color:var(--primary)' : ''}">${lv}</button>`;
    }).join('');
    levelFilterPillsWrap.querySelectorAll('.ex-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const lv = btn.dataset.levelFilter;
        if(activeLevelsFilter.has(lv)) activeLevelsFilter.delete(lv); else activeLevelsFilter.add(lv);
        renderLevelFilterPills();
        render();
      });
    });
  }

  // paso 1 dentro de un nivel: hasta 4 materias (las mismas del menú), no una lista larga de temas sueltos
  function renderLevelCategories(level){
    const cats = [];
    (cfg.categories || []).forEach(cat => {
      if(cat.key === 'lectura') return;
      let n = 0;
      (cat.topics || []).forEach(key => {
        const topic = cfg.topics[key];
        if(topic && topic.items) n += topic.items.filter(it => it.level === level).length;
      });
      if(n > 0) cats.push({ key: cat.key, label: cat.label, color: cat.color, n });
    });
    if(levelCatGrid) levelCatGrid.innerHTML = cats.map(c =>
      `<button class="ex-cat-card ex-level-cat-btn" data-level-cat="${c.key}" style="--cat-color:${c.color};--cat-bg:${c.color}30"><p>${c.label} <span class="ex-pill-count">${c.n}</span></p></button>`
    ).join('');
    if(levelCatStep) levelCatStep.style.display = cats.length ? '' : 'none';
    if(levelCatGrid) levelCatGrid.querySelectorAll('.ex-level-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => selectLevelCategory(btn.dataset.levelCat));
    });
  }

  function selectLevelCategory(catKey){
    activeLevelCategory = catKey;
    if(levelCatGrid) levelCatGrid.querySelectorAll('.ex-level-cat-btn').forEach(b => b.classList.toggle('active', b.dataset.levelCat === catKey));
    render();
  }

  function selectCategory(key){
    mixMode = false;
    activeLevel = null;
    activeLevelCategory = null;
    if(mixBtn) mixBtn.classList.remove('active');
    levelBtns.forEach(b => b.classList.remove('active'));
    activeCategory = key;
    activeTopics.clear();
    limpiaGrupo();
    catBtns.forEach(b => b.classList.toggle('active', b.dataset.cat === key));
    if(levelFilterStep) levelFilterStep.style.display = key === 'lectura' ? 'none' : '';
    if(key === 'lectura'){
      renderReadingPicker();
    } else {
      renderPills();
      render();
    }
  }

  function updateExamCta(level){
    const pending = getPendingExams()[level];
    if(examCtaDesc){
      examCtaDesc.textContent = pending
        ? (cfg.labels.examPendingDesc || '').replace('{correct}', pending.correctCount).replace('{total}', pending.total)
        : (cfg.labels.examDesc || '');
    }
    if(examStartBtn){
      const label = pending ? (cfg.labels.examContinueBtnLabel || '') : (cfg.labels.examStartBtnLabel || '');
      examStartBtn.innerHTML = `<i class="ti ti-trophy" aria-hidden="true"></i> ${label}`;
    }
  }

  function selectLevel(level){
    mixMode = false;
    activeCategory = null;
    activeTopics.clear();
    limpiaGrupo();
    activeLevel = level;
    activeLevelCategory = null;
    if(mixBtn) mixBtn.classList.remove('active');
    catBtns.forEach(b => b.classList.remove('active'));
    levelBtns.forEach(b => b.classList.toggle('active', b.dataset.level === level));
    container.innerHTML = '';
    step2.style.display = 'none';
    renderLevelCategories(level);
    if(levelExamStep){
      levelExamStep.style.display = '';
      if(examCtaTitle) examCtaTitle.textContent = (cfg.labels.examTitle || 'Examen de nivel') + ' ' + level;
      updateExamCta(level);
      // si la nube tarda un poco en responder, esto refresca el botón (p. ej.
      // "Empezar" -> "Continuar") en cuanto llegue, sin bloquear el resto
      cloudSyncPromise.then(() => { if(activeLevel === level) updateExamCta(level); });
    }
    if(levelPracticeSublabel) levelPracticeSublabel.textContent = cfg.labels.examOrPractice || '';
  }

  // ---- examen de nivel: recorre todas las materias del nivel, exige 90% acumulado ----
  const LEVEL_STATUS_KEY = 'jn_level_status_' + cfg.lang;
  const EXAM_PENDING_KEY = 'jn_exam_pending_' + cfg.lang;
  let examState = null;

  function getStudentEmail(){
    return localStorage.getItem('jn_student_email');
  }

  // firebase-sync.js es type="module", así que el navegador lo carga DESPUÉS
  // de este script clásico — cuando este código arranca, window.jnCloud* todavía
  // no existe. Esperamos un poco (con límite) a que aparezca antes de rendirnos.
  function waitForCloudSDK(timeoutMs){
    return new Promise(resolve => {
      const start = Date.now();
      (function poll(){
        if(window.jnCloudGetStudentDoc) return resolve(true);
        if(Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(poll, 50);
      })();
    });
  }

  // Una vez por carga de página: si hay email (puerta de acceso) y Firebase
  // responde, trae de la nube lo que falte en este dispositivo (examen a
  // medias, niveles superados, contador) sin pisar nunca progreso local más
  // avanzado. Si Firebase no está disponible, no hace nada — todo sigue
  // funcionando con localStorage como hasta ahora.
  async function syncFromCloud(){
    const email = getStudentEmail();
    if(!email) return;
    const sdkReady = await waitForCloudSDK(6000);
    if(!sdkReady) return;
    try {
      const cloud = await window.jnCloudGetStudentDoc(email);
      if(!cloud) return;

      if(cloud.examPending && cloud.examPending[cfg.lang]){
        const local = getPendingExams();
        let changed = false;
        Object.keys(cloud.examPending[cfg.lang]).forEach(level => {
          if(!local[level]){ local[level] = cloud.examPending[cfg.lang][level]; changed = true; }
        });
        if(changed) localStorage.setItem(EXAM_PENDING_KEY, JSON.stringify(local));
      }

      // Un nivel superado cuenta para los tres tracks (ES/IT/EN): un alumno
      // puede pasar de un idioma de interfaz a otro y su progreso de nivel
      // (A1...C1) debe seguir viéndose igual, aunque cada track tenga su
      // propio examen con sus propias frases. Por eso aquí se combina lo
      // mejor de levelStatus.es / .it / .en antes de fusionarlo con lo local.
      if(cloud.levelStatus){
        const combined = {};
        ['es', 'it', 'en'].forEach(lang => {
          const langStatus = cloud.levelStatus[lang];
          if(!langStatus) return;
          Object.keys(langStatus).forEach(level => {
            const c = langStatus[level];
            const best = combined[level];
            const better = !best || (c.passed && !best.passed) ||
              (!!c.passed === !!best.passed && ((c.bestPct || 0) > (best.bestPct || 0) || (c.attempts || 0) > (best.attempts || 0)));
            if(better) combined[level] = c;
          });
        });

        const local = getLevelStatus();
        let changed = false;
        Object.keys(combined).forEach(level => {
          const c = combined[level];
          const l = local[level];
          const better = !l || (c.passed && !l.passed) ||
            (!!c.passed === !!l.passed && ((c.bestPct || 0) > (l.bestPct || 0) || (c.attempts || 0) > (l.attempts || 0)));
          if(better){
            local[level] = {
              passed: (l && l.passed) || !!c.passed,
              bestPct: Math.max((l && l.bestPct) || 0, c.bestPct || 0),
              attempts: Math.max((l && l.attempts) || 0, c.attempts || 0)
            };
            changed = true;
          }
        });
        if(changed){
          localStorage.setItem(LEVEL_STATUS_KEY, JSON.stringify(local));
          renderLevelDonuts();
        }
      }

      // el progreso de cursos también se comparte entre pistas: se une lo de
      // la nube con lo local, sin quitar nunca un paso ya dado
      if(cloud.courseProgress){
        const localC = getCourseProgress();
        let changedC = false;
        // lo que venga de la nube puede ser todavía por posición: se traduce
        const remoteAll = JSON.parse(JSON.stringify(cloud.courseProgress));
        migrarProgreso(remoteAll);
        migrarErrores(remoteAll);
        Object.keys(remoteAll).forEach(key => {
          const remote = remoteAll[key];
          if(!Array.isArray(remote)) return;
          const merged = new Set(Array.isArray(localC[key]) ? localC[key] : []);
          const before = merged.size;
          remote.forEach(id => merged.add(id));
          if(merged.size !== before){
            localC[key] = [...merged];
            changedC = true;
          }
        });
        if(changedC){
          localStorage.setItem(COURSE_KEY, JSON.stringify(localC));
          // repintamos lo que el alumno tenga delante (la ruta o el curso),
          // pero nunca a mitad de un paso: le borraríamos los ejercicios
          if(panelCurso && panelCurso.style.display !== 'none' && activeStepIdx === null){
            if(activeCourse) renderCourse(activeCourse); else renderRoute();
          }
        }
      }

      // el contador de ejercicios se sincroniza fuera de aquí, en el motor
      // de ejercicios, porque hace falta en todas las páginas y no solo
      // en el hub: también lo enseñan las clases y «Mis clases»
    } catch(e) { /* sin conexión a Firebase: seguimos solo con localStorage */ }
  }

  const cloudSyncPromise = syncFromCloud();

  // Un alumno que estrena dispositivo pasa la puerta DESPUÉS de que este código
  // haya arrancado, así que en esa primera carga no había email que sincronizar.
  // Al concederse el acceso lo reintentamos, y así ve su progreso ya en la
  // página que abrió (normalmente el enlace a un curso que le mandó José).
  document.addEventListener('jn-access-granted', function(){ syncFromCloud(); });

  function getLevelStatus(){
    try { return JSON.parse(localStorage.getItem(LEVEL_STATUS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function saveLevelStatus(level, data){
    const all = getLevelStatus();
    all[level] = data;
    localStorage.setItem(LEVEL_STATUS_KEY, JSON.stringify(all));
    const email = getStudentEmail();
    if(email && window.jnCloudSetFields){
      window.jnCloudSetFields(email, { levelStatus: { [cfg.lang]: { [level]: data } } }).catch(() => {});
    }
  }

  // intento de examen sin terminar: se guarda al salir o al fallar una ronda,
  // para poder ofrecer "sigue donde lo dejaste" aunque vuelvas días después
  function getPendingExams(){
    try { return JSON.parse(localStorage.getItem(EXAM_PENDING_KEY) || '{}'); } catch(e){ return {}; }
  }
  function savePendingExam(level, data){
    const all = getPendingExams();
    all[level] = data;
    localStorage.setItem(EXAM_PENDING_KEY, JSON.stringify(all));
    const email = getStudentEmail();
    if(email && window.jnCloudSetFields){
      window.jnCloudSetFields(email, { examPending: { [cfg.lang]: { [level]: data } } }).catch(() => {});
    }
  }
  function clearPendingExam(level){
    const all = getPendingExams();
    delete all[level];
    localStorage.setItem(EXAM_PENDING_KEY, JSON.stringify(all));
    const email = getStudentEmail();
    if(email && window.jnCloudSetFields && window.jnCloudDeleteField){
      window.jnCloudSetFields(email, { examPending: { [cfg.lang]: { [level]: window.jnCloudDeleteField() } } }).catch(() => {});
    }
  }
  function stripItemForStorage(item){
    const out = { type: item.type, level: item.level, answer: item.answer, prompt: item.prompt };
    if(item.options) out.options = item.options;
    if(item.words) out.words = item.words;
    if(item.pairs) out.pairs = item.pairs;
    if(item.hint) out.hint = item.hint;
    if(item._topicKey) out._topicKey = item._topicKey;
    return out;
  }
  function rehydrateStoredItem(it){
    return Object.assign({}, it, { _cat: topicToCat[it._topicKey], _examId: uid() });
  }

  function renderLevelDonuts(){
    const status = getLevelStatus();
    levelBtns.forEach(card => {
      const lv = card.dataset.level;
      const donut = card.querySelector('.ex-level-donut');
      const passed = !!(status[lv] && status[lv].passed);
      card.classList.toggle('is-level-passed', passed);
      if(!donut) return;
      const st = status[lv];
      donut.style.setProperty('--pct', st ? st.bestPct : 0);
      donut.classList.toggle('is-gold', passed);
      donut.innerHTML = passed ? '<span aria-hidden="true">&#10003;</span>' : '';
    });
    renderLevelTimeline();
  }

  function renderLevelTimeline(){
    const timelineEl = document.getElementById('ex-level-timeline');
    if(!timelineEl) return;
    const levels = ['A1','A2','B1','B2','C1'];
    const status = getLevelStatus();
    const passedFlags = levels.map(lv => !!(status[lv] && status[lv].passed));
    const nextIdx = passedFlags.indexOf(false);
    timelineEl.innerHTML = levels.map((lv, i) => {
      const passed = passedFlags[i];
      const isNext = !passed && i === nextIdx;
      const line = i > 0 ? `<span class="ex-timeline-line-in${passedFlags[i - 1] ? ' is-filled' : ''}"></span>` : '';
      const dotClass = 'ex-timeline-dot' + (passed ? ' is-passed' : '') + (isNext ? ' is-next' : '');
      return `<div class="ex-timeline-cell" title="${lv}">${line}<span class="${dotClass}"></span></div>`;
    }).join('');
  }

  function renderGlobalCounter(){
    if(!globalCounterEl) return;
    const n = window.jnGetExerciseCount ? window.jnGetExerciseCount() : 0;
    if(n > 0){
      const text = (cfg.labels.counterText || '').replace('{n}', `<strong>${n}</strong>`);
      globalCounterEl.innerHTML = `<span class="ex-counter-icon" aria-hidden="true">🔥</span>${text}`;
    } else {
      globalCounterEl.innerHTML = '';
    }
  }
  document.addEventListener('jn-counter-updated', renderGlobalCounter);

  function buildExamPool(level){
    const cats = (cfg.categories || []).filter(c => c.key !== 'lectura');
    const byCat = {};
    cats.forEach(cat => {
      const pool = collectPool(cat.topics).filter(it => it.level === level);
      if(pool.length) byCat[cat.key] = shuffle(pool);
    });
    const keys = Object.keys(byCat);
    const totalAvailable = keys.reduce((sum, k) => sum + byCat[k].length, 0);
    const target = Math.min(100, totalAvailable);
    const out = [];
    let i = 0;
    while(out.length < target && keys.some(k => byCat[k].length)){
      const k = keys[i % keys.length];
      if(byCat[k].length) out.push(byCat[k].pop());
      i++;
    }
    return shuffle(out).map(it => Object.assign({}, it, { _examId: uid() }));
  }

  function startExam(level){
    const pool = buildExamPool(level);
    if(!pool.length) return;
    examState = {
      level,
      total: pool.length,
      passThreshold: Math.ceil(pool.length * 0.9),
      correct: new Set(),
      correctCountBase: 0,
      queue: pool,
      idx: 0,
      wrongThisRound: [],
      isRetryRound: false
    };
    if(panelNivel) panelNivel.style.display = 'none';
    if(examRunner) examRunner.style.display = '';
    renderExamQuestion();
  }

  // continúa la MISMA ronda justo donde se dejó (lo no visto sigue pendiente de ver,
  // los fallos de esa ronda se guardan aparte para la ronda de errores, que llega solo al terminar)
  function resumeMidRound(level, pending){
    examState = {
      level,
      total: pending.total,
      passThreshold: Math.ceil(pending.total * 0.9),
      correct: new Set(),
      correctCountBase: pending.correctCount,
      queue: (pending.remainingItems || []).map(rehydrateStoredItem),
      idx: 0,
      wrongThisRound: (pending.wrongItems || []).map(rehydrateStoredItem),
      isRetryRound: !!pending.roundIsRetry
    };
    if(panelNivel) panelNivel.style.display = 'none';
    if(examRunner) examRunner.style.display = '';
    renderExamQuestion();
  }

  // arranca una ronda nueva solo con los fallos de la ronda anterior (ya completa)
  function startRetryRound(level, pending){
    examState = {
      level,
      total: pending.total,
      passThreshold: Math.ceil(pending.total * 0.9),
      correct: new Set(),
      correctCountBase: pending.correctCount,
      queue: (pending.wrongItems || []).map(rehydrateStoredItem),
      idx: 0,
      wrongThisRound: [],
      isRetryRound: true
    };
    if(panelNivel) panelNivel.style.display = 'none';
    if(examRunner) examRunner.style.display = '';
    renderExamQuestion();
  }

  function currentCorrectTotal(){
    return (examState.correctCountBase || 0) + examState.correct.size;
  }

  function maybeStartExam(level){
    const pending = getPendingExams()[level];
    if(pending){
      showResumeDialog(level, pending);
    } else {
      startExam(level);
    }
  }

  function showResumeDialog(level, pending){
    if(!examOverlay) return;
    const roundComplete = !pending.remainingItems || !pending.remainingItems.length;
    const title = roundComplete
      ? (cfg.labels.examResumeTitle || '').replace('{level}', level)
      : (cfg.labels.examResumeMidTitle || '').replace('{level}', level);
    const body = roundComplete
      ? (cfg.labels.examResumeBody || '')
      : (cfg.labels.examResumeMidBody || '');
    const continueLabel = roundComplete ? (cfg.labels.examRetryErrors || '') : (cfg.labels.examResumeContinueBtn || '');
    examOverlay.innerHTML = `<div class="ex-exam-dialog">
<i class="ti ti-refresh-alert ex-exam-dialog-icon" aria-hidden="true"></i>
<h3>${title}</h3>
<p>${body.replace('{correct}', pending.correctCount).replace('{total}', pending.total)}</p>
<div class="ex-exam-dialog-actions">
<button class="ex-exam-btn primary" id="ex-exam-resume-continue">${continueLabel}</button>
<button class="ex-exam-btn ghost" id="ex-exam-resume-restart">${cfg.labels.examRestart || ''}</button>
</div></div>`;
    examOverlay.style.display = '';
    const continueBtn = document.getElementById('ex-exam-resume-continue');
    const restartBtn = document.getElementById('ex-exam-resume-restart');
    if(continueBtn) continueBtn.addEventListener('click', () => {
      examOverlay.style.display = 'none';
      if(roundComplete) startRetryRound(level, pending);
      else resumeMidRound(level, pending);
    });
    if(restartBtn) restartBtn.addEventListener('click', () => {
      clearPendingExam(level);
      examOverlay.style.display = 'none';
      startExam(level);
    });
  }

  function endExam(backToLevels){
    examState = null;
    if(examRunner) examRunner.style.display = 'none';
    if(examOverlay){ examOverlay.style.display = 'none'; examOverlay.innerHTML = ''; }
    if(backToLevels && panelNivel){
      panelNivel.style.display = '';
      renderLevelDonuts();
    }
  }

  function updateExamProgress(){
    if(!examState) return;
    const pct = Math.round((examState.idx / examState.queue.length) * 100);
    if(examProgressFill) examProgressFill.style.width = pct + '%';
    if(examProgressLabel) examProgressLabel.textContent = (examState.idx + 1) + ' / ' + examState.queue.length;
  }

  function renderExamItemHTML(item){
    const catTag = item._cat ? `<p class="exercise-cat-tag" style="color:${item._cat.color}">${item._cat.label}</p>` : '';
    const hint = item.hint ? `<p class="exercise-hint">${item.hint}</p>` : '';
    if(item.type === 'choice'){
      const opts = shuffle([...item.options]).map(o => `<button class="ex-exam-option" data-value="${jnEscapeHtml(o)}">${jnEscapeHtml(o)}</button>`).join('');
      return `<div class="ex-exam-item" data-answer="${jnEscapeHtml(item.answer)}">${catTag}<p class="exercise-prompt">${item.prompt}</p>${hint}<div class="exercise-options">${opts}</div><p class="ex-exam-feedback"></p></div>`;
    }
    if(item.type === 'order'){
      const words = shuffle([...item.words]);
      const bank = words.map(w => `<button class="ex-exam-order-word" data-word="${jnEscapeHtml(w)}">${jnEscapeHtml(w)}</button>`).join('');
      return `<div class="ex-exam-item" data-answer="${jnEscapeHtml(item.answer)}">${catTag}<p class="exercise-prompt">${item.prompt}</p>${hint}<div class="order-answer-area ex-exam-order-answer" data-placeholder="${cfg.labels.orderPlaceholder}"></div><div class="ex-exam-order-bank">${bank}</div><div class="exercise-row"><button class="ex-exam-order-check">${cfg.labels.check}</button><button class="ex-exam-order-reset">${cfg.labels.orderReset}</button></div><p class="ex-exam-feedback"></p></div>`;
    }
    if(item.type === 'match'){
      const leftItems = shuffle(item.pairs.map((p, i) => ({ text: p[0], key: i })));
      const rightItems = shuffle(item.pairs.map((p, i) => ({ text: p[1], key: i })));
      const colHtml = list => list.map(x => `<button class="ex-exam-match-item" data-key="${x.key}">${jnEscapeHtml(x.text)}</button>`).join('');
      return `<div class="ex-exam-item" data-pairs="${item.pairs.length}">${catTag}<p class="exercise-prompt">${item.prompt}</p>${hint}<div class="match-columns"><div class="match-col">${colHtml(leftItems)}</div><div class="match-col">${colHtml(rightItems)}</div></div><p class="ex-exam-feedback"></p></div>`;
    }
    const placeholder = item.type === 'translate' ? cfg.labels.placeholderTranslate : item.type === 'correct' ? cfg.labels.placeholderCorrect : item.type === 'transform' ? cfg.labels.placeholderTransform : cfg.labels.placeholderFill;
    return `<div class="ex-exam-item" data-answer="${jnEscapeHtml(item.answer)}">${catTag}<p class="exercise-prompt">${item.prompt}</p>${hint}<div class="exercise-row exercise-row-fill"><input type="text" class="ex-exam-input" placeholder="${placeholder}"><button class="ex-exam-check">${cfg.labels.check}</button></div><p class="ex-exam-feedback"></p></div>`;
  }

  function randomPraise(){ return window.jnPraise(); }

  function bindExamItem(item){
    const root = examQuestionEl;
    const fb = root.querySelector('.ex-exam-feedback');
    let answered = false;

    function lockAndAdvance(ok, revealText){
      if(answered) return;
      // en la ronda de errores no se bloquea ni se avanza al fallar: se ve la corrección
      // y se deja seguir intentando en la misma pregunta, como en la práctica libre
      if(!ok && examState.isRetryRound){
        if(fb){
          fb.textContent = (cfg.labels.examIncorrect || '') + (revealText ? ' (' + (cfg.labels.examAnswerLabel || '') + ': ' + revealText + ')' : '');
          fb.className = 'ex-exam-feedback incorrect';
        }
        return;
      }
      answered = true;
      if(fb){
        if(ok){
          fb.textContent = randomPraise();
          fb.className = 'ex-exam-feedback correct';
        } else {
          fb.textContent = (cfg.labels.examIncorrect || '') + (revealText ? ' (' + (cfg.labels.examAnswerLabel || '') + ': ' + revealText + ')' : '');
          fb.className = 'ex-exam-feedback incorrect';
        }
      }
      root.querySelectorAll('input,button').forEach(el => { el.disabled = true; });
      if(ok){
        window.jnCountExercise();
        examState.correct.add(item._examId);
      } else {
        examState.wrongThisRound.push(item);
      }
      const delay = ok ? 900 : 1700;
      setTimeout(() => {
        if(!examState) return;
        examState.idx++;
        renderExamQuestion();
      }, delay);
    }

    if(item.type === 'choice'){
      const correct = item.answer.trim().toLowerCase();
      root.querySelectorAll('.ex-exam-option').forEach(btn => {
        btn.addEventListener('click', () => {
          if(answered) return;
          const chosen = btn.dataset.value.trim().toLowerCase();
          root.querySelectorAll('.ex-exam-option').forEach(b => b.classList.remove('correct','incorrect'));
          btn.classList.add(chosen === correct ? 'correct' : 'incorrect');
          if(chosen !== correct){
            const rightBtn = [...root.querySelectorAll('.ex-exam-option')].find(b => b.dataset.value.trim().toLowerCase() === correct);
            if(rightBtn) rightBtn.classList.add('correct');
          }
          lockAndAdvance(chosen === correct);
        });
      });
    } else if(item.type === 'order'){
      const bank = root.querySelector('.ex-exam-order-bank');
      const area = root.querySelector('.ex-exam-order-answer');
      root.querySelectorAll('.ex-exam-order-word').forEach(w => {
        w.addEventListener('click', () => {
          if(answered) return;
          (w.parentElement === bank ? area : bank).appendChild(w);
        });
      });
      const resetBtn = root.querySelector('.ex-exam-order-reset');
      if(resetBtn) resetBtn.addEventListener('click', () => {
        if(answered) return;
        root.querySelectorAll('.ex-exam-order-answer .ex-exam-order-word').forEach(w => bank.appendChild(w));
      });
      const checkBtn = root.querySelector('.ex-exam-order-check');
      if(checkBtn) checkBtn.addEventListener('click', () => {
        if(answered) return;
        const built = normalizeAnswer([...area.querySelectorAll('.ex-exam-order-word')].map(w => w.dataset.word).join(' '));
        const correct = normalizeAnswer(item.answer);
        lockAndAdvance(built === correct, item.answer);
      });
    } else if(item.type === 'match'){
      let hadMistake = false;
      const total = item.pairs.length;
      root.addEventListener('click', (e) => {
        if(answered) return;
        const el = e.target.closest('.ex-exam-match-item');
        if(!el || el.classList.contains('matched')) return;
        const selected = root.querySelector('.ex-exam-match-item.selected');
        if(selected === el){ el.classList.remove('selected'); return; }
        if(!selected){ el.classList.add('selected'); return; }
        if(selected.closest('.match-col') === el.closest('.match-col')){
          selected.classList.remove('selected');
          el.classList.add('selected');
          return;
        }
        if(selected.dataset.key === el.dataset.key){
          selected.classList.remove('selected');
          selected.classList.add('matched');
          el.classList.add('matched');
          const matchedCount = root.querySelectorAll('.ex-exam-match-item.matched').length / 2;
          // en la ronda de errores, emparejar todo ya es "correcto" aunque hayas fallado algún intento por el camino
          if(matchedCount >= total) lockAndAdvance(examState.isRetryRound ? true : !hadMistake);
        } else {
          hadMistake = true;
          selected.classList.add('wrong-flash');
          el.classList.add('wrong-flash');
          setTimeout(() => {
            selected.classList.remove('selected','wrong-flash');
            el.classList.remove('wrong-flash');
          }, 500);
        }
      });
    } else {
      const input = root.querySelector('.ex-exam-input');
      const checkBtn = root.querySelector('.ex-exam-check');
      function doCheck(){
        if(answered) return;
        const accepted = item.answer.split('|').map(s => normalizeAnswer(s));
        const ok = accepted.includes(normalizeAnswer(input.value));
        lockAndAdvance(ok, item.answer.split('|')[0]);
      }
      if(checkBtn) checkBtn.addEventListener('click', doCheck);
      if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') doCheck(); });
    }
  }

  function renderExamQuestion(){
    if(!examState) return;
    if(examState.idx >= examState.queue.length){
      if(currentCorrectTotal() >= examState.passThreshold){
        passExam();
      } else {
        finishRound();
      }
      return;
    }
    updateExamProgress();
    const item = examState.queue[examState.idx];
    examQuestionEl.innerHTML = renderExamItemHTML(item);
    bindExamItem(item);
  }

  // separa lo aún no visto en esta ronda (para reanudar tal cual) de lo fallado (para la ronda de errores)
  function computeStopSummary(){
    const remaining = examState.queue.slice(examState.idx);
    return {
      remainingItems: remaining,
      wrongItems: examState.wrongThisRound,
      correctCount: currentCorrectTotal(),
      total: examState.total
    };
  }

  function persistStopState(summary){
    const level = examState.level;
    const prevBest = (getLevelStatus()[level] || {}).bestPct || 0;
    const pct = Math.round((summary.correctCount / summary.total) * 100);
    const attempts = ((getLevelStatus()[level] || {}).attempts || 0) + 1;
    saveLevelStatus(level, { passed: false, bestPct: Math.max(pct, prevBest), attempts });
    if(summary.remainingItems.length || summary.wrongItems.length){
      savePendingExam(level, {
        total: summary.total,
        correctCount: summary.correctCount,
        remainingItems: summary.remainingItems.map(stripItemForStorage),
        wrongItems: summary.wrongItems.map(stripItemForStorage),
        roundIsRetry: !!examState.isRetryRound,
        savedAt: Date.now()
      });
    } else {
      clearPendingExam(level);
    }
  }

  // se sale del examen (botón salir o navegar fuera) sin terminar: se guarda en silencio, sin diálogo
  function silentStop(){
    if(!examState) return;
    persistStopState(computeStopSummary());
  }

  function finishRound(){
    const summary = computeStopSummary();
    persistStopState(summary);
    showFailDialog(summary.correctCount, summary.total);
  }

  function passExam(){
    const correctCount = currentCorrectTotal();
    const total = examState.total;
    const attempts = ((getLevelStatus()[examState.level] || {}).attempts || 0) + 1;
    saveLevelStatus(examState.level, { passed: true, bestPct: 100, attempts });
    clearPendingExam(examState.level);
    showPassDialog(correctCount, total);
  }

  function showFailDialog(correct, total){
    if(!examOverlay) return;
    examOverlay.innerHTML = `<div class="ex-exam-dialog">
<i class="ti ti-refresh-alert ex-exam-dialog-icon" aria-hidden="true"></i>
<h3>${cfg.labels.examFailTitle || ''}</h3>
<p>${(cfg.labels.examFailBody || '').replace('{correct}', correct).replace('{total}', total)}</p>
<div class="ex-exam-dialog-actions">
<button class="ex-exam-btn primary" id="ex-exam-retry-errors">${cfg.labels.examRetryErrors || ''}</button>
<button class="ex-exam-btn ghost" id="ex-exam-restart">${cfg.labels.examRestart || ''}</button>
</div></div>`;
    examOverlay.style.display = '';
    const retryBtn = document.getElementById('ex-exam-retry-errors');
    const restartBtn = document.getElementById('ex-exam-restart');
    if(retryBtn) retryBtn.addEventListener('click', () => {
      examState.queue = examState.wrongThisRound;
      examState.wrongThisRound = [];
      examState.idx = 0;
      examState.isRetryRound = true;
      examOverlay.style.display = 'none';
      renderExamQuestion();
    });
    if(restartBtn) restartBtn.addEventListener('click', () => {
      examOverlay.style.display = 'none';
      startExam(examState.level);
    });
  }

  function showPassDialog(correct, total){
    if(!examOverlay) return;
    const level = examState.level;
    examOverlay.innerHTML = `<div class="ex-exam-dialog ex-exam-dialog-pass">
<div class="ex-exam-confetti">${'<span></span>'.repeat(16)}</div>
<i class="ti ti-trophy ex-exam-dialog-icon gold" aria-hidden="true"></i>
<h3>${(cfg.labels.examPassTitle || '').replace('{level}', level)}</h3>
<p>${((cfg.labels.examPassBodyByLevel && cfg.labels.examPassBodyByLevel[level]) || cfg.labels.examPassBody || '').replace('{correct}', correct).replace('{total}', total)}</p>
<div class="ex-exam-dialog-actions">
<button class="ex-exam-btn primary" id="ex-exam-back-levels">${cfg.labels.examBackToLevels || ''}</button>
</div></div>`;
    examOverlay.style.display = '';
    const backBtn = document.getElementById('ex-exam-back-levels');
    if(backBtn) backBtn.addEventListener('click', () => endExam(true));
  }

  if(examStartBtn) examStartBtn.addEventListener('click', () => { if(activeLevel) maybeStartExam(activeLevel); });
  if(examExitBtn) examExitBtn.addEventListener('click', () => {
    silentStop();
    endExam(true);
  });

  window.addEventListener('pagehide', silentStop);

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => selectCategory(btn.dataset.cat));
  });

  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => selectLevel(btn.dataset.level));
  });

  if(mixBtn){
    mixBtn.addEventListener('click', () => {
      mixMode = true;
      activeCategory = null;
      activeLevel = null;
      activeTopics.clear();
    limpiaGrupo();
      catBtns.forEach(b => b.classList.remove('active'));
      levelBtns.forEach(b => b.classList.remove('active'));
      step2.style.display = 'none';
      if(levelFilterStep) levelFilterStep.style.display = '';
      mixBtn.classList.add('active');
      render();
    });
  }

  if(generateBtn) generateBtn.addEventListener('click', () => {
    if(activeCategory === 'lectura' && activeReadingLevel){
      pickAndRenderReading();
    } else {
      render();
    }
  });

  // ---------------------------------------------------------------- CURSOS
  // Un curso es un camino de pasos cortos montado sobre los ejercicios que ya
  // existen: cada paso son unos 7 ejercicios de un tema y un corte de nivel.
  // El progreso se guarda POR PASO (no por ejercicio) y se comparte entre las
  // tres pistas, igual que los niveles: el español practicado es el mismo.
  const courses = cfg.courses || [];
  const cLbl = cfg.courseLabels || {};
  const panelCurso = document.getElementById('ex-mode-panel-curso');
  const courseView = document.getElementById('ex-course-view');
  const COURSE_KEY = 'jn_course_progress';
  let activeCourse = null;
  let activeStepIdx = null;
  let activeStepTotal = 0;
  let activeStepItems = [];

  // Un paso a medias se guarda entero (los ejercicios que salieron y cuáles
  // están ya acertados). Antes, si te ibas a mirar la teoría o recargabas,
  // volvías con otra tanda distinta y todo por contestar.
  const STEP_KEY = 'jn_course_step_' + cfg.lang;

  function getStepState(){
    try { return JSON.parse(localStorage.getItem(STEP_KEY) || 'null'); } catch(e){ return null; }
  }
  function saveStepState(){
    if(!activeCourse || activeStepIdx === null || !activeStepItems.length) return;
    const done = [...container.querySelectorAll('.exercise-block')].map(b => b.classList.contains('is-done'));
    localStorage.setItem(STEP_KEY, JSON.stringify({
      course: activeCourse.key, step: activeStepIdx,
      stepId: (activeCourse.steps[activeStepIdx] || {}).id,
      items: activeStepItems.map(stripItemForStorage), done: done
    }));
  }
  function clearStepState(){ localStorage.removeItem(STEP_KEY); }

  function cText(key, vars){
    let s = cLbl[key] || '';
    Object.keys(vars || {}).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  // Orden de los pasos ANTES de meter gramática y verbos en los cursos. El
  // progreso se guardaba por posición, así que al reordenar las palomitas se
  // corrían de paso; esto traduce una sola vez lo viejo a los identificadores.
  const PASOS_ANTIGUOS = {
    'primeros-pasos': ['ser-estar', 'haber-tener', 'presente', 'saludos'],
    'viajar': ['saludos', 'presente', 'viajes', 'la-hora', 'las-fechas', 'moverse',
               'restaurante', 'comidas', 'clima'],
    'vivir': ['presentarse', 'reflexivos', 'fechas', 'medico', 'papeleo', 'casa',
              'transporte', 'barrio', 'vecinos'],
    'profesional': ['registro', 'email', 'emails-modelo', 'chat', 'telefono', 'reuniones',
                    'presentaciones', 'cv', 'entrevista'],
    // "errores" no existe en español y tenía pasos distintos en cada pista,
    // así que su orden viejo depende del idioma del alumno
    'errores': {
      it: ['traer-llevar', 'venir-ir', 'pedir-preguntar', 'dejar', 'recordar', 'cambio',
           'mucho-muy', 'contraste', 'por-para', 'falsos-amigos'],
      en: ['gustar', 'sujeto', 'adjetivo', 'por-para', 'fa1', 'fa2', 'varios']
    }
  };

  function migrarProgreso(all){
    let cambiado = false;
    Object.keys(all).forEach(key => {
      const v = all[key];
      if(!Array.isArray(v) || !v.length || typeof v[0] !== 'number') return;
      let antiguos = PASOS_ANTIGUOS[key];
      if(antiguos && !Array.isArray(antiguos)) antiguos = antiguos[cfg.lang];
      // si no sabemos a qué correspondían esos números, mejor dejarlos como
      // están que borrarle el curso al alumno
      if(!antiguos) return;
      all[key] = v.map(i => antiguos[i]).filter(Boolean);
      cambiado = true;
    });
    return cambiado;
  }

  // «Los errores que te delatan» ha dejado de ser un curso: sus pasos se
  // repartieron por los otros cuatro, donde el error aparece de verdad. Lo
  // que un alumno llevara hecho se traslada al curso que ahora lo tiene, en
  // vez de perderse.
  // los pasos que al repartirlos cambiaron de nombre: en inglés los falsos
  // amigos iban partidos en dos y había un paso cajón de sastre
  const ALIAS_ERRORES = {
    fa1: 'atn-falsos-amigos', fa2: 'atn-falsos-amigos',
    varios: 'atn-pedir-preguntar'
  };

  function migrarErrores(all){
    if(!Array.isArray(all.errores)) return false;
    const hechos = all.errores;
    delete all.errores;
    hechos.forEach(id => {
      const destino = ALIAS_ERRORES[id];
      cfg.courses.forEach(c => {
        const st = c.steps.find(x => x.id === destino || x.id === 'atn-' + id || x.id === id);
        if(!st) return;
        const arr = all[c.key] || (all[c.key] = []);
        if(!arr.includes(st.id)) arr.push(st.id);
      });
    });
    return true;
  }

  function getCourseProgress(){
    let all;
    try { all = JSON.parse(localStorage.getItem(COURSE_KEY) || '{}'); } catch(e){ return {}; }
    // el orden importa: primero los números a identificadores, y sólo
    // entonces se puede saber qué pasos de "errores" llevaba hechos
    let cambiado = migrarProgreso(all);
    if(migrarErrores(all)) cambiado = true;
    if(cambiado) localStorage.setItem(COURSE_KEY, JSON.stringify(all));
    return all;
  }
  function doneSet(key){
    const p = getCourseProgress()[key];
    return new Set(Array.isArray(p) ? p : []);
  }
  function markStepDone(courseKey, stepId){
    const all = getCourseProgress();
    const done = Array.isArray(all[courseKey]) ? all[courseKey].slice() : [];
    if(done.indexOf(stepId) === -1) done.push(stepId);
    all[courseKey] = done;
    localStorage.setItem(COURSE_KEY, JSON.stringify(all));
    const email = getStudentEmail();
    if(email && window.jnCloudSetFields){
      // el total va junto al progreso porque no es fijo: "los errores que te
      // delatan" tiene 10 pasos en italiano y 7 en inglés, y el panel del
      // profesor no sabe de qué pista viene cada alumno
      const c = courseByKey(courseKey);
      const fields = { courseProgress: { [courseKey]: done } };
      if(c) fields.courseTotals = { [courseKey]: c.steps.length };
      window.jnCloudSetFields(email, fields).catch(() => {});
    }
  }

  function courseByKey(key){ return courses.filter(c => c.key === key)[0] || null; }

  // el color del curso como TEXTO no se lee sobre fondo oscuro (el verde de
  // profesional es el peor), así que se pasa también una versión aclarada
  // amt positivo aclara hacia el blanco, negativo oscurece hacia el negro
  function shade(hex, amt){
    const n = parseInt(hex.slice(1), 16);
    const mix = v => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
    return '#' + [16, 8, 0].map(sh => mix((n >> sh) & 255).toString(16).padStart(2, '0')).join('');
  }
  function cssVars(c){
    return `--c:${c.color};--c-soft:${c.color}1A;` +
           `--c-lite:${shade(c.color, .45)};--c-dark:${shade(c.color, -.3)}`;
  }

  // los ejercicios de un paso: tema(s) + corte de nivel + grupo (para los
  // pasos de "errores", que salen de dentro de un mismo tema)
  function stepPool(course, idx){
    const st = course.steps[idx];
    let pool = collectPool(st.topics);
    if(st.levels) pool = pool.filter(it => st.levels.indexOf(it.level) !== -1);
    if(st.group) pool = pool.filter(it => it.g === st.group);
    return pool;
  }

  // el paso que toca: primero un curso empezado y sin acabar, si no, el primero
  // que quede pendiente. Ningún curso se bloquea nunca por los anteriores.
  function nextUp(){
    const prog = getCourseProgress();
    const pending = c => (prog[c.key] || []).length < c.steps.length;
    const started = courses.filter(c => (prog[c.key] || []).length && pending(c));
    const c = started[0] || courses.filter(pending)[0];
    if(!c) return null;
    const done = doneSet(c.key);
    for(let i = 0; i < c.steps.length; i++){ if(!done.has(c.steps[i].id)) return { course: c, idx: i }; }
    return null;
  }

  function topicNameOf(step){
    return step.topics.map(k => cfg.topicLabels[k] || k).join(' · ');
  }

  const TICK = '<i class="ti ti-check" aria-hidden="true"></i>';

  function renderRoute(){
    if(!courseView) return;
    activeCourse = null; activeStepIdx = null; activeStepTotal = 0;
    container.innerHTML = '';
    const up = nextUp();
    let html = '';
    if(up){
      const st = up.course.steps[up.idx];
      html += `<button class="ex-resume" data-resume="${up.course.key}" data-step="${up.idx}">
<span class="ex-resume-icon"><i class="ti ti-player-play" aria-hidden="true"></i></span>
<span class="ex-resume-body">
<span class="ex-resume-label">${cLbl.resume}</span>
<span class="ex-resume-title">${cLbl.step} ${up.idx + 1} · ${jnEscapeHtml(st.title)}</span>
<span class="ex-resume-meta">${jnEscapeHtml(up.course.name)} · ${st.n} ${cLbl.exercises} · ${cText('minutes', { m: Math.max(3, Math.round(st.n * 0.6)) })}</span>
</span>
<span class="ex-resume-go">${cLbl.cont}</span></button>`;
    }
    html += `<p class="ex-step-label">${cLbl.route}</p><div class="ex-route" style="--n:${courses.length}">`;
    courses.forEach((c, i) => {
      const done = doneSet(c.key);
      const total = c.steps.length;
      const complete = done.size >= total;
      const isNow = !!up && up.course.key === c.key;
      const prevDone = i > 0 && doneSet(courses[i - 1].key).size >= courses[i - 1].steps.length;
      const lineIn = i > 0 ? `<span class="ex-route-line in${prevDone ? ' filled' : ''}" style="--c:${courses[i - 1].color}"></span>` : '';
      const lineOut = i < courses.length - 1 ? `<span class="ex-route-line out${complete ? ' filled' : ''}"></span>` : '';
      const dot = `<span class="ex-route-dot${complete ? ' done' : (isNow ? ' now' : '')}"></span>`;
      const mark = complete
        ? `<span class="ex-course-badge">${TICK}</span>`
        : (done.size
            ? `<span class="ex-course-ring" style="--pct:${Math.round(done.size / total * 100)}"><span>${done.size}/${total}</span></span>`
            : '<span class="ex-course-badge empty"></span>');
      const state = complete
        ? `<span class="ex-course-state">${cLbl.done}</span>`
        : (done.size
            ? `<span class="ex-course-state">${cText('inProgress', { n: done.size + 1 })}</span>`
            : `<span class="ex-course-state todo">${cLbl.notStarted}</span>`);
      html += `<div class="ex-route-stop" style="${cssVars(c)}">
<div class="ex-route-dots">${lineIn}${lineOut}${dot}</div>
<button class="ex-course-card${isNow ? ' now' : ''}" data-course="${c.key}">
<span class="ex-course-top"><h4>${jnEscapeHtml(c.name)}</h4>${mark}</span>
<span class="ex-course-meta"><span class="ex-course-lvl">${c.levels}</span> ${total} ${cLbl.steps}</span>
${state}</button></div>`;
    });
    html += '</div>';
    courseView.innerHTML = html;
  }

  function renderCourse(course){
    if(!courseView) return;
    activeCourse = course; activeStepIdx = null; activeStepTotal = 0;
    container.innerHTML = '';
    const done = doneSet(course.key);
    const total = course.steps.length;
    const pct = Math.round(done.size / total * 100);
    let firstPending = -1;
    for(let i = 0; i < total; i++){ if(!done.has(course.steps[i].id)){ firstPending = i; break; } }

    let html = `<div class="ex-course-hero" style="${cssVars(course)}">
<span class="ex-course-badge"><i class="ti ${course.icon}" aria-hidden="true"></i></span>
<div class="ex-course-hero-body">
<h4>${jnEscapeHtml(course.name)}</h4>
<p>${jnEscapeHtml(course.desc)} · ${course.levels} · ${done.size}/${total} ${cLbl.steps}</p>
<div class="ex-course-bar"><i style="width:${pct}%"></i></div>
</div></div><div class="ex-steps" style="${cssVars(course)}">`;

    course.steps.forEach((st, i) => {
      const isDone = done.has(st.id);
      const isNext = i === firstPending;
      const num = isDone ? `<span class="ex-step-num done">${TICK}</span>`
                         : `<span class="ex-step-num${isNext ? ' next' : ''}">${i + 1}</span>`;
      const right = isNext
        ? `<span class="ex-step-go">${cLbl.start}</span>`
        : `<span class="ex-step-right">${isDone ? cLbl.again : st.n + ' ' + cLbl.exercises}</span>`;
      html += `<button class="ex-step-row${isNext ? ' next' : ''}${isDone ? ' done' : ''}" data-step="${i}">
${num}<span><h5>${jnEscapeHtml(st.title)}</h5>
<span class="ex-step-src">${jnEscapeHtml(topicNameOf(st))}</span></span>${right}</button>`;
    });
    html += `</div><div style="margin-top:20px"><button class="button button-secondary button-sm" data-back-route="1"><i class="ti ti-arrow-left"></i> ${cLbl.backRoute}</button></div>`;
    courseView.innerHTML = html;
  }

  function startStep(course, idx){
    activeCourse = course; activeStepIdx = idx;
    const st = course.steps[idx];
    const saved = getStepState();
    const resumable = saved && saved.course === course.key &&
      saved.stepId === (st || {}).id &&
      Array.isArray(saved.items) && saved.items.length;
    let picked;
    if(resumable){
      picked = saved.items.map(rehydrateStoredItem);
    } else {
      const pool = stepPool(course, idx);
      picked = sample(pool, Math.min(st.n, pool.length));
    }
    activeStepItems = picked;
    activeStepTotal = picked.length;
    courseView.innerHTML = `<div class="ex-run-head" style="${cssVars(course)}">
<button class="button button-secondary button-sm" data-back-course="1"><i class="ti ti-arrow-left"></i> ${cLbl.backCourse}</button>
<h4>${cLbl.step} ${idx + 1} · ${jnEscapeHtml(st.title)}</h4>
<span class="ex-step-right">${activeStepTotal} ${cLbl.exercises}</span></div>`;
    container.innerHTML = picked.map(item => {
      const withId = Object.assign({}, item, { exid: (item.exid || 'ex') + '-' + uid() });
      return renderItemHTML(withId);
    }).join('');
    if(resumable && Array.isArray(saved.done)){
      const bloques = [...container.querySelectorAll('.exercise-block')];
      bloques.forEach((b, i) => {
        if(!saved.done[i]) return;
        b.classList.add('is-done');
        const fb = b.querySelector('.exercise-feedback');
        // el "Completado" con su icono ya sale solo en la chapa de arriba al
        // poner is-done; aquí va la frase de acierto, como cuando lo contestó
        if(fb){ fb.textContent = window.jnPraise(); fb.className = 'exercise-feedback correct'; }
      });
    }
    saveStepState();
    if(courseView.scrollIntoView) courseView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finishStep(){
    const course = activeCourse, idx = activeStepIdx;
    const total = course.steps.length;
    const before = doneSet(course.key).size;
    markStepDone(course.key, course.steps[idx].id);
    const after = doneSet(course.key).size;
    const complete = after >= total;
    activeStepIdx = null; activeStepTotal = 0; activeStepItems = [];
    clearStepState();
    container.innerHTML = '';

    let nextIdx = -1;
    const done = doneSet(course.key);
    for(let i = 0; i < total; i++){ if(!done.has(course.steps[i].id)){ nextIdx = i; break; } }

    const nextHTML = (!complete && nextIdx >= 0)
      ? `<div class="ex-signal-next"><span>${cLbl.next}</span>
<p>${cLbl.step} ${nextIdx + 1} · ${jnEscapeHtml(course.steps[nextIdx].title)}</p></div>`
      : '';
    const btns = (!complete && nextIdx >= 0)
      ? `<button class="ex-signal-go" data-step="${nextIdx}">${cLbl.cont}</button>
<button class="ex-signal-stop" data-back-course="1">${cLbl.stop}</button>`
      : `<button class="ex-signal-go" data-back-route="1">${cLbl.backRoute}</button>`;

    courseView.innerHTML = `<div class="ex-signal" style="${cssVars(course)}">
<div class="ex-signal-tick">${complete ? '<i class="ti ti-trophy" aria-hidden="true"></i>' : TICK}</div>
<h4>${complete ? cLbl.courseDone : cText('stepDone', { n: idx + 1 })}</h4>
<p class="ex-signal-sub">${complete ? cText('courseDoneSub', { c: course.name }) : jnEscapeHtml(course.steps[idx].title)}</p>
<div class="ex-signal-count">${after} ${cLbl.of} ${total} ${cLbl.steps}</div>
<div class="ex-course-bar"><i id="ex-signal-bar" style="width:${Math.round(before / total * 100)}%"></i></div>
${nextHTML}<div class="ex-signal-btns">${btns}</div></div>`;

    // la barra se mueve DELANTE de sus ojos: ese movimiento es la recompensa
    const bar = document.getElementById('ex-signal-bar');
    if(bar) requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.width = Math.round(after / total * 100) + '%';
    }));
    if(courseView.scrollIntoView) courseView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // un paso se da por hecho cuando TODOS sus ejercicios están acertados;
  // el contador global ya avisa cada vez que se acierta uno
  document.addEventListener('jn-counter-updated', function(){
    if(!activeCourse || activeStepIdx === null || !activeStepTotal) return;
    const ok = container.querySelectorAll('.exercise-block.is-done').length;
    if(ok >= activeStepTotal) finishStep(); else saveStepState();
  });

  if(courseView){
    courseView.addEventListener('click', function(e){
      const resume = e.target.closest('[data-resume]');
      if(resume){
        const c = courseByKey(resume.dataset.resume);
        if(c) startStep(c, parseInt(resume.dataset.step, 10));
        return;
      }
      if(e.target.closest('[data-back-route]')){ renderRoute(); return; }
      if(e.target.closest('[data-back-course]')){ renderCourse(activeCourse); return; }
      const card = e.target.closest('[data-course]');
      if(card){
        const c = courseByKey(card.dataset.course);
        if(c) renderCourse(c);
        return;
      }
      const step = e.target.closest('[data-step]');
      if(step && activeCourse){ startStep(activeCourse, parseInt(step.dataset.step, 10)); }
    });
  }

  function showMode(mode){
    if(modeGrid) modeGrid.style.display = 'none';
    if(panelNivel) panelNivel.style.display = mode === 'nivel' ? '' : 'none';
    if(panelTema) panelTema.style.display = mode === 'tema' ? '' : 'none';
    if(panelCurso) panelCurso.style.display = mode === 'curso' ? '' : 'none';
    if(mode === 'curso') renderRoute();
    if(hubToolbar) hubToolbar.style.display = mode === 'tema' ? '' : 'none'; // "generar otra tanda" no tiene sentido en un recorrido por nivel
  }

  function backToModeChoice(){
    mixMode = false;
    activeLevel = null;
    activeLevelCategory = null;
    activeCategory = null;
    activeTopics.clear();
    limpiaGrupo();
    if(mixBtn) mixBtn.classList.remove('active');
    catBtns.forEach(b => b.classList.remove('active'));
    levelBtns.forEach(b => b.classList.remove('active'));
    step2.style.display = 'none';
    if(levelCatStep) levelCatStep.style.display = 'none';
    if(levelExamStep) levelExamStep.style.display = 'none';
    container.innerHTML = '';
    if(modeGrid) modeGrid.style.display = '';
    if(panelNivel) panelNivel.style.display = 'none';
    if(panelTema) panelTema.style.display = 'none';
    if(panelCurso) panelCurso.style.display = 'none';
    activeCourse = null;
    activeStepIdx = null;
    activeStepTotal = 0;
    if(courseView) courseView.innerHTML = '';
    if(hubToolbar) hubToolbar.style.display = 'none';
    endExam(false);
  }

  modeCards.forEach(btn => {
    btn.addEventListener('click', () => showMode(btn.dataset.mode));
  });
  modeBackBtns.forEach(btn => {
    btn.addEventListener('click', backToModeChoice);
  });

  renderLevelDonuts();
  renderGlobalCounter();
  renderLevelFilterPills();

  // preselecciona un tema si se llega desde el botón "ponte a prueba" de una página de contenido
  const params = new URLSearchParams(location.search);
  const tema = params.get('tema');
  if(tema && cfg.topics[tema] && topicToCat[tema]){
    showMode('tema');
    selectCategory(topicToCat[tema].key);
    activeTopics.add(tema);
    // &g=por-para acota la tanda a ese sub-grupo dentro del tema
    const grupo = params.get('g');
    if(grupo && collectPool([tema]).some(it => it.g === grupo)) activeGroup = grupo;
    pintaGrupo();
    renderPills();
    render();
  }

  // ?curso=vivir[&paso=4] — así se le manda un deber concreto a un alumno
  const cursoParam = params.get('curso');
  if(cursoParam){
    const c = courseByKey(cursoParam);
    if(c){
      showMode('curso');
      // el paso se identifica por su id ("ser-estar"), que no se mueve aunque
      // reordenemos el curso; los enlaces viejos traen el número de posición
      const paso = params.get('paso') || '';
      let i = c.steps.findIndex(st => st.id === paso);
      if(i < 0){
        const n = parseInt(paso, 10);
        if(n >= 1 && n <= c.steps.length) i = n - 1;
      }
      if(i >= 0) startStep(c, i);
      else renderCourse(c);
    }
  }
})();

// --- Frase motivadora aleatoria del menú lateral ---
(function(){
  const el = document.getElementById('tagline-text');
  if(!el) return;
  const REFRANES = [
    'Poco a poco se llega lejos',
    'El que la sigue, la consigue',
    'No hay atajo sin trabajo',
    'Quien no arriesga, no gana',
    'Practicando se aprende el oficio',
    'El saber no ocupa lugar',
    'A quien madruga, Dios le ayuda',
    'Más vale tarde que nunca',
  ];
  el.textContent = REFRANES[Math.floor(Math.random() * REFRANES.length)];
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

// --- Titulo escrito a mano por seccion (traducido segun el idioma activo) ---
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
    profesional: {es:'Profesional', it:'Professionale', en:'Business'},
    clases: {es:'Mis clases', it:'Le mie lezioni', en:'My classes'}
  };
  const l = labels[cat];
  if(!l) return;
  const track = window.jnIdioma();
  const span = document.createElement('span');
  span.className = 'handwritten-title i18n';
  span.dataset.es = l.es; span.dataset.it = l.it; span.dataset.en = l.en;
  span.textContent = l[track] || l.es;
  header.insertBefore(span, header.firstChild);
})();

// --- Alinear las pestañas del navegador con sus secciones reales ---
(function(){
  const rail = document.querySelector('.tab-rail');
  if(!rail) return;
  function align(){
    rail.querySelectorAll('.rail-tab').forEach(tab => {
      const cat = tab.dataset.tabCat;
      const btn = document.querySelector(`.menu-item > .menu-button:has(.cat-${cat})`);
      if(!btn) return;
      const rect = btn.getBoundingClientRect();
      tab.style.top = (rect.top + rect.height / 2) + 'px';
    });
  }
  align();
  window.addEventListener('resize', align);
  document.addEventListener('click', (e) => {
    if(e.target.closest('.menu-button')) requestAnimationFrame(align); // el menú desplegado cambia de alto
  });
  setTimeout(align, 300); // por si las fuentes cambian la altura del menú al cargar
})();

// --- Botón de mostrar/ocultar menú lateral ---
(function(){
  const btn = document.getElementById('sidebar-toggle');
  if(!btn) return;
  if(localStorage.getItem('jn_sidebar_collapsed') === 'true'){
    document.body.classList.add('sidebar-collapsed');
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('jn_sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
  });
})();

// --- Carrusel de reseñas (portada) ---
(function(){
  const track = document.getElementById('reviews-track');
  if(!track) return;
  const cards = [...track.children];
  const perPage = 2;
  const pages = Math.ceil(cards.length / perPage);
  const dotsWrap = document.getElementById('reviews-dots');
  const prevBtn = document.querySelector('.reviews-prev');
  const nextBtn = document.querySelector('.reviews-next');
  let index = 0;

  dotsWrap.innerHTML = Array.from({length: pages}, (_, i) => `<button class="dot-btn" data-i="${i}"></button>`).join('');
  const dots = [...dotsWrap.children];

  function update(){
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function go(delta){
    index = (index + delta + pages) % pages;
    update();
  }
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  dots.forEach(d => d.addEventListener('click', () => { index = parseInt(d.dataset.i); update(); }));
  update();
})();

// --- Buscador del menú lateral (busca en el texto real de cada página) ---
(function(){
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  if(!input || !results) return;

  // El índice (search-index.js, ~170KB) no se carga hasta que el usuario toca el buscador
  let indexPromise = null;
  function loadIndex(){
    if(!indexPromise){
      indexPromise = new Promise((resolve, reject) => {
        if(window.SEARCH_INDEX){ resolve(); return; }
        const s = document.createElement('script');
        s.src = 'search-index.js?v=ab5c63070a';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return indexPromise;
  }

  function normalize(s){
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function trackOf(url){
    const m = url.match(/-(it|en|es)\.html$/);
    return m ? m[1] : null;
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
      return normalize(entry.title).includes(q) || normalize(entry.text).includes(q);
    });

    // prioriza coincidencias en el título
    matches.sort((a, b) => {
      const aTitle = normalize(a.title).includes(q) ? 0 : 1;
      const bTitle = normalize(b.title).includes(q) ? 0 : 1;
      return aTitle - bTitle;
    });
    matches = matches.slice(0, 10);

    if(!matches.length){
      results.innerHTML = '<div class="search-empty">Sin resultados para "' + qRaw + '"</div>';
    } else {
      const FLAGS = { es: '🇪🇸', it: '🇮🇹', en: '🇬🇧' };
      results.innerHTML = matches.map(entry => {
        const inTitle = normalize(entry.title).includes(q);
        const snippet = inTitle ? '' : `<span class="search-snippet">${snippetAround(entry.text, normalize(entry.text), q)}</span>`;
        // sin idioma elegido, varias páginas (ES/IT/EN) pueden compartir título — se añade la bandera para distinguirlas
        const t = trackOf(entry.url);
        const flag = (!currentTrack && t && FLAGS[t]) ? FLAGS[t] + ' ' : '';
        return `<a href="${entry.url}"><span class="search-title">${flag}${entry.title}</span>${snippet}</a>`;
      }).join('');
    }
    results.classList.add('active');
  }

  input.addEventListener('focus', () => loadIndex().then(() => render(input.value)));
  input.addEventListener('input', () => loadIndex().then(() => render(input.value)));
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.sidebar-search')){ results.classList.remove('active'); }
  });
})();
