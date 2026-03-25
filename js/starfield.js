/**
 * Interactive Starfield with Cursor Magnetic Attraction (Midnight Mode)
 * Uses requestAnimationFrame for smooth animation
 */

import { isMobile, $ } from './utils.js';

class Starfield {
  constructor() {
    this.sfCv = $('starfield');
    this.sfCtx = this.sfCv.getContext('2d');
    this.sgCv = $('star-glow-canvas');
    this.sgCtx = this.sgCv.getContext('2d');

    this.sfMouseX = -9999;
    this.sfMouseY = -9999;
    this.midnightMode = false;

    this.stars = Array.from({ length: isMobile ? 70 : 130 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      ox: 0, // original position
      oy: 0,
      r: Math.random() * 2.2 + 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.007,
      glowR: 0, // extra glow from cursor proximity
    }));

    // Store original positions
    this.stars.forEach((s) => {
      s.ox = s.x;
      s.oy = s.y;
    });

    this.stopped = false;
    this.setupEventListeners();
    this.handleResize();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('mousemove', (e) => {
      this.sfMouseX = e.clientX;
      this.sfMouseY = e.clientY;
    });
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches[0]) {
          this.sfMouseX = e.touches[0].clientX;
          this.sfMouseY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );
  }

  handleResize() {
    this.sfCv.width = innerWidth;
    this.sfCv.height = innerHeight;
    this.sgCv.width = innerWidth;
    this.sgCv.height = innerHeight;
  }

  setMidnightMode(active) {
    this.midnightMode = active;
  }

  draw(ts) {
    this.sfCtx.clearRect(0, 0, this.sfCv.width, this.sfCv.height);
    this.sgCtx.clearRect(0, 0, this.sgCv.width, this.sgCv.height);

    this.stars.forEach((s) => {
      // Base twinkle alpha
      const a = 0.07 + 0.28 * (0.5 + 0.5 * Math.sin(ts * s.speed + s.phase));

      // Cursor proximity effect (only in midnight mode)
      if (this.midnightMode) {
        const dx = this.sfMouseX - s.x;
        const dy = this.sfMouseY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proxRadius = isMobile ? 80 : 120;

        if (dist < proxRadius) {
          const force = 1 - dist / proxRadius;
          // Magnetic attraction
          s.x += (this.sfMouseX - s.x) * 0.04 * force;
          s.y += (this.sfMouseY - s.y) * 0.04 * force;
          s.glowR = force * (isMobile ? 14 : 20);

          // Draw glow halo
          const grd = this.sgCtx.createRadialGradient(
            s.x,
            s.y,
            0,
            s.x,
            s.y,
            s.glowR * 2.5
          );
          grd.addColorStop(0, `rgba(147,210,255,${force * 0.55})`);
          grd.addColorStop(1, 'rgba(147,210,255,0)');
          this.sgCtx.beginPath();
          this.sgCtx.arc(s.x, s.y, s.glowR * 2.5, 0, Math.PI * 2);
          this.sgCtx.fillStyle = grd;
          this.sgCtx.fill();
        } else {
          // Drift back to original position
          s.x += (s.ox - s.x) * 0.03;
          s.y += (s.oy - s.y) * 0.03;
          s.glowR = Math.max(0, s.glowR - 0.5);
        }
      }

      // Draw star
      this.sfCtx.beginPath();
      this.sfCtx.arc(s.x, s.y, s.r + (s.glowR > 0 ? s.glowR * 0.1 : 0), 0, Math.PI * 2);
      const col = this.midnightMode
        ? `rgba(180,220,255,${Math.min(1, a + s.glowR * 0.04)})`
        : `rgba(59,130,246,${a})`;
      this.sfCtx.fillStyle = col;
      this.sfCtx.fill();
    });

    if (!this.stopped) requestAnimationFrame((t) => this.draw(t));
  }

  start() {
    this.stopped = false;
    requestAnimationFrame((t) => this.draw(t));
  }

  stop() {
    this.stopped = true;
  }
}

export const starfield = new Starfield();
starfield.start();
