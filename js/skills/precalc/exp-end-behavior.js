// Skill: end behavior of exponential functions f(x) = a·b^(x-h) + k (AP Precalculus)
import { F, randInt, pick, nonzero, readNumber, parse, evaluate, variables } from '../../math.js?v=3.1';

export const skill = {
  id: 'exp-end-behavior',
  course: 'precalc',
  title: 'End Behavior of Exponential Functions',
  group: 'Unit 2 - Sequences and Exponentials',
  lesson: '2.3',
  blurb: 'Complete the limits as x goes to negative and positive infinity.',
  levels: {
    1: { name: 'Easy', desc: 'Read the end behavior from a graph' },
    2: { name: 'Medium', desc: 'From the equation, no reflections, plus the four cases of a and b' },
    3: { name: 'Challenging', desc: 'Reflected over the asymptote, and writing a function with given behavior' },
  },
  generate(level, rng) {
    const u = rng();
    if (level === 2 && u < 0.35) return cases(rng);
    if (level === 3 && u < 0.3) return writeOne(rng);
    if (level === 3 && u < 0.5) return cases(rng);
    return build(level, rng);
  },
};

const BASES = [F(2), F(3), F(4), F(5), F(1, 2), F(1, 3), F(1, 4), F(2, 3), F(3, 2)];
const INF = '\\infty';

function readLimit(str) {
  const s = String(str).toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '')
    .replace(/infinity|inf|oo/g, '∞');
  if (!s) return { error: 'Enter a value, or use the ∞ / -∞ buttons.' };
  if (s === '∞' || s === '+∞') return { inf: 1 };
  if (s === '-∞') return { inf: -1 };
  if (/dne|none/.test(s)) return { error: 'These limits all exist as a number, ∞ or -∞.' };
  const r = readNumber(s);
  if (r.error) return { error: 'Enter a number, or use the ∞ / -∞ buttons.' };
  return { value: r.value, decimal: r.decimal };
}

function build(level, rng) {
  const b = pick(rng, BASES);
  const grows = b.value() > 1;
  let a;
  if (level === 1) a = F(nonzero(rng, -3, 3));
  else if (level === 2) a = F(randInt(rng, 1, 6));
  else a = F(-randInt(rng, 1, 6));
  const h = level === 1 ? 0 : pick(rng, [0, 0, 1, -1, 2, -2, 3]);
  const k = randInt(rng, -6, 6);
  const sgn = a.sign();
  // limits: x -> +inf and x -> -inf
  const right = grows ? { inf: sgn } : { value: k };
  const left = grows ? { value: k } : { inf: sgn };

  const bTex = b.isInt() ? String(b.n) : `\\left(\\tfrac{${b.n}}{${b.d}}\\right)`;
  const expo = h === 0 ? 'x' : `x ${h > 0 ? '-' : '+'} ${Math.abs(h)}`;
  const aT = a.eq(1) ? '' : a.eq(-1) ? '-' : String(a.n);
  const fTex = `f(x) = ${aT}${b.isInt() && !a.eq(1) && !a.eq(-1) ? `\\left(${b.n}\\right)` : bTex}^{${expo}}${k === 0 ? '' : (k < 0 ? ' - ' : ' + ') + Math.abs(k)}`;
  const fn = x => a.value() * Math.pow(b.value(), x - h) + k;

  const limTex = l => (l.inf ? (l.inf > 0 ? INF : '-' + INF) : String(l.value));
  const mk = (want, side) => ({
    type: 'custom',
    label: `$\\displaystyle\\lim_{x \\to ${side < 0 ? '-' : ''}\\infty} f(x) =$`,
    keys: ['∞', '-∞'], placeholder: '', answerTex: `$${limTex(want)}$`,
    check: str => {
      const r = readLimit(str);
      if (r.error) return { ok: false, msg: r.error, format: true };
      if (want.inf) return { ok: r.inf === want.inf };
      if (r.inf) return { ok: false };
      return { ok: Math.abs(r.value - want.value) <= (r.decimal ? 0.0051 : 1e-9) };
    },
  });

  let displayGraph;
  if (level === 1) {
    // window: show the asymptote and enough of the curve
    const ys = [];
    for (let x = -5; x <= 5; x += 0.25) ys.push(fn(x));
    const inRange = ys.filter(y => Math.abs(y - k) <= 8);
    const ymin = Math.floor(Math.min(k, ...inRange)) - 2, ymax = Math.ceil(Math.max(k, ...inRange)) + 2;
    displayGraph = { window: { xmin: -6, xmax: 6, ymin: Math.min(ymin, -1), ymax: Math.max(ymax, 1) }, fn, asymptote: k };
  }

  const growText = grows
    ? `The base $${b.tex()}$ is greater than 1, so $${b.tex()}^{${expo}}$ grows without bound as $x \\to \\infty$ and approaches 0 as $x \\to -\\infty$.`
    : `The base $${b.tex()}$ is between 0 and 1, so $\\left(${b.tex()}\\right)^{${expo}}$ approaches 0 as $x \\to \\infty$ and grows without bound as $x \\to -\\infty$.`;
  const signText = sgn < 0 ? ` The coefficient $${a.n}$ is negative, which reflects the graph over the asymptote, so the unbounded end goes to $-\\infty$.` : '';
  const solution = level === 1
    ? `The dashed line is the horizontal asymptote, $y = ${k}$. The side of the graph that levels off approaches ${k}; the other side ${sgn > 0 ? 'rises' : 'falls'} without bound.<br>`
      + `As $x \\to -\\infty$: $${limTex(left)}$. As $x \\to \\infty$: $${limTex(right)}$.`
    : `${growText}${signText}<br>When the power approaches 0, $f(x)$ approaches the vertical shift: $${k}$ (the horizontal asymptote $y = ${k}$).<br>`
      + `So $\\displaystyle\\lim_{x \\to -\\infty} f(x) = ${limTex(left)}$ and $\\displaystyle\\lim_{x \\to \\infty} f(x) = ${limTex(right)}$.`;

  return {
    tag: level === 1 ? 'from a graph' : level === 2 ? 'from equation' : 'reflected, from equation',
    prompt: level === 1 ? 'The graph of $f$ is shown. Complete each limit.' : `Let $${fTex}$. Complete each limit.`,
    displayGraph,
    parts: level === 1 ? [mk(left, -1), mk(right, 1)] : [mk(left, -1), mk(right, 1), { type: 'mc', label: `The graph of $f$ is:`, choices: [`Above its asymptote $y = ${k}$`, `Below its asymptote $y = ${k}$`], answer: sgn > 0 ? 0 : 1 }],
    solution: level === 1 ? solution : solution + `<br>The term $${aT}${b.isInt() && !a.eq(1) && !a.eq(-1) ? `\\left(${b.n}\\right)` : bTex}^{${expo}}$ is ${sgn > 0 ? 'always positive' : 'always negative'}, so $f(x)$ is always ${sgn > 0 ? 'greater' : 'less'} than ${k}: the graph is ${sgn > 0 ? 'above' : 'below'} the asymptote.`,
    _check: { a: a.value(), b: b.value(), h, k, left, right, fn },
  };
}

// ---------- the four cases of f(x) = k + ab^x (a > 0 or a < 0, b > 1 or 0 < b < 1) ----------
function cases(rng) {
  const aPos = rng() < 0.5, bBig = rng() < 0.5;
  const inc = aPos === bBig;
  const choices1 = ['Increasing', 'Decreasing'], choices2 = ['Above $y = k$', 'Below $y = k$'];
  const choices3 = ['$\\displaystyle\\lim_{x \\to \\infty} f(x) = k$', '$\\displaystyle\\lim_{x \\to -\\infty} f(x) = k$'];
  return {
    tag: 'four cases',
    prompt: `Let $f(x) = k + ab^x$ with $${aPos ? 'a > 0' : 'a < 0'}$ and $${bBig ? 'b > 1' : '0 < b < 1'}$. Describe the graph of $f$.`,
    parts: [
      { type: 'mc', label: '$f$ is:', choices: choices1, answer: inc ? 0 : 1 },
      { type: 'mc', label: 'The graph is:', choices: choices2, answer: aPos ? 0 : 1 },
      { type: 'mc', label: 'Which limit equals $k$?', choices: choices3, answer: bBig ? 1 : 0 },
    ],
    solution: `$b^x$ ${bBig ? 'grows' : 'shrinks'} as $x$ increases (${bBig ? '$b > 1$' : '$0 < b < 1$'}), so it shrinks to 0 as $x \\to ${bBig ? '-\\infty' : '\\infty'}$. That is the side where $f(x)$ approaches $k$: $\\displaystyle\\lim_{x \\to ${bBig ? '-\\infty' : '\\infty'}} f(x) = k$.<br>`
      + `${aPos ? '$a > 0$ keeps $ab^x$ positive' : '$a < 0$ makes $ab^x$ negative'}, so $f(x)$ is always ${aPos ? 'greater' : 'less'} than $k$: the graph is ${aPos ? 'above' : 'below'} $y = k$.<br>`
      + `$b^x$ is ${bBig ? 'increasing' : 'decreasing'}${aPos ? '' : ', and the negative $a$ flips that'}: $f$ is ${inc ? 'increasing' : 'decreasing'}.`,
    _check: { aPos, bBig, inc },
  };
}

// ---------- write k + ab^x with a given asymptote, direction and end behavior ----------
function writeOne(rng) {
  const K = nonzero(rng, -8, 8), inc = rng() < 0.5, right = rng() < 0.5;   // right: approaches K as x -> infinity
  // approaches K on the right needs 0 < b < 1; then increasing needs a < 0
  const aPos = right ? !inc : inc;
  const ex = `${K} ${aPos ? '+' : '-'} 2(${right ? '0.5' : '2'})^x`;
  const check = str => {
    const s0 = String(str).replace(/[−–]/g, '-').replace(/^\s*f\s*\(\s*x\s*\)\s*=\s*/i, '').trim();
    if (!s0) return { ok: false, msg: 'Enter a function of x.', format: true };
    let tree; try { tree = parse(s0); } catch { return { ok: false, msg: 'Could not read that. Example: -3 + 2(0.5)^x', format: true }; }
    for (const v of variables(tree)) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const f = x => evaluate(tree, { x });
    const y = [0, 1, 2, 3, 4].map(f);
    if (y.some(v => !isFinite(v))) return { ok: false };
    const d = [0, 1, 2, 3].map(i => y[i + 1] - y[i]);
    if (d.some(v => Math.abs(v) < 1e-12)) return { ok: false, msg: 'That function is constant somewhere. It needs to be an exponential, k + ab^x.' };
    const b = d[1] / d[0];
    if (!(b > 0) || Math.abs(b - 1) < 1e-9 || [2, 3].some(i => Math.abs(d[i] / d[i - 1] - b) > 1e-7 * Math.max(1, b))) return { ok: false, msg: 'Write it in the form k + ab^x.' };
    const a = d[0] / (b - 1), k = y[0] - a;
    const okK = Math.abs(k - K) < 1e-7, okInc = (d[0] > 0) === inc, okEnd = (b < 1) === right;
    return { ok: okK && okInc && okEnd };
  };
  return {
    tag: 'write a function',
    prompt: `Write a function of the form $f(x) = k + ab^x$ that is ${inc ? 'increasing' : 'decreasing'}, has a horizontal asymptote at $y = ${K}$, and approaches ${K} as $x \\to ${right ? '\\infty' : '-\\infty'}$.`,
    parts: [{ type: 'custom', label: '$f(x) =$', check, keys: ['^', '(', ')', '/', '-'], placeholder: 'e.g. -3 + 2(0.5)^x', answerTex: `Answers vary, for example $${ex.replace('(0.5)', '(0.5)').replace('^x', '^x')}$`, help: 'Type the right side, like -3 + 2(0.5)^x.' }],
    solution: `The asymptote is $y = ${K}$, so $k = ${K}$.<br>To approach ${K} as $x \\to ${right ? '\\infty' : '-\\infty'}$, the power $b^x$ must shrink to 0 on that side, so $${right ? '0 < b < 1' : 'b > 1'}$.<br>`
      + `$b^x$ is then ${right ? 'decreasing' : 'increasing'}. For $f$ to be ${inc ? 'increasing' : 'decreasing'}, ${aPos ? 'keep $a > 0$' : 'flip it with $a < 0$'}.<br>One answer: $f(x) = ${ex}$. Any $k = ${K}$, $${right ? '0 < b < 1' : 'b > 1'}$ and $${aPos ? 'a > 0' : 'a < 0'}$ works.`,
    _check: { K, inc, right, aPos, ex, check },
  };
}
