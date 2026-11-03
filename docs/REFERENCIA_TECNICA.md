# Referencia técnica del motor (API, estilos, lecciones medidas)
Contenido detallado que antes vivía en CLAUDE.md. El punto de entrada es `CLAUDE.md`.


## ARRANQUE EN UNA SESION NUEVA (el repo solo guarda codigo; lo pesado se regenera)
1. `bash pipeline/instalar.sh`  (modelos de voz, MeloTTS, NLTK; ver requisitos de red en su cabecera; no probado desde cero).
2. El usuario pega un BRIEF (plantilla en `proyectos/_plantilla/brief.md`; guia del Project en `PROJECT_INSTRUCCIONES.md`).
3. `python3 pipeline/vid.py nuevo <tema> ...` -> guion.md + escenas.js -> `estimar` -> `todo`. Commit del proyecto SIN salida/ (esta en .gitignore).
Los repos de claude.ai Projects solo se LEEN como contexto: el motor corre aqui, en Code.

## Como se trabaja
El usuario da TEMA + DESCRIPCION VISUAL en el chat. El motor NO trae plantillas ni personajes: el diseno de cada video
lo escribe Claude en `proyectos/<tema>/escenas.js` usando las herramientas de `engine/`. Lo fijo son las herramientas.

    python3 pipeline/vid.py nuevo <tema> --formato short|youtube|instagram --voz curiosos|aprender|meditacion --musica <estilo>
    # escribir proyectos/<tema>/guion.md (1 parrafo = 1 escena) y escenas.js (1 funcion por parrafo, en orden)
    python3 pipeline/vid.py voz <tema> ; musica <tema> ; mezcla <tema>
    python3 pipeline/vid.py qa <tema> --stills 1,5,9     # linter + fotogramas; MIRAR los fotogramas, el linter no lo ve todo
    python3 pipeline/vid.py render <tema>                # pesado + ligero (+ segunda version si toca)
    python3 pipeline/vid.py todo <tema>
Entorno nuevo: `bash pipeline/instalar.sh` (requisitos de red en su cabecera; no probado desde cero).

## Opcion MEDITACION (primera opcion a desarrollar) — herramientas ya hechas
Imagen = LUZ: contornos SIN relleno, color del trazo = color real del objeto aclarado (`VE.color.luz`), sobre fondo negro u onirico/terrestre
(prado, bosque). Haces de luz que aparecen poco a poco, se superponen (mezcla aditiva) y se adaptan al guion con `ctx.palabra('x')`.
- `VE.trazo.dibujar(esc, nombre, {x,y,tam,modo:'luz'|'solido'|'linea',progreso,t,chispas,pulso,brillo,rot,escalonado})` + `VE.trazo.polilinea`.
- `VE.med`: fondo (negro/noche/onirico/bosque/alba con fundido y estrellas), haces, rayo, colina, prado, motas, luciernagas, anillos (respiracion), texto (escrito con luz).
- Biblioteca (engine/figuras/biblioteca.js, 28 figuras, se revisan en demo/figuras.html?modo=luz|solido|linea). Anadir con `VE.trazo.definir`.
- Voz de meditacion: SOLO MeloTTS (perfil `meditacion`, sin reverb, ELEGIDA 'muestra B': speed 0.92, sin pitch ni compresion, frases partidas por comas con pausa de respiracion `pausa_coma_s`). Los perfiles de Piper estan PENDIENTES DE AJUSTE por el usuario.
- Proyectos con fondo negro deliberado: `VE.proyecto({ lint: { negro: true } })` (si no, el linter marca 'fotograma negro').

## Voz SERENA (Qwen3-TTS 0.6B CustomVoice, perfil `serena`, para cortos)
`--voz serena`. Corre en `.venv-qwen` (Python 3.11, qwen-tts fija transformers 4.57.3; instalar con `pipeline/instalar.sh`) como proceso auxiliar (`pipeline/qwen_worker.py`)
que carga el modelo una vez. Red: pypi.org, download.pytorch.org, huggingface.co, us.aws.cdn.hf.co (pesos ~2,5 GB, 1.a vez). Medido aqui (4 CPU): ~5,4 s de calculo por s de audio
(14 s de voz = 76 s) + alineado local; un corto de 100 s de voz ~9-10 min. Sin etiquetas de direccion; `instruct` opcional en el perfil. Perfil nuevo: el usuario aun no lo ha oido en el motor.

## VIDEOS LARGOS (45 min de meditacion es el siguiente video real)
- `VE.proyecto({ capitulos:[{parrafos:N, dibujar(esc,t,ctx)}...] })` agrupa parrafos en capitulos (ctx.parrafo, ctx.buscar(palabra,n)).
- Fondos ricos: `VE.med.mundos` = prado_nocturno, lago_luna, bosque_niebla, aurora_boreal, amanecer, jardin_loto, oceano_estrellas
  (cada uno `(esc, tg, a)` con a=0..1 de construccion) + capas sueltas: aurora, astro, nubes, bruma, fugaces, agua, montanas, caida, rios, flores.
- `python3 pipeline/vid.py estimar <tema>` (tiempos, RAM, disco) y `estado <tema>` (retomar). Constantes en config/calibracion.json.
- Reanudable: voz con cache por frase (salida/voz_cache), render por trozos con huella (--seco = solo plan). La logica de reanudar solo se
  ha probado en SECO y simulando un corte; NO con un render largo real.
- meta.json admite `ss`, `fps`, `crf`. Para largo: ss 1.0 (2x mas rapido), fps 24, crf ~22 (tamano; crf 22 NO medido).
- MUSICA 45 min: 221 s y PICO 8 GB de RAM -> nunca a la vez que voz o render. MP4 ligero (<10 MB) inviable pasados ~10 min.
- Un render de 45 min se cuenta en ~40-50 min; con voz y musica, ~1 h 10 min en total (estimado, no medido en video largo).

## PAISAJES (prioridad del usuario: "dar paisajes mejorados")
`VE.paisaje` (engine/estilos/paisajes.js): capas HORNEADAS una vez (sombra + luz) con paralaje y fundido escalonado de lejos a cerca:
cielo, cordillera (con nieve), reflejo, colinas, bosque por planos (opcion `bordes` para dejar el centro libre), suelo (matas/flores/hierba), orilla, cosmos.
Composiciones por acto (ejemplo local de «meditacion_viaje»; los proyectos ya NO se suben al repo) (lago, pradera, bosque, amanecer, cumbre, cosmos). El paisaje persiste todo el acto;
los parrafos dibujan encima con `VE.comp` (figuras que aparecen al decir su palabra). Para hornear se necesita que pegar()/tipo() usen esc.ctx (ya hecho).
Figuras nuevas (biblioteca2): mano, anjali, gyan, cerebro, galaxia, atomo, interferencia, brujula(_base), caminante, cumbre, 8 animales. 'meditando' rediseñado.
Piezas (composicion.js): espaciotiempo, electrones (patron de franjas), ecg con variabilidad, red de neuronas, reloj, tituloActo.
Calidad baja: meta.json {ss:0.5, salida_escala:0.5, fps:24, crf:30, ligero_MB, ligero_lado}. Musica solo en limites de capitulo: meta {capitulos:[12,...]}.

## REALISMO (engine/realismo/, estilo general: objetos y paisajes reales pintados, NO contornos de luz)
Demo/revision: `demo/realismo.html?modo=paisaje|objetos|rayo&tipo=montanas|lago|llanura|bosque|costa|desierto&hora=alba|dia|atardecer|noche|tormenta&lienzo=yt|vertical&ss=1.5`.
- `VE.real.paisaje(esc, tg, {tipo, hora, a, semilla, deriva, nubes})`: cielo (sol/luna/estrellas), cordilleras con relieve sombreado y nieve, colinas, agua con reflejo, bosque, nubes a la deriva.
  Capas horneadas una vez (~3-4 s por paisaje la primera vez), luego solo drawImage. `capas:[...]` permite componer a mano (ver PRESETS en paisaje.js).
- `VE.real.objeto(esc, nombre, {x,y,tam,hora,semilla,variante,espejo,alfa})`, (x,y)=centro de la base, tam=alto. Objetos: castillo, arbol, pino, roca, nube, casa, velero, molino, faro.
  Anadir: `VE.real.definirObjeto(nombre, {w,h,dibujar(x,w,h,H,T,o)})` (geometria siempre con la luz a la izquierda; el motor espeja si la hora trae la luz a la derecha).
- `VE.real.rayo(esc,{x0,y0,x1,y1,semilla,progreso,destello})` dinamico. La HORA fija luz/sombra/niebla de todo: usar la misma hora en paisaje y objetos.
- Revisado a ojo solo en fotogramas fijos (sin video). Falta: ciudad/edificios, animales realistas, lluvia, mas objetos (torre, puente, barco de vapor...), personas.

## VOLUMEN 3D (engine/volumen/: motor.js, mallas.js, modelos.js, fondos.js, tierra_datos.js)
Ya cargado en `engine/video/index.html`. Revision: `demo/volumen.html?modo=avion|maniqui|vikingos|piezas|tierra&rayosx=1&ss=1`. Video de una demo (sin audio): `node render/demo.cjs --pagina "demo/volumen.html?modo=vikingos" --duracion 22.5 --salida X.mp4`.
    const V = VE.vol;
    const cam = V.camara({ pos:[x,y,z], mira:[x,y,z], arriba:[0,1,0], fov:35 })   // o V.orbita(centro, dist, rumbo, elevacion)
    V.render(esc, V.nodo({ hijos:[...] }), cam, { ambiente:'estudio', sombras:{ centro, radio }, rayosx:0..1, niebla:{color,cerca,lejos}, alfa })
    V.proyectar(esc, cam, p) -> {x,y,delante}  ·  V.linea(esc, cam, puntos, {discontinua, progreso, oculta})  ·  V.marcador(esc, cam, p, {a})
- Nodo: `{malla, mat, pos, rot:[rx,ry,rz] (Ry*Rx*Rz), esc, m (matriz), hijos, nombre, sinSombra, sinRayos, alfa}`. `V.posicion(arbol, 'mano_d')` = donde esta una pieza (para anclar texto).
- Material: `{color, tipo:'mate'|'brillo'|'rayosx'|'plano'|'sombra', alfa, mapa:<canvas>, esp, dureza, envolver, borde, emision, fresnel, desvanecer, dobleCara}`. `sombra` = suelo invisible que solo recibe sombra (para poner objetos 3D sobre un fondo 2D).
- Mallas (`V.malla`, en cache): esfera, capsula(r1,r2,largo) (hacia -Y, para extremidades), caja(w,h,d,bisel), cilindro(r1,r2,h), torno(perfil), toro, extrusion(poligono,prof), loft(secciones) (alas, cascos), plano, tubo(puntos,radio,{dinamica:'nombre'}) (estelas, cables), parametrica(nu,nv,f), fusionar(partes).
- Modelos (`V.modelos`): tierra({nubes, atmosfera, giroNubes, resolucion}), avion({color, acento, m}), maniqui({pose, apoyo, piesX, resaltar}), silla, nube, arbol({tipo:'pino'}), sala. Texturas pintadas con `V.textura(clave, w, h, fn)` (una vez).
- Exteriores (escenarios.js): `V.modelos.terreno({alto(x,z), x0,x1,z0,z1,n})` (textura por altura y pendiente: arena, espuma, hierba, roca) y `V.modelos.mar({t, color, reflejo})` (oleaje dinamico). Historia (historia.js): `barco_vikingo({vela:true|'recogida'})`, `vikingo({semilla, pose, apoyo, suelo})`, `defensor({semilla, pose})` (arquero), `castillo({lado, alto, t, puerta 0..1, golpe 0..1})`. Combate determinista: `V.efectos.flecha(de, a, t0, dur, t)` (parabola y queda clavada) y `V.efectos.astillas(semilla, origen, t0, t, {n, suelo})`. Poses de combate: `cubrirse` (escudo sobre la cabeza), `arquero`, `V.pose.hachazo(fase)` (impacto en fase 0,55). Maniqui: `colores` por pieza y `equipo: {cuello|tronco|codo_d|codo_i|maniqui: [nodos]}` para vestir y armar personajes.
- Fútbol (futbol.js, ver docs/FUTBOL_3D.md): `campo()`, `porterias({t, gol})`, `balon({pos, giro})`, `futbolista({kit, dorsal, portero, pose})`, `estadio({t, celebra, aficiones})`; `V.futbol.jugada(def)` -> `{balon(t), jugador(id,t), nodo(id,t,kit), revisar()}`; `V.futbol.planos.*`; poses `chutar`, `cabezazo`, `estirada`, `celebrar`, `V.poses.portero`. Demo: `demo/futbol.html?plano=montaje|general|...`.
- Fondos 2D (`V.fondo`): espacio, estudio, plano, cielo({hora}). Geografia (`V.geo`): punto(lat,lon,r), ruta(a,b,n,altura), enRuta(ruta,t,alabeo) -> {pos, m}, distancia(a,b) km, visible(p,cam).
- Convenios: Y arriba; vehiculos con el morro hacia +Z; figura humana mirando a +X (vista lateral = camara en +Z). Escala libre (el maniqui mide ~1,75).
- Rendimiento: el coste crece con los pixeles cubiertos y con el mapa de sombras (2048 por defecto, PCF 5x5). Mallas y texturas se suben una vez; los nodos se crean en cada fotograma sin coste apreciable.

## Reglas del usuario (no reabrir)
- ESTILO GENERAL (videos de cualquier tema): coger solo la TEMATICA y el tipo de estilo de los ejemplos (rayos, castillos), NO su acabado exacto. Prioridad: dibujar BIEN objetos reales y paisajes reales de fondo (reconocibles, con volumen, luz y paralaje), no iconos esquematicos.
- NO renderizar ni enviar videos de prueba si el usuario no lo pide. Se fia del entorno; validar con linter/medidas.
- Voces: Piper, MeloTTS y Qwen3-TTS ('serena', cortos), locales. ElevenLabs descartado. Perfiles de `config/perfiles_voz.json` APROBADOS: no tocarlos sin que lo pida.
- Musica: un estilo por perfil (meditacion/curiosos/aprender) en `pipeline/musica.py`. Cambiarla solo si el usuario lo pide.
- Formatos: short, youtube (3 min-1 h), instagram (~5 min). YouTube de 3-5 min => entregar DOS versiones (youtube 16:9 + instagram 9:16).
- Cifra sin fuente primaria no entra en el guion. Decir que esta verificado y que no.
- Sin fuentes a pie de imagen. Sin chip de seccion (HOOK/PUPA/QUIZ). Sin estilos Pollin ni pizarra.
- MP4 ligero < 10 MB (la app no reproduce > ~12 MB); `vid.py` calcula el bitrate y avisa si no cabe.

## API de escenas (engine/video/runner.js)
`VE.proyecto({ estilo, fondo(esc,tg,ctx), escenas:[(esc,t,ctx)=>{}...], subtitulos:false|{palabras,tam,resalte}, progreso, transicion })`
ctx: i, n, t(local), tg(global), dur, p, entra, sale, zonas.cuerpo/sub, palabra(texto,desde)->{ini,fin} local, palabras, voz(tg)->0..1.
Herramientas: VE.ease/tramo/escalonado (movimiento), VE.texto.ajustar/trazar (texto medido), esc.cache.halo/disco/bokeh/panel (sprites
precocidos), VE.rng('semilla') (determinista), VE.registrar(tipo,caja,{detras,nota}) para el linter.

## Lecciones MEDIDAS (no suposiciones)
- Sin GPU: ctx.filter=blur y shadowBlur por fotograma cuestan ~1700 ms/fotograma; con sprites precocidos ~9 ms. NUNCA usarlos dentro de renderAt.
- Captura: canvas.toDataURL JPEG 36 ms vs page.screenshot PNG 393 ms.
- Chromium: usar los flags de render/navegador.cjs (sin ellos intenta salir a google.com y el proxy lo rechaza).
- Render real 9:16 con ss 1.5 y 3 procesos: 15 fotogramas/s en total (prueba_short). Un video de 1 h a 30 fps seria del orden de horas: bajar ss/fps.
- El linter dio 'sin incidencias' con un solape visible la primera vez: solo ve lo que se registra. Revisar siempre los fotogramas.
- Opciones de subtitulos: `palabras` = por grupo, `tam` = letra maxima (antes chocaban y salian diminutos).

- Bug de redondeo: con progreso=1 el tramo de una parte podia dar 0.9999999 y no se rellenaba; ahora prog>=1 fuerza 1.
- Un arco que da la vuelta completa debe ser figura CERRADA (si no, nunca se rellena).
- Chat de claude.ai: los Projects con GitHub solo LEEN el repo como contexto; el motor solo se ejecuta en Code.
- Render 16:9 ss 1.5, 4 procesos: 16,8 fotogramas/s (prueba_meditacion, 40 s en 71 s).

- Canvas 2D de Chromium acumula las ordenes y las ejecuta al vaciar: un perfil que mida con performance.now() atribuye TODO el coste a quien
  fuerza el vaciado. Perfilar forzando `ctx.getImageData(0,0,1,1)` tras cada llamada.
- Sin GPU el coste crece con los PIXELES cubiertos: halos enormes en mezcla aditiva (niebla, astros, haces) dominan. La niebla se hornea en 2 capas.
- Medir en frio engana: el 1.er fotograma incluye el horneado de sprites. Calentar antes de medir.

## Sin verificar
- Limites de duracion de Instagram/Reels/TikTok (YouTube Shorts: 3 min, fuente oficial). Safe areas verticales: estimacion, no especificacion.
- Renderizados de punta a punta: short vertical (prueba_short) y youtube 16:9 (prueba_meditacion). Instagram y la entrega DOBLE (youtube 3-5 min -> +instagram) estan implementados pero NO probados.
- Calidad percibida de las voces/musica: solo la puede juzgar el usuario (no se puede oir aqui).
