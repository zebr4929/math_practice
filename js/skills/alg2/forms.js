// Skills (Algebra II): factored form from a graph or from data, converting between standard and vertex form,
// maximum/minimum values, and domain and range of quadratics.
import { F, Frac, randInt, pick, nonzero, parse, evaluate, toTex, readNumber, shuffle } from '../../math.js?v=2.1';
import { seasonFor } from '../precalc/exp-models.js?v=2.1';

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
    }, {
      type: 'point', label: 'Vertex', answer: [h, k], placeholder: 'e.g. (3, -4)',
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

// ---------- more shared helpers ----------
const tfr = f => (f.isInt() ? String(f.n) : `\\tfrac{${Math.abs(f.n)}}{${f.d}}`);          // |f| for inline display
const sgnTerm = (f, first) => (f.sign() < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ');
// a x^2 + b x + c with Frac coefficients
function polyTex(a, b, c) {
  let t = `${aCoefTex(a)}x^2`;
  if (!b.isZero()) t += `${sgnTerm(b)}${b.abs().eq(1) ? '' : tfr(b.abs())}x`;
  if (!c.isZero()) t += `${sgnTerm(c)}${tfr(c.abs())}`;
  return t;
}
// a(x - h)^2 + k
function vertexTex(a, h, k) {
  const hTerm = h.isZero() ? 'x' : `\\left(x ${h.sign() > 0 ? '-' : '+'} ${tfr(h.abs())}\\right)`;
  return `${aCoefTex(a)}${hTerm}^2${k.isZero() ? '' : `${sgnTerm(k)}${tfr(k.abs())}`}`;
}
const fracPt = (x, y) => `\\left(${x.tex()},\\ ${y.tex()}\\right)`;
// (x - r) for a Frac root
const rootFactor = r => (r.isZero() ? 'x' : `\\left(x ${r.sign() > 0 ? '-' : '+'} ${tfr(r.abs())}\\right)`);

// structure check shared by the factored-form skills
function factoredChecker(fn, example) {
  return str => {
    const R = readExpr(str);
    if (R.error) return { ok: false, msg: R.error, format: true };
    if (!sameFn(R.tree, fn)) return { ok: false };
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
    if (!ok) return { ok: false, msg: `That is equal, but write it in factored form, like ${example}.` };
    return { ok: true };
  };
}

// ================= Factored form from a table or points =================
export const factoredFromData = {
  id: 'factored-from-data',
  course: ['accel'],
  title: 'Writing Factored Form from a Table or Points',
  group: 'Quadratics: forms and graphs',
  blurb: 'Find the zeros in a table or list of points, then use one more point to solve for a.',
  levels: {
    1: { name: 'Easy', desc: 'A table that shows both zeros, a = 1 or a = -1' },
    2: { name: 'Medium', desc: 'Three points, whole-number a' },
    3: { name: 'Challenging', desc: 'Word problems with a table, or points with a fractional zero' },
  },
  now: () => new Date(),
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildFromData(level, rng, this.now()); if (p) return p; }
    throw new Error('factored-from-data: could not build');
  },
};

// Things launched from the ground: x = horizontal distance, y = height, both in feet.
const LAUNCHES = {
  halloween: [
    'At the annual Pumpkin Chunkin contest, a trebuchet launches a pumpkin across a field.',
    'A catapult built by the physics club flings a jack-o\'-lantern over the haunted hayride.',
    'A witch is still learning to fly her broom. She lifts off the ground, rises, and comes back down.',
    'A zombie tries to throw a brain to his friend across the courtyard.',
  ],
  holiday: [
    'During the Thanksgiving Day backyard football game, your cousin punts the ball.',
    'In a snowball fight, you lob a snowball over the fort.',
    'One of Santa\'s reindeer is practicing a running jump on the runway.',
    'At the turkey trot, someone tosses a foam turkey to the finish line crowd.',
  ],
  school: [
    'In P.E., a student kicks a soccer ball across the field.',
    'A water fountain in front of the school shoots an arc of water.',
    'The robotics club tests a launcher that shoots a foam ball.',
    'A frog in the biology lab makes an impressive jump.',
  ],
};

function buildFromData(level, rng, date) {
  if (level === 3 && rng() < 0.55) return storyTable(rng, date);
  if (level === 3) return fractionalZero(rng);
  const r = randInt(rng, -6, 3), s = r + randInt(rng, 2, 7);
  if (s > 8) return null;
  const a = F(level === 1 ? pick(rng, [1, -1]) : pick(rng, [2, 3, -2, -3, 2, -2]));
  const f = x => a.mul((x - r) * (x - s));
  const fn = x => a.value() * (x - r) * (x - s);
  const ans = `y = ${aCoefTex(a)}${linTex(r)}${linTex(s)}`;
  let prompt, visual = '', pt;
  if (level === 1) {
    // consecutive x values that include both zeros
    const start = r - randInt(rng, 0, 2), xs = [];
    for (let x = start; xs.length < Math.max(5, s - start + 1) && xs.length < 9; x++) xs.push(x);
    if (!xs.includes(s)) return null;
    const ys = xs.map(f);
    if (ys.some(y => Math.abs(y.n) > 40)) return null;
    visual = `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr>`
      + `<tr><th>$y$</th>${ys.map(y => `<td>$${y.tex()}$</td>`).join('')}</tr></table>`;
    prompt = 'Some values of a quadratic function are shown in the table. Write the equation in factored form.';
    pt = xs.filter(x => x !== r && x !== s).map(x => ({ x, y: f(x).n }))[0];
  } else {
    const cands = [];
    for (let x = r - 3; x <= s + 3; x++) if (x !== r && x !== s && Math.abs(f(x).n) <= 30) cands.push({ x, y: f(x).n });
    if (!cands.length) return null;
    pt = pick(rng, cands);
    const pts = shuffle(rng, [`(${r}, 0)`, `(${s}, 0)`, `(${pt.x}, ${pt.y})`]);
    prompt = `In the $xy$-plane, the graph of a quadratic function contains the points $${pts.join(',\\ ')}$. Write the equation in factored form.`;
  }
  const prod = (pt.x - r) * (pt.x - s);
  return {
    tag: level === 1 ? 'table, a = ±1' : 'three points, whole-number a',
    prompt, visual,
    parts: [{ type: 'custom', label: '$y =$', check: factoredChecker(fn, 'y = 2(x - 1)(x + 3)'), preview, keys: ['(', ')', '/'], placeholder: 'e.g. 2(x - 1)(x + 3)', answerTex: `$${ans}$` }],
    solution: `The zeros (where $y = 0$) are $x = ${r}$ and $x = ${s}$, so $y = a${linTex(r)}${linTex(s)}$.<br>`
      + `Substitute another point, $(${pt.x}, ${pt.y})$: $${pt.y} = a(${pt.x} - ${r < 0 ? `(${r})` : r})(${pt.x} - ${s < 0 ? `(${s})` : s}) = ${prod}a$, so $a = ${a.tex()}$.<br>Equation: $${ans}$.`,
    _check: { fn, r, s, a: a.value() },
  };
}

// a symmetric table of an arc that starts and ends on the ground (like the pumpkin trebuchet)
function storyTable(rng, date) {
  const d = pick(rng, [2, 3, 4, 5, 6, 10]);           // spacing between table rows
  const w = 2 * d;                                     // half the distance between the zeros
  const r = pick(rng, [0, 0, d, 2 * d, 7, 10, 5]);
  const s = r + 2 * w;
  const peak = 4 * randInt(rng, 1, 10);                // multiple of 4 keeps every height whole
  const a = F(-peak, w * w);                           // y = a(x - r)(x - s), vertex height = -a w^2
  if (a.d === 1 && rng() < 0.7) return null;           // mostly fractional a here
  const xs = [r, r + d, r + 2 * d, r + 3 * d, s];
  const ys = xs.map(x => a.mul((x - r) * (x - s)));
  if (ys.some(y => !y.isInt())) return null;
  const story = pick(rng, LAUNCHES[seasonFor(date)]);
  const fn = x => a.value() * (x - r) * (x - s);
  const ans = `y = ${aCoefTex(a)}${linTex(r)}${linTex(s)}`;
  const visual = `<table class="seq-table"><tr><th>Horizontal distance (feet)</th><th>Height (feet)</th></tr>`
    + xs.map((x, i) => `<tr><td>${x}</td><td>${ys[i].n}</td></tr>`).join('') + `</table>`;
  const pt = { x: r + 2 * d, y: ys[2].n };
  const prod = (pt.x - r) * (pt.x - s);
  return {
    tag: 'word problem table',
    prompt: `${story} You record the data below. Write a quadratic equation in factored form that models the path, where $x$ is the horizontal distance and $y$ is the height.`,
    visual,
    parts: [{ type: 'custom', label: '$y =$', check: factoredChecker(fn, 'y = -1/5(x - 7)(x - 27)'), preview, keys: ['(', ')', '/'], placeholder: 'e.g. -1/5(x - 7)(x - 27)', answerTex: `$${ans}$`, help: 'For a fraction, type it like -1/5(x - 7)(x - 27).' }],
    solution: `The height is $0$ at $x = ${r}$ and $x = ${s}$, so those are the zeros: $y = a${linTex(r)}${linTex(s)}$.<br>`
      + `Use the highest point, $(${pt.x}, ${pt.y})$: $${pt.y} = a(${pt.x} - ${r})(${pt.x} - ${s}) = ${prod}a$, so $a = \\dfrac{${pt.y}}{${prod}} = ${a.tex()}$ (negative, so the path opens down).<br>Equation: $${ans}$.`,
    _check: { fn, r, s, a: a.value() },
  };
}

// points with one fractional zero, like (-3, 0), (1/2, 0), (-1, 3)
function fractionalZero(rng) {
  const r = F(nonzero(rng, -6, 6));
  const den = pick(rng, [2, 2, 3]);
  let num = nonzero(rng, -2 * den, 2 * den); if (num % den === 0) return null;
  const s = F(num, den);
  const a = F(pick(rng, [1, -1, 2, -2, 3, -3]));
  const f = x => a.mul(F(x).sub(r)).mul(F(x).sub(s));
  const cands = [];
  for (let x = -6; x <= 6; x++) { if (F(x).eq(r)) continue; const y = f(x); if (y.isInt() && y.n !== 0 && Math.abs(y.n) <= 30) cands.push({ x, y: y.n }); }
  if (!cands.length) return null;
  const pt = pick(rng, cands);
  const fn = x => a.value() * (x - r.value()) * (x - s.value());
  const ans = `y = ${aCoefTex(a)}${rootFactor(r)}${rootFactor(s)}`;
  const alt = `y = ${aCoefTex(a.div(den))}${rootFactor(r)}\\left(${den}x ${num > 0 ? '-' : '+'} ${Math.abs(num)}\\right)`;
  const pts = shuffle(rng, [`(${r.tex()}, 0)`, `\\left(${s.tex()}, 0\\right)`, `(${pt.x}, ${pt.y})`]);
  const prod = F(pt.x).sub(r).mul(F(pt.x).sub(s));
  return {
    tag: 'points, fractional zero',
    prompt: `In the $xy$-plane, the graph of a quadratic function contains the points $${pts.join(',\\ ')}$. Write the equation in factored form.`,
    parts: [{ type: 'custom', label: '$y =$', check: factoredChecker(fn, 'y = -(x + 3)(x - 1/2)'), preview, keys: ['(', ')', '/'], placeholder: 'e.g. -(x + 3)(x - 1/2)', answerTex: `$${ans}$, or $${alt}$`, help: 'A fraction inside a factor is fine, like (x - 1/2).' }],
    solution: `The zeros are $x = ${r.tex()}$ and $x = ${s.tex()}$, so $y = a${rootFactor(r)}${rootFactor(s)}$.<br>`
      + `Substitute $(${pt.x}, ${pt.y})$: $${pt.y} = a\\left(${pt.x} - ${r.sign() < 0 ? `(${r.tex()})` : r.tex()}\\right)\\left(${pt.x} - ${s.sign() < 0 ? `\\left(${s.tex()}\\right)` : s.tex()}\\right) = ${prod.tex()}a$, so $a = ${a.tex()}$.<br>`
      + `Equation: $${ans}$. (Multiplying the $${den}$ into the second factor gives the same function: $${alt}$.)`,
    _check: { fn, a: a.value() },
  };
}

// ================= Vertex form to standard form =================
export const vertexToStandard = {
  id: 'standard-form',
  course: ['accel'],
  title: 'Converting Vertex Form to Standard Form',
  group: 'Quadratics: forms and graphs',
  blurb: 'Expand y = a(x - h)² + k into y = ax² + bx + c.',
  levels: {
    1: { name: 'Easy', desc: 'a = 1, like (x - 3)² - 4' },
    2: { name: 'Medium', desc: 'Whole-number a, positive or negative, like 2(x - 3)² - 4' },
    3: { name: 'Challenging', desc: 'Fractional a, like 1/2(x + 4)² - 3' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildStandard(level, rng); if (p) return p; }
    throw new Error('standard-form: could not build');
  },
};

function buildStandard(level, rng) {
  const a = level === 1 ? F(1) : level === 2 ? F(pick(rng, [2, 3, 4, 5, -1, -2, -3, -4]))
    : pick(rng, [F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(3, 2), F(-3, 2), F(1, 4), F(-1, 4)]);
  const h = F(nonzero(rng, -6, 6)), k = F(randInt(rng, -12, 12));
  const b = a.mul(h).mul(-2), c = a.mul(h.mul(h)).add(k);
  if (c.isZero() || b.d > 4 || c.d > 4) return null;
  const fn = x => a.value() * (x - h.value()) ** 2 + k.value();
  const ans = `y = ${polyTex(a, b, c)}`;
  const check = str => {
    const R = readExpr(str);
    if (R.error) return { ok: false, msg: R.error, format: true };
    if (!sameFn(R.tree, fn)) return { ok: false };
    if (!isExpanded(R.tree)) return { ok: false, msg: 'That is equal, but expand it completely and combine like terms, like y = 2x^2 - 12x + 14.' };
    return { ok: true };
  };
  const h2 = h.mul(h), sq = `x^2 ${h.sign() > 0 ? '-' : '+'} ${h.mul(2).abs().tex()}x + ${h2.tex()}`;
  const steps = [
    `Square the binomial: $${h.isZero() ? 'x^2' : `\\left(x ${h.sign() > 0 ? '-' : '+'} ${h.abs().tex()}\\right)^2`} = ${sq}$.`,
    a.eq(1) ? `So $y = ${sq} ${k.sign() < 0 ? '-' : '+'} ${k.abs().tex()}$.`
      : `Distribute $${a.tex()}$: $${a.tex()}\\left(${sq}\\right) = ${polyTex(a, b, a.mul(h2))}$.`,
    `Combine the constants: $${a.mul(h2).tex()} ${k.sign() < 0 ? '-' : '+'} ${k.abs().tex()} = ${c.tex()}$.`,
    `So $${ans}$.`,
  ];
  return {
    tag: level === 1 ? 'a = 1' : level === 2 ? 'whole-number a' : 'fractional a',
    prompt: `Write in standard form: $\;y = ${vertexTex(a, h, k)}$`,
    parts: [{ type: 'custom', label: '$y =$', check, preview, keys: ['^2', '/'], placeholder: 'e.g. 2x^2 - 12x + 14', answerTex: `$${ans}$`, help: level === 3 ? 'Fractions are fine, like 1/2x^2 + 4x + 5.' : '' }],
    solution: steps.join('<br>'),
    _check: { fn, std: [a.value(), b.value(), c.value()] },
  };
}

// sum of monomials c, cx, cx^2 with each power at most once (no parentheses around x left)
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

// ================= Max/min and domain/range: a shared quadratic generator =================
// Easy: vertex form. Medium: standard form, whole-number vertex. Challenging: standard form with a fractional vertex value.
function makeQuad(level, rng) {
  let a, h, k, b, c;
  if (level === 1) {
    a = F(pick(rng, [1, -1, 2, -2, 3, -3])); if (rng() < 0.2) a = F(pick(rng, [1, -1]), 2);
    h = F(randInt(rng, -6, 6)); k = F(randInt(rng, -12, 12));
    b = a.mul(h).mul(-2); c = a.mul(h.mul(h)).add(k);
  } else if (level === 2) {
    a = F(pick(rng, [1, -1, 2, -2, 3, -3]));
    h = F(nonzero(rng, -6, 6)); c = F(randInt(rng, -12, 12));
    b = a.mul(h).mul(-2); k = c.sub(a.mul(h.mul(h)));
    if (Math.abs(k.n) > 40) return null;
  } else {
    if (rng() < 0.5) { a = F(pick(rng, [1, -1]), 2); h = F(pick(rng, [-5, -3, -1, 1, 3, 5])); }
    else { a = F(pick(rng, [1, -1, 2, -2, 3, -3])); h = F(pick(rng, [-5, -3, -1, 1, 3, 5]), 2); }
    c = F(nonzero(rng, -9, 9));
    b = a.mul(h).mul(-2); k = c.sub(a.mul(h.mul(h)));
    if (k.isInt() || !b.isInt()) return null;
  }
  if (b.isZero() && level > 1) return null;
  const fn = x => a.value() * (x - h.value()) ** 2 + k.value();
  const eq = level === 1 ? vertexTex(a, h, k) : polyTex(a, b, c);
  // worked steps to the vertex
  const steps = [];
  if (level === 1) steps.push(`In vertex form $y = a(x - h)^2 + k$, the vertex is $(h, k) = ${fracPt(h, k)}$.`);
  else {
    steps.push(`The vertex is at $x = -\\dfrac{b}{2a} = -\\dfrac{${b.tex()}}{2${a.eq(1) ? '' : `\\left(${a.tex()}\\right)`}} = ${h.tex()}$.`);
    steps.push(`Substitute: $y = ${a.eq(1) ? '' : a.eq(-1) ? '-' : a.tex()}\\left(${h.tex()}\\right)^2 ${b.sign() < 0 ? '-' : '+'} ${b.abs().tex()}\\left(${h.tex()}\\right) ${c.sign() < 0 ? '-' : '+'} ${c.abs().tex()} = ${k.tex()}$. Vertex: $${fracPt(h, k)}$.`);
  }
  return { a, h, k, b, c, fn, eq, steps };
}

export const maxMin = {
  id: 'max-min',
  course: ['accel'],
  title: 'Maximum or Minimum Value',
  group: 'Quadratics: forms and graphs',
  blurb: 'Decide whether a quadratic has a maximum or a minimum, and find that value.',
  levels: {
    1: { name: 'Easy', desc: 'From vertex form' },
    2: { name: 'Medium', desc: 'From standard form, whole-number answers' },
    3: { name: 'Challenging', desc: 'From standard form, fractional answers' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const Q = makeQuad(level, rng); if (!Q) continue;
      const up = Q.a.sign() > 0, name = pick(rng, ['f', 'g', 'h']);
      return {
        tag: level === 1 ? 'vertex form' : level === 2 ? 'standard form, whole numbers' : 'standard form, fractions',
        prompt: `Given $${name}(x) = ${Q.eq}$, does $${name}$ have a maximum or a minimum value? What is that value?`,
        parts: [
          { type: 'mc', label: 'Choose one:', choices: ['Maximum', 'Minimum'], answer: up ? 1 : 0 },
          { type: 'number', label: 'Value:', answer: Q.k },
        ],
        solution: `$a = ${Q.a.tex()}$ is ${up ? 'positive, so the parabola opens up and the vertex is the lowest point: a minimum' : 'negative, so the parabola opens down and the vertex is the highest point: a maximum'}.<br>`
          + Q.steps.join('<br>') + `<br>The ${up ? 'minimum' : 'maximum'} value is the $y$-coordinate of the vertex: $${Q.k.tex()}$.`,
        _check: { fn: Q.fn, a: Q.a.value(), h: Q.h.value(), k: Q.k.value() },
      };
    }
    throw new Error('max-min: could not build');
  },
};

export const domainRange = {
  id: 'domain-range',
  course: ['accel'],
  title: 'Domain and Range of Quadratics',
  group: 'Quadratics: forms and graphs',
  blurb: 'Find the domain and range from the vertex and the direction the parabola opens.',
  levels: maxMin.levels,
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const Q = makeQuad(level, rng); if (!Q) continue;
      const up = Q.a.sign() > 0, ht = Q.h.tex(), kt = Q.k.tex();
      const rangeTex = `y ${up ? '\\ge' : '\\le'} ${kt}`;
      const choices = shuffle(rng, ['All real numbers', `$x \\ge ${ht}$`, `$x \\le ${ht}$`, `$${rangeTex}$`]);
      return {
        tag: level === 1 ? 'vertex form' : level === 2 ? 'standard form, whole numbers' : 'standard form, fractions',
        prompt: `Find the domain and range of $y = ${Q.eq}$.`,
        parts: [
          { type: 'mc', label: 'Domain:', choices, answer: choices.indexOf('All real numbers') },
          { type: 'custom', label: 'Range:', check: rangeChecker(up, Q.k), keys: ['≤', '≥', '∞', '/'], placeholder: 'e.g. y ≤ 6', answerTex: `$${rangeTex}$`, help: 'Type an inequality like y ≤ 6 or y >= -2. Interval notation like (-∞, 6] also works.' },
        ],
        solution: `<b>Domain.</b> You can put any $x$ into a quadratic, so the domain is all real numbers.<br>`
          + `<b>Range.</b> ` + Q.steps.join('<br>') + `<br>$a = ${Q.a.tex()}$ is ${up ? 'positive, so the parabola opens up. The vertex is the lowest point, and every $y$-value from there up is reached' : 'negative, so the parabola opens down. The vertex is the highest point, and every $y$-value from there down is reached'}: $${rangeTex}$.`,
        _check: { a: Q.a.value(), h: Q.h.value(), k: Q.k.value(), up },
      };
    }
    throw new Error('domain-range: could not build');
  },
};

// accepts y <= 6, y≤6, 6 >= y, (-inf, 6], (-∞, 6]; the inequality must include the vertex
export function rangeChecker(up, k) {
  return str => {
    const s = String(str).replace(/[−–]/g, '-').replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/∞|infinity/gi, 'inf').replace(/\s+/g, '').toLowerCase();
    if (!s) return { ok: false, msg: 'Enter the range, like y ≤ 6.', format: true };
    if (/real|all/.test(s)) return { ok: false };
    const num = t => { const r = readNumber(t); return r.error ? null : r.value; };
    let dir = null, val = null, strict = false, m;
    if ((m = s.match(/^y(<=|>=|<|>)(.+)$/))) { dir = m[1][0]; strict = m[1].length === 1; val = num(m[2]); }
    else if ((m = s.match(/^(.+?)(<=|>=|<|>)y$/))) { dir = m[2][0] === '<' ? '>' : '<'; strict = m[2].length === 1; val = num(m[1]); }
    else if ((m = s.match(/^([\[(])-inf,(.+)([\])])$/))) { dir = '<'; strict = m[3] === ')'; val = num(m[2]); }
    else if ((m = s.match(/^([\[(])(.+),\+?inf([\])])$/))) { dir = '>'; strict = m[1] === '('; val = num(m[2]); }
    if (dir === null || val === null) return { ok: false, msg: 'Type the range as an inequality like y ≤ 6, or as an interval like (-∞, 6].', format: true };
    const right = (dir === '>') === up && Math.abs(val - k.value()) < 1e-6;
    if (right && strict) return { ok: false, msg: 'The vertex is on the graph, so its y-value is included. Use ≤ or ≥ (or a square bracket).' };
    return { ok: right };
  };
}
