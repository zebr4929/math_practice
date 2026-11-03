// AP Precalculus 2.5: exponential context and data modeling.
//  1. Data from a vertically shifted exponential: find k, then write y = ab^x + k.
//  2. Percent growth/decay word problems where the units change (years to months, hours to minutes, ...).
import { F, randInt, pick, nonzero, parse, evaluate, toTex, shuffle } from '../../math.js?v=2.8';
import { rewriteChecker, rewritePreview } from './exp-models.js?v=2.8';

const GROUP = 'Unit 2 - Sequences and Exponentials';

// ---------- 3-decimal answers (AP style: rounded or truncated to 3 places) ----------
export function decimalChecker(target) {
  return str => {
    const s = String(str).replace(/[−–]/g, '-').replace(/,/g, '').trim();
    if (!s) return { ok: false, msg: 'Enter a number.', format: true };
    let v;
    try { const t = parse(s); v = evaluate(t, {}); } catch { return { ok: false, msg: 'Enter a number, like 67.863.', format: true }; }
    if (!isFinite(v)) return { ok: false, msg: 'Enter a number, like 67.863.', format: true };
    const err = Math.abs(v - target);
    if (err < 0.001 + 1e-11 * Math.abs(target)) return { ok: true };
    if (err < 0.02 && /\.\d{0,2}$|^[^.]*$/.test(s)) return { ok: false, msg: 'Close. Give your answer to 3 decimal places.', format: true };
    return { ok: false };
  };
}
const dec3 = x => (Math.round(x * 1000) / 1000).toFixed(3);

// =====================================================================
// 1. Vertically shifted exponential data
// =====================================================================
export const expShifted = {
  id: 'exp-shifted',
  course: 'precalc',
  group: GROUP,
  lesson: '2.5',
  title: 'Exponential Data with a Vertical Shift',
  blurb: 'Find the constant k that reveals a constant ratio, then write f(x) = ab^x + k.',
  levels: {
    1: { name: 'Easy', desc: 'x starts at 0, growth with a whole-number base' },
    2: { name: 'Medium', desc: 'Growth or decay, a can be negative' },
    3: { name: 'Challenging', desc: 'x does not start at 0, fractional bases like 2/3 or 3/2' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildShifted(level, rng); if (p) return p; }
    throw new Error('exp-shifted: could not build');
  },
};

function buildShifted(level, rng) {
  const b = level === 1 ? F(pick(rng, [2, 3, 4])) : level === 2 ? pick(rng, [F(2), F(3), F(1, 2), F(1, 3), F(4)])
    : pick(rng, [F(2), F(3), F(1, 2), F(1, 3), F(2, 3), F(3, 2), F(1, 4)]);
  const x0 = level === 3 ? randInt(rng, 1, 3) : 0;
  const xs = [0, 1, 2, 3, 4].map(i => x0 + i);
  const xmax = xs[4];
  // a·b^x is a whole number for every x in the table
  let a = F(randInt(rng, 1, level === 1 ? 6 : 5) * Math.pow(b.d, xmax));
  if (level === 1 && b.d === 1) a = F(randInt(rng, 1, 7));
  if (level > 1 && rng() < 0.35) a = a.neg();
  const k = F(nonzero(rng, -12, 12));
  const vals = xs.map(x => a.mul(b.pow(x)).add(k));
  if (vals.some(v => !v.isInt() || Math.abs(v.n) > 2000)) return null;
  if (Math.abs(a.value()) > 600) return null;
  if (level === 1 && vals.some(v => v.n < -40)) return null;
  const name = pick(rng, ['f', 'g', 'h', 'p']);
  const visual = `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr>`
    + `<tr><th>$${name}(x)$</th>${vals.map(v => `<td>$${v.tex()}$</td>`).join('')}</tr></table>`;
  const diffs = [0, 1, 2, 3].map(i => vals[i + 1].sub(vals[i]));
  const ab0 = a.mul(b.pow(x0));                            // a·b^{x0} = f(x0) - k
  const shifted = vals.map(v => v.sub(k));
  const truth = x => a.value() * Math.pow(b.value(), x) + k.value();
  const coef = c => (c.eq(1) ? '' : c.eq(-1) ? '-' : c.tex());
  const model = `${coef(a)}\\left(${b.tex()}\\right)^{x} ${k.sign() < 0 ? '-' : '+'} ${k.abs().tex()}`;
  const steps = [
    `The outputs do not have a constant ratio, so look at the differences: $${diffs.map(d => d.tex()).join(',\\ ')}$. Each difference is $${b.tex()}$ times the one before, so $b = ${b.tex()}$.`,
    `For $f(x) = ab^x + k$, the first difference is $ab^{${x0}}(b - 1)$. So $ab^{${x0}} = \\dfrac{${diffs[0].tex()}}{${b.tex()} - 1} = ${ab0.tex()}$.`,
    `Then $k = ${name}(${x0}) - ab^{${x0}} = ${vals[0].tex()} - ${ab0.sign() < 0 ? `(${ab0.tex()})` : ab0.tex()} = ${k.tex()}$.`,
    `Check: subtracting $${k.tex()}$ from every output gives $${shifted.map(v => v.tex()).join(',\\ ')}$, which has a constant ratio of $${b.tex()}$.`,
    x0 === 0 ? `Those values start at $a = ${a.tex()}$, so $${name}(x) = ${model}$.`
      : `Those values are $ab^x$, and at $x = ${x0}$ the value is $${ab0.tex()}$, so $a = \\dfrac{${ab0.tex()}}{\\left(${b.tex()}\\right)^{${x0}}} = ${a.tex()}$ and $${name}(x) = ${model}$. (A form like $${name}(x) = ${ab0.tex()}\\left(${b.tex()}\\right)^{x - ${x0}} ${k.sign() < 0 ? '-' : '+'} ${k.abs().tex()}$ also works.)`,
  ];
  return {
    tag: level === 1 ? 'growth, x from 0' : level === 2 ? (b.value() > 1 ? 'growth' : 'decay') + (a.sign() < 0 ? ', negative a' : '') : 'x not from 0',
    prompt: `Selected values of an exponential function $${name}(x) = ab^x + k$ are shown. Find the constant $k$ that reveals a constant ratio, then write an equation for $${name}$.`,
    visual,
    parts: [
      { type: 'number', label: '$k =$', answer: k },
      { type: 'rule', var: 'x', label: `$${name}(x) =$`, truth, placeholder: 'e.g. 6(2)^x + 1', help: 'Type the right side, like 6(2)^x + 1. Use fractions for fractional bases: (1/2)^x.', answerTex: `$${model}$` },
    ],
    solution: steps.join('<br>'),
    _check: { a: a.value(), b: b.value(), k: k.value(), x0, vals: vals.map(v => v.value()), truth },
  };
}

// =====================================================================
// 2. Percent change with a change of units
// =====================================================================
export const expUnits = {
  id: 'exp-units',
  course: 'precalc',
  group: GROUP,
  lesson: '2.5',
  title: 'Percent Growth and Decay with Changing Units',
  blurb: 'Turn a percent rate into a base, then answer questions in different time units.',
  levels: {
    1: { name: 'Easy', desc: 'The model is given; find values in two different units' },
    2: { name: 'Medium', desc: 'Write the model from a percent rate, then find values in two units' },
    3: { name: 'Challenging', desc: 'Rewrite the model in different units, then use it' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildUnits(level, rng); if (p) return p; }
    throw new Error('exp-units: could not build');
  },
};

// big: the unit the rate is given in; small: a smaller unit; per: small units in one big unit
const UNITS = [
  { big: 'year', small: 'month', per: 12, v: 'm' },
  { big: 'week', small: 'day', per: 7, v: 'd' },
  { big: 'day', small: 'hour', per: 24, v: 'h' },
  { big: 'hour', small: 'minute', per: 60, v: 'm' },
  { big: 'decade', small: 'year', per: 10, v: 'y' },
];
const STORIES = [
  { grow: true, f: 'D', what: 'deer', thing: 'the deer population', a: [50, 80, 120], u: ['year', 'decade'], intro: n => `After ${n} deer were introduced to a large wooded area, the population grew.` },
  { grow: true, f: 'B', what: 'bacteria', thing: 'the number of bacteria', a: [200, 500, 1000], u: ['hour', 'day'], intro: n => `A lab culture starts with ${n} bacteria.` },
  { grow: true, f: 'V', what: 'views', thing: 'the number of views', a: [400, 1500, 2500], u: ['day', 'week'], intro: n => `A video of the school mascot has ${n} views when it is first shared.` },
  { grow: true, f: 'F', what: 'followers', thing: 'the number of followers', a: [150, 300, 600], u: ['week'], intro: n => `A new club account starts with ${n} followers.` },
  { grow: true, f: 'P', what: 'people', thing: 'the town population', a: [5000, 12000, 20000], u: ['decade', 'year'], intro: n => `A small town has ${n} residents.` },
  { grow: false, f: 'M', what: 'milligrams of medicine', thing: 'the amount of medicine in the bloodstream', a: [200, 400, 500], u: ['hour', 'day'], intro: n => `A patient is given ${n} milligrams of a medicine.` },
  { grow: false, f: 'C', what: 'milligrams of caffeine', thing: 'the amount of caffeine in your body', a: [120, 160, 200], u: ['hour'], intro: n => `You drink a coffee with ${n} milligrams of caffeine.` },
  { grow: false, f: 'R', what: 'grams of the sample', thing: 'the mass of a radioactive sample', a: [80, 100, 250], u: ['day', 'week', 'year'], intro: n => `A lab has ${n} grams of a radioactive sample.` },
  { grow: false, f: 'L', what: 'items in the lost and found', thing: 'the number of items in the lost and found', a: [300, 450, 600], u: ['week'], intro: n => `The lost and found holds ${n} items at the start of a cleanup.` },
];

function buildUnits(level, rng) {
  const st = pick(rng, STORIES);
  const U = UNITS.find(u => u.big === pick(rng, st.u));
  if (!U) return null;
  const pct = st.grow ? pick(rng, [2, 3, 4, 5, 6, 8, 10, 12, 13, 15, 20, 25]) : pick(rng, [3, 4, 5, 8, 10, 12, 15, 20, 25, 30]);
  const a = pick(rng, st.a);
  // Challenging sometimes gives the rate per small unit and asks about the big unit
  const flip = level === 3 && rng() < 0.4;
  const rateUnit = flip ? U.small : U.big;
  const otherUnit = flip ? U.big : U.small;
  const factor = flip ? 1 / U.per : U.per;          // otherUnit counts per rateUnit
  if (flip && pct > 10) return null;                  // keep small-unit rates realistic
  const b = st.grow ? 1 + pct / 100 : 1 - pct / 100;
  const bTex = String(+b.toFixed(2));
  const f = st.f, v = flip ? (U.big === 'year' ? 'y' : U.big[0]) : U.v;
  const value = t => a * Math.pow(b, t);               // t in rate units
  const pl = (u, n) => (n === 1 ? u : u + 's');
  const fmtA = a.toLocaleString('en-US');

  // question times
  const N1 = randInt(rng, 3, 10);                       // in rate units
  let N2;                                               // in the other unit, not a whole number of rate units
  if (!flip) { do { N2 = randInt(rng, 2, 4 * U.per); } while (N2 % U.per === 0); }
  else N2 = randInt(rng, 2, 6);
  const t2 = N2 / factor;                               // N2 converted to rate units
  const ans1 = value(N1), ans2 = value(t2);
  if (ans1 > 2e5 || ans2 > 2e5) return null;

  const rateWord = st.grow ? `increases by ${pct}%` : `decreases by ${pct}%`;
  const baseLine = `${st.grow ? `Growing by ${pct}% means multiplying by $1 + ${(pct / 100).toFixed(2)} = ${bTex}$` : `Decreasing by ${pct}% means multiplying by $1 - ${(pct / 100).toFixed(2)} = ${bTex}$`} each ${rateUnit}.`;
  const conv = `${N2} ${pl(otherUnit, N2)} is $\\dfrac{${N2}}{${flip ? 1 : U.per}}${flip ? ` \\cdot ${U.per}` : ''} = ${+t2.toFixed(6)}$ ${pl(rateUnit, 2)}.`;
  const convTex = flip ? `${N2}\\cdot ${U.per}` : `\\tfrac{${N2}}{${U.per}}`;
  const parts = [], steps = [];
  let prompt;

  if (level === 1) {
    prompt = `${st.intro(fmtA)} The model $${f}(t) = ${fmtA.replace(/,/g, '{,}')}(${bTex})^{t}$ gives ${st.thing} $t$ ${pl(rateUnit, 2)} later. Round answers to 3 decimal places.`;
    parts.push({ type: 'custom', label: `${cap(st.thing)} after ${N1} ${pl(rateUnit, N1)}:`, check: decimalChecker(ans1), placeholder: 'e.g. 104.042', answerTex: dec3(ans1) });
    parts.push({ type: 'custom', label: `${cap(st.thing)} after ${N2} ${pl(otherUnit, N2)}:`, check: decimalChecker(ans2), placeholder: 'e.g. 67.863', answerTex: dec3(ans2) });
    steps.push(`$${f}(${N1}) = ${a}(${bTex})^{${N1}} \\approx ${dec3(ans1)}$.`);
    steps.push(`The model uses ${pl(rateUnit, 2)}, so convert first: ${conv} Then $${f}(${+t2.toFixed(6)}) = ${a}(${bTex})^{${+t2.toFixed(6)}} \\approx ${dec3(ans2)}$.`);
    steps.push(`Watch out: $${f}(${N2})$ would be ${N2} ${pl(rateUnit, N2)}, not ${N2} ${pl(otherUnit, N2)}.`);
  } else if (level === 2) {
    prompt = `${st.intro(fmtA)} ${cap(st.thing)} ${rateWord} each ${rateUnit}. Let $${f}(t)$ be ${st.thing} after $t$ ${pl(rateUnit, 2)}. Round answers to 3 decimal places.`;
    parts.push({ type: 'custom', label: `$${f}(t) =$`, check: expChecker('t', a, b), preview: expPreview, placeholder: `e.g. ${a}(1.05)^t`, answerTex: `$${a}(${bTex})^{t}$`, help: 'Type the right side, like 200(1.05)^t.' });
    parts.push({ type: 'custom', label: `${cap(st.thing)} after ${N1} ${pl(rateUnit, N1)}:`, check: decimalChecker(ans1), placeholder: 'e.g. 104.042', answerTex: dec3(ans1) });
    parts.push({ type: 'custom', label: `${cap(st.thing)} after ${N2} ${pl(otherUnit, N2)}:`, check: decimalChecker(ans2), placeholder: 'e.g. 67.863', answerTex: dec3(ans2) });
    steps.push(`${baseLine} The starting amount is ${fmtA}, so $${f}(t) = ${a}(${bTex})^{t}$.`);
    steps.push(`$${f}(${N1}) = ${a}(${bTex})^{${N1}} \\approx ${dec3(ans1)}$.`);
    steps.push(`The model uses ${pl(rateUnit, 2)}, so convert first: ${conv} Then $${f}(${+t2.toFixed(6)}) \\approx ${dec3(ans2)}$.`);
  } else {
    // equivalent model in the other unit: a (b^(1/per))^m  or  a (b^per)^y
    const B2 = flip ? Math.pow(b, U.per) : Math.pow(b, 1 / U.per);
    const expoTex = flip ? `${U.per}` : `\\frac{1}{${U.per}}`;
    prompt = `${st.intro(fmtA)} ${cap(st.thing)} ${rateWord} each ${rateUnit}. Round answers to 3 decimal places.`;
    parts.push({ type: 'custom', label: `Write a model $${f}(${v})$ where $${v}$ is measured in ${pl(otherUnit, 2)}. $\\;${f}(${v}) =$`, check: expChecker(v, a, B2), preview: expPreview,
      placeholder: flip ? `e.g. ${a}(1.02)^(12${v})` : `e.g. ${a}(1.13)^(${v}/12)`, answerTex: `$${a}\\left(${bTex}^{${expoTex}}\\right)^{${v}} \\approx ${a}(${B2.toFixed(3)})^{${v}}$`,
      help: `Use ${v} as the variable. An exact form like ${a}(${bTex})^(${flip ? U.per + v : v + '/' + U.per}) is best; a base rounded to 3 decimals is also accepted.` });
    parts.push({ type: 'custom', label: `${cap(st.thing)} after ${N2} ${pl(otherUnit, N2)}:`, check: decimalChecker(ans2), placeholder: 'e.g. 67.863', answerTex: dec3(ans2) });
    steps.push(`${baseLine} In ${pl(rateUnit, 2)}: $${f}(t) = ${a}(${bTex})^{t}$.`);
    steps.push(flip
      ? `One ${otherUnit} is ${U.per} ${pl(rateUnit, 2)}, so $t = ${U.per}${v}$: $${f}(${v}) = ${a}(${bTex})^{${U.per}${v}} = ${a}\\left(${bTex}^{${U.per}}\\right)^{${v}} \\approx ${a}(${B2.toFixed(3)})^{${v}}$.`
      : `One ${otherUnit} is $\\tfrac{1}{${U.per}}$ of a ${rateUnit}, so $t = \\tfrac{${v}}{${U.per}}$: $${f}(${v}) = ${a}(${bTex})^{${v}/${U.per}} = ${a}\\left(${bTex}^{1/${U.per}}\\right)^{${v}} \\approx ${a}(${B2.toFixed(3)})^{${v}}$.`);
    steps.push(`$${f}(${N2}) = ${a}(${bTex})^{${convTex}} \\approx ${dec3(ans2)}$. Use the exact form here: rounding the base first can throw the answer off in the later decimal places.`);
  }
  return {
    tag: `${level === 1 ? 'model given' : level === 2 ? 'write model' : flip ? 'rewrite model, small to big unit' : 'rewrite model, big to small unit'}, ${st.grow ? 'growth' : 'decay'}`,
    prompt, parts, solution: steps.join('<br>'),
    _check: { a, b, factor, N1, N2, t2, ans1, ans2, flip, per: U.per, v },
  };
}
const cap = s => s[0].toUpperCase() + s.slice(1);

// accepts any exponential A·B^v with A = a and B within 0.0005 of the exact base (or exact forms)
function expChecker(v, a, B) {
  return str => {
    const s = String(str).replace(/[−–]/g, '-').replace(/^\s*[a-zA-Z]\s*\(\s*[a-z]\s*\)\s*=\s*/, '').trim();
    if (!s) return { ok: false, msg: 'Enter a model.', format: true };
    let tree;
    try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Example: 200(1.05)^t', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
    for (const x of vars) if (x !== v) return { ok: false, msg: `Use ${v} as the variable.`, format: true };
    const g = x => evaluate(tree, { [v]: x });
    const A = g(0), r1 = g(1) / g(0), r2 = g(2) / g(1), r3 = g(5) / g(4);
    if (!isFinite(A) || !isFinite(r1)) return { ok: false };
    const expo = Math.abs(r1 - r2) < 1e-9 * Math.abs(r1) && Math.abs(r1 - r3) < 1e-9 * Math.abs(r1);
    if (!expo) return { ok: false };
    if (Math.abs(A - a) > 1e-6 * Math.max(1, Math.abs(a))) return { ok: false };
    if (Math.abs(r1 - B) <= 0.0005 + 1e-12) return { ok: true };
    if (Math.abs(r1 - B) < 0.006) return { ok: false, msg: 'Close. Keep the base exact, or round it to at least 3 decimal places.', format: true };
    return { ok: false };
  };
}
function expPreview(str) {
  try { const s = String(str).replace(/[−–]/g, '-').replace(/^\s*[a-zA-Z]\s*\(\s*[a-z]\s*\)\s*=\s*/, '').trim(); return s ? toTex(parse(s)) : ''; } catch { return null; }
}

// =====================================================================
// 3. y = ab^x from two points (no shifts)
// =====================================================================
export const expTwoPoints = {
  id: 'exp-two-points',
  course: 'precalc',
  group: GROUP,
  lesson: '2.5',
  title: 'Writing y = abˣ from Two Points',
  blurb: 'Use two input-output pairs to find a and b, and write the function as y = abˣ.',
  levels: {
    1: { name: 'Easy', desc: 'One point is on the y-axis, so a is given' },
    2: { name: 'Medium', desc: 'Neither point has x = 0; write the system, then the equation' },
    3: { name: 'Challenging', desc: 'Decay and fractional bases, negative x-values, or calculator data' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildTwoPoints(level, rng); if (p) return p; }
    throw new Error('exp-two-points: could not build');
  },
};

const pT = f => (f.isInt() && f.n >= 0 ? `(${f.n})` : `\\left(${f.tex()}\\right)`);
const coefT = a => (a.eq(1) ? '' : a.tex());
const shiftChecker = target => {
  const base = rewriteChecker(target);
  return str => {
    const r = base(str);
    if (!r.ok && r.msg && !r.format) return { ok: false, msg: 'That is equal, but not in the form y = ab^x yet. Find a (the value at x = 0) so the exponent is just x.' };
    return r;
  };
};

function buildTwoPoints(level, rng) {
  const name = pick(rng, ['f', 'g', 'h']);
  if (level === 3 && rng() < 0.4) return calculatorPoints(rng);
  let b, x1, x2;
  if (level === 1) { b = F(randInt(rng, 2, 5)); x1 = 0; x2 = randInt(rng, 1, 3); }
  else if (level === 2) { b = F(randInt(rng, 2, 5)); x1 = randInt(rng, 1, 3); x2 = x1 + randInt(rng, 1, 3); }
  else {
    b = pick(rng, [F(1, 2), F(1, 3), F(2, 3), F(3, 2), F(1, 4), F(2), F(3)]);
    x1 = randInt(rng, -2, 2); x2 = x1 + randInt(rng, 2, 3);
    if (b.d === 1 && x1 >= 0) return null;                 // whole bases only with a negative x here
  }
  // a chosen so both outputs are whole numbers
  const lowest = Math.min(x1, x2, 0), highest = Math.max(x1, x2, 0);
  let a = F(randInt(rng, 1, level === 1 ? 9 : 6));
  a = a.mul(F(b.d).pow(highest)).mul(F(b.n).pow(-lowest > 0 ? -lowest : 0));
  const y = x => a.mul(b.pow(x));
  const y1 = y(x1), y2 = y(x2);
  if (!y1.isInt() || !y2.isInt() || Math.max(y1.n, y2.n) > 5000 || a.value() > 3000) return null;
  const gap = x2 - x1, ratio = y2.div(y1);
  const ansTex = `y = ${coefT(a)}${pT(b)}^{x}`;
  const target = x => a.value() * Math.pow(b.value(), x);
  const asTable = level === 2 && rng() < 0.4;
  const given = asTable
    ? `Selected values of the exponential function $${name}(x) = ab^x$ are shown in the table.`
    : `The graph of an exponential function $${name}(x) = ab^x$ passes through the points $(${x1}, ${y1.tex()})$ and $(${x2}, ${y2.tex()})$.`;
  const visual = asTable ? `<table class="seq-table"><tr><th>$x$</th><th>${x1}</th><th>${x2}</th></tr><tr><th>$${name}(x)$</th><td>${y1.tex()}</td><td>${y2.tex()}</td></tr></table>` : '';
  const parts = [];
  const eqs = (Y1, X1, Y2, X2) => `$${Y1} = ab^{${X1}}$ and $${Y2} = ab^{${X2}}$`;
  if (level === 2) {
    const right = eqs(y1.tex(), x1, y2.tex(), x2);
    const wrongs = [
      `$${x1} = ab^{${y1.tex()}}$ and $${x2} = ab^{${y2.tex()}}$`,
      `$${y1.tex()} = a^{${x1}}b$ and $${y2.tex()} = a^{${x2}}b$`,
      `$${y1.tex()} = (ab)^{${x1}}$ and $${y2.tex()} = (ab)^{${x2}}$`,
    ];
    const choices = shuffle(rng, [right, ...wrongs]);
    parts.push({ type: 'mc', label: 'Which system can be used to find $a$ and $b$?', choices, answer: choices.indexOf(right) });
  }
  parts.push({ type: 'custom', label: `$${name}(x) =$`, check: shiftChecker(target), preview: rewritePreview, keys: ['(', ')', '^', '/'], placeholder: 'e.g. 3(2)^x', answerTex: `$${ansTex.slice(4)}$`, help: 'Type the right side in the form ab^x, like 3(2)^x or 2916(1/3)^x.' });
  const steps = [];
  if (x1 === 0) {
    steps.push(`At $x = 0$, $b^0 = 1$, so $${name}(0) = a$: $a = ${y1.tex()}$.`);
    steps.push(`Then $${y2.tex()} = ${y1.tex()}\\cdot b^{${x2}}$, so $b^{${x2}} = ${ratio.tex()}$ and $b = ${b.tex()}$.`);
  } else {
    steps.push(`Each point gives an equation: ${eqs(y1.tex(), x1, y2.tex(), x2)}.`);
    steps.push(`Divide the second by the first, and $a$ cancels: $b^{${x2}${x1 < 0 ? ` + ${-x1}` : ` - ${x1}`}} = b^{${gap}} = \\dfrac{${y2.tex()}}{${y1.tex()}} = ${ratio.tex()}$, so $b = ${b.tex()}$${gap % 2 === 0 ? ' (b must be positive)' : ''}.`);
    steps.push(`Substitute back: $${y1.tex()} = a\\cdot ${pT(b)}^{${x1}} = a\\cdot ${b.pow(x1).tex()}$, so $a = ${a.tex()}$.`);
  }
  steps.push(`So $${name}(x) = ${coefT(a)}${pT(b)}^{x}$. (A form like $${y1.tex()}${pT(b)}^{x ${x1 < 0 ? '+' : '-'} ${Math.abs(x1)}}$ gives the same values, but it is not in $y = ab^x$ form.)`);
  if (x1 === 0) steps.pop(), steps.push(`So $${name}(x) = ${coefT(a)}${pT(b)}^{x}$.`);
  return {
    tag: level === 1 ? 'point on the y-axis' : level === 2 ? (asTable ? 'two points, table' : 'two points') : (b.value() < 1 ? 'decay or fractional base' : 'negative x-values'),
    prompt: `${given} Write the equation of $${name}$ in the form $y = ab^x$.`,
    visual, parts, solution: steps.join('<br>'),
    _check: { a: a.value(), b: b.value(), x1, x2, y1: y1.value(), y2: y2.value(), target },
  };
}

// AP-style data like F(2) = 47 and F(20) = 2602: a and b to 3 decimal places
const STADIUM = [
  { f: 'F', lead: 'For the first 30 minutes after the doors open, the number of fans inside a large stadium $t$ minutes after the doors open', xs: [[2, 20], [3, 15], [5, 25]], a: [8, 12, 25], b: [1.18, 1.22, 1.25] },
  { f: 'B', lead: 'The number of bacteria in a culture $t$ hours after the start of an experiment', xs: [[1, 6], [2, 8], [3, 10]], a: [150, 300, 400], b: [1.3, 1.45, 1.6] },
  { f: 'V', lead: 'The value, in dollars, of a used car $t$ years after it was bought', xs: [[2, 7], [1, 5], [3, 8]], a: [24000, 30000, 18000], b: [0.82, 0.86, 0.88] },
  { f: 'M', lead: 'The amount of medicine, in milligrams, in a patient\'s bloodstream $t$ hours after a dose', xs: [[1, 4], [2, 6], [1, 5]], a: [500, 650, 800], b: [0.7, 0.75, 0.8] },
];
function calculatorPoints(rng) {
  const st = pick(rng, STADIUM);
  const [x1, x2] = pick(rng, st.xs);
  const a0 = pick(rng, st.a) * (0.9 + 0.2 * rng()), b0 = pick(rng, st.b) + (rng() - 0.5) * 0.04;
  const y1 = Math.round(a0 * Math.pow(b0, x1)), y2 = Math.round(a0 * Math.pow(b0, x2));
  if (y1 === y2 || y1 <= 0 || y2 <= 0) return null;
  const b = Math.pow(y2 / y1, 1 / (x2 - x1)), a = y1 / Math.pow(b, x1);
  const bR = Math.round(b * 1000) / 1000;
  const aAlt = y1 / Math.pow(bR, x1);                       // what a student gets after rounding b first
  const aCheck = str => { const r1 = decimalChecker(a)(str); if (r1.ok || r1.format) return r1; const r2 = decimalChecker(aAlt)(str); return r2.ok ? r2 : r1; };
  const fmt = v => v.toLocaleString('en-US');
  return {
    tag: 'calculator data',
    prompt: `${st.lead} can be modeled by $${st.f}(t) = ab^t$. You know that $${st.f}(${x1}) = ${fmt(y1).replace(/,/g, '{,}')}$ and $${st.f}(${x2}) = ${fmt(y2).replace(/,/g, '{,}')}$. Find $a$ and $b$, rounded to 3 decimal places.`,
    parts: [
      { type: 'custom', label: '$b =$', check: decimalChecker(b), placeholder: 'e.g. 1.213', answerTex: (+b.toFixed(3)).toFixed(3) },
      { type: 'custom', label: '$a =$', check: aCheck, placeholder: 'e.g. 31.928', answerTex: (+a.toFixed(3)).toFixed(3), help: 'Use the unrounded value of b if you can.' },
    ],
    solution: `Write the system: $${y1} = ab^{${x1}}$ and $${y2} = ab^{${x2}}$.<br>`
      + `Divide: $b^{${x2 - x1}} = \\dfrac{${y2}}{${y1}}$, so $b = \\left(\\dfrac{${y2}}{${y1}}\\right)^{1/${x2 - x1}} \\approx ${b.toFixed(3)}$.<br>`
      + `Then $a = \\dfrac{${y1}}{b^{${x1}}} \\approx ${a.toFixed(3)}$. Keep $b$ unrounded in your calculator for this step (rounding $b$ first gives about ${aAlt.toFixed(3)}, which is also accepted).`,
    _check: { a, b, aAlt, x1, x2, y1, y2 },
  };
}
