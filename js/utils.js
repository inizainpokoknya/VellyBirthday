/**
 * Shared utilities & constants
 */

export const isMobile = /Mobi|Android/i.test(navigator.userAgent);

export const $ = (id) => document.getElementById(id);

export function haptic(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export function showToast(msg, dur = 2500) {
  const t = $('theme-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

export const confColors = [
  '#60a5fa', '#93c5fd', '#bfdbfe', '#f9a8d4',
  '#c4b5fd', '#fbbf24', '#6ee7b7', '#fca5a5', '#fff'
];

export const floatEm = [
  '💙', '🎉', '✨', '🌟', '🎀', '🌸', '💫', '🎈', '🫧', '🌹'
];
