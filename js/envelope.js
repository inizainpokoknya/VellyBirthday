/**
 * Pocket Envelope — Interactive Letter with Drag Physics
 * Manages letter state, typewriter animation, and drag interactions
 * FIXES: Proper timeout tracking for typewriter cleanup
 */

import { haptic, $ } from './utils.js';

const LETTER_CONTENT = `bocill,
have watered 100 roses.
thats no coincidence — thats u.
u are the one who is attentive, patient, and never gives up.

today, 9 april, i want to say something that i might have never said directly:

thanks for existing. truly.
not cz u're perfect (but ik u = perfect) — but precisely because u are u. with all ur exhaustion, all ur cries, and all ur "i can't do this anymore" moments.

u strong without realizing it, velly. and that's one of the most beautiful things i've ever seen.

i love how u care so deeply about the people around u, even when ur own cup is empty. that says a lot about who u are.

happy birthday. i hope this year is much lighter, much happier, and full of things that make u smile for no reason yaa.

u deserve it all. every single bit of it. 💙`;

class Envelope {
  constructor() {
    this.letterEl = document.getElementById('env-letter');
    this.flapWrap = document.getElementById('env-flap-wrap');
    this.waxSeal = document.getElementById('env-wax-seal');
    this.pocketEnv = document.getElementById('pocket-envelope');
    this.envOverlay = $('env-overlay');

    this.isLetterOpen = false;
    this.letterAnimating = false;
    this.letterTyped = false;
    this.dragActive = false;
    this.dragStartY = 0;
    this.dragStartVal = 0;
    this.currentTY = 0;

    // Typewriter timeout tracking (CRITICAL for memory cleanup)
    this.typewriterTimeouts = [];

    this.ANIM_DURATION = 820;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.letterEl.addEventListener('pointerdown', (e) => this.onDragStart(e), {
      passive: false,
    });
    this.letterEl.addEventListener('pointermove', (e) => this.onDragMove(e));
    this.letterEl.addEventListener('pointerup', () => this.onDragEnd());
    this.letterEl.addEventListener('pointercancel', () => this.onDragEnd());

    $('env-overlay').addEventListener('click', (e) => {
      if (e.target === $('env-overlay') || e.target === $('env-backdrop-hit')) {
        this.closeEnvelope();
      }
    });

    this.pocketEnv.addEventListener('click', () => this.toggleLetter());
  }

  getLetterH() {
    return this.letterEl.offsetHeight || 300;
  }

  getEnvH() {
    return document.getElementById('env-back').offsetHeight || 180;
  }

  getMinTY() {
    return -(this.getLetterH() - this.getEnvH() * 0.14);
  }

  getMaxTY() {
    return this.getLetterH() * 0.94;
  }

  getPeekTY() {
    return this.getLetterH() * 0.86;
  }

  updateLetterPosition(ty) {
    const min = this.getMinTY();
    const max = this.getMaxTY();
    const t = Math.max(0, Math.min(1, (ty - max) / (min - max)));
    const scale = 1 + t * 0.05;

    const blur = 12 + t * 36;
    const offsetY = -(4 + t * 12);
    const opacity = 0.18 + t * 0.2;
    const spreadElevation = t * 6;

    this.letterEl.style.transform = `translateX(-50%) translateY(${ty}px) scale(${scale})`;
    this.letterEl.style.boxShadow =
      `0 ${offsetY}px ${blur}px ${spreadElevation}px rgba(0,0,0,${opacity.toFixed(2)}),` +
      `0 2px 0 rgba(255,255,255,0.8) inset`;
  }

  setTY(val, animated) {
    this.currentTY = val;
    this.letterEl.classList.toggle('animated', !!animated);
    this.updateLetterPosition(val);

    if (animated) {
      setTimeout(() => {
        this.letterEl.classList.remove('animated');
        this.currentTY = val;
      }, this.ANIM_DURATION);
    }
  }

  snapLetter() {
    const threshold = (this.getMinTY() + this.getPeekTY()) / 2;
    if (this.currentTY < threshold) {
      this.animateOpen();
    } else {
      this.animateClose();
    }
  }

  animateOpen() {
    this.setTY(this.getMinTY(), true);
    this.isLetterOpen = true;
    this.pocketEnv.classList.add('is-open');
    haptic([10, 20]);
  }

  animateClose() {
    if (this.letterAnimating) return;
    this.letterAnimating = true;
    this.isLetterOpen = false;

    this.setTY(this.getMaxTY(), true);
    this.pocketEnv.classList.remove('is-open');
    this.letterEl.classList.remove('draggable');
    haptic(20);

    setTimeout(() => this.flapWrap.classList.remove('flap-open'), 200);
    setTimeout(() => this.waxSeal.classList.remove('seal-hidden'), 680);
    setTimeout(() => {
      this.letterAnimating = false;
    }, this.ANIM_DURATION + 60);
  }

  onDragStart(e) {
    if (!this.letterEl.classList.contains('draggable')) return;
    if (this.letterAnimating) return;

    this.letterEl.setPointerCapture(e.pointerId);
    this.dragActive = true;
    this.dragStartY = e.clientY;
    this.dragStartVal = this.currentTY;
    this.letterEl.classList.remove('animated');
    e.stopPropagation();
    e.preventDefault();
  }

  onDragMove(e) {
    if (!this.dragActive) return;

    const min = this.getMinTY();
    const max = this.getMaxTY();
    let v = this.dragStartVal + (e.clientY - this.dragStartY);

    if (v < min) v = min + (v - min) * 0.14; // rubber-band
    if (v > max) v = max + (v - max) * 0.14;

    this.currentTY = v;
    this.updateLetterPosition(v);
    e.preventDefault();
  }

  onDragEnd() {
    if (!this.dragActive) return;
    this.dragActive = false;
    this.snapLetter();
  }

  openEnvelope() {
    haptic([40, 60, 40, 60, 50]);
    this.envOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.resetEnvelopeState();
  }

  closeEnvelope() {
    haptic(30);

    // Clean up typewriter timeouts BEFORE closing
    this.typewriterTimeouts.forEach((tid) => clearTimeout(tid));
    this.typewriterTimeouts = [];

    if (this.isLetterOpen || this.letterEl.classList.contains('draggable')) {
      this.animateClose();
      setTimeout(() => {
        this.envOverlay.classList.remove('show');
        document.body.style.overflow = '';
      }, this.ANIM_DURATION + 80);
    } else {
      this.envOverlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  toggleLetter() {
    if (this.letterAnimating) return;
    if (!this.letterEl.classList.contains('draggable')) {
      this.triggerOpen();
    } else if (this.isLetterOpen) {
      this.animateClose();
    }
  }

  triggerOpen() {
    this.letterAnimating = true;

    this.waxSeal.classList.add('seal-hidden');

    setTimeout(() => this.flapWrap.classList.add('flap-open'), 120);

    setTimeout(() => {
      this.pocketEnv.classList.add('is-open');
      this.letterEl.style.pointerEvents = 'auto';
      this.setTY(this.getPeekTY(), true);
    }, 380);

    setTimeout(() => {
      this.letterAnimating = false;
      this.letterEl.classList.add('draggable');
      if (!this.letterTyped) {
        this.letterTyped = true;
        this.typeEnvLetter();
      }
    }, 380 + this.ANIM_DURATION);
  }

  resetEnvelopeState() {
    this.isLetterOpen = this.letterAnimating = this.dragActive = false;
    this.letterEl.classList.remove('animated', 'draggable');
    this.flapWrap.classList.remove('flap-open');
    this.waxSeal.classList.remove('seal-hidden');
    this.pocketEnv.classList.remove('is-open');
    this.letterEl.style.pointerEvents = 'none';

    this.letterEl.style.transition = 'none';
    this.letterEl.style.transform = 'translateX(-50%) translateY(9999px)';
    requestAnimationFrame(() => {
      const maxTY = this.getMaxTY();
      this.currentTY = maxTY;
      this.updateLetterPosition(maxTY);
    });
  }

  typeEnvLetter() {
    const bodyEl = $('envLetterBody');
    const signEl = $('envLetterSign');
    bodyEl.innerHTML = '';
    signEl.textContent = '';

    const paragraphs = LETTER_CONTENT.split('\n\n');
    const total = paragraphs.length;
    let pIdx = 0;

    const steps = [0.05, 0.18, 0.32, 0.48, 0.63, 0.78, 1.0];

    const nudge = (idx) => {
      const f = steps[Math.min(idx, steps.length - 1)];
      const peek = this.getPeekTY();
      const min = this.getMinTY();
      const target = peek + (min - peek) * f;
      if (this.currentTY > target) this.setTY(target, true);
    };

    const typeNextParagraph = () => {
      if (pIdx >= total) {
        // Sign-off
        const signText = '— someone who cares about you 💙';
        let si = 0;

        const signInterval = setInterval(() => {
          signEl.textContent += signText[si++];
          if (si < signText.length) return;
          clearInterval(signInterval);

          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const finalMin = this.getMinTY();
              this.isLetterOpen = true;
              this.setTY(finalMin, true);
              haptic([15, 25, 15]);

              const hint = $('envScrollHint');
              if (hint) {
                hint.textContent = '↑ tarik ke atas untuk baca ↑';
                hint.style.opacity = '1';
                setTimeout(() => {
                  hint.style.opacity = '0';
                }, 4000);
              }
            })
          );
        }, 36);

        return;
      }

      nudge(pIdx);
      const p = document.createElement('p');
      bodyEl.appendChild(p);
      const text = paragraphs[pIdx++].replace(/\n/g, ' ');
      let ci = 0;

      const typeChar = () => {
        if (ci >= text.length) {
          const timeoutId = setTimeout(typeNextParagraph, 260);
          this.typewriterTimeouts.push(timeoutId);
          return;
        }

        p.textContent += text[ci++];
        if (ci % 24 === 0) haptic(4);

        const timeoutId = setTimeout(typeChar, 20 + Math.random() * 14);
        this.typewriterTimeouts.push(timeoutId);
      };

      const timeoutId = setTimeout(typeChar, pIdx === 1 ? 220 : 80);
      this.typewriterTimeouts.push(timeoutId);
    };

    typeNextParagraph();
  }
}

export const envelope = new Envelope();
