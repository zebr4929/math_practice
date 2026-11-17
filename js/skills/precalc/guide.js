// AP Precalculus Unit 2 study guide skills that had no practice yet:
//  1. Arithmetic and Geometric Sequences (2.1): arithmetic, geometric, or neither
//  2. Exponent Rules as Transformations (2.4)
//  3. Inverse Properties and Log Rules (2.12)
//  4. Change of Base (2.12)
//  5. Log Equations and Inequalities (2.13): quadratic inequalities and log domains
//  6. Exponential Models from Data (2.13): build the model, then solve for the input
import { F, randInt, pick, nonzero, shuffle, gcd } from '../../math.js?v=3.4';
import { parseL, evalL, varsL, logsIn, stripL, previewL, readValue, matches, valueChecker, intervalChecker, LOG_KEYS } from './logexpr.js?v=3.4';
import { logHead } from './logs2.js?v=3.4';
import { solveSet, setTex, asNums, testOp, opT } from './logs3.js?v=3.4';

const SEQ = 'Unit 2 - Sequences and Exponentials';
const LOGS = 'Unit 2 - Logarithms';
const SOLVE = 'Unit 2 - Log Equations and Semi-Log Plots';
const d3 = v => (Math.round(v * 1000) / 1000).toFixed(3);
const VALUE_HELP = 'Exact answers like log_4(50) are fine; decimals rounded to 3 places also count.';
const afterEq = s => (String(s).includes('=') ? String(s).slice(String(s).lastIndexOf('=') + 1) : String(s));
const fracTex = f => (f.isInt() ? String(f.n) : `${f.n < 0 ? '-' : ''}\\tfrac{${Math.abs(f.n)}}{${f.d}}`);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
// multiple choice with the choices shuffled; `correct` is the index of the right one before shuffling
function mcPart(rng, label, choices, correct) {
  const order = shuffle(rng, choices.map((_, i) => i));
  return { type: 'mc', label, choices: order.map(i => choices[i]), answer: order.indexOf(correct) };
}

// =====================================================================
// 1. Arithmetic and Geometric Sequences: arithmetic, geometric, or neither (2.1)
// =====================================================================
export const seqClassify = {
  id: 'seq-classify', course: 'precalc', group: SEQ, lesson: '2.1',
  title: 'Arithmetic and Geometric Sequences',
  blurb: 'Decide whether a sequence is arithmetic, geometric, or neither, and give d or r when it exists.',
  levels: {
    1: { name: 'Easy', desc: 'Whole-number differences and ratios' },
    2: { name: 'Medium', desc: 'Fractions, decimals and negative ratios, like 0.8, −1.2, 1.8, −2.7' },
    3: { name: 'Challenging', desc: 'Look-alikes, like 1, 3, 7, 13 or 2, 6, 18, 36' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildClassify(level, rng); if (p) return p; }
    throw new Error('seq-classify: could not build');
  },
};
const KINDS = ['Arithmetic', 'Geometric', 'Neither'];
function buildClassify(level, rng) {
  const kind = level === 3 ? pick(rng, ['neither', 'neither', 'arith', 'geom']) : pick(rng, ['arith', 'geom', 'neither']);
  let terms, rate = null, style = '';
  if (kind === 'arith') {
    let d, a;
    if (level === 1) { d = F(nonzero(rng, -9, 9)); a = F(randInt(rng, -15, 20)); }
    else { const den = pick(rng, [2, 4, 3, 10]); d = F(nonzero(rng, -9, 9), den); if (d.isInt()) return null; a = F(randInt(rng, -15, 15), den); }
    terms = [0, 1, 2, 3].map(i => a.add(d.mul(i))); rate = d;
  } else if (kind === 'geom') {
    let r, a;
    if (level === 1) { r = F(pick(rng, [2, 3, 4, -2, -3])); a = F(nonzero(rng, -6, 6)); }
    else {
      r = pick(rng, level === 2 ? [F(-3, 2), F(1, 2), F(-1, 2), F(2, 3), F(3, 2), F(5, 2), F(1, 4), F(-2, 3)] : [F(-1), F(-3, 2), F(1, 3), F(-2), F(3, 4)]);
      a = F(nonzero(rng, -6, 6) * Math.pow(r.d, 3));
      if (rng() < 0.5 && r.d <= 2) a = a.div(10);         // decimal terms like 0.8, -1.2, 1.8, -2.7
    }
    terms = [0, 1, 2, 3].map(i => a.mul(r.pow(i))); rate = r;
  } else {
    style = level === 1 ? pick(rng, ['squares', 'growing steps']) : level === 2 ? pick(rng, ['squares', 'growing steps', 'reciprocals'])
      : pick(rng, ['growing steps', 'almost geometric', 'alternating', 'squares', 'almost arithmetic']);
    const c = randInt(rng, -5, 6), s = pick(rng, [1, 2, 3]);
    if (style === 'squares') terms = [1, 2, 3, 4].map(i => F(i * i + c));
    else if (style === 'growing steps') terms = [0, 1, 3, 6].map(i => F(c + s * i * (level === 3 ? 2 : 1)));
    else if (style === 'reciprocals') { const k = pick(rng, [1, 2, 3]); terms = [1, 2, 3, 4].map(i => F(k, i)); }
    else if (style === 'almost geometric') { const a = pick(rng, [1, 2, 3, 5]), r = pick(rng, [2, 3]); terms = [F(a), F(a * r), F(a * r * r), F(a * r * r * (r === 2 ? 3 : 2))]; }
    else if (style === 'alternating') { const a = randInt(rng, -4, 6), d = nonzero(rng, -6, 6); terms = [F(a), F(a + d), F(a), F(a + d)]; }
    else { const a = randInt(rng, -6, 6), d = nonzero(rng, -5, 5); terms = [F(a), F(a + d), F(a + 2 * d), F(a + 3 * d + pick(rng, [1, -1]))]; }
  }
  if (terms.some(x => x.isZero() || Math.abs(x.value()) > 999 || x.d > 64)) return null;
  const diffs = [0, 1, 2].map(i => terms[i + 1].sub(terms[i]));
  const ratios = [0, 1, 2].map(i => terms[i + 1].div(terms[i]));
  const isA = diffs.every(d => d.eq(diffs[0])), isG = ratios.every(r => r.eq(ratios[0]));
  if (isA && isG) return null;
  if ((kind === 'arith') !== isA || (kind === 'geom') !== isG) return null;
  // show decimals when every term terminates neatly and it reads well
  const dec = level >= 2 && rng() < 0.5 && terms.every(x => x.terminatingDecimal() && x.terminatingDecimal().length <= 5);
  const show = x => (dec && !x.isInt() ? x.terminatingDecimal() : x.tex());
  const n0 = pick(rng, [0, 1]);
  const visual = `<table class="seq-table"><tr><th>$n$</th>${terms.map((_, i) => `<th>${n0 + i}</th>`).join('')}</tr><tr><th>$s_n$</th>${terms.map(x => `<td>$${show(x)}$</td>`).join('')}</tr></table>`;
  const ans = kind === 'arith' ? 0 : kind === 'geom' ? 1 : 2;
  const rateTex = rate ? `${kind === 'arith' ? 'd' : 'r'} = ${rate.tex()}${!rate.isInt() && rate.terminatingDecimal() ? ` = ${rate.terminatingDecimal()}` : ''}` : '';
  const check = str => {
    const s = String(str).trim().toLowerCase().replace(/^[dr]\s*=\s*/, '');
    if (!s) return { ok: false, msg: 'Enter d or r, or type none.', format: true };
    if (/^(none|neither|no|dne|n\/a|na|nothing)$/.test(s)) return { ok: kind === 'neither' };
    const r = readValue(s);
    if (r.error) return { ok: false, msg: 'Enter a number like -1.5 or 9/4, or type none.', format: true };
    return { ok: !!rate && matches(r.value, rate.value(), r.decimal) };
  };
  const steps = [
    `Differences: $${diffs.map(x => x.tex()).join(',\\ ')}$. ${isA ? `They are all $${diffs[0].tex()}$, so the sequence is arithmetic.` : 'They are not all the same, so it is not arithmetic.'}`,
    `Ratios: $${ratios.map(x => x.tex()).join(',\\ ')}$. ${isG ? `They are all $${ratios[0].tex()}$, so the sequence is geometric.` : 'They are not all the same, so it is not geometric.'}`,
  ];
  if (kind === 'neither') steps.push(style === 'almost geometric' ? 'Careful: the first ratios match, but every ratio has to match. One mismatch is enough to make it neither.'
    : style === 'almost arithmetic' ? 'Careful: the first differences match, but the last one does not. Every difference has to match.'
    : style === 'alternating' ? 'The differences switch sign, so they are not constant. Neither.' : 'Neither the differences nor the ratios are constant: neither.');
  else steps.push(`Answer: ${KINDS[ans].toLowerCase()}, with $${rateTex}$.`);
  return {
    tag: kind === 'neither' ? `neither (${style})` : kind === 'arith' ? 'arithmetic' : 'geometric',
    prompt: 'Selected terms of a sequence are shown. Is the sequence arithmetic, geometric, or neither?',
    visual,
    parts: [
      { type: 'mc', label: 'The sequence is:', choices: KINDS, answer: ans },
      { type: 'custom', label: 'Common difference $d$ or common ratio $r$ (type none if neither):', check, preview: previewL, keys: ['/', '-', 'none'], placeholder: 'e.g. -1.5', answerTex: rate ? `$${rateTex}$` : 'none' },
    ],
    solution: steps.join('<br>'),
    _check: { kind, terms: terms.map(x => x.value()), rate: rate && rate.value() },
  };
}

// =====================================================================
// 2. Exponent Rules as Transformations (2.4)
// =====================================================================
export const expRulesTransform = {
  id: 'exp-rules-transform', course: 'precalc', group: SEQ, lesson: '2.4',
  title: 'Exponent Rules as Transformations',
  blurb: 'Use exponent rules to name the dilation, translation or reflection in an exponential function.',
  levels: {
    1: { name: 'Easy', desc: 'bˣ⁺ʰ as a horizontal translation and as a vertical dilation' },
    2: { name: 'Medium', desc: 'b^(cx), (bˣ)ᶜ and b^(−x): dilations and reflections, written as Bˣ' },
    3: { name: 'Challenging', desc: '1/f(2x), and how far a·bˣ is translated' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildRules(level, rng); if (p) return p; }
    throw new Error('exp-rules-transform: could not build');
  },
};
const units = n => `${n} unit${n === 1 ? '' : 's'}`;
// B = b^c as tex, for c a whole number, 1/2 or 1/3
function powTex(b, c) {
  const v = Math.pow(b, c.value());
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  if (Math.abs(1 / v - Math.round(1 / v)) < 1e-9) return F(1, Math.round(1 / v)).tex();
  if (c.eq(F(1, 2))) return `\\sqrt{${b}}`;
  if (c.eq(F(1, 3))) return `\\sqrt[3]{${b}}`;
  return `${b}^{${c.tex()}}`;
}
function buildRules(level, rng) {
  const g = pick(rng, ['g', 'h', 'p']);
  if (level === 1) {
    const b = pick(rng, [2, 3, 4, 5, 10]), h = nonzero(rng, -3, 3), H = Math.abs(h);
    if (b === 10 && H > 2) return null;
    const factor = F(b).pow(h);
    const choices = [`A horizontal translation ${units(H)} left`, `A horizontal translation ${units(H)} right`, `A vertical translation ${units(H)} up`, `A vertical translation ${units(H)} down`];
    return {
      tag: h > 0 ? 'translation left' : 'translation right',
      prompt: `Let $f(x) = ${b}^x$ and $${g}(x) = ${b}^{x ${h > 0 ? '+' : '-'} ${H}}$. Describe $${g}$ as a transformation of $f$ in two ways.`,
      parts: [
        mcPart(rng, `As a translation, $${g}$ is:`, choices, h > 0 ? 0 : 1),
        { type: 'number', label: `As a vertical dilation, $${g}$ is $f$ dilated by a factor of:`, answer: factor },
      ],
      solution: `Adding to $x$ in the exponent moves the graph horizontally, the opposite way from the sign: $${g}(x) = f(x ${h > 0 ? '+' : '-'} ${H})$ is a translation ${units(H)} ${h > 0 ? 'left' : 'right'}.<br>`
        + `Exponent rule $b^{x+h} = b^h\\cdot b^x$: $${b}^{x ${h > 0 ? '+' : '-'} ${H}} = ${b}^{${h}}\\cdot ${b}^x = ${factor.tex()}\\cdot ${b}^x$. So $${g}$ is also a vertical dilation of $f$ by a factor of $${factor.tex()}$.`,
      _check: { b, h, factor: factor.value() },
    };
  }
  if (level === 2) {
    const type = pick(rng, ['coef', 'coef', 'power', 'neg']);
    if (type === 'neg') {
      const b = pick(rng, [2, 3, 4, 5, 10]);
      const choices = ['A reflection over the $y$-axis', 'A reflection over the $x$-axis', `A horizontal dilation by a factor of $${b}$`, `A vertical dilation by a factor of $\\tfrac{1}{${b}}$`];
      return {
        tag: 'reflection',
        prompt: `Let $f(x) = ${b}^x$ and $${g}(x) = ${b}^{-x}$. Describe $${g}$ as a transformation of $f$, then write $${g}(x)$ in the form $B^x$.`,
        parts: [
          mcPart(rng, `$${g}$ is:`, choices, 0),
          { type: 'number', label: `$${g}(x) = B^x$ where $B =$`, answer: F(1, b) },
        ],
        solution: `$${g}(x) = f(-x)$: replacing $x$ with $-x$ reflects the graph over the $y$-axis.<br>Exponent rule $b^{-x} = \\left(\\tfrac{1}{b}\\right)^x$: $${g}(x) = \\left(\\tfrac{1}{${b}}\\right)^x$, so $B = \\tfrac{1}{${b}}$. (Growth became decay, as a mirror image.)`,
        _check: { B: 1 / b },
      };
    }
    // g(x) = b^(cx) or (f(x))^c, a horizontal dilation by 1/c
    let b, c;
    if (type === 'coef') {
      [b, c] = pick(rng, [[2, F(2)], [3, F(2)], [5, F(2)], [2, F(3)], [4, F(2)], [4, F(1, 2)], [9, F(1, 2)], [16, F(1, 2)], [25, F(1, 2)], [8, F(1, 3)], [27, F(1, 3)], [10, F(2)]]);
    } else {
      b = pick(rng, [2, 3, 5, 4, 9]); c = pick(rng, [F(1, 2), F(2), F(3), F(1, 2)]);
    }
    const inv = F(1).div(c);
    const expo = c.isInt() ? `${c.n}x` : `\\frac{x}{${c.d}}`;
    const B = Math.pow(b, c.value()), BT = powTex(b, c);
    const choices = [`A horizontal dilation by a factor of $${inv.tex()}$`, `A horizontal dilation by a factor of $${c.tex()}$`, `A vertical dilation by a factor of $${c.tex()}$`, `A horizontal translation ${c.isInt() ? units(c.n) : `$${c.tex()}$ unit`} left`];
    const given = type === 'coef' ? `$${g}(x) = ${b}^{${expo}}$` : `$${g}(x) = \\left(f(x)\\right)^{${c.tex()}}$`;
    return {
      tag: type === 'coef' ? 'coefficient on x' : 'power of f',
      prompt: `Let $f(x) = ${b}^x$ and ${given}. Describe $${g}$ as a transformation of $f$, then write $${g}(x)$ in the form $B^x$.`,
      parts: [
        mcPart(rng, `$${g}$ is:`, choices, 0),
        { type: 'custom', label: `$${g}(x) = B^x$ where $B =$`, check: valueChecker(B), preview: previewL, keys: ['√', '/', '^', '(', ')'], placeholder: 'e.g. 25 or sqrt(5)', answerTex: `$${BT}$`, help: 'Exact values like 25, 1/9 or sqrt(5) are best.' },
      ],
      solution: (type === 'power' ? `Exponent rule $(b^x)^c = b^{cx}$: $${g}(x) = \\left(${b}^x\\right)^{${c.tex()}} = ${b}^{${expo}}$.<br>` : '')
        + `$${g}(x) = f\\left(${c.isInt() ? `${c.n}x` : `\\tfrac{x}{${c.d}}`}\\right)$. Multiplying $x$ by $${c.tex()}$ inside the function is a horizontal dilation by a factor of $\\dfrac{1}{${c.tex()}} = ${inv.tex()}$.<br>`
        + `Exponent rule $b^{cx} = \\left(b^c\\right)^x$: $${g}(x) = \\left(${b}^{${c.tex()}}\\right)^x = \\left(${BT}\\right)^x$, so $B = ${BT}$.`,
      _check: { b, c: c.value(), B },
    };
  }
  // Challenging
  if (rng() < 0.5) {
    // h(x) = 1/f(cx) = b^(-cx)
    const b = pick(rng, [2, 3, 10, 4, 5]), c = pick(rng, [F(2), F(3), F(2), F(1, 2)]);
    if (c.eq(F(1, 2)) && b !== 4) return null;
    if (b === 10 && c.n === 3) return null;
    const inv = F(1).div(c), k = c.neg();
    const B = Math.pow(b, k.value()), BT = powTex(b, k);
    const inner = c.isInt() ? `${c.n}x` : '\\tfrac{x}{2}';
    const choices = [
      `A horizontal dilation by a factor of $${inv.tex()}$ and a reflection over the $y$-axis`,
      `A horizontal dilation by a factor of $${c.tex()}$ and a reflection over the $y$-axis`,
      `A horizontal dilation by a factor of $${inv.tex()}$ and a reflection over the $x$-axis`,
      `A vertical dilation by a factor of $${inv.tex()}$ and a reflection over the $x$-axis`,
    ];
    return {
      tag: 'reciprocal of f(cx)',
      prompt: `Let $f(x) = ${b}^x$ and $${g}(x) = \\dfrac{1}{f(${inner})}$. Write $${g}(x)$ as a single power of ${b}, describe every transformation from $f$ to $${g}$, and write $${g}(x)$ in the form $B^x$.`,
      parts: [
        { type: 'number', label: `$${g}(x) = ${b}^{kx}$ where $k =$`, answer: k },
        mcPart(rng, `From $f$ to $${g}$:`, choices, 0),
        { type: 'custom', label: `$${g}(x) = B^x$ where $B =$`, check: valueChecker(B), preview: previewL, keys: ['/', '√', '(', ')'], placeholder: 'e.g. 1/100', answerTex: `$${BT}$` },
      ],
      solution: `$${g}(x) = \\dfrac{1}{${b}^{${inner}}} = ${b}^{${k.isInt() ? `${k.n}x` : '-\\frac{x}{2}'}}$, so $k = ${k.tex()}$.<br>`
        + `$${g}(x) = f(${k.isInt() ? `${k.n}x` : '-\\tfrac{x}{2}'})$: the factor $${c.tex()}$ is a horizontal dilation by a factor of $${inv.tex()}$, and the negative sign is a reflection over the $y$-axis.<br>`
        + `As a single base: $${g}(x) = \\left(${b}^{${k.tex()}}\\right)^x = \\left(${BT}\\right)^x$.`,
      _check: { b, k: k.value(), B },
    };
  }
  // y = A b^x as a horizontal translation of y = b^x
  const b = pick(rng, [2, 3, 4, 5]);
  let A, shift, shiftTex, exactShift;
  if (rng() < 0.7) {
    const k = nonzero(rng, -3, 3);
    A = F(b).pow(k); if (Math.abs(A.value()) > 125 || A.d > 125) return null;
    shift = k; shiftTex = String(Math.abs(k)); exactShift = true;
  } else {
    const a = pick(rng, [3, 5, 6, 7, 10].filter(x => Math.abs(Math.log(x) / Math.log(b) - Math.round(Math.log(x) / Math.log(b))) > 1e-9));
    A = F(a); shift = Math.log(a) / Math.log(b); shiftTex = `\\log_{${b}} ${a}`; exactShift = false;
  }
  const left = shift > 0;
  return {
    tag: exactShift ? 'translation, power of b' : 'translation, log',
    prompt: `The graph of $y = ${A.isInt() ? A.n : fracTex(A)}\\cdot ${b}^x$ is a horizontal translation of the graph of $y = ${b}^x$. How far is it translated, and in which direction?`,
    parts: [
      { type: 'custom', label: 'Distance (units):', check: valueChecker(Math.abs(shift)), preview: previewL, keys: LOG_KEYS, placeholder: 'e.g. 2 or log_2(5)', answerTex: `$${shiftTex}$${exactShift ? '' : ` $\\approx ${d3(Math.abs(shift))}$`}`, help: VALUE_HELP },
      { type: 'mc', label: 'Direction:', choices: ['Left', 'Right'], answer: left ? 0 : 1 },
    ],
    solution: exactShift
      ? `Write the coefficient as a power of ${b}: $${A.isInt() ? A.n : A.tex()} = ${b}^{${shift}}$. Then $${A.isInt() ? A.n : A.tex()}\\cdot ${b}^x = ${b}^{${shift}}\\cdot ${b}^x = ${b}^{x ${shift > 0 ? '+' : '-'} ${Math.abs(shift)}}$.<br>`
        + `$x ${shift > 0 ? '+' : '-'} ${Math.abs(shift)}$ in the exponent is a translation ${units(Math.abs(shift))} ${left ? 'left' : 'right'}.`
      : `Write ${A.n} as a power of ${b}: $${A.n} = ${b}^{\\log_{${b}} ${A.n}}$. Then $${A.n}\\cdot ${b}^x = ${b}^{x + \\log_{${b}} ${A.n}}$, a translation $\\log_{${b}} ${A.n} \\approx ${d3(shift)}$ units left.`,
    _check: { b, A: A.value(), shift },
  };
}

// =====================================================================
// 3. Inverse Properties and Log Rules (2.12)
// =====================================================================
export const inverseProps = {
  id: 'inverse-properties', course: 'precalc', group: LOGS, lesson: '2.12',
  title: 'Inverse Properties and Log Rules',
  blurb: 'Exponentials and logs with the same base undo each other. Move a coefficient into the exponent before you cancel.',
  levels: {
    1: { name: 'Easy', desc: 'Like e^(ln 7), ln(e^(4x)) or 10^(log(x + 1))' },
    2: { name: 'Medium', desc: 'Coefficients first, like e^(3ln x), 10^(2log(x + 1)) or e^(ln x + ln 5)' },
    3: { name: 'Challenging', desc: 'Compositions, like f(g(x)) for f(x) = e^(x + 1) and g(x) = ln(5x)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildInvProps(level, rng); if (p) return p; }
    throw new Error('inverse-properties: could not build');
  },
};
const ENV_X = [0.7, 1.9, 3.4].map(x => ({ x }));
// simplified: no log of an expression with x, and nothing raised to a power that contains a log
function simplifiedTree(n) {
  if (!n || typeof n !== 'object') return true;
  if (n.fn === 'log' && varsL(n.arg).size) return false;
  if (n.op === '^' && logsIn(n.b).length) return false;
  return ['a', 'b', 'arg', 'base'].every(k => !n[k] || simplifiedTree(n[k]));
}
function simplifyChecker(truth) {
  return str => {
    let tree;
    try { tree = parseL(afterEq(str)); } catch { return { ok: false, msg: 'Could not read that. Examples: 3x^2, 5ex, x + 1 + ln(5)', format: true }; }
    for (const v of varsL(tree)) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const same = ENV_X.every(env => { let g; try { g = evalL(tree, env); } catch { return false; } const w = truth(env.x); return isFinite(g) && Math.abs(g - w) < 1e-9 * Math.max(1, Math.abs(w)); });
    if (!same) return { ok: false };
    if (!simplifiedTree(tree)) return { ok: false, msg: 'That is equal, but simplify it: use the inverse properties so no log of an x-expression is left, and nothing is raised to a log.' };
    return { ok: true };
  };
}
const simplePart = (label, truth, tex) => ({ type: 'custom', label, check: simplifyChecker(truth), preview: previewL, keys: ['e^', 'ln', '^', '(', ')', '/'], placeholder: 'e.g. 3x^2', answerTex: `$${tex}$`, help: 'Type e for the number e, like 5ex or 2e^3 x.' });
const lin = (k, c) => `${k === 1 ? '' : k === -1 ? '-' : k}x${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''}`;
const powX = (inner, k, paren) => (k === 1 ? inner : k === 0.5 ? `\\sqrt{${inner}}` : k < 0 ? `\\dfrac{1}{${paren ? `(${inner})` : inner}${k === -1 ? '' : `^{${-k}}`}}` : `${paren ? `(${inner})` : inner}^{${k}}`);
function buildInvProps(level, rng) {
  if (level === 1) {
    const type = pick(rng, ['eln', 'lne', 'tenlog', 'logten', 'blogb', 'logbb']);
    const n = randInt(rng, 3, 12), k = nonzero(rng, -6, 6), c = nonzero(rng, -9, 9), b = pick(rng, [2, 3, 5, 7]);
    let given, tex, truth, why;
    if (type === 'eln') { given = `e^{\\ln ${n}}`; tex = String(n); truth = () => n; why = `$e^x$ and $\\ln x$ undo each other: $e^{\\ln a} = a$. So $e^{\\ln ${n}} = ${n}$.`; }
    else if (type === 'lne') { given = `\\ln\\left(e^{${lin(k, 0)}}\\right)`; tex = lin(k, 0); truth = x => k * x; why = `$\\ln\\left(e^{u}\\right) = u$ for every $u$, so the answer is the exponent: $${tex}$.`; }
    else if (type === 'tenlog') { const cc = Math.abs(c); given = `10^{\\log\\left(x + ${cc}\\right)}`; tex = `x + ${cc}`; truth = x => x + cc; why = `$10^x$ and $\\log x$ (base 10) undo each other: $10^{\\log u} = u$ when $u > 0$. So the answer is $${tex}$.`; }
    else if (type === 'logten') { given = `\\log\\left(10^{${lin(k, c)}}\\right)`; tex = lin(k, c); truth = x => k * x + c; why = `$\\log\\left(10^{u}\\right) = u$, so the answer is the exponent: $${tex}$.`; }
    else if (type === 'blogb') { given = `${b}^{\\log_{${b}} ${n}}`; tex = String(n); truth = () => n; why = `$${b}^x$ and $\\log_{${b}} x$ undo each other: $${b}^{\\log_{${b}} a} = a$. So the answer is $${n}$.`; }
    else { given = `\\log_{${b}}\\left(${b}^{${lin(1, c)}}\\right)`; tex = lin(1, c); truth = x => x + c; why = `$\\log_{${b}}\\left(${b}^{u}\\right) = u$, so the answer is the exponent: $${tex}$.`; }
    return { tag: type, prompt: `Simplify. Assume every input is in the domain. $\\;${given}$`, parts: [simplePart('Simplified:', truth, tex)], solution: why, _check: { truth } };
  }
  if (level === 2) {
    const type = pick(rng, ['ekln', 'tenklog', 'esum', 'ediff', 'ekln+ln', 'bklog']);
    const k = pick(rng, [2, 3, 4, -1, -2, 0.5]), n = randInt(rng, 2, 9), c = randInt(rng, 1, 6), b = pick(rng, [2, 3, 5]);
    const kT = k === 0.5 ? '\\tfrac{1}{2}' : String(k);
    let given, tex, truth, why;
    if (type === 'ekln') {
      given = `e^{${k === -1 ? '-' : kT}\\ln x}`; tex = powX('x', k); truth = x => Math.pow(x, k);
      const kE = k === 0.5 ? '\\frac{1}{2}' : k;
      why = `Power property first: $${k === -1 ? '-' : kT}\\ln x = \\ln\\left(x^{${kE}}\\right)$. Then $e^{\\ln\\left(x^{${kE}}\\right)} = x^{${kE}}$${k === 0.5 || k < 0 ? ` $= ${tex}$` : ''}.`;
    } else if (type === 'tenklog') {
      const kk = pick(rng, [2, 3]); given = `10^{${kk}\\log\\left(x + ${c}\\right)}`; tex = `(x + ${c})^{${kk}}`; truth = x => Math.pow(x + c, kk);
      why = `Power property first: $${kk}\\log(x + ${c}) = \\log\\left((x + ${c})^{${kk}}\\right)$. Then $10^{\\log u} = u$: the answer is $${tex}$.`;
    } else if (type === 'esum') {
      given = `e^{\\ln x + \\ln ${n}}`; tex = `${n}x`; truth = x => n * x;
      why = `Product property: $\\ln x + \\ln ${n} = \\ln(${n}x)$. Then $e^{\\ln(${n}x)} = ${n}x$. (Or: $e^{\\ln x}\\cdot e^{\\ln ${n}} = x\\cdot ${n}$.)`;
    } else if (type === 'ediff') {
      given = `e^{\\ln x - \\ln ${n}}`; tex = `\\dfrac{x}{${n}}`; truth = x => x / n;
      why = `Quotient property: $\\ln x - \\ln ${n} = \\ln\\left(\\dfrac{x}{${n}}\\right)$. Then $e^{\\ln(x/${n})} = \\dfrac{x}{${n}}$.`;
    } else if (type === 'ekln+ln') {
      const kk = pick(rng, [2, 3]); given = `e^{${kk}\\ln x + \\ln ${n}}`; tex = `${n}x^{${kk}}`; truth = x => n * Math.pow(x, kk);
      why = `Power and product properties: $${kk}\\ln x + \\ln ${n} = \\ln\\left(${n}x^{${kk}}\\right)$. Then $e^{\\ln u} = u$: the answer is $${tex}$.`;
    } else {
      const kk = pick(rng, [2, 3, -1]); given = `${b}^{${kk === -1 ? '-' : kk}\\log_{${b}} x}`; tex = powX('x', kk); truth = x => Math.pow(x, kk);
      why = `Power property first: $${kk === -1 ? '-' : kk}\\log_{${b}} x = \\log_{${b}}\\left(x^{${kk}}\\right)$. Then $${b}^{\\log_{${b}} u} = u$: the answer is $${tex}$.`;
    }
    return { tag: type, prompt: `Simplify. Assume every input is in the domain. $\\;${given}$`, parts: [simplePart('Simplified:', truth, tex)], solution: why, _check: { truth } };
  }
  // Challenging: compositions
  const type = pick(rng, ['e-shift', 'ten-shift', 'e-scale']);
  const q = pick(rng, [2, 3, 4, 5, 6, 7]);
  let fT, gT, fg, gf, fgT, gfT, why;
  if (type === 'e-shift') {
    const p = pick(rng, [1, 2, 3, -1]);
    fT = `e^{x ${p > 0 ? '+' : '-'} ${Math.abs(p)}}`; gT = `\\ln(${q}x)`;
    fg = x => q * Math.exp(p) * x; gf = x => Math.log(q) + x + p;
    fgT = p === 1 ? `${q}ex` : p === -1 ? `\\dfrac{${q}x}{e}` : `${q}e^{${p}}x`;
    gfT = `x ${p > 0 ? '+' : '-'} ${Math.abs(p)} + \\ln ${q}`;
    why = [`$f(g(x)) = e^{\\ln(${q}x) ${p > 0 ? '+' : '-'} ${Math.abs(p)}} = e^{\\ln(${q}x)}\\cdot e^{${p}} = ${q}x\\cdot e^{${p}} = ${fgT}$.`,
      `$g(f(x)) = \\ln\\left(${q}e^{x ${p > 0 ? '+' : '-'} ${Math.abs(p)}}\\right) = \\ln ${q} + \\ln\\left(e^{x ${p > 0 ? '+' : '-'} ${Math.abs(p)}}\\right) = ${gfT}$.`];
  } else if (type === 'ten-shift') {
    const p = pick(rng, [1, 2]);
    fT = `10^{x - ${p}}`; gT = `\\log(${q}x)`;
    fg = x => q * x / Math.pow(10, p); gf = x => Math.log10(q) + x - p;
    const fr = F(q, Math.pow(10, p));
    fgT = `\\dfrac{${fr.n === 1 ? '' : fr.n}x}{${fr.d}}`; gfT = `x - ${p} + \\log ${q}`;
    why = [`$f(g(x)) = 10^{\\log(${q}x) - ${p}} = \\dfrac{10^{\\log(${q}x)}}{10^{${p}}} = \\dfrac{${q}x}{${Math.pow(10, p)}}${fr.d === Math.pow(10, p) ? '' : ` = ${fgT}`}$.`,
      `$g(f(x)) = \\log\\left(${q}\\cdot 10^{x - ${p}}\\right) = \\log ${q} + \\log\\left(10^{x - ${p}}\\right) = ${gfT}$.`];
  } else {
    const k = pick(rng, [2, 3]);
    fT = `e^{${k}x}`; gT = `\\ln(${q}x)`;
    fg = x => Math.pow(q * x, k); gf = x => Math.log(q) + k * x;
    fgT = `${Math.pow(q, k)}x^{${k}}`; gfT = `${k}x + \\ln ${q}`;
    why = [`$f(g(x)) = e^{${k}\\ln(${q}x)} = e^{\\ln\\left((${q}x)^{${k}}\\right)} = (${q}x)^{${k}} = ${fgT}$. (Move the ${k} into the exponent before you cancel.)`,
      `$g(f(x)) = \\ln\\left(${q}e^{${k}x}\\right) = \\ln ${q} + \\ln\\left(e^{${k}x}\\right) = ${gfT}$.`];
  }
  return {
    tag: `composition, ${type}`,
    prompt: `Let $f(x) = ${fT}$ and $g(x) = ${gT}$ for $x > 0$. Find and simplify each composition.`,
    parts: [simplePart('$f(g(x)) =$', fg, fgT), simplePart('$g(f(x)) =$', gf, gfT)],
    solution: why.join('<br>') + '<br>Equivalent forms are fine, as long as no log of an $x$-expression is left.',
    _check: { fg, gf, fT, gT },
  };
}

// =====================================================================
// 4. Change of Base (2.12)
// =====================================================================
export const changeOfBase = {
  id: 'change-of-base', course: 'precalc', group: LOGS, lesson: '2.12',
  title: 'Change of Base',
  blurb: 'Rewrite a log in any base you like: log_b x = log x / log b = ln x / ln b.',
  levels: {
    1: { name: 'Easy', desc: 'Rewrite with common or natural logs, then evaluate' },
    2: { name: 'Medium', desc: 'Exact values with a convenient base, like log₈ 32, and select-all equivalent forms' },
    3: { name: 'Challenging', desc: 'Solve like 4ˣ = 50: a single log, then a decimal' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildCOB(level, rng); if (p) return p; }
    throw new Error('change-of-base: could not build');
  },
};
const notPower = (b, N) => Math.abs(Math.log(N) / Math.log(b) - Math.round(Math.log(N) / Math.log(b))) > 1e-9;
function cobChecker(target, which) {
  const name = which === 'common' ? 'common logs (log, base 10)' : 'natural logs (ln)';
  return str => {
    const s = afterEq(str);
    let tree;
    try { tree = parseL(s); } catch { return { ok: false, msg: `Could not read that. Example: ${which === 'common' ? 'log(40)/log(5)' : 'ln(40)/ln(5)'}`, format: true }; }
    if (varsL(tree).size) return { ok: false, msg: 'Your answer should not have any letters other than log or ln.', format: true };
    const logs = logsIn(tree);
    if (!logs.length) return { ok: false, msg: `Write it as a quotient of ${name}, like ${which === 'common' ? 'log(40)/log(5)' : 'ln(40)/ln(5)'}.`, format: true };
    const wrongBase = logs.some(l => (which === 'common' ? l.base !== null : !(l.base && stripL(l.base).e)));
    let v; try { v = evalL(tree); } catch { return { ok: false }; }
    if (!(Math.abs(v - target) < 1e-9 * Math.max(1, Math.abs(target)))) return { ok: false };
    if (wrongBase) return { ok: false, msg: `That is equal, but use only ${name}.` };
    return { ok: true };
  };
}
function buildCOB(level, rng) {
  if (level === 1) {
    const b = pick(rng, [2, 3, 5, 6, 7, 8]), N = pick(rng, [10, 12, 15, 20, 24, 30, 40, 45, 50, 60, 75, 100, 200]);
    if (!notPower(b, N)) return null;
    const which = pick(rng, ['common', 'natural']), L = which === 'common' ? '\\log' : '\\ln';
    const v = Math.log(N) / Math.log(b);
    return {
      tag: which,
      prompt: `Write $\\log_{${b}} ${N}$ using ${which} logs. Then evaluate it to three decimal places.`,
      parts: [
        { type: 'custom', label: `Using ${which} logs:`, check: cobChecker(v, which), preview: previewL, keys: which === 'common' ? ['log', '(', ')', '/'] : ['ln', '(', ')', '/'], placeholder: which === 'common' ? 'e.g. log(40)/log(5)' : 'e.g. ln(40)/ln(5)', answerTex: `$\\dfrac{${L} ${N}}{${L} ${b}}$` },
        { type: 'custom', label: 'Value:', check: valueChecker(v), preview: previewL, placeholder: 'e.g. 2.292', answerTex: `$${d3(v)}$`, help: 'Round to 3 decimal places.' },
      ],
      solution: `Change of base: $\\log_b x = \\dfrac{${L} x}{${L} b}$. So $\\log_{${b}} ${N} = \\dfrac{${L} ${N}}{${L} ${b}}$${which === 'common' ? ` (or $\\dfrac{\\ln ${N}}{\\ln ${b}}$, which gives the same value)` : ` (or $\\dfrac{\\log ${N}}{\\log ${b}}$, which gives the same value)`}.<br>`
        + `On a calculator: $\\approx ${d3(v)}$. Check: $${b}^{${d3(v)}} \\approx ${N}$.`,
      _check: { v },
    };
  }
  if (level === 2 && rng() < 0.6) {
    // log_{c^p} c^q = q/p
    const c = pick(rng, [2, 3, 5]), p = randInt(rng, 2, c === 2 ? 5 : 3), q = nonzero(rng, c === 2 ? -6 : -4, c === 2 ? 7 : 5);
    if (q % p === 0) return null;
    const b = Math.pow(c, p), N = F(c).pow(q);
    if (b > 625 || N.n > 3125 || N.d > 625) return null;
    const ans = F(q, p);
    return {
      tag: 'exact with a convenient base',
      prompt: `Evaluate without a calculator by changing to a convenient base: $\\;\\log_{${b}} ${N.isInt() ? N.n : `\\left(${N.tex()}\\right)`}$`,
      parts: [{ type: 'number', label: `$\\log_{${b}} ${N.isInt() ? N.n : `\\left(${N.tex()}\\right)`} =$`, answer: ans }],
      solution: `Both numbers are powers of ${c}: $${b} = ${c}^{${p}}$ and $${N.tex()} = ${c}^{${q}}$.<br>Change to base ${c}: $\\log_{${b}} ${N.isInt() ? N.n : `\\left(${N.tex()}\\right)`} = \\dfrac{\\log_{${c}} ${N.isInt() ? N.n : `\\left(${N.tex()}\\right)`}}{\\log_{${c}} ${b}} = \\dfrac{${q}}{${p}}${ans.d === p && ans.n === q ? '' : ` = ${ans.tex()}`}$.<br>Check: $${b}^{${ans.tex()}} = \\left(${c}^{${p}}\\right)^{${ans.tex()}} = ${c}^{${q}}$.`,
      _check: { b, N: N.value(), ans: ans.value() },
    };
  }
  if (level === 2) {
    // select all expressions equal to log_b N
    const b = pick(rng, [3, 5, 6, 7]), N = pick(rng, [10, 20, 30, 40, 50, 12, 15]);
    if (!notPower(b, N)) return null;
    const c = pick(rng, [2, 3, 5, 7].filter(x => x !== b));
    const target = Math.log(N) / Math.log(b);
    const L = x => Math.log(x);
    const right = shuffle(rng, [
      { t: `\\dfrac{\\ln ${N}}{\\ln ${b}}`, v: L(N) / L(b) },
      { t: `\\dfrac{\\log ${N}}{\\log ${b}}`, v: L(N) / L(b) },
      { t: `\\dfrac{\\log_{${c}} ${N}}{\\log_{${c}} ${b}}`, v: L(N) / L(b) },
      { t: `\\dfrac{1}{\\log_{${N}} ${b}}`, v: L(N) / L(b) },
    ]).slice(0, randInt(rng, 2, 3));
    const wrong = shuffle(rng, [
      { t: `\\dfrac{\\ln ${b}}{\\ln ${N}}`, v: L(b) / L(N) },
      { t: `\\log\\left(\\dfrac{${N}}{${b}}\\right)`, v: Math.log10(N / b) },
      { t: `\\ln ${N} - \\ln ${b}`, v: L(N) - L(b) },
      { t: `\\dfrac{\\log_{${c}} ${b}}{\\log_{${c}} ${N}}`, v: L(b) / L(N) },
      { t: `\\dfrac{\\log ${N}}{${b}}`, v: Math.log10(N) / b },
      { t: `\\log_{${N}} ${b}`, v: L(b) / L(N) },
    ]).filter(w => Math.abs(w.v - target) > 1e-6);
    const opts = shuffle(rng, [...right, ...wrong.slice(0, 5 - right.length)].filter((o, i, arr) => arr.findIndex(x => x.t === o.t) === i));
    if (opts.length !== 5) return null;
    const answers = opts.map((o, i) => (Math.abs(o.v - target) < 1e-9 ? i : -1)).filter(i => i >= 0);
    return {
      tag: 'select all',
      prompt: `Select all expressions equal to $\\log_{${b}} ${N}$.`,
      parts: [{ type: 'multi', label: 'Equal to $\\log_{' + b + '} ' + N + '$:', choices: opts.map(o => `$${o.t}$`), answers }],
      solution: `Change of base works with any base: $\\log_{${b}} ${N} = \\dfrac{\\ln ${N}}{\\ln ${b}} = \\dfrac{\\log ${N}}{\\log ${b}} = \\dfrac{\\log_{${c}} ${N}}{\\log_{${c}} ${b}}$. Flipping the base and the input gives the reciprocal: $\\log_{${N}} ${b} = \\dfrac{1}{\\log_{${b}} ${N}}$, so $\\dfrac{1}{\\log_{${N}} ${b}}$ is also equal.<br>`
        + `The others are not: $\\log\\left(\\tfrac{${N}}{${b}}\\right) = \\log ${N} - \\log ${b}$ is a difference, not a quotient, and $\\dfrac{\\ln ${b}}{\\ln ${N}}$ is upside down. Here $\\log_{${b}} ${N} \\approx ${d3(target)}$, so you can also check each choice on a calculator.<br>`
        + `Equal: ${answers.map(i => opts[i].t).map(t => `$${t}$`).join(', ')}.`,
      _check: { target, opts: opts.map(o => o.v), answers },
    };
  }
  // Challenging: k·b^x (+ m) = d  ->  x = log_b(N)
  const b = pick(rng, [2, 3, 4, 5, 6, 7]), N = pick(rng, [10, 12, 15, 20, 30, 40, 50, 75, 100]);
  if (!notPower(b, N)) return null;
  const k = rng() < 0.5 ? 1 : pick(rng, [2, 3, 4, 5]), m = k === 1 ? 0 : (rng() < 0.5 ? 0 : nonzero(rng, -9, 9));
  const rhs = k * N + m;
  const x = Math.log(N) / Math.log(b);
  const lhs = `${k === 1 ? '' : `${k}(${b})`}${k === 1 ? `${b}` : ''}^{x}${m ? ` ${m > 0 ? '+' : '-'} ${Math.abs(m)}` : ''}`;
  const single = str => {
    const s = afterEq(str);
    if (/\d\.\d/.test(s)) return { ok: false, msg: 'Give the exact answer here, as a log. The decimal goes in the next box.', format: true };
    let tree; try { tree = parseL(s); } catch { return { ok: false, msg: `Could not read that. Example: log_${b}(${N})`, format: true }; }
    if (varsL(tree).size) return { ok: false, msg: 'Your answer should be a number, like log_4(50).', format: true };
    let v; try { v = evalL(tree); } catch { return { ok: false }; }
    if (!(Math.abs(v - x) < 1e-9 * Math.max(1, x))) return { ok: false };
    const top = stripL(tree);
    if (top.fn !== 'log' || logsIn(tree).length !== 1) return { ok: false, msg: `That is equal, but write it as a single log, like log_${b}(${N}).` };
    return { ok: true };
  };
  const steps = [];
  if (k !== 1) steps.push(`Isolate the power: ${m ? `${m > 0 ? 'subtract' : 'add'} ${Math.abs(m)}, then ` : ''}divide by ${k}: $${b}^x = ${N}$.`);
  steps.push(`Rewrite in log form: $x = \\log_{${b}} ${N}$.`);
  steps.push(`Change of base to approximate: $x = \\dfrac{\\ln ${N}}{\\ln ${b}} \\approx ${d3(x)}$.`);
  return {
    tag: k === 1 ? 'b^x = N' : m ? 'isolate with a constant' : 'isolate',
    prompt: `Solve: $\\;${lhs} = ${rhs}$. Give the exact answer as a single log, then use change of base to approximate it.`,
    parts: [
      { type: 'custom', label: 'Exact: $x =$', check: single, preview: previewL, keys: ['log_', '(', ')'], placeholder: `e.g. log_${b}(${N})`, answerTex: `$\\log_{${b}} ${N}$` },
      { type: 'custom', label: 'Approximate: $x \\approx$', check: valueChecker(x), preview: previewL, placeholder: 'e.g. 2.822', answerTex: `$${d3(x)}$`, help: 'Round to 3 decimal places.' },
    ],
    solution: steps.join('<br>'),
    _check: { x, b, N, k, m, rhs },
  };
}

// =====================================================================
// 5. Log Equations and Inequalities: quadratic inequalities and log domains (2.13)
// =====================================================================
export const logDomainIneq = {
  id: 'log-quad-domain', course: 'precalc', group: SOLVE, lesson: '2.13',
  title: 'Log Equations and Inequalities',
  blurb: 'Solve quadratic inequalities with a sign chart, then use them to find the domain of a log expression.',
  levels: {
    1: { name: 'Easy', desc: 'Quadratic inequalities, like x² − 2x − 15 ≥ 0' },
    2: { name: 'Medium', desc: 'Leading coefficients other than 1, like 2x² + x − 6 < 0' },
    3: { name: 'Challenging', desc: 'The domain of a sum of logs, like ln(x² − 9) + ln(x + 5)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildQuadDomain(level, rng); if (p) return p; }
    throw new Error('log-quad-domain: could not build');
  },
};
const polyTex = (A, B, C) => {
  const t = [];
  t.push(`${A === 1 ? '' : A === -1 ? '-' : A}x^2`);
  if (B) t.push(`${B > 0 ? '+' : '-'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}x`);
  if (C) t.push(`${C > 0 ? '+' : '-'} ${Math.abs(C)}`);
  return t.join(' ');
};
const factorTexF = r => (r.isZero() ? 'x' : r.isInt() ? `(x ${r.sign() > 0 ? '-' : '+'} ${Math.abs(r.n)})` : `(${r.d}x ${r.sign() > 0 ? '-' : '+'} ${Math.abs(r.n)})`);
function setPart(label, I) {
  return { type: 'custom', label, check: intervalChecker(asNums(I)), keys: ['≤', '≥', '∞', '∪', '(', ')', '[', ']', '/'], placeholder: 'e.g. x ≤ -3 or x ≥ 5', answerTex: `$${setTex(I)}$`, help: 'Use inequalities like x ≤ -3 or x ≥ 5, or interval notation like (-∞, -3] ∪ [5, ∞). Join pieces with ∪ (or U) or the word or.' };
}
function buildQuadDomain(level, rng) {
  if (level < 3) {
    let r1, r2, A, lead = 1;
    if (level === 1) { const a = randInt(rng, -8, 7); r1 = F(a); r2 = F(a + randInt(rng, 1, 9)); if (r2.n > 9) return null; A = 1; }
    else {
      const p = pick(rng, [2, 3]), q = nonzero(rng, -8, 8); if (q % p === 0 || gcd(p, q) !== 1) return null;
      const fr = F(q, p), ri = F(nonzero(rng, -6, 6)); if (fr.eq(ri)) return null;
      [r1, r2] = fr.value() < ri.value() ? [fr, ri] : [ri, fr];
      A = p; if (rng() < 0.3) lead = -1;
    }
    // P(x) = lead · A (x - r1)(x - r2)
    const a2 = lead * A, s = r1.add(r2), pr = r1.mul(r2);
    const B = F(-a2).mul(s), C = F(a2).mul(pr);
    if (!B.isInt() || !C.isInt() || C.isZero()) return null;
    const op = pick(rng, ['<', '>', '<=', '>=']);
    const P = x => a2 * (x - r1.value()) * (x - r2.value());
    const I = solveSet(x => testOp(P(x), op, 0), [{ v: r1.value(), tex: r1.tex() }, { v: r2.value(), tex: r2.tex() }]);
    const between = (lead > 0) === (op === '<' || op === '<=');
    const fac = `${lead < 0 ? '-' : ''}${factorTexF(r1)}${factorTexF(r2)}`;
    const steps = [
      `Factor: $${polyTex(a2, B.n, C.n)} = ${fac}$. The zeros are $x = ${r1.tex()}$ and $x = ${r2.tex()}$.`,
      `Sign chart: the parabola opens ${a2 > 0 ? 'up' : 'down'}, so it is ${a2 > 0 ? 'negative between the zeros and positive outside them' : 'positive between the zeros and negative outside them'}.`,
      `We want ${op === '<' || op === '<=' ? 'negative' : 'positive'}${op.includes('=') ? ' or zero (the zeros are included)' : ' (the zeros are not included)'}, so the answer is ${between ? 'between' : 'outside'} the zeros: $${setTex(I)}$.`,
    ];
    return {
      tag: level === 1 ? 'quadratic inequality' : lead < 0 ? 'negative leading coefficient' : 'leading coefficient not 1',
      prompt: `Solve using a sign chart or a sketch: $\\;${polyTex(a2, B.n, C.n)} ${opT(op)} 0$`,
      parts: [setPart('Solution:', I)],
      solution: steps.join('<br>'),
      _check: { I: asNums(I), P, op },
    };
  }
  // domain of ln(P) + ln(L) or log(P) - log(L)
  const r1 = randInt(rng, -7, 4), r2 = r1 + randInt(rng, 2, 8), sym = rng() < 0.35;
  const R1 = sym ? -Math.abs(randInt(rng, 2, 6)) : r1, R2 = sym ? -R1 : r2;
  const B = -(R1 + R2), C = R1 * R2;
  if (C === 0) return null;
  const right = rng() < 0.7;                 // L = x - c (domain to the right) or c - x
  const c = randInt(rng, -8, 8);
  const P = x => (x - R1) * (x - R2), Lf = x => (right ? x - c : c - x);
  const I = solveSet(x => P(x) > 0 && Lf(x) > 0, [{ v: R1, tex: String(R1) }, { v: R2, tex: String(R2) }, { v: c, tex: String(c) }]);
  if (!I.length) return null;
  const onlyP = solveSet(x => P(x) > 0, [{ v: R1, tex: '' }, { v: R2, tex: '' }]);
  const onlyL = solveSet(x => Lf(x) > 0, [{ v: c, tex: '' }]);
  const sameSet = (X, Y) => X.length === Y.length && X.every((s, i) => s.lo.v === Y[i].lo.v && s.hi.v === Y[i].hi.v);
  if (sameSet(I, onlyP) || sameSet(I, onlyL)) return null;
  const Lt = right ? `x${c ? ` ${c > 0 ? '-' : '+'} ${Math.abs(c)}` : ''}` : `${c} - x`;
  const Ln = pick(rng, ['\\ln', '\\log']), sep = pick(rng, ['+', '-']);
  const steps = [
    `Every log input must be positive, so the domain needs both conditions.`,
    `$${polyTex(1, B, C)} > 0$: it factors as $(x ${R1 > 0 ? '-' : '+'} ${Math.abs(R1)})(x ${R2 > 0 ? '-' : '+'} ${Math.abs(R2)})$ with zeros $${R1}$ and $${R2}$, and the parabola opens up, so $x < ${R1}$ or $x > ${R2}$.`,
    `$${Lt} > 0$: $x ${right ? '>' : '<'} ${c}$.`,
    `Keep only the $x$-values that satisfy both (a number line helps): $${setTex(I)}$.`,
  ];
  return {
    tag: `domain, ${right ? 'x - c' : 'c - x'}`,
    prompt: `Find the domain of $f(x) = ${Ln}\\left(${polyTex(1, B, C)}\\right) ${sep} ${Ln}\\left(${Lt}\\right)$.`,
    parts: [setPart('Domain:', I)],
    solution: steps.join('<br>'),
    _check: { I: asNums(I), P, Lf },
  };
}

// =====================================================================
// 6. Exponential Models from Data: build the model, then solve for the input (2.13)
// =====================================================================
export const expModelsData = {
  id: 'exp-models-data', course: 'precalc', group: SOLVE, lesson: '2.13',
  title: 'Exponential Models from Data',
  blurb: 'Build y = abˣ from data, then use logs to find when the model reaches a value.',
  levels: {
    1: { name: 'Easy', desc: 'The model is given: when does it reach a value?' },
    2: { name: 'Medium', desc: 'Values at t = 0 and a later time: find a and b, then solve' },
    3: { name: 'Challenging', desc: 'Neither point at t = 0, or percent remaining, like 30% after 50 years' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildModelsData(level, rng); if (p) return p; }
    throw new Error('exp-models-data: could not build');
  },
};
const DSTORIES = [
  { f: 'A', what: 'The amount of a medication in a patient\'s bloodstream', unit: 'hour', y: ' mg', grow: false, as: [400, 250, 500, 300], bs: [0.82, 0.85, 0.75, 0.9, 0.8] },
  { f: 'P', what: 'The population of a town', unit: 'year', y: ' people', grow: true, as: [1800, 5000, 12000, 8000], bs: [1.03, 1.05, 1.08, 1.12, 1.2] },
  { f: 'B', what: 'The number of bacteria in a culture', unit: 'hour', y: ' bacteria', grow: true, as: [200, 500, 800, 150], bs: [1.2, 1.35, 1.5, 1.25, 1.8] },
  { f: 'V', what: 'The value of a car', unit: 'year', y: '', money: true, grow: false, as: [32000, 24000, 18000, 40000], bs: [0.88, 0.85, 0.9, 0.8] },
  { f: 'S', what: 'The number of views of a video', unit: 'day', y: ' views', grow: true, as: [300, 1200, 2500], bs: [1.4, 1.25, 1.6, 2.1] },
];
const comma = n => (Math.abs(n) >= 10000 ? n.toLocaleString('en-US').replace(/,/g, '{,}') : String(n));
const amt = (st, n) => (st.money ? `\\$${comma(n)}` : `${comma(n)}`);
const amtWords = (st, n) => (st.money ? `$\\$${comma(n)}$` : `${n.toLocaleString('en-US')}${st.y}`);
// a decimal answer that may come from a rounded intermediate value: accept the exact answer and the
// answers from b rounded to 3 or 4 decimals; nudge near misses to keep more decimals
function roundedChecker(targets) {
  return str => {
    const r = readValue(String(str).replace(/,/g, ''));
    if (r.error) return { ok: false, msg: r.error, format: true };
    if (targets.some(t => matches(r.value, t, r.decimal))) return { ok: true };
    const t0 = targets[0];
    if (r.decimal && Math.abs(r.value - t0) <= Math.max(0.05, 0.004 * Math.abs(t0))) return { ok: false, msg: 'Close. Keep more decimal places (or exact values) until the last step, then round to 3 decimal places.', format: true };
    return { ok: false };
  };
}
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const numPart = (label, targets, ph, tex) => ({ type: 'custom', label, check: roundedChecker(targets), preview: previewL, keys: ['ln', 'log_', '(', ')', '^', '/'], placeholder: ph, answerTex: tex, help: VALUE_HELP });
function buildModelsData(level, rng) {
  const st = pick(rng, DSTORIES);
  const U = st.unit, us = `${U}s`;
  if (level === 1) {
    const a = pick(rng, st.as), b = pick(rng, st.bs), per = rng() < 0.3 ? pick(rng, [2, 3, 4]) : 1;
    const mult = st.grow ? pick(rng, [2, 3, 2.5, 4, 1.5]) : pick(rng, [0.5, 0.25, 0.4, 0.3, 0.6]);
    const C = Math.round(a * mult);
    const t = per * Math.log(C / a) / Math.log(b);
    if (t <= 0.5 || t > 80) return null;
    const ex = per === 1 ? 't' : `t/${per}`;
    return {
      tag: per === 1 ? 'model given' : 'model given, t/k',
      prompt: `${st.what} is modeled by $${st.f}(t) = ${amt(st, a)}(${b})^{${per === 1 ? 't' : `\\frac{t}{${per}}`}}$, where $t$ is in ${us}. When will $${st.f}(t) = ${amt(st, C)}$? Round to 3 decimal places.`,
      parts: [numPart('$t =$', [t], 'e.g. 11.384', `$${d3(t)}$`)],
      solution: `Set the model equal to ${amtWords(st, C)}: $${a}(${b})^{${ex}} = ${C}$.<br>Divide by ${a}: $(${b})^{${ex}} = ${F(C, a).tex()}$.<br>`
        + `Take the natural log of both sides: $${per === 1 ? 't' : `\\tfrac{t}{${per}}`}\\ln ${b} = \\ln\\left(${F(C, a).tex()}\\right)$, so $t = ${per === 1 ? '' : `${per}\\cdot`}\\dfrac{\\ln(${F(C, a).tex()})}{\\ln ${b}} \\approx ${d3(t)}$ ${us}.`,
      _check: { a, b, per, C, t },
    };
  }
  if (level === 2) {
    const a = pick(rng, st.as), bt = pick(rng, st.bs), k = randInt(rng, 3, 8);
    const Y = Math.round(a * Math.pow(bt, k));
    const b = Math.pow(Y / a, 1 / k);
    const mult = st.grow ? pick(rng, [2, 3, 4, 5]) : pick(rng, [0.5, 0.25, 0.2, 0.1, 0.125]);
    const C = st.grow ? Math.round(a * mult) : Math.round(a * mult);
    if (st.grow ? C <= Y : C >= Y) return null;
    const t = Math.log(C / a) / Math.log(b);
    if (t <= k || t > 120) return null;
    const tB = bb => Math.log(C / a) / Math.log(bb);
    return {
      tag: st.grow ? 'growth from t = 0' : 'decay from t = 0',
      prompt: `${st.what} is ${amtWords(st, a)} at $t = 0$ and ${amtWords(st, Y)} at $t = ${k}$, where $t$ is in ${us}. Model it with $${st.f}(t) = ab^t$, then find when it reaches ${amtWords(st, C)}. Round to 3 decimal places.`,
      parts: [
        { type: 'number', label: '$a =$', answer: F(a) },
        numPart('$b =$', [b], 'e.g. 0.829', `$\\left(${F(Y, a).tex()}\\right)^{1/${k}} \\approx ${d3(b)}$`),
        numPart('$t =$', [t, tB(r3(b)), tB(r4(b))], 'e.g. 11.103', `$${d3(t)}$`),
      ],
      solution: `At $t = 0$ the model gives $a$, so $a = ${a}$.<br>Then $${a}b^{${k}} = ${Y}$, so $b^{${k}} = ${F(Y, a).tex()}$ and $b = \\left(${F(Y, a).tex()}\\right)^{1/${k}} \\approx ${b.toFixed(4)}$.<br>`
        + `Solve $${a}b^t = ${C}$: $b^t = ${F(C, a).tex()}$, so $t = \\dfrac{\\ln(${F(C, a).tex()})}{\\ln b} \\approx ${d3(t)}$ ${us}. (Use the stored value of $b$, not a rounded one, to keep the answer accurate.)`,
      _check: { a, Y, k, b, C, t },
    };
  }
  if (rng() < 0.6) {
    // two points, neither at t = 0
    const a = pick(rng, st.as), bt = pick(rng, st.bs), t1 = randInt(rng, 1, 4), t2 = t1 + randInt(rng, 3, 6);
    const Y1 = Math.round(a * Math.pow(bt, t1)), Y2 = Math.round(a * Math.pow(bt, t2));
    if (Y1 === Y2) return null;
    const b = Math.pow(Y2 / Y1, 1 / (t2 - t1)), A = Y1 / Math.pow(b, t1);
    const mult = st.grow ? pick(rng, [2, 3, 1.5]) : pick(rng, [0.5, 0.4, 0.25]);
    const C = Math.round((st.grow ? Y2 : Y2) * mult);
    const t = Math.log(C / A) / Math.log(b);
    if (t <= t2 || t > 150) return null;
    const aB = bb => Y1 / Math.pow(bb, t1), tB = bb => Math.log(C / aB(bb)) / Math.log(bb);
    return {
      tag: 'two points, neither at 0',
      prompt: `${st.what} is modeled by $${st.f}(t) = ab^t$, where $t$ is in ${us}. $${st.f}(${t1}) = ${amt(st, Y1)}$ and $${st.f}(${t2}) = ${amt(st, Y2)}$. Find $b$ and $a$, then find when $${st.f}(t) = ${amt(st, C)}$. Round to 3 decimal places.`,
      parts: [
        numPart('$b =$', [b], 'e.g. 1.201', `$\\left(${F(Y2, Y1).tex()}\\right)^{1/${t2 - t1}} \\approx ${d3(b)}$`),
        numPart('$a =$', [A, aB(r3(b)), aB(r4(b))], 'e.g. 1247.703', `$${d3(A)}$`),
        numPart('$t =$', [t, tB(r3(b)), tB(r4(b))], 'e.g. 11.36', `$${d3(t)}$`),
      ],
      solution: `Divide the two equations to cancel $a$: $\\dfrac{ab^{${t2}}}{ab^{${t1}}} = b^{${t2 - t1}} = \\dfrac{${Y2}}{${Y1}}$, so $b = \\left(${F(Y2, Y1).tex()}\\right)^{1/${t2 - t1}} \\approx ${b.toFixed(4)}$.<br>`
        + `Then $a = \\dfrac{${Y1}}{b^{${t1}}} \\approx ${d3(A)}$. (Neither point is at $t = 0$, so $a$ is not one of the given values.)<br>`
        + `Solve $ab^t = ${C}$: $t = \\dfrac{\\ln(${C}/a)}{\\ln b} \\approx ${d3(t)}$ ${us}.`,
      _check: { Y1, Y2, t1, t2, b, A, C, t },
    };
  }
  // percent remaining
  const subst = pick(rng, [{ w: 'A radioactive substance decays', u: 'year', T: [50, 20, 30, 100] }, { w: 'A medication leaves the body', u: 'hour', T: [6, 8, 10, 12] }, { w: 'A cleaning solution breaks down', u: 'day', T: [5, 7, 14] }]);
  const p = pick(rng, [30, 40, 60, 75, 80, 50]), q = pick(rng, [10, 20, 5, 25].filter(x => x < p)), T = pick(rng, subst.T);
  const b = Math.pow(p / 100, 1 / T), t = T * Math.log(q / 100) / Math.log(p / 100);
  const tB = bb => Math.log(q / 100) / Math.log(bb);
  return {
    tag: 'percent remaining',
    prompt: `${subst.w} exponentially, so that ${p}% of the original amount remains after ${plural(T, subst.u)}. Model the fraction that remains with $y = b^t$, where $t$ is in ${subst.u}s. How long until only ${q}% remains? Round to 3 decimal places.`,
    parts: [
      numPart('$b =$', [b], 'e.g. 0.976', `$(${p / 100})^{1/${T}} \\approx ${b.toFixed(4)}$`),
      numPart('$t =$', [t, tB(r3(b)), tB(r4(b)), tB(+b.toFixed(5))], 'e.g. 95.624', `$${T}\\cdot\\dfrac{\\ln ${q / 100}}{\\ln ${p / 100}} \\approx ${d3(t)}$`),
    ],
    solution: `The starting amount does not matter, so use the fraction remaining: $a = 1$. After ${T} ${subst.u}s, $b^{${T}} = ${p / 100}$, so $b = (${p / 100})^{1/${T}} \\approx ${b.toFixed(5)}$.<br>`
      + `Solve $b^t = ${q / 100}$: $t = \\dfrac{\\ln ${q / 100}}{\\ln b} = ${T}\\cdot\\dfrac{\\ln ${q / 100}}{\\ln ${p / 100}} \\approx ${d3(t)}$ ${subst.u}s.`,
    _check: { p, q, T, b, t },
  };
}
