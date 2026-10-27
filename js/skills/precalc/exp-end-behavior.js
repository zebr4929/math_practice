// Skill: end behavior of exponential functions f(x) = a·b^(x-h) + k (AP Precalculus)
import { F, randInt, pick, nonzero, readNumber } from '../../math.js?v=2.4';

export const skill = {
  id: 'exp-end-behavior',
  course: 'precalc',
  title: 'End Behavior of Exponential Functions',
  group: 'Unit 2 - Sequences and Exponentials',
  lesson: '2.3',
  blurb: 'Complete the limits as x goes to negative and positive infinity.',
  levels: {
    1: { name: 'Easy', desc: 'Read the end behavior from a graph' },
    2: { name: 'Medium', desc: 'From the equation, no reflections' },
    3: { name: 'Challenging', desc: 'From the equation, reflected over the asymptote' },
  },
  generate(level, rng) { return build(level, rng); },
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
    parts: [mk(left, -1), mk(right, 1)],
    solution,
    _check: { a: a.value(), b: b.value(), h, k, left, right, fn },
  };
}
