/**
 * Synthesized cyberpunk audio — no external files needed.
 * Uses Web Audio API to generate all SFX and a procedural BGM loop.
 */
export class AudioManager {
  private ctx!: AudioContext;
  private master!: GainNode;
  private bgmGain!: GainNode;
  private sfxGain!: GainNode;
  private bgmOscs: OscillatorNode[] = [];
  private arpTimer: number | null = null;
  private ready = false;

  /** Must call from user gesture (tap/click). */
  async init(): Promise<void> {
    if (this.ready) {
      if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.25;
    this.bgmGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);

    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.ready = true;
  }

  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'suspended') {
      await this.ctx.suspend();
    }
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ─── SFX ───

  playCoin(): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.osc('sine', 880, 0.12);
    o.osc.frequency.exponentialRampToValueAtTime(1760, t + 0.08);
    this.env(o.gain, 0.25, 0.15, t);
  }

  playJump(): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.osc('sine', 220, 0.2);
    o.osc.frequency.exponentialRampToValueAtTime(660, t + 0.12);
    this.env(o.gain, 0.18, 0.2, t);
  }

  playRoll(): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.osc('sawtooth', 400, 0.15);
    o.osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
    this.env(o.gain, 0.12, 0.15, t);
  }

  playHit(): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    // Impact
    const o = this.osc('sawtooth', 120, 0.35);
    o.osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    this.env(o.gain, 0.35, 0.35, t);
    // Noise-like crunch
    const o2 = this.osc('square', 60, 0.2);
    o2.osc.frequency.setValueAtTime(80, t + 0.05);
    this.env(o2.gain, 0.15, 0.2, t);
  }

  playGameOver(): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const notes = [392, 330, 262, 196];
    notes.forEach((f, i) => {
      const startT = t + i * 0.22;
      const o = this.osc('triangle', f, 0.4, startT);
      o.gain.gain.setValueAtTime(0, t);
      o.gain.gain.setValueAtTime(0.2, startT);
      o.gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.4);
    });
  }

  // ─── BGM — Procedural Cyberpunk ───

  startBGM(): void {
    if (!this.ready) return;
    this.stopBGM();

    // Bass drone
    const bass = this.bgmOsc('sawtooth', 55, 200, 0.12);
    // Sub pad
    this.bgmOsc('triangle', 110, 400, 0.06);
    // Higher pad layer
    this.bgmOsc('sine', 220, 600, 0.04);

    // Slow LFO on bass filter
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(bass.filter.frequency);
    lfo.start();
    this.bgmOscs.push(lfo);

    // Arpeggiated synth notes
    const scale = [220, 261.6, 329.6, 392, 440, 523.3, 440, 392];
    let idx = 0;
    this.arpTimer = window.setInterval(() => {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = 'square';
      o.frequency.value = scale[idx % scale.length];
      f.type = 'lowpass';
      f.frequency.value = 1200 + Math.sin(idx * 0.3) * 400;
      f.Q.value = 5;
      o.connect(f);
      f.connect(g);
      g.connect(this.bgmGain);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t);
      o.stop(t + 0.22);
      idx++;
    }, 220);
  }

  stopBGM(): void {
    for (const o of this.bgmOscs) {
      try { o.stop(); } catch { /* already stopped */ }
    }
    this.bgmOscs = [];
    if (this.arpTimer !== null) {
      clearInterval(this.arpTimer);
      this.arpTimer = null;
    }
  }

  // ─── Helpers ───

  private osc(type: OscillatorType, freq: number, dur: number, startTime?: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this.sfxGain);
    const startT = startTime ?? this.ctx.currentTime;
    o.start(startT);
    o.stop(startT + dur);
    return { osc: o, gain: g };
  }

  private env(g: GainNode, peak: number, dur: number, t: number): void {
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  }

  private bgmOsc(type: OscillatorType, freq: number, filterFreq: number, vol: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    o.type = type;
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    o.connect(f);
    f.connect(g);
    g.connect(this.bgmGain);
    g.gain.value = vol;
    o.start();
    this.bgmOscs.push(o);
    return { osc: o, gain: g, filter: f };
  }
}
