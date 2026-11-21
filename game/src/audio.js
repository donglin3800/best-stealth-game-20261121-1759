// Sound, all synthesized with WebAudio: no audio files, no network.
// Footsteps are short filtered thuds, the alert is a rising sawtooth sting,
// pickups chime, the win is a small arpeggio. M toggles mute.
export function makeAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ambientOn: false,
  };

  function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return true;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.muted ? 0 : 0.5;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime + when;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A soft thud made of a fast-falling sine plus a breath of noise.
  function thud(vol, freq) {
    if (!audio.ctx || audio.muted) return;
    tone(freq, 0.09, 'sine', vol, 0, freq * 0.4);
  }

  return {
    unlock() {
      ensure();
    },
    get muted() {
      return audio.muted;
    },
    toggleMute() {
      audio.muted = !audio.muted;
      if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
      return audio.muted;
    },
    step(sneaking) {
      if (!ensure()) return;
      thud(sneaking ? 0.05 : 0.14, sneaking ? 120 : 95);
    },
    pebbleThrow() {
      if (!ensure()) return;
      tone(620, 0.07, 'triangle', 0.12, 0, 900);
    },
    pebbleLand() {
      if (!ensure()) return;
      thud(0.22, 70);
      tone(180, 0.12, 'sine', 0.1, 0.02, 90);
    },
    pickup() {
      if (!ensure()) return;
      tone(880, 0.14, 'sine', 0.2);
      tone(1318, 0.2, 'sine', 0.18, 0.09);
    },
    alert() {
      if (!ensure()) return;
      tone(220, 0.32, 'sawtooth', 0.16, 0, 440);
      tone(330, 0.28, 'sawtooth', 0.12, 0.1, 660);
    },
    caught() {
      if (!ensure()) return;
      tone(160, 0.5, 'sawtooth', 0.2, 0, 55);
      tone(110, 0.5, 'square', 0.1, 0.05, 50);
    },
    win() {
      if (!ensure()) return;
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.34, 'sine', 0.18, i * 0.11));
    },
    click() {
      if (!ensure()) return;
      tone(700, 0.06, 'triangle', 0.1);
    },
    // A quiet night drone under the game: two detuned sines, very low.
    startAmbient() {
      if (!ensure() || audio.ambientOn) return;
      audio.ambientOn = true;
      const ctx = audio.ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      gain.connect(audio.master);
      for (const f of [55, 55.4]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(gain);
        osc.start();
      }
    },
  };
}
