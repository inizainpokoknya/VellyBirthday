/**
 * Main Application Orchestrator
 * Coordinates all modules, animations, and state management
 */

import { isMobile, haptic, showToast, floatEm, $ } from './utils.js';
import { vinylPlayer } from './audio.js';
import { cursorManager } from './cursor.js';
import { starfield } from './starfield.js';
import { garden } from './garden.js';
import { envelope } from './envelope.js';

// ═══════════════════════════════════════
// PARALLAX BACKGROUND
// ═══════════════════════════════════════
class ParallaxManager {
  constructor() {
    this.layer1 = $('layer1');
    this.layer2 = $('layer2');
    this.layer3 = $('layer3');

    if (!isMobile) {
      this.setupMouseParallax();
    } else {
      this.setupDeviceOrientationParallax();
    }
  }

  setupMouseParallax() {
    document.addEventListener('mousemove', (e) => {
      const mx = e.clientX / innerWidth - 0.5;
      const my = e.clientY / innerHeight - 0.5;
      this.layer1.style.transform = `translate(${mx * -18}px,${my * -12}px)`;
      this.layer2.style.transform = `translate(${mx * -28}px,${my * -18}px)`;
      this.layer3.style.transform = `translate(${mx * -10}px,${my * -8}px)`;
    });
  }

  setupDeviceOrientationParallax() {
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta === null) return;
      const tx = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
      const ty = Math.max(-1, Math.min(1, ((e.beta || 0) - 30) / 30));
      this.layer1.style.transform = `translate(${tx * -14}px,${ty * -10}px)`;
      this.layer2.style.transform = `translate(${tx * -22}px,${ty * -16}px)`;
      this.layer3.style.transform = `translate(${tx * -8}px,${ty * -6}px)`;
    });
  }
}

// ═══════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════
class CountdownTimer {
  constructor() {
    this.now0 = new Date();
    this.target = new Date('2025-04-09T00:00:00');
    if (this.now0 >= this.target) {
      this.target = new Date('2026-04-09T00:00:00');
    }
    this.pad = (n) => String(n).padStart(2, '0');
    this.prevSec = -1;
    this.transitioned = false;
    this.countdownInterval = null;
  }

  start() {
    const tick = () => {
      const diff = this.target - new Date();
      if (diff <= 0) {
        if (!this.transitioned) {
          this.transitioned = true;
          clearInterval(this.countdownInterval);
          curtainTransition.start();
        }
        return;
      }

      const t = Math.floor(diff / 1000);
      $('cd-days').textContent = this.pad(Math.floor(t / 86400));
      $('cd-hours').textContent = this.pad(Math.floor((t % 86400) / 3600));
      $('cd-mins').textContent = this.pad(Math.floor((t % 3600) / 60));

      const s = t % 60;
      if (s !== this.prevSec) {
        $('cd-secs').textContent = this.pad(s);
        const el = $('cd-secs');
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 280);
        this.prevSec = s;
      }
    };

    tick();
    this.countdownInterval = setInterval(tick, 1000);
  }

  stop() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }
}

// ═══════════════════════════════════════
// CURTAIN TRANSITION (Countdown → Birthday)
// ═══════════════════════════════════════
class CurtainTransition {
  constructor() {
    this.curtain = $('curtain');
    this.label = $('curtain-label');
  }

  start() {
    haptic([50, 100, 50]);

    // Phase 1: Close curtain
    this.curtain.classList.add('closing');
    setTimeout(() => this.label.classList.add('show'), 350);

    // Phase 2: Swap pages
    setTimeout(() => {
      $('countdown-page').classList.remove('active');
      $('birthday-page').classList.add('active');

      // Phase 3: Open curtain
      this.curtain.classList.remove('closing');
      this.curtain.classList.add('opening');
      setTimeout(() => this.label.classList.remove('show'), 100);
      setTimeout(() => {
        this.curtain.classList.remove('opening');
        this.onBirthdayReveal();
      }, 700);
    }, 800);
  }

  onBirthdayReveal() {
    haptic([30, 50, 30, 50, 80]);
    vinylPlayer.startAudio();
    setTimeout(() => garden.init(), 350);
    setTimeout(() => launchConfetti(), 250);
    setTimeout(() => launchConfetti(), 3200);
    spawnFloaties();
    floatiesInterval = setInterval(spawnFloaties, 2800);
    setTimeout(() => startTypewriter(), 600);
  }
}

// ═══════════════════════════════════════
// 🌙 MOON EASTER EGG
// ═══════════════════════════════════════
class MoonEasterEgg {
  constructor() {
    this.clicks = 0;
    this.timer = null;
    this.midnightMode = false;

    const moonBtn = $('moonBtn');
    if (moonBtn) {
      moonBtn.addEventListener('click', () => this.click());
      moonBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.click();
      });
    }
  }

  click() {
    haptic([20, 30, 20]);
    this.clicks++;

    // Update indicator dots
    for (let i = 0; i < 3; i++) {
      $('mdot' + i).classList.toggle('active', i < this.clicks);
    }

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.clicks = 0;
      for (let i = 0; i < 3; i++) $('mdot' + i).classList.remove('active');
    }, 3000);

    if (this.clicks >= 3) {
      this.clicks = 0;
      for (let i = 0; i < 3; i++) $('mdot' + i).classList.remove('active');
      this.toggle();
    }
  }

  toggle() {
    this.midnightMode = !this.midnightMode;
    document.body.classList.toggle('midnight', this.midnightMode);
    starfield.setMidnightMode(this.midnightMode);
    haptic([40, 60, 40, 60, 40]);

    if (this.midnightMode) {
      showToast('🌙 midnight mode activated ✨');
      spawnSparkleAt(innerWidth / 2, innerHeight / 3);
    } else {
      showToast('☀️ sky mode activated 💙');
    }

    const st = $('celebSubText');
    if (st) st.style.color = this.midnightMode ? '#93c5fd' : '#1d4ed8';
  }
}

// ═══════════════════════════════════════
// ⌨️ TYPEWRITER EFFECT
// ═══════════════════════════════════════
const fullMessage = `today is ur day, vel 💙
u deserve all the happiness,
all the love, all the good things
this world has to offer 🌙

thank u for being u — the world is
so much better with u in it ✨`;

function startTypewriter() {
  const el = $('bdayMsg');
  el.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  cursor.textContent = '|';
  el.appendChild(cursor);

  let i = 0;
  const chars = [...fullMessage];

  const typeNext = () => {
    if (i >= chars.length) {
      setTimeout(() => (cursor.style.opacity = '0'), 1500);
      return;
    }

    const ch = chars[i++];
    if (ch === '\n') {
      el.insertBefore(document.createElement('br'), cursor);
    } else {
      const t = document.createTextNode(ch);
      el.insertBefore(t, cursor);
    }

    if (isMobile && i % 20 === 0) haptic(5);

    const delay =
      /[💙🌙✨]/u.test(ch) ? 80 : ch === '.' || ch === ',' ? 120 : 28 + Math.random() * 18;
    setTimeout(typeNext, delay);
  };

  setTimeout(typeNext, 300);
}

// ═══════════════════════════════════════
// 🎆 PARTICLES & EFFECTS
// ═══════════════════════════════════════
function launchConfetti(cx, cy) {
  const confColors = [
    '#60a5fa', '#93c5fd', '#bfdbfe', '#f9a8d4', '#c4b5fd',
    '#fbbf24', '#6ee7b7', '#fca5a5', '#fff'
  ];
  const n = isMobile ? 40 : 60;

  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      const sz = 7 + Math.random() * 10;
      const lx =
        cx != null
          ? cx + (Math.random() - 0.5) * 120 + 'px'
          : Math.random() * 100 + 'vw';
      const ty2 = cy != null ? cy + 'px' : '-14px';
      c.style.cssText =
        `left:${lx};top:${ty2};width:${sz}px;height:${sz}px;` +
        `background:${confColors[Math.floor(Math.random() * confColors.length)]};` +
        `border-radius:${Math.random() > 0.5 ? '50%' : '3px'};` +
        `--dur:${2 + Math.random() * 2.5}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }, i * 40);
  }
}

function spawnFloaties() {
  const n = isMobile ? 3 : 4;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const f = document.createElement('div');
      f.className = 'floatie';
      f.textContent = floatEm[Math.floor(Math.random() * floatEm.length)];
      f.style.cssText =
        `left:${5 + Math.random() * 90}vw;bottom:${5 + Math.random() * 25}vh;` +
        `font-size:${1.1 + Math.random() * 1.4}rem;--dur:${1.8 + Math.random() * 1.5}s;`;
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 3200);
    }, i * 200);
  }
}

function spawnSparkleAt(x, y) {
  const ems = ['✨', '🌟', '💫', '⭐', '🌸', '💙'];
  const n = isMobile ? 5 : 9;

  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle-burst';
    const angle = (i / n) * 360;
    const r = 30 + Math.random() * 60;
    s.style.cssText =
      `left:${x + Math.cos((angle * Math.PI) / 180) * r}px;` +
      `top:${y + Math.sin((angle * Math.PI) / 180) * r}px;` +
      `font-size:${0.8 + Math.random() * 1.2}rem;--dur:${0.8 + Math.random() * 0.6}s;`;
    s.textContent = ems[Math.floor(Math.random() * ems.length)];
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}

function spawnButterfly() {
  const butterflySVGs = [
    `<svg width="48" height="36" viewBox="0 0 48 36"><ellipse cx="12" cy="14" rx="11" ry="8" fill="rgba(96,165,250,0.85)" transform="rotate(-20 12 14)"/><ellipse cx="12" cy="22" rx="8" ry="5" fill="rgba(147,197,253,0.75)" transform="rotate(15 12 22)"/><ellipse cx="36" cy="14" rx="11" ry="8" fill="rgba(96,165,250,0.85)" transform="rotate(20 36 14)"/><ellipse cx="36" cy="22" rx="8" ry="5" fill="rgba(147,197,253,0.75)" transform="rotate(-15 36 22)"/><ellipse cx="24" cy="18" rx="2.5" ry="9" fill="#1d4ed8"/><line x1="24" y1="10" x2="20" y2="4" stroke="#1d4ed8" stroke-width="1" stroke-linecap="round"/><line x1="24" y1="10" x2="28" y2="4" stroke="#1d4ed8" stroke-width="1" stroke-linecap="round"/><circle cx="20" cy="4" r="1.5" fill="#60a5fa"/><circle cx="28" cy="4" r="1.5" fill="#60a5fa"/></svg>`,
    `<svg width="48" height="36" viewBox="0 0 48 36"><ellipse cx="12" cy="14" rx="11" ry="8" fill="rgba(249,168,212,0.85)" transform="rotate(-20 12 14)"/><ellipse cx="12" cy="22" rx="8" ry="5" fill="rgba(252,207,232,0.75)" transform="rotate(15 12 22)"/><ellipse cx="36" cy="14" rx="11" ry="8" fill="rgba(249,168,212,0.85)" transform="rotate(20 36 14)"/><ellipse cx="36" cy="22" rx="8" ry="5" fill="rgba(252,207,232,0.75)" transform="rotate(-15 36 22)"/><ellipse cx="24" cy="18" rx="2.5" ry="9" fill="#be185d"/><line x1="24" y1="10" x2="20" y2="4" stroke="#be185d" stroke-width="1" stroke-linecap="round"/><line x1="24" y1="10" x2="28" y2="4" stroke="#be185d" stroke-width="1" stroke-linecap="round"/><circle cx="20" cy="4" r="1.5" fill="#f9a8d4"/><circle cx="28" cy="4" r="1.5" fill="#f9a8d4"/></svg>`,
    `<svg width="48" height="36" viewBox="0 0 48 36"><ellipse cx="12" cy="14" rx="11" ry="8" fill="rgba(196,181,253,0.85)" transform="rotate(-20 12 14)"/><ellipse cx="12" cy="22" rx="8" ry="5" fill="rgba(221,214,254,0.75)" transform="rotate(15 12 22)"/><ellipse cx="36" cy="14" rx="11" ry="8" fill="rgba(196,181,253,0.85)" transform="rotate(20 36 14)"/><ellipse cx="36" cy="22" rx="8" ry="5" fill="rgba(221,214,254,0.75)" transform="rotate(-15 36 22)"/><ellipse cx="24" cy="18" rx="2.5" ry="9" fill="#6d28d9"/><line x1="24" y1="10" x2="20" y2="4" stroke="#6d28d9" stroke-width="1" stroke-linecap="round"/><line x1="24" y1="10" x2="28" y2="4" stroke="#6d28d9" stroke-width="1" stroke-linecap="round"/><circle cx="20" cy="4" r="1.5" fill="#c4b5fd"/><circle cx="28" cy="4" r="1.5" fill="#c4b5fd"/></svg>`,
  ];

  const bt = document.createElement('div');
  bt.className = 'butterfly';
  const sx = Math.random() * innerWidth;
  const sy = innerHeight * 0.2 + Math.random() * innerHeight * 0.5;
  const tx2 = (Math.random() - 0.5) * innerWidth * 0.8;
  const ty2 = (Math.random() - 0.5) * innerHeight * 0.4 - 50;
  const rot = (Math.random() - 0.5) * 60;
  const dur = 4 + Math.random() * 4;

  bt.innerHTML = `<div style="animation:wingFlap ${0.25 + Math.random() * 0.2}s ease-in-out infinite alternate">${butterflySVGs[Math.floor(Math.random() * 3)]}</div>`;
  bt.style.cssText = `left:${sx}px;top:${sy}px;--tx:${tx2}px;--ty:${ty2}px;--rot:${rot}deg;--dur:${dur}s;`;
  document.body.appendChild(bt);
  setTimeout(() => bt.remove(), (dur + 0.5) * 1000);
}

let butterflyInterval = null;
let floatiesInterval = null;

function startButterflies() {
  if (butterflyInterval) return;
  for (let i = 0; i < 5; i++) setTimeout(spawnButterfly, i * 350);
  butterflyInterval = setInterval(() => {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) setTimeout(spawnButterfly, i * 300);
  }, 2500);
}

// ═══════════════════════════════════════
// CLEANUP & VISIBILITY MANAGEMENT
// ═══════════════════════════════════════
function cleanup() {
  countdown.stop();
  garden.stop();
  starfield.stop();
  if (butterflyInterval) clearInterval(butterflyInterval);
  if (floatiesInterval) clearInterval(floatiesInterval);
}

function resume() {
  garden.start();
  starfield.start();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    cleanup();
  } else {
    resume();
  }
});

window.addEventListener('pagehide', cleanup);

// ═══════════════════════════════════════
// EVENT LISTENERS FOR CUSTOM EVENTS
// ═══════════════════════════════════════
document.addEventListener('allBloomed', () => {
  $('celebBanner').classList.add('show');
  $('gardenHint').style.display = 'none';
  $('wateringCan').style.opacity = '0';

  setTimeout(() => $('letter-unlock-btn').classList.add('show'), 800);
  haptic([50, 80, 50, 80, 100, 150, 100]);

  launchConfetti();
  setTimeout(launchConfetti, 1800);
  setTimeout(launchConfetti, 3600);

  startButterflies();

  startFallingPetals();

  fullBloomSparkles();
  setTimeout(fullBloomSparkles, 2500);
  setTimeout(fullBloomSparkles, 5000);

  const rect = $('gardenCanvas').getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    setTimeout(
      () => spawnGlowRing(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height),
      i * 400
    );
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const el = $('ind-' + i);
      if (el) {
        el.style.transform = 'scale(1.5) rotate(10deg)';
        setTimeout(() => (el.style.transform = 'scale(1.18)'), 350);
      }
    }, i * 100);
  }
});

window.addEventListener('spawnSparkle', (e) => {
  spawnSparkleAt(e.detail.x, e.detail.y);
});

// ═══════════════════════════════════════
// PETALS & SPARKLES
// ═══════════════════════════════════════
let petalsActive = false;
let petalInterval = null;
const MAX_PETALS = isMobile ? 18 : 30;
let petalCount = 0;

function petalSVG(hue) {
  const variants = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 30" width="20" height="30"><ellipse cx="10" cy="15" rx="7" ry="13" fill="hsl(${hue},85%,65%)" opacity="0.88"/><ellipse cx="10" cy="15" rx="3" ry="9" fill="hsl(${hue},90%,75%)" opacity="0.5"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 28" width="18" height="28"><path d="M9 2 C14 8 16 16 9 26 C2 16 4 8 9 2Z" fill="hsl(${hue},80%,62%)" opacity="0.85"/><path d="M9 6 C11 11 12 18 9 24 C7 18 8 11 9 6Z" fill="hsl(${hue},88%,78%)" opacity="0.45"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 22" width="24" height="22"><ellipse cx="12" cy="11" rx="10" ry="9" fill="hsl(${hue},82%,66%)" opacity="0.82" transform="rotate(-15 12 11)"/></svg>`,
  ];
  return variants[Math.floor(Math.random() * 3)];
}

function spawnPetal() {
  if (petalCount >= MAX_PETALS) return;
  petalCount++;

  const el = document.createElement('div');
  el.className = 'petal';

  const hue = Math.random() > 0.5 ? 340 + Math.random() * 20 : Math.random() * 20;
  el.innerHTML = petalSVG(hue);

  const startX = Math.random() * 110 - 5;
  const swayX = (Math.random() - 0.5) * 160;
  const scale = 0.5 + Math.random() * 0.8;
  const dur = 6 + Math.random() * 6;
  const delay = Math.random() * 4;
  const rot0 = (Math.random() - 0.5) * 60;
  const rot1 = rot0 + (Math.random() - 0.5) * 360;

  el.style.cssText =
    `left:${startX}vw; top:-40px;--dur:${dur}s; --delay:${delay}s;` +
    `--tx:${swayX}px; --rot0:${rot0}deg; --rot1:${rot1}deg;--sc:${scale};`;

  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
    petalCount--;
  }, (dur + delay) * 1000 + 500);
}

function startFallingPetals() {
  if (petalsActive) return;
  petalsActive = true;

  for (let i = 0; i < 8; i++) setTimeout(spawnPetal, i * 200);
  petalInterval = setInterval(() => {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) setTimeout(spawnPetal, i * 180);
  }, 900);
}

function spawnGlowRing(x, y) {
  const g = document.createElement('div');
  g.className = 'glow-ring';
  const sz = 80 + Math.random() * 60;
  g.style.cssText = `left:${x - sz / 2}px;top:${y - sz / 2}px;width:${sz}px;height:${sz}px;`;
  document.body.appendChild(g);
  setTimeout(() => g.remove(), 2100);
}

function fullBloomSparkles() {
  const n = isMobile ? 10 : 20;
  for (let i = 0; i < n; i++) {
    setTimeout(
      () => spawnSparkleAt(50 + Math.random() * (innerWidth - 100), 50 + Math.random() * (innerHeight * 0.8)),
      i * 180
    );
  }
}

// ═══════════════════════════════════════
// PUBLIC EXPORTS (for HTML onclick handlers)
// ═══════════════════════════════════════
window.moonClick = () => moon.click();
window.toggleAudio = () => vinylPlayer.toggle();
window.setVolume = (v) => vinylPlayer.setVolume(v);
window.openEnvelope = () => envelope.openEnvelope();
window.toggleLetter = () => envelope.toggleLetter();

// ═══════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════
const parallax = new ParallaxManager();
const countdown = new CountdownTimer();
const curtainTransition = new CurtainTransition();
const moon = new MoonEasterEgg();

countdown.start();
