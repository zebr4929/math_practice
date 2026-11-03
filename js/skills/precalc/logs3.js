// AP Precalculus 2.13 and 2.15: exponential and log equations, inverses and inequalities; semi-log plots.
import { F, randInt, pick, nonzero, shuffle, gcd } from '../../math.js?v=2.8';
import { parseL, evalL, varsL, previewL, valueChecker, listChecker, intervalChecker, LOG_KEYS } from './logexpr.js?v=2.8';
import { logHead } from './logs2.js?v=2.8';

const GROUP = 'Unit 2 - Log Equations and Semi-Log Plots';
const d3 = v => (Math.round(v * 1000) / 1000).toFixed(3);
const exact = v => Math.abs(v - Math.round(v)) < 1e-9;
const sgn = (v, first = false) => (v < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ');
const numPart = v => `${sgn(v)}${Math.abs(v)}`;
const coefT = c => (c === 1 ? '' : c === -1 ? '-' : String(c));
const VALUE_HELP = 'Exact answers like log_4(9) or 2 - e^5 are best; decimals rounded to 3 places also count.';
const valuePart = (label, v, tex, ph = 'e.g. log_4(9)') => ({ type: 'custom', label, check: valueChecker(v), preview: previewL, keys: LOG_KEYS, placeholder: ph, answerTex: `$${tex}$${exact(v) ? '' : ` $\\approx ${d3(v)}$`}`, help: VALUE_HELP });

// =====================================================================
// 9. Solving exponential equations
// =====================================================================
export const expEquations = {
  id: 'exp-equations', course: 'precalc', group: GROUP, lesson: '2.13',
  title: 'Solving Exponential Equations',
  blurb: 'Isolate the exponential, then rewrite in log form, or use common bases.',
  levels: {
    1: { name: 'Easy', desc: 'Isolate, then convert, like 4ˣ − 2 = 7' },
    2: { name: 'Medium', desc: 'Shifted exponents and e, like 2ˣ⁺³ + 5 = 26 or −7 = 3 − 4eˣ' },
    3: { name: 'Challenging', desc: 'Common bases, like 8³ˣ⁻² = 2ˣ⁺⁵, and unlike bases, like 3ˣ⁻¹ = 5³ˣ⁺²' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildExpEq(level, rng); if (p) return p; }
    throw new Error('exp-equations: could not build');
  },
};

function buildExpEq(level, rng) {
  const steps = [];
  if (level === 1 || (level === 2 && rng() < 0.5)) {
    const b = pick(rng, [2, 3, 4, 5, 6]), a = level === 1 ? pick(rng, [1, 1, 2, 3]) : pick(rng, [2, 3, 5]);
    const q = randInt(rng, 2, 40); if (exact(Math.log(q) / Math.log(b))) return null;
    const h = level === 2 ? nonzero(rng, -4, 4) : 0, c = nonzero(rng, -12, 12), dd = a * q + c;
    const expT = `${b}^{${h ? `x ${h > 0 ? '+' : '-'} ${Math.abs(h)}` : 'x'}}`;
    const x = Math.log(q) / Math.log(b) - h;
    steps.push(`Isolate the exponential: ${c ? `${c > 0 ? 'subtract' : 'add'} ${Math.abs(c)}${a > 1 ? `, then divide by ${a}` : ''}` : `divide by ${a}`}: $${expT} = ${q}$.`);
    steps.push(`Rewrite in log form: $${h ? `x ${h > 0 ? '+' : '-'} ${Math.abs(h)}` : 'x'} = \\log_{${b}} ${q}$${h ? `, so $x = \\log_{${b}} ${q} ${h > 0 ? '-' : '+'} ${Math.abs(h)}$` : ''}. That is about $${d3(x)}$.`);
    return { tag: h ? 'shifted exponent' : 'isolate and convert', prompt: `Solve: $\\;${coefT(a)}${expT}${numPart(c)} = ${dd}$`, parts: [valuePart('$x =$', x, `\\log_{${b}} ${q}${h ? ` ${h > 0 ? '-' : '+'} ${Math.abs(h)}` : ''}`)], solution: steps.join('<br>'), _check: { x, res: X => a * Math.pow(b, X + h) + c - dd } };
  }
  if (level === 2) {
    // c - a e^x = d  ->  e^x = (c - d)/a
    const a = pick(rng, [2, 3, 4, 5]), c = randInt(rng, -6, 10), q = F(randInt(rng, 2, 30), a);
    if (q.eq(1)) return null;
    const dd = F(c).sub(q.mul(a));
    if (!dd.isInt()) return null;
    const x = Math.log(q.value());
    const flip = rng() < 0.5;
    const eq = flip ? `${dd.n} = ${c} - ${a}e^{x}` : `${c} - ${a}e^{x} = ${dd.n}`;
    steps.push(`Isolate $e^x$: $-${a}e^x = ${dd.n} - ${c} = ${dd.sub(c).n}$, so $e^x = ${q.tex()}$.`);
    steps.push(`Take the natural log: $x = \\ln\\left(${q.tex()}\\right) \\approx ${d3(x)}$.`);
    return { tag: 'base e', prompt: `Solve: $\\;${eq}$`, parts: [valuePart('$x =$', x, `\\ln\\left(${q.tex()}\\right)`, 'e.g. ln(5/2)')], solution: steps.join('<br>'), _check: { x, res: X => c - a * Math.exp(X) - dd.n } };
  }
  if (rng() < 0.6) {
    // common base: (g^m1)^(p1 x + q1) = (g^m2)^(p2 x + q2)
    const g = pick(rng, [2, 3]);
    const m1 = pick(rng, [1, 2, 3, -1]), m2 = pick(rng, [1, 2, 3]);
    if (m1 === m2) return null;
    const p1 = randInt(rng, 1, 5), q1 = randInt(rng, -6, 6), p2 = randInt(rng, 1, 4), q2 = randInt(rng, -6, 6);
    const den = m1 * p1 - m2 * p2; if (den === 0) return null;
    const x = F(m2 * q2 - m1 * q1, den);
    const B = m => (m > 0 ? String(Math.pow(g, m)) : `\\left(\\tfrac{1}{${Math.pow(g, -m)}}\\right)`);
    const lin = (p, q) => `${p === 1 ? '' : p}x${q ? ` ${q > 0 ? '+' : '-'} ${Math.abs(q)}` : ''}`;
    if (Math.pow(g, Math.abs(m1)) > 30 || Math.pow(g, m2) > 30) return null;
    steps.push(`Write both sides as powers of ${g}: $${B(m1)} = ${g}^{${m1}}$ and $${B(m2)} = ${g}^{${m2}}$.`);
    steps.push(`Then $${g}^{${m1}(${lin(p1, q1)})} = ${g}^{${m2}(${lin(p2, q2)})}$, so the exponents are equal: $${m1}(${lin(p1, q1)}) = ${m2}(${lin(p2, q2)})$.`);
    steps.push(`$${m1 * p1}x ${numPart(m1 * q1).trim()} = ${m2 * p2}x ${numPart(m2 * q2).trim()}$, so $x = ${x.tex()}$.`);
    return { tag: 'common bases', prompt: `Solve: $\\;${B(m1)}^{${lin(p1, q1)}} = ${B(m2)}^{${lin(p2, q2)}}$`, parts: [valuePart('$x =$', x.value(), x.tex(), 'e.g. 3/2')], solution: steps.join('<br>'), _check: { x: x.value(), res: X => Math.log(g) * (m1 * (p1 * X + q1) - m2 * (p2 * X + q2)) } };
  }
  // unlike bases: b1^(x + q1) = b2^(p2 x + q2)
  const [b1, b2] = shuffle(rng, [2, 3, 5, 7]).slice(0, 2);
  const q1 = nonzero(rng, -3, 3), p2 = randInt(rng, 1, 3), q2 = randInt(rng, -3, 3);
  const l1 = Math.log(b1), l2 = Math.log(b2);
  const x = (q2 * l2 - q1 * l1) / (l1 - p2 * l2);
  if (!isFinite(x)) return null;
  const lin = (p, q) => `${p === 1 ? '' : p}x${q ? ` ${q > 0 ? '+' : '-'} ${Math.abs(q)}` : ''}`;
  // tidy tex: combine terms like 3ln 2 - 2ln 3 with proper signs
  const lnTerms = ts => { const parts = ts.filter(t => t.c !== 0); if (!parts.length) return '0'; return parts.map((t, i) => `${i === 0 ? (t.c < 0 ? '-' : '') : t.c < 0 ? ' - ' : ' + '}${Math.abs(t.c) === 1 ? '' : Math.abs(t.c)}\\ln ${t.b}`).join(''); };
  const numT = lnTerms([{ c: q2, b: b2 }, { c: -q1, b: b1 }]), denT = lnTerms([{ c: 1, b: b1 }, { c: -p2, b: b2 }]);
  steps.push(`The bases cannot be matched, so take $\\ln$ of both sides: $(${lin(1, q1)})\\ln ${b1} = (${lin(p2, q2)})\\ln ${b2}$.`);
  steps.push(`Distribute and collect the $x$ terms: $x\\ln ${b1} - ${p2 === 1 ? '' : p2}x\\ln ${b2} = ${numT}$.`);
  steps.push(`Factor out $x$: $x = \\dfrac{${numT}}{${denT}} \\approx ${d3(x)}$.`);
  return { tag: 'unlike bases', prompt: `Solve: $\\;${b1}^{${lin(1, q1)}} = ${b2}^{${lin(p2, q2)}}$`, parts: [valuePart('$x =$', x, `\\dfrac{${numT}}{${denT}}`, 'e.g. -1.158')], solution: steps.join('<br>'), _check: { x, res: X => (X + q1) * l1 - (p2 * X + q2) * l2 } };
}

// =====================================================================
// 10. Equations with one logarithm
// =====================================================================
export const logEqOne = {
  id: 'log-equations-one', course: 'precalc', group: GROUP, lesson: '2.13',
  title: 'Solving Equations with One Logarithm',
  blurb: 'Isolate the log, rewrite in exponential form, then solve.',
  levels: {
    1: { name: 'Easy', desc: 'Like 2 + log₅(x − 1) = 4' },
    2: { name: 'Medium', desc: 'Coefficients, like 2log₃(x + 3) + 4 = 10 or 2 + log₅(2x − 1) = 4' },
    3: { name: 'Challenging', desc: 'Natural logs, like ln(2 − x)/5 = 1' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const steps = [];
      if (level < 3) {
        const b = pick(rng, [2, 3, 4, 5, 10]), a = level === 1 ? 1 : pick(rng, [1, 2, 3]);
        const c = level === 1 ? 1 : pick(rng, [1, 2, 3]), d = randInt(rng, -6, 6), n = randInt(rng, 1, b === 10 ? 3 : 3);
        const k = randInt(rng, -6, 8), m = a * n + k;
        const x = F(Math.pow(b, n) - d, c);
        const L = logHead(b), inner = `${c === 1 ? '' : c}x${numPart(d) === ' + 0' ? '' : d ? numPart(d) : ''}`;
        const left = rng() < 0.5 || !k ? `${coefT(a)}${L}\\left(${inner}\\right)${k ? numPart(k) : ''}` : `${k} + ${coefT(a)}${L}\\left(${inner}\\right)`;
        steps.push(`Isolate the log: $${L}\\left(${inner}\\right) = ${n}$.`);
        steps.push(`Exponential form: $${inner} = ${b}^{${n}} = ${Math.pow(b, n)}$, so $x = ${x.tex()}$. (Check: the inside is $${Math.pow(b, n)} > 0$, so it works.)`);
        return { tag: level === 1 ? 'isolate and convert' : 'coefficients', prompt: `Solve: $\\;${left} = ${m}$`, parts: [valuePart('$x =$', x.value(), x.tex(), 'e.g. 24')], solution: steps.join('<br>'), _check: { x: x.value(), res: X => a * Math.log(c * X + d) / Math.log(b) + k - m } };
      }
      // ln(p - x)/q = n  or  a ln(c x + d) + k = m
      if (rng() < 0.5) {
        const p = randInt(rng, -3, 6), q = pick(rng, [2, 3, 5]), n = pick(rng, [1, 2, -1]);
        const x = p - Math.exp(q * n);
        steps.push(`Multiply by ${q}: $\\ln(${p} - x) = ${q * n}$.`);
        steps.push(`Exponential form: $${p} - x = e^{${q * n}}$, so $x = ${p} - e^{${q * n}} \\approx ${d3(x)}$.`);
        return { tag: 'natural log', prompt: `Solve: $\\;\\dfrac{\\ln(${p} - x)}{${q}} = ${n}$`, parts: [valuePart('$x =$', x, `${p} - e^{${q * n}}`, 'e.g. 2 - e^5')], solution: steps.join('<br>'), _check: { x, res: X => Math.log(p - X) / q - n } };
      }
      const a = pick(rng, [2, 3, 4]), c = pick(rng, [1, 2, 3]), d = randInt(rng, -5, 5), k = randInt(rng, -6, 6), m = k + a * pick(rng, [1, 2]);
      const n = (m - k) / a, x = (Math.exp(n) - d) / c;
      const inner = `${c === 1 ? '' : c}x${d ? numPart(d) : ''}`;
      steps.push(`Isolate: $\\ln\\left(${inner}\\right) = ${n}$. Exponential form: $${inner} = e^{${n}}$.`);
      steps.push(`So $x = ${c === 1 ? `e^{${n}}${d ? numPart(-d) : ''}` : `\\dfrac{e^{${n}}${d ? numPart(-d) : ''}}{${c}}`} \\approx ${d3(x)}$.`);
      return { tag: 'natural log', prompt: `Solve: $\\;${a}\\ln\\left(${inner}\\right)${k ? numPart(k) : ''} = ${m}$`, parts: [valuePart('$x =$', x, c === 1 ? `e^{${n}}${d ? numPart(-d) : ''}` : `\\dfrac{e^{${n}}${d ? numPart(-d) : ''}}{${c}}`, 'e.g. (e^2 - 3)/2')], solution: steps.join('<br>'), _check: { x, res: X => a * Math.log(c * X + d) + k - m } };
    }
    throw new Error('log-equations-one: could not build');
  },
};

// =====================================================================
// 11. Equations with several logarithms
// =====================================================================
export const logEqMulti = {
  id: 'log-equations-multi', course: 'precalc', group: GROUP, lesson: '2.13',
  title: 'Equations with Several Logarithms',
  blurb: 'Condense first, solve, then throw out extraneous solutions.',
  levels: {
    1: { name: 'Easy', desc: 'Condense to log = log, like log 3 + log(x + 4) = log(5x − 2)' },
    2: { name: 'Medium', desc: 'Condense to log = number, with an extraneous solution' },
    3: { name: 'Challenging', desc: 'Where do two log functions intersect?' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildMulti(level, rng); if (p) return p; }
    throw new Error('log-equations-multi: could not build');
  },
};
const linT = (c, d, v = 'x') => `${c === 1 ? '' : c === -1 ? '-' : c}${v}${d ? numPart(d) : ''}`;
function buildMulti(level, rng) {
  const steps = [];
  const L = b => logHead(b);
  if (level === 1) {
    // log_b m + log_b(x + p) = log_b(q x + r)  ->  m(x + p) = q x + r
    const b = pick(rng, [10, 2, 3, 'e']), m = pick(rng, [2, 3, 4, 5]);
    const x = randInt(rng, 1, 9), p = randInt(rng, -3, 6), q = pick(rng, [1, 5, 6, 7, 8].filter(v => v !== m));
    if (x + p <= 0) return null;
    const r = m * (x + p) - q * x;
    if (q * x + r <= 0) return null;
    const sub = rng() < 0.4;                       // quotient version: log(qx + r) - log(x + p) = log m
    const eq = sub ? `${L(b)}\\left(${linT(q, r)}\\right) - ${L(b)}\\left(${linT(1, p)}\\right) = ${L(b)} ${m}` : `${L(b)} ${m} + ${L(b)}\\left(${linT(1, p)}\\right) = ${L(b)}\\left(${linT(q, r)}\\right)`;
    steps.push(sub ? `Quotient property: $${L(b)}\\dfrac{${linT(q, r)}}{${linT(1, p)}} = ${L(b)} ${m}$, so $\\dfrac{${linT(q, r)}}{${linT(1, p)}} = ${m}$.` : `Product property: $${L(b)}\\left(${m}(${linT(1, p)})\\right) = ${L(b)}\\left(${linT(q, r)}\\right)$, so $${m}(${linT(1, p)}) = ${linT(q, r)}$.`);
    steps.push(`Solve: $${m}x ${numPart(m * p).trim()} = ${linT(q, r)}$, so $x = ${x}$. Check: every log's input is positive at $x = ${x}$, so it works.`);
    return { tag: sub ? 'quotient, log = log' : 'product, log = log', prompt: `Solve: $\\;${eq}$`, parts: [{ type: 'custom', label: '$x =$', check: listChecker([x]), preview: previewL, placeholder: 'e.g. 5, or no solution', answerTex: `$${x}$`, help: 'Separate several solutions with commas. Type "no solution" if none work.' }], solution: steps.join('<br>'), _check: { sols: [x], verify: { kind: 'l1', b, m, p, q, r, sub } } };
  }
  if (level === 2) {
    // log_b(x + p) + log_b(x + q) = n, with (x+p)(x+q) = b^n
    const b = pick(rng, [2, 3, 10]), n = b === 10 ? pick(rng, [1, 2]) : randInt(rng, 2, b === 2 ? 5 : 3), N = Math.pow(b, n);
    const pairs = []; for (let u = 1; u * u <= N; u++) if (N % u === 0) pairs.push([u, N / u]);
    const [u, v] = pick(rng, pairs); if (u === v) return null;
    const x = randInt(rng, -2, 8), p = u - x, q = v - x;
    const r2 = -(p + q) - x;                   // the other root, always extraneous here (r2 + p = -v)
    const asNum = rng() < 0.6;
    const right = asNum ? String(n) : `${L(b)} ${N}`;
    steps.push(`Product property: $${L(b)}\\left((${linT(1, p)})(${linT(1, q)})\\right) = ${right}$.`);
    steps.push(`${asNum ? 'Exponential form' : 'Set the insides equal'}: $(${linT(1, p)})(${linT(1, q)}) = ${N}$, so $x^2 ${numPart(p + q)}x ${numPart(p * q - N)} = 0$.`);
    steps.push(`Factor: $(x ${numPart(-x)})(x ${numPart(-r2)}) = 0$, so $x = ${x}$ or $x = ${r2}$.`);
    steps.push(`Check the domain: at $x = ${r2}$ the log inputs are $${r2 + p}$ and $${r2 + q}$, and the log of a negative number (or 0) is not defined. $x = ${r2}$ is extraneous, so the only solution is $x = ${x}$.`);
    return { tag: 'extraneous solution', prompt: `Solve: $\\;${L(b)}\\left(${linT(1, p)}\\right) + ${L(b)}\\left(${linT(1, q)}\\right) = ${right}$`, parts: [{ type: 'custom', label: 'Solution(s):', check: listChecker([x]), preview: previewL, placeholder: 'e.g. 5, or no solution', answerTex: `$x = ${x}$ (not $${r2}$)`, help: 'Separate several solutions with commas. Type "no solution" if none work.' }], solution: steps.join('<br>'), _check: { sols: [x], extraneous: r2, verify: { kind: 'l2', b, p, q, N } } };
  }
  // f(x) = ln(x + A) - ln(x), g(x) = ln(x + B): (x + A)/x = x + B  ->  x^2 + (B - 1)x - A = 0
  const r1 = randInt(rng, 1, 8), r2 = -randInt(rng, 1, 8);
  const A = -r1 * r2, B = 1 - (r1 + r2);
  if (r2 + B > 0 && r2 + A > 0 && r2 > 0) return null;
  const valid = [r1, r2].filter(x => x + A > 0 && x > 0 && x + B > 0);
  if (!valid.length) return null;
  steps.push(`Set them equal: $\\ln(x ${numPart(A)}) - \\ln x = \\ln(x ${numPart(B)})$. Quotient property: $\\ln\\dfrac{x ${numPart(A)}}{x} = \\ln(x ${numPart(B)})$.`);
  steps.push(`So $\\dfrac{x ${numPart(A)}}{x} = x ${numPart(B)}$, which gives $x ${numPart(A)} = x^2 ${numPart(B)}x$ and $x^2 ${numPart(B - 1)}x ${numPart(-A)} = 0$.`);
  steps.push(`Factor: $(x ${numPart(-r1)})(x ${numPart(-r2)}) = 0$, so $x = ${r1}$ or $x = ${r2}$.`);
  steps.push(`$\\ln x$ needs $x > 0$, so $x = ${r2}$ is extraneous. They intersect at $x = ${valid.join(', ')}$.`);
  return { tag: 'intersection', prompt: `Let $f(x) = \\ln(x ${numPart(A)}) - \\ln(x)$ and $g(x) = \\ln(x ${numPart(B)})$. Find all values of $x$ where the graphs of $f$ and $g$ intersect.`, parts: [{ type: 'custom', label: '$x =$', check: listChecker(valid), preview: previewL, placeholder: 'e.g. 3', answerTex: `$${valid.join(', ')}$`, help: 'Separate several values with commas. Type "no solution" if none work.' }], solution: steps.join('<br>'), _check: { sols: valid, extraneous: r2, verify: { kind: 'l3', A, B } } };
}

// =====================================================================
// 12. Inverses of exponential and log functions
// =====================================================================
export const expLogInverses = {
  id: 'exp-log-inverses', course: 'precalc', group: GROUP, lesson: '2.13',
  title: 'Inverses of Exponential and Log Functions',
  blurb: 'Swap x and y, then undo with a log or an exponential.',
  levels: {
    1: { name: 'Easy', desc: 'Like f(x) = 2ˣ + 5 or g(x) = log₃ x − 4' },
    2: { name: 'Medium', desc: 'Like f(x) = 3(2)ˣ⁺⁴ − 15 or g(x) = −3log₅(x − 4) + 6' },
    3: { name: 'Challenging', desc: 'Including: for what x does h⁻¹(x) = 1?' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const b = pick(rng, [2, 3, 5, 10]);
      const a = level === 1 ? 1 : pick(rng, [2, 3, -3, -2, 4]), h = level === 1 ? 0 : nonzero(rng, -5, 5), k = nonzero(rng, -15, 15);
      const name = pick(rng, ['f', 'g', 'h']);
      if (level === 3 && rng() < 0.45) {
        const c = randInt(rng, -2, 3), val = a * Math.pow(b, c + h) + k;
        if (Math.abs(val) > 2000 || !exact(val)) continue;
        return {
          tag: 'value of the inverse', prompt: `Let $h(x) = ${a === 1 ? b : `${coefT(a)}(${b})`}^{x ${numPart(h).trim()}} ${numPart(k).trim()}$ and let $k(x) = h^{-1}(x)$. For what value of $x$ does $k(x) = ${c}$?`,
          parts: [{ type: 'number', label: '$x =$', answer: F(val) }],
          solution: `$k(x) = ${c}$ means $h^{-1}(x) = ${c}$, which means $h(${c}) = x$. So $x = h(${c}) = ${a === 1 ? b : `${coefT(a)}(${b})`}^{${c + h}} ${numPart(k).trim()} = ${val}$. No need to find the inverse.`,
          _check: { val },
        };
      }
      const isExp = rng() < 0.5;
      const L = logHead(b);
      if (isExp) {
        const fx = `${a === 1 ? b : `${coefT(a)}(${b})`}^{${h ? `x ${numPart(h).trim()}` : 'x'}} ${numPart(k).trim()}`;
        const inv = x => Math.log((x - k) / a) / Math.log(b) - h;
        const ansT = `${L}\\left(${a === 1 ? `x ${numPart(-k).trim()}` : `\\dfrac{x ${numPart(-k).trim()}}{${a}}`}\\right)${h ? ` ${numPart(-h).trim()}` : ''}`;
        const steps = [`Write $y = ${fx}$ and swap: $x = ${fx.replace(/x/g, 'y')}$.`,
          `Isolate the exponential: $${a === 1 ? '' : `\\dfrac{x ${numPart(-k).trim()}}{${a}} = `}${b}^{${h ? `y ${numPart(h).trim()}` : 'y'}}${a === 1 ? ` = x ${numPart(-k).trim()}` : ''}$.`,
          `Log form: $y ${h ? numPart(h).trim() : ''} = ${L}\\left(${a === 1 ? `x ${numPart(-k).trim()}` : `\\dfrac{x ${numPart(-k).trim()}}{${a}}`}\\right)$, so $${name}^{-1}(x) = ${ansT}$.`];
        return { tag: 'inverse of an exponential', prompt: `Find the inverse of $${name}(x) = ${fx}$.`, parts: [invPart(name, inv, ansT, k)], solution: steps.join('<br>'), _check: { inv, fwd: x => a * Math.pow(b, x + h) + k } };
      }
      const fx = `${coefT(a)}${L}\\left(${h ? `x ${numPart(-h).trim()}` : 'x'}\\right) ${numPart(k).trim()}`;
      const inv = x => Math.pow(b, (x - k) / a) + h;
      const ansT = `${b}^{${a === 1 ? `x ${numPart(-k).trim()}` : `\\frac{x ${numPart(-k).trim()}}{${a}}`}}${h ? ` ${numPart(h).trim()}` : ''}`;
      const steps = [`Write $y = ${fx}$ and swap: $x = ${fx.replace(/\\left\(x/, '\\left(y')}$.`,
        `Isolate the log: $${L}\\left(${h ? `y ${numPart(-h).trim()}` : 'y'}\\right) = ${a === 1 ? `x ${numPart(-k).trim()}` : `\\dfrac{x ${numPart(-k).trim()}}{${a}}`}$.`,
        `Exponential form: $y ${h ? numPart(-h).trim() : ''} = ${b}^{${a === 1 ? `x ${numPart(-k).trim()}` : `\\frac{x ${numPart(-k).trim()}}{${a}}`}}$, so $${name}^{-1}(x) = ${ansT}$.`];
      return { tag: 'inverse of a log', prompt: `Find the inverse of $${name}(x) = ${fx}$.`, parts: [invPart(name, inv, ansT, k)], solution: steps.join('<br>'), _check: { inv, fwd: x => a * Math.log(x - h) / Math.log(b) + k } };
    }
    throw new Error('exp-log-inverses: could not build');
  },
};
function invPart(name, inv, ansT, center = 0) {
  const xs = [-40, -20, -11.5, -6, -2.5, -0.6, 0.7, 3.3, 7.9, 15, 31, 64].map(t => center + t).filter(x => isFinite(inv(x)));
  return {
    type: 'custom', label: `$${name}^{-1}(x) =$`, preview: previewL, keys: LOG_KEYS, placeholder: 'e.g. log_2((x + 15)/3) - 4', answerTex: `$${ansT}$`,
    help: 'Type logs like log_2((x + 15)/3) and powers like 5^((6 - x)/3).',
    check: str => {
      let tree; const s = String(str);
      try { tree = parseL(s.includes('=') ? s.slice(s.lastIndexOf('=') + 1) : s); } catch { return { ok: false, msg: 'Could not read that. Example: log_2((x + 15)/3) - 4', format: true }; }
      for (const v of varsL(tree)) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
      const ok = xs.length >= 3 && xs.every(x => { let g; try { g = evalL(tree, { x }); } catch { return false; } const w = inv(x); return isFinite(g) && Math.abs(g - w) < 1e-7 * Math.max(1, Math.abs(w)); });
      return { ok };
    },
  };
}

// =====================================================================
// 13. Exponential and log inequalities
// =====================================================================
export const expLogInequalities = {
  id: 'exp-log-inequalities', course: 'precalc', group: GROUP, lesson: '2.13',
  title: 'Exponential and Log Inequalities',
  blurb: 'Solve like an equation, then use increasing or decreasing behavior and the domain to finish.',
  levels: {
    1: { name: 'Easy', desc: 'Exponential, like 1 − 4(2)ˣ⁻³ ≤ −31' },
    2: { name: 'Medium', desc: 'One logarithm, and its domain' },
    3: { name: 'Challenging', desc: 'Two logs with a quadratic, where the domain trims the answer' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildIneq(level, rng); if (p) return p; }
    throw new Error('exp-log-inequalities: could not build');
  },
};
const OPS = ['<', '>', '<=', '>='];
const opT = o => ({ '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge' }[o]);
const flip = o => ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[o]);
const test = (u, o, v) => (o === '<' ? u < v : o === '>' ? u > v : o === '<=' ? u <= v + 1e-12 : u >= v - 1e-12);
// build the solution set from candidate endpoints {v, tex} and a predicate
function solveSet(pred, cands) {
  const pts = [...cands].sort((p, q) => p.v - q.v).filter((p, i, arr) => !i || Math.abs(p.v - arr[i - 1].v) > 1e-12);
  const bounds = [{ v: -Infinity, tex: '-\\infty' }, ...pts, { v: Infinity, tex: '\\infty' }];
  const segs = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const lo = bounds[i], hi = bounds[i + 1];
    const mid = !isFinite(lo.v) ? hi.v - 1 : !isFinite(hi.v) ? lo.v + 1 : (lo.v + hi.v) / 2;
    segs.push({ lo, hi, ok: pred(mid) });
  }
  const inc = p => isFinite(p.v) && pred(p.v);
  const out = [];
  for (const s of segs) {
    if (!s.ok) continue;
    const last = out[out.length - 1];
    if (last && last.hi === s.lo && inc(s.lo)) { last.hi = s.hi; last.rc = inc(s.hi); continue; }
    out.push({ lo: s.lo, hi: s.hi, lc: inc(s.lo), rc: inc(s.hi) });
  }
  return out;
}
const setTex = I => I.map(s => `${s.lc ? '[' : '('}${s.lo.tex},\\ ${s.hi.tex}${s.rc ? ']' : ')'}`).join(' \\cup ');
const asNums = I => I.map(s => ({ lo: s.lo.v, hi: s.hi.v, lc: s.lc, rc: s.rc }));
function ineqPart(I) {
  return { type: 'custom', label: 'Solution:', check: intervalChecker(asNums(I)), preview: null, keys: ['≤', '≥', '∞', '∪', '√', '(', ')', '[', ']'], placeholder: 'e.g. x ≥ 6  or  (-3, 1) ∪ (2, 3)', answerTex: `$${setTex(I)}$`, help: 'Use an inequality like x ≥ 6, or interval notation. Join pieces with ∪ (or U).' };
}
function buildIneq(level, rng) {
  const steps = [];
  if (level === 1) {
    // c + a b^(x - h) (op) m  with (m - c)/a = b^n
    const b = pick(rng, [2, 3, 5]), a = pick(rng, [2, 3, 4, -2, -3, -4]), n = randInt(rng, 1, 3), h = randInt(rng, -3, 4), c = randInt(rng, -5, 5);
    const m = c + a * Math.pow(b, n), op = pick(rng, OPS);
    const thr = n + h;
    const pred = x => test(c + a * Math.pow(b, x - h), op, m);
    const I = solveSet(pred, [{ v: thr, tex: String(thr) }]);
    const iso = a < 0 ? flip(op) : op;
    steps.push(`${c ? `${c > 0 ? 'Subtract' : 'Add'} ${Math.abs(c)}, then divide` : 'Divide'} by $${a}$${a < 0 ? ' (dividing by a negative flips the inequality)' : ''}: $${b}^{x ${numPart(-h).trim()}} ${opT(iso)} ${Math.pow(b, n)} = ${b}^{${n}}$.`);
    steps.push(`$${b}^x$ is increasing, so compare exponents: $x ${numPart(-h).trim()} ${opT(iso)} ${n}$, so $x ${opT(iso)} ${thr}$.`);
    return { tag: a < 0 ? 'exponential, flip' : 'exponential', prompt: `Let $k(x) = ${c ? `${c} ${a < 0 ? '-' : '+'} ${Math.abs(a)}` : coefT(a)}(${b})^{x ${numPart(-h).trim()}}$. Find all values of $x$ for which $k(x) ${opT(op)} ${m}$.`, parts: [ineqPart(I)], solution: steps.join('<br>'), _check: { I: asNums(I), pred } };
  }
  if (level === 2) {
    // log_b(cx + d) (op) n
    const b = pick(rng, [2, 3, 10, F(1, 2)]), c = pick(rng, [1, 2, 3, -1, -2]), d = randInt(rng, -6, 6), n = randInt(rng, 0, 3);
    const bv = typeof b === 'object' ? b.value() : b;
    const N = Math.pow(bv, n);
    const op = pick(rng, ['<', '>', '<=', '>=']);
    const pred = x => { const u = c * x + d; return u > 0 && test(Math.log(u) / Math.log(bv), op, n); };
    const e1 = F(-d, c);
    const NF = typeof b === 'object' ? b.pow(n) : F(Math.pow(b, n));
    const edge2 = NF.sub(d).div(c);
    const I = solveSet(pred, [{ v: e1.value(), tex: e1.tex() }, { v: edge2.value(), tex: edge2.tex() }]);
    const L = logHead(b);
    const inner = linT(c, d);
    steps.push(`Domain first: $${inner} > 0$, so $x ${c > 0 ? '>' : '<'} ${e1.tex()}$.`);
    steps.push(`Exponential form: the log equals $${n}$ when $${inner} = ${typeof b === 'object' ? `\\left(${b.tex()}\\right)` : b}^{${n}} = ${NF.tex()}$, which is $x = ${edge2.tex()}$.`);
    steps.push(`${bv > 1 ? 'With a base greater than 1 the log increases' : 'With a base between 0 and 1 the log decreases'}, so test the intervals and keep only $x$-values in the domain: $${setTex(I)}$.`);
    return { tag: 'one log', prompt: `Solve: $\\;${L}\\left(${inner}\\right) ${opT(op)} ${n}$`, parts: [ineqPart(I)], solution: steps.join('<br>'), _check: { I: asNums(I), pred } };
  }
  // ln(P) < ln(L)  where P = x^2 + u x + v, L = x + w ;  or  log P - log L > 0
  const r1 = randInt(rng, -5, 1), r2 = r1 + randInt(rng, 2, 6), w = randInt(rng, -2, 6);
  const usePlus = rng() < 0.5;
  // P - L = (x - r1)(x - r2)  ->  P = x^2 - (r1 + r2) x + r1 r2 + x + w
  const u = 1 - (r1 + r2), v = r1 * r2 + w;
  const P = x => x * x + u * x + v, Lf = x => x + w;
  const op = usePlus ? '>' : '<';
  const pred = x => P(x) > 0 && Lf(x) > 0 && (op === '<' ? Math.log(P(x)) < Math.log(Lf(x)) : Math.log(P(x)) - Math.log(Lf(x)) > 0);
  const disc = u * u - 4 * v;
  const cands = [{ v: r1, tex: String(r1) }, { v: r2, tex: String(r2) }, { v: -w, tex: String(-w) }];
  if (disc > 0) {
    const sq = Math.sqrt(disc), isq = exact(sq);
    const t1 = isq ? String((-u - sq) / 2) : `\\frac{${-u} - \\sqrt{${disc}}}{2}`, t2 = isq ? String((-u + sq) / 2) : `\\frac{${-u} + \\sqrt{${disc}}}{2}`;
    cands.push({ v: (-u - sq) / 2, tex: isq && exact((-u - sq) / 2) ? t1 : `\\frac{${-u} - \\sqrt{${disc}}}{2}` }, { v: (-u + sq) / 2, tex: isq && exact((-u + sq) / 2) ? t2 : `\\frac{${-u} + \\sqrt{${disc}}}{2}` });
  }
  const I = solveSet(pred, cands);
  if (!I.length || I.length > 2) return null;
  if (I.some(s => !isFinite(s.lo.v) && !isFinite(s.hi.v))) return null;
  const Ptex = `x^2${u ? ` ${u > 0 ? '+' : '-'} ${Math.abs(u) === 1 ? '' : Math.abs(u)}x` : ''}${v ? numPart(v) : ''}`;
  const Ltex = `x${w ? numPart(w) : ''}`;
  const prompt = op === '<'
    ? `Let $g(x) = \\ln\\left(${Ptex}\\right)$ and $h(x) = \\ln\\left(${Ltex}\\right)$. What are all values of $x$ for which $g(x) < h(x)$?`
    : `Let $f(x) = \\log\\left(${Ptex}\\right) - \\log\\left(${Ltex}\\right)$. What are all values of $x$ for which $f(x) > 0$?`;
  steps.push(`Domain: both log inputs must be positive: $${Ptex} > 0$ and $${Ltex} > 0$.`);
  steps.push(op === '<' ? `Since $\\ln$ is increasing, $g < h$ means $${Ptex} < ${Ltex}$.` : `$f(x) > 0$ means $\\log\\left(${Ptex}\\right) > \\log\\left(${Ltex}\\right)$, and since $\\log$ is increasing, $${Ptex} > ${Ltex}$.`);
  steps.push(`That is $x^2 ${numPart(u - 1).replace(' + 0', '')}x ${numPart(v - w)} ${op} 0$, or $(x ${numPart(-r1)})(x ${numPart(-r2)}) ${op} 0$: ${op === '<' ? `between $${r1}$ and $${r2}$` : `outside $${r1}$ and $${r2}$`}.`);
  steps.push(`Keep only the part inside the domain${disc > 0 ? ` (the quadratic is positive outside its roots $\\frac{${-u} \\pm \\sqrt{${disc}}}{2}$)` : ''}: $${setTex(I)}$.`);
  return { tag: op === '<' ? 'g < h with a quadratic' : 'f > 0 with a quadratic', prompt, parts: [ineqPart(I)], solution: steps.join('<br>'), _check: { I: asNums(I), pred } };
}

// =====================================================================
// 14. Log-linear form (2.15)
// =====================================================================
const SEMI = 'Unit 2 - Log Equations and Semi-Log Plots';
export const logLinear = {
  id: 'log-linear', course: 'precalc', group: SEMI, lesson: '2.15',
  title: 'Log-Linear Form',
  blurb: 'Switch between y = abˣ and the linear model log y = mx + k for a semi-log plot.',
  levels: {
    1: { name: 'Easy', desc: 'Write the linear model for y = abˣ' },
    2: { name: 'Medium', desc: 'Write y = abˣ from a linear model, and growth or decay' },
    3: { name: 'Challenging', desc: 'Contexts: initial value and growth rate from log B = 0.15t + 2.3' },
  },
  generate(level, rng) {
    const base = level === 1 ? pick(rng, [10, 10, 2, 'e']) : pick(rng, [10, 10, 2, 'e']);
    const lg = v => (base === 10 ? Math.log10(v) : base === 2 ? Math.log2(v) : Math.log(v));
    const L = logHead(base);
    if (level === 1) {
      const a = pick(rng, [2, 5, 10, 20, 100, 300, 1000]), b = pick(rng, [F(4), F(3), F(2), F(4, 5), F(1, 2), F(3, 2)]);
      const m = lg(b.value()), k = lg(a);
      const bT = b.isInt() ? String(b.n) : String(b.value());
      return {
        tag: 'exponential to log-linear',
        prompt: `Write the linear model for the semi-log plot of $f(x) = ${a}(${bT})^{x}$, in the form $${L} y = mx + k$.`,
        parts: [valuePart('Slope $m =$', m, `${L} ${bT}`, `e.g. ${base === 10 ? 'log(4)' : base === 2 ? 'log_2(4)' : 'ln(4)'}`), valuePart('Intercept $k =$', k, `${L} ${a}`, 'e.g. 0.699')],
        solution: `Take ${L === '\\ln' ? 'the natural log' : 'the log'} of both sides: $${L} y = ${L}\\left(${a}\\cdot ${bT}^x\\right) = ${L} ${a} + x\\,${L} ${bT}$.<br>So $${L} y = (${L} ${bT})x + ${L} ${a}$: slope $m = ${L} ${bT} \\approx ${d3(m)}$ and intercept $k = ${L} ${a} \\approx ${d3(k)}$.`,
        _check: { m, k },
      };
    }
    const m = level === 2 ? pick(rng, [3, -0.2, 0.4, -1, 0.15, 2, -0.5]) : pick(rng, [0.15, 0.08, -0.05, 0.12, -0.1, 0.03]);
    const k = level === 2 ? pick(rng, [-1, 2, 3, 0.5, 1]) : pick(rng, [2.3, 1.7, 3, 2, 1.2]);
    const bv = base === 'e' ? Math.E : base;
    const a = Math.pow(bv, k), b = Math.pow(bv, m);
    const bT = base === 'e' ? 'e' : String(base);
    const mT = String(m), kT = String(k);
    if (level === 2) {
      return {
        tag: 'log-linear to exponential',
        prompt: `The linear model for a semi-log plot is $${L} y = ${mT}x ${k < 0 ? '-' : '+'} ${Math.abs(k)}$. Write the exponential model $y = ab^x$ and say whether it shows growth or decay.`,
        parts: [valuePart('$a =$', a, `${bT}^{${kT}}`, 'e.g. 1000'), valuePart('$b =$', b, `${bT}^{${mT}}`, 'e.g. 0.631'), { type: 'mc', label: 'The model shows:', choices: ['Growth', 'Decay'], answer: b > 1 ? 0 : 1 }],
        solution: `Rewrite in exponential form: $y = ${bT}^{${mT}x ${k < 0 ? '-' : '+'} ${Math.abs(k)}} = ${bT}^{${kT}}\\cdot\\left(${bT}^{${mT}}\\right)^{x}$.<br>So $a = ${bT}^{${kT}} \\approx ${d3(a)}$ and $b = ${bT}^{${mT}} \\approx ${d3(b)}$. The slope is ${m > 0 ? 'positive, so $b > 1$: growth' : 'negative, so $b < 1$: decay'}.`,
        _check: { a, b },
      };
    }
    const ctx = pick(rng, [
      { v: 'B', what: 'a bacteria population', unit: 'hour', t: 't' },
      { v: 'P', what: 'the number of people who have heard Mr. Z\'s joke', unit: 'minute', t: 't' },
      { v: 'V', what: 'the number of views of a video', unit: 'day', t: 'd' },
    ]);
    const L10 = '\\log';
    const a10 = Math.pow(10, k), b10 = Math.pow(10, m), rate = (b10 - 1) * 100;
    return {
      tag: 'context',
      prompt: `The linear model $${L10} ${ctx.v} = ${mT}${ctx.t} ${k < 0 ? '-' : '+'} ${Math.abs(k)}$ describes ${ctx.what} $${ctx.v}$ after $${ctx.t}$ ${ctx.unit}s.`,
      parts: [
        valuePart('Initial value:', a10, `10^{${kT}}`, 'e.g. 199.526'),
        { type: 'custom', label: `Percent ${m > 0 ? 'growth' : 'decay'} rate per ${ctx.unit}:`, check: s => valueChecker(Math.abs(rate))(String(s).replace(/\\?%/g, '')), preview: previewL, placeholder: 'e.g. 41.254', answerTex: `$${d3(Math.abs(rate))}\\%$`, help: 'Give the percent, rounded to 3 decimal places (the % sign is optional).' },
      ],
      solution: `Exponential form: $${ctx.v} = 10^{${mT}${ctx.t} ${k < 0 ? '-' : '+'} ${Math.abs(k)}} = 10^{${kT}}\\cdot\\left(10^{${mT}}\\right)^{${ctx.t}}$.<br>Initial value: $10^{${kT}} \\approx ${d3(a10)}$. Each ${ctx.unit} multiplies by $b = 10^{${mT}} \\approx ${b10.toFixed(5)}$, which is ${m > 0 ? 'growth' : 'decay'} of about $${d3(Math.abs(rate))}\\%$ per ${ctx.unit}.`,
      _check: { a10, b10, rate },
    };
  },
};

// =====================================================================
// 15. Models from a semi-log plot (2.15)
// =====================================================================
export const semiLogModel = {
  id: 'semi-log-model', course: 'precalc', group: SEMI, lesson: '2.15',
  title: 'Models from a Semi-Log Plot',
  blurb: 'Read two points from a semi-log plot, write y = abˣ, then the log-linear form.',
  levels: {
    1: { name: 'Easy', desc: 'One point is on the vertical axis' },
    2: { name: 'Medium', desc: 'Two points away from the axis, whole-number base' },
    3: { name: 'Challenging', desc: 'Decay, and bases that need rounding' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      let x1, x2, y1, y2;
      const NICE = [1, 2, 3, 4, 5, 6, 8, 10, 20, 30, 40, 50, 60, 80, 100, 200, 300, 400, 500, 600, 800, 1000];
      if (level === 1) { x1 = 0; x2 = randInt(rng, 2, 5); y1 = pick(rng, [1, 2, 3, 5, 10]); const b = pick(rng, [2, 3, 10]); y2 = y1 * Math.pow(b, x2); if (y2 > 1000) continue; }
      else if (level === 2) { const b = pick(rng, [2, 3]); x1 = randInt(rng, 1, 2); x2 = x1 + randInt(rng, 2, 3); const a = pick(rng, [1, 2, 3, 5]); y1 = a * Math.pow(b, x1); y2 = a * Math.pow(b, x2); if (y2 > 1000) continue; }
      else { x1 = randInt(rng, 0, 2); x2 = x1 + randInt(rng, 2, 5); [y1, y2] = shuffle(rng, NICE).slice(0, 2); if (Math.abs(Math.log10(y2 / y1)) < 0.4) continue; }
      if (!NICE.includes(y1) || !NICE.includes(y2) || x2 > 6) continue;
      const b = Math.pow(y2 / y1, 1 / (x2 - x1)), a = y1 / Math.pow(b, x1);
      const m = Math.log10(b), k = Math.log10(a);
      const emin = Math.floor(Math.log10(Math.min(y1, y2, a, a * Math.pow(b, 6)))), emax = Math.ceil(Math.log10(Math.max(y1, y2, a, a * Math.pow(b, 6)) * 1.0001));
      if (emax - emin > 4 || emin < -1) continue;
      const bExact = Math.abs(b - Math.round(b)) < 1e-9, aExact = Math.abs(a * 1000 - Math.round(a * 1000)) < 1e-6;
      return {
        tag: level === 1 ? 'point on the axis' : level === 2 ? 'whole-number base' : (b < 1 ? 'decay' : 'rounded base'),
        prompt: 'The semi-log plot shows an exponential model, with the vertical axis scaled logarithmically (base 10). Write the model as $y = ab^x$, then write its log-linear form $\\log y = mx + k$.',
        displayLog: { grid: { xmin: 0, xmax: 6, emin: Math.max(emin, -1), emax: Math.max(emax, emin + 1) }, fn: x => a * Math.pow(b, x), labels: [{ x: x1, y: y1, text: `(${x1}, ${y1})` }, { x: x2, y: y2, text: `(${x2}, ${y2})` }] },
        parts: [
          valuePart('$a =$', a, aExact ? String(+a.toFixed(3)) : `${y1}\\div ${d3(b)}^{${x1}}`, 'e.g. 3'),
          valuePart('$b =$', b, bExact ? String(Math.round(b)) : `\\left(${F(y2, y1).tex()}\\right)^{1/${x2 - x1}}`, 'e.g. 2'),
          valuePart('Slope $m =$', m, `\\log ${bExact ? Math.round(b) : d3(b)}`, 'e.g. 0.301'),
          valuePart('Intercept $k =$', k, `\\log ${aExact ? +a.toFixed(3) : d3(a)}`, 'e.g. 0.477'),
        ],
        solution: `Two points: $(${x1}, ${y1})$ and $(${x2}, ${y2})$. Divide: $b^{${x2 - x1}} = \\dfrac{${y2}}{${y1}}$, so $b = \\left(${F(y2, y1).tex()}\\right)^{1/${x2 - x1}}${bExact ? ` = ${Math.round(b)}` : ` \\approx ${d3(b)}`}$.<br>`
          + (x1 === 0 ? `At $x = 0$, $y = a$, so $a = ${y1}$.` : `Then $a = \\dfrac{${y1}}{b^{${x1}}} \\approx ${d3(a)}$.`)
          + `<br>Log-linear form: $\\log y = (\\log b)x + \\log a$, so $m = \\log b \\approx ${d3(m)}$ and $k = \\log a \\approx ${d3(k)}$. The line on the plot has slope $${d3(m)}$ per unit of $x$.`,
        _check: { x1, x2, y1, y2, a, b, m, k },
      };
    }
    throw new Error('semi-log-model: could not build');
  },
};
void gcd;
