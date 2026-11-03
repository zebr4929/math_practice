// Accelerated Algebra II, Unit T: transformations of functions.
// Every transformation here is g(x) = A·f(B(x − h)) + k. A point (x, y) on f moves to (x/B + h, A·y + k).
import { F, Frac, randInt, pick, nonzero, parse, evaluate, toTex, shuffle } from '../../math.js?v=2.8';

const GROUP = 'Unit T - Transformations';
const COURSE = ['accel'];

// ---------- choosing a transformation ----------
const A_CHOICES = [F(2), F(3), F(-1), F(-2), F(-3), F(1, 2), F(-1, 2)];
const B_CHOICES = [F(2), F(-1), F(1, 2), F(-2)];
function pickT(level, rng, { forceDilate = false } = {}) {
  let A = F(1), B = F(1), h = 0, k = 0;
  if (level === 1) {
    if (rng() < 0.5) k = nonzero(rng, -8, 8); else h = nonzero(rng, -6, 6);
  } else if (level === 2) {
    h = nonzero(rng, -6, 6); k = nonzero(rng, -8, 8);
    if (forceDilate) { if (rng() < 0.55) A = pick(rng, A_CHOICES); else B = pick(rng, B_CHOICES); }
  } else {
    A = pick(rng, A_CHOICES); B = pick(rng, [...B_CHOICES, F(1)]);
    h = randInt(rng, -5, 5); k = randInt(rng, -8, 8);
    if (B.eq(1) && A.eq(1)) A = F(-1);
  }
  return { A, B, h, k };
}
const mapPoint = (T, x, y) => [F(x).div(T.B).add(T.h), T.A.mul(y).add(T.k)];

// ---------- tex ----------
const coefTex = c => (c.eq(1) ? '' : c.eq(-1) ? '-' : c.isInt() ? String(c.n) : `${c.n < 0 ? '-' : ''}\\tfrac{${Math.abs(c.n)}}{${c.d}}`);
const sh = h => (h === 0 ? 'x' : `x ${h > 0 ? '-' : '+'} ${Math.abs(h)}`);
// inside of f: B(x - h), factored or (when expand) multiplied out
function innerTex(T, expand = false) {
  const { B, h } = T;
  if (B.eq(1)) return sh(h);
  if (h === 0) return `${coefTex(B)}x`;
  if (expand && B.isInt()) { const c = B.mul(-h); return `${coefTex(B)}x ${c.sign() < 0 ? '-' : '+'} ${c.abs().tex()}`; }
  return `${coefTex(B)}\\left(${sh(h)}\\right)`;
}
const kTex = k => (k === 0 ? '' : ` ${k > 0 ? '+' : '-'} ${Math.abs(k)}`);
const callTex = (name, T, expand) => `${coefTex(T.A)}${name}\\left(${innerTex(T, expand)}\\right)${kTex(T.k)}`;

// words for each piece, in the order of the notes: reflections, dilations, translations
const fracWord = f => (f.isInt() ? String(f.n) : `$\\tfrac{${f.n}}{${f.d}}$`);
function describe(T, { dil = 'dilation' } = {}) {
  const out = [];
  if (T.A.sign() < 0) out.push('reflect over the x-axis');
  if (T.B.sign() < 0) out.push('reflect over the y-axis');
  if (!T.A.abs().eq(1)) out.push(`vertical ${dil} by a factor of ${fracWord(T.A.abs())}`);
  if (!T.B.abs().eq(1)) out.push(`horizontal ${dil} by a factor of ${fracWord(F(1).div(T.B.abs()))}`);
  if (T.h) out.push(`${T.h > 0 ? 'right' : 'left'} ${Math.abs(T.h)}`);
  if (T.k) out.push(`${T.k > 0 ? 'up' : 'down'} ${Math.abs(T.k)}`);
  if (!out.length) return 'no change';
  const s = out.join(', ');
  return s[0].toUpperCase() + s.slice(1);
}
const ruleLine = T => `Each point $(x, y)$ on the original moves to $\\left(${T.B.eq(1) ? 'x' : `\\dfrac{x}{${T.B.tex()}}`}${T.h ? ` ${T.h > 0 ? '+' : '-'} ${Math.abs(T.h)}` : ''},\\ ${T.A.eq(1) ? 'y' : T.A.eq(-1) ? '-y' : `${T.A.tex()}y`}${kTex(T.k)}\\right)$: inside the parentheses works on $x$ (and does the opposite of what it looks like), outside works on $y$.`;

// ---------- parents for equations ----------
const PARENTS = {
  sq: { tex: v => `\\left(${v}\\right)^2`, plain: 'x²', name: 'x^2', f: x => x * x },
  abs: { tex: v => `\\left|${v}\\right|`, plain: '|x|', name: '|x|', f: x => Math.abs(x) },
  sqrt: { tex: v => `\\sqrt{${v}}`, plain: '√x', name: '\\sqrt{x}', f: x => (x < 0 ? NaN : Math.sqrt(x)) },
  recip: { tex: v => `\\dfrac{1}{${v}}`, plain: '1/x', name: '\\dfrac{1}{x}', f: x => 1 / x },
};
function eqTex(P, T, expand) {
  const inside = innerTex(T, expand);
  if (P === PARENTS.recip) return (T.A.isInt() ? `\\dfrac{${T.A.n}}{${inside}}` : `${coefTex(T.A)}\\cdot\\dfrac{1}{${inside}}`) + kTex(T.k);
  return `${coefTex(T.A)}${P.tex(inside)}${kTex(T.k)}`;
}
const evalT = (P, T) => x => T.A.value() * P.f(T.B.value() * (x - T.h)) + T.k;

// =====================================================================
// 1. Transformations with tables
// =====================================================================
export const transTables = {
  id: 'transform-tables',
  course: COURSE, group: GROUP, lesson: 'T.1–T.2',
  title: 'Transformations with Tables',
  blurb: 'Use the rule for g in terms of f to fill in the missing values of both tables.',
  levels: {
    1: { name: 'Easy', desc: 'Vertical shifts, like g(x) = f(x) + 4' },
    2: { name: 'Medium', desc: 'Horizontal shifts and combinations, like f(x + 2) − 5' },
    3: { name: 'Challenging', desc: 'Stretches and reflections, like −f(2(x + 3)) − 1' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildTable(level, rng); if (p) return p; }
    throw new Error('transform-tables: could not build');
  },
};

function buildTable(level, rng) {
  const T = level === 1 ? { A: F(1), B: F(1), h: 0, k: nonzero(rng, -8, 8) } : pickT(level, rng);
  // f's x-values must map to whole-number x-values for g
  const step = T.B.abs().eq(2) ? 2 : 1;
  const pool = []; for (let x = -6; x <= 8; x += step) pool.push(x);
  const xs = shuffle(rng, pool).slice(0, 5).sort((a, b) => a - b);
  const ys = xs.map(() => randInt(rng, -8, 9) * (T.A.d === 2 ? 2 : 1));
  const gx = xs.map(x => F(x).div(T.B).add(T.h)), gy = ys.map(y => T.A.mul(y).add(T.k));
  if (gx.some(v => !v.isInt()) || gy.some(v => !v.isInt() || Math.abs(v.n) > 40)) return null;
  // g's table is listed in order of its own x-values
  const order = gx.map((v, i) => i).sort((i, j) => gx[i].value() - gx[j].value());
  // hide: for each column either the f value or the g value (about half each), and at Challenging one g x-value
  const hideF = xs.map(() => rng() < 0.45);
  if (hideF.every(Boolean) || !hideF.some(Boolean)) hideF[randInt(rng, 0, 4)] = !hideF[0];
  const hideGx = level === 3 ? randInt(rng, 0, 4) : -1;
  const parts = [];
  const fCells = xs.map((x, i) => (hideF[i] ? '' : String(ys[i])));
  // which g values are blanks: the columns where f was shown (and the hidden-x column keeps its y shown)
  const gShown = order.map(i => hideF[i] || i === hideGx);
  const gCells = order.map((i, j) => (gShown[j] ? String(gy[i].n) : ''));
  if (hideGx >= 0 && hideF[hideGx]) return null;                   // keep the hidden x solvable: its f value is shown
  xs.forEach((x, i) => { if (hideF[i]) parts.push({ type: 'number', label: `$f(${x}) =$`, answer: F(ys[i]), _col: i }); });
  order.forEach((i, j) => {
    if (i === hideGx) parts.push({ type: 'number', label: `Missing $x$ in the $g$ table (where $g(x) = ${gy[i].n}$):`, answer: gx[i], _col: i });
    else if (!gShown[j]) parts.push({ type: 'number', label: `$g(${gx[i].n}) =$`, answer: gy[i], _col: i });
  });
  const table = (name, xsRow, ysRow) => `<table class="seq-table"><tr><th>$x$</th>${xsRow.map(v => `<th>${v === '' ? '?' : `$${v}$`}</th>`).join('')}</tr><tr><th>$${name}(x)$</th>${ysRow.map(v => `<td>${v === '' ? '?' : `$${v}$`}</td>`).join('')}</tr></table>`;
  const visual = table('f', xs.map(String), fCells) + '<div style="height:10px"></div>' + table('g', order.map(i => (i === hideGx ? '' : String(gx[i].n))), gCells);
  const steps = [ruleLine(T)];
  xs.forEach((x, i) => steps.push(`$(${x}, ${ys[i]})$ on $f$ $\\to$ $(${gx[i].tex()}, ${gy[i].tex()})$ on $g$${hideF[i] ? ` (work backwards from $g(${gx[i].tex()}) = ${gy[i].tex()}$ to get $f(${x}) = ${ys[i]}$)` : ''}.`));
  parts.forEach(p => delete p._col);
  return {
    tag: level === 1 ? 'vertical shift' : level === 2 ? 'horizontal and vertical shifts' : 'dilations and reflections',
    prompt: `Values of $f$ and $g$ are shown, where $g(x) = ${callTex('f', T, level === 3 && rng() < 0.5)}$. Find the missing values (marked ?).`,
    visual, parts, solution: steps.join('<br>'),
    _check: { T: { A: T.A.value(), B: T.B.value(), h: T.h, k: T.k }, xs, ys },
  };
}

// =====================================================================
// 2. Identifying transformations
// =====================================================================
export const transIdentify = {
  id: 'transform-identify',
  course: COURSE, group: GROUP, lesson: 'T.1–T.2',
  title: 'Identifying Transformations',
  blurb: 'Describe how a parent function was moved, stretched or reflected.',
  levels: {
    1: { name: 'Easy', desc: 'Translations only, like (x + 7)² − 1' },
    2: { name: 'Medium', desc: 'One stretch or reflection plus shifts, like −2(x − 3)² − 5' },
    3: { name: 'Challenging', desc: 'Combinations, including factoring first, like −|−3x − 6| + 1' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      const P = pick(rng, Object.values(PARENTS));
      const T = pickT(level, rng, { forceDilate: true });
      if (P !== PARENTS.sqrt && T.B.sign() < 0) T.B = T.B.neg();       // a y-axis reflection only changes the graph of √x here
      if (level === 1 && T.h === 0 && T.k === 0) continue;
      if (level === 1) { T.h = nonzero(rng, -8, 8); T.k = nonzero(rng, -6, 6); }
      const expand = level === 3 && T.B.isInt() && !T.B.eq(1) && T.h !== 0 && rng() < 0.6;
      const right = describe(T);
      const cand = [];
      if (T.h) cand.push({ ...T, h: -T.h });
      if (T.k) cand.push({ ...T, k: -T.k });
      if (!T.B.abs().eq(1)) cand.push({ ...T, B: F(1).div(T.B) });
      if (T.A.sign() < 0 || T.B.sign() < 0) cand.push({ ...T, A: T.A.neg(), B: T.B.neg() });
      if (expand) cand.push({ ...T, h: T.B.mul(T.h).n });                       // forgot to factor out B
      if (T.h && T.k) cand.push({ ...T, h: -T.h, k: -T.k });
      if (T.h && T.k && Math.abs(T.h) !== Math.abs(T.k)) cand.push({ ...T, h: Math.sign(T.h) * Math.abs(T.k), k: Math.sign(T.k) * Math.abs(T.h) });
      if (!T.A.abs().eq(1)) cand.push({ ...T, A: F(1).div(T.A) });
      // drop any distractor that happens to describe the same graph (for example 1/(-x) = -1/x)
      const truth = evalT(P, T), xsS = [-7.3, -4.1, -2.2, -0.7, 0.6, 1.9, 3.3, 5.8, 8.4];
      const same = U => { const g = evalT(P, U); return xsS.every(x => { const a = truth(x), b = g(x); return (!isFinite(a) && !isFinite(b)) || Math.abs(a - b) < 1e-9; }); };
      const wrongs = new Set(cand.filter(U => !same(U)).map(U => describe(U)));
      wrongs.delete(right);
      const w = shuffle(rng, [...wrongs]).slice(0, 3);
      if (w.length < 3) continue;
      const choices = shuffle(rng, [right, ...w]);
      const name = pick(rng, ['f', 'g', 'h', 'r']);
      const steps = [];
      if (expand) steps.push(`First factor the inside: $${innerTex(T, true)} = ${innerTex(T)}$. A shift is only readable once the coefficient of $x$ is factored out.`);
      steps.push(`Compare with $y = A\\cdot f\\big(B(x - h)\\big) + k$ for the parent $y = ${P.name}$: $A = ${T.A.tex()}$, $B = ${T.B.tex()}$, $h = ${T.h}$, $k = ${T.k}$.`);
      if (T.A.sign() < 0) steps.push('A negative outside reflects over the x-axis.');
      if (T.B.sign() < 0) steps.push('A negative inside reflects over the y-axis.');
      if (!T.A.abs().eq(1)) steps.push(`$|A| = ${T.A.abs().tex()}$ is a vertical dilation by a factor of $${T.A.abs().tex()}$.`);
      if (!T.B.abs().eq(1)) steps.push(`$|B| = ${T.B.abs().tex()}$ inside is a horizontal dilation by a factor of $\\dfrac{1}{${T.B.abs().tex()}} = ${F(1).div(T.B.abs()).tex()}$ (inside does the opposite).`);
      if (T.h) steps.push(`$x ${T.h > 0 ? '-' : '+'} ${Math.abs(T.h)}$ shifts ${T.h > 0 ? 'right' : 'left'} ${Math.abs(T.h)} (again, the opposite of the sign).`);
      if (T.k) steps.push(`$${T.k > 0 ? '+' : '-'} ${Math.abs(T.k)}$ outside shifts ${T.k > 0 ? 'up' : 'down'} ${Math.abs(T.k)}.`);
      return {
        tag: level === 1 ? 'translations' : level === 2 ? 'one dilation or reflection' : (expand ? 'factor first' : 'combinations'),
        prompt: `Identify the transformations of the parent function $y = ${P.name}$ in $${name}(x) = ${eqTex(P, T, expand)}$.`,
        parts: [{ type: 'mc', label: 'Choose one:', choices, answer: choices.indexOf(right) }],
        solution: steps.join('<br>'),
        _check: { A: T.A.value(), B: T.B.value(), h: T.h, k: T.k, right },
      };
    }
    throw new Error('transform-identify: could not build');
  },
};

// =====================================================================
// 3. Where does the point go?
// =====================================================================
export const transPoint = {
  id: 'transform-point',
  course: COURSE, group: GROUP, lesson: 'T.1–T.2',
  title: 'Where Does the Point Go?',
  blurb: 'Given one point on f, find the matching point on a transformed function.',
  levels: {
    1: { name: 'Easy', desc: 'Translations, like f(x − 3) + 1' },
    2: { name: 'Medium', desc: 'One stretch or reflection, like 2f(x), f(−x) or ½f(−x)' },
    3: { name: 'Challenging', desc: 'Full combinations, like −g(−2(x + 4)) + 3, and vertex questions' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      if (level === 3 && rng() < 0.25) { const p = vertexQuestion(rng); if (p) return p; continue; }
      const name = pick(rng, ['f', 'g']);
      const x0 = nonzero(rng, -6, 6), y0 = nonzero(rng, -8, 8);
      let T;
      if (level === 1) T = { A: F(1), B: F(1), h: nonzero(rng, -7, 7), k: nonzero(rng, -8, 8) };
      else if (level === 2) {
        T = { A: F(1), B: F(1), h: 0, k: 0 };
        if (rng() < 0.5) T.A = pick(rng, A_CHOICES); else T.B = pick(rng, B_CHOICES);
        if (rng() < 0.4 && T.B.eq(1) && T.A.eq(-1)) T.B = F(-1);         // like ½f(−x)
        if (rng() < 0.3) T.k = nonzero(rng, -5, 5);
      } else T = pickT(3, rng);
      const [nx, ny] = mapPoint(T, x0, y0);
      if (nx.d > 2 || ny.d > 2) continue;
      return {
        tag: level === 1 ? 'translations' : level === 2 ? 'one dilation or reflection' : 'combinations',
        prompt: `For a function $${name}$, $${name}(${x0}) = ${y0}$. Find a point on the graph of $y = ${callTex(name, T, false)}$.`,
        parts: [{ type: 'point', label: 'Point:', answer: [nx, ny], placeholder: 'e.g. (1, 7)' }],
        solution: `The point $(${x0}, ${y0})$ is on $${name}$. ${ruleLine(T)}<br>`
          + `$x$: $${T.B.eq(1) ? x0 : `\\dfrac{${x0}}{${T.B.tex()}}`}${T.h ? ` ${T.h > 0 ? '+' : '-'} ${Math.abs(T.h)}` : ''} = ${nx.tex()}$. $\\;y$: $${T.A.eq(1) ? y0 : `${T.A.tex()}(${y0})`}${kTex(T.k)} = ${ny.tex()}$.<br>`
          + `So $(${nx.tex()}, ${ny.tex()})$ is on the new graph.`,
        _check: { x0, y0, A: T.A.value(), B: T.B.value(), h: T.h, k: T.k },
      };
    }
    throw new Error('transform-point: could not build');
  },
};

function vertexQuestion(rng) {
  // f(x) = a x^2 + b x + c with integer vertex; g(x) = f(x - h) + k
  const a = pick(rng, [1, -1, 2, -2]), p = randInt(rng, -4, 4), q = randInt(rng, -9, 9);
  const b = -2 * a * p, c = a * p * p + q;
  const h = nonzero(rng, -5, 5), k = rng() < 0.5 ? 0 : nonzero(rng, -6, 6);
  const poly = `${a === 1 ? '' : a === -1 ? '-' : a}x^2${b ? ` ${b > 0 ? '+' : '-'} ${Math.abs(b)}x` : ''}${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''}`;
  return {
    tag: 'vertex after a shift',
    prompt: `Let $f(x) = ${poly}$ and $g(x) = f(${sh(h)})${kTex(k)}$. Find the coordinates of the vertex of $g$.`,
    parts: [{ type: 'point', label: 'Vertex of $g$:', answer: [F(p + h), F(q + k)], placeholder: 'e.g. (6, -1)' }],
    solution: `The vertex of $f$ is at $x = -\\dfrac{b}{2a} = ${p}$, and $f(${p}) = ${q}$, so it is $(${p}, ${q})$.<br>`
      + `$g(x) = f(${sh(h)})${kTex(k)}$ moves every point ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}${k ? ` and ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}` : ''}, so the vertex of $g$ is $(${p + h}, ${q + k})$.`,
    _check: { a, b, c, h, k, vx: p + h, vy: q + k },
  };
}

// =====================================================================
// 4. Writing equations from transformations
// =====================================================================
export const transWrite = {
  id: 'transform-write',
  course: COURSE, group: GROUP, lesson: 'T.1–T.2',
  title: 'Writing Equations from Transformations',
  blurb: 'Start from a parent function and build the equation from a list of transformations.',
  levels: {
    1: { name: 'Easy', desc: 'Shifts only, like x² shifted up 4 and left 1' },
    2: { name: 'Medium', desc: 'One stretch or reflection plus shifts' },
    3: { name: 'Challenging', desc: 'Horizontal stretches and both reflections together' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      const key = pick(rng, Object.keys(PARENTS)), P = PARENTS[key];
      const T = pickT(level, rng, { forceDilate: true });
      if (level === 1) { T.h = nonzero(rng, -7, 7); T.k = nonzero(rng, -8, 8); }
      if (level === 3 && T.B.abs().eq(1) && rng() < 0.7) T.B = pick(rng, [F(2), F(-2), F(1, 2), F(-1, 2), F(3), F(-1, 3)]);
      const truth = evalT(P, T);
      const xs = []; for (let x = -12; x <= 12; x += 0.7) if (isFinite(truth(x)) && Math.abs(x - T.h) > 0.2) xs.push(x);
      if (xs.length < 5) continue;
      const fname = pick(rng, ['f', 'g', 'h']);
      const desc = writtenSteps(T);
      const answer = eqTex(P, T, false);
      return {
        tag: level === 1 ? 'shifts only' : level === 2 ? 'one stretch or reflection' : 'combinations',
        prompt: `Let $${fname}(x) = ${P.name}$. Write the equation of the function that has been ${desc}.`,
        parts: [{ type: 'custom', label: '$y =$', check: equationChecker(truth, xs), preview: prevEq, keys: ['(', ')', '^2', '√', '|', '/'], placeholder: key === 'sqrt' ? 'e.g. 3sqrt(-(x + 4)) - 1' : key === 'abs' ? 'e.g. -|1/2(x - 7)| + 2' : 'e.g. (x + 1)^2 + 4', answerTex: `$${answer}$`, help: 'Type square roots as sqrt( ) and absolute value with | | or abs( ).' }],
        solution: `Use $y = A\\cdot ${fname}\\big(B(x - h)\\big) + k$.<br>`
          + (T.A.sign() < 0 ? 'Reflecting across the x-axis makes $A$ negative. ' : '') + (T.B.sign() < 0 ? 'Reflecting across the y-axis makes $B$ negative. ' : '')
          + (!T.A.abs().eq(1) ? `A vertical stretch by a factor of $${T.A.abs().tex()}$ gives $|A| = ${T.A.abs().tex()}$. ` : '')
          + (!T.B.abs().eq(1) ? `A horizontal stretch by a factor of $${F(1).div(T.B.abs()).tex()}$ gives $|B| = ${T.B.abs().tex()}$ (the reciprocal, because inside does the opposite). ` : '')
          + `${T.h ? `Shifting ${T.h > 0 ? 'right' : 'left'} ${Math.abs(T.h)} gives $x ${T.h > 0 ? '-' : '+'} ${Math.abs(T.h)}$ inside. ` : ''}${T.k ? `Shifting ${T.k > 0 ? 'up' : 'down'} ${Math.abs(T.k)} adds $${T.k}$ outside.` : ''}<br>`
          + `So $y = ${answer}$.`,
        _check: { key, A: T.A.value(), B: T.B.value(), h: T.h, k: T.k, xs },
      };
    }
    throw new Error('transform-write: could not build');
  },
};

// "reflected across the y-axis, vertically stretched by a factor of 3, and shifted left 4 units and down 1 unit"
function writtenSteps(T) {
  const out = [];
  if (T.A.sign() < 0) out.push('reflected across the x-axis');
  if (T.B.sign() < 0) out.push('reflected across the y-axis');
  if (!T.A.abs().eq(1)) out.push(`vertically stretched by a factor of ${fracWord(T.A.abs())}`);
  if (!T.B.abs().eq(1)) out.push(`horizontally stretched by a factor of ${fracWord(F(1).div(T.B.abs()))}`);
  const u = n => `${Math.abs(n)} unit${Math.abs(n) === 1 ? '' : 's'}`;
  const shifts = [];
  if (T.h) shifts.push(`${T.h > 0 ? 'right' : 'left'} ${u(T.h)}`);
  if (T.k) shifts.push(`${T.k > 0 ? 'up' : 'down'} ${u(T.k)}`);
  if (shifts.length) out.push('shifted ' + shifts.join(' and '));
  return out.length > 1 ? out.slice(0, -1).join(', ') + ', and ' + out[out.length - 1] : out[0];
}

// sqrt( ), √( ), abs( ) and |...| become powers the parser understands
function prep(str) {
  let s = String(str).replace(/[−–]/g, '-').trim();
  if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/√\s*([a-z0-9])/gi, '√($1)').replace(/sqrt\s*\(/gi, '√(').replace(/abs\s*\(/gi, '¦(');
  // |...| pairs (no nesting) -> ¦( ... )
  let bars = 0; s = s.replace(/\|/g, () => (bars++ % 2 === 0 ? '¦(' : ')'));
  if (bars % 2) throw new Error('bars');
  let out = '', i = 0;
  while (i < s.length) {
    if ((s[i] === '√' || s[i] === '¦') && s[i + 1] === '(') {
      let depth = 0, j = i + 1;
      for (; j < s.length; j++) { if (s[j] === '(') depth++; if (s[j] === ')') { depth--; if (depth === 0) break; } }
      const inner = prep(s.slice(i + 2, j));
      out += s[i] === '√' ? `((${inner})^(1/2))` : `(((${inner})^2)^(1/2))`;
      i = j + 1;
    } else { out += s[i]; i++; }
  }
  return out;
}
const prevEq = str => { try { const s = prep(str); return s ? toTex(parse(s)) : ''; } catch { return null; } };
function equationChecker(truth, xs) {
  return str => {
    let tree;
    try { const s = prep(str); if (!s) return { ok: false, msg: 'Enter an equation.', format: true }; tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Use sqrt( ) for square roots and | | for absolute value.', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
    for (const v of vars) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const ok = xs.every(x => { const g = evaluate(tree, { x }), w = truth(x); return isFinite(g) && Math.abs(g - w) < 1e-7 * Math.max(1, Math.abs(w)); });
    return { ok };
  };
}

// =====================================================================
// 5. Domain and range after transformations
// =====================================================================
export const transDomain = {
  id: 'transform-domain-range',
  course: COURSE, group: GROUP, lesson: 'T.1–T.2',
  title: 'Domain and Range After Transformations',
  blurb: 'Move the domain and range of f to find the domain and range of the new function.',
  levels: {
    1: { name: 'Easy', desc: 'A single shift, like f(x) − 9' },
    2: { name: 'Medium', desc: 'Horizontal and vertical shifts, like f(x + 7) − 3' },
    3: { name: 'Challenging', desc: 'Stretches and reflections, which can flip an interval' },
  },
  generate(level, rng) {
    for (let t = 0; t < 400; t++) {
      let T;
      if (level === 1) T = rng() < 0.5 ? { A: F(1), B: F(1), h: 0, k: nonzero(rng, -9, 9) } : { A: F(1), B: F(1), h: nonzero(rng, -8, 8), k: 0 };
      else if (level === 2) T = { A: F(1), B: F(1), h: nonzero(rng, -8, 8), k: nonzero(rng, -9, 9) };
      else { T = pickT(3, rng); if (T.A.sign() > 0 && T.B.sign() > 0 && rng() < 0.6) T.A = T.A.neg(); }
      const d1 = randInt(rng, -6, 0), d2 = d1 + randInt(rng, 4, 12), r1 = randInt(rng, -8, 2), r2 = r1 + randInt(rng, 3, 12);
      const dom = { lo: F(d1), hi: F(d2), lc: true, rc: true };
      const ran = { lo: F(r1), hi: F(r2), lc: rng() < 0.5, rc: rng() < 0.6 };
      if (ran.lc && ran.rc && rng() < 0.7) ran.rc = false;
      const mapI = (I, m, add) => {            // v -> m v + add, flipping when m < 0
        const a = I.lo.mul(m).add(add), b = I.hi.mul(m).add(add);
        return m.sign() > 0 ? { lo: a, hi: b, lc: I.lc, rc: I.rc } : { lo: b, hi: a, lc: I.rc, rc: I.lc };
      };
      const newDom = mapI(dom, F(1).div(T.B), F(T.h)), newRan = mapI(ran, T.A, F(T.k));
      const iTex = I => `${I.lc ? '[' : '('}${I.lo.tex()},\\ ${I.hi.tex()}${I.rc ? ']' : ')'}`;
      const name = pick(rng, ['g', 'h', 'r', 'q']);
      const steps = [ruleLine(T)];
      steps.push(`Domain: apply the $x$ rule to each end of $${iTex(dom)}$${T.B.sign() < 0 ? '. The reflection swaps the ends, so put them back in order' : ''}: $${iTex(newDom)}$.`);
      steps.push(`Range: apply the $y$ rule to each end of $${iTex(ran)}$${T.A.sign() < 0 ? '. The reflection swaps the ends, and each bracket travels with its endpoint' : ''}: $${iTex(newRan)}$.`);
      const mk = (I, label) => ({ type: 'custom', label, check: bracketChecker(I), keys: ['[', ']', '(', ')', ','], placeholder: 'e.g. [-3, 8)', answerTex: `$${iTex(I)}$`, help: 'Use interval notation with [ ] for included ends and ( ) for excluded ends.' });
      return {
        tag: level === 1 ? 'single shift' : level === 2 ? 'two shifts' : (T.A.sign() < 0 || T.B.sign() < 0 ? 'with a reflection' : 'with a dilation'),
        prompt: `The domain of $f$ is $${iTex(dom)}$ and the range is $${iTex(ran)}$. Find the domain and range of $${name}(x) = ${callTex('f', T, false)}$.`,
        parts: [mk(newDom, 'Domain:'), mk(newRan, 'Range:')],
        solution: steps.join('<br>'),
        _check: { A: T.A.value(), B: T.B.value(), h: T.h, k: T.k, dom: [d1, d2], ran: [r1, r2, ran.lc, ran.rc], newDom: [newDom.lo.value(), newDom.hi.value(), newDom.lc, newDom.rc], newRan: [newRan.lo.value(), newRan.hi.value(), newRan.lc, newRan.rc] },
      };
    }
    throw new Error('transform-domain-range: could not build');
  },
};

export function bracketChecker(I) {
  return str => {
    const s = String(str).replace(/[−–]/g, '-').replace(/\s+/g, '');
    const m = s.match(/^([\[(])([^,]+),([^,]+)([\])])$/);
    if (!m) return { ok: false, msg: 'Use interval notation, like [-3, 8).', format: true };
    let a, b;
    try { a = evaluate(parse(m[2]), {}); b = evaluate(parse(m[3]), {}); } catch { return { ok: false, msg: 'Could not read the endpoints.', format: true }; }
    const near = (u, v) => Math.abs(u - v.value()) < 1e-9;
    if (!(near(a, I.lo) && near(b, I.hi))) return { ok: false };
    if ((m[1] === '[') !== I.lc || (m[4] === ']') !== I.rc) return { ok: false, msg: 'The endpoints are right, but check the brackets: an included end uses [ ], an excluded end uses ( ).' };
    return { ok: true };
  };
}
