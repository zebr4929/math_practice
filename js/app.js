import { SKILLS, byId } from './skills/index.js?v=2.1';
import { makeRng, checkNumber, checkList, checkPoint, checkRule, previewTex, Frac } from './math.js?v=2.1';
import { CONFIG } from './config.js?v=2.1';
import { makeGrid } from './graph.js?v=2.1';

const app = document.getElementById('app');
const who = document.getElementById('who');
const SET_SIZE = CONFIG.problemsPerSet || 6;

// ---------- storage (wrapped: some school browsers block it) ----------
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
let student = store.get('pp.student');
// Re-ask for details if a required field was added after this student signed in
if (student && (CONFIG.teachers || []).length && !student.teacher) student = null;
if (student && !(CONFIG.courses || []).some(c => c.name === student.course)) student = null;
const courseOf = s => (CONFIG.courses || []).find(c => c.name === s?.course);
const mySkills = () => SKILLS.filter(sk => [].concat(sk.course).includes(courseOf(student)?.skills));

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function typeset(el) {
  if (window.renderMathInElement) {
    window.renderMathInElement(el, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
  } else {
    setTimeout(() => typeset(el), 120);
  }
}

function renderWho() {
  who.innerHTML = student
    ? `${esc(student.name)} · ${esc(student.course)} · ${student.teacher ? esc(student.teacher) + ' · ' : ''}Block ${esc(student.block)} <button id="switch">Not you?</button>`
    : '';
  const b = document.getElementById('switch');
  if (b) b.onclick = () => { student = null; store.set('pp.student', null); location.hash = '#/'; route(); };
}

// ---------- routing ----------
window.addEventListener('hashchange', route);
route();

function route() {
  renderWho();
  if (!student) return signIn();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'practice' && byId[parts[1]] && mySkills().includes(byId[parts[1]]) && ['1', '2', '3'].includes(parts[2])) return startSet(byId[parts[1]], +parts[2]);
  home();
}

// ---------- sign in ----------
function signIn() {
  const blocks = CONFIG.blocks || [];
  const teachers = CONFIG.teachers || [];
  const courses = CONFIG.courses || [];
  app.innerHTML = `
    <div class="card signin">
      <h1>Welcome</h1>
      <p class="muted">Enter your name so your teacher can see your practice.</p>
      <label class="field" for="nm">First and last name</label>
      <input type="text" id="nm" autocomplete="name">
      <label class="field" for="cs">Course</label>
      <select id="cs"><option value="">Choose your course</option>${courses.map(c => `<option>${esc(c.name)}</option>`).join('')}</select>
      ${teachers.length ? `<label class="field" for="tc">Teacher</label>
      <select id="tc"><option value="">Choose your teacher</option>${teachers.map(t => `<option>${esc(t)}</option>`).join('')}</select>` : ''}
      <label class="field" for="bk">Class block</label>
      ${blocks.length
        ? `<select id="bk"><option value="">Choose your block</option>${blocks.map(b => `<option>${esc(b)}</option>`).join('')}</select>`
        : `<input type="text" id="bk">`}
      <div class="actions"><button class="btn" id="go">Start practicing</button></div>
      <div id="err" class="format-msg" hidden></div>
    </div>`;
  const go = () => {
    const name = document.getElementById('nm').value.trim().replace(/\s+/g, ' ');
    const block = document.getElementById('bk').value.trim();
    const teacher = teachers.length ? document.getElementById('tc').value : '';
    const course = document.getElementById('cs').value;
    const err = document.getElementById('err');
    if (name.split(' ').length < 2) { err.hidden = false; err.textContent = 'Please enter your first and last name.'; return; }
    if (!course) { err.hidden = false; err.textContent = 'Please choose your course.'; return; }
    if (teachers.length && !teacher) { err.hidden = false; err.textContent = 'Please choose your teacher.'; return; }
    if (!block) { err.hidden = false; err.textContent = 'Please choose your class block.'; return; }
    student = { name, course, teacher, block };
    store.set('pp.student', student);
    route();
  };
  document.getElementById('go').onclick = go;
  app.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
}

// ---------- home ----------
function home() {
  const best = store.get('pp.best', {});
  const list = mySkills();
  const groups = [...new Set(list.map(s => s.group))];
  app.innerHTML = `
    <div class="crumb muted">${esc(student.course)}</div>
    <h1>Choose a skill</h1>
    <p class="muted">Each set has ${SET_SIZE} problems. Start at Easy and move up when you can get most of a set right.</p>
    ${groups.map(g => `
      <div class="group-title">${esc(g)}</div>
      ${list.filter(s => s.group === g).map(s => `
        <div class="card skill">
          <div><h2>${esc(s.title)}</h2><p class="muted">${esc(s.blurb)}</p></div>
          <div class="levels">
            ${[1, 2, 3].map(L => {
              const b = best[`${s.id}.${L}`];
              return `<a class="level" href="#/practice/${s.id}/${L}">
                <span class="lv">${s.levels[L].name}</span>
                <span class="ld">${esc(s.levels[L].desc)}</span>
                ${b ? `<span class="best">Best: ${b.score}/${b.total}</span>` : ''}
              </a>`;
            }).join('')}
          </div>
        </div>`).join('')}
    `).join('')}`;
  window.scrollTo(0, 0);
}

// ---------- practice ----------
function startSet(skill, level) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const rng = makeRng(seed);
  const problems = [];
  const seen = new Set();
  let guard = 0;
  while (problems.length < SET_SIZE && guard++ < 200) {
    const p = skill.generate(level, rng);
    // prompts can share wording (e.g. "Graph the parabola"), so compare the underlying problem too
    const key = p.prompt + JSON.stringify(p._check || {}) + JSON.stringify(p.displayGraph?.labels || []);
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push(p);
  }
  const state = { skill, level, problems, i: 0, results: [], started: Date.now(), setId: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
  showProblem(state);
}

function showProblem(state) {
  const { skill, level, problems, i } = state;
  const p = problems[i];
  const dots = problems.map((_, k) => `<span class="dot ${k < state.results.length ? (state.results[k] ? 'right' : 'wrong') : k === i ? 'cur' : ''}"></span>`).join('');
  app.innerHTML = `
    <div class="practice-head">
      <div><div class="crumb"><a href="#/">All skills</a> / ${esc(skill.title)}</div>
      <h2 style="margin:2px 0 0">${skill.levels[level].name} · Problem ${i + 1} of ${problems.length}</h2></div>
      <div class="dots" aria-hidden="true">${dots}</div>
    </div>
    <div class="card" id="pcard">
      <div class="prompt">${p.prompt}</div>
      ${p.visual ? `<div class="visual">${p.visual}</div>` : ''}
      ${p.displayGraph ? `<div class="visual" id="dgraph"></div>` : ''}
      <div id="parts">${p.parts.map((part, k) => partHtml(part, k)).join('')}</div>
      <div id="sol"></div>
      <div class="actions" id="acts"><button class="btn" id="check">Check answer</button></div>
    </div>`;
  const card = document.getElementById('pcard');
  if (p.displayGraph) {
    const dg = p.displayGraph, gr = makeGrid({ ...dg.window, interactive: false });
    if (dg.asymptote !== undefined) gr.asymptote(dg.asymptote);
    if (dg.fn) gr.curve(dg.fn);
    for (const l of dg.labels || []) gr.label(l.x, l.y, l.text);
    document.getElementById('dgraph').appendChild(gr.root);
  }
  state.grids = {};
  // wire inputs
  p.parts.forEach((part, k) => {
    if (part.type === 'graph') {
      const gr = makeGrid({ ...part.window, snap: part.snap || 1, interactive: true });
      card.querySelector(`#gr${k}`).appendChild(gr.root);
      state.grids[k] = gr;
      return;
    }
    if (part.type === 'mc') {
      card.querySelectorAll(`[data-part="${k}"] .choice`).forEach(btn => btn.onclick = () => {
        if (state.checked) return;
        card.querySelectorAll(`[data-part="${k}"] .choice`).forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    } else {
      const inp = card.querySelector(`#in${k}`);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('check')?.click(); });
      card.querySelectorAll(`[data-part="${k}"] .key`).forEach(btn => btn.onclick = () => {
        if (state.checked) return;
        const s0 = inp.selectionStart ?? inp.value.length, s1 = inp.selectionEnd ?? s0;
        inp.value = inp.value.slice(0, s0) + btn.dataset.ins + inp.value.slice(s1);
        inp.focus(); inp.setSelectionRange(s0 + btn.dataset.ins.length, s0 + btn.dataset.ins.length);
        inp.dispatchEvent(new Event('input'));
      });
      if (part.type === 'rule' || part.preview) {
        const pv = card.querySelector(`#pv${k}`);
        const prev = part.preview || previewTex;
        inp.addEventListener('input', () => {
          const t = prev(inp.value);
          pv.innerHTML = t === null ? '<span>…</span>' : t ? `You typed: $${t}$` : '';
          typeset(pv);
        });
      }
    }
  });
  state.checked = false;
  document.getElementById('check').onclick = () => check(state);
  typeset(card);
  card.querySelector('input')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function partHtml(part, k) {
  if (part.type === 'graph') {
    return `<div class="part" data-part="${k}"><div class="part-label">${part.label}</div>
      <div id="gr${k}"></div>${part.help ? `<div class="help">${esc(part.help)}</div>` : ''}<div class="fb"></div></div>`;
  }
  if (part.type === 'mc') {
    return `<div class="part" data-part="${k}"><div class="part-label">${part.label}</div>
      <div class="choices">${part.choices.map((c, j) => `<button type="button" class="choice" data-choice="${j}">${c}</button>`).join('')}</div>
      <div class="fb"></div></div>`;
  }
  return `<div class="part" data-part="${k}"><div class="part-label"><label for="in${k}">${part.label}</label></div>
    <div class="answer-row"><input type="text" id="in${k}" autocomplete="off" spellcheck="false" placeholder="${esc(part.placeholder || '')}"></div>
    ${part.keys ? `<div class="keys">${part.keys.map(x => `<button type="button" class="key" data-ins="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    ${part.type === 'rule' || part.preview ? `<div class="preview" id="pv${k}"></div>` : ''}
    ${part.help ? `<div class="help">${esc(part.help)}</div>` : ''}
    ${part.hint ? `<div class="help">${esc(part.hint)}</div>` : ''}
    <div class="fb"></div></div>`;
}

function answerTex(part) {
  const f = x => {
    const fr = Frac.of(x);
    const dec = !fr.isInt() && fr.terminatingDecimal();
    return `$${fr.tex()}$` + (dec ? ` (or ${dec})` : '');
  };
  if (part.answerTex) return part.answerTex;
  switch (part.type) {
    case 'number': return f(part.answer);
    case 'list': return part.answer.length ? part.answer.map(x => `$${Frac.of(x).tex()}$`).join(', ') : 'none';
    case 'point': return part.answer ? `$\\left(${Frac.of(part.answer[0]).tex()},\\ ${Frac.of(part.answer[1]).tex()}\\right)$` : 'none';
    case 'mc': return part.choices[part.answer];
    case 'rule': return 'see the worked solution';
  }
}

function check(state) {
  const p = state.problems[state.i];
  const card = document.getElementById('pcard');
  const results = [];
  let formatProblem = false;
  p.parts.forEach((part, k) => {
    const box = card.querySelector(`[data-part="${k}"]`);
    const fb = box.querySelector('.fb');
    let r;
    if (part.type === 'graph') {
      r = part.check(state.grids[k].getPoints());
    } else if (part.type === 'mc') {
      const sel = box.querySelector('.choice.sel');
      r = sel ? { ok: +sel.dataset.choice === part.answer } : { ok: false, msg: 'Choose an answer.', format: true };
    } else {
      const v = card.querySelector(`#in${k}`).value;
      r = part.check ? part.check(v)
        : part.type === 'number' ? checkNumber(v, part.answer)
        : part.type === 'list' ? checkList(v, part.answer)
        : part.type === 'point' ? checkPoint(v, part.answer)
        : checkRule(v, part.truth, part.var);
    }
    if (r.format) { formatProblem = true; fb.innerHTML = `<div class="format-msg">${esc(r.msg)}</div>`; }
    else fb.innerHTML = '';
    results.push(r);
  });
  if (formatProblem) return; // let them fix the format; nothing is graded yet

  state.checked = true;
  const allOk = results.every(r => r.ok);
  results.forEach((r, k) => {
    const part = p.parts[k];
    const box = card.querySelector(`[data-part="${k}"]`);
    box.classList.add(r.ok ? 'ok' : 'no');
    box.querySelectorAll('input').forEach(i => i.readOnly = true);
    if (part.type === 'mc') box.querySelector(`[data-choice="${part.answer}"]`).classList.add('correct');
    if (part.type === 'graph') state.grids[k].reveal({ fn: part.fn, correct: part.correct });
    box.querySelector('.fb').innerHTML = r.ok
      ? `<span class="mark-ok">✓ Correct</span>`
      : `<span class="mark-no">✗ Not quite.</span> ${r.msg ? `<span>${esc(r.msg)}</span> ` : ''}<span class="muted">Correct answer: ${answerTex(part)}</span>`;
  });
  document.getElementById('sol').innerHTML = `<div class="solution"><h3>Worked solution</h3>${p.solution}</div>`;
  state.results.push(allOk);
  if (state.results.length < state.problems.length) sendLog(progressPayload(state, false)); // save progress after every problem
  const last = state.i === state.problems.length - 1;
  document.getElementById('acts').innerHTML = `<button class="btn" id="next">${last ? 'See results' : 'Next problem'}</button>`;
  document.getElementById('next').onclick = () => {
    if (last) return finish(state);
    state.i++; showProblem(state);
  };
  document.getElementById('next').focus({ preventScroll: true });
  typeset(card);
}

// ---------- results + logging ----------
async function finish(state) {
  const { skill, level, problems, results } = state;
  const score = results.filter(Boolean).length, total = problems.length;
  const minutes = Math.round((Date.now() - state.started) / 6000) / 10;
  const missed = problems.filter((_, k) => !results[k]).map(p => p.tag);
  const best = store.get('pp.best', {});
  const key = `${skill.id}.${level}`;
  if (!best[key] || score > best[key].score) { best[key] = { score, total }; store.set('pp.best', best); }

  const pct = score / total;
  const advice = pct >= 0.83 ? (level < 3 ? `Strong work. Try ${skill.levels[level + 1].name} next.` : 'Strong work on the hardest level.')
    : pct >= 0.5 ? 'Good progress. Read the worked solutions for the ones you missed, then try another set at this level.'
    : (level > 1 ? `Try another set here, or step back to ${skill.levels[level - 1].name} first.` : 'Read the worked solutions carefully, then try another set.');

  app.innerHTML = `
    <div class="card">
      <div class="crumb muted"><a href="#/">All skills</a> / ${esc(skill.title)} / ${skill.levels[level].name}</div>
      <h1 style="margin-top:6px">Set complete</h1>
      <div class="score-big">${score}<span style="font-size:1.4rem;color:var(--grey)"> / ${total}</span></div>
      <p>${advice}</p>
      ${missed.length ? `<p class="muted" style="margin-bottom:0">Problems to review:</p><ul class="review-list">${[...new Set(missed)].map(t => { const n = missed.filter(x => x === t).length; return `<li>${esc(t)}${n > 1 ? ` (${n})` : ''}</li>`; }).join('')}</ul>` : ''}
      <div id="logstatus" class="status muted">Saving your result…</div>
      <div class="actions">
        <a class="btn" href="#/practice/${skill.id}/${level}" id="again">Another ${skill.levels[level].name} set</a>
        ${level < 3 ? `<a class="btn secondary" href="#/practice/${skill.id}/${level + 1}">Try ${skill.levels[level + 1].name}</a>` : ''}
        <a class="btn secondary" href="#/">All skills</a>
      </div>
    </div>`;
  // same-hash link: force a reroute
  document.getElementById('again').onclick = e => { e.preventDefault(); startSet(skill, level); };
  window.scrollTo(0, 0);

  const status = document.getElementById('logstatus');
  const ok = await sendLog(progressPayload(state, true));
  status.className = 'status ' + (ok === true ? 'sent' : 'warn');
  status.textContent = ok === true ? '✓ Result saved for your teacher.'
    : ok === 'off' ? 'Practice mode: results are not being recorded yet.'
    : 'Could not reach the gradebook right now. Your result will be sent next time you finish a set.';
}

// One row per set in the Sheet. Every update carries the set ID; the Sheet keeps the latest.
function progressPayload(state, done) {
  const { skill, level, problems, results } = state;
  const attempted = results.length, score = results.filter(Boolean).length;
  return {
    setId: state.setId,
    name: student.name, course: student.course, teacher: student.teacher || '', block: student.block,
    skill: skill.title, level: skill.levels[level].name,
    status: done ? 'Completed' : `Stopped: ${attempted} of ${problems.length}`,
    score, attempted, total: problems.length,
    percent: attempted ? Math.round(100 * score / attempted) : 0,
    missed: problems.slice(0, attempted).filter((_, k) => !results[k]).map(p => p.tag).join('; '),
    minutes: Math.round((Date.now() - state.started) / 6000) / 10,
    version: CONFIG.version,
  };
}

async function sendLog(payload) {
  if (!CONFIG.sheetUrl) return 'off';
  // keep only the newest update for each set (older ones are superseded)
  const queue = store.get('pp.queue', []).filter(q => q.setId !== payload.setId);
  queue.push(payload);
  const remaining = [];
  for (const item of queue) {
    try {
      // text/plain + no-cors avoids a CORS preflight that Apps Script does not answer
      await fetch(CONFIG.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item) });
    } catch { remaining.push(item); }
  }
  store.set('pp.queue', remaining);
  return remaining.length === 0 ? true : false;
}
