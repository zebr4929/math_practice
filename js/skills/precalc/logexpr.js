// A small expression reader that understands logarithms, for the 2.10–2.15 skills.
// Accepts: log_4(9), log_4 9, log₄9, log(100) (base 10), ln(5/2), e^4, sqrt(21), √21, 2^(x+3), |x|,
// implicit multiplication (3log(x), 2x), and single-letter variables. "e" is always the constant e.
import { F } from '../../math.js?v=2.9';

const SUB = '₀₁₂₃₄₅₆₇₈₉';
function normalize(s) {
  return String(s)
    .replace(/[−–—]/g, '-').replace(/[×⋅·]/g, '*').replace(/÷/g, '/')
    .replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=')
    .replace(/∞|infinity/gi, 'inf')
    .replace(/sqrt/gi, '√')
    .replace(/log\s*([₀-₉]+)/g, (m, d) => 'log_(' + [...d].map(c => SUB.indexOf(c)).join('') + ')')
    .trim();
}

function tokenize(s) {
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ t: 'num', v: s.slice(i, j) }); i = j; continue; }
    if (s.startsWith('log', i)) { t.push({ t: 'log' }); i += 3; continue; }
    if (s.startsWith('ln', i)) { t.push({ t: 'ln' }); i += 2; continue; }
    if (s.startsWith('inf', i)) { t.push({ t: 'inf' }); i += 3; continue; }
    if (c === '√') { t.push({ t: 'sqrt' }); i++; continue; }
    if (/[a-zA-Z]/.test(c)) { t.push({ t: c === 'e' ? 'e' : 'var', v: c }); i++; continue; }
    if ('+-*/^()_|{}[]'.includes(c)) { t.push({ t: c === '{' || c === '[' ? '(' : c === '}' || c === ']' ? ')' : c }); i++; continue; }
    throw new Error('Unexpected "' + c + '"');
  }
  return t;
}

export function parseL(input) {
  const toks = tokenize(normalize(input));
  if (!toks.length) throw new Error('empty');
  let p = 0;
  const peek = () => toks[p];
  const starts = k => k && ['num', 'var', 'e', '(', 'log', 'ln', 'sqrt', '|'].includes(k.t);
  function expr() {
    let n = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = toks[p++].t; n = { op, a: n, b: term() }; }
    return n;
  }
  function term() {
    let n = unary();
    for (;;) {
      const k = peek();
      if (k && (k.t === '*' || k.t === '/')) { p++; n = { op: k.t, a: n, b: unary() }; continue; }
      if (starts(k) && !(k.t === '|' && inAbs > 0)) { n = { op: '*', a: n, b: power() }; continue; }
      return n;
    }
  }
  function unary() {
    if (peek() && peek().t === '-') { p++; return { op: 'neg', a: unary() }; }
    if (peek() && peek().t === '+') { p++; return unary(); }
    return power();
  }
  function power() {
    const b = atom();
    if (peek() && peek().t === '^') { p++; return { op: '^', a: b, b: unary() }; }
    return b;
  }
  let inAbs = 0;
  function atom() {
    const k = peek();
    if (!k) throw new Error('incomplete');
    if (k.t === 'num') { p++; if ((k.v.match(/\./g) || []).length > 1) throw new Error('number'); return { num: k.v }; }
    if (k.t === 'var') { p++; return { v: k.v }; }
    if (k.t === 'e') { p++; return { e: true }; }
    if (k.t === '(') { p++; const n = expr(); if (!peek() || peek().t !== ')') throw new Error(')'); p++; return { op: 'paren', a: n }; }
    if (k.t === '|') { p++; inAbs++; const n = expr(); inAbs--; if (!peek() || peek().t !== '|') throw new Error('|'); p++; return { fn: 'abs', arg: n }; }
    if (k.t === 'sqrt') { p++; return { fn: 'sqrt', arg: power() }; }
    if (k.t === 'ln') { p++; return { fn: 'log', base: { e: true }, arg: power() }; }
    if (k.t === 'log') {
      p++;
      let base = null;
      if (peek() && peek().t === '_') { p++; base = atom(); }
      return { fn: 'log', base, arg: power() };
    }
    throw new Error('Unexpected ' + k.t);
  }
  const tree = expr();
  if (p < toks.length) throw new Error('extra');
  return tree;
}

export function evalL(n, env = {}) {
  if (n.num !== undefined) return parseFloat(n.num);
  if (n.e) return Math.E;
  if (n.v !== undefined) { if (!(n.v in env)) throw new Error('var ' + n.v); return env[n.v]; }
  if (n.fn === 'abs') return Math.abs(evalL(n.arg, env));
  if (n.fn === 'sqrt') return Math.sqrt(evalL(n.arg, env));
  if (n.fn === 'log') { const b = n.base ? evalL(n.base, env) : 10; return Math.log(evalL(n.arg, env)) / Math.log(b); }
  switch (n.op) {
    case 'paren': return evalL(n.a, env);
    case 'neg': return -evalL(n.a, env);
    case '+': return evalL(n.a, env) + evalL(n.b, env);
    case '-': return evalL(n.a, env) - evalL(n.b, env);
    case '*': return evalL(n.a, env) * evalL(n.b, env);
    case '/': return evalL(n.a, env) / evalL(n.b, env);
    case '^': return Math.pow(evalL(n.a, env), evalL(n.b, env));
  }
  throw new Error('bad');
}
export function varsL(n, out = new Set()) {
  if (!n || typeof n !== 'object') return out;
  if (n.v !== undefined) out.add(n.v);
  for (const k of ['a', 'b', 'arg', 'base']) if (n[k]) varsL(n[k], out);
  return out;
}
export const stripL = n => (n.op === 'paren' ? stripL(n.a) : n);
export function logsIn(n, out = []) {
  if (!n || typeof n !== 'object') return out;
  if (n.fn === 'log') out.push(n);
  for (const k of ['a', 'b', 'arg', 'base']) if (n[k]) logsIn(n[k], out);
  return out;
}

// tex for a typed answer
export function texL(n) {
  if (n.num !== undefined) return n.num;
  if (n.e) return 'e';
  if (n.v !== undefined) return n.v;
  if (n.fn === 'abs') return `\\left|${texL(n.arg)}\\right|`;
  if (n.fn === 'sqrt') return `\\sqrt{${texL(stripL(n.arg))}}`;
  if (n.fn === 'log') {
    const b = n.base ? stripL(n.base) : null;
    const head = !b ? '\\log' : b.e ? '\\ln' : `\\log_{${texL(b)}}`;
    return `${head}\\left(${texL(stripL(n.arg))}\\right)`;
  }
  switch (n.op) {
    case 'paren': return `\\left(${texL(n.a)}\\right)`;
    case 'neg': return '-' + texL(n.a);
    case '+': return `${texL(n.a)} + ${texL(n.b)}`;
    case '-': return `${texL(n.a)} - ${texL(n.b)}`;
    case '*': return `${texL(n.a)}\\,${texL(n.b)}`;
    case '/': return `\\frac{${texL(stripL(n.a))}}{${texL(stripL(n.b))}}`;
    case '^': return `{${texL(n.a)}}^{${texL(stripL(n.b))}}`;
  }
  return '';
}
export const previewL = str => { try { const s = String(str).trim(); if (!s) return ''; return texL(parseL(s.includes('=') ? s.slice(s.lastIndexOf('=') + 1) : s)); } catch { return null; } };

// ---------- answer checkers ----------
const isDecimalTyped = s => /\d\.\d|^\.\d|[^\d]\.\d/.test(s);
// a number: exact forms (log_4(9), 2 - e^5, (ln 3 + 2ln 5)/(ln 3 - 3ln 5)) or decimals to 3 places
export function readValue(str) {
  const s = String(str).trim();
  if (!s) return { error: 'Enter an answer.' };
  let tree;
  try { tree = parseL(s.includes('=') ? s.slice(s.lastIndexOf('=') + 1) : s); } catch { return { error: 'Could not read that. Examples: log_4(9), ln(5/2), 2 - e^5, or a decimal like 1.585.' }; }
  if (varsL(tree).size) return { error: 'Your answer should be a number, without letters (e is fine).' };
  let v; try { v = evalL(tree); } catch { return { error: 'Could not read that.' }; }
  if (!isFinite(v)) return { error: 'That value is undefined.' };
  return { value: v, decimal: isDecimalTyped(s) };
}
export const matches = (v, target, decimal) => Math.abs(v - target) < 1e-9 * Math.max(1, Math.abs(target)) || (decimal && Math.abs(v - target) <= 0.001 + 1e-9);
export function valueChecker(target) {
  return str => {
    const r = readValue(str);
    if (r.error) return { ok: false, msg: r.error, format: true };
    if (matches(r.value, target, r.decimal)) return { ok: true };
    if (r.decimal && Math.abs(r.value - target) < 0.02 && /\.\d{0,2}$/.test(String(str).trim())) return { ok: false, msg: 'Close. Give your answer to 3 decimal places (or exact).', format: true };
    return { ok: false };
  };
}
// a list of solutions, or "no solution"
export function listChecker(targets) {
  return str => {
    const s = String(str).trim().toLowerCase();
    if (!s) return { ok: false, msg: 'Enter your solutions separated by commas, or type no solution.', format: true };
    if (/no\s*(real)?\s*solution|none|∅|dne/.test(s)) return { ok: targets.length === 0 };
    const items = s.replace(/\bx\s*=\s*/g, '').split(/,|\bor\b|\band\b/).map(t => t.trim()).filter(Boolean);
    const vals = [];
    for (const it of items) { const r = readValue(it); if (r.error) return { ok: false, msg: r.error, format: true }; vals.push(r); }
    const used = new Set();
    for (const t of targets) {
      const i = vals.findIndex((v, k) => !used.has(k) && matches(v.value, t, v.decimal));
      if (i < 0) return { ok: false, msg: vals.length < targets.length ? undefined : undefined };
      used.add(i);
    }
    if (vals.length > targets.length) return { ok: false, msg: 'At least one of those is not a solution. Check each answer in the original equation (a log of a negative number or 0 is undefined).' };
    return { ok: true };
  };
}

// intervals: [{ lo, hi, lc, rc }] with lo/hi numbers (±Infinity allowed)
function splitTop(s, sep) {
  const out = []; let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === sep && depth === 1) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}
function endVal(t) {
  t = t.trim();
  if (/^\+?inf$/.test(t)) return { value: Infinity };
  if (/^-inf$/.test(t)) return { value: -Infinity };
  return readValue(t);
}
export function readIntervals(str, v = 'x') {
  const s = normalize(str).toLowerCase().replace(/\s+/g, '');
  if (!s) return { error: 'Enter your answer.' };
  if (/no(real)?solution|none|∅/.test(s)) return { intervals: [] };
  if (/allreal|^\(-inf,inf\)$/.test(s)) return { intervals: [{ lo: -Infinity, hi: Infinity, lc: false, rc: false }] };
  const pieces = s.split(/∪|\bu\b|(?<=[)\]])u(?=[(\[])|or/);
  const out = []; let decimal = false;
  for (const piece of pieces) {
    let m;
    if ((m = piece.match(/^([\[(])(.*)([\])])$/))) {
      const inner = splitTop(piece, ',');
      if (inner.length !== 2) return { error: 'Write intervals like (3, ∞) or [-2, 5).' };
      const a = endVal(inner[0].slice(1)), b = endVal(inner[1].slice(0, -1));
      if (a.error || b.error) return { error: a.error || b.error };
      decimal = decimal || a.decimal || b.decimal;
      out.push({ lo: a.value, hi: b.value, lc: m[1] === '[', rc: m[3] === ']' });
      continue;
    }
    const re = new RegExp(`^(.+?)(<=|<)${v}(<=|<)(.+)$`);
    if ((m = piece.match(re))) { const a = endVal(m[1]), b = endVal(m[4]); if (a.error || b.error) return { error: a.error || b.error }; decimal = decimal || a.decimal || b.decimal; out.push({ lo: a.value, hi: b.value, lc: m[2] === '<=', rc: m[3] === '<=' }); continue; }
    if ((m = piece.match(new RegExp(`^${v}(<=|<|>=|>)(.+)$`)))) { const a = endVal(m[2]); if (a.error) return { error: a.error }; decimal = decimal || a.decimal; out.push(m[1][0] === '<' ? { lo: -Infinity, hi: a.value, lc: false, rc: m[1] === '<=' } : { lo: a.value, hi: Infinity, lc: m[1] === '>=', rc: false }); continue; }
    if ((m = piece.match(new RegExp(`^(.+?)(<=|<|>=|>)${v}$`)))) { const a = endVal(m[1]); if (a.error) return { error: a.error }; decimal = decimal || a.decimal; out.push(m[2][0] === '>' ? { lo: -Infinity, hi: a.value, lc: false, rc: m[2] === '>=' } : { lo: a.value, hi: Infinity, lc: m[2] === '<=', rc: false }); continue; }
    return { error: `Write the answer as an interval like (3, ∞), or an inequality like ${v} > 3. Join pieces with ∪.` };
  }
  return { intervals: out.sort((p, q) => p.lo - q.lo), decimal };
}
export function intervalChecker(want, v = 'x') {
  return str => {
    const r = readIntervals(str, v);
    if (r.error) return { ok: false, msg: r.error, format: true };
    const got = r.intervals;
    const eqv = (a, b) => a === b || (isFinite(a) && isFinite(b) && matches(a, b, r.decimal));
    if (got.length !== want.length) return { ok: false };
    for (let i = 0; i < want.length; i++) {
      const g = got[i], w = want[i];
      if (!eqv(g.lo, w.lo) || !eqv(g.hi, w.hi)) return { ok: false };
    }
    for (let i = 0; i < want.length; i++) {
      const g = got[i], w = want[i];
      if ((isFinite(w.lo) && g.lc !== w.lc) || (isFinite(w.hi) && g.rc !== w.rc)) return { ok: false, msg: 'The endpoints are right, but check which ends are included (≤ and [ ]) or excluded (< and ( )).' };
    }
    return { ok: true };
  };
}
export const intervalTex = (I, tex) => `${I.lc ? '[' : '('}${isFinite(I.lo) ? tex.lo : '-\\infty'},\\ ${isFinite(I.hi) ? tex.hi : '\\infty'}${I.rc ? ']' : ')'}`;
export const LOG_KEYS = ['log_', 'ln', 'e^', '√', '(', ')', '/'];
export { F };
