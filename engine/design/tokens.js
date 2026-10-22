/* Sistema de diseno. Un solo sitio donde viven color, tipografia y espaciado,
   para que la coherencia visual no dependa de lo que yo recuerde escena a escena. */
(function (VE) {
  // Escala tipografica modular (razon 1.25) sobre una base de 18px, en unidades de
  // diseno de 1080p. El motor la reescala sola a 9:16 y a 4K.
  const SCALE = { xs: 18, sm: 22, md: 28, lg: 35, xl: 44, xxl: 55, display: 69, hero: 86, mega: 108 };

  // Rejilla de 8px: todo margen y toda separacion es multiplo, asi nada queda "casi" alineado.
  const SPACE = { 1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48, 8: 64, 10: 80, 12: 96, 16: 128 };

  const ESTILOS = {
    DARK: {
      nombre: 'DARK',
      fondo: ['#070B18', '#131C33'],      // degradado vertical
      tinta: '#F4F7FF',                    // texto principal
      tintaSuave: '#A8B4D0',
      acento: '#5BC8FF',
      acento2: '#FF5BA8',
      exito: '#4ADE80',
      aviso: '#FFC24A',
      panel: 'rgba(255,255,255,0.06)',
      borde: 'rgba(255,255,255,0.14)',
      vineta: 0.55,
      grano: 10
    },
    BEACH: {
      nombre: 'BEACH',
      fondo: ['#07243A', '#0E5A6B'],
      tinta: '#FFFDF5',
      tintaSuave: '#BFE3DC',
      acento: '#FFD166',
      acento2: '#FF8C5A',
      exito: '#5BE0B0',
      aviso: '#FFB03A',
      panel: 'rgba(255,255,255,0.08)',
      borde: 'rgba(255,255,255,0.18)',
      vineta: 0.45,
      grano: 9
    },
    LAB: {
      nombre: 'LAB',
      fondo: ['#0B0F14', '#16202B'],
      tinta: '#EAF4FF',
      tintaSuave: '#93A7BC',
      acento: '#6EE7F9',
      acento2: '#A78BFA',
      exito: '#34D399',
      aviso: '#FBBF24',
      panel: 'rgba(110,231,249,0.07)',
      borde: 'rgba(110,231,249,0.22)',
      vineta: 0.50,
      grano: 11
    }
  };

  VE.tokens = { SCALE, SPACE, ESTILOS };
  VE.estilo = function (nombre) {
    if (nombre && typeof nombre === 'object') {          // estilo propio del video: se completa con LAB
      return Object.assign({}, ESTILOS.LAB, nombre, { nombre: nombre.nombre || 'CUSTOM' });
    }
    const e = ESTILOS[nombre];
    if (!e) throw new Error('Estilo desconocido: ' + nombre + '. Hay: ' + Object.keys(ESTILOS).join(', '));
    return e;
  };
})(window.VE = window.VE || {});
