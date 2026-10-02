/* units.js — unit database, prefixes, and physical constants.
   Exposes globalThis.SI_UNITS.
   Dimension vector order: [kg, m, s, A, K, mol, cd, rad] */
(function (root) {
  'use strict';

  var DIMS = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd', 'rad'];
  var IDX = {};
  DIMS.forEach(function (d, i) { IDX[d] = i; });

  /* Build a dimension vector from an exponent map: D({kg:1, m:-1}) */
  function D(o) {
    var d = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var k in o) {
      if (!(k in IDX)) throw new Error('unknown dimension: ' + k);
      d[IDX[k]] += o[k];
    }
    return d;
  }

  var L  = D({ m: 1 }),        M  = D({ kg: 1 }),      T  = D({ s: 1 }),
      I  = D({ A: 1 }),        K  = D({ K: 1 }),       N  = D({ mol: 1 }),
      CD = D({ cd: 1 }),       RAD = D({ rad: 1 }),    ONE = D({});

  var AREA    = D({ m: 2 }),
      VOL     = D({ m: 3 }),
      VELOC   = D({ m: 1, s: -1 }),
      ACCEL   = D({ m: 1, s: -2 }),
      FORCE   = D({ kg: 1, m: 1, s: -2 }),
      PRESS   = D({ kg: 1, m: -1, s: -2 }),
      ENERGY  = D({ kg: 1, m: 2, s: -2 }),
      POWER   = D({ kg: 1, m: 2, s: -3 }),
      CHARGE  = D({ A: 1, s: 1 }),
      VOLT    = D({ kg: 1, m: 2, s: -3, A: -1 }),
      CAPAC   = D({ kg: -1, m: -2, s: 4, A: 2 }),
      RESIS   = D({ kg: 1, m: 2, s: -3, A: -2 }),
      CONDU   = D({ kg: -1, m: -2, s: 3, A: 2 }),
      MAGFLUX = D({ kg: 1, m: 2, s: -2, A: -1 }),
      MAGFLD  = D({ kg: 1, s: -2, A: -1 }),
      INDUC   = D({ kg: 1, m: 2, s: -2, A: -2 }),
      FREQ    = D({ s: -1 }),
      DOSE    = D({ m: 2, s: -2 }),
      CATALYT = D({ mol: 1, s: -1 }),
      ILLUM   = D({ cd: 1 }),
      LUMIN   = D({ cd: 1, m: -2 }),
      HEATCAP = D({ kg: 1, m: 2, s: -2, K: -1 }),
      SURFTENS = D({ kg: 1, s: -3 }),
      DENSITY = D({ kg: 1, m: -3 }),
      AREALMASS = D({ kg: 1, m: -2 });

  var PREFIXES = {
    y:  { f: 1e-24, s: 'y' }, z:  { f: 1e-21, s: 'z' }, a:  { f: 1e-18, s: 'a' },
    f:  { f: 1e-15, s: 'f' }, p:  { f: 1e-12, s: 'p' }, n:  { f: 1e-9,  s: 'n' },
    u:  { f: 1e-6,  s: 'µ' }, 'µ': { f: 1e-6, s: 'µ' }, 'μ': { f: 1e-6, s: 'µ' },
    m:  { f: 1e-3,  s: 'm' }, c:  { f: 1e-2,  s: 'c' }, d:  { f: 1e-1,  s: 'd' },
    da: { f: 1e1,   s: 'da' }, h: { f: 1e2,   s: 'h' }, k:  { f: 1e3,   s: 'k' },
    M:  { f: 1e6,   s: 'M' }, G: { f: 1e9,   s: 'G' }, T:  { f: 1e12,  s: 'T' },
    P:  { f: 1e15,  s: 'P' }, E: { f: 1e18,  s: 'E' }, Z:  { f: 1e21,  s: 'Z' },
    Y:  { f: 1e24,  s: 'Y' },
    Ki: { f: 1024,   s: 'Ki', bin: true }, Mi: { f: 1048576, s: 'Mi', bin: true },
    Gi: { f: 1073741824, s: 'Gi', bin: true }, Ti: { f: 1099511627776, s: 'Ti', bin: true },
    Pi: { f: 1125899906842624, s: 'Pi', bin: true }, Ei: { f: 1152921504606846976, s: 'Ei', bin: true },
    Zi: { f: 1180591620717411303424, s: 'Zi', bin: true },
    Yi: { f: 1208925819614629174706176, s: 'Yi', bin: true }
  };

  var UNITS = {};        // name -> entry
  var ORDER = [];        // insertion order (for help + display preference)

  /* U(name, factorToSI, dims, opts)
     opts: { o: offset in SI base, p: parseable with a prefix, sp: SI prefix may be
              applied when displaying, g: group, d: display symbol, pri: display priority } */
  function U(name, f, dims, opts) {
    opts = opts || {};
    var e = {
      name: name,
      f: f,
      o: opts.o || 0,
      d: dims,
      p: opts.p !== false,
      sp: opts.sp === true,
      g: opts.g || 'Other',
      sym: opts.d || name,
      base: opts.base || null,
      n: opts.n || 1,
      pri: opts.pri == null ? 100 : opts.pri,
      si: opts.si !== false
    };
    UNITS[name] = e;
    ORDER.push(e);
    return e;
  }

  /* ---------- dimensionless / math ---------- */
  U('1', 1, ONE, { p: false, g: 'Dimensionless', si: false, pri: 0, d: '' });
  U('pct', 1e-2, ONE, { p: false, g: 'Dimensionless', si: false, pri: 1, d: '%' });
  U('ppm', 1e-6, ONE, { p: false, g: 'Dimensionless', si: false, d: 'ppm' });
  U('ppb', 1e-9, ONE, { p: false, g: 'Dimensionless', si: false, d: 'ppb' });

  /* ---------- length ---------- */
  U('m', 1, L, { g: 'Length', pri: 0 });
  U('angstrom', 1e-10, L, { p: false, g: 'Length', si: false, d: 'Å' });
  U('in', 0.0254, L, { g: 'Imperial', si: false, d: 'in' });
  U('ft', 0.3048, L, { g: 'Imperial', si: false, d: 'ft' });
  U('yd', 0.9144, L, { g: 'Imperial', si: false, d: 'yd' });
  U('mi', 1609.344, L, { g: 'Imperial', si: false, d: 'mi' });
  U('thou', 2.54e-5, L, { g: 'Imperial', si: false, d: 'thou' });
  U('nmi', 1852, L, { g: 'Length', si: false, d: 'nmi' });
  U('fathom', 1.8288, L, { g: 'Length', si: false, d: 'fathom' });
  U('au', 1.495978707e11, L, { g: 'Astronomy', si: false, d: 'au' });
  U('ly', 9.4607304725808e15, L, { g: 'Astronomy', si: false, d: 'ly' });
  U('pc', 3.0856775814913673e16, L, { g: 'Astronomy', si: false, d: 'pc' });
  U('b', 1e-28, L, { g: 'Length', si: false, d: 'b' });
  U('barn', 1e-28, L, { p: false, g: 'Length', si: false, d: 'barn' });

  /* ---------- mass ---------- */
  U('g', 1e-3, M, { g: 'Mass', pri: 0, d: 'g' });
  U('kg', 1, M, { p: false, g: 'Mass', pri: 1 });
  U('t', 1000, M, { g: 'Mass', d: 't' });
  U('tonne', 1000, M, { p: false, g: 'Mass', d: 't' });
  U('u', 1.66053906660e-27, M, { g: 'Mass', si: false, d: 'u' });
  U('Da', 1.66053906660e-27, M, { p: false, g: 'Mass', si: false, d: 'Da' });
  U('lb', 0.45359237, M, { g: 'Imperial', si: false, d: 'lb' });
  U('oz', 0.028349523125, M, { g: 'Imperial', si: false, d: 'oz' });
  U('st', 6.35029318, M, { g: 'Imperial', si: false, d: 'st' });
  U('gr', 6.479891e-5, M, { g: 'Imperial', si: false, d: 'gr' });
  U('slug', 14.5939029372, M, { g: 'Imperial', si: false, d: 'slug' });
  U('carat', 2e-4, M, { g: 'Mass', si: false, d: 'ct' });

  /* ---------- time ---------- */
  U('s', 1, T, { g: 'Time', pri: 0 });
  U('min', 60, T, { g: 'Time', d: 'min' });
  U('h', 3600, T, { g: 'Time', d: 'h' });
  U('d', 86400, T, { g: 'Time', d: 'd' });
  U('wk', 604800, T, { g: 'Time', d: 'wk' });
  U('yr', 31557600, T, { g: 'Time', d: 'yr' });
  U('month', 2629746, T, { p: false, g: 'Time', d: 'month' });

  /* ---------- temperature ---------- */
  U('K', 1, K, { g: 'Temperature', pri: 0 });
  U('degC', 1, K, { o: 273.15, g: 'Temperature', d: '°C' });
  U('degF', 5 / 9, K, { o: 273.15 - 32 * 5 / 9, g: 'Temperature', d: '°F' });
  U('degR', 5 / 9, K, { g: 'Temperature', d: '°R' });

  /* ---------- other base ---------- */
  U('A', 1, I, { g: 'Electric', pri: 0 });
  U('mol', 1, N, { g: 'Amount', pri: 0 });
  U('cd', 1, CD, { g: 'Light', pri: 0 });

  /* ---------- angle (dimensionless but tracked) ---------- */
  U('rad', 1, RAD, { g: 'Angle', pri: 0 });
  U('deg', Math.PI / 180, RAD, { g: 'Angle', pri: 1, d: '°' });
  U('grad', Math.PI / 200, RAD, { g: 'Angle', si: false, d: 'grad' });
  U('arcmin', Math.PI / 10800, RAD, { g: 'Angle', si: false, d: "'" });
  U('arcsec', Math.PI / 648000, RAD, { g: 'Angle', si: false, d: '"' });
  U('rev', 2 * Math.PI, RAD, { g: 'Angle', si: false, d: 'rev' });
  U('sr', 1, ONE, { g: 'Angle', d: 'sr' });

  /* ---------- SI derived ---------- */
  U('Hz', 1, FREQ, { g: 'Frequency', pri: 0 });
  U('N', 1, FORCE, { g: 'Force', pri: 0 });
  U('Pa', 1, PRESS, { g: 'Pressure', pri: 0 });
  U('J', 1, ENERGY, { g: 'Energy', pri: 0 });
  U('W', 1, POWER, { g: 'Power', pri: 0 });
  U('C', 1, CHARGE, { g: 'Electric', pri: 0 });
  U('V', 1, VOLT, { g: 'Electric', pri: 0 });
  U('F', 1, CAPAC, { g: 'Electric', pri: 0 });
  U('ohm', 1, RESIS, { g: 'Electric', pri: 0, d: 'Ω' });
  U('S', 1, CONDU, { g: 'Electric', pri: 0 });
  U('Wb', 1, MAGFLUX, { g: 'Magnetism', pri: 0 });
  U('T', 1, MAGFLD, { g: 'Magnetism', pri: 0 });
  U('H', 1, INDUC, { g: 'Magnetism', pri: 0 });
  U('lm', 1, ILLUM, { g: 'Light', pri: 0 });
  U('lx', 1, LUMIN, { g: 'Light', pri: 0 });
  U('Bq', 1, FREQ, { g: 'Radiation', pri: 1 });
  U('Gy', 1, DOSE, { g: 'Radiation', pri: 0 });
  U('Sv', 1, DOSE, { g: 'Radiation', pri: 1 });
  U('kat', 1, CATALYT, { g: 'Chemistry', pri: 0 });

  /* ---------- other derived / accepted ---------- */
  U('are', 100, AREA, { g: 'Area', si: false, d: 'a' });
  U('ha', 1e4, AREA, { g: 'Area', si: false, d: 'ha' });
  U('acre', 4046.8564224, AREA, { g: 'Imperial', si: false, d: 'acre' });
  U('L', 1e-3, VOL, { g: 'Volume', pri: 1 });
  U('l', 1e-3, VOL, { g: 'Volume', pri: 2 });
  U('gal', 3.785411784e-3, VOL, { g: 'Imperial', si: false, d: 'gal' });
  U('qt', 9.46352946e-4, VOL, { g: 'Imperial', si: false, d: 'qt' });
  U('pt', 4.73176473e-4, VOL, { g: 'Imperial', si: false, d: 'pt' });
  U('floz', 2.95735295625e-5, VOL, { g: 'Imperial', si: false, d: 'fl oz' });
  U('cup', 2.365882365e-4, VOL, { g: 'Imperial', si: false, d: 'cup' });
  U('eV', 1.602176634e-19, ENERGY, { g: 'Energy', pri: 1 });
  U('cal', 4.184, ENERGY, { g: 'Energy', si: false, d: 'cal' });
  U('Cal', 4184, ENERGY, { p: false, g: 'Energy', si: false, d: 'Cal' });
  U('btu', 1055.05585262, ENERGY, { g: 'Imperial', si: false, d: 'BTU' });
  U('Wh', 3600, ENERGY, { g: 'Energy', si: false, d: 'Wh' });
  U('erg', 1e-7, ENERGY, { g: 'Energy', si: false, d: 'erg' });
  U('hp', 745.6998715822702, POWER, { g: 'Power', si: false, d: 'hp' });
  U('Ah', 3600, CHARGE, { g: 'Electric', si: false, d: 'Ah' });
  U('Cps', 1, FREQ, { g: 'Frequency', si: false, d: 'Cps' });
  U('rpm', 1 / 60, FREQ, { g: 'Frequency', si: false, d: 'rpm' });
  U('atm', 101325, PRESS, { g: 'Pressure', si: false, d: 'atm' });
  U('bar', 1e5, PRESS, { g: 'Pressure', si: false, d: 'bar' });
  U('mbar', 100, PRESS, { g: 'Pressure', si: false, d: 'mbar' });
  U('psi', 6894.757293168361, PRESS, { g: 'Imperial', si: false, d: 'psi' });
  U('torr', 101325 / 760, PRESS, { g: 'Pressure', si: false, d: 'Torr' });
  U('mmHg', 133.322387415, PRESS, { g: 'Pressure', si: false, d: 'mmHg' });
  U('inHg', 3386.388640341, PRESS, { g: 'Pressure', si: false, d: 'inHg' });
  U('dyn', 1e-5, FORCE, { g: 'Force', si: false, d: 'dyn' });
  U('lbf', 4.4482216152605, FORCE, { g: 'Imperial', si: false, d: 'lbf' });
  U('kgf', 9.80665, FORCE, { g: 'Force', si: false, d: 'kgf' });
  /* Display-only compounds: `/` and `·` are operators in the expression language,
     so these names exist only to give nicer results (they are never prefixed). */
  U('m2', 1, AREA, { p: false, g: 'Area', pri: 0, si: false, d: 'm²', base: 'm', n: 2 });
  U('m3', 1, VOL, { p: false, g: 'Volume', pri: 0, si: false, d: 'm³', base: 'm', n: 3 });
  U('J/K', 1, HEATCAP, { p: false, g: 'Thermodynamics', si: false, d: 'J/K' });
  U('J/mol', 1, D({ kg: 1, m: 2, s: -2, mol: -1 }), { p: false, g: 'Chemistry', si: false, d: 'J/mol' });
  U('kWh', 3.6e6, ENERGY, { p: false, g: 'Energy', si: false, d: 'kWh' });
  U('N/m', 1, D({ kg: 1, s: -2 }), { p: false, g: 'Mechanics', si: false, d: 'N/m' });
  U('Pa_s', 1, PRESS, { p: false, g: 'Mechanics', si: false, d: 'Pa·s' });
  U('W/m2', 1, SURFTENS, { p: false, g: 'Heat', si: false, d: 'W/m²' });
  U('mol/L', 1000, D({ mol: 1, m: -3 }), { p: false, g: 'Chemistry', si: false, d: 'mol/L' });
  U('m/s', 1, VELOC, { p: false, g: 'Speed', pri: 0, si: false, d: 'm/s' });
  U('m/s2', 1, ACCEL, { p: false, g: 'Speed', pri: 0, si: false, d: 'm/s²' });
  U('kmh', 1000 / 3600, VELOC, { p: false, g: 'Speed', pri: 1, si: false, d: 'km/h' });
  U('mph', 0.44704, VELOC, { p: false, g: 'Imperial', si: false, d: 'mph' });
  U('knot', 1852 / 3600, VELOC, { p: false, g: 'Speed', si: false, d: 'kn' });
  U('g/cm3', 1000, DENSITY, { p: false, g: 'Density', pri: 1, si: false, d: 'g/cm³' });
  U('kg/m3', 1, DENSITY, { p: false, g: 'Density', pri: 0, si: false, d: 'kg/m³' });
  U('g/m2', 1e-3, AREALMASS, { p: false, g: 'Chemistry', si: false, d: 'g/m²' });
  U('B', 8, ONE, { g: 'Data', si: false, d: 'B' });
  U('bit', 1, ONE, { g: 'Data', si: false, d: 'bit' });
  U('bel', 1, ONE, { p: false, g: 'Data', si: false, d: 'bel' });
  /* the decimal byte multiples, so "1KB" is a kilobyte and not kelvin x byte */
  U('KB', 8e3, ONE, { p: false, g: 'Data', si: false, d: 'KB' });
  U('MB', 8e6, ONE, { p: false, g: 'Data', si: false, d: 'MB' });
  U('GB', 8e9, ONE, { p: false, g: 'Data', si: false, d: 'GB' });
  U('TB', 8e12, ONE, { p: false, g: 'Data', si: false, d: 'TB' });

  /* The coherent SI units: these (and only these) get an auto prefix when a result
     is displayed, e.g. 0.000011 m -> 11 µm. Everything else is shown as typed. */
  ['m', 'g', 's', 'A', 'K', 'mol', 'cd', 'rad', 'deg', 'Hz', 'N', 'Pa', 'J', 'W',
   'C', 'V', 'F', 'ohm', 'S', 'Wb', 'T', 'H', 'lm', 'lx', 'Bq', 'Gy', 'Sv', 'kat',
   'L', 'eV', 'b', 't', 'm2', 'm3'].forEach(function (n) { if (UNITS[n]) UNITS[n].sp = true; });

  /* ---------- aliases ---------- */
  var ALIAS = {
    'Celsius': 'degC', 'celsius': 'degC', 'Fahrenheit': 'degF', 'fahrenheit': 'degF',
    'Kelvin': 'K', 'Ohm': 'ohm', 'OHM': 'ohm', 'Ω': 'ohm', 'Ω': 'ohm',
    'Å': 'angstrom', 'Å': 'angstrom', 'micron': 'um', 'microns': 'um', 'µm': 'um',
    'litre': 'L', 'liter': 'L', 'metres': 'm', 'meters': 'm', 'meter': 'm', 'metre': 'm',
    'second': 's', 'seconds': 's', 'gram': 'g', 'grams': 'g', 'gramme': 'g',
    'newton': 'N', 'newtons': 'N', 'pascal': 'Pa', 'pascals': 'Pa',
    'joule': 'J', 'joules': 'J', 'watt': 'W', 'watts': 'W',
    'volt': 'V', 'volts': 'V', 'amp': 'A', 'amps': 'A', 'ampere': 'A', 'amperes': 'A',
    'coulomb': 'C', 'farad': 'F', 'henry': 'H', 'tesla': 'T',
    'hertz': 'Hz', 'sec': 's', 'hr': 'h',
    'day': 'd', 'days': 'd', 'week': 'wk', 'weeks': 'wk',
    'year': 'yr', 'years': 'yr',
    'AU': 'au', 'lightyear': 'ly', 'lyr': 'ly',
    'percent': 'pct', 'pound': 'lb', 'pounds': 'lb', 'stone': 'st',
    'ton': 't', 'tons': 't', 'tonnes': 't', 'gallon': 'gal',
    'decibel': 'bel', 'dB': 'bel', 'mole': 'mol', 'moles': 'mol',
    'radian': 'rad', 'radians': 'rad', 'degree': 'deg', 'degrees': 'deg'
  };
  // 'yr'->'yr' etc. self-aliases are harmless but let's drop them
  Object.keys(ALIAS).forEach(function (k) { if (ALIAS[k] === k) delete ALIAS[k]; });

  /* ---------- physical constants ---------- */
  function C(name, v, dims, desc) {
    return { name: name, v: v, d: dims || ONE, desc: desc || '' };
  }
  var CONSTANTS = [
    C('pi', Math.PI, ONE, 'circle constant (plain number — write πrad for an angle)'),
    C('π', Math.PI, ONE, 'circle constant'),
    C('tau', 2 * Math.PI, ONE, '2π'),
    C('e', Math.E, ONE, "Euler's number"),
    C('phi', (1 + Math.sqrt(5)) / 2, ONE, 'golden ratio'),
    C('c', 299792458, VELOC, 'speed of light in vacuum'),
    C('c0', 299792458, VELOC, 'speed of light in vacuum'),
    C('h', 6.62607015e-34, D({ kg: 1, m: 2, s: -1 }), 'Planck constant (plain h means hour)'),
    C('planck', 6.62607015e-34, D({ kg: 1, m: 2, s: -1 }), 'Planck constant'),
    C('hbar', 1.054571817e-34, D({ kg: 1, m: 2, s: -1 }), 'reduced Planck constant'),
    C('k', 1.380649e-23, D({ kg: 1, m: 2, s: -2, K: -1 }), 'Boltzmann constant'),
    C('kB', 1.380649e-23, D({ kg: 1, m: 2, s: -2, K: -1 }), 'Boltzmann constant'),
    C('NA', 6.02214076e23, D({ mol: -1 }), 'Avogadro constant'),
    C('q', 1.602176634e-19, CHARGE, 'elementary charge'),
    C('qe', 1.602176634e-19, CHARGE, 'elementary charge'),
    C('R', 8.314462618, D({ kg: 1, m: 2, s: -2, mol: -1, K: -1 }), 'molar gas constant'),
    C('G', 6.67430e-11, D({ m: 3, kg: -1, s: -2 }), 'Newtonian constant of gravitation'),
    C('g0', 9.80665, ACCEL, 'standard gravity'),
    C('atm', 101325, PRESS, 'standard atmosphere'),
    C('epsilon0', 8.8541878128e-12, D({ kg: -1, m: -3, s: 4, A: 2 }), 'vacuum permittivity'),
    C('eps0', 8.8541878128e-12, D({ kg: -1, m: -3, s: 4, A: 2 }), 'vacuum permittivity'),
    C('mu0', 1.25663706212e-6, D({ kg: 1, m: 1, s: -2, A: -2 }), 'vacuum permeability'),
    C('sigma', 5.670374419e-8, D({ kg: 1, s: -3, K: -4 }), 'Stefan–Boltzmann constant'),
    C('a0', 5.29177210903e-11, L, 'Bohr radius'),
    C('me', 9.1093837015e-31, M, 'electron mass'),
    C('mp', 1.67262192369e-27, M, 'proton mass'),
    C('mn', 1.67492749804e-27, M, 'neutron mass'),
    C('Ry', 10973731.568160, D({ m: -1 }), 'Rydberg constant'),
    C('FF', 96485.33212, D({ A: 1, s: 1, mol: -1 }), 'Faraday constant'),
    C('p0', 101325, PRESS, 'standard pressure'),
    C('zero', 0, ONE, 'zero'),
    C('one', 1, ONE, 'one')
  ];

  root.SI_UNITS = {
    DIMS: DIMS, IDX: IDX, D: D,
    PREFIXES: PREFIXES, UNITS: UNITS, ORDER: ORDER, ALIAS: ALIAS,
    CONSTANTS: CONSTANTS,
    dims: { ONE: ONE, L: L, M: M, T: T, I: I, K: K, N: N, CD: CD, RAD: RAD }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
