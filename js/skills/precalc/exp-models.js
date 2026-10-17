// AP Precalculus, Unit 2:
//  1. Exponential models from geometric-sequence information, in seasonal word problems.
//  2. Rewriting exponential functions in y = a·b^x form with exponent laws.
import { F, Frac, randInt, pick, parse, evaluate, toTex } from '../../math.js?v=1.8';

// ================================================================
// Seasonal contexts
// ================================================================
// Halloween: Oct 1 to Oct 31. Thanksgiving/Christmas: Nov 1 to Jan 1. Otherwise: school life.
export function seasonFor(date) {
  const m = date.getMonth(), d = date.getDate();
  if (m === 9) return 'halloween';
  if (m === 10 || m === 11 || (m === 0 && d === 1)) return 'holiday';
  return 'school';
}

// Each context: f = function letter, what = what f(n) counts, unit = time step (singular),
// story(r-phrase) = the setup sentence. grow = true for growth contexts, false for decay.
const CONTEXTS = {
  halloween: [
    { grow: true, f: 'Z', what: 'zombies', unit: 'day', story: 'After a group of students ate expired candy corn, zombies started appearing around campus.' },
    { grow: true, f: 'S', what: 'ounces of glowing slime', unit: 'hour', story: 'A blob of glowing slime escaped from the chemistry lab and keeps growing.' },
    { grow: true, f: 'W', what: 'spider webs', unit: 'night', story: 'Spiders have moved into the haunted house and are spinning webs at an alarming rate.' },
    { grow: true, f: 'R', what: 'students who have heard the rumor', unit: 'hour', story: 'A rumor is spreading that the vice principal is secretly a vampire.' },
    { grow: true, f: 'B', what: 'bats in the bell tower', unit: 'week', story: 'Bats have discovered the bell tower and keep inviting their friends.' },
    { grow: false, f: 'C', what: 'pieces of candy', unit: 'night', story: 'Your Halloween candy stash is shrinking because your little brother keeps sneaking into it.' },
    { grow: false, f: 'G', what: 'units of spooky energy', unit: 'night', story: 'The ghost haunting the gym is losing its spooky energy every night.' },
    { grow: false, f: 'P', what: 'grams of pumpkin', unit: 'day', story: 'The squirrels have found your jack-o\'-lantern and are eating it.' },
  ],
  holiday: [
    { grow: true, f: 'R', what: 'relatives who know', unit: 'hour', story: 'Someone found out that Grandma dropped the pumpkin pie, and the news is spreading through the family group chat.' },
    { grow: true, f: 'L', what: 'holiday lights on the house', unit: 'year', story: 'Your neighbor keeps adding holiday lights to their house every year.' },
    { grow: true, f: 'S', what: 'pounds of snowball', unit: 'roll', story: 'A snowball rolling down the hill picks up more snow with every roll.' },
    { grow: true, f: 'M', what: 'pieces of mischief', unit: 'night', story: 'The elf on the shelf is getting bolder and causing more mischief each night.' },
    { grow: true, f: 'T', what: 'people in the turkey trot', unit: 'year', story: 'The town turkey trot keeps getting more popular every year.' },
    { grow: false, f: 'T', what: 'ounces of leftover turkey', unit: 'day', story: 'After Thanksgiving dinner, the leftover turkey is disappearing fast.' },
    { grow: false, f: 'C', what: 'cookies on the plate', unit: 'hour', story: 'Someone baked holiday cookies, and the plate on the counter keeps emptying.' },
    { grow: false, f: 'G', what: 'gumdrops on the gingerbread house', unit: 'day', story: 'Little cousins keep picking gumdrops off the gingerbread house.' },
  ],
  school: [
    { grow: true, f: 'R', what: 'students who have heard', unit: 'hour', story: 'A rumor that tomorrow is a snow day is spreading through school.' },
    { grow: true, f: 'B', what: 'bacteria on the lunch tray', unit: 'hour', story: 'Someone left a lunch tray behind the cafeteria vending machine, and bacteria are growing on it.' },
    { grow: true, f: 'V', what: 'views on the video', unit: 'day', story: 'A video of the math teacher\'s dance moves is going viral.' },
    { grow: true, f: 'F', what: 'followers of the club account', unit: 'week', story: 'The coding club just started a social media account, and it is catching on.' },
    { grow: false, f: 'H', what: 'inches of bounce height', unit: 'bounce', story: 'A ball dropped from the top of the bleachers loses height with every bounce.' },
    { grow: false, f: 'L', what: 'items in the lost and found', unit: 'week', story: 'The school is finally clearing out the overflowing lost and found.' },
    { grow: false, f: 'P', what: 'pages of the reading assignment left', unit: 'night', story: 'You are working through a huge reading assignment, reading part of what is left each night.' },
  ],
};

const plural = (u, n) => (n === 1 ? u : u + 's');
const rPhrase = r => ({ 2: 'doubles', 3: 'triples', 4: 'quadruples' }[r.text()] ||
  (r.n === 1 ? `drops to ${{ 2: 'half', 3: 'one third', 4: 'one fourth' }[r.d]} of what it was` : `is multiplied by ${r.text()}`));

const RULE_HELP = 'Type the right side only, like 3(2)^n. Use fractions, not decimals: (1/2)^n.';
const ruleTex = (a, r) => `${a.eq(1) ? '' : a.tex()}\\left(${r.tex()}\\right)^{n}`;

export const expModels = {
  id: 'exp-models',
  course: 'precalc',
  title: 'Exponential Models from Geometric Sequences',
  group: 'Unit 2: Exponential functions',
  blurb: 'Find the common ratio and initial value from the story, write the model, then use it.',
  levels: {
    1: { name: 'Easy', desc: 'Starting value and growth or decay rate given in words' },
    2: { name: 'Medium', desc: 'Two data points, whole-number ratio' },
    3: { name: 'Challenging', desc: 'Two data points, fractional ratio (decay or slower growth)' },
  },
  now: () => new Date(),
  generate(level, rng) {
    for (let t = 0; t < 400; t++) { const p = buildModel(level, rng, this.now()); if (p) return p; }
    throw new Error('exp-models: could not build');
  },
};

function buildModel(level, rng, date) {
  const pool = CONTEXTS[seasonFor(date)];
  let r;
  if (level === 1) r = pick(rng, [F(2), F(3), F(4), F(1, 2), F(1, 3), F(1, 4)]);
  else if (level === 2) r = pick(rng, [F(2), F(3), F(4), F(5)]);
  else r = pick(rng, [F(1, 2), F(1, 3), F(1, 4), F(2, 3), F(3, 4), F(3, 2), F(4, 3), F(5, 2)]);
  const grows = r.value() > 1;
  const ctx = pick(rng, pool.filter(c => c.grow === grows));

  // choose the times, then a starting value that keeps every term through N a whole number.
  // Retry the sizes with this same ratio so big ratios are not crowded out by small ones.
  let j, k, N, a0, term, found = false;
  for (let t = 0; t < 60 && !found; t++) {
    if (level === 1) { N = randInt(rng, 3, 6); }
    else { j = randInt(rng, 1, 3); k = j + pick(rng, [2, 3]); N = k + randInt(rng, 1, 3); }
    a0 = F(randInt(rng, level === 1 ? 1 : 2, level === 1 ? 9 : 6) * Math.pow(r.d, N));
    term = n => a0.mul(r.pow(n));
    found = Math.max(a0.value(), term(N).value()) <= (level === 1 ? 10000 : 20000) && term(N).isInt();
  }
  if (!found) return null;

  const f = ctx.f, unitN = `${f}(n)`;
  const fmt = v => v.n.toLocaleString('en-US');          // prose
  const fmtT = v => fmt(v).replace(/,/g, '{,}');           // inside math
  const truth = n => a0.value() * Math.pow(r.value(), n);
  let prompt, parts = [], steps = [];

  if (level === 1) {
    prompt = `${ctx.story} At the start there are ${fmt(a0)} ${ctx.what}, and that number ${rPhrase(r)} every ${ctx.unit}. `
      + `Let $${unitN}$ be the number of ${ctx.what} after $n$ ${plural(ctx.unit, 2)}.`;
    parts.push({ type: 'rule', label: `$${unitN} =$`, truth, var: 'n', placeholder: 'e.g. 3(2)^n', help: RULE_HELP, answerTex: `$${ruleTex(a0, r)}$` });
    parts.push({ type: 'number', label: `How many ${ctx.what} after ${N} ${plural(ctx.unit, N)}?`, answer: term(N) });
    steps.push(`The starting amount is the initial value: $${f}(0) = ${fmtT(a0)}$.`);
    steps.push(`"${rPhrase(r).replace(/^is /, '')}" every ${ctx.unit} means the common ratio is $r = ${r.tex()}$.`);
    steps.push(`Model: $${unitN} = ${ruleTex(a0, r)}$.`);
  } else {
    const aj = term(j), ak = term(k), gap = k - j;
    prompt = `${ctx.story} Let $${unitN}$ be the number of ${ctx.what} after $n$ ${plural(ctx.unit, 2)}. `
      + `You know that $${f}(${j}) = ${fmtT(aj)}$ and $${f}(${k}) = ${fmtT(ak)}$.`;
    parts.push({ type: 'number', label: 'Common ratio $r =$', answer: r });
    parts.push({ type: 'number', label: `Initial value $${f}(0) =$`, answer: a0 });
    parts.push({ type: 'rule', label: `$${unitN} =$`, truth, var: 'n', placeholder: 'e.g. 3(2)^n', help: RULE_HELP, answerTex: `$${ruleTex(a0, r)}$` });
    parts.push({ type: 'number', label: `How many ${ctx.what} after ${N} ${plural(ctx.unit, N)}?`, answer: term(N) });
    const ratio = ak.div(aj);
    steps.push(`From $n = ${j}$ to $n = ${k}$ is ${gap} steps, so the ratio is applied ${gap} times: $r^{${gap}} = \\dfrac{${f}(${k})}{${f}(${j})} = \\dfrac{${fmtT(ak)}}{${fmtT(aj)}} = ${ratio.tex()}$.`);
    steps.push(`So $r = ${gap === 2 ? '\\sqrt' : `\\sqrt[${gap}]`}{${ratio.tex()}} = ${r.tex()}$.` + (gap % 2 === 0 ? ` (The other square root, $-${r.tex()}$, makes no sense here, since the number of ${ctx.what} can't be negative.)` : ''));
    steps.push(`Step back from $${f}(${j})$ to $n = 0$ by dividing by $r$ ${j === 1 ? 'once' : j + ' times'}: $${f}(0) = \\dfrac{${fmtT(aj)}}{${j === 1 ? r.tex() : `\\left(${r.tex()}\\right)^{${j}}`}} = ${fmtT(a0)}$.`);
    steps.push(`Model: $${unitN} = ${ruleTex(a0, r)}$. (Equivalent forms like $${f}(n) = ${fmtT(aj)}\\left(${r.tex()}\\right)^{n - ${j}}$ also work.)`);
  }
  steps.push(`After ${N} ${plural(ctx.unit, N)}: $${f}(${N}) = ${a0.tex()}\\left(${r.tex()}\\right)^{${N}} = ${fmtT(term(N))}$.`);

  return {
    tag: level === 1 ? (grows ? 'rate in words, growth' : 'rate in words, decay') : (grows ? 'two points, growth' : 'two points, decay'),
    prompt, parts, solution: steps.join('<br>'),
    _check: { a0: a0.value(), r: r.value(), N, j, k, truth, season: seasonFor(date), grows },
  };
}

// ================================================================
// Rewriting in y = a·b^x form
// ================================================================
export const expRewrite = {
  id: 'exp-rewrite',
  course: 'precalc',
  title: 'Rewriting Exponentials in y = abˣ Form',
  group: 'Unit 2: Exponential functions',
  blurb: 'Use exponent laws in reverse to rewrite the function as y = abˣ.',
  levels: {
    1: { name: 'Easy', desc: 'One shift in the exponent, like y = 5(2)^(x + 3)' },
    2: { name: 'Medium', desc: 'A coefficient on x or a fractional exponent, like y = 4(9)^(x/2)' },
    3: { name: 'Challenging', desc: 'Shifts and coefficients together, or negative exponents' },
  },
  generate(level, rng) {
    for (let t = 0; t < 500; t++) { const p = buildRewrite(level, rng); if (p) return p; }
    throw new Error('exp-rewrite: could not build');
  },
};

const pTex = f => (f.isInt() && f.n >= 0 ? String(f.n) : f.tex());                 // number inside parentheses
const coefTex = a => (a.eq(1) ? '' : a.isInt() ? String(a.n) : a.tex());
const hTex = h => (h < 0 ? ` - ${-h}` : ` + ${h}`);

function buildRewrite(level, rng) {
  const a = F(pick(rng, level === 1 ? [1, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7]));
  let c, expoTex, A, B, laws, kind;
  const b = pick(rng, [2, 3, 4, 5, 10, 2, 3]);
  if (level === 1) {
    const h = pick(rng, [-3, -2, -1, 1, 2, 3]);
    c = b; expoTex = `x${hTex(h)}`; A = a.mul(F(b).pow(h)); B = F(b);
    laws = [`Split the exponent: $${b}^{x${hTex(h)}} = ${b}^{x}\\cdot ${b}^{${h}}$.`,
      `$${b}^{${h}} = ${F(b).pow(h).tex()}$, so $a = ${a.eq(1) ? '' : a.tex() + '\\cdot '}${F(b).pow(h).tex()} = ${A.tex()}$.`];
    kind = h > 0 ? 'shift up in exponent' : 'shift down in exponent';
  } else if (level === 2) {
    if (rng() < 0.5) {                 // c^(x/k) with c = b^k
      const base = pick(rng, [2, 3, 4, 5]), k = pick(rng, [2, 3, 4]);
      c = Math.pow(base, k); if (c > 625) return null;
      expoTex = `\\frac{x}{${k}}`; A = a; B = F(base);
      laws = [`Write the exponent as a product: $${c}^{\\frac{x}{${k}}} = \\left(${c}^{\\frac{1}{${k}}}\\right)^{x}$.`,
        `$${c}^{\\frac{1}{${k}}} = \\sqrt[${k}]{${c}} = ${base}$, so the base is $${base}$.`];
      kind = 'fractional exponent';
    } else {                           // b^(kx)
      const k = pick(rng, [2, 3]); c = b; if (Math.pow(b, k) > 125) return null;
      expoTex = `${k}x`; A = a; B = F(Math.pow(b, k));
      laws = [`Write the exponent as a product: $${b}^{${k}x} = \\left(${b}^{${k}}\\right)^{x}$.`, `$${b}^{${k}} = ${B.n}$, so the base is $${B.n}$.`];
      kind = 'coefficient on x';
    }
  } else {
    const v = pick(rng, ['kx+h', 'x/k+h', 'h-x', 'h-x/k', 'kx+h']);
    if (v === 'kx+h') {
      const k = pick(rng, [2, 3]), h = pick(rng, [-2, -1, 1, 2]); c = b;
      if (Math.pow(b, k) > 125) return null;
      expoTex = `${k}x${hTex(h)}`; A = a.mul(F(b).pow(h)); B = F(Math.pow(b, k));
      laws = [`Split the exponent: $${b}^{${k}x${hTex(h)}} = ${b}^{${k}x}\\cdot ${b}^{${h}} = \\left(${b}^{${k}}\\right)^{x}\\cdot ${b}^{${h}}$.`,
        `$${b}^{${k}} = ${B.n}$ and $${b}^{${h}} = ${F(b).pow(h).tex()}$, so $a = ${a.eq(1) ? '' : a.tex() + '\\cdot '}${F(b).pow(h).tex()} = ${A.tex()}$.`];
      kind = 'coefficient and shift';
    } else if (v === 'x/k+h') {
      const base = pick(rng, [2, 3, 4]), k = pick(rng, [2, 3]), h = pick(rng, [-1, 1, 2]);
      c = Math.pow(base, k); expoTex = `\\frac{x}{${k}}${hTex(h)}`; A = a.mul(F(c).pow(h)); B = F(base);
      laws = [`Split the exponent: $${c}^{\\frac{x}{${k}}${hTex(h)}} = \\left(${c}^{\\frac{1}{${k}}}\\right)^{x}\\cdot ${c}^{${h}}$.`,
        `$${c}^{\\frac{1}{${k}}} = ${base}$ and $${c}^{${h}} = ${F(c).pow(h).tex()}$, so $a = ${a.eq(1) ? '' : a.tex() + '\\cdot '}${F(c).pow(h).tex()} = ${A.tex()}$.`];
      kind = 'fractional exponent and shift';
    } else if (v === 'h-x') {
      const h = pick(rng, [1, 2, 3]); c = b; if (b === 10 && h > 2) return null;
      expoTex = `${h} - x`; A = a.mul(F(b).pow(h)); B = F(1, b);
      laws = [`Split the exponent: $${b}^{${h} - x} = ${b}^{${h}}\\cdot ${b}^{-x} = ${b}^{${h}}\\cdot\\left(${b}^{-1}\\right)^{x}$.`,
        `$${b}^{-1} = ${B.tex()}$ and $${b}^{${h}} = ${Math.pow(b, h)}$, so $a = ${a.eq(1) ? '' : a.tex() + '\\cdot '}${Math.pow(b, h)} = ${A.tex()}$.`];
      kind = 'negative exponent';
    } else {
      const base = pick(rng, [2, 3]), k = 2, h = pick(rng, [1, 2]);
      c = Math.pow(base, k); expoTex = `${h} - \\frac{x}{${k}}`; A = a.mul(F(c).pow(h)); B = F(1, base);
      laws = [`Split the exponent: $${c}^{${h} - \\frac{x}{${k}}} = ${c}^{${h}}\\cdot\\left(${c}^{-\\frac{1}{${k}}}\\right)^{x}$.`,
        `$${c}^{-\\frac{1}{${k}}} = \\dfrac{1}{\\sqrt{${c}}} = ${B.tex()}$ and $${c}^{${h}} = ${Math.pow(c, h)}$, so $a = ${a.eq(1) ? '' : a.tex() + '\\cdot '}${Math.pow(c, h)} = ${A.tex()}$.`];
      kind = 'negative fractional exponent';
    }
  }
  if (Math.abs(A.n) > 600 || A.d > 400) return null;

  const givenTex = `y = ${coefTex(a)}${a.eq(1) ? c : `(${c})`}^{${expoTex}}`;
  const ansTex = A.eq(1) && B.isInt() ? `y = ${B.n}^{x}` : `y = ${coefTex(A)}\\left(${pTex(B)}\\right)^{x}`;
  const target = x => A.value() * Math.pow(B.value(), x);

  return {
    tag: kind,
    prompt: `Rewrite in the form $y = ab^x$: $\\;${givenTex}$<br>Write $a$ and $b$ as whole numbers or fractions, not decimals.`,
    parts: [{
      type: 'custom', label: '$y =$', check: rewriteChecker(target), preview: rewritePreview, keys: ['(', ')', '^', '/'],
      placeholder: 'e.g. 40(2)^x', answerTex: `$${ansTex}$`,
      help: 'Type the right side, like 40(2)^x or (1/9)(3)^x. Use fractions, not decimals.',
    }],
    solution: [...laws, `So $${ansTex}$.`].join('<br>'),
    _check: { A: A.value(), B: B.value(), target },
  };
}

const cleanEq = s => String(s).replace(/[−–]/g, '-').replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, '').trim();
function rewritePreview(str) { try { const s = cleanEq(str); return s ? toTex(parse(s)) : ''; } catch { return null; } }

const stripP = n => (n.op === 'paren' ? stripP(n.a) : n);
const hasX = n => !!(n.v === 'x' || (n.a && hasX(n.a)) || (n.b && hasX(n.b)));
// a single number: 5, 1.5, 3/2, -2
function isNumberLiteral(n) {
  n = stripP(n);
  if (n.num !== undefined) return true;
  if (n.op === 'neg') return isNumberLiteral(n.a);
  if (n.op === '/') return stripP(n.a).num !== undefined && stripP(n.b).num !== undefined;
  return false;
}

function rewriteChecker(target) {
  return str => {
    const s = cleanEq(str);
    if (!s) return { ok: false, msg: 'Enter the rewritten function, like 40(2)^x.', format: true };
    let tree;
    try { tree = parse(s); } catch { return { ok: false, msg: 'Could not read that. Example: 40(2)^x', format: true }; }
    const vars = new Set(); (function w(n) { if (n.v) vars.add(n.v); if (n.a) w(n.a); if (n.b) w(n.b); })(tree);
    for (const v of vars) if (v !== 'x') return { ok: false, msg: 'Use x as the variable.', format: true };
    const same = [-2, -1, 0, 0.5, 1, 2, 3].every(x => {
      const got = evaluate(tree, { x }), want = target(x);
      return Math.abs(got - want) <= 1e-7 * Math.max(1, Math.abs(want));
    });
    if (!same) return { ok: false };
    // structure: [number] · (number)^x   (a may be omitted when it is 1)
    const factors = [];
    (function flat(n) { n = stripP(n); if (n.op === '*') { flat(n.a); flat(n.b); } else factors.push(n); })(tree);
    const pow = factors.filter(hasX), consts = factors.filter(n => !hasX(n));
    const notForm = { ok: false, msg: 'That is equal, but it is not in the form y = ab^x yet. The exponent should be just x, with one number in front and one number as the base.' };
    if (pow.length !== 1 || consts.length > 1) return notForm;
    const p = stripP(pow[0]);
    if (p.op !== '^' || stripP(p.b).v !== 'x' || !isNumberLiteral(p.a)) return notForm;
    if (consts.length && !isNumberLiteral(consts[0])) return notForm;
    return { ok: true };
  };
}
