# Design decisions

Why the tool behaves the way it does. The full log — including the bugs found
after the engine was declared done — lives in
[INTENT.md](https://github.com/PeterHindes/si-calculator/blob/main/INTENT.md).

## What it was asked to be

> "Create a calculator for solving science problems where si units with multiples
> are used. it should be free form so I could type for example
> `10um*10um/8.8e-12F/m` and get a result with units"

Free-form, SI prefixes as first-class syntax, and results that carry units. The
example divides by `F/m` — a material property — so the answer is a compound
unit nobody has a name for. That is the case that decided the design: a
calculator that only appends a suffix to a number fails here, so dimensions are
tracked exactly and symbolic units are composed when needed.

## The decisions that shaped everything

**Dimensions, always.** Every quantity is a value plus an 8-element dimension
vector. It costs nothing and it is what makes `1kW*1h` → `3.6 MJ` and
`1m + 1s` → an error.

**Juxtaposition binds tighter than `*` and `/`.** So `100km/2h` is 50 km/h and
`E/mc^2` is `E/(m·c²)` — the readings physics formulas intend. The cost is that
`1/2m` means `0.5 m⁻¹`; `(1/2)m` is the way to write half a metre. This is the
decision most likely to be questioned, so it is documented in three places and
has a test.

**Standard left-associative division.** The motivating example is ambiguous:
`10um*10um/8.8e-12F/m` reads as `((10µm·10µm) ÷ F) ÷ m` = `11.363636 m·F⁻¹`,
while the likely intent needs brackets for `11.363636 m³·F⁻¹`. Rather than
invent precedence, the parser stayed standard and the **equation line** was added
later to show the reading explicitly.

**Digits are exponents *or* radix digits.** `m2` is m², but `2h30min` is 2 h 30
min. The rule: a digit run ending the expression is an exponent; one followed
by a unit is the next radix digit.

**Mixed radix only between units of the same kind.** `2h 30min` = 2.5 h,
`1h 2m` = 7200 m·s. The asymmetry is the most surprising thing in the tool,
which is exactly why the result always shows its equation.

**Offsets add like a spreadsheet.** `20degC + 5degC` = 25 °C. `20degC * 2` scales
a reading; `20degC * 30degC` is refused.

**The typed unit survives.** `2h 30min` reads back as `2.5 h`, not `9000 s`.

## What it was built in this order, and why

Engine → tests → UI → review → fuzzing.

The engine has no DOM dependency, so it could be finished and tested under Node
before the page existed. The UI was then built against a frozen API while the
engine kept changing. Fuzzing (50k–120k random inputs) came last and now
enforces the rule that nothing reaches the screen as `NaN`, `undefined` or
`Infinity`.

## The bug that changed the process

The engine passed 208 assertions and was still wrong in ways that mattered:

| Symptom | Cause |
|---|---|
| `10m-2m` → *cannot raise m to the power NaN* | the parser read the `-` operator token's value instead of the number after it |
| `1km2` → `1 Mm²` | a prefix applied linearly to a squared quantity |
| `1s/m` → `m/s⁻¹` | an exponent appended to a symbol that already contained one — a wrong *reading*, not a typo |
| `1kug` → `1 g` (was 1 mg) | stacked prefixes kept the outer factor with the inner symbol |
| the same symbol resolving differently after another expression | the unit cache ignored recursion depth |

None of these were found by the tests that existed. What found them was an
independent review pass and fuzzing — so both are now part of how this project
is checked, and the failure modes are listed in
[[Development#Things that have bitten]].

## Later requests, and what they changed

* **"save it to github"** — public repo; MIT applied afterwards.
* **"add it to github pages"** — Pages serves `main` from the root, with
  `.nojekyll` so files are served verbatim.
* **"render the full equation in addition to the answer"** — added the equation
  line, which is the feature that makes the mixed-radix and slash rules
  self-explanatory rather than something to memorise.
* **"add mit liscence and add the test suit to github actions"** — MIT licence,
  CI on Node 20/22/24.

## Open questions

* Should the engine ship as a reusable package? It is already DOM-free and runs
  under Node; nobody has asked.
* `1..2` parses as `1^0.2`. Defensible under the exponent rule, arguably wrong;
  left alone deliberately.
* The licence was applied without discussion. It is the only legal text in the
  project, so change it if the intent was otherwise.
