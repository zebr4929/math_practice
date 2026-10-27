// AP Precalculus 2.7: composition of functions.
//  1. Composition as a simplified expression, like g(f(x)) or (k∘p)(x).
//  2. Evaluating compositions when the functions come as a graph, a table, a formula,
//     a piecewise rule and a verbal description.
import { F, randInt, pick, nonzero, parse, evaluate, toTex, shuffle } from '../../math.js?v=2.4';

const GROUP = 'Unit 2 - Inverses and Composition';

// ---------- expression helpers ----------
// student input: allow sqrt(...) and √(...), written as (...)^(1/2) for the parser
function prep(str) {
  let s = String(str).replace(/[−–]/g, '-').trim();
  if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/√\s*([a-z0-9])/gi, '√($1)').replace(/sqrt\s*\(/gi, '√(');
  // turn √( ... ) into (( ... )^(1/2)) by matching parentheses
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '√' && s[i + 1] === '(') {
      let depth = 0, j = i + 1;
      for (; j < s.length; j++) { if (s[j] === '(') depth++; if (s[j] === ')') { depth--; if (depth === 0) break; } }
      out += '((' + prep(s.slice(i + 2, j)) + ')^(1/2))';
      i = j + 1;
    } else { out += s[i]; i++; }
  }
  return out;
}
const previewExpr = str => { try { const s = prep(str); return s ? toTex(parse(s)).replace(/\{\\left\((.+?)\\right\)\}\^\{\\frac\{1\}\{2\}\}/g, '\\sqrt{$1}') : ''; } catch { return null; } };
const strip = n => (n.op === 'paren' ? strip(n.a) : n);
const hasX = n => !!(n.v === 'x' || (n.a && hasX(n.a)) || (n.b && hasX(n.b)));

// a polynomial written as a sum of monomials with each power of x at most once
function isExpanded(tree) {
  const terms = [];
  (function sum(n) {
    n = strip(n);
    if (n.op === '+' || n.op === '-') { sum(n.a); sum(n.b); return; }
    if (n.op === 'neg' && (strip(n.a).op === '+' || strip(n.a).op === '-')) { sum(n.a); return; }
    terms.push(n);
  })(tree);
  const degs = [];
  for (const t of terms) {
    let deg = 0, ok = true;
    (function prod(n) {
      n = strip(n);
      if (n.op === '*') { prod(n.a); prod(n.b); return; }
      if (n.op === '/' && !hasX(n.b)) { prod(n.a); return; }
      if (n.op === 'neg') { prod(n.a); return; }
      if (!hasX(n)) return;
      if (n.v === 'x') { deg += 1; return; }
      if (n.op === '^' && strip(n.a).v === 'x' && n.b.num !== undefined) { deg += +n.b.num; return; }
      ok = false;
    })(t);
    if (!ok) return false;
    degs.push(deg);
  }
  return new Set(degs).size === degs.length;
}

function exprChecker(truth, { poly, samples }) {
  return str => {
    const s = prep(str);
    if (!s) return { ok: false, msg: 'Enter an expression in x.', format: true };
    let tree;
    try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. For a square root, type sqrt(3x + 1).', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
    for (const v of vars) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const same = samples.every(x => {
      const got = evaluate(tree, { x }), want = truth(x);
      return isFinite(got) && Math.abs(got - want) < 1e-7 * Math.max(1, Math.abs(want));
    });
    if (!same) return { ok: false };
    if (poly && !isExpanded(tree)) return { ok: false, msg: 'That is equal, but simplify it: expand and combine like terms.', format: true };
    return { ok: true };
  };
}

// ---------- tex for polynomials ----------
const term = (c, pow) => {
  if (c === 0) return '';
  const a = Math.abs(c), body = pow === 0 ? String(a) : `${a === 1 ? '' : a}${pow === 1 ? 'x' : `x^${pow}`}`;
  return { sign: c < 0 ? '-' : '+', body };
};
function polyTex(coefs) {                       // coefs[i] is the x^i coefficient
  let out = '';
  for (let i = coefs.length - 1; i >= 0; i--) {
    const t = term(coefs[i], i); if (!t) continue;
    out += out ? ` ${t.sign} ${t.body}` : (t.sign === '-' ? '-' : '') + t.body;
  }
  return out || '0';
}
const polyEval = (c, x) => c.reduce((s, ci, i) => s + ci * Math.pow(x, i), 0);
const polyMul = (p, q) => { const r = Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; })); return r; };
const polyAdd = (p, q) => Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] || 0) + (q[i] || 0));
const polyCompose = (outer, inner) => {     // outer(inner(x))
  let res = [0], pw = [1];
  outer.forEach(c => { res = polyAdd(res, pw.map(v => v * c)); pw = polyMul(pw, inner); });
  while (res.length > 1 && res[res.length - 1] === 0) res.pop();
  return res;
};
const wrap = t => `\\left(${t}\\right)`;

// =====================================================================
// 1. Composition as an expression
// =====================================================================
export const compExpr = {
  id: 'comp-expressions',
  course: 'precalc',
  group: GROUP,
  lesson: '2.7',
  title: 'Composition as an Expression',
  blurb: 'Substitute one function into another and simplify, like g(f(x)) or (k∘p)(x).',
  levels: {
    1: { name: 'Easy', desc: 'Two linear functions' },
    2: { name: 'Medium', desc: 'A linear and a quadratic function (expand and simplify)' },
    3: { name: 'Challenging', desc: 'Square roots and rational functions' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildCompExpr(level, rng); if (p) return p; }
    throw new Error('comp-expressions: could not build');
  },
};

const NOTATION = (outer, inner, circle) => (circle ? `(${outer}\\circ ${inner})(x)` : `${outer}(${inner}(x))`);

function buildCompExpr(level, rng) {
  const [n1, n2] = pick(rng, [['f', 'g'], ['h', 'k'], ['p', 'q'], ['f', 'h']]);
  const parts = [], steps = [];
  let defs, tag;
  if (level < 3) {
    const lin = () => [nonzero(rng, -9, 9), nonzero(rng, -5, 5)];
    const A = lin();
    const B = level === 1 ? lin() : pick(rng, [[nonzero(rng, -6, 6), 0, 1], [randInt(rng, -6, 6), nonzero(rng, -5, 5), 1], [nonzero(rng, -5, 5), 0, pick(rng, [2, -1, -2])]]);
    if (A[1] === 1 && level === 1) return null;
    if (JSON.stringify(A) === JSON.stringify(B)) return null;
    if (JSON.stringify(polyCompose(A, B)) === '[0,1]' || JSON.stringify(polyCompose(B, A)) === '[0,1]') return null;   // inverses of each other: save for 2.8
    // n1 = A, n2 = B
    defs = `$${n1}(x) = ${polyTex(A)}$ and $${n2}(x) = ${polyTex(B)}$`;
    for (const [outer, inner, oN, iN] of [[A, B, n1, n2], [B, A, n2, n1]]) {
      const res = polyCompose(outer, inner);
      const circle = rng() < 0.5;
      const lab = NOTATION(oN, iN, circle);
      parts.push({ type: 'custom', label: `$${lab} =$`, check: exprChecker(x => polyEval(res, x), { poly: true, samples: [-2, -1, 0, 0.5, 1, 2, 3] }), preview: previewExpr,
        placeholder: 'e.g. 6x - 7', answerTex: `$${polyTex(res)}$` });
      const sub = polyTex(outer).replace(/x/g, wrap(polyTex(inner)));
      steps.push(`$${lab}$: replace each $x$ in $${oN}(x)$ with $${iN}(x) = ${polyTex(inner)}$: $${oN}\\left(${polyTex(inner)}\\right) = ${sub} = ${polyTex(res)}$.`);
    }
    tag = level === 1 ? 'linear and linear' : 'linear and quadratic';
  } else {
    if (rng() < 0.5) {
      // square root: p(x) = sqrt(ax + b), k(x) = x^2 + cx + d   (or linear)
      const a = pick(rng, [2, 3, 4, 5]), b = randInt(rng, 1, 9);
      const useQuad = rng() < 0.6;
      const K = useQuad ? [randInt(rng, -6, 9), nonzero(rng, -5, 5), 1] : [randInt(rng, -6, 6), pick(rng, [2, 3, -2, 4])];
      const pTex = `\\sqrt{${polyTex([b, a])}}`;
      defs = `$${n1}(x) = ${pTex}$ and $${n2}(x) = ${polyTex(K)}$`;
      // n2(n1(x)) = K0 + K1 sqrt(ax+b) + K2 (ax+b)
      const lin = [K[0] + (useQuad ? b : 0), useQuad ? a : 0];
      const radC = K[1];
      const outerTruth = x => polyEval(K, Math.sqrt(a * x + b));
      const radTerm = `${radC < 0 ? '-' : '+'} ${Math.abs(radC) === 1 ? '' : Math.abs(radC)}\\sqrt{${polyTex([b, a])}}`;
      const ansA = useQuad ? `${polyTex(lin)} ${radTerm}` : `${radC < 0 ? '-' : ''}${Math.abs(radC) === 1 ? '' : Math.abs(radC)}\\sqrt{${polyTex([b, a])}}${lin[0] === 0 ? '' : ` ${lin[0] < 0 ? '-' : '+'} ${Math.abs(lin[0])}`}`;
      const circle1 = rng() < 0.5, lab1 = NOTATION(n2, n1, circle1);
      parts.push({ type: 'custom', label: `$${lab1} =$`, check: exprChecker(outerTruth, { poly: false, samples: [0, 0.5, 1, 2, 3, 5] }), preview: previewExpr,
        placeholder: 'e.g. 3x + 6 + 4sqrt(3x + 1)', answerTex: `$${ansA}$`, help: 'Type a square root as sqrt( ), like sqrt(3x + 1).' });
      steps.push(`$${lab1}$: replace $x$ in $${n2}$ with $${pTex}$: $${polyTex(K).replace(/x/g, wrap(pTex))}$.`
        + (useQuad ? ` Since $\\left(${pTex}\\right)^2 = ${polyTex([b, a])}$, this simplifies to $${ansA}$.` : ` So $${lab1} = ${ansA}$.`));
      // inner the other way: n1(n2(x)) = sqrt(a K(x) + b)
      const inside = polyAdd(K.map(c => a * c), [b]);
      const truth2 = x => Math.sqrt(polyEval(inside, x));
      const samples2 = [-3, -2, -1, 0, 1, 2, 3, 4].filter(x => polyEval(inside, x) >= 0);
      if (samples2.length < 4) return null;
      const circle2 = !circle1, lab2 = NOTATION(n1, n2, circle2);
      parts.push({ type: 'custom', label: `$${lab2} =$`, check: exprChecker(truth2, { poly: false, samples: samples2 }), preview: previewExpr,
        placeholder: 'e.g. sqrt(6x + 4)', answerTex: `$\\sqrt{${polyTex(inside)}}$` });
      steps.push(`$${lab2}$: replace $x$ in $${n1}$ with $${n2}(x)$: $\\sqrt{${a}\\left(${polyTex(K)}\\right) + ${b}} = \\sqrt{${polyTex(inside)}}$.`);
      tag = 'square root';
    } else {
      // rational: r(x) = c / (x - h), L(x) = mx + q
      const c = pick(rng, [2, 3, 4, 5, 6, -2, -3]), h = nonzero(rng, -5, 5);
      const m = pick(rng, [2, 3, -2, 4, -1]), q = nonzero(rng, -6, 6);
      const den = polyTex([-h, 1]);
      defs = `$${n1}(x) = \\dfrac{${c}}{${den}}$ and $${n2}(x) = ${polyTex([q, m])}$`;
      // n1(n2(x)) = c / (m x + q - h)
      const d1 = [q - h, m];
      if (d1[0] === 0) return null;
      const t1 = x => c / polyEval(d1, x);
      const lab1 = NOTATION(n1, n2, rng() < 0.5);
      parts.push({ type: 'custom', label: `$${lab1} =$`, check: exprChecker(t1, { poly: false, samples: [-3.5, -1.25, 0.3, 1.7, 2.9, 4.4].filter(x => Math.abs(polyEval(d1, x)) > 0.1) }), preview: previewExpr,
        placeholder: 'e.g. 6/(2x - 3)', answerTex: `$\\dfrac{${c}}{${polyTex(d1)}}$` });
      steps.push(`$${lab1}$: replace $x$ in $${n1}$ with $${polyTex([q, m])}$: $\\dfrac{${c}}{\\left(${polyTex([q, m])}\\right) ${h > 0 ? '-' : '+'} ${Math.abs(h)}} = \\dfrac{${c}}{${polyTex(d1)}}$.`);
      // n2(n1(x)) = m c/(x - h) + q = (q x + (m c - q h)) / (x - h)
      const num = [m * c - q * h, q];
      const t2 = x => m * c / (x - h) + q;
      const lab2 = NOTATION(n2, n1, rng() < 0.5);
      parts.push({ type: 'custom', label: `$${lab2} =$`, check: exprChecker(t2, { poly: false, samples: [-3.5, -1.25, 0.3, 1.7, 2.9, 4.4].filter(x => Math.abs(x - h) > 0.1) }), preview: previewExpr,
        placeholder: 'e.g. 12/(x - 4) + 1', answerTex: `$\\dfrac{${m * c}}{${den}} ${q < 0 ? '-' : '+'} ${Math.abs(q)}$, or $\\dfrac{${polyTex(num)}}{${den}}$` });
      steps.push(`$${lab2}$: replace $x$ in $${n2}$ with $\\dfrac{${c}}{${den}}$: $${m === 1 ? '' : m === -1 ? '-' : m}\\left(\\dfrac{${c}}{${den}}\\right) ${q < 0 ? '-' : '+'} ${Math.abs(q)} = \\dfrac{${m * c}}{${den}} ${q < 0 ? '-' : '+'} ${Math.abs(q)}$. Over a common denominator this is $\\dfrac{${polyTex(num)}}{${den}}$. Either form is fine.`);
      tag = 'rational';
    }
  }
  return {
    tag, prompt: `Let ${defs}. Find each composition and simplify.`, parts,
    solution: `Work from the inside out: the inner function's whole expression replaces $x$ in the outer function.<br>` + steps.join('<br>'),
    _check: {},
  };
}

// =====================================================================
// 2. Composition across representations
// =====================================================================
export const compReps = {
  id: 'comp-representations',
  course: 'precalc',
  group: GROUP,
  lesson: '2.7',
  title: 'Composition with Multiple Representations',
  blurb: 'Evaluate compositions when the functions are given as a graph, a table, an equation, a piecewise rule or in words.',
  levels: {
    1: { name: 'Easy', desc: 'A table and an equation' },
    2: { name: 'Medium', desc: 'A graph, a table and an equation' },
    3: { name: 'Challenging', desc: 'Graph, table, piecewise rule and a verbal description, with longer chains' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildCompReps(level, rng); if (p) return p; }
    throw new Error('comp-representations: could not build');
  },
};

const isInt = v => typeof v === 'number' && Number.isInteger(v);

function graphFn(rng) {
  // continuous piecewise-linear graph with integer vertices and integer slopes
  const L = randInt(rng, -5, -3), R = randInt(rng, 5, 8);
  const xs = [L]; let x = L;
  while (x < R) { x = Math.min(R, x + randInt(rng, 2, 4)); xs.push(x); }
  const ys = [randInt(rng, -4, 5)];
  for (let i = 1; i < xs.length; i++) {
    let y, tries = 0;
    do { y = ys[i - 1] + pick(rng, [-2, -1, 0, 1, 2]) * (xs[i] - xs[i - 1]); } while ((y < -5 || y > 7) && tries++ < 30);
    if (y < -5 || y > 7) return null;
    ys.push(y);
  }
  const ev = t => {
    if (!isInt(t) || t < L || t > R) return undefined;
    for (let i = 1; i < xs.length; i++) if (t <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (t - xs[i - 1]) / (xs[i] - xs[i - 1]);
  };
  const fn = t => { if (t < L || t > R) return NaN; for (let i = 1; i < xs.length; i++) if (t <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (t - xs[i - 1]) / (xs[i] - xs[i - 1]); return NaN; };
  return {
    ev, kind: 'graph', describe: 'the graph',
    explain: (t, v) => `read the graph at $x = ${t}$: the point is $(${t}, ${v})$`,
    display: { window: { xmin: Math.min(L, -1) - 1, xmax: R + 1, ymin: Math.min(...ys, -1) - 1, ymax: Math.max(...ys, 1) + 1 }, fn, labels: xs.map((xx, i) => ({ x: xx, y: ys[i], text: '' })) },
  };
}

function tableFn(rng, name) {
  const xs = shuffle(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 5).sort((a, b) => a - b);
  const map = new Map(xs.map(x => [x, randInt(rng, -4, 7)]));
  return {
    ev: t => (map.has(t) ? map.get(t) : undefined), kind: 'table',
    explain: (t, v) => `in the table, $${name}(${t}) = ${v}$`,
    html: `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr><tr><th>$${name}(x)$</th>${xs.map(x => `<td>${map.get(x)}</td>`).join('')}</tr></table>`,
  };
}

function formulaFn(rng, name) {
  if (rng() < 0.5) {
    const m = pick(rng, [-3, -2, 2, 3]), b = randInt(rng, -5, 5);
    const tex = polyTex([b, m]);
    return { ev: t => (isInt(t) ? m * t + b : undefined), kind: 'formula', tex: `${name}(x) = ${tex}`, explain: (t, v) => `$${name}(${t}) = ${tex.replace(/x/g, wrap(t))} = ${v}$` };
  }
  const c = randInt(rng, -6, 3), s = pick(rng, [1, -1]);
  const coefs = [c, 0, s];
  const tex = polyTex(coefs);
  return { ev: t => (isInt(t) ? s * t * t + c : undefined), kind: 'formula', tex: `${name}(x) = ${tex}`, explain: (t, v) => `$${name}(${t}) = ${tex.replace(/x/g, wrap(t))} = ${v}$` };
}

function piecewiseFn(rng, name) {
  const c = randInt(rng, -1, 2), p = randInt(rng, -8, 8), q = pick(rng, [2, 3, -3]);
  const mid = randInt(rng, -5, 5), m = pick(rng, [-1, 1, 2, -2]), r = randInt(rng, -4, 4);
  const leftTex = `\\left|${polyTex([p, q])}\\right|`, rightTex = polyTex([r, m]);
  const ev = t => (!isInt(t) ? undefined : t < c ? Math.abs(q * t + p) : t === c ? mid : m * t + r);
  return {
    ev, kind: 'piecewise',
    tex: `${name}(x) = \\begin{cases} ${leftTex}, & x < ${c} \\\\ ${mid}, & x = ${c} \\\\ ${rightTex}, & x > ${c} \\end{cases}`,
    explain: (t, v) => t < c ? `$${t} < ${c}$, so use the top piece: $${leftTex.replace(/x/g, wrap(t))} = ${v}$`
      : t === c ? `$x = ${c}$, so $${name}(${c}) = ${mid}$`
        : `$${t} > ${c}$, so use the bottom piece: $${rightTex.replace(/x/g, wrap(t))} = ${v}$`,
  };
}

function verbalFn(rng, name) {
  const h = nonzero(rng, -3, 3), v = nonzero(rng, -5, 5);
  const ev = t => (isInt(t) ? (t - h) * (t - h) + v : undefined);
  const hText = `a horizontal translation of ${h}`, vText = `a vertical translation of ${v}`;
  const formula = `(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2 ${v > 0 ? '+' : '-'} ${Math.abs(v)}`;
  return {
    ev, kind: 'verbal',
    text: `$${name}$ is the quadratic function $y = x^2$ with ${hText} followed by ${vText}.`,
    explain: (t, val) => `the description means $${name}(x) = ${formula}$, so $${name}(${t}) = (${t} ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2 ${v > 0 ? '+' : '-'} ${Math.abs(v)} = ${val}$`,
  };
}

function chainTex(names, x, circle) {
  // names: outermost first, e.g. ['g','f','h'] means g(f(h(x)))
  if (circle) return `(${names.join('\\circ ')})(${x})`;
  return names.reduceRight((acc, n) => `${n}(${acc})`, String(x));
}

function buildCompReps(level, rng) {
  const F_ = {};
  let reps;
  if (level === 1) { reps = ['g', 'h']; F_.g = tableFn(rng, 'g'); F_.h = formulaFn(rng, 'h'); }
  else if (level === 2) { reps = ['f', 'g', 'h']; F_.f = graphFn(rng); if (!F_.f) return null; F_.g = tableFn(rng, 'g'); F_.h = formulaFn(rng, 'h'); }
  else { reps = ['f', 'g', 'h', 'k']; F_.f = graphFn(rng); if (!F_.f) return null; F_.g = tableFn(rng, 'g'); F_.h = piecewiseFn(rng, 'h'); F_.k = verbalFn(rng, 'k'); }

  // candidate chains
  const run = (names, x) => {
    const trace = []; let v = x;
    for (let i = names.length - 1; i >= 0; i--) {
      const out = F_[names[i]].ev(v);
      if (out === undefined || !isInt(out) || Math.abs(out) > 60) return null;
      trace.push({ name: names[i], input: v, output: out }); v = out;
    }
    return { value: v, trace };
  };
  const inputs = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
  const pickChain = (len, filter = () => true) => {
    for (let t = 0; t < 200; t++) {
      const names = Array.from({ length: len }, () => pick(rng, reps));
      if (!filter(names)) continue;
      const x = pick(rng, inputs), r = run(names, x);
      if (r) return { names, x, ...r };
    }
    return null;
  };
  const distinct = names => new Set(names).size === names.length;
  const qs = [];
  if (level === 1) {
    qs.push(pickChain(2, n => n[0] === 'h' && n[1] === 'g'));
    qs.push(pickChain(2, n => n[0] === 'g' && n[1] === 'h'));
  } else if (level === 2) {
    qs.push(pickChain(2, n => distinct(n) && n.includes('f')));
    qs.push(pickChain(2, n => distinct(n) && n.includes('g')));
    qs.push(pickChain(2, n => n[0] === n[1]) || pickChain(2, distinct));
  } else {
    qs.push(pickChain(2, n => distinct(n) && (n.includes('h') || n.includes('k'))));
    qs.push(pickChain(2, n => n[0] === n[1] && n[0] !== 'k'));
    qs.push(pickChain(rng() < 0.5 ? 3 : 4, distinct));
  }
  if (qs.some(q => !q)) return null;
  const keys = qs.map(q => q.names.join('') + q.x);
  if (new Set(keys).size !== keys.length) return null;
  // each representation should be used at least once
  const used = new Set(qs.flatMap(q => q.trace.map(t => t.name)));
  if (reps.some(r => !used.has(r))) return null;

  const blocks = [];
  if (F_.f) blocks.push('The graph of $f$ is shown.');
  if (F_.g) blocks.push(`Selected values of $g$ are in the table.`);
  if (F_.h) blocks.push(`$${F_.h.tex}$`);
  if (F_.k) blocks.push(F_.k.text);
  const parts = qs.map(q => {
    const circle = q.names.length > 2 ? rng() < 0.7 : rng() < 0.4;
    return { type: 'number', label: `$${chainTex(q.names, q.x, circle)} =$`, answer: F(q.value), _q: q, _circle: circle };
  });
  const solution = parts.map(pt => {
    const q = pt._q;
    return `<b>$${chainTex(q.names, q.x, pt._circle)}$:</b> start on the right with $${q.x}$. `
      + q.trace.map((t, i) => (i === 0 ? cap1 : low1)(F_[t.name].explain(t.input, t.output))).join('. Then ') + `. So the answer is $${q.value}$.`;
  }).join('<br>');
  parts.forEach(pt => { delete pt._q; delete pt._circle; });

  const visualHtml = F_.g.html;
  return {
    tag: level === 1 ? 'table and equation' : level === 2 ? 'graph, table, equation' : 'four representations',
    prompt: blocks.join('<br>'),
    visual: visualHtml,
    displayGraph: F_.f ? F_.f.display : undefined,
    parts,
    solution,
    _check: { q: qs.map(q => [q.names, q.x, q.value]) },
  };
}
const cap1 = s => (s[0] === '$' ? s : s[0].toUpperCase() + s.slice(1));
const low1 = s => (s[0] === '$' ? s : s[0].toLowerCase() + s.slice(1));
