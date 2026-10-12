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
