#!/usr/bin/env node
/* tests/run-tests.js — engine test suite.  Run: node tests/run-tests.js */
'use strict';
require('../units.js');
require('../engine.js');
const SI = globalThis.SI;

let pass = 0, fail = 0;
const failures = [];

function eq(a, b, tol) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (tol == null) return a === b;
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  }
  return a === b;
}

function t(label, expr, expectedText, opts) {
  opts = opts || {};
  let got;
  try {
    const r = SI.evaluate(expr, opts.ctx);
    if (r.empty) throw new Error('empty');
    if (opts.raw) got = r.q.v;
    else if (opts.conv) got = r.conversion.text;
    else if (opts.si) got = SI.format(r.q, { sig: opts.sig }).siBase;
    else got = SI.format(r.q, { sig: opts.sig }).text;
  } catch (e) {
    got = 'ERROR: ' + e.message;
  }
  if (eq(got, expectedText, opts.tol)) { pass++; }
  else { fail++; failures.push(`  ✗ ${label}\n      input:    ${expr}\n      expected: ${expectedText}\n      got:      ${got}`); }
}

function tErrHint(label, expr, fragment) {
  let hint = null;
  try { SI.evaluate(expr); } catch (e) { hint = e.hint; }
  if (hint && hint.indexOf(fragment) >= 0) { pass++; }
  else { fail++; failures.push(`  ✗ ${label}\n      input: ${expr}\n      expected hint containing: ${fragment}\n      got: ${hint}`); }
}

function tErr(label, expr, fragment) {
  let msg = null;
  try {
    const r = SI.evaluate(expr);
    if (!r.empty) msg = null;
  } catch (e) { msg = e.message; }
  if (msg && msg.indexOf(fragment) >= 0) { pass++; }
  else { fail++; failures.push(`  ✗ ${label}\n      input: ${expr}\n      expected error containing: ${fragment}\n      got: ${msg === null ? 'no error' : msg}`); }
}

/* ---------------- the motivating example ---------------- */
/* the motivating example.  Note left associativity: a/b/c == a/(b*c), so
   "(8.8e-12F/m)" needs its own brackets to divide by a compound unit. */
t('user example', '10um*10um/(8.8e-12F/m)', '11.363636 m³·F⁻¹');
t('user example, exact value', '10um*10um/(8.8e-12F/m)', 11.363636363636364, { raw: true, tol: 1e-12 });
t('user example, base SI symbol', '10um*10um/(8.8e-12F/m)', '11.363636 kg·m⁵·s⁻⁴·A⁻²', { si: true });
t('user example, unbracketed', '10um*10um/8.8e-12F/m', '11.363636 m·F⁻¹');
t('user example, unbracketed base SI', '10um*10um/8.8e-12F/m', '11.363636 kg·m³·s⁻⁴·A⁻²', { si: true });

/* ---------------- prefixes & parsing ---------------- */
t('micro prefix', '10um', '10 µm');
t('SI alt prefix char', '10μm', '10 µm');
t('nano prefix', '5nm', '5 nm');
t('mega prefix', '3MW', '3 MW');
t('milli + mol', '5mmol', '5 mmol');
t('milli + s', '250ms', '250 ms');
t('kilo + W + h', '2kWh', '2 kWh');
t('ambiguous yd beats yocto-day', '3yd', '3 yd');
t('inch stays inches', '5in', '5 in', { tol: 1e-9 });
t('scientific notation', '8.8e-12F', '8.8 pF');
t('capital E notation', '2E10m', '20 Gm');
t('leading dot', '.5m', '0.5 m');
t('multiple prefixes cancel', '1kmm', '1 m');

/* ---------------- implicit multiplication & juxtaposition ---------------- */
t('number unit juxtaposition', '10 m', '10 m');
t('two units', '2h 30min', '2.5 h');
t('two units, base SI', '2h 30min', '9000 s', { si: true });
t('number times unit no space', '10m', '10 m');
t('adjacent digit is an exponent', '10m2', '10 m²');
t('space then number is multiply', '10m 2', '20 m');
t('square-s style exponent', 'F/m2', '1 F·m⁻²');
t('square-s style exponent raw', 'F/m2', '1 kg⁻¹·m⁻⁴·s⁴·A²', { si: true, tol: 1e-9 });
t('s-2 shorthand', '9.81m/s2', '9.81 m/s²');
t('spaces around minus is subtraction', '10m - 2m', '8 m');
t('implicit after paren', '2(3+4)m', '14 m');
t('pi juxtaposition', '2pi', '6.2831853');
t('pi constant', 'pi', '3.1415927');
t('2*pi', '2*pi', '6.2831853');
t('pi as an angle', '2*pi rad', '6.2831853 rad');
t('mixed radix does not multiply angles', '2pi', '6.2831853');

/* ---------------- arithmetic ---------------- */
t('precedence', '2+3*4', '14');
t('parens', '(2+3)*4', '20');
t('power right assoc', '2^3^2', '512');
t('unary minus vs power', '-2^2', '−4');
t('negative exponent', '10^-3', '0.001');
t('unary in exponent', '2^-2', '0.25');
t('power with unit', '(3m)^2', '9 m²');
t('fractional power of number', '8^(1/3)', '2');
t('division left assoc', '100/5/2', '10');
t('energy from power and time', '2kW * 3h', '21.6 MJ');
t('speed natural display', '60km/h to m/s', '16.666667 m/s');
t('speed conversion tail', '60km/h to m/s', '16.66666667 m/s', { conv: true });
t('percent', '850 * 15pct', '127.5');
t('percent sign', '850 * 15%', '127.5');
t('factorial', '5!', '120');
t('factorial function', 'fact(6)', '720');
t('mod', 'mod(7, 3)', '1');
t('gcd', 'gcd(12, 18)', '6');
t('lcm', 'lcm(4, 6)', '12');
t('hypot', 'hypot(3m, 4m)', '5 m');
t('round with digits', 'round(3.14159, 2)', '3.14');
t('round keeps unit', 'round(1234.5m)', '1.235 km');
t('floor keeps unit', 'floor(2.7m)', '2 m');
t('abs', 'abs(-3m)', '3 m');
t('clamp', 'clamp(15m, 0m, 10m)', '10 m');
t('min max', 'max(2m, 9m, 5m)', '9 m');

/* ---------------- unit algebra ---------------- */
t('force', '10kg * 9.81m/s^2', '98.1 N');
t('pressure', '100N / 0.01m^2', '10 kPa');
t('pressure prefix', '100N / 0.01m^2', '10 kPa');
t('work', '50N * 3m', '150 J');
t('charge', '2A * 10s', '20 C');
t('voltage', '10W / 2A', '5 V');
t('resistance', '12V / 3A', '4 Ω');
t('capacitance', '1C / 12V', '83.333333 mF');
t('frequency', '1 / 2s', '0.5 Hz');
t('density', '1000kg / 1m^3', '1000 kg/m³');
t('density g/cm3', '7.9g/cm^3', '7900 kg/m³');
t('volume', '2m * 3m * 4m', '24 m³');
t('volume litres', '2m*3m*4m to L', '24000 L', { conv: true });
t('cancelling units', '5m/5m', '1');
t('unit left in answer', '5m*2s', '10 m·s');
t('molarity', '1mol / 500mL', '2 mol/L');
t('concentration shortcut', '1mol/L', '1 mol/L');

/* ---------------- offset units (temperature) ---------------- */
t('celsius parse', '20degC', '20 °C');
t('celsius with symbol', '20°C', '20 °C');
t('celsius celsius sum', '20degC + 5degC', '25 °C');
t('kelvin display', '300K', '300 K');
t('celsius to kelvin', '0degC to K', '273.15 K', { conv: true });
t('celsius to fahrenheit', '100degC to degF', '100 °C');
t('celsius to fahrenheit value', '100degC to degF', '212 °F', { conv: true });
t('fahrenheit to celsius', '32degF to degC', '0 °C', { conv: true });
t('fahrenheit symbol', '212°F', '212 °F');
t('body temp', '37degC to degF', '98.6 °F', { conv: true, tol: 1e-9 });
tErr('cannot multiply two celsius', '20degC * 30degC', 'offset');
t('number times celsius scales the reading', '20degC * 2', '40 °C');

/* ---------------- angles ---------------- */
t('sin degrees', 'sin(30deg)', '0.5');
t('cos degrees', 'cos(60deg)', '0.5');
t('tan degrees', 'tan(45deg)', '1');
t('sin radians', 'sin(pi/2)', '1');
t('bare number is radians', 'sin(0)', '0');
t('asin returns angle', 'asin(0.5)', '30 °');
t('atan2', 'atan2(3,4)', '0.64350111 rad');
t('degree symbol', '90°', '90 °');
t('arcminute', "30'", "30 '");
t('arcminute in degrees', "30' to deg", '0.5 °', { conv: true });
t('quarter turn', '90deg/2', '45 °');

/* ---------------- functions & constants ---------------- */
t('sqrt of quantity', 'sqrt(4m^2)', '2 m');
t('sqrt of product', 'sqrt(4m^2 * 9s^2)', '6 m·s');
t('cbrt', 'cbrt(27m^3)', '3 m');
t('root', 'root(32, 5)', '2');
t('ln e', 'ln(e)', '1');
t('log10', 'log10(1000)', '3');
t('log base 2', 'log(8, 2)', '3');
t('exp', 'exp(1)', '2.7182818');
t('speed of light', 'c', '299792458 m/s');
t('planck', '2*pi*hbar', '6.6260701e-34 J·s');
t('boltzmann', 'k', '1.380649e-23 J/K');
t('avogadro charge', 'NA * q', '96485.332 C·mol⁻¹');
t('gas constant molar', 'R * 2mol', '16.628925 J/K');
t('free fall', 'g0 * 2s^2', '19.6133 m');

/* ---------------- variables ---------------- */
const ctx = { vars: {} };
let r = SI.evaluate('w = 3.4mm');
ctx.vars.w = r.q;
t('variable reuse', 'w * 2', '6.8 mm', { ctx });
t('variable in product', 'w * 10mm', '34 mm²', { ctx });
r = SI.evaluate('area = 2m * 3m');
ctx.vars.area = r.q;
t('variable from assignment', 'area + 1m^2', '7 m²', { ctx });
tErr('unknown symbol', 'nope*2m', 'unknown unit');
tErr('missing variable', 'nope * 2', 'unknown unit or name "nope"');
t('variable expression E/(me*c^2)', 'E/(me*c^2)', '12214329000000', { ctx: Object.assign({ vars: {
  E: SI.evaluate('1J').q, me: SI.evaluate('me').q, c: SI.evaluate('c').q } }) });
t('user example is reproducible from the README', '10um*10um/(8.8e-12F/m)', '11.363636 m³·F⁻¹');
t('safety limits', '1e999', 'ERROR: "1e999" is out of range');
t('deep nesting is reported, not crashed', '('.repeat(400) + '1' + ')'.repeat(400),
  'ERROR: this expression is nested too deeply');

/* ---------------- conversion suffix ---------------- */
t('to suffix', '72km/h to m/s', '20 m/s');
t('to suffix value', '72km/h to m/s', '20 m/s', { conv: true });
t('to suffix compound', '1kWh to J', '3600000 J', { conv: true });
t('to with spaces', '100 cm to m', '1 m', { conv: true });
t('to kelvin', '100degC to K', '373.15 K', { conv: true });

/* ---------------- error handling ---------------- */
tErr('add length to time', '1m + 1s', 'cannot add');
tErr('subtract mismatched', '1kg - 1m', 'cannot subtract');
tErr('unknown unit', '10 foo', 'unknown unit');
tErrHint('suggestion for typo', '10 metrs', 'Did you mean');
tErr('sqrt of odd power', 'sqrt(2m^3)', 'not a physical quantity');
tErrHint('sqrt of odd power hint', 'sqrt(2m^3)', 'square root');
tErr('ln of dimensioned', 'ln(5m)', 'plain number');
tErr('fractional power of unit', '4m^0.5', 'cannot raise');
tErrHint('fractional power hint', '4m^0.5', 'fractional powers');
tErr('trig with length', 'sin(5m)', 'needs an angle');
tErr('division by zero', '5/0', 'division by zero');
tErr('unclosed paren', '(2+3', 'missing');
tErr('bad character', '5 # 3', 'unexpected character');
tErr('asin out of range', 'asin(5)', 'between');
tErr('wrong arg count', 'sqrt(1,2)', 'takes 1 argument');

/* ---------------- formatting ---------------- */
t('format keeps 2h30min as hours', '2h 30min', '2.5 h');
t('format base SI', '2h 30min', '9000 s', { si: true });
t('very small picks femto', '1e-15 m', '1 fm');
t('big integers get a prefix', '1234567m', '1.234567 Mm');
t('zero', '0m', '0 m');
t('negative', '-5m', '−5 m');
t('angle keeps typed unit', '1rad', '1 rad');
t('angle in degrees', '1rad to deg', '57.29577951 °', { conv: true });
t('angle whole degrees', '1deg', '1 °');

t('kilo-Calorie is not kilocoulomb times attolitre', '1kCal', '1 kCal');
t('kilocalorie', '1kcal', '1 kcal');
t('food Calorie', '1Cal', '1 Cal');
t('kilo-Calorie in joules', '1kCal to J', '4184000 J', { conv: true });

/* ---------------- fixes from the reference review ---------------- */
tErr('arity error names the function', 'max()', 'max() takes');
tErr('arity error on a two-argument function', 'hypot(3m)', 'hypot() takes');
t('odd root of a negative number', 'root(-8,3)', '−2');
t('even root of a negative number is refused', 'root(-8,2)', 'ERROR: root() of a negative number needs an odd integer n');
t('pi is typeable', 'pi', '3.1415927');
t('2pi', '2pi', '6.2831853');
t('ASCII quote is an arcsecond', '1"', '1 "');
t('carat is not centi-tonne', '1ct', '1 ct');
t('viscosity times velocity', '1Pa_s*1m/s', '1 N/m');
t('floor works on an offset unit', 'floor(20.7degC)', '293 K');

/* ---------------- electrical engineering constants ---------------- */
t('impedance of free space', 'Z0', '376.73031 Ω');
t('admittance of free space is 1/Z0', '1/Z0', '2.6544187 mS');
t('quarter-wave transformer', 'Z0/4', '94.182578 Ω');
t('Josephson frequency at 1 volt', 'KJ*1V', '483.59785 THz');
t('von Klitzing constant', 'RK', '25.812807 kΩ');
t('magnetic flux quantum', '2*phi0', '4.1356677 fWb');
t('Bohr magneton times one tesla', 'muB*1T to pJ', '9.274010078e-12 pJ', { conv: true });
t('electron cyclotron frequency at 1 tesla', 'emratio*1T', '175.882 GHz');
t('Compton wavelength', 'lambda_c', '2.4263102 pm');
t('fine-structure constant', 'alpha', '0.0072973526');
t('second radiation constant', 'c2', '0.014387769 m·K');
t('Wien peak temperature at 500 nm', 'bWien/500nm', '5.7955439 kK');
t('triple point of water', 'triple', '273.16 K');
t('resistance of 1 m of 1 mm2 copper', 'rho_cu*1m/(1mm^2)', '16.8 mΩ');
t('resistance of 1 m of 1 mm2 silver', 'rho_ag*1m/(1mm^2)', '15.9 mΩ');
t('conductivity of copper', 'sigma_cu', '58 MS');
t('silicon permittivity', 'eps_si*epsilon0', '1.03594e-10 F·m⁻¹');
t('silicon band gap', 'Eg_si to eV', '1.119999357 eV', { conv: true });
t('permeability and permittivity give c', '1/sqrt(epsilon0*mu0)', '299792460 m/s', { tol: 1e-8 });
t('capacitance from permittivity and area', 'epsilon0*1m^2/(1mm)', '8.8541878 nF');
t('magnetic energy density at 1 tesla', '1T^2/(2*mu0)', '397.88736 kPa', { tol: 1e-6 });

/* ---------------- rendered equation ---------------- */
function eq_(expr, expected, opts) {
  const got = SI.evaluate(expr, opts && opts.ctx).eq;
  if (got === expected) pass++;
  else { fail++; failures.push(`  ✗ equation: ${expr}\n      expected: ${expected}\n      got:      ${got}`); }
}
eq_('10um*10um/8.8e-12F/m', '10 µm · 10 µm ÷ (8.8e-12 F) ÷ m');
eq_('10um*10um/(8.8e-12F/m)', '10 µm · 10 µm ÷ (8.8e-12 F ÷ m)');
eq_('2h 30min', '2 h + 30 min');
eq_('1h 2m', '1 h · 2 m');
eq_('9.81m/s^2 * 1.5s^2', '(9.81 m ÷ s²) · 1.5 s²');
eq_('(2+3)*4', '(2 + 3) · 4');
eq_('1/2m', '1 ÷ (2 m)');
eq_('-(2+3)*4', '−(2 + 3) · 4');
eq_('10m^2', '10 m²');
eq_('2m^-2', '2 m⁻²');
eq_('sqrt(4m^2)', 'sqrt(4 m²)');
eq_('5!', '5!');
eq_('sin(30deg)', 'sin(30 °)');
eq_('-5m', '−5 m');
eq_('3.5cm+4mm', '3.5 cm + 4 mm');
eq_('1e6', '1e6');
eq_('1mol*1kJ/mol', '1 mol · 1 kJ ÷ mol');

/* ---------------- documented syntax rules ---------------- */
t('README: juxtaposition binds tighter than slash', '1/2m', '0.5 m⁻¹');
t('README: brackets give half a metre', '(1/2)m', '0.5 m');
t('README: explicit multiply gives half a metre', '1/2*m', '0.5 m');
t('README: slash keeps the divisor units', '100km/2h', '13.888889 m/s');
t('README: exponent attaches to the unit', '10m^2', '10 m²');
t('README: brackets exponentiate the product', '(10m)^2', '100 m²');
t('README: superscript input', 'm²', '1 m²');
t('README: negative superscript input', '1/s⁻¹', '1 s');
t('README: caret exponent', '5m^3', '5 m³');
t('README: arrow conversion', '1km -> m', '1000 m', { conv: true });
t('README: mixed radix needs spaces', '2h 30min', '2.5 h');
t('README: percent', '50%', '0.5');
t('README: factorial', '5!', '120');
t('README: trig takes degrees', 'sin(30deg)', '0.5');
t('assignment with :=', 'w := 3.4mm', '3.4 mm');

/* ---------------- display choices ---------------- */
t('photon energy', 'planck*c/(500nm)', '397.28917 zJ');
t('h is the hour, not Planck', 'h', '1 h');
t('hour times velocity', '2h*3m/s', '21.6 km');   /* 7200 s * 3 m/s = 21600 m */
t('thermal conductivity', '1W/(m*K)', '1 W·m⁻¹·K⁻¹');
t('Coulomb constant', '1/(4pi*epsilon0)', '8987551800 m·F⁻¹', { tol: 1e-9 });
t('relativistic energy', '(3e8m/s)^2/(2*me)', '4.939961e43 Gy·g⁻¹', { tol: 1e-9 });
t('faraday constant', 'NA*q', '96485.332 C·mol⁻¹');
t('molar internal energy', '1kJ/mol*2mol', '2 kJ');
t('energy density equals pressure', '1J/cm^3', '1000 kPa');   /* J/m³ and Pa share dimensions */
t('charge density', '1C/m^3', '1 Pa·V⁻¹');   /* C/m³ = Pa/V */
t('magnetic energy density', '1T^2/(2*mu0)', '397.88736 kPa', { tol: 1e-6 });
t('resistivity', '1ohm*m', '1 Ω·m');

/* ---------------- regressions from the code review ---------------- */
t('compact subtraction', '10m-2m', '8 m');
t('compact subtraction of prefixes', '3.5cm-4mm', '3.1 cm');
t('compact subtraction of time', '60s-1min', '0 min');
t('compact negative exponent still works', 's-2', '1 s⁻²');
t('compact negative exponent of metres', 'm-2', '1 m⁻²');
t('compact subtraction with exponent', '5m^2-1m^2', '4 m²');
t('mixed radix with no space still reads as digits', '1h2m', '7200 m·s');
t('full mixed radix chain', '1d 12h 30min 5s', '1.5208912 d');
t('full mixed radix chain, no spaces', '1d12h30min5s', '1.5208912 d');
t('mixed radix needs matching dimensions', '1h 2m', '7200 m·s');
t('prefix applies to the root of a square', '1km2', '1 km²');
t('prefix applies to the root of a cube', '1km3', '1 km³');
t('small squared value', '1um2', '1 µm²');
t('squared value keeps its unit', '5cm^2', '5 cm²');
t('stacked prefixes show the right magnitude', '1kug', '1 mg');
t('stacked prefixes with kilo', '1Tug', '1 t');
t('kilobyte is not kelvin times byte', '1KB', '8000');
t('inverse of speed is not a speed', '1s/m', '1 s·m⁻¹');
t('conversion target may be squared', '1m^2 to ft2', '10.76391042 ft²', { conv: true });
t('tiny conversion survives', '1fm to m', '1e-15 m', { conv: true });
t('assignment survives a conversion', 'y = 5m to cm', '5 m', { ctx: { vars: {} } });
t('offset unit divided by a number', '20degC/2', '10 °C');
t('tonnes take prefixes', '1kt', '1 kt');
t('sign of a quantity', 'sign(-5m)', '−1');
t('dimensionless result has a base form', '1/3', '0.33333333', { si: true });
t('conversion target must be a unit', '2 to 3', 'ERROR: "3" is not a unit');

(function cacheSafety() {
  /* the same symbol must resolve the same way whatever was evaluated before */
  const key = r => (r ? r.f + '|' + r.d.join(',') : 'null');
  SI.clearCache();
  const fresh = key(SI.resolve('mmmmmmm'));
  try { SI.evaluate('1mmmmmm'); } catch (e) { /* the point is the cache, not the value */ }
  const after = key(SI.resolve('mmmmmmm'));
  SI.clearCache();
  if (fresh === after) pass++;
  else { fail++; failures.push(`  ✗ unit cache changed how "${'mmmmmmm'}" resolves: ${fresh} then ${after}`); }
})();

/* ---------------- unit table sanity ---------------- */
(function tableSanity() {
  let bad = [];
  const U = globalThis.SI_UNITS;
  for (const name of Object.keys(U.UNITS)) {
    const r = SI.resolve(name, 0);
    if (!r || !r.u) { bad.push(`  ✗ table entry "${name}" does not resolve to itself`); fail++; }
  }
  if (!bad.length) pass++;
  failures.push(...bad);
})();

(function prefixSanity() {
  const U = globalThis.SI_UNITS;
  const bad = [];
  for (const p of ['n', 'u', 'm', 'k', 'M', 'G']) {
    for (const base of ['m', 'g', 's', 'J', 'V', 'mol']) {
      const r = SI.resolve(p + base, 0);
      const want = U.PREFIXES[p].f * U.UNITS[base].f;
      if (!r || Math.abs(r.f - want) > Math.abs(want) * 1e-12) {
        bad.push(`  ✗ prefix ${p}${base}: expected ${want}, got ${r && r.f}`);
      }
    }
  }
  if (bad.length) { fail += bad.length; failures.push(...bad); }
  else pass++;
})();

/* ---------------- report ---------------- */
console.log(`\n${pass} passed, ${fail} failed\n`);
if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
