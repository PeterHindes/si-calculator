/* app.js — browser UI for the SI calculator engine.
   Loaded after units.js and engine.js (which expose globalThis.SI).
   Classic script: no modules, no build step, works from file:// */

(function () {
  'use strict';

  var SI = globalThis.SI;
  if (!SI) {
    document.body.textContent = 'engine.js did not load — check that it sits next to index.html';
    return;
  }

  /* ----------------------------------------------------------------- dom */

  function $(id) { return document.getElementById(id); }

  var ta = $('input');
  var caretBox = $('caret');
  var caretScroll = caretBox.parentNode;
  var errMsg = $('err-msg');
  var errHint = $('err-hint');
  var resPrimary = $('res-primary');
  var resBase = $('res-base');
  var resNote = $('res-note');
  var copyBtn = $('copy');
  var exBox = $('examples');
  var sigSel = $('sig');
  var varName = $('var-name');
  var varExpr = $('var-expr');
  var varAdd = $('var-add');
  var varMsgBox = $('var-msg');
  var varList = $('varlist');
  var histBox = $('history');
  var clearHist = $('clear-history');
  var help = $('help');
  var helpToggle = $('help-toggle');
  var helpClose = $('help-close');
  var helpBody = $('help-body');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function setText(node, s) { node.textContent = s || ''; node.hidden = !s; }

  /* ------------------------------------------------------------- storage */

  var KEY = 'si-calc.v1';
  var SIGS = [2, 4, 6, 8, 12];
  var store = readStore();
  var sig = SIGS.indexOf(+store.sig) >= 0 ? +store.sig : 8;
  var varSrc = (store.vars && typeof store.vars === 'object') ? store.vars : {};   /* name -> src */
  var hist = (Array.isArray(store.history) ? store.history : [])
    .filter(function (h) { return h && typeof h.src === 'string'; })
    .slice(0, 100);

  function readStore() {
    try {
      var raw = globalThis.localStorage && globalThis.localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function save() {
    try {
      globalThis.localStorage.setItem(KEY, JSON.stringify({ sig: sig, vars: varSrc, history: hist }));
    } catch (e) { /* file:// with storage disabled, or quota — just forget it */ }
  }

  /* --------------------------------------------------------------- state */

  var varQs = Object.create(null);   /* name -> Quantity (re-evaluated on load) */
  var ansQ = null;                   /* last successful result */
  var histIdx = -1;                  /* -1 = live, 0 = newest entry */
  var debounce = 0;

  function buildCtx() {
    var v = Object.assign(Object.create(null), varQs);
    if (ansQ) v.ans = ansQ;
    return { vars: v, sig: sig };   /* sig lets "x to y" honour the digits select */
  }

  /* ------------------------------------------------------------ engine io */

  var TYPING = /unexpected end of input|missing "\)"|no unit after "to"|incomplete/i;

  function fmt(q) {
    try { return SI.format(q, { sig: sig }); } catch (e) { return null; }
  }
  function clean(t, fallback) {
    if (typeof t !== 'string' || !t) return fallback || '—';
    return /NaN|undefined/.test(t) ? (fallback || '—') : t;
  }
  function textOf(q) {
    var f = fmt(q);
    return f ? clean(f.text) : '—';
  }
  function shownText(r) {              /* side-effect free: a finished result */
    if (r.conversion) return conversionText(r.conversion);
    return textOf(r.q);
  }
  /* SI.evaluate() formats a "… to …" conversion at its own default precision, so
     re-print the number at the selected sig and keep the unit it was given. */
  function conversionText(conv) {
    var unit = String(conv.text).replace(/^\S*\s*/, '');
    var n;
    try { n = SI.fmtNum(conv.q.v, sig); } catch (e) { n = ''; }
    if (!n || /NaN|undefined/.test(n)) return clean(conv.text);
    return unit ? n + ' ' + unit : n;
  }

  /* "still typing" rather than broken: trailing operator, unclosed bracket … */
  function compute(src) {
    if (!src || !src.replace(/\s/g, '')) return { kind: 'empty' };
    if (!ansQ && /\bans\b/.test(src)) {
      return { kind: 'error', err: {
        calc: true, pos: src.search(/\bans\b/),
        message: 'ans is not set yet',
        hint: 'ans always holds the previous result — evaluate something first.'
      } };
    }
    var r;
    try {
      r = SI.evaluate(src, buildCtx());
    } catch (e) {
      if (!e || !e.calc) {
        return { kind: 'error', err: { calc: true, pos: 0, message: 'could not evaluate that', hint: null } };
      }
      return { kind: TYPING.test(String(e.message)) ? 'typing' : 'error', err: e };
    }
    if (r.empty || !r.q) return { kind: 'empty' };
    return { kind: 'ok', r: r, q: r.q };
  }

  function applyResult(res) {
    if (res.kind !== 'ok') return;
    ansQ = res.q;
    var a = res.r.assignment;
    if (a) {
      varSrc[a.name] = a.src;
      varQs[a.name] = a.value;
      save();
      renderVars();
    }
  }

  /* -------------------------------------------------------------- render */

  function autoGrow() {
    ta.style.height = 'auto';
    ta.style.height = Math.max(0, ta.scrollHeight) + 'px';
    caretScroll.scrollLeft = ta.scrollLeft;
  }

  function render() {
    var res = compute(ta.value);
    applyResult(res);

    var primary = '', base = '', note = '';
    if (res.kind === 'ok') {
      primary = shownText(res.r);
      var f = fmt(res.q);
      if (res.r.conversion) {
        base = (f && f.siBase) || (res.r.conversion.dimSymbol !== '1' ? res.r.conversion.dimSymbol : '');
      } else if (f && f.siBase) {
        base = f.siBase;
      }
      if (base === primary) base = '';
      if (res.r.assignment) {
        note = 'stored ' + res.r.assignment.name + ' = ' + textOf(res.r.assignment.value);
      }
    } else if (res.kind === 'typing') {
      primary = '';
    }

    setText(resPrimary, primary);
    setText(resBase, base);
    setText(resNote, note);
    copyBtn.hidden = !primary;

    if (res.kind === 'error') {
      var e = res.err;
      setText(errMsg, (e && e.message) || 'error');
      setText(errHint, e && e.hint ? e.hint : '');
      var pos = e && typeof e.pos === 'number' ? e.pos : -1;
      if (pos >= 0) {
        caretBox.textContent = new Array(Math.min(pos, 400) + 1).join(' ') + '^';
        caretBox.hidden = false;
        caretScroll.hidden = false;
        caretScroll.scrollLeft = ta.scrollLeft;
      } else {
        caretBox.textContent = '';
        caretBox.hidden = true;
        caretScroll.hidden = true;
      }
    } else {
      setText(errMsg, '');
      setText(errHint, '');
      caretBox.textContent = '';
      caretBox.hidden = true;
      caretScroll.hidden = true;
    }
    autoGrow();
  }

  function renderSoon() {
    clearTimeout(debounce);
    debounce = setTimeout(render, 80);
  }
  function renderNow() { clearTimeout(debounce); render(); }

  /* ------------------------------------------------------------- history */

  function commit() {
    var src = ta.value.trim();
    if (!src) return;
    var res = compute(src);
    applyResult(res);
    var text, ok;
    if (res.kind === 'ok') { text = shownText(res.r); ok = true; }
    else if (res.kind === 'empty') return;
    else if (res.kind === 'typing') { text = '…'; ok = false; }
    else { text = '⚠ ' + ((res.err && res.err.message) || 'error'); ok = false; }

    if (hist.length && hist[0].src === src) { hist[0].text = text; hist[0].ok = ok; }
    else hist.unshift({ src: src, text: text, ok: ok });
    if (hist.length > 100) hist.length = 100;
    histIdx = -1;
    save();
    renderHist();
    renderNow();
  }

  function renderHist() {
    histBox.textContent = '';
    if (!hist.length) {
      histBox.appendChild(el('li', 'empty', 'nothing yet — press Enter on an expression'));
      return;
    }
    hist.forEach(function (h, i) {
      var li = el('li');
      var main = el('button', 'hmain');
      main.type = 'button';
      main.title = 'put this back in the input';
      main.appendChild(el('span', 'h-src', h.src));
      main.appendChild(el('span', 'h-res' + (h.ok === false ? ' bad' : ''), h.text || '…'));
      main.addEventListener('click', function () { useHist(i); });
      var del = el('button', 'hx', '×');
      del.type = 'button';
      del.title = 'delete this entry';
      del.setAttribute('aria-label', 'delete ' + h.src);
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        hist.splice(i, 1);
        if (histIdx >= hist.length) histIdx = -1;
        save();
        renderHist();
      });
      li.appendChild(main);
      li.appendChild(del);
      histBox.appendChild(li);
    });
  }

  function useHist(i) {
    if (i < 0 || i >= hist.length) return;
    histIdx = i;
    ta.value = hist[i].src;
    ta.setSelectionRange(ta.value.length, ta.value.length);
    renderNow();
    ta.focus();
  }

  /* shell-style recall: Up goes back in time, Down comes forward */
  function recall(dir) {
    if (!hist.length) return;
    var i = histIdx < 0 ? (dir < 0 ? 0 : -1)
                        : Math.min(hist.length - 1, Math.max(-1, histIdx - dir));
    histIdx = i;
    ta.value = i < 0 ? '' : hist[i].src;
    var p = ta.value.length;
    ta.setSelectionRange(p, p);
    renderNow();
  }

  /* ------------------------------------------------------------ variables */

  function varMsg(text, kind) {
    setText(varMsgBox, text);
    varMsgBox.className = 'var-msg' + (kind ? ' ' + kind : '');
  }

  function renderVars() {
    varList.textContent = '';
    var names = Object.keys(varSrc);
    if (!names.length) {
      varList.appendChild(el('span', 'chip', 'no variables yet'));
      return;
    }
    names.forEach(function (n) {
      var q = varQs[n];
      var wrap = el('span', 'chipwrap');
      var main = el('button', 'chipmain');
      main.type = 'button';
      main.title = 'insert ' + n + ' into the input';
      main.appendChild(el('span', 'v-name', n));
      main.appendChild(el('span', 'v-eq', '='));
      main.appendChild(el('span', 'v-src', varSrc[n]));
      main.appendChild(el('span', 'v-val' + (q ? '' : ' bad'), q ? textOf(q) : 'unavailable'));
      main.addEventListener('click', function () { insert(n); });
      var del = el('button', 'chip-x', '×');
      del.type = 'button';
      del.setAttribute('aria-label', 'delete variable ' + n);
      del.addEventListener('click', function () {
        delete varSrc[n];
        delete varQs[n];
        save();
        renderVars();
        varMsg('');
      });
      wrap.appendChild(main);
      wrap.appendChild(del);
      varList.appendChild(wrap);
    });
  }

  function addVar() {
    var name = String(varName.value || '').trim();
    var src = String(varExpr.value || '').trim();
    if (!/^[A-Za-z_][A-Za-z_]*$/.test(name)) {
      return varMsg('A name is letters and _ only — a digit would be read as a power, so “q2” would mean q².');
    }
    if (name === 'ans') return varMsg('“ans” is reserved for the previous result.');
    if (SI.resolve(name)) return varMsg('“' + name + '” is already a unit or constant — pick another name.');

    var q;
    try {
      var r = SI.evaluate(src, buildCtx());
      if (r.empty || !r.q) throw new Error('that expression is empty');
      q = r.q;
    } catch (e) {
      return varMsg(e && e.message ? e.message : 'that expression did not evaluate');
    }
    varSrc[name] = src;
    varQs[name] = q;
    save();
    renderVars();
    varName.value = '';
    varExpr.value = '';
    varMsg('stored ' + name + ' = ' + textOf(q), 'ok');
  }

  /* Re-evaluate stored variables; a few passes so a -> b -> c chains settle.
     Anything that still fails is skipped and reported. */
  function loadVars() {
    var pending = Object.keys(varSrc);
    var broken = Object.create(null);        /* name -> why it failed */
    for (var pass = 0; pass < 4 && pending.length; pass++) {
      var next = [];
      pending.forEach(function (n) {
        try {
          var r = SI.evaluate(varSrc[n], buildCtx());
          if (r.empty || !r.q) throw new Error('that expression is empty');
          varQs[n] = r.q;
          delete broken[n];                  /* a later pass may have fixed it */
        } catch (e) {
          next.push(n);
          broken[n] = (e && e.message) || 'failed';
        }
      });
      pending = next;
    }
    var names = Object.keys(broken);
    if (names.length) {
      varMsg('skipped ' + names.length + ' stored variable(s): ' + names.map(function (n) {
        return n + ' (' + broken[n] + ')';
      }).join(', '), 'warn');
    }
  }

  /* --------------------------------------------------------- input edits */

  function insert(text, back) {
    var s = ta.selectionStart, e = ta.selectionEnd;
    if (typeof s !== 'number') { s = e = ta.value.length; }
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    var p = s + text.length - (back || 0);
    p = Math.max(s, Math.min(ta.value.length, p));
    ta.setSelectionRange(p, p);
    ta.focus();
    histIdx = -1;
    renderNow();
  }

  /* -------------------------------------------------------------- examples */

  function renderExamples() {
    exBox.textContent = '';
    (SI.EXAMPLES || []).forEach(function (src) {
      var b = el('button', 'chip', src);
      b.type = 'button';
      b.title = 'load this example';
      b.addEventListener('click', function () {
        ta.value = src;
        ta.setSelectionRange(src.length, src.length);
        histIdx = -1;
        renderNow();
        ta.focus();
      });
      exBox.appendChild(b);
    });
  }

  /* ------------------------------------------------------------ help sheet */

  /* Every "result" below is computed live from the engine, so it cannot drift. */
  var SYNTAX = [
    ['10m', 'implicit multiplication: a number in front of a unit'],
    ['9.81m/s^2', 'juxtaposition binds tighter than × and ÷'],
    ['100km/2h', 'that is 50 km/h — the factor after / belongs to the divisor'],
    ['1/2m', 'this is 0.5 m⁻¹, not half a metre'],
    ['(1/2)m', 'brackets first; 0.5m is the other way to say half a metre'],
    ['1 m2', 'a digit glued to a unit is a power — m2, m3'],
    ['1h 2m', 'one hour two minutes: the space stops “2m” reading as a power'],
    ['2h 30min', 'mixed radix — same-dimension groups are added'],
    ['1 m⁻¹', 'superscript powers type straight in; m^-1 works too'],
    ['1m^-2', 'caret powers need no space either way'],
    ['1 m-2', 'a sign glued to the digits is a shorthand power too'],
    ['72km/h to m/s', 'convert; “72km/h -> m/s” is the same'],
    ['-40degC to degF', 'offset units convert their scale as well'],
    ['w = 3.4mm', 'assign — then w, or w*2, works anywhere'],
    ['850 * 15pct', '% is just a 1/100 factor'],
    ['5!', 'factorial (fact(5) is the same)'],
    ['2^3^2', '^ is right-associative'],
    ['sqrt(4m^2 * 9s^2)', 'sqrt halves even unit powers'],
    ['atan2(3,4)', 'functions that return an angle'],
    ['3 m 4 m', 'unrelated quantities juxtapose as a product'],
    ['1 + 2m', 'adding unlike dimensions is an error, with a hint']
  ];

  function outOf(src) {
    try {
      var r = SI.evaluate(src, buildCtx());
      if (r.empty || !r.q) return '…';
      if (r.assignment) return textOf(r.assignment.value);
      return shownText(r);
    } catch (e) {
      return '⚠ ' + ((e && e.message) || 'error');
    }
  }

  function hsec(title) {
    var s = el('section', 'hsec');
    s.appendChild(el('h3', null, title));
    return s;
  }
  function hrow(click, name, text, title) {
    var b = el('button', 'hrow');
    b.type = 'button';
    b.appendChild(el('span', 'hname', name));
    if (text) b.appendChild(el('span', 'htext', text));
    if (title) b.title = title;
    b.addEventListener('click', click);
    return b;
  }

  function buildHelp() {
    helpBody.textContent = '';

    var syn = hsec('syntax');
    var list = el('div', 'syntax');
    SYNTAX.forEach(function (row) {
      var r = el('div', 'srow');
      var code = el('code', null, row[0]);
      r.appendChild(code);
      r.appendChild(el('span', 'swhat', row[1]));
      r.appendChild(el('span', 'sout', outOf(row[0])));
      list.appendChild(r);
    });
    syn.appendChild(list);
    helpBody.appendChild(syn);

    var us = hsec('units');
    us.appendChild(el('p', 'note', 'click any unit to drop it into the input at the caret'));
    var H = SI.HELP;
    Object.keys(H.units).forEach(function (g) {
      us.appendChild(el('h3', null, g));
      var grid = el('div', 'hgrid');
      H.units[g].forEach(function (u) {
        var sym = u.sym || u.name;
        var bits = [];
        if (u.name && u.name !== sym) bits.push(u.name);
        if (u.dim && u.dim !== '1') bits.push(u.dim);
        if (!u.prefixable) bits.push('no prefix');
        else if (!u.si) bits.push('accepted');
        grid.appendChild(hrow(function () { insert(u.name); }, sym, bits.join('  ·  '),
          'insert ' + u.name + ' into the input'));
      });
      us.appendChild(grid);
    });
    helpBody.appendChild(us);

    var fs = hsec('functions');
    var fgrid = el('div', 'hgrid');
    H.funcs.forEach(function (f) {
      fgrid.appendChild(hrow(function () { insert(f.name + '(', 1); }, f.name + '()', f.doc,
        'insert ' + f.name + '() into the input'));
    });
    fs.appendChild(fgrid);
    helpBody.appendChild(fs);

    var cs = hsec('constants');
    var cgrid = el('div', 'hgrid');
    H.constants.forEach(function (c) {
      var v = '';
      try { v = SI.fmtNum(c.value, 6); } catch (e) { v = ''; }
      var dim = (c.dim && c.dim !== '1') ? '  ·  ' + c.dim : '';
      cgrid.appendChild(hrow(function () { insert(c.name); }, c.name, (c.desc || '') + '  =  ' + v + dim,
        'insert ' + c.name + ' into the input'));
    });
    cs.appendChild(cgrid);
    helpBody.appendChild(cs);

    var ps = hsec('prefixes');
    ps.appendChild(el('p', 'note', 'a prefix glued in front of a unit: km, mg, µF, MΩ — click to insert'));
    var seen = {}, pgrid = el('div', 'hgrid');
    H.prefixes.concat(H.binaryPrefixes || []).forEach(function (p) {
      if (seen[p.name]) return;
      seen[p.name] = 1;
      var f = '';
      try { f = SI.fmtNum(p.factor, 6); } catch (e) { f = ''; }
      pgrid.appendChild(hrow(function () { insert(p.name); }, p.name, f, 'insert the prefix ' + p.name));
    });
    ps.appendChild(pgrid);
    helpBody.appendChild(ps);
  }

  function helpOpen() { return !help.hidden; }
  function openHelp(v) {
    help.hidden = !v;
    helpToggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) buildHelp();
  }

  /* ----------------------------------------------------------------- copy */

  function copy() {
    var text = resPrimary.textContent || '';
    if (!text) return;
    var fallback = function () {
      var tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.setAttribute('readonly', '');
      tmp.style.position = 'fixed';
      tmp.style.top = '-1000px';
      document.body.appendChild(tmp);
      tmp.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(tmp);
      return ok;
    };
    var done = function (ok) {
      copyBtn.textContent = ok ? 'copied' : 'copy failed';
      setTimeout(function () { copyBtn.textContent = 'copy'; }, 1400);
    };
    try {
      if (globalThis.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); },
          function () { done(fallback()); });
        return;
      }
    } catch (e) { /* fall through to the old API */ }
    done(fallback());
  }

  /* ----------------------------------------------------------------- init */

  function wire() {
    ta.addEventListener('input', function () { histIdx = -1; autoGrow(); renderSoon(); });
    ta.addEventListener('scroll', function () { caretScroll.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (e.shiftKey) {                       // newline inside the expression
          var s = ta.selectionStart, t = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + '\n' + ta.value.slice(t);
          ta.setSelectionRange(s + 1, s + 1);
          histIdx = -1;
          autoGrow();
          renderSoon();
        } else {                                // Enter and Ctrl/Cmd+Enter commit
          commit();
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' && ta.selectionStart === 0 && ta.selectionEnd === 0) {
        recall(-1); e.preventDefault(); return;
      }
      if (e.key === 'ArrowDown' && ta.selectionStart === ta.value.length &&
          ta.selectionEnd === ta.value.length) {
        recall(1); e.preventDefault();
      }
    });

    copyBtn.addEventListener('click', copy);
    clearHist.addEventListener('click', function () {
      hist = [];
      histIdx = -1;
      save();
      renderHist();
    });

    varAdd.addEventListener('click', addVar);
    varName.addEventListener('keydown', function (e) { if (e.key === 'Enter') { addVar(); e.preventDefault(); } });
    varExpr.addEventListener('keydown', function (e) { if (e.key === 'Enter') { addVar(); e.preventDefault(); } });

    sigSel.addEventListener('change', function () {
      var n = parseInt(sigSel.value, 10);
      sig = SIGS.indexOf(n) >= 0 ? n : 8;
      save();
      renderNow();
      renderVars();
    });

    helpToggle.addEventListener('click', function () { openHelp(!helpOpen()); });
    helpClose.addEventListener('click', function () { openHelp(false); ta.focus(); });
    help.addEventListener('click', function (e) { if (e.target === help) { openHelp(false); ta.focus(); } });

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var typing = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT');
      if (e.key === '?' && !typing) { openHelp(!helpOpen()); e.preventDefault(); return; }
      if (e.key === 'Escape') {
        if (helpOpen()) { openHelp(false); e.preventDefault(); return; }
        ta.value = '';
        histIdx = -1;
        renderNow();
        ta.focus();
      }
    });
  }

  function init() {
    sigSel.value = String(sig);
    renderExamples();
    loadVars();
    renderVars();
    renderHist();
    wire();
    autoGrow();
    ta.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
