/**
 * Custom Heart Cursor with Trail Particle Pooling (desktop only)
 * Uses object pool pattern to prevent unbounded DOM growth
 */

import { isMobile, $ } from './utils.js';

class CursorManager {
  constructor() {
    if (isMobile) return;

    this.cursorEl = $('custom-cursor');
    this.trailTimer = null;
    this.TRAIL_POOL_SIZE = 30;
    this.trailColors = ['#f9a8d4', '#93c5fd', '#c4b5fd', '#fbbf24', '#6ee7b7'];

    document.body.classList.add('custom-cursor-active');
    this.initTrailPool();
    this.setupEventListeners();
  }

  initTrailPool() {
    // Pre-allocate and recycle trail nodes
    this.trailPool = Array.from({ length: this.TRAIL_POOL_SIZE }, () => {
      const n = document.createElement('div');
      n.className = 'cursor-trail';
      n.style.display = 'none';
      document.body.appendChild(n);
      return { el: n, free: true };
    });
  }

  acquireTrail() {
    return this.trailPool.find((p) => p.free) || null;
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      this.cursorEl.style.left = e.clientX + 'px';
      this.cursorEl.style.top = e.clientY + 'px';

      // Throttle: one trail particle every 30ms
      if (!this.trailTimer) {
        this.trailTimer = setTimeout(() => {
          this.trailTimer = null;
          const slot = this.acquireTrail();
          if (!slot) return; // pool exhausted

          slot.free = false;
          const sz = 4 + Math.random() * 5;
          slot.el.style.cssText =
            `display:block;left:${e.clientX}px;top:${e.clientY}px;` +
            `width:${sz}px;height:${sz}px;` +
            `background:${this.trailColors[Math.floor(Math.random() * this.trailColors.length)]};` +
            `transform:translate(-50%,-50%);`;

          // Force reflow to retrigger animation
          slot.el.style.animation = 'none';
          void slot.el.offsetWidth;
          slot.el.style.animation = '';

          setTimeout(() => {
            slot.el.style.display = 'none';
            slot.free = true; // return to pool
          }, 600);
        }, 30);
      }
    });
  }

  cleanup() {
    if (this.trailTimer) clearTimeout(this.trailTimer);
  }
}

export const cursorManager = new CursorManager();
