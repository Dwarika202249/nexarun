/**
 * Synthesized cyberpunk audio — no external files needed.
 * Uses Web Audio API to generate all SFX and a procedural BGM loop.
 */
export class AudioManager {
  private ctx!: AudioContext;
  private master!: GainNode;
  private bgmGain!: GainNode;
  private sfxGain!: GainNode;
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

  // ─── BGM — Fast Paced Cyberpunk Action ───

  startBGM(): void {
    if (!this.ready) return;
    this.stopBGM();

    // Fast-paced BPM calculations (145 BPM)
    const bps = 145 / 60;
    const stepTime = (1 / bps) / 4; // 16th notes (~103ms)
    const stepMs = Math.floor(stepTime * 1000);

    const bassScale = [110, 110, 220, 110, 146.8, 110, 164.8, 110];
    const arpScale = [440, 523.25, 659.25, 880, 783.99, 659.25, 523.25, 392];
    let step = 0;

    this.arpTimer = window.setInterval(() => {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      
      // -- KICK (4-on-the-floor) --
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.connect(kGain);
        kGain.connect(this.bgmGain);
        
        kick.frequency.setValueAtTime(150, t);
        kick.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        kGain.gain.setValueAtTime(0.6, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        kick.start(t);
        kick.stop(t + 0.2);
      }

      // -- HI-HAT (Off-beats) --
      if (step % 2 !== 0) {
        const hat = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        const hFilter = this.ctx.createBiquadFilter();
        hat.type = 'square';
        hFilter.type = 'highpass';
        hFilter.frequency.value = 8000;
        
        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.bgmGain);
        
        hGain.gain.setValueAtTime(0.1, t);
        hGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        
        hat.start(t);
        hat.stop(t + 0.05);
      }

      // -- BASSLINE (Synthesized bounce) --
      const bassFreq = bassScale[step % bassScale.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();
      bassOsc.type = 'sawtooth';
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(300, t);
      bassFilter.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.bgmGain);
      
      bassOsc.frequency.value = bassFreq;
      bassGain.gain.setValueAtTime(0.3, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      
      bassOsc.start(t);
      bassOsc.stop(t + 0.15);

      // -- SYNTH LEAD (Arpeggio) --
      if (step % 2 === 0) {
        const lead = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        lead.type = 'square';
        lead.frequency.value = arpScale[(step / 2) % arpScale.length];
        
        lead.connect(leadGain);
        leadGain.connect(this.bgmGain);
        
        leadGain.gain.setValueAtTime(0.08, t);
        leadGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        lead.start(t);
        lead.stop(t + 0.1);
      }

      step++;
    }, stepMs);
  }

  stopBGM(): void {
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
}
