// El cuaderno del alumno: un sitio donde escribir mientras da la clase.
//
// En una página de clase sale como un botón fijo abajo a la derecha que abre
// un recuadro en la esquina. Va ahí a propósito: si los apuntes estuvieran al
// final de la página habría que bajar para escribir y volver a subir para
// seguir leyendo, que es justo lo que queremos evitar.
//
// Lo que escribe el alumno se guarda en su documento, en el campo `apuntes`,
// que NADIE más toca: José solo escribe en `clases` desde el panel. Así los
// dos pueden estar escribiendo a la vez sin pisarse — `setDoc` con merge
// fusiona mapa a mapa, de modo que guardar los apuntes de una clase tampoco
// toca los de las demás.
//
// Expone `window.jnApuntesCaja(clase, destino)` para poder meter el mismo
// recuadro en otro sitio (las clases rápidas, que no tienen página propia).

(function(){
  // El idioma de ESTA página, no el de la web. Una clase para angloparlantes
  // solo existe en inglés: si el alumno tiene la web en italiano, la clase
  // sigue estando en inglés y el cuaderno tiene que ir a juego. Antes miraba
  // la pista y salía «I miei appunti» sobre una página en inglés.
  //
  // Se saca del nombre del archivo —página-en.html— que es de donde lo saca
  // toda la web. El atributo lang del <html> pone "es" en todas, así que no
  // sirve para esto.
  const porArchivo = (location.pathname.match(/-(es|it|en)\.html$/) || [])[1];
  const track = porArchivo || localStorage.getItem('jn_track') || 'es';
  const T = {
    es: { abrir: 'Mis apuntes', titulo: 'Mis apuntes', cerrar: 'Cerrar',
          sitio: 'Escribe aquí lo que salga en clase: ejemplos, frases, dudas...',
          guardando: 'Guardando...', guardado: 'Guardado', local: 'Guardado en este navegador',
          sinEmail: 'Entra con tu email para guardar tus apuntes.' },
    it: { abrir: 'I miei appunti', titulo: 'I miei appunti', cerrar: 'Chiudi',
          sitio: 'Scrivi qui quello che esce in lezione: esempi, frasi, dubbi...',
          guardando: 'Salvo...', guardado: 'Salvato', local: 'Salvato in questo browser',
          sinEmail: 'Entra con la tua email per salvare i tuoi appunti.' },
    en: { abrir: 'My notes', titulo: 'My notes', cerrar: 'Close',
          sitio: 'Write down whatever comes up in class: examples, phrases, questions...',
          guardando: 'Saving...', guardado: 'Saved', local: 'Saved in this browser',
          sinEmail: 'Sign in with your email to save your notes.' }
  }[track] || {};

  function email(){ return localStorage.getItem('jn_student_email') || ''; }
  function claveLocal(clase){ return 'jn_apuntes_' + (email() || 'anon') + '_' + clase; }

  function leeLocal(clase){
    try { return JSON.parse(localStorage.getItem(claveLocal(clase)) || 'null'); }
    catch(e){ return null; }
  }
  function guardaLocal(clase, texto){
    try {
      localStorage.setItem(claveLocal(clase),
        JSON.stringify({ t: texto, at: new Date().toISOString() }));
    } catch(e){ /* navegador sin sitio o en privado: no es grave */ }
  }

  // firebase-sync.js es un módulo y carga después de este script
  function cuandoHayaNube(fn){
    const t0 = Date.now();
    (function espera(){
      if(window.jnCloudGetStudentDoc){ fn(); return; }
      if(Date.now() - t0 > 8000) return;
      setTimeout(espera, 150);
    })();
  }

  // ─────────── el recuadro: se usa igual suelto que dentro del panel ───────────

  window.jnApuntesCaja = function(clase, destino, alCambiar){
    const area = document.createElement('textarea');
    area.className = 'apu-texto';
    area.placeholder = T.sitio;
    const estado = document.createElement('p');
    estado.className = 'apu-estado';
    destino.appendChild(area);
    destino.appendChild(estado);

    let ultimo = '';
    let temporizador = null;

    function avisa(){ if(alCambiar) alCambiar(!!area.value.trim()); }

    function guarda(yaMismo){
      const texto = area.value;
      if(texto === ultimo) return;
      clearTimeout(temporizador);
      const hazlo = function(){
        ultimo = texto;
        guardaLocal(clase, texto);
        if(!email()){ estado.textContent = T.sinEmail; return; }
        if(!window.jnCloudSetFields){ estado.textContent = T.local; return; }
        estado.textContent = T.guardando;
        // objeto anidado, no la clave 'apuntes.x': setDoc solo lee los puntos
        // como ruta de campo en updateDoc. Con merge los mapas se fusionan
        // clave a clave, así que esto no toca los apuntes de otras clases.
        const campo = { apuntes: {} };
        campo.apuntes[clase] = { t: texto, at: new Date().toISOString() };
        window.jnCloudSetFields(email(), campo)
          .then(function(){ estado.textContent = T.guardado; })
          // sin red se queda lo del navegador y se sube la próxima vez que
          // escriba con conexión: no se pierde nada por un corte
          .catch(function(){ estado.textContent = T.local; });
      };
      if(yaMismo) hazlo(); else temporizador = setTimeout(hazlo, 1200);
    }

    function pinta(dato){
      if(!dato || typeof dato.t !== 'string') return;
      area.value = dato.t;
      ultimo = dato.t;
      avisa();
    }

    area.addEventListener('input', function(){ avisa(); guarda(false); });
    area.addEventListener('blur', function(){ guarda(true); });
    window.addEventListener('pagehide', function(){ guarda(true); });
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden') guarda(true);
    });

    // primero lo del navegador, que es instantáneo; luego lo de la nube, que
    // manda si es más reciente (el alumno pudo escribir desde el móvil)
    pinta(leeLocal(clase));

    function trae(){
      const e = email();
      if(!e || !window.jnCloudGetStudentDoc) return;
      window.jnCloudGetStudentDoc(e).then(function(doc){
        const nube = doc && doc.apuntes && doc.apuntes[clase];
        if(!nube || typeof nube.t !== 'string') return;
        // si ya ha empezado a escribir aquí, no se le borra por algo que
        // llega después
        if(area.value !== ultimo) return;
        const local = leeLocal(clase);
        if(local && local.at && nube.at && local.at > nube.at) return;
        pinta(nube);
      }).catch(function(){ /* se queda lo del navegador */ });
    }

    cuandoHayaNube(trae);
    document.addEventListener('jn-access-granted', function(){ pinta(leeLocal(clase)); trae(); });

    return { guarda: function(){ guarda(true); }, tieneTexto: function(){ return !!area.value.trim(); } };
  };

  // ──────────────── el botón flotante, solo en páginas de clase ────────────────

  const clase = document.body.dataset.clase;
  if(!clase) return;

  const boton = document.createElement('button');
  boton.className = 'apu-boton';
  boton.type = 'button';
  boton.setAttribute('aria-expanded', 'false');
  boton.innerHTML = '<i class="ti ti-notebook" aria-hidden="true"></i>' +
                    '<span class="apu-boton-txt">' + T.abrir + '</span>' +
                    '<span class="apu-punto" hidden></span>';

  const panel = document.createElement('div');
  panel.className = 'apu-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="apu-cab"><b>' + T.titulo + '</b>' +
    '<button type="button" class="apu-cerrar" aria-label="' + T.cerrar + '">' +
    '<i class="ti ti-x" aria-hidden="true"></i></button></div>';

  document.body.appendChild(boton);
  document.body.appendChild(panel);

  const punto = boton.querySelector('.apu-punto');
  const caja = window.jnApuntesCaja(clase, panel, function(hay){ punto.hidden = !hay; });

  function abre(){
    panel.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    panel.querySelector('.apu-texto').focus();
  }
  function cierra(){
    caja.guarda();
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    boton.focus();
  }

  boton.addEventListener('click', function(){ panel.hidden ? abre() : cierra(); });
  panel.querySelector('.apu-cerrar').addEventListener('click', cierra);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !panel.hidden) cierra();
  });
})();
