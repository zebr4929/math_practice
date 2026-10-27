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
| AP Precalculus | 2.5 Exponential Data with a Vertical Shift | x from 0, whole-number base | Growth or decay, a can be negative | x not from 0, fractional bases |
| AP Precalculus | 2.5 Percent Growth and Decay with Changing Units | Model given, values in two units | Write the model, values in two units | Rewrite the model in other units |
| AP Precalculus | 2.7 Composition as an Expression | Linear and linear | Linear and quadratic | Square roots and rational functions |
| AP Precalculus | 2.7 Composition with Multiple Representations | Table and equation | Graph, table, equation | Graph, table, piecewise, verbal; longer chains |
| AP Precalculus | 2.8 Inverses from a Table | Read inverse values | Is the inverse a function? | Inverse of an inverse value |
| AP Precalculus | 2.8 Graphing Inverses | Points | Segmented one-to-one graph | Graphs that may not be one-to-one |
| AP Precalculus | 2.8 Finding Inverses Algebraically | Linear | Linear with fractions | Rational (ax + b)/(cx + d) |
| AP Precalculus | 2.9 Exponential and Logarithmic Form | Exponential to log, numbers | Log to exponential, log/ln/variables | Both directions, negative and fractional exponents |
| AP Precalculus | 2.9 Evaluating Logarithms | Whole-number answers | Zero and negative answers | Fractional answers |
| AP Precalculus | 2.9 Plotting on a Logarithmic Scale | Gridline values | Four decades, values below 1 | Values between gridlines, half-unit x |
| Accelerated + Honors | Factoring Quadratics | a = 1 | a prime, plus special products | a not prime |
| Accelerated + Honors | Solving by Factoring | a = 1 | Prime a, special products, terms on both sides | Composite a, rearranging |
| Accelerated (imaginary) / Honors (real only) | Solving by Completing the Square | Even b | Odd b, constant on the right | Divide out a |
| Accelerated (imaginary) / Honors (real only) | Solving with the Quadratic Formula | a = 1 | a other than 1 | Rearrange first |
| Honors | Simplifying Radicals | √12, √50 | Up to √150 | Coefficient in front |
| Honors | Solving with Square Roots | x² = 49 | 4x² = 64 | Radical or fraction answers |
| Accelerated | Graphing from Standard Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Accelerated | Graphing from Vertex Form (click 7 points) | a = 1 | a = ±1 | a = ±2, ±1/2, ±3 |
| Accelerated | Writing Factored Form from a Graph | a = ±1 | Whole-number a | Fractional a |
| Accelerated | Writing Factored Form from a Table or Points | Table, a = ±1 | Three points, whole-number a | Word-problem tables (seasonal), or a fractional zero |
| Accelerated | Converting Standard Form to Vertex Form (also asks for the vertex) | a = 1, even b | a = -1 or odd b | Factor out a first |
| Accelerated | Converting Vertex Form to Standard Form | a = 1 | Whole-number a | Fractional a |
| Accelerated | Maximum or Minimum Value | From vertex form | Standard form, whole numbers | Standard form, fractions |
| Accelerated | Domain and Range of Quadratics | From vertex form | Standard form, whole numbers | Standard form, fractions |
| Accelerated | 2.1 Square Roots of Negative Numbers | Perfect squares | Simplify the radical | Combine with other terms |
| Accelerated | 2.1 Powers of i | One power | Products | Sums and differences |
| Accelerated | 2.2 Operations with Complex Numbers | Add and subtract | Multiply, conjugates | Divide |
| Accelerated | 2.4 Completing a Perfect Square Trinomial | Even b | Odd b | Fractional b |
| Accelerated | 2.5 The Discriminant | Standard form | Rearrange first | Find k (one real / two complex) |
| Accelerated | 2.7 Finding Coefficients from the Solutions | Find b or c | a other than 1, find b and c | One solution given |
| Accelerated | 2.8 Writing Vertex Form from the Vertex and a Point | a = ±1 | Whole-number a | Fractional a |
| Accelerated | 2.8 Intervals of Increasing and Decreasing | From a graph | Vertex form | Standard form |
| Accelerated | 2.9 Projectile Problems | Start and maximum | Maximum and landing | Landing (formula) and heights |
| Accelerated | 2.10 Equations of Circles | From center and radius | Read center/radius, graphs, tangent | Complete the square |

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

Home page sections (AP Precalculus): each skill file sets `group` (the section) and `lesson` (the AP topic number shown on the card). In `js/config.js`, `collapsible: true` turns on the open/close sections for a course, and `openSections` lists the sections that start open for students who have not opened or closed any yet. Update it as the year moves on.

Calculator answers (2.5 percent and units problems) accept values rounded or truncated to 3 decimal places.

Accelerated Algebra II uses the same open/close sections (Unit 2 - Complex Numbers, Solving Quadratics, Quadratic Functions and Graphs, Applications and Circles). Skills shared with Honors set `group` and `lesson` per course, like `group: { accel: '...', honors: '...' }`, so the Honors page is unchanged. Factoring Quadratics shows Accelerated students two extra Medium patterns (121x² − 16y² and 49 − 64x²).
