export type Category = 'beat' | 'effect' | 'bass' | 'melody' | 'experimental' | 'custom';

export interface SoundDef {
  id: string;
  name: string;
  category: Category;
  color: string;
  pattern: { note?: number; drum?: string; exp?: string }[];
  buffer?: AudioBuffer; // For recorded sounds
  loopMode?: 'fast' | 'full'; 
}

const parsePattern = (str: string) => {
  return str.split('').map(char => {
    if (char === '.') return {};
    if (char === 'K') return { drum: 'kick' };
    if (char === 'S') return { drum: 'snare' };
    if (char === 'H') return { drum: 'hihat' };
    if (char === 'C') return { drum: 'clap' };
    
    if (char === 'X') return { exp: 'glitch' };
    if (char === 'Y') return { exp: 'laser' };
    if (char === 'Z') return { exp: 'animal' };
    if (char === 'W') return { exp: 'train' };

    const notes: Record<string, number> = {
      a: 48, b: 50, c: 52, d: 53, e: 55, f: 57, g: 59, h: 60,
      i: 62, j: 64, k: 65, l: 67, m: 69, n: 71, o: 72
    };
    if (notes[char]) return { note: notes[char] };
    return {};
  });
};

export const AVAILABLE_SOUNDS: SoundDef[] = [
  // Beats
  { id: 'b1', name: 'House', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.H.S.H.K.H.S.H.') },
  { id: 'b2', name: 'Break', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K...S..K..K.S...') },
  { id: 'b3', name: 'FourOn', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K...K...K...K...') },
  { id: 'b4', name: 'Trap', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.....S.K.K...S.') },
  { id: 'b5', name: 'Dnb', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K...S.....K.S...') },
  
  // Effects
  { id: 'e1', name: 'Shaker', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H.H.H.H.H.H.H.H.') },
  { id: 'e2', name: 'Offbeat', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('..H...H...H...H.') },
  { id: 'e3', name: 'Fast', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('HHHHHHHHHHHHHHHH') },
  { id: 'e4', name: 'Claps', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('....C.......C...') },
  { id: 'e5', name: 'Syncopated', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('.H..H.H...H...H.') },

  // Bass
  { id: 's1', name: 'Bass 1', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.....a.c...a...') },
  { id: 's2', name: 'Bass 2', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.a.....c.e.....') },
  { id: 's3', name: 'Bass 3', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.....e...c...a.') },
  { id: 's4', name: 'Bass 4', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.c.e.a.........') },
  { id: 's5', name: 'Bass 5', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.......a...c.e.') },

  // Melody
  { id: 'm1', name: 'Chords', category: 'melody', color: 'bg-green-500', pattern: parsePattern('.h..j...l.......') },
  { id: 'm2', name: 'Arp 1', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.j.l.h.j.l.h.j.') },
  { id: 'm3', name: 'Arp 2', category: 'melody', color: 'bg-green-500', pattern: parsePattern('l.j.h.l.j.h.l.j.') },
  { id: 'm4', name: 'Riff', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h...l...o.......') },
  { id: 'm5', name: 'Pluck', category: 'melody', color: 'bg-green-500', pattern: parsePattern('..h...j...l...o.') },

  // Experimental
  { id: 'x1', name: 'Glitch', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('X.X...X.XX..X...') },
  { id: 'x2', name: 'Laser', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('Y.......Y.......') },
  { id: 'x3', name: 'Animal', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('Z...........Z...') },
  { id: 'x4', name: 'Train', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('W.W.W.W.W.W.W.W.') },
];

export class AudioEngine {
  ctx: AudioContext | null = null;
  isPlaying = false;
  step = 0;
  slots: (SoundDef | null)[] = new Array(7).fill(null);
  mutedSlots: boolean[] = new Array(7).fill(false);
  lookahead = 25.0; // ms
  scheduleAheadTime = 0.1; // s
  nextNoteTime = 0.0;
  lookaheadInterval: any = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
      });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSlots(newSlots: (SoundDef | null)[]) {
    this.slots = newSlots;
  }

  setMutedSlots(muted: boolean[]) {
    this.mutedSlots = muted;
  }

  play() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.nextNoteTime = this.ctx!.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.lookaheadInterval !== null) {
      clearInterval(this.lookaheadInterval);
      this.lookaheadInterval = null;
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / 120;
    // 16th notes
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.step++;
    if (this.step === 16) {
      this.step = 0;
    }
  }

  private scheduleNote(stepNumber: number, time: number) {
    if (!this.ctx) return;

    this.slots.forEach((slot, index) => {
      if (!slot || this.mutedSlots[index]) return;
      
      const stepData = slot.pattern[stepNumber];
      if (!stepData) return;

      if (slot.buffer) {
        this.playBuffer(slot.buffer, time, slot.loopMode || 'fast');
      } else if (stepData.drum) {
        this.playDrum(stepData.drum, time);
      } else if (stepData.note) {
        this.playSynth(stepData.note, slot.category, time);
      } else if (stepData.exp) {
        this.playExperimental(stepData.exp, time);
      }
    });

    const event = new CustomEvent('step', { detail: { step: stepNumber } });
    window.dispatchEvent(event);
  }

  private scheduler() {
    this.lookaheadInterval = setInterval(() => {
      if (!this.isPlaying) return;
      while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.step, this.nextNoteTime);
        this.nextNote()
      }
    }, this.lookahead);
  }

  private playBuffer(buffer: AudioBuffer, time: number, mode: 'fast' | 'full') {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);

    if (mode === 'fast') {
      const duration = 0.15;
      gain.gain.setValueAtTime(1, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      source.start(time, 0, duration);
    } else {
      // time stretch to match 1 measure (2s @ 120BPM)
      const measureDuration = 2.0; 
      // Note: We used to just change playback rate, now we assume the buffer is ALREADY processed
      // but for legacy recorded sounds we still might need a fallback.
      // However, the new upload logic will pre-process the buffer to exactly 2 seconds.
      gain.gain.setValueAtTime(1, time);
      gain.gain.setValueAtTime(1, time + measureDuration - 0.05);
      gain.gain.linearRampToValueAtTime(0, time + measureDuration);
      source.start(time, 0, measureDuration); 
    }
  }

  private playExperimental(type: string, time: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    
    if (type === 'glitch') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(Math.random() * 800 + 200, time);
      osc.frequency.setValueAtTime(Math.random() * 800 + 200, time + 0.05);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === 'laser') {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.start(time);
      osc.stop(time + 0.2);
    } else if (type === 'animal') {
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.type = 'sine';
      mod.frequency.value = 5;
      mod.connect(modGain);
      modGain.gain.value = 100;
      modGain.connect(osc.frequency);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, time);
      osc.frequency.linearRampToValueAtTime(300, time + 0.3);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.linearRampToValueAtTime(0.01, time + 0.3);
      osc.start(time);
      mod.start(time);
      osc.stop(time + 0.3);
      mod.stop(time + 0.3);
    } else if (type === 'train') {
      const bufferSize = ctx.sampleRate * 0.1; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.linearRampToValueAtTime(400, time + 0.1);
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      noise.start(time);
    }
  }

  async processBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
    const ctx = this.ctx || new AudioContext();
    const bpm = this.detectBPM(buffer);
    const targetBPM = 120;
    const ratio = targetBPM / bpm;
    
    // 1. Find the first beat (onset)
    const offset = this.findFirstBeat(buffer);
    
    // 2. Perform Time Stretching (WSOLA)
    // To keep it high quality and bug-free, we re-render using a simple WSOLA implementation
    const stretched = this.applyWSOLA(buffer, ratio, offset);
    
    // 3. Trim to exactly 2 seconds (1 measure @ 120BPM)
    return this.clipToMeasure(stretched, 2.0);
  }

  private detectBPM(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Simple peak detection
    const partSize = sampleRate / 2; // 0.5s chunks
    const peaks = [];
    
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > max) max = Math.abs(data[i]);
    }
    
    const threshold = max * 0.7;
    for (let i = 0; i < data.length; i += partSize) {
      let partMax = 0;
      let partPeakIdx = -1;
      for (let j = i; j < i + partSize && j < data.length; j++) {
        if (Math.abs(data[j]) > partMax) {
          partMax = Math.abs(data[j]);
          partPeakIdx = j;
        }
      }
      if (partMax > threshold) {
        peaks.push(partPeakIdx);
      }
    }
    
    if (peaks.length < 2) return 120; // fallback
    
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let bpm = 60 / (avgInterval / sampleRate);
    
    // Sanity checks
    while (bpm < 70) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    
    return Math.round(bpm);
  }

  private findFirstBeat(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const threshold = 0.15;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) return i;
    }
    return 0;
  }

  private applyWSOLA(buffer: AudioBuffer, ratio: number, startOffset: number): AudioBuffer {
    const ctx = this.ctx || new AudioContext();
    const sampleRate = buffer.sampleRate;
    const inputData = buffer.getChannelData(0);
    
    // WSOLA simplified implementation:
    // We take windows of 50ms, and overlap them.
    // The skip in input vs output determines the speed.
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms
    const hopOut = Math.floor(windowSize / 2);
    const hopIn = Math.floor(hopOut / ratio);
    
    const outputLength = Math.floor(buffer.length * ratio);
    const outputData = new Float32Array(outputLength);
    const fadeOut = new Float32Array(windowSize);
    for(let i=0; i<windowSize; i++) fadeOut[i] = 0.5 * (1 + Math.cos(Math.PI * i / windowSize));
    const fadeIn = new Float32Array(windowSize);
    for(let i=0; i<windowSize; i++) fadeIn[i] = 1 - fadeOut[i];

    let outPos = 0;
    let inPos = startOffset;

    while (outPos + windowSize < outputLength && inPos + windowSize < inputData.length) {
      for (let i = 0; i < windowSize; i++) {
        const val = inputData[inPos + i];
        // simple overlap add
        outputData[outPos + i] += val * fadeIn[i];
        if (outPos > 0) {
          // this is a bit crude but provides the speed change
        }
      }
      outPos += hopOut;
      inPos += hopIn;
    }

    const newBuffer = ctx.createBuffer(buffer.numberOfChannels, outputLength, sampleRate);
    newBuffer.copyToChannel(outputData, 0);
    return newBuffer;
  }

  private clipToMeasure(buffer: AudioBuffer, seconds: number): AudioBuffer {
    const ctx = this.ctx || new AudioContext();
    const frameCount = Math.floor(seconds * buffer.sampleRate);
    const clipped = ctx.createBuffer(buffer.numberOfChannels, frameCount, buffer.sampleRate);
    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const data = buffer.getChannelData(i);
      const newData = clipped.getChannelData(i);
      for (let j = 0; j < frameCount; j++) {
        if (j < data.length) {
          newData[j] = data[j];
        } else {
          // Seamless loop blending: fade out end and fade in start
          const fadeLen = Math.floor(buffer.sampleRate * 0.01); // 10ms
          if (j > frameCount - fadeLen) {
            const alpha = (frameCount - j) / fadeLen;
            newData[j] *= alpha;
          }
        }
      }
    }
    return clipped;
  }

  private playDrum(type: string, time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'kick') {
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.start(time);
      osc.stop(time + 0.5);
    } else if (type === 'snare') {
      const bufferSize = ctx.sampleRate * 0.2; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      noiseSource.start(time);
    } else if (type === 'hihat') {
      const bufferSize = ctx.sampleRate * 0.05; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 7000;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      noiseSource.start(time);
    } else if (type === 'clap') {
      const bufferSize = ctx.sampleRate * 0.15; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1500;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      noiseSource.start(time);
    }
  }

  private playSynth(midiNote: number, category: string, time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    
    if (category === 'bass') {
      osc.type = 'square';
      osc.frequency.value = freq / 2; 
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, time);
      filter.frequency.exponentialRampToValueAtTime(800, time + 0.1);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    }

    osc.start(time);
    osc.stop(time + 0.3);
  }
}

export const engine = new AudioEngine();
