import { SKILLS, byId, EXAMS } from './skills/index.js?v=3.4';
import { makeRng, checkNumber, checkList, checkPoint, checkRule, previewTex, Frac } from './math.js?v=3.4';
import { CONFIG } from './config.js?v=3.4';
import { makeGrid, makeLogGrid } from './graph.js?v=3.4';

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
  if (parts[0] === 'exam') { const ex = myExams().find(e => e.id === parts[1]); if (ex) return startExam(ex, parts[2] === 'new'); }
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
// (function declarations, because route() runs before the rest of this file is evaluated)
// a skill's group and lesson can be one value, or an object with one value per course ({ accel: '2.3' })
function perCourse(v) { return v && typeof v === 'object' ? v[courseOf(student)?.skills] : v; }
function groupOf(s) { return perCourse(s.group) || 'Other'; }
function lessonOf(s) { return perCourse(s.lesson) || ''; }
function lessonKey(s) {
  const l = lessonOf(s);
  if (!l) return [999];
  const m = l.match(/^([A-Za-z])\.(\d+)/);              // lettered chapters (like T.1) sort after numbered ones
  if (m) return [100 + m[1].toUpperCase().charCodeAt(0), +m[2]];
  return l.split(/[^\d.]/)[0].split('.').map(Number);
}
function byLesson(a, b) { const x = lessonKey(a), y = lessonKey(b); return (x[0] - y[0]) || ((x[1] || 0) - (y[1] || 0)); }

function skillCard(s, best) {
  return `
        <div class="card skill">
          <div><h2>${lessonOf(s) ? `<span class="lesson">${esc(lessonOf(s))}</span>` : ''}${esc(s.title)}</h2><p class="muted">${esc(s.blurb)}</p></div>
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
        </div>`;
}

function home() {
  const best = store.get('pp.best', {});
  const list = mySkills();
  let groups = [...new Set(list.map(groupOf))];
  const course = courseOf(student);
  const intro = `
    <div class="crumb muted">${esc(student.course)}</div>
    <h1>Choose a skill</h1>
    <p class="muted">Each set has ${SET_SIZE} problems. Start at Easy and move up when you can get most of a set right.</p>`;
  if (!course?.collapsible) {
    app.innerHTML = intro + groups.map(g => `
      <div class="group-title">${esc(g)}</div>
      ${list.filter(s => groupOf(s) === g).map(s => skillCard(s, best)).join('')}`).join('');
    window.scrollTo(0, 0);
    return;
  }
  // collapsible sections: open the teacher's current section(s) by default, then remember each student's choices
  // sections in lesson order
  const firstLesson = g => list.filter(s => groupOf(s) === g).map(lessonKey).sort((x, y) => (x[0] - y[0]) || ((x[1] || 0) - (y[1] || 0)))[0];
  const unitRank = g => { if (!course.unitOrder) return 0; const u = (g.match(/^Unit\s+(\S+)/) || [])[1]; const i = course.unitOrder.indexOf(u); return i < 0 ? course.unitOrder.length : i; };
  groups = groups.sort((a, b) => { const x = firstLesson(a), y = firstLesson(b); return (unitRank(a) - unitRank(b)) || (x[0] - y[0]) || ((x[1] || 0) - (y[1] || 0)); });
  const openKey = 'pp.open.' + course.skills + (course.openVersion ? '.v' + course.openVersion : '');
  const open = new Set(store.get(openKey, course.openSections || []));
  const exams = myExams();
  app.innerHTML = intro + groups.map(g => {
    const items = list.filter(s => groupOf(s) === g).sort(byLesson);
    const examsHere = exams.filter(e => g.startsWith(e.after) && !groups.slice(groups.indexOf(g) + 1).some(h => h.startsWith(e.after)));
    return `
      <details class="section" data-group="${esc(g)}" ${open.has(g) ? 'open' : ''}>
        <summary><span class="sec-title">${esc(g)}</span><span class="sec-count">${items.length} skill${items.length === 1 ? '' : 's'}</span></summary>
        <div class="sec-body">${items.map(s => skillCard(s, best)).join('')}</div>
      </details>` + examsHere.map(e => examSection(e, best)).join('');
  }).join('');
  app.querySelectorAll('details.section').forEach(d => d.addEventListener('toggle', () => {
    const now = [...app.querySelectorAll('details.section')].filter(x => x.open).map(x => x.dataset.group);
    store.set(openKey, now);
  }));
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
    const p = skill.generate(level, rng, { course: courseOf(student)?.skills });
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
  const dots = problems.map((_, k) => `<span class="dot ${k < state.results.length ? (state.results[k] === 'skip' ? 'skipped' : state.results[k] ? 'right' : 'wrong') : k === i ? 'cur' : ''}"></span>`).join('');
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
      ${p.displayLog ? `<div class="visual" id="dlog"></div>` : ''}
      <div id="parts">${p.parts.map((part, k) => partHtml(part, k)).join('')}</div>
      <div id="sol"></div>
      <div class="actions" id="acts"><button class="btn" id="check">Check answer</button><button class="btn secondary" id="reveal" title="See the answer and worked solution. This problem will not count for or against you.">Show me how</button></div>
      <div class="reveal-note muted" id="revealNote">Stuck? "Show me how" shows the answer and worked solution. It does not count as right or wrong.</div>
    </div>`;
  const card = document.getElementById('pcard');
  mountParts(card, p, state);
  state.checked = false;
  document.getElementById('check').onclick = () => check(state);
  document.getElementById('reveal').onclick = () => reveal(state);
  typeset(card);
  card.querySelector('input')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// draw a problem's given graph and wire up its answer inputs (shared by practice and the mock exam)
function mountParts(card, p, state) {
  if (p.displayGraph) {
    const dg = p.displayGraph, gr = makeGrid({ ...dg.window, interactive: false });
    if (dg.asymptote !== undefined) gr.asymptote(dg.asymptote);
    if (dg.fn) gr.curve(dg.fn);
    for (const f of dg.fns || []) gr.curve(f);
    for (const l of dg.labels || []) gr.label(l.x, l.y, l.text);
    document.getElementById('dgraph').appendChild(gr.root);
  }
  if (p.displayLog) {
    const dl = p.displayLog, gr = makeLogGrid({ ...dl.grid, interactive: false });
    if (dl.fn) gr.curve(dl.fn);
    for (const l of dl.labels || []) gr.label(l.x, l.y, l.text);
    document.getElementById('dlog').appendChild(gr.root);
  }
  state.grids = {};
  // wire inputs
  p.parts.forEach((part, k) => {
    if (part.type === 'graph') {
      const gr = part.logScale ? makeLogGrid(part.logScale) : makeGrid({ ...part.window, snap: part.snap || 1, interactive: true });
      if (part.base) {                       // something drawn on the grid before the student plots (e.g. f, to graph its inverse)
        if (part.base.line) gr.curve(x => x, 'yx-line');
        if (part.base.fn) gr.curve(part.base.fn, 'curve base');
        for (const q of part.base.points || []) gr.label(q.x, q.y, q.text || '', 'pt-label', 'pt-base');
      }
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
    } else if (part.type === 'multi') {      // select all that apply: each choice toggles
      card.querySelectorAll(`[data-part="${k}"] .choice`).forEach(btn => btn.onclick = () => {
        if (state.checked) return;
        btn.classList.toggle('sel');
        btn.setAttribute('aria-pressed', btn.classList.contains('sel'));
      });
    } else {
      const inp = card.querySelector(`#in${k}`);
      inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();   // without this, the same Enter press also clicks the Next button that appears, skipping the feedback
        state.onEnter ? state.onEnter() : document.getElementById('check')?.click();
      });
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
}

function partHtml(part, k) {
  if (part.type === 'graph') {
    return `<div class="part" data-part="${k}"><div class="part-label">${part.label}</div>
      <div id="gr${k}"></div>${part.help ? `<div class="help">${esc(part.help)}</div>` : ''}<div class="fb"></div></div>`;
  }
  if (part.type === 'multi') {
    return `<div class="part" data-part="${k}"><div class="part-label">${part.label} <span class="muted">(select all that apply)</span></div>
      <div class="choices multi">${part.choices.map((c, j) => `<button type="button" class="choice" aria-pressed="false" data-choice="${j}">${c}</button>`).join('')}</div>
      <div class="fb"></div></div>`;
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
    case 'multi': return part.answers.map(j => part.choices[j]).join(', ');
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
    } else if (part.type === 'multi') {
      const picked = [...box.querySelectorAll('.choice.sel')].map(b => +b.dataset.choice).sort((a, b) => a - b);
      const want = [...part.answers].sort((a, b) => a - b);
      r = !picked.length ? { ok: false, msg: 'Select every choice that applies.', format: true }
        : { ok: picked.length === want.length && picked.every((j, i) => j === want[i]) };
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
    if (part.type === 'multi') part.answers.forEach(j => box.querySelector(`[data-choice="${j}"]`).classList.add('correct'));
    if (part.type === 'graph') state.grids[k].reveal({ fn: part.fn, correct: part.correct });
    box.querySelector('.fb').innerHTML = r.ok
      ? `<span class="mark-ok">✓ Correct</span>`
      : `<span class="mark-no">✗ Not quite.</span> ${r.msg ? `<span>${esc(r.msg)}</span> ` : ''}<span class="muted">Correct answer: ${answerTex(part)}</span>`;
  });
  afterAnswer(state, allOk);
}

// "Show me how": reveal the answers and the worked solution without grading. The problem is
// recorded as 'skip', which counts as neither right nor wrong.
function reveal(state) {
  if (state.checked) return;
  const p = state.problems[state.i];
  const card = document.getElementById('pcard');
  state.checked = true;
  p.parts.forEach((part, k) => {
    const box = card.querySelector(`[data-part="${k}"]`);
    box.classList.add('shown');
    box.querySelectorAll('input').forEach(i => { i.readOnly = true; });
    if (part.type === 'mc') box.querySelector(`[data-choice="${part.answer}"]`).classList.add('correct');
    if (part.type === 'multi') part.answers.forEach(j => box.querySelector(`[data-choice="${j}"]`).classList.add('correct'));
    if (part.type === 'graph') state.grids[k].reveal({ fn: part.fn, correct: part.correct });
    box.querySelector('.fb').innerHTML = `<span class="mark-shown">Answer:</span> <span>${answerTex(part)}</span>`;
  });
  afterAnswer(state, 'skip');
}

function afterAnswer(state, result) {
  const p = state.problems[state.i];
  const card = document.getElementById('pcard');
  document.getElementById('sol').innerHTML = `<div class="solution"><h3>Worked solution</h3>${p.solution}</div>`;
  document.getElementById('revealNote')?.remove();
  state.results.push(result);
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
  const score = results.filter(r => r === true).length;
  const skipped = results.filter(r => r === 'skip').length;
  const total = results.length - skipped;                 // problems actually attempted
  const minutes = Math.round((Date.now() - state.started) / 6000) / 10;
  const missed = problems.filter((_, k) => results[k] === false).map(p => p.tag);
  const viewed = problems.filter((_, k) => results[k] === 'skip').map(p => p.tag);
  const best = store.get('pp.best', {});
  const key = `${skill.id}.${level}`;
  const ratio = b => (b.total ? b.score / b.total : 0);
  if (total && (!best[key] || score > best[key].score || (score === best[key].score && ratio({ score, total }) > ratio(best[key])))) { best[key] = { score, total }; store.set('pp.best', best); }

  const pct = total ? score / total : 0;
  const advice = pct >= 0.83 ? (level < 3 ? `Strong work. Try ${skill.levels[level + 1].name} next.` : 'Strong work on the hardest level.')
    : pct >= 0.5 ? 'Good progress. Read the worked solutions for the ones you missed, then try another set at this level.'
    : (level > 1 ? `Try another set here, or step back to ${skill.levels[level - 1].name} first.` : 'Read the worked solutions carefully, then try another set.');

  app.innerHTML = `
    <div class="card">
      <div class="crumb muted"><a href="#/">All skills</a> / ${esc(skill.title)} / ${skill.levels[level].name}</div>
      <h1 style="margin-top:6px">Set complete</h1>
      <div class="score-big">${score}<span style="font-size:1.4rem;color:var(--grey)"> / ${total}</span></div>
      ${skipped ? `<p class="muted">You used "Show me how" on ${skipped} problem${skipped === 1 ? '' : 's'}, so ${skipped === 1 ? 'it is' : 'they are'} not counted in your score.</p>` : ''}
      <p>${total ? advice : 'Read through the worked solutions, then try another set on your own.'}</p>
      ${missed.length || viewed.length ? `<p class="muted" style="margin-bottom:0">Problems to review:</p><ul class="review-list">${[...new Set([...missed, ...viewed])].map(t => { const n = missed.filter(x => x === t).length, v = viewed.filter(x => x === t).length; return `<li>${esc(t)}${n > 1 ? ` (${n})` : ''}${v ? ` <span class="muted">(solution viewed${v > 1 ? ` ×${v}` : ''})</span>` : ''}</li>`; }).join('')}</ul>` : ''}
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
  const skipped = results.filter(r => r === 'skip').length;
  const attempted = results.length - skipped, score = results.filter(r => r === true).length;
  const viewed = skipped ? ` (${skipped} solution${skipped === 1 ? '' : 's'} viewed)` : '';
  return {
    setId: state.setId,
    name: student.name, course: student.course, teacher: student.teacher || '', block: student.block,
    skill: skill.title, level: skill.levels[level].name,
    status: (done ? 'Completed' : `Stopped: ${results.length} of ${problems.length}`) + viewed,
    score, attempted, total: problems.length,
    percent: attempted ? Math.round(100 * score / attempted) : 0,
    missed: problems.slice(0, results.length).filter((_, k) => results[k] === false).map(p => p.tag).join('; '),
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

// ---------- mock exam ----------
// One Challenging question per study guide skill, drawn from that skill's pool. Answers are saved as the
// student moves around (and survive a reload: the exam is rebuilt from its seed). Nothing is graded until
// they submit, and "Show me how" is not offered.
function myExams() { return EXAMS.filter(e => e.course === courseOf(student)?.skills); }
function examKey(exam) { return 'pp.exam.' + exam.id; }

function examSection(exam, best) {
  const saved = store.get(examKey(exam));
  const b = best['exam.' + exam.id];
  const answered = saved ? saved.answers.filter(a => a && a.some(v => !isBlank(v))).length : 0;
  return `
      <details class="section exam-section" data-group="${esc(exam.section)}" open>
        <summary><span class="sec-title">${esc(exam.section)}</span><span class="sec-count">${exam.items.length} questions</span></summary>
        <div class="sec-body"><div class="card skill">
          <div><h2>${esc(exam.title)}</h2><p class="muted">${esc(exam.blurb)}</p></div>
          <div class="levels">
            <a class="level" href="#/exam/${exam.id}">
              <span class="lv">${saved ? 'Resume' : 'Start'}</span>
              <span class="ld">${saved ? `${answered} of ${exam.items.length} answered so far` : `${exam.items.length} questions, graded when you submit`}</span>
              ${b ? `<span class="best">Best: ${b.score}/${b.total}</span>` : ''}
            </a>
            ${saved ? `<a class="level" href="#/exam/${exam.id}/new"><span class="lv">Start over</span><span class="ld">A new exam, and clear these answers</span></a>` : ''}
          </div>
        </div></div>
      </details>`;
}

function buildExam(exam, seed) {
  const rng = makeRng(seed), ctx = { course: courseOf(student)?.skills };
  return exam.items.map(item => {
    const pool = item.skills.map(id => byId[id]).filter(Boolean);
    const skill = pool[Math.floor(rng() * pool.length)];
    return { item, skill, p: skill.generate(exam.level, rng, ctx) };
  });
}

function startExam(exam, fresh) {
  if (fresh) { store.set(examKey(exam), null); location.hash = `#/exam/${exam.id}`; return; }
  let saved = store.get(examKey(exam));
  if (!saved) {
    saved = { seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0, answers: exam.items.map(() => null), i: 0, started: Date.now(), setId: 'exam-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    store.set(examKey(exam), saved);
  }
  let qs;
  try { qs = buildExam(exam, saved.seed); } catch { store.set(examKey(exam), null); return startExam(exam, false); }
  const state = { exam, qs, saved, i: saved.i || 0, mode: 'take', grids: {} };
  showExamQuestion(state);
}

// (a function declaration, because route() can run before this point of the file is evaluated)
function isBlank(v) { return v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); }

// read the current answers off the page
function captureValues(card, p, state) {
  return p.parts.map((part, k) => {
    const box = card.querySelector(`[data-part="${k}"]`);
    if (part.type === 'graph') return state.grids[k].getPoints();
    if (part.type === 'mc') { const sel = box.querySelector('.choice.sel'); return sel ? +sel.dataset.choice : null; }
    if (part.type === 'multi') return [...box.querySelectorAll('.choice.sel')].map(b => +b.dataset.choice);
    return card.querySelector(`#in${k}`).value;
  });
}
// put saved answers back on the page
function restoreValues(card, p, state, vals) {
  if (!vals) return;
  p.parts.forEach((part, k) => {
    const v = vals[k], box = card.querySelector(`[data-part="${k}"]`);
    if (isBlank(v)) return;
    if (part.type === 'graph') state.grids[k].setPoints?.(v);
    else if (part.type === 'mc') box.querySelector(`[data-choice="${v}"]`)?.classList.add('sel');
    else if (part.type === 'multi') v.forEach(j => { const b = box.querySelector(`[data-choice="${j}"]`); if (b) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); } });
    else { const inp = card.querySelector(`#in${k}`); inp.value = v; inp.dispatchEvent(new Event('input')); }
  });
}
// grade one saved answer; a blank answer is wrong
function gradeValue(part, v) {
  if (isBlank(v) && part.type !== 'graph') return { ok: false, blank: true };
  if (part.type === 'graph') return part.check(v || []);
  if (part.type === 'mc') return { ok: v === part.answer };
  if (part.type === 'multi') { const want = [...part.answers].sort((a, b) => a - b), got = [...v].sort((a, b) => a - b); return { ok: got.length === want.length && got.every((j, i) => j === want[i]) }; }
  return part.check ? part.check(v)
    : part.type === 'number' ? checkNumber(v, part.answer)
    : part.type === 'list' ? checkList(v, part.answer)
    : part.type === 'point' ? checkPoint(v, part.answer)
    : checkRule(v, part.truth, part.var);
}

function showExamQuestion(state) {
  const { exam, qs, i, mode } = state;
  const { item, p } = qs[i];
  const review = mode === 'review';
  const answers = state.saved.answers;
  const dots = qs.map((_, k) => {
    const cls = review ? (state.graded[k].ok ? 'right' : 'wrong') : (answers[k] && answers[k].some(v => !isBlank(v)) ? 'answered' : '');
    return `<button type="button" class="dot ${cls} ${k === i ? 'cur' : ''}" data-q="${k}" title="Question ${k + 1}" aria-label="Question ${k + 1}"></button>`;
  }).join('');
  const last = i === qs.length - 1;
  app.innerHTML = `
    <div class="practice-head">
      <div><div class="crumb"><a href="#/">All skills</a> / ${esc(exam.title)}${review ? ' / Review' : ''}</div>
      <h2 style="margin:2px 0 0">Question ${i + 1} of ${qs.length}</h2>
      <div class="muted">Skill ${item.n}: ${esc(item.name)}</div></div>
      <div class="dots exam-dots">${dots}</div>
    </div>
    <div class="card" id="pcard">
      <div class="prompt">${p.prompt}</div>
      ${p.visual ? `<div class="visual">${p.visual}</div>` : ''}
      ${p.displayGraph ? `<div class="visual" id="dgraph"></div>` : ''}
      ${p.displayLog ? `<div class="visual" id="dlog"></div>` : ''}
      <div id="parts">${p.parts.map((part, k) => partHtml(part, k)).join('')}</div>
      <div id="sol"></div>
      <div class="actions" id="acts">
        ${i > 0 ? '<button class="btn secondary" id="prev">Previous</button>' : ''}
        ${!last ? '<button class="btn" id="next">Next</button>' : ''}
        ${review ? '<button class="btn secondary" id="back">Back to results</button>' : last ? '<button class="btn" id="submit">Submit exam</button>' : ''}
      </div>
      <div id="examMsg"></div>
      ${review ? '' : `<div class="reveal-note muted">Answers are saved as you go. Nothing is graded until you submit${last ? '' : ' on the last question'}.</div>`}
    </div>`;
  const card = document.getElementById('pcard');
  state.grids = {};
  state.checked = review;                   // locks choices and keypad buttons in review
  mountParts(card, p, state);
  restoreValues(card, p, state, answers[i]);
  if (review) markReview(card, p, state, i);
  const go = to => {
    if (!review && !leaveQuestion(state)) return;
    state.i = to; if (!review) { state.saved.i = to; store.set(examKey(exam), state.saved); }
    showExamQuestion(state);
  };
  state.onEnter = () => (last ? null : go(i + 1));
  document.getElementById('prev')?.addEventListener('click', () => go(i - 1));
  document.getElementById('next')?.addEventListener('click', () => go(i + 1));
  document.getElementById('back')?.addEventListener('click', () => examResults(state));
  document.getElementById('submit')?.addEventListener('click', () => trySubmit(state, false));
  app.querySelectorAll('.exam-dots .dot').forEach(d => d.addEventListener('click', () => go(+d.dataset.q)));
  typeset(card);
  if (!review) card.querySelector('input')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// save this question's answers; stay put if one can't be read (so it isn't marked wrong for format)
function leaveQuestion(state) {
  const card = document.getElementById('pcard'), p = state.qs[state.i].p;
  const vals = captureValues(card, p, state);
  let stuck = false;
  p.parts.forEach((part, k) => {
    const fb = card.querySelector(`[data-part="${k}"] .fb`);
    fb.innerHTML = '';
    if (isBlank(vals[k]) || part.type === 'graph') return;
    const r = gradeValue(part, vals[k]);
    if (r.format) { stuck = true; fb.innerHTML = `<div class="format-msg">${esc(r.msg)} Fix it, or clear the box to leave it blank.</div>`; }
  });
  state.saved.answers[state.i] = vals;
  store.set(examKey(state.exam), state.saved);
  return !stuck;
}

function trySubmit(state, confirmed) {
  if (!leaveQuestion(state)) return;
  const blanks = state.qs.map((q, k) => (state.saved.answers[k] || []).length && q.p.parts.every((_, j) => !isBlank(state.saved.answers[k][j])) ? -1 : k).filter(k => k >= 0);
  if (blanks.length && !confirmed) {
    const list = blanks.map(k => k + 1), msg = document.getElementById('examMsg');
    msg.innerHTML = `<div class="format-msg">${list.length === 1 ? `Question ${list[0]} has` : `Questions ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]} have`} a blank answer. Blank answers are marked wrong.
      <div class="actions" style="margin-top:8px"><button class="btn" id="subAnyway">Submit anyway</button><button class="btn secondary" id="goBlank">Go to question ${list[0]}</button></div></div>`;
    document.getElementById('subAnyway').onclick = () => trySubmit(state, true);
    document.getElementById('goBlank').onclick = () => { state.i = blanks[0]; state.saved.i = blanks[0]; store.set(examKey(state.exam), state.saved); showExamQuestion(state); };
    return;
  }
  state.graded = state.qs.map((q, k) => {
    const parts = q.p.parts.map((part, j) => { const r = gradeValue(part, (state.saved.answers[k] || [])[j]); return r.format ? { ok: false } : r; });
    return { ok: parts.every(r => r.ok), parts };
  });
  state.finished = Date.now();
  store.set(examKey(state.exam), null);                   // the next visit starts a new exam
  examResults(state, true);
}

function markReview(card, p, state, i) {
  const g = state.graded[i];
  p.parts.forEach((part, k) => {
    const r = g.parts[k], box = card.querySelector(`[data-part="${k}"]`);
    box.classList.add(r.ok ? 'ok' : 'no');
    box.querySelectorAll('input').forEach(x => { x.readOnly = true; });
    if (part.type === 'mc') box.querySelector(`[data-choice="${part.answer}"]`).classList.add('correct');
    if (part.type === 'multi') part.answers.forEach(j => box.querySelector(`[data-choice="${j}"]`).classList.add('correct'));
    if (part.type === 'graph') state.grids[k].reveal({ fn: part.fn, correct: part.correct });
    box.querySelector('.fb').innerHTML = r.ok ? '<span class="mark-ok">✓ Correct</span>'
      : `<span class="mark-no">✗ ${r.blank ? 'Left blank.' : 'Not quite.'}</span> ${r.msg ? `<span>${esc(r.msg)}</span> ` : ''}<span class="muted">Correct answer: ${answerTex(part)}</span>`;
  });
  document.getElementById('sol').innerHTML = `<div class="solution"><h3>Worked solution</h3>${p.solution}</div>`;
}

async function examResults(state, justSubmitted) {
  const { exam, qs, graded } = state;
  const score = graded.filter(g => g.ok).length, total = qs.length;
  const minutes = Math.round((state.finished - state.saved.started) / 6000) / 10;
  if (justSubmitted) {
    const best = store.get('pp.best', {}), key = 'exam.' + exam.id;
    if (!best[key] || score > best[key].score) { best[key] = { score, total }; store.set('pp.best', best); }
  }
  const rows = qs.map((q, k) => {
    const g = graded[k], nOk = g.parts.filter(r => r.ok).length;
    return `<tr class="${g.ok ? 'row-ok' : 'row-no'}">
      <td><span class="${g.ok ? 'mark-ok' : 'mark-no'}">${g.ok ? '✓' : '✗'}</span></td>
      <td><b>Skill ${q.item.n}:</b> ${esc(q.item.name)}<div class="muted small">${esc(q.skill.title)}${q.p.parts.length > 1 ? ` · ${nOk} of ${q.p.parts.length} parts correct` : ''}</div></td>
      <td class="exam-links"><button class="btn secondary small" data-review="${k}">Review</button>${g.ok ? '' : ` <a class="btn secondary small" href="#/practice/${q.skill.id}/${exam.level}">Practice</a>`}</td>
    </tr>`;
  }).join('');
  app.innerHTML = `
    <div class="card">
      <div class="crumb muted"><a href="#/">All skills</a> / ${esc(exam.title)}</div>
      <h1 style="margin-top:6px">Mock exam results</h1>
      <div class="score-big">${score}<span style="font-size:1.4rem;color:var(--grey)"> / ${total}</span></div>
      <p>${score === total ? 'Every skill correct. Strong work.' : 'Review each question you missed, then practice those skills at Challenging.'}</p>
      <table class="exam-table">${rows}</table>
      <div id="logstatus" class="status muted">${justSubmitted ? 'Saving your result…' : ''}</div>
      <div class="actions">
        <a class="btn" href="#/exam/${exam.id}/new">Take a new mock exam</a>
        <a class="btn secondary" href="#/">All skills</a>
      </div>
    </div>`;
  app.querySelectorAll('[data-review]').forEach(b => b.onclick = () => { state.mode = 'review'; state.i = +b.dataset.review; showExamQuestion(state); });
  window.scrollTo(0, 0);
  if (!justSubmitted) return;
  const missed = qs.filter((_, k) => !graded[k].ok).map(q => `Skill ${q.item.n}: ${q.item.name} (${q.skill.title})`);
  const ok = await sendLog({
    setId: state.saved.setId,
    name: student.name, course: student.course, teacher: student.teacher || '', block: student.block,
    skill: exam.title, level: 'Mock exam', status: 'Completed',
    score, attempted: total, total, percent: Math.round(100 * score / total),
    missed: missed.join('; '), minutes, version: CONFIG.version,
  });
  const status = document.getElementById('logstatus');
  if (!status) return;
  status.className = 'status ' + (ok === true ? 'sent' : 'warn');
  status.textContent = ok === true ? '✓ Result saved for your teacher.'
    : ok === 'off' ? 'Practice mode: results are not being recorded yet.'
    : 'Could not reach the gradebook right now. Your result will be sent next time you finish a set.';
}
