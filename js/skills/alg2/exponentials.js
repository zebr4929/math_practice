// Accelerated Algebra II, Unit 3 (lessons 3.1 to 3.4): rational exponents and exponential functions.
import { F, Frac, randInt, pick, nonzero, shuffle, gcd, parse, evaluate, variables } from '../../math.js?v=3.4';
import { parseL, evalL, previewL, valueChecker, intervalChecker, readValue, matches } from '../precalc/logexpr.js?v=3.4';

const COURSE = ['accel'];
const G_RAT = 'Unit 3 - Rational Exponents';
const G_EXP = 'Unit 3 - Exponential Functions';
const d3 = v => (Math.round(v * 1000) / 1000).toFixed(3);
const VARSETS = [['x', 'y'], ['a', 'b'], ['h', 'v'], ['d', 't'], ['a', 'w'], ['m', 'n'], ['p', 'q']];
const clean = s => String(s).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();

// =====================================================================
// monomials c·u^e1·v^e2 with Frac coefficient and Frac exponents
// =====================================================================
const mono = (c, e) => ({ c: F(c.n ?? c, c.d ?? 1), e: Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v instanceof Frac ? v : F(v)])) });
const mMul = (A, B) => { const e = { ...A.e }; for (const [k, v] of Object.entries(B.e)) e[k] = (e[k] || F(0)).add(v); return { c: A.c.mul(B.c), e }; };
const mPow = (A, n) => ({ c: A.c.pow(n), e: Object.fromEntries(Object.entries(A.e).map(([k, v]) => [k, v.mul(n)])) });
const mDiv = (A, B) => mMul(A, mPow(B, -1));
const expTex = e => (e.isInt() ? `${e.n}` : `\\frac{${e.n}}{${e.d}}`);
// a factor exactly as written (negative exponents allowed)
function termTex(M, { coef = true } = {}) {
  const c = M.c;
  let s = '';
  if (coef) s = c.eq(1) ? '' : c.eq(-1) ? '-' : c.isInt() ? `${c.n}` : `${c.n < 0 ? '-' : ''}\\tfrac{${Math.abs(c.n)}}{${c.d}}`;
  for (const [v, e] of Object.entries(M.e)) if (!e.isZero()) s += e.eq(1) ? v : `${v}^{${expTex(e)}}`;
  return s || (coef ? `${c.tex()}` : '1');
}
// simplified: positive exponents, coefficient reduced, negatives moved to the denominator
function simpTex(M) {
  const num = [], den = [];
  for (const [v, e] of Object.entries(M.e)) { if (e.isZero()) continue; const a = e.abs(); (e.sign() > 0 ? num : den).push(a.eq(1) ? v : `${v}^{${expTex(a)}}`); }
  const p = Math.abs(M.c.n), q = M.c.d, neg = M.c.n < 0 ? '-' : '';
  const top = `${p === 1 && num.length ? '' : p}${num.join('')}`, bot = `${q === 1 && den.length ? '' : q === 1 ? '' : q}${den.join('')}`;
  return bot ? `${neg}\\dfrac{${top || '1'}}{${bot}}` : `${neg}${top || '1'}`;
}
const mVal = (M, env) => M.c.value() * Object.entries(M.e).reduce((s, [v, e]) => s * Math.pow(env[v], e.value()), 1);

// is the student's expression in simplified form? returns '' when it is, otherwise the reason
function formIssue(tree, { fracExp = false } = {}) {
  const seen = new Map(); const nums = { top: [], bot: [] }; let issue = '';
  const expOf = n => {
    if (n.num !== undefined) return Number.isInteger(+n.num) ? F(+n.num) : 'dec';
    if (n.op === 'paren') return expOf(n.a);
    if (n.op === 'neg') { const v = expOf(n.a); return v === 'dec' ? v : v ? v.neg() : null; }
    if (n.op === '/') {
      const un = q => (q.op === 'paren' ? un(q.a) : q), A = un(n.a), D = un(n.b);
      if (A.num !== undefined && D.num !== undefined && Number.isInteger(+A.num) && Number.isInteger(+D.num)) {
        if (gcd(+A.num, +D.num) !== 1 || +D.num === 1) return 'unreduced';
        return F(+A.num, +D.num);
      }
    }
    return null;
  };
  const walk = (n, bot) => {
    if (issue) return;
    if (n.op === 'paren') return walk(n.a, bot);
    if (n.op === 'neg') return walk(n.a, bot);
    if (n.op === '*') { walk(n.a, bot); walk(n.b, bot); return; }
    if (n.num !== undefined) { (bot ? nums.bot : nums.top).push(+n.num); return; }
    if (n.v) { seen.set(n.v, (seen.get(n.v) || 0) + 1); return; }
    if (n.op === '^') {
      const base = n.a.op === 'paren' ? n.a.a : n.a;
      if (!base.v) { issue = 'Work out the numbers: write the coefficient as a single number, not a power.'; return; }
      const e = expOf(n.b);
      if (e === 'dec') { issue = 'Write each exponent as a fraction, like x^(4/3), not a decimal.'; return; }
      if (e === 'unreduced') { issue = 'Reduce the fraction in the exponent.'; return; }
      if (!e) { issue = 'Simplify each exponent to a single number.'; return; }
      if (e.sign() <= 0) { issue = 'Use only positive exponents: move a factor with a negative exponent to the other side of the fraction bar.'; return; }
      if (!fracExp && !e.isInt()) { issue = 'Simplify each exponent to a whole number.'; return; }
      seen.set(base.v, (seen.get(base.v) || 0) + 1);
      return;
    }
    if (n.op === '/') {
      if (n.a.num !== undefined && n.b.num !== undefined) { (bot ? nums.bot : nums.top).push(+n.a.num); (bot ? nums.top : nums.bot).push(+n.b.num); return; }
      if (bot) { issue = 'Write it as a single fraction.'; return; }
      walk(n.a, false); walk(n.b, true); return;
    }
    issue = 'Write it as one simplified term, like -a^9/(27b^30).';
  };
  walk(tree, false);
  if (issue) return issue;
  if ([...seen.values()].some(c => c > 1)) return 'Combine the factors of each variable, so each letter appears once.';
  if (nums.top.length > 1 || nums.bot.length > 1) return 'Multiply the numbers together, so there is one number on top and at most one on the bottom.';
  const t = nums.top[0] ?? 1, b = nums.bot[0] ?? 1;
  if (Number.isInteger(t) && Number.isInteger(b) && gcd(Math.abs(t), Math.abs(b)) > 1) return 'Reduce the fraction in the coefficient.';
  return '';
}
function monoChecker(M, { fracExp = false } = {}) {
  const vs = Object.keys(M.e);
  const envs = fracExp ? [0.7, 1.9, 3.1].map((x, i) => Object.fromEntries(vs.map((v, j) => [v, x + 0.37 * j + 0.11 * i])))
    : [[1.3, 0.7], [-0.8, 1.9], [2.1, -1.4], [-1.6, -0.6]].map(p => Object.fromEntries(vs.map((v, j) => [v, p[j % 2] + 0.05 * j])));
  return str => {
    const s = clean(str).replace(/^[a-z]\s*=\s*/i, '');
    if (!s) return { ok: false, msg: 'Enter your answer.', format: true };
    if (/sqrt|√|root/i.test(s)) return { ok: false, msg: 'Write your answer with rational exponents, like 2x^(4/3), not radicals.', format: true };
    let tree; try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Example: -a^9/(27b^30)', format: true }; }
    for (const v of variables(tree)) if (!vs.includes(v)) return { ok: false, msg: `Use only the variable${vs.length > 1 ? 's' : ''} ${vs.join(' and ')}.`, format: true };
    const same = envs.every(env => { let g; try { g = evaluate(tree, env); } catch { return false; } const w = mVal(M, env); return isFinite(g) && Math.abs(g - w) <= 1e-9 * Math.max(1, Math.abs(w)); });
    if (!same) return { ok: false };
    const why = formIssue(tree, { fracExp });
    if (why) {
      if (why.startsWith('Write each exponent as a fraction')) return { ok: false, msg: why, format: true };
      return { ok: false, msg: 'That is equal, but not simplified. ' + why };
    }
    return { ok: true };
  };
}
const exprPart = (label, M, opts = {}) => ({ type: 'custom', label, check: monoChecker(M, opts), keys: ['^', '(', ')', '/', '-'], placeholder: opts.fracExp ? 'e.g. 2x^(4/3)' : 'e.g. -a^9/(27b^30)', answerTex: `$${simpTex(M)}$`, help: opts.fracExp ? 'Type exponents in parentheses, like x^(4/3).' : 'Use positive exponents only. Type a fraction like 375t^6/d^15 or -a^9/(27b^30).' });

// =====================================================================
// 1. Laws of Exponents (3.1)
// =====================================================================
export const expLaws = {
  id: 'exp-laws', course: COURSE, group: G_RAT, lesson: '3.1',
  title: 'Laws of Exponents',
  blurb: 'Simplify products, quotients and powers of monomials. Answers use positive exponents only.',
  levels: {
    1: { name: 'Easy', desc: 'Products and powers, like (−3x⁴y⁵)³ or (−7xy⁴)(−2x⁵y⁶)' },
    2: { name: 'Medium', desc: 'Quotients with negative exponents, like −35x²y⁴ / (5x⁶y⁻⁸)' },
    3: { name: 'Challenging', desc: 'Negative powers of a factor or a fraction, like (−30a¹⁴b⁸ / 10a¹⁷b⁻²)⁻³' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildLaws(level, rng); if (p) return p; }
    throw new Error('exp-laws: could not build');
  },
};
const okSize = M => Math.abs(M.c.n) <= 20000 && M.c.d <= 20000 && Object.values(M.e).every(e => Math.abs(e.value()) <= 40);
function buildLaws(level, rng) {
  const [u, v] = pick(rng, VARSETS);
  const rexp = (lo, hi, allowNeg) => (allowNeg ? nonzero(rng, lo, hi) : randInt(rng, Math.max(1, lo), hi));
  const rm = (coefs, lo, hi, neg) => mono(F(pick(rng, coefs) * pick(rng, [1, -1])), { [u]: rexp(lo, hi, neg), [v]: rexp(lo, hi, neg) });
  let given, R, tag, steps = [];
  if (level === 1) {
    if (rng() < 0.5) {
      const M = rm([2, 3, 4, 5], 1, 6, false), n = pick(rng, [2, 3]);
      R = mPow(M, n); given = `\\left(${termTex(M)}\\right)^{${n}}`; tag = 'power of a product';
      steps.push(`Raise each factor to the power ${n}: $(${M.c.tex()})^{${n}} = ${R.c.tex()}$, and multiply each exponent by ${n} (power to a power).`);
    } else {
      const M1 = rm([2, 3, 4, 5, 6, 7, 8], 1, 7, false), M2 = rm([2, 3, 4, 5, 6, 7, 9], 1, 7, false);
      R = mMul(M1, M2); given = `\\left(${termTex(M1)}\\right)\\left(${termTex(M2)}\\right)`; tag = 'product';
      steps.push(`Multiply the coefficients: $(${M1.c.tex()})(${M2.c.tex()}) = ${R.c.tex()}$. Add the exponents of each variable (product rule).`);
    }
  } else if (level === 2) {
    const den = rm([2, 3, 4, 5, 6], -8, 8, true);
    const k = pick(rng, [F(2), F(3), F(4), F(5), F(-2), F(-3), F(1, 2), F(-1, 3), F(2, 3), F(-7)]);
    const num = mono(den.c.mul(k), { [u]: nonzero(rng, -8, 8), [v]: nonzero(rng, -8, 8) });
    if (!num.c.isInt()) return null;
    if (!Object.values(num.e).concat(Object.values(den.e)).some(e => e.sign() < 0)) return null;
    R = mDiv(num, den); given = `\\dfrac{${termTex(num)}}{${termTex(den)}}`; tag = 'quotient';
    steps.push(`Divide the coefficients: $\\dfrac{${num.c.tex()}}{${den.c.tex()}} = ${R.c.tex()}$. Subtract exponents, top minus bottom (quotient rule): ${Object.keys(R.e).map(w => `$${w}^{${num.e[w].tex()} - (${den.e[w].tex()})} = ${w}^{${R.e[w].tex()}}$`).join(', ')}.`);
  } else {
    const type = pick(rng, ['denominator power', 'denominator power', 'fraction power', 'coefficient outside']);
    if (type === 'fraction power') {
      const den = rm([2, 3, 5, 10], -9, 9, true), k = pick(rng, [F(-3), F(3), F(2), F(-2), F(1, 2), F(-1, 3)]);
      const num = mono(den.c.mul(k), { [u]: nonzero(rng, -9, 18), [v]: nonzero(rng, -9, 12) });
      if (!num.c.isInt()) return null;
      const n = pick(rng, [-2, -3, -2, 2]);
      const inner = mDiv(num, den);
      R = mPow(inner, n); given = `\\left(\\dfrac{${termTex(num)}}{${termTex(den)}}\\right)^{${n}}`; tag = 'power of a fraction';
      steps.push(`Simplify inside first: $\\dfrac{${termTex(num)}}{${termTex(den)}} = ${termTex(inner)}$.`);
      steps.push(`Raise to the power ${n}: the coefficient becomes $(${inner.c.tex()})^{${n}} = ${R.c.tex()}$, and each exponent is multiplied by ${n}: $${termTex(R)}$.`);
    } else if (type === 'coefficient outside') {
      const top = rm([4, 6, 8, 10, 12, 15, 20], -9, 9, true), k = pick(rng, [2, 3, 4, 5, -2, -3, -5]), n = pick(rng, [-2, -3, -4]);
      const inner = mono(F(1), { [u]: nonzero(rng, -6, 6), [v]: nonzero(rng, -4, 4) });
      const bottom = mMul(mono(F(k), {}), mPow(inner, n));
      R = mDiv(top, bottom); given = `\\dfrac{${termTex(top)}}{${k}\\left(${termTex(inner)}\\right)^{${n}}}`; tag = 'coefficient outside a power';
      steps.push(`Simplify the power in the denominator first: $\\left(${termTex(inner)}\\right)^{${n}} = ${termTex(mPow(inner, n), { coef: false })}$, so the denominator is $${termTex(bottom)}$.`);
      steps.push(`Divide: coefficient $\\dfrac{${top.c.tex()}}{${k}} = ${R.c.tex()}$, and subtract exponents: $${termTex(R)}$.`);
    } else {
      const top = rm([2, 3, 4, 6, 12, 15], -9, 9, true), inner = rm([2, 3, 5], -5, 5, true), n = pick(rng, [-1, -2, -3]);
      const bottom = mPow(inner, n);
      R = mDiv(top, bottom); given = `\\dfrac{${termTex(top)}}{\\left(${termTex(inner)}\\right)^{${n}}}`; tag = 'negative power in the denominator';
      steps.push(`Simplify the power in the denominator first: $\\left(${termTex(inner)}\\right)^{${n}} = ${termTex(bottom)}$.`);
      steps.push(`Dividing by it: coefficient $\\dfrac{${top.c.tex()}}{${bottom.c.tex()}} = ${R.c.tex()}$; subtract exponents: $${termTex(R)}$.`);
    }
  }
  if (!okSize(R) || Object.values(R.e).every(e => e.isZero())) return null;
  if (Object.values(R.e).some(e => e.sign() < 0)) steps.push(`Move each negative exponent to the other side of the fraction bar to make it positive.`);
  steps.push(`Answer: $${simpTex(R)}$.`);
  return {
    tag, prompt: `Simplify. Write your answer with positive exponents only. $\\;${given}$`,
    parts: [exprPart('Simplified:', R)], solution: steps.join('<br>'),
    _check: { R, given },
  };
}

// =====================================================================
// 2. Evaluating Rational Exponents (3.1)
// =====================================================================
export const ratExpEval = {
  id: 'rational-exp-eval', course: COURSE, group: G_RAT, lesson: '3.1',
  title: 'Evaluating Rational Exponents',
  blurb: 'b^(m/n) means the nth root of b, raised to the m. Take the root first to keep the numbers small.',
  levels: {
    1: { name: 'Easy', desc: 'Unit fractions, like 64^(1/2), −16^(1/4) or (−27)^(1/3)' },
    2: { name: 'Medium', desc: 'Exponents like 2/3 and 3/2, as in 27^(2/3) or 9^(3/2)' },
    3: { name: 'Challenging', desc: 'Negative exponents, fraction bases, and roots that are not real' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildRatEval(level, rng); if (p) return p; }
    throw new Error('rational-exp-eval: could not build');
  },
};
const ROOTS = { 2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15], 3: [2, 3, 4, 5, 6, 10], 4: [2, 3, 4, 5], 5: [2, 3] };
function ratChecker(ans) {        // ans: a Frac, or null for "not a real number"
  return str => {
    const s = clean(str).toLowerCase();
    if (!s) return { ok: false, msg: 'Enter a number, or type "not real".', format: true };
    if (/not\s*(a\s*)?real|no\s*real|non-?real|undefined|dne|imaginary|^none$/.test(s)) return { ok: ans === null };
    let v; try { v = evaluate(parse(s.replace(/^[a-z]\s*=\s*/, '')), {}); } catch { return { ok: false, msg: 'Enter a number like 9 or 1/27, or type "not real".', format: true }; }
    if (!isFinite(v)) return { ok: false, msg: 'Enter a number.', format: true };
    if (ans === null) return { ok: false };
    const w = ans.value();
    if (Math.abs(v - w) < 1e-9 * Math.max(1, Math.abs(w))) return { ok: true };
    if (/\.\d{3,}/.test(s) && Math.abs(v - w) <= 0.0005 + 1e-12) return { ok: true };
    return { ok: false };
  };
}
function buildRatEval(level, rng) {
  const n = pick(rng, level === 1 ? [2, 2, 3, 3, 4, 5] : [2, 3, 3, 4, 5]);
  const r = pick(rng, ROOTS[n]), b = Math.pow(r, n);
  let m = 1, sign = 1, form = 'plain';
  if (level === 1) form = pick(rng, ['plain', 'plain', 'neg outside', 'neg base', 'neg exponent']);
  else if (level === 2) { m = randInt(rng, 2, 5); form = pick(rng, ['plain', 'plain', 'neg outside', 'neg base']); }
  else { m = randInt(rng, 1, 4); form = pick(rng, ['neg exponent', 'neg exponent', 'fraction base', 'not real', 'neg outside']); if (form === 'neg outside' && m === 1) m = 2; }
  if (gcd(m, n) !== 1 || m === n) return null;
  if (form === 'neg base' && n % 2 === 0) return null;
  if (form === 'not real' && n % 2 === 1) return null;
  const e = F(m, n);
  let ans, givenTex, steps = [], baseVal = F(b), rootVal = F(r);
  const eT = e.isInt() ? `${e.n}` : `\\frac{${m}}{${n}}`;
  const rootWord = { 2: 'square root', 3: 'cube root', 4: 'fourth root', 5: 'fifth root' }[n];
  if (form === 'fraction base') {
    const r2 = pick(rng, ROOTS[n].filter(x => x !== r && gcd(x, r) === 1)); if (!r2) return null;
    baseVal = F(b, Math.pow(r2, n)); rootVal = F(r, r2);
    const neg = rng() < 0.6;
    ans = rootVal.pow(neg ? -m : m);
    givenTex = `\\left(\\dfrac{${baseVal.n}}{${baseVal.d}}\\right)^{${neg ? '-' : ''}${eT}}`;
    steps.push(`The ${rootWord} of $\\dfrac{${baseVal.n}}{${baseVal.d}}$ is $${rootVal.tex()}$ (root of the top over root of the bottom).`);
    if (m > 1) steps.push(`Raise to the power ${m}: $\\left(${rootVal.tex()}\\right)^{${m}} = ${rootVal.pow(m).tex()}$.`);
    if (neg) steps.push(`The negative exponent means the reciprocal: $${ans.tex()}$.`);
  } else if (form === 'not real') {
    ans = null; givenTex = `(-${b})^{${eT}}`;
    steps.push(`The denominator ${n} means an even root (${rootWord}). No real number raised to an even power gives $-${b}$, so $(-${b})^{${eT}}$ is not a real number.`);
    steps.push(`Compare $-${b}^{${eT}}$ without parentheses: there the negative sign is outside the power, so that one is real.`);
  } else {
    const negExp = form === 'neg exponent';
    const pw = rootVal.pow(m);
    if (form === 'neg outside') { ans = pw.neg(); givenTex = `-${b}^{${negExp ? '-' : ''}${eT}}`; }
    else if (form === 'neg base') { ans = F(-r).pow(m); givenTex = `(-${b})^{${eT}}`; }
    else if (negExp) { ans = F(1).div(pw); givenTex = `${b}^{-${eT}}`; }
    else { ans = pw; givenTex = `${b}^{${eT}}`; }
    if (Math.abs(ans.value()) > 10000 || ans.d > 10000) return null;
    if (form === 'neg base') steps.push(`The parentheses include the negative. An odd root of a negative is negative: the ${rootWord} of $-${b}$ is $-${r}$.`);
    else steps.push(`The denominator ${n} means the ${rootWord}: $\\sqrt${n === 2 ? '' : `[${n}]`}{${b}} = ${r}$${form === 'neg outside' ? '. The negative sign is outside the power, so it waits until the end' : ''}.`);
    if (m > 1) steps.push(`The numerator ${m} is the power: $${form === 'neg base' ? `(-${r})` : r}^{${m}} = ${form === 'neg base' ? ans.tex() : pw.tex()}$.`);
    if (negExp) steps.push(`The negative exponent means the reciprocal: $\\dfrac{1}{${pw.tex()}}$.`);
    if (form === 'neg outside') steps.push(`Apply the negative: $${ans.tex()}$.`);
  }
  return {
    tag: form,
    prompt: `Simplify. Give an exact answer (a whole number or fraction), or type "not real" if it is not a real number. $\\;${givenTex}$`,
    parts: [{ type: 'custom', label: 'Value:', check: ratChecker(ans), keys: ['/', '-', 'not real'], placeholder: 'e.g. 9 or 1/27', answerTex: ans === null ? 'Not a real number' : `$${ans.tex()}$` }],
    solution: steps.join('<br>'),
    _check: { ans: ans === null ? null : ans.value(), givenTex, form },
  };
}

// =====================================================================
// 3. Radicals and Rational Exponents (3.1)
// =====================================================================
export const radicalExp = {
  id: 'radical-exp', course: COURSE, group: G_RAT, lesson: '3.1',
  title: 'Radicals and Rational Exponents',
  blurb: 'The index of the root is the denominator of the exponent; the power is the numerator.',
  levels: {
    1: { name: 'Easy', desc: 'Radicals to exponents, like (⁵√x)⁴ = x^(4/5)' },
    2: { name: 'Medium', desc: 'With a coefficient, like ∛(8x⁴) = 2x^(4/3) and (∛(8x))⁴ = 16x^(4/3)' },
    3: { name: 'Challenging', desc: 'Exponents back to radicals, and powers like (27x⁶)^(2/3)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildRadical(level, rng); if (p) return p; }
    throw new Error('radical-exp: could not build');
  },
};
const rootTex = (n, inside) => (n === 2 ? `\\sqrt{${inside}}` : `\\sqrt[${n}]{${inside}}`);
const xp = (x, e) => (e === 1 ? x : `${x}^{${e}}`);
function buildRadical(level, rng) {
  const x = pick(rng, ['x', 'x', 'a', 'y', 'm']);
  if (level === 1) {
    const n = pick(rng, [2, 3, 4, 5, 6]), m = randInt(rng, 1, 7);
    if (m % n === 0) return null;
    const outside = m > 1 && rng() < 0.5;
    const given = outside ? `\\left(${rootTex(n, x)}\\right)^{${m}}` : rootTex(n, xp(x, m));
    const R = mono(F(1), { [x]: F(m, n) });
    return {
      tag: outside ? 'power of a root' : 'root of a power',
      prompt: `Rewrite using a rational exponent. Simplify if possible. $\\;${given}$`,
      parts: [exprPart('Answer:', R, { fracExp: true })],
      solution: `The index of the root goes in the denominator and the power goes in the numerator: $${given} = ${x}^{\\frac{${m}}{${n}}}$${gcd(m, n) > 1 ? `, which reduces to $${simpTex(R)}$` : ''}. It does not matter whether the power is inside or outside the root.`,
      _check: { R },
    };
  }
  if (level === 2) {
    const n = pick(rng, [2, 3, 4]), r = pick(rng, n === 2 ? [2, 3, 4, 5] : n === 3 ? [2, 3] : [2]), c = Math.pow(r, n), m = randInt(rng, 1, 7);
    if (m % n === 0) return null;
    const type = pick(rng, ['coef inside root', 'power of a root with coef']);
    let given, R, why;
    if (type === 'coef inside root') {
      given = rootTex(n, `${c}${xp(x, m)}`); R = mono(F(r), { [x]: F(m, n) });
      why = `Take the root of each factor: $${rootTex(n, `${c}`)} = ${r}$ and $${rootTex(n, xp(x, m))} = ${x}^{\\frac{${m}}{${n}}}$. Answer: $${simpTex(R)}$.`;
    } else {
      const p = randInt(rng, 2, 4); if (p % n === 0 || Math.pow(r, p) > 1000) return null;
      given = `\\left(${rootTex(n, `${c}${x}`)}\\right)^{${p}}`; R = mono(F(Math.pow(r, p)), { [x]: F(p, n) });
      why = `The power ${p} applies to everything under the root: $${rootTex(n, `${c}`)} = ${r}$, so the coefficient is $${r}^{${p}} = ${Math.pow(r, p)}$, and $\\left(${rootTex(n, x)}\\right)^{${p}} = ${x}^{\\frac{${p}}{${n}}}$. Answer: $${simpTex(R)}$.`;
    }
    return { tag: type, prompt: `Rewrite using a rational exponent. Simplify if possible. $\\;${given}$`, parts: [exprPart('Answer:', R, { fracExp: true })], solution: why, _check: { R } };
  }
  if (rng() < 0.5) {
    // exponent back to a radical (multiple choice)
    const n = pick(rng, [3, 4, 5]), m = randInt(rng, 2, 4), c = pick(rng, [2, 3, 5]);
    if (gcd(m, n) !== 1) return null;
    const inside = rng() < 0.5;          // (c x)^(m/n) vs c x^(m/n)
    const given = inside ? `(${c}${x})^{\\frac{${m}}{${n}}}` : `${c}${x}^{\\frac{${m}}{${n}}}`;
    const opts = [
      { t: `\\left(${rootTex(n, `${c}${x}`)}\\right)^{${m}}`, f: X => Math.pow(c * X, m / n) },
      { t: `${c}\\left(${rootTex(n, x)}\\right)^{${m}}`, f: X => c * Math.pow(X, m / n) },
      { t: `${c}${rootTex(m, xp(x, n))}`, f: X => c * Math.pow(X, n / m) },
      { t: rootTex(m, `${c}${xp(x, n)}`), f: X => Math.pow(c * Math.pow(X, n), 1 / m) },
      { t: rootTex(n, `${c}${xp(x, m)}`), f: X => Math.pow(c * Math.pow(X, m), 1 / n) },
    ];
    const truth = X => (inside ? Math.pow(c * X, m / n) : c * Math.pow(X, m / n));
    const isRight = o => [0.6, 1.7, 2.9].every(X => Math.abs(o.f(X) - truth(X)) < 1e-9);
    const right = opts.filter(isRight), wrong = opts.filter(o => !isRight(o));
    if (right.length !== 1 || wrong.length < 3) return null;
    const choices = shuffle(rng, [right[0], ...shuffle(rng, wrong).slice(0, 3)]);
    return {
      tag: inside ? 'to a radical, coefficient inside' : 'to a radical, coefficient outside',
      prompt: `Which radical is equal to $${given}$? Assume $${x} > 0$.`,
      parts: [{ type: 'mc', label: 'Choose one:', choices: choices.map(o => `$${o.t}$`), answer: choices.indexOf(right[0]) }],
      solution: `The denominator ${n} is the index of the root and the numerator ${m} is the power.<br>`
        + (inside ? `The exponent applies to the whole product $${c}${x}$, so the ${c} stays under the root: $${right[0].t}$.` : `The exponent applies only to $${x}$, so the ${c} stays outside the root: $${right[0].t}$.`),
      _check: { truthAt2: truth(2), choiceVals: choices.map(o => o.f(2)) },
    };
  }
  // (c x^p)^(±m/n)
  const n = pick(rng, [2, 3, 4]), r = pick(rng, n === 2 ? [2, 3, 4, 5] : n === 3 ? [2, 3] : [2]), m = pick(rng, [1, 2, 3]), neg = rng() < 0.45;
  const p = n * randInt(rng, 1, 3) + (rng() < 0.4 ? randInt(rng, 1, n - 1) : 0);
  if (gcd(m, n) !== 1 || Math.pow(r, m) > 200) return null;
  const e = F(m * (neg ? -1 : 1), n);
  const base = mono(F(Math.pow(r, n)), { [x]: F(p) });
  const R = mono(F(r).pow(neg ? -m : m), { [x]: F(p).mul(e) });
  if (!R.c.isInt() && !F(1).div(R.c).isInt()) return null;
  const given = `\\left(${termTex(base)}\\right)^{${neg ? '-' : ''}\\frac{${m}}{${n}}}`;
  return {
    tag: neg ? 'negative rational power' : 'rational power of a monomial',
    prompt: `Simplify. Use rational exponents in your answer if needed, and positive exponents only. $\\;${given}$`,
    parts: [exprPart('Simplified:', R, { fracExp: true })],
    solution: `Apply the exponent to each factor. Coefficient: $${Math.pow(r, n)}^{${neg ? '-' : ''}\\frac{${m}}{${n}}} = ${R.c.tex()}$ (the ${n === 2 ? 'square' : n === 3 ? 'cube' : 'fourth'} root is ${r}${m > 1 ? `, then the power ${m}` : ''}${neg ? ', then the reciprocal' : ''}).<br>`
      + `Variable: multiply the exponents, $${p}\\cdot\\left(${neg ? '-' : ''}\\tfrac{${m}}{${n}}\\right) = ${R.e[x].tex()}$.${neg ? ' Move the negative exponent to the denominator.' : ''}<br>Answer: $${simpTex(R)}$.`,
    _check: { R },
  };
}

// =====================================================================
// transformed exponentials g(x) = A·b^(B(x − h)) + k
// =====================================================================
const BASES = { 2: F(2), 3: F(3), half: F(1, 2), third: F(1, 3) };
const bTex = b => (b.isInt() ? `${b.n}` : `\\left(\\frac{${b.n}}{${b.d}}\\right)`);
const parentTex = b => `${b.isInt() ? b.n : `\\left(\\frac{${b.n}}{${b.d}}\\right)`}^x`;
const evalE = T => x => T.A.value() * Math.pow(T.b.value(), T.B.value() * (x - T.h)) + T.k;
const kTex = k => (k === 0 ? '' : ` ${k > 0 ? '+' : '-'} ${Math.abs(k)}`);
const coefTex = c => (c.eq(1) ? '' : c.eq(-1) ? '-' : c.isInt() ? String(c.n) : `${c.n < 0 ? '-' : ''}\\frac{${Math.abs(c.n)}}{${c.d}}`);
function exponentTex(T, expand) {
  const { B, h } = T, sh = h === 0 ? 'x' : `x ${h > 0 ? '-' : '+'} ${Math.abs(h)}`;
  if (B.eq(1)) return sh;
  if (h === 0) return `${coefTex(B)}x`;
  if (expand && B.isInt()) { const c = B.mul(-h); return `${coefTex(B)}x ${c.sign() < 0 ? '-' : '+'} ${c.abs().tex()}`; }
  return `${coefTex(B)}(${sh})`;
}
// with a coefficient, a whole-number base goes in parentheses: 3(2)^x, never 32^x
const powT = (A, b, expo) => `${coefTex(A)}${!A.abs().eq(1) && b.isInt() ? `(${b.n})` : bTex(b)}^{${expo}}`;
const eTex = (T, expand) => `${powT(T.A, T.b, exponentTex(T, expand))}${kTex(T.k)}`;
function describeE(T) {
  const out = [];
  if (T.A.sign() < 0) out.push('reflect over the x-axis');
  if (T.B.sign() < 0) out.push('reflect over the y-axis');
  if (!T.A.abs().eq(1)) out.push(`vertical stretch by a factor of ${T.A.abs().isInt() ? T.A.abs().n : T.A.abs().tex()}`);
  if (!T.B.abs().eq(1)) out.push(`horizontal stretch by a factor of ${F(1).div(T.B.abs()).tex()}`);
  if (T.h) out.push(`${T.h > 0 ? 'right' : 'left'} ${Math.abs(T.h)}`);
  if (T.k) out.push(`${T.k > 0 ? 'up' : 'down'} ${Math.abs(T.k)}`);
  const s = out.join(', ');
  return s ? s[0].toUpperCase() + s.slice(1) : 'No change';
}
function pickE(level, rng) {
  const T = { A: F(1), B: F(1), b: pick(rng, [F(2), F(2), F(1, 2)]), h: 0, k: 0 };
  if (level === 1) { T.b = F(2); if (rng() < 0.6) { T.h = nonzero(rng, -5, 5); T.k = nonzero(rng, -5, 5); } else if (rng() < 0.5) T.h = nonzero(rng, -5, 5); else T.k = nonzero(rng, -5, 5); }
  else if (level === 2) { T.A = F(pick(rng, [-1, -1, 1])); T.h = randInt(rng, -4, 4); T.k = nonzero(rng, -5, 5); if (T.A.eq(1) && T.b.eq(2)) T.b = F(1, 2); }
  else { T.B = F(-1); T.A = F(pick(rng, [1, -1])); T.h = nonzero(rng, -4, 4); T.k = nonzero(rng, -5, 5); }
  return T;
}
const KEY_PTS = b => (b.value() > 1 ? [[0, 1], [1, 2], [2, 4]] : [[0, 1], [-1, 2], [-2, 4]]);
const mapE = (T, [x, y]) => [F(x).div(T.B).add(T.h), T.A.mul(y).add(T.k)];
const rangeOf = T => (T.A.sign() > 0 ? [{ lo: T.k, hi: Infinity, lc: false, rc: false }] : [{ lo: -Infinity, hi: T.k, lc: false, rc: false }]);
const rangeTex = T => (T.A.sign() > 0 ? `y > ${T.k}` : `y < ${T.k}`);
const rangePart = T => ({ type: 'custom', label: 'Range:', check: intervalChecker(rangeOf(T), 'y'), keys: ['<', '>', '∞', '(', ')'], placeholder: 'e.g. y > 2', answerTex: `$${rangeTex(T)}$, or $${T.A.sign() > 0 ? `(${T.k}, \\infty)` : `(-\\infty, ${T.k})`}$`, help: 'Use an inequality like y > 2, or interval notation like (2, ∞).' });
const domainPart = () => ({ type: 'custom', label: 'Domain:', check: intervalChecker([{ lo: -Infinity, hi: Infinity, lc: false, rc: false }], 'x'), keys: ['∞', '(', ')', 'all real numbers'], placeholder: 'e.g. all real numbers', answerTex: 'All real numbers, $(-\\infty, \\infty)$', help: 'Type all real numbers, or (-∞, ∞).' });
const asymPart = T => ({ type: 'number', label: 'Horizontal asymptote: $y =$', answer: F(T.k) });
function transformSteps(T, expanded) {
  const s = [];
  if (expanded && !T.B.eq(1) && T.h) s.push(`Factor the exponent first: $${exponentTex(T, true)} = ${exponentTex(T, false)}$.`);
  if (T.A.sign() < 0) s.push('The negative in front reflects the graph over the x-axis.');
  if (T.B.sign() < 0) s.push('The negative on $x$ in the exponent reflects the graph over the y-axis.');
  if (T.h) s.push(`$x ${T.h > 0 ? '-' : '+'} ${Math.abs(T.h)}$ in the exponent shifts the graph ${T.h > 0 ? 'right' : 'left'} ${Math.abs(T.h)} (the opposite of the sign).`);
  if (T.k) s.push(`$${T.k > 0 ? '+' : '-'} ${Math.abs(T.k)}$ outside shifts the graph ${T.k > 0 ? 'up' : 'down'} ${Math.abs(T.k)}, which moves the asymptote to $y = ${T.k}$.`);
  return s;
}
const ruleTex = T => `(x, y) \\to \\left(${T.B.eq(1) ? 'x' : '-x'}${T.h ? ` ${T.h > 0 ? '+' : '-'} ${Math.abs(T.h)}` : ''},\\ ${T.A.eq(1) ? 'y' : '-y'}${kTex(T.k)}\\right)`;

// =====================================================================
// 4. Transformations of Exponential Functions (3.2)
// =====================================================================
export const expTransformAccel = {
  id: 'exp-transform-accel', course: COURSE, group: G_EXP, lesson: '3.2',
  title: 'Transformations of Exponential Functions',
  blurb: 'Describe how the graph of 2ˣ or (½)ˣ moves, where its points go, and its new asymptote and range.',
  levels: {
    1: { name: 'Easy', desc: 'Shifts of 2ˣ, like 2^(x + 3) − 1' },
    2: { name: 'Medium', desc: 'Reflections over the x-axis, and the (½)ˣ parent' },
    3: { name: 'Challenging', desc: 'Reflections over the y-axis too, like 2^(−x − 3) − 2' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      const T = pickE(level, rng);
      if (!T.h && !T.k) continue;
      const expand = level === 3 && rng() < 0.6;
      const right = describeE(T);
      const cand = [];
      if (T.h) cand.push({ ...T, h: -T.h });
      if (T.k) cand.push({ ...T, k: -T.k });
      if (T.h && T.k) cand.push({ ...T, h: -T.h, k: -T.k });
      if (T.A.sign() < 0 || T.B.sign() < 0) cand.push({ ...T, A: T.B, B: T.A });
      cand.push({ ...T, A: T.A.neg() });
      if (level === 3) cand.push({ ...T, B: F(1), h: -T.h });
      const truth = evalE(T), same = U => [-3.3, -1.2, 0.4, 1.7, 2.9].every(x => Math.abs(evalE(U)(x) - truth(x)) < 1e-9);
      const wrongs = [...new Set(cand.filter(U => !same(U)).map(describeE))].filter(d => d !== right);
      if (wrongs.length < 3) continue;
      const choices = shuffle(rng, [right, ...shuffle(rng, wrongs).slice(0, 3)]);
      const pt = pick(rng, KEY_PTS(T.b).slice(1)), [nx, ny] = mapE(T, pt);
      const name = pick(rng, ['g', 'h', 'k']);
      return {
        tag: level === 1 ? 'shifts' : level === 2 ? (T.A.sign() < 0 ? 'x-axis reflection' : 'shifts of (1/2)^x') : 'y-axis reflection',
        prompt: `Let $f(x) = ${parentTex(T.b)}$ and $${name}(x) = ${eTex(T, expand)}$. Describe the transformations, find where a point of $f$ goes, and give the asymptote and range of $${name}$.`,
        parts: [
          { type: 'mc', label: `From $f$ to $${name}$:`, choices, answer: choices.indexOf(right) },
          { type: 'point', label: `The point $(${pt[0]}, ${pt[1]})$ on $f$ moves to:`, answer: [nx, ny], placeholder: 'e.g. (-2, 6)' },
          asymPart(T),
          rangePart(T),
        ],
        solution: [...transformSteps(T, expand), `Point rule: $${ruleTex(T)}$, so $(${pt[0]}, ${pt[1]}) \\to (${nx.tex()}, ${ny.tex()})$.`,
          `The parent's asymptote $y = 0$ moves only with the vertical shift: $y = ${T.k}$. The graph is ${T.A.sign() > 0 ? 'above' : 'below'} it, so the range is $${rangeTex(T)}$.`].join('<br>'),
        _check: { T: { A: T.A.value(), B: T.B.value(), b: T.b.value(), h: T.h, k: T.k }, pt, right },
      };
    }
    throw new Error('exp-transform-accel: could not build');
  },
};

// =====================================================================
// 5. Graphing Transformed Exponentials (3.2)
// =====================================================================
export const expGraphAccel = {
  id: 'exp-graph-accel', course: COURSE, group: G_EXP, lesson: '3.2',
  title: 'Graphing Transformed Exponentials',
  blurb: 'Move three key points of the parent, plot them, and give the asymptote and range.',
  levels: expTransformAccel.levels,
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      const T = pickE(level, rng);
      if (!T.h && !T.k) continue;
      const parent = KEY_PTS(T.b);
      const pts = parent.map(p => mapE(T, p)).map(([x, y]) => ({ x: x.value(), y: y.value() }));
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y).concat([T.k]);
      const window = { xmin: Math.min(-2, Math.min(...xs) - 3), xmax: Math.max(2, Math.max(...xs) + 3), ymin: Math.min(-2, Math.min(...ys) - 2), ymax: Math.max(2, Math.max(...ys) + 2) };
      if (window.xmax - window.xmin > 16 || window.ymax - window.ymin > 16) continue;
      const fn = evalE(T), expand = level === 3 && rng() < 0.6;
      const name = pick(rng, ['g', 'h', 'k']);
      return {
        tag: level === 1 ? 'shifts' : level === 2 ? 'x-axis reflection or (1/2)^x' : 'y-axis reflection',
        prompt: `Graph $${name}(x) = ${eTex(T, expand)}$ by moving the points $${parent.map(p => `(${p[0]}, ${p[1]})`).join(',\\ ')}$ of $f(x) = ${parentTex(T.b)}$. Plot the 3 new points, then give the asymptote and range.`,
        parts: [
          {
            type: 'graph', label: 'Click to plot the 3 new points', window, snap: 1, fn, correct: pts, answerTex: 'the 3 points marked on the graph',
            check: P => {
              if (P.length !== 3) return { ok: false, format: true, msg: `Plot exactly 3 points. You have ${P.length}.` };
              const want = new Set(pts.map(p => `${p.x},${p.y}`));
              return { ok: P.every(p => want.has(`${p.x},${p.y}`)) };
            },
          },
          asymPart(T),
          rangePart(T),
        ],
        solution: [...transformSteps(T, expand), `Point rule: $${ruleTex(T)}$.`,
          `${parent.map((p, i) => `$(${p[0]}, ${p[1]}) \\to (${pts[i].x}, ${pts[i].y})$`).join(', ')}.`,
          `Asymptote: $y = ${T.k}$. The graph is ${T.A.sign() > 0 ? 'above' : 'below'} it, so the range is $${rangeTex(T)}$.`].join('<br>'),
        _check: { T: { A: T.A.value(), B: T.B.value(), b: T.b.value(), h: T.h, k: T.k }, pts },
      };
    }
    throw new Error('exp-graph-accel: could not build');
  },
};

// =====================================================================
// 6. Reading Exponential Graphs and Tables (3.3): f(x) = a·b^(±x) + c
// =====================================================================
export const expReadAccel = {
  id: 'exp-read-accel', course: COURSE, group: G_EXP, lesson: '3.3',
  title: 'Reading Exponential Graphs and Tables',
  blurb: 'From a graph or table of a·b^(±x) + c: growth or decay, end behavior, the asymptote, and the signs of a and b.',
  levels: {
    1: { name: 'Easy', desc: 'From a graph of a·bˣ + c' },
    2: { name: 'Medium', desc: 'From a table of values, including the range' },
    3: { name: 'Challenging', desc: 'From a graph of a·b^(−x) + c' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildRead(level, rng); if (p) return p; }
    throw new Error('exp-read-accel: could not build');
  },
};
function endChecker(want) {               // want: a number, Infinity or -Infinity
  return str => {
    const s = clean(str).toLowerCase().replace(/\s/g, '').replace(/^[a-z]\(x\)(→|->)/, '');
    if (!s) return { ok: false, msg: 'Enter a number, ∞ or -∞.', format: true };
    let v;
    if (/^\+?(∞|inf|infinity|oo)$/.test(s)) v = Infinity;
    else if (/^-(∞|inf|infinity|oo)$/.test(s)) v = -Infinity;
    else { try { v = evaluate(parse(s), {}); } catch { return { ok: false, msg: 'Enter a number, ∞ or -∞ (you can type inf).', format: true }; } }
    return { ok: v === want || (isFinite(v) && isFinite(want) && Math.abs(v - want) < 1e-9) };
  };
}
const endTex = v => (v === Infinity ? '\\infty' : v === -Infinity ? '-\\infty' : String(v));
function buildRead(level, rng) {
  const s = level === 1 ? 1 : level === 3 ? -1 : pick(rng, [1, -1]);
  const a = level === 2 ? F(pick(rng, [1, 2, -1, -2, 3])) : pick(rng, [F(1), F(2), F(-1), F(-2), F(1, 2), F(-1, 2), F(3)]);
  const b = level === 2 ? pick(rng, [F(2), F(1, 2)]) : pick(rng, [F(2), F(3), F(1, 2), F(1, 3)]);
  const c = randInt(rng, -4, 4);
  const f = x => a.value() * Math.pow(b.value(), s * x) + c;
  // away: the graph pulls away from its asymptote as x increases. Growth (the class's rule): the graph rises from left to right.
  const eff = s > 0 ? b.value() : 1 / b.value(), away = eff > 1, growth = (a.sign() > 0) === away;
  const left = away ? c : (a.sign() > 0 ? Infinity : -Infinity), right = away ? (a.sign() > 0 ? Infinity : -Infinity) : c;
  const name = pick(rng, ['f', 'g', 'h', 'H']);
  const form = `a\\cdot b^{${s > 0 ? 'x' : '-x'}} + c`;
  let visual = '', displayGraph;
  if (level === 2) {
    const xsAll = growth === (s > 0) ? [-9, -5, -3, -1, 1, 3, 5, 9] : [-9, -5, -3, -1, 1, 3, 5, 9];
    const xs = shuffle(rng, xsAll).slice(0, 7).sort((p, q) => p - q);
    const vals = xs.map(f);
    if (vals.some(v => Math.abs(v) > 1100)) return null;
    const show = v => { const r = Math.round(v * 1000) / 1000; return Number.isInteger(r) ? String(r) : r.toFixed(3).replace(/0+$/, ''); };
    visual = `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr><tr><th>$${name}(x)$</th>${vals.map(v => `<td>$${show(v)}$</td>`).join('')}</tr></table>`;
  } else {
    const ysAt = [-5, -3, -1, 0, 1, 3, 5].map(f).filter(v => Math.abs(v) < 12);
    displayGraph = { window: { xmin: -6, xmax: 6, ymin: Math.min(-2, c - 4, ...ysAt.map(Math.floor)) , ymax: Math.max(2, c + 4, ...ysAt.map(Math.ceil)) }, fn: f, asymptote: c };
    if (displayGraph.window.ymax - displayGraph.window.ymin > 18) { displayGraph.window.ymin = Math.max(displayGraph.window.ymin, c - 9); displayGraph.window.ymax = Math.min(displayGraph.window.ymax, c + 9); }
  }
  const parts = [
    { type: 'mc', label: `Is $${name}$ growth or decay?`, choices: ['Growth', 'Decay'], answer: growth ? 0 : 1 },
    { type: 'custom', label: `Left end behavior: as $x \\to -\\infty$, $${name}(x) \\to$`, check: endChecker(left), keys: ['∞', '-'], placeholder: 'a number, ∞ or -∞', answerTex: `$${endTex(left)}$` },
    { type: 'custom', label: `Right end behavior: as $x \\to \\infty$, $${name}(x) \\to$`, check: endChecker(right), keys: ['∞', '-'], placeholder: 'a number, ∞ or -∞', answerTex: `$${endTex(right)}$` },
    { type: 'number', label: 'Horizontal asymptote: $y =$', answer: F(c) },
    { type: 'mc', label: 'The value of $a$:', choices: ['$a > 0$', '$a < 0$'], answer: a.sign() > 0 ? 0 : 1 },
    { type: 'mc', label: 'The value of $b$:', choices: ['$b > 1$', '$0 < b < 1$'], answer: b.value() > 1 ? 0 : 1 },
  ];
  if (level === 2) parts.push({ type: 'custom', label: 'Range:', check: intervalChecker(a.sign() > 0 ? [{ lo: c, hi: Infinity, lc: false, rc: false }] : [{ lo: -Infinity, hi: c, lc: false, rc: false }], 'y'), keys: ['<', '>', '∞', '(', ')'], placeholder: 'e.g. y > 1', answerTex: `$y ${a.sign() > 0 ? '>' : '<'} ${c}$` });
  const flat = away ? 'left' : 'right';
  const steps = [
    `The graph levels off toward $y = ${c}$ on the ${flat}, so the horizontal asymptote is $y = ${c}$ and $c = ${c}$.`,
    `Moving left to right, the graph ${growth ? 'rises' : 'falls'}, so it is exponential ${growth ? 'growth' : 'decay'}. Left end: $${name}(x) \\to ${endTex(left)}$; right end: $${name}(x) \\to ${endTex(right)}$.`,
    `The graph is ${a.sign() > 0 ? 'above' : 'below'} its asymptote, so $a ${a.sign() > 0 ? '> 0' : '< 0'}$.`,
    `As $x$ increases, the graph ${away ? 'pulls away from' : 'closes in on'} its asymptote, so the power $${s > 0 ? 'b^x' : 'b^{-x}'}$ is getting ${away ? 'larger' : 'smaller'}${a.sign() < 0 ? ' (the negative $a$ flips the graph, but not this)' : ''}. `
      + (s > 0 ? `That means $${away ? 'b > 1' : '0 < b < 1'}$.` : `$b^{-x} = \\left(\\tfrac{1}{b}\\right)^x$, so $\\tfrac{1}{b} ${away ? '> 1' : '< 1'}$, which means $${b.value() > 1 ? 'b > 1' : '0 < b < 1'}$.`),
  ];
  if (level === 2) steps.push(`Range: the graph is ${a.sign() > 0 ? 'above' : 'below'} $y = ${c}$ and never reaches it, so $y ${a.sign() > 0 ? '>' : '<'} ${c}$.`);
  return {
    tag: `${level === 2 ? 'table' : 'graph'}, ${s > 0 ? 'b^x' : 'b^-x'}, ${growth ? 'growth' : 'decay'}`,
    prompt: `${level === 2 ? 'A table of values is shown' : 'The graph is shown'} for an exponential function of the form $${name}(x) = ${form}$. Answer each question.`,
    visual, displayGraph, parts, solution: steps.join('<br>'),
    _check: { a: a.value(), b: b.value(), c, s, growth, away, left, right },
  };
}

// =====================================================================
// 7. Writing Exponential Equations from a Graph (3.3)
// =====================================================================
export const expWriteAccel = {
  id: 'exp-write-graph-accel', course: COURSE, group: G_EXP, lesson: '3.3',
  title: 'Writing Exponential Equations from a Graph',
  blurb: 'Read c from the asymptote, then use points to find a and b.',
  levels: {
    1: { name: 'Easy', desc: 'f(x) = a·bˣ + c with a point on the y-axis' },
    2: { name: 'Medium', desc: 'A shifted exponent, like a·b^(x + 1) + c' },
    3: { name: 'Challenging', desc: 'From a description only: the asymptote and two points' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildWrite(level, rng); if (p) return p; }
    throw new Error('exp-write-graph-accel: could not build');
  },
};
function buildWrite(level, rng) {
  const b = pick(rng, [F(2), F(3), F(1, 2), F(1, 3)]), a = F(pick(rng, [1, 2, 3, -1, -2, -3, 4, -4])), c = randInt(rng, -5, 4);
  const p = level === 2 ? pick(rng, [1, -1, 2]) : 0;              // exponent x + p
  const f = x => a.value() * Math.pow(b.value(), x + p) + c;
  // points at u = x + p in a whole-number-friendly pair
  const us = level === 3 ? pick(rng, [[0, 2], [1, 2], [0, 1], [-1, 1]]) : b.value() > 1 ? [0, 1] : [-1, 0];
  const pts = us.map(u => ({ x: u - p, y: a.mul(b.pow(u)).add(c) }));
  if (pts.some(q => !q.y.isInt() || Math.abs(q.y.n) > 12)) return null;
  const name = pick(rng, ['f', 'g', 'h']);
  const form = `${name}(x) = a\\cdot b^{${p ? `x ${p > 0 ? '+' : '-'} ${Math.abs(p)}` : 'x'}} + c`;
  const ptsTex = pts.map(q => `(${q.x}, ${q.y.n})`);
  let displayGraph, prompt;
  if (level < 3) {
    const ys = pts.map(q => q.y.n).concat([c]);
    displayGraph = { window: { xmin: -6, xmax: 6, ymin: Math.min(-2, Math.min(...ys) - 3), ymax: Math.max(2, Math.max(...ys) + 3) }, fn: f, asymptote: c, labels: pts.map((q, i) => ({ x: q.x, y: q.y.n, text: ptsTex[i] })) };
    if (pts.some(q => q.x < -6 || q.x > 6)) return null;
    prompt = `The graph of an exponential function of the form $${form}$ is shown. The dashed line is its asymptote. Find $a$, $b$ and $c$.`;
  } else {
    prompt = `An exponential function $${form}$ has a horizontal asymptote at $y = ${c}$, and its graph passes through $${ptsTex[0]}$ and $${ptsTex[1]}$. Find $a$, $b$ and $c$.`;
  }
  const [u1, u2] = us, gap = u2 - u1;
  const d1 = pts[0].y.sub(c), d2 = pts[1].y.sub(c);
  const steps = [`The asymptote is $y = ${c}$, so $c = ${c}$: $${name}(x) = a\\cdot b^{${p ? `x ${p > 0 ? '+' : '-'} ${Math.abs(p)}` : 'x'}}${kTex(c)}$.`];
  const bu = u => (u === 1 ? 'b' : `b^{${u}}`);
  const sub = (q, u) => `${q.y.n} = a\\cdot ${bu(u)}${kTex(c)}`;
  if (u1 === 0) {
    steps.push(`Use $${ptsTex[0]}$: $${sub(pts[0], 0)}$. Since $b^0 = 1$, $a = ${pts[0].y.n} ${c < 0 ? '+' : '-'} ${Math.abs(c)} = ${a.tex()}$.`);
    steps.push(`Use $${ptsTex[1]}$: $${sub(pts[1], u2)}$, so $${a.eq(1) ? '' : a.eq(-1) ? '-' : `${a.tex()}\\,`}${bu(u2)} = ${d2.tex()}$${a.eq(1) ? '' : ` and $${bu(u2)} = ${d2.div(a).tex()}$`}. So $b = ${b.tex()}$.`);
  } else {
    steps.push(`Use both points: $${sub(pts[0], u1)}$ and $${sub(pts[1], u2)}$. ${c ? 'Subtract $c$: ' : ''}$a\\,${bu(u1)} = ${d1.tex()}$ and $a\\,${bu(u2)} = ${d2.tex()}$.`);
    steps.push(`Divide the second by the first: $${bu(gap)} = \\dfrac{${d2.tex()}}{${d1.tex()}} = ${d2.div(d1).tex()}$, so $b = ${b.tex()}$ (b is positive).`);
    steps.push(`Then $a = \\dfrac{${d1.tex()}}{${bu(u1)}} = ${a.tex()}$.`);
  }
  steps.push(`Equation: $${name}(x) = ${powT(a, b, p ? `x ${p > 0 ? '+' : '-'} ${Math.abs(p)}` : 'x')}${kTex(c)}$.`);
  return {
    tag: level === 1 ? 'point on the y-axis' : level === 2 ? 'shifted exponent' : 'from a description',
    prompt, displayGraph,
    parts: [
      { type: 'number', label: '$c =$', answer: F(c) },
      { type: 'number', label: '$a =$', answer: a },
      { type: 'number', label: '$b =$', answer: b },
    ],
    solution: steps.join('<br>'),
    _check: { a: a.value(), b: b.value(), c, p, pts: pts.map(q => [q.x, q.y.value()]) },
  };
}

// =====================================================================
// 8. Rewriting in y = abˣ Form (3.4)
// =====================================================================
export const expRewriteAccel = {
  id: 'exp-rewrite-accel', course: COURSE, group: G_EXP, lesson: '3.4',
  title: 'Rewriting in y = abˣ Form',
  blurb: 'Use exponent laws (including with e) to write a function as y = abˣ and name the growth or decay factor.',
  levels: {
    1: { name: 'Easy', desc: 'Exponent laws with e, like e⁴·eˣ, and y = e^(3t)' },
    2: { name: 'Medium', desc: 'Shifts and coefficients, like 4(2)^(x − 3) or 3e^(x + 2)' },
    3: { name: 'Challenging', desc: 'Coefficients on x, like 3(2)^(−2x), 5(½)^(−3x) or ¼e^(−x/2)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildRewrite(level, rng); if (p) return p; }
    throw new Error('exp-rewrite-accel: could not build');
  },
};
const ePowerChecker = (truth, v) => str => {
  const s0 = clean(str).replace(/^[a-z]\s*=\s*/i, '');
  if (!s0) return { ok: false, msg: 'Enter your answer.', format: true };
  let tree; try { tree = parseL(s0); } catch { return { ok: false, msg: 'Could not read that. Example: e^(x + 4)', format: true }; }
  const envs = [0.4, 1.3, -0.7];
  const same = envs.every(x => { let g; try { g = evalL(tree, { [v]: x }); } catch { return false; } const w = truth(x); return Math.abs(g - w) <= 1e-9 * Math.max(1, Math.abs(w)); });
  if (!same) return { ok: false };
  const count = n => (!n || typeof n !== 'object' ? 0 : (n.e ? 1 : 0) + ['a', 'b', 'arg', 'base'].reduce((s, k) => s + count(n[k]), 0));
  const un = n => (n && n.op === 'paren' ? un(n.a) : n), top = un(tree);
  const single = top && (top.e || (top.op === '^' && un(top.a)?.e));
  if (count(tree) !== 1 || !single) return { ok: false, msg: 'That is equal, but write it as a single power of e, like e^(x + 4).' };
  return { ok: true };
};
function buildRewrite(level, rng) {
  const v = pick(rng, ['x', 'x', 't']);
  if (level === 1 && rng() < 0.55) {
    const p = randInt(rng, 2, 9), q = randInt(rng, 2, 6);
    const type = pick(rng, ['product', 'quotient', 'power', 'power of e^x']);
    let given, ans, truth, why;
    if (type === 'product') { given = `e^{${p}}\\cdot e^{${v}}`; ans = `e^{${v} + ${p}}`; truth = x => Math.exp(x + p); why = `Product rule: add the exponents, $e^{${p}}\\cdot e^{${v}} = ${ans}$.`; }
    else if (type === 'quotient') { given = `\\dfrac{e^{${v}}}{e^{${p}}}`; ans = `e^{${v} - ${p}}`; truth = x => Math.exp(x - p); why = `Quotient rule: subtract the exponents, $${ans}$.`; }
    else if (type === 'power') { given = `\\left(e^{${p}}\\right)^{${q}}`; ans = `e^{${p * q}}`; truth = () => Math.exp(p * q); why = `Power to a power: multiply the exponents, $e^{${p}\\cdot ${q}} = ${ans}$.`; }
    else { given = `\\left(e^{${v}}\\right)^{${q}}`; ans = `e^{${q}${v}}`; truth = x => Math.exp(q * x); why = `Power to a power: multiply the exponents, $${ans}$.`; }
    return {
      tag: `e law, ${type}`,
      prompt: `Write as a single power of $e$. $\\;${given}$`,
      parts: [{ type: 'custom', label: 'Answer:', check: ePowerChecker(truth, v), preview: previewL, keys: ['e^', '(', ')'], placeholder: 'e.g. e^(x + 4)', answerTex: `$${ans}$`, help: 'Type e for the number e, and put the exponent in parentheses, like e^(x + 4).' }],
      solution: why, _check: { truth, v, type },
    };
  }
  // y = c·B^(k(v) + h) -> a·b^v
  let cT, a, b, aTex, bTexS, given, why = [];
  const e = level === 1 ? 'e' : pick(rng, ['int', 'int', 'e']);
  if (level === 1 || e === 'e') {
    // e forms
    if (level === 1) { const k = pick(rng, [2, 3, 4, -1, -2, F(1, 2), F(-1, 4), F(-1, 2)]); const K = k instanceof Frac ? k : F(k); given = `y = e^{${K.isInt() ? `${K.n === -1 ? '-' : K.n}${v}` : `${K.n < 0 ? '-' : ''}\\frac{${v}}{${K.d}}`}}`; a = 1; aTex = '1'; b = Math.exp(K.value()); bTexS = `e^{${K.tex()}}`; why.push(`Power to a power: $e^{${K.isInt() ? `${K.n === -1 ? '-' : K.n}${v}` : `${K.tex()}${v}`}} = \\left(e^{${K.tex()}}\\right)^{${v}}$. So $a = 1$ and $b = e^{${K.tex()}} \\approx ${d3(b)}$.`); }
    else if (level === 2) { const c = pick(rng, [2, 3, 4, 5]), h = nonzero(rng, -3, 3); given = `y = ${c}e^{${v} ${h > 0 ? '+' : '-'} ${Math.abs(h)}}`; a = c * Math.exp(h); const eh = h === 1 ? 'e' : `e^{${h}}`; aTex = `${c}${eh}`; b = Math.E; bTexS = 'e'; why.push(`Product rule in reverse: $e^{${v} ${h > 0 ? '+' : '-'} ${Math.abs(h)}} = e^{${v}}\\cdot ${eh}$.`, `So $y = ${c}${eh}\\cdot e^{${v}}$: $a = ${c}${eh} \\approx ${d3(a)}$ and $b = e \\approx 2.718$.`); }
    else { const c = pick(rng, [F(1, 4), F(1, 2), F(3), F(2)]), K = pick(rng, [F(-1, 2), F(-1, 3), F(1, 2), F(-2), F(3, 2)]); given = `y = ${c.isInt() ? c.n : `\\frac{${c.n}}{${c.d}}`}e^{${K.isInt() ? `${K.n}${v}` : `${K.n < 0 ? '-' : ''}\\frac{${Math.abs(K.n) === 1 ? '' : Math.abs(K.n)}${v}}{${K.d}}`}}`; a = c.value(); aTex = c.tex(); b = Math.exp(K.value()); bTexS = `e^{${K.tex()}}`; why.push(`Power to a power: $e^{${K.tex()}${v}} = \\left(e^{${K.tex()}}\\right)^{${v}}$.`, `So $a = ${c.tex()}$ and $b = e^{${K.tex()}} \\approx ${d3(b)}$.`); }
  } else if (level === 2) {
    const B = pick(rng, [2, 3, 4, 5]), c = pick(rng, [F(1), F(2), F(3), F(4), F(5), F(1, 2), F(-3)]), h = nonzero(rng, -3, 3);
    const A = c.mul(F(B).pow(h)); if (A.d > 125 || Math.abs(A.n) > 500) return null;
    cT = c.eq(1) ? '' : c.isInt() ? `${c.n}` : `\\frac{${c.n}}{${c.d}}`;
    given = `y = ${cT}${c.eq(1) ? `${B}` : `(${B})`}^{${v} ${h > 0 ? '+' : '-'} ${Math.abs(h)}}`;
    a = A.value(); aTex = A.tex(); b = B; bTexS = `${B}`;
    why.push(`Product rule in reverse: $${B}^{${v} ${h > 0 ? '+' : '-'} ${Math.abs(h)}} = ${B}^{${h}}\\cdot ${B}^{${v}}$, and $${B}^{${h}} = ${F(B).pow(h).tex()}$.`, `So $a = ${c.eq(1) ? '' : `${c.tex()}\\cdot `}${F(B).pow(h).tex()} = ${A.tex()}$ and $b = ${B}$.`);
  } else {
    const [B, K] = pick(rng, [[F(2), F(-2)], [F(2), F(3)], [F(1, 2), F(-3)], [F(4), F(1, 2)], [F(9), F(-1, 2)], [F(3), F(-2)], [F(8), F(2, 3)], [F(1, 3), F(-2)]]);
    const c = pick(rng, [F(3), F(5), F(-3), F(2), F(1, 2), F(-2)]);
    const BK = B.pow(K.n); let bb;
    if (K.d === 1) bb = BK; else { const r = Math.round(Math.pow(BK.value(), 1 / K.d)); bb = F(r); if (Math.abs(Math.pow(r, K.d) - BK.value()) > 1e-9) { const rr = Math.round(Math.pow(1 / BK.value(), 1 / K.d)); bb = F(1, rr); if (Math.abs(Math.pow(bb.value(), K.d) - BK.value()) > 1e-9) return null; } }
    cT = c.isInt() ? `${c.n}` : `\\frac{${c.n}}{${c.d}}`;
    const kx = K.isInt() ? `${K.n === -1 ? '-' : K.n}${v}` : `${K.n < 0 ? '-' : ''}\\frac{${Math.abs(K.n) === 1 ? '' : Math.abs(K.n)}${v}}{${K.d}}`;
    given = `y = ${cT}${B.isInt() ? `(${B.n})` : bTex(B)}^{${kx}}`;
    a = c.value(); aTex = c.tex(); b = bb.value(); bTexS = bb.tex();
    why.push(`Power to a power: $${bTex(B)}^{${kx}} = \\left(${bTex(B)}^{${K.tex()}}\\right)^{${v}}$, and $${bTex(B)}^{${K.tex()}} = ${bb.tex()}$.`, `So $a = ${c.tex()}$ and $b = ${bb.tex()}$.`);
  }
  // growth: the graph rises from left to right, so a negative a flips it
  const growth = (a > 0) === (b > 1);
  why.push(a > 0 ? `$a > 0$ and $b ${b > 1 ? '> 1' : '< 1'}$, so the graph ${growth ? 'rises' : 'falls'} from left to right: exponential ${growth ? 'growth' : 'decay'}.`
    : `$b ${b > 1 ? '> 1' : '< 1'}$, but $a < 0$ reflects the graph over the x-axis, so it ${growth ? 'rises' : 'falls'} from left to right: exponential ${growth ? 'growth' : 'decay'}.`);
  const vp = (label, val, tex) => ({ type: 'custom', label, check: valueChecker(val), preview: previewL, keys: ['e^', '/', '(', ')', '^'], placeholder: 'e.g. 1/8 or 3e^2', answerTex: `$${tex}$${Number.isInteger(val) || /^-?\d+$|frac|^-?\d+\/\d+$/.test(tex) && !/e/.test(tex) ? '' : ` $\\approx ${d3(val)}$`}`, help: 'Exact answers like 3e^2 or 1/8 are best; decimals rounded to 3 places also count.' });
  return {
    tag: level === 1 ? 'e^(kt)' : level === 2 ? (bTexS === 'e' ? 'e with a shift' : 'shift') : (bTexS.startsWith('e') ? 'e with a coefficient on x' : 'coefficient on x'),
    prompt: `Write in the form $y = ab^{${v}}$, then say whether it is growth or decay. $\\;${given}$`,
    parts: [vp('$a =$', a, aTex), vp('$b =$ (the growth or decay factor)', b, bTexS), { type: 'mc', label: 'This is exponential:', choices: ['Growth', 'Decay'], answer: growth ? 0 : 1 }],
    solution: why.join('<br>'),
    _check: { a, b, v, given },
  };
}

// =====================================================================
// 9. Writing y = abˣ from Two Points (3.4), the Accelerated version
// =====================================================================
export const expTwoPointsAccel = {
  id: 'exp-two-points-accel', course: COURSE, group: G_EXP, lesson: '3.4',
  title: 'Writing y = abˣ from Two Points',
  blurb: 'Divide to cancel a and find b, then solve for a.',
  levels: {
    1: { name: 'Easy', desc: 'One point on the y-axis, like (0, 5) and (1, 15)' },
    2: { name: 'Medium', desc: 'Neither point at x = 0, like (1, 15) and (2, 22.5)' },
    3: { name: 'Challenging', desc: 'Points farther apart and decimal data, like (0, 20) and (3, 14.58), or from a graph' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildTwo(level, rng); if (p) return p; }
    throw new Error('exp-two-points-accel: could not build');
  },
};
const decF = v => { const r = Math.round(v * 10000); return F(r, 10000); };
const isTidy = v => Math.abs(v * 10000 - Math.round(v * 10000)) < 1e-6;
const numTex = v => { const r = Math.round(v * 10000) / 10000; return String(r); };
function buildTwo(level, rng) {
  const b = level === 1 ? pick(rng, [2, 3, 4, 1.5, 0.5]) : level === 2 ? pick(rng, [1.5, 1.6, 2, 3, 0.5, 0.8, 1.2, 2.5]) : pick(rng, [0.9, 1.2, 0.8, 1.1, 0.5, 1.5, 0.6]);
  const a = level === 3 ? pick(rng, [20, 50, 100, 200, 40, 500]) : pick(rng, [5, 10, 20, 30, 4, 6, 8, 3]);
  let xs;
  if (level === 1) xs = [0, pick(rng, [1, 1, 2])];
  else if (level === 2) { const x1 = pick(rng, [1, 2]); xs = [x1, x1 + 1]; }
  else xs = pick(rng, [[0, 3], [1, 3], [2, 4], [0, 2], [0, 1]]);
  const ys = xs.map(x => a * Math.pow(b, x));
  if (ys.some(y => !isTidy(y) || y > 5000)) return null;
  const name = pick(rng, ['f', 'g', 'y']);
  const pTex = xs.map((x, i) => `(${x}, ${numTex(ys[i])})`);
  const graph = level === 3 && xs[0] === 0 && xs[1] === 1;
  const steps = [];
  if (xs[0] === 0) steps.push(`At $x = 0$, $y = a\\cdot b^0 = a$, so $a = ${a}$.`);
  const bp = k => (k === 0 ? 'a' : k === 1 ? 'ab' : `ab^{${k}}`);
  steps.push(`Divide the two equations to cancel $a$: $\\dfrac{${bp(xs[1])}}{${bp(xs[0])}} = ${xs[1] - xs[0] === 1 ? 'b' : `b^{${xs[1] - xs[0]}}`} = \\dfrac{${numTex(ys[1])}}{${numTex(ys[0])}} = ${numTex(Math.pow(b, xs[1] - xs[0]))}$${xs[1] - xs[0] > 1 ? `, so $b = \\sqrt${xs[1] - xs[0] === 2 ? '' : `[${xs[1] - xs[0]}]`}{${numTex(Math.pow(b, xs[1] - xs[0]))}} = ${b}$` : `, so $b = ${b}$`}.`);
  if (xs[0] !== 0) steps.push(`Substitute into the first point: $${numTex(ys[0])} = a\\cdot ${xs[0] === 1 ? b : `(${b})^{${xs[0]}}`}$, so $a = \\dfrac{${numTex(ys[0])}}{${numTex(Math.pow(b, xs[0]))}} = ${a}$.`);
  steps.push(`Equation: $y = ${a}(${b})^x$${b < 1 ? ' (decay, since $0 < b < 1$)' : ''}.`);
  return {
    tag: level === 1 ? 'point on the y-axis' : level === 2 ? 'consecutive x-values' : graph ? 'from a graph' : 'farther apart',
    prompt: graph ? `The graph of an exponential function $y = ab^x$ passes through the labeled points. Find $a$ and $b$.`
      : `Find an exponential function $y = ab^x$ whose graph contains the points $${pTex[0]}$ and $${pTex[1]}$.`,
    displayGraph: graph ? { window: { xmin: -1, xmax: 6, ymin: 0, ymax: Math.ceil(Math.max(...ys) * 1.3) }, fn: x => a * Math.pow(b, x), labels: xs.map((x, i) => ({ x, y: ys[i], text: pTex[i] })) } : undefined,
    parts: [{ type: 'number', label: '$a =$', answer: F(a) }, { type: 'number', label: '$b =$', answer: decF(b) }],
    solution: steps.join('<br>'),
    _check: { a, b, xs, ys },
  };
}

// =====================================================================
// 10. Domain and Range of Exponential Functions (3.2)
// =====================================================================
export const expDomainAccel = {
  id: 'exp-domain-range-accel', course: COURSE, group: G_EXP, lesson: '3.2',
  title: 'Domain and Range of Exponential Functions',
  blurb: 'The domain is always all real numbers. The range is above or below the asymptote y = k.',
  levels: {
    1: { name: 'Easy', desc: 'Shifts, like 2^(x − 1) + 3' },
    2: { name: 'Medium', desc: 'Reflections over the x-axis and fraction bases, like −(⅓)^(x + 2) − 4' },
    3: { name: 'Challenging', desc: 'Most or all of the transformations, like −3(½)^(−2(x + 1)) + 5' },
  },
  generate(level, rng) {
    const T = { A: F(1), B: F(1), b: pick(rng, Object.values(BASES)), h: 0, k: nonzero(rng, -8, 8) };
    if (level === 1) { T.b = pick(rng, [F(2), F(3), F(4), F(5)]); T.h = randInt(rng, -5, 5); }
    else if (level === 2) { T.A = F(pick(rng, [-1, -1, 1])); T.h = randInt(rng, -5, 5); }
    else {
      T.A = pick(rng, [F(2), F(3), F(-2), F(-3), F(1, 2), F(-1, 2), F(-4)]); T.B = pick(rng, [F(2), F(-2), F(-1), F(3), F(1, 2), F(-1, 3)]);
      T.h = nonzero(rng, -4, 4); if (rng() < 0.5 && T.A.sign() > 0) T.A = T.A.neg();
    }
    const expand = level === 3 && T.B.isInt() && rng() < 0.5;
    const name = pick(rng, ['f', 'g', 'h', 'p']);
    const steps = [
      `An exponential function can take any input, and transformations do not change that: the domain is all real numbers.`,
      `The parent $${parentTex(T.b)}$ has range $y > 0$ and asymptote $y = 0$.`,
    ];
    const pieces = [T.B.sign() < 0 ? 'the reflection over the y-axis' : '', !T.A.abs().eq(1) ? 'the vertical stretch' : '', !T.B.abs().eq(1) ? 'the horizontal stretch' : '', T.h ? 'the horizontal shift' : ''].filter(Boolean);
    if (pieces.length) { const j = pieces.length > 1 ? pieces.slice(0, -1).join(', ') + ' and ' + pieces[pieces.length - 1] : pieces[0]; steps.push(`${j[0].toUpperCase() + j.slice(1)} ${pieces.length > 1 ? 'do' : 'does'} not move the asymptote.`); }
    if (T.A.sign() < 0) steps.push('The negative in front reflects over the x-axis, so the graph is now below its asymptote.');
    steps.push(`The vertical shift moves the asymptote to $y = ${T.k}$. The graph is ${T.A.sign() > 0 ? 'above' : 'below'} it: range $${rangeTex(T)}$.`);
    return {
      tag: level === 1 ? 'shifts' : level === 2 ? (T.A.sign() < 0 ? 'x-axis reflection' : 'shifts') : 'many transformations',
      prompt: `Find the domain and range of $${name}(x) = ${eTex(T, expand)}$.`,
      parts: [domainPart(), rangePart(T)],
      solution: steps.join('<br>'),
      _check: { T: { A: T.A.value(), B: T.B.value(), b: T.b.value(), h: T.h, k: T.k }, expand },
    };
  },
};

export const UNIT3_ACCEL = [expLaws, ratExpEval, radicalExp, expTransformAccel, expGraphAccel, expDomainAccel, expReadAccel, expWriteAccel, expRewriteAccel, expTwoPointsAccel];
void readValue; void matches;
