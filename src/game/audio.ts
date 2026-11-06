/**
 * Procedural Web Audio API sound synthesizer and Music Engine.
 * Features:
 * - Nostalgic ambient procedural background music (synth bells, warm chords, sub bass).
 * - Custom Audio Loader: Allows loading any custom song/track (MP3, WAV, OGG) with real instruments and vocals.
 * - Mannequin sound effects (footsteps, jumps, landing impacts, respawns).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Procedural Music Scheduler
  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private currentStep: number = 0;
  private musicVolume: number = 1.0;

  // Custom Audio Track Player
  private customAudio: HTMLAudioElement | null = null;
  private customAudioSource: MediaElementAudioSourceNode | null = null;
  private customTrackName: string | null = null;

  // Musical Chord Progression for Procedural Ambient Music (Cmaj9 - Am7 - Fmaj7 - Gsus4)
  private chordFrequencies = [
    // Chord 1: Cmaj9 (C3, G3, B3, D4, E4)
    [130.81, 196.0, 246.94, 293.66, 329.63],
    // Chord 2: Am7 (A2, E3, G3, C4, E4)
    [110.0, 164.81, 196.0, 261.63, 329.63],
    // Chord 3: Fmaj7 (F2, C3, E3, A3, C4)
    [87.31, 130.81, 164.81, 220.0, 261.63],
    // Chord 4: Gsus4 -> G (G2, D3, G3, C4, B3)
    [98.0, 146.83, 196.0, 261.63, 246.94],
  ];

  constructor() {
    // Initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Load user's song: "Pure Imagination" (actual instruments and vocals)
      this.loadPureImaginationTrack();
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.customAudio && this.isMusicPlaying && this.customAudio.paused) {
      this.customAudio.play().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.muted = muted;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1.5, volume));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.volume = Math.max(0, Math.min(1.0, this.musicVolume));
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getTrackName(): string {
    return this.customTrackName || 'Ambient Expanse (Built-in)';
  }

  public isUsingCustomTrack(): boolean {
    return this.customTrackName !== null;
  }

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }

  /**
   * Start / Resume Background Music
   */
  public startMusic() {
    this.isMusicPlaying = true;
    if (this.customAudio) {
      this.customAudio.play().catch(() => {});
    } else {
      this.startProceduralMusic();
    }
  }

  /**
   * Pause Background Music
   */
  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.pauseMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicPlaying;
  }

  /**
   * Loads a user-provided custom music file (MP3, WAV, OGG, M4A) with real instruments and vocals!
   */
  public loadCustomTrack(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.resume();

        // Stop procedural music scheduler
        if (this.musicIntervalId !== null) {
          window.clearInterval(this.musicIntervalId);
          this.musicIntervalId = null;
        }

        // Clean up previous custom audio
        if (this.customAudio) {
          this.customAudio.pause();
          this.customAudio.src = '';
        }

        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.loop = true;
        audio.volume = this.musicVolume;
        audio.muted = this.isMuted;

        audio.addEventListener('canplaythrough', () => {
          this.customAudio = audio;
          this.customTrackName = file.name.replace(/\.[^/.]+$/, '');
          this.isMusicPlaying = true;
          audio.play().catch(() => {});
          resolve(this.customTrackName);
        }, { once: true });

        audio.addEventListener('error', () => {
          reject(new Error('Failed to load audio file'));
        }, { once: true });

        audio.load();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Revert to the built-in procedural ambient track
   */
  public resetToProceduralMusic() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
    this.customTrackName = null;
    this.startProceduralMusic();
  }

  /**
   * Load and play the user's uploaded song "Pure Imagination"
   */
  public loadPureImaginationTrack() {
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    const defaultSongPath = '/assets/audio/pure_imagination_boosted_150.m4a';
    const audio = new Audio(defaultSongPath);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1.0, this.musicVolume));
    audio.muted = this.isMuted;
    this.customAudio = audio;
    this.customTrackName = 'Pure Imagination (150% Boosted)';
    this.isMusicPlaying = true;
    audio.play().catch(() => {});
  }

  /**
   * Procedural Music Loop Scheduler: Dreamy ambient Rhodes & bell synth
   */
  private startProceduralMusic() {
    if (this.musicIntervalId !== null) return;
    this.isMusicPlaying = true;

    // Step every 500ms (120 BPM sixteenth / eighth groove)
    const stepDurationMs = 520;
    this.musicIntervalId = window.setInterval(() => {
      this.tickProceduralMusic();
    }, stepDurationMs);
  }

  private tickProceduralMusic() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying || this.isMuted) return;

    const chordIndex = Math.floor(this.currentStep / 8) % this.chordFrequencies.length;
    const stepInBar = this.currentStep % 8;
    const chord = this.chordFrequencies[chordIndex];

    const now = this.ctx.currentTime;

    // 1. Warm Bass Note on beat 0 and 4
    if (stepInBar === 0) {
      this.playSynthNote(chord[0] * 0.5, 'triangle', 0.28, 2.8, 180);
    }

    // 2. Pad Chord on beat 0
    if (stepInBar === 0) {
      for (let i = 1; i < chord.length; i++) {
        this.playSynthNote(chord[i], 'sine', 0.12, 3.4, 600);
      }
    }

    // 3. Delicate Arpeggiated Melody / Chime notes
    if (stepInBar % 2 === 0 || stepInBar === 5) {
      const noteIdx = (stepInBar * 2 + chordIndex) % chord.length;
      const freq = chord[noteIdx] * (stepInBar === 4 ? 2.0 : 1.0);
      this.playSynthBell(freq, now, 0.16);
    }

    this.currentStep = (this.currentStep + 1) % 32;
  }

  private playSynthNote(
    freq: number,
    type: OscillatorType,
    vol: number,
    duration: number,
    cutoff: number
  ) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private playSynthBell(freq: number, startTime: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + 0.9);
  }

  /**
   * Footstep tap on stud baseplate
   */
  public playFootstep(isSprinting: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isSprinting ? 220 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(isSprinting ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Impact sound when landing from a jump or fall
   */
  public playImpact(intensity: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const norm = Math.min(Math.max((intensity - 2) / 25, 0.05), 1.0);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + norm * 80, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);

    gain.gain.setValueAtTime(norm * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Mannequin jump whoosh
   */
  public playJump() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Respawn swoosh sound
   */
  public playRespawn() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const soundEngine = new SoundEngine();
