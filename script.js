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

// Resalta el enlace de la página actual en el menú lateral y abre su submenú
(function(){
const current=location.pathname.split("/").pop()||"index.html";
document.querySelectorAll(".submenu a").forEach(a=>{
const href=a.getAttribute("href");
if(href===current){
a.classList.add("current-page");
a.closest(".menu-item").classList.add("active","current-section");
}
});
// las de "Verbos" no tienen href real (son track-link con data-base), así que se comparan por patrón base-it.html / base-en.html
const m = current.match(/^(.+)-(it|en)\.html$/);
if(m){
document.querySelectorAll(".submenu a.track-link").forEach(a=>{
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
      const m = current.match(/^(.+)-(it|en)\.html$/);
      if(m && m[2] !== t){
        window.location.href = m[1] + '-' + t + '.html';
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
  const CORRECT_MSGS = ['¡Muy bien!','¡Perfecto!','¡Excelente!','¡Así se hace!','¡Genial, sigue así!','¡Correcto!'];
  const INCORRECT_MSGS = ['Casi, prueba otra vez','No es eso, ¡tú puedes!','Sigue intentando','Revísalo con calma'];
  const pageKey = 'ex_done_' + (location.pathname.split('/').pop() || 'home');

  function getDone(){
    try { return JSON.parse(localStorage.getItem(pageKey) || '[]'); } catch(e){ return []; }
  }
  function markDone(id){
    const done = getDone();
    if(!done.includes(id)){ done.push(id); localStorage.setItem(pageKey, JSON.stringify(done)); }
    updateProgress();
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

  function showFeedback(block, ok){
    const fb = block.querySelector('.exercise-feedback');
    if(!fb) return;
    if(ok){
      fb.textContent = randomOf(CORRECT_MSGS);
      fb.className = 'exercise-feedback correct';
      block.classList.add('is-done');
      markDone(block.dataset.exid);
    } else {
      const answer = block.dataset.answer.split('|')[0];
      fb.textContent = randomOf(INCORRECT_MSGS) + ' (respuesta: ' + answer + ')';
      fb.className = 'exercise-feedback incorrect';
    }
  }

  function checkTextAnswer(block){
    const input = block.querySelector('.exercise-input');
    if(!input) return;
    const accepted = block.dataset.answer.split('|').map(s => s.trim().toLowerCase());
    const val = input.value.trim().toLowerCase();
    showFeedback(block, accepted.includes(val));
  }

  document.addEventListener('click', function(e){
    const checkBtn = e.target.closest('.exercise-check');
    if(checkBtn){
      checkTextAnswer(checkBtn.closest('.exercise-block'));
      return;
    }
    const optBtn = e.target.closest('.option-btn');
    if(optBtn){
      const block = optBtn.closest('.exercise-block');
      const correct = block.dataset.answer.trim().toLowerCase();
      const chosen = optBtn.dataset.value.trim().toLowerCase();
      block.querySelectorAll('.option-btn').forEach(b => b.classList.remove('correct','incorrect'));
      if(chosen === correct){
        optBtn.classList.add('correct');
      } else {
        optBtn.classList.add('incorrect');
        const rightBtn = [...block.querySelectorAll('.option-btn')].find(b => b.dataset.value.trim().toLowerCase() === correct);
        if(rightBtn) rightBtn.classList.add('correct');
      }
      showFeedback(block, chosen === correct);
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
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${answer}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">${prompt}</p>
<div class="exercise-row"><input type="text" class="exercise-input" placeholder="Escribe la respuesta"><button class="exercise-check">Comprobar</button></div>
<p class="exercise-feedback"></p></div>`;
  }
  function choiceHtml(exid, prompt, options, answer, kicker){
    const opts = options.map(o => `<button class="option-btn" data-value="${o}">${o}</button>`).join('');
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${answer}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">${prompt}</p>
<div class="exercise-options">${opts}</div>
<p class="exercise-feedback"></p></div>`;
  }
  function translateHtml(exid, promptSentence, answer, kicker, verb){
    return `<div class="exercise-block" data-exid="${exid}" data-answer="${answer}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge"><i class="ti ti-check"></i> Completado</span></div>
<p class="exercise-prompt">Traduce: <em>${promptSentence}</em></p>
<div class="exercise-row"><input type="text" class="exercise-input" placeholder="Escribe la traducción"><button class="exercise-check">Comprobar</button></div>
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

// --- Puerta de acceso para alumnos (comprueba el email contra un Google Sheet publicado como CSV) ---
(function(){
  const ACCESS_GATE_ENABLED = true; // ponlo en true cuando publiques la web de verdad
  const ACCESS_KEY = 'jn_access_granted';

  if(!ACCESS_GATE_ENABLED) return;

  // 1) Crea un Google Sheet con una columna de emails autorizados (uno por fila).
  // 2) Archivo > Compartir > Publicar en la Web > elige esa hoja > formato CSV > Publicar.
  // 3) Copia la URL que te da Google y pégala aquí abajo, reemplazando el valor de ejemplo.
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTp3ALVArrf67RDanwYo7f9EA7dxBF3FDmi6qvXeB7MDJn2ApcV4kICTxJ-d-OGX4mz0ibXXELGdZNu/pub?gid=0&single=true&output=csv';

  if(localStorage.getItem(ACCESS_KEY) === 'true') return;

  const overlay = document.createElement('div');
  overlay.className = 'access-gate-overlay';
  overlay.innerHTML = `
    <div class="access-gate-modal">
      <div class="logo-mark">🇪🇸 Aprende Español</div>
      <h3>Acceso para alumnos</h3>
      <p>Escribe el email con el que reservas tus clases para entrar.</p>
      <input type="email" class="access-gate-input" placeholder="tu@email.com" autocomplete="email">
      <button class="access-gate-btn">Entrar</button>
      <p class="access-gate-error"></p>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.access-gate-input');
  const btn = overlay.querySelector('.access-gate-btn');
  const errorEl = overlay.querySelector('.access-gate-error');

  function attempt(){
    const email = input.value.trim().toLowerCase();
    if(!email){ errorEl.textContent = 'Escribe tu email.'; return; }

    if(SHEET_CSV_URL === 'PEGA_AQUI_TU_URL_CSV_DE_GOOGLE_SHEETS'){
      errorEl.textContent = 'Aún no se ha configurado la lista de alumnos (falta pegar la URL del Google Sheet en script.js).';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Comprobando...';
    fetch(SHEET_CSV_URL)
      .then(r => r.text())
      .then(csv => {
        const emails = csv.split('\n').map(line => line.split(',')[0].trim().toLowerCase()).filter(Boolean);
        if(emails.includes(email)){
          localStorage.setItem(ACCESS_KEY, 'true');
          document.body.removeChild(overlay);
        } else {
          errorEl.textContent = 'Ese email no está en la lista. Escribe a Jose si crees que es un error.';
          btn.disabled = false;
          btn.textContent = 'Entrar';
        }
      })
      .catch(() => {
        errorEl.textContent = 'No se pudo comprobar el acceso. Inténtalo de nuevo.';
        btn.disabled = false;
        btn.textContent = 'Entrar';
      });
  }

  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if(e.key === 'Enter') attempt(); });
})();

// --- Hub de ejercicios: filtra por tema o por nivel, y regenera ---
(function(){
  if(!window.EXERCISE_HUB_CONFIG) return; // esta página no es el hub de ejercicios

  const cfg = window.EXERCISE_HUB_CONFIG; // { topics: {key:{label, items:[...] , generator?}}, labels:{...} }
  const container = document.getElementById('ex-hub-container');
  const topicBtns = document.querySelectorAll('.ex-topic-btn');
  const levelBtns = document.querySelectorAll('.ex-level-btn');
  const generateBtn = document.getElementById('ex-hub-generate');
  let activeTopics = new Set(); // empty = todas
  let activeLevel = null; // 'A1'|'A2'|'B1'|null

  function kickerFor(type){
    return type === 'fill' ? cfg.labels.kickerFill : type === 'choice' ? cfg.labels.kickerChoice : cfg.labels.kickerTranslate;
  }

  function renderItemHTML(item){
    const kicker = kickerFor(item.type);
    if(item.type === 'choice'){
      const opts = item.options.map(o => `<button class="option-btn" data-value="${o}">${o}</button>`).join('');
      return `<div class="exercise-block" data-exid="${item.exid}" data-answer="${item.answer}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>
<div class="exercise-options">${opts}</div>
<p class="exercise-feedback"></p></div>`;
    }
    const placeholder = item.type === 'translate' ? cfg.labels.placeholderTranslate : cfg.labels.placeholderFill;
    return `<div class="exercise-block" data-exid="${item.exid}" data-answer="${item.answer}">
<div class="exercise-kicker"><span>${kicker}</span><span class="exercise-done-badge">${cfg.labels.done}</span></div>
<p class="exercise-prompt">${item.prompt}</p>
<div class="exercise-row"><input type="text" class="exercise-input" placeholder="${placeholder}"><button class="exercise-check">${cfg.labels.check}</button></div>
<p class="exercise-feedback"></p></div>`;
  }

  function uid(){ return Math.random().toString(36).slice(2,9); }

  function collectPool(){
    let pool = [];
    const topicKeys = activeTopics.size ? [...activeTopics] : Object.keys(cfg.topics);
    topicKeys.forEach(key => {
      const topic = cfg.topics[key];
      if(!topic) return;
      if(topic.generator && window.generateRegularVerbItems){
        pool = pool.concat(window.generateRegularVerbItems(activeLevel, cfg.lang));
      } else if(topic.items){
        const filtered = activeLevel ? topic.items.filter(i => i.level === activeLevel) : topic.items;
        pool = pool.concat(filtered);
      }
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

  function render(){
    const pool = collectPool();
    const picked = sample(pool, Math.min(12, pool.length));
    container.innerHTML = picked.map(item => {
      const withId = Object.assign({}, item, { exid: (item.exid||'ex') + '-' + uid() });
      return renderItemHTML(withId);
    }).join('') || `<p class="subtitle">${cfg.labels.empty}</p>`;
  }

  topicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.topic;
      if(activeTopics.has(key)){ activeTopics.delete(key); btn.classList.remove('active'); }
      else { activeTopics.add(key); btn.classList.add('active'); }
      render();
    });
  });

  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = btn.dataset.level;
      if(activeLevel === lvl){ activeLevel = null; }
      else { activeLevel = lvl; }
      levelBtns.forEach(b => b.classList.toggle('active', b.dataset.level === activeLevel));
      render();
    });
  });

  if(generateBtn) generateBtn.addEventListener('click', render);

  // preselecciona un tema si se llega desde el botón "ponte a prueba" de una página de contenido
  const params = new URLSearchParams(location.search);
  const tema = params.get('tema');
  if(tema && cfg.topics[tema]){
    activeTopics.add(tema);
    const btn = document.querySelector(`.ex-topic-btn[data-topic="${tema}"]`);
    if(btn) btn.classList.add('active');
  }

  render();
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

// --- Buscador del menú lateral (busca en el texto real de cada página) ---
(function(){
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  if(!input || !results) return;
  if(!window.SEARCH_INDEX) return; // esta página no cargó el índice

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
      results.innerHTML = matches.map(entry => {
        const inTitle = normalize(entry.title).includes(q);
        const snippet = inTitle ? '' : `<span class="search-snippet">${snippetAround(entry.text, normalize(entry.text), q)}</span>`;
        return `<a href="${entry.url}"><span class="search-title">${entry.title}</span>${snippet}</a>`;
      }).join('');
    }
    results.classList.add('active');
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('focus', () => { if(input.value) render(input.value); });
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.sidebar-search')){ results.classList.remove('active'); }
  });
})();
