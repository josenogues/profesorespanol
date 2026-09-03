// Panel del profesor: muestra el progreso de los alumnos leyendo la
// colección "students" de Firestore. La puerta de contraseña vive en un
// script clásico dentro de panel-profesor.html (para que funcione aunque
// este módulo tarde en cargar o Firebase no esté disponible) y avisa a
// este módulo mediante el evento "jn-panel-unlocked".

import { app } from "./firebase-init.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
// todas las pistas: "los errores que te delatan" tiene 10 pasos en italiano y
// 7 en inglés.
const COURSE_NAMES = {
  'primeros-pasos': 'Primeros pasos',
  'viajar': 'Español para viajar',
  'vivir': 'Vivir en España',
  'errores': 'Los errores que te delatan',
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
      ['Ejercicios hechos (total)', totalExercises],
      ['Pasos de curso hechos (total)', totalSteps],
      ['Con un curso en marcha', doingCourse],
      ['Niveles superados (total)', totalPasses],
      ['Activos últimos 7 días', activeThisWeek],
      ['Solo han visitado (sin ejercicios)', onlyVisited]
    ].map(([label, n]) => `<div class="panel-stat"><div class="n">${esc(n)}</div><div class="l">${esc(label)}</div></div>`).join('');

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
      return `<tr>
        <td>${esc(s.email || '—')}${flag}</td>
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
