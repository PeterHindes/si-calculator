# Intent trace

A distilled log of what was asked for, what was decided, and why — so that a
future agent (or person) can pick this project up without re-deriving it. This
is a record of *reasons*, not a transcript of the conversation.

Dates are the order of work, 2026-10-02 unless stated. Commit hashes refer to
`PeterHindes/si-calculator`.

---

## 1. The request

> "Create a calculator for solving science problems where si units with
> multiples are used. it should be free form so I could type for example
> `10um*10um/8.8e-12F/m` and get a result with units"

Three commitments follow from that sentence, and they drove everything else:

1. **Free-form.** No menus, no per-operand form fields, no mode switch. The
   input is a single expression in the user's own notation.
2. **SI prefixes are first-class.** `um`, `8.8e-12`, `1KiB` must parse without
   ceremony. The motivating example contains two of them.
3. **The result must carry units**, and they must be the *right* units — not
   just a string. The example divides by `F/m`, which is a material property,
   so the answer is a compound unit nobody has a name for.

A calculator that only prints numbers with a suffix would fail (3) as soon as
someone typed `E/(m*c^2)`. So the engine tracks dimensions exactly.

---

## 2. The one ambiguity in the request

The example as written, `10um*10um/8.8e-12F/m`, parses left-to-right:

```
((10µm · 10µm) ÷ (8.8e-12 F)) ÷ m        →  11.363636 m·F⁻¹
```

The physics intent was almost certainly to divide by the compound:

```
(10µm · 10µm) ÷ (8.8e-12 F ÷ m)        →  11.363636 m³·F⁻¹
```

**Decision: keep standard left-associative division.** The alternative — treating
a trailing unit as belonging to the divisor — would break the far more common
`100km/2h` (50 km/h) and `E/mc^2`. The user is told about the brackets in the
README, in the help sheet, and — most usefully — in the rendered equation line
added in §6, which prints the parentheses explicitly:

```
10 µm · 10 µm ÷ (8.8e-12 F) ÷ m = 11.363636 m·F⁻¹
```

**If this is ever revisited:** the cheapest improvement is not a parser change
but a hint. When the unbracketed form is typed and the bracketed reading would
give a different answer, mention it in the hint line. Do *not* silently pick
the other reading.

---

## 3. Semantic decisions worth knowing

### Juxtaposition binds tighter than `*` and `/`

So `100km/2h` = 50 km/h and `1C/12V` = 83.3 mF, which is what physics
formulas mean. The price: `1/2m` is `1/(2·m)` = 0.5 m⁻¹, not 0.5 m. Documented,
with `(1/2)m`, `0.5m` and `1/2*m` given as the ways to write half a metre.

### `^` attaches to the unit before it, not to the product

`10m^2` is 10 m², not (10 m)². Achieved by handling `^` immediately after a
primary rather than at the product level.

### Digits are exponents *or* radix digits

`m2` = m², `s-2` = s⁻², `10m^2` = 10 m². But `2h30min` = 2 h + 30 min, because a
digit run followed by a unit is the next mixed-radix digit.

### Mixed radix only between units of the same kind

`2h 30min` = 2.5 h and `1d12h30min5s` = 1.5208912 d, because hours, minutes and
seconds share dimensions. `1h 2m` is a *product* (7200 m·s) and `2m3m` is a sum
(5 m). This asymmetry is the single most surprising behaviour in the tool, which
is why the rendered equation (§6) shows which reading was taken.

### Offsets (°C, °F) add like a spreadsheet scale

`20degC + 5degC` = 25 °C, matching what a spreadsheet or a human expects.
`20degC + 10K` = 30 °C (absolute stays absolute). Multiplying two offset units is
rejected; `20degC * 2` is allowed and means "twenty degrees Celsius, doubled".

### Display respects how the user wrote it

Each quantity carries a *hint* — the unit as typed. `2h 30min` reads back as
`2.5 h`, not `9000 s`; `250ms` stays `250 ms`. Prefixes are chosen only when
there is no hint, and never centi/deci/hecto/deca. Prefixes apply to the *n-th
root* of a squared quantity, so `1km2` is `1 km²` and never `1 Mm²`.

---

## 4. Build sequence

| Step | What | Why that order |
|---|---|---|
| Engine first, UI later | `units.js`, `engine.js`, then the page | The engine has no DOM dependency, so it could be tested under Node while the UI was still an unknown |
| Tests before UI | `tests/run-tests.js` written alongside the engine | Every later semantic decision is justified by a test that fails without it |
| UI built against a fixed API | `SI.evaluate / format / convert / HELP / resolve` frozen first | Let the UI be built in parallel without waiting on engine churn |
| Browser verification with headless Chromium | Drives the real page from `file://` | Confirms the thing users actually open; three separate crashes would have been invisible to unit tests alone |
| Review pass on the engine | Independent adversarial review | Found 11 real bugs (below) that 208 passing assertions had missed |
| Fuzzing | 50k–120k random token soups | Proved no input can produce an internal crash or a `NaN`/`undefined` on screen |

---

## 5. Bugs found after the engine was "done"

The engine passed its own tests for a long stretch and was still wrong in ways
that mattered. Recorded because each one is a class, not a one-off.

| Bug | Symptom | Lesson |
|---|---|---|
| `suffixes()` used the operator token's value | `10m-2m` → *cannot raise m to the power NaN*; `s-2` broken for all 118 units | When a parser stores positions, make sure the token you read the value from is the token you mean |
| Prefix applied linearly to squared values | `1km2` → `1 Mm²` (off by 10⁶) | A prefix on a compound unit must be applied to the root |
| Stacked prefixes kept the outer factor with the inner symbol | `1kug` printed `1 g` (was 1 mg) | Value and symbol must be derived from the same source |
| Composed symbol appended superscripts to symbols already containing one | `1s/m` printed `m/s⁻¹` — the *inverse* of the truth | A display rule that produces a wrong reading is worse than no display |
| `convert()` snapped anything < 1e-12 to zero | `1fm to m` → `0 m` | Numeric "tidying" is a silent lie unless it is scoped to the case that needed it |
| Unit cache ignored recursion depth | Same symbol resolved differently depending on what was evaluated before | If the answer depends on a budget/depth, only the top-level result is cacheable |
| `dimSymbol` rounded before comparing | `1e308` exponent printed `Infinity` | Rounding can overflow; guard the magnitude first |
| Parser recursion had no depth limit | `(((…1…)))` → `RangeError`, an internal crash | Every recursion needs a depth guard that produces a *user* error |

**Standing rule adopted from this:** nothing may print `NaN`, `undefined` or
`Infinity` to the screen. There is a guard in `format()`, a finite check on every
result, a range check on number literals, and a `checkDims` on every operation
that produces dimensions. Fuzzing enforces it.

---

## 6. Later requests, in order

1. **"save it to github and push it as a new repo"** — public repo, MIT added
   later. Chose public after asking; name `si-calculator`.
2. **"add it to github pages"** — Pages serves `main` from the repo root. The
   user suggested `.nojekyll`, which is correct: it makes Pages serve files
   verbatim instead of running Jekyll over them.
3. **"lets make it a little more explicit what we have parsed by rendering the
   full equation in addition to the answer"** — added the equation line. This
   was a direct response to the mixed-radix ambiguity in §3: showing
   `1 h · 2 m = 7200 m·s` next to `2 h + 30 min = 2.5 h` makes the rule visible
   instead of requiring it to be memorised.
4. **"add mit liscence and add the test suit to the github actions"** — MIT
   (Copyright 2026 Peter Hindes) plus `.github/workflows/tests.yml` running the
   suite on Node 20/22/24 with `permissions: contents: read`.

---

## 6b. Later still

5. **"create a full wiki on the tool and log the intent trace from this chat for
   future agents"** — eight pages under `wiki/`, kept in the repository as the
   source of truth (a GitHub wiki is a separate repository, and its git remote
   cannot be created headlessly — GitHub reserves the `.wiki` name and the API
   needs a token scope the CLI does not have, so it needs one manual click before
   it can be pushed to). The unit and function tables were drafted by a
   subagent and every example in them machine-checked against the engine.
6. **"add some physics constants like epsilon naight, with a focus on
   electrican engineering"** — added `Z0`, `Y0`, `emratio`, `phi0`, `RK`, `KJ`,
   `muB`, `alpha`, `lambda_c`, `echarge`; thermal `c2`, `bWien`, `triple`; and
   material reference values `rho_cu`, `rho_al`, `rho_ag`, `sigma_cu`,
   `eps_si`, `eps_al2o3`, `Eg_si`, explicitly labelled as approximate.
   Two of my own dimension vectors were wrong (`muB` had a stray kilogram,
   `emratio` a stray metre) and were caught by computing with them, not by
   reading them. Material values are approximations at 20 °C and the wiki says
   so.
7. **"add a constants picker; with hotkeys for common ones"** — a grouped chips
   strip, `Ctrl`/`⌘`+`K` opening a filterable palette over every constant and
   function, and `Alt`/`⌥`+letter for the common ones. Letter keys already
   owned by `Ctrl` (copy, paste, view-source, browser menus) are deliberately
   unused so no shortcut is hijacked; the palette is the reliable path.
8. **"the subagent might be going overboard"** — agreed, and the reference
   pages were trimmed to tables plus a short orientation. The engine bugs that
   the review surfaced were triaged rather than fixed wholesale: six were real
   and fixed, the rest were documented as deliberate or cosmetic.

---

## 7. Invariants a future change must not break

1. `1m + 1s` stays an error. Relaxing dimension checking destroys the entire
   value proposition.
2. `1/2m` keeps meaning `0.5 m⁻¹`. Changing this breaks `100km/2h` and
   `E/mc^2`, which are used far more often.
3. Mixed radix stays restricted to matching dimensions (§3). Making it general
   would silently turn `1h 2m` into 3602 s.
4. `h` stays the hour. Planck's constant is `planck`. A "helpful" swap here
   would break `2h 30min`, the most common timing expression there is.
5. Nothing reaches the screen as `NaN`, `undefined` or `Infinity`.
6. No dependencies, no build step. The page must work from `file://`.
7. `evaluate()` never mutates a quantity it was given, and no cache may make a
   symbol resolve differently depending on evaluation history (§5).
8. A constant added to `units.js` needs a **correct dimension vector**, verified
   by using it in a real calculation rather than by reading it. Two of the
   twenty added here were wrong on the first pass.
9. Keyboard shortcuts must not take a key combination away from the browser or
   the OS. The picker only claims `Alt`/`⌥`+letter.

---

## 8. Open questions

- **Should the engine be a library?** `units.js` + `engine.js` are deliberately
  DOM-free and already run under Node; a package export would be a small change.
  Not asked for, so not done.
- **Licence.** MIT was applied without discussion. If the intent was something
  else (or no licence), change `LICENSE` — it is the only legal text in the
  project.
- **The `.wiki` bootstrap.** The GitHub wiki needs one manual click before it
  can be pushed to; see the README's wiki section. The page sources live in
  `wiki/` in this repo so nothing is trapped in the wiki's separate repository.
- **`1..2` parses as `1^0.2`.** Defensible under the exponent-shorthand rule,
  arguably wrong. Currently left alone deliberately; a fix would need to decide
  what `1..2` should mean.
