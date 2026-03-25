/**
 * Rose Garden — 100 White Roses with Watering Interaction
 * Uses spatial hashing for optimized collision detection (O(n) instead of O(n²))
 */

import { isMobile, haptic, $ } from './utils.js';

class Garden {
  constructor() {
    this.gCv = $('gardenCanvas');
    this.gCtx = this.gCv.getContext('2d');
    this.gWrap = $('gardenWrap');
    this.wCan = $('wateringCan');

    this.TOTAL = 100;
    this.COLS = 10;
    this.ROWS = 10;
    this.MAX_DROPS = isMobile ? 20 : 40;
    this.MAX_SPLASHES = 100;

    this.roses = [];
    this.drops = [];
    this.splashes = [];

    this.isWatering = false;
    this.curX = 0;
    this.curY = 0;
    this.gRect = null;
    this.allBloomed = false;
    this.inited = false;
    this.dropTimer = 0;
    this.bloomedCount = 0;
    this.stopped = false;

    // Spatial hash grid for collision detection
    this.spatialGrid = new Map();
    this.gridCellSize = isMobile ? 30 : 40;
  }

  init() {
    if (this.inited) return;
    this.inited = true;

    this.buildIndicators();
    const W = this.gWrap.offsetWidth;
    const H = Math.round(W * (isMobile ? 0.65 : 0.52));
    this.gCv.width = W;
    this.gCv.height = H;
    this.gRect = this.gCv.getBoundingClientRect();

    const padX = W * 0.05;
    const padY = H * 0.06;
    const usW = W - padX * 2;
    const usH = H - padY - H * 0.2;
    const cStep = usW / (this.COLS - 1);
    const rStep = usH / (this.ROWS - 1);
    const groundY = H - H * 0.08;

    this.roses = [];
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        this.roses.push({
          x: padX + col * cStep + (Math.random() - 0.5) * cStep * 0.3,
          y: groundY - row * rStep + (Math.random() - 0.5) * rStep * 0.15,
          growth: 0,
          growing: false,
          bloomed: false,
          sparkled: false,
          growSpeed: 0.006 + Math.random() * 0.005,
          maxH: 20 + row * 3.5 + Math.random() * 4,
        });
      }
    }

    this.setupInput();
    this.wCan.style.display = 'block';
    this.loop();
  }

  setupInput() {
    this.gWrap.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') this.wCan.style.opacity = '1';
    });

    this.gWrap.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.isWatering = false;
        this.wCan.style.opacity = '0';
      }
    });

    this.gWrap.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        this.gWrap.setPointerCapture(e.pointerId);
        this.isWatering = true;
        this.curX = e.clientX;
        this.curY = e.clientY;
        this.posCan(e.clientX, e.clientY);
        if (e.pointerType !== 'mouse') this.wCan.style.opacity = '1';
        haptic(15);
      },
      { passive: false }
    );

    this.gWrap.addEventListener('pointermove', (e) => {
      this.curX = e.clientX;
      this.curY = e.clientY;
      this.posCan(e.clientX, e.clientY);
    });

    this.gWrap.addEventListener('pointerup', () => {
      this.isWatering = false;
    });

    this.gWrap.addEventListener('pointercancel', () => {
      this.isWatering = false;
    });

    window.addEventListener(
      'resize',
      () => this.handleResize(),
      { once: false }
    );
  }

  handleResize() {
    if (!this.inited) return;
    const W = this.gWrap.offsetWidth;
    const H = Math.round(W * (isMobile ? 0.65 : 0.52));
    this.gCv.width = W;
    this.gCv.height = H;
    this.gRect = this.gCv.getBoundingClientRect();
  }

  posCan(cx, cy) {
    this.wCan.style.left = cx - 66 + 'px';
    this.wCan.style.top = cy - 40 + 'px';
  }

  toGCanvas(sx, sy) {
    this.gRect = this.gCv.getBoundingClientRect();
    return {
      x: ((sx - this.gRect.left) * this.gCv.width) / this.gRect.width,
      y: ((sy - this.gRect.top) * this.gCv.height) / this.gRect.height,
    };
  }

  // Spatial hash grid functions
  getGridCell(x, y) {
    const cellX = Math.floor(x / this.gridCellSize);
    const cellY = Math.floor(y / this.gridCellSize);
    return `${cellX},${cellY}`;
  }

  addToGrid(obj, x, y) {
    const cell = this.getGridCell(x, y);
    if (!this.spatialGrid.has(cell)) {
      this.spatialGrid.set(cell, []);
    }
    this.spatialGrid.get(cell).push(obj);
  }

  getNearbyRoses(x, y) {
    const nearby = [];
    const radius = 20;
    const cellX = Math.floor(x / this.gridCellSize);
    const cellY = Math.floor(y / this.gridCellSize);

    for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
      for (let cy = cellY - 1; cy <= cellY + 1; cy++) {
        const cell = `${cx},${cy}`;
        if (this.spatialGrid.has(cell)) {
          nearby.push(...this.spatialGrid.get(cell));
        }
      }
    }
    return nearby;
  }

  spawnDrop() {
    if (this.drops.length >= this.MAX_DROPS) return;
    const p = this.toGCanvas(this.curX, this.curY);
    for (let i = 0; i < (isMobile ? 2 : 3); i++) {
      this.drops.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y - 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.4 + Math.random() * 1.5,
        r: 2 + Math.random() * 1.5,
        alpha: 0.88,
        alive: true,
      });
    }
  }

  addSplash(x, y) {
    if (this.splashes.length >= this.MAX_SPLASHES) return;
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.7 + Math.random() * 1.5;
      this.splashes.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        alpha: 0.7,
        r: 1 + Math.random() * 1.5,
        alive: true,
      });
    }
  }

  updateDrops(groundY) {
    this.drops = this.drops.filter((d) => {
      if (!d.alive) return false;

      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.18;

      // Use spatial hash for collision detection (optimized O(n) instead of O(n²))
      const nearby = this.getNearbyRoses(d.x, d.y);
      nearby.forEach((r) => {
        if (
          !r.growing &&
          d.alive &&
          Math.hypot(d.x - r.x, d.y - r.y) < 16
        ) {
          r.growing = true;
          d.alive = false;
          this.addSplash(d.x, d.y);
        }
      });

      if (d.y > groundY + 8) {
        d.alive = false;
        this.addSplash(d.x, groundY);
        return false;
      }

      if (!d.alive) return false;

      this.gCtx.save();
      this.gCtx.globalAlpha = d.alpha;
      this.gCtx.fillStyle = 'rgba(96,165,250,0.85)';
      this.gCtx.beginPath();
      this.gCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      this.gCtx.fill();
      this.gCtx.fillStyle = 'rgba(219,234,254,0.7)';
      this.gCtx.beginPath();
      this.gCtx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
      this.gCtx.fill();
      this.gCtx.restore();

      return true;
    });
  }

  updateSplashes() {
    this.splashes = this.splashes.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.1;
      s.alpha -= 0.055;

      if (s.alpha <= 0) return false;

      this.gCtx.globalAlpha = s.alpha;
      this.gCtx.fillStyle = 'rgba(147,197,253,0.8)';
      this.gCtx.beginPath();
      this.gCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.gCtx.fill();
      this.gCtx.globalAlpha = 1;

      return true;
    });
  }

  drawRose(x, y, g, maxH, rObj) {
    const ctx = this.gCtx;
    if (g <= 0) {
      ctx.fillStyle = 'rgba(100,60,20,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const stemP = Math.min(g / 0.45, 1);
    const stemH = maxH * stemP;
    const leafP = Math.max(0, Math.min((g - 0.25) / 0.3, 1));
    const bloomP = Math.max(0, Math.min((g - 0.5) / 0.5, 1));
    const tx = x;
    const ty = y - stemH;

    // Stem
    ctx.save();
    ctx.strokeStyle = `rgba(34,197,94,${0.6 + 0.4 * stemP})`;
    ctx.lineWidth = Math.max(1, 1.6 * stemP);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 2, y - stemH * 0.35, x - 1.5, y - stemH * 0.68, tx, ty);
    ctx.stroke();
    ctx.restore();

    // Leaves
    if (leafP > 0) {
      const lw = 7 * leafP;
      const lh = 3 * leafP;
      ctx.save();
      ctx.translate(x - 1, y - stemH * 0.52);
      ctx.rotate(-0.65);
      ctx.fillStyle = `rgba(74,222,128,${0.8 * leafP})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, lw, lh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(x + 1.5, y - stemH * 0.38);
      ctx.rotate(0.55);
      ctx.fillStyle = `rgba(74,222,128,${0.7 * leafP})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, lw * 0.85, lh * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bloom petals
    if (bloomP > 0) {
      const pr = 3 + 8 * bloomP;

      ctx.save();
      ctx.fillStyle = `rgba(147,197,253,${0.12 * bloomP})`;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 2, pr * 0.9, pr * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer petals
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const sp = pr * 0.75 * bloomP;
        ctx.save();
        ctx.translate(tx + Math.cos(a) * sp, ty + Math.sin(a) * sp * 0.85);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = `rgba(255,255,255,${0.7 * bloomP})`;
        ctx.strokeStyle = `rgba(147,197,253,${0.4 * bloomP})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, pr * 0.65, pr * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Middle petals
      if (bloomP > 0.35) {
        const mp = (bloomP - 0.35) / 0.65;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const sp = pr * 0.38 * mp;
          ctx.save();
          ctx.translate(tx + Math.cos(a) * sp, ty + Math.sin(a) * sp * 0.85);
          ctx.rotate(a + Math.PI / 8);
          ctx.fillStyle = `rgba(255,255,255,${0.88 * mp})`;
          ctx.strokeStyle = `rgba(191,219,254,${0.3 * mp})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, pr * 0.48, pr * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Inner petals
      if (bloomP > 0.6) {
        const ip = (bloomP - 0.6) / 0.4;
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          const sp = pr * 0.18 * ip;
          ctx.save();
          ctx.translate(tx + Math.cos(a) * sp, ty + Math.sin(a) * sp * 0.7);
          ctx.rotate(a);
          ctx.fillStyle = `rgba(255,250,240,${0.95 * ip})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, pr * 0.32, pr * 0.26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Center stamen
      if (bloomP > 0.65) {
        const cp = (bloomP - 0.65) / 0.35;
        ctx.fillStyle = `rgba(254,243,199,${cp})`;
        ctx.beginPath();
        ctx.arc(tx, ty, pr * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(253,230,138,${cp})`;
        ctx.beginPath();
        ctx.arc(tx, ty, pr * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  buildIndicators() {
    const cont = $('indicators');
    cont.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('div');
      d.className = 'indicator';
      d.id = 'ind-' + i;
      d.innerHTML = this.roseIndSVG(false);
      cont.appendChild(d);
    }
    const sp = document.createElement('div');
    sp.className = 'ind-count';
    sp.id = 'indCount';
    sp.textContent = '0 / 100 🌹';
    cont.appendChild(sp);
  }

  roseIndSVG(lit) {
    const op = lit ? '1' : '0.22';
    return `<svg viewBox="0 0 28 34" width="22" height="28" xmlns="http://www.w3.org/2000/svg" style="opacity:${op}"><line x1="14" y1="33" x2="14" y2="19" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/><ellipse cx="10" cy="24" rx="5" ry="2.5" fill="#4ade80" transform="rotate(-35 10 24)" opacity="0.85"/><ellipse cx="18" cy="26" rx="4.5" ry="2" fill="#4ade80" transform="rotate(30 18 26)" opacity="0.7"/><circle cx="9" cy="14" r="5.5" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="19" cy="14" r="5.5" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="14" cy="9" r="5.5" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="9" cy="20" r="5" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="19" cy="20" r="5" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="14" cy="14" r="6" fill="white" stroke="#bfdbfe" stroke-width="0.8"/><circle cx="14" cy="14" r="2.8" fill="#fef3c7"/></svg>`;
  }

  updateIndicators(n) {
    if (n === this.bloomedCount) return;
    this.bloomedCount = n;
    const lit = Math.floor(n / 10);
    for (let i = 0; i < 10; i++) {
      const el = $('ind-' + i);
      if (!el || el.classList.contains('lit')) continue;
      if (i < lit) {
        el.classList.add('lit');
        el.innerHTML = this.roseIndSVG(true);
        haptic([20, 40]);
        const r = el.getBoundingClientRect();
        setTimeout(
          () => window.dispatchEvent(new CustomEvent('spawnSparkle', {
            detail: { x: r.left + 12, y: r.top + 15 }
          })),
          100
        );
      }
    }
    const cnt = $('indCount');
    if (cnt) cnt.textContent = n + ' / 100 🌹';
  }

  loop() {
    const W = this.gCv.width;
    const H = this.gCv.height;
    const groundY = H - H * 0.08;

    this.gCtx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = this.gCtx.createLinearGradient(0, 0, 0, H);
    const midnightMode = document.body.classList.contains('midnight');
    if (midnightMode) {
      sky.addColorStop(0, 'rgba(6,13,26,0.9)');
      sky.addColorStop(1, 'rgba(10,22,40,0.8)');
    } else {
      sky.addColorStop(0, 'rgba(219,234,254,0.6)');
      sky.addColorStop(1, 'rgba(186,230,253,0.4)');
    }
    this.gCtx.fillStyle = sky;
    this.gCtx.fillRect(0, 0, W, H);

    // Light rays
    for (let i = 0; i < 4; i++) {
      const rx = W * 0.1 + i * W * 0.27;
      const rg = this.gCtx.createRadialGradient(rx, 0, 0, rx, 0, H * 0.7);
      rg.addColorStop(0, 'rgba(255,255,255,0.05)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      this.gCtx.fillStyle = rg;
      this.gCtx.fillRect(0, 0, W, H);
    }

    // Ground
    const gr = this.gCtx.createLinearGradient(0, groundY, 0, H);
    if (midnightMode) {
      gr.addColorStop(0, 'rgba(60,40,20,0.5)');
      gr.addColorStop(1, 'rgba(40,25,10,0.7)');
    } else {
      gr.addColorStop(0, 'rgba(120,85,45,0.35)');
      gr.addColorStop(1, 'rgba(92,60,30,0.5)');
    }
    this.gCtx.fillStyle = gr;
    this.gCtx.fillRect(0, groundY, W, H - groundY);

    this.gCtx.strokeStyle = 'rgba(74,222,128,0.5)';
    this.gCtx.lineWidth = 1.5;
    this.gCtx.beginPath();
    this.gCtx.moveTo(0, groundY);
    this.gCtx.lineTo(W, groundY);
    this.gCtx.stroke();

    // Spawn drops when watering
    if (this.isWatering && !this.allBloomed) {
      this.dropTimer++;
      if (this.dropTimer % 3 === 0) this.spawnDrop();
    }

    // Update drops and splashes
    this.updateDrops(groundY);
    this.updateSplashes();

    // Rebuild spatial grid for this frame
    this.spatialGrid.clear();
    this.roses.forEach((r) => {
      this.addToGrid(r, r.x, r.y);
    });

    // Draw and update roses
    let nb = 0;
    [...this.roses]
      .sort((a, b) => a.y - b.y)
      .forEach((r) => {
        if (r.growing && r.growth < 1) {
          r.growth = Math.min(1, r.growth + r.growSpeed);
        }
        if (r.growth >= 1) r.bloomed = true;
        if (r.bloomed) nb++;
        this.drawRose(r.x, r.y, r.growth, r.maxH, r);
      });

    // Update bloom count and check for completion
    if (nb !== this.bloomedCount) {
      this.updateIndicators(nb);
      if (nb === this.TOTAL && !this.allBloomed) {
        this.allBloomed = true;
        window.dispatchEvent(new Event('allBloomed'));
      }
    }

    // Visual feedback while watering
    if (this.isWatering && !this.allBloomed) {
      const p = this.toGCanvas(this.curX, this.curY);
      this.gCtx.save();
      for (let i = 0; i < 3; i++) {
        this.gCtx.globalAlpha = 0.45 - i * 0.12;
        this.gCtx.fillStyle = 'rgba(96,165,250,0.6)';
        this.gCtx.beginPath();
        this.gCtx.arc(p.x + (Math.random() - 0.5) * 4, p.y - 8 + i * 5, 1.8 - i * 0.3, 0, Math.PI * 2);
        this.gCtx.fill();
      }
      this.gCtx.restore();
    }

    if (!this.stopped) requestAnimationFrame(() => this.loop());
  }

  start() {
    this.stopped = false;
    this.loop();
  }

  stop() {
    this.stopped = true;
  }
}

export const garden = new Garden();
