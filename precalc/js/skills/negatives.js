// Skill: Carrying negative signs (prerequisite drills built from Unit 1 errors)
import { F, Frac, randInt, pick, nonzero, paren, factorTex } from '../math.js';

export const skill = {
  id: 'negatives',
  title: 'Carrying Negative Signs',
  group: 'Prerequisite skills',
  blurb: 'Products, substitution and asymptotes where a single dropped negative changes the answer.',
  levels: {
    1: { name: 'Easy', desc: 'Integer arithmetic with negatives' },
    2: { name: 'Medium', desc: 'Substitute, simplify and solve two-step equations' },
    3: { name: 'Challenging', desc: 'Signs inside rational functions and end behavior' },
  },
  generate(level, rng) {
    const pool = level === 1 ? [intProduct, intCombo, intQuotient, intSubtract]
      : level === 2 ? [subPoly, subRational, twoStep, negSquare]
      : [haLeadingNeg, endBehaviorReversed, holeValueNeg];
    return pick(rng, pool)(rng);
  },
};

const num = (label, answer, extra = {}) => ({ type: 'number', label, answer, ...extra });

// ---------------- Level 1 ----------------
function intProduct(rng) {
  const a = nonzero(rng, -9, 9), b = nonzero(rng, -9, -2), c = pick(rng, [null, nonzero(rng, -5, 5)]);
  let ans = a * b, tex = `${a}\\left(${b}\\right)`, sol = `$${a} \\cdot ${paren(b)} = ${ans}$`;
  if (c !== null) {
    ans = a * b * c; tex += `\\left(${c}\\right)`;
    sol = `$${a} \\cdot ${paren(b)} = ${a * b}$, then $${a * b} \\cdot ${paren(c)} = ${ans}$.`;
  }
  const negs = [a, b, c].filter(x => x !== null && x < 0).length;
  return {
    tag: 'integer product',
    prompt: `Evaluate $${tex}$.`,
    parts: [num('Value', ans)],
    solution: `${sol}<br>There ${negs === 1 ? 'is 1 negative factor' : `are ${negs} negative factors`}, so the product is ${negs % 2 ? 'negative' : 'positive'}.`,
  };
}

function intCombo(rng) {
  // -m(v) + k  (the #17 pattern)
  const m = nonzero(rng, -5, -2), v = nonzero(rng, -9, 9), k = nonzero(rng, -9, 9);
  const ans = m * v + k;
  return {
    tag: 'multiply then add',
    prompt: `Evaluate $${m}\\left(${v}\\right) ${k < 0 ? '-' : '+'} ${Math.abs(k)}$.`,
    parts: [num('Value', ans)],
    solution: `Multiply first: $${m} \\cdot ${paren(v)} = ${m * v}$.<br>Then add: $${m * v} ${k < 0 ? '-' : '+'} ${Math.abs(k)} = ${ans}$.`,
  };
}

function intQuotient(rng) {
  const q = nonzero(rng, -9, 9), b = nonzero(rng, -9, 9) * (rng() < 0.6 ? -1 : 1) || -3;
  const a = q * b;
  return {
    tag: 'integer quotient',
    prompt: `Evaluate $\\dfrac{${a}}{${b}}$.`,
    parts: [num('Value', q)],
    solution: `$${Math.abs(a)} \\div ${Math.abs(b)} = ${Math.abs(q)}$. The signs ${(a < 0) === (b < 0) ? 'match, so the quotient is positive' : 'differ, so the quotient is negative'}: $${q}$.`,
  };
}

function intSubtract(rng) {
  const a = randInt(rng, -12, 12), b = nonzero(rng, -12, -1), c = nonzero(rng, -9, 9);
  const ans = a - b - c;
  return {
    tag: 'subtracting negatives',
    prompt: `Evaluate $${a} - \\left(${b}\\right) ${c < 0 ? '- \\left(' + c + '\\right)' : '- ' + c}$.`,
    parts: [num('Value', ans)],
    solution: `Subtracting a negative is adding its opposite: $${a} - ${paren(b)} = ${a} + ${-b} = ${a - b}$.<br>Then $${a - b} - ${paren(c)} = ${ans}$.`,
  };
}

// ---------------- Level 2 ----------------
function subPoly(rng) {
  const a = nonzero(rng, -4, 4), b = nonzero(rng, -6, 6), c = randInt(rng, -9, 9), x = nonzero(rng, -5, -1);
  const ans = a * x * x + b * x + c;
  const poly = `${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x ${c === 0 ? '' : (c < 0 ? '- ' : '+ ') + Math.abs(c)}`;
  return {
    tag: 'substitute into polynomial',
    prompt: `Let $f(x) = ${poly}$. Find $f(${x})$.`,
    parts: [num(`$f(${x})$`, ans)],
    solution: `Substitute with parentheses: $f(${x}) = ${a}${paren(x)}^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}${paren(x)} ${c === 0 ? '' : (c < 0 ? '- ' : '+ ') + Math.abs(c)}$<br>`
      + `$${paren(x)}^2 = ${x * x}$, so this is $${a * x * x} ${b * x < 0 ? '-' : '+'} ${Math.abs(b * x)} ${c === 0 ? '' : (c < 0 ? '- ' : '+ ') + Math.abs(c)} = ${ans}$.`,
  };
}

function subRational(rng) {
  // h(c) = a(c - p)(c - q) / (b(c - r)), evaluated at a negative c   (the #15 pattern)
  let a, b, p, q, r, c;
  do {
    a = nonzero(rng, -8, 8); b = nonzero(rng, -5, 5); c = nonzero(rng, -6, -1);
    p = randInt(rng, -6, 7); q = randInt(rng, -6, 7); r = randInt(rng, -6, 7);
  } while (c === r || c === p || c === q || Math.abs(a * (c - p) * (c - q)) > 400);
  const top = a * (c - p) * (c - q), bot = b * (c - r);
  const ans = F(top, bot);
  const expr = `\\dfrac{${a}${factorTex(p)}${factorTex(q)}}{${b}${factorTex(r)}}`;
  return {
    tag: 'substitute into rational',
    prompt: `Evaluate $${expr}$ when $x = ${c}$. Give an exact answer (a fraction is fine).`,
    parts: [num('Value', ans)],
    solution: `Numerator: $${a}${paren(c - p)}${paren(c - q)} = ${top}$.<br>Denominator: $${b}${paren(c - r)} = ${bot}$.<br>`
      + `So the value is $\\dfrac{${top}}{${bot}} = ${ans.tex()}$.`,
  };
}

function twoStep(rng) {
  // g = m*y + k, solve for y (the #17 backward pattern)
  const m = nonzero(rng, -5, -2), y = nonzero(rng, -9, 9), k = nonzero(rng, -9, 9);
  const g = m * y + k;
  return {
    tag: 'two-step equation',
    prompt: `Solve for $y$: $\\; ${g} = ${m}y ${k < 0 ? '-' : '+'} ${Math.abs(k)}$`,
    parts: [num('$y$', y)],
    solution: `Undo the ${k < 0 ? 'subtraction' : 'addition'} first: $${g} ${k < 0 ? '+' : '-'} ${Math.abs(k)} = ${g - k}$, so $${g - k} = ${m}y$.<br>`
      + `Then divide by $${m}$: $y = \\dfrac{${g - k}}{${m}} = ${y}$.`,
  };
}

function negSquare(rng) {
  const x = nonzero(rng, -6, -2), k = nonzero(rng, -5, 5);
  const form = pick(rng, ['neg', 'paren']);
  const ans = form === 'neg' ? -(x * x) + k * x : (x * x) + k * x;
  const tex = form === 'neg' ? `-x^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}x` : `(-x)^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}x`;
  const first = form === 'neg' ? `-x^2 = -\\left(${paren(x)}^2\\right) = -${x * x}` : `(-x)^2 = \\left(-${paren(x)}\\right)^2 = ${paren(-x)}^2 = ${x * x}`;
  return {
    tag: 'exponent with negatives',
    prompt: `Evaluate $${tex}$ when $x = ${x}$.`,
    parts: [num('Value', ans)],
    solution: `The exponent applies before the leading negative unless parentheses say otherwise.<br>$${first}$.<br>`
      + `$${k}x = ${k}${paren(x)} = ${k * x}$.<br>Total: $${form === 'neg' ? -(x * x) : x * x} ${k * x < 0 ? '-' : '+'} ${Math.abs(k * x)} = ${ans}$.`,
  };
}

// ---------------- Level 3 ----------------
function haLeadingNeg(rng) {
  // f(x) = -(a x + p)(c - x) / (d (x - r)(x - s))  -> HA from product of leading coefficients
  const a = nonzero(rng, 1, 4), p = nonzero(rng, -6, 6), c = nonzero(rng, 1, 9);
  const d = nonzero(rng, 2, 6), r = randInt(rng, -5, 5), s = randInt(rng, -5, 5);
  const lead = pick(rng, [-1, 1]);
  const reversed = rng() < 0.7;
  const second = reversed ? `(${c} - x)` : factorTex(c);
  const numLead = lead * a * (reversed ? -1 : 1);
  const ans = F(numLead, d);
  const first = `(${a === 1 ? '' : a}x ${p < 0 ? '-' : '+'} ${Math.abs(p)})`;
  const tex = `f(x) = ${lead < 0 ? '-' : ''}\\dfrac{${first}${second}}{${d}${factorTex(r)}${factorTex(s)}}`;
  return {
    tag: 'HA with negatives',
    prompt: `Find the horizontal asymptote of $${tex}$.`,
    parts: [num('$y =$', ans)],
    solution: `Both numerator and denominator have degree 2, so the asymptote is the ratio of leading coefficients.<br>`
      + `Numerator leading coefficient: ${lead < 0 ? '$-1$ (the negative out front)' : '$1$'} $\\times$ $${a}$ ${reversed ? `$\\times$ $(-1)$ from $(${c} - x)$` : `$\\times$ $1$`} $= ${numLead}$.<br>`
      + `Denominator leading coefficient: $${d}$.<br>So $y = \\dfrac{${numLead}}{${d}} = ${ans.tex()}$.`,
  };
}

function endBehaviorReversed(rng) {
  const deg = pick(rng, [3, 4]);
  const k = nonzero(rng, 2, 12);
  const roots = [];
  while (roots.length < deg - 1) { const r = randInt(rng, -6, 6); if (!roots.includes(r)) roots.push(r); }
  const reversed = rng() < 0.75;
  const lead = reversed ? -1 : 1;
  const factors = (reversed ? `(${k} - x)` : factorTex(k)) + roots.map(r => factorTex(r)).join('');
  const right = lead > 0 ? '\\infty' : '-\\infty';
  const left = (deg % 2 === 0 ? lead : -lead) > 0 ? '\\infty' : '-\\infty';
  const choices = ['$\\infty$', '$-\\infty$'];
  return {
    tag: 'end behavior sign',
    prompt: `Let $p(x) = ${factors}$. Complete each limit.`,
    parts: [
      { type: 'mc', label: '$\\displaystyle\\lim_{x \\to -\\infty} p(x) =$', choices, answer: left === '\\infty' ? 0 : 1 },
      { type: 'mc', label: '$\\displaystyle\\lim_{x \\to \\infty} p(x) =$', choices, answer: right === '\\infty' ? 0 : 1 },
    ],
    solution: `Degree: ${deg} factors with one $x$ each, so degree $${deg}$ (${deg % 2 ? 'odd' : 'even'}).<br>`
      + `Leading coefficient: ${reversed ? `$(${k} - x)$ contributes $-x$, so the leading coefficient is $-1$` : 'every factor starts with $+x$, so it is $1$'}.<br>`
      + `${deg % 2 ? 'Odd' : 'Even'} degree with ${lead < 0 ? 'negative' : 'positive'} leading coefficient: as $x \\to -\\infty$, $p \\to ${left}$; as $x \\to \\infty$, $p \\to ${right}$.`,
  };
}

function holeValueNeg(rng) {
  // h(x) = a(x - p)(x - q) / (b(x - q)(x - r)), hole at x = q (negative)
  let a, b, p, q, r;
  do {
    a = nonzero(rng, -9, 9); b = nonzero(rng, -5, 5); q = nonzero(rng, -6, -1);
    p = randInt(rng, -6, 7); r = randInt(rng, -6, 7);
  } while (p === q || r === q || p === r);
  const y = F(a * (q - p), b * (q - r));
  return {
    tag: 'hole value with negatives',
    prompt: `The graph of $h(x) = \\dfrac{${a}${factorTex(p)}${factorTex(q)}}{${b}${factorTex(q)}${factorTex(r)}}$ has a hole. Find its coordinates.`,
    parts: [{ type: 'point', label: 'Hole', answer: [F(q), y], placeholder: '(x, y)' }],
    solution: `$${factorTex(q)}$ cancels, so the hole is at $x = ${q}$.<br>Use the simplified form $\\dfrac{${a}${factorTex(p)}}{${b}${factorTex(r)}}$:<br>`
      + `$\\dfrac{${a}${paren(q - p)}}{${b}${paren(q - r)}} = \\dfrac{${a * (q - p)}}{${b * (q - r)}} = ${y.tex()}$.<br>The hole is at $\\left(${q},\\ ${y.tex()}\\right)$.`,
  };
}
