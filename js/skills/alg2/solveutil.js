// Shared tools for "solve the quadratic" skills: exact roots, display, and checking
// student answers like "3 ± 2√5", "(3 ± 2i√3)/2", "-3/2, 4" or "x = 5".
import { F, Frac, gcd } from '../../math.js?v=1.8';

// ---------- exact roots of ax^2 + bx + c = 0 ----------
export function splitSquare(n) {
  let k = 1, r = n;
  for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { r /= f * f; k *= f; }
  return { k, r };
}

// Roots as (A ± B·√r)/d with gcd(A, B, d) = 1, d > 0; im = true means ± B·i·√r.
export function exactRoots(a, b, c) {
  const D = b * b - 4 * a * c;
  const im = D < 0;
  const { k, r } = splitSquare(Math.abs(D));
  let A = -b, B = k, d = 2 * a;
  if (d < 0) { A = -A; d = -d; }        // B is a ± coefficient, its sign does not matter
  if (D === 0) B = 0;
  if ((r === 1 || D === 0) && !im) {
    // rational roots: (A ± B)/d, reduce each separately
    const r1 = F(A + B, d), r2 = F(A - B, d);
    return { D, im: false, rational: true, roots: B === 0 ? [r1] : [r1, r2].sort((x, y) => x.value() - y.value()) };
  }
  const g = gcd(gcd(Math.abs(A), B), d);
  A /= g; B /= g; d /= g;
  return { D, im, rational: false, A, B, r, d, g };
}

export function rootValues(R) {
  if (R.rational) return R.roots.map(f => [f.value(), 0]);
  const re = R.A / R.d, mag = (R.B * Math.sqrt(R.r)) / R.d;
  return R.im ? [[re, mag], [re, -mag]] : [[re + mag, 0], [re - mag, 0]];
}

const radT = (B, r, im) => (r === 1 ? `${B === 1 ? '' : B}i` : `${B === 1 ? '' : B}${im ? 'i' : ''}\\sqrt{${r}}`);
export function rootsTex(R) {
  if (R.rational) return R.roots.map(f => `x = ${f.tex()}`).join(',\\quad ');
  const top = `${R.A === 0 ? '' : R.A + ' '}\\pm ${radT(R.B, R.r, R.im)}`;
  return `x = ${R.d === 1 ? top : `\\dfrac{${top}}{${R.d}}`}`;
}
export function rootsPlain(R) {
  if (R.rational) return R.roots.map(f => f.text()).join(', ');
  const rad = R.r === 1 ? `${R.B === 1 ? '' : R.B}i` : `${R.B === 1 ? '' : R.B}${R.im ? 'i' : ''}√${R.r}`;
  const top = `${R.A === 0 ? '' : R.A + ' '}± ${rad}`;
  return R.d === 1 ? top : `(${top})/${R.d}`;
}

// ---------- parsing student answers ----------
function normalize(s) {
  return String(s).toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/\+\/-|\+-/g, '±')
    .replace(/sqrt/g, '√')
    .replace(/\bx\s*_?\s*\d?\s*=/g, '')        // "x =", "x1 ="
    .replace(/\s+/g, '');
}

function tokenize(s) {
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ t: 'num', v: s.slice(i, j) }); i = j; continue; }
    if ('+-*/^()±√i'.includes(c)) { t.push({ t: c }); i++; continue; }
    if (c === '[') { t.push({ t: '(' }); i++; continue; }
    if (c === ']') { t.push({ t: ')' }); i++; continue; }
    throw new Error('bad char ' + c);
  }
  // implicit multiplication
  const out = [];
  for (const b of t) {
    const a = out[out.length - 1];
    if (a && ['num', 'i', ')'].includes(a.t) && ['num', 'i', '(', '√'].includes(b.t) && !(a.t === 'num' && b.t === 'num')) out.push({ t: '*' });
    out.push(b);
  }
  return out;
}

function parseTree(s) {
  const toks = tokenize(s);
  let p = 0;
  const peek = () => toks[p];
  function expr() {
    let n = term();
    while (peek() && ['+', '-', '±'].includes(peek().t)) { const op = toks[p++].t; n = { op, a: n, b: term() }; }
    return n;
  }
  function term() {
    let n = unary();
    while (peek() && ['*', '/'].includes(peek().t)) { const op = toks[p++].t; n = { op, a: n, b: unary() }; }
    return n;
  }
  function unary() {
    if (peek() && peek().t === '-') { p++; return { op: 'neg', a: unary() }; }
    if (peek() && peek().t === '+') { p++; return unary(); }
    if (peek() && peek().t === '±') { p++; return { op: 'pm1', a: unary() }; }
    return power();
  }
  function power() {
    const b = atom();
    if (peek() && peek().t === '^') { p++; return { op: '^', a: b, b: unary() }; }
    return b;
  }
  function atom() {
    const k = peek();
    if (!k) throw new Error('incomplete');
    if (k.t === 'num') { p++; return { num: k.v }; }
    if (k.t === 'i') { p++; return { i: true }; }
    if (k.t === '√') { p++; return { op: 'sqrt', a: sqrtArg() }; }
    if (k.t === '(') { p++; const e = expr(); if (!peek() || peek().t !== ')') throw new Error(')'); p++; return { op: 'paren', a: e }; }
    throw new Error('unexpected ' + k.t);
  }
  function sqrtArg() {          // √-12 and √(-12) both allowed; √12 binds to the number only
    if (peek() && peek().t === '-') { p++; return { op: 'neg', a: atom() }; }
    return atom();
  }
  const tree = expr();
  if (p < toks.length) throw new Error('extra');
  return tree;
}

// complex arithmetic on [re, im]
const C = {
  add: (x, y) => [x[0] + y[0], x[1] + y[1]], sub: (x, y) => [x[0] - y[0], x[1] - y[1]],
  mul: (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]],
  div: (x, y) => { const d = y[0] * y[0] + y[1] * y[1]; return [(x[0] * y[0] + x[1] * y[1]) / d, (x[1] * y[0] - x[0] * y[1]) / d]; },
};
function evalC(n, s) {
  if (n.num !== undefined) return [parseFloat(n.num), 0];
  if (n.i) return [0, 1];
  switch (n.op) {
    case 'paren': return evalC(n.a, s);
    case 'neg': { const v = evalC(n.a, s); return [-v[0], -v[1]]; }
    case 'pm1': { const v = evalC(n.a, s); return [s * v[0], s * v[1]]; }
    case '+': return C.add(evalC(n.a, s), evalC(n.b, s));
    case '-': return C.sub(evalC(n.a, s), evalC(n.b, s));
    case '±': { const b = evalC(n.b, s); return C.add(evalC(n.a, s), [s * b[0], s * b[1]]); }
    case '*': return C.mul(evalC(n.a, s), evalC(n.b, s));
    case '/': return C.div(evalC(n.a, s), evalC(n.b, s));
    case '^': { const e = evalC(n.b, s); let v = evalC(n.a, s); if (e[1] || !Number.isInteger(e[0]) || e[0] < 0 || e[0] > 6) throw new Error('pow'); let r = [1, 0]; for (let k = 0; k < e[0]; k++) r = C.mul(r, v); return r; }
    case 'sqrt': { const v = evalC(n.a, s); if (Math.abs(v[1]) > 1e-12) throw new Error('sqrt complex'); return v[0] >= 0 ? [Math.sqrt(v[0]), 0] : [0, Math.sqrt(-v[0])]; }
  }
  throw new Error('bad');
}
const hasPm = n => !!(n && (n.op === '±' || n.op === 'pm1' || hasPm(n.a) || hasPm(n.b)));
const hasRad = n => !!(n && (n.op === 'sqrt' || n.i || hasRad(n.a) || hasRad(n.b)));
const strip = n => (n.op === 'paren' ? strip(n.a) : n);
const intLit = n => { n = strip(n); if (n.num !== undefined && /^\d+$/.test(n.num)) return +n.num; if (n.op === 'neg') { const v = intLit(n.a); return v === null ? null : -v; } return null; };

// Integer coefficient of a term like 3, 2√5, -4i√3, 3i (null if not that shape)
function coef(n) {
  n = strip(n);
  if (n.num !== undefined) return /^\d+$/.test(n.num) ? +n.num : null;
  if (n.i || n.op === 'sqrt') return 1;
  if (n.op === 'neg' || n.op === 'pm1') return coef(n.a);
  if (n.op === '*') { const x = coef(n.a), y = coef(n.b); return x === null || y === null ? null : x * y; }
  return null;
}
function terms(n) {
  n = strip(n);
  if (['+', '-', '±'].includes(n.op)) return [...terms(n.a), ...terms(n.b)];
  return [n];
}

// Returns a message describing what still needs simplifying, or '' if simplified.
export function simplifyIssue(tree, { allowImag = true } = {}) {
  let msg = '';
  (function walk(n) {
    if (!n || msg) return;
    if (n.op === 'sqrt') {
      const v = intLit(n.a);
      if (v === null) { msg = 'Simplify the number under the radical to a single whole number.'; return; }
      if (v < 0) { msg = allowImag ? 'Write the square root of a negative number using i, like 2i√3.' : 'There should be no square roots of negative numbers here.'; return; }
      const { k, r } = splitSquare(v);
      if (r === 1) { msg = `√${v} is a perfect square; simplify it.`; return; }
      if (k > 1) { msg = `√${v} is not fully simplified: it has a perfect-square factor (${k * k}).`; return; }
    }
    if (n.op === '/') {
      const d = intLit(n.b);
      if (d === null) { msg = 'Use a whole-number denominator.'; return; }
      const cs = terms(n.a).map(coef);
      if (cs.every(x => x !== null)) {
        const g = cs.reduce((acc, x) => gcd(acc, Math.abs(x)), Math.abs(d));
        if (g > 1) { msg = 'The fraction is not fully reduced: everything on top and the bottom share a factor of ' + g + '.'; return; }
      }
      if (Math.abs(d) === 1) { msg = 'Drop the denominator of 1.'; return; }
    }
    walk(n.a); walk(n.b);
  })(tree);
  return msg;
}

// Read a list of solutions. Returns { values: [[re, im], ...], trees, error }
export function readSolutions(str) {
  const s = normalize(str);
  if (!s) return { error: 'Enter your solutions, separated by commas.' };
  if (/no(real)?solution|none|dne|∅/.test(s)) return { none: true, values: [], trees: [] };
  const items = s.replace(/\bor\b|and/g, ',').split(/[,;]/).filter(Boolean);
  const values = [], trees = [];
  for (const it of items) {
    let tree;
    try { tree = parseTree(it); } catch { return { error: 'Could not read "' + it + '". Examples: 3, -1/2   or   (3 ± 2√5)/2' }; }
    trees.push(tree);
    try {
      if (hasPm(tree)) values.push(evalC(tree, 1), evalC(tree, -1));
      else values.push(evalC(tree, 1));
    } catch { return { error: 'Could not read "' + it + '".' }; }
  }
  return { values, trees, decimal: /\d\.\d|^\.\d|[^\d]\.\d/.test(s) };
}

const near = (u, v) => Math.abs(u[0] - v[0]) < 1e-6 * Math.max(1, Math.abs(v[0])) && Math.abs(u[1] - v[1]) < 1e-6 * Math.max(1, Math.abs(v[1]));
function dedupe(vals) { const out = []; for (const v of vals) if (!out.some(o => near(o, v))) out.push(v); return out; }

// Build a checker for the roots R.
export function solutionChecker(R, { allowImag = true } = {}) {
  const want = dedupe(rootValues(R));
  return str => {
    const got = readSolutions(str);
    if (got.error) return { ok: false, msg: got.error, format: true };
    if (got.none) return { ok: false, msg: R.im ? 'There are no real solutions, but there are two imaginary ones. Write them using i.' : undefined };
    const vals = dedupe(got.values);
    const same = vals.length === want.length && want.every(w => vals.some(v => near(v, w)));
    if (!same) {
      if (vals.length < want.length && vals.every(v => want.some(w => near(v, w)))) return { ok: false, msg: 'Those are correct so far, but there are more solutions.' };
      return { ok: false };
    }
    if (!R.rational && got.decimal) return { ok: false, msg: 'Give exact answers (with radicals), not decimals.' };
    for (const t of got.trees) {
      const issue = simplifyIssue(t, { allowImag });
      if (issue) return { ok: false, msg: 'Those are the right values, but not fully simplified. ' + issue };
    }
    if (R.rational) {
      for (const t of got.trees) if (hasRad(t)) return { ok: false, msg: 'These solutions are rational; simplify the radicals away.' };
      for (const t of got.trees) if (hasPm(t)) return { ok: false, msg: 'Those are the right values, but write each solution as its own simplified number, separated by commas.' };
    }
    return { ok: true };
  };
}

// Preview for typed answers
export function solutionsPreview(str) {
  const s = normalize(str);
  if (!s) return '';
  try {
    return s.split(/[,;]/).filter(Boolean).map(it => texOf(parseTree(it))).join(',\\quad ');
  } catch { return null; }
}
function texOf(n) {
  if (n.num !== undefined) return n.num;
  if (n.i) return 'i';
  switch (n.op) {
    case 'paren': return `\\left(${texOf(n.a)}\\right)`;
    case 'neg': return '-' + texOf(n.a);
    case 'pm1': return '\\pm ' + texOf(n.a);
    case '+': return texOf(n.a) + '+' + texOf(n.b);
    case '-': return texOf(n.a) + '-' + texOf(n.b);
    case '±': return texOf(n.a) + '\\pm ' + texOf(n.b);
    case '*': return texOf(n.a) + texOf(n.b);
    case '/': return `\\dfrac{${texOf(strip(n.a))}}{${texOf(strip(n.b))}}`;
    case '^': return `{${texOf(n.a)}}^{${texOf(n.b)}}`;
    case 'sqrt': return `\\sqrt{${texOf(strip(n.a))}}`;
  }
  return '';
}

export const SOLVE_KEYS = ['±', '√', 'i', '(', ')', '/'];
export const SOLVE_KEYS_REAL = ['±', '√', '(', ')', '/'];

// ---------- equation display ----------
// terms: {x2, x1, x0} on each side; returns TeX like "3x^2 - 5x = 2"
export function sideTex(t) {
  const parts = [];
  const push = (c, v) => {
    if (c === 0) return;
    const abs = Math.abs(c), sign = c < 0 ? '-' : '+';
    const body = v ? `${abs === 1 ? '' : abs}${v}` : String(abs);
    parts.push(parts.length ? ` ${sign} ${body}` : `${c < 0 ? '-' : ''}${body}`);
  };
  push(t.x2 || 0, 'x^2'); push(t.x1 || 0, 'x'); push(t.x0 || 0, '');
  return parts.length ? parts.join('') : '0';
}
export function eqTex(L, R) { return `${sideTex(L)} = ${sideTex(R)}`; }

// Split a·x² + b·x + c = 0 into a random-looking but equivalent equation.
export function arrange(a, b, c, rng, style) {
  if (style === 'standard') return { L: { x2: a, x1: b, x0: c }, R: {} };
  if (style === 'constRight') return { L: { x2: a, x1: b }, R: { x0: -c } };
  if (style === 'linearRight') return { L: { x2: a }, R: { x1: -b, x0: -c } };
  if (style === 'mixed') return { L: { x2: a, x0: c }, R: { x1: -b } };
  return { L: { x2: a, x1: b, x0: c }, R: {} };
}

export { F, Frac };
