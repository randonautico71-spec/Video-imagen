/* RNG determinista. Nada de Math.random en el motor: el render va en 4 procesos
   paralelos y cada trozo debe producir pixeles identicos. */
(function (VE) {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Hash de cadena -> semilla, para que cada escena tenga su propio flujo estable.
  function seedFrom(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  VE.rng = function (nameOrSeed) {
    const s = typeof nameOrSeed === 'string' ? seedFrom(nameOrSeed) : (nameOrSeed | 0);
    const r = mulberry32(s);
    r.range = (a, b) => a + r() * (b - a);
    r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.sign = () => (r() < 0.5 ? -1 : 1);
    return r;
  };
  VE.seedFrom = seedFrom;
})(window.VE = window.VE || {});
