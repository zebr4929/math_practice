// Accelerated Algebra II, 2.4 and 2.5:
//  1. Completing a perfect square trinomial (find c, write the binomial squared)
//  2. The discriminant: number and type of solutions, and finding k
import { F, randInt, pick, nonzero, parse, evaluate, toTex, checkList, gcd } from '../../math.js?v=2.4';
import { readComplex, splitSquare } from './solveutil.js?v=2.4';

const GROUP = 'Unit 2 - Solving Quadratics';
const tfr = f => (f.isInt() ? String(Math.abs(f.n)) : `\\tfrac{${Math.abs(f.n)}}{${f.d}}`);

// =====================================================================
// 1. Perfect square trinomials
// =====================================================================
export const perfectSquare = {
  id: 'perfect-square-trinomial',
  course: ['accel'],
  group: GROUP,
  lesson: '2.4',
  title: 'Completing a Perfect Square Trinomial',
  blurb: 'Find the constant that makes x² + bx a perfect square, then write it as a binomial squared.',
  levels: {
    1: { name: 'Easy', desc: 'Even middle coefficient, like x² + 10x' },
    2: { name: 'Medium', desc: 'Odd middle coefficient, like x² + 9x' },
    3: { name: 'Challenging', desc: 'Fractional middle coefficient, like x² − (2/3)x' },
  },
  generate(level, rng) {
    let b;
    if (level === 1) b = F(2 * nonzero(rng, -10, 10));
    else if (level === 2) b = F(pick(rng, [-15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15]));
    else b = pick(rng, [F(2, 3), F(-2, 3), F(1, 2), F(-1, 2), F(3, 4), F(-4, 5), F(5, 2), F(-5, 3), F(4, 3), F(-3, 2)]);
    const half = b.div(2), c = half.mul(half);
    const bx = `${b.sign() < 0 ? '-' : '+'} ${b.abs().eq(1) ? '' : tfr(b.abs())}x`;
    const binom = `\\left(x ${half.sign() < 0 ? '-' : '+'} ${tfr(half.abs())}\\right)^2`;
    const fn = x => x * x + b.value() * x + c.value();
    const check = str => {
      let s = String(str).replace(/[−–]/g, '-').trim();
      if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1);
      if (!s.trim()) return { ok: false, msg: 'Enter the binomial squared, like (x + 5)^2.', format: true };
      let tree;
      try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Example: (x + 9/2)^2', format: true }; }
      const ok = [-2, -1, 0, 0.5, 1, 3].every(x => Math.abs(evaluate(tree, { x }) - fn(x)) < 1e-9 * Math.max(1, Math.abs(fn(x))));
      if (!ok) return { ok: false };
      let t = tree; while (t.op === 'paren') t = t.a;
      if (t.op !== '^' || t.b.num !== '2') return { ok: false, msg: 'That is equal, but write it as a binomial squared, like (x + 9/2)^2.' };
      return { ok: true };
    };
    return {
      tag: level === 1 ? 'even b' : level === 2 ? 'odd b' : 'fractional b',
      prompt: `Find the constant $c$ that makes $x^2 ${bx} + c$ a perfect square trinomial. Then write the trinomial as a binomial squared.`,
      parts: [
        { type: 'number', label: '$c =$', answer: c },
        { type: 'custom', label: `$x^2 ${bx} + c =$`, check, preview: str => { try { return toTex(parse(String(str).replace(/[−–]/g, '-'))); } catch { return null; } }, keys: ['(', ')', '^2', '/'], placeholder: 'e.g. (x + 9/2)^2', answerTex: `$${binom}$` },
      ],
      solution: `Take half of the middle coefficient and square it: $\\tfrac{1}{2}\\cdot ${b.sign() < 0 ? `\\left(${b.tex()}\\right)` : b.tex()} = ${half.tex()}$, and $\\left(${half.tex()}\\right)^2 = ${c.tex()}$.<br>`
        + `So $x^2 ${bx} + ${c.tex()} = ${binom}$. The number inside the binomial is the half you found${half.sign() < 0 ? ', with its negative sign' : ''}.`,
      _check: { b: b.value(), c: c.value() },
    };
  },
};

// =====================================================================
// 2. The discriminant
// =====================================================================
export const discriminant = {
  id: 'discriminant',
  course: ['accel'],
  group: GROUP,
  lesson: '2.5',
  title: 'The Discriminant',
  blurb: 'Use b² − 4ac to find the number and type of solutions without solving.',
  levels: {
    1: { name: 'Easy', desc: 'Equations already in the form ax² + bx + c = 0' },
    2: { name: 'Medium', desc: 'Rearrange first, like 2x² + 3 = 4x' },
    3: { name: 'Challenging', desc: 'Find the values of k that give one real or two complex solutions' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = level < 3 ? buildDisc(level, rng) : buildK(rng); if (p) return p; }
    throw new Error('discriminant: could not build');
  },
};

const TYPE_CHOICES = [
  'Two real solutions (two x-intercepts)',
  'One real solution (one x-intercept)',
  'Two complex solutions (no x-intercepts)',
];
const termT = (c, v, first) => {
  if (c === 0) return '';
  const a = Math.abs(c), body = `${a === 1 && v ? '' : a}${v}`;
  return first ? `${c < 0 ? '-' : ''}${body}` : ` ${c < 0 ? '-' : '+'} ${body}`;
};
const polyT = (a, b, c) => (termT(a, 'x^2', true) + termT(b, 'x', false) + termT(c, '', false)) || '0';

function buildDisc(level, rng) {
  const type = pick(rng, [0, 1, 2]);
  let a, b, c;
  if (type === 1) { const p = nonzero(rng, -4, 4), q = nonzero(rng, -6, 6); if (gcd(p, q) !== 1) return null; a = p * p; b = 2 * p * q; c = q * q; if (rng() < 0.3) { a = -a; b = -b; c = -c; } }
  else { a = nonzero(rng, -5, 6); b = randInt(rng, -10, 10); c = nonzero(rng, -9, 9); }
  const D = b * b - 4 * a * c;
  const got = D > 0 ? 0 : D === 0 ? 1 : 2;
  if (got !== type) return null;
  let eq = `${polyT(a, b, c)} = 0`, steps = [];
  if (level === 2) {
    // move some terms to the right: a x^2 + b x + c = 0  ->  a x^2 + p = q x + r  (any arrangement with terms on both sides)
    const style = pick(rng, ['xRight', 'cRight', 'bothSides']);
    if (style === 'xRight' && b !== 0) { eq = `${polyT(a, 0, c)} = ${polyT(0, -b, 0)}`; }
    else if (style === 'cRight') { eq = `${polyT(a, b, 0)} = ${-c}`; }
    else { const r = nonzero(rng, -6, 6); eq = `${polyT(a, b, c + r)} = ${r}`; }
    steps.push(`First get everything on one side: $${polyT(a, b, c)} = 0$.`);
  }
  steps.push(`$a = ${a}$, $b = ${b}$, $c = ${c}$, so $b^2 - 4ac = ${b < 0 ? `(${b})` : b}^2 - 4(${a})(${c}) = ${b * b} ${-4 * a * c < 0 ? '-' : '+'} ${Math.abs(4 * a * c)} = ${D}$.`);
  steps.push(D > 0 ? 'The discriminant is positive: two real solutions, so the graph crosses the x-axis twice.'
    : D === 0 ? 'The discriminant is 0: one real (repeated) solution, so the graph touches the x-axis once.'
      : 'The discriminant is negative: two complex solutions, so the graph never reaches the x-axis.');
  return {
    tag: (level === 1 ? 'standard form, ' : 'rearrange, ') + ['two real', 'one real', 'two complex'][type],
    prompt: `Use the discriminant to determine the number and type of solutions. Do not solve. $\\;${eq}$`,
    parts: [
      { type: 'number', label: '$b^2 - 4ac =$', answer: F(D) },
      { type: 'mc', label: 'Number and type of solutions:', choices: TYPE_CHOICES, answer: type },
    ],
    solution: steps.join('<br>'),
    _check: { a, b, c, D },
  };
}

// ---- finding k ----
// interval answers: { lo, hi } with Infinity allowed, always strict
function readEnd(s) {
  if (/^\+?(inf|∞)$/.test(s)) return Infinity;
  if (/^-(inf|∞)$/.test(s)) return -Infinity;
  const r = readComplex(s);
  if (r.error || Math.abs(r.value[1]) > 1e-12) return null;
  return { v: r.value[0], decimal: r.decimal };
}
function intervalChecker(lo, hi) {
  return str => {
    const s = String(str).replace(/[−–]/g, '-').replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/infinity/gi, 'inf').replace(/sqrt/gi, '√').replace(/\s+/g, '').toLowerCase();
    if (!s) return { ok: false, msg: 'Enter an inequality for k, like k > 9/2 or -2√10 < k < 2√10.', format: true };
    let L = -Infinity, H = Infinity, strict = true, decimal = false, m;
    const val = t => { const e = readEnd(t); if (e === null) return null; if (typeof e === 'number') return e; decimal = decimal || e.decimal; return e.v; };
    if ((m = s.match(/^(.+?)(<=|<)k(<=|<)(.+)$/))) { L = val(m[1]); H = val(m[4]); strict = m[2] === '<' && m[3] === '<'; }
    else if ((m = s.match(/^(.+?)(>=|>)k(>=|>)(.+)$/))) { H = val(m[1]); L = val(m[4]); strict = m[2] === '>' && m[3] === '>'; }
    else if ((m = s.match(/^k(<=|<|>=|>)(.+)$/))) { const v = val(m[2]); if (m[1][0] === '<') H = v; else L = v; strict = m[1].length === 1; }
    else if ((m = s.match(/^(.+?)(<=|<|>=|>)k$/))) { const v = val(m[1]); if (m[2][0] === '<') L = v; else H = v; strict = m[2].length === 1; }
    else if ((m = s.match(/^\|k\|(<=|<)(.+)$/))) { const v = val(m[2]); L = v === null ? null : -v; H = v; strict = m[1] === '<'; }
    else if ((m = s.match(/^([\[(])(.+),(.+)([\])])$/))) { L = val(m[2]); H = val(m[3]); strict = m[1] === '(' && m[4] === ')'; }
    else return { ok: false, msg: 'Write an inequality like k > 9/2, or -2√10 < k < 2√10.', format: true };
    if (L === null || H === null) return { ok: false, msg: 'Could not read one of the numbers. Use √ for square roots, like 2√10.', format: true };
    const eq = (u, v) => (u === v) || (isFinite(u) && isFinite(v) && Math.abs(u - v) < 1e-6 * Math.max(1, Math.abs(v)));
    if (!(eq(L, lo) && eq(H, hi))) return { ok: false };
    if (!strict) return { ok: false, msg: 'Check the endpoints: at the endpoint the discriminant is 0, which gives one real solution, not two complex ones. Use < or >, not ≤ or ≥.' };
    if (decimal) return { ok: false, msg: 'Give exact values (use √), not decimals.' };
    return { ok: true };
  };
}

function buildK(rng) {
  const kind = pick(rng, ['oneMid', 'oneConst', 'complexMid', 'complexConst', 'oneMid', 'complexMid']);
  const steps = [];
  let eq, part, tag, A, B, Cc;
  if (kind === 'oneMid' || kind === 'complexMid') {
    // a x^2 + k x + c = 0 ; D = k^2 - 4ac
    const a = randInt(rng, 1, 5), c = randInt(rng, 1, 9);
    A = a; B = 'k'; Cc = c;
    const P = 4 * a * c;                                      // k^2 compared with 4ac
    const { k: kk, r } = splitSquare(P);
    if (kind === 'oneMid' && r !== 1) return null;            // nice answers for "exactly one"
    eq = `${polyT(a, 0, 0)} + kx ${termT(c, '', false).trim()} = 0`;
    const rootT = r === 1 ? String(kk) : `${kk === 1 ? '' : kk}\\sqrt{${r}}`;
    steps.push(`The discriminant is $b^2 - 4ac = k^2 - 4(${a})(${c}) = k^2 - ${P}$.`);
    if (kind === 'oneMid') {
      steps.push(`Exactly one real solution means the discriminant is 0: $k^2 = ${P}$, so $k = \\pm ${kk}$.`);
      part = { type: 'list', label: '$k =$', answer: [F(-kk), F(kk)], placeholder: 'e.g. 8, -8', help: 'List every value, separated by commas.' };
      tag = 'one real solution, k in the middle';
    } else {
      steps.push(`Two complex solutions means the discriminant is negative: $k^2 - ${P} < 0$, so $k^2 < ${P}$.`);
      steps.push(`That happens when $k$ is between the two square roots: $-${rootT} < k < ${rootT}$${r === 1 ? '' : ` (since $\\sqrt{${P}} = ${rootT}$)`}.`);
      const v = kk * Math.sqrt(r);
      part = { type: 'custom', label: 'Values of $k$:', check: intervalChecker(-v, v), keys: ['<', '>', '√', '/'], placeholder: 'e.g. -2√10 < k < 2√10', answerTex: `$-${rootT} < k < ${rootT}$`, help: 'Type an inequality, like -2√10 < k < 2√10 or k > 9/2.' };
      tag = 'two complex solutions, k in the middle';
    }
  } else {
    // a x^2 + b x + k = 0 ; D = b^2 - 4ak
    const a = randInt(rng, 1, 4), b = nonzero(rng, -9, 9);
    A = a; B = b; Cc = 'k';
    const crit = F(b * b, 4 * a);
    eq = `${polyT(a, b, 0)} + k = 0`;
    steps.push(`The discriminant is $b^2 - 4ac = ${b < 0 ? `(${b})` : b}^2 - 4(${a})k = ${b * b} - ${4 * a}k$.`);
    if (kind === 'oneConst') {
      steps.push(`Exactly one real solution means $${b * b} - ${4 * a}k = 0$, so $k = \\dfrac{${b * b}}{${4 * a}} = ${crit.tex()}$.`);
      part = { type: 'number', label: '$k =$', answer: crit };
      tag = 'one real solution, k constant';
    } else {
      steps.push(`Two complex solutions means $${b * b} - ${4 * a}k < 0$, so $${4 * a}k > ${b * b}$ and $k > ${crit.tex()}$.`);
      part = { type: 'custom', label: 'Values of $k$:', check: intervalChecker(crit.value(), Infinity), keys: ['<', '>', '√', '/'], placeholder: 'e.g. k > 9/2', answerTex: `$k > ${crit.tex()}$`, help: 'Type an inequality, like k > 9/2.' };
      tag = 'two complex solutions, k constant';
    }
  }
  const want = kind.startsWith('one') ? 'exactly one real solution' : 'two complex solutions';
  return { tag, prompt: `For what value${kind.startsWith('one') && kind === 'oneConst' ? '' : 's'} of $k$ does $${eq}$ have ${want}?`, parts: [part], solution: steps.join('<br>'), _check: { kind, a: A, b: B, c: Cc } };
}
