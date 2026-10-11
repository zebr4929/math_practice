// Import with the same ?v= stamp the site uses, so there is one copy of each module.
import { CONFIG } from '../precalc/js/config.js';
const v = '?v=' + CONFIG.version;
const { SKILLS } = await import('../precalc/js/skills/index.js' + v);
const { makeRng, checkNumber, checkList, checkPoint, checkRule, Frac } = await import('../precalc/js/math.js' + v);
const { _test } = await import('../precalc/js/skills/holes.js' + v);
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
  const { skill: rs } = await import('../precalc/js/skills/rational-signs.js' + v);
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
console.log('total errors', errors);
