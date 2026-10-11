// Skill: Simplifying the result of the quadratic formula (Algebra II)
// Students simplify the radical first (including imaginary results), then reduce the fraction.
import { randInt, pick, nonzero, gcd } from '../../math.js?v=1.4';

export const skill = {
  id: 'quadratic-formula',
  course: 'alg2',
  title: 'Simplifying Quadratic Formula Answers',
  group: 'Quadratics',
  blurb: 'Simplify the radical, then reduce the fraction. Includes imaginary answers.',
  levels: {
    1: { name: 'Easy', desc: 'Real answers where everything divides evenly' },
    2: { name: 'Medium', desc: 'Real answers that reduce to a smaller fraction' },
    3: { name: 'Challenging', desc: 'Imaginary answers: simplify the square root of a negative, then reduce' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = build(level, rng); if (p) return p; }
    throw new Error('quadratic-formula: could not build');
  },
};

const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];
// |D| = k^2 * r with r squarefree
function splitSquare(n) {
  let k = 1, r = n;
  for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { r /= f * f; k *= f; }
  return { k, r };
}

// ---------- parsing student answers ----------
function norm(s) {
  return String(s).toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '').replace(/\*/g, '').replace(/·/g, '')
    .replace(/\+\/-|\+-/g, '±')
    .replace(/sqrt/g, '√')
    .replace(/√\((\d+)\)/g, '√$1');
}
// "4i√3", "4√3i", "i√3", "√3" -> { coef, i, rad }
function readRadical(s) {
  const m = s.match(/^(\d*)(i?)√(\d+)(i?)$/);
  if (!m || (m[2] && m[4])) return null;
  return { coef: m[1] === '' ? 1 : +m[1], i: !!(m[2] || m[4]), rad: +m[3] };
}
// "(3±2i√3)/2" or "2±√3" -> { A, rad: {coef,i,rad}, d }
function readFinal(s) {
  let inner = s, d = 1;
  const frac = s.match(/^\((.+)\)\/(\d+)$/);
  if (frac) { inner = frac[1]; d = +frac[2]; }
  else if (s.includes('/')) return { error: 'Put the whole numerator in parentheses, like (3 ± 2i√3)/2.' };
  const m = inner.match(/^(-?\d+)±(.+)$/);
  if (!m) return { error: 'Write it as one expression with ±, like (3 ± 2√5)/2 or 2 ± √3.' };
  const rad = readRadical(m[2]);
  if (!rad) return { error: 'Write the radical part like 2√3 or 2i√3.' };
  if (d === 0) return { error: 'The denominator cannot be 0.' };
  return { A: +m[1], rad, d };
}
const radTex = ({ coef, i, rad }) => `${coef === 1 ? '' : coef}${i ? 'i' : ''}\\sqrt{${rad}}`;
function preview(str) {
  const s = norm(str);
  if (!s) return '';
  const r = readRadical(s);
  if (r) return radTex(r);
  const f = readFinal(s);
  if (f && !f.error) { const top = `${f.A} \\pm ${radTex(f.rad)}`; return f.d === 1 ? top : `\\dfrac{${top}}{${f.d}}`; }
  return null;
}
const KEYS = ['±', '√', 'i', '(', ')', '/'];

// ---------- problem ----------
function build(level, rng) {
  let a, b, c;
  if (level === 1) {
    // x^2 + bx + c with b even, so the answer is p ± q√r with no fraction left
    const p = nonzero(rng, -8, 8), q = randInt(rng, 1, 5), r = pick(rng, SQUAREFREE.slice(0, 8));
    a = 1; b = -2 * p; c = p * p - q * q * r;
  } else {
    a = randInt(rng, 2, 6); b = nonzero(rng, -12, 12); c = nonzero(rng, -15, 15);
  }
  const D = b * b - 4 * a * c;
  if (D === 0) return null;
  if (level <= 2 && D < 0) return null;
  if (level === 3 && D > 0) return null;
  const { k, r } = splitSquare(Math.abs(D));
  if (k < 2 || r === 1) return null;                 // radical must simplify, and not be a perfect square
  if (Math.abs(D) > 600) return null;
  const g = gcd(gcd(Math.abs(b), k), 2 * a);
  if (level === 2 && g < 2 && rng() > 0.15) return null;   // mostly reducible, some traps that are not
  if (level === 3 && g < 2 && rng() > 0.25) return null;  // mostly reducible, some traps that are not
  const A = -b / g, B = k / g, d = (2 * a) / g;
  const im = D < 0;

  const formulaTex = `\\dfrac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}`;
  const ansRad = { coef: k, i: im, rad: r };
  const finalTex = d === 1 ? `${A} \\pm ${radTex({ coef: B, i: im, rad: r })}` : `\\dfrac{${A} \\pm ${radTex({ coef: B, i: im, rad: r })}}{${d}}`;

  const checkRad = str => {
    const s = norm(str);
    if (!s) return { ok: false, msg: 'Enter the simplified radical, like 4√3 or 4i√3.', format: true };
    const got = readRadical(s);
    if (!got) return { ok: false, msg: 'Write it like 4√3, or 4i√3 for an imaginary result. You can type sqrt for √.', format: true };
    if (got.i !== im) return { ok: false, msg: im ? 'The number under the radical is negative, so the result needs an i.' : 'The number under the radical is positive, so there is no i.' };
    if (got.coef * got.coef * got.rad !== Math.abs(D)) return { ok: false };
    if (got.coef !== k || got.rad !== r) return { ok: false, msg: 'That is equal, but the radical is not fully simplified. Pull out the largest perfect square.' };
    return { ok: true };
  };
  const checkFinal = str => {
    const s = norm(str);
    if (!s) return { ok: false, msg: 'Enter your answer, like (3 ± 2√5)/2.', format: true };
    const f = readFinal(s);
    if (f.error) return { ok: false, msg: f.error, format: true };
    const sameImag = f.rad.i === im;
    const realEq = f.A * (2 * a) === -b * f.d;                                        // A/d = -b/(2a)
    const radEq = f.rad.coef ** 2 * f.rad.rad * (2 * a) ** 2 === Math.abs(D) * f.d ** 2; // coef√rad/d = √|D|/(2a)
    if (!(sameImag && realEq && radEq)) return { ok: false };
    if (f.A === A && f.rad.coef === B && f.rad.rad === r && f.d === d) return { ok: true };
    return { ok: false, msg: 'That is equal to the answer, but it is not fully simplified.' };
  };

  const steps = [];
  steps.push(`Simplify the radical first: $\\sqrt{${D}} = ${im ? `\\sqrt{-1}\\cdot\\sqrt{${-D}}` : ''}${im ? ' = ' : ''}${im ? 'i' : ''}\\sqrt{${k * k}\\cdot ${r}} = ${radTex(ansRad)}$.`);
  steps.push(`So $x = \\dfrac{${-b} \\pm ${radTex(ansRad)}}{${2 * a}}$.`);
  if (g > 1) steps.push(`Every term ($${-b}$, $${k}$ and $${2 * a}$) is divisible by $${g}$, so divide each one by $${g}$: $x = ${finalTex}$.`);
  else steps.push(`The numbers $${-b}$, $${k}$ and $${2 * a}$ have no common factor, so the fraction cannot be reduced: $x = ${finalTex}$.`);

  return {
    tag: im ? (g > 1 ? 'imaginary, reduce' : 'imaginary, cannot reduce') : (d === 1 ? 'real, divides evenly' : g > 1 ? 'real, reduce' : 'real, cannot reduce'),
    prompt: `Solving $${a === 1 ? '' : a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0$ with the quadratic formula gives $\\;x = ${formulaTex}$. Simplify.`,
    parts: [
      { type: 'custom', label: `Simplify $\\sqrt{${D}}$`, check: checkRad, preview, keys: ['√', 'i'], placeholder: 'e.g. 4√3', answerTex: `$${radTex(ansRad)}$` },
      { type: 'custom', label: '$x =$ (fully simplified)', check: checkFinal, preview, keys: KEYS, placeholder: 'e.g. (3 ± 2√5)/2', answerTex: `$${finalTex}$`,
        help: 'Type ± with the button or as +-. Type sqrt for √. If there is a fraction, put the numerator in parentheses.' },
    ],
    solution: steps.join('<br>'),
    _check: { a, b, c, D, A, B, r, d, im },
  };
}
