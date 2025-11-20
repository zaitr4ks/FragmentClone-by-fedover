
// Simple synthesizer using Web Audio API
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playSound = (type: 'click' | 'coin' | 'success' | 'error' | 'pop') => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        // High frequency blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'coin':
        // Coin collect sound (two tones)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'success':
        // Success chord arpeggio
        const notes = [440, 554, 659]; // A Major
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.value = freq;
          const startTime = now + i * 0.05;
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          o.start(startTime);
          o.stop(startTime + 0.4);
        });
        break;

      case 'error':
        // Low buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
        
      case 'pop':
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(300, now);
         gainNode.gain.setValueAtTime(0.05, now);
         gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
         osc.start(now);
         osc.stop(now + 0.1);
         break;
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};
