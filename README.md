# Math Practice

Skill practice for AP Precalculus and Algebra II at three levels: Easy, Medium and Challenging. Students choose their course when they sign in and see only that course's skills. Problems are generated from templates, so every set is new and every answer is computed exactly. Progress is logged to a Google Sheet after every problem.

Setup instructions are in [SETUP.md](SETUP.md).

## Skills

| Course | Skill | Easy | Medium | Challenging |
| --- | --- | --- | --- | --- |
| AP Precalculus | Holes, Zeros & Asymptotes | Each factor appears once | Repeated factors | Every zero, asymptote and hole |
| AP Precalculus | Leading Coefficients & Hole Values | Standard-form factors | Backwards factors like (2 - 3x) | Backwards factors with exponents |
| AP Precalculus | Arithmetic Sequences | Rule from first terms | Rule from d and one term | Rule from two terms |
| AP Precalculus | Geometric Sequences | Rule from first terms | Rule from r and one term | Rule from two terms |
| AP Precalculus | End Behavior of Exponential Functions | From a graph | From the equation, no reflection | Reflected over the asymptote |
| AP Precalculus | Exponential Models from Geometric Sequences | Starting value and rate in words | Two data points, whole-number ratio | Two data points, fractional ratio |
| AP Precalculus | Rewriting Exponentials in y = abˣ Form (a can be a fraction or negative) | One shift in the exponent | Coefficient on x or fractional exponent | Shifts with coefficients, negative exponents |
| AP Precalculus | Equivalent Forms of Geometric Rules | Pick the rule equivalent to a given rule | Match terms to a rule written from a different term | Same, with negative or fractional ratios |
| AP Precalculus | Increasing, Decreasing and Concavity of Exponentials | From a table, positive outputs | From y = abˣ, a positive or negative | Tables with negative outputs, equations with shifts |
| Accelerated + Honors | Factoring Quadratics | a = 1 | a prime, plus special products | a not prime |
| Accelerated + Honors | Solving by Factoring | a = 1 | Prime a, special products, terms on both sides | Composite a, rearranging |
| Accelerated (imaginary) / Honors (real only) | Solving by Completing the Square | Even b | Odd b, constant on the right | Divide out a |
| Accelerated (imaginary) / Honors (real only) | Solving with the Quadratic Formula | a = 1 | a other than 1 | Rearrange first |
| Honors | Simplifying Radicals | √12, √50 | Up to √150 | Coefficient in front |
| Honors | Solving with Square Roots | x² = 49 | 4x² = 64 | Radical or fraction answers |
| Accelerated | Graphing from Standard Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Accelerated | Graphing from Vertex Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Accelerated | Writing Factored Form from a Graph | a = ±1 | Whole-number a | Fractional a |
| Accelerated | Converting Standard Form to Vertex Form | a = 1, even b | a = -1 or odd b | Factor out a first |

## Files

- `index.html`, `css/style.css`: the page (`precalc/` forwards old links here)
- `js/app.js`: sign-in, practice flow, results and logging
- `js/math.js`: exact fractions, expression parser, answer checking
- `js/graph.js`: clickable coordinate grid and display graphs
- `js/skills/precalc/`, `js/skills/alg2/`: skill files; each exports `generate(level, rng)` and lists its courses (`precalc`, `accel`, `honors`)
- `js/skills/alg2/solveutil.js`: exact roots and checking of answers like (3 ± 2√5)/2
- `js/config.js`: courses, teachers, blocks, Sheet URL, set length
- `apps-script/Code.gs`: the Google Sheet logger
- `tests/check.mjs`: run `node tests/check.mjs` to test every skill's answers
- `tools/set_version.py`: stamps a version on files so browsers load updates right away
- `vendor/katex/`: math rendering (KaTeX, MIT license)

Seasonal word problems: the exponential models skill picks its stories by date. October uses Halloween stories, November 1 through January 1 uses Thanksgiving and Christmas stories, and the rest of the year uses school-life stories. The story lists are at the top of `js/skills/precalc/exp-models.js`.
