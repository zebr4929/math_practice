// Skill: Holes vs. zeros vs. vertical asymptotes in factored rational functions
import { F, Frac, randInt, pick, nonzero, shuffle, distinctInts, factorTex, paren } from '../../math.js?v=1.9';

export const skill = {
  id: 'holes',
  title: 'Holes, Zeros & Asymptotes',
  course: 'precalc',
  group: 'Unit 1: Rational functions',
  blurb: 'Decide what happens at each x-value: what cancels, what is left over, and what multiplicity does.',
  levels: {
    1: { name: 'Easy', desc: 'Classify x-values when each factor appears once' },
    2: { name: 'Medium', desc: 'Repeated factors: what is left after canceling' },
    3: { name: 'Challenging', desc: 'Find every zero, asymptote and hole, with coordinates' },
  },
  generate(level, rng) {
    return level === 1 ? classifySimple(rng) : level === 2 ? classifyMultiplicity(rng) : fullAnalysis(rng);
  },
};

const CHOICES = ['Hole', 'Vertical asymptote', 'Zero (x-intercept)', 'None of these'];
const IDX = { hole: 0, va: 1, zero: 2, none: 3 };

// A rational function: K * prod (x - r)^m over prod (x - s)^n
function analyze(K, num, den) {
  const roots = [...new Set([...Object.keys(num), ...Object.keys(den)].map(Number))].sort((a, b) => a - b);
  const info = {};
  const redNum = {}, redDen = {};
  for (const r of roots) {
    const m = num[r] || 0, n = den[r] || 0, c = Math.min(m, n);
    if (m - c) redNum[r] = m - c;
    if (n - c) redDen[r] = n - c;
  }
  const zeros = [], vas = [], holes = [];
  for (const r of roots) {
    const inDen = (den[r] || 0) > 0;
    if (redDen[r]) { vas.push(r); info[r] = 'va'; }
    else if (inDen) { holes.push(r); info[r] = 'hole'; }
    else if (redNum[r]) { zeros.push(r); info[r] = 'zero'; }
  }
  const evalReduced = x => {
    let v = F(K);
    for (const r in redNum) v = v.mul(F(x - Number(r)).pow(redNum[r]));
    for (const r in redDen) v = v.div(F(x - Number(r)).pow(redDen[r]));
    return v;
  };
  const holePts = holes.map(h => [h, evalReduced(h)]);
  return { zeros, vas, holes, holePts, info, redNum, redDen };
}

function polyTex(K, factors, leadAlone) {
  const keys = Object.keys(factors).map(Number).sort((a, b) => b - a);
  const body = keys.map(r => factorTex(r, factors[r])).join('');
  if (!body) return String(K);
  if (K === 1) return body;
  if (K === -1) return '-' + body;
  return K + body;
}

function fnTex(K, num, den, name = 'f') {
  const top = polyTex(Math.abs(K), num), bot = polyTex(1, den);
  return `${name}(x) = ${K < 0 ? '-' : ''}\\dfrac{${top}}{${bot}}`;
}

function explain(x, num, den, kind, holeY) {
  const m = num[x] || 0, n = den[x] || 0;
  const f = factorTex(x);
  if (kind === 'none') return `$x = ${x}$ does not make any factor zero, so nothing special happens there.`;
  if (kind === 'zero') return `$${f}$ is only in the numerator, so $x = ${x}$ is a zero.`;
  if (kind === 'va') {
    if (m === 0) return `$${f}$ is only in the denominator, so $x = ${x}$ is a vertical asymptote.`;
    return `$${f}$ appears ${m === 1 ? 'once' : m + ' times'} on top and ${n === 2 ? 'twice' : n + ' times'} on the bottom. After canceling, $${factorTex(x, n - m)}$ is still in the denominator, so $x = ${x}$ is a vertical asymptote, not a hole.`;
  }
  // hole
  let s = `$${f}$ appears ${m === 1 ? 'once' : m + ' times'} on top and ${n === 1 ? 'once' : n + ' times'} on the bottom, so it cancels completely from the denominator: $x = ${x}$ is a hole.`;
  if (m > n) s += ` A factor of $${factorTex(x, m - n)}$ is left on top, so the hole sits on the $x$-axis, but $x = ${x}$ is <b>not</b> a zero because the function is undefined there.`;
  if (holeY !== undefined) s += ` Its $y$-value is $${holeY.tex()}$.`;
  return s;
}

// ---------- Level 1 ----------
function classifySimple(rng) {
  const [a, b, c, d] = distinctInts(rng, 4, -6, 6);
  const K = pick(rng, [1, 1, 2, 3, -1, -2]);
  const num = { [a]: 1, [b]: 1 }, den = { [a]: 1, [c]: 1 };
  const A = analyze(K, num, den);
  const asks = shuffle(rng, [a, b, c, d]).slice(0, 2);
  const kindOf = x => A.info[x] || 'none';
  return {
    tag: 'classify (single factors)',
    prompt: `Consider $${fnTex(K, num, den)}$. What happens on the graph at each $x$-value?`,
    parts: asks.map(x => ({ type: 'mc', label: `At $x = ${x}$:`, choices: CHOICES, answer: IDX[kindOf(x)] })),
    solution: asks.map(x => explain(x, num, den, kindOf(x))).join('<br>'),
  };
}

// ---------- Level 2 ----------
function classifyMultiplicity(rng) {
  const [a, b, c] = distinctInts(rng, 3, -6, 6);
  const K = pick(rng, [1, 1, 2, -1, 3]);
  // shared root a with interesting multiplicities
  const [m, n] = pick(rng, [[1, 2], [2, 1], [2, 2], [1, 2], [2, 1], [1, 3], [3, 1]]);
  const num = { [a]: m, [b]: 1 }, den = { [a]: n, [c]: 1 };
  const A = analyze(K, num, den);
  const kindA = A.info[a];
  return {
    tag: `repeated factor (${m} on top, ${n} on bottom)`,
    prompt: `Consider $${fnTex(K, num, den)}$.`,
    parts: [
      { type: 'mc', label: `What happens at $x = ${a}$?`, choices: CHOICES, answer: IDX[kindA] },
      { type: 'list', label: 'List all zeros of $f$ (comma-separated, or <i>none</i>)', answer: A.zeros, placeholder: 'e.g. 2, -5' },
    ],
    solution: explain(a, num, den, kindA) + '<br>'
      + `Zeros come from numerator factors that do not also make the denominator zero: ${A.zeros.length ? '$x = ' + A.zeros.join(',\\ ') + '$' : 'none'}.`
      + (kindA === 'hole' && m > n ? ` ($x = ${a}$ is excluded even though a factor is left on top.)` : ''),
  };
}

// ---------- Level 3 ----------
function fullAnalysis(rng) {
  let K, num, den, A, guard = 0;
  do {
    const roots = distinctInts(rng, 4, -6, 6);
    const [h, z, v, extra] = roots;
    K = pick(rng, [1, 2, 3, -1, -2, 5]);
    const style = pick(rng, ['plain', 'axisHole', 'doubleVA', 'doubleZero']);
    num = {}; den = {};
    // one hole at h
    if (style === 'axisHole') { num[h] = 2; den[h] = 1; } else { num[h] = 1; den[h] = 1; }
    num[z] = style === 'doubleZero' ? 2 : 1;
    den[v] = style === 'doubleVA' ? 2 : 1;
    if (rng() < 0.6) { if (rng() < 0.5) num[extra] = 1; else den[extra] = 1; }
    A = analyze(K, num, den);
  } while ((A.holes.length !== 1 || Math.abs(A.holePts[0][1].n) > 99 || A.holePts[0][1].d > 40) && guard++ < 200);
  const [hx, hy] = A.holePts[0];
  const reducedTex = (() => {
    const top = polyTex(Math.abs(K), A.redNum), bot = polyTex(1, A.redDen);
    return `${K < 0 ? '-' : ''}\\dfrac{${top}}{${bot}}`;
  })();
  // hole y computation text
  const sub = (() => {
    const top = Object.keys(A.redNum).map(r => `${paren(hx - Number(r))}${A.redNum[r] > 1 ? '^{' + A.redNum[r] + '}' : ''}`).join('');
    const bot = Object.keys(A.redDen).map(r => `${paren(hx - Number(r))}${A.redDen[r] > 1 ? '^{' + A.redDen[r] + '}' : ''}`).join('');
    return `${K < 0 ? '-' : ''}\\dfrac{${Math.abs(K) === 1 && top ? '' : Math.abs(K)}${top}}{${bot || 1}}`;
  })();
  return {
    tag: 'full analysis',
    prompt: `Consider $${fnTex(K, num, den)}$. Find its zeros, vertical asymptotes and hole.`,
    parts: [
      { type: 'list', label: 'Zeros ($x$-values, or <i>none</i>)', answer: A.zeros, placeholder: 'e.g. 2, -5' },
      { type: 'list', label: 'Vertical asymptotes ($x$-values)', answer: A.vas, placeholder: 'e.g. 3' },
      { type: 'point', label: 'Hole (as a point)', answer: [F(hx), hy], placeholder: '(x, y)' },
    ],
    solution: `Cancel common factors: $f(x) = ${reducedTex}$ for $x \\ne ${hx}$.<br>`
      + `<b>Zeros:</b> ${A.zeros.length ? '$x = ' + A.zeros.join(',\\ ') + '$' : 'none'} (factors left on top that are not excluded).<br>`
      + `<b>Vertical asymptotes:</b> $x = ${A.vas.join(',\\ x = ')}$ (factors left on the bottom).<br>`
      + `<b>Hole:</b> ${explain(hx, num, den, 'hole')}<br>Substitute $x = ${hx}$ into the simplified form: $${sub} = ${hy.tex()}$, so the hole is $\\left(${hx},\\ ${hy.tex()}\\right)$.`,
  };
}

export const _test = { analyze };
