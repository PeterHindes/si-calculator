The 32 built-in functions, and how each one treats units.

Every example below is real output from the engine. Functions are always called
with brackets: `sin 30deg` is `sin × 30 × deg`, which gives
`0.013299409 m·s·rad`. See [[Syntax]] for the grammar and [[Units]] for the
units.

## The short version

There are four kinds of function here:

| kind | which | behaviour |
|---|---|---|
| unit-aware | `sqrt`, `cbrt`, `root`, `abs`, `floor`, `ceil`, `round`, `pow` | the unit comes out the other side, halved or whole as appropriate |
| same-unit comparisons | `min`, `max`, `clamp`, `mod`, `hypot`, `atan2` | every argument must have the same dimensions, and the answer carries them |
| plain numbers only | `exp`, `ln`, `log`, `log10`, `log2`, `sin`, `cos`, `tan`, `sinh`, `cosh`, `tanh`, `asin`, `acos`, `atan`, `fact`, `gcd`, `lcm` | anything with a unit is refused with an explanation rather than a wrong number |
| anything | `sign` | reads the value and drops the unit, so `sign(3m)` is `1` |

`sin`, `cos` and `tan` are the exception in that third row: they take an
*angle*, and a bare number is read as radians.

## All functions

| function | what it does | with units |
|---|---|---|
| `sqrt(x)` | square root | halves every dimension exponent, so `sqrt(4m^2)` is `2 m`. Every exponent must be even — `sqrt(4m)` is refused. Refuses offset units |
| `cbrt(x)` | cube root | divides exponents by 3; no evenness rule, so `cbrt(2m)` gives `1.259921 m^0.333333` |
| `root(x, n)` | n-th root | exponents ÷ n. `n` must be a plain number, and an integer when `x` has units |
| `abs(x)` | absolute value | keeps the dimensions **and** the display unit: `abs(-3.5m)` is `3.5 m`. On °C/°F it drops the offset and returns kelvin |
| `sign(x)` | −1, 0 or 1 | takes any quantity and throws the unit away: `sign(3m)` is `1` |
| `floor(x)` | round down | keeps the dimensions, drops the display unit: `floor(2.7m)` is `2 m`. Refuses offset units |
| `ceil(x)` | round up | as `floor`: `ceil(2.1m)` is `3 m`. Refuses offset units |
| `round(x [, digits])` | round to nearest | keeps the dimensions, drops the display unit: `round(1234.5m)` is `1.235 km`. `digits` must be a plain number. Does **not** refuse offset units — `round(20.4degC)` is `294 K` |
| `exp(x)` | e to the power x | plain number only |
| `ln(x)` | natural logarithm | plain number only, and positive. `ln(5m)` is refused with "divide out the units first" |
| `log(x [, base])` | logarithm, base 10 by default | plain number only, and positive. The base must be > 0 and not 1 |
| `log10(x)` | base-10 logarithm | plain number only, and positive |
| `log2(x)` | base-2 logarithm | plain number only, and positive |
| `sin(angle)` | sine | takes an angle (or a bare number = radians). Result is a plain number |
| `cos(angle)` | cosine | as `sin` |
| `tan(angle)` | tangent | as `sin` |
| `asin(x)` | arc sine | plain number between −1 and 1; **returns an angle**: `asin(0.5)` is `30 °` |
| `acos(x)` | arc cosine | as `asin`: `acos(0.5)` is `60 °` |
| `atan(x)` | arc tangent | plain number; returns an angle: `atan(1)` is `45 °` |
| `atan2(y, x)` | angle whose tangent is y/x | both arguments must have the same units; returns an angle |
| `sinh(x)` | hyperbolic sine | plain number only |
| `cosh(x)` | hyperbolic cosine | plain number only |
| `tanh(x)` | hyperbolic tangent | plain number only |
| `pow(x, n)` | x to the power n | fully unit-aware, the same as `x^n`: `pow(2m,3)` is `8 m³`. The exponent must be a plain number, and an integer when `x` has units |
| `min(a, b, …)` | smallest of 1–8 | all arguments must share dimensions. Returns the winning argument *as written*, so `min(3m,5mm)` is `5 mm` |
| `max(a, b, …)` | largest of 1–8 | as `min`: `max(3m,5m)` is `5 m` |
| `clamp(x, lo, hi)` | x limited to [lo, hi] | all three must share dimensions; result keeps x's display unit |
| `mod(a, b)` | remainder, sign of b | both must share dimensions; `mod(-7,3)` is `2`, not −1. Refuses a zero divisor |
| `hypot(a, b, …)` | √(a²+b²+…) | 2–8 arguments, all sharing dimensions: `hypot(3m,4m)` is `5 m` |
| `fact(n)` | n! (also written `5!`) | plain, non-negative integer, at most 170. `5m!` is refused |
| `gcd(a, b, …)` | greatest common divisor | plain numbers, rounded to integers, 2–8 of them |
| `lcm(a, b, …)` | least common multiple | as `gcd`; `lcm(0,5)` is `0` |

## Worked examples

### Roots

```
sqrt(4m^2)          =  2 m
sqrt(16)            =  4
sqrt(4m^2 * 9s^2)   =  6 m·s
sqrt(4m)            =  ERROR: sqrt() of m is not a physical quantity
sqrt(-4)            =  ERROR: sqrt() of a negative number
sqrt(20degC)        =  ERROR: sqrt() cannot take an offset unit (°C, °F)

cbrt(27m^3)         =  3 m
cbrt(8)             =  2
cbrt(2m)            =  1.259921 m^0.333333

root(27, 3)         =  3
root(8m^3, 3)       =  2 m
root(4m, 0.5)       =  ERROR: root() of m needs an integer n
root(-4, 2)         =  ERROR: root() of a negative number needs an odd integer n
```

`sqrt` halves even powers of units, which is why `sqrt(4m^2)` is a length.
`cbrt` and `root` will happily produce a fractional power of a unit instead,
because there is no reason for a cube root of a length not to exist. Note that
`root(-8, 3)` fails — use `cbrt(-8)`, which is `-2`.

### Rounding

```
floor(2.7m)         =  2 m
ceil(2.1m)          =  3 m
round(1234.5m)      =  1.235 km
round(3.14159, 2)   =  3.14
round(2.5)          =  3
round(3.5)          =  4
floor(2.7degC)      =  ERROR: this function cannot take an offset unit (°C, °F)
round(20.4degC)     =  294 K
abs(-3.5m)          =  3.5 m
sign(-7)            =  −1
sign(3m)            =  1
```

`round(1234.5m)` keeps the unit it was given: it is 1235 m, which the
formatter then chooses to display as 1.235 km.

`floor` and `ceil` refuse °C and °F but `round` accepts them and returns
absolute kelvin, dropping the offset — `round(20.4degC)` is 294 K rather than
20 °C. `abs` behaves the same way: `abs(-20degC)` is `253.15 K`. If you mean
the magnitude of a reading, convert first.

### Logs and exponentials

```
exp(1)              =  2.7182818
ln(e)               =  1
ln(100)             =  4.6051702
ln(5m)              =  ERROR: ln() needs a plain number, not m
                      hint: Divide out the units first, e.g. ln(x/m)
ln(0)               =  ERROR: ln() needs a positive number
log(1000)           =  3
log(8, 2)           =  3
log10(1000)         =  3
log2(1024)          =  10
log(100, 1)         =  ERROR: log() base must be greater than 0 and not 1
```

The refusal is deliberate: a logarithm of a dimensionful quantity would have to
pick an arbitrary reference unit, and picking one silently is how you get an
answer that is off by a factor of 1000.

### Trigonometry

```
sin(30deg)          =  0.5
sin(0.5)            =  0.47942554      (bare number = radians)
sin(0.5rad)         =  0.47942554
cos(60deg)          =  0.5
tan(45deg)          =  1
sin(100grad)        =  1
sin(1rev)           =  −2.4492936e-16  (floating-point residue, not exactly 0)
sin(1m)             =  ERROR: sin() needs an angle, not m
sin(20degC)         =  ERROR: sin() needs an angle, not K

asin(0.5)           =  30 °
acos(0.5)           =  60 °
atan(1)             =  45 °
asin(2)             =  ERROR: asin() needs a value between −1 and 1
atan2(3, 4)         =  0.64350111 rad
atan2(3m, 4m)       =  0.64350111 rad
atan2(3m, 4s)       =  ERROR: atan2() arguments must have the same units
```

Angle units are converted automatically, so `deg`, `grad`, `arcmin`, `arcsec`
and `rev` all work. The inverse functions return an angle, and the formatter
prefers a whole number of degrees when the angle happens to be one — which is
why `asin(0.5)` prints as `30 °` rather than `0.52359878 rad`. `atan2(3,4)`
prints as `0.64350111 rad` because it is not a whole number of degrees.

### Powers and comparisons

```
pow(2, 10)          =  1024
pow(2m, 3)          =  8 m³
pow(2m, 0.5)        =  ERROR: cannot raise m to the power 0.5
pow(2, 1m)          =  ERROR: pow() needs a plain number, not m

min(3m, 5m)         =  3 m
min(3m, 5mm)        =  5 mm
max(3m, 5m)         =  5 m
max(1, 5, 3)        =  5
min(3m, 5s)         =  ERROR: min() arguments must have the same units

clamp(15, 0, 10)      =  10
clamp(15mm, 0mm, 10mm) =  10 mm

mod(90deg, 60deg)   =  30 °
mod(7, 3)           =  1
mod(-7, 3)          =  2
mod(7m, 3m)         =  1 m
mod(7, 0)           =  ERROR: mod() by zero

hypot(3m, 4m)       =  5 m
hypot(3, 4)         =  5
```

`mod` follows the sign of the divisor, the way a spreadsheet remainder does:
`mod(-7,3)` is 2. `min` and `max` return the argument that won, with that
argument's own display unit, which is why `min(3m,5mm)` reads back as `5 mm`.

### Whole numbers

```
fact(5)             =  120
5!                  =  120
fact(171)           =  ERROR: factorial is too large (max 170)
5m!                 =  ERROR: fact() needs a plain number, not m

gcd(12, 18)         =  6
gcd(12, 18, 24)     =  6
lcm(4, 6)           =  12
lcm(4, 6, 10)       =  60
gcd(12m, 18m)       =  ERROR: gcd() needs a plain number, not m
```

`fact`, `gcd` and `lcm` only make sense for counts, so they want plain numbers.
`gcd` and `lcm` round their arguments to integers first, and `fact` refuses
anything that is not already a whole number.

## Argument counts

`min` and `max` take 1–8 arguments; `hypot`, `gcd` and `lcm` take 2–8;
`round` and `log` take 1 or 2. Everything else is fixed: 1 argument, except
`root`, `atan2`, `pow` and `mod` (2) and `clamp` (3). Giving the wrong number
of arguments is an error, but the message is currently wrong — it names the
function `undefined` rather than the one you typed:

```
max()               ==>  ERROR: undefined() takes 1–8 arguments, got 0
hypot(3m)           ==>  ERROR: undefined() takes 2–8 arguments, got 1
pow(2)              ==>  ERROR: undefined() takes 2 arguments, got 1
sqrt(1, 2)          ==>  ERROR: undefined() takes 1 argument, got 2
```