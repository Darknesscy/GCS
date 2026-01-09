
// Synthesized Sound Effects for UI Feedback

const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playHoverSound = () => {
  if (ctx.state === 'suspended') ctx.resume();
  createOscillator('sine', 800, 0.05, 0.05);
};

export const playClickSound = () => {
  if (ctx.state === 'suspended') ctx.resume();
  createOscillator('square', 200, 0.1, 0.05);
  setTimeout(() => createOscillator('sine', 600, 0.1, 0.05), 50);
};

export const playPingSound = () => {
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // High pitched 'ping' with decay
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playAlertSound = () => {
  if (ctx.state === 'suspended') ctx.resume();
  createOscillator('sawtooth', 150, 0.3, 0.1);
  setTimeout(() => createOscillator('sawtooth', 120, 0.3, 0.1), 150);
};

export const playSuccessSound = () => {
  if (ctx.state === 'suspended') ctx.resume();
  createOscillator('sine', 440, 0.1, 0.1);
  setTimeout(() => createOscillator('sine', 880, 0.2, 0.1), 100);
};

export const playDataStreamSound = () => {
    if (ctx.state === 'suspended') ctx.resume();
    const count = 5;
    for(let i=0; i<count; i++) {
        setTimeout(() => {
            createOscillator('square', 1000 + Math.random() * 2000, 0.03, 0.02);
        }, i * 40);
    }
};
