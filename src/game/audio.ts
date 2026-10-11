const SCALE = [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99];

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private pad: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  unlock() {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) {
      const ctx = new Ctx({ latencyHint: "interactive" });
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      music.gain.value = 0.45;
      sfx.gain.value = 0.9;
      master.gain.value = this.muted ? 0 : 0.85;
      music.connect(master);
      sfx.connect(master);
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.music = music;
      this.sfx = sfx;
      const len = Math.floor(ctx.sampleRate * 0.25);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.03);
  }

  startPad() {
    this.unlock();
    if (!this.ctx || !this.music || this.pad) return;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.6);
    gain.connect(this.music);
    const freqs = [130.81, 196.0, 261.63];
    const osc = freqs.map((freq, i) => {
      const o = this.ctx!.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = freq;
      o.detune.value = (i - 1) * 6;
      o.connect(gain);
      o.start();
      return o;
    });
    this.pad = { osc, gain };
  }

  stopPad() {
    if (!this.ctx || !this.pad) return;
    const { osc, gain } = this.pad;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.08);
    const pad = this.pad;
    this.pad = null;
    window.setTimeout(() => {
      osc.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          /* already stopped */
        }
      });
      gain.disconnect();
      void pad;
    }, 400);
  }

  playWish(combo: number) {
    const freq = SCALE[Math.abs(combo) % SCALE.length]!;
    this.tone(freq, 0.16, "triangle", 0.07);
    this.tone(freq * 2, 0.1, "sine", 0.025, 0.02);
  }

  playNear() {
    this.tone(740, 0.09, "sine", 0.035);
  }

  playGrace() {
    this.tone(880, 0.12, "triangle", 0.05);
    this.tone(1174, 0.14, "sine", 0.03, 0.04);
  }

  playHit() {
    this.burst(0.12, 0.22);
    this.tone(110, 0.22, "sine", 0.1);
    this.duck();
  }

  playShield() {
    this.tone(520, 0.12, "triangle", 0.05);
    this.burst(0.06, 0.08);
  }

  playCharm() {
    this.tone(523, 0.14, "sine", 0.045);
    this.tone(784, 0.18, "triangle", 0.04, 0.06);
  }

  playLife() {
    this.tone(523, 0.1, "triangle", 0.05);
    this.tone(659, 0.12, "triangle", 0.045, 0.07);
    this.tone(784, 0.16, "sine", 0.04, 0.14);
  }

  playOver() {
    this.tone(392, 0.22, "sine", 0.06);
    this.tone(311, 0.26, "triangle", 0.05, 0.16);
    this.tone(196, 0.4, "sine", 0.05, 0.32);
  }

  private duck() {
    if (!this.ctx || !this.music) return;
    const now = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(0.12, now, 0.01);
    this.music.gain.setTargetAtTime(0.45, now + 0.25, 0.12);
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gainValue: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.015), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  private burst(dur: number, gainValue: number) {
    if (!this.ctx || !this.sfx || !this.noise || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainValue, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }
}
