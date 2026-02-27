export class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "square", volume = 0.1) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playSequence(notes: Array<[number, number]>, type: OscillatorType = "square", volume = 0.1) {
    const ctx = this.getContext();
    let time = ctx.currentTime;

    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + dur);
      time += dur;
    }
  }

  paddleHit() {
    this.playTone(440, 0.1);
  }

  wallHit() {
    this.playTone(300, 0.08);
  }

  score() {
    this.playTone(220, 0.3, "sawtooth");
  }

  victory() {
    this.playSequence([
      [523, 0.12], // C5
      [659, 0.12], // E5
      [784, 0.12], // G5
      [1047, 0.3], // C6
    ], "square", 0.08);
  }

  defeat() {
    this.playSequence([
      [392, 0.2],  // G4
      [349, 0.2],  // F4
      [311, 0.2],  // Eb4
      [261, 0.4],  // C4
    ], "sawtooth", 0.08);
  }
}
