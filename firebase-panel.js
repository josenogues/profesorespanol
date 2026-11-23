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

import { app } from "./firebase-init.js?v=2c6879e2ff";
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

const bodyEl = document.getElementById('panel-table-body');
const loadingEl = document.getElementById('panel-loading');
const ecoBodyEl = document.getElementById('eco-body');
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

// Los números de arriba dependen de los mismos datos que la tabla, así que
// se repintan con ella: si no, al cobrarle a alguien el KPI seguía en lo viejo.
function repinta(){ pintaKpis(); pintaTabla(); pintaEco(); pintaCatalogo(); }

// ───────────────── La tabla de alumnos ─────────────────
// Se vuelve a pintar sin tocar Firebase cuando escribes en el buscador o
// pides ver las bajas: los datos ya están en porEmail.

const kpisEl = document.getElementById('panel-kpis');
const busqEl = document.getElementById('al-buscar');

// Dar de baja y quitar el acceso son dos cosas distintas. Un alumno de baja
// puede seguir entrando un tiempo —para acabar lo que tenía a medias— y uno
// de alta puede quedarse fuera si hace falta. Por eso hay dos campos.
//
// «acceso» sin poner sigue a «activo», que es como se portaba hasta ahora:
// así ninguna ficha de las que ya existen cambia de comportamiento sola.
function puedeEntrar(s){
  if(!s) return false;
  if(typeof s.acceso === 'boolean') return s.acceso;
  return s.activo !== false;
}

// Filtros: estado ('alta' | 'baja' | '') y acceso ('si' | 'no' | '')
const filtros = { estado: 'alta', acceso: '' };
// Orden de cada tabla: la columna y el sentido. La de alumnos abre por
// quién tiene la clase más cercana, que es lo que mira quien da clases; la de
// economía, por nombre.
const ordenes = {
  clases: { col: 'proxima', desc: false },
  eco: { col: 'nombre', desc: false }
};

// La última clase dada (fecha de hoy o anterior) y la próxima (posterior a
// hoy) de un alumno. Una clase sin fecha no es ni una cosa ni la otra.
function ultimaDe(s){
  const hoy = hoyISO();
  let m = null;
  (Array.isArray(s.clases) ? s.clases : []).forEach(a => {
    if(a.fecha && a.fecha <= hoy && (!m || a.fecha > m.fecha)) m = a;
  });
  return m;
}
function proximaDe(s){
  const hoy = hoyISO();
  let m = null;
  (Array.isArray(s.clases) ? s.clases : []).forEach(a => {
    if(a.fecha && a.fecha > hoy && (!m || a.fecha < m.fecha)) m = a;
  });
  return m;
}

const VALOR = {
  nombre: s => (nombreDe(s) || s.email || '').toLowerCase(),
  clases: s => (Array.isArray(s.clases) ? s.clases.length : 0),
  ultima: s => { const a = ultimaDe(s); return a ? a.fecha : null; },
  proxima: s => { const a = proximaDe(s); return a ? a.fecha : null; },
  actividad: s => (s.updatedAt && s.updatedAt.toMillis) ? s.updatedAt.toMillis() : null
};

const VALOR_ECO = {
  nombre: VALOR.nombre,
  dadas: s => (s.clasesDadas || s.clasesDadas === 0) ? +s.clasesDadas : null,
  pagado: s => (s.pagado || s.pagado === 0) ? +s.pagado : null,
  tarifa: s => cuentaParaDinero(s) ? tarifaDe(s) : null
};

// Ordena por la columna que hayas pulsado. Lo que no tiene valor —un
// alumno sin tarifa, sin próxima clase— se va siempre al final, mires como
// mires: si no, al ordenar de menos a más la tabla empieza con una fila de
// guiones, que es justo lo que no estabas buscando.
function ordena(lista, o, valores){
  const valor = valores[o.col] || valores.nombre;
  return lista.sort((a, b) => {
    const va = valor(a), vb = valor(b);
    if(va === null && vb === null) return 0;
    if(va === null) return 1;
    if(vb === null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return o.desc ? -cmp : cmp;
  });
}

// ───────────────── Los números de arriba ─────────────────
// Vivían al final de la tabla y gráficamente no pegaban. Suben, y de paso
// contestan lo que de verdad se pregunta uno al abrir el panel: cuánto he
// cobrado, a qué tarifa, y quién tira del carro.
//
// La tarifa media es lo pagado entre las clases dadas, sumando a todos a la
// vez: así quien ha dado cien clases pesa lo que tiene que pesar y no lo
// mismo que quien ha dado dos. Quien no tiene los dos números se queda fuera
// del cálculo, y quien está marcado como «no cuenta para el dinero» también.
function pintaKpis(){
  if(!kpisEl) return;
  const todos = [...porEmail.values()];
  const altas = todos.filter(s => s.activo !== false);
  const cobran = todos.filter(cuentaParaDinero);

  const media = function(arr){
    const con = arr.filter(s => cuentaParaDinero(s) && tarifaDe(s) !== null);
    const clases = con.reduce((n, s) => n + (+s.clasesDadas), 0);
    return clases ? con.reduce((n, s) => n + (+s.pagado), 0) / clases : null;
  };

  const cobrado = cobran.reduce((n, s) => n + (+s.pagado || 0), 0);
  const dadas = todos.reduce((n, s) => n + (+s.clasesDadas || 0), 0);

  const nadie = '<span class="al-sin">—</span>';
  const dato = (l, v, clase) => `<span>${esc(l)}<b${clase ? ' class="' + clase + '"' : ''}>${v}</b></span>`;

  kpisEl.innerHTML = [
    dato('Alumnos de alta', esc(altas.length)),
    dato('Cobrado en total', cobrado ? esc(euros(cobrado)) : nadie, 'dinero'),
    dato('Tarifa media ahora', media(altas) === null ? nadie : esc(euros(media(altas)))),
    dato('Tarifa media histórica', media(todos) === null ? nadie : esc(euros(media(todos)))),
    dato('Clases dadas en total', esc(dadas))
  ].join('');
}

function pintaTabla(){
  const q = (busqEl && busqEl.value || '').trim().toLowerCase();
  let lista = [...porEmail.values()].filter(s =>
    (!filtros.estado || (filtros.estado === 'alta' ? s.activo !== false : s.activo === false)) &&
    (!filtros.acceso || (filtros.acceso === 'si' ? puedeEntrar(s) : !puedeEntrar(s))) &&
    (!q || (s.email + ' ' + nombreDe(s)).toLowerCase().includes(q)));

  ordena(lista, ordenes.clases, VALOR);
  pintaCabeceras();
  const mov = document.getElementById('al-orden-movil');
  if(mov) mov.value = ordenes.clases.col + ':' + (ordenes.clases.desc ? 'desc' : 'asc');

  if(!lista.length){
    bodyEl.innerHTML = '';
    loadingEl.textContent = q
      ? 'Ningún alumno con eso.'
      : (porEmail.size ? 'Ningún alumno con esos filtros.'
                       : 'Todavía no hay alumnos. Dale a «Dar de alta».');
    loadingEl.style.display = 'block';
    return;
  }
  loadingEl.style.display = 'none';

  bodyEl.innerHTML = lista.map(s => {
    const baja = s.activo === false;
    const nombre = nombreDe(s);
    const marca = [s.nivel, (s.idioma || '').toUpperCase()].filter(Boolean).join(' · ');
    const nClases = Array.isArray(s.clases) ? s.clases.length : 0;
    // el botón de las clases: antes era un número suelto y no se veía que
    // llevara a ninguna parte
    const clasesHtml = nClases
      ? `<span class="al-vercl">${nClases === 1 ? 'Ver su clase' : 'Ver sus ' + nClases + ' clases'
        } <i class="ti ti-arrow-right"></i></span>`
      : '<span class="al-vercl cero">Ponerle una <i class="ti ti-arrow-right"></i></span>';
    const ult = ultimaDe(s), prox = proximaDe(s);
    const celdaClase = a => a
      ? `<div class="al-fecha"><b>${esc(fechaCorta(a.fecha))}</b><span>${esc(tituloDe(a))}</span></div>`
      : '<span class="al-sin">—</span>';
    const apuntes = (s.paraProxima || '').trim();
    // dos marcas, no una: si está de baja, y si entra o no. Solo se enseña
    // el acceso cuando dice algo que no se deduce del estado: un alumno de
    // alta que no entra, o uno de baja que sí.
    const entra = puedeEntrar(s);
    const flags = (baja ? '<span class="panel-flag baja">Baja</span>' : '') +
      (!entra ? '<span class="panel-flag sinacceso">No entra</span>'
        : baja ? '<span class="panel-flag conacceso">Sigue entrando</span>' : '');
    return `<tr class="al-fila${baja ? ' baja' : ''}" data-ficha="${esc(s.email || '')}">
      <td><div class="al-quien"><b>${esc(nombre || s.email || '—')}</b>
        <span>${esc(nombre ? s.email : (marca || 'sin nombre'))}</span></div>${flags}</td>
      <td>${clasesHtml}</td>
      <td data-label="Última clase">${celdaClase(ult)}</td>
      <td data-label="Próxima clase">${prox ? celdaClase(prox) : '<span class="al-sin">sin programar</span>'}</td>
      <td data-label="Para la próxima clase"${apuntes ? '' : ' class="vacio"'}>${apuntes
        ? `<div class="al-prox-txt">${esc(apuntes)}</div>` : '<span class="al-sin">—</span>'}</td>
      <td data-label="Últ. actividad">${haceCuanto(s.updatedAt)}</td>
    </tr>`;
  }).join('');

}

if(busqEl) busqEl.addEventListener('input', pintaTabla);

// en el móvil no hay cabeceras que pulsar: el orden se elige aquí
const ordMovil = document.getElementById('al-orden-movil');
if(ordMovil) ordMovil.addEventListener('change', function(){
  const [col, sentido] = ordMovil.value.split(':');
  ordenes.clases = { col: col, desc: sentido === 'desc' };
  pintaTabla();
});

// La flecha en la cabecera de la columna por la que está ordenando.
function pintaCabeceras(){
  document.querySelectorAll('th.al-orden').forEach(th => {
    const o = ordenes[th.closest('table').dataset.t];
    const esta = th.dataset.col === o.col;
    th.classList.toggle('on', esta);
    // el nombre del icono va entero, no a trozos: herramientas/iconos.py
    // recorta la fuente a los ti-… que encuentra escritos, y uno montado
    // pegando el prefijo a una variable no lo vería y se quedaría sin dibujo
    const flecha = esta ? (o.desc ? 'ti-arrow-down' : 'ti-arrow-up') : 'ti-arrows-sort';
    th.innerHTML = th.textContent.replace(/\s*$/, '') +
      ' <i class="ti ' + flecha + '" aria-hidden="true"></i>';
  });
}

// Las dos pestañas. Se abre siempre en «Clases»: la economía está ahí, pero
// no tiene por qué verse al entrar.
function ponTab(t){
  document.querySelectorAll('.pn-tab').forEach(b => {
    const on = b.dataset.tab === t;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  ['clases', 'eco'].forEach(n => {
    const el = document.getElementById('tab-' + n);
    if(el) el.style.display = n === t ? '' : 'none';
  });
}

document.addEventListener('click', function(e){
  const tab = e.target.closest('.pn-tab');
  if(tab){ ponTab(tab.dataset.tab); return; }
  const th = e.target.closest('th.al-orden');
  if(th){
    // la misma columna cambia el sentido; una nueva empieza por lo más alto,
    // salvo los nombres y las fechas próximas, que empiezan por lo primero
    const t = th.closest('table').dataset.t;
    const o = ordenes[t];
    if(o.col === th.dataset.col) o.desc = !o.desc;
    else { o.col = th.dataset.col; o.desc = !(o.col === 'nombre' || o.col === 'proxima'); }
    if(t === 'eco') pintaEco(); else pintaTabla();
    return;
  }
  const f = e.target.closest('.al-fbtn');
  if(f){
    filtros[f.dataset.f] = f.dataset.v;
    f.parentNode.querySelectorAll('.al-fbtn').forEach(b => b.classList.toggle('on', b === f));
    pintaTabla();
  }
});

async function loadStudents(){
  loadingEl.textContent = 'Cargando...';
  loadingEl.style.display = 'block';
  bodyEl.innerHTML = '';
  if(ecoBodyEl) ecoBodyEl.innerHTML = '';
  if(kpisEl) kpisEl.innerHTML = '';
  refreshBtn.disabled = true;
  try {
    await withTimeout(window.jnCloudReady, 10000, 'auth');
    const db = getFirestore(app);
    const snap = await withTimeout(getDocs(collection(db, 'students')), 10000, 'getDocs');

    const students = [];
    snap.forEach(docSnap => students.push(docSnap.data()));

    porEmail.clear();
    students.forEach(s => { if(s.email) porEmail.set(s.email, s); });

    repinta();
    // si tenías una ficha abierta, se queda abierta y con los datos frescos
    // (sin volver a saltar hacia ella, que estabas mirándola)
    if(emailAbierto && porEmail.has(emailAbierto)){
      const abierto = porEmail.get(emailAbierto);
      clasesAbiertas = Array.isArray(abierto.clases) ? abierto.clases.map(c => Object.assign({}, c)) : [];
      document.getElementById('fi-proxima').value = abierto.paraProxima || '';
      pintaFicha();
    }
  } catch(err) {
    loadingEl.textContent = 'No se han podido cargar los datos (revisa la conexión o vuelve a intentarlo). ' + (err && err.message ? err.message : '');
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener('click', loadStudents);

// ───────────────── Pestaña «Economía» ─────────────────
// Lo del dinero vive aparte, en su pestaña: no hace falta tenerlo al día y no
// tiene por qué estar a la vista cada vez que se abre el panel. Cada fila se
// edita ahí mismo y se guarda al salir del campo.

function tarifaHtml(s){
  return !cuentaParaDinero(s) ? '<span class="al-sin">no cuenta</span>'
    : tarifaDe(s) !== null ? `<span class="al-eur">${esc(euros(tarifaDe(s)))}</span>`
    : '<span class="al-sin">—</span>';
}

function pintaEco(){
  if(!ecoBodyEl) return;
  const lista = ordena([...porEmail.values()], ordenes.eco, VALOR_ECO);
  pintaCabeceras();
  const val = v => (v || v === 0) ? esc(v) : '';
  ecoBodyEl.innerHTML = lista.map(s => {
    const baja = s.activo === false;
    const nombre = nombreDe(s);
    return `<tr class="eco-fila${baja ? ' baja' : ''}" data-eco="${esc(s.email || '')}">
      <td><div class="al-quien"><b>${esc(nombre || s.email || '—')}</b>
        <span>${esc(nombre ? s.email : '')}</span></div>${baja ? '<span class="panel-flag baja">Baja</span>' : ''}</td>
      <td data-label="Clases dadas"><input type="number" class="eco-in" data-campo="clasesDadas" min="0" step="1" value="${val(s.clasesDadas)}" placeholder="0"></td>
      <td data-label="Pagado (€)"><input type="number" class="eco-in" data-campo="pagado" min="0" step="0.5" value="${val(s.pagado)}" placeholder="0"></td>
      <td data-label="Al día a fecha de"><div class="eco-fecha-caja"><input type="date" class="eco-in" data-campo="pagadoAt" value="${esc(s.pagadoAt || '')}">
        <button type="button" class="button button-secondary button-sm" data-eco-hoy>Hoy</button></div></td>
      <td data-label="Tarifa media" class="al-n eco-tarifa">${tarifaHtml(s)}</td>
      <td data-label="No cuenta"><input type="checkbox" class="eco-in" data-campo="sinCobro" ${cuentaParaDinero(s) ? '' : 'checked'}></td>
    </tr>`;
  }).join('');
}

// Guarda un solo campo de un alumno. Vacío se guarda como null, no como 0,
// para poder distinguir «no cobra» de «no lo he puesto». No se repinta la
// tabla entera —perderías el sitio donde estás escribiendo—: solo su tarifa
// y los números de arriba.
async function guardaDinero(email, el){
  const s = porEmail.get(email);
  if(!s) return;
  const campo = el.dataset.campo;
  let v;
  if(campo === 'sinCobro') v = !!el.checked;
  else if(campo === 'pagadoAt') v = el.value || '';
  else { const t = (el.value || '').trim(); v = (t === '' || isNaN(+t)) ? null : +t; }
  const aviso = document.getElementById('eco-estado');
  const di = (txt, tipo) => { if(aviso){ aviso.textContent = txt; aviso.className = 'ficha-estado' + (tipo ? ' ' + tipo : ''); } };
  di('Guardando...');
  try {
    const db = getFirestore(app);
    await withTimeout(setDoc(doc(db, 'students', email),
      { email: email, [campo]: v }, { merge: true }), 8000, 'setDoc');
    s[campo] = v;
    const fila = el.closest('tr');
    const t = fila && fila.querySelector('.eco-tarifa');
    if(t) t.innerHTML = tarifaHtml(s);
    pintaKpis();
    di('Guardado.', 'ok');
    setTimeout(() => di(''), 1800);
  } catch(err) {
    di('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

// ─────────────────── Ficha del alumno: asignar clases ───────────────────
// El catálogo (qué clases existen) es código, en clases.js. Aquí solo se
// guarda QUIÉN tiene cada una y con qué fecha. Se escribe el campo "clases"
// y nada más: "updatedAt" es la última actividad DEL ALUMNO y no debe
// moverse porque el profesor abra su ficha.

const ficha = document.getElementById('ficha');
const fQuien = document.getElementById('ficha-quien');
const fResumen = document.getElementById('ficha-resumen');
const fFecha = document.getElementById('ficha-fecha');
const fLista = document.getElementById('ficha-lista');
const fEstado = document.getElementById('ficha-estado');
// sus datos: nombre, idioma, nivel y si puede entrar o no
const PERFIL = { nombre: 'fi-nombre', idioma: 'fi-idioma', nivel: 'fi-nivel', activo: 'fi-activo' };

let emailAbierto = null;
let clasesAbiertas = [];
let quitada = null;   // la última clase que quitaste, por si te arrepientes

// Cómo se ordenan «sus clases»: por fecha (la última primero o la primera
// primero) o por número del catálogo. Se acuerda de lo que elegiste.
let ordenFicha = 'fecha-desc';
try { ordenFicha = localStorage.getItem('jn_panel_orden_ficha') || ordenFicha; } catch(e) {}
if(['fecha-desc', 'fecha-asc', 'num'].indexOf(ordenFicha) < 0) ordenFicha = 'fecha-desc';

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
  if(a && a.rapida && a.rapida.repasoDe){
    const c = window.jnClasePorId && window.jnClasePorId(a.rapida.repasoDe);
    return (c && c.etiquetas) || [];
  }
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

// El catálogo dentro de la ficha: se busca, se ve qué clases ya tiene este
// alumno (✓) y se pulsa «Añadir» en la que toque. Va en el mismo orden que el
// catálogo de abajo (por número o por fecha).
let fcQ = '';
function pintaPicker(){
  const caja = document.getElementById('ficha-cat');
  if(!caja) return;
  const ya = new Set(clasesAbiertas.filter(c => c.id).map(c => c.id));
  const q = normaliza(fcQ).trim();
  const lista = ordenaCat(porNumero().filter(c => !q ||
    normaliza([numDe(c), String(c.num || ''), c.titulo.es].concat(c.etiquetas || []).join(' ')).includes(q)));
  const sel = document.getElementById('ficha-cat-orden');
  if(sel) sel.value = catOrden;
  caja.innerHTML = lista.length ? lista.map(c => {
    const marca = [c.nivel, (c.pistas || []).join('/').toUpperCase()].filter(Boolean).join(' · ');
    const tiene = ya.has(c.id);
    return `<div class="fc-row${tiene ? ' ya' : ''}"><span class="cat-num">${tiene ? '✓ ' : ''}${esc(numDe(c))}</span>
      <span class="fc-tit">${esc(c.titulo.es)}<small>${esc(marca)}</small></span>${tiene
        ? '<span class="fc-ya">✓ ya la tiene</span>'
        : `<button type="button" class="button button-secondary button-sm" data-anade="${esc(c.id)}"><i class="ti ti-plus"></i> Añadir</button>`}</div>`;
  }).join('') : '<p class="panel-empty" style="padding:10px 12px">Ninguna clase con eso.</p>';
}

function pintaFicha(){
  if(!fLista) return;
  const hoy = hoyISO();
  // Por fecha, las sin fecha siempre al final. Por número del catálogo, las
  // clases rápidas —que no tienen número— van detrás, de la más reciente a la
  // más antigua.
  const numDeAsig = c => {
    const cat = (!c.rapida && window.jnClasePorId) ? window.jnClasePorId(c.id) : null;
    return cat && cat.num ? cat.num : null;
  };
  const porFecha = (a, b, desc) => {
    if(!a.c.fecha && !b.c.fecha) return 0;
    if(!a.c.fecha) return 1;
    if(!b.c.fecha) return -1;
    return desc ? b.c.fecha.localeCompare(a.c.fecha) : a.c.fecha.localeCompare(b.c.fecha);
  };
  const orden = clasesAbiertas.map((c, i) => ({ c, i }))
    .sort((a, b) => {
      if(ordenFicha === 'num'){
        const na = numDeAsig(a.c), nb = numDeAsig(b.c);
        if(na !== null && nb !== null) return na - nb;
        if(na !== null) return -1;
        if(nb !== null) return 1;
        return porFecha(a, b, true);
      }
      return porFecha(a, b, ordenFicha === 'fecha-desc');
    });
  const selOrden = document.getElementById('ficha-orden');
  if(selOrden) selOrden.value = ordenFicha;
  pintaPicker();

  fLista.innerHTML = orden.length ? orden.map(({ c, i }) => {
    const chips = etiquetasDe(c).map(t => `<span class="panel-course-chip">${esc(t)}</span>`).join('');
    const pend = c.fecha && c.fecha > hoy;
    // el título abre la clase tal y como la ve el alumno, en otra pestaña:
    // antes había que ir al catálogo y buscarla a mano
    const url = paginaDeClase(c, (porEmail.get(emailAbierto) || {}).idioma || 'es');
    const cat = (!c.rapida && window.jnClasePorId) ? window.jnClasePorId(c.id) : null;
    const nm = cat ? `<span class="cat-num">${esc(numDe(cat))}</span>` : '';
    // «Repaso»: le pone otra clase, fechada hoy, que son los ejercicios de
    // los temas de ESTA. De un repaso no se hace repaso, y de una clase
    // rápida tampoco: sus temas los eligió él a mano y ya los tiene.
    const rep = (cat && (cat.temas || []).length)
      ? `<button class="fi-repaso" data-repaso="${i}" title="Ponerle un repaso de esta clase: solo ejercicios">Repaso</button>`
      : '';
    const tit = url
      ? `${nm}<a href="${esc(url)}" target="_blank" rel="noopener" title="Abrir la clase en otra pestaña">${
          esc(tituloDe(c))}<i class="ti ti-external-link"></i></a>`
      : nm + esc(tituloDe(c)) + (c.rapida
          ? '<span class="fi-rap">' + (c.rapida.repasoDe ? 'repaso' : 'clase rápida') + '</span>'
          : '');
    return `<div class="fi-row${pend ? ' pend' : ''}">
      <input type="date" class="fi-fecha" data-i="${i}" value="${esc(c.fecha || '')}">
      <div class="fi-tit">${tit}</div>
      <div class="fi-chips">${chips}</div>
      <input type="text" class="fi-nota" data-i="${i}" value="${esc(c.nota || '')}"
             placeholder="Nota para ti: cómo fue, qué repetir...">
      ${rep}<button class="fi-quitar" data-quitar="${i}" title="Quitar de su lista">×</button>
    </div>`;
  }).join('') : '<p class="panel-empty">Todavía no le has dado ninguna clase.</p>';

  const n = clasesAbiertas.length;
  // el email va aquí: el título de la ficha ya lleva su nombre, pero el email
  // es con lo que entra en la web y hay que poder verlo
  if(fResumen){
    const ej = +((porEmail.get(emailAbierto) || {}).exerciseCount) || 0;
    fResumen.textContent = emailAbierto + ' · ' +
      (n === 1 ? '1 clase asignada' : n + ' clases asignadas') +
      (ej ? ' · ' + ej + (ej === 1 ? ' ejercicio hecho en la web' : ' ejercicios hechos en la web') : '');
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
    setTimeout(() => { if(fEstado.textContent === 'Guardado.') avisa(''); }, 2000);
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
    activo: document.getElementById(PERFIL.activo).value !== 'no',
    acceso: document.getElementById('fi-acceso').value !== 'no'
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
    avisa(campos.acceso ? 'Guardado.' : 'Guardado: ya no puede entrar en la web.', 'ok');
    setTimeout(() => avisa(''), 2500);
  } catch(err) {
    avisa('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'mal');
  }
}

// Lo que harás en la siguiente clase: lo escribes al terminar cada una y lo
// lees antes de empezar la próxima. Va en la ficha del alumno, igual que sus
// clases, y tampoco toca "updatedAt".
let proxTimer = null;
document.addEventListener('input', function(e){
  if(e.target && e.target.id === 'fi-proxima'){
    clearTimeout(proxTimer);
    proxTimer = setTimeout(guardaProxima, 1200);
  }
});
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'hidden' && proxTimer){ clearTimeout(proxTimer); proxTimer = null; guardaProxima(); }
});

async function guardaProxima(){
  clearTimeout(proxTimer); proxTimer = null;
  if(!emailAbierto) return;
  const texto = (document.getElementById('fi-proxima').value || '').trim();
  avisa('Guardando...');
  try {
    const db = getFirestore(app);
    await withTimeout(setDoc(doc(db, 'students', emailAbierto),
      { email: emailAbierto, paraProxima: texto }, { merge: true }), 8000, 'setDoc');
    const s = porEmail.get(emailAbierto);
    if(s) s.paraProxima = texto;
    pintaTabla();
    avisa('Guardado.', 'ok');
    setTimeout(() => avisa(''), 2000);
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

// Las dos combinaciones raras merecen una línea, porque son a propósito
// pero no se adivinan mirando la ficha.
function avisaAcceso(){
  const caja = document.getElementById('fi-aviso-acceso');
  if(!caja) return;
  const alta = document.getElementById(PERFIL.activo).value !== 'no';
  const entra = document.getElementById('fi-acceso').value !== 'no';
  caja.innerHTML =
    (alta && !entra) ? 'Está de alta pero no puede entrar en la web. Útil para cortarle el acceso un tiempo sin darle de baja.'
    : (!alta && entra) ? 'Está de baja pero sigue entrando en la web, porque tú lo has dejado así. Mientras no lo cambies, ve sus clases y sus ejercicios.'
    : (!alta && !entra) ? 'De baja y sin acceso: no puede entrar. Su ficha y sus clases se quedan guardadas.'
    : '';
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
  document.getElementById('fi-acceso').value = puedeEntrar(s) ? 'si' : 'no';
  avisaAcceso();
  document.getElementById('fi-proxima').value = s.paraProxima || '';
  fcQ = '';
  const fb = document.getElementById('ficha-busca');
  if(fb) fb.value = '';
  quitada = null;
  if(fFecha) fFecha.value = hoyISO();
  avisa('');
  pintaFicha();
  ficha.style.display = 'block';
  // es un panel al lado de la lista: se abre arriba del todo, sin mover la página
  ficha.scrollTop = 0;
}

document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-ficha]');
  if(btn){ abreFicha(btn.dataset.ficha); return; }

  const cerrar = e.target.closest('#ficha-cerrar');
  if(cerrar){ ficha.style.display = 'none'; emailAbierto = null; return; }

  // «Hoy» en la fila de economía: deja la fecha de hoy y guarda
  const hoyBtn = e.target.closest('[data-eco-hoy]');
  if(hoyBtn){
    const f = hoyBtn.closest('tr').querySelector('input[data-campo="pagadoAt"]');
    if(f){ f.value = hoyISO(); guardaDinero(hoyBtn.closest('tr').dataset.eco, f); }
    return;
  }

  if(e.target.closest('#fi-borrar')){ preguntaBorrar(true); return; }
  if(e.target.closest('#fi-borrar-no')){ preguntaBorrar(false); return; }
  if(e.target.closest('#fi-borrar-si')){ borraAlumno(); return; }

  const add = e.target.closest('[data-anade]');
  if(add){
    const id = add.dataset.anade;
    if(clasesAbiertas.some(c => c.id === id)){
      avisa('Esa clase ya está en su lista.', 'mal');
      return;
    }
    clasesAbiertas.push({ id: id, fecha: (fFecha && fFecha.value) || '', nota: '' });
    pintaFicha();
    guarda();
    return;
  }

  const rep = e.target.closest('[data-repaso]');
  if(rep){
    const base = clasesAbiertas[parseInt(rep.dataset.repaso, 10)];
    const cat = window.jnClasePorId && window.jnClasePorId(base && base.id);
    if(!cat) return;
    // Se guarda como clase rápida —el alumno ya sabe verlas— con el id de la
    // clase repasada dentro. Los temas NO se copian aquí: se leen de
    // clases.js al pintarla, así que si mañana corrijo los temas de una
    // clase, los repasos ya puestos se corrigen solos.
    clasesAbiertas.push({
      rapida: {
        rid: 'r-' + Date.now().toString(36),
        titulo: 'Repaso: ' + (cat.titulo.es || cat.id),
        repasoDe: cat.id,
        temas: [],
        extra: [],
        deberes: ''
      },
      fecha: (fFecha && fFecha.value) || hoyISO(),
      nota: ''
    });
    pintaFicha();
    guarda();
    return;
  }

  const quitar = e.target.closest('[data-quitar]');
  if(quitar){
    const i = parseInt(quitar.dataset.quitar, 10);
    quitada = { c: clasesAbiertas[i], i: i };
    clasesAbiertas.splice(i, 1);
    pintaFicha();
    guarda().then(() => {
      // un fallo al guardar ya ha dejado su aviso: no se le pisa
      if(fEstado.classList.contains('mal')) return;
      fEstado.className = 'ficha-estado';
      fEstado.innerHTML = 'Clase quitada. <button type="button" class="button button-secondary button-sm" data-deshacer>Deshacer</button>';
      setTimeout(() => { if(fEstado.querySelector('[data-deshacer]')){ quitada = null; avisa(''); } }, 10000);
    });
    return;
  }
  if(e.target.closest('[data-deshacer]') && quitada){
    clasesAbiertas.splice(Math.min(quitada.i, clasesAbiertas.length), 0, quitada.c);
    quitada = null;
    pintaFicha();
    guarda();
  }
});

// la fecha, la nota y los datos del alumno se guardan al salir del campo,
// no en cada tecla
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && ficha && ficha.style.display === 'block'){
    ficha.style.display = 'none'; emailAbierto = null;
  }
});

document.addEventListener('change', function(e){
  const eco = e.target.closest('[data-eco] [data-campo]');
  if(eco){ guardaDinero(eco.closest('tr').dataset.eco, eco); return; }
  if(e.target && e.target.id === 'fi-proxima'){ guardaProxima(); return; }
  if(e.target && e.target.id === 'ficha-orden'){
    ordenFicha = e.target.value;
    try { localStorage.setItem('jn_panel_orden_ficha', ordenFicha); } catch(err) {}
    pintaFicha();
    return;
  }
  const f = e.target.closest('.fi-fecha');
  if(f){ clasesAbiertas[+f.dataset.i].fecha = f.value; pintaFicha(); repinta(); guarda(); return; }
  const n = e.target.closest('.fi-nota');
  if(n){ clasesAbiertas[+n.dataset.i].nota = n.value; guarda(); return; }
  if(e.target && e.target.closest('.fi-perfil') && ficha.contains(e.target)){
    if(e.target.id === PERFIL.activo || e.target.id === 'fi-acceso') avisaAcceso();
    guardaPerfil();
  }
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
    setTimeout(() => { rap.style.display = 'none'; loadStudents().then(() => { if(emailAbierto) abreFicha(emailAbierto); }); }, 1200);
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
  if(e.target.closest('#rap-cerrar')){ rap.style.display = 'none'; if(emailAbierto) abreFicha(emailAbierto); return; }

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

// Nivel e idioma se acumulan: pulsas A1 y A2 y salen las dos cosas. Por eso
// son listas y no un valor suelto, y por eso no hace falta ningún botón de
// «todos»: sin nada pulsado, están todas.
//
// El filtro «para quién» se ha quitado. Decía angloparlantes / italianos /
// cualquiera / trabajo, y con el idioma ya se sabe para quién es: una clase
// que solo existe en inglés es para un inglés.
const catFiltro = { nivel: [], pista: [], q: '' };

// Cómo se ordena el catálogo: por número, o por la última vez que diste cada
// clase (a quien sea). «antigua» pone primero las que todavía no has dado y
// luego las que hace más que no das: lo que buscas cuando no sabes qué poner.
let catOrden = 'num';
try { catOrden = localStorage.getItem('jn_panel_orden_cat') || catOrden; } catch(e) {}
if(['num', 'reciente', 'antigua'].indexOf(catOrden) < 0) catOrden = 'num';

// Qué clases se han dado, a quién y cuándo: sale de las fichas de los alumnos.
// «Dada» es una con fecha de hoy o anterior; con fecha futura, o sin fecha,
// está puesta pero todavía no cuenta.
function usoDeClases(){
  const hoy = hoyISO();
  const uso = new Map();
  porEmail.forEach(s => {
    (Array.isArray(s.clases) ? s.clases : []).forEach(a => {
      if(!a.id) return;
      let u = uso.get(a.id);
      if(!u){ u = { alumnos: new Set(), ultima: null, quien: '' }; uso.set(a.id, u); }
      u.alumnos.add(s.email);
      if(a.fecha && a.fecha <= hoy && (!u.ultima || a.fecha > u.ultima)){
        u.ultima = a.fecha;
        u.quien = nombreDe(s) || s.email;
      }
    });
  });
  return uso;
}

// El número de la clase, con el mismo aspecto en todas partes. La centena
// es el nivel (1xx A1, 2xx A1–A2, 3xx A2, 4xx A2–B1, 5xx B1–B2, 6xx B2) y
// van de diez en diez para poder meter una en medio sin mover las demás.
function numDe(c){
  return (c && c.num) ? '#' + c.num : '';
}

// Dos clases pueden estar atadas de dos maneras, y no son la misma cosa:
//
//   `profundiza` — la misma materia más adentro y a otro nivel. Por y para
//                  en A2 y por y para en B2 no son una copia.
//   `continua`   — la siguiente, que necesita la anterior para entenderse.
//                  «El motor manda» no se puede dar sin «Las seis formas».
//
// Solo se escribe en la de abajo; la de arriba se entera preguntando quién
// apunta a ella, así que no hay manera de que una lo diga y la otra no.
const LAZOS = [
  { campo: 'profundiza', abajo: 'A fondo sobre la ', arriba: 'Tiene versión a fondo: ' },
  { campo: 'continua', abajo: 'Continúa la ', arriba: 'Continúa en la ' }
];

function relacionDe(c){
  const todas = window.JN_CLASES || [];
  for(let i = 0; i < LAZOS.length; i++){
    const l = LAZOS[i];
    if(c[l.campo]){
      const base = todas.find(x => x.id === c[l.campo]);
      if(base) return l.abajo + numDe(base) + ' · ' + base.titulo.es;
    }
    const hija = todas.find(x => x[l.campo] === c.id);
    if(hija) return l.arriba + numDe(hija) + ' · ' + hija.titulo.es;
  }
  return '';
}

// Por número, no por el orden del archivo: así una clase nueva se puede
// escribir donde sea en clases.js y aparece en su sitio igualmente.
function porNumero(){
  return (window.JN_CLASES || []).slice()
    .sort((a, b) => (a.num || 9999) - (b.num || 9999));
}

// El orden del catálogo (por número o por la última vez que se dio): sirve
// tanto para el catálogo de abajo como para el de dentro de la ficha. Dentro
// de cada grupo, por número.
function ordenaCat(lista){
  if(catOrden === 'num') return lista;
  const uso = usoDeClases();
  const f = c => (uso.get(c.id) || {}).ultima || null;
  return lista.sort((a, b) => {
    const fa = f(a), fb = f(b);
    if(fa === fb) return (a.num || 9999) - (b.num || 9999);
    if(catOrden === 'reciente'){
      if(fa === null) return 1;
      if(fb === null) return -1;
      return fb.localeCompare(fa);
    }
    if(fa === null) return -1;
    if(fb === null) return 1;
    return fa.localeCompare(fb);
  });
}

function pintaFiltros(){
  const caja = document.getElementById('cat-filtros');
  if(!caja) return;
  // el rótulo va escrito, no en un icono: si la fuente de iconos no llega
  // a cargar quedarían dos filas de botones sueltos sin saber de qué
  function grupo(campo, rotulo, opciones){
    return `<div class="cat-fgrupo"><span class="cat-frot">${esc(rotulo)}</span>` +
      opciones.map(([v, etq]) =>
        `<button type="button" class="cat-fbtn${catFiltro[campo].indexOf(v) >= 0 ? ' on' : ''}"
          data-filtro="${campo}" data-valor="${esc(v)}">${esc(etq)}</button>`).join('') +
      '</div>';
  }
  const puestos = catFiltro.nivel.length + catFiltro.pista.length;
  caja.innerHTML =
    grupo('nivel', 'Nivel', ['A1', 'A2', 'B1', 'B2', 'C1'].map(n => [n, n])) +
    grupo('pista', 'Idioma', [['es', 'ES'], ['it', 'IT'], ['en', 'EN']]) +
    (puestos ? '<button type="button" class="cat-fbtn cat-flimpia" id="cat-limpia">' +
               'Quitar filtros</button>' : '') +
    `<input type="search" class="cat-buscar" id="cat-buscar" placeholder="número, título o etiqueta..."
      value="${esc(catFiltro.q)}" autocomplete="off">` +
    `<label class="fi-ordena cat-ordena">Ordenar
      <select id="cat-orden" class="pn-sel">
        <option value="num"${catOrden === 'num' ? ' selected' : ''}>Por número</option>
        <option value="reciente"${catOrden === 'reciente' ? ' selected' : ''}>Por fecha, la última dada primero</option>
        <option value="antigua"${catOrden === 'antigua' ? ' selected' : ''}>Por fecha, sin dar y las más antiguas primero</option>
      </select></label>`;
}

function pintaCatalogo(){
  const caja = document.getElementById('cat-lista');
  const res = document.getElementById('cat-resumen');
  if(!caja) return;
  const todas = porNumero();
  const q = catFiltro.q.trim().toLowerCase();

  const lista = todas.filter(c => {
    // «A2–B1» vale tanto para A2 como para B1, y con varios niveles puestos
    // basta con que encaje en uno
    if(catFiltro.nivel.length &&
       !catFiltro.nivel.some(n => String(c.nivel || '').indexOf(n) >= 0)) return false;
    const pistas = c.pistas || ['es', 'it', 'en'];
    if(catFiltro.pista.length &&
       !catFiltro.pista.some(p => pistas.indexOf(p) >= 0)) return false;
    if(q){
      // el número también se busca: escribes 7 y sale la 7
      const texto = [numDe(c), String(c.num || ''), c.titulo.es, c.titulo.it, c.titulo.en]
        .concat(c.etiquetas || []).join(' ').toLowerCase();
      if(!texto.includes(q)) return false;
    }
    return true;
  });

  ordenaCat(lista);

  if(res){
    res.textContent = (todas.length === 1 ? '1 clase escrita' : todas.length + ' clases escritas') +
      (lista.length !== todas.length ? ' · ' + lista.length + ' con estos filtros' : '');
  }

  const usoTodas = usoDeClases();
  caja.innerHTML = lista.length ? lista.map(c => {
    const chips = (c.etiquetas || []).map(e => `<span class="panel-course-chip">${esc(e)}</span>`).join('');
    // una clase solo existe en las pistas que diga; sin el campo, en las tres
    const idiomas = (c.pistas || ['es', 'it', 'en']).map(l =>
      `<a href="${esc(c.pagina)}-${l}.html" target="_blank" rel="noopener">${l.toUpperCase()}</a>`).join('');
    const rel = relacionDe(c);
    const u = usoTodas.get(c.id);
    const usoTxt = !u ? 'Sin dar todavía'
      : !u.ultima ? 'Puesta, aún sin dar'
      : 'Última vez: ' + fechaCorta(u.ultima) + ' · ' + u.quien +
        (u.alumnos.size > 1 ? ' · ' + u.alumnos.size + ' alumnos' : '');
    return `<div class="cat-row">
      <div class="cat-tit"><span class="cat-num">${esc(numDe(c))}</span>${esc(c.titulo.es)}</div>
      <div class="cat-chips"><span class="cat-uso">${esc(usoTxt)}</span>${rel ? `<span class="cat-rel">${esc(rel)}</span>` : ''}${chips}</div>
      <div class="cat-meta"><span class="cat-niv">${esc(c.nivel || '')}</span></div>
      <div class="cat-abrir">${idiomas}</div>
    </div>`;
  }).join('') : '<p class="panel-empty">Ninguna clase con estos filtros.</p>';
}

document.addEventListener('click', function(e){
  if(e.target.closest('#rap-abrir2')){ abreRapida(); return; }
  // desde dentro de la ficha: ya sabemos a quién
  if(e.target.closest('#rap-abrir3')){ ficha.style.display = 'none'; abreRapida(emailAbierto); return; }

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
    // se acumulan: pulsar añade, volver a pulsar quita
    const lista = catFiltro[f.dataset.filtro];
    const i = lista.indexOf(f.dataset.valor);
    if(i >= 0) lista.splice(i, 1); else lista.push(f.dataset.valor);
    pintaFiltros(); pintaCatalogo();
    return;
  }
  if(e.target.closest('#cat-limpia')){
    catFiltro.nivel = []; catFiltro.pista = [];
    pintaFiltros(); pintaCatalogo();
  }
});

document.addEventListener('input', function(e){
  if(e.target && e.target.id === 'ficha-busca'){ fcQ = e.target.value; pintaPicker(); return; }
  if(e.target && e.target.id === 'cat-buscar'){ catFiltro.q = e.target.value; pintaCatalogo(); }
});

document.addEventListener('change', function(e){
  if(e.target && (e.target.id === 'cat-orden' || e.target.id === 'ficha-cat-orden')){
    catOrden = e.target.value;
    try { localStorage.setItem('jn_panel_orden_cat', catOrden); } catch(err) {}
    const o = document.getElementById('cat-orden');
    if(o) o.value = catOrden;
    pintaCatalogo();
    pintaPicker();
  }
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
