// Skill: Leading coefficients and hole values in factored rational functions.
// Every function has equal degree on top and bottom (so the HA is a ratio of leading
// coefficients) and exactly one hole. Negatives appear out front, in constants, and in
// "backwards" factors like (2 - 3x).
import { F, Frac, randInt, pick, nonzero, paren } from '../../math.js?v=2.0';

export const skill = {
  id: 'rational-signs',
  title: 'Leading Coefficients & Hole Values',
  course: 'precalc',
  group: 'Unit 1: Rational functions',
  blurb: 'Find the horizontal asymptote and the hole of a factored rational function without losing a negative.',
  levels: {
    1: { name: 'Easy', desc: 'Factors in standard form, with negatives out front and in constants' },
    2: { name: 'Medium', desc: 'Some factors written backwards, like (2 - 3x)' },
    3: { name: 'Challenging', desc: 'Backwards factors with exponents' },
  },
  generate(level, rng) {
    for (let tries = 0; tries < 400; tries++) {
      const p = build(level, rng);
      if (p) return p;
    }
    throw new Error('rational-signs: could not build a problem');
  },
};

// A linear factor a*x + b (integers, a != 0, b != 0, gcd 1), raised to m.
const root = f => F(-f.b, f.a);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

function factorTex(f) {
  const ax = Math.abs(f.a) === 1 ? 'x' : `${Math.abs(f.a)}x`;
  let core;
  if (f.a > 0) core = `(${f.a === 1 ? '' : f.a}x ${f.b < 0 ? '-' : '+'} ${Math.abs(f.b)})`;
  else core = `(${f.b} - ${ax})`; // backwards: b - |a|x
  return f.m > 1 ? `${core}^{${f.m}}` : core;
}
const evalAt = (f, x) => F(f.a).mul(x).add(f.b).pow(f.m);

function randFactor(rng, { allowRev, a: forceA, used }) {
  for (let t = 0; t < 100; t++) {
    let a = forceA ?? pick(rng, [1, 1, 1, 2, 3, 1, 2, 4, 5]);
    const b = nonzero(rng, -9, 9);
    if (gcd(a, b) !== 1) continue;
    if (allowRev && rng() < 0.5) a = -a;
    if (a < 0 && b < 0) continue; // backwards factors always look like (5 - 2x), never (-5 - 2x)
    const f = { a, b, m: 1 };
    const r = root(f);
    if (used.some(u => u.eq(r))) continue;
    used.push(r);
    return f;
  }
  return null;
}

function build(level, rng) {
  const used = [];
  const h = nonzero(rng, -7, 7);
  used.push(F(h));
  // shared factor (x - h); on Medium/Challenging the bottom copy is sometimes written (h - x)
  const sharedTop = { a: 1, b: -h, m: 1 };
  const flipShared = level >= 2 && h > 0 && rng() < 0.5;
  const sharedBot = flipShared ? { a: -1, b: h, m: 1 } : { a: 1, b: -h, m: 1 };

  const allowRev = level >= 2;
  const num = [], den = [];
  if (level === 1) {
    const k = pick(rng, [1, 1, 2]);
    for (let i = 0; i < k; i++) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; num.push(f); }
    for (let i = 0; i < k; i++) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; den.push(f); }
  } else if (level === 2) {
    const k = pick(rng, [1, 2, 2]);
    for (let i = 0; i < k; i++) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; num.push(f); }
    for (let i = 0; i < k; i++) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; den.push(f); }
    if (![...num, ...den].some(f => f.a < 0)) {
      const all = [...num, ...den]; const f = pick(rng, all); f.a = -f.a;
      if (f.b < 0) f.b = -f.b; // keep the backwards form readable, e.g. (3 - 2x)
      used.length = 0; used.push(F(h), ...all.map(root));
      if (new Set(used.map(u => u.text())).size !== used.length) return null;
    }
  } else {
    // exponents: pick degree split so total degree matches, e.g. top x^2 * x, bottom x^3
    const shapes = [[[2], [1, 1]], [[2, 1], [3]], [[3], [2, 1]], [[2], [2]], [[1, 2], [1, 1, 1]], [[3], [1, 2]]];
    const [ms, ns] = pick(rng, shapes);
    for (const m of ms) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; f.m = m; num.push(f); }
    for (const n of ns) { const f = randFactor(rng, { allowRev, used }); if (!f) return null; f.m = n; den.push(f); }
    // at least one backwards factor carries an exponent
    if (!num.concat(den).some(f => f.a < 0 && f.m > 1)) {
      const f = pick(rng, num.concat(den).filter(f => f.m > 1));
      f.a = -f.a; if (f.b < 0) f.b = -f.b;
      const rs = [F(h), ...num.concat(den).map(root)];
      if (new Set(rs.map(u => u.text())).size !== rs.length) return null;
    }
    // keep coefficients readable once raised to powers
    if (num.concat(den).some(f => Math.abs(f.a) ** f.m > 64)) return null;
  }

  const leadNeg = rng() < (level === 1 ? 0.7 : 0.55);
  const K = level === 1 ? pick(rng, [1, 1, 2, 3, -2, -1, 4, 5]) : pick(rng, [1, 1, 2, 3, -1, -2, -3, 4]);
  const D = pick(rng, [1, 1, 2, 3, 4, 5, -2, -3]);
  // a function with no negatives anywhere misses the point of the skill
  if (!leadNeg && K > 0 && D > 0 && !num.concat(den).some(f => f.a < 0 || f.b < 0)) return null;

  // degrees must match
  const deg = fs => fs.reduce((s, f) => s + f.m, 1);
  if (deg(num) !== deg(den)) return null;

  // Leading coefficient ratio
  const sgn = leadNeg ? -1 : 1;
  const leadNum = num.reduce((p, f) => p * f.a ** f.m, sgn * K * sharedTop.a);
  const leadDen = den.reduce((p, f) => p * f.a ** f.m, D * sharedBot.a);
  const HA = F(leadNum, leadDen);

  // Hole value: cancel shared factors (their ratio is +1 or -1), evaluate the rest at x = h
  const ratio = sharedTop.a / sharedBot.a; // 1, or -1 when written (x - h) over (h - x)
  let top = F(sgn * K * ratio), bot = F(D);
  for (const f of num) top = top.mul(evalAt(f, F(h)));
  for (const f of den) bot = bot.mul(evalAt(f, F(h)));
  if (bot.isZero()) return null;
  const holeY = top.div(bot);
  if (Math.abs(holeY.n) > 400 || holeY.d > 150 || Math.abs(HA.n) > 200 || HA.d > 60) return null;

  // ----- display -----
  const kTex = Math.abs(K) === 1 ? (K < 0 ? '-' : '') : String(K);
  const dTex = D === 1 ? '' : D === -1 ? '-' : String(D);
  const topTex = kTex + [sharedTop, ...num].map(factorTex).join('');
  const botFactors = rng() < 0.5 ? [sharedBot, ...den] : [...den, sharedBot];
  const botTex = dTex + botFactors.map(factorTex).join('');
  const fTex = `f(x) = ${leadNeg ? '-' : ''}\\dfrac{${topTex}}{${botTex}}`;

  // ----- solution text -----
  const coefPieces = (sign, c, fs, sh) => {
    const parts = [];
    if (sign < 0) parts.push('(-1)');
    if (c !== 1) parts.push(paren(c));
    if (sh && sh.a !== 1) parts.push(paren(sh.a));
    for (const f of fs) if (f.a !== 1 || f.m > 1) parts.push(f.m > 1 ? `${paren(f.a)}^{${f.m}}` : paren(f.a));
    return parts.length ? parts.join('\\cdot ') : '1';
  };
  const backwards = num.concat(den, flipShared ? [sharedBot] : []).filter(f => f.a < 0);
  const note = backwards.length
    ? `Backwards factors like $${factorTex({ ...backwards[0], m: 1 })}$ have a negative leading coefficient ($${backwards[0].a === -1 ? '-' : backwards[0].a}x$).`
      + (num.concat(den).some(f => f.a < 0 && f.m > 1) ? ' Raise it to the power along with the factor: an even power makes it positive, an odd power keeps it negative.' : '') + '<br>'
    : '';
  const holeSub = (fs) => fs.map(f => `\\left(${F(f.a).mul(h).add(f.b).tex()}\\right)${f.m > 1 ? '^{' + f.m + '}' : ''}`).join('');
  const solution =
    `<b>Horizontal asymptote.</b> Top and bottom both have degree ${deg(num)}, so $y$ is the ratio of the leading coefficients.<br>`
    + note
    + `Top: $${coefPieces(sgn, K, num, null)} = ${leadNum}$${leadNeg ? ' (including the negative out front)' : ''}.<br>`
    + `Bottom: $${coefPieces(1, D, den, sharedBot)} = ${leadDen}$.<br>`
    + `So $y = \\dfrac{${leadNum}}{${leadDen}} = ${HA.tex()}$.<br><br>`
    + `<b>Hole.</b> The factor $(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})$ is on top and bottom, so there is a hole at $x = ${h}$.`
    + (flipShared ? ` On the bottom it is written $${factorTex(sharedBot)}$, which equals $-(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})$, so canceling leaves a factor of $-1$.` : '')
    + `<br>Substitute $x = ${h}$ into what is left:<br>`
    + `$${(sgn * K * ratio) < 0 ? '-' : ''}\\dfrac{${Math.abs(K) === 1 ? '' : Math.abs(K) + '\\cdot '}${holeSub(num)}}{${D === 1 ? '' : paren(D) + '\\cdot '}${holeSub(den)}} = ${holeY.tex()}$.<br>`
    + `The hole is at $\\left(${h},\\ ${holeY.tex()}\\right)$.`;

  return {
    tag: level === 1 ? 'HA and hole, standard factors' : level === 2 ? 'HA and hole, backwards factors' : 'HA and hole, backwards factors with exponents',
    prompt: `Consider $${fTex}$.`,
    parts: [
      { type: 'number', label: 'Horizontal asymptote: $y =$', answer: HA },
      { type: 'point', label: 'Hole (as a point)', answer: [F(h), holeY], placeholder: '(x, y)' },
    ],
    solution,
    _check: { num, den, sharedTop, sharedBot, K, D, sgn },
  };
}
