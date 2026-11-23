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
          sinEmail: 'Entra con tu email para guardar tus apuntes.',
          traer: 'Traer', traerT: 'Traer a los apuntes lo que has subrayado en la clase',
          sinSel: 'Subraya algo en la clase y vuelve a pulsar «Traer».',
          bajar: 'Descargar', bajarT: 'Descargar estos apuntes como archivo de texto',
          estirar: 'Arrastra para cambiar el tamaño',
          esta: 'Esta clase', todas: 'Todos mis apuntes', volver: 'Volver a la lista',
          irClase: 'Abrir la clase', irClaseT: 'Abre esa clase en otra pestaña: esta se queda aquí',
          sinOtras: 'Todavía no tienes apuntes en otras clases.', cargando: 'Cargando...',
          repaso: 'Repaso', sinTitulo: 'Clase', bajarTodo: 'Descargar todos mis apuntes',
          locale: 'es-ES' },
    it: { abrir: 'I miei appunti', titulo: 'I miei appunti', cerrar: 'Chiudi',
          sitio: 'Scrivi qui quello che esce in lezione: esempi, frasi, dubbi...',
          guardando: 'Salvo...', guardado: 'Salvato', local: 'Salvato in questo browser',
          sinEmail: 'Entra con la tua email per salvare i tuoi appunti.',
          traer: 'Porta', traerT: 'Porta negli appunti quello che hai selezionato nella lezione',
          sinSel: 'Seleziona qualcosa nella lezione e ripremi «Porta».',
          bajar: 'Scarica', bajarT: 'Scarica questi appunti come file di testo',
          estirar: 'Trascina per cambiare dimensione',
          esta: 'Questa lezione', todas: 'Tutti i miei appunti', volver: 'Torna alla lista',
          irClase: 'Apri la lezione', irClaseT: 'Apre quella lezione in un’altra scheda: questa resta qui',
          sinOtras: 'Non hai ancora appunti in altre lezioni.', cargando: 'Carico...',
          repaso: 'Ripasso', sinTitulo: 'Lezione', bajarTodo: 'Scarica tutti i miei appunti',
          locale: 'it-IT' },
    en: { abrir: 'My notes', titulo: 'My notes', cerrar: 'Close',
          sitio: 'Write down whatever comes up in class: examples, phrases, questions...',
          guardando: 'Saving...', guardado: 'Saved', local: 'Saved in this browser',
          sinEmail: 'Sign in with your email to save your notes.',
          traer: 'Bring in', traerT: 'Bring what you selected in the class into your notes',
          sinSel: 'Select something in the class and press «Bring in» again.',
          bajar: 'Download', bajarT: 'Download these notes as a text file',
          estirar: 'Drag to resize',
          esta: 'This class', todas: 'All my notes', volver: 'Back to the list',
          irClase: 'Open the class', irClaseT: 'Opens that class in another tab: this one stays here',
          sinOtras: 'You don’t have notes in other classes yet.', cargando: 'Loading...',
          repaso: 'Review', sinTitulo: 'Class', bajarTodo: 'Download all my notes',
          locale: 'en-GB' }
  }[track] || {};

  // la de José es la suya: ver script.js, window.jnEmailFicha
  function email(){
    return (window.jnEmailFicha && window.jnEmailFicha()) ||
           localStorage.getItem('jn_student_email') || '';
  }
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

  // Clave con la que se guardan los apuntes de una clase. Las del catálogo
  // tienen id; una rápida lleva el suyo desde que se crea, y las creadas
  // antes de que existiera el cuaderno se apañan con fecha + título.
  // La usan también «Mis clases» y la lista de «Todos mis apuntes».
  window.jnClaveApuntes = function(a){
    if(!a.rapida) return a.id;
    return a.rapida.rid || ('r-' + (a.fecha || 'sinfecha') + '-' +
      (a.rapida.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24));
  };

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

    // insertar texto donde está el cursor, como si lo hubiera escrito él
    function inserta(txt){
      const i = area.selectionStart, j = area.selectionEnd;
      const antes = area.value.slice(0, i);
      const sep = (!antes || antes.endsWith('\n')) ? '' : '\n';
      area.value = antes + sep + txt + area.value.slice(j);
      const pos = (antes + sep + txt).length;
      area.setSelectionRange(pos, pos);
      area.focus();
      avisa();
      guarda(false);
    }

    return { guarda: function(){ guarda(true); },
             tieneTexto: function(){ return !!area.value.trim(); },
             texto: function(){ return area.value; },
             inserta: inserta,
             avisa: function(txt){ estado.textContent = txt; } };
  };

  // Un archivo de texto hecho en el navegador: nada sale a ningún servidor.
  window.jnApuntesDescarga = function(nombre, texto){
    try {
      const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre.replace(/[^\w .-]+/g, '-').slice(0, 80) + '.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch(e){ return false; }
  };

  // ──────────────── el botón flotante, solo en páginas de clase ────────────────
  //
  // En «Mis clases» el cuaderno también está, con el mismo botón, pero solo
  // con «Todos mis apuntes»: ahí no hay una clase delante. (El botón de
  // reservar, que antes ocupaba esa esquina, va arriba junto a «Entra en el
  // aula».)

  const clase = document.body.dataset.clase;
  const soloLista = !clase && !!document.getElementById('mc-cont');
  if(!clase && !soloLista) return;
  let quien = null;              // lo que lo abrió, para devolverle el foco

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
  // el tirador va en la esquina de arriba a la izquierda: el panel está
  // anclado abajo a la derecha, así que estirar hacia allí lo agranda
  panel.innerHTML =
    '<div class="apu-tirador" title="' + T.estirar + '"></div>' +
    '<div class="apu-cab"><b>' + T.titulo + '</b>' +
    '<span class="apu-acciones">' +
    '<button type="button" class="apu-traer" title="' + T.traerT + '">' + T.traer + '</button>' +
    '<button type="button" class="apu-bajar" title="' + T.bajarT + '">' + T.bajar + '</button>' +
    '</span>' +
    // el icono viene de un CDN: si no carga, la x tiene que seguir viéndose
    '<button type="button" class="apu-cerrar" aria-label="' + T.cerrar + '">\u00d7</button></div>' +
    '<div class="apu-pestanas" role="tablist">' +
    '<button type="button" role="tab" class="apu-pest" data-v="esta" aria-selected="true">' + T.esta + '</button>' +
    '<button type="button" role="tab" class="apu-pest" data-v="todas" aria-selected="false">' + T.todas + '</button>' +
    '</div>' +
    '<div class="apu-vista apu-v-esta"></div>' +
    '<div class="apu-vista apu-v-todas" hidden>' +
      '<div class="apu-lista"></div>' +
      '<div class="apu-detalle" hidden>' +
        '<div class="apu-det-cab">' +
          '<button type="button" class="apu-volver"><i class="ti ti-arrow-left" aria-hidden="true"></i> ' + T.volver + '</button>' +
          '<a class="apu-ir" target="_blank" rel="noopener" title="' + T.irClaseT + '">' + T.irClase +
          ' <i class="ti ti-external-link" aria-hidden="true"></i></a>' +
        '</div>' +
        '<b class="apu-det-tit"></b>' +
        '<div class="apu-det-cajas"></div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(boton);
  document.body.appendChild(panel);
  if(soloLista){
    // sin pestañas ni «Traer»: solo la lista de todas las clases
    panel.classList.add('apu-solo-lista');
    panel.querySelector('.apu-pestanas').hidden = true;
    panel.querySelector('.apu-traer').remove();
  }

  const punto = boton.querySelector('.apu-punto');
  const vEsta = panel.querySelector('.apu-v-esta');
  const vTodas = panel.querySelector('.apu-v-todas');
  const lista = panel.querySelector('.apu-lista');
  const detalle = panel.querySelector('.apu-detalle');
  const caja = clase ? window.jnApuntesCaja(clase, vEsta, function(hay){ punto.hidden = !hay; }) : null;

  // ─────────── «Todos mis apuntes»: los de las otras clases, sin salir de esta ───────────
  //
  // El alumno sigue en la clase que está viendo: desde el mismo cuaderno pasa
  // a la lista, abre los apuntes de otra clase y puede seguir escribiendo en
  // ellos. El enlace a esa clase se abre en otra pestaña a propósito.

  let vista = soloLista ? 'todas' : 'esta';
  if(soloLista){ vEsta.hidden = true; vTodas.hidden = false; }
  let abierta = null;            // clave de la clase abierta en la lista
  const otras = {};              // clave → { caja, el }, se crean al abrirlas
  let filas = [];                // lo último que se pintó en la lista

  // la caja en la que se está escribiendo ahora, o null si se ve la lista
  function enUso(){
    if(vista === 'esta') return caja;
    return abierta ? otras[abierta].caja : null;
  }

  // las páginas de clase no cargan el catálogo: se trae solo si hace falta
  function catalogo(){
    return new Promise(function(listo){
      if(window.jnClasePorId){ listo(); return; }
      const s = document.createElement('script');
      s.src = 'clases.js?v=cb7f00e3c3';
      s.onload = s.onerror = function(){ listo(); };
      document.head.appendChild(s);
    });
  }

  function fichaNube(){
    const e = email();
    if(!e) return Promise.resolve(null);
    return new Promise(function(listo){
      cuandoHayaNube(function(){
        window.jnCloudGetStudentDoc(e).then(listo).catch(function(){ listo(null); });
      });
      setTimeout(function(){ listo(null); }, 9000);
    });
  }

  function tituloDe(c){ return (c.titulo && (c.titulo[track] || c.titulo.es)) || c.id; }

  // título y página de cada clave: del catálogo, o de la asignación si es rápida
  function datosDe(clave, asignadas){
    const a = asignadas.find(function(x){ return window.jnClaveApuntes(x) === clave; });
    const c0 = window.jnClasePorId && window.jnClasePorId(clave);
    if(a && a.rapida){
      const r = a.rapida;
      const base = r.repasoDe && window.jnClasePorId && window.jnClasePorId(r.repasoDe);
      const pistaWeb = localStorage.getItem('jn_track') || track;
      return { titulo: base ? T.repaso + ': ' + tituloDe(base) : (r.titulo || T.sinTitulo),
               href: 'mis-clases-' + pistaWeb + '.html' };
    }
    if(c0){
      const pista = (c0.pistas && c0.pistas.indexOf(track) < 0) ? c0.pistas[0] : track;
      return { titulo: tituloDe(c0), href: c0.pagina + '-' + pista + '.html' };
    }
    return { titulo: T.sinTitulo, href: null };
  }

  function fechaCorta(iso){
    const d = iso ? new Date(iso) : null;
    if(!d || isNaN(d)) return '';
    return d.toLocaleDateString(T.locale, { day: 'numeric', month: 'long' });
  }

  function pintaLista(){
    lista.innerHTML = '<p class="apu-vacio">' + T.cargando + '</p>';
    Promise.all([catalogo(), fichaNube()]).then(function(r){
      const doc = r[1];
      const todos = {};
      const nube = (doc && doc.apuntes) || {};
      Object.keys(nube).forEach(function(k){
        if(nube[k] && typeof nube[k].t === 'string') todos[k] = nube[k];
      });
      // lo del navegador manda si es más reciente: se pudo escribir sin red
      const pre = 'jn_apuntes_' + (email() || 'anon') + '_';
      try {
        for(let i = 0; i < localStorage.length; i++){
          const k = localStorage.key(i);
          if(!k || k.indexOf(pre) !== 0) continue;
          const id = k.slice(pre.length);
          const l = leeLocal(id);
          if(!l || typeof l.t !== 'string') continue;
          if(!todos[id] || (l.at && todos[id].at && l.at > todos[id].at)) todos[id] = l;
        }
      } catch(e){ /* sin navegador, lo de la nube */ }
      // las que ya están abiertas aquí, con lo último que se ha escrito
      Object.keys(otras).forEach(function(k){
        todos[k] = { t: otras[k].caja.texto(), at: (todos[k] && todos[k].at) || '' };
      });

      const asignadas = (doc && Array.isArray(doc.clases)) ? doc.clases : [];
      filas = Object.keys(todos)
        .filter(function(k){ return k !== clase && todos[k].t.trim(); })
        .map(function(k){
          const d = datosDe(k, asignadas);
          return { clave: k, titulo: d.titulo, href: d.href, t: todos[k].t, at: todos[k].at || '' };
        })
        .sort(function(x, y){ return y.at.localeCompare(x.at); });

      lista.innerHTML = '';
      if(!filas.length){
        lista.innerHTML = '<p class="apu-vacio">' + T.sinOtras + '</p>';
        return;
      }
      filas.forEach(function(f){
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'apu-item';
        const tit = document.createElement('span'); tit.className = 'apu-item-tit'; tit.textContent = f.titulo;
        const fe = document.createElement('span'); fe.className = 'apu-item-fecha'; fe.textContent = fechaCorta(f.at);
        const tx = document.createElement('span'); tx.className = 'apu-item-txt';
        tx.textContent = f.t.trim().split('\n')[0].slice(0, 120);
        b.appendChild(tit); b.appendChild(fe); b.appendChild(tx);
        b.addEventListener('click', function(){ abreOtra(f); });
        lista.appendChild(b);
      });
    });
  }

  function abreOtra(f){
    if(!otras[f.clave]){
      const el = document.createElement('div');
      el.className = 'apu-det-caja';
      panel.querySelector('.apu-det-cajas').appendChild(el);
      otras[f.clave] = { el: el, caja: window.jnApuntesCaja(f.clave, el) };
    }
    Object.keys(otras).forEach(function(k){ otras[k].el.hidden = (k !== f.clave); });
    abierta = f.clave;
    detalle.querySelector('.apu-det-tit').textContent = f.titulo;
    const ir = detalle.querySelector('.apu-ir');
    if(f.href){ ir.href = f.href; ir.hidden = false; } else { ir.removeAttribute('href'); ir.hidden = true; }
    detalle.dataset.titulo = f.titulo;
    lista.hidden = true;
    detalle.hidden = false;
    pintaAcciones();
  }

  function cierraOtra(){
    if(abierta) otras[abierta].caja.guarda();
    abierta = null;
    detalle.hidden = true;
    lista.hidden = false;
    pintaAcciones();
    pintaLista();
  }
  panel.querySelector('.apu-volver').addEventListener('click', cierraOtra);

  // «Traer» solo tiene sentido con unos apuntes delante; en la lista,
  // «Descargar» se lleva todos
  function pintaAcciones(){
    const t = panel.querySelector('.apu-traer');
    const b = panel.querySelector('.apu-bajar');
    if(t) t.hidden = !enUso();
    b.title = enUso() ? T.bajarT : T.bajarTodo;
  }

  function cambiaVista(v){
    if(v === vista) { if(v === 'todas' && abierta) cierraOtra(); return; }
    const c = enUso(); if(c) c.guarda();
    vista = v;
    panel.querySelectorAll('.apu-pest').forEach(function(p){
      p.setAttribute('aria-selected', p.dataset.v === v ? 'true' : 'false');
    });
    vEsta.hidden = v !== 'esta';
    vTodas.hidden = v !== 'todas';
    if(v === 'todas' && !abierta) pintaLista();
    pintaAcciones();
  }
  panel.querySelectorAll('.apu-pest').forEach(function(p){
    p.addEventListener('click', function(){ cambiaVista(p.dataset.v); });
  });

  function abre(){
    panel.hidden = false;
    aplicaTam();
    boton.setAttribute('aria-expanded', 'true');
    if(quien) quien.setAttribute('aria-expanded', 'true');
    if(vista === 'esta') vEsta.querySelector('.apu-texto').focus();
    else if(!abierta) pintaLista();
  }
  function cierra(){
    const c = enUso(); if(c) c.guarda();
    if(caja) caja.guarda();
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    if(quien){ quien.setAttribute('aria-expanded', 'false'); quien.focus(); }
    else boton.focus();
  }
  window.jnAbreApuntes = function(desde){
    if(desde) quien = desde;
    panel.hidden ? abre() : cierra();
  };

  boton.addEventListener('click', function(){ panel.hidden ? abre() : cierra(); });
  panel.querySelector('.apu-cerrar').addEventListener('click', cierra);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !panel.hidden) cierra();
  });

  // ─────────────── traer a los apuntes lo que subrayas en la clase ───────────────
  //
  // Se guarda la última selección hecha FUERA del cuaderno: al pulsar el botón
  // el foco se va al textarea y la selección de la página se pierde, así que
  // hay que haberla apuntado antes.
  let ultimaSel = '';
  document.addEventListener('selectionchange', function(){
    const sel = window.getSelection();
    if(!sel || sel.isCollapsed) return;
    const n = sel.anchorNode;
    const el = n && (n.nodeType === 1 ? n : n.parentNode);
    if(el && panel.contains(el)) return;          // lo escrito en el cuaderno, no
    const txt = sel.toString().replace(/\s+/g, ' ').trim();
    if(txt) ultimaSel = txt;
  });

  if(!soloLista) panel.querySelector('.apu-traer').addEventListener('click', function(){
    const c = enUso();
    if(!c) return;
    if(!ultimaSel){ c.avisa(T.sinSel); return; }
    c.inserta('«' + ultimaSel + '»\n');
  });

  panel.querySelector('.apu-bajar').addEventListener('click', function(){
    const hoy = new Date().toISOString().slice(0, 10);
    if(vista === 'esta'){
      const h = document.querySelector('.grammar-section h3, .grammar-section h2');
      const titulo = (h && h.textContent.trim()) || clase;
      window.jnApuntesDescarga('apuntes-' + clase + '-' + hoy,
        titulo + '\n' + hoy + '\n\n' + caja.texto() + '\n');
    } else if(abierta){
      window.jnApuntesDescarga('apuntes-' + abierta + '-' + hoy,
        (detalle.dataset.titulo || abierta) + '\n' + hoy + '\n\n' + otras[abierta].caja.texto() + '\n');
    } else {
      // toda la lista y, delante, los de esta clase si hay
      const trozos = [];
      if(caja && caja.tieneTexto()){
        const h = document.querySelector('.grammar-section h3, .grammar-section h2');
        trozos.push(((h && h.textContent.trim()) || clase) + '\n\n' + caja.texto());
      }
      filas.forEach(function(f){
        trozos.push(f.titulo + (f.at ? '\n' + fechaCorta(f.at) : '') + '\n\n' + f.t);
      });
      if(!trozos.length) return;
      window.jnApuntesDescarga('mis-apuntes-' + hoy,
        trozos.join('\n\n' + '─'.repeat(40) + '\n\n') + '\n');
    }
  });

  // ─────────────────────── estirar el cuaderno a mano ───────────────────────
  //
  // El tamaño es una preferencia de quien mira, así que vive en su navegador
  // y no en su ficha. En móvil el panel ocupa el ancho entero y no se toca.
  const TAM = 'jn_apuntes_tam';
  const MIN_W = 280, MIN_H = 200;

  function anchoSuelto(){ return window.innerWidth > 620; }

  // el CSS trae un max-height que capa el alto; en cuanto el alumno lo
  // estira a mano manda él, y el límite lo ponemos nosotros contra la ventana
  function suelta(){ panel.style.maxWidth = 'none'; panel.style.maxHeight = 'none'; }
  function ata(){ panel.style.maxWidth = ''; panel.style.maxHeight = ''; }

  function aplicaTam(){
    if(!anchoSuelto()){
      panel.style.width = ''; panel.style.height = ''; ata(); return;
    }
    let t = null;
    try { t = JSON.parse(localStorage.getItem(TAM) || 'null'); } catch(e){ t = null; }
    if(!t || !t.w || !t.h){ ata(); return; }
    suelta();
    panel.style.width = Math.min(t.w, window.innerWidth - 44) + 'px';
    panel.style.height = Math.min(t.h, window.innerHeight - 110) + 'px';
  }

  const tirador = panel.querySelector('.apu-tirador');
  let arrastre = null;

  tirador.addEventListener('pointerdown', function(e){
    if(!anchoSuelto()) return;
    const r = panel.getBoundingClientRect();
    arrastre = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    suelta();
    tirador.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  tirador.addEventListener('pointermove', function(e){
    if(!arrastre) return;
    // el panel está anclado abajo a la derecha: tirando hacia arriba y hacia
    // la izquierda se hace más grande
    const w = Math.max(MIN_W, Math.min(arrastre.w + (arrastre.x - e.clientX),
                                       window.innerWidth - 44));
    const h = Math.max(MIN_H, Math.min(arrastre.h + (arrastre.y - e.clientY),
                                       window.innerHeight - 110));
    panel.style.width = w + 'px';
    panel.style.height = h + 'px';
  });

  function sueltaTirador(e){
    if(!arrastre) return;
    arrastre = null;
    try {
      localStorage.setItem(TAM, JSON.stringify({ w: panel.offsetWidth, h: panel.offsetHeight }));
    } catch(err){ /* en privado no se recuerda, y no pasa nada */ }
    if(e && e.pointerId != null && tirador.hasPointerCapture(e.pointerId)){
      tirador.releasePointerCapture(e.pointerId);
    }
  }
  tirador.addEventListener('pointerup', sueltaTirador);
  tirador.addEventListener('pointercancel', sueltaTirador);
  window.addEventListener('resize', function(){ if(!panel.hidden) aplicaTam(); });
})();
