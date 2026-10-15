// Import with the same ?v= stamp the site uses, so there is one copy of each module.
import { CONFIG } from '../js/config.js';
const v = '?v=' + CONFIG.version;
const { SKILLS } = await import('../js/skills/index.js' + v);
const { makeRng, checkNumber, checkList, checkPoint, checkRule, Frac } = await import('../js/math.js' + v);
const { _test } = await import('../js/skills/precalc/holes.js' + v);
let errors = 0, count = 0;
const fail = (m, p) => { if (errors++ < 15) console.log('FAIL', m, JSON.stringify(p?.prompt)?.slice(0,300)); };
const fmt = a => a instanceof Frac ? a.text() : String(a);
for (const s of SKILLS) for (const L of [1,2,3]) {
  const tags = {};
  for (let seed = 1; seed <= 3000; seed++) {
    const rng = makeRng(seed * 7919 + L * 31 + s.id.length);
    let p;
    try { p = s.generate(L, rng); } catch (e) { fail(s.id+L+' throw '+e.message); continue; }
    count++; tags[p.tag] = (tags[p.tag]||0)+1;
    if (!p.prompt || !p.solution || !p.parts?.length) fail('missing fields', p);
    if (/NaN|undefined(?! there)|Infinity|\[object/.test(p.prompt + p.solution)) fail(s.id+L+' bad text', p);
    if (/—/.test(p.prompt + p.solution)) fail('em dash', p);
    for (const part of p.parts) {
      // the expected answer, typed as a student would, must be accepted
      if (part.type === 'number') { if (!checkNumber(fmt(part.answer), part.answer).ok) fail('number self-check', p); }
      if (part.type === 'list') { if (!checkList(part.answer.length ? part.answer.map(fmt).join(', ') : 'none', part.answer).ok) fail('list self', p); }
      if (part.type === 'point') { if (!checkPoint(`(${fmt(part.answer[0])}, ${fmt(part.answer[1])})`, part.answer).ok) fail('point self', p); }
      if (part.type === 'mc') { if (!(part.answer >= 0 && part.answer < part.choices.length)) fail('mc idx', p); }
      if (part.type === 'rule') {
        // the rule printed in the solution must pass the checker
        const m = p.solution.match(/simplifies to \$[a-z]_n = ([^$]+)\$/) || p.solution.match(/Rule: \$[a-z]_n = ([^$]+)\$/);
        const tex = m[1].replace(/\\left\(/g,'(').replace(/\\right\)/g,')').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g,'($1)/($2)').replace(/\^\{([^}]*)\}/g,'^($1)');
        if (!checkRule(tex, part.truth).ok) fail('rule self-check: ' + tex, p);
      }
    }
    // independent checks
    if (s.id === 'arithmetic' || s.id === 'geometric') {
      const rule = p.parts[0].truth, Npart = p.parts[1];
      const N = +Npart.label.match(/_\{(\d+)\}/)[1];
      if (Math.abs(rule(N) - Frac.of(Npart.answer).value()) > 1e-6 * Math.max(1, Math.abs(rule(N)))) fail('term mismatch', p);
      // given terms in prompt must satisfy rule
      for (const m of p.prompt.matchAll(/[ag]_\{(\d+)\} = (-?[\d.]+|-?\\frac\{\d+\}\{\d+\})/g)) {
        const v = m[2].startsWith('\\frac') || m[2].startsWith('-\\frac') ? (m[2].startsWith('-')?-1:1)*(+m[2].match(/\{(\d+)\}\{(\d+)\}/)[1]/ +m[2].match(/\{(\d+)\}\{(\d+)\}/)[2]) : +m[2];
        if (Math.abs(rule(+m[1]) - v) > 1e-6 * Math.max(1, Math.abs(v))) fail('given term mismatch ' + m[0], p);
      }
      if (s.id === 'geometric' && L === 3) { const gaps = p.prompt.match(/_\{(\d+)\}/g).map(x=>+x.match(/\d+/)[0]); if ((gaps[1]-gaps[0]) % 2 === 0) fail('even gap', p); }
    }
  }
  console.log(s.id, L, JSON.stringify(tags));
}
// Holes: brute-force numeric check of analyze()
const rng = makeRng(42);
for (let t = 0; t < 3000; t++) {
  const num = {}, den = {};
  for (let i = 0; i < 3; i++) { const r = Math.floor(rng()*9)-4; num[r] = (num[r]||0) + 1; }
  for (let i = 0; i < 3; i++) { const r = Math.floor(rng()*9)-4; den[r] = (den[r]||0) + 1; }
  const K = 2;
  const f = x => { let v = K; for (const r in num) v *= Math.pow(x - r, num[r]); for (const r in den) v /= Math.pow(x - r, den[r]); return v; };
  const A = _test.analyze(K, num, den);
  for (const r of Object.keys({...num, ...den}).map(Number)) {
    const left = Math.abs(f(r - 1e-6)), right = Math.abs(f(r + 1e-6));
    const blowsUp = left > 1e4 && right > 1e4;
    const inDen = !!den[r];
    let kind = blowsUp ? 'va' : inDen ? 'hole' : 'zero';
    const got = A.vas.includes(r) ? 'va' : A.holes.includes(r) ? 'hole' : A.zeros.includes(r) ? 'zero' : 'none';
    if (kind !== got) { errors++; console.log('holes mismatch', r, num, den, kind, got); break; }
    if (kind === 'hole') { const y = A.holePts.find(h => h[0] === r)[1].value(); const approx = (f(r-1e-7)+f(r+1e-7))/2; if (Math.abs(y - approx) > 1e-3*Math.max(1,Math.abs(y))) { errors++; console.log('hole y', r, num, den, y, approx); } }
  }
}
// checker sanity
const T = (c, want) => { if (c.ok !== want) { errors++; console.log('checker', c, want); } };
T(checkNumber('-3/4', new Frac(-3,4)), true); T(checkNumber('-.75', new Frac(-3,4)), true); T(checkNumber('27.2', new Frac(245,9)), false);
T(checkNumber('27.22', new Frac(245,9)), true); T(checkList('5, -2', [-2,5]), true); T(checkList('x = 5, x=-2', [-2,5]), true); T(checkList('none', []), true);
T(checkPoint('(4, 0)', [4,0]), true); T(checkPoint('(-4, 4/9)', [4,0]), false);
T(checkRule('2+3(n-1)', n=>2+3*(n-1)), true); T(checkRule('3n-1', n=>2+3*(n-1)), true); T(checkRule('2+3n', n=>2+3*(n-1)), false);
T(checkRule('96(1/2)^(n-1)', n=>96*0.5**(n-1)), true); T(checkRule('a_n = 48(.5)^(n-2)', n=>96*0.5**(n-1)), true); T(checkRule('g(n)=12·2^(n−1)', n=>12*2**(n-1)), true);
console.log('problems', count, 'errors', errors);

// Independent numeric check of the leading-coefficient / hole skill
{
  const { skill: rs } = await import('../js/skills/precalc/rational-signs.js' + v);
  let bad = 0, negs = { lead: 0, rev: 0, flip: 0, exp: 0 };
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 4000; seed++) {
    const p = rs.generate(L, makeRng(seed * 104729 + L));
    const { num, den, sharedTop, sharedBot, K, D, sgn } = p._check;
    const val = (fs, x) => fs.reduce((s, f) => s * Math.pow(f.a * x + f.b, f.m), 1);
    const f = x => sgn * K * val([sharedTop, ...num], x) / (D * val([sharedBot, ...den], x));
    const HA = Frac.of(p.parts[0].answer).value();
    const big = f(1e7), bigNeg = f(-1e7);
    if (Math.abs(big - HA) > 1e-3 * Math.max(1, Math.abs(HA)) || Math.abs(bigNeg - HA) > 1e-3 * Math.max(1, Math.abs(HA))) { bad++; if (bad < 5) console.log('HA mismatch', L, p.prompt, HA, big); }
    const [hx, hy] = p.parts[1].answer.map(z => Frac.of(z).value());
    const near = (f(hx + 1e-6) + f(hx - 1e-6)) / 2;
    if (!isFinite(near) || Math.abs(near - hy) > 1e-4 * Math.max(1, Math.abs(hy))) { bad++; if (bad < 5) console.log('hole mismatch', L, p.prompt, hy, near); }
    if (sgn < 0) negs.lead++;
    if ([...num, ...den].some(q => q.a < 0)) negs.rev++;
    if (sharedBot.a < 0) negs.flip++;
    if ([...num, ...den].some(q => q.a < 0 && q.m > 1)) negs.exp++;
    if (L === 1 && [...num, ...den].some(q => q.a < 0)) { bad++; console.log('easy has backwards factor'); }
    if (L === 2 && ![...num, ...den].some(q => q.a < 0)) { bad++; console.log('medium lacks backwards factor'); }
    if (L === 3 && ![...num, ...den].some(q => q.a < 0 && q.m > 1)) { bad++; console.log('challenging lacks backwards exponent'); }
  }
  console.log('rational-signs numeric check: bad =', bad, JSON.stringify(negs));
  errors += bad;
}


// ---------- Algebra II ----------
{
  const { skill: fac } = await import('../js/skills/alg2/factoring.js' + v);
  let bad = 0; const tags = {};
  const plain = t => t.replace(/\$/g, '').replace(/\^\{?2\}?/g, '^2').replace(/\\cdot/g, '*');
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 4000; seed++) {
    const p = fac.generate(L, makeRng(seed * 7 + L));
    tags['fac' + L + ' ' + p.tag] = (tags['fac' + L + ' ' + p.tag] || 0) + 1;
    const ans = plain(p.parts[0].answerTex);
    const chk = p.parts[0].check;
    if (!chk(ans).ok) { bad++; if (bad < 6) console.log('factoring rejects own answer', p.prompt, ans, chk(ans)); }
    // the expanded trinomial itself must NOT be accepted
    const tri = p.prompt.match(/\$\\;(.+)\$/)[1];
    if (chk(tri).ok) { bad++; console.log('accepted unfactored', tri); }
    // reversed factor order accepted
    const fs = ans.match(/\([^)]*\)(\^2)?/g);
    if (fs.length === 2 && !chk(fs[1] + fs[0]).ok) { bad++; console.log('order', ans); }
    // level rules
    const A = +((tri.match(/^(\d*)x\^2/) || [])[1] || 1);
    const isPrime = n => n > 1 && [...Array(n).keys()].slice(2).every(d => n % d);
    if (L === 1 && A !== 1) { bad++; console.log('L1 a', tri); }
    if (L === 2 && p.tag === 'prime leading coefficient' && !isPrime(A)) { bad++; console.log('L2 prime', tri); }
    if (L === 3 && (A < 4 || isPrime(A))) { bad++; console.log('L3 composite', tri); }
  }
  // partial factoring is rejected, e.g. 2x^2+... -> (2x+4)(x-1)/2 style or leaving a quadratic
  {
    const p = fac.generate(1, makeRng(5)); const chk = p.parts[0].check;
    const tri = p.prompt.match(/\$\\;(.+)\$/)[1];
    const r = chk('(' + tri + ')'); if (r.ok) { bad++; console.log('accepted parenthesized trinomial'); }
  }
  console.log(JSON.stringify(tags, null, 0));
  console.log('algebra II check: bad =', bad);
  errors += bad;
}

// ---------- graphing, forms, exponential end behavior ----------
{
  const { graphStandard, graphVertex } = await import('../js/skills/alg2/graphing.js' + v);
  const { factoredFromGraph, toVertexForm } = await import('../js/skills/alg2/forms.js' + v);
  const { skill: expEnd } = await import('../js/skills/precalc/exp-end-behavior.js' + v);
  let bad = 0; const B = (m, p) => { bad++; if (bad < 12) console.log('FAIL', m, p && (p.prompt || '').slice(0, 160)); };
  const aSeen = {};
  for (const sk of [graphStandard, graphVertex]) for (const L of [1, 2, 3]) for (let seed = 1; seed <= 3000; seed++) {
    const p = sk.generate(L, makeRng(seed * 17 + L));
    const { a, h, k, correct, window, eq } = p._check; const part = p.parts[0];
    aSeen[sk.id + L + ':' + a] = 1;
    if (correct.length !== 7) B('7 pts', p);
    if (!correct.some(q => q.x === h && q.y === k)) B('vertex', p);
    for (const q of correct) {
      if (Math.abs(a * (q.x - h) ** 2 + k - q.y) > 1e-9) B('pt on curve', p);
      if (eq && Math.abs(eq[0] * q.x * q.x + eq[1] * q.x + eq[2] - q.y) > 1e-9) B('std eq', p);
      if (q.x < window.xmin || q.x > window.xmax || q.y < window.ymin || q.y > window.ymax) B('window', p);
      if (Math.abs(q.y / (part.snap || 1) - Math.round(q.y / (part.snap || 1))) > 1e-9) B('snap', p);
    }
    if (eq && !eq.slice(1).every(Number.isInteger)) B('std b, c whole', p);
    if (!Number.isInteger(h) || !Number.isInteger(k)) B('integer vertex', p);
    if (!part.check(correct.map(q => ({ ...q }))).ok) B('accept correct', p);
    if (!part.check(correct.slice(1)).format) B('count msg', p);
    const wrong = correct.map(q => ({ x: q.x, y: q.y + (q.x === h ? 0 : 1) }));
    if (part.check(wrong).ok) B('accept wrong', p);
    if (L === 1 && a !== 1) B('L1 a', p); if (L === 2 && Math.abs(a) !== 1) B('L2 a', p);
    if (L === 3 && ![2, 0.5, 3].includes(Math.abs(a))) B('L3 a', p);
  }
  const frac = x => { const g = (p, q) => q ? g(q, p % q) : p; for (let d = 1; d <= 12; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? String(n) : `${n}/${d}`; } return String(x); };
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 3000; seed++) {
    const p = factoredFromGraph.generate(L, makeRng(seed * 23 + L));
    const { a, r, s, pt, fn } = p._check; const part = p.parts[0];
    if (Math.abs(fn(r)) > 1e-9 || Math.abs(fn(s)) > 1e-9) B('roots', p);
    if (Math.abs(fn(pt.x) - pt.y) > 1e-9) B('labeled point', p);
    const ans = `(${frac(a)})(x - (${r}))(x - (${s}))`;
    if (!part.check(ans).ok) B('accept own ' + ans, p);
    const expanded = `${frac(a)}*x^2 + ${frac(-a * (r + s))}*x + ${frac(a * r * s)}`;
    const ex = part.check(expanded); if (ex.ok || !ex.msg) B('expanded must be flagged ' + expanded, p);
    if (part.check(`(x - (${r}))(x - (${s}))`).ok && a !== 1) B('accepted missing a', p);
    if (L === 1 && Math.abs(a) !== 1) B('L1', p); if (L === 2 && (!Number.isInteger(a) || Math.abs(a) < 2)) B('L2', p);
    if (L === 3 && Number.isInteger(a)) B('L3', p);
  }
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 3000; seed++) {
    const p = toVertexForm.generate(L, makeRng(seed * 29 + L));
    const { a, h, k, fn, std } = p._check; const part = p.parts[0];
    for (const x of [-2, 0, 1.5, 3]) if (Math.abs(fn(x) - (std[0] * x * x + std[1] * x + std[2])) > 1e-9) B('vf math', p);
    const ans = `${frac(a)}(x - (${frac(h)}))^2 + (${frac(k)})`;
    if (!part.check(ans).ok) B('vf accept ' + ans, p);
    if (!part.check(`(${frac(k)}) + ${frac(a)}(x - (${frac(h)}))^2`).ok) B('vf order', p);
    const st = part.check(`${std[0]}x^2 + (${std[1]})x + (${std[2]})`); if (st.ok || !st.msg) B('vf standard flagged', p);
    if (L === 1 && (a !== 1 || !Number.isInteger(h))) B('vf L1', p);
    if (L === 2 && !(a === -1 || !Number.isInteger(h))) B('vf L2', p);
    if (L === 3 && Math.abs(a) < 2) B('vf L3', p);
  }
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 3000; seed++) {
    const p = expEnd.generate(L, makeRng(seed * 31 + L));
    const { a, k, left, right, fn } = p._check;
    const num = (x, want) => want.inf ? Math.sign(fn(x)) === want.inf && Math.abs(fn(x)) > 1e3 : Math.abs(fn(x) - want.value) < 1e-3;
    if (!num(-60, left) || !num(60, right)) B('limits', p);
    const str = w => w.inf ? (w.inf > 0 ? '∞' : '-∞') : String(w.value);
    if (!p.parts[0].check(str(left)).ok || !p.parts[1].check(str(right)).ok) B('accept limits', p);
    if (p.parts[0].check(str(right)).ok && str(left) !== str(right)) B('swap accepted', p);
    if (L === 2 && a < 0) B('L2 reflection', p); if (L === 3 && a > 0) B('L3 not reflected', p);
    if (L === 1 && !p.displayGraph) B('L1 graph', p);
  }
  console.log('a values seen:', Object.keys(aSeen).sort().join(' '));
  console.log('graph/forms/exp check: bad =', bad);
  errors += bad;
}

// ---------- solving quadratics (Algebra II) ----------
{
  const S = await import('../js/skills/alg2/solving.js' + v);
  const U = await import('../js/skills/alg2/solveutil.js' + v);
  let bad = 0; const B = (m, p) => { bad++; if (bad < 15) console.log('FAIL', m, p && p.prompt); };
  const tags = {};
  // parse the displayed equation back and confirm the roots solve it
  const sides = p => { const m = p.prompt.match(/\$\\;(.+) = (.+)\$/); return m; };
  const evalSide = (tex, x) => {
    const js = tex.replace(/x\^2/g, `(${x})**2`).replace(/(\d)x/g, '$1*x').replace(/x/g, `(${x})`);
    return Function('return ' + js)();
  };
  const skills = [S.solveSqrt, S.solveFactoring, S.ctsAccel, S.ctsHonors, S.formulaAccel, S.formulaHonors];
  for (const sk of skills) for (const L of [1, 2, 3]) for (let seed = 1; seed <= 2500; seed++) {
    const p = sk.generate(L, makeRng(seed * 41 + L + sk.id.length));
    tags[sk.id + L + ' ' + p.tag] = (tags[sk.id + L + ' ' + p.tag] || 0) + 1;
    const R = p._check.R, honors = sk.course.includes('honors');
    if (honors && R.im) B('honors imaginary', p);
    if (sk.id === 'solve-factoring' && !R.rational) B('factoring irrational', p);
    const m = sides(p); if (!m) { B('parse', p); continue; }
    for (const [re, im] of U.rootValues(R)) {
      { // plug the root into both sides
        const mul = (a, b) => [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]];
        const lhs = t => { // evaluate polynomial side for complex x
          const c = { x2: 0, x1: 0, x0: 0 };
          const s = t.replace(/\s/g, '').replace(/^(?=[^-])/, '+');
          for (const term of s.match(/[+-][^+-]+/g)) { const mm = term.match(/^([+-])(\d*)(x\^2|x)?$/); const coef = (mm[1] === '-' ? -1 : 1) * (mm[2] === '' ? 1 : +mm[2]); if (mm[3] === 'x^2') c.x2 += coef; else if (mm[3] === 'x') c.x1 += coef; else c.x0 += coef; }
          const x = [re, im], x2 = mul(x, x); return [c.x2*x2[0] + c.x1*x[0] + c.x0, c.x2*x2[1] + c.x1*x[1]];
        };
        const a1 = lhs(m[1]), a2 = lhs(m[2]);
        if (Math.abs(a1[0]-a2[0]) > 1e-6 || Math.abs(a1[1]-a2[1]) > 1e-6) B('root ' + re + ' ' + im, p);
      }
    }
    const chk = p.parts[0].check;
    const own = U.rootsPlain(R);
    if (!chk(own).ok) B('own answer ' + own + ' ' + JSON.stringify(chk(own)), p);
    if (R.rational) {
      const rev = R.roots.slice().reverse().map(f => f.text()).join(', ');
      if (!chk(rev).ok) B('order', p);
      if (!chk('x = ' + R.roots[0].text() + (R.roots[1] ? ', x = ' + R.roots[1].text() : '')).ok) B('x= prefix', p);
      if (R.roots.length === 2 && chk(R.roots[0].text()).ok) B('one of two accepted', p);
    } else {
      // expanded list form
      const rad = R.r === 1 ? `${R.B === 1 ? '' : R.B}i` : `${R.B === 1 ? '' : R.B}${R.im ? 'i' : ''}√${R.r}`;
      const list = R.d === 1 ? `${R.A} + ${rad}, ${R.A} - ${rad}` : `(${R.A} + ${rad})/${R.d}, (${R.A} - ${rad})/${R.d}`;
      if (!chk(list).ok) B('list form ' + list, p);
      // unsimplified radical rejected with message
      const kk = Math.round(Math.sqrt(Math.abs(R.D)));
      const raw = `(${-p._check.R.A * 0 + 0}`;
      const D = R.D;
      const unsimp = U.rootsPlain(R).replace(`√${R.r}`, `√${R.r * 4}`).replace(/(\d*)(i?)√/, (mm, c, i) => (c ? String(+c / 2 === Math.floor(+c / 2) ? +c / 2 : c) : '') + i + '√');
      if (R.B % 2 === 0 && R.r > 1) { const u = chk(unsimp); if (u.ok || !u.msg) B('unsimplified radical accepted ' + unsimp, p); }
      if (R.d > 1 || R.A !== 0) { const u = chk(`(${R.A * 2} ± ${R.B * 2}${R.im ? 'i' : ''}${R.r === 1 ? '' : '√' + R.r})/${R.d * 2}`); if (u.ok || !u.msg) B('unreduced accepted', p); }
      if (chk(String((R.A / R.d).toFixed(3))).ok) B('decimal', p);
    }
    if (L === 1 && /cts|formula/.test(sk.id) && !/= 0\$/.test(p.prompt) && sk.id.includes('formula')) B('formula easy std', p);
  }
  for (const L of [1, 2, 3]) for (let seed = 1; seed <= 3000; seed++) {
    const p = S.simplifyRadicals.generate(L, makeRng(seed * 43 + L));
    const { n, c, outC, r } = p._check;
    if (Math.abs(c * Math.sqrt(n) - outC * Math.sqrt(r)) > 1e-9) B('rad value', p);
    if (L < 3 && n > 150) B('too large', p); if (L === 3 && n > 98) B('too large 3', p);
    const chk = p.parts[0].check;
    if (!chk(`${outC}√${r}`).ok) B('rad own', p);
    if (!chk(`${outC}sqrt(${r})`).ok) B('rad sqrt()', p);
    const u = chk(`${c}√${n}`); if (u.ok) B('rad unsimplified accepted', p);
    if (!/√|sqrt/.test(p.prompt.replace('\\sqrt', '√'))) B('prompt', p);
  }
  console.log(JSON.stringify(tags));
  console.log('solving check: bad =', bad);
  errors += bad;
}
console.log('total errors', errors);
