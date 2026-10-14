// Entrada de los alumnos y sincronización de su progreso contra Firebase.
//
// Se entra con un enlace por correo (sign-in link): el alumno escribe su
// email, le llega un enlace, lo pulsa y ya está dentro. Sin contraseñas que
// recordar y, sobre todo, con una identidad de verdad: antes la sesión era
// anónima, así que Firebase no podía saber quién era quién y las reglas no
// tenían nada que comprobar — cualquiera podía leer las fichas de todos.
//
// Si Firebase no carga (bloqueado, sin conexión...) el sitio sigue
// funcionando con lo que haya en localStorage; lo que no se puede es entrar
// por primera vez.

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged, sendSignInLinkToEmail,
         isSignInWithEmailLink, signInWithEmailLink, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteField, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('jnCloud: timeout (' + label + ')')), ms))
  ]);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Dónde se apunta el email mientras el alumno va a mirar su correo. Firebase
// lo pide de vuelta al volver del enlace, para que un enlace interceptado no
// sirva por sí solo.
const PENDIENTE = 'jn_email_pendiente';

function limpia(email){
  return String(email || '').trim().toLowerCase();
}

// Resuelve con el email de quien ha entrado, o con null si no ha entrado
// nadie. NO rechaza por «no hay nadie»: eso no es un error, es el estado
// normal de quien llega por primera vez. Solo rechaza si Firebase no
// responde, que es lo que la puerta trata como «no se sabe».
window.jnCloudReady = (async () => {
  // ¿venimos del enlace del correo? entonces aquí se termina de entrar
  if(isSignInWithEmailLink(auth, location.href)){
    let email = localStorage.getItem(PENDIENTE);
    // si abre el enlace en otro navegador (del móvil, por ejemplo) ya no
    // tenemos su email apuntado y hay que pedírselo otra vez
    if(!email) email = window.prompt('Para terminar de entrar, escribe otra vez tu email:');
    if(email){
      try {
        await signInWithEmailLink(auth, limpia(email), location.href);
        localStorage.removeItem(PENDIENTE);
      } catch(err){
        window.jnCloudFalloEnlace = (err && err.code) || 'error';
      }
    }
    // el enlace lleva el código pegado en la barra de direcciones: se quita
    // para que no quede en el historial ni se comparta sin querer
    try { history.replaceState(null, '', location.pathname + location.hash); } catch(e){}
  }

  return await withTimeout(new Promise(ok => {
    let hecho = false;
    const para = onAuthStateChanged(auth, u => {
      if(hecho) return;
      hecho = true;
      ok(u ? limpia(u.email) : null);
      setTimeout(() => { try { para(); } catch(e){} }, 0);
    });
  }), 10000, 'auth');
})();

// El email con el que se ha entrado. Es la única fuente buena: lo que haya en
// localStorage es solo una pista para no parpadear al cargar.
window.jnCloudEmail = function(){
  return (auth.currentUser && limpia(auth.currentUser.email)) || null;
};

window.jnCloudEnviaEnlace = async function(email){
  const e = limpia(email);
  if(!e || e.indexOf('@') < 0) throw new Error('email vacío');
  // se guarda ANTES de mandar: si la pestaña se cierra, al volver del enlace
  // seguimos sabiendo a quién se lo mandamos
  localStorage.setItem(PENDIENTE, e);
  await withTimeout(sendSignInLinkToEmail(auth, e, {
    // el enlace devuelve al alumno a la misma página donde estaba
    url: location.href,
    handleCodeInApp: true
  }), 12000, 'sendLink');
};

window.jnCloudSal = async function(){
  try { await signOut(auth); } catch(e){}
  localStorage.removeItem(PENDIENTE);
};

window.jnCloudDeleteField = deleteField;

function studentRef(email){
  return doc(db, 'students', limpia(email));
}

window.jnCloudGetStudentDoc = async function(email){
  if(!email) return null;
  await window.jnCloudReady;
  const snap = await withTimeout(getDoc(studentRef(email)), 6000, 'getDoc');
  return snap.exists() ? snap.data() : null;
};

// fields: el objeto a fusionar. Para tocar un campo de dentro se anida,
// p. ej. {examPending: {es: {A2: {...}}}}: con merge los mapas se fusionan
// clave a clave y lo demás se queda como estaba. OJO: no vale la clave
// 'examPending.es.A2' — setDoc no lee los puntos como ruta (eso es updateDoc)
// y crearía un campo llamado literalmente así.
// Añade siempre "updatedAt" (hora del servidor) para poder ver en el panel
// del profesor cuándo estuvo activo cada alumno por última vez.
window.jnCloudSetFields = async function(email, fields){
  if(!email) return;
  await window.jnCloudReady;
  const payload = Object.assign({}, fields, { updatedAt: serverTimestamp(), email: limpia(email) });
  await withTimeout(setDoc(studentRef(email), payload, { merge: true }), 6000, 'setDoc');
};
