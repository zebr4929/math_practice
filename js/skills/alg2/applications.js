// Accelerated Algebra II, 2.9 and 2.10:
//  1. Projectile problems (initial height, maximum, hitting the ground, time above a height)
//  2. Equations of circles
import { F, randInt, pick, nonzero, parse, evaluate, toTex } from '../../math.js?v=2.3';
import { decimalChecker } from '../precalc/exp-data.js?v=2.3';

const GROUP = 'Unit 2 - Applications and Circles';
const num = v => String(+v.toFixed(4));                          // 58.80000001 -> 58.8
const ans3 = v => (Number.isInteger(+v.toFixed(6)) ? String(+v.toFixed(6)) : (+v.toFixed(3)).toString());

// =====================================================================
// 1. Projectile problems
// =====================================================================
export const projectile = {
  id: 'projectile',
  course: ['accel'],
  group: GROUP,
  lesson: '2.9',
  title: 'Projectile Problems',
  blurb: 'Use h(t) = at² + bt + c to find the starting height, the maximum, and when an object lands.',
  levels: {
    1: { name: 'Easy', desc: 'Starting height, when it reaches its maximum, and the maximum height' },
    2: { name: 'Medium', desc: 'Maximum height and when it hits the ground' },
    3: { name: 'Challenging', desc: 'Landing times that need the quadratic formula, and time spent above a height' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildProjectile(level, rng); if (p) return p; }
    throw new Error('projectile: could not build');
  },
};

const STORIES = [
  { units: 'ft', ground: false, h0: [2, 3, 4, 5, 6], text: 'A punter kicks a football. Its height, in feet, after $t$ seconds is' },
  { units: 'ft', ground: false, h0: [40, 48, 60, 64, 80, 96], text: 'A water balloon is tossed upward from the top of the Upper School building. Its height, in feet, after $t$ seconds is' },
  { units: 'ft', ground: false, h0: [80, 112, 144, 192, 240, 480], text: 'A cliff diver jumps up and off a cliff into the ocean. His height above the water, in feet, after $t$ seconds is' },
  { units: 'ft', ground: true, h0: [0], text: 'A toy rocket is launched straight up from the ground. Its height, in feet, after $t$ seconds is' },
  { units: 'ft', ground: false, h0: [16, 32, 48, 80], text: 'You throw a ball straight up from a platform. Its height, in feet, after $t$ seconds is' },
  { units: 'm', ground: false, h0: [19.6, 24.5, 39.2, 58.8, 73.5], text: 'An object is launched upward from the top of a building. Its height, in meters, after $t$ seconds is' },
  { units: 'm', ground: true, h0: [0], text: 'An object is launched straight up from ground level. Its height, in meters, after $t$ seconds is' },
];

function buildProjectile(level, rng) {
  const st = pick(rng, STORIES);
  const g = st.units === 'ft' ? 16 : 4.9;
  // vertex time T: v = 2gT. Feet: T in halves; meters: whole seconds
  const T = st.units === 'ft' ? pick(rng, [0.5, 1, 1.5, 2, 2.5, 3, 4]) : pick(rng, [1, 2, 3, 4]);
  const v = 2 * g * T;
  let h0;
  if (level === 2 || (level === 3 && rng() < 0.5)) {
    // nice landing time: H / g = n^2
    const n = randInt(rng, Math.ceil(T), Math.ceil(T) + 4);
    h0 = st.ground ? 0 : g * (n * n - T * T);
    if (!st.ground && (h0 <= 0 || h0 > Math.max(...st.h0) * 1.6)) return null;
    if (st.ground && n !== T) { /* from the ground, landing time is 2T automatically */ }
  } else h0 = pick(rng, st.h0);
  const H = h0 + g * T * T;
  const land = T + Math.sqrt(H / g);
  const unit = st.units === 'ft' ? 'feet' : 'meters';
  const hTex = `h(t) = -${num(g)}t^2 + ${num(v)}t${h0 ? ` + ${num(h0)}` : ''}`;
  const parts = [], steps = [];
  const P = (label, val, ph = 'e.g. 4.062') => parts.push({ type: 'custom', label, check: decimalChecker(val), placeholder: ph, answerTex: ans3(val) });
  const vertexStep = () => {
    steps.push(`The maximum is at the vertex: $t = -\\dfrac{b}{2a} = -\\dfrac{${num(v)}}{2(-${num(g)})} = ${num(T)}$ seconds.`);
    steps.push(`Maximum height: $h(${num(T)}) = -${num(g)}(${num(T)})^2 + ${num(v)}(${num(T)})${h0 ? ` + ${num(h0)}` : ''} = ${num(H)}$ ${unit}.`);
  };
  const landStep = () => {
    const D = v * v + 4 * g * h0;
    if (st.ground) steps.push(`It hits the ground when $h(t) = 0$: $t(-${num(g)}t + ${num(v)}) = 0$, so $t = 0$ (the launch) or $t = ${num(v / g)}$ seconds.`);
    else steps.push(`It hits the ground when $h(t) = 0$. With the quadratic formula: $t = \\dfrac{-${num(v)} \\pm \\sqrt{${num(v)}^2 - 4(-${num(g)})(${num(h0)})}}{2(-${num(g)})} = \\dfrac{-${num(v)} \\pm \\sqrt{${num(D)}}}{-${num(2 * g)}}$. Time can't be negative, so $t \\approx ${ans3(land)}$ seconds.`);
  };
  if (level === 1) {
    P(`Starting height (${unit}):`, h0, 'e.g. 4');
    P('Time to reach the maximum height (seconds):', T, 'e.g. 2');
    P(`Maximum height (${unit}):`, H, 'e.g. 68');
    steps.push(`The starting height is $h(0) = ${num(h0)}$ ${unit}, the constant term.`);
    vertexStep();
  } else if (level === 2) {
    P(`Maximum height (${unit}):`, H, 'e.g. 68');
    P('Time to reach the maximum height (seconds):', T, 'e.g. 2');
    P('Time when it hits the ground (seconds):', land, 'e.g. 5');
    vertexStep(); landStep();
  } else {
    P('Time when it hits the ground (seconds, to 3 decimal places):', land, 'e.g. 4.062');
    landStep();
    // a height Y reached twice: (H - Y)/g = m^2
    const m = pick(rng, st.units === 'ft' ? [0.5, 1, 1.5, 2] : [1, 2]);
    const Y = H - g * m * m;
    if (Y <= 0 || Y <= h0) return null;
    const t1 = T - m, t2 = T + m;
    if (rng() < 0.5) {
      parts.push({ type: 'list', label: `At what times is the height exactly ${num(Y)} ${unit}?`, answer: [F(Math.round(t1 * 2), 2), F(Math.round(t2 * 2), 2)], placeholder: 'e.g. 1, 7', help: 'List both times, separated by a comma.' });
      steps.push(`Set $h(t) = ${num(Y)}$: $-${num(g)}t^2 + ${num(v)}t${h0 ? ` + ${num(h0)}` : ''} = ${num(Y)}$. Solving (factor out $-${num(g)}$ or use the formula) gives $t = ${num(t1)}$ and $t = ${num(t2)}$: once on the way up and once on the way down.`);
    } else {
      P(`How many seconds is it at or above ${num(Y)} ${unit}?`, t2 - t1, 'e.g. 4');
      steps.push(`Set $h(t) = ${num(Y)}$ and solve: $t = ${num(t1)}$ (going up) and $t = ${num(t2)}$ (coming down). Between those times it is at or above ${num(Y)} ${unit}, so it spends $${num(t2)} - ${num(t1)} = ${num(t2 - t1)}$ seconds there.`);
    }
  }
  return {
    tag: `${level === 1 ? 'start and maximum' : level === 2 ? 'maximum and landing' : 'landing and height'}, ${st.units}`,
    prompt: `${st.text} $${hTex}$. Round answers to 3 decimal places when they are not exact.`,
    parts, solution: steps.join('<br>'),
    _check: { g, v, h0, T, H, land },
  };
}

// =====================================================================
// 2. Equations of circles
// =====================================================================
export const circles = {
  id: 'circle-equations',
  course: ['accel'],
  group: GROUP,
  lesson: '2.10',
  title: 'Equations of Circles',
  blurb: 'Connect the center and radius to the equation (x - h)² + (y - k)² = r².',
  levels: {
    1: { name: 'Easy', desc: 'Write the equation from the center and radius' },
    2: { name: 'Medium', desc: 'Read the center and radius from an equation or a graph; circles tangent to an axis' },
    3: { name: 'Challenging', desc: 'Complete the square, like x² + y² + 4x − 6y − 23 = 0' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildCircle(level, rng); if (p) return p; }
    throw new Error('circle-equations: could not build');
  },
};

const sq = (v, h) => (h === 0 ? `${v}^2` : `(${v} ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2`);
const circleTex = (h, k, r2) => `${sq('x', h)} + ${sq('y', k)} = ${r2}`;

// accepts any equation equivalent to (x - h)^2 + (y - k)^2 = r^2 written in standard form
function circleChecker(h, k, r2) {
  const target = (x, y) => (x - h) ** 2 + (y - k) ** 2 - r2;
  return str => {
    const s = String(str).replace(/[−–]/g, '-').trim();
    if (!s.includes('=')) return { ok: false, msg: 'Write a full equation, like (x - 2)^2 + (y + 4)^2 = 9.', format: true };
    const [L, R] = s.split('=');
    let A, B;
    try { A = parse(L); B = parse(R); } catch { return { ok: false, msg: 'Could not read that. Example: (x - 2)^2 + (y + 4)^2 = 9', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })({ a: A, b: B });
    for (const v of vars) if (v !== 'x' && v !== 'y') return { ok: false, msg: 'Use x and y.', format: true };
    const pts = [[0, 0], [1, 2], [-3, 1], [2.5, -1.5], [4, 4], [-1, -2]];
    const ok = pts.every(([x, y]) => Math.abs(evaluate(A, { x, y }) - evaluate(B, { x, y }) - target(x, y)) < 1e-6 * Math.max(1, Math.abs(target(x, y))));
    if (!ok) return { ok: false };
    // standard form: right side a number, left side two squares
    const isNum = n => { const vs = new Set(); (function w(m) { if (m.v) vs.add(m.v); if (m.a) w(m.a); if (m.b) w(m.b); })(n); return vs.size === 0; };
    const strip = n => (n.op === 'paren' ? strip(n.a) : n);
    const t = strip(A);
    const sqTerm = n => { n = strip(n); return n.op === '^' && n.b.num === '2'; };
    if (!isNum(B) || t.op !== '+' || !sqTerm(t.a) || !sqTerm(t.b)) return { ok: false, msg: 'That is equivalent, but write it in standard form: (x - h)^2 + (y - k)^2 = r^2.' };
    return { ok: true };
  };
}
const eqPreview = str => { try { const [L, R] = String(str).replace(/[−–]/g, '-').split('='); return toTex(parse(L)) + (R !== undefined && R.trim() ? ' = ' + toTex(parse(R)) : ''); } catch { return null; } };
const eqPart = (h, k, r2) => ({ type: 'custom', label: 'Equation:', check: circleChecker(h, k, r2), preview: eqPreview, keys: ['(', ')', '^2', '='], placeholder: 'e.g. (x + 2)^2 + (y - 3)^2 = 16', answerTex: `$${circleTex(h, k, r2)}$` });

function buildCircle(level, rng) {
  const h = randInt(rng, -6, 6), k = randInt(rng, -6, 6), r = randInt(rng, 1, level === 1 ? 10 : 6);
  const r2 = r * r;
  const steps = [];
  if (level === 1) {
    steps.push(`Standard form is $(x - h)^2 + (y - k)^2 = r^2$ with center $(h, k)$ and radius $r$.`);
    steps.push(`Here $h = ${h}$, $k = ${k}$ and $r^2 = ${r}^2 = ${r2}$, so the equation is $${circleTex(h, k, r2)}$.${h < 0 || k < 0 ? ' Subtracting a negative turns into a plus.' : ''}`);
    return { tag: 'from center and radius', prompt: `Write the standard form of the equation of the circle with center $(${h}, ${k})$ and radius $${r}$.`, parts: [eqPart(h, k, r2)], solution: steps.join('<br>'), _check: { h, k, r2 } };
  }
  if (level === 2) {
    const kind = pick(rng, ['read', 'graph', 'tangent']);
    if (kind === 'read') {
      steps.push(`Compare with $(x - h)^2 + (y - k)^2 = r^2$. The signs inside flip: ${h === 0 ? '$x^2$ means $h = 0$' : `$${sq('x', h).replace('^2', '')}$ means $h = ${h}$`}, and ${k === 0 ? '$y^2$ means $k = 0$' : `$${sq('y', k).replace('^2', '')}$ means $k = ${k}$`}.`);
      steps.push(`$r^2 = ${r2}$, so $r = ${r}$. Center $(${h}, ${k})$, radius $${r}$.`);
      return {
        tag: 'center and radius from equation', prompt: `Find the center and radius of the circle $${circleTex(h, k, r2)}$.`,
        parts: [{ type: 'point', label: 'Center:', answer: [F(h), F(k)], placeholder: 'e.g. (2, -4)' }, { type: 'number', label: 'Radius:', answer: F(r) }],
        solution: steps.join('<br>'), _check: { h, k, r2 },
      };
    }
    if (kind === 'graph') {
      if (Math.abs(h) + r > 9 || Math.abs(k) + r > 9) return null;
      const top = x => (Math.abs(x - h) <= r ? k + Math.sqrt(r2 - (x - h) ** 2) : NaN), bot = x => (Math.abs(x - h) <= r ? k - Math.sqrt(r2 - (x - h) ** 2) : NaN);
      const lim = Math.max(Math.abs(h) + r, Math.abs(k) + r, 4) + 1;
      steps.push(`The center is the middle of the circle: $(${h}, ${k})$. Count from the center to the edge (left, right, up or down): the radius is $${r}$.`);
      steps.push(`So $r^2 = ${r2}$ and the equation is $${circleTex(h, k, r2)}$.`);
      return {
        tag: 'from a graph', prompt: 'Find the center, radius and equation of the circle shown.',
        displayGraph: { window: { xmin: -lim, xmax: lim, ymin: -lim, ymax: lim }, fns: [top, bot], labels: [{ x: h, y: k, text: '' }, { x: h + r, y: k, text: '' }, { x: h - r, y: k, text: '' }, { x: h, y: k + r, text: '' }, { x: h, y: k - r, text: '' }] },
        parts: [{ type: 'point', label: 'Center:', answer: [F(h), F(k)], placeholder: 'e.g. (2, -4)' }, { type: 'number', label: 'Radius:', answer: F(r) }, eqPart(h, k, r2)],
        solution: steps.join('<br>'), _check: { h, k, r2 },
      };
    }
    // tangent to an axis
    const axis = pick(rng, ['x', 'y']);
    const rr = axis === 'x' ? Math.abs(k) : Math.abs(h);
    if (rr === 0) return null;
    steps.push(`Tangent to the ${axis}-axis means the circle just touches it. The distance from the center $(${h}, ${k})$ to the ${axis}-axis is $|${axis === 'x' ? k : h}| = ${rr}$, so the radius is $${rr}$.`);
    steps.push(`Equation: $${circleTex(h, k, rr * rr)}$.`);
    return { tag: 'tangent to an axis', prompt: `Write an equation of the circle with center $(${h}, ${k})$ that is tangent to the ${axis}-axis.`, parts: [eqPart(h, k, rr * rr)], solution: steps.join('<br>'), _check: { h, k, r2: rr * rr } };
  }
  // general form: x^2 + y^2 + Dx + Ey + Fc = 0
  if (h === 0 && k === 0) return null;
  const D = -2 * h, E = -2 * k, Fc = h * h + k * k - r2;
  const term = (c, v) => (c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c) === 1 && v ? '' : Math.abs(c)}${v}`);
  const general = `x^2 + y^2${term(D, 'x')}${term(E, 'y')}${term(Fc, '')} = 0`;
  steps.push(`Group the $x$ terms and the $y$ terms, and move the constant: $(x^2${term(D, 'x')}) + (y^2${term(E, 'y')}) = ${-Fc}$.`);
  steps.push(`Complete each square: half of $${D}$ is $${-h}$, squared is $${h * h}$; half of $${E}$ is $${-k}$, squared is $${k * k}$. Add both to each side: $${sq('x', h)} + ${sq('y', k)} = ${-Fc} + ${h * h} + ${k * k} = ${r2}$.`);
  steps.push(`Center $(${h}, ${k})$ and radius $\\sqrt{${r2}} = ${r}$.`);
  return {
    tag: 'complete the square',
    prompt: `Write in standard form and determine the center and radius: $\\;${general}$`,
    parts: [eqPart(h, k, r2), { type: 'point', label: 'Center:', answer: [F(h), F(k)], placeholder: 'e.g. (-2, 3)' }, { type: 'number', label: 'Radius:', answer: F(r) }],
    solution: steps.join('<br>'), _check: { h, k, r2, D, E, Fc },
  };
}
