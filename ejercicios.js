// El hub de ejercicios: solo lo cargan ejercicios-es/-it/-en.html.
//
// Vivía dentro de script.js, que se descarga en todas las páginas de la web:
// eran unos 82 KB —más de la mitad del archivo— que el navegador bajaba y
// leía en cada página de teoría, en cada clase y en la portada para no usar
// ni una línea. Aquí está tal cual, sin tocar: va detrás de script.js, que
// es quien pone lo que esto usa (jnEscapeHtml, jnIdioma, jnPraise, el motor
// que corrige los ejercicios…), y de clases.js y temas.js.
/* global jnEscapeHtml */

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

  // ── Repaso de una clase ────────────────────────────────────────────────
  // José le pone a un alumno «repaso de la clase X» desde el panel, y eso es
  // un enlace a ejercicios-??.html?repaso=X. La tanda sale de los temas que
  // esa clase lleva escritos en clases.js, mezclados en una sola serie
  // aunque sean de categorías distintas: el resto del hub no sabe hacer eso
  // porque sus temas van siempre dentro de una materia.
  let repasoClase = null;

  const REPASO_T = {
    es: { eyebrow: 'Repaso', de: 'Repaso de', teoria: 'Ver la teoría de esta clase',
          vacio: 'Esta clase todavía no tiene ejercicios de repaso.' },
    it: { eyebrow: 'Ripasso', de: 'Ripasso di', teoria: 'Vedi la teoria di questa lezione',
          vacio: 'Questa lezione non ha ancora esercizi di ripasso.' },
    en: { eyebrow: 'Review', de: 'Review of', teoria: 'See the theory for this class',
          vacio: 'This class has no review exercises yet.' }
  };
  function repasoLabels(){ return REPASO_T[cfg.lang] || REPASO_T.es; }

  function poolRepaso(){
    const c = window.jnClasePorId && window.jnClasePorId(repasoClase);
    const pool = [], vistos = new Set();
    ((c && c.temas) || []).forEach(id => {
      const t = window.jnTemaPorId && window.jnTemaPorId(id);
      if(!t) return;
      let items = collectPool([t.ejercicios || t.id]);
      // un tema fino —por/para— vive dentro de otro: hay que acotarlo
      if(t.g) items = items.filter(it => it.g === t.g);
      items.forEach(it => {
        // dos clases pueden mandar al mismo tema: el mismo ejercicio no se
        // pone dos veces en la misma tanda
        const clave = (it.prompt || '') + '|' + (it.answer || '');
        if(vistos.has(clave)) return;
        vistos.add(clave);
        pool.push(it);
      });
    });
    return pool;
  }

  function pintaCabeceraRepaso(){
    const c = window.jnClasePorId && window.jnClasePorId(repasoClase);
    if(!c || !container) return;
    const L = repasoLabels();
    const titulo = (c.titulo && (c.titulo[cfg.lang] || c.titulo.es)) || '';
    const chips = (c.temas || []).map(id => {
      const t = window.jnTemaPorId && window.jnTemaPorId(id);
      const nom = (t && t.nombre && (t.nombre[cfg.lang] || t.nombre.es)) || id;
      return '<span class="ex-repaso-chip">' + nom + '</span>';
    }).join('');
    // la teoría está en su clase, y solo si esa clase existe en esta pista
    const hay = !c.pistas || c.pistas.indexOf(cfg.lang) >= 0;
    const teoria = hay
      ? '<a class="ex-repaso-teoria" href="' + c.pagina + '-' + cfg.lang + '.html">' +
        '<i class="ti ti-book-2" aria-hidden="true"></i> ' + L.teoria + '</a>'
      : '';
    let caja = document.getElementById('ex-repaso');
    if(!caja){
      caja = document.createElement('div');
      caja.id = 'ex-repaso';
      caja.className = 'ex-repaso';
      container.parentNode.insertBefore(caja, container);
    }
    caja.innerHTML = '<span class="eyebrow">' + L.eyebrow + '</span>' +
      '<h4>' + L.de + ' «' + titulo + '»</h4>' +
      '<div class="ex-repaso-chips">' + chips + '</div>' + teoria;
  }

  // Si toca cualquier otro modo, el repaso se acaba: si no, la tanda seguiría
  // saliendo del repaso y parecería que los botones no hacen nada.
  function saleDeRepaso(){
    if(!repasoClase) return;
    repasoClase = null;
    const caja = document.getElementById('ex-repaso');
    if(caja) caja.remove();
    if(panelTema){
      const grid = panelTema.querySelector('.ex-category-grid');
      const lab = panelTema.querySelector('.ex-step-label');
      if(grid) grid.style.display = '';
      if(lab) lab.style.display = '';
    }
  }

  function entraRepaso(id){
    repasoClase = id;
    showMode('tema');
    // en repaso no se elige materia ni tema: ya los eligió él al mandarlo
    if(panelTema){
      const grid = panelTema.querySelector('.ex-category-grid');
      const lab = panelTema.querySelector('.ex-step-label');
      if(grid) grid.style.display = 'none';
      if(lab) lab.style.display = 'none';
    }
    if(step2) step2.style.display = 'none';
    pintaCabeceraRepaso();
    render();
  }

  function render(){
    if(repasoClase){
      let pool = poolRepaso();
      // las chapas de nivel se ven, así que tienen que funcionar aquí también
      if(activeLevelsFilter.size) pool = pool.filter(it => activeLevelsFilter.has(it.level));
      const picked = sample(pool, Math.min(12, pool.length));
      container.innerHTML = picked.map(item => renderItemHTML(
        Object.assign({}, item, { exid: (item.exid || 'ex') + '-' + uid() })
      )).join('') || '<p class="subtitle">' + repasoLabels().vacio + '</p>';
      return;
    }
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
    saleDeRepaso();
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
      saleDeRepaso();
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
    saleDeRepaso();
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

  // ?repaso=presente — la clase de la que se repasa. El id es el de clases.js
  const repasoParam = params.get('repaso');
  if(repasoParam && window.jnClasePorId && window.jnClasePorId(repasoParam)){
    entraRepaso(repasoParam);
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
