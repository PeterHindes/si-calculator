# SI Unit Calculator

A free-form calculator for science problems. Type an expression with SI units
and multiples, get a result with units — and the equation that produced it.

```
10um*10um/(8.8e-12F/m)   →  10 µm · 10 µm ÷ (8.8e-12 F ÷ m) = 11.363636 m³·F⁻¹
2h 30min                 →  2 h + 30 min = 2.5 h
9.81m/s^2 * 1.5s^2       →  (9.81 m ÷ s²) · 1.5 s² = 14.715 m
72km/h to m/s            →  20 m/s
```

No build step, no dependencies. Open `index.html` from disk, or use the live
copy at https://peterhindes.github.io/si-calculator/

## Pages

| Page | What is in it |
|---|---|
| [[Syntax]] | The expression language: precedence, juxtaposition, exponents, mixed radix, conversions, variables |
| [[Units]] | Every unit it knows, by group, with prefixes and symbol collisions |
| [[Functions]] | The 32 built-ins and how each behaves with units |
| [[Constants]] | Physical constants, and which names collide with units |
| [[Architecture]] | How the engine works: quantities, dimensions, hints, formatting, caches |
| [[Development]] | Running the tests, CI, contributing, the invariants to preserve |
| [[Design-decisions]] | Why it behaves the way it does — the intent trace behind this tool |

## The shape of it

* **Every quantity is a value in SI base units plus an 8-element dimension
  vector** `[kg, m, s, A, K, mol, cd, rad]`. That is why `1kW*1h` knows it is an
  energy and prints `3.6 MJ`, and why `1m + 1s` is an error instead of a
  meaningless number.
* **Results keep the unit you typed.** `2h 30min` reads back as `2.5 h`,
  `250ms` as `250 ms`. Prefixes are chosen only when there is nothing to keep,
  and never centi/deci/hecto/deca.
* **Unexpected combinations get a readable symbol.** `m³·F⁻¹` is built from
  named units when no single unit fits, with the raw SI base form underneath.

## In the browser

| | |
|---|---|
| `Ctrl`/`⌘` `K` | open the constants palette — filters every constant and function, Enter inserts |
| `Alt`/`⌥` + letter | insert a common constant: `E` → `epsilon0`, `Z` → `Z0`, `R` → `rho_cu`, `M` → `muB`, plus `C K N Q G H S T V B` |
| click a chip | the **constants** strip is grouped (everyday / electrical / thermal / materials); hovering shows the value and dimension |
| `?` | the full reference sheet — every unit, prefix, function and constant, all clickable |
| `↑`/`↓` | recall history · `Esc` clear · `Enter` commit · `Shift`+`Enter` newline |

The palette is the reliable way in; the letter shortcuts are for the ones you
reach for often. On macOS the shortcut is `⌥`+letter (`⌃` also works).

## Where to start

If you have never seen it: type `10um*10um/(8.8e-12F/m)`, then `2h 30min`, then
`1h 2m` — the last two look almost identical but mean different things, and the
equation line explains why. [[Syntax]] has the details.
