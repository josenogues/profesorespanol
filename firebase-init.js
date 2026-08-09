// Inicializa la app de Firebase UNA sola vez (compartida por firebase-sync.js
// y por el panel del profesor, que la importan desde aquí) y activa
// Google Analytics para todo el sitio. No requiere ni pide nada al visitante.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQQen7Hh0sgJZXm5xLepQiRT6fcNI3O7g",
  authDomain: "aprendeespanol.firebaseapp.com",
  projectId: "aprendeespanol",
  storageBucket: "aprendeespanol.firebasestorage.app",
  messagingSenderId: "247718095843",
  appId: "1:247718095843:web:f9fa04d1c802378edf0ed6",
  measurementId: "G-ZLJ146V8H3"
};

export const app = initializeApp(firebaseConfig);

// isSupported() evita romper en navegadores/contextos donde Analytics no
// funciona (Safari con bloqueo estricto, modo privado en algunos casos...).
isSupported().then(ok => { if(ok) getAnalytics(app); }).catch(() => {});
