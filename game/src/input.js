// Input: keyboard (WASD / arrows, Shift to sneak, P or Escape to pause,
// M to mute, R to restart, Enter to start) and mouse (click to throw a
// pebble at that spot). The canvas reports clicks in game coordinates.
export function makeInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    mouseX: 0,
    mouseY: 0,
    clicked: false, // set on mousedown, consumed by main.js each frame
    onKey: null, // main.js assigns: (code) => void, for one-shot keys
  };

  function codeOf(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    const c = codeOf(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(c)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      keys.add(c);
      if (state.onKey) state.onKey(c);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(codeOf(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    state.clicked = true;
  });

  return state;
}

// Read the current movement vector: -1..1 on each axis, diagonals kept.
export function readMove(input) {
  const k = input.keys;
  let x = 0;
  let y = 0;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
  if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
  if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
  return { x, y };
}

export function isSneaking(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}
