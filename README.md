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
| Algebra II | Factoring Quadratics | a = 1 | a prime, plus difference of squares and perfect square trinomials | a not prime |
| Algebra II | Simplifying Quadratic Formula Answers | Real, divides evenly | Real, reduces to a smaller fraction | Imaginary |
| Algebra II | Graphing from Standard Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Algebra II | Graphing from Vertex Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Algebra II | Writing Factored Form from a Graph | a = ±1 | Whole-number a | Fractional a |
| Algebra II | Converting Standard Form to Vertex Form | a = 1, even b | a = -1 or odd b | Factor out a first |

## Files

- `index.html`, `css/style.css`: the page (`precalc/` forwards old links here)
- `js/app.js`: sign-in, practice flow, results and logging
- `js/math.js`: exact fractions, expression parser, answer checking
- `js/graph.js`: clickable coordinate grid and display graphs
- `js/skills/precalc/`, `js/skills/alg2/`: one file per skill; each exports `generate(level, rng)` and names its `course`
- `js/config.js`: courses, teachers, blocks, Sheet URL, set length
- `apps-script/Code.gs`: the Google Sheet logger
- `tests/check.mjs`: run `node tests/check.mjs` to test every skill's answers
- `tools/set_version.py`: stamps a version on files so browsers load updates right away
- `vendor/katex/`: math rendering (KaTeX, MIT license)
