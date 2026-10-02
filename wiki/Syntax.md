# Syntax

The expression language. Everything here is free-form: one line, your own
notation, no modes.

## Numbers and prefixes

| Written | Means |
|---|---|
| `10um`, `10µm`, `10μm` | 10 micrometres — three spellings of µ |
| `8.8e-12`, `8.8E-12`, `.5`, `1.` | scientific and short decimal notation |
| `1KiB` | 1024 bytes (binary prefixes also work) |
| `50%` | 0.5 — percent is a unit |
| `3!` | 6 |

Prefixes attach to the unit with no separator: `10um`, `250ms`, `8.8e-12F`,
`1kWh`. Case matters — `m` is milli, `M` is mega; `s` is second, `S` is siemens;
`t` is tonne, `T` is tesla.

## Multiplication you do not have to type

Juxtaposition means multiplication, so all of these work:

```
10 m          9.81m/s^2          5kWh / 230V          2*pi
```

## The two precedence rules that matter

**1. Juxtaposition binds tighter than `*` and `/`.** The units after a slash
belong to the divisor, which is what physics formulas mean:

```
100km/2h        →  13.888889 m/s      (not 3600 km·h)
1J/(me*c^2)     →  12214329000000     (not J·me⁻¹·c⁻²)
1C/12V          →  83.333333 mF
```

The price is that `1/2m` means `1/(2·m)` = `0.5 m⁻¹`. For half a metre write
`(1/2)m`, `0.5m` or `1/2*m`.

**2. `^` attaches to the unit right before it**, never to a product:

```
10m^2      →  10 m²          (not 100 m²)
(10m)^2    →  100 m²         brackets make the product the base
2^3^2      →  512            powers are right-associative
−2^2       →  −4             negation is looser than powers
```

## Exponents, in every spelling

```
m2      m^2      m²      s-2      s⁻¹      2m^-2
```

A digit run touching a unit is an exponent — unless another unit follows it, in
which case it is the next mixed-radix digit.

## Mixed radix: 2h 30min

```
2h 30min        →  2.5 h
2h30min         →  2.5 h
1d12h30min5s    →  1.5208912 d
```

This is a **sum**, and it only applies between units of the same kind. Hours,
minutes and seconds are the same kind, so they add. Anything else is a product:

```
1h 2m           →  1 h · 2 m = 7200 m·s
2m3m            →  2 m + 3 m = 5 m
```

That difference is deliberate, and the equation line under every result shows
which reading was taken.

## Conversion: `to` and `->`

```
72km/h to m/s        →  20 m/s
1234mm to m          →  1.234 m
-40degC to degF      →  −40 °F
1kWh -> J            →  3600000 J
```

The target can be any unit expression, including a compound: `1m^3 to L` works.
Converting to something of the wrong kind is an error with both dimensions
named.

## Variables and `ans`

```
w = 3.4mm      stores w
w * 2          →  6.8 mm
area = 2m * 3m
area + 1m^2    →  7 m²
ans            the previous result
```

Names are letters and underscores, and cannot shadow a unit (`w`, `area`, `res`
are fine; `m`, `psi`, `k` are not). `ans` always holds the last successful
result, including across expressions typed later.

## Temperature

`degC` and `degF` have an offset, which changes how they behave:

```
20degC + 5degC        →  25 °C      scale addition, like a spreadsheet
20degC + 10K          →  30 °C      absolute stays absolute
20degC * 2             →  40 °C      scaling a reading is fine
20degC * 30degC        →  error      two offset units have no product
100degC - 10degC       →  90 °C
−40degC to degF        →  −40 °F
```

## Angles and trigonometry

`deg` (`°`), `rad`, `grad`, arcminutes (`'`) and arcseconds (`"`) are real units,
so trigonometric functions take them directly:

```
sin(30deg)      →  0.5
atan2(3,4)      →  0.64350111 rad      (36.87°)
```

A bare number is read as radians: `sin(0)` is 0. If you did not type a unit,
an angle that comes out as a whole number of degrees is shown that way —
`asin(0.5)` gives `30 °`. Type a unit and your unit wins: `2pi rad` stays
`6.2831853 rad`, and `2pi deg` gives `6.2831853 °`.

## Miscellaneous

* `pi`, `e`, `c`, `h`, `k`, `NA` and friends are plain numbers you can drop into
  an expression. The page has a constants strip and a `Ctrl`/`⌘`+`K` palette
  for inserting them; see [[Constants]] and [[Home]].
* `sqrt(4m^2)` is `2 m`, `hypot(3m, 4m)` is `5 m`, `mod(90deg, 60deg)` is `30°`.
  See [[Functions]].
* `1/0`, `1e999` and `m^1e308 * m^1e308` are refused with an explanation rather
  than producing `Infinity`.

## What the units are called

The page spells out what every unit means, in two places:

* **while you type** — a line under the input names the unit under the caret,
  so `3.5cm` shows *cm = centimetre · length* before you have finished;
* **on hover** — point at the result, the equation or the SI-base line and a
  tooltip gives the unit in words: `megajoule · energy`,
  `cubic metre per farad`, `kilogram times metre squared per second squared`.

Neither covers the input or the result: the hint is in the text flow and the
tooltip follows the pointer.

## The equation line

Every result is shown as the equation that produced it, rendered from the parsed
tree rather than echoed from your input:

```
9.81m/s^2 * 1.5s^2     →  (9.81 m ÷ s²) · 1.5 s² = 14.715 m
10um*10um/8.8e-12F/m   →  10 µm · 10 µm ÷ (8.8e-12 F) ÷ m = 11.363636 m·F⁻¹
```

Brackets appear wherever dropping them would change the meaning. That is the
quickest way to check how something was read — especially after a mixed-radix
expression or an unbracketed slash.
