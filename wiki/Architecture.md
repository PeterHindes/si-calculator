# Architecture

Two DOM-free files do all the thinking; the browser layer only presents them.
That split is why the engine could be tested under Node while the UI was still
being written, and why `engine.js` can be reused outside a page.

| File | Role |
|---|---|
| `units.js` | the unit database, SI prefixes, physical constants. Exposes `SI_UNITS` |
| `engine.js` | tokenizer, parser, unit algebra, formatter, equation renderer. Exposes `SI` |
| `app.js` | the page: live evaluation, history, variables, help sheet |
| `index.html`, `styles.css` | structure and theme |
| `tests/run-tests.js` | 225 assertions, no dependencies, `node tests/run-tests.js` |

## The quantity

Everything is a `Quantity`:

```js
{ v,   // value in SI base units of its dimensions
  d,   // dimension exponents: [kg, m, s, A, K, mol, cd, rad]
  o,   // non-zero only for offset units (°C, °F)
  h }  // how the user wrote it: { sym, f, o, d, sp, bare, n }
```

`v` is always canonical, so `20degC` stores `v = 293.15` with `o = 273.15`.
Operations add dimensions rather than cancelling them:

```
1kW * 1h     →  kg·m²·s⁻³ × s  =  kg·m²·s⁻²  =  3.6 MJ
1m + 1s      →  m and s differ  →  error
```

The eighth dimension, `rad`, is what lets `sin(30deg)` work without special
cases while still treating a length as an error.

## The hint

`h` records the unit as typed, which is why results read naturally:
`2h 30min` → `2.5 h`, `250ms` → `250 ms`, `5cm^2` → `5 cm²`. When there is no
hint, a prefix is chosen so the mantissa lands in `[1, 1000)` — on the *n-th
root* for squared units, so `1km2` is `1 km²` and never `1 Mm²`.

## Pipeline

```
source ──tokenize──▶ tokens ──Parser──▶ syntax tree ──evalNode──▶ Quantity
                                   │                              │
                                   └── render (on every node) ◀──┘
```

Rendering happens *during* evaluation, not after: every node stores its value
and its rendered text, so the equation line reflects what actually happened —
including whether `2h 30min` was a sum and `1h 2m` a product.

Parser layers, loosest first: `expr` (`+ −`) → `term` (`* ÷`) → `factor`
(negation) → `tight` (juxtaposition) → `power` (`^`) → `suffixes` (`m2`, `5!`) →
`primary`. Juxtaposition sits below `*` and `÷` on purpose; see [[Syntax]].

## Formatting

`SI.format(q, { sig })` returns the display text plus its parts:

```js
{ text, num, unit, unitName, value, plain, siBase, dimless }
```

1. A **dimensionless** result prints as a bare number.
2. Otherwise the user's **hint** wins, if it has one.
3. Then **prefix selection** on the best table entry for those dimensions
   (`g` is preferred for mass, so 1.5 kg becomes 1.5 t, never 1.5 Mg).
4. If no single unit has those dimensions, **compose** one from up to three
   named units (`m³·F⁻¹`, `C·mol⁻¹`), scored so that reciprocals of derived
   units and display-only compounds lose to plain SI.
5. If that fails, print raw SI base powers (`kg·m⁵·s⁻⁴·A⁻²`).

`siBase` is always available, which is what the secondary line shows.

## Caches

Three module-level caches: unit resolution, display-unit choice, and composed
symbols. The last two are pure functions of the dimension vector. The first is
only consulted at recursion depth 0 — resolution is depth-sensitive, so caching
a deep result would make a symbol resolve differently depending on what had been
evaluated before. `SI.clearCache()` empties all three.

## Errors

`CalcError` carries a message, a character offset and often a hint, so the page
can draw a caret under the offending character:

```
cannot add m and s
  Both sides must be the same kind of quantity. If you meant a negative
  exponent like m⁻¹, write it as m^-1 or with superscripts.
```

Three rules hold everywhere: nothing prints `NaN`, `undefined` or `Infinity`;
number literals are range-checked; the parser has a depth limit that produces a
user-facing error rather than a stack overflow.

## Adding to it

* **A unit** — one `U(...)` entry in `units.js`. Give it a factor to SI base, a
  dimension vector, a display symbol, and set `sp: true` only if a prefix
  belongs on it when displaying. `tests/run-tests.js` asserts every entry
  resolves to itself.
* **A function** — one entry in `FUNCS` taking `(args, pos)`, plus a row in
  `HELP`. Dimension checks are worth doing explicitly: `ln` refuses units,
  `sqrt` halves even powers.
* **A prefix** — one `PREFIXES` entry. `u`/`µ`/`μ` are three spellings of one
  entry; add to `DISPLAY_PREFIXES` in `engine.js` if it should ever be chosen
  automatically.
