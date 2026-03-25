/**
 * Vinyl Record Player — Audio Control + Animation
 * Syncs disc rotation, tonearm, & notes with playback state
 */

import { haptic, $ } from './utils.js';

class VinylPlayer {
  constructor() {
    this.audio = new Audio('audio/Elvis Presley - Cant Help Falling in Love (Official Audio).mp3');
    this.audio.loop = true;
    this.audio.volume = 0.45;

    this.audioPlaying = false;
    this.audioStarted = false;

    this.vinylDisc = document.getElementById('vinyl-disc');
    this.tonearmSvg = document.getElementById('tonearm-svg');
    this.vinylPlayBtn = document.getElementById('vinyl-play-btn');
    this.vinylNotes = document.getElementById('vinyl-notes');
    this.vinylVolSlider = document.getElementById('vinyl-volume');

    this.setupErrorHandling();
    this.setupEventListeners();
    this.initVolume();
  }

  setupErrorHandling() {
    this.audio.addEventListener('error', () => {
      console.warn('[vinyl] Audio file could not be loaded — player disabled.');
      this.vinylPlayBtn.disabled = true;
      this.vinylPlayBtn.title = 'Audio tidak tersedia';
      this.vinylPlayBtn.style.opacity = '0.35';
      this.vinylPlayBtn.style.cursor = 'not-allowed';
      document.querySelector('.vinyl-song-title').textContent = 'Audio unavailable';
      document.querySelector('.vinyl-song-artist').textContent = '';
    });
  }

  setupEventListeners() {
    this.vinylPlayBtn.addEventListener('click', () => this.toggle());
    this.vinylDisc.addEventListener('click', () => this.toggle());
    this.vinylVolSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

    // Autoplay on first interaction
    document.addEventListener(
      'click',
      () => this.startAudio(),
      { once: true }
    );
    document.addEventListener(
      'touchstart',
      () => this.startAudio(),
      { once: true }
    );
  }

  initVolume() {
    const pct = Math.round(this.audio.volume * 100) + '%';
    this.vinylVolSlider.style.setProperty('--vol', pct);
  }

  setVinylState(playing) {
    this.audioPlaying = playing;
    this.vinylDisc.style.animationPlayState = playing ? 'running' : 'paused';
    this.tonearmSvg.classList.toggle('playing', playing);
    this.vinylPlayBtn.textContent = playing ? '⏸' : '▶';
    this.vinylNotes.classList.toggle('playing', playing);
  }

  startAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;
    this.audio
      .play()
      .then(() => {
        this.setVinylState(true);
      })
      .catch(() => {
        this.audioStarted = false;
      });
  }

  toggle() {
    haptic(30);
    if (!this.audioStarted) {
      this.startAudio();
      return;
    }

    if (this.audioPlaying) {
      this.audio.pause();
      this.setVinylState(false);
    } else {
      this.audio
        .play()
        .then(() => this.setVinylState(true))
        .catch(() => {});
    }
  }

  setVolume(v) {
    this.audio.volume = parseFloat(v);
    const pct = Math.round(v * 100) + '%';
    this.vinylVolSlider.style.setProperty('--vol', pct);
  }

  stop() {
    this.audio.pause();
    this.setVinylState(false);
  }

  getAudio() {
    return this.audio;
  }
}

export const vinylPlayer = new VinylPlayer();
