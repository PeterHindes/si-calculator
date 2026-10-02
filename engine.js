/* engine.js — tokenizer, parser, unit algebra, evaluator and formatter.
   Exposes globalThis.SI. */
(function (root) {
  'use strict';

  var U = root.SI_UNITS;
  var UNITS = U.UNITS, PREFIXES = U.PREFIXES, ALIAS = U.ALIAS, CONSTANTS = U.CONSTANTS;
  var D = U.D, ONE = U.dims.ONE;

  /* ============================ errors ============================ */

  function CalcError(msg, pos, hint) {
    var e = new Error(msg);
    e.name = 'CalcError';
    e.calc = true;
    e.pos = pos;
    e.hint = hint || null;
    return e;
  }

  /* ============================ dimensions ============================ */

  function dimsZero(d) { for (var i = 0; i < 8; i++) if (d[i]) return false; return true; }

  /* Dimension exponents must stay finite: m^1e308 * m^1e308 is not a quantity. */
  function checkDims(d, pos) {
    for (var i = 0; i < 8; i++) {
      if (!isFinite(d[i])) {
        throw CalcError('these units give a power that is too large', pos,
          'A unit raised to a power above about 1e15 has no useful meaning here.');
      }
    }
    return d;
  }
  var ZERO_D = [0, 0, 0, 0, 0, 0, 0, 0];
  function dimsEq(a, b) {
    for (var i = 0; i < 8; i++) if (Math.abs(a[i] - b[i]) > 1e-12) return false;
    return true;
  }
  function dimsAdd(a, b) { return a.map(function (x, i) { return x + b[i]; }); }
  function dimsSub(a, b) { return a.map(function (x, i) { return x - b[i]; }); }
  function dimsScale(a, k) { return a.map(function (x) { return x * k; }); }
  function dimsMul(a, b) { return a.map(function (x, i) { return x * b[i]; }); }

  var SUP_DIGITS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
                     '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
                     '⁻': '-', '⁺': '+' };

  var SUP_CHARS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
                    '-': '⁻', '+': '⁺' };

  function supString(n) {
    if (n === 0) return '';
    if (!Number.isInteger(n)) return '^' + (Math.round(n * 1e6) / 1e6);
    if (Math.abs(n) >= 1000) return '^' + n;      /* superscripts stop being readable */
    var neg = n < 0;
    var s = String(Math.abs(n)), out = '';
    for (var i = 0; i < s.length; i++) out += SUP_CHARS[s[i]];
    return (neg ? SUP_CHARS['-'] : '') + out;
  }

  function dimSymbol(d) {
    var parts = [];
    for (var i = 0; i < 8; i++) {
      /* rounding a huge exponent overflows to Infinity, so only round small ones */
      var e = Math.abs(d[i]) < 1e12 ? Math.round(d[i] * 1e9) / 1e9 : d[i];
      if (e === 0) continue;
      parts.push(U.DIMS[i] + (e === 1 ? '' : supString(e)));
    }
    return parts.length ? parts.join('·') : '1';
  }

  /* ============================ quantity ============================ */
  /* v  — numeric value expressed in SI base units of d
     d  — dimension exponents [kg, m, s, A, K, mol, cd, rad]
     o  — non-zero only for offset units (°C, °F): physical value = v
     h  — name of the display unit the user typed (hint), or null           */

  function Q(v, d, o, h) { this.v = v; this.d = d || [0, 0, 0, 0, 0, 0, 0, 0]; this.o = o || 0; this.h = h || null; }
  function isDimless(q) { return dimsZero(q.d); }

  /* When two quantities are added, keep the coarser unit for display:
     "2h 30min" reads as 2.5 h, "3.5cm + 4mm" as 3.9 cm. */
  function addHint(a, b) {
    if (!a.h || !b.h) return null;
    if (a.h === b.h) return a.h;
    if (!dimsEq(a.h.d, b.h.d)) return null;
    if (a.h.o && b.h.o) return a.h.o === b.h.o ? a.h : null;   /* °C + °F: give up */
    return a.h.f >= b.h.f ? a.h : b.h;
  }

  /* Adding two readings on the same offset scale (°C, °F) is scale addition:
     20degC + 5degC = 25degC.  Mixing with an absolute unit stays absolute. */
  function offsetSum(a, b, sign) {
    var bothSame = a.o && b.o && a.o === b.o;
    var v = a.v + sign * b.v;
    if (bothSame) v += sign < 0 ? a.o : -a.o;
    return new Q(v, a.d.slice(), bothSame ? a.o : 0, addHint(a, b));
  }

  function qAdd(a, b, pos) {
    if (!dimsEq(a.d, b.d)) {
      throw CalcError('cannot add ' + dimSymbol(a.d) + ' and ' + dimSymbol(b.d),
        pos, 'Both sides must be the same kind of quantity. If you meant a negative ' +
             'exponent like m⁻¹, write it as m^-1 or with superscripts.');
    }
    return offsetSum(a, b, 1);
  }
  function qSub(a, b, pos) {
    if (!dimsEq(a.d, b.d)) {
      throw CalcError('cannot subtract ' + dimSymbol(b.d) + ' from ' + dimSymbol(a.d),
        pos, 'Both sides must be the same kind of quantity. If you meant a negative ' +
             'exponent like m⁻¹, write it as m^-1 or with superscripts.');
    }
    return offsetSum(a, b, -1);
  }
  function qMul(a, b) {
    /* "20degC" is a number scaling an offset unit, not a physical product */
    if (a.o && dimsZero(b.d) && !b.o) return new Q(b.v * (a.v - a.o) + a.o, a.d.slice(), a.o, a.h);
    if (b.o && dimsZero(a.d) && !a.o) return new Q(a.v * (b.v - b.o) + b.o, b.d.slice(), b.o, b.h);
    if (a.o || b.o) throw CalcError('offset units (°C, °F) cannot be multiplied — use kelvin instead');
    /* a plain number in front of a unit does not cancel its display unit:
       "2kWh" should still read 2 kWh, not 7.2 MJ */
    var h = dimsZero(a.d) ? b.h : (dimsZero(b.d) ? a.h : null);
    return new Q(a.v * b.v, checkDims(dimsAdd(a.d, b.d), null), 0, h);
  }
  function qDiv(a, b) {
    if (a.o && dimsZero(b.d) && !b.o && b.v !== 0) {
      return new Q((a.v - a.o) / b.v + a.o, a.d.slice(), a.o, a.h);
    }
    if (a.o || b.o) throw CalcError('offset units (°C, °F) cannot be multiplied or divided — use kelvin instead');
    if (b.v === 0) throw CalcError('division by zero');
    return new Q(a.v / b.v, checkDims(dimsAdd(a.d, dimsScale(b.d, -1)), null), 0, null);
  }
  /* negation keeps an offset unit consistent: -(20°C) reads as -20°C */
  function qNeg(a) { return new Q(a.o ? 2 * a.o - a.v : -a.v, a.d.slice(), a.o, a.h); }
  /* "2h 30min" — mixed radix: add when both sides are quantities of the same
     kind, otherwise fall back to plain multiplication ("1kg 2m" = kg·m). */
  function qMixed(a, b) {
    if (!dimsZero(a.d) && !dimsZero(b.d) && dimsEq(a.d, b.d)) {
      try { return qAdd(a, b, null); } catch (e) { /* fall through to multiply */ }
    }
    return qMul(a, b);
  }
  function qPow(a, e, pos) {
    if (a.o && e.v !== 1) throw CalcError('offset units (°C, °F) cannot be raised to a power', pos);
    var nd = checkDims(dimsScale(a.d, e.v), pos);
    var hint = a.h;
    if (hint && hint.n !== 1 && e.v === 1) hint = null;
    if (!dimsZero(a.d) && !Number.isInteger(e.v)) {
      throw CalcError('cannot raise ' + dimSymbol(a.d) + ' to the power ' + fmtNum(e.v),
        pos, 'Only dimensionless values can take fractional powers (sqrt handles units separately).');
    }
    var r = Math.pow(a.v, e.v);
    if (!isFinite(r)) throw CalcError('result is not a finite number', pos);
    if (hint && Number.isInteger(e.v)) {
      var h2 = { sym: hint.sym, f: hint.f, o: hint.o, d: nd.slice(), sp: hint.sp,
                 bare: hint.bare, n: hint.n * e.v };
      return new Q(r, nd, 0, h2);
    }
    return new Q(r, nd, 0, null);
  }

  /* ============================ units ============================ */

  var CONST_BY_NAME = {};
  CONSTANTS.forEach(function (c) { if (!(c.name in CONST_BY_NAME)) CONST_BY_NAME[c.name] = c; });

  var UNIT_CACHE = {};

  function isUnitEntry(r) { return !!(r && r.u); }

  /* Resolve a bare symbol to {f, o, d, u, c}. Returns null if unknown. */
  function resolve(name, depth) {
    depth = depth || 0;
    if (depth > 5) return null;
    if (depth === 0 && UNIT_CACHE[name] !== undefined) return UNIT_CACHE[name];
    var out = null;

    var e = UNITS[name];
    if (e) out = { f: e.f, o: e.o, d: e.d, u: e };

    if (!out && ALIAS[name] && ALIAS[name] !== name) out = resolve(ALIAS[name], depth + 1);

    if (!out && name in CONST_BY_NAME) {
      var c = CONST_BY_NAME[name];
      out = { f: c.v, o: 0, d: c.d, u: null, c: c };
    }

    /* SI prefix + unit (longest prefix first: da, Ki, ... then d, c, ...) */
    if (!out && name.length > 1) {
      var lens = [2, 1];
      for (var li = 0; li < lens.length && !out; li++) {
        var L = lens[li];
        var p = PREFIXES[name.slice(0, L)];
        if (!p) continue;
        var rest = resolve(name.slice(L), depth + 1);
        if (isUnitEntry(rest) && rest.u.p) {
          /* "kmm" is kilo × milli × metre: the value is right but the symbol is
             not "km", so only the outermost prefix is kept for display */
          out = { f: p.f * rest.f, o: 0, d: rest.d, u: rest.u,
                  pre: rest.pre ? null : p, stacked: !!rest.pre };
        }
      }
    }

    /* compound symbol with no separator: Nm, kgm, inHg ... */
    if (!out) {
      for (var i = 1; i < name.length; i++) {
        var l = resolve(name.slice(0, i), depth + 1);
        var r = resolve(name.slice(i), depth + 1);
        if (isUnitEntry(l) && isUnitEntry(r)) {
          out = { f: l.f * r.f, o: 0, d: dimsAdd(l.d, r.d), u: null, compound: true };
          break;
        }
      }
    }

    if (depth === 0) UNIT_CACHE[name] = out;   /* only whole-name lookups are final */
    return out;
  }

  function clearUnitCache() { UNIT_CACHE = {}; }

  /* ============================ tokenizer ============================ */

  var ID_RE = /[A-Za-z_µμΩΩ°ÅÅπ'′″]/;
  function isKnownWord(name) {
    return !!(FUNCS[name] || CONST_BY_NAME[name]);
  }
  var OPS = { '+': 1, '-': 1, '*': 1, '/': 1, '^': 1 };

  function tokenize(src) {
    var toks = [], i = 0, n = src.length;
    while (i < n) {
      var c = src[i], start = i;
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }

      /* superscript exponent: ² ⁻¹ ³ -> ^ 2, ^ -1, ^ 3 */
      if (SUP_DIGITS[c] != null) {
        var s = '';
        while (i < n && SUP_DIGITS[src[i]] != null) { s += SUP_DIGITS[src[i]]; i++; }
        if (!/^[-+]?\d+(\.\d+)?$/.test(s)) throw CalcError('"' + s + '" is not a valid exponent', start);
        toks.push({ t: 'op', v: '^', pos: start, end: i });
        toks.push({ t: 'num', v: parseFloat(s), pos: start, end: i });
        continue;
      }

      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        var m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
        var num = parseFloat(m[0]);
        if (!isFinite(num)) {
          throw CalcError('"' + m[0] + '" is out of range', i,
            'The largest number this calculator handles is about 1e308.');
        }
        toks.push({ t: 'num', v: num, raw: m[0], pos: i, end: i + m[0].length });
        i += m[0].length;
        continue;
      }

      if (c === '"') { toks.push({ t: 'id', v: 'arcsec', pos: i, end: i + 1 }); i++; continue; }
      if (c === '℃') { toks.push({ t: 'id', v: 'degC', pos: i, end: i + 1 }); i++; continue; }
      if (c === '℉') { toks.push({ t: 'id', v: 'degF', pos: i, end: i + 1 }); i++; continue; }

      if (ID_RE.test(c)) {
        if (c === '°') {
          var nx = src[i + 1];
          if (nx === 'C' || nx === 'c') { toks.push({ t: 'id', v: 'degC', pos: i, end: i + 2 }); i += 2; continue; }
          if (nx === 'F') { toks.push({ t: 'id', v: 'degF', pos: i, end: i + 2 }); i += 2; continue; }
          toks.push({ t: 'id', v: 'deg', pos: i, end: i + 1 }); i++; continue;
        }
        if (c === "'" || c === '′') { toks.push({ t: 'id', v: 'arcmin', pos: i, end: i + 1 }); i++; continue; }
        if (c === '"' || c === '″') { toks.push({ t: 'id', v: 'arcsec', pos: i, end: i + 1 }); i++; continue; }
        var j = i;
        while (j < n && ID_RE.test(src[j]) && src[j] !== '°' && src[j] !== "'" &&
               src[j] !== '′' && src[j] !== '"' && src[j] !== '″') j++;
        var name = src.slice(i, j);
        /* a digit run joins the name when it spells a known function or constant
           (log10, atan2, g0) — otherwise the digits stay an exponent: 10m2 */
        var k = j;
        while (k < n && /[0-9]/.test(src[k])) k++;
        if (k > j && isKnownWord(name + src.slice(j, k))) { name += src.slice(j, k); j = k; }
        toks.push({ t: 'id', v: name, pos: i, end: j });
        i = j;
        continue;
      }

      if (c === '(') { toks.push({ t: 'lparen', v: '(', pos: i, end: i + 1 }); i++; continue; }
      if (c === ')') { toks.push({ t: 'rparen', v: ')', pos: i, end: i + 1 }); i++; continue; }
      if (c === '[' || c === '{') { toks.push({ t: 'lparen', v: c, pos: i, end: i + 1 }); i++; continue; }
      if (c === ']' || c === '}') { toks.push({ t: 'rparen', v: c, pos: i, end: i + 1 }); i++; continue; }
      if (c === ',') { toks.push({ t: 'comma', v: ',', pos: i, end: i + 1 }); i++; continue; }
      if (c === '!') { toks.push({ t: 'bang', v: '!', pos: i, end: i + 1 }); i++; continue; }
      if (c === '%') { toks.push({ t: 'id', v: 'pct', pos: i, end: i + 1 }); i++; continue; }
      if (OPS[c]) { toks.push({ t: 'op', v: c, pos: i, end: i + 1 }); i++; continue; }

      if (c === '·' || c === '×' || c === '∗' || c === '⋅' || c === '*') { toks.push({ t: 'op', v: '*', pos: i, end: i + 1 }); i++; continue; }
      if (c === '÷' || c === '∕') { toks.push({ t: 'op', v: '/', pos: i, end: i + 1 }); i++; continue; }
      if (c === '−') { toks.push({ t: 'op', v: '-', pos: i, end: i + 1 }); i++; continue; }
      if (c === '√') { toks.push({ t: 'id', v: 'sqrt', pos: i, end: i + 1 }); i++; continue; }
      if (c === '²') { /* unreachable */ }

      throw CalcError('unexpected character "' + c + '"', i,
        'Allowed: numbers, unit names, + - * / ^ ( ) , ! and %');
    }
    toks.push({ t: 'end', v: null, pos: n, end: n });
    return toks;
  }

  /* ============================ parser ============================ */

  function Parser(toks) { this.toks = toks; this.i = 0; this.depth = 0; }
  Parser.prototype.enter = function () {
    if (++this.depth > 200) {
      throw CalcError('this expression is nested too deeply', null,
        'Break it into smaller pieces, or store part of it in a variable.');
    }
  };
  Parser.prototype.peek = function (k) { return this.toks[this.i + (k || 0)]; };
  Parser.prototype.next = function () { return this.toks[this.i++]; };

  Parser.prototype.parse = function () {
    var n = this.expr();
    var t = this.peek();
    if (t.t !== 'end') {
      if (t.t === 'rparen') throw CalcError('unexpected ")"', t.pos);
      throw CalcError('unexpected "' + (t.v === null ? 'end of input' : t.v) + '"', t.pos);
    }
    return n;
  };

  Parser.prototype.expr = function () {
    this.enter();
    var left = this.term();
    for (;;) {
      var t = this.peek();
      if (t.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.next();
        var right = this.term();
        left = { t: t.v === '+' ? 'add' : 'sub', a: left, b: right, pos: t.pos };
      } else break;
    }
    this.depth--;
    return left;
  };

  function startsFactor(tok) {
    return tok.t === 'num' || tok.t === 'id' || tok.t === 'lparen';
  }

  /* product of factors joined by * or / */
  Parser.prototype.term = function () {
    var left = this.factor();
    for (;;) {
      var t = this.peek();
      if (t.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.next();
        var right = this.factor();
        left = { t: t.v === '*' ? 'mul' : 'div', a: left, b: right, pos: t.pos };
      } else break;
    }
    return left;
  };

  Parser.prototype.factor = function () {
    var t = this.peek();
    if (t.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.next();
      return { t: t.v === '-' ? 'neg' : 'pos', a: this.factor(), pos: t.pos };
    }
    return this.tight();
  };

  /* Juxtaposition binds tighter than * and /, so the units after a slash belong to
     the divisor:  100km/2h = 50 km/h,  E/mc^2,  10m/s = 10 m/s. */
  Parser.prototype.tight = function () {
    var left = this.power();
    for (;;) {
      var t = this.peek();
      if (!startsFactor(t)) break;
      if (t.t === 'num') {
        /* "2h 30min" is mixed radix: the next digit is a whole number-unit group */
        var right = this.tight();
        left = { t: 'mixed', a: left, b: right, pos: right.pos };
      } else {
        left = { t: 'mul', a: left, b: this.power(), pos: t.pos };
      }
    }
    return left;
  };

  /* An exponent attaches to the unit/number right before it, never to a product:
     10m^2 is 10 m², not (10 m)².  Right associative: 2^3^2 = 512. */
  Parser.prototype.power = function () {
    var base = this.primary();
    for (;;) {
      base = this.suffixes(base);
      var t = this.peek();
      if (t.t === 'op' && t.v === '^') {
        this.next();
        base = { t: 'pow', a: base, b: this.factor(), pos: t.pos };
        continue;
      }
      break;
    }
    return base;
  };

  /* shorthand exponents:  m2, m-2, 3!  — the digits must touch the unit, and
     "1h2m" is read as mixed radix, so the digits may not be followed by a unit */
  Parser.prototype.suffixes = function (node) {
    var prevEnd = this.toks[this.i - 1].end;
    for (;;) {
      var t = this.peek();
      var after = this.toks[this.i + 1];        /* token after the digits */
      var afterThat = this.toks[this.i + 2];

      if (t.t === 'num' && t.pos === prevEnd && !(after && after.t === 'id')) {
        this.next();
        node = { t: 'pow', a: node, b: { t: 'num', v: t.v, raw: t.raw, pos: t.pos }, pos: t.pos };
        prevEnd = t.end;
        continue;
      }
      /* "s-2" is s⁻² — but "1h2m" is mixed radix, so the digits may not be
         followed by a unit, and the exponent is the number, not the operator */
      if (t.t === 'op' && t.v === '-' && t.pos === prevEnd &&
          after && after.t === 'num' && after.pos === t.end &&
          !(afterThat && afterThat.t === 'id')) {
        this.next(); this.next();
        node = { t: 'pow', a: node, b: { t: 'num', v: -after.v, pos: after.pos }, pos: t.pos };
        prevEnd = after.end;
        continue;
      }
      if (t.t === 'bang' && t.pos === prevEnd) {
        this.next();
        node = { t: 'fact', a: node, pos: t.pos };
        prevEnd = t.end;
        continue;
      }
      break;
    }
    return node;
  };

  Parser.prototype.primary = function () {
    var t = this.next();
    if (t.t === 'num') return { t: 'num', v: t.v, raw: t.raw, pos: t.pos };

    if (t.t === 'lparen') {
      this.enter();
      var inner = this.expr();
      var cl = this.peek();
      if (cl.t !== 'rparen') throw CalcError('missing ")"', cl.pos);
      this.next();
      this.depth--;
      return { t: 'group', a: inner, pos: t.pos };
    }

    if (t.t === 'id') {
      if (FUNCS[t.v] && this.peek().t === 'lparen') {
        this.next();
        var args = [];
        if (this.peek().t !== 'rparen') {
          for (;;) {
            args.push(this.expr());
            if (this.peek().t === 'comma') { this.next(); continue; }
            break;
          }
        }
        var rp = this.peek();
        if (rp.t !== 'rparen') throw CalcError('missing ")"', rp.pos);
        this.next();
        return { t: 'call', name: t.v, args: args, pos: t.pos };
      }
      return { t: 'sym', name: t.v, pos: t.pos };
    }

    if (t.t === 'op' && t.v === '^') {
      throw CalcError('that exponent has nothing in front of it', t.pos,
        'Exponents belong to a unit or number, for example m^2 or 3m^2.');
    }
    if (t.t === 'end') throw CalcError('unexpected end of input', t.pos);
    throw CalcError('unexpected "' + t.v + '"', t.pos);
  };

  /* ============================ functions ============================ */

  function needNum(q, fn, pos) {
    if (!isDimless(q)) {
      throw CalcError(fn + '() needs a plain number, not ' + dimSymbol(q.d), pos,
        'Divide out the units first, e.g. ' + fn + '(x/' + dimSymbol(q.d) + ')');
    }
    if (q.o) throw CalcError(fn + '() cannot take an offset unit', pos);
    return q.v;
  }
  function angleRad(q, fn, pos) {
    if (dimsEq(q.d, U.dims.RAD)) return q.v;
    if (isDimless(q) && !q.o) return q.v;
    throw CalcError(fn + '() needs an angle, not ' + dimSymbol(q.d), pos,
      'For example ' + fn + '(30deg) or ' + fn + '(0.5rad).');
  }
  function outNum(v) { return new Q(v, ONE.slice(), 0, null); }

  /* Every built-in takes (args, pos) where args is the evaluated argument list. */
  var FUNCS = {
    sqrt: {
      arity: 1, doc: '√x — square root (halves even unit powers)', f: function (a, pos) {
        var x = a[0];
        if (x.o) throw CalcError('sqrt() cannot take an offset unit (°C, °F)', pos);
        if (x.v < 0) throw CalcError('sqrt() of a negative number', pos);
        if (!dimsZero(x.d)) {
          for (var i = 0; i < 8; i++) {
            var e = x.d[i];
            if (Math.abs(e) > 1e-12 && Math.abs(e / 2 - Math.round(e / 2)) > 1e-12) {
              throw CalcError('sqrt() of ' + dimSymbol(x.d) + ' is not a physical quantity', pos,
                'Only quantities whose unit powers are all even have a real square root.');
            }
          }
        }
        return new Q(Math.sqrt(x.v), dimsScale(x.d, 0.5), 0, null);
      }
    },
    cbrt: {
      arity: 1, doc: '∛x — cube root', f: function (a, pos) {
        var x = a[0];
        if (x.o) throw CalcError('cbrt() cannot take an offset unit (°C, °F)', pos);
        return new Q(Math.cbrt(x.v), dimsScale(x.d, 1 / 3), 0, null);
      }
    },
    root: {
      arity: 2, doc: 'root(x, n) — n-th root', f: function (a, pos) {
        var k = needNum(a[1], 'root', pos);
        var x = a[0];
        if (x.o) throw CalcError('root() cannot take an offset unit (°C, °F)', pos);
        if (!dimsZero(x.d) && !Number.isInteger(k)) {
          throw CalcError('root() of ' + dimSymbol(x.d) + ' needs an integer n', pos);
        }
        if (x.v < 0) {
          /* an odd integer root of a negative number is real; JS returns NaN */
          if (!Number.isInteger(k) || Math.abs(Math.round(k)) % 2 === 0) {
            throw CalcError('root() of a negative number needs an odd integer n', pos,
              'For an even root use abs(x), or cbrt() for a cube root.');
          }
          return new Q(-Math.pow(-x.v, 1 / k), dimsScale(x.d, 1 / k), 0, null);
        }
        return new Q(Math.pow(x.v, 1 / k), dimsScale(x.d, 1 / k), 0, null);
      }
    },
    abs: {
      arity: 1, doc: 'abs(x) — absolute value', f: function (a) {
        return a[0].o ? new Q(Math.abs(a[0].v), a[0].d.slice(), 0, null)
                     : new Q(Math.abs(a[0].v), a[0].d.slice(), 0, a[0].h);
      }
    },
    sign: { arity: 1, doc: 'sign(x) — −1, 0 or 1', f: function (a) { return outNum(Math.sign(a[0].v)); } },
    floor: { arity: 1, doc: 'floor(x) — round down', f: function (a, pos) { return keepUnits(Math.floor(a[0].v), a[0], pos); } },
    ceil: { arity: 1, doc: 'ceil(x) — round up', f: function (a, pos) { return keepUnits(Math.ceil(a[0].v), a[0], pos); } },
    round: {
      arity: [1, 2], doc: 'round(x [, digits])', f: function (a, pos) {
        var x = a[0];
        var d = a.length > 1 ? Math.round(needNum(a[1], 'round', pos)) : 0;
        var f = Math.pow(10, d);
        return new Q(Math.round(x.v * f) / f, x.d.slice(), 0, null);
      }
    },
    exp: { arity: 1, doc: 'exp(x) — e to the power x', f: function (a, pos) { return outNum(Math.exp(needNum(a[0], 'exp', pos))); } },
    ln: {
      arity: 1, doc: 'ln(x) — natural logarithm', f: function (a, pos) {
        var v = needNum(a[0], 'ln', pos);
        if (v <= 0) throw CalcError('ln() needs a positive number', pos);
        return outNum(Math.log(v));
      }
    },
    log10: {
      arity: 1, doc: 'log10(x)', f: function (a, pos) {
        var v = needNum(a[0], 'log10', pos);
        if (v <= 0) throw CalcError('log10() needs a positive number', pos);
        return outNum(Math.log10(v));
      }
    },
    log2: {
      arity: 1, doc: 'log2(x)', f: function (a, pos) {
        var v = needNum(a[0], 'log2', pos);
        if (v <= 0) throw CalcError('log2() needs a positive number', pos);
        return outNum(Math.log2(v));
      }
    },
    log: {
      arity: [1, 2], doc: 'log(x [, base]) — base 10 by default', f: function (a, pos) {
        var v = needNum(a[0], 'log', pos);
        var base = a.length > 1 ? needNum(a[1], 'log', pos) : 10;
        if (v <= 0) throw CalcError('log() needs a positive number', pos);
        if (base <= 0 || base === 1) throw CalcError('log() base must be greater than 0 and not 1', pos);
        return outNum(Math.log(v) / Math.log(base));
      }
    },
    sin: { arity: 1, doc: 'sin(angle) — bare numbers are radians', f: function (a, pos) { return outNum(Math.sin(angleRad(a[0], 'sin', pos))); } },
    cos: { arity: 1, doc: 'cos(angle)', f: function (a, pos) { return outNum(Math.cos(angleRad(a[0], 'cos', pos))); } },
    tan: { arity: 1, doc: 'tan(angle)', f: function (a, pos) { return outNum(Math.tan(angleRad(a[0], 'tan', pos))); } },
    asin: {
      arity: 1, doc: 'asin(x) — returns an angle', f: function (a, pos) {
        var v = needNum(a[0], 'asin', pos);
        if (v < -1 || v > 1) throw CalcError('asin() needs a value between −1 and 1', pos);
        return new Q(Math.asin(v), U.dims.RAD.slice(), 0, null);
      }
    },
    acos: {
      arity: 1, doc: 'acos(x) — returns an angle', f: function (a, pos) {
        var v = needNum(a[0], 'acos', pos);
        if (v < -1 || v > 1) throw CalcError('acos() needs a value between −1 and 1', pos);
        return new Q(Math.acos(v), U.dims.RAD.slice(), 0, null);
      }
    },
    atan: {
      arity: 1, doc: 'atan(x) — returns an angle', f: function (a, pos) {
        return new Q(Math.atan(needNum(a[0], 'atan', pos)), U.dims.RAD.slice(), 0, null);
      }
    },
    atan2: {
      arity: 2, doc: 'atan2(y, x) — returns an angle', f: function (a, pos) {
        if (!dimsEq(a[0].d, a[1].d)) throw CalcError('atan2() arguments must have the same units', pos);
        return new Q(Math.atan2(a[0].v, a[1].v), U.dims.RAD.slice(), 0, null);
      }
    },
    sinh: { arity: 1, doc: 'sinh(x)', f: function (a, pos) { return outNum(Math.sinh(needNum(a[0], 'sinh', pos))); } },
    cosh: { arity: 1, doc: 'cosh(x)', f: function (a, pos) { return outNum(Math.cosh(needNum(a[0], 'cosh', pos))); } },
    tanh: { arity: 1, doc: 'tanh(x)', f: function (a, pos) { return outNum(Math.tanh(needNum(a[0], 'tanh', pos))); } },
    pow: {
      arity: 2, doc: 'pow(x, n) — x to the power n', f: function (a, pos) {
        return qPow(a[0], new Q(needNum(a[1], 'pow', pos), ONE.slice()), pos);
      }
    },
    min: {
      arity: [1, 8], doc: 'min(a, b, …)', f: function (a, pos) {
        var best = a[0];
        for (var i = 1; i < a.length; i++) {
          if (!dimsEq(a[i].d, best.d)) throw CalcError('min() arguments must have the same units', pos);
          if (a[i].v < best.v) best = a[i];
        }
        return best;
      }
    },
    max: {
      arity: [1, 8], doc: 'max(a, b, …)', f: function (a, pos) {
        var best = a[0];
        for (var i = 1; i < a.length; i++) {
          if (!dimsEq(a[i].d, best.d)) throw CalcError('max() arguments must have the same units', pos);
          if (a[i].v > best.v) best = a[i];
        }
        return best;
      }
    },
    clamp: {
      arity: 3, doc: 'clamp(x, lo, hi)', f: function (a, pos) {
        if (!dimsEq(a[0].d, a[1].d) || !dimsEq(a[0].d, a[2].d)) {
          throw CalcError('clamp() arguments must share the same units', pos);
        }
        return new Q(Math.min(Math.max(a[0].v, a[1].v), a[2].v), a[0].d.slice(), 0, a[0].h);
      }
    },
    mod: {
      arity: 2, doc: 'mod(a, b) — remainder with the sign of b', f: function (a, pos) {
        if (!dimsEq(a[0].d, a[1].d)) throw CalcError('mod() arguments must share the same units', pos);
        if (a[1].v === 0) throw CalcError('mod() by zero', pos);
        return new Q(a[0].v - Math.floor(a[0].v / a[1].v) * a[1].v, a[0].d.slice(), 0, null);
      }
    },
    hypot: {
      arity: [2, 8], doc: 'hypot(a, b, …) — √(a²+b²+…)', f: function (a, pos) {
        var s = 0;
        for (var i = 0; i < a.length; i++) {
          if (i && !dimsEq(a[i].d, a[0].d)) throw CalcError('hypot() arguments must share the same units', pos);
          s += a[i].v * a[i].v;
        }
        return new Q(Math.sqrt(s), a[0].d.slice(), 0, null);
      }
    },
    fact: { arity: 1, doc: 'fact(n) — n! (also written 5!)', f: function (a, pos) { return outNum(factorial(needNum(a[0], 'fact', pos), pos)); } },
    gcd: {
      arity: [2, 8], doc: 'gcd(a, b, …)', f: function (a, pos) {
        var r = 0;
        for (var i = 0; i < a.length; i++) r = gcd(r, Math.round(needNum(a[i], 'gcd', pos)));
        return outNum(r);
      }
    },
    lcm: {
      arity: [2, 8], doc: 'lcm(a, b, …)', f: function (a, pos) {
        var r = 1;
        for (var i = 0; i < a.length; i++) {
          var x = Math.abs(Math.round(needNum(a[i], 'lcm', pos)));
          if (!x) return outNum(0);
          r = r / gcd(r, x) * x;
        }
        return outNum(r);
      }
    }
  };

  /* Rounding keeps the unit: floor(2.7m) = 2 m.  Offset units are rounded on the
     absolute scale (round(20.4degC) = 294 K), which is what round() already did. */
  function keepUnits(v, src, pos) {
    return new Q(v, src.d.slice(), 0, null);
  }

  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function factorial(n, pos) {
    if (n < 0 || !Number.isInteger(n)) throw CalcError('factorial needs a non-negative integer', pos);
    if (n > 170) throw CalcError('factorial is too large (max 170)', pos);
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  /* ============================ equation rendering ========================= */
  /* Renders the parsed expression the way it was actually evaluated, so the
     result can be shown as an equation instead of a bare number:
        10um*10um/8.8e-12F/m   ->   10 µm · 10 µm ÷ 8.8 pF ÷ 1 m                        */

  var PREC = { add: 1, sub: 1, mul: 2, mixed: 2, div: 2, pow: 4, atom: 5 };

  function symText(n) {
    if (n.varname) return n.varname;            /* a stored value shows its name */
    if (n.q && n.q.h) return n.q.h.sym + (n.q.h.n && n.q.h.n !== 1 ? supString(n.q.h.n) : '');
    return String(n.name);
  }

  function renderAtomNum(n) {
    return n.raw != null ? n.raw : fmtNum(n.v, 8);   /* show the literal as typed */
  }

  /* "10 m" and "4 m²" read better than "10 · m" and "4 · m²" */
  function isUnitish(n) {
    if (n.t === 'sym') return !n.varname && !!(n.q && n.q.h);
    if (n.t === 'pow') {                                          /* 4 m², 2 m⁻¹ */
      var intExp = n.b.t === 'num' || (n.b.t === 'neg' && n.b.a.t === 'num');
      return intExp && isUnitish(n.a);
    }
    return false;
  }

  function renderRaw(n) {
    var s;
    switch (n.t) {
      case 'num':
        return renderAtomNum(n);
      case 'sym':
        return symText(n);
      case 'group':
        s = render(n.a, 0);
        return isAtomic(n.a) ? s : '(' + s + ')';
      case 'fact':
        return render(n.a, 5) + '!';
      case 'neg':
        return '−' + render(n.a, 2);
      case 'pos':
        return render(n.a, 4);
      case 'pow': {
        s = render(n.a, 5);
        var e = n.b.t === 'num' ? n.b.v
              : (n.b.t === 'neg' && n.b.a.t === 'num' ? -n.b.a.v : null);
        if (e !== null && Number.isInteger(e) && Math.abs(e) <= 9 && e !== 1) {
          return s + supString(e);
        }
        return s + '^' + render(n.b, 5);
      }
      case 'add':
        return render(n.a, PREC.add) + ' + ' + render(n.b, PREC.add + 1);
      case 'sub':
        return render(n.a, PREC.sub) + ' − ' + render(n.b, PREC.sub + 1);
      case 'div':
        /* the right-hand side is always parenthesised when it is not a single
           factor: "a ÷ (b · c)" can never be misread */
        return render(n.a, PREC.div) + ' ÷ ' + render(n.b, 3);
      case 'mul': {
        var glue = (n.a.t === 'num' && isUnitish(n.b)) || (n.b.t === 'num' && isUnitish(n.a));
        /* a division inside a product needs its brackets, or "a ÷ b · c" misreads */
        var pa = (n.a.t === 'div') ? 3 : PREC.mul + (glue ? 1 : 0);
        var pb = (n.b.t === 'div') ? 3 : PREC.mul + (glue ? 1 : 0);
        return render(n.a, pa) + (glue ? ' ' : ' · ') + render(n.b, pb);
      }
      case 'mixed': {
        /* 2h 30min was a sum; 1h 2m was a product — show which one happened */
        var a = n.a.q, b = n.b.q;
        var added = a && b && !dimsZero(a.d) && !dimsZero(b.d) && dimsEq(a.d, b.d);
        if (!added) {
          return render(n.a, n.a.t === 'div' ? 3 : PREC.mul) + ' · ' +
                 render(n.b, n.b.t === 'div' ? 3 : PREC.mul);
        }
        return render(n.a, PREC.add) + ' + ' + render(n.b, PREC.add + 1);
      }
      case 'call': {
        var args = n.args.map(function (a) { return render(a, 0); });
        return FUNCS[n.name] ? n.name + '(' + args.join(', ') + ')'
                             : '(' + args.join(', ') + ')';
      }
      default:
        return '?';
    }
  }

  function isAtomic(n) {
    return PREC[n.t] === undefined || PREC[n.t] >= PREC.atom;
  }

  function render(n, parentPrec) {
    var s = renderRaw(n);
    var p = PREC[n.t] == null ? PREC.atom : PREC[n.t];
    return (parentPrec && p < parentPrec) ? '(' + s + ')' : s;
  }

  function renderNode(n, q) { n.q = q; n.r = render(n, 0); return q; }

  /* ============================ evaluation ============================ */

  function evalNodeInner(n, ctx) {
    try {
      switch (n.t) {
        case 'num': return new Q(n.v, ONE.slice(), 0, null);
        case 'group': return evalNode(n.a, ctx);
        case 'add': return qAdd(evalNode(n.a, ctx), evalNode(n.b, ctx), n.pos);
        case 'sub': return qSub(evalNode(n.a, ctx), evalNode(n.b, ctx), n.pos);
        case 'mul': return qMul(evalNode(n.a, ctx), evalNode(n.b, ctx));
        case 'mixed': return qMixed(evalNode(n.a, ctx), evalNode(n.b, ctx));
        case 'div': return qDiv(evalNode(n.a, ctx), evalNode(n.b, ctx));
        case 'neg': return qNeg(evalNode(n.a, ctx));
        case 'pos': return evalNode(n.a, ctx);
        case 'pow': return qPow(evalNode(n.a, ctx), evalNode(n.b, ctx), n.pos);
        case 'fact': return outNum(factorial(needNum(evalNode(n.a, ctx), 'fact', n.pos), n.pos));
        case 'sym':
          n.varname = (ctx && ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, n.name))
            ? n.name : null;
          return resolveSymbol(n.name, ctx, n.pos);
        case 'call': {
          var fn = FUNCS[n.name];
          var args = n.args.map(function (a) { return evalNode(a, ctx); });
          if (fn.arity) {
            var lo = Array.isArray(fn.arity) ? fn.arity[0] : fn.arity;
            var hi = Array.isArray(fn.arity) ? fn.arity[1] : fn.arity;
            if (args.length < lo || args.length > hi) {
              throw CalcError(n.name + '() takes ' + lo +
                (hi > lo ? '–' + hi : '') + ' argument' + (hi > 1 ? 's' : '') +
                ', got ' + args.length, n.pos);
            }
          }
          return fn.f(args, n.pos);
        }
      }
      throw CalcError('internal: unknown node', n.pos);
    } catch (err) {
      if (err && err.calc && err.pos == null) err.pos = n.pos;
      throw err;
    }
  }

  /* Evaluate, and remember on every node both its value and its rendered text
     so the caller can show the whole equation. */
  function evalNode(n, ctx) {
    var q = evalNodeInner(n, ctx);
    if (!n.r) renderNode(n, q);
    return q;
  }

  function resolveSymbol(name, ctx, pos) {
    if (ctx && ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, name)) {
      var v = ctx.vars[name];
      return v instanceof Q ? v : new Q(v.v, v.d, v.o, v.h);
    }
    var r = resolve(name, 0);
    if (!r) throw CalcError('unknown unit or name "' + name + '"', pos, suggest(name));
    if (!r.u) return new Q(r.f, r.d.slice(), 0, null);          /* physical constant */
    var q = new Q(r.f + r.o, r.d.slice(), r.o, null);
    /* "1kug" is kilo-micro-gram: no single symbol describes it, so forget the hint */
    q.h = r.stacked ? null : {
      sym: (r.pre ? r.pre.s : '') + r.u.sym,
      f: r.f, o: r.o, d: r.d.slice(),
      sp: r.u.sp, bare: !r.pre, n: 1
    };
    return q;
  }

  function suggest(name) {
    var best = null, bestD = 1e9;
    var pool = Object.keys(UNITS).concat(Object.keys(ALIAS), CONSTANTS.map(function (c) { return c.name; }));
    pool.forEach(function (cand) {
      var d = lev(name, cand);
      if (d < bestD) { bestD = d; best = cand; }
    });
    if (best && bestD <= Math.max(2, Math.floor(name.length / 2))) {
      var e = UNITS[best];
      return 'Did you mean "' + best + '"' + (e && e.sym ? ' (' + e.sym + ')' : '') + '?';
    }
    return 'Type the help sheet (?) for the list of units.';
  }

  function lev(a, b) {
    var m = a.length, n = b.length, i, j, prev = [], cur = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur.slice();
    }
    return prev[n];
  }

  var ASSIGN_RE = /^\s*([A-Za-z_][A-Za-z_]*)\s*(:?=)\s*([\s\S]+)$/;
  var TO_RE = /^([\s\S]*?)\s+(?:to|->)\s+([\s\S]+)$/;

  function evaluate(src, ctx) {
    ctx = ctx || {};
    var text = String(src);
    if (!text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s/g, '')) return { q: null, empty: true };

    /* "72km/h to m/s" — evaluate, then express the result in the requested units */
    var to = TO_RE.exec(text);
    if (to) {
      var lhs = evaluate(to[1], ctx);
      if (lhs.q) {
        if (lhs.assignment) {                 /* "x = 5m to cm" still stores x */
          return { q: lhs.q, ast: lhs.ast,
                   eq: lhs.eq != null ? lhs.eq : (lhs.ast ? lhs.ast.r : null),
                   assignment: lhs.assignment,
                   conversion: convert(lhs.q, to[2], { sig: ctx.sig }) };
        }
        var rhs = evaluate(to[2], ctx);
        if (!rhs.q) throw CalcError('no unit after "to"', text.length - 1);
        if (!dimsEq(lhs.q.d, rhs.q.d)) {
          throw CalcError('"' + to[2].trim() + '" is not a unit of ' + dimSymbol(lhs.q.d),
            to[1].length, 'The left side is ' + dimSymbol(lhs.q.d) + ', the right side is ' + dimSymbol(rhs.q.d) + '.');
        }
        var conv = convert(lhs.q, to[2], { sig: ctx.sig });
        if (!isFinite(conv.value)) {
          throw CalcError('that conversion is out of range', to[1].length,
            'Try a unit closer to the value you are converting.');
        }
        return { q: lhs.q, ast: lhs.ast, eq: lhs.eq != null ? lhs.eq : (lhs.ast ? lhs.ast.r : null),
                 conversion: conv, assignment: null };
      }
    }

    /* "w = 3 N" (or "w := 3 N") stores a named value */
    var assign = ASSIGN_RE.exec(text);
    if (assign && !/^\s*=/.test(assign[3])) {
      var sub = evaluate(assign[3], ctx);
      return { q: sub.q, ast: sub.ast, eq: assign[1] + ' = ' + (sub.ast ? sub.ast.r : ''),
               assignment: { name: assign[1], value: sub.q, src: assign[3].trim() } };
    }

    var toks = tokenize(text);
    var ast = new Parser(toks).parse();
    var res = evalNode(ast, ctx);
    if (!isFinite(res.v)) {
      throw CalcError('the result is not a finite number', 0,
        'Look for a division by zero, 0^0, or a value out of range.');
    }
    return { q: res, ast: ast, eq: ast.r, assignment: null, conversion: null };
  }


  /* ============================ formatting ============================ */

  function fmtNum(x, sig) {
    sig = sig || 8;
    if (typeof x !== 'number' || isNaN(x)) return 'NaN';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    var ax = Math.abs(x);
    if (Number.isInteger(x) && ax < 1e15) return String(x).replace(/^-/, '\u2212');
    var s;
    if (ax >= 1e15 || ax < 1e-5) {
      s = x.toExponential(Math.max(0, sig - 1));
      s = s.replace(/\.?0+e/, 'e');
    } else {
      s = x.toPrecision(sig);
      if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
      if (Number.isInteger(Number(s)) && Math.abs(Number(s)) < 1e15) s = String(Number(s));
    }
    return s.replace('e+', 'e').replace(/^-/, '\u2212');   /* typographic minus */
  }

  function fmtFull(x) {
    if (!isFinite(x)) return String(x);
    if (x === 0) return '0';
    var s = String(x);
    if (s.indexOf('e') >= 0) return s.replace('e+', 'e');
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }

  /* candidate display units for a dimension vector */
  var PICK_CACHE = {};
  function pickUnits(d) {
    var key = d.join(',');
    if (PICK_CACHE[key]) return PICK_CACHE[key];
    var list = [];
    for (var i = 0; i < U.ORDER.length; i++) {
      var u = U.ORDER[i];
      if (!dimsEq(u.d, d)) continue;
      list.push(u);
    }
    list.sort(function (a, b) {
      if (a.pri !== b.pri) return a.pri - b.pri;        /* designed preference first */
      if (a.sp !== b.sp) return a.sp ? -1 : 1;           /* then SI-prefixable */
      return U.ORDER.indexOf(a) - U.ORDER.indexOf(b);
    });
    PICK_CACHE[key] = list;
    return list;
  }

  /* The prefixes a result is *displayed* with. Centi/deci/hecto/deca stay
     available for input but are not used when formatting (10 m, not 1 dam). */
  var DISPLAY_PREFIXES = ['Y', 'Z', 'E', 'P', 'T', 'G', 'M', 'k', '', 'm', 'µ', 'n', 'p', 'f', 'a', 'z', 'y'];

  /* Pick the prefix that gives the largest mantissa below 1000
     (10 m -> 10 m, 0.5 m -> 500 mm, 1e-5 m -> 10 µm, 1e15 m -> 1 Pm). */
  function prefixFor(unit, value) {
    if (!unit || !unit.sp || value === 0) return { pre: null, v: value };
    var ax = Math.abs(value);
    /* 0.5 Hz reads better than 500 mHz, but 0.25 s is better as 250 ms */
    if (ax >= 0.1 && ax < 1) return { pre: null, v: value };
    var seq = [''].concat(DISPLAY_PREFIXES).map(function (k) { return k ? PREFIXES[k] : null; });
    seq.sort(function (a, b) { return (b ? b.f : 1) - (a ? a.f : 1); });   /* largest factor first */
    for (var i = 0; i < seq.length; i++) {
      if (!seq[i]) continue;
      var x = value / seq[i].f;
      if (Math.abs(x) >= 1 && Math.abs(x) < 1000) return { pre: seq[i], v: x };
    }
    return { pre: null, v: value };
  }

  /* ---- composing a readable symbol out of named units (e.g. m³·F⁻¹) ---- */

  var COMPOSE_EXTRA = ['m2', 'm3', 'm/s', 'm/s2', 'N/m', 'kg/m3', 'g/cm3', 'W/m2',
                        'W/m', 'J/K', 'J/mol', 'mol/L', 'Pa_s', 'g/m2'];
  function composable(u) {
    /* A symbol containing "/" or a superscript becomes unreadable once an
       exponent is appended (m/s⁻¹ reads as a speed, not s·m⁻¹).  Pure powers are
       exempt because composedSymbol re-exponents them from their base unit. */
    if (u.base) return true;
    return u.sym.indexOf('/') < 0 && !/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/.test(u.sym);
  }
  var COMPOSE = (function () {
    var base = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];
    var extras = COMPOSE_EXTRA.map(function (n) { return UNITS[n]; })
      .filter(function (u) { return u && composable(u); });
    var rest = U.ORDER.filter(function (u) { return u.sp && composable(u) && extras.indexOf(u) < 0; });
    /* search order: base units first, then SI derived, then handy compounds, and
       exact-scale units before litre/eV/gauss-like ones (m³ beats 10⁻³ m³) */
    function rank(u) {
      var base_ = base.indexOf(u.name) >= 0 ? 0 : 1;
      var extra = extras.indexOf(u) >= 0 ? 2 : 1;
      var scale = u.f === 1 ? 0 : 1;
      return base_ * 10 + extra + scale;
    }
    return extras.concat(rest).sort(function (a, b) { return rank(a) - rank(b); });
  })();
  var COMPOSE_CACHE = {};

  function collectCompose(rem, budget, acc, seen, out, cap) {
    if (out.length >= cap) return;
    if (dimsEq(rem, ZERO_D)) { out.push(acc); return; }
    if (budget === 0) return;
    var key = rem.join(',') + '|' + budget;
    if (seen[key]) return;
    seen[key] = true;
    for (var i = 0; i < COMPOSE.length; i++) {
      var u = COMPOSE[i];
      collectCompose(dimsSub(rem, u.d), budget - 1, acc.concat([{ u: u, e: 1, i: i }]), seen, out, cap);
      collectCompose(dimsAdd(rem, u.d), budget - 1, acc.concat([{ u: u, e: -1, i: i }]), seen, out, cap);
      if (out.length >= cap) return;
    }
  }

  /* Merge repeated units so "m · m · F⁻¹" prints as "m²·F⁻¹". */
  function mergeCompose(parts) {
    var merged = [], byUnit = new Map();
    parts.forEach(function (p) {
      if (byUnit.has(p.u)) byUnit.get(p.u).e += p.e;
      else { var c = { u: p.u, e: p.e, i: p.i }; byUnit.set(p.u, c); merged.push(c); }
    });
    var BASE = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd', 'rad'];
    return merged.filter(function (c) { return c.e !== 0; })
      /* positive powers first (F·m⁻² reads better than m⁻²·F); inside each group a
         derived unit leads (J·s, not s·J) and a base unit trails */
      .sort(function (a, b) {
        if ((a.e < 0) !== (b.e < 0)) return a.e < 0 ? 1 : -1;
        var ba = BASE.indexOf(a.u.name) >= 0 ? 1 : 0;
        var bb = BASE.indexOf(b.u.name) >= 0 ? 1 : 0;
        if (a.e > 0 ? ba !== bb : ba !== bb) return ba - bb;
        return a.i - b.i;
      });
  }

  var BASE_NAMES = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd', 'rad'];

  /* Several dimension sets can be written many ways.  Prefer:
       - few parts
       - no reciprocals of derived units   (C·mol⁻¹ beats A·kat⁻¹)
       - no display-only compounds          (m·F⁻¹ beats Ω·m/s)
     Pure power entries (m², m³) print exactly like m·m, so they are not penalised. */
  function composeScore(parts) {
    return parts.reduce(function (p, c) {
      var sc = Math.abs(c.e);
      if (c.e < 0 && BASE_NAMES.indexOf(c.u.name) < 0) sc += 0.5;
      if (COMPOSE_EXTRA.indexOf(c.u.name) >= 0 && !(c.u.base && c.u.n > 1)) sc += 1;
      return p + sc;
    }, 0);
  }

  function composeUnits(d) {
    var key = d.join(',');
    if (key in COMPOSE_CACHE) return COMPOSE_CACHE[key];
    var out = null;
    for (var budget = 1; budget <= 3 && !out; budget++) {
      var found = [];
      collectCompose(d, budget, [], {}, found, 250);
      var best = null, bestScore = Infinity;
      found.forEach(function (raw) {
        var parts = mergeCompose(raw);
        if (!parts.length) return;
        var sc = composeScore(parts);
        if (sc < bestScore) { bestScore = sc; best = parts; }
      });
      if (best) {
        best.factor = best.reduce(function (p, c) { return p * Math.pow(c.u.f, c.e); }, 1);
        out = best;
      }
    }
    COMPOSE_CACHE[key] = out;
    return out;
  }

  function composedSymbol(parts) {
    return parts.map(function (c) {
      var sym = c.u.base || c.u.sym;
      var e = c.e * c.u.n;
      return sym + (e === 1 ? '' : supString(e));
    }).join('·');
  }

  /* Choose a prefix for a unit that may carry a power (m, m², m³): the prefix
     applies to the linear root, so the mantissa is raised again afterwards. */
  function prefixForPowers(unit, value, power) {
    power = power || 1;
    if (power === 1) return prefixFor(unit, value);
    var neg = value < 0 && power % 2 === 1;
    var lin = Math.pow(Math.abs(value), 1 / power);
    var pr = prefixFor(unit, lin);
    var mant = Math.pow(pr.v, power);
    return { pre: pr.pre, v: neg ? -mant : mant };
  }

  /* main formatter */
  function format(q, opts) {
    opts = opts || {};
    var sig = opts.sig || 8;
    var d = q.d;

    if (dimsZero(d)) {
      return guard({
        text: fmtNum(q.v, sig),
        num: fmtNum(q.v, sig),
        unit: '',
        value: q.v,
        unitName: '1',
        plain: fmtFull(q.v),
        siBase: fmtNum(q.v, sig),
        dimless: true
      });
    }

    var base = fmtNum(q.v, sig) + ' ' + dimSymbol(d);

    function out(num, unitSym, unitName, value) {
      var r = {
        text: num + (unitSym ? ' ' + unitSym : ''),
        num: num,
        unit: unitSym,
        unitName: unitName,
        value: value,
        plain: fmtFull(value),
        siBase: base
      };
      return r;
    }

    /* the unit the user typed wins:  250ms -> 250 ms,  2h 30min -> 2.5 h */
    if (q.h && dimsEq(q.h.d, d) && isFinite(q.v / Math.pow(q.h.f, q.h.n || 1))) {
      var hp = q.h.n || 1;
      var hv = (q.v - q.h.o) / Math.pow(q.h.f, hp);
      var hsym = q.h.sym + (hp === 1 ? '' : supString(hp));
      if (q.h.sp && q.h.bare && !q.h.o) {
        var hv2 = hv, hsym2 = hsym;
        if (hsym2 === 'g' && Math.abs(hv2) >= 1e6) { hv2 /= 1e6; hsym2 = 't'; }
        var pr = prefixForPowers({ sp: true }, hv2, hp);
        if (pr.pre) hsym2 = pr.pre.s + hsym2;
        hv = pr.v; hsym = hsym2;
      }
      return guard(out(fmtNum(hv, sig), hsym, hsym, hv));
    }

    var list = pickUnits(d);

    /* angle: prefer a whole number of degrees */
    if (dimsEq(d, U.dims.RAD)) {
      var degs = q.v * 180 / Math.PI;
      if (Math.abs(degs) < 1e12 && Math.abs(degs - Math.round(degs)) < 1e-9) {
        return out(fmtNum(Math.round(degs), sig), '\u00b0', 'deg', Math.round(degs));
      }
    }

    /* nothing in the table matches these dimensions: build a symbol from named
       units (m³·F⁻¹), and fall back to raw SI base powers if that fails too */
    if (!list.length) {
      var comp = composeUnits(d);
      if (comp) {
        return guard(out(fmtNum(q.v / comp.factor, sig), composedSymbol(comp), null, q.v / comp.factor));
      }
      return guard(out(fmtNum(q.v, sig), dimSymbol(d), null, q.v));
    }

    var unit = list[0];
    if (unit.name === 'g' && Math.abs(q.v / unit.f) >= 1e6) unit = UNITS.t;   /* 1000 kg -> tonnes */
    var pr = prefixForPowers(unit, q.v / unit.f, unit.n || 1);
    return guard(out(fmtNum(pr.v, sig), (pr.pre ? pr.pre.s : '') + unit.sym, unit.name, pr.v));
  }

  /* never let a NaN or undefined reach the screen, whatever went wrong above */
  function guard(res) {
    if (/NaN|undefined|Infinity/.test(res.text)) {
      res.text = res.siBase || res.text;
      res.num = res.text;
    }
    return res;
  }

  /* value of q expressed in the unit(s) named by a string like "km/h" or "N" */
  function convert(q, unitExpr, opts) {
    opts = opts || {};
    var target = evaluate(unitExpr, opts.ctx || {});
    if (!target.q) throw CalcError('no unit given', 0);
    var tq = target.q;
    if (dimsZero(tq.d) && !tq.h) {
      throw CalcError('"' + String(unitExpr).trim() + '" is not a unit', 0,
        'For a ratio, write it explicitly, e.g. 1m to cm gives 100.');
    }
    /* an offset unit needs its zero as well as its scale: 100degC -> degF */
    var sym = String(unitExpr).replace(/\s+/g, '');
    var value = q.v / tq.v;
    if (tq.h) {                                     /* show °C, not "degC" */
      var hp = tq.h.n || 1;
      sym = tq.h.sym + (hp === 1 ? '' : supString(hp));
      value = (q.v - tq.h.o) / Math.pow(tq.h.f, hp);
    }
    /* 32degF -> degC is exactly 0, but 1 fm -> m is 1e-15 and must survive */
    if (tq.o && Math.abs(value) < 1e-9 * Math.abs(q.v)) value = 0;
    return {
      value: value,
      text: fmtNum(value, opts.sig || 10) + ' ' + sym,
      dimSymbol: dimSymbol(tq.d),
      q: new Q(value, ONE.slice(), 0, null)
    };
  }

  /* ============================ help data ============================ */

  var HELP = {
    funcs: Object.keys(FUNCS).sort().map(function (k) { return { name: k, doc: FUNCS[k].doc }; }),
    prefixes: (function () {
      var seen = {}, out = [];
      Object.keys(PREFIXES).filter(function (k) { return !PREFIXES[k].bin; })
        .sort(function (a, b) { return PREFIXES[b].f - PREFIXES[a].f; })
        .forEach(function (k) {
          if (seen[PREFIXES[k].s]) return;      /* u / µ / μ are one prefix */
          seen[PREFIXES[k].s] = true;
          out.push({ name: PREFIXES[k].s, factor: PREFIXES[k].f });
        });
      return out;
    })(),
    binaryPrefixes: Object.keys(PREFIXES).filter(function (k) { return PREFIXES[k].bin; })
      .map(function (k) { return { name: PREFIXES[k].s, factor: PREFIXES[k].f }; }),
    units: (function () {
      var groups = {};
      U.ORDER.forEach(function (u) {
        if (u.name === '1' || u.name === 'deg') { /* still shown */ }
        (groups[u.g] = groups[u.g] || []).push({
          name: u.name, sym: u.sym, prefixable: u.p, si: u.si, dim: dimSymbol(u.d)
        });
      });
      return groups;
    })(),
    constants: CONSTANTS.map(function (c) {
      return { name: c.name, desc: c.desc, value: c.v, dim: dimSymbol(c.d) };
    })
  };

  var EXAMPLES = [
    '10um*10um/8.8e-12F/m',
    '2h 30min',
    '9.81m/s^2 * 1.5s^2',
    '3.5cm + 4mm',
    '5kWh / 230V',
    '1.6e-19C * 5e4',
    'sin(30deg)',
    'atan2(3,4)',
    'sqrt(4m^2 * 9s^2)',
    '-40degC to degF',
    '1.25L / 250mL',
    '72km/h to m/s',
    '6.022e23 * 1.6e-19',
    '850 * 15pct',
    '1e6 kWh',
    'w = 3.4mm',
    'area = 2m * 3m',
    'area + 1m^2'
  ];

  root.SI = {
    Q: Q,
    evaluate: evaluate,
    format: format,
    convert: convert,
    resolve: resolve,
    dimSymbol: dimSymbol,
    fmtNum: fmtNum,
    fmtFull: fmtFull,
    HELP: HELP,
    EXAMPLES: EXAMPLES,
    FUNCS: FUNCS,
    CalcError: CalcError,
    clearCache: function () { clearUnitCache(); PICK_CACHE = {}; COMPOSE_CACHE = {}; },
    /* introspection helpers (used by the test suite) */
    tokens: tokenize,
    compose: function (d) { return composeUnits(d); },
    pick: function (d) { return pickUnits(d).map(function (u) { return u.name; }); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.SI;
})(typeof globalThis !== 'undefined' ? globalThis : this);
