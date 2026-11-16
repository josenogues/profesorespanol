# -*- coding: utf-8 -*-
"""El carrusel de reseñas de «Sobre mí»: todas se pueden ver, en el móvil
(de una en una) y en el ordenador (de dos en dos)."""
import sys
sys.path.insert(0,"/home/user/profesorespanol/herramientas")
from firebase_falso import monta
from playwright.sync_api import sync_playwright
mal=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for w in (390,1200):
        c=b.new_context(viewport={"width":w,"height":900},reduced_motion="reduce")
        monta(c,{"anna@x.com":{"email":"anna@x.com","nombre":"Anna","activo":True,"clases":[]}})
        c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_student_email','anna@x.com');localStorage.setItem('jn_access_granted','true');localStorage.setItem('jn_track','it')")
        pg=c.new_page(); pg.goto("http://127.0.0.1:8947/sobre-mi.html"); pg.wait_for_timeout(800)
        vistos=[]
        n=pg.locator(".reviews-dots .dot-btn").count()
        for k in range(n):
            pg.wait_for_timeout(450)
            vistos.append(pg.evaluate("""()=>{const w=document.querySelector('.reviews-track-wrap').getBoundingClientRect();
              return [...document.querySelectorAll('.review-card')].filter(c=>{const r=c.getBoundingClientRect();return r.left>=w.left-1&&r.right<=w.right+1}).map(c=>c.querySelector('.review-name').textContent.trim())}"""))
            pg.click(".reviews-next")
        todos=sum(vistos,[])
        ok = len(todos)==len(set(todos))==pg.locator(".review-card").count()
        mal+= not ok
        print(w, n, "páginas", vistos, "OK" if ok else "MAL")
        c.close()
    b.close()
sys.exit(mal)
