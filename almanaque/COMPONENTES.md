# Composicion con `VE.comp` (estilo luz) — API y trucos
**Por parrafo:** `(c, esc, ctx) => {...}`. Tiempos: `c.tp` (s desde el inicio del parrafo), `c.dp` (duracion), `c.tg` (tiempo global), `c.salida` (1→0 al final). `en:'palabra'` aparece al decirse esa palabra (si no existe, a 0,5 s).
- `c.fig(nombre, ux, uy, tam, {en, dur, alfa, persistir, fijo, rot, espejo, color, brillo, chispas})` · `c.glow(ux,uy,r,color,{en,alfa,dureza,persistir})` · `c.linea(pts,color,prog)` · `c.curva(a,b,c)` · `c.anillos` · `c.ondas` · `c.motas({n,zona,color})` · `c.red` · `c.puntos([[ux,uy,palabra,color]])`.
- `VE.med.*`: `fondo` (modos negro, noche, onirico, bosque, oceano, aurora, amanecer, alba), `electrones` (puntos de Hitachi), `espaciotiempo`, `texto` (ecuaciones), `reloj`, `agua`, `bruma`, `astro`. `VE.paisaje.*`: cielo, cordillera, colinas, bosque, suelo, reflejo, cosmos.
- `T.mapear(fig, {x,y,tam}, [lx,ly])` da el punto de un dibujo (coord. 0..100) en pantalla: sirve para mover una luz sobre una figura (electron en una orbita, bola en una colina).
**Lecciones medidas con fotogramas:**
- Fondos oscuros para dormir: `noche`, `negro`, `aurora`; evitar `onirico` y `oceano` (demasiado azul/violeta).
- Una figura con muchas lineas cortas gruesas (`nube_prob`, `uranio`) se quema: usar `brillo .4-.5` y `chispas 0`.
- Si la palabra que dispara la figura esta al final del parrafo, la pantalla queda vacia mucho rato: poner `en` numerico (≈.6-.8 s) en el elemento principal.
- En el lago el horizonte esta en y≈.66: figuras principales en y≤.46-.5 para no quedar sobre la linea.
- Capitulos: `meta.capitulos` = parrafos por capitulo; un fondo (`AMB[i]`) por capitulo; `transicion` 1,8 s.
- Estimador de duracion subestima ~7 %; render ~54 fotogramas/s con 4 procesos a 960×540.
