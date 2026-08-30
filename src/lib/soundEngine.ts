class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  async playToque(audioSrc: string, fallbackNotes: number[]): Promise<void> {
    this.initCtx();
    this.currentAudio?.pause();
    return new Promise((resolve) => {
      const audio = new Audio(audioSrc);
      this.currentAudio = audio;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (this.currentAudio === audio) this.currentAudio = null;
        resolve();
      };
      const fallback = () => void this.playSynthesizedBugle(fallbackNotes).then(finish);
      audio.onended = finish;
      audio.onerror = fallback;
      audio.play().catch(fallback);
    });
  }

  private async playSynthesizedBugle(notes: number[]): Promise<void> {
    if (!this.ctx) return;
    let time = this.ctx.currentTime + 0.05;
    const duration = 0.28;
    for (const freq of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.2, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
      time += duration + 0.06;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, (time - this.ctx!.currentTime) * 1000)));
  }

  playCorrect() { this.playFeedback([587.33, 880], "sine", 0.35); this.vibrate([40, 30, 40]); }
  playWrong() { this.playFeedback([220, 180], "triangle", 0.4); this.vibrate(180); }

  private playFeedback(freqs: [number, number], type: OscillatorType, duration: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], now);
    osc.frequency.setValueAtTime(freqs[1], now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  }
}

export const soundEngine = new SoundEngine();
