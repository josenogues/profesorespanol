// Panel del profesor: muestra el progreso de los alumnos leyendo la
// colección "students" de Firestore. La puerta de contraseña vive en un
// script clásico dentro de panel-profesor.html (para que funcione aunque
// este módulo tarde en cargar o Firebase no esté disponible) y avisa a
// este módulo mediante el evento "jn-panel-unlocked".

import { app } from "./firebase-init.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function esc(s){
  return String(s == null ? '' : s).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
}

function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('jnPanel: timeout (' + label + ')')), ms))
  ]);
}

const statsEl = document.getElementById('panel-stats');
const bodyEl = document.getElementById('panel-table-body');
const loadingEl = document.getElementById('panel-loading');
const refreshBtn = document.getElementById('panel-refresh');

// Señal para panel-profesor.html: si este módulo ha llegado a cargar (y por
// tanto loadStudents responderá al desbloqueo o al botón "Actualizar"),
// aunque la propia carga de datos luego falle o tarde.
window.jnPanelHandled = true;

let autoLoadDone = false;
function autoLoad(){
  if(autoLoadDone) return;
  autoLoadDone = true;
  loadStudents();
}

document.addEventListener('jn-panel-unlocked', autoLoad, { once: true });

// La puerta vive en un <script> clásico, que se ejecuta ANTES que este módulo
// (los módulos van diferidos). Al recargar con la sesión ya desbloqueada, la
// puerta lanza "jn-panel-unlocked" cuando aquí todavía no estábamos
// escuchando, y el panel se quedaba en "Cargando..." para siempre. Por eso
// comprobamos también el estado directamente.
if(sessionStorage.getItem('jn_panel_unlocked') === 'true') autoLoad();

function formatDate(ts){
  if(!ts || typeof ts.toDate !== 'function') return '—';
  const d = ts.toDate();
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Los cursos, para poder poner el nombre en vez de la clave. El total de pasos
// lo escribe la web junto al progreso (courseTotals), porque no es el mismo en
// todas las pistas: "Vivir en España" tiene 15 pasos en español y 16 en
// italiano y en inglés.
const COURSE_NAMES = {
  'primeros-pasos': 'Primeros pasos',
  'viajar': 'Español para viajar',
  'vivir': 'Vivir en España',
  'profesional': 'Español profesional'
};

function courseChips(student){
  const prog = student.courseProgress;
  if(!prog) return [];
  const totals = student.courseTotals || {};
  return Object.keys(prog).map(key => {
    const done = Array.isArray(prog[key]) ? prog[key].length : 0;
    if(!done) return null;
    const total = totals[key];
    return {
      name: COURSE_NAMES[key] || key,
      done,
      total: total || null,
      complete: !!total && done >= total
    };
  }).filter(Boolean).sort((a, b) => b.done - a.done);
}

function passedLevels(levelStatus){
  const chips = [];
  if(!levelStatus) return chips;
  for(const lang of Object.keys(levelStatus)){
    const levels = levelStatus[lang] || {};
    for(const level of Object.keys(levels)){
      if(levels[level] && levels[level].passed) chips.push(lang.toUpperCase() + ' ' + level);
    }
  }
  return chips;
}

async function loadStudents(){
  loadingEl.textContent = 'Cargando...';
  loadingEl.style.display = 'block';
  statsEl.innerHTML = '';
  bodyEl.innerHTML = '';
  refreshBtn.disabled = true;
  try {
    const auth = getAuth(app);
    await withTimeout(signInAnonymously(auth), 8000, 'auth');
    const db = getFirestore(app);
    const snap = await withTimeout(getDocs(collection(db, 'students')), 10000, 'getDocs');

    const students = [];
    snap.forEach(docSnap => students.push(docSnap.data()));

    if(students.length === 0){
      loadingEl.textContent = 'Todavía no hay alumnos registrados.';
      refreshBtn.disabled = false;
      return;
    }

    students.sort((a, b) => {
      const ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0;
      const tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0;
      return tb - ta;
    });

    const totalStudents = students.length;
    const totalExercises = students.reduce((sum, s) => sum + (s.exerciseCount || 0), 0);
    const totalPasses = students.reduce((sum, s) => sum + passedLevels(s.levelStatus).length, 0);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeThisWeek = students.filter(s => s.updatedAt && s.updatedAt.toMillis && s.updatedAt.toMillis() > weekAgo).length;
    const onlyVisited = students.filter(s => (s.visitCount || 0) > 0 && !(s.exerciseCount || 0)).length;
    const allChips = students.map(courseChips);
    const totalSteps = allChips.reduce((sum, cs) => sum + cs.reduce((n, c) => n + c.done, 0), 0);
    const doingCourse = allChips.filter(cs => cs.some(c => !c.complete)).length;

    statsEl.innerHTML = [
      ['Alumnos', totalStudents],
      ['Clases asignadas (total)', students.reduce((n, s) => n + (Array.isArray(s.clases) ? s.clases.length : 0), 0)],
      ['Ejercicios hechos (total)', totalExercises],
      ['Pasos de curso hechos (total)', totalSteps],
      ['Con un curso en marcha', doingCourse],
      ['Niveles superados (total)', totalPasses],
      ['Activos últimos 7 días', activeThisWeek],
      ['Solo han visitado (sin ejercicios)', onlyVisited]
    ].map(([label, n]) => `<div class="panel-stat"><div class="n">${esc(n)}</div><div class="l">${esc(label)}</div></div>`).join('');

    porEmail.clear();
    students.forEach(s => { if(s.email) porEmail.set(s.email, s); });

    bodyEl.innerHTML = students.map(s => {
      const chips = passedLevels(s.levelStatus);
      const chipsHtml = chips.length
        ? `<div class="panel-levels">${chips.map(c => `<span class="panel-level-chip">${esc(c)}</span>`).join('')}</div>`
        : '<span class="panel-empty">—</span>';
      const onlyVisits = (s.visitCount || 0) > 0 && !(s.exerciseCount || 0);
      const flag = onlyVisits ? '<span class="panel-flag">Solo visitas</span>' : '';
      const cursos = courseChips(s);
      const cursosHtml = cursos.length
        ? `<div class="panel-levels">${cursos.map(c => {
            const count = c.total ? `${c.done}/${c.total}` : `${c.done} pasos`;
            return `<span class="panel-course-chip${c.complete ? ' done' : ''}">${esc(c.name)} <b>${esc(count)}</b></span>`;
          }).join('')}</div>`
        : '<span class="panel-empty">—</span>';
      const nClases = Array.isArray(s.clases) ? s.clases.length : 0;
      return `<tr>
        <td>${esc(s.email || '—')}${flag}</td>
        <td><button class="button button-secondary button-sm" data-ficha="${esc(s.email || '')}">${nClases} <i class="ti ti-chevron-right"></i></button></td>
        <td>${esc(s.visitCount || 0)}</td>
        <td>${esc(s.exerciseCount || 0)}</td>
        <td>${cursosHtml}</td>
        <td>${chipsHtml}</td>
        <td>${esc(formatDate(s.updatedAt))}</td>
      </tr>`;
    }).join('');

    loadingEl.style.display = 'none';
  } catch(err) {
    loadingEl.textContent = 'No se han podido cargar los datos (revisa la conexión o vuelve a intentarlo). ' + (err && err.message ? err.message : '');
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener('click', loadStudents);

// ─────────────────── Ficha del alumno: asignar clases ───────────────────
// El catálogo (qué clases existen) es código, en clases.js. Aquí solo se
// guarda QUIÉN tiene cada una y con qué fecha. Se escribe el campo "clases"
// y nada más: "updatedAt" es la última actividad DEL ALUMNO y no debe
// moverse porque el profesor abra su ficha.

const porEmail = new Map();
const ficha = document.getElementById('ficha');
const fQuien = document.getElementById('ficha-quien');
const fResumen = document.getElementById('ficha-resumen');
const fSelect = document.getElementById('ficha-clase');
const fFecha = document.getElementById('ficha-fecha');
const fLista = document.getElementById('ficha-lista');
const fEstado = document.getElementById('ficha-estado');

let emailAbierto = null;
let clasesAbiertas = [];

function hoyISO(){
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function tituloDe(id){
  const c = window.jnClasePorId && window.jnClasePorId(id);
  return c ? (c.titulo.es || id) : id;
}

function etiquetasDe(id){
  const c = window.jnClasePorId && window.jnClasePorId(id);
  return (c && c.etiquetas) || [];
}

function avisa(txt, tipo){
  if(!fEstado) return;
  fEstado.textContent = txt || '';
  fEstado.className = 'ficha-estado' + (tipo ? ' ' + tipo : '');
}

function pintaFicha(){
  if(!fLista) return;
  const hoy = hoyISO();
  // fechadas primero, de más reciente a más antigua; las sin fecha al final
  const orden = clasesAbiertas.map((c, i) => ({ c, i }))
    .sort((a, b) => {
      if(!a.c.fecha && !b.c.fecha) return 0;
      if(!a.c.fecha) return 1;
      if(!b.c.fecha) return -1;
      return b.c.fecha.localeCompare(a.c.fecha);
    });

  fLista.innerHTML = orden.length ? orden.map(({ c, i }) => {
    const chips = etiquetasDe(c.id).map(t => `<span class="panel-course-chip">${esc(t)}</span>`).join('');
    const pend = c.fecha && c.fecha > hoy;
    return `<div class="fi-row${pend ? ' pend' : ''}">
      <input type="date" class="fi-fecha" data-i="${i}" value="${esc(c.fecha || '')}">
      <div class="fi-tit">${esc(tituloDe(c.id))}</div>
      <div class="fi-chips">${chips}</div>
      <input type="text" class="fi-nota" data-i="${i}" value="${esc(c.nota || '')}"
             placeholder="Nota para ti: cómo fue, qué repetir...">
      <button class="fi-quitar" data-quitar="${i}" title="Quitar de su lista">×</button>
    </div>`;
  }).join('') : '<p class="panel-empty">Todavía no tiene ninguna clase asignada.</p>';

  const n = clasesAbiertas.length;
  if(fResumen) fResumen.textContent = n === 1 ? '1 clase asignada' : n + ' clases asignadas';
}

async function guarda(){
  if(!emailAbierto) return;
  avisa('Guardando...');
  try {
    const db = getFirestore(app);
    // sin updatedAt: ese campo es la actividad del alumno, no la mía
    await withTimeout(setDoc(doc(db, 'students', emailAbierto),
      { clases: clasesAbiertas, email: emailAbierto }, { merge: true }), 8000, 'setDoc');
    const s = porEmail.get(emailAbierto);
    if(s) s.clases = clasesAbiertas.slice();
    avisa('Guardado.', 'ok');
    setTimeout(() => avisa(''), 2000);
  } catch(err) {
    avisa('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

function abreFicha(email){
  const s = porEmail.get(email);
  if(!s || !ficha) return;
  emailAbierto = email;
  clasesAbiertas = Array.isArray(s.clases) ? s.clases.map(c => Object.assign({}, c)) : [];
  if(fQuien) fQuien.textContent = email;
  if(fSelect){
    fSelect.innerHTML = (window.JN_CLASES || [])
      .map(c => `<option value="${esc(c.id)}">${esc(c.titulo.es)}</option>`).join('')
      || '<option value="">(todavía no hay clases en el catálogo)</option>';
  }
  if(fFecha) fFecha.value = hoyISO();
  avisa('');
  pintaFicha();
  ficha.style.display = 'block';
  ficha.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-ficha]');
  if(btn){ abreFicha(btn.dataset.ficha); return; }

  const cerrar = e.target.closest('#ficha-cerrar');
  if(cerrar){ ficha.style.display = 'none'; emailAbierto = null; return; }

  const add = e.target.closest('#ficha-add');
  if(add){
    const id = fSelect && fSelect.value;
    if(!id){ avisa('No hay ninguna clase que añadir.', 'mal'); return; }
    if(clasesAbiertas.some(c => c.id === id)){
      avisa('Esa clase ya está en su lista.', 'mal');
      return;
    }
    clasesAbiertas.push({ id: id, fecha: (fFecha && fFecha.value) || '', nota: '' });
    pintaFicha();
    guarda();
    return;
  }

  const quitar = e.target.closest('[data-quitar]');
  if(quitar){
    clasesAbiertas.splice(parseInt(quitar.dataset.quitar, 10), 1);
    pintaFicha();
    guarda();
  }
});

// la fecha y la nota se guardan al salir del campo, no en cada tecla
document.addEventListener('change', function(e){
  const f = e.target.closest('.fi-fecha');
  if(f){ clasesAbiertas[+f.dataset.i].fecha = f.value; pintaFicha(); guarda(); return; }
  const n = e.target.closest('.fi-nota');
  if(n){ clasesAbiertas[+n.dataset.i].nota = n.value; guarda(); }
});

// ──────────────────────── Clase rápida ────────────────────────
// Se guarda dentro de la ficha de cada alumno, no en una colección aparte:
// es el único sitio donde ya sabemos que se puede escribir, y una clase
// rápida es por definición de usar y tirar. Si luego merece la pena, se
// asciende al catálogo de clases.js y entonces vive en código.

const rap = document.getElementById('rapida');
const rTitulo = document.getElementById('rap-titulo');
const rBusca = document.getElementById('rap-buscatema');
const rSugs = document.getElementById('rap-sugs');
const rTemas = document.getElementById('rap-temas');
const rEtq = document.getElementById('rap-etiquetas');
const rDeberes = document.getElementById('rap-deberes');
const rAlumnos = document.getElementById('rap-alumnos');
const rFecha = document.getElementById('rap-fecha');
const rVista = document.getElementById('rap-vista');
const rEstado = document.getElementById('rap-estado');

let rSel = [];        // ids de temas marcados
let rMano = [];       // etiquetas puestas a mano
let rQuien = [];      // emails marcados

function normaliza(s){
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function etiquetasAuto(){
  const out = [];
  rSel.forEach(id => {
    const t = window.jnTemaPorId(id);
    (t ? t.etiquetas : []).forEach(e => { if(out.indexOf(e) < 0) out.push(e); });
  });
  return out;
}

function pintaRapida(){
  // temas marcados
  rTemas.innerHTML = rSel.map(id => {
    const t = window.jnTemaPorId(id);
    if(!t) return '';
    return `<div class="rap-tema"><div><b>${esc(t.nombre.es)}</b>
      <div class="r">${t.regla.es}</div></div>
      <button class="rap-x" data-quitatema="${esc(id)}" title="quitar">×</button></div>`;
  }).join('');

  // etiquetas: las de los temas y las tuyas
  rEtq.innerHTML =
    etiquetasAuto().map(e => `<span class="mk-chip">${esc(e)}</span>`).join('') +
    rMano.map(e => `<span class="mk-chip mano">${esc(e)}<b data-quitaetq="${esc(e)}">×</b></span>`).join('');

  // lo que verá el alumno
  const titulo = (rTitulo.value || '').trim();
  const bloques = rSel.map(id => {
    const t = window.jnTemaPorId(id);
    if(!t) return '';
    return `<div class="pv-bloque"><b>${esc(t.nombre.es)}</b><p>${t.regla.es}</p></div>`;
  }).join('');
  const deb = (rDeberes.value || '').trim();
  pintaTodo();
  rVista.innerHTML = (titulo || bloques)
    ? `<h3 class="pv-h3">${esc(titulo || '(sin título: se pondrá la fecha)')}</h3>` +
      `<div class="mk-chips" style="margin-bottom:14px">` +
      etiquetasAuto().concat(rMano).map(e => `<span class="mk-chip">${esc(e)}</span>`).join('') +
      `</div>${bloques}` +
      (deb ? `<div class="pv-deb"><b>Deberes</b><p>${esc(deb)}</p></div>` : '')
    : '<p class="pv-vacio">Marca un tema y aquí aparecerá lo que verá el alumno.</p>';
}

function pintaAlumnos(){
  const emails = [...porEmail.keys()].sort();
  rAlumnos.innerHTML = emails.length
    ? emails.map(e => `<label class="rap-al${rQuien.indexOf(e) >= 0 ? ' on' : ''}">
        <input type="checkbox" data-quien="${esc(e)}"${rQuien.indexOf(e) >= 0 ? ' checked' : ''}> ${esc(e)}</label>`).join('')
    : '<span class="panel-empty">Todavía no hay alumnos.</span>';
}

function sugerencias(q){
  const n = normaliza(q);
  if(!n){ rSugs.classList.remove('on'); rSugs.innerHTML = ''; return; }
  // primero lo que empieza por lo escrito, luego el nombre, luego la etiqueta
  // exacta y al final la regla: si escribes «por» quieres «Por o para», no
  // «Preposiciones» porque en su descripción aparezca la palabra
  function puntos(t){
    const nom = normaliza(t.nombre.es);
    if(nom.startsWith(n)) return 0;
    if(t.etiquetas.some(e => normaliza(e) === n)) return 1;
    if(nom.includes(n)) return 2;
    if(t.etiquetas.some(e => normaliza(e).includes(n))) return 3;
    if(normaliza(t.regla.es).includes(n)) return 4;
    return 9;
  }
  const hits = (window.JN_TEMAS || [])
    .filter(t => rSel.indexOf(t.id) < 0 && puntos(t) < 9)
    .sort((a, b) => puntos(a) - puntos(b) || a.nombre.es.localeCompare(b.nombre.es))
    .slice(0, 8);
  rSugs.innerHTML = hits.map(t =>
    `<button data-tema="${esc(t.id)}">${esc(t.nombre.es)}<span class="cat">${esc(t.cat)}</span></button>`).join('')
    || '<button disabled style="color:var(--muted)">Ningún tema con eso</button>';
  rSugs.classList.add('on');
}

// La lista entera, por si no tienes claro qué dar: a veces viendo las
// opciones sale la clase sola.
const CATS = { verbos:'Verbos', gramatica:'Gramática', vocabulario:'Vocabulario',
               expresiones:'Expresiones', profesional:'Profesional' };

function pintaTodo(){
  const caja = document.getElementById('rap-todo');
  if(!caja) return;
  caja.innerHTML = Object.keys(CATS).map(cat => {
    const items = (window.JN_TEMAS || []).filter(t => t.cat === cat);
    if(!items.length) return '';
    return `<h5>${esc(CATS[cat])}</h5><div class="lista">` + items.map(t => {
      const ya = rSel.indexOf(t.id) >= 0;
      return `<button type="button" class="${ya ? 'ya' : ''}"${ya ? ' disabled' : ''}
        data-tema="${esc(t.id)}" title="${esc(t.regla.es.replace(/<[^>]+>/g, ''))}">${esc(t.nombre.es)}</button>`;
    }).join('') + '</div>';
  }).join('');
}

function abreRapida(){
  rSel = []; rMano = []; rQuien = [];
  rTitulo.value = ''; rDeberes.value = ''; rBusca.value = '';
  rFecha.value = hoyISO();
  rEstado.textContent = ''; rEstado.className = 'ficha-estado';
  rSugs.classList.remove('on');
  document.getElementById('rap-todo').classList.remove('on');
  pintaAlumnos(); pintaRapida();
  rap.style.display = 'block';
  rap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function guardaRapida(){
  if(!rSel.length){ rEstado.textContent = 'Marca al menos un tema.'; rEstado.className = 'ficha-estado mal'; return; }
  if(!rQuien.length){ rEstado.textContent = '¿A qué alumno se la asigno?'; rEstado.className = 'ficha-estado mal'; return; }
  const clase = {
    rapida: {
      titulo: (rTitulo.value || '').trim(),
      temas: rSel.slice(),
      extra: rMano.slice(),
      deberes: (rDeberes.value || '').trim()
    },
    fecha: rFecha.value || '',
    nota: ''
  };
  rEstado.textContent = 'Guardando...'; rEstado.className = 'ficha-estado';
  try {
    const db = getFirestore(app);
    for(const email of rQuien){
      const s = porEmail.get(email) || {};
      const lista = Array.isArray(s.clases) ? s.clases.slice() : [];
      lista.push(JSON.parse(JSON.stringify(clase)));
      await withTimeout(setDoc(doc(db, 'students', email),
        { clases: lista, email: email }, { merge: true }), 8000, 'setDoc');
      s.clases = lista;
      porEmail.set(email, s);
    }
    rEstado.textContent = 'Asignada a ' + rQuien.length + (rQuien.length === 1 ? ' alumno.' : ' alumnos.');
    rEstado.className = 'ficha-estado ok';
    setTimeout(() => { rap.style.display = 'none'; loadStudents(); }, 1200);
  } catch(err) {
    rEstado.textContent = 'No se ha podido guardar: ' + (err && err.message ? err.message : 'error');
    rEstado.className = 'ficha-estado mal';
  }
}

document.addEventListener('click', function(e){
  if(e.target.closest('#rap-abrir')){ abreRapida(); return; }
  if(e.target.closest('#rap-vertodo')){
    document.getElementById('rap-todo').classList.toggle('on');
    return;
  }
  if(e.target.closest('#rap-cerrar')){ rap.style.display = 'none'; return; }

  const sug = e.target.closest('[data-tema]');
  if(sug){
    rSel.push(sug.dataset.tema);
    rBusca.value = ''; sugerencias('');
    pintaRapida();
    return;
  }
  const qt = e.target.closest('[data-quitatema]');
  if(qt){ rSel = rSel.filter(x => x !== qt.dataset.quitatema); pintaRapida(); return; }

  const qe = e.target.closest('[data-quitaetq]');
  if(qe){ rMano = rMano.filter(x => x !== qe.dataset.quitaetq); pintaRapida(); return; }

  if(e.target.closest('#rap-etq-add')){
    const inp = document.getElementById('rap-etq');
    const v = (inp.value || '').trim();
    if(v && etiquetasAuto().indexOf(v) < 0 && rMano.indexOf(v) < 0) rMano.push(v);
    inp.value = ''; pintaRapida();
    return;
  }
  if(e.target.closest('#rap-guardar')){ guardaRapida(); }
});

document.addEventListener('input', function(e){
  if(e.target === rBusca){ sugerencias(rBusca.value); return; }
  if(e.target === rTitulo || e.target === rDeberes) pintaRapida();
});

document.addEventListener('change', function(e){
  const q = e.target.closest('[data-quien]');
  if(q){
    const email = q.dataset.quien;
    if(q.checked){ if(rQuien.indexOf(email) < 0) rQuien.push(email); }
    else rQuien = rQuien.filter(x => x !== email);
    pintaAlumnos();
  }
});

// Enter en el buscador coge la primera sugerencia; Enter en la etiqueta la añade
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  if(e.target === rBusca){
    e.preventDefault();
    const primera = rSugs.querySelector('[data-tema]');
    if(primera) primera.click();
  }
  if(e.target && e.target.id === 'rap-etq'){
    e.preventDefault();
    document.getElementById('rap-etq-add').click();
  }
});

// ──────────────────── Catálogo de clases ────────────────────
// Para poder abrirlas y revisarlas: hasta ahora solo salían como texto en
// el desplegable de la ficha del alumno y no había manera de verlas.

function pintaCatalogo(){
  const caja = document.getElementById('cat-lista');
  const res = document.getElementById('cat-resumen');
  if(!caja) return;
  const lista = window.JN_CLASES || [];
  if(res) res.textContent = lista.length === 1 ? '1 clase escrita' : lista.length + ' clases escritas';
  caja.innerHTML = lista.length ? lista.map(c => {
    const chips = (c.etiquetas || []).map(e => `<span class="panel-course-chip">${esc(e)}</span>`).join('');
    const idiomas = ['es', 'it', 'en'].map(l =>
      `<a href="${esc(c.pagina)}-${l}.html" target="_blank" rel="noopener">${l.toUpperCase()}</a>`).join('');
    return `<div class="cat-row">
      <div class="cat-tit">${esc(c.titulo.es)}</div>
      <div class="cat-chips">${chips}</div>
      <div class="cat-meta"><span class="cat-niv">${esc(c.nivel || '')}</span>
        <span class="cat-niv">${esc(c.perfil || '')}</span></div>
      <div class="cat-abrir">${idiomas}</div>
    </div>`;
  }).join('') : '<p class="panel-empty">Todavía no hay ninguna clase en el catálogo.</p>';
}

document.addEventListener('click', function(e){
  if(e.target.closest('#rap-abrir2')) abreRapida();
});

pintaCatalogo();
