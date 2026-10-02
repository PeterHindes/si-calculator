The 55 named constants built into the calculator.

Each one is a bare name you can type anywhere in an expression, exactly like a
unit — but it has no prefix, no symbol of its own and no alias. Units are
listed in [[Units]], functions in [[Functions]].

## What a constant actually is

Two things are worth knowing before you use them.

**They carry real dimensions.** `pi`, `tau`, `e`, `phi`, `zero`, `one` and
`alpha` (plus `π`, which cannot be typed) are plain numbers; every other
constant is a quantity, and the engine checks it like one. So `me*c^2` is an
energy (`81.871058 fJ`), `1mol*R*300K` is `2.4943388 kJ`, and
`epsilon0*1m*q^2` is a capacitance. That is the point: `NA` is per mole, not
6.022e23, so `NA*1mol` comes back as a dimensionless `6.0221408e23`.

**They display with a chosen unit, not the name you typed.** A constant carries
no display hint, so the formatter picks one the way it does for any unnamed
result: `p0` prints as `101.325 kPa`, `me` as `9.1093837e-28 g`, `a0` as
`52.917721 pm`, and `q` as `160.21766 zC`. Use `to` if you want a specific unit
(`p0 to atm`).

## The constants

| symbol | value | what it is | notes |
|---|---|---|---|
| `pi` | 3.14159265359 | dimensionless (`1`) | circle constant — a plain number, not an angle. Write `pi*1rad` or use `deg` |
| `π` | 3.14159265359 | dimensionless (`1`) | circle constant |
| `tau` | 6.28318530718 | dimensionless (`1`) | 2π |
| `e` | 2.71828182846 | dimensionless (`1`) | Euler's number |
| `phi` | 1.61803398875 | dimensionless (`1`) | golden ratio |
| `c` | 299792458 | speed (`m·s⁻¹`) | speed of light in vacuum |
| `c0` | 299792458 | speed (`m·s⁻¹`) | speed of light in vacuum |
| `h` | 6.62607015e-34 | action, i.e. energy × time (`kg·m²·s⁻¹`) | Planck constant — but plain `h` is the **hour**; see below |
| `planck` | 6.62607015e-34 | action, i.e. energy × time (`kg·m²·s⁻¹`) | Planck constant |
| `hbar` | 1.054571817e-34 | action, i.e. energy × time (`kg·m²·s⁻¹`) | reduced Planck constant, ℏ = h/2π |
| `k` | 1.380649e-23 | energy per kelvin (`kg·m²·s⁻²·K⁻¹`) | Boltzmann constant |
| `kB` | 1.380649e-23 | energy per kelvin (`kg·m²·s⁻²·K⁻¹`) | Boltzmann constant |
| `NA` | 6.02214076e23 | amount per mole (`mol⁻¹`) | Avogadro constant |
| `q` | 1.602176634e-19 | electric charge (`s·A`) | elementary charge |
| `qe` | 1.602176634e-19 | electric charge (`s·A`) | elementary charge |
| `R` | 8.314462618 | energy per kelvin per mole (`kg·m²·s⁻²·K⁻¹·mol⁻¹`) | molar gas constant |
| `G` | 6.6743e-11 | inverse-square-law constant for mass (`kg⁻¹·m³·s⁻²`) | Newtonian constant of gravitation |
| `g0` | 9.80665 | acceleration (`m·s⁻²`) | standard gravity |
| `atm` | 101325 | pressure (`kg·m⁻¹·s⁻²`) | standard atmosphere |
| `epsilon0` | 8.8541878128e-12 | permittivity, i.e. capacitance per unit length (`kg⁻¹·m⁻³·s⁴·A²`) | vacuum permittivity |
| `eps0` | 8.8541878128e-12 | permittivity, i.e. capacitance per unit length (`kg⁻¹·m⁻³·s⁴·A²`) | vacuum permittivity |
| `mu0` | 1.25663706212e-6 | permeability, i.e. inductance per unit length (`kg·m·s⁻²·A⁻²`) | vacuum permeability |
| `sigma` | 5.670374419e-8 | radiant emittance coefficient (`kg·s⁻³·K⁻⁴`) | Stefan–Boltzmann constant |
| `a0` | 5.29177210903e-11 | length (`m`) | Bohr radius |
| `me` | 9.1093837015e-31 | mass (`kg`) | electron mass |
| `mp` | 1.67262192369e-27 | mass (`kg`) | proton mass |
| `mn` | 1.67492749804e-27 | mass (`kg`) | neutron mass |
| `Ry` | 10973731.5682 | wavenumber (`m⁻¹`) | Rydberg constant |
| `FF` | 96485.33212 | charge per mole (`s·A·mol⁻¹`) | Faraday constant |
| `p0` | 101325 | pressure (`kg·m⁻¹·s⁻²`) | standard pressure |
| `zero` | 0 | dimensionless (`1`) | zero |
| `one` | 1 | dimensionless (`1`) | one |
| `alpha` | 0.0072973525693 | dimensionless (`1`) | fine-structure constant |
| `echarge` | 1.602176634e-19 | electric charge (`s·A`) | elementary charge |
| `emratio` | 175882001076 | charge-to-mass ratio (`kg⁻¹·s·A`) | electron charge-to-mass ratio |
| `lambda_c` | 2.42631023538e-12 | length (`m`) | electron Compton wavelength |
| `triple` | 273.16 | temperature (`K`) | triple point of water |
| `c2` | 0.014387768775 | length × temperature (`m·K`) | second radiation constant, hc/k |
| `bWien` | 0.002897771955 | length × temperature (`m·K`) | Wien's displacement constant |
| `Z0` | 376.730313668 | impedance (`kg·m²·s⁻³·A⁻²`) | impedance of free space, µ₀c |
| `Zo` | 376.730313668 | impedance (`kg·m²·s⁻³·A⁻²`) | impedance of free space |
| `Y0` | 0.00265441872799 | admittance (`kg⁻¹·m⁻²·s³·A²`) | admittance of free space, 1/Z0 |
| `phi0` | 2.067833848e-15 | magnetic flux (`kg·m²·s⁻²·A⁻¹`) | magnetic flux quantum, h/2e |
| `Phi0` | 2.067833848e-15 | magnetic flux (`kg·m²·s⁻²·A⁻¹`) | magnetic flux quantum |
| `muB` | 9.2740100783e-24 | magnetic moment (`m²·A`) | Bohr magneton |
| `mub` | 9.2740100783e-24 | magnetic moment (`m²·A`) | Bohr magneton |
| `RK` | 25812.80745 | impedance (`kg·m²·s⁻³·A⁻²`) | von Klitzing constant, h/e² |
| `KJ` | 483597848400000 | frequency (`kg⁻¹·m⁻²·s²·A`) | Josephson constant, 2e/h |
| `rho_cu` | 1.68e-8 | resistivity (`kg·m³·s⁻³·A⁻²`) | resistivity of copper |
| `rho_al` | 2.65e-8 | resistivity (`kg·m³·s⁻³·A⁻²`) | resistivity of aluminium |
| `rho_ag` | 1.59e-8 | resistivity (`kg·m³·s⁻³·A⁻²`) | resistivity of silver |
| `sigma_cu` | 58000000 | conductance (`kg⁻¹·m⁻²·s³·A²`) | conductivity of copper |
| `eps_si` | 11.7 | dimensionless (`1`) | relative permittivity of silicon |
| `eps_al2o3` | 9 | dimensionless (`1`) | relative permittivity of alumina ceramic |
| `Eg_si` | 1.7944368e-19 | energy (`kg·m²·s⁻²`) | band gap of silicon (1.12 eV) |

The first 32 rows are the fundamental and universal constants; the rest are
solid-state and electrical-engineering reference values, and are the ones most
likely to differ from whatever your datasheet quotes.

All 55 are stored as ordinary doubles — some are exact by definition in the SI
(`c`, `h`, `NA`, `k`, `q`) and the rest are measured values, but the calculator
does not distinguish them. The column above is printed to 12 significant digits.

## Electrical engineering, end to end

The tables above are for looking things up. This is what they are for. Every
line below is real output, and the point is that the units do the bookkeeping —
you never convert anything by hand.

**Wires and transmission lines**

```
rho_cu*1m/(1mm^2)        →  16.8 mΩ        1 m of 1 mm² copper
rho_al*1m/(1mm^2)        →  26.5 mΩ        the same in aluminium
rho_cu/10um              →  1.68 mΩ        sheet resistance of 10 µm copper
Z0                       →  376.73 Ω       free-space impedance
Z0/4                     →  94.1826 Ω      a quarter-wave transformer
c/(4*1GHz)               →  74.9481 mm     quarter wave at 1 GHz
c/(2*pi*1GHz)/sqrt(eps_si) →  13.9492 mm   … and in silicon
```

**Capacitance, inductance, energy**

```
epsilon0*eps_si*1m^2/(10um)  →  10.3594 µF    parallel-plate capacitor in silicon
1/(2*pi*1kHz*1uF)            →  159.155 Ω     capacitor impedance at 1 kHz
1T^2/(2*mu0)                →  397.887 kPa   magnetic energy density at 1 T
sqrt(2*rho_cu/(2*pi*1MHz*mu0)) →  65.2341 µm copper skin depth at 1 MHz
```

**Quantised and quantum effects**

```
KJ*1V          →  483.598 THz      Josephson frequency from one volt
RK             →  25.812807 kΩ    von Klitzing resistance
2*phi0         →  4.1356677 fWb    two flux quanta
emratio*1T     →  175.882 GHz      electron cyclotron frequency at 1 tesla
muB*1T to pJ   →  9.27401 yJ       Zeeman splitting per tesla
planck to eV*s →  4.135667697e-15 eV*s
```

**Radiometry and heat**

```
bWien/10um     →  289.777 K        peak wavelength of a 289 K body
c2/10um        →  1.43878 kK       … or the temperature whose peak is at 10 µm
sigma*(300K)^4 →  459.3 W/m²       radiant exitance of a black surface at 300 K
                        (brackets matter: 300K^4 is 300 × K⁴, not (300 K)⁴)
```

Two things worth knowing about the material constants (`rho_cu`, `eps_si`,
`Eg_si`, …): they are **approximate reference values at 20 °C**, not exact
constants, and they change with temperature, purity and alloy. They are there
for back-of-envelope work — a skin depth, a sheet resistance, a rough
capacitance — not for a datasheet.

## Symbols that collide

A constant is only used if it is not already a unit, so several familiar
symbols do not mean what you would expect:

| you type | you get | to mean the constant, type |
|---|---|---|
| `h` | 1 h — the **hour**, 3600 s | `planck` |
| `atm` | 1 atm — the **unit** (same 101325 Pa, so no difference) | — |
| `k` | the Boltzmann constant, not a prefix | — |
| `kB` | the Boltzmann constant, so `1kB` is 1.38e-23 J/K, **not** a kilobyte | `KB` for a kilobyte |
| `K` | 1 K — the kelvin unit | — |
| `G` | Newton's constant, so `1Gm` is still a gigametre but `1G` is not a prefix | — |

The one that bites most often is `h`: in SI `h` is the hour, so Planck's
constant is spelled `planck` (with `hbar` for the reduced one). Writing `1h`
gives `1 h`; writing `1planck` gives `6.6260701e-34 J·s`, and
`planck*1/2pi` gives hbar.

`π` is in the table but cannot actually be typed — the tokenizer rejects the
character (`2π` → "unexpected character"). Use `pi`.

## Worked examples

Every one of these is real output.

```
planck*1/2pi        =  1.0545718e-34 J·s     (this is hbar)
me*c^2             =  81.871058 fJ
me*1m*c^2/2         =  4.0935529e-14 J·m
1mol*R*300K        =  2.4943388 kJ
NA*1mol            =  6.0221408e23
g0*1s^2/2          =  4.903325 m
epsilon0*1m*q^2    =  2.2728434e-49 J·F²
FF*1mol            =  96.485332 kC
1kW*1h             =  3.6 MJ
Ry*m*c             =  3.289842e15 m/s
```

A note on `pi`: it is a dimensionless number, not an angle. `pi to deg` is an
error ("`deg` is not a unit of 1"), because degrees carry an angle dimension.
To go from π to an angle, either multiply by an angle unit or convert a real
angle:

```
1rad to deg        =  57.29577951 °
90deg to rad       =  1.570796327 rad
pi*1rad            =  3.1415927 rad
2pi*1deg           =  6.2831853 °
```

The trigonometric functions in [[Functions]] take angles directly, so you
rarely need the conversion: `sin(180/pi*1deg)` and `sin(1rad)` both give
`0.84147098`.

## A trap with `T`

`T` is the tesla, not "temperature", so `sigma*T^4` is a Stefan–Boltzmann
expression with the wrong symbol and the calculator will happily compute it:

```
sigma*T^4          =  5.6703744e-8 kg⁵·s⁻¹¹·A⁻⁴·K⁻⁴
sigma*300K^4       =  0.000017011123 W/m²
```

So use `sigma*300K^4` for the Stefan–Boltzmann law, not `sigma*T^4`.

## Electrical and materials constants

The reference values behave the same way — dimensions and all:

```
rho_cu                 =  1.68e-8 Ω·m
rho_cu*1m^2/1A          =  1.68e-8 Ω·m³·A⁻¹
sigma_cu               =  58 MS
1/rho_cu*1m^2          =  59523810 S·m
Z0                     =  376.73031 Ω
1/Z0                   =  2.6544187 mS
muB                    =  9.2740101e-24 m²·A
phi0                   =  2.0678338 fWb
RK                     =  25.812807 kΩ
triple                  =  273.16 K
bWien/300K             =  9.6592399 µm
eps_si*eps0            =  1.03594e-10 F·m⁻¹
Eg_si to eV            =  1.119999357 eV
alpha                  =  0.0072973526
```

Two of those deserve care. `bWien` is a displacement constant, so the
Wien peak for a given temperature is `bWien/T`, not `bWien*T` — and note that
`T` is the tesla, so type the temperature as `300K`. And `RK` and `KJ` carry
the dimensions of an impedance and a frequency respectively, which is why `RK`
prints as `25.812807 kΩ` and `KJ` as `483597848400000 Wb⁻¹`.