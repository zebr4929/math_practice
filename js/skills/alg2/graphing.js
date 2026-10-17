// Skills: graphing quadratics from standard form and from vertex form (Algebra II).
// Students plot 7 points: the vertex and 3 on each side, using the 1-3-5 pattern scaled by a.
import { F, randInt, pick } from '../../math.js?v=1.8';

const LEVELS = {
  1: { name: 'Easy', desc: 'a = 1' },
  2: { name: 'Medium', desc: 'a = 1 or a = -1 (opens down)' },
  3: { name: 'Challenging', desc: 'Stretch factors 2, 1/2 or 3, up or down' },
};

export const graphStandard = {
  id: 'graph-standard',
  course: ['accel'],
  title: 'Graphing Quadratics from Standard Form',
  group: 'Quadratics: forms and graphs',
  blurb: 'Find the vertex, then plot 7 points with the 1-3-5 pattern.',
  levels: LEVELS,
  generate(level, rng) { return build(level, rng, 'standard'); },
};

export const graphVertex = {
  id: 'graph-vertex',
  course: ['accel'],
  title: 'Graphing Quadratics from Vertex Form',
  group: 'Quadratics: forms and graphs',
  blurb: 'Read the vertex, then plot 7 points with the 1-3-5 pattern.',
  levels: LEVELS,
  generate(level, rng) { return build(level, rng, 'vertex'); },
};

const aTex = a => (a.eq(1) ? '' : a.eq(-1) ? '-' : a.isInt() ? String(a.n) : `${a.n < 0 ? '-' : ''}\\tfrac{${Math.abs(a.n)}}{${a.d}}`);
const signed = n => (n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`);

function build(level, rng, form) {
  let a;
  if (level === 1) a = F(1);
  else if (level === 2) a = F(pick(rng, [1, -1, -1]));
  else a = pick(rng, [F(2), F(1, 2), F(3)]).mul(pick(rng, [1, -1]));
  let h = randInt(rng, -4, 4);
  if (a.d === 2 && h % 2 !== 0) h += h < 4 ? 1 : -1;          // keeps b and c whole numbers when a = 1/2
  const kRange = Math.abs(a.value()) >= 2 ? [-4, 4] : [-6, 6];
  let k = randInt(rng, kRange[0], kRange[1]);
  if (a.sign() < 0 && Math.abs(a.value()) >= 2) k = Math.abs(k) + 2;    // keep tall downward graphs on screen
  if (a.sign() > 0 && Math.abs(a.value()) >= 2) k = -Math.abs(k) - 2;

  const correct = [-3, -2, -1, 0, 1, 2, 3].map(d => ({ x: h + d, y: +(k + a.value() * d * d).toFixed(4) }));
  const fn = x => a.value() * (x - h) ** 2 + k;
  const ys = correct.map(p => p.y);
  const window = {
    xmin: Math.min(h - 5, -1), xmax: Math.max(h + 5, 1),
    ymin: Math.min(Math.floor(Math.min(...ys)) - 2, -1), ymax: Math.max(Math.ceil(Math.max(...ys)) + 2, 1),
  };
  const snap = a.d === 2 ? 0.5 : 1;

  // equation
  const b = a.mul(-2 * h), c = a.mul(h * h).add(k);
  const stdTex = `y = ${aTex(a)}x^2${b.isZero() ? '' : (b.sign() < 0 ? ' - ' : ' + ') + (b.abs().eq(1) ? '' : b.abs().tex()) + 'x'}${c.isZero() ? '' : (c.sign() < 0 ? ' - ' : ' + ') + c.abs().tex()}`;
  const vtxTex = `y = ${aTex(a)}${h === 0 ? 'x^2' : `(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2`}${k === 0 ? '' : signed(k)}`;
  const eqTex = form === 'standard' ? stdTex : vtxTex;

  // solution
  const steps = [];
  if (form === 'standard') {
    steps.push(`<b>Vertex.</b> $x = -\\dfrac{b}{2a} = -\\dfrac{${b.tex()}}{2${a.eq(1) ? '' : `\\left(${a.tex()}\\right)`}} = ${h}$. Then $y = ${k}$ (substitute $x = ${h}$). Vertex: $(${h}, ${k})$.`);
  } else {
    steps.push(`<b>Vertex.</b> In $y = a(x - h)^2 + k$ the vertex is $(h, k)$. ${h === 0 ? 'Here $h = 0$' : `The sign inside flips: $(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})$ means $h = ${h}$`}, and $k = ${k}$. Vertex: $(${h}, ${k})$.`);
  }
  const step = d => +(a.value() * (2 * d - 1)).toFixed(4);
  const dir = a.sign() > 0 ? 'up' : 'down';
  const amount = d => { const v = Math.abs(step(d)); return Number.isInteger(v) ? v : (v * 2) + '/2'; };
  steps.push(`<b>1-3-5 pattern${a.abs().eq(1) ? '' : `, times $${a.abs().tex()}$`}.</b> From the vertex, move over 1 and ${dir} ${amount(1)}, over 1 more and ${dir} ${amount(2)}, over 1 more and ${dir} ${amount(3)}. Do the same on the other side.`);
  if (!a.eq(1)) steps.push(a.sign() < 0 ? 'A negative $a$ means the parabola opens down.' : '');
  steps.push(`<b>Points:</b> ${correct.map(p => `$(${p.x},\\ ${fmtTex(p.y)})$`).join(', ')}.`);

  return {
    tag: `${form} form, ${a.eq(1) ? 'a = 1' : a.eq(-1) ? 'a = -1' : 'a = ' + a.text()}`,
    prompt: `Graph $${eqTex}$. Plot the vertex and 3 points on each side of it (7 points in all).`,
    parts: [{
      type: 'graph', label: 'Click to plot your 7 points', window, snap, fn, correct,
      answerTex: 'the 7 points marked on the graph',
      help: snap < 1 ? 'With a = 1/2 some points land on half units, so this grid snaps to every half unit.' : '',
      check: pts => {
        if (pts.length !== 7) return { ok: false, format: true, msg: `Plot exactly 7 points: the vertex and 3 on each side. You have ${pts.length}.` };
        const key = p => `${p.x},${p.y}`, want = new Set(correct.map(key));
        return { ok: pts.every(p => want.has(key(p))) };
      },
    }],
    solution: steps.filter(Boolean).join('<br>'),
    _check: { a: a.value(), h, k, correct, window, eq: form === 'standard' ? [a.value(), b.value(), c.value()] : null },
  };
}

const fmtTex = v => (Number.isInteger(v) ? String(v) : `${v < 0 ? '-' : ''}\\tfrac{${Math.abs(v * 2)}}{2}`);
