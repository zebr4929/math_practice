// Solving quadratics: square roots, factoring, completing the square, quadratic formula,
// plus simplifying radicals. Honors versions never produce imaginary answers.
import { F, Frac, randInt, pick, nonzero, gcd } from '../../math.js?v=2.0';
import {
  exactRoots, rootsTex, solutionChecker, solutionsPreview, splitSquare, eqTex, sideTex, arrange,
  SOLVE_KEYS, SOLVE_KEYS_REAL, simplifyIssue, readSolutions,
} from './solveutil.js?v=2.0';

const LIST_HELP = 'Separate solutions with commas, or use ± (type +-). Type sqrt for √.';
const lin = (m, p) => `(${m === 1 ? '' : m === -1 ? '-' : m}x ${p < 0 ? '-' : '+'} ${Math.abs(p)})`;   // (mx + p)
const sq = n => n * n;

function solveProblem({ tag, prompt, R, allowImag, solution, help }) {
  return {
    tag, prompt,
    parts: [{
      type: 'custom', label: 'Solutions', check: solutionChecker(R, { allowImag }), preview: solutionsPreview,
      keys: allowImag ? SOLVE_KEYS : SOLVE_KEYS_REAL, placeholder: 'e.g. 3, -1/2   or   2 ± √5',
      answerTex: `$${rootsTex(R)}$`, help: help || LIST_HELP,
    }],
    solution,
    _check: { R },
  };
}

// ============ 1. Solving by square roots (Honors) ============
export const solveSqrt = {
  id: 'solve-sqrt',
  course: ['honors'],
  title: 'Solving Quadratics with Square Roots',
  group: 'Solving quadratics',
  blurb: 'Isolate x², then take the square root of both sides. Remember ±.',
  levels: {
    1: { name: 'Easy', desc: 'Like x² − 121 = 0 or x² = 49' },
    2: { name: 'Medium', desc: 'A coefficient on x², like 4x² = 64 or 3x² − 75 = 0' },
    3: { name: 'Challenging', desc: 'Answers with simplified radicals or fractions, like x² = 48' },
  },
  generate(level, rng) {
    let a, val;                                   // a·x² = a·val  → x² = val
    if (level === 1) { a = 1; val = F(sq(randInt(rng, 2, 15))); }
    else if (level === 2) { a = pick(rng, [2, 3, 4, 5, 6, 9]); val = F(sq(randInt(rng, 1, 10))); }
    else if (rng() < 0.6) { a = pick(rng, [1, 1, 2, 3, 4]); const k = randInt(rng, 2, 6), r = pick(rng, [2, 3, 5, 6, 7]); val = F(k * k * r); if (a * val.n > 200) val = F(4 * r); }
    else { const p = randInt(rng, 1, 9), q = pick(rng, [2, 3, 4, 5, 6, 7]); if (gcd(p, q) !== 1) return this.generate(level, rng); a = q * q; val = F(p * p, q * q); }
    const rhs = val.mul(a);                       // a·x² = rhs (integer)
    const style = pick(rng, ['equals', 'minus', 'plus']);
    let L, R;
    if (style === 'equals') { L = { x2: a }; R = { x0: rhs.n }; }
    else if (style === 'minus') { L = { x2: a, x0: -rhs.n }; R = {}; }
    else { const e = randInt(rng, -12, 12); L = { x2: a, x0: e }; R = { x0: rhs.n + e }; }
    const roots = exactRoots(a, 0, -rhs.n);
    const steps = [];
    if (style !== 'equals') steps.push(`Isolate the $x^2$ term: $${a === 1 ? '' : a}x^2 = ${rhs.n}$.`);
    if (a !== 1) steps.push(`Divide both sides by $${a}$: $x^2 = ${val.tex()}$.`);
    const { k, r } = splitSquare(val.n);
    const den = Math.round(Math.sqrt(val.d));
    let rootText;
    if (val.d > 1) rootText = `\\pm\\sqrt{${val.tex()}} = \\pm\\dfrac{\\sqrt{${val.n}}}{\\sqrt{${val.d}}} = \\pm\\dfrac{${k}}{${den}}`;
    else if (r === 1) rootText = `\\pm\\sqrt{${val.n}} = \\pm ${k}`;
    else rootText = `\\pm\\sqrt{${val.n}} = \\pm\\sqrt{${k * k}}\\cdot\\sqrt{${r}} = \\pm ${k === 1 ? '' : k}\\sqrt{${r}}`;
    steps.push(`Take the square root of both sides, remembering both signs: $x = ${rootText}$.`);
    steps.push(`$${rootsTex(roots)}$`);
    return solveProblem({
      tag: level === 1 ? 'x² = perfect square' : level === 2 ? 'coefficient on x²' : (val.d > 1 ? 'fraction answer' : 'radical answer'),
      prompt: `Solve: $\\;${eqTex(L, R)}$`, R: roots, allowImag: false, solution: steps.join('<br>'),
    });
  },
};

// ============ 2. Simplifying radicals (Honors) ============
export const simplifyRadicals = {
  id: 'simplify-radicals',
  course: ['honors'],
  title: 'Simplifying Radicals',
  group: 'Solving quadratics',
  blurb: 'Pull the largest perfect square out of the radical.',
  levels: {
    1: { name: 'Easy', desc: 'Like √12, √18, √50' },
    2: { name: 'Medium', desc: 'Larger numbers, like √72 or √98' },
    3: { name: 'Challenging', desc: 'A number in front to multiply by, like 3√20' },
  },
  generate(level, rng) {
    let c = 1, k, r, n;
    for (let t = 0; t < 200; t++) {
      if (level === 1) { k = randInt(rng, 2, 5); r = pick(rng, [2, 3, 5, 6, 7]); }
      else if (level === 2) { k = randInt(rng, 2, 7); r = pick(rng, [2, 3, 5, 6, 7, 10, 11, 13, 14, 15]); }
      else { k = randInt(rng, 2, 5); r = pick(rng, [2, 3, 5, 6, 7, 10]); c = randInt(rng, 2, 6) * (rng() < 0.25 ? -1 : 1); }
      n = k * k * r;
      if ((level === 1 && n <= 75) || (level === 2 && n <= 150 && n > 20) || (level === 3 && n <= 98)) break;
    }
    const outC = c * k;
    const ans = `${outC === 1 ? '' : outC === -1 ? '-' : outC}\\sqrt{${r}}`;
    const target = outC * Math.sqrt(r);
    const check = str => {
      const s = String(str).replace(/[−–]/g, '-').replace(/sqrt/gi, '√').replace(/\s+/g, '').replace(/\*/g, '').replace(/√\((\d+)\)/g, '√$1');
      if (!s) return { ok: false, msg: 'Enter the simplified radical, like 4√3.', format: true };
      const got = readSolutions(s);
      if (got.error || got.values.length !== 1) return { ok: false, msg: 'Write it like 4√3. Type sqrt for √.', format: true };
      const v = got.values[0];
      if (Math.abs(v[1]) > 1e-9 || Math.abs(v[0] - target) > 1e-9 * Math.max(1, Math.abs(target))) return { ok: false };
      const issue = simplifyIssue(got.trees[0], { allowImag: false });
      if (issue) return { ok: false, msg: 'That is equal, but ' + issue.charAt(0).toLowerCase() + issue.slice(1) };
      if (!/^-?\d*√\d+$/.test(s)) return { ok: false, msg: 'That is equal, but write it as one number times one radical, like 6√5.' };
      return { ok: true };
    };
    const prompt = c === 1 ? `Simplify: $\\;\\sqrt{${n}}$` : `Simplify: $\\;${c === -1 ? '-' : c}\\sqrt{${n}}$`;
    let sol = `The largest perfect square that divides $${n}$ is $${k * k}$: $\\;\\sqrt{${n}} = \\sqrt{${k * k}}\\cdot\\sqrt{${r}} = ${k}\\sqrt{${r}}$.`;
    if (c !== 1) sol += `<br>Multiply by the $${c}$ in front: $${c}\\cdot ${k}\\sqrt{${r}} = ${ans}$.`;
    return {
      tag: level === 3 ? 'coefficient in front' : 'simplify √n',
      prompt,
      parts: [{ type: 'custom', label: 'Simplified', check, preview: solutionsPreview, keys: ['√'], placeholder: 'e.g. 4√3', answerTex: `$${ans}$`, help: 'Type sqrt or use the √ button.' }],
      solution: sol,
      _check: { n, c, outC, r },
    };
  },
};

// ============ 3. Solving by factoring (both) ============
export const solveFactoring = {
  id: 'solve-factoring',
  course: ['accel', 'honors'],
  title: 'Solving Quadratics by Factoring',
  group: 'Solving quadratics',
  blurb: 'Get 0 on one side, factor, then set each factor equal to 0.',
  levels: {
    1: { name: 'Easy', desc: 'x² + bx + c = 0' },
    2: { name: 'Medium', desc: 'Prime leading coefficient, special products, or terms on both sides' },
    3: { name: 'Challenging', desc: 'Leading coefficient that is not prime, often with terms to move first' },
  },
  generate(level, rng) {
    let m, p, n, q, g = 1, kind;
    for (let t = 0; t < 300; t++) {
      if (level === 1) { m = 1; n = 1; p = nonzero(rng, -10, 10); q = nonzero(rng, -10, 10); kind = 'a = 1'; }
      else if (level === 2) {
        const v = pick(rng, ['prime', 'prime', 'diff', 'square', 'gcfx']);
        kind = v;
        if (v === 'prime') { m = pick(rng, [2, 3, 5, 7]); n = 1; p = nonzero(rng, -9, 9); q = nonzero(rng, -9, 9); }
        else if (v === 'diff') { m = n = pick(rng, [1, 2, 3, 4, 5]); p = randInt(rng, 1, 10); q = -p; }
        else if (v === 'square') { m = n = pick(rng, [1, 2, 3]); p = q = nonzero(rng, -9, 9); }
        else { m = 1; n = pick(rng, [1, 2, 3]); p = 0; q = nonzero(rng, -9, 9); }  // x(nx + q)
      } else {
        const a = pick(rng, [4, 6, 6, 8, 9, 10, 12, 15]);
        const divs = []; for (let d = 2; d < a; d++) if (a % d === 0) divs.push(d);
        m = pick(rng, divs); n = a / m; p = nonzero(rng, -9, 9); q = nonzero(rng, -9, 9); kind = 'composite a';
        if (rng() < 0.2) { g = pick(rng, [2, 3]); m = 1; n = pick(rng, [1, 2]); kind = 'common factor'; }
      }
      if ((p !== 0 && gcd(m, p) !== 1) || gcd(n, q) !== 1) continue;
      if (m * q + n * p === 0 && kind !== 'diff') continue;
      if (Math.abs(p * q * g) > 90) continue;
      break;
    }
    const a = g * m * n, b = g * (m * q + n * p), c = g * p * q;
    const roots = exactRoots(a, b, c);
    const style = level === 1 ? 'standard' : pick(rng, level === 2 ? ['standard', 'standard', 'constRight', 'linearRight'] : ['standard', 'constRight', 'linearRight', 'mixed']);
    const { L, R } = arrange(a, b, c, rng, c === 0 && style === 'constRight' ? 'linearRight' : style);
    const std = eqTex({ x2: a, x1: b, x0: c }, {});
    const f1 = p === 0 ? (m === 1 ? 'x' : `${m}x`) : lin(m, p), f2 = lin(n, q);
    const fact = `${g === 1 ? '' : g}${f1}${p === q && m === n ? '^2' : f2}`;
    const z = (mm, pp) => (pp === 0 ? `${mm === 1 ? '' : mm}x = 0 \\Rightarrow x = 0` : `${f1 === lin(mm, pp) ? f1 : lin(mm, pp)} = 0 \\Rightarrow x = ${F(-pp, mm).tex()}`);
    const steps = [];
    if (style !== 'standard') steps.push(`Move everything to one side: $${std}$.`);
    steps.push(`Factor: $${fact} = 0$.`);
    steps.push(m === n && p === q ? `The repeated factor gives one solution: $${z(m, p)}$.` : `Set each factor equal to 0: $${z(m, p)}$ and $${z(n, q)}$.`);
    return solveProblem({ tag: kind, prompt: `Solve by factoring: $\\;${eqTex(L, R)}$`, R: roots, allowImag: false, solution: steps.join('<br>') });
  },
};

// ============ 4. Completing the square (both; Accelerated may be imaginary) ============
function ctsSkill(variant) {
  const imag = variant === 'accel';
  return {
    id: 'solve-cts-' + variant,
    course: [variant],
    title: 'Solving Quadratics by Completing the Square',
    group: 'Solving quadratics',
    blurb: imag ? 'Complete the square, then take square roots. Some answers are imaginary.' : 'Complete the square, then take square roots.',
    levels: {
      1: { name: 'Easy', desc: 'x² + bx + c = 0 with an even b' },
      2: { name: 'Medium', desc: 'Odd b (fractions), or the constant already on the right' + (imag ? '; some imaginary' : '') },
      3: { name: 'Challenging', desc: 'Leading coefficient other than 1: divide it out first' + (imag ? '; some imaginary' : '') },
    },
    generate(level, rng) {
      for (let t = 0; t < 500; t++) {
        let a = 1, b, c;
        if (level === 1) b = 2 * nonzero(rng, -6, 6);
        else if (level === 2) b = rng() < 0.55 ? pick(rng, [-7, -5, -3, -1, 1, 3, 5, 7]) : 2 * nonzero(rng, -6, 6);
        else { a = pick(rng, [2, 3, 4, 5, -2]); b = a * 2 * nonzero(rng, -4, 4); }
        c = randInt(rng, -20, 20);
        if (c === 0) continue;
        const R = exactRoots(a, b, c);
        if (R.D === 0) continue;
        const wantImag = imag && level >= 2 && rng() < 0.35;
        if (R.im !== wantImag) continue;
        if (!imag && R.im) continue;
        if (!R.rational && (R.B * R.B * R.r > 200)) continue;
        if (level === 1 && rng() < 0.6 && R.rational) continue;   // mostly irrational answers at Easy
        const style = level === 1 ? 'standard' : pick(rng, level === 2 ? ['standard', 'constRight', 'constRight'] : ['standard', 'constRight']);
        const { L, R: Rt } = arrange(a, b, c, rng, style);
        return solveProblem({
          tag: (level === 3 ? 'divide out a' : level === 2 && b % 2 ? 'odd b' : 'even b') + (R.im ? ', imaginary' : ''),
          prompt: `Solve by completing the square: $\\;${eqTex(L, Rt)}$`,
          R, allowImag: imag, solution: ctsSteps(a, b, c, R),
        });
      }
      throw new Error('cts: could not build');
    },
  };
}

function ctsSteps(a, b, c, R) {
  const steps = [];
  const bb = F(b, a), cc = F(-c, a);
  steps.push(`Get the constant on the right: $${sideTex({ x2: a, x1: b })} = ${-c}$.`);
  if (a !== 1) steps.push(`Divide every term by $${a}$: $x^2 ${bb.sign() < 0 ? '-' : '+'} ${bb.abs().eq(1) ? '' : bb.abs().tex()}x = ${cc.tex()}$.`);
  const h = bb.div(2), h2 = h.mul(h), rhs = cc.add(h2);
  steps.push(`Half of $${bb.tex()}$ is $${h.tex()}$; square it: $${h2.tex()}$. Add $${h2.tex()}$ to both sides: $x^2 ${bb.sign() < 0 ? '-' : '+'} ${bb.abs().eq(1) ? '' : bb.abs().tex()}x + ${h2.tex()} = ${rhs.tex()}$.`);
  steps.push(`Write the left side as a square: $\\left(x ${h.sign() < 0 ? '-' : '+'} ${h.abs().tex()}\\right)^2 = ${rhs.tex()}$.`);
  steps.push(`Take the square root of both sides: $x ${h.sign() < 0 ? '-' : '+'} ${h.abs().tex()} = \\pm\\sqrt{${rhs.tex()}}$${rhs.sign() < 0 ? ' (a negative under the radical gives $i$)' : ''}.`);
  // simplify ±√(p/q): rationalize, pull out squares, reduce
  const P = Math.abs(rhs.n), Q = rhs.d, iT = rhs.sign() < 0 ? 'i' : '';
  const { k: kk, r: rr } = splitSquare(P * Q);
  const g2 = gcd(kk, Q), num = kk / g2, den = Q / g2;
  const radPart = `${num === 1 && rr !== 1 ? '' : num}${iT}${rr === 1 ? '' : `\\sqrt{${rr}}`}`;
  const simp = den === 1 ? radPart : `\\dfrac{${radPart}}{${den}}`;
  if (Q > 1 && splitSquare(Q).r !== 1) steps.push(`Rationalize: $\\sqrt{${rhs.abs().tex()}} = \\dfrac{\\sqrt{${P}}\\cdot\\sqrt{${Q}}}{${Q}} = \\dfrac{\\sqrt{${P * Q}}}{${Q}}${simp === `\\dfrac{\\sqrt{${P * Q}}}{${Q}}` ? '' : ` = ${simp}`}$${iT ? ', and with the negative it becomes this times $i$' : ''}.`);
  else if (simp !== `\\sqrt{${P}}` || iT) steps.push(`Simplify: $\\sqrt{${rhs.tex()}} = ${simp}$.`);
  const direct = `x = ${h.neg().tex()} \\pm ${simp}`;
  if (R.rational || (den === 1 && h.isInt())) steps.push(`Solve for $x$: $${R.rational ? `${direct}$, so $${rootsTex(R)}` : rootsTex(R)}$.`);
  else steps.push(`Solve for $x$: $${direct}$, then write it over one denominator: $${rootsTex(R)}$.`);
  return steps.join('<br>');
}

export const ctsAccel = ctsSkill('accel');
export const ctsHonors = ctsSkill('honors');

// ============ 5. Quadratic formula (both; Accelerated may be imaginary) ============
function formulaSkill(variant) {
  const imag = variant === 'accel';
  return {
    id: 'solve-formula-' + variant,
    course: [variant],
    title: 'Solving Quadratics with the Quadratic Formula',
    group: 'Solving quadratics',
    blurb: imag ? 'Use the formula, simplify the radical, then reduce. Some answers are imaginary.' : 'Use the formula, simplify the radical, then reduce.',
    levels: {
      1: { name: 'Easy', desc: 'a = 1, already set equal to 0' },
      2: { name: 'Medium', desc: 'a other than 1; answers that reduce' + (imag ? '; some imaginary' : '') },
      3: { name: 'Challenging', desc: 'Rearrange first, then use the formula' + (imag ? '; some imaginary' : '') },
    },
    generate(level, rng) {
      for (let t = 0; t < 800; t++) {
        const a = level === 1 ? 1 : pick(rng, [2, 3, 4, 5, 6, -2, -3]);
        const b = nonzero(rng, -12, 12), c = nonzero(rng, -15, 15);
        const R = exactRoots(a, b, c);
        if (R.D === 0) continue;
        const wantImag = imag && level >= 2 && rng() < 0.4;
        if (R.im !== wantImag) continue;
        if (!imag && R.im) continue;
        if (Math.abs(R.D) > 300) continue;
        if (!R.rational && R.g === 1 && rng() < 0.7 && level >= 2) continue;   // prefer answers that reduce
        if (R.rational && rng() < 0.75) continue;                                // prefer radical answers
        const style = level < 3 ? 'standard' : pick(rng, ['constRight', 'linearRight', 'mixed']);
        const { L, R: Rt } = arrange(a, b, c, rng, style);
        const steps = [];
        if (style !== 'standard') steps.push(`Move everything to one side: $${eqTex({ x2: a, x1: b, x0: c }, {})}$.`);
        steps.push(`$a = ${a}$, $b = ${b}$, $c = ${c}$.`);
        steps.push(`$x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} = \\dfrac{${-b} \\pm \\sqrt{${b * b} - ${4 * a * c < 0 ? `(${4 * a * c})` : 4 * a * c}}}{${2 * a}} = \\dfrac{${-b} \\pm \\sqrt{${R.D}}}{${2 * a}}$.`);
        if (!R.rational) {
          const { k, r } = splitSquare(Math.abs(R.D));
          if (k > 1 || R.im) steps.push(`Simplify the radical: $\\sqrt{${R.D}} = ${k === 1 && r !== 1 ? '' : k}${R.im ? 'i' : ''}${r === 1 ? '' : `\\sqrt{${r}}`}$.`);
          if (a < 0) steps.push(`The denominator is negative, so multiply the top and bottom by $-1$ (the $\\pm$ stays $\\pm$).`);
          if (R.g > 1) steps.push(`Every term on top and the bottom share a factor of $${R.g}$; divide it out.`);
        }
        steps.push(`$${rootsTex(R)}$`);
        return solveProblem({
          tag: (R.rational ? 'rational answers' : 'radical answers') + (R.im ? ', imaginary' : ''),
          prompt: `Solve using the quadratic formula: $\\;${eqTex(L, Rt)}$`,
          R, allowImag: imag, solution: steps.join('<br>'),
        });
      }
      throw new Error('formula: could not build');
    },
  };
}
export const formulaAccel = formulaSkill('accel');
export const formulaHonors = formulaSkill('honors');
