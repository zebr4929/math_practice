// Skills: arithmetic and geometric sequence rules (Lesson 2.1)
import { F, Frac, randInt, pick, nonzero, paren, signed } from '../../math.js?v=2.0';

const LEVELS = {
  1: { name: 'Easy', desc: 'Write the rule from the first few terms' },
  2: { name: 'Medium', desc: 'Write the rule from the common difference/ratio and one term' },
  3: { name: 'Challenging', desc: 'Write the rule from two terms' },
};

export const arithmetic = {
  id: 'arithmetic',
  title: 'Arithmetic Sequences',
  course: 'precalc',
  group: 'Unit 2: Sequences',
  blurb: 'Write a rule for aₙ and use it to find a later term.',
  levels: LEVELS,
  generate(level, rng) { return arith(level, rng); },
};

export const geometric = {
  id: 'geometric',
  title: 'Geometric Sequences',
  course: 'precalc',
  group: 'Unit 2: Sequences',
  blurb: 'Write a rule for gₙ and use it to find a later term.',
  levels: LEVELS,
  generate(level, rng) { return geom(level, rng); },
};

const RULE_HELP = 'Type the right side only. Examples: 4 + 3(n - 1) or 12(2)^(n - 1)';

// ---------- display helpers ----------
function showTerms(rng, name, terms, allowGraph) {
  const style = pick(rng, allowGraph ? ['list', 'list', 'table', 'graph'] : ['list', 'table']);
  if (style === 'list') {
    return { text: `The first terms of the sequence are $${terms.map(t => t.tex()).join(',\\ ')},\\ \\ldots$`, visual: '' };
  }
  if (style === 'table') {
    const head = terms.map((_, i) => `<th>${i + 1}</th>`).join('');
    const row = terms.map(t => `<td>$${t.tex()}$</td>`).join('');
    return {
      text: `Several terms of the sequence are shown in the table.`,
      visual: `<table class="seq-table"><tr><th>$n$</th>${head}</tr><tr><th>$${name}_n$</th>${row}</tr></table>`,
    };
  }
  return { text: `Several terms of the sequence are shown in the graph.`, visual: graphSvg(name, terms) };
}

function graphSvg(name, terms) {
  const vals = terms.map(t => t.value());
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const step = span <= 10 ? 1 : span <= 20 ? 2 : span <= 50 ? 5 : 10;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  if (hi === lo) hi = lo + step;
  const W = 300, H = 230, L = 40, R = 15, T = 15, B = 30;
  const nMax = terms.length + 1;
  const X = n => L + (n / nMax) * (W - L - R);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let g = '';
  for (let v = lo; v <= hi + 1e-9; v += step) {
    g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>`;
    g += `<text x="${L - 6}" y="${Y(v) + 4}" class="tick" text-anchor="end">${+v.toFixed(2)}</text>`;
  }
  for (let n = 1; n < nMax; n++) {
    g += `<line x1="${X(n)}" x2="${X(n)}" y1="${T}" y2="${H - B}" class="grid"/>`;
    g += `<text x="${X(n)}" y="${Y(lo) + 16}" class="tick" text-anchor="middle">${n}</text>`;
  }
  g += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" class="axis"/><line x1="${X(0)}" x2="${X(0)}" y1="${T}" y2="${H - B}" class="axis"/>`;
  g += terms.map((t, i) => `<circle cx="${X(i + 1)}" cy="${Y(t.value())}" r="4.5" class="pt"/>`).join('');
  g += `<text x="${W - R}" y="${Y(lo) + 16}" class="tick" text-anchor="end" font-style="italic">n</text>`;
  return `<svg class="seq-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph of ${name} sub n">${g}</svg>`;
}

const fracOk = f => Math.abs(f.n) <= 9999 && f.d <= 9999;

// ---------- arithmetic ----------
function arithRuleTex(name, a1, d) {
  return `${name}_n = ${a1.tex()} ${signed(d)}(n - 1)`;
}
function arithExplicit(a1, d) {
  // a_n = a0 + d n  where a0 = a1 - d
  const a0 = a1.sub(d);
  const dn = d.eq(1) ? 'n' : d.eq(-1) ? '-n' : `${d.tex()}n`;
  if (a0.isZero()) return dn;
  return `${dn} ${signed(a0)}`;
}

function arith(level, rng) {
  let a1, d, given, intro, visual = '', k, j, ak, aj;
  if (level === 1) {
    a1 = F(randInt(rng, -30, 30)); d = F(nonzero(rng, -9, 9));
    const terms = [0, 1, 2, 3].map(i => a1.add(d.mul(i)));
    const allowGraph = terms.every(t => Math.abs(t.value()) <= 20);
    const s = showTerms(rng, 'a', terms, allowGraph);
    intro = `Let $a_n$ be an arithmetic sequence. ${s.text} The first term is $a_1$.`; visual = s.visual;
    given = `$d = ${terms[1].tex()} - ${paren(terms[0])} = ${d.tex()}$ and $a_1 = ${a1.tex()}$.`;
  } else if (level === 2) {
    d = rng() < 0.85 ? F(nonzero(rng, -9, 9)) : F(nonzero(rng, -5, 5), 2);
    k = randInt(rng, 2, 8);
    ak = F(randInt(rng, -25, 25));
    a1 = ak.sub(d.mul(k - 1));
    intro = `Let $a_n$ be an arithmetic sequence with $a_{${k}} = ${ak.tex()}$ and $d = ${d.tex()}$.`;
    given = `Start from the given term and step back: $a_1 = a_{${k}} - ${k - 1}d = ${ak.tex()} - ${k - 1}${paren(d)} = ${a1.tex()}$.`;
  } else {
    j = randInt(rng, 2, 5); k = j + randInt(rng, 2, 7);
    const gap = k - j;
    // d either integer or a fraction whose denominator divides the gap
    const dens = [1, 1, 1, ...[2, 3, 4, 5, 6].filter(x => gap % x === 0)];
    const den = pick(rng, dens);
    d = F(nonzero(rng, -6, 6), den);
    aj = F(randInt(rng, -20, 20));
    ak = aj.add(d.mul(gap));
    a1 = aj.sub(d.mul(j - 1));
    intro = `Let $a_n$ be an arithmetic sequence with $a_{${j}} = ${aj.tex()}$ and $a_{${k}} = ${ak.tex()}$.`;
    given = `From $a_{${j}}$ to $a_{${k}}$ is $${gap}$ steps of $d$: $d = \\dfrac{${ak.tex()} - ${paren(aj)}}{${k} - ${j}} = \\dfrac{${ak.sub(aj).tex()}}{${gap}} = ${d.tex()}$.<br>`
      + `Then $a_1 = a_{${j}} - ${j - 1}d = ${aj.tex()} - ${j - 1}${paren(d)} = ${a1.tex()}$.`;
  }
  const N = level === 1 ? pick(rng, [20, 25, 30, 40, 50, 100]) : randInt(rng, 12, 40);
  const aN = a1.add(d.mul(N - 1));
  const truth = n => a1.value() + d.value() * (n - 1);
  return {
    tag: `arithmetic L${level}`,
    prompt: `${intro} Write a rule for $a_n$, then use it to find $a_{${N}}$.`,
    visual,
    parts: [
      { type: 'rule', label: '$a_n =$', truth, var: 'n', placeholder: 'e.g. 4 + 3(n - 1)', help: RULE_HELP, answerTex: `$${a1.tex()} ${signed(d)}(n - 1)$, or $${arithExplicit(a1, d)}$` },
      { type: 'number', label: `$a_{${N}} =$`, answer: aN },
    ],
    solution: `${given}<br>Rule: $${arithRuleTex('a', a1, d)}$, which simplifies to $a_n = ${arithExplicit(a1, d)}$.`
      + ` (Any equivalent form is correct.)<br>$a_{${N}} = ${a1.tex()} ${signed(d)}(${N} - 1) = ${a1.tex()} ${signed(d.mul(N - 1))} = ${aN.tex()}$.`,
  };
}

// ---------- geometric ----------
function geomRuleTex(name, g1, r) {
  const coef = g1.eq(1) ? '' : g1.eq(-1) ? '-' : g1.tex();
  return `${name}_n = ${coef}\\left(${r.tex()}\\right)^{n-1}`;
}

function geom(level, rng) {
  let g1, r, intro, visual = '', given, guard = 0;
  const intR = () => F(pick(rng, [2, 3, -2, -3, 2, 4, 5, 10]));
  const fracR = () => pick(rng, [F(1, 2), F(-1, 2), F(1, 3), F(1, 4), F(2, 3), F(1, 2)]);
  if (level === 1) {
    do {
      r = rng() < 0.6 ? F(pick(rng, [2, 3, -2, -3, 4])) : fracR();
      const den = r.d;
      g1 = F(nonzero(rng, -9, 9) * Math.pow(den, 3));
    } while (Math.abs(g1.value() * Math.pow(r.value(), 3)) > 999 && guard++ < 100);
    const terms = [0, 1, 2, 3].map(i => g1.mul(r.pow(i)));
    const allowGraph = terms.every(t => Math.abs(t.value()) <= 30) && Math.max(...terms.map(t => Math.abs(t.value()))) >= 4;
    const s = showTerms(rng, 'g', terms, allowGraph);
    intro = `Let $g_n$ be a geometric sequence. ${s.text} The first term is $g_1$.`; visual = s.visual;
    given = `$r = \\dfrac{${terms[1].tex()}}{${terms[0].tex()}} = ${r.tex()}$ and $g_1 = ${g1.tex()}$.`;
  } else if (level === 2) {
    let k, gk;
    do {
      r = rng() < 0.65 ? intR() : fracR();
      k = randInt(rng, 2, 5);
      gk = F(nonzero(rng, -24, 24));
      g1 = gk.div(r.pow(k - 1));
    } while ((!fracOk(g1) || Math.abs(g1.value()) > 2000) && guard++ < 100);
    intro = `Let $g_n$ be a geometric sequence with $g_{${k}} = ${gk.tex()}$ and $r = ${r.tex()}$.`;
    given = `Step back from $g_{${k}}$: $g_1 = \\dfrac{g_{${k}}}{r^{${k - 1}}} = \\dfrac{${gk.tex()}}{${paren(r)}^{${k - 1}}} = ${g1.tex()}$.`;
  } else {
    let j, k, gj, gk;
    do {
      r = pick(rng, [F(2), F(-2), F(3), F(-3), F(1, 2), F(-1, 2), F(1, 3)]);
      j = randInt(rng, 2, 4);
      k = j + pick(rng, [3, 3, 5]);            // odd gaps keep r unique
      const scale = r.d === 1 ? 1 : Math.pow(r.d, k - 1);
      g1 = F(nonzero(rng, -5, 5) * scale);
      gj = g1.mul(r.pow(j - 1)); gk = g1.mul(r.pow(k - 1));
    } while ((Math.abs(gj.value()) > 3000 || Math.abs(gk.value()) > 3000 || !fracOk(gk)) && guard++ < 200);
    const gap = k - j;
    const showVal = f => (f.isInt() ? f.tex() : (f.terminatingDecimal() || f.tex()));
    intro = `Let $g_n$ be a geometric sequence with $g_{${j}} = ${showVal(gj)}$ and $g_{${k}} = ${showVal(gk)}$.`;
    given = `Divide the later term by the earlier one: $r^{${gap}} = \\dfrac{g_{${k}}}{g_{${j}}} = \\dfrac{${gk.tex()}}{${gj.tex()}} = ${gk.div(gj).tex()}$, so $r = ${r.tex()}$`
      + ` (the power ${gap} is odd, so there is only one real root).<br>Then $g_1 = \\dfrac{g_{${j}}}{r^{${j - 1}}} = ${g1.tex()}$.`;
  }
  let N, gN, tries = 0;
  do {
    N = level === 1 ? randInt(rng, 6, 9) : randInt(rng, 7, 11);
    gN = g1.mul(r.pow(N - 1));
  } while ((Math.abs(gN.value()) > 1e6 || !fracOk(gN)) && tries++ < 50);
  if (Math.abs(gN.value()) > 1e6 || !fracOk(gN)) { N = 6; gN = g1.mul(r.pow(N - 1)); }
  const truth = n => g1.value() * Math.pow(r.value(), n - 1);
  return {
    tag: `geometric L${level}`,
    prompt: `${intro} Write a rule for $g_n$, then use it to find $g_{${N}}$.`,
    visual,
    parts: [
      { type: 'rule', label: '$g_n =$', truth, var: 'n', placeholder: 'e.g. 12(2)^(n - 1)', help: RULE_HELP, answerTex: `$${geomRuleTex('g', g1, r).replace('g_n = ', '')}$` },
      { type: 'number', label: `$g_{${N}} =$`, answer: gN, hint: 'Exact value or a decimal is fine.' },
    ],
    solution: `${given}<br>Rule: $${geomRuleTex('g', g1, r)}$ (any equivalent form is correct).<br>`
      + `$g_{${N}} = ${g1.tex()}\\left(${r.tex()}\\right)^{${N - 1}} = ${gN.tex()}$${!gN.isInt() && gN.terminatingDecimal() ? ` $= ${gN.terminatingDecimal()}$` : ''}.`,
  };
}

// ---------- equivalent forms of a geometric rule ----------
// Any term can anchor the rule: g_n = g_k · r^(n - k). Students pick the rule that matches.
export const geometricForms = {
  id: 'geometric-forms',
  title: 'Equivalent Forms of Geometric Rules',
  course: 'precalc',
  group: 'Unit 2: Sequences',
  blurb: 'Recognize geometric rules written from different starting terms, like 4(1/2)^(n - 2) = 8(1/2)^(n - 1).',
  levels: {
    1: { name: 'Easy', desc: 'Pick the rule equivalent to a given rule' },
    2: { name: 'Medium', desc: 'Match terms in a list, table or graph to a rule written from a different term' },
    3: { name: 'Challenging', desc: 'Same as Medium, with negative ratios and ratios like 2/3' },
  },
  generate(level, rng) {
    for (let t = 0; t < 300; t++) { const p = geomForms(level, rng); if (p) return p; }
    throw new Error('geometric-forms: could not build');
  },
};

// exponent n - k, written n, n - 2, n + 1
const expoTex = k => (k === 0 ? 'n' : k > 0 ? `n - ${k}` : `n + ${-k}`);
const coefOf = c => (c.eq(1) ? '' : c.eq(-1) ? '-' : c.tex());
const formTex = (c, r, k) => `g_n = ${coefOf(c)}\\left(${r.tex()}\\right)^{${expoTex(k)}}`;

function geomForms(level, rng) {
  const R = level === 1 ? [F(2), F(3), F(4), F(1, 2), F(1, 3)]
    : level === 2 ? [F(2), F(3), F(4), F(5), F(1, 2), F(1, 3), F(1, 4)]
    : [F(-2), F(-3), F(-1, 2), F(-1, 3), F(2, 3), F(3, 2), F(3, 4), F(4, 3), F(-2, 3)];
  const r = pick(rng, R);
  const m = level === 3 ? nonzero(rng, -4, 4) : randInt(rng, 1, 5);
  const g1 = F(m * Math.pow(r.d, 3));
  const g = k => g1.mul(r.pow(k - 1));                     // g_k for any integer k (k = 0 allowed)
  const val = (c, rr, k, n) => c.mul(rr.pow(n - k));        // value of a form at n
  const sameAsTrue = (c, rr, k) => [1, 2, 3, 4].every(n => val(c, rr, k, n).eq(g(n)));
  const terms = [1, 2, 3, 4].map(g);
  if (terms.some(t => Math.abs(t.n) > 999 || t.d > 1)) return null;

  // the correct rule is anchored at a term other than g_1
  const kStar = pick(rng, level === 1 ? [0, 2, 3] : [0, 2, 3, 2, 3, 4, -1]);
  const correct = [g(kStar), r, kStar];
  if (Math.abs(correct[0].n) > 999 || correct[0].d > 99) return null;

  const cands = [
    [g(kStar), r, kStar + 1], [g(kStar), r, kStar - 1],           // right coefficient, wrong shift
    [g1, r, kStar],                                                 // first term with the new shift
    [g(kStar), r, -kStar],                                          // sign error in the shift
    [g(kStar + 1), r, kStar], [g(kStar - 1), r, kStar],             // neighbor term as the coefficient
    [g(kStar), F(r.d, r.n), kStar],                                 // ratio flipped
    [g(kStar).neg(), r, kStar],
  ];
  const seen = new Set([formTex(...correct)]);
  const wrong = [];
  for (const c of shuffleArr(rng, cands)) {
    if (wrong.length === 3) break;
    if (Math.abs(c[0].n) > 999 || c[0].d > 99) continue;
    if (c[0].sign() !== correct[0].sign() && level < 3) continue;   // keep the sign trap for Challenging
    if (sameAsTrue(...c)) continue;
    const t = formTex(...c);
    if (seen.has(t)) continue;
    seen.add(t); wrong.push(c);
  }
  if (wrong.length < 3) return null;
  const opts = shuffleArr(rng, [correct, ...wrong]);
  const answer = opts.indexOf(correct);
  const choices = opts.map(o => `$${formTex(...o)}$`);

  let prompt, visual = '';
  if (level === 1) {
    prompt = `A geometric sequence has the rule $${formTex(g1, r, 1)}$. Which of the following is also a rule for this sequence?`;
  } else {
    const s = showTerms(rng, 'g', terms, terms.every(t => Math.abs(t.value()) <= 30) && Math.max(...terms.map(t => Math.abs(t.value()))) >= 4);
    prompt = `Let $g_n$ be a geometric sequence. ${s.text} Which of the following is an expression for the $n$th term?`;
    visual = s.visual;
  }

  const steps = [];
  if (level === 1) steps.push(`From the rule, $g_1 = ${g1.tex()}$ and $r = ${r.tex()}$.`);
  else steps.push(`The first term is $g_1 = ${g1.tex()}$ and the common ratio is $r = \\dfrac{${terms[1].tex()}}{${terms[0].tex()}} = ${r.tex()}$, so one rule is $${formTex(g1, r, 1)}$.`);
  steps.push(`A geometric rule can start from any term: $g_n = g_k \\cdot r^{\\,n - k}$. The exponent tells you which term the coefficient is.`);
  steps.push(kStar === 0
    ? `With exponent $n$, the coefficient must be $g_0$, one step before $g_1$: $g_0 = ${g1.tex()} \\div ${paren(r)} = ${g(0).tex()}$. So $${formTex(...correct)}$ works.`
    : kStar < 0
      ? `With exponent $n + ${-kStar}$, the coefficient must be $g_{${kStar}}$, which is ${1 - kStar} steps before $g_1$: $g_{${kStar}} = ${g(kStar).tex()}$. So $${formTex(...correct)}$ works.`
      : `With exponent $n - ${kStar}$, the coefficient must be $g_{${kStar}} = ${g(kStar).tex()}$. So $${formTex(...correct)}$ works.`);
  steps.push(`Quick check: put $n = 1$ and $n = 2$ into each choice. Only the correct rule gives both $g_1 = ${g1.tex()}$ and $g_2 = ${g(2).tex()}$:<br>`
    + opts.map(o => `$${formTex(...o)}$ gives $${val(o[0], o[1], o[2], 1).tex()},\\ ${val(o[0], o[1], o[2], 2).tex()}$`).join('<br>'));

  return {
    tag: level === 1 ? 'rewrite a given rule' : `match terms, ${level === 3 ? 'negative or fractional ratio' : 'whole or unit-fraction ratio'}`,
    prompt, visual,
    parts: [{ type: 'mc', label: 'Choose one:', choices, answer }],
    solution: steps.join('<br>'),
    _check: { g1: g1.value(), r: r.value(), kStar, opts: opts.map(o => [o[0].value(), o[1].value(), o[2]]), answer },
  };
}

function shuffleArr(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
