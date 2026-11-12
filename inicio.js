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
  const NOMBRE = 'jn_nombre';

  const T = {
    es: { proxima: 'Tu próxima clase:' },
    it: { proxima: 'La tua prossima lezione:' },
    en: { proxima: 'Your next class:' }
  };
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

  let ficha = null;
  function pinta(){
    const L = pista();
    if(!ficha){ prox.hidden = true; hoyBtn.hidden = true; return; }
    const hoy = new Date().toISOString().slice(0, 10);
    const clases = Array.isArray(ficha.clases) ? ficha.clases : [];

    // la próxima: la primera con fecha de hoy en adelante
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
      prox.textContent = '';
      const ico = document.createElement('i');
      ico.className = 'ti ti-calendar-event';
      ico.setAttribute('aria-hidden', 'true');
      const b = document.createElement('b');
      b.textContent = (T[L] || T.es).proxima;
      prox.append(ico, ' ', b, ' ' + fechaLarga(futura.fecha, L) + (titulo ? ' · ' + titulo : ''));
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
