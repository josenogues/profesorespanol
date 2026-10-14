# -*- coding: utf-8 -*-
"""Firebase de mentira para las pruebas: ni se toca el proyecto real ni los
datos de nadie.

Imita lo que la web usa de verdad: entrar con enlace por correo, leer y
escribir fichas de alumno, y —si se pide— las mismas reglas de seguridad que
hay en producción, para poder comprobar que la web sigue funcionando con los
permisos ya cerrados.
"""
import json

APP = "export function initializeApp(c){return{__app:1}}"
ANALYTICS = ("export function getAnalytics(){return{}}\n"
             "export function isSupported(){return Promise.resolve(false)}")

# ── Entrar con enlace por correo ──
# Quién ha entrado se guarda en localStorage, así que sobrevive a una recarga
# igual que la sesión de verdad de Firebase.
AUTH = """
const QUIEN = '__falso_usuario';
const ENLACE = '__falso_enlace';
function lee(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
export function getAuth(){
  return { get currentUser(){ const e = lee(QUIEN); return e ? {email:e, uid:'u-'+e} : null; } };
}
export function onAuthStateChanged(a, cb){
  setTimeout(() => cb(a && a.currentUser), 10);
  return () => {};
}
export function sendSignInLinkToEmail(a, email, s){
  const dato = {email: email, url: (s && s.url) || location.href};
  try { localStorage.setItem(ENLACE, JSON.stringify(dato)); } catch(e){}
  globalThis.__ENLACES = (globalThis.__ENLACES || []).concat([dato]);
  return Promise.resolve();
}
export function isSignInWithEmailLink(a, url){ return String(url).indexOf('oobCode=FALSO') >= 0; }
export function signInWithEmailLink(a, email, url){
  let pedido = null;
  try { pedido = JSON.parse(lee(ENLACE) || 'null'); } catch(e){}
  // el enlace solo vale con el email que lo pidió, como en Firebase de verdad
  if(!pedido || pedido.email !== email){
    const err = new Error('enlace que no cuadra');
    err.code = 'auth/invalid-email';
    return Promise.reject(err);
  }
  try { localStorage.setItem(QUIEN, email); } catch(e){}
  return Promise.resolve({user:{email: email}});
}
export function signOut(){ try { localStorage.removeItem(QUIEN); } catch(e){} return Promise.resolve(); }
export function signInAnonymously(){ return Promise.resolve({user:{uid:'anon'}}); }
"""


def firestore(db, reglas=False, profesor=None):
    """setDoc con merge de verdad; con `reglas`, los mismos permisos que
    producción: cada uno solo su ficha, y el profesor todas."""
    return """
// los sellos de tiempo del JSON vuelven a ser objetos con toMillis/toDate,
// que es lo que el panel espera de Firestore
function revive(o){
  if(!o || typeof o !== 'object') return o;
  if(o.__ts){ const t = o.__ms; return {__ts:1, toMillis:()=>t, toDate:()=>new Date(t)}; }
  for(const k of Object.keys(o)) o[k] = revive(o[k]);
  return o;
}
const DB = (globalThis.__DB = revive(%s));
const REGLAS = %s;
const PROFESOR = %s;
function quien(){ try { return localStorage.getItem('__falso_usuario'); } catch(e){ return null; } }
function puede(id){
  if(!REGLAS) return true;
  const yo = quien();
  if(!yo) return false;
  if(PROFESOR && yo === PROFESOR) return true;
  return id != null && String(id).toLowerCase() === yo.toLowerCase();
}
function niego(que){
  const err = new Error('Missing or insufficient permissions. (' + que + ')');
  err.code = 'permission-denied';
  return Promise.reject(err);
}
function fusiona(viejo, nuevo){
  const out = Object.assign({}, viejo || {});
  for(const k of Object.keys(nuevo)){
    const v = nuevo[k];
    if(v === '__del'){ delete out[k]; continue; }
    const plano = o => o && typeof o === 'object' && !Array.isArray(o) && !o.__ts;
    out[k] = (plano(v) && plano(out[k])) ? fusiona(out[k], v) : v;
  }
  return out;
}
export function getFirestore(){ return {}; }
export function collection(d,n){ return {__col:n}; }
export function doc(d,c,id){ return {__col:c,__id:id}; }
export function getDocs(){
  // listar la colección entera solo lo puede hacer el profesor
  if(REGLAS && quien() !== PROFESOR) return niego('list');
  const i=Object.values(DB).map(d=>({data:()=>d}));
  return Promise.resolve({forEach:f=>i.forEach(f), size:i.length});
}
export function getDoc(r){
  if(!puede(r.__id)) return niego('get ' + r.__id);
  const d=DB[r.__id];
  return Promise.resolve({exists:()=>!!d, data:()=>d});
}
export function setDoc(r,data,op){
  if(!puede(r.__id)) return niego('set ' + r.__id);
  DB[r.__id] = (op && op.merge) ? fusiona(DB[r.__id], data) : data;
  return Promise.resolve();
}
export function deleteDoc(r){
  if(!puede(r.__id)) return niego('delete ' + r.__id);
  delete DB[r.__id]; return Promise.resolve();
}
export function deleteField(){ return '__del'; }
export function serverTimestamp(){ const t=Date.now();
  return {__ts:1, toMillis:()=>t, toDate:()=>new Date(t)}; }
""" % (json.dumps(db), 'true' if reglas else 'false', json.dumps(profesor))


def monta(ctx, db, reglas=False, profesor=None):
    """Pone los stubs y corta todo lo que saldría a internet de verdad."""
    stubs = {"firebase-app.js": APP, "firebase-analytics.js": ANALYTICS,
             "firebase-auth.js": AUTH,
             "firebase-firestore.js": firestore(db, reglas, profesor)}

    def r(route):
        for nombre, cuerpo in stubs.items():
            if route.request.url.endswith(nombre):
                return route.fulfill(status=200, content_type="text/javascript", body=cuerpo)
        route.abort()

    ctx.route("**gstatic.com/firebasejs/**", r)
    for pat in ("**googleapis.com/**", "**jsdelivr.net/**", "**google.com/**"):
        ctx.route(pat, lambda x: x.abort())


def hora(dias=0):
    """Un sello de tiempo como el que guarda Firestore."""
    import time
    t = int((time.time() + dias * 86400) * 1000)
    return {"__ts": 1, "__ms": t}


ENLACE_FALSO = "?apiKey=FALSA&oobCode=FALSO&mode=signIn"
