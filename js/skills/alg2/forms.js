// Skills: writing factored form from a graph, and converting standard form to vertex form (Algebra II).
import { F, Frac, randInt, pick, nonzero, parse, evaluate, toTex } from '../../math.js?v=1.8';

// ---------- shared helpers ----------
const clean = s => String(s).replace(/[−–]/g, '-').replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, '').trim();
const preview = str => { try { const s = clean(str); return s ? toTex(parse(s)) : ''; } catch { return null; } };
const hasX = n => !!(n.v === 'x' || (n.a && hasX(n.a)) || (n.b && hasX(n.b)));
const strip = n => (n.op === 'paren' ? strip(n.a) : n);

function readExpr(str) {
  const s = clean(str);
  if (!s) return { error: 'Enter an equation.' };
  let tree;
  try { tree = parse(s); } catch { return { error: 'Could not read that equation.' }; }
  const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
  for (const v of vars) if (v !== 'x') return { error: 'Use x as the variable.' };
  return { tree };
}
const sameFn = (tree, fn) => [-3, -1.5, -1, 0, 0.5, 1, 2, 3.5].every(x => {
  const got = evaluate(tree, { x }), want = fn(x);
  return Math.abs(got - want) < 1e-6 * Math.max(1, Math.abs(want));
});
// degree of a sub-expression in x, judged numerically: linear if second differences vanish
function isLinear(n) {
  const g = x => evaluate(n, { x });
  return Math.abs(g(2) - 2 * g(1) + g(0)) < 1e-9 && Math.abs(g(3) - 2 * g(2) + g(1)) < 1e-9;
}
const fracTex = f => f.tex();
const aCoefTex = a => (a.eq(1) ? '' : a.eq(-1) ? '-' : a.isInt() ? String(a.n) : (a.n < 0 ? '-' : '') + `\\tfrac{${Math.abs(a.n)}}{${a.d}}`);
const linTex = r => (r === 0 ? 'x' : `(x ${r > 0 ? '-' : '+'} ${Math.abs(r)})`);

// ================= Factored form from a graph =================
export const factoredFromGraph = {
  id: 'factored-from-graph',
  course: ['accel'],
  title: 'Writing Factored Form from a Graph',
  group: 'Quadratics: forms and graphs',
  blurb: 'Use the x-intercepts and one more point to write y = a(x - r)(x - s).',
  levels: {
    1: { name: 'Easy', desc: 'a = 1 or a = -1' },
    2: { name: 'Medium', desc: 'Solve for a whole-number a using a labeled point' },
    3: { name: 'Challenging', desc: 'Solve for a fractional a using a labeled point' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildFactored(level, rng); if (p) return p; }
    throw new Error('factored-from-graph: could not build');
  },
};

function buildFactored(level, rng) {
  const r = randInt(rng, -6, 3), s = r + randInt(rng, 2, 7);
  if (s > 7) return null;
  let a;
  if (level === 1) a = F(pick(rng, [1, -1]));
  else if (level === 2) a = F(pick(rng, [2, 3, -2, -3, 2, -2]));
  else a = pick(rng, [F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(-2, 3), F(3, 2), F(-3, 2), F(1, 4), F(-1, 4)]);
  const f = x => a.mul((x - r) * (x - s));
  // labeled point: prefer the y-intercept, otherwise another lattice point that is not an intercept
  const cands = [];
  for (let x = r - 3; x <= s + 3; x++) {
    if (x === r || x === s) continue;
    const y = f(x);
    if (!y.isInt() || Math.abs(y.n) > 14) continue;
    cands.push({ x, y: y.n, pref: x === 0 ? 3 : (x > r && x < s ? 1 : 2) });
  }
  if (!cands.length) return null;
  cands.sort((p, q) => q.pref - p.pref || rng() - 0.5);
  const pt = level === 1 && cands.find(c => c.x === 0) ? cands.find(c => c.x === 0) : pick(rng, cands.slice(0, Math.min(3, cands.length)));
  const vx = (r + s) / 2, vy = a.value() * (vx - r) * (vx - s);
  const ys = [0, pt.y, vy];
  const window = {
    xmin: Math.min(r, pt.x, 0) - 2, xmax: Math.max(s, pt.x, 0) + 2,
    ymin: Math.floor(Math.min(...ys)) - 2, ymax: Math.ceil(Math.max(...ys)) + 2,
  };
  if (window.ymax - window.ymin > 34 || window.xmax - window.xmin > 18) return null;
  const fn = x => a.value() * (x - r) * (x - s);
  const ans = `y = ${aCoefTex(a)}${linTex(r)}${linTex(s)}`;
  const prod = (pt.x - r) * (pt.x - s);

  const check = str => {
    const R = readExpr(str);
    if (R.error) return { ok: false, msg: R.error, format: true };
    if (!sameFn(R.tree, fn)) return { ok: false };
    // structure: constant times linear factors (no expanded quadratic)
    let ok = true;
    (function flat(n) {
      n = strip(n);
      if (n.op === '*') { flat(n.a); flat(n.b); return; }
      if (n.op === '/' && !hasX(n.b)) { flat(n.a); return; }
      if (n.op === 'neg') { flat(n.a); return; }
      if (n.op === '^' && n.b.num === '2') { if (!isLinear(n.a)) ok = false; return; }
      if (!hasX(n)) return;
      if (!isLinear(n)) ok = false;
    })(R.tree);
    if (!ok) return { ok: false, msg: 'That is equal, but write it in factored form, like y = 2(x - 1)(x + 3).' };
    return { ok: true };
  };

  return {
    tag: level === 1 ? 'a = ±1' : level === 2 ? 'whole-number a' : 'fractional a',
    prompt: `Write the equation of the parabola in factored form.`,
    displayGraph: {
      window, fn,
      labels: [{ x: r, y: 0, text: `(${r}, 0)` }, { x: s, y: 0, text: `(${s}, 0)` }, { x: pt.x, y: pt.y, text: `(${pt.x}, ${pt.y})` }],
    },
    parts: [{
      type: 'custom', label: '$y =$', check, preview, keys: ['(', ')', '/'], placeholder: 'e.g. 2(x - 1)(x + 3)',
      answerTex: `$${ans}$`, help: level === 3 ? 'For a fraction, type it like 1/2(x - 1)(x + 3).' : '',
    }],
    solution: `The x-intercepts are $${r}$ and $${s}$, so $y = a${linTex(r)}${linTex(s)}$.<br>`
      + `Substitute the point $(${pt.x}, ${pt.y})$: $${pt.y} = a(${pt.x} - ${r < 0 ? `(${r})` : r})(${pt.x} - ${s < 0 ? `(${s})` : s}) = a\\cdot ${prod < 0 ? `(${prod})` : prod}$.<br>`
      + `So $a = \\dfrac{${pt.y}}{${prod}} = ${a.tex()}$${a.sign() < 0 ? ' (negative, so it opens down)' : ''}.<br>Equation: $${ans}$.`,
    _check: { a: a.value(), r, s, pt, fn },
  };
}

// ================= Standard form to vertex form =================
export const toVertexForm = {
  id: 'vertex-form',
  course: ['accel'],
  title: 'Converting Standard Form to Vertex Form',
  group: 'Quadratics: forms and graphs',
  blurb: 'Complete the square to rewrite y = ax² + bx + c as y = a(x - h)² + k.',
  levels: {
    1: { name: 'Easy', desc: 'a = 1 and an even middle coefficient' },
    2: { name: 'Medium', desc: 'a = -1, or an odd middle coefficient (fractions)' },
    3: { name: 'Challenging', desc: 'Factor out a first, like 3x² - 12x + 5' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildVertex(level, rng); if (p) return p; }
    throw new Error('vertex-form: could not build');
  },
};

function buildVertex(level, rng) {
  let a, h, k;
  if (level === 1) { a = F(1); h = F(nonzero(rng, -7, 7)); k = F(randInt(rng, -12, 12)); }
  else if (level === 2) {
    if (rng() < 0.5) { a = F(-1); h = F(nonzero(rng, -6, 6)); k = F(randInt(rng, -10, 12)); }
    else { a = F(1); h = F(pick(rng, [-7, -5, -3, -1, 1, 3, 5, 7]), 2); k = F(randInt(rng, -40, 40), 4); }
  } else { a = F(pick(rng, [2, 3, 4, 5, -2, -3, 2, 3])); h = F(nonzero(rng, -5, 5)); k = F(randInt(rng, -12, 12)); }
  const b = a.mul(h).mul(-2), c = a.mul(h.mul(h)).add(k);
  if (!b.isInt() || !c.isInt() || c.isZero() || Math.abs(c.n) > 99) return null;
  const B = b.n, C = c.n;
  const fn = x => a.value() * (x - h.value()) ** 2 + k.value();
  const stdTex = `y = ${aCoefTex(a)}x^2 ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}x ${C < 0 ? '-' : '+'} ${Math.abs(C)}`;
  const hTerm = h.isZero() ? 'x' : `\\left(x ${h.sign() > 0 ? '-' : '+'} ${h.abs().tex()}\\right)`;
  const ans = `y = ${aCoefTex(a)}${hTerm}^2${k.isZero() ? '' : (k.sign() < 0 ? ' - ' : ' + ') + k.abs().tex()}`;

  const check = str => {
    const R = readExpr(str);
    if (R.error) return { ok: false, msg: R.error, format: true };
    if (!sameFn(R.tree, fn)) return { ok: false };
    if (!isVertexForm(R.tree)) return { ok: false, msg: 'That is equal, but write it in vertex form: y = a(x - h)^2 + k.' };
    return { ok: true };
  };

  // worked steps
  const half = b.div(a).div(2), sq = half.mul(half);   // inside the parentheses after factoring a
  const steps = [];
  if (!a.eq(1)) steps.push(`Factor $${a.tex()}$ out of the first two terms: $y = ${a.tex()}\\left(x^2 ${b.div(a).sign() < 0 ? '-' : '+'} ${b.div(a).abs().tex()}x\\right) ${C < 0 ? '-' : '+'} ${Math.abs(C)}$.`);
  steps.push(`Half of $${b.div(a).tex()}$ is $${half.tex()}$, and $\\left(${half.tex()}\\right)^2 = ${sq.tex()}$.`);
  if (a.eq(1)) steps.push(`Add and subtract it: $y = \\left(x^2 ${b.sign() < 0 ? '-' : '+'} ${b.abs().tex()}x + ${sq.tex()}\\right) - ${sq.tex()} ${C < 0 ? '-' : '+'} ${Math.abs(C)}$.`);
  else steps.push(`Add $${sq.tex()}$ inside the parentheses. Because of the $${a.tex()}$ in front, that really adds $${a.mul(sq).tex()}$, so subtract $${a.mul(sq).tex()}$ outside: $y = ${a.tex()}\\left(x^2 ${b.div(a).sign() < 0 ? '-' : '+'} ${b.div(a).abs().tex()}x + ${sq.tex()}\\right) ${a.mul(sq).sign() < 0 ? '+' : '-'} ${a.mul(sq).abs().tex()} ${C < 0 ? '-' : '+'} ${Math.abs(C)}$.`);
  steps.push(`Write the square and combine the constants: $${ans}$. The vertex is $\\left(${h.tex()},\\ ${k.tex()}\\right)$.`);

  return {
    tag: level === 1 ? 'a = 1, even b' : level === 2 ? (a.eq(-1) ? 'a = -1' : 'odd b (fractions)') : 'factor out a',
    prompt: `Rewrite in vertex form: $\\;${stdTex}$`,
    parts: [{
      type: 'custom', label: '$y =$', check, preview, keys: ['(', ')', '^2', '/'], placeholder: 'e.g. 2(x - 3)^2 + 1',
      answerTex: `$${ans}$`, help: level === 2 ? 'Fractions are fine, like (x + 3/2)^2 - 17/4.' : '',
    }],
    solution: steps.join('<br>'),
    _check: { a: a.value(), h: h.value(), k: k.value(), fn, std: [a.value(), B, C] },
  };
}

// a(x - h)^2 + k, in any order, with optional a and k
function isVertexForm(tree) {
  let t = strip(tree);
  if ((t.op === '+' || t.op === '-') && !hasX(t.b)) t = strip(t.a);
  else if ((t.op === '+' || t.op === '-') && !hasX(t.a)) t = strip(t.b);   // k + a(x-h)^2 or k - (x-h)^2
  if (t.op === 'neg') t = strip(t.a);
  if (t.op === '*') {
    if (!hasX(t.a)) t = strip(t.b); else if (!hasX(t.b)) t = strip(t.a); else return false;
  }
  if (t.op === '/' && !hasX(t.b)) t = strip(t.a);
  if (t.op !== '^' || t.b.num !== '2') return false;
  const base = t.a, g = x => evaluate(base, { x });
  const slope = g(1) - g(0);
  return isLinear(base) && Math.abs(Math.abs(slope) - 1) < 1e-9;
}
