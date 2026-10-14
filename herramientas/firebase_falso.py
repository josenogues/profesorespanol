# -*- coding: utf-8 -*-
"""Firebase de mentira: ni se toca el proyecto real ni los datos de nadie."""
import json

APP = "export function initializeApp(c){return{__app:1}}"
ANALYTICS = ("export function getAnalytics(){return{}}\n"
             "export function isSupported(){return Promise.resolve(false)}")
AUTH = ("export function getAuth(){return{}}\n"
        "export function signInAnonymously(){return Promise.resolve({user:{uid:'anon'}})}\n"
        "export function onAuthStateChanged(a,cb){cb({uid:'anon'});return()=>{}}")


def firestore(db):
    """setDoc con merge de verdad: los mapas se fusionan clave a clave."""
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
export function getDocs(){ const i=Object.values(DB).map(d=>({data:()=>d}));
  return Promise.resolve({forEach:f=>i.forEach(f), size:i.length}); }
export function getDoc(r){ const d=DB[r.__id];
  return Promise.resolve({exists:()=>!!d, data:()=>d}); }
export function setDoc(r,data,op){ DB[r.__id] = (op && op.merge)
  ? fusiona(DB[r.__id], data) : data; return Promise.resolve(); }
export function deleteDoc(r){ delete DB[r.__id]; return Promise.resolve(); }
export function deleteField(){ return '__del'; }
export function serverTimestamp(){ const t=Date.now();
  return {__ts:1, toMillis:()=>t, toDate:()=>new Date(t)}; }
""" % json.dumps(db)


def monta(ctx, db, deja_sheet=False):
    """Pone los stubs y corta todo lo que saldría a internet de verdad."""
    stubs = {"firebase-app.js": APP, "firebase-analytics.js": ANALYTICS,
             "firebase-auth.js": AUTH, "firebase-firestore.js": firestore(db)}

    def r(route):
        for nombre, cuerpo in stubs.items():
            if route.request.url.endswith(nombre):
                return route.fulfill(status=200, content_type="text/javascript", body=cuerpo)
        route.abort()

    ctx.route("**gstatic.com/firebasejs/**", r)
    for pat in ("**googleapis.com/**", "**jsdelivr.net/**", "**google.com/**"):
        ctx.route(pat, lambda x: x.abort())
    # OJO: Playwright prueba las rutas de la última a la primera, así que la
    # hoja de mentira tiene que registrarse DESPUÉS del abort de google.com.
    if deja_sheet is not False:
        ctx.route("**docs.google.com/**", lambda x: x.fulfill(
            status=200, content_type="text/csv", body=deja_sheet))


def hora(dias=0):
    """Un sello de tiempo como el que guarda Firestore."""
    import time
    t = int((time.time() + dias * 86400) * 1000)
    return {"__ts": 1, "__ms": t}
