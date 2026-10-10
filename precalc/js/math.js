// Core math utilities: exact fractions, a safe expression parser, and answer checkers.

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

export class Frac {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error('Frac needs integers: ' + n + '/' + d);
    if (d === 0) throw new Error('Division by zero');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g; this.d = d / g;
    if (Object.is(this.n, -0)) this.n = 0;
  }
  static of(x) { return x instanceof Frac ? x : new Frac(x, 1); }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  pow(k) {
    let r = new Frac(1);
    const base = k < 0 ? new Frac(this.d, this.n) : this;
    for (let i = 0; i < Math.abs(k); i++) r = r.mul(base);
    return r;
  }
  isZero() { return this.n === 0; }
  isInt() { return this.d === 1; }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  value() { return this.n / this.d; }
  sign() { return Math.sign(this.n); }
  abs() { return new Frac(Math.abs(this.n), this.d); }
  tex() {
    if (this.d === 1) return String(this.n);
    return (this.n < 0 ? '-' : '') + `\\frac{${Math.abs(this.n)}}{${this.d}}`;
  }
  // Plain text form like -3/4
  text() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  // Decimal if it terminates neatly (e.g. 1.5), otherwise null
  terminatingDecimal() {
    let d = this.d;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    if (d !== 1) return null;
    return String(+(this.n / this.d).toFixed(10));
  }
}
export const F = (n, d = 1) => new Frac(n, d);

// ---------- Expression parser ----------
// Supports numbers (incl. decimals), one-letter variables, + - * / ^, parentheses,
// implicit multiplication (2n, 3(n-1), (n-1)(n+2)), and unicode minus/times.

function normalize(s) {
  return String(s)
    .replace(/[−–—]/g, '-')
    .replace(/[×⋅·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\*\*/g, '^')
    .replace(/[⁰¹²³⁴-⁹]+/g, m => '^' + [...m].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
    .trim();
}

function tokenize(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const str = s.slice(i, j);
      if ((str.match(/\./g) || []).length > 1 || str === '.') throw new Error('Bad number "' + str + '"');
      toks.push({ t: 'num', v: str });
      i = j; continue;
    }
    if (/[a-zA-Z]/.test(c)) { toks.push({ t: 'var', v: c }); i++; continue; }
    if ('+-*/^()'.includes(c)) { toks.push({ t: c }); i++; continue; }
    if (c === '[' || c === '{') { toks.push({ t: '(' }); i++; continue; }
    if (c === ']' || c === '}') { toks.push({ t: ')' }); i++; continue; }
    throw new Error('Unexpected "' + c + '"');
  }
  // Insert implicit multiplication
  const out = [];
  for (let k = 0; k < toks.length; k++) {
    const a = out[out.length - 1], b = toks[k];
    if (a && (a.t === 'num' || a.t === 'var' || a.t === ')') && (b.t === 'num' || b.t === 'var' || b.t === '(')) {
      if (!(a.t === 'num' && b.t === 'num')) out.push({ t: '*', implicit: true });
    }
    out.push(b);
  }
  return out;
}

// Grammar: expr = term (('+'|'-') term)* ; term = unary (('*'|'/') unary)* ;
// unary = ('-'|'+') unary | power ; power = atom ('^' unary)?
export function parse(input) {
  const s = normalize(input);
  if (!s) throw new Error('Empty');
  const toks = tokenize(s);
  let p = 0;
  const peek = () => toks[p];
  const take = t => { if (!toks[p] || toks[p].t !== t) throw new Error('Expected "' + t + '"'); return toks[p++]; };
  function expr() {
    let node = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = toks[p++].t; node = { op, a: node, b: term() };
    }
    return node;
  }
  function term() {
    let node = unary();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const tk = toks[p++]; node = { op: tk.t, a: node, b: unary(), implicit: !!tk.implicit };
    }
    return node;
  }
  function unary() {
    if (peek() && peek().t === '-') { p++; return { op: 'neg', a: unary() }; }
    if (peek() && peek().t === '+') { p++; return unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (peek() && peek().t === '^') { p++; return { op: '^', a: base, b: unary() }; }
    return base;
  }
  function atom() {
    const tk = peek();
    if (!tk) throw new Error('Incomplete expression');
    if (tk.t === 'num') { p++; return { num: tk.v }; }
    if (tk.t === 'var') { p++; return { v: tk.v }; }
    if (tk.t === '(') { p++; const e = expr(); take(')'); return { op: 'paren', a: e }; }
    throw new Error('Unexpected "' + tk.t + '"');
  }
  const tree = expr();
  if (p < toks.length) throw new Error('Unexpected "' + toks[p].t + '"');
  return tree;
}

export function evaluate(node, vars = {}) {
  if (node.num !== undefined) return parseFloat(node.num);
  if (node.v !== undefined) {
    if (!(node.v in vars)) throw new Error('Unknown letter "' + node.v + '"');
    return vars[node.v];
  }
  switch (node.op) {
    case 'paren': return evaluate(node.a, vars);
    case 'neg': return -evaluate(node.a, vars);
    case '+': return evaluate(node.a, vars) + evaluate(node.b, vars);
    case '-': return evaluate(node.a, vars) - evaluate(node.b, vars);
    case '*': return evaluate(node.a, vars) * evaluate(node.b, vars);
    case '/': return evaluate(node.a, vars) / evaluate(node.b, vars);
    case '^': return Math.pow(evaluate(node.a, vars), evaluate(node.b, vars));
  }
  throw new Error('Bad expression');
}

export function variables(node, set = new Set()) {
  if (node.v !== undefined) set.add(node.v);
  if (node.a) variables(node.a, set);
  if (node.b) variables(node.b, set);
  return set;
}

export function toTex(node) {
  if (node.num !== undefined) return node.num;
  if (node.v !== undefined) return node.v;
  switch (node.op) {
    case 'paren': return '\\left(' + toTex(node.a) + '\\right)';
    case 'neg': return '-' + toTex(node.a);
    case '+': return toTex(node.a) + '+' + toTex(node.b);
    case '-': return toTex(node.a) + '-' + toTex(node.b);
    case '*': return toTex(node.a) + (node.implicit ? '' : '\\cdot ') + toTex(node.b);
    case '/': return '\\frac{' + toTex(strip(node.a)) + '}{' + toTex(strip(node.b)) + '}';
    case '^': return '{' + toTex(node.a) + '}^{' + toTex(strip(node.b)) + '}';
  }
  return '';
}
const strip = n => (n.op === 'paren' ? n.a : n);

// ---------- Answer checkers ----------
// Each returns { ok: boolean, msg?: string } ; msg explains format problems.

function close(a, b, decimalTyped) {
  if (!isFinite(a)) return false;
  if (decimalTyped) return Math.abs(a - b) <= 0.0051 + 1e-9 * Math.abs(b);
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

export function readNumber(str) {
  const s = normalize(str);
  if (!s) return { error: 'Enter an answer.' };
  let tree;
  try { tree = parse(s); } catch (e) { return { error: 'Could not read "' + str + '". Use numbers like 5, -3/4 or 2.5.' }; }
  if (variables(tree).size) return { error: 'Your answer should be a number, without letters.' };
  const v = evaluate(tree);
  if (!isFinite(v)) return { error: 'That value is undefined.' };
  return { value: v, decimal: s.includes('.') };
}

export function checkNumber(str, target) {
  const r = readNumber(str);
  if (r.error) return { ok: false, msg: r.error, format: true };
  return { ok: close(r.value, Frac.of(target).value(), r.decimal) };
}

const NONE_WORDS = /^(none|no|dne|n\/a|na|nothing|empty|\{\s*\}|ø|∅)$/i;

export function checkList(str, targets) {
  const s = normalize(str);
  if (!s) return { ok: false, msg: 'Enter an answer, or type none.', format: true };
  if (NONE_WORDS.test(s)) return { ok: targets.length === 0 };
  const parts = s.replace(/^x\s*=\s*/i, '').split(/[,;]|\s+and\s+/i).map(t => t.replace(/^\s*x\s*=\s*/i, '').trim()).filter(Boolean);
  const vals = [];
  for (const part of parts) {
    const r = readNumber(part);
    if (r.error) return { ok: false, msg: 'Separate values with commas, like: -2, 5', format: true };
    vals.push(r);
  }
  const want = targets.map(t => Frac.of(t).value());
  if (vals.length !== want.length) return { ok: false };
  const used = new Array(want.length).fill(false);
  for (const v of vals) {
    const i = want.findIndex((w, k) => !used[k] && close(v.value, w, v.decimal));
    if (i < 0) return { ok: false };
    used[i] = true;
  }
  return { ok: true };
}

export function checkPoint(str, target /* [x, y] as Frac|number, or null for none */) {
  const s = normalize(str);
  if (!s) return { ok: false, msg: 'Enter an answer, or type none.', format: true };
  if (NONE_WORDS.test(s)) return { ok: target === null };
  const m = s.match(/^\(?\s*([^,]+)\s*,\s*([^,)]+)\s*\)?$/);
  if (!m) return { ok: false, msg: 'Write a point like (4, -2/3).', format: true };
  const x = readNumber(m[1]), y = readNumber(m[2]);
  if (x.error || y.error) return { ok: false, msg: 'Write a point like (4, -2/3).', format: true };
  if (target === null) return { ok: false };
  return { ok: close(x.value, Frac.of(target[0]).value(), x.decimal) && close(y.value, Frac.of(target[1]).value(), y.decimal) };
}

// Check a rule in variable `v` against a truth function at sample points.
export function checkRule(str, truth, v = 'n', samples = [1, 2, 3, 4, 5, 6, 7]) {
  let s = normalize(str).replace(/^[a-z]\s*_?\s*\(?\s*[a-z]\s*\)?\s*=\s*/i, '').replace(/^[a-z]_[a-z]\s*=\s*/i, '');
  if (!s) return { ok: false, msg: 'Enter a rule.', format: true };
  let tree;
  try { tree = parse(s); } catch (e) { return { ok: false, msg: 'Could not read that rule. Example: 4 + 3(n - 1)', format: true }; }
  const vs = variables(tree);
  for (const x of vs) if (x !== v) return { ok: false, msg: 'Use ' + v + ' as the only letter in your rule.', format: true };
  if (!vs.has(v)) return { ok: false };
  for (const n of samples) {
    const got = evaluate(tree, { [v]: n }), want = truth(n);
    if (!isFinite(got) || Math.abs(got - want) > 1e-7 * Math.max(1, Math.abs(want))) return { ok: false };
  }
  return { ok: true };
}

export function previewTex(str, v = 'n') {
  try {
    const s = normalize(str).replace(/^[a-z]\s*_?\s*\(?\s*[a-z]\s*\)?\s*=\s*/i, '');
    if (!s) return '';
    return toTex(parse(s));
  } catch (e) { return null; }
}

// ---------- Random helpers ----------
export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export const randInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const nonzero = (rng, a, b) => { let x; do { x = randInt(rng, a, b); } while (x === 0); return x; };
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function distinctInts(rng, count, lo, hi, exclude = []) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 1000) {
    const x = randInt(rng, lo, hi);
    if (!out.includes(x) && !exclude.includes(x)) out.push(x);
  }
  return out;
}

// ---------- TeX helpers ----------
// (x - a) factor, with a as an integer
export function factorTex(a, mult = 1, v = 'x') {
  let core;
  if (a === 0) core = v;
  else core = `(${v} ${a > 0 ? '-' : '+'} ${Math.abs(a)})`;
  if (mult === 1) return core;
  if (a === 0) return `${v}^{${mult}}`;
  return `${core}^{${mult}}`;
}
// signed term for building "a + b": returns "+ 3" / "- 3"
export const signed = x => {
  const f = Frac.of(x);
  return (f.sign() < 0 ? '- ' : '+ ') + f.abs().tex();
};
// wrap negative numbers in parentheses for substitution
export const paren = x => {
  const f = Frac.of(x);
  return f.sign() < 0 || !f.isInt() ? `\\left(${f.tex()}\\right)` : f.tex();
};
