// Accelerated Algebra II, 2.1 and 2.2: imaginary and complex numbers.
//  1. Square roots of negative numbers
//  2. Powers of i
//  3. Adding, subtracting, multiplying and dividing complex numbers
import { F, randInt, pick, nonzero, gcd } from '../../math.js?v=2.3';
import { splitSquare, complexChecker, complexPreview } from './solveutil.js?v=2.3';

const GROUP = 'Unit 2 - Complex Numbers';
const KEYS = ['i', '√', '(', ')', '/'];

// tex for a + bi with Frac parts
function cTex(re, im) {
  const imT = im.isZero() ? '' : `${im.abs().eq(1) ? '' : im.abs().tex()}i`;
  if (re.isZero()) return im.isZero() ? '0' : `${im.sign() < 0 ? '-' : ''}${imT}`;
  return `${re.tex()}${im.isZero() ? '' : (im.sign() < 0 ? ' - ' : ' + ') + imT}`;
}
// tex for k√r (r squarefree) with an optional i
function radTex(k, r, i) {
  const kk = Math.abs(k), sign = k < 0 ? '-' : '';
  if (r === 1) return `${sign}${kk === 1 && i ? '' : kk}${i ? 'i' : ''}`;
  return `${sign}${kk === 1 ? '' : kk}${i ? 'i' : ''}\\sqrt{${r}}`;
}
const cPar = (re, im) => `\\left(${cTex(re, im)}\\right)`;

// =====================================================================
// 1. Square roots of negative numbers
// =====================================================================
export const sqrtNegatives = {
  id: 'sqrt-negatives',
  course: ['accel'],
  group: GROUP,
  lesson: '2.1',
  title: 'Square Roots of Negative Numbers',
  blurb: 'Rewrite square roots of negative numbers using i, and simplify.',
  levels: {
    1: { name: 'Easy', desc: 'Perfect squares, like √−81 or 4√−49' },
    2: { name: 'Medium', desc: 'Simplify the radical too, like 6√−32' },
    3: { name: 'Challenging', desc: 'Combine with other terms, like 2i + √−9 or 3 + √−20' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const items = [oneSqrt(level, rng), oneSqrt(level, rng)];
      if (items.some(x => !x) || items[0].tex === items[1].tex) continue;
      return {
        tag: level === 1 ? 'perfect squares' : level === 2 ? 'simplify the radical' : 'combine terms',
        prompt: 'Simplify completely. Write your answers using $i$.',
        parts: items.map(it => ({ type: 'custom', label: `$${it.tex} =$`, check: complexChecker(it.value), preview: complexPreview, keys: KEYS, placeholder: 'e.g. 6i√2', answerTex: `$${it.ans}$`, help: 'Type √ with the button or as sqrt, like 6isqrt(2) or 6i√2.' })),
        solution: items.map(it => it.why).join('<br>'),
        _check: { items: items.map(it => [it.tex, it.value]) },
      };
    }
    throw new Error('sqrt-negatives: could not build');
  },
};

function oneSqrt(level, rng) {
  const c = level === 1 ? pick(rng, [1, 1, -1, 2, 3, 4, -2]) : pick(rng, [1, 2, 3, 4, 6, -2, -3, -1]);
  const cT = c === 1 ? '' : c === -1 ? '-' : String(c);
  let n;
  if (level === 1) n = Math.pow(randInt(rng, 2, 12), 2);
  else { const { k, r } = splitSquare(n = pick(rng, [8, 12, 18, 20, 24, 27, 28, 32, 45, 48, 50, 54, 63, 72, 75, 80, 98])); if (r === 1 || k === 1) return null; }
  const { k, r } = splitSquare(n);
  const coef = c * k;
  const core = radTex(coef, r, true);
  const imVal = coef * Math.sqrt(r);
  const step1 = `$${cT}\\sqrt{-${n}} = ${cT}\\sqrt{-1}\\cdot\\sqrt{${n}} = ${cT}${c === 1 || c === -1 ? '' : '\\cdot '}i\\sqrt{${n}}$`;
  const step2 = r === 1 ? `$\\sqrt{${n}} = ${k}$` : `$\\sqrt{${n}} = \\sqrt{${k * k}}\\cdot\\sqrt{${r}} = ${k}\\sqrt{${r}}$`;
  if (level < 3) {
    return { tex: `${cT}\\sqrt{-${n}}`, value: [0, imVal], ans: core, why: `${step1}, and ${step2}, so $${cT}\\sqrt{-${n}} = ${core}$.` };
  }
  // combine with a real number, or with an imaginary term when the radical is a perfect square
  if (r === 1 || rng() < 0.35) {
    const m = Math.pow(randInt(rng, 2, 10), 2), kk = Math.sqrt(m), b = nonzero(rng, -6, 6);
    const total = b + kk;
    if (total === 0) return null;
    const tex = `${b === 1 ? '' : b === -1 ? '-' : b}i + \\sqrt{-${m}}`;
    return { tex, value: [0, total], ans: radTex(total, 1, true), why: `$\\sqrt{-${m}} = ${kk}i$, so $${tex} = ${b}i + ${kk}i = ${radTex(total, 1, true)}$ (combine like terms).` };
  }
  const a = nonzero(rng, -10, 10);
  const tex = `${a} ${c < 0 ? '-' : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}\\sqrt{-${n}}`;
  const ans = `${a} ${coef < 0 ? '-' : '+'} ${radTex(Math.abs(coef), r, true)}`;
  return { tex, value: [a, imVal], ans, why: `${step2}, so $${Math.abs(c) === 1 ? '' : Math.abs(c)}\\sqrt{-${n}} = ${radTex(Math.abs(coef), r, true)}$. The real part $${a}$ stays as it is: $${ans}$.` };
}

// =====================================================================
// 2. Powers of i
// =====================================================================
export const powersOfI = {
  id: 'powers-of-i',
  course: ['accel'],
  group: GROUP,
  lesson: '2.1',
  title: 'Powers of i',
  blurb: 'Use the repeating pattern i, -1, -i, 1 to simplify powers of i.',
  levels: {
    1: { name: 'Easy', desc: 'One power, like i¹⁵' },
    2: { name: 'Medium', desc: 'Products, like i²⁷ · i⁷' },
    3: { name: 'Challenging', desc: 'Sums and differences, like i⁴⁷ + i¹⁸' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const items = [onePower(level, rng), onePower(level, rng)];
      if (items[0].tex === items[1].tex) continue;
      return {
        tag: level === 1 ? 'single power' : level === 2 ? 'products' : 'sums and differences',
        prompt: 'Simplify.',
        parts: items.map(it => ({ type: 'custom', label: `$${it.tex} =$`, check: complexChecker(it.value), preview: complexPreview, keys: ['i', '-'], placeholder: 'e.g. -i', answerTex: `$${it.ans}$` })),
        solution: `The powers of $i$ repeat every 4: $i^1 = i,\\ i^2 = -1,\\ i^3 = -i,\\ i^4 = 1$. Divide the exponent by 4 and use the remainder (a remainder of 0 means the answer is 1).<br>` + items.map(it => it.why).join('<br>'),
        _check: { items: items.map(it => [it.tex, it.value]) },
      };
    }
    throw new Error('powers-of-i: could not build');
  },
};
const IP = [[1, 0], [0, 1], [-1, 0], [0, -1]];                  // i^0..i^3
const IT = ['1', 'i', '-1', '-i'];
const powWhy = n => `$${n} = 4\\cdot ${Math.floor(n / 4)} + ${n % 4}$, so $i^{${n}} = ${n % 4 === 0 ? '1' : `i^{${n % 4}}`}${n % 4 === 0 ? '' : ` = ${IT[n % 4]}`}$`;
function onePower(level, rng) {
  if (level === 1) { const n = randInt(rng, 5, 99); return { tex: `i^{${n}}`, value: IP[n % 4], ans: IT[n % 4], why: powWhy(n) + '.' }; }
  if (level === 2) {
    const m = randInt(rng, 3, 60), n = randInt(rng, 3, 60), s = m + n;
    return { tex: `i^{${m}}\\cdot i^{${n}}`, value: IP[s % 4], ans: IT[s % 4], why: `Add the exponents: $i^{${m}}\\cdot i^{${n}} = i^{${s}}$, and ${powWhy(s)}.` };
  }
  const m = randInt(rng, 3, 70), n = randInt(rng, 3, 70), sub = rng() < 0.4;
  const A = IP[m % 4], B = IP[n % 4];
  const v = [A[0] + (sub ? -B[0] : B[0]), A[1] + (sub ? -B[1] : B[1])];
  const ans = cTex(F(v[0]), F(v[1]));
  return { tex: `i^{${m}} ${sub ? '-' : '+'} i^{${n}}`, value: v, ans, why: `${powWhy(m)}; ${powWhy(n)}. So $i^{${m}} ${sub ? '-' : '+'} i^{${n}} = ${IT[m % 4]} ${sub ? '-' : '+'} ${/^-/.test(IT[n % 4]) ? `(${IT[n % 4]})` : IT[n % 4]} = ${ans}$.` };
}

// =====================================================================
// 3. Operations with complex numbers
// =====================================================================
export const complexOps = {
  id: 'complex-operations',
  course: ['accel'],
  group: GROUP,
  lesson: '2.2',
  title: 'Operations with Complex Numbers',
  blurb: 'Add, subtract, multiply and divide complex numbers. Answers go in a + bi form.',
  levels: {
    1: { name: 'Easy', desc: 'Adding and subtracting, like (5 − 2i) − (3 + 7i)' },
    2: { name: 'Medium', desc: 'Multiplying, including conjugates, like (3 − 2i)(3 + 7i)' },
    3: { name: 'Challenging', desc: 'Dividing by multiplying by the conjugate, like (4 + 3i)/(1 − 2i)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) {
      const items = [oneOp(level, rng), oneOp(level, rng)];
      if (items.some(x => !x) || items[0].tex === items[1].tex) continue;
      return {
        tag: level === 1 ? 'add and subtract' : level === 2 ? 'multiply' : 'divide',
        prompt: 'Simplify. Write each answer in the form $a + bi$.',
        parts: items.map(it => ({ type: 'custom', label: `$${it.tex} =$`, check: complexChecker(it.value), preview: complexPreview, keys: KEYS, placeholder: level === 3 ? 'e.g. -2/5 + 11/5i' : 'e.g. 23 + 15i', answerTex: `$${it.ans}$`, help: level === 3 ? 'Fractions are fine, like -2/5 + 11/5i or (-2 + 11i)/5.' : '' })),
        solution: items.map(it => it.why).join('<br>'),
        _check: { items: items.map(it => [it.tex, it.value]) },
      };
    }
    throw new Error('complex-operations: could not build');
  },
};

function oneOp(level, rng) {
  const r = () => F(randInt(rng, -9, 12)), im = () => F(nonzero(rng, -12, 12));
  if (level === 1) {
    const kind = pick(rng, ['+', '-', '-', 'mixed']);
    const [a, b, c, d] = [r(), im(), r(), im()];
    if (kind === 'mixed') {                                         // 4i + (5 - 12i)
      const re = c, imv = b.add(d);
      return { tex: `${b.eq(1) ? '' : b.eq(-1) ? '-' : b.tex()}i + ${cPar(c, d)}`, value: [re.value(), imv.value()], ans: cTex(re, imv), why: `Combine real parts and imaginary parts: real $${c.tex()}$, imaginary $${b.tex()} + ${d.sign() < 0 ? `(${d.tex()})` : d.tex()} = ${imv.tex()}$. Answer: $${cTex(re, imv)}$.` };
    }
    const sgn = kind === '+' ? 1 : -1;
    const re = a.add(c.mul(sgn)), imv = b.add(d.mul(sgn));
    const op = kind === '+' ? '+' : '-';
    return {
      tex: `${cPar(a, b)} ${op} ${cPar(c, d)}`, value: [re.value(), imv.value()], ans: cTex(re, imv),
      why: (sgn < 0 ? `Distribute the minus sign: $${cTex(a, b)} ${c.sign() > 0 ? '-' : '+'} ${c.abs().tex()} ${d.sign() > 0 ? '-' : '+'} ${d.abs().tex()}i$. ` : '')
        + `Real parts: $${a.tex()} ${sgn > 0 ? '+' : '-'} ${c.sign() < 0 ? `(${c.tex()})` : c.tex()} = ${re.tex()}$. Imaginary parts: $${b.tex()} ${sgn > 0 ? '+' : '-'} ${d.sign() < 0 ? `(${d.tex()})` : d.tex()} = ${imv.tex()}$. Answer: $${cTex(re, imv)}$.`,
    };
  }
  if (level === 2) {
    const kind = pick(rng, ['scalar', 'foil', 'foil', 'conj']);
    if (kind === 'scalar') {
      const k = F(nonzero(rng, -6, 6)), a = F(nonzero(rng, -9, 12)), b = im();
      const re = k.mul(a), imv = k.mul(b);
      return { tex: `${k.tex()}${cPar(a, b)}`, value: [re.value(), imv.value()], ans: cTex(re, imv), why: `Distribute: $${k.tex()}\\cdot ${a.sign() < 0 ? `(${a.tex()})` : a.tex()} = ${re.tex()}$ and $${k.tex()}\\cdot ${b.sign() < 0 ? `(${b.tex()})` : b.tex()}i = ${imv.tex()}i$. Answer: $${cTex(re, imv)}$.` };
    }
    const a = F(nonzero(rng, -7, 8)), b = F(nonzero(rng, -7, 7));
    const [c, d] = kind === 'conj' ? [a, b.neg()] : [F(nonzero(rng, -7, 8)), F(nonzero(rng, -7, 7))];
    const re = a.mul(c).sub(b.mul(d)), imv = a.mul(d).add(b.mul(c));
    const bd = b.mul(d);
    return {
      tex: `${cPar(a, b)}${cPar(c, d)}`, value: [re.value(), imv.value()], ans: cTex(re, imv),
      why: `Multiply every term (FOIL): $${a.mul(c).tex()} ${a.mul(d).sign() < 0 ? '-' : '+'} ${a.mul(d).abs().tex()}i ${b.mul(c).sign() < 0 ? '-' : '+'} ${b.mul(c).abs().tex()}i ${bd.sign() < 0 ? '-' : '+'} ${bd.abs().tex()}i^2$. `
        + `Since $i^2 = -1$, the last term is $${bd.neg().tex()}$. Combine: $${cTex(re, imv)}$.` + (kind === 'conj' ? ' (Conjugates: the imaginary parts cancel, leaving $a^2 + b^2$.)' : ''),
    };
  }
  // divide: (a + bi)/(c + di) or (a + bi)/(di)
  const a = F(randInt(rng, -8, 8)), b = F(nonzero(rng, -8, 8));
  if (rng() < 0.25) {
    const d = F(nonzero(rng, -5, 5));
    // (a + bi)/(di) = (a + bi)(-i)/(d) ... = b/d - (a/d) i
    const re = b.div(d), imv = a.neg().div(d);
    return {
      tex: `\\dfrac{${cTex(a, b)}}{${d.eq(1) ? '' : d.eq(-1) ? '-' : d.tex()}i}`, value: [re.value(), imv.value()], ans: cTex(re, imv),
      why: `Multiply top and bottom by $i$: the bottom becomes $${d.tex()}i^2 = ${d.neg().tex()}$, and the top becomes $${a.isZero() ? '' : `${a.tex()}i`} ${b.sign() < 0 ? '-' : '+'} ${b.abs().tex()}i^2 = ${b.neg().tex()} ${a.sign() < 0 ? '-' : '+'} ${a.abs().tex()}i$. Divide each part by $${d.neg().tex()}$: $${cTex(re, imv)}$.`,
    };
  }
  const c = F(nonzero(rng, -6, 7)), d = F(nonzero(rng, -5, 5));
  const den = c.mul(c).add(d.mul(d));
  const nre = a.mul(c).add(b.mul(d)), nim = b.mul(c).sub(a.mul(d));      // (a+bi)(c-di)
  const re = nre.div(den), imv = nim.div(den);
  if (den.n > 50) return null;
  const g = gcd(gcd(Math.abs(nre.n), Math.abs(nim.n)), den.n);
  return {
    tex: `\\dfrac{${cTex(a, b)}}{${cTex(c, d)}}`, value: [re.value(), imv.value()], ans: cTex(re, imv),
    why: `Multiply top and bottom by the conjugate $${cTex(c, d.neg())}$. Bottom: $${cPar(c, d)}${cPar(c, d.neg())} = ${c.sign() < 0 ? `(${c.tex()})` : c.tex()}^2 + ${d.abs().tex()}^2 = ${den.tex()}$. `
      + `Top: $${cPar(a, b)}${cPar(c, d.neg())} = ${cTex(nre, nim)}$. So the quotient is $\\dfrac{${cTex(nre, nim)}}{${den.tex()}} = ${cTex(re, imv)}$${g > 1 ? ' (after reducing)' : ''}.`,
  };
}
