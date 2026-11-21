// La portada: saluda por el nombre y pone delante lo que el alumno viene a
// buscar —la próxima clase y «cinco minutos de hoy»—.
//
// La página se pinta entera sin esperar a nadie: el saludo sale ya con el
// nombre de la última vez (guardado en este navegador) y, cuando llega su
// ficha, se pone al día. Si la ficha no llega, la portada sigue sirviendo:
// le falta el nombre y poco más.

(function(){
  const saludo = document.getElementById('hola-saludo');
  if(!saludo) return;
  const prox = document.getElementById('hola-prox');
  const hoyBtn = document.getElementById('hola-hoy');
  const botones = hoyBtn.parentNode;
  const NOMBRE = 'jn_nombre';

  const T = {
    es: { proxima: 'Tu próxima clase:', hoy: 'hoy', manana: 'mañana', dentro: n => 'dentro de ' + n + ' días',
          primera: 'Tu primera clase saldrá aquí en cuanto José la apunte.', reservar: 'Reservar clase' },
    it: { proxima: 'La tua prossima lezione:', hoy: 'oggi', manana: 'domani', dentro: n => 'tra ' + n + ' giorni',
          primera: 'La tua prima lezione apparirà qui appena José la segna.', reservar: 'Prenota lezione' },
    en: { proxima: 'Your next class:', hoy: 'today', manana: 'tomorrow', dentro: n => 'in ' + n + ' days',
          primera: 'Your first class will show up here as soon as José adds it.', reservar: 'Book a class' }
  };
  const RESERVAR = 'https://tidycal.com/josenogues';

  // la fecha de hoy en la hora del alumno (no la de Londres): con toISOString,
  // en América la clase de hoy desaparecía por la tarde
  function hoyLocal(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // «hoy», «mañana», «dentro de 3 días»; de una semana en adelante, nada
  function cuando(iso, hoy, L){
    const t = T[L] || T.es;
    const dias = Math.round((new Date(iso + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 864e5);
    if(dias === 0) return t.hoy;
    if(dias === 1) return t.manana;
    if(dias > 1 && dias < 7) return t.dentro(dias);
    return '';
  }
  function pista(){
    const t = localStorage.getItem('jn_track');
    return (t === 'it' || t === 'en') ? t : 'es';
  }

  // «Anna Rossi» → «Anna». El saludo va en español en las tres pistas: es lo
  // primero que se aprende, y es como le saluda José.
  function pintaSaludo(nombre){
    const n = String(nombre || '').trim().split(/\s+/)[0];
    saludo.textContent = n ? '¡Hola, ' + n + '!' : '¡Hola!';
  }

  function fechaLarga(iso, L){
    const d = new Date(iso + 'T12:00:00');
    if(isNaN(d)) return '';
    return d.toLocaleDateString({ es: 'es-ES', it: 'it-IT', en: 'en-GB' }[L], { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // el botón de reservar, solo para quien aún no tiene clases: sale en el
  // sitio de «cinco minutos», que a esa persona todavía no le toca
  let reservar = null;
  function botonReservar(L){
    if(!reservar){
      reservar = document.createElement('a');
      reservar.className = 'hola-btn hola-btn-oro';
      reservar.id = 'hola-reservar';
      reservar.href = RESERVAR;
      reservar.target = '_blank';
      reservar.rel = 'noopener noreferrer';
      botones.insertBefore(reservar, botones.firstChild);
    }
    reservar.innerHTML = '<i class="ti ti-calendar" aria-hidden="true"></i> ';
    reservar.append((T[L] || T.es).reservar);
    reservar.hidden = false;
  }

  let ficha = null;
  function pinta(){
    const L = pista();
    const t = T[L] || T.es;
    if(reservar) reservar.hidden = true;
    if(!ficha){ prox.hidden = true; hoyBtn.hidden = true; return; }
    const hoy = hoyLocal();
    const clases = Array.isArray(ficha.clases) ? ficha.clases : [];
    prox.textContent = '';
    prox.classList.remove('sin');
    const ico = document.createElement('i');
    ico.className = 'ti ti-calendar-event';
    ico.setAttribute('aria-hidden', 'true');

    // sin ninguna clase todavía: qué va a pasar y cómo reservar
    if(!clases.length){
      prox.classList.add('sin');
      prox.append(ico, ' ' + t.primera);
      prox.hidden = false;
      hoyBtn.hidden = true;
      botonReservar(L);
      return;
    }

    // la próxima: la primera con fecha de hoy en adelante; lleva a «Mis
    // clases», donde está con todo lo demás
    const futura = clases.filter(a => a.fecha && a.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    if(futura){
      let titulo = '';
      if(futura.rapida){
        const base = futura.rapida.repasoDe && window.jnClasePorId(futura.rapida.repasoDe);
        titulo = base ? ((base.titulo && (base.titulo[L] || base.titulo.es)) || '') : (futura.rapida.titulo || '');
      } else {
        const c = window.jnClasePorId(futura.id);
        titulo = c ? ((c.titulo && (c.titulo[L] || c.titulo.es)) || '') : '';
      }
      const rel = cuando(futura.fecha, hoy, L);
      const a = document.createElement('a');
      a.href = 'mis-clases-' + L + '.html';
      const b = document.createElement('b');
      b.textContent = t.proxima;
      a.append(b, ' ' + (rel ? rel + ', ' : '') + fechaLarga(futura.fecha, L) + (titulo ? ' · ' + titulo : ''));
      prox.append(ico, ' ', a);
      prox.hidden = false;
    } else {
      prox.hidden = true;
    }

    // «cinco minutos», solo si ya ha dado alguna clase
    const visto = window.jnVisto ? window.jnVisto(clases, hoy) : [];
    if(visto.length){
      hoyBtn.href = 'ejercicios-' + L + '.html?hoy=' + visto.join(',');
      hoyBtn.hidden = false;
    } else {
      hoyBtn.hidden = true;
    }
  }

  function carga(){
    const email = (window.jnEmailFicha && window.jnEmailFicha()) || localStorage.getItem('jn_student_email');
    if(!email) return;
    const t0 = Date.now();
    (function espera(){
      if(window.jnCloudGetStudentDoc){
        window.jnCloudGetStudentDoc(email).then(function(doc){
          if(!doc) return;
          ficha = doc;
          if(doc.nombre){
            localStorage.setItem(NOMBRE, doc.nombre);
            pintaSaludo(doc.nombre);
          }
          pinta();
        }).catch(function(){ /* sin ficha, la portada se queda como está */ });
        return;
      }
      if(Date.now() - t0 > 8000) return;
      setTimeout(espera, 120);
    })();
  }

  // el nombre de la última vez, para no saludar a secas mientras llega la ficha;
  // solo si hay alguien dentro: en la puerta no se saluda a nadie por su nombre
  if(localStorage.getItem('jn_student_email') || localStorage.getItem('jn_profe') === 'true'){
    pintaSaludo(localStorage.getItem(NOMBRE));
  }
  carga();
  document.addEventListener('jn-access-granted', carga);
  // al cambiar de idioma con los botones de arriba, la fecha y el enlace van detrás
  document.addEventListener('click', function(e){
    if(e.target.closest('.lang-track-btn')) setTimeout(pinta, 0);
  });
})();
