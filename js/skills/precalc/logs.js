// AP Precalculus 2.9: logarithmic expressions.
//  1. Converting between exponential and logarithmic form.
//  2. Evaluating logarithms without a calculator.
//  3. Plotting points on a graph with a logarithmic (base 10) vertical axis.
import { F, randInt, pick, shuffle } from '../../math.js?v=2.3';
import { logValue } from '../../graph.js?v=2.3';

const GROUP = 'Unit 2 - Logarithms';

// log tex for a base: 10 -> \log, e -> \ln, otherwise \log_{b}
const logT = (base, arg) => (base === '10' ? `\\log ${arg}` : base === 'e' ? `\\ln ${arg}` : `\\log_{${base}} ${arg}`);
const powT = (base, ex) => `${/^[a-z0-9]$|^\d+$/.test(base) ? base : `\\left(${base}\\right)`}^{${ex}}`;

// =====================================================================
// 1. Exponential <-> logarithmic form
// =====================================================================
export const logConvert = {
  id: 'log-convert',
  course: 'precalc',
  group: GROUP,
  lesson: '2.9',
  title: 'Exponential and Logarithmic Form',
  blurb: 'Rewrite b^c = a as log_b a = c, and back again.',
  levels: {
    1: { name: 'Easy', desc: 'Exponential to log form with numbers, like 3² = 9' },
    2: { name: 'Medium', desc: 'Log to exponential form, including log, ln and variables' },
    3: { name: 'Challenging', desc: 'Both directions with variables, negative and fractional exponents' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildConvert(level, rng); if (p) return p; }
    throw new Error('log-convert: could not build');
  },
};

// a statement b^c = a, with tex pieces (strings)
function statement(level, rng) {
  if (level === 1) {
    const b = pick(rng, [2, 3, 4, 5, 6, 7, 10]), c = randInt(rng, b >= 7 ? 1 : 2, b === 2 ? 6 : b <= 4 ? 4 : 3);
    return { b: String(b), c: String(c), a: String(Math.pow(b, c)) };
  }
  const kind = pick(rng, level === 2 ? ['num', 'var1', 'var2', 'common', 'natural', 'num'] : ['var2', 'varAll', 'neg', 'frac', 'natural2', 'common2']);
  switch (kind) {
    case 'num': { const b = pick(rng, [2, 3, 5, 7, 11]), c = randInt(rng, 2, 3); return { b: String(b), c: String(c), a: String(Math.pow(b, c)) }; }
    case 'var1': return { b: String(pick(rng, [3, 5, 7, 9])), c: String(randInt(rng, 2, 4)), a: 'x' };          // log_7 x = 2
    case 'var2': return { b: String(pick(rng, [2, 3, 4, 6])), c: 'x', a: pick(rng, ['y', '20', '50']) };      // x = log_3 y
    case 'common': return { b: '10', c: String(randInt(rng, 2, 4)), a: pick(rng, ['y', 'x']) };              // log y = 2
    case 'natural': return { b: 'e', c: String(randInt(rng, 2, 6)), a: pick(rng, ['c', 'x', 'y']) };         // ln c = 4
    case 'varAll': return { b: pick(rng, ['r', 'b']), c: 't', a: String(randInt(rng, 2, 9)) };               // r^t = 2
    case 'neg': { const b = pick(rng, [2, 3, 4, 5]), c = randInt(rng, 1, 3); return { b: String(b), c: `-${c}`, a: `\\frac{1}{${Math.pow(b, c)}}` }; }
    case 'frac': { const [b, c, a] = pick(rng, [[4, '\\frac{1}{2}', '2'], [8, '\\frac{1}{3}', '2'], [8, '\\frac{2}{3}', '4'], [9, '\\frac{3}{2}', '27'], [27, '\\frac{2}{3}', '9'], [16, '\\frac{3}{4}', '8'], [25, '\\frac{1}{2}', '5']]); return { b: String(b), c, a }; }
    case 'natural2': return { b: 'e', c: `${randInt(rng, 2, 5)}x`, a: 'y' };                                  // y = e^{3x}
    case 'common2': return { b: '10', c: 'x', a: 'y' };                                                         // 10^x = y
  }
}

function buildConvert(level, rng) {
  const S = statement(level, rng);
  if (S.b === S.c || S.b === S.a || S.a === S.c) return null;
  const toLog = level === 1 || (level === 3 && rng() < 0.5);
  const expTex = (b, c, a) => `${powT(b, c)} = ${a}`;
  const logTex = (b, a, c) => `${logT(b, a)} = ${c}`;
  // distractors swap the three roles
  let right, wrongs, given;
  if (toLog) {
    given = rng() < 0.3 && !/frac/.test(S.a) ? `${S.a} = ${powT(S.b, S.c)}` : expTex(S.b, S.c, S.a);
    right = logTex(S.b, S.a, S.c);
    wrongs = [logTex(S.b, S.c, S.a), logTex(S.c, S.a, S.b), logTex(S.a, S.b, S.c), logTex(S.a, S.c, S.b)];
  } else {
    given = rng() < 0.3 ? `${S.c} = ${logT(S.b, S.a)}` : logTex(S.b, S.a, S.c);
    right = expTex(S.b, S.c, S.a);
    wrongs = [expTex(S.b, S.a, S.c), expTex(S.c, S.b, S.a), expTex(S.a, S.c, S.b), expTex(S.c, S.a, S.b)];
  }
  // a base like \frac{1}{8} or a variable exponent cannot sit in a log base in a sensible distractor; keep only well-formed ones
  wrongs = [...new Set(wrongs.filter(w => w !== right && !/\\log_\{-|\\log_\{\\frac|\\log_\{x\}|\\left\(-/.test(w)))];
  if (wrongs.length < 3) return null;
  const opts = shuffle(rng, [right, ...shuffle(rng, wrongs).slice(0, 3)]);
  const baseName = S.b === '10' ? ' (a common log)' : S.b === 'e' ? ' (a natural log)' : '';
  const steps = [
    `The two forms say the same thing: $b^{c} = a$ means $\\log_b a = c$. The base stays the base, and ${toLog ? 'the exponent becomes the value of the log' : 'the value of the log becomes the exponent'}.`,
    `Here the base is $${S.b}$${baseName}, the exponent is $${S.c}$, and the result is $${S.a}$.`
      + (S.b === '10' ? ' A log with no base written is base 10.' : S.b === 'e' ? ' $\\ln$ means $\\log_e$.' : ''),
    `So $${given}$ becomes $${right}$.`,
  ];
  return {
    tag: toLog ? 'exponential to log' : 'log to exponential',
    prompt: `Rewrite in ${toLog ? 'logarithmic' : 'exponential'} form: $\\;${given}$`,
    parts: [{ type: 'mc', label: 'Choose one:', choices: opts.map(o => `$${o}$`), answer: opts.indexOf(right) }],
    solution: steps.join('<br>'),
    _check: { S, toLog },
  };
}

// =====================================================================
// 2. Evaluating logarithms
// =====================================================================
export const logEval = {
  id: 'log-evaluate',
  course: 'precalc',
  group: GROUP,
  lesson: '2.9',
  title: 'Evaluating Logarithms',
  blurb: 'Ask "what power of the base gives this number?" without a calculator.',
  levels: {
    1: { name: 'Easy', desc: 'Whole-number answers, like log₂ 8 or log 100' },
    2: { name: 'Medium', desc: 'Zero and negative answers, like log₃ 1 or log₆ (1/36)' },
    3: { name: 'Challenging', desc: 'Fractional answers, like log₁₆ 4 or log₉ 27' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const items = [one(level, rng), one(level, rng)];
      if (items.some(x => !x) || items[0].tex === items[1].tex) continue;
      return {
        tag: level === 1 ? 'whole-number answers' : level === 2 ? 'zero or negative answers' : 'fractional answers',
        prompt: 'Evaluate without a calculator.',
        parts: items.map(it => ({ type: 'number', label: `$${it.tex} =$`, answer: it.ans })),
        solution: items.map(it => it.why).join('<br>'),
        _check: { items: items.map(it => [it.tex, it.ans.value(), it.check]) },
      };
    }
    throw new Error('log-evaluate: could not build');
  },
};

// argument c^q written for a base c^p; the answer is q/p
function powerTex(c, q) {
  // c is a whole number or 'e'; q is a Frac
  if (c === 'e') {
    if (q.isInt()) return q.n === 1 ? 'e' : q.n > 0 ? `e^{${q.n}}` : `\\frac{1}{${q.n === -1 ? 'e' : `e^{${-q.n}}`}}`;
    if (q.d === 2 && q.n === 1) return '\\sqrt{e}';
    return null;
  }
  if (q.isInt()) return q.n >= 0 ? String(Math.pow(c, q.n)) : `\\frac{1}{${Math.pow(c, -q.n)}}`;
  if (q.d === 2 && q.n === 1) return `\\sqrt{${c}}`;
  return null;
}

function one(level, rng) {
  if (level === 1) {
    const b = pick(rng, [2, 3, 4, 5, 6, 10, 10, 'e']);
    const n = b === 'e' ? randInt(rng, 2, 5) : randInt(rng, 1, b === 2 ? 6 : b <= 5 ? 4 : 3);
    const arg = powerTex(b, F(n));
    return { tex: b === 10 ? `\\log ${arg}` : b === 'e' ? `\\ln ${arg}` : `\\log_{${b}} ${arg}`, ans: F(n), check: [b, n], why: why(b, arg, F(n)) };
  }
  if (level === 2) {
    const b = pick(rng, [2, 3, 4, 5, 6, 7, 10, 10, 'e']);
    const n = rng() < 0.25 ? 0 : -randInt(rng, 1, b === 2 ? 5 : b === 10 ? 4 : 3);
    let arg = powerTex(b, F(n));
    if (b === 10 && n < 0 && rng() < 0.5) arg = String(+Math.pow(10, n).toFixed(6));       // log 0.01
    if (n === 0) arg = '1';
    return { tex: b === 10 ? `\\log ${arg}` : b === 'e' ? `\\ln ${arg}` : `\\log_{${b}} ${arg}`, ans: F(n), check: [b, n], why: why(b, arg, F(n)) };
  }
  // fractional: base c^p, argument c^q with q/p not whole, or base 1/c
  if (rng() < 0.15) {
    const c = pick(rng, [2, 3]), q = randInt(rng, 2, c === 2 ? 5 : 3);
    const arg = String(Math.pow(c, q));
    return { tex: `\\log_{\\frac{1}{${c}}} ${arg}`, ans: F(-q), check: ['1/' + c, -q], why: `$\\left(\\tfrac{1}{${c}}\\right)^{-${q}} = ${c}^{${q}} = ${arg}$, so the answer is $-${q}$.` };
  }
  if (rng() < 0.15) {
    const which = pick(rng, [['\\ln \\sqrt{e}', F(1, 2), '$\\sqrt{e} = e^{1/2}$'], ['\\log \\sqrt{10}', F(1, 2), '$\\sqrt{10} = 10^{1/2}$'], ['\\ln \\frac{1}{e^{2}}', F(-2), '$\\frac{1}{e^2} = e^{-2}$']]);
    return { tex: which[0], ans: which[1], check: [which[0]], why: `${which[2]}, so $${which[0]} = ${which[1].tex()}$.` };
  }
  const c = pick(rng, [2, 3, 5]);
  const p = randInt(rng, 2, c === 2 ? 4 : 3);
  const q = pick(rng, [1, 2, 3, -1, -2, -3, 5].filter(v => v % p !== 0 && Math.abs(v) <= (c === 2 ? 5 : 3)));
  const base = Math.pow(c, p);
  if (base > 30) return null;
  const arg = powerTex(c, F(q));
  if (!arg) return null;
  const ans = F(q, p);
  return {
    tex: `\\log_{${base}} ${arg}`, ans, check: [base, q, p],
    why: `Write both as powers of $${c}$: $${base} = ${c}^{${p}}$ and $${arg} = ${c}^{${q}}$. You need $\\left(${c}^{${p}}\\right)^{y} = ${c}^{${q}}$, so $${p}y = ${q}$ and $\\log_{${base}} ${arg} = ${ans.tex()}$.`,
  };
}
function why(b, arg, n) {
  const bT = b === 10 ? '10' : b === 'e' ? 'e' : String(b);
  const name = b === 10 ? `\\log ${arg}` : b === 'e' ? `\\ln ${arg}` : `\\log_{${b}} ${arg}`;
  const lead = b === 10 ? 'With no base written, the base is 10. ' : b === 'e' ? '$\\ln$ is base $e$. ' : '';
  const extra = n.n < 0 ? ` (A negative exponent means a reciprocal: $${bT}^{${n.n}} = \\frac{1}{${b === 'e' ? `e^{${-n.n}}` : Math.pow(b, -n.n)}}$.)` : n.n === 0 ? ` (Any base to the power 0 is 1.)` : '';
  return `${lead}Ask what power of $${bT}$ gives $${arg}$: $${bT}^{${n.n}} = ${arg}$, so $${name} = ${n.n}$.${extra}`;
}

// =====================================================================
// 3. Plotting on a log-scaled vertical axis
// =====================================================================
export const logPlot = {
  id: 'log-plot',
  course: 'precalc',
  group: GROUP,
  lesson: '2.9',
  title: 'Plotting on a Logarithmic Scale',
  blurb: 'Plot points on a graph whose vertical axis is scaled by powers of 10.',
  levels: {
    1: { name: 'Easy', desc: 'Values on the gridlines, like 300 or 20, whole-number x' },
    2: { name: 'Medium', desc: 'Four decades, including values less than 1, like 0.5' },
    3: { name: 'Challenging', desc: 'Values between gridlines, like 150 or 35, and x at half units' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildLogPlot(level, rng); if (p) return p; }
    throw new Error('log-plot: could not build');
  },
};

const HALF = [1.5, 2.5, 3.5, 4.5];
function buildLogPlot(level, rng) {
  const emin = level === 2 ? -1 : 0, emax = level === 2 ? 3 : 3;
  const xmax = level === 3 ? 6 : 6, xsnap = level === 3 ? 0.5 : 1;
  const mantissas = level === 3 ? [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const n = level === 1 ? 3 : level === 2 ? 4 : 5;
  const xs = shuffle(rng, Array.from({ length: Math.round(xmax / xsnap) + 1 }, (_, i) => +(i * xsnap).toFixed(2))).slice(0, n);
  const pts = xs.map(x => {
    let m = pick(rng, level === 3 && rng() < 0.6 ? HALF : [2, 3, 4, 5, 6, 7, 8, 9, 1]);
    const e = randInt(rng, emin, emax - 1);
    return { x, y: logValue(m, e), m, e };
  }).sort((a, b) => a.x - b.x);
  if (level === 3 && pts.filter(p => HALF.includes(p.m)).length < 2) return null;
  if (new Set(pts.map(p => p.e)).size < 2) return null;
  const fmtY = y => y.toLocaleString('en-US');
  const correct = pts.map(p => ({ x: p.x, y: p.y }));
  const steps = [
    'On a log scale each labeled line is 10 times the one below it, and the space between them is the same. Inside each band the gridlines are 2, 3, 4, ... 9 times the bottom line, and they get closer together as you go up.',
    ...pts.map(p => {
      const lo = logValue(1, p.e), hi = logValue(1, p.e + 1);
      const frac = Math.log10(p.m);
      const where = Number.isInteger(p.m)
        ? (p.m === 1 ? `the labeled line ${fmtY(lo)}` : `the ${ordinal(p.m)} gridline above ${fmtY(lo)}, which is the line for ${fmtY(p.y)}`)
        : `between the gridlines for ${fmtY(logValue(Math.floor(p.m), p.e))} and ${fmtY(logValue(Math.ceil(p.m), p.e))}, a little past the middle of that gap (on a log scale, ${fmtY(p.y)} is not halfway between them; it sits about ${Math.round(frac * 100)}% of the way from ${fmtY(lo)} to ${fmtY(hi)})`;
      return `$(${p.x}, ${fmtY(p.y).replace(/,/g, '{,}')})$: go to $x = ${p.x}$, then up to ${where}.`;
    }),
  ];
  return {
    tag: level === 1 ? 'gridline values' : level === 2 ? 'values below 1' : 'between gridlines',
    prompt: `Plot the points on the grid, where the vertical axis is scaled logarithmically (base 10):<br>$${pts.map(p => `(${p.x},\\ ${fmtY(p.y).replace(/,/g, '{,}')})`).join(',\\quad ')}$`,
    parts: [{
      type: 'graph', label: `Click to plot the ${n} points`, logScale: { xmin: 0, xmax, xsnap, emin, emax, mantissas }, correct,
      answerTex: 'the points marked on the grid',
      help: level === 3 ? 'Points snap to every half unit of x. Up and down, they snap to the gridlines and to 1.5, 2.5, 3.5 and 4.5 times each power of 10 (like 150 or 35).' : 'Points snap to the gridlines.',
      check: P => {
        if (P.length !== n) return { ok: false, format: true, msg: `Plot exactly ${n} points. You have ${P.length}.` };
        const want = new Set(correct.map(p => `${p.x},${p.y}`));
        return { ok: P.every(p => want.has(`${p.x},${p.y}`)) };
      },
    }],
    solution: steps.join('<br>'),
    _check: { pts, emin, emax, xsnap, mantissas },
  };
}
const ordinal = m => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'][m - 2];   // m = 2 is the first gridline above
