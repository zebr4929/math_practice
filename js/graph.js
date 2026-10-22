// Coordinate grid: interactive (students click to place points) or display-only.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const fmt = v => {
  if (Number.isInteger(v)) return String(v);
  const half = Math.round(v * 2);
  if (Math.abs(v * 2 - half) < 1e-9) return `${half}/2`;
  return String(+v.toFixed(2));
};

/**
 * opts: { xmin, xmax, ymin, ymax, snap = 1, interactive = true, maxPoints = 15 }
 * returns { root, getPoints(), lock(), reveal({ fn, correct }), curve(fn, cls), label(x, y, text), asymptote(y) }
 */
export function makeGrid(opts) {
  const { xmin, xmax, ymin, ymax, snap = 1, interactive = true, maxPoints = 15 } = opts;
  const M = 34, W = 520;
  const ux = (W - 2 * M) / (xmax - xmin);
  let uy = ux;
  if ((ymax - ymin) * uy > 620) uy = 620 / (ymax - ymin);
  if ((ymax - ymin) * uy < 240) uy = 240 / (ymax - ymin);
  const H = (ymax - ymin) * uy + 2 * M;
  const X = x => M + (x - xmin) * ux;
  const Y = y => M + (ymax - y) * uy;

  const root = document.createElement('div');
  root.className = 'grid-wrap';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'coord-grid' + (interactive ? ' interactive' : ''), role: 'img', 'aria-label': 'Coordinate grid' });
  root.appendChild(svg);

  // grid lines
  const g = el('g', {}, svg);
  const labelEvery = (r) => (r <= 20 ? 1 : r <= 30 ? 2 : r <= 60 ? 5 : 10);
  const lx = labelEvery(xmax - xmin), ly = labelEvery(ymax - ymin);
  if (snap < 1) {
    for (let x = Math.ceil(xmin * 2) / 2; x <= xmax; x += 0.5) if (!Number.isInteger(x)) el('line', { x1: X(x), x2: X(x), y1: Y(ymin), y2: Y(ymax), class: 'gl-half' }, g);
    for (let y = Math.ceil(ymin * 2) / 2; y <= ymax; y += 0.5) if (!Number.isInteger(y)) el('line', { x1: X(xmin), x2: X(xmax), y1: Y(y), y2: Y(y), class: 'gl-half' }, g);
  }
  for (let x = Math.ceil(xmin); x <= xmax; x++) el('line', { x1: X(x), x2: X(x), y1: Y(ymin), y2: Y(ymax), class: x % lx === 0 ? 'gl-major' : 'gl' }, g);
  for (let y = Math.ceil(ymin); y <= ymax; y++) el('line', { x1: X(xmin), x2: X(xmax), y1: Y(y), y2: Y(y), class: y % ly === 0 ? 'gl-major' : 'gl' }, g);
  // axes
  if (ymin <= 0 && ymax >= 0) el('line', { x1: X(xmin), x2: X(xmax), y1: Y(0), y2: Y(0), class: 'axis' }, g);
  if (xmin <= 0 && xmax >= 0) el('line', { x1: X(0), x2: X(0), y1: Y(ymin), y2: Y(ymax), class: 'axis' }, g);
  // tick labels (along the axes when visible, otherwise along the edges)
  const ax = ymin <= 0 && ymax >= 0 ? Y(0) : Y(ymin);
  const ay = xmin <= 0 && xmax >= 0 ? X(0) : X(xmin);
  for (let x = Math.ceil(xmin / lx) * lx; x <= xmax; x += lx) if (x !== 0) el('text', { x: X(x), y: ax + 14, class: 'tick', 'text-anchor': 'middle' }, g).textContent = x;
  for (let y = Math.ceil(ymin / ly) * ly; y <= ymax; y += ly) if (y !== 0) el('text', { x: ay - 5, y: Y(y) + 4, class: 'tick', 'text-anchor': 'end' }, g).textContent = y;
  el('text', { x: X(xmax) - 2, y: ax - 6, class: 'tick axis-name', 'text-anchor': 'end' }, g).textContent = 'x';
  el('text', { x: ay + 6, y: Y(ymax) + 12, class: 'tick axis-name' }, g).textContent = 'y';

  const overlay = el('g', {}, svg);
  const ptsLayer = el('g', {}, svg);
  const points = [];
  let locked = !interactive;

  const info = document.createElement('div');
  info.className = 'grid-info';
  const controls = document.createElement('div');
  controls.className = 'grid-controls';
  if (interactive) {
    controls.innerHTML = `<button type="button" class="key" data-act="undo">Undo</button><button type="button" class="key" data-act="clear">Clear</button>`;
    root.appendChild(controls);
    root.appendChild(info);
  }

  function redraw() {
    ptsLayer.innerHTML = '';
    for (const p of points) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-student' }, ptsLayer);
    if (interactive) info.textContent = points.length
      ? `Your points (${points.length}): ` + points.map(p => `(${fmt(p.x)}, ${fmt(p.y)})`).join('  ')
      : (snap < 1 ? 'Click to place points. Points snap to the nearest half unit.' : 'Click to place points. Click a point again to remove it.');
  }
  redraw();

  function toMath(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = Math.round((xmin + (p.x - M) / ux) / snap) * snap;
    const y = Math.round((ymax - (p.y - M) / uy) / snap) * snap;
    if (x < xmin || x > xmax || y < ymin || y > ymax) return null;
    return { x: +x.toFixed(4), y: +y.toFixed(4) };
  }

  if (interactive) {
    const ghost = el('circle', { r: 5, class: 'pt-ghost', visibility: 'hidden' }, svg);
    svg.addEventListener('pointermove', e => {
      if (locked) return;
      const p = toMath(e);
      if (!p) return ghost.setAttribute('visibility', 'hidden');
      ghost.setAttribute('cx', X(p.x)); ghost.setAttribute('cy', Y(p.y)); ghost.setAttribute('visibility', 'visible');
    });
    svg.addEventListener('pointerleave', () => ghost.setAttribute('visibility', 'hidden'));
    svg.addEventListener('click', e => {
      if (locked) return;
      const p = toMath(e);
      if (!p) return;
      const i = points.findIndex(q => q.x === p.x && q.y === p.y);
      if (i >= 0) points.splice(i, 1);
      else if (points.length < maxPoints) points.push(p);
      redraw();
    });
    controls.addEventListener('click', e => {
      if (locked) return;
      const act = e.target.dataset.act;
      if (act === 'undo') points.pop();
      if (act === 'clear') points.length = 0;
      redraw();
    });
  }

  function curve(fn, cls = 'curve') {
    let d = '', pen = false;
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const x = xmin + (i / steps) * (xmax - xmin), y = fn(x);
      if (!isFinite(y) || y < ymin - 1 || y > ymax + 1) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.max(ymin, Math.min(ymax, y))).toFixed(1)}`;
      pen = true;
    }
    el('path', { d, class: cls }, overlay);
  }
  function label(x, y, text, cls = 'pt-label', dotCls = 'pt-given') {
    el('circle', { cx: X(x), cy: Y(y), r: 5, class: dotCls }, overlay);
    if (text) {
      const right = X(x) < W - 120;
      el('text', { x: X(x) + (right ? 9 : -9), y: Y(y) - 8, class: cls, 'text-anchor': right ? 'start' : 'end' }, overlay).textContent = text;
    }
  }
  function asymptote(y) {
    el('line', { x1: X(xmin), x2: X(xmax), y1: Y(y), y2: Y(y), class: 'asym' }, overlay);
  }
  function reveal({ fn, correct }) {
    locked = true;
    root.classList.add('locked');
    if (fn) curve(fn, 'curve reveal');
    ptsLayer.innerHTML = '';
    const key = p => `${p.x},${p.y}`;
    const want = new Set(correct.map(key));
    const have = new Set(points.map(key));
    for (const p of correct) if (!have.has(key(p))) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-missed' }, ptsLayer);
    for (const p of points) {
      if (want.has(key(p))) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-right' }, ptsLayer);
      else {
        const s = 6, cx = X(p.x), cy = Y(p.y);
        el('path', { d: `M${cx - s},${cy - s}L${cx + s},${cy + s}M${cx - s},${cy + s}L${cx + s},${cy - s}`, class: 'pt-wrong' }, ptsLayer);
      }
    }
    if (interactive) info.innerHTML = '<span class="legend"><i class="lg-right"></i> correct point &nbsp; <i class="lg-wrong">✕</i> incorrect point &nbsp; <i class="lg-missed"></i> point you missed</span>';
  }
  return { root, getPoints: () => points.slice(), lock: () => { locked = true; }, reveal, curve, label, asymptote };
}

export const fmtCoord = fmt;

// ---------------------------------------------------------------------
// Grid with a logarithmic (base 10) vertical axis, for plotting points.
// opts: { xmin, xmax, xsnap = 1, emin, emax (powers of ten on the axis), mantissas (y snap values within a decade) }
// Values snap to x multiples of xsnap and to y = m * 10^e. The y-values of placed points are not shown,
// so students have to locate them on the scale themselves.
export const logValue = (m, e) => +(m * Math.pow(10, e)).toPrecision(6);
export function makeLogGrid(opts) {
  const { xmin, xmax, xsnap = 1, emin, emax, mantissas = [1, 2, 3, 4, 5, 6, 7, 8, 9], maxPoints = 12 } = opts;
  const M = 44, W = 520, decadeH = 150;
  const ux = (W - M - 20) / (xmax - xmin);
  const H = (emax - emin) * decadeH + M + 30;
  const X = x => M + (x - xmin) * ux;
  const Y = y => 20 + (emax - Math.log10(y)) * decadeH;
  const root = document.createElement('div');
  root.className = 'grid-wrap';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'coord-grid interactive log-grid', role: 'img', 'aria-label': 'Grid with a logarithmic vertical axis' });
  root.appendChild(svg);
  const g = el('g', {}, svg);
  for (let e = emin; e < emax; e++) {
    for (let m = 1; m <= 9; m++) el('line', { x1: X(xmin), x2: X(xmax), y1: Y(m * Math.pow(10, e)), y2: Y(m * Math.pow(10, e)), class: m === 1 ? 'gl-major' : 'gl' }, g);
  }
  el('line', { x1: X(xmin), x2: X(xmax), y1: Y(Math.pow(10, emax)), y2: Y(Math.pow(10, emax)), class: 'gl-major' }, g);
  const xlab = (xmax - xmin) <= 12 ? 1 : 2;
  for (let x = Math.ceil(xmin); x <= xmax; x++) el('line', { x1: X(x), x2: X(x), y1: Y(Math.pow(10, emax)), y2: Y(Math.pow(10, emin)), class: 'gl' }, g);
  el('line', { x1: X(xmin), x2: X(xmax), y1: Y(Math.pow(10, emin)), y2: Y(Math.pow(10, emin)), class: 'axis' }, g);
  el('line', { x1: X(xmin), x2: X(xmin), y1: Y(Math.pow(10, emax)), y2: Y(Math.pow(10, emin)), class: 'axis' }, g);
  for (let x = Math.ceil(xmin); x <= xmax; x += xlab) el('text', { x: X(x), y: Y(Math.pow(10, emin)) + 16, class: 'tick', 'text-anchor': 'middle' }, g).textContent = x;
  for (let e = emin; e <= emax; e++) el('text', { x: X(xmin) - 6, y: Y(Math.pow(10, e)) + 4, class: 'tick', 'text-anchor': 'end' }, g).textContent = logValue(1, e).toLocaleString('en-US');
  el('text', { x: X(xmax) - 2, y: Y(Math.pow(10, emin)) - 6, class: 'tick axis-name', 'text-anchor': 'end' }, g).textContent = 'x';
  el('text', { x: X(xmin) + 6, y: 14, class: 'tick axis-name' }, g).textContent = 'y (log scale)';

  // all snap values, sorted by position
  const snapsY = [];
  for (let e = emin; e < emax; e++) for (const m of mantissas) snapsY.push(logValue(m, e));
  snapsY.push(logValue(1, emax));
  snapsY.sort((a, b) => a - b);

  const ptsLayer = el('g', {}, svg);
  const points = [];
  let locked = false;
  const info = document.createElement('div'); info.className = 'grid-info';
  const controls = document.createElement('div'); controls.className = 'grid-controls';
  controls.innerHTML = `<button type="button" class="key" data-act="undo">Undo</button><button type="button" class="key" data-act="clear">Clear</button>`;
  root.appendChild(controls); root.appendChild(info);
  function redraw() {
    ptsLayer.innerHTML = '';
    for (const p of points) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-student' }, ptsLayer);
    info.textContent = points.length ? `Points placed: ${points.length}. Click a point again to remove it.` : 'Click to place points. They snap to the nearest x step and the nearest marked value on the scale.';
  }
  redraw();
  function toMath(evt) {
    const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = +(Math.round((xmin + (p.x - M) / ux) / xsnap) * xsnap).toFixed(4);
    if (x < xmin || x > xmax) return null;
    const ly = emax - (p.y - 20) / decadeH;
    if (ly < emin - 0.05 || ly > emax + 0.05) return null;
    let best = snapsY[0];
    for (const v of snapsY) if (Math.abs(Math.log10(v) - ly) < Math.abs(Math.log10(best) - ly)) best = v;
    return { x, y: best };
  }
  const ghost = el('circle', { r: 5, class: 'pt-ghost', visibility: 'hidden' }, svg);
  svg.addEventListener('pointermove', e => {
    if (locked) return;
    const p = toMath(e);
    if (!p) return ghost.setAttribute('visibility', 'hidden');
    ghost.setAttribute('cx', X(p.x)); ghost.setAttribute('cy', Y(p.y)); ghost.setAttribute('visibility', 'visible');
  });
  svg.addEventListener('pointerleave', () => ghost.setAttribute('visibility', 'hidden'));
  svg.addEventListener('click', e => {
    if (locked) return;
    const p = toMath(e); if (!p) return;
    const i = points.findIndex(q => q.x === p.x && q.y === p.y);
    if (i >= 0) points.splice(i, 1); else if (points.length < maxPoints) points.push(p);
    redraw();
  });
  controls.addEventListener('click', e => {
    if (locked) return;
    if (e.target.dataset.act === 'undo') points.pop();
    if (e.target.dataset.act === 'clear') points.length = 0;
    redraw();
  });
  function reveal({ correct }) {
    locked = true; root.classList.add('locked');
    ptsLayer.innerHTML = '';
    const key = p => `${p.x},${p.y}`;
    const want = new Set(correct.map(key)), have = new Set(points.map(key));
    for (const p of correct) {
      if (!have.has(key(p))) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-missed' }, ptsLayer);
      el('text', { x: X(p.x) + 9, y: Y(p.y) - 8, class: 'pt-label' }, ptsLayer).textContent = `(${p.x}, ${p.y.toLocaleString('en-US')})`;
    }
    for (const p of points) {
      if (want.has(key(p))) el('circle', { cx: X(p.x), cy: Y(p.y), r: 6, class: 'pt-right' }, ptsLayer);
      else { const s = 6, cx = X(p.x), cy = Y(p.y); el('path', { d: `M${cx - s},${cy - s}L${cx + s},${cy + s}M${cx - s},${cy + s}L${cx + s},${cy - s}`, class: 'pt-wrong' }, ptsLayer); }
    }
    info.innerHTML = '<span class="legend"><i class="lg-right"></i> correct point &nbsp; <i class="lg-wrong">✕</i> incorrect point &nbsp; <i class="lg-missed"></i> point you missed</span>';
  }
  return { root, getPoints: () => points.slice(), lock: () => { locked = true; }, reveal };
}
