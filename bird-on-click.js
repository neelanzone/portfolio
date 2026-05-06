'use strict';

// ─── Sprite row / frame mapping ───────────────────────────────────────────────
const FLIGHT_ROWS = {
  glide:   { row: 0, colStart: 0, colEnd: 3 },
  flap:    { rowStart: 0, rowEnd: 3, cols: 4 },
  land:    { row: 3, colStart: 0, colEnd: 3 },
  takeoff: { row: 3, colStart: 0, colEnd: 3 },
};

function flightFrameToCell(frameIndex) {
  return { row: Math.floor(frameIndex / 4), col: frameIndex % 4 };
}

// idle-1-lookingaround-02.png: 4×3 grid (12 frames)
const IDLE01_GRID     = { cols: 4, rows: 3, frameW: 734, frameH: 736 };
const IDLE01_SEQUENCE = { cols: 4, totalFrames: 12, frameDur: 150 };

// idle-2-chatgpt.png: 4×4 grid (16 frames)
const IDLE02_GRID     = { cols: 4, rows: 4, frameW: 656, frameH: 656 };
const IDLE02_SEQUENCE = { cols: 4, totalFrames: 16, frameDur: 120 };

function lookFrameToCell(i) {
  return { row: Math.floor(i / IDLE01_SEQUENCE.cols), col: i % IDLE01_SEQUENCE.cols };
}
function peckFrameToCell(i) {
  return { row: Math.floor(i / IDLE02_SEQUENCE.cols), col: i % IDLE02_SEQUENCE.cols };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DISPLAY_SIZE   = 72;
const IDLE_SIZE_MIN  = 46;
const IDLE_SIZE_MAX  = 68;
const MAX_BIRDS      = 30;
const GLIDE_RADIUS   = 80;
const HOVER_RADIUS   = 55;
const BIRD_SPEED_MIN = 0.18;
const BIRD_SPEED_MAX = 0.38;
const MAX_DT         = 100;
const DEBUG          = false;

// ─── SpriteSheet ──────────────────────────────────────────────────────────────
class SpriteSheet {
  constructor(src, cols, rows, frameW, frameH) {
    this.cols   = cols;
    this.rows   = rows;
    this.frameW = frameW;
    this.frameH = frameH;
    this.ready  = false;
    this.image  = new Image();
    this._promise = new Promise(resolve => {
      this.image.onload  = () => { this.ready = true;  resolve(this); };
      this.image.onerror = () => { this.ready = false; resolve(this); };
    });
    this.image.src = src;
  }

  whenReady() { return this._promise; }

  drawFrame(ctx, col, row, x, y, size, facingLeft) {
    if (!this.ready) return;
    const sx   = col * this.frameW;
    const sy   = row * this.frameH;
    const half = size / 2;
    if (!facingLeft) {
      ctx.drawImage(this.image, sx, sy, this.frameW, this.frameH,
                    x - half, y - half, size, size);
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, sx, sy, this.frameW, this.frameH,
                    -half, -half, size, size);
      ctx.restore();
    }
  }
}

// ─── IdleProgram ──────────────────────────────────────────────────────────────
class IdleProgram {
  constructor() { this.regenerate(); }

  regenerate() {
    const len        = 3 + Math.floor(Math.random() * 4);
    this.sequence    = Array.from({ length: len }, () =>
                         Math.random() < 0.5 ? 'look' : 'peck');
    this.delays      = Array.from({ length: len }, () =>
                         600 + Math.random() * 2900);
    this.currentStep = 0;
    this.stepTimer   = this.delays[0];
    this._active     = false;
  }

  tick(dt) {
    if (!this._active) return null;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      const behavior = this.sequence[this.currentStep];
      this.currentStep++;
      if (this.currentStep >= this.sequence.length) {
        this.regenerate();
        this._active = true;
      } else {
        this.stepTimer = this.delays[this.currentStep];
      }
      return behavior;
    }
    return null;
  }

  onBehaviorComplete() {}
}

// ─── Bird ─────────────────────────────────────────────────────────────────────
let _birdIdSeq = 0;

class Bird {
  constructor(spawnX, spawnY, targetPerch, sheets, canvasEl, perchManager) {
    this.id          = _birdIdSeq++;
    this.x           = spawnX;
    this.y           = spawnY;
    this.targetPerch = targetPerch;
    this._sheets     = sheets;
    this._canvas     = canvasEl;
    this._pm         = perchManager;
    this.facingLeft  = false;
    this.dead        = false;
    this.state       = null;
    this.idleProgram = null;

    this._row        = 0;
    this._col        = 0;
    this._colStart   = 0;
    this._colEnd     = 0;
    this._frameDur   = 80;
    this._frameTimer = 0;
    this._loops      = true;
    this._multiRow   = false;
    this._flightFrame   = 0;
    this._isBehavior    = false;
    this._behaviorFrame = 0;
    this._behaviorTotal = 0;
    this._comingFromLand = false;

    this._idleSize  = IDLE_SIZE_MIN + Math.random() * (IDLE_SIZE_MAX - IDLE_SIZE_MIN);
    this._speed     = BIRD_SPEED_MIN + Math.random() * (BIRD_SPEED_MAX - BIRD_SPEED_MIN);
    this._bezArcLen = 1;
    this._bez       = null;
    this._t         = 0;
    this._tRate     = 0;

    this._initApproachBez(spawnX, spawnY, targetPerch.x, targetPerch.y);
    this._enterState('flap');
  }

  // ── Bézier ────────────────────────────────────────────────────────────────

  _bezPt(t) {
    const b = this._bez, u = 1 - t;
    return {
      x: u*u*u*b.p0.x + 3*u*u*t*b.p1.x + 3*u*t*t*b.p2.x + t*t*t*b.p3.x,
      y: u*u*u*b.p0.y + 3*u*u*t*b.p1.y + 3*u*t*t*b.p2.y + t*t*t*b.p3.y,
    };
  }

  _approxArcLen() {
    let len = 0, prev = this._bezPt(0);
    for (let i = 1; i <= 20; i++) {
      const pt = this._bezPt(i / 20);
      const dx = pt.x - prev.x, dy = pt.y - prev.y;
      len += Math.sqrt(dx * dx + dy * dy);
      prev = pt;
    }
    return Math.max(len, 1);
  }

  _initApproachBez(x0, y0, x1, y1) {
    const dx   = x1 - x0;
    const lift = Math.max(60, Math.abs(dx) * 0.35);
    this._bez = {
      p0: { x: x0,             y: y0        },
      p1: { x: x0 + dx * 0.25, y: y0 - lift },
      p2: { x: x1,             y: y1 - 40   },
      p3: { x: x1,             y: y1        },
    };
    this._t        = 0;
    this._bezArcLen = this._approxArcLen();
    this._tRate    = this._speed / this._bezArcLen;
  }

  _initExitBez() {
    const cw   = this._canvas.offsetWidth;
    const ch   = this._canvas.offsetHeight;
    const left = this.facingLeft;
    const ex   = left ? -90 : cw + 90;
    const ey   = 50 + Math.random() * ch * 0.40;
    const dx   = ex - this.x;
    const lift = Math.max(60, Math.abs(dx) * 0.35);
    this._bez = {
      p0: { x: this.x,             y: this.y        },
      p1: { x: this.x + dx * 0.25, y: this.y - lift },
      p2: { x: ex,                 y: ey - 40       },
      p3: { x: ex,                 y: ey            },
    };
    this._t        = 0;
    this._bezArcLen = this._approxArcLen();
    this._tRate    = this._speed / this._bezArcLen;
  }

  // ── FSM ───────────────────────────────────────────────────────────────────

  _enterState(state) {
    this.state       = state;
    this._frameTimer = 0;

    switch (state) {
      case 'flap': {
        this._multiRow    = true;
        this._flightFrame = 0;
        const fc = flightFrameToCell(0);
        this._row      = fc.row;
        this._col      = fc.col;
        this._frameDur = 1000 / 24;
        this._loops    = true;
        break;
      }
      case 'glide': {
        this._multiRow = false;
        this._row      = FLIGHT_ROWS.glide.row;
        this._colStart = FLIGHT_ROWS.glide.colStart;
        this._colEnd   = FLIGHT_ROWS.glide.colEnd;
        this._col      = this._colStart;
        this._frameDur = 200;
        this._loops    = true;
        this._tRate    = (this._speed * 0.6) / this._bezArcLen;
        break;
      }
      case 'land': {
        this._multiRow       = false;
        this._isBehavior     = false;
        this._row            = FLIGHT_ROWS.land.row;
        this._colStart       = FLIGHT_ROWS.land.colStart;
        this._colEnd         = FLIGHT_ROWS.land.colEnd;
        this._col            = this._colStart;
        this._frameDur       = 120;
        this._loops          = false;
        this._comingFromLand = true;
        if (this.targetPerch) { this.x = this.targetPerch.x; this.y = this.targetPerch.y; }
        break;
      }
      case 'idle': {
        this._isBehavior     = false;
        this._multiRow       = false;
        this._comingFromLand = false;
        this._row            = 0;
        this._col            = 0;
        this._colStart       = 0;
        this._colEnd         = 0;
        this._frameDur       = 600;
        this._loops          = true;
        if (!this.idleProgram) this.idleProgram = new IdleProgram();
        this.idleProgram._active = true;
        break;
      }
      case 'look': {
        this._isBehavior    = true;
        this._multiRow      = false;
        this._behaviorFrame = 0;
        this._behaviorTotal = IDLE01_SEQUENCE.totalFrames;
        this._frameDur      = IDLE01_SEQUENCE.frameDur;
        const lfc = lookFrameToCell(0);
        this._row = lfc.row;
        this._col = lfc.col;
        break;
      }
      case 'peck': {
        this._isBehavior    = true;
        this._multiRow      = false;
        this._behaviorFrame = 0;
        this._behaviorTotal = IDLE02_SEQUENCE.totalFrames;
        this._frameDur      = IDLE02_SEQUENCE.frameDur;
        const pfc = peckFrameToCell(0);
        this._row = pfc.row;
        this._col = pfc.col;
        break;
      }
      case 'takeoff': {
        this._multiRow = false;
        this._row      = FLIGHT_ROWS.takeoff.row;
        this._colStart = FLIGHT_ROWS.takeoff.colStart;
        this._colEnd   = FLIGHT_ROWS.takeoff.colEnd;
        this._col      = this._colStart;
        this._frameDur = 100;
        this._loops    = false;
        this.facingLeft = Math.random() < 0.5;
        if (this.targetPerch) {
          this._pm.releasePerch(this.targetPerch);
          this.targetPerch = null;
        }
        this.idleProgram = null;
        break;
      }
      case 'exit': {
        this._multiRow    = true;
        this._flightFrame = 0;
        const fc = flightFrameToCell(0);
        this._row      = fc.row;
        this._col      = fc.col;
        this._frameDur = 1000 / 24;
        this._loops    = true;
        this._initExitBez();
        break;
      }
    }
  }

  _transition() {
    const map  = { land: 'idle', takeoff: 'exit', look: 'idle', peck: 'idle' };
    const next = map[this.state];
    if (next) this._enterState(next);
  }

  triggerTakeoff() {
    if (this.state === 'idle' || this.state === 'look' || this.state === 'peck') {
      this._enterState('takeoff');
    }
  }

  // ── Per-frame ─────────────────────────────────────────────────────────────

  update(dt) {
    this._advanceFrame(dt);
    if (this.state === 'flap' || this.state === 'glide') {
      this._moveBez(dt);
      this._checkApproach();
    } else if (this.state === 'exit') {
      this._moveBez(dt);
      this._checkOffScreen();
    }
    if (this.state === 'idle' && this.idleProgram) {
      const behavior = this.idleProgram.tick(dt);
      if (behavior) this._enterState(behavior);
    }
  }

  _advanceFrame(dt) {
    this._frameTimer += dt;
    while (this._frameTimer >= this._frameDur) {
      this._frameTimer -= this._frameDur;

      if (this._isBehavior) {
        const next = this._behaviorFrame + 1;
        if (next >= this._behaviorTotal) {
          this._isBehavior = false;
          this._transition();
          return;
        }
        this._behaviorFrame = next;
        const fc = this.state === 'look' ? lookFrameToCell(next) : peckFrameToCell(next);
        this._row = fc.row;
        this._col = fc.col;
      } else if (this._multiRow) {
        this._flightFrame = (this._flightFrame + 1) % 16;
        const fc = flightFrameToCell(this._flightFrame);
        this._row = fc.row;
        this._col = fc.col;
      } else {
        if (this._col < this._colEnd) {
          this._col++;
        } else if (this._loops) {
          this._col = this._colStart;
        } else {
          this._transition();
          return;
        }
      }
    }
  }

  _moveBez(dt) {
    if (!this._bez) return;
    const tPrev = this._t;
    this._t     = Math.min(1, this._t + this._tRate * dt);
    const cur   = this._bezPt(this._t);
    const prev  = this._bezPt(tPrev);
    const dx    = cur.x - prev.x;
    if (Math.abs(dx) > 0.01) this.facingLeft = dx < 0;
    this.x = cur.x;
    this.y = cur.y;
  }

  _checkApproach() {
    if (!this.targetPerch) return;
    if (this.state === 'flap') {
      const dx = this.x - this.targetPerch.x;
      const dy = this.y - this.targetPerch.y;
      if (Math.sqrt(dx * dx + dy * dy) < GLIDE_RADIUS) this._enterState('glide');
    } else if (this.state === 'glide' && this._t >= 1.0) {
      this._enterState('land');
    }
  }

  _checkOffScreen() {
    const pad = DISPLAY_SIZE;
    const cw  = this._canvas.offsetWidth;
    const ch  = this._canvas.offsetHeight;
    if (this.x < -pad || this.x > cw + pad ||
        this.y < -pad || this.y > ch + pad) {
      this.dead = true;
    }
  }

  draw(ctx) {
    let sheet = this._sheets.flight;
    let size  = DISPLAY_SIZE;
    let drawY = this.y;
    if (this.state === 'idle' || this.state === 'look') {
      if (this._sheets.idle01.ready) { sheet = this._sheets.idle01; size = this._idleSize; }
      drawY = this.y - size / 2;
    } else if (this.state === 'peck') {
      if (this._sheets.idle02.ready) { sheet = this._sheets.idle02; size = this._idleSize; }
      drawY = this.y - size / 2;
    }
    sheet.drawFrame(ctx, this._col, this._row, this.x, drawY, size, this.facingLeft);
  }
}

// ─── HomepagePerchManager ─────────────────────────────────────────────────────
//
// Perch layout for the homepage:
//  - 5 perches along the top edge of .hero__headline-row ("Design is a little like")
//  - 1 perch at HOME (12 o'clock) on the sticker ring
//  - 5 scattered positions covering the rest of the viewport
//
// In DEBUG mode each perch gets an orange draggable handle; dragging one and
// releasing logs all positions so they can be hardcoded for breakpoints.

class HomepagePerchManager {
  constructor(maxBirds = MAX_BIRDS) {
    this.maxBirds      = maxBirds;
    this.perches       = [];
    this._debugHandles = [];
  }

  rebuild() {
    // Desktop positions hand-tuned at 1568×730. Mobile TODO — separate pass.
    const pts = [
      {x:613, y:376}, {x:688, y:375}, {x:738, y:377}, {x:830, y:373}, {x:870, y:372},
      {x:784, y:118},
      {x:763, y:546}, {x:959, y:378}, {x:931, y:374}, {x:538, y:546}, {x:991, y:548},
    ];
    this.perches = pts.map(p => ({ ...p, occupied: false, bird: null }));

    if (DEBUG) this._syncDebugHandles();
  }

  _syncDebugHandles() {
    this._debugHandles.forEach(h => h.remove());
    this._debugHandles = [];

    for (const p of this.perches) {
      const handle = document.createElement('div');
      handle.style.cssText = [
        'position:fixed',
        `left:${p.x - 8}px`,
        `top:${p.y - 8}px`,
        'width:16px',
        'height:16px',
        'border-radius:50%',
        'background:rgba(255,100,0,0.75)',
        'border:2px solid rgba(255,180,80,1)',
        'cursor:grab',
        'z-index:9999',
        'box-sizing:border-box',
        'pointer-events:auto',
        'transition:opacity 0.1s',
      ].join(';');

      let dragging = false;
      let offX = 0, offY = 0;

      handle.addEventListener('mousedown', e => {
        dragging = true;
        offX = e.clientX - p.x;
        offY = e.clientY - p.y;
        handle.style.cursor  = 'grabbing';
        handle.style.opacity = '0.5';
        e.stopPropagation();
        e.preventDefault();
      });

      const onMove = e => {
        if (!dragging) return;
        p.x = Math.round(e.clientX - offX);
        p.y = Math.round(e.clientY - offY);
        handle.style.left = (p.x - 8) + 'px';
        handle.style.top  = (p.y - 8) + 'px';
      };

      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        handle.style.cursor  = 'grab';
        handle.style.opacity = '1';
        this._logPerchPositions();
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);

      document.body.appendChild(handle);
      this._debugHandles.push(handle);
    }
  }

  _logPerchPositions() {
    console.log('%c[bird perches]', 'color:#ff6400;font-weight:bold',
      `${window.innerWidth}×${window.innerHeight}`,
      JSON.stringify(this.perches.map(p => ({ x: p.x, y: p.y }))));
  }

  getFreePerch() {
    const free = this.perches.filter(p => !p.occupied);
    return free.length ? free[(Math.random() * free.length) | 0] : null;
  }

  markOccupied(perch, bird) { perch.occupied = true;  perch.bird = bird; }
  releasePerch(perch)       { perch.occupied = false; perch.bird = null; }
  releaseAll()              { this.perches.forEach(p => { p.occupied = false; p.bird = null; }); }

  drawDebug(ctx) {
    ctx.save();
    ctx.lineWidth = 1.5;
    for (const p of this.perches) {
      ctx.strokeStyle = p.occupied ? '#e07320' : '#44bb55';
      ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y - 3);
      ctx.lineTo(p.x,     p.y + 5);
      ctx.lineTo(p.x + 5, p.y - 3);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Clicks on these elements don't spawn birds
const CLICK_BLOCK = 'button, a, input, select, details, summary, ' +
                    '.sticker-tag, [data-home-sidebar], .home-sidebar, ' +
                    '.navbar, .home-topbar';

// ─── BirdManager ──────────────────────────────────────────────────────────────
class BirdManager {
  constructor(canvas, perchManager, sheets) {
    this.canvas    = canvas;
    this.ctx       = canvas.getContext('2d');
    this._pm       = perchManager;
    this._sheets   = sheets;
    this.birds     = [];
    this.mouseX    = -9999;
    this.mouseY    = -9999;
    this._last     = null;
    this._rafId    = null;
    this._live     = false;
    this._enabled  = true;
  }

  flyAllAway() {
    for (const b of this.birds) b.triggerTakeoff();
  }

  setEnabled(enabled) {
    this._enabled = enabled;
  }

  start() {
    this._live = true;
    document.addEventListener('click', e => this._onClick(e));
    window.addEventListener('mousemove', e => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    requestAnimationFrame(ts => this._tick(ts));
  }

  stop() {
    this._live = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _tick(ts) {
    if (!this._live) return;
    const dt   = this._last === null ? 16 : Math.min(ts - this._last, MAX_DT);
    this._last = ts;
    this._update(dt);
    this._draw();
    this._rafId = requestAnimationFrame(t => this._tick(t));
  }

  _update(dt) {
    for (const b of this.birds) b.update(dt);

    for (const b of this.birds) {
      if (b.state === 'idle' || b.state === 'look' || b.state === 'peck') {
        if (!this._enabled) {
          b.triggerTakeoff();
          continue;
        }
        const dx = b.x - this.mouseX;
        const dy = b.y - this.mouseY;
        if (dx * dx + dy * dy < HOVER_RADIUS * HOVER_RADIUS) b.triggerTakeoff();
      }
    }

    this.birds = this.birds.filter(b => {
      if (b.dead) {
        if (b.targetPerch) this._pm.releasePerch(b.targetPerch);
        return false;
      }
      return true;
    });
  }

  _draw() {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    this.ctx.clearRect(0, 0, w, h);
    if (DEBUG) this._pm.drawDebug(this.ctx);
    for (const b of this.birds) b.draw(this.ctx);
  }

  _onClick(e) {
    if (!this._enabled) return;
    if (e.target.closest(CLICK_BLOCK)) return;
    if (this.birds.length >= MAX_BIRDS) return;
    const rect  = this.canvas.getBoundingClientRect();
    const x     = e.clientX - rect.left;
    const y     = e.clientY - rect.top;
    const perch = this._pm.getFreePerch();
    if (!perch) return;
    const bird = new Bird(x, y, perch, this._sheets, this.canvas, this._pm);
    this._pm.markOccupied(perch, bird);
    this.birds.push(bird);
  }
}

// ─── Canvas sizing ─────────────────────────────────────────────────────────────
function sizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w   = window.innerWidth;
  const h   = window.innerHeight;
  canvas.width        = w * dpr;
  canvas.height       = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'bird-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:50;';
  document.body.appendChild(canvas);

  // Wait two frames for sidebar and layout to settle before reading element rects
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  sizeCanvas(canvas);

  const base        = '/homepage/assets/bird/';
  const flightSheet = new SpriteSheet(base + 'flight-starling.png',
    4, 4, 666, 666);
  const idle01Sheet = new SpriteSheet(base + 'idle-looking.png',
    IDLE01_GRID.cols, IDLE01_GRID.rows, IDLE01_GRID.frameW, IDLE01_GRID.frameH);
  const idle02Sheet = new SpriteSheet(base + 'idle-pecking.png',
    IDLE02_GRID.cols, IDLE02_GRID.rows, IDLE02_GRID.frameW, IDLE02_GRID.frameH);

  await Promise.all([
    flightSheet.whenReady(),
    idle01Sheet.whenReady(),
    idle02Sheet.whenReady(),
  ]);

  const sheets = { flight: flightSheet, idle01: idle01Sheet, idle02: idle02Sheet };

  const pm = new HomepagePerchManager(MAX_BIRDS);
  pm.rebuild();

  const bm = new BirdManager(canvas, pm, sheets);
  bm.start();
  window._birdManager = bm;

  let _rt = null;
  window.addEventListener('resize', () => {
    clearTimeout(_rt);
    _rt = setTimeout(() => {
      for (const b of bm.birds) b.dead = true;
      bm.birds = [];
      pm.releaseAll();
      sizeCanvas(canvas);
      pm.rebuild();
    }, 150);
  });
});
