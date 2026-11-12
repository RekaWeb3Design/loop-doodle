/* Loop Doodle. MIT licence. https://github.com/RekaWeb3Design/loop-doodle */
(() => {
'use strict';
const STEPS = 32, ROWS = 15, LANE = 46;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const INSTS = [{id: 'keys', name: 'Keys'}, {id: 'bass', name: 'Bass'}, {id: 'lead', name: 'Lead'}, {id: 'pad', name: 'Pad'}, {id: 'bells', name: 'Bells'}];
const SCALES = {
  'Minor penta': [0, 3, 5, 7, 10], 'Major penta': [0, 2, 4, 7, 9], 'Minor': [0, 2, 3, 5, 7, 8, 10], 'Major': [0, 2, 4, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10], 'Blues': [0, 3, 5, 6, 7, 10], 'Japanese': [0, 1, 5, 7, 8],
};
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FOUR = 'x...x...x...x...';
const BEATS = [
  {id: 'none', name: 'No beat', bpm: null, swing: 0, lp: 16000, kit: 'punch', k: '', s: '', c: '', h: '', o: ''},
  {id: 'lofi', name: 'Lo-fi', bpm: 78, swing: .3, lp: 3600, kit: 'soft',
    k: 'x.....x...x.....' + 'x......x..x..x..', s: '....x.......x...' + '....x.......x..o', c: '', h: 'x.o.x.o.x.o.x.o.' + 'x.o.x.o.x.o.x.oo', o: ''},
  {id: 'boombap', name: 'Boom bap', bpm: 92, swing: .22, lp: 7000, kit: 'punch',
    k: 'x.........x.x...' + 'x..x......x.....', s: '....x.......x...', c: '', h: 'x.x.x.x.x.x.x.x.', o: '..............x.'},
  {id: 'house', name: 'House', bpm: 124, swing: .06, lp: 16000, kit: 'punch', k: FOUR, s: '', c: '....x.......x...', h: 'o.o.o.o.o.o.o.o.', o: '..x...x...x...x.'},
  {id: 'techno', name: 'Techno', bpm: 134, swing: 0, lp: 16000, kit: 'hard', k: FOUR, s: '', c: '....x.......x...', h: 'oooooooooooooooo', o: '..x...x...x...x.'},
  {id: 'trap', name: 'Trap', bpm: 140, swing: 0, lp: 16000, kit: '808',
    k: 'x......x..x.....' + 'x.....x....x.x..', s: '', c: '........x.......', h: 'x.x.x.xrx.x.x.x.' + 'x.x.xrx.x.x.rrrr', o: ''},
  {id: 'dnb', name: 'DnB', bpm: 172, swing: 0, lp: 16000, kit: 'punch',
    k: 'x.........x.....' + 'x.........x..x..', s: '....x..o.o..x...', c: '', h: 'x.x.x.x.x.x.x.x.', o: ''},
  {id: 'dembow', name: 'Dembow', bpm: 96, swing: 0, lp: 12000, kit: 'punch', k: FOUR, s: '...x..x....x..x.', c: '', h: 'o.o.o.o.o.o.o.o.', o: ''},
];
const KITS = {
  soft: {f0: 110, f1: 48, kd: .30, kg: .8, sg: .42, hg: .6}, punch: {f0: 165, f1: 46, kd: .32, kg: 1, sg: .55, hg: 1},
  hard: {f0: 210, f1: 50, kd: .24, kg: 1.1, sg: .55, hg: 1}, '808': {f0: 130, f1: 0, kd: .8, kg: 1, sg: .5, hg: .9},
};
const hit = (p, s) => (p ? p[s % p.length] : '.');
/* ---------- notes from lines ---------- */
function rowToMidi(row, cfg) {
  const sc = SCALES[cfg.scale];
  return 48 + cfg.root + sc[row % sc.length] + 12 * Math.floor(row / sc.length);
}
function compile(st) {
  const acc = Array.from({length: STEPS}, () => []), cross = Array.from({length: STEPS}, () => []);
  const p = st.pts;
  const put = (x, y) => acc[clamp(Math.floor(x * STEPS), 0, STEPS - 1)].push(y);
  if (p.length === 1) put(p[0][0], p[0][1]);
  let any = false;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * STEPS * 2));
    for (let k = 0; k <= n; k++) put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n);
    if (x0 === x1) continue;
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    for (let s = Math.max(0, Math.ceil(a * STEPS - .5)); s <= Math.min(STEPS - 1, Math.floor(b * STEPS - .5)); s++) {
      const cx = (s + .5) / STEPS;
      if (cx < a || cx > b) continue;
      cross[s].push(y0 + (y1 - y0) * (cx - x0) / (x1 - x0)); any = true;
    }
  }
  const toRow = (y) => clamp(Math.floor((1 - y) * ROWS), 0, ROWS - 1);
  const hi = [], lo = [];
  for (let s = 0; s < STEPS; s++) {
    hi[s] = lo[s] = null;
    if (any) {
      if (!cross[s].length) continue;
      const rows = cross[s].map(toRow), mx = Math.max(...rows), mn = Math.min(...rows);
      hi[s] = mx; if (mx - mn >= 2) lo[s] = mn;
    } else if (acc[s].length) hi[s] = toRow(acc[s].reduce((a, b) => a + b, 0) / acc[s].length);
  }
  const notes = [];
  for (const voice of [hi, lo]) {
    let cur = null;
    for (let s = 0; s < STEPS; s++) {
      if (voice[s] == null) { cur = null; continue; }
      if (cur && cur.row === voice[s]) cur.len++;
      else { cur = {step: s, row: voice[s], len: 1}; notes.push(cur); }
    }
  }
  st.notes = notes;
  return st;
}
const mk = (inst, pts) => compile({inst, pts});
const cloneStrokes = (a) => a.map((s) => mk(s.inst, s.pts.map((q) => q.slice())));

/* ---------- state ---------- */
const S = {strokes: [], inst: 'keys', tool: 'draw', beat: 'lofi', bpm: 78, bvol: 70, root: 0, scale: 'Minor penta'};
let history = [];
let playing = false, A = S;

function save() {
  try {
    localStorage.setItem('loopdoodle', JSON.stringify({...S, strokes: S.strokes.map((s) => ({inst: s.inst, pts: s.pts.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)])}))}));
  } catch (e) { /* storage is optional */ }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('loopdoodle') || 'null');
    if (!d || !Array.isArray(d.strokes)) return false;
    if (BEATS.some((b) => b.id === d.beat)) S.beat = d.beat;
    if (SCALES[d.scale]) S.scale = d.scale;
    if (INSTS.some((i) => i.id === d.inst)) S.inst = d.inst;
    S.bpm = clamp(+d.bpm || 78, 60, 180);
    S.bvol = clamp(d.bvol == null ? 70 : +d.bvol, 0, 100);
    S.root = clamp(+d.root || 0, 0, 11);
    S.strokes = d.strokes.filter((s) => s && Array.isArray(s.pts) && s.pts.length && INSTS.some((i) => i.id === s.inst)).map(compile);
    return true;
  } catch (e) { return false; }
}

/* ---------- ready-made doodles ---------- */
function dens(pts, n = 6) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) for (let k = 1; k <= n; k++) out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k / n, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k / n]);
  return out;
}
function circ(cx, cy, rx, ry, n = 30) { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
function seed() {
  const out = [], mel = [];
  for (let i = 0; i <= 60; i++) { const x = .02 + .96 * i / 60; mel.push([x, .44 + .17 * Math.sin(x * Math.PI * 4) + .07 * Math.sin(x * Math.PI * 10)]); }
  out.push(mk('keys', mel));
  [[.01, .23, .9], [.26, .48, .83], [.51, .73, .9], [.76, .98, .77]].forEach(([a, b, y]) => out.push(mk('bass', [[a, y], [b, y]])));
  [[.13, .13], [.38, .2], [.63, .09], [.88, .24]].forEach(([x, y]) => out.push(mk('bells', [[x, y], [x + .012, y]])));
  return out;
}
const SHAPES = {
  House: () => [
    mk('keys', dens([[.34, .84], [.34, .5], [.66, .5], [.66, .84], [.34, .84]])),
    mk('lead', dens([[.29, .52], [.5, .16], [.71, .52]])),
    mk('bass', dens([[.46, .84], [.46, .64], [.54, .64], [.54, .84]])),
    mk('bells', circ(.86, .2, .05, .09, 20)),
    mk('pad', [[.03, .9], [.3, .9]]), mk('pad', [[.7, .93], [.97, .93]]),
  ],
  Flower: () => {
    const o = [];
    for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, r = .5 + .5 * Math.abs(Math.cos(3 * a)); o.push([.5 + .16 * r * Math.cos(a), .36 + .3 * r * Math.sin(a)]); }
    const stem = []; for (let i = 0; i <= 20; i++) { const t = i / 20; stem.push([.5 + .1 * t + .03 * Math.sin(t * 5), .62 + .32 * t]); }
    return [mk('lead', o), mk('keys', circ(.5, .36, .035, .065, 18)), mk('bass', stem),
      mk('bells', dens([[.56, .8], [.68, .7], [.72, .8], [.6, .86]])), mk('pad', [[.05, .95], [.45, .95]])];
  },
  Cat: () => {
    const tail = []; for (let i = 0; i <= 24; i++) { const t = i / 24; tail.push([.62 + .3 * t, .78 - .3 * t * t + .05 * Math.sin(t * 9)]); }
    return [mk('keys', circ(.44, .56, .15, .28, 36)),
      mk('lead', dens([[.32, .4], [.33, .1], [.41, .31]])), mk('lead', dens([[.47, .31], [.55, .1], [.56, .4]])),
      mk('bells', [[.1, .5], [.3, .56]]), mk('bells', [[.1, .68], [.3, .63]]),
      mk('bass', tail)];
  },
  Scribble: () => {
    const z = []; for (let i = 0; i <= 70; i++) z.push([.05 + .9 * i / 70 + .025 * Math.sin(i * 2.1), .45 + .3 * Math.sin(i * .9) * Math.cos(i * .23)]);
    return [mk('keys', z), mk('bass', [[.03, .9], [.45, .9]]), mk('bass', [[.53, .82], [.97, .82]])];
  },
};
function shuffle() {
  const out = [], R = Math.random;
  const curve = (inst, lo, hi) => {
    const pts = []; let y = lo + R() * (hi - lo), v = 0;
    const a = R() * .15, b = Math.min(.99, a + .5 + R() * .5);
    for (let i = 0; i <= 50; i++) { v = v * .82 + (R() - .5) * .07; y = clamp(y + v, lo, hi); pts.push([a + (b - a) * i / 50, y]); }
    out.push(mk(inst, pts));
  };
  curve(R() < .6 ? 'keys' : 'lead', .2, .68);
  const seg = R() < .5 ? 4 : 2;
  for (let i = 0; i < seg; i++) { if (R() < .15) continue; const y = .74 + Math.floor(R() * 4) * .066; out.push(mk('bass', [[i / seg + .01, y], [(i + 1) / seg - .02, y]])); }
  if (R() < .45) { const y = .34 + R() * .3; out.push(mk('pad', [[.02, y], [.48, y]])); const y2 = .34 + R() * .3; out.push(mk('pad', [[.52, y2], [.98, y2]])); }
  const n = 3 + Math.floor(R() * 4);
  for (let i = 0; i < n; i++) { const x = Math.floor(R() * 16) / 16 + .012, y = .05 + R() * .24; out.push(mk('bells', [[x, y], [x + .012, y]])); }
  return out;
}

/* ---------- audio ---------- */
let ctx, master, melBus, drumBus, drumLP, drumGain, delay, noiseBuf;
function ensureAudio() {
  if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = .004; comp.release.value = .18;
  master = ctx.createGain(); master.gain.value = .85;
  master.connect(comp); comp.connect(ctx.destination);
  melBus = ctx.createGain(); melBus.connect(master);
  const len = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  const rs = ctx.createGain(); rs.gain.value = .3; melBus.connect(rs); rs.connect(conv); conv.connect(master);
  delay = ctx.createDelay(1.5);
  const ds = ctx.createGain(); ds.gain.value = .17;
  const fb = ctx.createGain(); fb.gain.value = .34;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
  melBus.connect(ds); ds.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(master);
  drumBus = ctx.createGain();
  drumLP = ctx.createBiquadFilter(); drumLP.type = 'lowpass';
  drumGain = ctx.createGain();
  drumBus.connect(drumLP); drumLP.connect(drumGain); drumGain.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  applyMix();
}
function applyMix() {
  if (!ctx) return;
  const b = BEATS.find((x) => x.id === A.beat);
  drumLP.frequency.setTargetAtTime(b.lp, ctx.currentTime, .02);
  drumGain.gain.setTargetAtTime(Math.pow(A.bvol / 100, 1.5) * 1.1, ctx.currentTime, .02);
  delay.delayTime.setTargetAtTime(clamp(60 / A.bpm * .75, .05, 1.4), ctx.currentTime, .05);
}
function env(p, t, peak, a, sus, d, dur, r) {
  const sl = Math.max(peak * sus, .0001);
  p.setValueAtTime(.0001, t);
  p.exponentialRampToValueAtTime(peak, t + a);
  p.exponentialRampToValueAtTime(sl, t + a + d);
  const end = Math.max(t + dur, t + a + d + .001);
  p.setValueAtTime(sl, end);
  p.exponentialRampToValueAtTime(.0001, end + r);
  return end + r + .02;
}
function osc(type, f, t, det) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); return o; }
function playNote(inst, midi, t, dur) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const g = ctx.createGain(); g.connect(melBus);
  let stop, oscs = [];
  if (inst === 'keys') {
    const a = osc('triangle', f, t), b = osc('sine', f * 2, t), bg = ctx.createGain(); bg.gain.value = .22;
    a.connect(g); b.connect(bg); bg.connect(g); oscs = [a, b];
    stop = env(g.gain, t, .24, .006, .22, .38, dur, .5);
  } else if (inst === 'bass') {
    const a = osc('sawtooth', f / 2, t), b = osc('sine', f / 2, t), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(320, t + .22);
    a.connect(lp); b.connect(lp); lp.connect(g); oscs = [a, b];
    stop = env(g.gain, t, .3, .008, .6, .15, dur, .12);
  } else if (inst === 'lead') {
    const a = osc('square', f, t), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const l = osc('sine', 5.5, t), lg = ctx.createGain(); lg.gain.value = f * .006; l.connect(lg); lg.connect(a.frequency);
    a.connect(lp); lp.connect(g); oscs = [a, l];
    stop = env(g.gain, t, .1, .012, .7, .1, dur, .16);
  } else if (inst === 'pad') {
    const a = osc('sawtooth', f, t, -9), b = osc('sawtooth', f, t, 9), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
    a.connect(lp); b.connect(lp); lp.connect(g); oscs = [a, b];
    stop = env(g.gain, t, .085, .16, .8, .3, dur, .7);
  } else {
    const c = osc('sine', f * 2, t), m = osc('sine', f * 7, t), mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 5, t); mg.gain.exponentialRampToValueAtTime(1, t + .6);
    m.connect(mg); mg.connect(c.frequency); c.connect(g); oscs = [c, m];
    stop = env(g.gain, t, .15, .003, .04, 1.2, dur, .4);
  }
  oscs.forEach((o) => o.stop(stop));
  oscs[0].onended = () => g.disconnect();
}
function noise(t, dur) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(t, Math.random() * .5); n.stop(t + dur); return n; }
function kick(t, v, kit) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  const f1 = kit.f1 || 440 * Math.pow(2, (36 + A.root - 69) / 12);
  o.frequency.setValueAtTime(kit.f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + .09);
  g.gain.setValueAtTime(.95 * kit.kg * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + kit.kd);
  o.connect(g); g.connect(drumBus); o.start(t); o.stop(t + kit.kd + .02);
}
function snare(t, v, kit) {
  const n = noise(t, .22), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 1300;
  g.gain.setValueAtTime(kit.sg * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .17);
  n.connect(hp); hp.connect(g); g.connect(drumBus);
  const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle';
  o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
  og.gain.setValueAtTime(.4 * v, t); og.gain.exponentialRampToValueAtTime(.0001, t + .11);
  o.connect(og); og.connect(drumBus); o.start(t); o.stop(t + .13);
}
function clap(t, v) {
  const n = noise(t, .3), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .9;
  g.gain.setValueAtTime(.0001, t);
  [0, .011, .023].forEach((d) => { g.gain.setValueAtTime(.7 * v, t + d); g.gain.exponentialRampToValueAtTime(.12, t + d + .009); });
  g.gain.exponentialRampToValueAtTime(.0001, t + .24);
  n.connect(bp); bp.connect(g); g.connect(drumBus);
}
function hat(t, v, kit, open) {
  const d = open ? .26 : .045, n = noise(t, d + .02), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 7600;
  g.gain.setValueAtTime((open ? .15 : .19) * kit.hg * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  n.connect(hp); hp.connect(g); g.connect(drumBus);
}
const VEL = {x: 1, o: .42, r: .7};

/* ---------- transport (one thing plays at a time) ---------- */
let nextTime = 0, step = 0, timer = null;
const vis = [], fxQ = [], playBtns = [];
function scheduleStep(s, t0) {
  const b = BEATS.find((x) => x.id === A.beat), kit = KITS[b.kit], sd = 60 / A.bpm / 4;
  const t = t0 + (s % 2 ? b.swing * sd : 0);
  let c;
  if ((c = hit(b.k, s)) !== '.') kick(t, VEL[c], kit);
  if ((c = hit(b.s, s)) !== '.') snare(t, VEL[c], kit);
  if ((c = hit(b.c, s)) !== '.') clap(t, VEL[c]);
  if ((c = hit(b.h, s)) !== '.') { hat(t, VEL[c], kit, false); if (c === 'r') hat(t + sd / 2, .55, kit, false); }
  if ((c = hit(b.o, s)) !== '.') hat(t, VEL[c], kit, true);
  for (const st of A.strokes) for (const n of st.notes) if (n.step === s) {
    playNote(st.inst, rowToMidi(n.row, A), t, n.len * sd);
    fxQ.push({time: t, step: s, row: n.row, inst: st.inst});
  }
}
function tick() {
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + .05;
  while (nextTime < ctx.currentTime + .12) {
    const sd = 60 / A.bpm / 4;
    scheduleStep(step, nextTime);
    vis.push({step, time: nextTime, dur: sd});
    step = (step + 1) % STEPS; nextTime += sd;
  }
}
function syncPlay() {
  playBtns.forEach(({el, cfg, glyph}) => {
    const on = playing && A === cfg;
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (glyph) el.innerHTML = on ? '&#9632;' : '&#9654;'; else el.lastElementChild.textContent = on ? 'Stop' : 'Play';
  });
}
function stop() { playing = false; clearInterval(timer); timer = null; syncPlay(); }
function play(cfg) {
  if (playing) stop();
  ensureAudio(); A = cfg; applyMix();
  step = 0; vis.length = 0; fxQ.length = 0; nextTime = ctx.currentTime + .08;
  playing = true; tick(); timer = setInterval(tick, 25); syncPlay();
}
function regPlay(el, cfg, glyph, onToggle) {
  playBtns.push({el, cfg, glyph});
  el.onclick = () => { const on = playing && A === cfg; if (onToggle) onToggle(on); if (on) stop(); else play(cfg); };
}
function playPos() {
  if (!playing || !ctx) return null;
  const now = ctx.currentTime;
  while (vis.length > 1 && vis[1].time <= now) vis.shift();
  const v = vis[0];
  if (!v || v.time > now) return null;
  return {step: v.step, x: (v.step + clamp((now - v.time) / v.dur, 0, 1)) / STEPS};
}

/* ---------- pad: a canvas you draw on ---------- */
const css = getComputedStyle(document.documentElement);
const COL = {}; ['fg', 'muted', 'line', 'accent', 'keys', 'bass', 'lead', 'pad', 'bells'].forEach((k) => { COL[k] = css.getPropertyValue('--' + k).trim(); });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;
const PROMPTS = ['Scribble like a toddler', 'Draw a little house', 'Draw a flower', 'Check how it sounds', 'Draw a cat', 'Draw a rollercoaster', 'Sign your name', 'Draw a wobbly mountain'];
const PROMPT_MS = 3800;
let promptT0 = performance.now();
function alpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const pads = [];
class Pad {
  constructor(cv, cfg, o = {}) {
    this.cv = cv; this.g = cv.getContext('2d'); this.cfg = cfg; this.o = o;
    this.lane = o.lane == null ? LANE : o.lane; this.W = 0; this.H = 0; this.dpr = 1;
    this.live = null; this.ripples = []; this.down = false; this.lastRow = -1; this.erased = false;
    new ResizeObserver(() => this.resize()).observe(cv.parentElement);
    cv.addEventListener('pointerdown', (e) => this.pd(e));
    cv.addEventListener('pointermove', (e) => this.pm(e));
    cv.addEventListener('pointerup', () => this.pu()); cv.addEventListener('pointercancel', () => this.pu());
    pads.push(this);
  }
  resize() {
    const r = this.cv.parentElement.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5); this.W = r.width; this.H = r.height;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
  }
  get nh() { return this.H - this.lane; }
  norm(e) {
    const r = this.cv.getBoundingClientRect();
    return [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / (r.height - this.lane), 0, .999)];
  }
  blip(y) {
    const row = clamp(Math.floor((1 - y) * ROWS), 0, ROWS - 1);
    if (row === this.lastRow || !ctx) return;
    this.lastRow = row;
    playNote(this.cfg.inst, rowToMidi(row, this.cfg), ctx.currentTime + .005, .12);
  }
  eraseAt(x, y) {
    const nh = this.nh, W = this.W, px = x * W, py = y * nh, c = this.cfg;
    const keep = c.strokes.filter((st) => !st.pts.some(([a, b], i) => {
      if (Math.hypot(a * W - px, b * nh - py) < 16) return true;
      if (i === 0) return false;
      const [p, q] = st.pts[i - 1], ax = p * W, ay = q * nh, bx = a * W, by = b * nh;
      const l2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1, t = clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2, 0, 1);
      return Math.hypot(ax + (bx - ax) * t - px, ay + (by - ay) * t - py) < 16;
    }));
    if (keep.length !== c.strokes.length) { if (!this.erased) { if (this.o.before) this.o.before(); this.erased = true; } c.strokes = keep; }
  }
  pd(e) {
    if (e.button > 0) return;
    e.preventDefault(); ensureAudio();
    try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
    this.down = true; const [x, y] = this.norm(e);
    if (this.cfg.tool === 'erase') { this.erased = false; this.eraseAt(x, y); return; }
    this.lastRow = -1; this.live = compile({inst: this.cfg.inst, pts: [[x, y]]}); this.blip(y);
  }
  pm(e) {
    if (!this.down) return;
    const [x, y] = this.norm(e);
    if (this.cfg.tool === 'erase') { this.eraseAt(x, y); return; }
    if (!this.live) return;
    const l = this.live.pts[this.live.pts.length - 1];
    if (Math.hypot((x - l[0]) * this.W, (y - l[1]) * this.nh) < 2.5) return;
    this.live.pts.push([x, y]); compile(this.live); this.blip(y);
  }
  pu() {
    if (!this.down) return; this.down = false;
    const added = !!this.live;
    if (this.live) { if (this.o.before) this.o.before(); this.cfg.strokes.push(this.live); this.live = null; }
    if (this.o.after) this.o.after(added);
  }
  path(st) {
    const g = this.g, nh = this.nh, W = this.W, p = st.pts;
    g.beginPath(); g.moveTo(p[0][0] * W, p[0][1] * nh);
    if (p.length === 1) g.lineTo(p[0][0] * W + .01, p[0][1] * nh);
    for (let i = 1; i < p.length - 1; i++) g.quadraticCurveTo(p[i][0] * W, p[i][1] * nh, (p[i][0] + p[i + 1][0]) / 2 * W, (p[i][1] + p[i + 1][1]) / 2 * nh);
    if (p.length > 1) g.lineTo(p[p.length - 1][0] * W, p[p.length - 1][1] * nh);
  }
  draw() {
    const {g, W, H, cfg} = this;
    if (!W) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const nh = this.nh, cw = W / STEPS, rh = nh / ROWS, sc = SCALES[cfg.scale];
    const pos = playing && A === cfg ? playPos() : null;
    for (let r = 0; r < ROWS; r++) if (r % sc.length === 0) { g.fillStyle = alpha(COL.fg, .035); g.fillRect(0, (ROWS - 1 - r) * rh, W, rh); }
    g.lineWidth = 1;
    for (let r = 1; r < ROWS; r++) { g.strokeStyle = alpha(COL.fg, .045); g.beginPath(); g.moveTo(0, r * rh + .5); g.lineTo(W, r * rh + .5); g.stroke(); }
    for (let s = 1; s < STEPS; s++) {
      g.strokeStyle = alpha(COL.fg, s % 16 === 0 ? .3 : s % 4 === 0 ? .13 : .045);
      g.beginPath(); g.moveTo(Math.round(s * cw) + .5, 0); g.lineTo(Math.round(s * cw) + .5, nh); g.stroke();
    }
    const all = this.live ? cfg.strokes.concat([this.live]) : cfg.strokes;
    for (const st of all) for (const n of (st.notes || [])) {
      const on = pos && pos.step >= n.step && pos.step < n.step + n.len;
      g.fillStyle = alpha(COL[st.inst], on ? .5 : .15);
      g.beginPath(); g.roundRect(n.step * cw + 1.5, (ROWS - 1 - n.row) * rh + 2, Math.max(2, n.len * cw - 3), Math.max(2, rh - 4), Math.min(5, rh / 3)); g.fill();
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const st of all) {
      this.path(st);
      g.strokeStyle = alpha(COL[st.inst], .2); g.lineWidth = 11; g.stroke();
      g.strokeStyle = COL[st.inst]; g.lineWidth = 3.4; g.stroke();
    }
    if (!all.length) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (this.o.prompts) {
        const pt = performance.now() - promptT0, pi = Math.floor(pt / PROMPT_MS) % PROMPTS.length, ph = (pt % PROMPT_MS) / PROMPT_MS;
        const pa = Math.max(0, Math.min(1, ph / .16, (1 - ph) / .16));
        let fs = Math.min(34, W / 13);
        g.font = `800 ${fs}px Unbounded, "Arial Black", sans-serif`;
        const tw = g.measureText(PROMPTS[pi]).width;
        if (tw > W - 40) { fs *= (W - 40) / tw; g.font = `800 ${fs}px Unbounded, "Arial Black", sans-serif`; }
        g.fillStyle = alpha(COL.fg, .9 * pa); g.fillText(PROMPTS[pi], W / 2, nh / 2 - 14);
        g.font = '500 13px "Space Grotesk", system-ui, sans-serif'; g.fillStyle = COL.muted;
        g.fillText('Any scribble turns into a loop.', W / 2, nh / 2 + fs * .7 + 4, W - 32);
        g.fillText(COARSE ? 'It starts playing when you lift your finger.' : 'It starts when you hit play.', W / 2, nh / 2 + fs * .7 + 23, W - 32);
      } else {
        g.font = `800 ${Math.min(26, W / 14)}px Unbounded, "Arial Black", sans-serif`;
        g.fillStyle = alpha(COL.fg, .85); g.fillText('Draw something', W / 2, nh / 2);
      }
      g.textAlign = 'start'; g.textBaseline = 'alphabetic';
    }
    if (this.lane) {
      const b = BEATS.find((x) => x.id === cfg.beat), ly = nh, k = this.lane / LANE;
      g.fillStyle = alpha('#000000', .28); g.fillRect(0, ly, W, this.lane);
      g.strokeStyle = alpha(COL.fg, .14); g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly + .5); g.lineTo(W, ly + .5); g.stroke();
      const rows = [[b.h, b.o, COL.muted, 2.2], [b.s, b.c, COL.bells, 3.3], [b.k, '', COL.fg, 4.4]];
      for (let s = 0; s < STEPS; s++) {
        const cx = (s + .5) * cw, now = pos && pos.step === s;
        rows.forEach(([p1, p2, col, rad], i) => {
          const cy = ly + (10 + i * 13) * k, a = hit(p1, s), c2 = hit(p2, s);
          if (a === '.' && c2 === '.') { g.fillStyle = alpha(COL.fg, .07); g.fillRect(cx - .75, cy - .75, 1.5, 1.5); return; }
          const soft = a === 'o' && c2 === '.';
          g.fillStyle = now ? '#ffffff' : alpha(col, soft ? .45 : 1);
          g.beginPath(); g.arc(cx, cy, Math.min(rad * k * (soft ? .75 : 1) * (now ? 1.5 : 1), cw * .46), 0, 6.3); g.fill();
        });
      }
    }
    const pn = performance.now();
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i], k = (pn - r.t) / 480;
      if (k >= 1) { this.ripples.splice(i, 1); continue; }
      g.strokeStyle = alpha(r.c, 1 - k); g.lineWidth = 2.5 * (1 - k) + .5;
      g.beginPath(); g.arc(r.x * W, (ROWS - .5 - r.row) * rh, 5 + 30 * k, 0, 6.3); g.stroke();
    }
    if (pos) {
      const x = pos.x * W;
      g.fillStyle = alpha(COL.fg, .1); g.fillRect(x - 7, 0, 14, H);
      g.fillStyle = COL.fg; g.fillRect(x - 1, 0, 2, H);
    }
  }
}
function frame() {
  requestAnimationFrame(frame);
  if (ctx && fxQ.length) {
    const now = ctx.currentTime, ap = pads.find((p) => p.cfg === A);
    for (let i = fxQ.length - 1; i >= 0; i--) if (fxQ[i].time <= now) {
      const f = fxQ.splice(i, 1)[0];
      if (!reduce && ap) ap.ripples.push({x: (f.step + .5) / STEPS, row: f.row, c: COL[f.inst], t: performance.now()});
    }
  }
  pads.forEach((p) => p.draw());
}

/* ---------- app view ---------- */
const stage = $('stage');
let userStopped = false;
function pushHistory() { history.push(S.strokes.slice()); if (history.length > 60) history.shift(); syncTools(); }
new Pad($('pad'), S, {prompts: true, before: pushHistory, after: (added) => { if (added && COARSE && !(playing && A === S) && !userStopped) play(S); save(); }});
function syncTools() {
  $('tDraw').setAttribute('aria-pressed', S.tool === 'draw');
  $('tErase').setAttribute('aria-pressed', S.tool === 'erase');
  stage.classList.toggle('erasing', S.tool === 'erase');
  $('tUndo').disabled = !history.length; $('cUndo').disabled = !history.length;
  $('cErase').setAttribute('aria-pressed', S.tool === 'erase');
}
function syncAll() {
  document.querySelectorAll('#chips .chip, #dots .dot').forEach((c) => c.setAttribute('aria-pressed', c.dataset.id === S.inst));
  document.querySelectorAll('.beat').forEach((c) => c.setAttribute('aria-pressed', c.dataset.id === S.beat));
  $('bpm').value = S.bpm; $('bpmOut').textContent = S.bpm;
  $('bvol').value = S.bvol; $('bvolOut').textContent = S.bvol + '%';
  $('root').value = S.root; $('scale').value = S.scale;
  syncTools(); applyMix();
}
INSTS.forEach((i) => {
  const b = document.createElement('button');
  b.className = 'chip'; b.dataset.id = i.id; b.style.setProperty('--c', `var(--${i.id})`);
  b.innerHTML = `<i></i><span>${i.name}</span>`;
  b.onclick = () => { S.inst = i.id; S.tool = 'draw'; ensureAudio(); playNote(i.id, rowToMidi(7, S), ctx.currentTime + .01, .2); syncAll(); save(); };
  $('chips').appendChild(b);
  const d = document.createElement('button');
  d.className = 'dot'; d.dataset.id = i.id; d.style.setProperty('--c', `var(--${i.id})`); d.setAttribute('aria-label', i.name);
  d.onclick = b.onclick; $('dots').appendChild(d);
});
BEATS.forEach((bt) => {
  const b = document.createElement('button');
  b.className = 'beat'; b.dataset.id = bt.id;
  let mini = '';
  for (let s = 0; s < 16; s++) mini += `<u class="${hit(bt.k, s) !== '.' ? 'k' : (hit(bt.s, s) === 'x' || hit(bt.c, s) === 'x') ? 's' : ''}"></u>`;
  b.innerHTML = `<span class="n"><span>${bt.name}</span><small>${bt.bpm || ''}</small></span><span class="mini-p">${mini}</span>`;
  b.onclick = () => { S.beat = bt.id; if (bt.bpm) S.bpm = bt.bpm; syncAll(); save(); };
  $('beats').appendChild(b);
});
KEYS.forEach((k, i) => $('root').add(new Option(k, i)));
Object.keys(SCALES).forEach((k) => $('scale').add(new Option(k, k)));
$('root').onchange = (e) => { S.root = +e.target.value; save(); };
$('scale').onchange = (e) => { S.scale = e.target.value; save(); };
$('bpm').oninput = (e) => { S.bpm = +e.target.value; $('bpmOut').textContent = S.bpm; applyMix(); save(); };
$('bvol').oninput = (e) => { S.bvol = +e.target.value; $('bvolOut').textContent = S.bvol + '%'; applyMix(); save(); };
$('tDraw').onclick = () => { S.tool = 'draw'; syncTools(); };
$('tErase').onclick = () => { S.tool = 'erase'; syncTools(); };
$('tUndo').onclick = () => { if (history.length) { S.strokes = history.pop(); syncTools(); save(); } };
$('tClear').onclick = () => { if (S.strokes.length) { pushHistory(); S.strokes = []; promptT0 = performance.now(); save(); } };
$('tDice').onclick = () => { pushHistory(); S.strokes = shuffle(); save(); };
const noteStop = (wasOn) => { userStopped = wasOn; };
regPlay($('play'), S, false, noteStop); regPlay($('cPlay'), S, true, noteStop);
const setClean = (on) => { document.body.classList.toggle('clean', on); pads.forEach((p) => p.resize()); };
$('cUndo').onclick = () => $('tUndo').click();
$('cWipe').onclick = () => $('tClear').click();
$('cErase').onclick = () => { S.tool = S.tool === 'erase' ? 'draw' : 'erase'; syncTools(); };
$('cleanBtn').onclick = () => { if (S.strokes.length) { pushHistory(); S.strokes = []; promptT0 = performance.now(); save(); } setClean(true); };
$('cExit').onclick = () => setClean(false);
const setHelp = (on) => { $('sheet').hidden = !on; };
$('helpBtn').onclick = () => setHelp(true);
$('sheetX').onclick = $('sheetOk').onclick = () => setHelp(false);
$('sheet').onclick = (e) => { if (e.target === $('sheet')) setHelp(false); };
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { setHelp(false); setClean(false); return; }
  if (e.code !== 'Space' || e.repeat || !document.body.classList.contains('play')) return;
  const t = e.target.tagName;
  if (t === 'BUTTON' || t === 'SELECT' || t === 'INPUT' || t === 'A') return;
  e.preventDefault(); $('play').click();
});

/* ---------- landing ---------- */
// the guide text lives once, in the landing page HTML; the help sheet is filled from it
document.querySelectorAll('#guideCards .gc').forEach((c) => {
  const dt = document.createElement('dt'), dd = document.createElement('dd');
  dt.textContent = c.querySelector('h3').textContent; dt.style.setProperty('--c', c.style.getPropertyValue('--c')); dd.textContent = c.querySelector('p').textContent;
  $('guideList').append(dt, dd);
});
$('toGuide').onclick = () => $('guide').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
function openInApp(cfg) {
  pushHistory();
  S.strokes = cloneStrokes(cfg.strokes); S.beat = cfg.beat; S.bpm = cfg.bpm; S.root = cfg.root; S.scale = cfg.scale;
  userStopped = false; save(); syncAll(); location.hash = 'play';
}
// hero: free drawing
const HERO = {strokes: [], inst: 'keys', tool: 'draw', beat: 'lofi', bpm: 78, bvol: 70, root: 0, scale: 'Minor penta'};
{
  const m = []; for (let i = 0; i <= 50; i++) { const x = .04 + .92 * i / 50; m.push([x, .46 + .2 * Math.sin(x * Math.PI * 3.2) + .06 * Math.sin(x * 23)]); }
  HERO.strokes = [mk('keys', m), mk('bass', [[.03, .9], [.46, .9]]), mk('bass', [[.53, .8], [.97, .8]])];
}
new Pad($('heroPad'), HERO, {lane: 34, after: (added) => { if (added && !(playing && A === HERO)) play(HERO); }});
regPlay($('heroPlay'), HERO);
INSTS.forEach((i) => {
  const d = document.createElement('button');
  d.className = 'dot'; d.style.setProperty('--c', `var(--${i.id})`); d.setAttribute('aria-label', i.name); d.setAttribute('aria-pressed', i.id === HERO.inst);
  d.onclick = () => {
    HERO.inst = i.id; ensureAudio(); playNote(i.id, rowToMidi(7, HERO), ctx.currentTime + .01, .2);
    [...$('heroDots').children].forEach((x) => x.setAttribute('aria-pressed', x === d));
  };
  $('heroDots').appendChild(d);
});
$('heroClear').onclick = () => { HERO.strokes = []; };
$('heroOpen').onclick = () => openInApp(HERO);
// groove: preset doodles under different beats
const GROOVE = {strokes: SHAPES.House(), inst: 'keys', tool: 'draw', beat: 'house', bpm: 124, bvol: 72, root: 0, scale: 'Major penta'};
new Pad($('groovePad'), GROOVE, {lane: 34, after: (added) => { if (added && !(playing && A === GROOVE)) play(GROOVE); }});
regPlay($('groovePlay'), GROOVE);
const pillRow = (host, names, isOn, pick) => names.forEach((n) => {
  const b = document.createElement('button');
  b.className = 'pill'; b.textContent = n.label; b.setAttribute('aria-pressed', isOn(n));
  b.onclick = () => { pick(n); [...host.children].forEach((x) => x.setAttribute('aria-pressed', x === b)); if (playing && A === GROOVE) applyMix(); else play(GROOVE); };
  host.appendChild(b);
});
pillRow($('shapePills'), Object.keys(SHAPES).map((k) => ({label: k})), (n) => n.label === 'House', (n) => { GROOVE.strokes = SHAPES[n.label](); });
pillRow($('beatPills'), BEATS.filter((b) => b.bpm).map((b) => ({label: b.name, b})), (n) => n.b.id === GROOVE.beat, (n) => { GROOVE.beat = n.b.id; GROOVE.bpm = n.b.bpm; });
$('grooveOpen').onclick = () => openInApp(GROOVE);

/* ---------- views ---------- */
let view = null;
function route() {
  if (location.hash === '#legal') { location.replace('/privacy'); return; } // the privacy view moved to its own page
  const v = location.hash === '#play' ? 'play' : 'land';
  if (v === view) return;
  view = v; stop(); setClean(false); setHelp(false);
  ['play', 'land'].forEach((n) => document.body.classList.toggle(n, v === n));
  document.querySelector('.app').hidden = v !== 'play'; document.querySelector('.landing').hidden = v !== 'land';
  scrollTo(0, 0); pads.forEach((p) => p.resize());
}
addEventListener('hashchange', route);

if (!load()) S.strokes = seed();
syncAll(); route(); frame();

/* ---------- landing motion ---------- */
// Everything here is decoration. Hidden-until-seen states are only ever set from this block,
// movement is skipped under prefers-reduced-motion, and pointer effects need a fine pointer.
{
  const land = document.querySelector('.landing'), toTop = $('toTop');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const smooth = reduce ? 'auto' : 'smooth';
  // one requestAnimationFrame queue: event handlers only store numbers, all style writes happen here
  const jobs = new Set(); let raf = 0;
  const run = () => { raf = 0; [...jobs].forEach((fn) => { if (!fn()) jobs.delete(fn); }); if (jobs.size && !raf) raf = requestAnimationFrame(run); };
  const anim = (fn) => { jobs.add(fn); if (!raf) raf = requestAnimationFrame(run); };

  $('toContact').onclick = (e) => { e.preventDefault(); $('contact').scrollIntoView({behavior: smooth}); };
  toTop.onclick = () => scrollTo({top: 0, behavior: smooth});

  // heading squiggles
  land.querySelectorAll('.h2').forEach((h) => h.insertAdjacentHTML('beforeend', '<svg class="sq draw" width="180" height="14" viewBox="0 0 180 14" aria-hidden="true"><path pathLength="1" d="M3 8c9-8 15-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0 14-8 22 0 14 8 22 0 14-8 22 0 12 7 17 2"/></svg>'));

  // seen-once observer; if it never reports, everything it armed is released
  if (!reduce && 'IntersectionObserver' in window) {
    const todo = new Map(); let seen = false;
    const io = new IntersectionObserver((es) => {
      seen = true;
      es.forEach((e) => { if (e.isIntersecting) { const fn = todo.get(e.target); todo.delete(e.target); io.unobserve(e.target); if (fn) fn(); } });
    }, {rootMargin: '0px 0px -10% 0px'});
    const arm = (el, pre, fn) => { el.classList.add(pre); todo.set(el, fn); io.observe(el); };
    land.querySelectorAll('main > section:not(.hero)').forEach((el) => arm(el, 'rv', () => el.classList.add('in')));
    land.querySelectorAll('.draw').forEach((el) => arm(el, 'pre', () => el.classList.add('in')));
    land.querySelectorAll('.steps').forEach((el) => arm(el, 'pre', () => { el.classList.add('go'); setTimeout(() => el.classList.remove('pre', 'go'), 1400); }));
    setTimeout(() => { if (!seen) { io.disconnect(); todo.forEach((fn) => fn()); todo.clear(); } }, 1500);
  }

  // scroll: back-to-top visibility and a small drift on the background doodles
  const doodles = reduce ? [] : [...land.querySelectorAll('.bd')], drift = innerWidth < 700 ? 4 : 8;
  const cards = [];
  const onScroll = () => {
    const y = scrollY;
    toTop.classList.toggle('on', view !== 'play' && y > innerHeight * .9);
    cards.forEach((c) => { c.box = null; });
    if (view === 'land') doodles.forEach((d, i) => { d.style.transform = `translateY(${(Math.sin(y / 260 + i * 1.7) * drift).toFixed(1)}px) rotate(${(Math.sin(y / 340 + i) * 8).toFixed(1)}deg)`; });
    return false;
  };
  addEventListener('scroll', () => anim(onScroll), {passive: true});
  addEventListener('hashchange', () => anim(onScroll));
  onScroll();

  if (FINE && !reduce) {
    // guide cards: pointer-tracked tilt that eases back on leave
    land.querySelectorAll('.gc').forEach((el) => {
      const c = {box: null, k: 0, rx: 0, ry: 0, tk: 0, tx: 0, ty: 0}, rot = parseFloat(el.style.getPropertyValue('--rot')) || 0;
      cards.push(c);
      const job = () => {
        c.k += (c.tk - c.k) * .2; c.rx += (c.tx - c.rx) * .2; c.ry += (c.ty - c.ry) * .2;
        const done = Math.abs(c.tk - c.k) < .003 && Math.abs(c.tx - c.rx) < .03 && Math.abs(c.ty - c.ry) < .03;
        if (done && !c.tk) { c.k = c.rx = c.ry = 0; el.style.transform = ''; return false; }
        el.style.transform = `perspective(700px) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) translateY(${(-8 * c.k).toFixed(2)}px) scale(${(1 + .03 * c.k).toFixed(4)}) rotate(${(rot * (1 - c.k)).toFixed(2)}deg)`;
        return !done;
      };
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        if (!c.box) c.box = el.getBoundingClientRect();
        c.tk = 1;
        c.ty = clamp((e.clientX - c.box.left) / c.box.width - .5, -.5, .5) * 16;
        c.tx = clamp((e.clientY - c.box.top) / c.box.height - .5, -.5, .5) * -16;
        anim(job);
      });
      el.addEventListener('pointerleave', () => { c.tk = c.tx = c.ty = 0; c.box = null; anim(job); });
    });

    // buttons: a small magnetic pull toward the cursor
    land.querySelectorAll('.btn').forEach((el) => {
      let box = null, x = 0, y = 0;
      const job = () => { el.style.setProperty('--mx', x.toFixed(1) + 'px'); el.style.setProperty('--my', y.toFixed(1) + 'px'); return false; };
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        if (!box) box = el.getBoundingClientRect();
        x = clamp((e.clientX - box.left - box.width / 2) * .3, -6, 6);
        y = clamp((e.clientY - box.top - box.height / 2) * .3, -6, 6);
        anim(job);
      });
      el.addEventListener('pointerleave', () => { box = null; x = y = 0; anim(job); });
    });
  }
}
})();
