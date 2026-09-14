/**
 * Confetti helper for TeKVora celebrations.
 * Dispatches a custom browser event that Layout.tsx listens for,
 * then canvas-confetti fires the burst.
 */
export function triggerConfetti() {
  window.dispatchEvent(new CustomEvent('tekvora-confetti'));
}
