// Panel del profesor: muestra el progreso de los alumnos leyendo la
// colección "students" de Firestore. La puerta vive en un script clásico
// dentro de panel-profesor.html (para que pueda avisar aunque este módulo
// tarde en cargar o Firebase no esté disponible) y, cuando José ha entrado
// con su enlace del correo, avisa aquí con el evento "jn-panel-unlocked".
//
// Quién entra lo decide firebase-sync.js, que es el mismo que usan los
// alumnos. Aquí no se vuelve a iniciar sesión: antes se llamaba a
// signInAnonymously, y ahora eso tiraría abajo la sesión con la que el
// profesor acaba de entrar y dejaría al panel sin permisos.

import { app } from "./firebase-init.js";
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

const agendaEl = document.getElementById('panel-agenda');
const cuentaEl = document.getElementById('al-cuenta');
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

// Cuántos días hace. Null si nunca ha hecho nada.
function diasDesde(ts){
  if(!ts || typeof ts.toMillis !== 'function') return null;
  return Math.floor((Date.now() - ts.toMillis()) / 86400000);
}

// «hoy», «ayer», «hace 4 días» y, a partir de ahí, la fecha: una fecha con
// hora y minutos ocupaba media columna y no decía nada que esto no diga.
function haceCuanto(ts){
  const d = diasDesde(ts);
  if(d === null) return '<span class="al-sin">nunca</span>';
  if(d <= 0) return 'hoy';
  if(d === 1) return 'ayer';
  if(d < 30) return 'hace ' + d + ' días';
  return formatDate(ts).slice(0, 10);
}

// Lo mismo mirando hacia delante, para la agenda.
function cuandoCorto(iso){
  const hoy = hoyISO();
  if(iso === hoy) return 'hoy';
  const d = new Date(iso + 'T12:00:00');
  const manana = new Date(new Date(hoy + 'T12:00:00').getTime() + 86400000);
  if(d.toISOString().slice(0, 10) === manana.toISOString().slice(0, 10)) return 'mañana';
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  return DIAS[d.getDay()] + ' ' + fechaCorta(iso);
}

// La tarifa no se escribe: sale de lo pagado entre las clases dadas, y solo
// existe si están los dos números (y hay al menos una clase).
function tarifaDe(s){
  const p = s.pagado, c = s.clasesDadas;
  if(p === null || p === undefined || c === null || c === undefined || !(+c > 0)) return null;
  return +p / +c;
}

// Quién entra en las cuentas del dinero.
//
// En la lista hay fichas que no son clientes: la del propio José, que está
// para poder mirar la web como la ve un alumno, y la de quien recibe clases
// pero las paga otra persona (Sabrina las paga Anna). Si cuentan, su cero
// entra en la media y la hunde: no es que cobre poco, es que ahí no se cobra.
//
// Se marca a mano con una casilla en su ficha. La del profesor viene marcada
// de salida —cobrarse a uno mismo no es un ingreso— pero puede desmarcarla.
const PROFESOR = 'ncjosemaria@gmail.com';

function cuentaParaDinero(s){
  if(typeof s.sinCobro === 'boolean') return !s.sinCobro;
  return (s.email || '').toLowerCase() !== PROFESOR;
}

// En español la coma es la decimal: «26,68 €», no «26.68 €». Daba igual
// mientras los importes eran redondos; con la tarifa media salen decimales
// casi siempre.
function euros(n){
  if(n === null || n === undefined || n === '' || isNaN(+n)) return '';
  const v = +n;
  return (Math.round(v * 100) % 100 === 0
    ? String(Math.round(v))
    : v.toFixed(2).replace('.', ',')) + ' €';
}

// La página de una clase del catálogo, en el idioma que le toca a ese alumno.
// Una clase sin «pistas» existe en los tres; una con pistas solo en esas, así
// que a un italiano con una clase de angloparlantes se le abre la inglesa,
// que es la única que hay.
function paginaDeClase(a, idioma){
  if(!a || a.rapida) return null;
  const c = window.jnClasePorId && window.jnClasePorId(a.id);
  if(!c || !c.pagina) return null;
  const pistas = (c.pistas && c.pistas.length) ? c.pistas : ['es', 'it', 'en'];
  const pista = pistas.indexOf(idioma) >= 0 ? idioma : pistas[0];
  return c.pagina + '-' + pista + '.html';
}

// ───────────────── Lo que tienes por delante ─────────────────
// Esto ocupa el sitio de los cuatro números de antes. Un número que dice
// «10 alumnos» no se mira dos veces; esto se mira todos los días: qué clases
// vienen en los próximos siete, y a quién no le has preparado la siguiente.
// Todo sale de lo que ya está cargado, sin pedirle nada más a Firebase.

function pintaAgenda(){
  if(!agendaEl) return;
  const hoy = hoyISO();
  const tope = new Date(new Date(hoy + 'T12:00:00').getTime() + 7 * 86400000)
    .toISOString().slice(0, 10);
  const altas = [...porEmail.values()].filter(s => s.activo !== false);

  const proximas = [];
  altas.forEach(s => {
    (Array.isArray(s.clases) ? s.clases : []).forEach(c => {
      if(c.fecha && c.fecha >= hoy && c.fecha <= tope){
        proximas.push({ fecha: c.fecha, email: s.email, quien: nombreDe(s) || s.email,
                        que: tituloDe(c) });
      }
    });
  });
  proximas.sort((a, b) => a.fecha.localeCompare(b.fecha));

  // sin clase futura: los que hay que mover. Primero el que lleva más tiempo.
  const sueltos = altas.filter(s => !proximaClase(s))
    .sort((a, b) => (diasDesde(b.updatedAt) || 9999) - (diasDesde(a.updatedAt) || 9999));

  const listaHtml = proximas.length
    ? proximas.map(p => `<div class="ag-dia${p.fecha === hoy ? ' hoy' : ''}" data-ficha="${esc(p.email)}">
        <span class="ag-cuando">${esc(cuandoCorto(p.fecha))}</span>
        <span class="ag-quien">${esc(p.quien)}</span>
        <span class="ag-que">${esc(p.que)}</span></div>`).join('')
    : '<p class="ag-vacio">No hay ninguna clase con fecha en los próximos siete días.</p>';

  const chipsHtml = sueltos.length
    ? '<div class="ag-chips">' + sueltos.map(s => {
        const d = diasDesde(s.updatedAt);
        const cuanto = d === null ? 'nunca ha entrado'
          : d <= 0 ? 'hoy' : d === 1 ? 'ayer' : 'hace ' + d + ' d';
        return `<button class="ag-chip" data-ficha="${esc(s.email)}">${
          esc(nombreDe(s) || s.email)} <span>${esc(cuanto)}</span></button>`;
      }).join('') + '</div>'
    : '<p class="ag-vacio">Todos tienen su próxima clase puesta.</p>';

  agendaEl.innerHTML =
    `<div class="ag-caja"><h3 class="ag-h"><i class="ti ti-calendar"></i> Los próximos siete días</h3>${listaHtml}</div>` +
    `<div class="ag-caja"><h3 class="ag-h"><i class="ti ti-alarm"></i> Sin próxima clase</h3>${chipsHtml}</div>`;
}

// Todo lo que cambia cuando cambian los datos: la agenda de arriba también,
// que si no, al ponerle una clase a alguien seguía diciendo que no la tiene.
function repinta(){ pintaAgenda(); pintaTabla(); }

// ───────────────── La tabla de alumnos ─────────────────
// Se vuelve a pintar sin tocar Firebase cuando escribes en el buscador o
// pides ver las bajas: los datos ya están en porEmail.

const pieEl = document.getElementById('panel-table-foot');
const busqEl = document.getElementById('al-buscar');
const bajasEl = document.getElementById('al-bajas');

// El pie de la tabla: la tarifa media y lo cobrado.
//
// La media es lo pagado entre las clases dadas, sumando a todos a la vez, no
// la media de las tarifas de cada uno: así quien ha dado cien clases pesa lo
// que tiene que pesar y no lo mismo que quien ha dado dos.
//
// Y dice de cuántos sale. Quien no tenga los dos números se queda fuera del
// cálculo —no hay manera de inventárselo— y eso tiene que verse, que si no
// parece que la media es de todos cuando es de la mitad.
//
// La tabla tiene OCHO columnas: cada fila del pie tiene que sumar ocho entre
// colspans o se queda coja y el navegador la cuadra como puede.
function pintaPie(){
  if(!pieEl) return;
  const todos = [...porEmail.values()];
  const activos = todos.filter(s => s.activo !== false);

  const media = function(arr){
    const cobran = arr.filter(cuentaParaDinero);
    const con = cobran.filter(s => tarifaDe(s) !== null);
    const clases = con.reduce((n, s) => n + (+s.clasesDadas), 0);
    return { v: clases ? con.reduce((n, s) => n + (+s.pagado), 0) / clases : null,
             con: con.length,
             fuera: arr.length - cobran.length,
             sinDatos: cobran.length - con.length };
  };

  // Antes ponía «(8 de 11 con los dos datos)» y no había quien lo entendiera.
  // Ahora lo dice en una frase: de cuántos sale, a cuántos les falta algo y
  // cuántos no cuentan.
  const linea = function(rotulo, m){
    const partes = [];
    partes.push(m.con === 1 ? 'sale de 1 alumno' : 'sale de ' + m.con + ' alumnos');
    // «sin rellenar» no valía: quien tiene 0 clases dadas sí lo ha rellenado,
    // pero tampoco da media. Esto es verdad en los dos casos.
    if(m.sinDatos) partes.push(m.sinDatos === 1 ? '1 todavía sin media'
                                                : m.sinDatos + ' todavía sin media');
    if(m.fuera) partes.push(m.fuera === 1 ? '1 no cuenta' : m.fuera + ' no cuentan');
    return `<tr><td colspan="5">${esc(rotulo)}
      <span class="al-sin pie-nota">${esc(partes.join(' · '))}</span></td>
      <td class="al-n">${m.v === null ? '<span class="al-sin">—</span>'
        : '<span class="al-eur">' + esc(euros(m.v)) + '</span>'}</td>
      <td colspan="2"></td></tr>`;
  };

  const cobrado = todos.filter(cuentaParaDinero)
    .reduce((n, s) => n + (+s.pagado || 0), 0);
  pieEl.innerHTML =
    linea('Tarifa media · todos los alumnos', media(todos)) +
    linea('Tarifa media · solo los activos', media(activos)) +
    `<tr><td colspan="4">Cobrado en total</td>
      <td class="al-n">${cobrado ? '<span class="al-eur">' + esc(euros(cobrado)) + '</span>'
        : '<span class="al-sin">—</span>'}</td>
      <td colspan="3"></td></tr>`;
}

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
    // el pie también: una tabla sin filas y con totales debajo no se entiende
    if(pieEl) pieEl.innerHTML = '';
    if(cuentaEl) cuentaEl.innerHTML = '';
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
    // los cursos se metieron dentro de «Práctica»: casi siempre están vacíos y
    // una columna entera para un guion no se gana el sitio
    const cursos = courseChips(s);
    const cursosHtml = cursos.length
      ? `<div class="panel-levels" style="margin-top:4px">${cursos.map(c => {
          const count = c.total ? `${c.done}/${c.total}` : `${c.done} pasos`;
          return `<span class="panel-course-chip${c.complete ? ' done' : ''}">${esc(c.name)} <b>${esc(count)}</b></span>`;
        }).join('')}</div>`
      : '';
    const prox = proximaClase(s);
    const proxHtml = prox
      ? `<div class="al-prox"><b>${esc(fechaCorta(prox.fecha))}</b><span>${esc(tituloDe(prox))}</span></div>`
      : '<span class="al-sin">sin programar</span>';
    const nClases = Array.isArray(s.clases) ? s.clases.length : 0;
    // el botón de las clases: antes era un número suelto y no se veía que
    // llevara a ninguna parte
    const clasesHtml = nClases
      ? `<span class="al-vercl">${nClases === 1 ? 'Ver su clase' : 'Ver sus ' + nClases + ' clases'
        } <i class="ti ti-arrow-right"></i></span>`
      : '<span class="al-vercl cero">Ponerle una <i class="ti ti-arrow-right"></i></span>';
    const pagadoHtml = (s.pagado || s.pagado === 0)
      ? `<span class="al-eur">${esc(euros(s.pagado))}</span>${
          s.pagadoAt ? `<span class="al-desde">al ${esc(fechaCorta(s.pagadoAt))}</span>` : ''}`
      : '<span class="al-sin">—</span>';
    return `<tr class="al-fila${baja ? ' baja' : ''}" data-ficha="${esc(s.email || '')}">
      <td><div class="al-quien"><b>${esc(nombre || s.email || '—')}</b>
        <span>${esc(nombre ? s.email : (marca || 'sin nombre'))}</span></div>${
        baja ? '<span class="panel-flag baja">Baja</span>' : ''}</td>
      <td>${clasesHtml}</td>
      <td class="al-n">${esc(s.exerciseCount || 0)}${cursosHtml}</td>
      <td class="al-n">${(s.clasesDadas || s.clasesDadas === 0) ? esc(s.clasesDadas) : '<span class="al-sin">—</span>'}</td>
      <td class="al-n">${pagadoHtml}</td>
      <td class="al-n">${!cuentaParaDinero(s) ? '<span class="al-sin">no cuenta</span>'
        : tarifaDe(s) !== null ? `<span class="al-eur">${esc(euros(tarifaDe(s)))}</span>`
        : '<span class="al-sin">—</span>'}</td>
      <td>${haceCuanto(s.updatedAt)}</td>
      <td>${proxHtml}</td>
    </tr>`;
  }).join('');

  pintaPie();

  // el contador que pedía: al final de la tabla y sin ocupar media pantalla.
  // El dinero ya no va aquí: vive entero en el pie de la tabla, que es donde
  // se mira, y así no está la misma cifra en dos sitios.
  if(cuentaEl){
    const altas = [...porEmail.values()].filter(s => s.activo !== false).length;
    const bajas = porEmail.size - altas;
    cuentaEl.textContent =
      (altas === 1 ? '1 alumno' : altas + ' alumnos') +
      (bajas ? (bajas === 1 ? ' · 1 de baja' : ' · ' + bajas + ' de baja') : '') +
      (q || verBajas ? ' en total' : '');
  }
}

if(busqEl) busqEl.addEventListener('input', pintaTabla);
if(bajasEl) bajasEl.addEventListener('change', pintaTabla);

async function loadStudents(){
  loadingEl.textContent = 'Cargando...';
  loadingEl.style.display = 'block';
  if(agendaEl) agendaEl.innerHTML = '';
  if(cuentaEl) cuentaEl.innerHTML = '';
  bodyEl.innerHTML = '';
  refreshBtn.disabled = true;
  try {
    await withTimeout(window.jnCloudReady, 10000, 'auth');
    const db = getFirestore(app);
    const snap = await withTimeout(getDocs(collection(db, 'students')), 10000, 'getDocs');

    const students = [];
    snap.forEach(docSnap => students.push(docSnap.data()));

    porEmail.clear();
    students.forEach(s => { if(s.email) porEmail.set(s.email, s); });

    pintaAgenda();
    pintaTabla();
    // si tenías una ficha abierta, se queda abierta y con los datos frescos
    // (sin volver a saltar hacia ella, que estabas mirándola)
    if(emailAbierto && porEmail.has(emailAbierto)){
      const abierto = porEmail.get(emailAbierto);
      clasesAbiertas = Array.isArray(abierto.clases) ? abierto.clases.map(c => Object.assign({}, c)) : [];
      pintaFicha();
    }
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
    // el título abre la clase tal y como la ve el alumno, en otra pestaña:
    // antes había que ir al catálogo y buscarla a mano
    const url = paginaDeClase(c, (porEmail.get(emailAbierto) || {}).idioma || 'es');
    const tit = url
      ? `<a href="${esc(url)}" target="_blank" rel="noopener" title="Abrir la clase en otra pestaña">${
          esc(tituloDe(c))}<i class="ti ti-external-link"></i></a>`
      : esc(tituloDe(c)) + (c.rapida ? '<span class="fi-rap">clase rápida</span>' : '');
    return `<div class="fi-row${pend ? ' pend' : ''}${apu ? ' con-apu' : ''}">
      <input type="date" class="fi-fecha" data-i="${i}" value="${esc(c.fecha || '')}">
      <div class="fi-tit">${tit}</div>
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
    repinta();   // cambian sus columnas de clases, de próxima clase y la agenda
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
  // clases dadas y pagado los escribe él a mano; la tarifa sale de dividirlos
  // (tarifaDe) y no se guarda. Vacío se guarda como null, no como 0, para
  // poder distinguir «no cobra» de «no lo he puesto».
  const num = function(id){
    const v = (document.getElementById(id).value || '').trim();
    return v === '' || isNaN(+v) ? null : +v;
  };
  const campos = {
    nombre: (document.getElementById(PERFIL.nombre).value || '').trim(),
    idioma: document.getElementById(PERFIL.idioma).value || '',
    nivel: document.getElementById(PERFIL.nivel).value || '',
    activo: document.getElementById(PERFIL.activo).value !== 'no',
    clasesDadas: num('fi-clases-dadas'),
    pagado: num('fi-pagado'),
    pagadoAt: document.getElementById('fi-pagado-fecha').value || '',
    sinCobro: !!document.getElementById('fi-sincobro').checked
  };
  avisa('Guardando...');
  try {
    const db = getFirestore(app);
    await withTimeout(setDoc(doc(db, 'students', emailAbierto),
      Object.assign({ email: emailAbierto }, campos), { merge: true }), 8000, 'setDoc');
    Object.assign(s, campos);
    porEmail.set(emailAbierto, s);
    if(fQuien) fQuien.textContent = campos.nombre || emailAbierto;
    repinta();
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
    repinta();
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
  document.getElementById('fi-clases-dadas').value = (s.clasesDadas || s.clasesDadas === 0) ? s.clasesDadas : '';
  document.getElementById('fi-pagado').value = (s.pagado || s.pagado === 0) ? s.pagado : '';
  document.getElementById('fi-pagado-fecha').value = s.pagadoAt || '';
  // sin marcar nunca: la del profesor sale marcada de salida (cuentaParaDinero)
  document.getElementById('fi-sincobro').checked = !cuentaParaDinero(s);
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

  // «Actualizar a hoy»: no calcula nada, solo deja la fecha de hoy en el
  // campo y guarda. Es la marca de hasta cuándo están cuadradas las cuentas.
  if(e.target.closest('#fi-cobro-hoy')){
    const f = document.getElementById('fi-pagado-fecha');
    if(f){ f.value = hoyISO(); guardaPerfil(); }
    return;
  }

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
  if(f){ clasesAbiertas[+f.dataset.i].fecha = f.value; pintaFicha(); repinta(); guarda(); return; }
  const n = e.target.closest('.fi-nota');
  if(n){ clasesAbiertas[+n.dataset.i].nota = n.value; guarda(); return; }
  // la casilla de «no cuenta para el dinero» vive fuera de .fi-perfil
  if(e.target && e.target.id === 'fi-sincobro'){ guardaPerfil(); return; }
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
    repinta();   // el alumno nuevo entra ya en «sin próxima clase»
    avisaAlta((campos.nombre || email) + ' ya puede entrar en la web.', 'ok');
  } catch(err) {
    avisaAlta('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
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
  if(e.target.closest('#alta-add')){ daDeAlta(); }
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

// La puerta avisa cuando Firebase confirma que ha entrado el profesor. Eso
// pasa siempre después de que los módulos se hayan cargado (hay que esperar
// a Firebase), así que aquí ya estamos escuchando: ya no hace falta mirar
// también sessionStorage, como cuando la puerta era una contraseña y se
// abría antes de que este módulo existiera.
document.addEventListener('jn-panel-unlocked', autoLoad, { once: true });

pintaFiltros();
pintaCatalogo();
