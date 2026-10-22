// Skill: Factoring quadratics (Algebra II)
import { randInt, pick, nonzero, parse, evaluate, toTex, gcd } from '../../math.js?v=2.2';

export const skill = {
  id: 'factoring',
  course: ['accel', 'honors'],
  title: 'Factoring Quadratics',
  group: 'Factoring',
  blurb: 'Factor trinomials completely, including special products.',
  levels: {
    1: { name: 'Easy', desc: 'Leading coefficient 1, like x² + 5x + 6' },
    2: { name: 'Medium', desc: 'Prime leading coefficient, plus difference of squares and perfect square trinomials' },
    3: { name: 'Challenging', desc: 'Leading coefficient that is not prime, like 6x² + 7x − 20' },
  },
  generate(level, rng) {
    if (level === 1) return monic(rng);
    if (level === 2) return pick(rng, [primeLead, primeLead, diffSquares, perfectSquare])(rng);
    return compositeLead(rng);
  },
};

// ---------- display helpers ----------
const sgn = (n, first = false) => (n < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ');
function polyTex(a, b, c) {
  const t2 = `${a === 1 ? '' : a === -1 ? '-' : a}x^2`;
  const t1 = b === 0 ? '' : `${sgn(b)}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  const t0 = c === 0 ? '' : `${sgn(c)}${Math.abs(c)}`;
  return t2 + t1 + t0;
}
// (m x + p)
function linTex(m, p) {
  return `(${m === 1 ? '' : m}x${sgn(p)}${Math.abs(p)})`;
}
const term = (n, x = 'x') => `${n === 1 ? '' : n === -1 ? '-' : n}${x}`;

// ---------- checker ----------
// Accepts any complete factorization into integer linear factors (order, signs and
// (x+3)^2 vs (x+3)(x+3) are all fine). Explains when an answer is equal but not factored.
function makeChecker(A, B, C) {
  const target = x => A * x * x + B * x + C;
  return str => {
    const s = String(str).replace(/[−–]/g, '-').trim();
    if (!s) return { ok: false, msg: 'Enter the factored form, like (2x + 3)(x - 4).', format: true };
    let tree;
    try { tree = parse(s); } catch (e) { return { ok: false, msg: 'Could not read that. Example: (2x + 3)(x - 4)', format: true }; }
    const vars = new Set(); (function walk(n) { if (n.v) vars.add(n.v); if (n.a) walk(n.a); if (n.b) walk(n.b); })(tree);
    for (const v of vars) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const f = x => evaluate(tree, { x });
    const samples = [-3, -1.5, -1, 0, 0.5, 1, 2, 3.7];
    const equal = samples.every(x => Math.abs(f(x) - target(x)) < 1e-6 * Math.max(1, Math.abs(target(x))));
    if (!equal) return { ok: false };
    // Flatten the top-level product
    const factors = [];
    let constant = 1, okStructure = true;
    (function flat(n) {
      if (n.op === 'paren') return flat(n.a);
      if (n.op === '*') { flat(n.a); flat(n.b); return; }
      if (n.op === 'neg') { constant *= -1; return flat(n.a); }
      if (n.op === '^' && n.b.num !== undefined && Number.isInteger(+n.b.num) && +n.b.num >= 1) {
        for (let i = 0; i < +n.b.num; i++) flat(n.a);
        return;
      }
      factors.push(n);
    })(tree);
    let degreeTwoFactor = false;
    for (const n of factors) {
      const g = x => evaluate(n, { x });
      const f0 = g(0), f1 = g(1), f2 = g(2);
      if (Math.abs(f2 - 2 * f1 + f0) > 1e-9) { degreeTwoFactor = true; okStructure = false; continue; }
      const a = f1 - f0, b = f0;
      if (Math.abs(a) < 1e-12) { constant *= b; continue; }
      if (!Number.isInteger(a) || !Number.isInteger(b)) { okStructure = false; continue; }
      if (gcd(a, b) !== 1) okStructure = false;
    }
    if (degreeTwoFactor) return { ok: false, msg: 'That is equal to the original, but it is not completely factored yet.', format: true };
    if (!okStructure || Math.abs(Math.abs(constant) - 1) > 1e-9) return { ok: false, msg: 'That is equal to the original, but write it as a product of factors like (2x + 3)(x - 4), with no common factor left inside a parenthesis.', format: true };
    return { ok: true };
  };
}
const preview = str => { try { const s = String(str).trim(); return s ? toTex(parse(s.replace(/[−–]/g, '-'))) : ''; } catch { return null; } };
const KEYS = ['(', ')', '^2'];

function problem({ A, B, C, tag, answerTex, solution }) {
  return {
    tag,
    prompt: `Factor completely: $\\;${polyTex(A, B, C)}$`,
    parts: [{
      type: 'custom', label: 'Factored form', check: makeChecker(A, B, C), preview, keys: KEYS,
      placeholder: 'e.g. (2x + 3)(x - 4)', answerTex: `$${answerTex}$`,
      help: 'Type a product of factors. (x + 3)^2 and (x + 3)(x + 3) both work.',
    }],
    solution,
  };
}

// ---------- Level 1: x^2 + bx + c ----------
function monic(rng) {
  let p, q;
  do { p = nonzero(rng, -12, 12); q = nonzero(rng, -12, 12); } while (p + q === 0 || Math.abs(p * q) > 99);
  const B = p + q, C = p * q;
  const ans = p === q ? `${linTex(1, p)}^2` : `${linTex(1, p)}${linTex(1, q)}`;
  return problem({
    A: 1, B, C, tag: 'a = 1', answerTex: ans,
    solution: `Find two numbers that multiply to $${C}$ and add to $${B}$: $${p}$ and $${q}$ (since $${p} \\cdot ${q < 0 ? `(${q})` : q} = ${C}$ and $${p} ${sgn(q).trim()} ${Math.abs(q)} = ${B}$).<br>`
      + `So $${polyTex(1, B, C)} = ${ans}$.`,
  });
}

// (m x + p)(n x + q) by grouping, explained with the ac method
function grouped(m, p, n, q, tag) {
  const A = m * n, B = m * q + n * p, C = p * q;
  const r = m * q, s = n * p; // split of the middle term
  const ans = (m === n && p === q) ? `${linTex(m, p)}^2` : `${linTex(m, p)}${linTex(n, q)}`;
  const solution =
    `Multiply $a \\cdot c = ${A} \\cdot ${C < 0 ? `(${C})` : C} = ${A * C}$. Find two numbers that multiply to $${A * C}$ and add to $${B}$: $${r}$ and $${s}$.<br>`
    + `Split the middle term: $${A === 1 ? '' : A}x^2${sgn(r)}${Math.abs(r) === 1 ? '' : Math.abs(r)}x${sgn(s)}${Math.abs(s) === 1 ? '' : Math.abs(s)}x${sgn(C)}${Math.abs(C)}$.<br>`
    + `Group and factor each pair: $${term(m)}${linTex(n, q)} ${sgn(p).trim()} ${Math.abs(p)}${linTex(n, q)}$.<br>`
    + `Factor out the common binomial: $${ans}$.`;
  return problem({ A, B, C, tag, answerTex: ans, solution });
}

// ---------- Level 2 ----------
function primeLead(rng) {
  let a, p, q;
  do {
    a = pick(rng, [2, 3, 5, 7]);
    p = nonzero(rng, -9, 9); q = nonzero(rng, -9, 9);
  } while (gcd(a, p) !== 1 || a * q + p === 0 || Math.abs(p * q) > 72);
  return grouped(a, p, 1, q, 'prime leading coefficient');
}

function diffSquares(rng) {
  let m, n;
  do { m = pick(rng, [1, 1, 2, 3, 4, 5, 6, 7]); n = randInt(rng, 1, 12); } while (gcd(m, n) !== 1 || m * m > 49 || (m === 1 && n === 1));
  const A = m * m, C = -n * n;
  const ans = `${linTex(m, -n)}${linTex(m, n)}`;
  return problem({
    A, B: 0, C, tag: 'difference of squares', answerTex: ans,
    solution: `Both terms are perfect squares with a minus between them: $${A === 1 ? '' : A}x^2 = (${term(m)})^2$ and $${n * n} = ${n}^2$.<br>`
      + `Use $u^2 - v^2 = (u - v)(u + v)$: $\\;${ans}$.`,
  });
}

function perfectSquare(rng) {
  let m, n;
  do { m = pick(rng, [1, 1, 2, 3, 4, 5]); n = nonzero(rng, -9, 9); } while (gcd(m, n) !== 1 || Math.abs(n) === 1 && m === 1);
  const A = m * m, B = 2 * m * n, C = n * n;
  const ans = `${linTex(m, n)}^2`;
  return problem({
    A, B, C, tag: 'perfect square trinomial', answerTex: ans,
    solution: `The first and last terms are perfect squares: $${A === 1 ? '' : A}x^2 = (${term(m)})^2$ and $${C} = ${Math.abs(n)}^2$.<br>`
      + `The middle term is $2 \\cdot ${term(m)} \\cdot ${Math.abs(n)} = ${Math.abs(B)}x$, ${n < 0 ? 'with a minus sign' : 'and it is positive'}, so this is a perfect square trinomial: $${ans}$.`,
  });
}

// ---------- Level 3: a > 1, not prime ----------
function compositeLead(rng) {
  let m, n, p, q;
  do {
    const a = pick(rng, [4, 6, 6, 8, 9, 10, 12, 12, 14, 15, 16, 18, 20]);
    const divs = [];
    for (let d = 1; d <= a; d++) if (a % d === 0) divs.push(d);
    const inner = divs.filter(d => d > 1 && d < a);
    m = pick(rng, rng() < 0.8 ? inner : divs); n = a / m;   // usually split a as 2·3, 4·5, ... not a·1
    p = nonzero(rng, -9, 9); q = nonzero(rng, -9, 9);
  } while (gcd(m, p) !== 1 || gcd(n, q) !== 1 || m * q + n * p === 0 || Math.abs(p * q) > 72 || (m === n && p === q));
  return grouped(m, p, n, q, 'composite leading coefficient');
}
