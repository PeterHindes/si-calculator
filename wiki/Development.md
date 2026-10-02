# Development

## Running it

Open `index.html` in a browser. There is no build step, no package manager and
no network access — the page works from `file://`, and so does the live copy at
https://peterhindes.github.io/si-calculator/

## Running the tests

```
node tests/run-tests.js
```

225 assertions, no dependencies, finishes in well under a second. The engine
files have no DOM dependency, which is what makes this possible:

```
node -e "require('./units.js');require('./engine.js');
         console.log(globalThis.SI.format(globalThis.SI.evaluate('10um*10um/(8.8e-12F/m)').q).text)"
```

CI runs the same command, plus a `node --check` syntax pass, on Node 20, 22 and
24 for every push and pull request. Note the version spread: it is the cheapest
way to catch an accidental use of a newer built-in.

## Test style

One line per behaviour, with the expected string written out in full:

```js
t('mixed radix of matching units', '2h 30min', '2.5 h');
tErr('mismatched dimensions', '1m + 1s', 'cannot add');
eq_('10um*10um/8.8e-12F/m', '10 µm · 10 µm ÷ (8.8e-12 F) ÷ m');
```

Expectations are the *formatted* result, not a tolerance, because the formatting
is part of the product. When a behaviour is deliberately surprising, the test
name says so — `t('compact subtraction', '10m-2m', '8 m')` exists because that
case was a real bug once.

## The constants picker

`app.js` holds a `CONST_GROUPS` list (what the chips show) and a `CONST_KEYS`
map (what a letter inserts). Both are checked against `SI.HELP.constants`
before anything is inserted, so a constant that is renamed or removed makes the
control vanish instead of producing an error.

The Alt/Option shortcut uses letters that browsers and editors already claim
for `Ctrl` — deliberately `a c e v x z` are avoided, because hijacking copy,
paste or view-source would be worse than a missing shortcut.

## Invariants

Things a change should not break. Each has a test:

1. **`1m + 1s` is an error.** Dimension checking is the product.
2. **`1/2m` is `0.5 m⁻¹`.** Juxtaposition binds tighter than `/` so that
   `100km/2h` and `E/mc^2` work.
3. **Mixed radix only between matching dimensions.** `2h 30min` adds,
   `1h 2m` multiplies.
4. **`h` is the hour.** Planck's constant is `planck`.
5. **Nothing renders as `NaN`, `undefined` or `Infinity`.**
6. **No dependencies, no build step.**
7. **Evaluation order must not change results.** No cache may make a symbol
   resolve differently depending on what was evaluated before.

## Things that have bitten

* A prefix applied linearly to a squared quantity turns `1km2` into `1 Mm²`.
  Prefix on the root.
* Appending an exponent to a symbol that already contains one produces a wrong
  *reading*, not just a typo: `m/s` with exponent −1 is `m/s⁻¹`, which looks like
  a speed but means `s·m⁻¹`. Such units are excluded from composed symbols.
* Rounding an exponent before comparing overflows: `1e308` became `Infinity`.
* A parser that stores token positions will happily use the value of the wrong
  token — `10m-2m` once evaluated to a `NaN` exponent because the `-` operator
  was read instead of the number after it.

## Checking the UI

The page is plain scripts, so a quick DOM harness is enough for most work:

```js
// in a browser console, or via headless chromium from a copy of the page
const ta = document.getElementById('input');
ta.value = '10um*10um/(8.8e-12F/m)';
ta.dispatchEvent(new Event('input', { bubbles: true }));
document.getElementById('res-primary').textContent;  // → "11.363636 m³·F⁻¹"
document.getElementById('res-eq').textContent;       // → the equation line
```

`app.js` wraps every engine call and every `localStorage` access in
`try`/`catch`, so a thrown error degrades to a message rather than a blank
page — keep it that way when editing.

## Contributing

Small, focused pull requests. If a change alters how an expression is read,
update `Syntax.md` and `INTENT.md` in the same commit — those two files are how
the next person finds out *why*.
