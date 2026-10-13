// Panel del profesor: muestra el progreso de los alumnos leyendo la
// colección "students" de Firestore. La puerta de contraseña vive en un
// script clásico dentro de panel-profesor.html (para que funcione aunque
// este módulo tarde en cargar o Firebase no esté disponible) y avisa a
// este módulo mediante el evento "jn-panel-unlocked".

import { app } from "./firebase-init.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

// Los alumnos, tal y como están en Firebase. Es el estado que comparten la
// tabla, la ficha, la clase rápida y el alta: se llena en loadStudents() y
// desde ahí lo lee todo lo demás.
const porEmail = new Map();

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

// Cómo le llamas tú. El email es la clave con la que entra, pero no es un
// nombre: mirar una tabla de emails no te dice quién es quién.
function nombreDe(s){
  return (s && typeof s.nombre === 'string' && s.nombre.trim()) ? s.nombre.trim() : '';
}

// La próxima clase es, simplemente, la clase fechada en el futuro que le
// hayas creado y que toque antes. Si no hay ninguna, no se la has preparado
// todavía: esa es toda la información que da esta columna.
function proximaClase(s){
  const hoy = hoyISO();
  return (Array.isArray(s.clases) ? s.clases : [])
    .filter(c => c.fecha && c.fecha > hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0] || null;
}

function fechaCorta(iso){
  const partes = String(iso || '').split('-');
  if(partes.length !== 3) return iso || '';
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return partes[2].replace(/^0/, '') + ' ' + (MESES[+partes[1] - 1] || '');
}

// ───────────────── La tabla de alumnos ─────────────────
// Se vuelve a pintar sin tocar Firebase cuando escribes en el buscador o
// pides ver las bajas: los datos ya están en porEmail.

const busqEl = document.getElementById('al-buscar');
const bajasEl = document.getElementById('al-bajas');

function pintaTabla(){
  const q = (busqEl && busqEl.value || '').trim().toLowerCase();
  const verBajas = !!(bajasEl && bajasEl.checked);
  let lista = [...porEmail.values()];

  lista = lista.filter(s => (verBajas || s.activo !== false) &&
    (!q || (s.email + ' ' + nombreDe(s)).toLowerCase().includes(q)));

  lista.sort((a, b) => {
    const ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0;
    const tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0;
    return tb - ta;
  });

  if(!lista.length){
    bodyEl.innerHTML = '';
    loadingEl.textContent = q
      ? 'Ningún alumno con eso.'
      : (porEmail.size ? 'Todos tus alumnos están dados de baja. Marca «ver también las bajas».'
                       : 'Todavía no hay alumnos. Dale a «Dar de alta».');
    loadingEl.style.display = 'block';
    return;
  }
  loadingEl.style.display = 'none';

  bodyEl.innerHTML = lista.map(s => {
    const baja = s.activo === false;
    const nombre = nombreDe(s);
    const marca = [s.nivel, (s.idioma || '').toUpperCase()].filter(Boolean).join(' · ');
    const cursos = courseChips(s);
    const cursosHtml = cursos.length
      ? `<div class="panel-levels">${cursos.map(c => {
          const count = c.total ? `${c.done}/${c.total}` : `${c.done} pasos`;
          return `<span class="panel-course-chip${c.complete ? ' done' : ''}">${esc(c.name)} <b>${esc(count)}</b></span>`;
        }).join('')}</div>`
      : '<span class="al-sin">—</span>';
    const prox = proximaClase(s);
    const proxHtml = prox
      ? `<div class="al-prox"><b>${esc(fechaCorta(prox.fecha))}</b><span>${esc(tituloDe(prox))}</span></div>`
      : '<span class="al-sin">sin programar</span>';
    const nClases = Array.isArray(s.clases) ? s.clases.length : 0;
    return `<tr class="al-fila${baja ? ' baja' : ''}" data-ficha="${esc(s.email || '')}">
      <td><div class="al-quien"><b>${esc(nombre || s.email || '—')}</b>
        <span>${esc(nombre ? s.email : (marca || 'sin nombre'))}</span></div>${
        baja ? '<span class="panel-flag baja">Baja</span>' : ''}</td>
      <td class="al-n">${nClases} <i class="ti ti-chevron-right" style="color:var(--muted)"></i></td>
      <td class="al-n">${esc(s.exerciseCount || 0)}</td>
      <td>${cursosHtml}</td>
      <td>${esc(formatDate(s.updatedAt))}</td>
      <td>${proxHtml}</td>
    </tr>`;
  }).join('');
}

if(busqEl) busqEl.addEventListener('input', pintaTabla);
if(bajasEl) bajasEl.addEventListener('change', pintaTabla);

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

    porEmail.clear();
    students.forEach(s => { if(s.email) porEmail.set(s.email, s); });

    // Cuatro números, no ocho: los que te dicen algo de un vistazo. Las
    // visitas y los niveles superados se han quitado a propósito.
    const altas = students.filter(s => s.activo !== false);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    statsEl.innerHTML = [
      ['Alumnos', altas.length],
      ['Activos esta semana', altas.filter(s => s.updatedAt && s.updatedAt.toMillis && s.updatedAt.toMillis() > weekAgo).length],
      ['Clases asignadas', altas.reduce((n, s) => n + (Array.isArray(s.clases) ? s.clases.length : 0), 0)],
      ['Ejercicios hechos', altas.reduce((n, s) => n + (s.exerciseCount || 0), 0)]
    ].map(([label, n]) => `<div class="panel-stat"><div class="n">${esc(n)}</div><div class="l">${esc(label)}</div></div>`).join('');

    pintaTabla();
    // si tenías una ficha abierta, se queda abierta y con los datos frescos
    // (sin volver a saltar hacia ella, que estabas mirándola)
    if(emailAbierto && porEmail.has(emailAbierto)){
      const abierto = porEmail.get(emailAbierto);
      clasesAbiertas = Array.isArray(abierto.clases) ? abierto.clases.map(c => Object.assign({}, c)) : [];
      pintaFicha();
    }
    miraSiFaltaAlguien();
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

const ficha = document.getElementById('ficha');
const fQuien = document.getElementById('ficha-quien');
const fResumen = document.getElementById('ficha-resumen');
const fSelect = document.getElementById('ficha-clase');
const fFecha = document.getElementById('ficha-fecha');
const fLista = document.getElementById('ficha-lista');
const fEstado = document.getElementById('ficha-estado');
// sus datos: nombre, idioma, nivel y si puede entrar o no
const PERFIL = { nombre: 'fi-nombre', idioma: 'fi-idioma', nivel: 'fi-nivel', activo: 'fi-activo' };

let emailAbierto = null;
let clasesAbiertas = [];

function hoyISO(){
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Una clase rápida no está en el catálogo: su título y sus etiquetas van
// dentro de la propia asignación. Sin esto su fila salía sin título.
function tituloDe(a){
  if(a && a.rapida) return a.rapida.titulo || '(clase rápida sin título)';
  const c = window.jnClasePorId && window.jnClasePorId(a && a.id);
  return c ? (c.titulo.es || a.id) : (a && a.id) || '';
}

function etiquetasDe(a){
  if(a && a.rapida){
    const auto = [];
    (a.rapida.temas || []).forEach(function(id){
      const t = window.jnTemaPorId && window.jnTemaPorId(id);
      (t ? t.etiquetas : []).forEach(function(e){ if(auto.indexOf(e) < 0) auto.push(e); });
    });
    return auto.concat(a.rapida.extra || []);
  }
  const c = window.jnClasePorId && window.jnClasePorId(a && a.id);
  return (c && c.etiquetas) || [];
}

function avisa(txt, tipo){
  if(!fEstado) return;
  fEstado.textContent = txt || '';
  fEstado.className = 'ficha-estado' + (tipo ? ' ' + tipo : '');
}

// La clave con la que el alumno guarda sus apuntes de una clase. Tiene que
// dar lo mismo que claveApuntes() de mis-clases.js.
function claveApuntes(c){
  if(!c.rapida) return c.id;
  return c.rapida.rid || ('r-' + (c.fecha || 'sinfecha') + '-' +
    (c.rapida.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24));
}

function pintaFicha(){
  if(!fLista) return;
  const hoy = hoyISO();
  const apuntes = (porEmail.get(emailAbierto) || {}).apuntes || {};
  // fechadas primero, de más reciente a más antigua; las sin fecha al final
  const orden = clasesAbiertas.map((c, i) => ({ c, i }))
    .sort((a, b) => {
      if(!a.c.fecha && !b.c.fecha) return 0;
      if(!a.c.fecha) return 1;
      if(!b.c.fecha) return -1;
      return b.c.fecha.localeCompare(a.c.fecha);
    });

  fLista.innerHTML = orden.length ? orden.map(({ c, i }) => {
    const chips = etiquetasDe(c).map(t => `<span class="panel-course-chip">${esc(t)}</span>`).join('');
    const pend = c.fecha && c.fecha > hoy;
    // lo que escribió el alumno durante la clase: se ve, no se toca
    const suyo = apuntes[claveApuntes(c)];
    const apu = (suyo && typeof suyo.t === 'string' && suyo.t.trim())
      ? `<div class="fi-apu"><b><i class="ti ti-note"></i> Sus apuntes</b><p>${esc(suyo.t)}</p></div>`
      : '';
    return `<div class="fi-row${pend ? ' pend' : ''}${apu ? ' con-apu' : ''}">
      <input type="date" class="fi-fecha" data-i="${i}" value="${esc(c.fecha || '')}">
      <div class="fi-tit">${esc(tituloDe(c))}</div>
      <div class="fi-chips">${chips}</div>
      <input type="text" class="fi-nota" data-i="${i}" value="${esc(c.nota || '')}"
             placeholder="Nota para ti: cómo fue, qué repetir...">
      <button class="fi-quitar" data-quitar="${i}" title="Quitar de su lista">×</button>
      ${apu}
    </div>`;
  }).join('') : '<p class="panel-empty">Todavía no tiene ninguna clase asignada.</p>';

  const n = clasesAbiertas.length;
  // el email va aquí: el título de la ficha ya lleva su nombre, pero el email
  // es con lo que entra en la web y hay que poder verlo
  if(fResumen){
    fResumen.textContent = emailAbierto + ' · ' +
      (n === 1 ? '1 clase asignada' : n + ' clases asignadas');
  }
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
    pintaTabla();   // cambian sus columnas de clases y de próxima clase
    avisa('Guardado.', 'ok');
    setTimeout(() => avisa(''), 2000);
  } catch(err) {
    avisa('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

// Guarda solo los datos del alumno. Igual que con las clases: NO se escribe
// "updatedAt", que es la última vez que estuvo él en la web.
async function guardaPerfil(){
  if(!emailAbierto) return;
  const s = porEmail.get(emailAbierto) || {};
  const campos = {
    nombre: (document.getElementById(PERFIL.nombre).value || '').trim(),
    idioma: document.getElementById(PERFIL.idioma).value || '',
    nivel: document.getElementById(PERFIL.nivel).value || '',
    activo: document.getElementById(PERFIL.activo).value !== 'no'
  };
  avisa('Guardando...');
  try {
    const db = getFirestore(app);
    await withTimeout(setDoc(doc(db, 'students', emailAbierto),
      Object.assign({ email: emailAbierto }, campos), { merge: true }), 8000, 'setDoc');
    Object.assign(s, campos);
    porEmail.set(emailAbierto, s);
    if(fQuien) fQuien.textContent = campos.nombre || emailAbierto;
    pintaTabla();
    avisa(campos.activo ? 'Guardado.' : 'Guardado: ya no puede entrar en la web.', 'ok');
    setTimeout(() => avisa(''), 2500);
  } catch(err) {
    avisa('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

// Borrar de verdad, no dar de baja: desaparece la ficha entera, con sus
// clases y sus apuntes. Un perfil de prueba no tiene por qué quedarse para
// siempre entre las bajas. Se pide confirmación porque no hay vuelta atrás.
async function borraAlumno(){
  if(!emailAbierto) return;
  const quien = nombreDe(porEmail.get(emailAbierto) || {}) || emailAbierto;
  avisa('Borrando...');
  try {
    const db = getFirestore(app);
    await withTimeout(deleteDoc(doc(db, 'students', emailAbierto)), 8000, 'deleteDoc');
    porEmail.delete(emailAbierto);
    emailAbierto = null;
    clasesAbiertas = [];
    ficha.style.display = 'none';
    pintaTabla();
    // el aviso va encima de la tabla, que es donde se queda la vista al
    // cerrarse la ficha
    const linea = document.getElementById('al-estado');
    if(linea){
      linea.textContent = quien + ' se ha borrado del todo.';
      linea.className = 'ficha-estado ok';
      linea.style.display = 'block';
      setTimeout(function(){ linea.style.display = 'none'; }, 6000);
    }
  } catch(err) {
    avisa('No se ha podido borrar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

function preguntaBorrar(abierta){
  const caja = document.getElementById('fi-seguro');
  const bot = document.getElementById('fi-borrar');
  if(!caja) return;
  caja.style.display = abierta ? 'flex' : 'none';
  if(bot) bot.style.display = abierta ? 'none' : '';
  if(abierta){
    const s = porEmail.get(emailAbierto) || {};
    const n = Array.isArray(s.clases) ? s.clases.length : 0;
    document.getElementById('fi-seguro-txt').textContent =
      '¿Seguro? Se borra ' + (nombreDe(s) || emailAbierto) +
      (n === 1 ? ' con su clase' : n ? ' con sus ' + n + ' clases' : '') +
      ', y no se puede deshacer.';
  }
}

function abreFicha(email){
  const s = porEmail.get(email);
  if(!s || !ficha) return;
  emailAbierto = email;
  preguntaBorrar(false);
  clasesAbiertas = Array.isArray(s.clases) ? s.clases.map(c => Object.assign({}, c)) : [];
  if(fQuien) fQuien.textContent = nombreDe(s) || email;
  document.getElementById(PERFIL.nombre).value = nombreDe(s);
  document.getElementById(PERFIL.idioma).value = s.idioma || '';
  document.getElementById(PERFIL.nivel).value = s.nivel || '';
  document.getElementById(PERFIL.activo).value = s.activo === false ? 'no' : 'si';
  if(fSelect){
    fSelect.innerHTML = (window.JN_CLASES || [])
      // con el catálogo creciendo, el nivel y la pista ahorran abrir la clase
      .map(c => {
        const marca = [c.nivel, (c.pistas || []).join('/').toUpperCase()].filter(Boolean).join(' · ');
        return `<option value="${esc(c.id)}">${esc(c.titulo.es)}${marca ? ' · ' + esc(marca) : ''}</option>`;
      }).join('')
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

  if(e.target.closest('#fi-borrar')){ preguntaBorrar(true); return; }
  if(e.target.closest('#fi-borrar-no')){ preguntaBorrar(false); return; }
  if(e.target.closest('#fi-borrar-si')){ borraAlumno(); return; }

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

// la fecha, la nota y los datos del alumno se guardan al salir del campo,
// no en cada tecla
document.addEventListener('change', function(e){
  const f = e.target.closest('.fi-fecha');
  if(f){ clasesAbiertas[+f.dataset.i].fecha = f.value; pintaFicha(); pintaTabla(); guarda(); return; }
  const n = e.target.closest('.fi-nota');
  if(n){ clasesAbiertas[+n.dataset.i].nota = n.value; guarda(); return; }
  if(e.target && e.target.closest('.fi-perfil') && ficha.contains(e.target)) guardaPerfil();
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
  // los dados de baja no salen: una clase rápida es para quien está dando
  // clase contigo ahora
  const altas = [...porEmail.values()].filter(s => s.activo !== false)
    .sort((a, b) => (nombreDe(a) || a.email).localeCompare(nombreDe(b) || b.email));
  rAlumnos.innerHTML = altas.length
    ? altas.map(s => `<label class="rap-al${rQuien.indexOf(s.email) >= 0 ? ' on' : ''}">
        <input type="checkbox" data-quien="${esc(s.email)}"${rQuien.indexOf(s.email) >= 0 ? ' checked' : ''}> ${
        esc(nombreDe(s) || s.email)}</label>`).join('')
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
  // algunos temas solo existen en una pista —gustar o el sujeto que sobra
  // solo le hacen falta a un inglés— y hay que verlo antes de elegirlos
  const marca = t => (t.pistas || []).length ? ` · ${t.pistas.join('/').toUpperCase()}` : '';
  rSugs.innerHTML = hits.map(t =>
    `<button data-tema="${esc(t.id)}">${esc(t.nombre.es)}<span class="cat">${esc(t.cat)}${esc(marca(t))}</span></button>`).join('')
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
        data-tema="${esc(t.id)}" title="${esc(t.regla.es.replace(/<[^>]+>/g, ''))}">${esc(t.nombre.es)}${
        (t.pistas || []).length ? ' · ' + esc(t.pistas.join('/').toUpperCase()) : ''}</button>`;
    }).join('') + '</div>';
  }).join('');
}

// `para` es el alumno que ya tienes abierto: montar una clase rápida tiene
// sentido cuando ya sabes a quién se la das, así que se marca él solo. Desde
// el botón de arriba se abre sin nadie marcado, para repartirla entre varios.
function abreRapida(para){
  rSel = []; rMano = []; rQuien = para ? [para] : [];
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
      // id propio desde el minuto uno: es la clave con la que el alumno
      // guarda sus apuntes de esta clase, y no puede depender del título
      rid: 'r-' + Date.now().toString(36),
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
//
// Va plegado y con filtros porque la lista ya no cabe de un vistazo, y
// mientras das clase lo que quieres es la tabla de arriba, no el catálogo.

const catFiltro = { perfil: '', nivel: '', pista: '', q: '' };

// Los perfiles salen de las propias clases: así no hay que acordarse de
// tocar esto cada vez que se escribe una clase para un perfil nuevo.
function perfilesDelCatalogo(){
  const vistos = [];
  (window.JN_CLASES || []).forEach(c => {
    if(c.perfil && vistos.indexOf(c.perfil) < 0) vistos.push(c.perfil);
  });
  return vistos.sort();
}

function pintaFiltros(){
  const caja = document.getElementById('cat-filtros');
  if(!caja) return;
  // el rótulo va escrito, no en un icono: los iconos vienen de un CDN y si
  // no carga quedarían tres filas de botones «todos» sin saber de qué
  function grupo(campo, rotulo, opciones){
    return `<div class="cat-fgrupo"><span class="cat-frot">${esc(rotulo)}</span>` +
      [['', 'todos']].concat(opciones).map(([v, etq]) =>
        `<button type="button" class="cat-fbtn${catFiltro[campo] === v ? ' on' : ''}"
          data-filtro="${campo}" data-valor="${esc(v)}">${esc(etq)}</button>`).join('') +
      '</div>';
  }
  caja.innerHTML =
    grupo('perfil', 'Para quién', perfilesDelCatalogo().map(p => [p, p])) +
    grupo('nivel', 'Nivel', ['A1', 'A2', 'B1', 'B2', 'C1'].map(n => [n, n])) +
    grupo('pista', 'Idioma', [['es', 'ES'], ['it', 'IT'], ['en', 'EN']]) +
    `<input type="search" class="cat-buscar" id="cat-buscar" placeholder="título o etiqueta..."
      value="${esc(catFiltro.q)}" autocomplete="off">`;
}

function pintaCatalogo(){
  const caja = document.getElementById('cat-lista');
  const res = document.getElementById('cat-resumen');
  if(!caja) return;
  const todas = window.JN_CLASES || [];
  const q = catFiltro.q.trim().toLowerCase();

  const lista = todas.filter(c => {
    if(catFiltro.perfil && c.perfil !== catFiltro.perfil) return false;
    // «A2–B1» vale tanto para A2 como para B1
    if(catFiltro.nivel && String(c.nivel || '').indexOf(catFiltro.nivel) < 0) return false;
    if(catFiltro.pista && (c.pistas || ['es', 'it', 'en']).indexOf(catFiltro.pista) < 0) return false;
    if(q){
      const texto = [c.titulo.es, c.titulo.it, c.titulo.en]
        .concat(c.etiquetas || []).join(' ').toLowerCase();
      if(!texto.includes(q)) return false;
    }
    return true;
  });

  if(res){
    res.textContent = (todas.length === 1 ? '1 clase escrita' : todas.length + ' clases escritas') +
      (lista.length !== todas.length ? ' · ' + lista.length + ' con estos filtros' : '');
  }

  caja.innerHTML = lista.length ? lista.map(c => {
    const chips = (c.etiquetas || []).map(e => `<span class="panel-course-chip">${esc(e)}</span>`).join('');
    // una clase solo existe en las pistas que diga; sin el campo, en las tres
    const idiomas = (c.pistas || ['es', 'it', 'en']).map(l =>
      `<a href="${esc(c.pagina)}-${l}.html" target="_blank" rel="noopener">${l.toUpperCase()}</a>`).join('');
    return `<div class="cat-row">
      <div class="cat-tit">${esc(c.titulo.es)}</div>
      <div class="cat-chips">${chips}</div>
      <div class="cat-meta"><span class="cat-niv">${esc(c.nivel || '')}</span>
        <span class="cat-niv">${esc(c.perfil || '')}</span></div>
      <div class="cat-abrir">${idiomas}</div>
    </div>`;
  }).join('') : '<p class="panel-empty">Ninguna clase con estos filtros.</p>';
}

document.addEventListener('click', function(e){
  if(e.target.closest('#rap-abrir2')){ abreRapida(); return; }
  // desde dentro de la ficha: ya sabemos a quién
  if(e.target.closest('#rap-abrir3')){ abreRapida(emailAbierto); return; }

  const tog = e.target.closest('#cat-toggle');
  if(tog){
    const caja = document.getElementById('cat-caja');
    const abierto = caja.style.display !== 'none';
    caja.style.display = abierto ? 'none' : 'block';
    tog.innerHTML = abierto
      ? '<i class="ti ti-chevron-down"></i> Ver el catálogo'
      : '<i class="ti ti-chevron-up"></i> Ocultar';
    return;
  }

  const f = e.target.closest('[data-filtro]');
  if(f){
    const campo = f.dataset.filtro;
    // volver a pulsar el filtro que ya está puesto lo quita
    catFiltro[campo] = catFiltro[campo] === f.dataset.valor ? '' : f.dataset.valor;
    pintaFiltros(); pintaCatalogo();
  }
});

document.addEventListener('input', function(e){
  if(e.target && e.target.id === 'cat-buscar'){ catFiltro.q = e.target.value; pintaCatalogo(); }
});

// ──────────────────── Dar de alta y dar de baja ────────────────────
// Quién puede entrar en la web es la ficha del alumno en Firebase: existe y
// no está dada de baja. Antes era una hoja de Google publicada como CSV, que
// había que abrir aparte y que no sabía nada de quién era cada email.

const altaCaja = document.getElementById('alta');
const altaEstado = document.getElementById('alta-estado');

function avisaAlta(txt, tipo){
  if(altaEstado){
    altaEstado.textContent = txt || '';
    altaEstado.className = 'ficha-estado' + (tipo ? ' ' + tipo : '');
  }
}

async function daDeAlta(){
  const email = (document.getElementById('alta-email').value || '').trim().toLowerCase();
  if(!email || email.indexOf('@') < 0){ avisaAlta('Escribe su email.', 'mal'); return; }
  const ya = porEmail.get(email);
  if(ya && ya.activo !== false){ avisaAlta('Ese email ya está dado de alta.', 'mal'); return; }

  const campos = {
    email: email,
    nombre: (document.getElementById('alta-nombre').value || '').trim(),
    idioma: document.getElementById('alta-idioma').value || '',
    nivel: document.getElementById('alta-nivel').value || '',
    activo: true
  };
  // "alta" es cuándo le diste acceso. Sirve para distinguir al alumno nuevo
  // que todavía no ha entrado del que entró y lleva meses sin aparecer:
  // "última actividad" la escribe él, no yo.
  if(!ya) campos.alta = hoyISO();

  avisaAlta('Guardando...');
  try {
    const db = getFirestore(app);
    await withTimeout(setDoc(doc(db, 'students', email), campos, { merge: true }), 8000, 'setDoc');
    porEmail.set(email, Object.assign({}, ya || {}, campos));
    ['alta-email', 'alta-nombre'].forEach(id => { document.getElementById(id).value = ''; });
    pintaTabla();
    avisaAlta((campos.nombre || email) + ' ya puede entrar en la web.', 'ok');
  } catch(err) {
    avisaAlta('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

// ── La mudanza desde la hoja de Google ──
// Mientras quede algún email en la hoja sin ficha aquí, el panel lo avisa
// solo: si se migrara a mano se podría olvidar a alguien y dejarlo fuera de
// la web sin enterarse. Cuando no falte nadie, el aviso no aparece y la hoja
// se puede dejar de publicar.
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTp3ALVArrf67RDanwYo7f9EA7dxBF3FDmi6qvXeB7MDJn2ApcV4kICTxJ-d-OGX4mz0ibXXELGdZNu/pub?gid=0&single=true&output=csv';

function leeSheet(){
  return fetch(SHEET_CSV_URL, { cache: 'no-store' })
    .then(r => { if(!r.ok) throw new Error('respuesta ' + r.status); return r.text(); })
    .then(csv => {
      const emails = csv.split('\n')
        .map(l => l.split(',')[0].trim().toLowerCase())
        .filter(e => e.indexOf('@') > 0);
      // Google contesta 200 con una página de error cuando dejas de publicar
      // la hoja: sin esto, "no falta nadie" sería mentira.
      if(!emails.length) throw new Error('la hoja no da ninguna lista de emails');
      return emails;
    });
}

function faltanDelSheet(){
  return leeSheet().then(emails => emails.filter(e => !porEmail.has(e)));
}

function miraSiFaltaAlguien(){
  const aviso = document.getElementById('al-aviso');
  const txt = document.getElementById('al-aviso-txt');
  if(!aviso) return;
  faltanDelSheet().then(faltan => {
    if(!faltan.length){ aviso.style.display = 'none'; return; }
    txt.textContent = faltan.length === 1
      ? 'Hay 1 alumno en la hoja de Google que todavía no tiene ficha aquí, así que no podría entrar en la web.'
      : 'Hay ' + faltan.length + ' alumnos en la hoja de Google que todavía no tienen ficha aquí, así que no podrían entrar en la web.';
    aviso.style.display = 'flex';
  }).catch(() => {
    // la hoja ya no se publica, o no hay red: no es un problema, el acceso
    // ya no depende de ella
    aviso.style.display = 'none';
  });
}

async function importaDelSheet(estadoId){
  const estado = document.getElementById(estadoId);
  function di(txt, tipo){
    if(estado){ estado.textContent = txt; estado.className = 'ficha-estado' + (tipo ? ' ' + tipo : ''); }
  }
  di('Leyendo la hoja de Google...');
  try {
    const faltan = await faltanDelSheet();
    if(!faltan.length){ di('No falta nadie: ya están todos aquí.', 'ok'); return; }
    const db = getFirestore(app);
    for(const email of faltan){
      await withTimeout(setDoc(doc(db, 'students', email),
        { email: email, activo: true, alta: hoyISO() }, { merge: true }), 8000, 'setDoc');
      porEmail.set(email, { email: email, activo: true, alta: hoyISO() });
    }
    pintaTabla();
    miraSiFaltaAlguien();
    di('Traídos ' + faltan.length + (faltan.length === 1 ? ' alumno. Ponle nombre en su ficha.'
                                                         : ' alumnos. Ponles nombre en sus fichas.'), 'ok');
  } catch(err) {
    di('No se ha podido leer la hoja: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

document.addEventListener('click', function(e){
  if(e.target.closest('#alta-abrir')){
    altaCaja.style.display = 'block';
    avisaAlta('');
    document.getElementById('alta-email').focus();
    return;
  }
  if(e.target.closest('#alta-cerrar')){ altaCaja.style.display = 'none'; return; }
  if(e.target.closest('#alta-add')){ daDeAlta(); return; }
  if(e.target.closest('#alta-sheet-btn')){ importaDelSheet('alta-sheet-estado'); return; }
  if(e.target.closest('#al-importar')){
    altaCaja.style.display = 'block';
    importaDelSheet('alta-estado');
  }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && e.target && /^alta-(email|nombre)$/.test(e.target.id)){
    e.preventDefault();
    daDeAlta();
  }
});

// ──────────────────────── Arranque ────────────────────────
// Va al final a propósito: así todo lo que usa loadStudents() (la tabla, la
// ficha, el alta) está ya declarado cuando se dispara.

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

pintaFiltros();
pintaCatalogo();
