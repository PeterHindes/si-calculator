Every unit the calculator knows, grouped the way the help sheet groups them.

For the expression grammar itself see [[Syntax]]; for functions see [[Functions]];
for the named physical constants see [[Constants]].

## How units are written

You type a unit symbol and the calculator looks it up: `m`, `kg`, `ohm`, `degC`.
A prefix is attached with no separator — `um`, `mm`, `kW`, `pF`, `MΩ` — and
`µm`, `μm` and `um` are all the same thing. See [[Syntax]] for where a unit ends
and the next token begins, and for the exponent shorthands (`m2`, `s-2`, `m^2`,
`m⁻¹`).

Case matters, because several symbols are one letter apart:

| you write | means | not |
|---|---|---|
| `m` | metre | `M` is the mega prefix — `1M` on its own is an error, `1Mm` is a megametre |
| `s` | second | `S` is siemens |
| `T` | tesla | `t` is the tonne |
| `K` | kelvin | `k` on its own is the Boltzmann constant, `kK` is a kilokelvin |
| `B` | byte | `b` is the barn, a length of 1e-28 m |
| `G` | Newton's gravitational constant | `g` is the gram |

Two more that surprise people:

- **`h` is the hour**, not Planck's constant and not the hecto prefix. `1h` is
  3600 s; Planck's constant is `planck` (see [[Constants]]). The hecto prefix
  still works on its own, so `1hm` is 100 m and `1dam` is 10 m.
- **`min` is the minute**, not milli-inch. There is no prefix without a unit
  after it, so `mm` is a millimetre and `min` is always 60 s.

Units print back with a display symbol, which is not always the name you typed:
`1tonne` comes back as `1 t`, `1angstrom` as `1 Å`, `1ohm` as `1 Ω`,
`1floz` as `1 fl oz`, `1degC` as `1 °C`. A few display symbols cannot be typed
back — those are listed under [Gotchas](#gotchas).

Two of the tables below have a column that needs explaining:

- **name** is the key you type. There are also 69 aliases, including `meters`,
  `metres`, `micron`, `microns`, `Celsius`, `Fahrenheit`, `Kelvin`, `Ohm`, `Ω`,
  `Å`, `litre`, `liter`, `pascals`, `joules`, `watts`, `volts`, `amps`,
  `amperes`, `coulomb`, `farad`, `henry`, `hertz`, `sec`, `hr`, `day`, `week`,
  `year`, `percent`, `pound`, `pounds`, `stone`, `ton`, `tons`, `tonnes`,
  `gallon`, `mole`, `moles`, `radian`, `radians`, `degree`, `degrees`,
  `decibel`, `dB`, `AU`, `lightyear`, `lyr`.
- **prefixable** says whether an SI prefix may be attached to it. `yes` means
  `k`/`m`/`µ`/… work on it (`1kbar` is a kilobar); `no` means they do not, so
  typing one gives an error or something else entirely (`1kbarn` is an error,
  `1ukg` is the amu times a kilogram).

## Prefixes

Every prefix is accepted on input. They are listed here largest first.

| prefix | factor |
|---|---|
| `Y` | 1e24 |
| `Z` | 1e21 |
| `E` | 1e18 |
| `P` | 1e15 |
| `T` | 1e12 |
| `G` | 1e9 |
| `M` | 1e6 |
| `k` | 1e3 |
| `h` | 1e2 |
| `da` | 1e1 |
| `d` | 1e-1 |
| `c` | 1e-2 |
| `m` | 1e-3 |
| `µ` | 1e-6 (also typed `u` or `μ`) |
| `n` | 1e-9 |
| `p` | 1e-12 |
| `f` | 1e-15 |
| `a` | 1e-18 |
| `z` | 1e-21 |
| `y` | 1e-24 |

A prefix with no unit after it is an error: `1M`, `1Y` and `1Zi` all fail. `1k`
does not, because `k` is also the Boltzmann constant — see [[Constants]].

### Binary prefixes

These are powers of 1024, not 1000, and they are not SI. They work on any
prefixable unit, not just data ones, so `1KiB` is 8192 bits but `1Mib` is a
mebibarn.

| prefix | factor |
|---|---|
| `Ki` | 1024 |
| `Mi` | 1048576 |
| `Gi` | 1073741824 |
| `Ti` | 1099511627776 |
| `Pi` | 1125899906842624 |
| `Ei` | 1152921504606846976 |
| `Zi` | 1180591620717411303424 |
| `Yi` | 1208925819614629174706176 |

### Which prefix a result gets

Results are displayed with one of `Y Z E P T G M k (none) m µ n p f a z y`,
applied only to a coherent SI unit. **c, d, h and da are accepted on input but
never chosen automatically** — `0.01m` prints as `10 mm`, `0.1m` as `0.1 m`,
`100m` as `100 m`. Everything that is not on that list is shown exactly as it
was typed, so `250ms` stays `250 ms` and `2h 30min` stays `2.5 h`.

## The units

### Dimensionless

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `1` | `1` | dimensionless (a plain number) | no |
| `%` | `pct` | dimensionless (a plain number) | no |
| `ppm` | `ppm` | dimensionless (a plain number) | no |
| `ppb` | `ppb` | dimensionless (a plain number) | no |

### Length

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `m` | `m` | length | yes |
| `Å` | `angstrom` | length | no |
| `nmi` | `nmi` | length | yes |
| `fathom` | `fathom` | length | yes |
| `b` | `b` | length | yes |
| `barn` | `barn` | length | no |

`b` is the barn, 1e-28 m — a cross section, not a byte. `barn` is the same unit
spelled out.

### Imperial

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `in` | `in` | length | yes |
| `ft` | `ft` | length | yes |
| `yd` | `yd` | length | yes |
| `mi` | `mi` | length | yes |
| `thou` | `thou` | length | yes |
| `lb` | `lb` | mass | yes |
| `oz` | `oz` | mass | yes |
| `st` | `st` | mass | yes |
| `gr` | `gr` | mass | yes |
| `slug` | `slug` | mass | yes |
| `acre` | `acre` | area | yes |
| `gal` | `gal` | volume | yes |
| `qt` | `qt` | volume | yes |
| `pt` | `pt` | volume | yes |
| `fl oz` | `floz` | volume | yes |
| `cup` | `cup` | volume | yes |
| `BTU` | `btu` | energy | yes |
| `psi` | `psi` | pressure | yes |
| `lbf` | `lbf` | force | yes |
| `mph` | `mph` | speed | no |

`pt` is the US pint and `st` is the stone. This group mixes British and US
customary units: `gal` is the US gallon (3.785411784 L), not the imperial one.

### Astronomy

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `au` | `au` | length | yes |
| `ly` | `ly` | length | yes |
| `pc` | `pc` | length | yes |

`au` is the astronomical unit; `AU` works as an alias. `pc` is the parsec, so
`1pc` is 3.0856776e16 m.

### Mass

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `g` | `g` | mass | yes |
| `kg` | `kg` | mass | no |
| `t` | `t` | mass | yes |
| `t` | `tonne` | mass | no |
| `u` | `u` | mass | yes |
| `Da` | `Da` | mass | no |
| `ct` | `carat` | mass | yes |

`kg` is not prefixable — it already has one. `u` is the atomic mass unit and
`Da` the same value under its other name. `ton` and `tons` are aliases for
`t`; `tonnes` is too. Large masses switch to tonnes on their own: `1e6 g`
prints as `1 t`.

### Time

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `s` | `s` | time | yes |
| `min` | `min` | time | yes |
| `h` | `h` | time | yes |
| `d` | `d` | time | yes |
| `wk` | `wk` | time | yes |
| `yr` | `yr` | time | yes |
| `month` | `month` | time | no |

`yr` is the Julian year of 365.25 days (31557600 s); `month` is an average
Gregorian month (2629746 s). Neither is exact, which is why they are fixed
numbers here rather than calendar arithmetic.

### Temperature

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `K` | `K` | temperature | yes |
| `°C` | `degC` | temperature | yes |
| `°F` | `degF` | temperature | yes |
| `°R` | `degR` | temperature | yes |

These are offset units; see [Temperature](#gotchas) under Gotchas. You can type
`20degC`, `20°C`, `20°C` or `20℃`, and likewise for Fahrenheit.

### Electric

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `A` | `A` | electric current | yes |
| `C` | `C` | electric charge | yes |
| `V` | `V` | voltage (electric potential) | yes |
| `F` | `F` | capacitance | yes |
| `Ω` | `ohm` | electrical resistance | yes |
| `S` | `S` | electrical conductance | yes |
| `Ah` | `Ah` | electric charge | yes |

`ohm`, `Ohm`, `OHM`, `Ω` and `Ω` all resolve to the same unit. `Ah` is
ampere-hour, 3600 C.

### Amount

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `mol` | `mol` | amount of substance | yes |

### Light

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `cd` | `cd` | luminous intensity | yes |
| `lm` | `lm` | luminous intensity | yes |
| `lx` | `lx` | illuminance | yes |

### Angle

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `rad` | `rad` | plane angle | yes |
| `°` | `deg` | plane angle | yes |
| `grad` | `grad` | plane angle | yes |
| `'` | `arcmin` | plane angle | yes |
| `"` | `arcsec` | plane angle | yes |
| `rev` | `rev` | plane angle | yes |
| `sr` | `sr` | dimensionless (a plain number) | yes |

Angles are tracked as their own dimension, so `2pi` is 6.2831853 and `1/2pi` is
0.15915494 — a number, not an angle — while `sin(30deg)` and `sin(0.5rad)` are
both accepted. `grad` is the gradian (400 per circle) and `rev` a full turn.
`sr` is the steradian; it is in the table but its dimension is dimensionless,
so `1sr` prints as `1`.

### Frequency

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `Hz` | `Hz` | frequency | yes |
| `Cps` | `Cps` | frequency | yes |
| `rpm` | `rpm` | frequency | yes |

### Force

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `N` | `N` | force | yes |
| `dyn` | `dyn` | force | yes |
| `kgf` | `kgf` | force | yes |

### Pressure

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `Pa` | `Pa` | pressure | yes |
| `atm` | `atm` | pressure | yes |
| `bar` | `bar` | pressure | yes |
| `mbar` | `mbar` | pressure | yes |
| `Torr` | `torr` | pressure | yes |
| `mmHg` | `mmHg` | pressure | yes |
| `inHg` | `inHg` | pressure | yes |

`torr` is the name to type; it prints as `Torr`. The capital form is only a
display symbol — `1Torr` is an error. `mbar` is its own unit (100 Pa) and is
also what `1bar/1000` means. `atm` is also a [[Constants|constant]] with the
same value; the unit wins.

### Energy

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `J` | `J` | energy | yes |
| `eV` | `eV` | energy | yes |
| `cal` | `cal` | energy | yes |
| `Cal` | `Cal` | energy | no |
| `kCal` | `kCal` | energy | no |
| `Wh` | `Wh` | energy | yes |
| `erg` | `erg` | energy | yes |
| `kWh` | `kWh` | energy | no |

`cal` is 4.184 J and takes prefixes, so `1kcal` is 4184 J. `Cal` is the food
Calorie — the same 4184 J — and `kCal` is 4184000 J. Neither of those two takes
a prefix, because they are written with one already.

### Power

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `W` | `W` | power | yes |
| `hp` | `hp` | power | yes |

### Magnetism

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `Wb` | `Wb` | magnetic flux | yes |
| `T` | `T` | magnetic flux density | yes |
| `H` | `H` | inductance | yes |

### Radiation

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `Bq` | `Bq` | frequency | yes |
| `Gy` | `Gy` | absorbed / equivalent dose | yes |
| `Sv` | `Sv` | absorbed / equivalent dose | yes |

`Bq` counts decays per second, so it has the same dimension as `Hz`. `Gy` and
`Sv` share the dose dimension; the calculator does not weight by radiation type,
so `1Gy` and `1Sv` are interchangeable to it.

### Chemistry

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `kat` | `kat` | catalytic activity | yes |
| `J/mol` | `J/mol` | molar energy (molar internal energy) | no |
| `mol/L` | `mol/L` | molar concentration | no |
| `g/m²` | `g/m2` | surface mass density (areal mass) | no |

### Area

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `a` | `are` | area | yes |
| `ha` | `ha` | area | yes |
| `m²` | `m2` | area | no |

The are is 100 m² and the hectare is 10000 m². Type `are`, not `a`: `a` on its
own is not a unit, and `1am` is an attometre.

### Volume

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `L` | `L` | volume | yes |
| `l` | `l` | volume | yes |
| `m³` | `m3` | volume | no |

`L` and `l` are the same litre; `litre` and `liter` are aliases for `L`.

### Thermodynamics

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `J/K` | `J/K` | heat capacity | no |

### Mechanics

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `N/m` | `N/m` | surface tension | no |
| `Pa·s` | `Pa_s` | pressure | no |

`Pa_s` is dynamic viscosity. Its stored dimension is pressure
(kg·m⁻¹·s⁻²), not pressure per second, so `1Pa_s*1m/s` comes out as
`1 W/m²` — the kinematic-viscosity answer written with the wrong named unit.

### Heat

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `W/m²` | `W/m2` | heat flux density | no |

### Speed

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `m/s` | `m/s` | speed | no |
| `m/s²` | `m/s2` | acceleration | no |
| `km/h` | `kmh` | speed | no |
| `kn` | `knot` | speed | no |

Type `knot`, not `kn` — see Gotchas.

### Density

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `g/cm³` | `g/cm3` | density | no |
| `kg/m³` | `kg/m3` | density | no |

### Data

| symbol | name | what it is | prefixable |
|---|---|---|---|
| `B` | `B` | dimensionless (a plain number) | yes |
| `bit` | `bit` | dimensionless (a plain number) | yes |
| `bel` | `bel` | dimensionless (a plain number) | no |
| `KB` | `KB` | dimensionless (a plain number) | no |
| `MB` | `MB` | dimensionless (a plain number) | no |
| `GB` | `GB` | dimensionless (a plain number) | no |
| `TB` | `TB` | dimensionless (a plain number) | no |

`B` is 8 bits, so `1B` prints as `8` and `1bit` prints as `1` — these units are
dimensionless and results come back with no unit symbol at all. `KB`…`TB` are
decimal (1000-based): `1KB` is 8000. `Ki`, `Mi`, `Gi` and `Ti` are binary:
`1KiB` is 8192. `PB`, `EB`, `ZB` and `YB` work too, as P/E/Z/Y + byte.

## Gotchas

Symbols that collide, verified against the engine:

| you type | you get | why |
|---|---|---|
| `1ct` | `1 ct` = **10 kg** | centi × tonne. The carat is spelled `carat` |
| `1kB` | `1.380649e-23 J/K` | `kB` is the Boltzmann constant. For a kilobyte type `1KB` |
| `1a` | error | `a` is the are's display symbol; type `are` |
| `1kn` | error | `kn` is the knot's display symbol; type `knot` |
| `1Torr` | error | the name is lowercase `torr`; the capital form is only the display symbol |
| `1P`, `1E`, `1Z`, `1Y`, `1Ki` | error | a prefix with nothing after it is not a unit |
| `1ukg` | `1.6605391e-21 g²` | `kg` takes no prefix, so `ukg` reads as u × kg |
| `1Mib` | `1 Mib` = 1.048576e-22 m | binary prefixes attach to any prefixable unit, so this is a mebibarn |
| `1degK` | `0.017453293 K·rad` | an unrelated pair of units glued together |
| `1b + 1B` | error | `b` is a length (barn), `B` is a byte |

Display symbols that cannot be typed back:

| display symbol | unit | type this instead |
|---|---|---|
| `a` | are | `are` |
| `ct` | carat | `carat` |
| `kn` | knot | `knot` |
| `"` | arcsecond | `arcsec` or `″` — the ASCII `"` is rejected by the tokenizer |
| `fl oz` | fluid ounce | `floz`, with no space. `1fl oz` is femtolitre × ounce |
| `Torr` | torr | `torr` — the capital form is not accepted as input |

Compounds that contain `/` or `·`. The source comments call these display-only,
because `/` and `·` are operators rather than unit characters. That is
half-right: they are never *looked up* by name, but every one of them can be
typed, because `/` is the division operator and each compound happens to be
numerator over denominator. What you get is the right number, arrived at by
division:

| unit | typed as | result |
|---|---|---|
| `m/s` | `1m/s` | `1 m/s` |
| `m/s²` | `1m/s2` | `1 m/s²` |
| `km/h` | `1kmh` | `1 km/h` |
| `J/K` | `1J/K` | `1 J/K` |
| `J/mol` | `1J/mol` | `1 J/mol` |
| `mol/L` | `1mol/L` | `1 mol/L` |
| `W/m²` | `1W/m2` | `1 W/m²` |
| `N/m` | `1N/m` | `1 N/m` |
| `g/cm³` | `1g/cm3` | `1000 kg/m³` |
| `kg/m³` | `1kg/m3` | `1 kg/m³` |
| `g/m²` | `1g/m2` | `1 g/m²` |
| `Pa·s` | `1Pa_s` | `1 Pa·s` |
| `m²`, `m³` | `1m2`, `1m3` | `1 m²`, `1 m³` |
| `kWh`, `mph` | `1kWh`, `1mph` | `1 kWh`, `1 mph` |

The catch is that `/` is an ordinary operator, so the grouping is whatever the
precedence rules say, not a unit lookup: `1/2mol/L` is 500 m⁻³·mol⁻¹, not half
a molar. For the same reason `1km/s` is `1 km` ÷ `s` = 1000 m/s, and
`1m2s2` is `1 m² · s²` = 2 m·s².

Units you get when a result has no standard name are composed from named
units. That usually reads well (`11.363636 m³·F⁻¹`, `1.380649e-23 J/K`) but
sometimes picks an odd combination: `1G` prints as `6.6743e-14 Gy·m·g⁻¹`,
which is correct but hard to read, and `1m2s2` prints as `2000 g·Pa⁻¹`.

### Temperature

`degC` and `degF` are offset units; [[Syntax]] has the full list of what
changes. The unit-specific part is that only `degC` and `degF` carry an offset —
`degR` is just 5/9 K — and the strictness is inconsistent between functions:
`floor(2.7degC)` is refused while `round(20.4degC)` quietly gives `294 K`.

### Mixed radix

Two quantities of the same kind add, anything else multiplies. The rule and its
trade-off are in [[Syntax]]; the unit-specific consequence is that it only
applies within one dimension, so the time units compose (`2h 30min` is 2.5 h)
but a time and a length never do (`1h 2m` is 7200 m·s).