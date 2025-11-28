
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmNoteIndex: number = 0;
  
  // Simple retro bassline melody
  private bgmNotes = [
    110.00, // A2
    110.00, 
    130.81, // C3
    110.00,
    164.81, // E3
    110.00,
    146.83, // D3
    130.81  // C3
  ];

  constructor() {
    // We defer actual context creation until interaction or first call to prevent warnings
    // but we prepare the logic.
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.15; // Master volume
      } catch (e) {
        console.warn("Web Audio API not supported");
      }
    }
  }

  // Call this on user gesture (e.g. Start Button)
  public async init() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volumeMult: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.initCtx(); // Ensure context exists

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    // Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volumeMult, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  public startBGM() {
    if (this.bgmInterval) return;
    this.bgmNoteIndex = 0;
    const beatLen = 250; // ms per note

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const freq = this.bgmNotes[this.bgmNoteIndex % this.bgmNotes.length];
      // Short bass pluck
      this.playTone(freq, 'triangle', 0.15, 0.4);
      this.bgmNoteIndex++;
    }, beatLen);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // --- SFX ---

  public playPaddleHit() {
    // Ping sound
    this.playTone(440, 'square', 0.1, 0.5); 
    // Add a lower body to the sound
    this.playTone(220, 'sine', 0.1, 0.5);
  }

  public playBrickHit(pitchMultiplier: number = 1) {
    // High pitched blip, varies slightly
    const baseFreq = 880 + (Math.random() * 50);
    this.playTone(baseFreq * pitchMultiplier, 'square', 0.08, 0.4);
  }

  public playWallHit() {
    // Thud
    this.playTone(150, 'triangle', 0.05, 0.6);
  }

  public playBallLost() {
    if (!this.ctx || this.isMuted) return;
    this.initCtx();
    
    // Descending slide
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playWin() {
    if (!this.ctx || this.isMuted) return;
    this.initCtx();
    this.stopBGM();

    // Major Arpeggio
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    notes.forEach((freq, i) => {
      const t = now + i * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  public playGameOver() {
    if (!this.ctx || this.isMuted) return;
    this.initCtx();
    this.stopBGM();

    // Sad descending tones
    const now = this.ctx!.currentTime;
    const notes = [440, 415, 392, 370]; 
    notes.forEach((freq, i) => {
      const t = now + i * 0.3;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playPowerUpCollect() {
    if (!this.ctx || this.isMuted) return;
    this.initCtx();
    
    // Rapid ascending scale (Power up sound)
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.1);
    osc.frequency.linearRampToValueAtTime(1760, t + 0.2);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playLaserShoot() {
    if (!this.ctx || this.isMuted) return;
    this.initCtx();
    
    // Zap sound
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const audioManager = new AudioManager();