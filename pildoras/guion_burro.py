# Píldora «Burro» — modo redes. Voz: italiano. Subtítulos y rótulos: it / es / en.
# Trozo lang "it" = voz italiana; "es" = lo que se aprende (voz española, igual en todas las versiones).
# "sub" = cómo se lee ese trozo en cada versión de subtítulos.
# fx "ya" = visible desde el primer fotograma (la miniatura en redes es el fotograma 0).

VOZ = "it"

def T(it, es, en):
    return {"it": it, "es": es, "en": en}

def escenas(L):
    t = lambda d: d[L]
    SUB = '<svg class="garabato" data-cue="{c}" data-fx="draw" viewBox="0 0 300 24"><path d="M6 16 C 50 4, 80 22, 125 12 S 200 6, 240 14 S 280 16, 294 10"/></svg>'
    return [
  {"id": "gancho", "fondo": "degradado", "trozos": [
     {"id": "g1", "lang": "it", "text": "Chiedi burro in un bar spagnolo? Attento!",
      "sub": T("Chiedi «burro» in un bar spagnolo? Attento!",
               "¿Pides «burro» en un bar español? ¡Cuidado!",
               "Asking for «burro» in a Spanish bar? Careful!")},
  ], "html": f"""
    <div class="cinta" data-cue="g1" data-fx="ya">{t(T("Pillola di spagnolo","Píldora de español","Spanish pill"))}</div>
    <div class="gancho-txt" data-cue="g1" data-fx="ya">{t(T("Chiedi","¿Pides","Asking for"))}</div>
    <div class="palabra" data-cue="g1" data-fx="ya">«burro»</div>
    <div class="gancho-txt abajo" data-cue="g1" data-fx="ya">{t(T("al bar?","en el bar?","at the bar?"))}</div>
    <div class="emoji-dudas" data-cue="g1" data-fx="bob">🧈❓🫏</div>
    <div class="alerta" data-cue="g1" data-fx="stamp" data-delay="1.4">{t(T("Attento!","¡Cuidado!","Careful!"))}</div>
  """},

  {"id": "revela", "trozos": [
     {"id": "r1", "lang": "it", "text": "In spagnolo, burro è...",
      "sub": T("In spagnolo, «burro» è...", "En español, «burro» es...", "In Spanish, «burro» is...")},
     {"id": "r2", "lang": "es", "text": "un burro.", "sub": T("un burro.", "un burro.", "un burro.")},
     {"id": "r3", "lang": "it", "text": "Un asino! Il burro si dice...",
      "sub": T("Un asino! Il burro si dice...", "¡Un asno! Y la mantequilla es...", "A donkey! Butter is...")},
     {"id": "r4", "lang": "es", "text": "mantequilla.", "sub": T("mantequilla.", "mantequilla.", "mantequilla.")},
  ], "html": f"""
    <div class="tarjeta par" data-cue="r1" data-fx="slide">
      <img src="REPO/banderas/es.svg"><span class="es-w">burro</span><span class="igual">=</span>
      <span class="emo grande-emo" data-cue="r2" data-fx="wobble">🫏</span></div>
    <div class="nota-mano" data-cue="r3" data-fx="pop">{t(T("un asino!","¡un asno!","a donkey!"))}</div>
    <div class="tarjeta par" style="top:480px" data-cue="r3" data-fx="slide" data-delay="0.7">
      <span class="emo">🧈</span><span class="igual">=</span>
      <span class="es-w"><b class="marca" data-cue="r4" data-fx="mark">mantequilla</b></span></div>
    <div class="estrellas" data-cue="r4" data-fx="burst" data-delay="0.2" data-x="400" data-y="520"></div>
  """},

  {"id": "ejemplo", "trozos": [
     {"id": "e2", "lang": "es", "text": "Una tostada con mantequilla, por favor.",
      "sub": T("Una tostada con mantequilla, por favor.", "Una tostada con mantequilla, por favor.", "Una tostada con mantequilla, por favor.")},
  ], "html": f"""
    <div class="emo-fila" data-cue="e2" data-fx="pop">☕ 🍞 🧈</div>
    <div class="tarjeta frase" data-cue="e2" data-fx="slide">
      <img src="REPO/banderas/es.svg"><span>Una tostada con <b>mantequilla</b>, por favor.</span></div>
    <div class="sello si" data-cue="e2" data-fx="stamp" data-delay="1.6">✓</div>
  """},

  {"id": "sorpresa", "trozos": [
     {"id": "s1", "lang": "it", "text": "E burrito? Piccolo asino!",
      "sub": T("E «burrito»? Piccolo asino!", "¿Y «burrito»? ¡Burro pequeño!", "And «burrito»? Little donkey!")},
     {"id": "s3", "lang": "es", "text": "¡No seas burro!", "sub": T("¡No seas burro!", "¡No seas burro!", "¡No seas burro!")},
     {"id": "s4", "lang": "it", "text": "Cioè: non fare l'asino!",
      "sub": T("Cioè: non fare l'asino!", "O sea: «non fare l'asino!»", "Meaning: don't be so thick!")},
  ], "html": f"""
    <div class="tarjeta par" data-cue="s1" data-fx="slide">
      <span class="emo">🌯</span><span class="es-w">burrito</span><span class="igual">=</span>
      <span class="trad" data-cue="s1" data-fx="pop" data-delay="0.8">{t(T("piccolo asino","burro pequeño","little donkey"))}</span></div>
    <div class="bocadillo" data-cue="s3" data-fx="pop">¡No seas burro!</div>
    <div class="nota-mano abajo" data-cue="s4" data-fx="up">= {t(T("non fare l'asino!","«non fare l'asino!»","don't be so thick!"))}</div>
  """},

  {"id": "burrone", "trozos": [
     {"id": "b1", "lang": "it", "text": "E il burrone? Né asini né burro:",
      "sub": T("E il burrone? Né asini né burro:", "¿Y el «burrone» italiano? Ni burros ni mantequilla:", "And Italian «burrone»? A ravine:")},
     {"id": "b2", "lang": "es", "text": "un barranco.", "sub": T("un barranco.", "un barranco.", "un barranco.")},
  ], "html": f"""
    <div class="tarjeta par" data-cue="b1" data-fx="slide">
      <img src="REPO/banderas/it.svg"><span class="es-w">burrone</span><span class="igual">≠</span>
      <span class="emo">🫏</span><span class="emo">🧈</span></div>
    <div class="tarjeta par" style="top:420px" data-cue="b2" data-fx="slide">
      <span class="emo grande-emo" data-cue="b2" data-fx="wobble">🏞️</span><span class="igual">=</span>
      <span class="es-w"><b class="marca" data-cue="b2" data-fx="mark" data-delay="0.2">un barranco</b></span></div>
  """},

  {"id": "cierre", "fondo": "degradado", "trozos": [
     {"id": "c1", "lang": "it", "text": "Prossima pillola: embarazada. Non è quello che pensi!",
      "sub": T("Prossima pillola: «embarazada». Non è quello che pensi!",
               "Próxima píldora: «embarazada». ¡No es lo que piensas!",
               "Next pill: «embarazada». It's not what you think!")},
     {"id": "c2", "lang": "es", "text": "¡Hasta la próxima!", "pausa": 0.8, "sub": T("¡Hasta la próxima!", "¡Hasta la próxima!", "¡Hasta la próxima!")},
  ], "html": f"""
    <div class="cinta" data-cue="c1" data-fx="pop">{t(T("Prossima pillola","Próxima píldora","Next pill"))}</div>
    <div class="palabra chica" data-cue="c1" data-fx="pop" data-delay="0.4">«embarazada»</div>
    <div class="emoji-dudas cierre-emo" data-cue="c1" data-fx="bob" data-delay="0.8">😳🤔</div>
    <img class="logo-fin" src="REPO/logo-apilado.svg" data-cue="c2" data-fx="up">
  """},
    ]
