// AP Precalculus, Unit 2: increasing/decreasing and concavity of exponential functions,
// from a table of values or from the equation.
import { F, randInt, pick } from '../../math.js?v=2.1';

export const skill = {
  id: 'exp-behavior',
  course: 'precalc',
  title: 'Increasing, Decreasing and Concavity of Exponentials',
  group: 'Unit 2: Exponential functions',
  blurb: 'Decide whether an exponential is increasing or decreasing, and concave up or down.',
  levels: {
    1: { name: 'Easy', desc: 'From a table, positive outputs' },
    2: { name: 'Medium', desc: 'From the equation y = ab^x, with a positive or negative' },
    3: { name: 'Challenging', desc: 'Tables with negative outputs, and equations with shifts' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = build(level, rng); if (p) return p; }
    throw new Error('exp-behavior: could not build');
  },
};

const CHOICES = [
  'Always decreasing, and the graph is always concave up',
  'Always decreasing, and the graph is always concave down',
  'Always increasing, and the graph is always concave up',
  'Always increasing, and the graph is always concave down',
];
const BASES = [F(2), F(3), F(4), F(5), F(3, 2), F(1, 2), F(1, 3), F(1, 4), F(2, 3)];
const coefTex = a => (a.eq(1) ? '' : a.eq(-1) ? '-' : a.tex());
const bTex = b => (b.isInt() ? `(${b.n})` : `\\left(${b.tex()}\\right)`);

function build(level, rng) {
  const b = pick(rng, BASES);
  const fromTable = level === 1 || (level === 3 && rng() < 0.6);
  let a, sign;
  if (level === 1) sign = 1;
  else if (level === 2) sign = pick(rng, [1, -1]);
  else sign = fromTable ? pick(rng, [-1, -1, 1]) : -1;

  const increasing = sign > 0 ? b.value() > 1 : b.value() < 1;
  const concaveUp = sign > 0;
  const answer = (increasing ? 2 : 0) + (concaveUp ? 0 : 1);
  const steps = [];
  let prompt, visual = '', tag, name = pick(rng, ['f', 'g', 'h', 'k']);

  if (fromTable) {
    // four outputs v, vb, vb^2, vb^3 at consecutive x values; keep them whole numbers or simple fractions
    const start = level === 1 ? 0 : randInt(rng, -2, 8);
    const v0 = F(sign * randInt(rng, 1, 6) * Math.pow(b.d, level === 1 ? 3 : pick(rng, [2, 3])));
    const vals = [0, 1, 2, 3].map(i => v0.mul(b.pow(i)));
    if (vals.some(v => Math.abs(v.n) > 999 || v.d > 27)) return null;
    const xs = [0, 1, 2, 3].map(i => start + i);
    visual = `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr>`
      + `<tr><th>$${name}(x)$</th>${vals.map(v => `<td>$${v.tex()}$</td>`).join('')}</tr></table>`;
    prompt = `Values of an exponential function $${name}$ are given in the table. Which of the following describes $${name}$?`;
    const diffs = [0, 1, 2].map(i => vals[i + 1].sub(vals[i]));
    const ratio = vals[1].div(vals[0]);
    steps.push(`<b>Increasing or decreasing.</b> As $x$ increases, the outputs go $${vals.map(v => v.tex()).join(',\\ ')}$. They are getting ${increasing ? 'larger' : 'smaller'}, so $${name}$ is ${increasing ? 'increasing' : 'decreasing'}.`
      + (sign < 0 ? ` (Careful with negatives: $${vals[1].tex()}$ is ${increasing ? 'greater' : 'less'} than $${vals[0].tex()}$.)` : ''));
    steps.push(`<b>Concavity.</b> Find the change between outputs: $${diffs.map(d => d.tex()).join(',\\ ')}$. The rate of change is ${concaveUp ? 'increasing' : 'decreasing'}, so the graph is concave ${concaveUp ? 'up' : 'down'}.`);
    steps.push(`<b>Another way to see it.</b> Each output is $${ratio.tex()}$ times the one before, so $b = ${ratio.tex()}$ and ${b.value() > 1 ? '$b > 1$' : '$0 < b < 1$'}. The outputs are ${sign > 0 ? 'positive, so $a > 0$' : 'negative, so $a < 0$'}. `
      + summary(sign, b));
    tag = `table, ${sign > 0 ? 'positive a' : 'negative a'}, ${b.value() > 1 ? 'growth base' : 'decay base'}`;
  } else {
    a = F(sign * pick(rng, [1, 2, 3, 4, 5, 6]));
    if (rng() < 0.25) a = F(sign, pick(rng, [2, 3, 4]));
    let eq = `${name}(x) = ${coefTex(a)}${bTex(b)}^{x}`;
    let shifted = false;
    if (level === 3) {
      const h = pick(rng, [-3, -2, -1, 1, 2, 3]), k = pick(rng, [-6, -4, -1, 2, 3, 5, 7]);
      eq = `${name}(x) = ${coefTex(a)}${bTex(b)}^{x ${h > 0 ? '-' : '+'} ${Math.abs(h)}} ${k > 0 ? '+' : '-'} ${Math.abs(k)}`;
      shifted = true;
    }
    prompt = `Let $${eq}$. Which of the following describes $${name}$?`;
    steps.push(`Here $a = ${a.tex()}$ and $b = ${b.tex()}$${shifted ? '. The shifts left/right and up/down move the graph but do not change whether it increases or which way it bends' : ''}.`);
    steps.push(`$${b.value() > 1 ? 'b > 1' : '0 < b < 1'}$, so $${bTex(b)}^{x}$ is ${b.value() > 1 ? 'increasing (growth)' : 'decreasing (decay)'}, and like every $b^x$ it is concave up.`);
    steps.push(sign > 0
      ? `$a > 0$ only stretches or shrinks the graph, so nothing flips: $${name}$ is ${increasing ? 'increasing' : 'decreasing'} and concave up.`
      : `$a < 0$ reflects the graph over the horizontal axis, which flips both: $${name}$ is ${increasing ? 'increasing' : 'decreasing'} and concave down.`);
    tag = `equation, ${sign > 0 ? 'positive a' : 'negative a'}${shifted ? ', shifted' : ''}`;
  }

  return {
    tag, prompt, visual,
    parts: [{ type: 'mc', label: 'Choose one:', choices: CHOICES, answer }],
    solution: steps.join('<br>') + `<br>Answer: ${CHOICES[answer].toLowerCase()}.`,
    _check: { sign, b: b.value(), increasing, concaveUp },
  };
}

function summary(sign, b) {
  const grow = b.value() > 1;
  if (sign > 0) return `With $a > 0$, ${grow ? 'growth' : 'decay'} means ${grow ? 'increasing' : 'decreasing'}, and the graph is concave up.`;
  return `With $a < 0$ the graph of $b^x$ is reflected, so ${grow ? 'growth' : 'decay'} becomes ${grow ? 'decreasing' : 'increasing'} and the graph is concave down.`;
}
