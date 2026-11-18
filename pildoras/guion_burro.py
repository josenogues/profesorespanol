# Píldora «Burro». Voz: italiano. Subtítulos y rótulos: it / es / en.
# Trozo lang "it" = voz italiana; "es" = lo que se aprende (voz española, igual en todas las versiones).
# "sub" = cómo se lee ese trozo en cada versión. fx "ya" = visible desde el fotograma 0 (miniatura).
import dibujos as D

VOZ = "it"
CUENTA = "@espanolconjose"   # provisional, hasta que José elija el nombre


def T(it, es, en):
    return {"it": it, "es": es, "en": en}


def escenas(L, web=False):
    t = lambda d: d[L]
    return [
  # 1 · GANCHO: primer plano del camarero escandalizado; la cámara se aleja y cae un burro en la barra
  {"id": "gancho", "fondo": "degradado", "trozos": [
     {"id": "g1", "lang": "it", "text": "Non chiedere mai burro in Spagna!",
      "sub": T("Non chiedere MAI «burro» in Spagna!", "¡Nunca pidas «burro» en España!", "Never ask for «burro» in Spain!")},
     {"id": "g2", "lang": "it", "text": "Se chiedi una tostada con burro... ti portano questo!",
      "sub": T("Se chiedi «una tostada con burro»... ti portano questo!",
               "Si pides «una tostada con burro»... ¡te traen esto!",
               "Ask for «una tostada con burro»... and you get this!")},
  ], "html": f"""
    <div class="camara" data-cue="g1" data-fx="camara" data-zoom="0.9" data-sfx="whoosh@+0.85">
      <div class="escena-bar susto">{D.bar()}</div></div>
    <div class="cejas" data-cue="g1" data-fx="raise" data-sel=".ceja, .ceja2"></div>
    <div class="gancho-txt" data-cue="g1" data-fx="ya">{t(T("Non chiedere <em>MAI</em> «burro» in Spagna!","¡<em>Nunca</em> pidas «burro» en España!","<em>Never</em> ask for «burro» in Spain!"))}</div>
    <div class="piensa" data-cue="g1" data-fx="ya"><span class="nube"></span><span class="nube n2"></span>{D.burro("burro mini")}<b>?!</b></div>
    <div class="bocata cliente-dice" data-cue="g2" data-fx="pop" data-sfx="pop">¡Una tostada con <b>burro</b>!</div>
    <div class="burro-cae" data-cue="g2" data-fx="drop" data-fin="0.5" data-sfx="golpe@+0.42,rebuzno@+0.75">{D.burro()}</div>
  """},

  # 2 · LA TRAMPA: entra el burro, le da una coz a la tostada; la mantequilla se unta
  {"id": "revela", "trozos": [
     {"id": "r1", "lang": "it", "text": "Perché in spagnolo, burro è...",
      "sub": T("Perché in spagnolo «burro» è...", "Porque en español «burro» es...", "Because in Spanish «burro» is...")},
     {"id": "r2", "lang": "es", "text": "un burro.", "pausa": 0.6, "sub": T("un burro.", "un burro.", "un burro.")},
     {"id": "r3", "lang": "it", "text": "Un asino! Quello che volevi sul pane è...",
      "sub": T("Un asino! Quello che volevi sul pane è...", "¡Un asno! Lo que querías en el pan es...", "A donkey! What you wanted on your toast is...")},
     {"id": "r4", "lang": "es", "text": "la mantequilla.", "sub": T("la mantequilla.", "la mantequilla.", "la mantequilla.")},
  ], "html": f"""
    <div class="palabra-oscura" data-cue="r1" data-fx="up">burro <span class="igual">=</span></div>
    <div class="tostada-vuela" data-cue="r1" data-fx="kicked" data-kickcue="r2" data-kickdelay="1.0" data-sfx="coz@r2+1.0,whoosh@r2+1.05">{D.tostada(False)}</div>
    <div class="burro-entra" data-cue="r2" data-fx="walk" data-kick="1.0" data-sfx="boing@+0.6">{D.burro()}</div>
    <div class="nota-mano" data-cue="r3" data-fx="pop" data-sfx="pop">{t(T("un asino!","¡un asno!","a donkey!"))}</div>
    <div class="untar-fila" data-cue="r3" data-fx="up" data-delay="1.1">
      {D.tostada(True)}<span class="untar" data-cue="r4" data-fx="spread" data-sfx="tiza"><span class="manteca"></span>
      <span class="untar-txt">la mantequilla</span><span class="cuchillo-va">{D.cuchillo()}</span></span></div>
  """},

  # 3 · EN EL BAR, BIEN DICHO
  {"id": "ejemplo", "trozos": [
     {"id": "e1", "lang": "it", "text": "Quindi:", "sub": T("Quindi:", "O sea:", "So:")},
     {"id": "e2", "lang": "es", "text": "Una tostada con mantequilla, por favor.",
      "sub": T("Una tostada con mantequilla, por favor.", "Una tostada con mantequilla, por favor.", "Una tostada con mantequilla, por favor.")},
  ], "html": f"""
    <div class="escena-bar baja" data-cue="e1" data-fx="up">{D.bar()}</div>
    <div class="bocata cliente-dice arriba" data-cue="e2" data-fx="pop">Una tostada con <b class="verde">mantequilla</b>, por favor.</div>
    <div class="sello si" data-cue="e2" data-fx="stamp" data-delay="2.0" data-sfx="ding">✓</div>
  """},

  # 4 · ATTENTO AL BURRITO: moneda con dos caras
  {"id": "burrito", "trozos": [
     {"id": "s1", "lang": "it", "text": "E burrito? Letteralmente, un asinello...",
      "sub": T("E «burrito»? Letteralmente, un asinello...", "¿Y «burrito»? Literalmente, un burro pequeño...", "And «burrito»? Literally, a little donkey...")},
     {"id": "s2", "lang": "it", "text": "ma quasi sempre è questo!",
      "sub": T("...ma quasi sempre è questo!", "...¡pero casi siempre es esto!", "...but almost always, it's this!")},
     {"id": "s3", "lang": "es", "text": "Un burrito de pollo, por favor.",
      "sub": T("Un burrito de pollo, por favor.", "Un burrito de pollo, por favor.", "Un burrito de pollo, por favor.")},
  ], "html": f"""
    <div class="palabra-oscura" data-cue="s1" data-fx="up">burrito</div>
    {D.moneda(D.burro("burro bebe"), D.burrito()).replace('class="moneda"', 'class="moneda" data-cue="s1" data-fx="flip" data-flipcue="s2" data-sfx="pop,whoosh@s2+0,boing@s2+0.8"')}
    <div class="pie-moneda" data-cue="s1" data-fx="up" data-hidecue="s2">{t(T("un asinello","un burro pequeño","a little donkey"))}</div>
    <div class="pie-moneda" data-cue="s2" data-fx="pop" data-delay="0.5">{t(T("il piatto messicano!","¡el plato mexicano!","the Mexican dish!"))}</div>
    <div class="dipende" data-cue="s2" data-fx="stamp" data-delay="0.9" data-sfx="sello">{t(T("dipende!","¡depende!","it depends!"))}</div>
  """},

  # 5 · ¡NO SEAS BURRO!: el burro testarudo no se mueve
  {"id": "testarudo", "trozos": [
     {"id": "n1", "lang": "it", "text": "E se ti dicono:", "sub": T("E se ti dicono:", "Y si te dicen:", "And if someone says:")},
     {"id": "n2", "lang": "es", "text": "¡No seas burro!", "sub": T("¡No seas burro!", "¡No seas burro!", "¡No seas burro!")},
     {"id": "n3", "lang": "it", "text": "è come il nostro: non fare l'asino!",
      "sub": T("...è come il nostro: non fare l'asino!", "...es el «non fare l'asino!» italiano.", "...it means: don't be so stubborn!")},
  ], "html": f"""
    <div class="bocadillo" data-cue="n2" data-fx="pop" data-sfx="pop">¡No seas burro!</div>
    <div class="burro-terco" data-cue="n1" data-fx="up" data-stubborn="n2" data-sfx="rebuzno@n2+0.3">{D.burro()}</div>
    <div class="nota-mano abajo" data-cue="n3" data-fx="up">= {t(T("non fare l'asino!","«non fare l'asino!»","don't be so stubborn!"))}</div>
  """},

  # 6 · BURRONE: la palabra se cae al barranco, con eco
  {"id": "burrone", "trozos": [
     {"id": "b1", "lang": "it", "text": "E il burrone? Né asini né burro...",
      "sub": T("E il burrone? Né asini né burro...", "¿Y el «burrone» italiano? Ni burros ni mantequilla...", "And Italian «burrone»? No donkeys, no butter...")},
     {"id": "b2", "lang": "es", "text": "un barranco.", "sub": T("un barranco.", "un barranco.", "un barranco.")},
  ], "html": f"""
    <div class="bandera-it" data-cue="b1" data-fx="up"><img src="REPO/banderas/it.svg"> {t(T("in italiano","en italiano","in Italian"))}</div>
    <div class="cae" data-cue="b1" data-fx="fall" data-falldelay="1.6" data-sfx="caida@+1.6">{"".join(f"<span>{c}</span>" for c in "burrone")}</div>
    <div class="barranco-caja" data-cue="b1" data-fx="up">{D.barranco()}</div>
    <div class="eco" data-cue="b2" data-fx="pop" data-sfx="pop">un barranco<span class="e1" data-cue="b2" data-fx="pop" data-delay="0.6">…anco</span><span class="e2" data-cue="b2" data-fx="pop" data-delay="1.1">…anco</span></div>
  """},

  # 7 · RESUMEN: la pizarra del bar
  {"id": "resumen", "trozos": [
     {"id": "x1", "lang": "it", "text": "Ricapitolando, il menù!", "sub": T("Ricapitolando, il menù!", "Resumiendo: ¡el menú!", "Quick recap: the menu!")},
     {"id": "x2", "lang": "pausa", "dur": 4.4},
  ], "html": D.pizarra(f"""
      <div class="piz-l" data-cue="x1" data-fx="write" data-delay="0.7" data-sfx="tiza">Tostada con mantequilla <i>✓</i><small>{t(T("burro (per il pane)","«burro» italiano","butter"))}</small></div>
      <div class="piz-l" data-cue="x1" data-fx="write" data-delay="1.6" data-sfx="tiza">Burrito de pollo <i>✓</i><small>{t(T("il piatto messicano","el plato mexicano","the Mexican dish"))}</small></div>
      <div class="piz-l" data-cue="x1" data-fx="write" data-delay="2.5" data-sfx="tiza">Vistas al barranco <i>✓</i><small>{t(T("burrone","«burrone» italiano","ravine"))}</small></div>
      <div class="piz-l no" data-cue="x1" data-fx="write" data-delay="3.4" data-sfx="tiza">Burro <i>✗</i><small>{t(T("asino: non è nel menù!","asno: ¡no está en el menú!","donkey: not on the menu!"))}</small>
        <svg class="tachar" data-cue="x1" data-fx="draw" data-delay="4.1" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M4 12 C 60 4, 120 16, 196 8"/></svg></div>
  """).replace('class="pizarra"', 'class="pizarra" data-cue="x1" data-fx="up"')},

  # 8 · CIERRE (sello de la serie): los globos del logo cobran vida
  {"id": "cierre", "fondo": "degradado", "trozos": [
     {"id": "c1", "lang": "it", "text": "E embarazada? Vuol dire imbarazzata?",
      "sub": T("E «embarazada»? Vuol dire «imbarazzata»?", "¿Y «embarazada»? ¿Será «imbarazzata»?", "And «embarazada»? Does it mean «embarrassed»?")},
     {"id": "c2", "lang": "es", "text": "¡No es lo que parece!", "pausa": 0.4,
      "sub": T("¡No es lo que parece!", "¡No es lo que parece!", "¡No es lo que parece!")},
     {"id": "c3", "lang": "pausa", "dur": 2.0},
  ], "html": f"""
    <div class="pregunta" data-cue="c1" data-fx="pop" data-delay="0.3" data-sfx="pop">«embarazada» = «{t(T("imbarazzata","imbarazzata","embarrassed"))}»?</div>
    <div class="globos-vivos" data-cue="c1" data-fx="globos" data-grito="c2" data-logo="c3" data-sfx="pop,pop@+0.25">{D.globos_logo()}</div>
    <div class="lema" data-cue="c2" data-fx="slam" data-sfx="sello">¡No es lo que parece!</div>
    {"" if L == "es" else f'<div class="lema-trad" data-cue="c2" data-fx="up" data-delay="0.5">{t(T("Non è quello che sembra!","","It is not what it looks like!"))}</div>'}
    <div class="marca-fin" data-cue="c3" data-fx="up">Aprende español <b>con José</b></div>
    {"" if web else f'<div class="sigue" data-cue="c3" data-fx="pop" data-delay="0.4">{D.redes()}<span>{CUENTA}</span></div>'}
    <div class="sacude" data-cue="c2" data-fx="shake"></div>
  """},
    ]
