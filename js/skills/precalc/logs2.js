// AP Precalculus 2.10–2.12: inverses of exponential functions, logarithmic functions, and log manipulation.
import { F, randInt, pick, nonzero, shuffle } from '../../math.js?v=2.8';
import { parseL, evalL, stripL, logsIn, varsL, previewL, valueChecker, intervalChecker, intervalTex, LOG_KEYS } from './logexpr.js?v=2.8';

const GROUP = 'Unit 2 - Logarithms';
const fT = f => f.tex();
// \log_{b} with b a whole number, a Frac, 10 (common) or 'e' (natural)
export function logHead(b) {
  if (b === 10) return '\\log';
  if (b === 'e') return '\\ln';
  if (typeof b === 'object') return b.isInt() ? `\\log_{${b.n}}` : `\\log_{${b.tex()}}`;
  return `\\log_{${b}}`;
}
const bVal = b => (b === 'e' ? Math.E : typeof b === 'object' ? b.value() : b);
const coef = c => (c.eq(1) ? '' : c.eq(-1) ? '-' : c.isInt() ? String(c.n) : `${c.n < 0 ? '-' : ''}\\tfrac{${Math.abs(c.n)}}{${c.d}}`);
const table = (name, xs, ys) => `<table class="seq-table"><tr><th>$x$</th><th>$${name}(x)$</th></tr>${xs.map((x, i) => `<tr><td>$${x}$</td><td>$${ys[i]}$</td></tr>`).join('')}</table>`;

// =====================================================================
// 1. Exponential, logarithmic, or neither (2.10)
// =====================================================================
export const expLogNeither = {
  id: 'exp-log-neither', course: 'precalc', group: GROUP, lesson: '2.10',
  title: 'Exponential, Logarithmic, or Neither?',
  blurb: 'Look at how the inputs and outputs change to decide what kind of function a table could be.',
  levels: {
    1: { name: 'Easy', desc: 'Clear patterns' },
    2: { name: 'Medium', desc: 'Decreasing tables, negative values, ratios less than 1' },
    3: { name: 'Challenging', desc: 'Look-alike traps, and which data looks linear on a semi-log plot' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = level === 3 && rng() < 0.35 ? semiLogWhich(rng) : buildENL(level, rng); if (p) return p; }
    throw new Error('exp-log-neither: could not build');
  },
};
const CHOICES3 = ['Exponential', 'Logarithmic', 'Neither'];
function buildENL(level, rng) {
  const kind = pick(rng, ['exp', 'log', 'neither']);
  let xs, ys, why;
  const r = level === 1 ? pick(rng, [F(2), F(3)]) : pick(rng, [F(2), F(3), F(1, 2), F(1, 3), F(4)]);
  if (kind === 'exp') {
    const s = randInt(rng, -2, 3), d = level === 1 ? 1 : pick(rng, [1, 2, 3]);
    let a = F(randInt(rng, 1, 5) * Math.pow(r.d, 3)); if (level > 1 && rng() < 0.4) a = a.neg();
    xs = [0, 1, 2, 3].map(i => F(s + i * d)); ys = [0, 1, 2, 3].map(i => a.mul(r.pow(i)));
    why = `The inputs go up by the same amount (${d}) each time, and each output is $${r.tex()}$ times the one before. Equal-step inputs with multiplying outputs: exponential.`;
  } else if (kind === 'log') {
    const x0 = pick(rng, [1, 2, 3, 5, 10]), m = pick(rng, level === 1 ? [2, 3] : [2, 3, 4, 10]);
    const c = randInt(rng, -6, 10), d = level === 1 ? randInt(rng, 1, 5) : nonzero(rng, -6, 6);
    xs = [0, 1, 2, 3].map(i => F(x0 * Math.pow(m, i))); ys = [0, 1, 2, 3].map(i => F(c + i * d));
    why = `Each input is ${m} times the one before, and the outputs go ${d > 0 ? 'up' : 'down'} by the same amount (${Math.abs(d)}) each time. Multiplying inputs with equal-step outputs: logarithmic.`;
  } else {
    const style = level === 1 ? 'linear' : level === 2 ? pick(rng, ['linear', 'square']) : pick(rng, ['power', 'square', 'power']);
    if (style === 'linear') {
      const s = randInt(rng, -2, 3), d = pick(rng, [1, 2]), m = nonzero(rng, -5, 5), c = randInt(rng, -5, 8);
      xs = [0, 1, 2, 3].map(i => F(s + i * d)); ys = xs.map(x => x.mul(m).add(c));
      why = 'The inputs and the outputs both change by equal steps. That is linear, not exponential or logarithmic.';
    } else if (style === 'square') {
      const s = randInt(rng, 0, 2);
      xs = [0, 1, 2, 3].map(i => F(s + i)); ys = xs.map(x => x.mul(x).add(1));
      why = 'The inputs go up by equal steps, but the outputs neither go up by a constant amount nor by a constant ratio. Neither.';
    } else {
      const x0 = pick(rng, [1, 2]), m = 2, p = pick(rng, [2, 3]);
      xs = [0, 1, 2, 3].map(i => F(x0 * Math.pow(m, i))); ys = xs.map(x => x.pow(p));
      why = `Both the inputs and the outputs are multiplied by a constant each time (×${m} and ×${Math.pow(m, p)}). An exponential needs equal-step inputs, and a log needs equal-step outputs, so this is neither.`;
    }
  }
  const name = pick(rng, ['f', 'g', 'h', 'k']);
  const ans = kind === 'exp' ? 0 : kind === 'log' ? 1 : 2;
  return {
    tag: kind === 'neither' ? 'neither' : kind === 'exp' ? 'exponential' : 'logarithmic',
    prompt: `Selected values of $${name}$ are shown. Could $${name}$ be exponential, logarithmic, or neither?`,
    visual: table(name, xs.map(fT), ys.map(fT)),
    parts: [{ type: 'mc', label: 'Choose one:', choices: CHOICES3, answer: ans }],
    solution: why,
    _check: { kind, xs: xs.map(x => x.value()), ys: ys.map(y => y.value()) },
  };
}
function semiLogWhich(rng) {
  const a = randInt(rng, 2, 5), r = pick(rng, [2, 3]);
  const geo = [0, 1, 2, 3, 4].map(i => a * Math.pow(r, i));
  const d = randInt(rng, 2, 6), ari = [0, 1, 2, 3, 4].map(i => a + i * d);
  const sq = [1, 2, 3, 4, 5].map(i => i * i + a);
  const opts = shuffle(rng, [geo, ari, sq]);
  const choices = opts.map(s => s.join(',\\ ')).map(t => `$${t}$`);
  return {
    tag: 'semi-log plot',
    prompt: 'Each data set gives the outputs for $x = 0, 1, 2, 3, 4$. Which one would look linear on a semi-log plot (vertical axis scaled logarithmically)?',
    parts: [{ type: 'mc', label: 'Choose one:', choices, answer: opts.indexOf(geo) }],
    solution: `A semi-log plot makes exponential data look linear. The data with a constant ratio is exponential: $${geo.join(',\\ ')}$ (each term is ${r} times the one before). The data that goes up by a constant amount would look linear on a regular graph instead.`,
    _check: { kind: 'semilog' },
  };
}

// =====================================================================
// 2. Using exponential and log inverses (2.10)
// =====================================================================
export const expLogInversePoints = {
  id: 'exp-log-inverse-points', course: 'precalc', group: GROUP, lesson: '2.10',
  title: 'Using Exponential and Log Inverses',
  blurb: 'Points on bˣ give points on log_b x with the coordinates swapped.',
  levels: {
    1: { name: 'Easy', desc: 'A point on 3ˣ gives a point on log₃ x' },
    2: { name: 'Medium', desc: 'Read log values from an exponential table' },
    3: { name: 'Challenging', desc: 'Average rate of change of log_b x from points on bˣ' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const b = pick(rng, [2, 3, 4, 5, 10]);
      if (level === 1) {
        const p = randInt(rng, -2, 4), y = F(b).pow(p);
        const q = randInt(rng, -2, 4); if (q === p) continue;
        return {
          tag: 'swap a point',
          prompt: `The point $(${p}, ${y.tex()})$ is on the graph of $f(x) = ${b}^x$.`,
          parts: [
            { type: 'point', label: `A point on the graph of $f^{-1}(x) = \\log_{${b}} x$:`, answer: [y, F(p)], placeholder: 'e.g. (9, 2)' },
            { type: 'number', label: `$\\log_{${b}}\\left(${F(b).pow(q).tex()}\\right) =$`, answer: F(q) },
          ],
          solution: `$f$ and $\\log_{${b}} x$ are inverses, so swap the coordinates: $(${y.tex()}, ${p})$ is on $\\log_{${b}} x$.<br>$\\log_{${b}}\\left(${F(b).pow(q).tex()}\\right)$ asks for the power of ${b} that gives $${F(b).pow(q).tex()}$: it is $${q}$.`,
          _check: { b, p, q },
        };
      }
      if (level === 2) {
        const bb = pick(rng, [2, 3, 5]), xs = [-1, 0, 1, 2, 3, 4], vals = xs.map(x => F(bb).pow(x));
        const [i, j] = shuffle(rng, [0, 1, 2, 3, 4, 5]).slice(0, 2);
        return {
          tag: 'table of b^x',
          prompt: `Selected values of the exponential function $h(x) = b^x$ are shown.`,
          visual: table('h', xs.map(String), vals.map(fT)),
          parts: [
            { type: 'number', label: `$\\log_b\\left(${vals[i].tex()}\\right) =$`, answer: F(xs[i]) },
            { type: 'number', label: `$h^{-1}\\left(${vals[j].tex()}\\right) =$`, answer: F(xs[j]) },
          ],
          solution: `$h^{-1}(x) = \\log_b x$ undoes $h$: find the output in the table and read the input.<br>$h(${xs[i]}) = ${vals[i].tex()}$, so $\\log_b\\left(${vals[i].tex()}\\right) = ${xs[i]}$. $h(${xs[j]}) = ${vals[j].tex()}$, so $h^{-1}\\left(${vals[j].tex()}\\right) = ${xs[j]}$.`,
          _check: { bb, i, j },
        };
      }
      // h(x) = b^x through (k i1, c^i1) and (k i2, c^i2) where b = c^(1/k)
      const c = pick(rng, [2, 3, 5]), k = pick(rng, [1, 2, 3]), i1 = randInt(rng, 1, 2), i2 = i1 + randInt(rng, 1, 2);
      const x1 = k * i1, x2 = k * i2, y1 = Math.pow(c, i1), y2 = Math.pow(c, i2);
      const aroc = F(x2 - x1, y2 - y1);
      return {
        tag: 'average rate of change of log',
        prompt: `The exponential function $h(x) = b^x$ contains the points $(${x1}, ${y1})$ and $(${x2}, ${y2})$. Find the average rate of change of $y = \\log_b x$ over the interval $[${y1}, ${y2}]$.`,
        parts: [{ type: 'number', label: 'Average rate of change:', answer: aroc }],
        solution: `$y = \\log_b x$ is the inverse of $h$, so swap the coordinates: $(${y1}, ${x1})$ and $(${y2}, ${x2})$ are on $\\log_b x$.<br>Average rate of change $= \\dfrac{${x2} - ${x1}}{${y2} - ${y1}} = ${aroc.tex()}$. (You never need the value of $b$.)`,
        _check: { x1, x2, y1, y2 },
      };
    }
    throw new Error('exp-log-inverse-points: could not build');
  },
};

// =====================================================================
// 3. Behavior of logarithmic functions (2.11)
// =====================================================================
export const logBehavior = {
  id: 'log-behavior', course: 'precalc', group: GROUP, lesson: '2.11',
  title: 'Behavior of Logarithmic Functions',
  blurb: 'Limits at the edge of the domain and at the far end, increasing or decreasing, and concavity.',
  levels: {
    1: { name: 'Easy', desc: 'Positive coefficient, base greater than 1, like 2log₃ x' },
    2: { name: 'Medium', desc: 'Vertical reflections (−4log₆ x or base below 1) and horizontal reflections (log(−x))' },
    3: { name: 'Challenging', desc: 'Horizontal shifts like log(x − 3): write the limit statements yourself' },
  },
  generate(level, rng) {
    // f(x) = a·log_b(s(x − h)) + k, where s = -1 is a horizontal reflection (over the y-axis or the line x = h)
    let a, b, s = 1, h = 0;
    if (level === 1) { a = F(pick(rng, [1, 2, 3, 4, 5])); b = F(pick(rng, [2, 3, 4, 5, 6, 10])); }
    else {
      a = pick(rng, [F(1), F(2), F(3), F(-1), F(-2), F(-3), F(-4), F(1, 2), F(-1, 2)]);
      b = pick(rng, [F(2), F(3), F(6), F(10), F(1, 2), F(1, 3)]);
      s = rng() < 0.45 ? -1 : 1;
      if (level === 2 && s === 1 && a.sign() > 0 && b.value() > 1) a = a.neg();      // Medium always has a reflection
      if (level === 3) h = nonzero(rng, -6, 6);
    }
    const k = level === 3 ? randInt(rng, -5, 5) : 0;
    const A = a.sign() * (b.value() > 1 ? 1 : -1);          // sign of a·log_b u as u grows
    const inc = A * s > 0, concaveDown = A > 0;              // a horizontal reflection flips direction but not concavity
    const edgeVal = A > 0 ? -1 : 1, farVal = A > 0 ? 1 : -1; // limits as u -> 0+ and u -> infinity
    const name = pick(rng, ['f', 'g', 'h', 'r']);
    const hT = Math.abs(h);
    const inside = h === 0 ? (s > 0 ? 'x' : '-x') : s > 0 ? `x ${h > 0 ? '-' : '+'} ${hT}` : `${h} - x`;
    const fx = `${name}(x) = ${coef(a)}${logHead(b)}\\left(${inside}\\right)${k ? ` ${k > 0 ? '+' : '-'} ${Math.abs(k)}` : ''}`;
    const edgeT = `${h}^{${s > 0 ? '+' : '-'}}`, farT = s > 0 ? '\\infty' : '-\\infty';
    const infTex = v => (v > 0 ? '$\\infty$' : '$-\\infty$');
    const choices = ['Increasing and concave up', 'Increasing and concave down', 'Decreasing and concave up', 'Decreasing and concave down'];
    const answer = (inc ? 0 : 2) + (concaveDown ? 1 : 0);
    const parts = [];
    if (level < 3) {
      parts.push({ type: 'custom', label: `$\\displaystyle\\lim_{x \\to ${edgeT}} ${name}(x) =$`, check: infChecker(edgeVal), keys: ['∞', '-∞'], placeholder: 'e.g. -∞', answerTex: infTex(edgeVal) });
      parts.push({ type: 'custom', label: `$\\displaystyle\\lim_{x \\to ${farT}} ${name}(x) =$`, check: infChecker(farVal), keys: ['∞', '-∞'], placeholder: 'e.g. ∞', answerTex: infTex(farVal) });
    } else {
      // students write each limit statement: where x goes (with the side), and what the function does
      parts.push({ type: 'custom', label: 'Near the edge of the domain, $x$ approaches:', check: approachChecker(h, s), keys: ['+', '-', '∞'], placeholder: 'e.g. 3+', answerTex: `$${edgeT}$`, help: 'Type the number and the side: 3+ means from the right, 3- means from the left.' });
      parts.push({ type: 'custom', label: `and $${name}(x)$ approaches:`, check: infChecker(edgeVal), keys: ['∞', '-∞'], placeholder: 'e.g. -∞', answerTex: infTex(edgeVal) });
      parts.push({ type: 'custom', label: 'At the other end of the domain, $x$ approaches:', check: infChecker(s), keys: ['∞', '-∞'], placeholder: 'e.g. ∞', answerTex: `$${farT}$` });
      parts.push({ type: 'custom', label: `and $${name}(x)$ approaches:`, check: infChecker(farVal), keys: ['∞', '-∞'], placeholder: 'e.g. ∞', answerTex: infTex(farVal) });
    }
    parts.push({ type: 'mc', label: `$${name}$ is:`, choices, answer });
    const domain = s > 0 ? `x > ${h}` : `x < ${h}`;
    const steps = [];
    steps.push(`Domain: the input of the log must be positive, $${inside} > 0$, so $${domain}$. The graph only exists ${s > 0 ? 'to the right' : 'to the left'} of $x = ${h}$, so $x$ can only approach ${h} from the ${s > 0 ? 'right' : 'left'}${level === 3 ? ` (written $x \\to ${edgeT}$)` : ''}, and the other end is $x \\to ${farT}$.`);
    steps.push(`$${logHead(b)} u$ ${b.value() > 1 ? 'increases (base greater than 1)' : 'decreases (base between 0 and 1)'}. ${a.sign() < 0 ? `The negative coefficient $${a.tex()}$ reflects it vertically. ` : ''}Together, as the input of the log shrinks toward 0 the output goes to ${edgeVal > 0 ? '$\\infty$' : '$-\\infty$'}, and as it grows the output goes to ${farVal > 0 ? '$\\infty$' : '$-\\infty$'}.`);
    steps.push(`So $\\displaystyle\\lim_{x \\to ${edgeT}} ${name}(x) = ${edgeVal > 0 ? '\\infty' : '-\\infty'}$ and $\\displaystyle\\lim_{x \\to ${farT}} ${name}(x) = ${farVal > 0 ? '\\infty' : '-\\infty'}$.${k ? ` (The ${k > 0 ? '+' : '-'} ${Math.abs(k)} only shifts the graph up or down.)` : ''}`);
    steps.push(`${s < 0 ? 'The horizontal reflection (the $-x$ inside) flips the direction left to right but does not change which way the graph bends. ' : ''}Reading left to right the graph is ${inc ? 'increasing' : 'decreasing'}, and it is concave ${concaveDown ? 'down' : 'up'}${concaveDown ? '' : ''}: ${choices[answer].toLowerCase()}.`);
    return {
      tag: [a.sign() < 0 || b.value() < 1 ? 'vertical reflection' : '', s < 0 ? 'horizontal reflection' : '', h ? 'horizontal shift' : ''].filter(Boolean).join(', ') || 'no reflection',
      prompt: level < 3 ? `Let $${fx}$. Complete each limit, then describe the function.` : `Let $${fx}$. Write the limit statement at each end of the domain, then describe the function.`,
      parts, solution: steps.join('<br>'),
      _check: { a: a.value(), b: b.value(), s, h, k, inc, concaveDown, edgeVal, farVal },
    };
  },
};
// where x approaches near the edge: like 3+ (from the right) or -2- (from the left)
function approachChecker(h, s) {
  return str => {
    const t = String(str).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/⁺/g, '+').replace(/⁻/g, '-').replace(/\^/g, '').replace(/fromtheright|right/gi, '+').replace(/fromtheleft|left/gi, '-');
    if (!t) return { ok: false, msg: 'Enter where x approaches, like 3+.', format: true };
    if (/∞|inf/i.test(t)) return { ok: false };
    const m = t.match(/^(-?\d+(?:\.\d+)?)([+-])$/);
    if (!m) {
      if (/^-?\d+(?:\.\d+)?$/.test(t)) return { ok: false, msg: 'Include the side: a + after the number means from the right, a − means from the left (like 3+ or 3-).', format: true };
      return { ok: false, msg: 'Type the number and the side, like 3+ or -2-.', format: true };
    }
    const num = +m[1], side = m[2] === '+' ? 1 : -1;
    if (num === h && side !== s) return { ok: false, msg: `The domain is on the ${s > 0 ? 'right' : 'left'} side of ${h}, so x can only come from the ${s > 0 ? 'right' : 'left'}.` };
    return { ok: num === h && side === s };
  };
}
function infChecker(sign) {
  return str => {
    const s = String(str).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/infinity|inf/gi, '∞');
    if (!s) return { ok: false, msg: 'Enter ∞ or -∞.', format: true };
    if (s === '∞' || s === '+∞') return { ok: sign > 0 };
    if (s === '-∞') return { ok: sign < 0 };
    return { ok: false, msg: 'These limits are ∞ or -∞. Use the buttons.', format: true };
  };
}

// =====================================================================
// 4. Missing input in a log table (2.11)
// =====================================================================
export const logTableK = {
  id: 'log-table-k', course: 'precalc', group: GROUP, lesson: '2.11',
  title: 'Finding the Missing Input in a Log Table',
  blurb: 'Outputs that go up by equal steps mean the inputs keep multiplying. Use that to find k.',
  levels: {
    1: { name: 'Easy', desc: 'k is in the middle of the table' },
    2: { name: 'Medium', desc: 'k is first or last, and outputs can decrease' },
    3: { name: 'Challenging', desc: 'Shifted inputs and powers of e' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const n = 5, d = level === 1 ? randInt(rng, 1, 5) : nonzero(rng, -10, 10), c = randInt(rng, -10, 10);
      const ys = Array.from({ length: n }, (_, i) => c + i * d);
      const miss = level === 1 ? randInt(rng, 1, 3) : pick(rng, [0, 4, 1, 3]);
      let xs, xsT, kVal, kTex, why;
      const style = level === 3 ? pick(rng, ['shift', 'e']) : 'plain';
      if (style === 'e') {
        const p = randInt(rng, -3, 1), q = pick(rng, [1, 2, 3]);
        const ex = Array.from({ length: n }, (_, i) => p + i * q);
        xsT = ex.map(e => `e^{${e}}`); kVal = Math.exp(ex[miss]); kTex = `e^{${ex[miss]}}`;
        why = `The outputs go up by ${d} each step, so the inputs are multiplied by the same amount each step. Here each input is $e^{${q}}$ times the one before (the exponents go up by ${q}), so $k = e^{${ex[miss]}}$.`;
      } else {
        const x0 = pick(rng, [1, 2, 3, 4]), m = pick(rng, level === 1 ? [2, 3] : [2, 3, 4, 5]), s = style === 'shift' ? nonzero(rng, -3, 4) : 0;
        xs = Array.from({ length: n }, (_, i) => s + x0 * Math.pow(m, i));
        if (Math.max(...xs) > 3000 || Math.min(...xs) <= 0) continue;
        xsT = xs.map(String); kVal = xs[miss]; kTex = String(xs[miss]);
        why = s === 0
          ? `The outputs change by ${d} each step, so the inputs are multiplied by the same factor each step. The known inputs show the factor is ${m}, so $k = ${kTex}$.`
          : `The outputs change by ${d} each step. The inputs are not multiplying, but subtracting ${s > 0 ? s : `(${s})`} from each makes them multiply by ${m}: ${xs.map(x => x - s).join(', ')}. So the missing value is $${xs[miss] - s} + ${s > 0 ? s : `(${s})`} = ${kTex}$.`;
      }
      const shown = xsT.map((x, i) => (i === miss ? 'k' : x));
      const name = pick(rng, ['f', 'g', 'h', 'l']);
      return {
        tag: style === 'e' ? 'powers of e' : style === 'shift' ? 'shifted inputs' : 'multiplying inputs',
        prompt: `Selected values of a logarithmic function $${name}$ are shown. Find the value of $k$.`,
        visual: table(name, shown, ys.map(String)),
        parts: [{ type: 'custom', label: '$k =$', check: valueChecker(kVal), preview: previewL, keys: ['e^', '(', ')'], placeholder: style === 'e' ? 'e.g. e^4' : 'e.g. 4', answerTex: `$${kTex}$` }],
        solution: why,
        _check: { kVal, ys, xsT, miss },
      };
    }
    throw new Error('log-table-k: could not build');
  },
};

// =====================================================================
// 5. Domain of logarithmic functions (2.11)
// =====================================================================
export const logDomain = {
  id: 'log-domain', course: 'precalc', group: GROUP, lesson: '2.11',
  title: 'Domain and Range of Logarithmic Functions',
  blurb: 'The input of a log must be positive. The range is always all real numbers.',
  levels: {
    1: { name: 'Easy', desc: 'Like 2log₃ x or log₂(x − 3)' },
    2: { name: 'Medium', desc: 'Like 8log(2x + 3)' },
    3: { name: 'Challenging', desc: 'Fractions and negatives inside, like −2log_{1/3}(½x − 3)' },
  },
  generate(level, rng) {
    let c, d;
    if (level === 1) { c = F(1); d = F(randInt(rng, -8, 8)); }
    else if (level === 2) { c = F(pick(rng, [2, 3, 4, 5])); d = F(nonzero(rng, -9, 9)); }
    else { c = pick(rng, [F(1, 2), F(1, 3), F(-1), F(-2), F(-1, 2), F(3, 2)]); d = F(nonzero(rng, -8, 8)); }
    const a = level === 1 ? F(pick(rng, [1, 2, 3, 5])) : pick(rng, [F(1), F(-5), F(8), F(-2), F(3)]);
    const b = level === 3 ? pick(rng, [2, 10, F(1, 3), F(1, 2), 'e']) : pick(rng, [2, 3, 5, 10]);
    const k = level === 1 ? 0 : randInt(rng, -6, 6);
    const edge = d.neg().div(c);
    const I = c.sign() > 0 ? { lo: edge.value(), hi: Infinity, lc: false, rc: false } : { lo: -Infinity, hi: edge.value(), lc: false, rc: false };
    const inner = `${c.eq(1) ? '' : c.eq(-1) ? '-' : c.isInt() ? c.n : `\\tfrac{${Math.abs(c.n)}}{${c.d}}`.replace(/^/, c.n < 0 ? '-' : '')}x${d.isZero() ? '' : ` ${d.sign() < 0 ? '-' : '+'} ${d.abs().tex()}`}`;
    const name = pick(rng, ['f', 'g', 'h', 'r']);
    const fx = `${name}(x) = ${coef(a)}${logHead(b)}\\left(${inner}\\right)${k ? ` ${k > 0 ? '+' : '-'} ${Math.abs(k)}` : ''}`;
    const domTex = intervalTex(I, { lo: edge.tex(), hi: edge.tex() });
    const rangeChoices = shuffle(rng, ['All real numbers', '$(0, \\infty)$', `$${domTex}$`, `$[${k}, \\infty)$`]);
    return {
      tag: level === 1 ? 'simple' : level === 2 ? 'coefficient inside' : (c.sign() < 0 ? 'negative inside' : 'fraction inside'),
      prompt: `Find the domain and range of $${fx}$.`,
      parts: [
        { type: 'custom', label: 'Domain:', check: intervalChecker([I]), keys: ['(', ')', '∞', '-', '/'], placeholder: 'e.g. (3, ∞)', answerTex: `$${domTex}$`, help: 'Use interval notation like (3, ∞), or an inequality like x > 3.' },
        { type: 'mc', label: 'Range:', choices: rangeChoices, answer: rangeChoices.indexOf('All real numbers') },
      ],
      solution: `The input of a log must be positive: $${inner} > 0$${c.eq(1) ? '' : `, so ${c.sign() < 0 ? `dividing by $${c.tex()}$ flips the inequality: ` : ''}$x ${c.sign() > 0 ? '>' : '<'} ${edge.tex()}$`}. Domain: $${domTex}$.<br>`
        + 'Every log function takes on every real output (it goes to $\\pm\\infty$ at its two ends), and stretches, reflections and shifts do not change that. Range: all real numbers.',
      _check: { c: c.value(), d: d.value(), edge: edge.value(), I },
    };
  },
};

// =====================================================================
// 6. Condensing logarithms (2.12)  and  7. Expanding logarithms (2.12)
// =====================================================================
const VARS = ['x', 'y', 'z', 'w'];
const ENVS = [{ x: 2.3, y: 1.7, z: 3.9, w: 0.6, a: 1.4 }, { x: 0.8, y: 5.2, z: 1.3, w: 2.2, a: 3.1 }, { x: 7.1, y: 0.45, z: 2.6, w: 1.9, a: 0.7 }];
const sameAll = (tree, truth, envs = ENVS) => envs.every(env => { let g; try { g = evalL(tree, env); } catch { return false; } const w = truth(env); return isFinite(g) && Math.abs(g - w) < 1e-9 * Math.max(1, Math.abs(w)); });

export const logCondense = {
  id: 'log-condense', course: 'precalc', group: GROUP, lesson: '2.12',
  title: 'Condensing Logarithms',
  blurb: 'Use the product, quotient and power properties to write a single logarithm.',
  levels: {
    1: { name: 'Easy', desc: 'Two logs added or subtracted, like log₄ x + log₄ y' },
    2: { name: 'Medium', desc: 'Coefficients become powers, like 3log₂ x − log₂ y' },
    3: { name: 'Challenging', desc: 'Several terms and constants, like 2log₇ a − 5log₇ b + log₇ 4 or 2 + log₆ x' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const b = pick(rng, [2, 3, 4, 5, 6, 7, 10]);
      const nTerms = level === 1 ? 2 : level === 2 ? 2 : randInt(rng, 3, 4);
      const vars = shuffle(rng, VARS).slice(0, nTerms);
      const terms = vars.map((v, i) => ({ c: level === 1 ? (i === 0 ? 1 : pick(rng, [1, -1])) : pick(rng, level === 2 ? [1, 2, 3, -1, -2] : [1, 2, 3, -1, -2, -3, 0.5]), arg: v }));
      if (level > 1 && terms.every(tm => Math.abs(tm.c) === 1)) continue;
      let numTerm = null, constant = 0;
      if (level >= 2 && rng() < 0.4) numTerm = { c: pick(rng, [1, -1]), n: pick(rng, [3, 4, 5, 6, 7].filter(n => n !== b)) };
      if (level === 3 && rng() < 0.5) constant = pick(rng, [1, 2, -1]);
      const truth = env => terms.reduce((s, tm) => s + tm.c * Math.log(env[tm.arg]), 0) / Math.log(b) + (numTerm ? numTerm.c * Math.log(numTerm.n) / Math.log(b) : 0) + constant;
      const L = logHead(b);
      const termTex = (c, inner, first) => { const cc = Math.abs(c) === 1 ? '' : c === 0.5 || c === -0.5 ? '\\tfrac{1}{2}' : String(Math.abs(c)); return `${first ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + '}${cc}${L} ${inner}`; };
      let expr = constant ? String(constant) : '';
      const all = [...terms.map(tm => ({ c: tm.c, inner: tm.arg })), ...(numTerm ? [{ c: numTerm.c, inner: String(numTerm.n) }] : [])];
      const order = shuffle(rng, all);
      order.forEach((tm, i) => { expr += termTex(tm.c, tm.inner, i === 0 && !constant); });
      // answer tex
      const pw = (base, c) => (Math.abs(c) === 1 ? base : Math.abs(c) === 0.5 ? `\\sqrt{${base}}` : `${base}^{${Math.abs(c)}}`);
      const top = [], bot = [];
      // numbers multiply into one coefficient on top and one on the bottom
      let nTop = constant > 0 ? Math.pow(b, constant) : 1, nBot = constant < 0 ? Math.pow(b, -constant) : 1;
      if (numTerm) { if (numTerm.c > 0) nTop *= numTerm.n; else nBot *= numTerm.n; }
      if (nTop !== 1) top.push(String(nTop)); if (nBot !== 1) bot.push(String(nBot));
      for (const tm of terms) (tm.c > 0 ? top : bot).push(pw(tm.arg, tm.c));
      const topT = top.length ? top.join('') : '1';
      const ansInner = bot.length ? `\\dfrac{${topT}}{${bot.join('')}}` : topT;
      const check = str => {
        let tree;
        try { tree = parseL(String(str).includes('=') ? String(str).slice(String(str).lastIndexOf('=') + 1) : str); } catch { return { ok: false, msg: `Could not read that. Example: log_${b}(x^2/y)`, format: true }; }
        for (const v of varsL(tree)) if (!all.some(tm => tm.inner === v)) return { ok: false, msg: `Use only the letters in the problem.`, format: true };
        if (!sameAll(tree, truth)) return { ok: false };
        const top0 = stripL(tree);
        if (top0.fn !== 'log' || logsIn(tree).length !== 1) return { ok: false, msg: 'That is equal, but write it as a single logarithm with nothing outside it.' };
        return { ok: true };
      };
      return {
        tag: level === 1 ? 'two terms' : level === 2 ? 'coefficients' : 'several terms' + (constant ? ', constant' : ''),
        prompt: `Write as a single logarithm: $\\;${expr}$`,
        parts: [{ type: 'custom', label: 'Single logarithm:', check, preview: previewL, keys: ['log_', '(', ')', '^', '/', '√'], placeholder: `e.g. log_${b}(x^2/y)`, answerTex: `$${L}\\left(${ansInner}\\right)$`, help: `Type logs like log_${b}(x^2/y). For a square root, use sqrt( ) or the ^(1/2) power.` }],
        solution: [
          'Power property first: a coefficient becomes an exponent, $c\\log_b M = \\log_b M^c$.',
          constant ? `A plain number is a log too: $${constant} = ${L}\\left(${b}^{${constant}}\\right) = ${L}\\left(${Math.pow(b, constant)}\\right)$.` : '',
          'Then added logs multiply their insides, and subtracted logs divide.',
          `Result: $${L}\\left(${ansInner}\\right)$.`,
        ].filter(Boolean).join('<br>'),
        _check: { b, all, constant },
      };
    }
    throw new Error('log-condense: could not build');
  },
};

export const logExpand = {
  id: 'log-expand', course: 'precalc', group: GROUP, lesson: '2.12',
  title: 'Expanding Logarithms',
  blurb: 'Write one logarithm as a sum and difference of simpler logarithms.',
  levels: {
    1: { name: 'Easy', desc: 'Products and quotients, like log₃(5x/y)' },
    2: { name: 'Medium', desc: 'Powers and numbers, like log₃(x²/y) or log(xy/1000)' },
    3: { name: 'Challenging', desc: 'Roots of fractions, like log₂√(16x³/y²), and factoring, like log₃(9x − 27)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const b = pick(rng, [2, 3, 5, 10]);
      const L = logHead(b);
      if (level === 3 && rng() < 0.35) {
        // log_b(b^k x - b^k c) = k + log_b(x - c)
        const k = pick(rng, [1, 2]), cc = nonzero(rng, -5, 6), m = Math.pow(b, k);
        if (m > 100) continue;
        const truth = env => k + Math.log(env.x - cc) / Math.log(b);
        const inner = `${m}x ${m * cc > 0 ? '-' : '+'} ${Math.abs(m * cc)}`;
        const check = expandChecker(truth, b, { allowLinear: true, envs: [1.3, 2.7, 6.1].map(dx => ({ x: cc + dx })) });
        return {
          tag: 'factor first',
          prompt: `Write as a sum or difference of logarithms: $\\;${L}\\left(${inner}\\right)$`,
          parts: [{ type: 'custom', label: 'Expanded:', check: env0 => check(env0), preview: previewL, keys: ['log_', '(', ')', '/'], placeholder: `e.g. 2 + log_${b}(x - 3)`, answerTex: `$${k} + ${L}\\left(x ${cc > 0 ? '-' : '+'} ${Math.abs(cc)}\\right)$` }],
          solution: `Factor first: $${inner} = ${m}\\left(x ${cc > 0 ? '-' : '+'} ${Math.abs(cc)}\\right)$. Then the product property gives $${L} ${m} + ${L}\\left(x ${cc > 0 ? '-' : '+'} ${Math.abs(cc)}\\right)$, and $${L} ${m} = ${k}$.`,
          _check: { b, kind: 'factor', k, cc },
        };
      }
      // factors: variables with powers, a number, maybe a root of everything
      const nv = level === 1 ? 2 : 3;
      const vars = shuffle(rng, ['x', 'y', 'z']).slice(0, nv);
      const pows = vars.map(() => (level === 1 ? 1 : pick(rng, [1, 1, 2, 3])));
      const place = vars.map(() => (rng() < 0.6 ? 1 : -1)); place[0] = 1;
      let num = null;
      if (level >= 2 && rng() < 0.6) num = { k: pick(rng, [1, 2, 3, 4]), up: rng() < 0.5 };          // b^k as a number
      else if (level === 1 && rng() < 0.5) num = { raw: pick(rng, [5, 7, 6].filter(n => n !== b)), up: true };
      const root = level === 3;
      const half = root ? 0.5 : 1;
      if (num && num.k && Math.pow(b, num.k) > 1000) continue;
      const truth = env => half * (vars.reduce((s, v, i) => s + place[i] * pows[i] * Math.log(env[v]), 0) / Math.log(b)
        + (num ? (num.up ? 1 : -1) * (num.k ? num.k : Math.log(num.raw) / Math.log(b)) : 0));
      const piece = (v, p) => (p === 1 ? v : `${v}^{${p}}`);
      const top = [], bot = [];
      if (num) (num.up ? top : bot).push(num.k ? String(Math.pow(b, num.k)) : String(num.raw));
      vars.forEach((v, i) => (place[i] > 0 ? top : bot).push(piece(v, pows[i])));
      const insideT = bot.length ? `\\dfrac{${top.join('')}}{${bot.join('')}}` : top.join('');
      const given = root ? `${L}\\sqrt{${insideT}}` : `${L}\\left(${insideT}\\right)`;
      // answer tex
      const terms = [];
      const cT = c => { const v = c * half; return v === 1 ? '' : v === 0.5 ? '\\tfrac{1}{2}' : Number.isInteger(v) ? String(v) : `\\tfrac{${v * 2}}{2}`; };
      if (num) terms.push({ s: num.up ? 1 : -1, t: num.k ? (root ? F(num.k, 2).tex() : String(num.k)) : `${cT(1)}${L} ${num.raw}` });
      vars.forEach((v, i) => terms.push({ s: place[i], t: `${cT(pows[i])}${L} ${v}` }));
      const ans = terms.map((tm, i) => `${i === 0 ? (tm.s < 0 ? '-' : '') : tm.s < 0 ? ' - ' : ' + '}${tm.t}`).join('');
      const check = expandChecker(truth, b, {});
      return {
        tag: level === 1 ? 'products and quotients' : level === 2 ? 'powers and numbers' : 'root of a fraction',
        prompt: `Expand: $\\;${given}$`,
        parts: [{ type: 'custom', label: 'Expanded:', check, preview: previewL, keys: ['log_', '(', ')', '/'], placeholder: `e.g. 2log_${b}(x) - log_${b}(y)`, answerTex: `$${ans}$`, help: `Type logs like log_${b}(x). Evaluate logs of numbers when you can, like log_${b}(${Math.pow(b, 2)}) = 2.` }],
        solution: [
          root ? `A square root is the power $\\tfrac{1}{2}$, which multiplies every term at the end.` : '',
          'Quotient property: the top becomes added logs and the bottom becomes subtracted logs. Product property: each factor gets its own log.',
          'Power property: each exponent comes out in front.',
          num && num.k ? `$${L} ${Math.pow(b, num.k)} = ${num.k}$ because $${b}^{${num.k}} = ${Math.pow(b, num.k)}$.` : '',
          `Result: $${ans}$.`,
        ].filter(Boolean).join('<br>'),
        _check: { b, vars, pows, place, num, root },
      };
    }
    throw new Error('log-expand: could not build');
  },
};

// fully expanded: each log's argument is a single variable, a number that is not a power of the base,
// or (for factoring problems) x plus or minus a number
function expandChecker(truth, b, { allowLinear = false, envs = ENVS }) {
  return str => {
    let tree;
    try { tree = parseL(String(str).includes('=') ? String(str).slice(String(str).lastIndexOf('=') + 1) : str); } catch { return { ok: false, msg: `Could not read that. Example: 2log_${b}(x) - log_${b}(y)`, format: true }; }
    if (!sameAll(tree, truth, envs)) return { ok: false };
    for (const lg of logsIn(tree)) {
      const arg = stripL(lg.arg);
      const base = lg.base ? evalL(lg.base) : 10;
      if (arg.v !== undefined) continue;
      if (arg.num !== undefined) {
        const k = Math.log(+arg.num) / Math.log(base);
        if (Math.abs(k - Math.round(k)) < 1e-9) return { ok: false, msg: `That is equal, but evaluate logs of numbers like ${arg.num} (it is a power of the base).` };
        continue;
      }
      if (allowLinear && (arg.op === '+' || arg.op === '-') && stripL(arg.a).v === 'x' && stripL(arg.b).num !== undefined) continue;
      return { ok: false, msg: 'That is equal, but expand completely: each log should have just one variable (or number) inside, with no powers, products, quotients or roots.' };
    }
    return { ok: true };
  };
}

// =====================================================================
// 8. Log transformations as translations and dilations (2.12)
// =====================================================================
export const logTransformK = {
  id: 'log-transform-k', course: 'precalc', group: GROUP, lesson: '2.12',
  title: 'Log Transformations as Translations and Dilations',
  blurb: 'Rewrite a horizontal dilation of a log as a vertical shift, or one log base as a multiple of another.',
  levels: {
    1: { name: 'Easy', desc: 'Whole-number answers, like log₂(8x) = log₂ x + k' },
    2: { name: 'Medium', desc: 'Answers like k = log 6' },
    3: { name: 'Challenging', desc: 'Change of base: log₄ x = k · log₉ x' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      if (level < 3 || rng() < 0.25) {
        const b = pick(rng, level === 1 ? [2, 3, 5, 10] : [2, 3, 10, 10]);
        let c, div = level > 1 && rng() < 0.3;
        if (level === 1) c = Math.pow(b, randInt(rng, 1, b === 10 ? 3 : 3)); else { c = pick(rng, [5, 6, 7, 12, 15, 20]); if (Math.abs(Math.log(c) / Math.log(b) - Math.round(Math.log(c) / Math.log(b))) < 1e-9) continue; }
        const L = logHead(b);
        const k = (div ? -1 : 1) * Math.log(c) / Math.log(b);
        const kTex = Number.isInteger(+k.toFixed(9)) ? String(Math.round(k)) : `${div ? '-' : ''}${L} ${c}`;
        return {
          tag: div ? 'quotient as a shift' : level === 1 ? 'product as a shift, whole number' : 'product as a shift',
          prompt: `The function $f(x) = ${L}\\left(${div ? `\\dfrac{x}{${c}}` : `${c}x`}\\right)$ is a horizontal dilation of $g(x) = ${L} x$. It can also be written as a vertical translation, $f(x) = g(x) + k$. Find $k$.`,
          parts: [{ type: 'custom', label: '$k =$', check: valueChecker(k), preview: previewL, keys: LOG_KEYS, placeholder: 'e.g. log(6)', answerTex: `$${kTex}$` }],
          solution: `${div ? 'Quotient' : 'Product'} property: $${L}\\left(${div ? `\\dfrac{x}{${c}}` : `${c}x`}\\right) = ${L} x ${div ? '-' : '+'} ${L} ${c}$. So $f(x) = g(x) ${div ? '-' : '+'} ${L} ${c}$ and $k = ${kTex}$${Number.isInteger(+k.toFixed(9)) ? '' : ` \\approx ${k.toFixed(3)}`}.`,
          _check: { k },
        };
      }
      // log_a x = k log_c x, k = log_a c = ln c / ln a
      const [a, c] = pick(rng, [[4, 9], [2, 8], [4, 16], [3, 9], [9, 3], [8, 2], [2, 5], [5, 2], [4, 6], [10, 2]]);
      const k = Math.log(c) / Math.log(a);
      const nice = Math.abs(k * 6 - Math.round(k * 6)) < 1e-9;
      const kTex = nice ? F(Math.round(k * 6), 6).tex() : `\\log_{${a}} ${c}`;
      return {
        tag: 'change of base',
        prompt: `Let $f(x) = \\log_{${a}} x$ and $g(x) = \\log_{${c}} x$. Show that $f$ is a vertical dilation of $g$ by finding $k$ so that $f(x) = k\\cdot g(x)$.`,
        parts: [{ type: 'custom', label: '$k =$', check: valueChecker(k), preview: previewL, keys: LOG_KEYS, placeholder: 'e.g. log_4(9)', answerTex: `$${kTex}$${nice ? '' : ` (or $\\dfrac{\\ln ${c}}{\\ln ${a}} \\approx ${k.toFixed(3)}$)`}` }],
        solution: `Change of base: $\\log_{${a}} x = \\dfrac{\\log_{${c}} x}{\\log_{${c}} ${a}}$, so $k = \\dfrac{1}{\\log_{${c}} ${a}} = \\log_{${a}} ${c} = \\dfrac{\\ln ${c}}{\\ln ${a}}${nice ? ` = ${kTex}` : ` \\approx ${k.toFixed(3)}`}$.`,
        _check: { k, a, c },
      };
    }
    throw new Error('log-transform-k: could not build');
  },
};
