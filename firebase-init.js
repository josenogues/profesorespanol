// Inicializa la app de Firebase UNA sola vez, compartida por firebase-sync.js
// y por el panel del profesor, que la importan desde aquí.
//
// Aquí vivía Google Analytics, y se ha quitado. En Europa la analítica es
// opcional y hay que pedir permiso ANTES de cargarla, con un banner de
// cookies que se pueda rechazar de verdad. Con doce alumnos y el panel del
// profesor —que ya dice quién entra, cuándo y qué hace— no compensaba:
// quitarla evita el banner, no deja nada que consentir y permite decir en la
// política de privacidad, sin letra pequeña, que esta web no te rastrea.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQQen7Hh0sgJZXm5xLepQiRT6fcNI3O7g",
  authDomain: "aprendeespanol.firebaseapp.com",
  projectId: "aprendeespanol",
  storageBucket: "aprendeespanol.firebasestorage.app",
  messagingSenderId: "247718095843",
  appId: "1:247718095843:web:f9fa04d1c802378edf0ed6"
};

export const app = initializeApp(firebaseConfig);
