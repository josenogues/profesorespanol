// Sincronización de progreso (examen de nivel, niveles superados, contador de
// ejercicios) contra Firebase, usando el email ya validado por la puerta de
// acceso como clave — sin usuarios ni contraseñas propias.
//
// Si Firebase no carga (bloqueado, sin conexión, cuota agotada...) el sitio
// sigue funcionando exactamente igual que antes, solo con localStorage.

import { app } from "./firebase-init.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('jnCloud: timeout (' + label + ')')), ms))
  ]);
}

const db = getFirestore(app);

// Promesa que resuelve cuando hay sesión anónima lista para leer/escribir.
// Si Firebase no está disponible en 6s (bloqueado, sin red...), se rechaza
// y el resto del sitio sigue funcionando solo con localStorage.
window.jnCloudReady = (async () => {
  const auth = getAuth(app);
  await withTimeout(new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => { if(user) resolve(user); });
    signInAnonymously(auth).catch(reject);
  }), 6000, 'auth');
})();

window.jnCloudDeleteField = deleteField;

function studentRef(email){
  return doc(db, 'students', email.trim().toLowerCase());
}

window.jnCloudGetStudentDoc = async function(email){
  if(!email) return null;
  await window.jnCloudReady;
  const snap = await withTimeout(getDoc(studentRef(email)), 6000, 'getDoc');
  return snap.exists() ? snap.data() : null;
};

// fields: objeto plano, admite claves con puntos como rutas de campo,
// p. ej. {'examPending.es.A2': {...}} solo toca ese campo anidado.
// Añade siempre "updatedAt" (hora del servidor) para poder ver en el panel
// del profesor cuándo estuvo activo cada alumno por última vez.
window.jnCloudSetFields = async function(email, fields){
  if(!email) return;
  await window.jnCloudReady;
  const payload = Object.assign({}, fields, { updatedAt: serverTimestamp(), email: email.trim().toLowerCase() });
  await withTimeout(setDoc(studentRef(email), payload, { merge: true }), 6000, 'setDoc');
};

