// AP Precalculus 2.8: inverse functions from a table, from a graph, and algebraically.
import { F, randInt, pick, nonzero, parse, evaluate, toTex, shuffle } from '../../math.js?v=2.4';

const GROUP = 'Unit 2 - Inverses and Composition';
const isInt = v => Number.isInteger(v);

// =====================================================================
// 1. Inverse from a table
// =====================================================================
export const invTable = {
  id: 'inverse-table',
  course: 'precalc',
  group: GROUP,
  lesson: '2.8',
  title: 'Inverses from a Table',
  blurb: 'Swap inputs and outputs to read the inverse, and decide whether the inverse is a function.',
  levels: {
    1: { name: 'Easy', desc: 'Read values of the inverse from a table' },
    2: { name: 'Medium', desc: 'Decide whether the inverse is a function, then read a value' },
    3: { name: 'Challenging', desc: 'Inverse of an inverse value, and mixing f with its inverse' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildInvTable(level, rng); if (p) return p; }
    throw new Error('inverse-table: could not build');
  },
};

const INV_CHOICES = [
  'Yes, because every output of $f$ comes from exactly one input',
  'No, because an output of $f$ repeats, so the inverse would send it to two values',
  'No, because an input of $f$ repeats',
];

function buildInvTable(level, rng) {
  const xs = shuffle(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).slice(0, 6).sort((a, b) => a - b);
  const oneToOne = level !== 2 || rng() < 0.5;
  let ys;
  if (oneToOne) ys = shuffle(rng, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6);
  else {
    ys = shuffle(rng, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
    ys.splice(randInt(rng, 0, 5), 0, pick(rng, ys));
  }
  const f = new Map(xs.map((x, i) => [x, ys[i]]));
  const inv = y => { const pre = xs.filter(x => f.get(x) === y); return pre.length === 1 ? pre[0] : undefined; };
  const name = pick(rng, ['f', 'g', 'h']);
  const visual = `<table class="seq-table"><tr><th>$x$</th>${xs.map(x => `<th>${x}</th>`).join('')}</tr><tr><th>$${name}(x)$</th>${ys.map(y => `<td>${y}</td>`).join('')}</tr></table>`;
  const invT = `${name}^{-1}`;
  const parts = [], steps = [`The inverse swaps inputs and outputs: if $${name}(a) = b$, then $${invT}(b) = a$.`];
  const uniqueOutputs = [...new Set(ys)].filter(y => inv(y) !== undefined);

  if (level === 1) {
    const [p, q] = shuffle(rng, uniqueOutputs).slice(0, 2);
    parts.push({ type: 'number', label: `$${invT}(${p}) =$`, answer: F(inv(p)) });
    parts.push({ type: 'number', label: `$${invT}(${q}) =$`, answer: F(inv(q)) });
    steps.push(`Find $${p}$ in the $${name}(x)$ row: it is above $x = ${inv(p)}$, so $${invT}(${p}) = ${inv(p)}$.`);
    steps.push(`Find $${q}$ in the $${name}(x)$ row: it is above $x = ${inv(q)}$, so $${invT}(${q}) = ${inv(q)}$.`);
  } else if (level === 2) {
    parts.push({ type: 'mc', label: `Is $${invT}$ a function?`, choices: INV_CHOICES, answer: oneToOne ? 0 : 1 });
    const p = pick(rng, uniqueOutputs);
    parts.push({ type: 'number', label: `$${invT}(${p}) =$`, answer: F(inv(p)) });
    if (oneToOne) steps.push(`Every output in the $${name}(x)$ row is different, so each input of $${invT}$ goes to exactly one output: $${invT}$ is a function.`);
    else {
      const rep = ys.find((y, i) => ys.indexOf(y) !== i);
      const pre = xs.filter(x => f.get(x) === rep);
      steps.push(`The output $${rep}$ appears twice: $${name}(${pre[0]}) = ${rep}$ and $${name}(${pre[1]}) = ${rep}$. The inverse would send $${rep}$ to both $${pre[0]}$ and $${pre[1]}$, so $${invT}$ is not a function. (The inputs of $${name}$ never repeat, so $${name}$ itself is a function.)`);
    }
    steps.push(`$${p}$ appears once in the $${name}(x)$ row, above $x = ${inv(p)}$, so $${invT}(${p}) = ${inv(p)}$.`);
  } else {
    // f^{-1}(f^{-1}(p)) and a mix like f(f^{-1}(q)) + f^{-1}(f(r)) or f^{-1}(p) + f(r)
    const chains = uniqueOutputs.filter(p => inv(inv(p)) !== undefined);
    if (!chains.length) return null;
    const p = pick(rng, chains), mid = inv(p), out = inv(mid);
    parts.push({ type: 'number', label: `$${invT}\\left(${invT}(${p})\\right) =$`, answer: F(out) });
    steps.push(`Inside first: $${invT}(${p}) = ${mid}$ (the $x$ above $${p}$). Then $${invT}(${mid}) = ${out}$ (the $x$ above $${mid}$).`);
    const r = pick(rng, xs), q = pick(rng, uniqueOutputs);
    if (rng() < 0.5) {
      const val = f.get(r) + inv(q);
      parts.push({ type: 'number', label: `$${name}(${r}) + ${invT}(${q}) =$`, answer: F(val) });
      steps.push(`$${name}(${r}) = ${f.get(r)}$ (read down from $x = ${r}$) and $${invT}(${q}) = ${inv(q)}$ (read up from $${q}$), so the sum is $${val}$.`);
    } else {
      const fr = f.get(r);
      const target = inv(fr) !== undefined ? 'ok' : null;
      if (!target) return null;
      parts.push({ type: 'number', label: `$${invT}\\left(${name}(${r})\\right) =$`, answer: F(r) });
      steps.push(`$${name}(${r}) = ${fr}$, and $${invT}(${fr}) = ${r}$. An inverse undoes the function, so $${invT}\\left(${name}(${r})\\right) = ${r}$.`);
    }
  }
  return {
    tag: level === 1 ? 'read inverse values' : level === 2 ? (oneToOne ? 'inverse is a function' : 'inverse not a function') : 'inverse of inverse',
    prompt: `Selected values of $${name}$ are shown in the table.`,
    visual, parts, solution: steps.join('<br>'),
    _check: { xs, ys },
  };
}

// =====================================================================
// 2. Inverse from a graph (plot on a grid)
// =====================================================================
export const invGraph = {
  id: 'inverse-graph',
  course: 'precalc',
  group: GROUP,
  lesson: '2.8',
  title: 'Graphing Inverses',
  blurb: 'Reflect over y = x by swapping the coordinates of key points, then plot them.',
  levels: {
    1: { name: 'Easy', desc: 'A few points: plot the inverse relation' },
    2: { name: 'Medium', desc: 'A segmented graph: plot the inverse at its corners and endpoints' },
    3: { name: 'Challenging', desc: 'Graphs that may not be one-to-one: plot, then decide if the inverse is a function' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildInvGraph(level, rng); if (p) return p; }
    throw new Error('inverse-graph: could not build');
  },
};

function buildInvGraph(level, rng) {
  const lim = 7;
  let pts, oneToOne;
  if (level === 1) {
    const xs = shuffle(rng, [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).slice(0, 4);
    pts = xs.map(x => ({ x, y: randInt(rng, -6, 6) }));
    if (pts.some(p => p.x === p.y)) return null;               // a point on y = x would not move
    oneToOne = new Set(pts.map(p => p.y)).size === pts.length;
  } else {
    const n = level === 2 ? randInt(rng, 3, 4) : randInt(rng, 4, 5);
    let x = randInt(rng, -6, -3);
    pts = [{ x, y: randInt(rng, -6, 6) }];
    const dir = level === 2 || rng() < 0.3 ? pick(rng, [1, -1]) : 0;
    for (let i = 1; i < n; i++) {
      x += randInt(rng, 1, 4);
      const dy = dir ? dir * randInt(rng, 1, 4) : pick(rng, [-4, -3, -2, -1, 1, 2, 3, 4]);
      pts.push({ x, y: pts[i - 1].y + dy });
    }
    if (pts.some(p => Math.abs(p.x) > 6 || Math.abs(p.y) > 6)) return null;
    // monotone segments are one-to-one; otherwise check if any horizontal line hits twice
    const ys = pts.map(p => p.y);
    const inc = ys.every((y, i) => i === 0 || y > ys[i - 1]), dec = ys.every((y, i) => i === 0 || y < ys[i - 1]);
    oneToOne = inc || dec;
  }
  const swapped = pts.map(p => ({ x: p.y, y: p.x }));
  if (swapped.every(q => pts.some(r => r.x === q.x && r.y === q.y))) return null;   // symmetric about y = x: nothing to reflect
  const seg = (P, t) => {                                       // piecewise linear through P (sorted by x)
    const S = [...P].sort((a, b) => a.x - b.x);
    if (t < S[0].x || t > S[S.length - 1].x) return NaN;
    for (let i = 1; i < S.length; i++) if (t <= S[i].x && S[i].x !== S[i - 1].x) return S[i - 1].y + (S[i].y - S[i - 1].y) * (t - S[i - 1].x) / (S[i].x - S[i - 1].x);
    return NaN;
  };
  const base = level === 1 ? { line: true, points: pts.map(p => ({ ...p, text: `(${p.x}, ${p.y})` })) }
    : { line: true, fn: t => seg(pts, t), points: pts.map(p => ({ ...p })) };
  const fnInv = level === 1 || !oneToOne ? undefined : t => seg(swapped, t);
  const parts = [{
    type: 'graph', label: `Plot the ${level === 1 ? `${pts.length} points of the inverse relation` : `inverse at each of the ${pts.length} marked points`}`,
    window: { xmin: -lim, xmax: lim, ymin: -lim, ymax: lim }, snap: 1, fn: fnInv, correct: swapped, base,
    answerTex: 'the reflected points shown on the grid',
    help: 'The gray graph is the original. The dashed gold line is y = x.',
    check: P => {
      if (P.length !== pts.length) return { ok: false, format: true, msg: `Plot exactly ${pts.length} points. You have ${P.length}.` };
      const want = new Set(swapped.map(p => `${p.x},${p.y}`));
      return { ok: P.every(p => want.has(`${p.x},${p.y}`)) };
    },
  }];
  if (level !== 2) parts.push({ type: 'mc', label: 'Is the inverse a function?', choices: ['Yes', 'No'], answer: oneToOne ? 0 : 1 });
  const steps = [
    `Reflecting over $y = x$ swaps the coordinates of every point: $(a, b)$ becomes $(b, a)$.`,
    pts.map((p, i) => `$(${p.x}, ${p.y}) \\to (${swapped[i].x}, ${swapped[i].y})$`).join(', ') + '.',
  ];
  if (level > 1) steps.push('Connect the new points in the same order to sketch the inverse.');
  if (level !== 2) {
    if (oneToOne) steps.push('No two points of the original share a $y$-value, so no two points of the inverse share an $x$-value. The inverse is a function.');
    else {
      const ys = pts.map(p => p.y);
      const dupY = level === 1 ? ys.find((y, i) => ys.indexOf(y) !== i) : null;
      steps.push(dupY !== null && dupY !== undefined
        ? `Two points of the original have $y = ${dupY}$, so the inverse has two points with $x = ${dupY}$. It fails the vertical line test: not a function.`
        : 'The original goes up and then down (or down and then up), so some horizontal line crosses it twice. After reflecting, a vertical line crosses the inverse twice: not a function.');
    }
  }
  return {
    tag: level === 1 ? 'points' : level === 2 ? 'one-to-one graph' : (oneToOne ? 'graph, inverse is a function' : 'graph, inverse not a function'),
    prompt: level === 1 ? 'The points of a relation are shown in gray. Plot the inverse relation.' : 'The graph of $f$ is shown in gray. Plot the points of the inverse that match the marked corners and endpoints of $f$.',
    parts, solution: steps.join('<br>'),
    _check: { pts, swapped, oneToOne },
  };
}

// =====================================================================
// 3. Finding inverses algebraically
// =====================================================================
export const invAlgebra = {
  id: 'inverse-algebra',
  course: 'precalc',
  group: GROUP,
  lesson: '2.8',
  title: 'Finding Inverses Algebraically',
  blurb: 'Swap x and y, then solve for y.',
  levels: {
    1: { name: 'Easy', desc: 'Linear functions like f(x) = 3x - 7' },
    2: { name: 'Medium', desc: 'Linear functions with fractions, like f(x) = (2x - 5)/3' },
    3: { name: 'Challenging', desc: 'Rational functions like f(x) = (3x + 4)/(2x - 5)' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = buildInvAlgebra(level, rng); if (p) return p; }
    throw new Error('inverse-algebra: could not build');
  },
};

const lin = (m, b, v = 'x') => {                    // m v + b with Frac m, b
  const mT = m.eq(1) ? '' : m.eq(-1) ? '-' : m.isInt() ? String(m.n) : (m.n < 0 ? '-' : '') + `\\tfrac{${Math.abs(m.n)}}{${m.d}}`;
  return `${mT}${v}${b.isZero() ? '' : (b.sign() < 0 ? ' - ' : ' + ') + (b.isInt() ? Math.abs(b.n) : `\\tfrac{${Math.abs(b.n)}}{${b.d}}`)}`;
};
const linI = (a, b, v = 'x') => `${a === 1 ? '' : a === -1 ? '-' : a}${v}${b === 0 ? '' : b < 0 ? ` - ${-b}` : ` + ${b}`}`;   // integer coefficients

function invChecker(truth, bad) {
  return str => {
    let s = String(str).replace(/[−–]/g, '-').trim();
    if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
    if (!s) return { ok: false, msg: 'Enter the inverse in terms of x.', format: true };
    let tree;
    try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Example: (x + 7)/3', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
    for (const v of vars) if (v !== 'x') return { ok: false, msg: 'Write the inverse using x as the variable.', format: true };
    const xs = [-3.7, -2.1, -0.6, 0.4, 1.3, 2.9, 4.2, 6.5].filter(x => !isFinite(bad) || Math.abs(x - bad) > 0.05);
    const ok = xs.every(x => { const g = evaluate(tree, { x }), w = truth(x); return isFinite(g) && Math.abs(g - w) < 1e-7 * Math.max(1, Math.abs(w)); });
    return { ok };
  };
}
const preview = str => { try { let s = String(str).replace(/[−–]/g, '-').trim(); if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1); return s.trim() ? toTex(parse(s)) : ''; } catch { return null; } };

function buildInvAlgebra(level, rng) {
  const name = pick(rng, ['f', 'g', 'h', 'r']);
  const steps = [];
  let fTex, truth, fwd, ansTex, bad = NaN, tag, check;
  if (level < 3) {
    let m, b, given;
    if (level === 1) {
      m = F(nonzero(rng, -6, 6)); if (m.abs().eq(1)) return null;
      b = F(nonzero(rng, -12, 12));
      fTex = lin(m, b); tag = 'linear';
    } else {
      const form = pick(rng, ['over', 'frac', 'reverse']);
      if (form === 'over') {                        // (p x + q)/c
        const p = nonzero(rng, -5, 5), q = nonzero(rng, -9, 9), c = pick(rng, [2, 3, 4, 5]);
        if (p % c === 0 && q % c === 0) return null;
        m = F(p, c); b = F(q, c);
        fTex = `\\dfrac{${linI(p, q)}}{${c}}`; given = { p, q, c };
      } else if (form === 'frac') {                 // (p/c) x + q
        const p = nonzero(rng, -5, 5), c = pick(rng, [2, 3, 4]); if (p % c === 0) return null;
        m = F(p, c); b = F(nonzero(rng, -8, 8)); fTex = lin(m, b);
      } else {                                      // q - (p/c) x
        const p = pick(rng, [1, 2, 3, 5]), c = pick(rng, [2, 3, 4]); if (p % c === 0) return null;
        m = F(-p, c); b = F(nonzero(rng, -8, 8));
        fTex = `${b.n} - \\tfrac{${p}}{${c}}x`;
      }
      tag = 'linear with fractions';
    }
    // inverse: x = m y + b  ->  y = (x - b)/m
    const im = F(1).div(m), ib = b.neg().div(m);
    truth = x => (x - b.value()) / m.value();
    fwd = x => m.value() * x + b.value();
    ansTex = `${lin(im, ib)}`;
    const bT = b.sign() < 0 ? `+ ${b.abs().tex()}` : `- ${b.tex()}`;
    steps.push(`Write $y = ${fTex}$ and swap $x$ and $y$: $x = ${fTex.replace(/x/g, 'y')}$.`);
    if (given) {
      const { p, q, c } = given;   // x = (p y + q)/c
      steps.push(`Multiply both sides by $${c}$: $${c}x = ${linI(p, q, 'y')}$.`);
      steps.push(`${q < 0 ? 'Add' : 'Subtract'} $${Math.abs(q)}$: $${p === 1 ? '' : p === -1 ? '-' : p}y = ${linI(c, -q)}$. Divide by $${p}$: $y = \\dfrac{${linI(c, -q)}}{${p}} = ${ansTex}$.`);
    } else if (m.isInt()) {
      steps.push(`${b.sign() < 0 ? 'Add' : 'Subtract'} $${b.abs().tex()}$: $x ${bT} = ${m.n === -1 ? '-' : m.n}y$. Divide by $${m.tex()}$: $y = \\dfrac{x ${bT}}{${m.tex()}} = ${ansTex}$.`);
    } else {
      steps.push(`${b.sign() < 0 ? 'Add' : 'Subtract'} $${b.abs().tex()}$: $x ${bT} = ${lin(m, F(0), 'y')}$. Multiply both sides by $${F(1).div(m).tex()}$ (the reciprocal of $${m.tex()}$): $y = ${F(1).div(m).tex()}\\left(x ${bT}\\right) = ${ansTex}$.`);
    }
    steps.push(`So $${name}^{-1}(x) = ${ansTex}$. Equivalent forms are fine.`);
    check = invChecker(truth, bad);
  } else {
    // (a x + b)/(c x + d), ad - bc != 0, written with a positive x coefficient in the denominator
    const a = nonzero(rng, -5, 5), b = randInt(rng, -7, 7), c = randInt(rng, 1, 3), d = randInt(rng, -6, 6);
    if (a * d - b * c === 0) return null;
    const num = linI(a, b), den = linI(c, d);
    fTex = `\\dfrac{${num}}{${den}}`;
    truth = x => (b - d * x) / (c * x - a);
    fwd = x => (a * x + b) / (c * x + d);
    bad = a / c;
    const co = k => (k === 1 ? '' : k === -1 ? '-' : String(k));
    const xTerm = k => (k === 0 ? '' : `${k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}x`);
    const rhs = linI(-d, b).replace(/^0x(?: \+ )?/, '');      // b - d x, written x-term first
    const rhsT = d === 0 ? String(b) : rhs;
    const numInv = d === 0 ? String(b) : b === 0 ? `${co(-d)}x` : linI(-d, b);
    ansTex = `\\dfrac{${numInv}}{${linI(c, -a)}}`;
    steps.push(`Write $y = ${fTex}$ and swap $x$ and $y$: $x = \\dfrac{${linI(a, b, 'y')}}{${linI(c, d, 'y')}}$.`);
    steps.push(`Multiply both sides by the denominator: $x\\left(${linI(c, d, 'y')}\\right) = ${linI(a, b, 'y')}$, so $${co(c)}xy${xTerm(d)} = ${linI(a, b, 'y')}$.`);
    steps.push(`Get the $y$ terms on one side and everything else on the other: $${co(c)}xy ${a < 0 ? '+' : '-'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}y = ${rhsT}$.`);
    steps.push(`Factor out $y$: $y\\left(${linI(c, -a)}\\right) = ${rhsT}$, then divide: $${name}^{-1}(x) = ${ansTex}$.`);
    tag = 'rational';
    check = invChecker(truth, bad);
  }
  return {
    tag,
    prompt: `Find the inverse of $${name}(x) = ${fTex}$.`,
    parts: [{ type: 'custom', label: `$${name}^{-1}(x) =$`, check, preview, keys: ['(', ')', '/'], placeholder: level === 3 ? 'e.g. (5x + 4)/(2x - 3)' : 'e.g. (x + 7)/3', answerTex: `$${ansTex}$`, help: 'Type your answer in terms of x. Fractions like (x + 7)/3 or 1/3x + 7/3 are both fine.' }],
    solution: steps.join('<br>'),
    _check: { truth, fwd, bad, fTex },
  };
}
