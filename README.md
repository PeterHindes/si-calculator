# SI Unit Calculator

[![tests](https://github.com/PeterHindes/si-calculator/actions/workflows/tests.yml/badge.svg)](https://github.com/PeterHindes/si-calculator/actions/workflows/tests.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Live at **https://peterhindes.github.io/si-calculator/**

A free-form calculator for science problems: type an expression with SI units and
multiples, get a result with units.

```
10um*10um/(8.8e-12F/m)     →  11.363636 m³·F⁻¹
2h 30min                   →  2.5 h
9.81m/s^2 * 1.5s^2         →  14.715 m
5kWh / 230V                →  78.26087 kC
100km / 2h                 →  13.888889 m/s
-40degC to degF            →  -40 °F
sin(30deg)                 →  0.5
```

## Running it

Open `index.html` in a browser. There is no build step, no server and no
dependency — the page runs straight from disk.

To run the engine tests (225 assertions, no dependencies):

```
node tests/run-tests.js
```

## How to write an expression

| You can write | Means |
|---|---|
| `10um`, `5nm`, `2.5kW`, `8.8e-12F` | numbers with SI prefixes (`u`/`µ`/`μ`, `n`, `k`, `M`, `G`, `p`, …) |
| `10 m`, `9.81m/s^2` | implicit multiplication — no `*` needed |
| `m2`, `s-2`, `m^2`, `m⁻¹` | exponents, with or without spaces/carets/superscripts |
| `2h 30min`, `1d 12h` | mixed radix: `2 h 30 min` is **added**, not multiplied |
| `1/2m` | `0.5 m⁻¹` — juxtaposition binds tighter than `/` (see below) |
| `100km/2h` | `50 km/h` — units after a slash belong to the divisor |
| `(3m)^2` | the brackets make the product the base: `9 m²` |
| `x to km`, `x -> degF` | convert the result: `72km/h to m/s` → `20 m/s` |
| `w = 3.4mm` | store a named value; `w` is then usable anywhere |
| `50%`, `5!` | percent, factorial |
| `sin(30deg)`, `sqrt(4m^2)` | functions (always with brackets) |

### The two precedence rules worth knowing

1. **Juxtaposition binds tighter than `*` and `/`.** The units that follow a
   slash belong to the divisor, which is what physics formulas mean:
   `E/mc^2` is `E/(m·c²)`, `100km/2h` is `50 km/h`.
   The price is that `1/2m` means `1/(2·m) = 0.5 m⁻¹`. Write `(1/2)m`,
   `0.5m` or `1/2*m` for half a metre.
2. **`^` attaches to the unit right before it**, never to a product:
   `10m^2` is `10 m²`, not `(10 m)²`.

### Mixed radix, and digits that could be exponents

`2h 30min` and `2h30min` both mean two hours thirty minutes. The rule is:

- a digit run that ends the expression is an exponent — `m2` is m², `s-2` is s⁻²;
- a digit run followed by another unit is the next mixed-radix digit, so
  `2h30min` is 2 h + 30 min rather than `2·h³⁰·min`.

The trade-off is that radix only applies between units of the same kind: `2h 30min`
adds to 2.5 h, but `1h 2m` is a product (7200 m·s), and `2m3m` is 2 m + 3 m.
Write `*` when you mean multiply.

### Temperature

`degC` and `degF` are offset units: adding two Celsius readings works the way a
spreadsheet does it (`20degC + 5degC` = `25 °C`), while mixing with an absolute
unit stays absolute (`20degC + 10K` = `30 °C`). Multiplying two offset units is
rejected, because it has no physical meaning.

## Units

All SI base and derived units with prefixes, plus the everyday extras:

- **Length** m, Å, in, ft, yd, mi, nmi, thou, au, ly, pc, b (barn)
- **Mass** g, kg, t, u (amu), lb, oz, st, gr, slug, carat
- **Time** s, min, h, d, wk, yr, month, rpm
- **Temperature** K, °C, °F, °R
- **Electric / magnetism** A, C, F, V, ohm (Ω), S, Wb, T, H, Hz, Ah, Wh, kWh, Cps
- **Mechanics / heat** N, Pa, J, W, dyn, lbf, kgf, bar, atm, psi, Torr, mmHg, cal, Cal, btu, erg, eV
- **Light** cd, lm, lx
- **Other** mol, kat, Gy, Sv, Bq, L, gal, qt, pt, fl oz, acre, ha, are, mph, knot, km/h, %
- **Data** B, bit, KB, KiB…; **Angle** deg (°), rad, grad, arcmin (`'`), arcsec (`"`), rev
- Chemical and physics constants: c, planck, hbar, k, NA, q, R, G, g0, atm,
  epsilon0, mu0, sigma, a0, me, mp, mn, Ry, FF, p0, pi, e, tau.
  Note that plain `h` is the **hour** (as in SI), so Planck's constant is `planck`.

Results are shown with a sensible SI prefix (`10um` → `10 µm`, `1e-5 m` →
`10 µm`, `0.5 Hz` → `0.5 Hz`) and, when the unit combination has no standard
name, with a composed symbol built from named units (`11.363636 m³·F⁻¹`)
alongside the raw SI base form (`11.363636 kg·m⁵·s⁻⁴·A⁻²`).

## Functions

`sqrt` `cbrt` `root` `abs` `sign` `floor` `ceil` `round` `exp` `ln` `log`
`log10` `log2` `sin` `cos` `tan` `asin` `acos` `atan` `atan2` `sinh` `cosh`
`tanh` `pow` `min` `max` `clamp` `mod` `hypot` `fact` `gcd` `lcm`

They are unit aware where that makes sense: `sqrt(4m^2)` is `2 m`,
`round(1234.5m)` keeps the unit it was given (`1.235 km`),
`hypot(3m, 4m)` is `5 m`, `mod(90deg, 60deg)` is
`30°`, and `ln(5m)` is refused with an explanation rather than a wrong number.
Trigonometry takes an angle (`sin(30deg)`, `sin(0.5rad)`); a bare number is
read as radians.

## Development

The test suite runs in CI on every push and pull request against Node 20, 22 and
24:

```
node tests/run-tests.js
```

## License

MIT — see [LICENSE](LICENSE).

## Files

| File | Contents |
|---|---|
| `index.html` | page structure |
| `styles.css` | dark theme |
| `app.js` | UI: live evaluation, history, variables, help sheet |
| `units.js` | unit database, prefixes, constants (global `SI_UNITS`) |
| `engine.js` | tokenizer, parser, unit algebra, formatter (global `SI`) |
| `tests/run-tests.js` | test suite |

`engine.js` and `units.js` have no DOM dependency and work under Node, which is
how the tests exercise them.

## Seeing what was parsed

Every result comes with the equation that produced it, so a surprising answer is
always explainable:

```
9.81m/s^2 * 1.5s^2     (9.81 m ÷ s²) · 1.5 s² = 14.715 m
2h 30min               2 h + 30 min = 2.5 h
1h 2m                  1 h · 2 m = 7200 m·s
10um*10um/8.8e-12F/m   10 µm · 10 µm ÷ (8.8e-12 F) ÷ m = 11.363636 m·F⁻¹
```

The renderer works from the evaluated syntax tree, so it shows what actually
happened rather than a tidied-up version of what you typed: `2h 30min` is
rendered as a sum and `1h 2m` as a product, because that is how each one was
evaluated. Brackets appear wherever dropping them would change the meaning.

## How the engine works

Every quantity is a value in SI base units plus an 8-element dimension vector
`[kg, m, s, A, K, mol, cd, rad]`. Addition and subtraction require matching
dimensions; multiplication, division and powers add them. Because dimensions
are tracked exactly, `1kW*1h` knows it is an energy and prints `3.6 MJ`, and
`1m + 1s` is a clear error instead of a meaningless number.

Each quantity also remembers how the user wrote it (the "hint": `ms` versus
`s`, `psi` versus `Pa`), which is why `2h 30min` reads back as `2.5 h` and
`250ms` as `250 ms` instead of being rewritten into base units.
