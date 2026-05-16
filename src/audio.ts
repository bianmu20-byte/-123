export type Category = 'beat' | 'effect' | 'bass' | 'melody' | 'experimental' | 'custom' | 'theme';

export interface FxParams {
  lpf: number; hpf: number; volume: number; sidechain: number;
  reverb: number; delay: number; pitch: number; panSwing: number;
  compressor: number; flanger: number;
}

export const defaultFx = (): FxParams => ({
  lpf: 100, hpf: 0, volume: 100, sidechain: 0,
  reverb: 0, delay: 0, pitch: 0, panSwing: 0,
  compressor: 0, flanger: 0,
});

export interface SoundDef {
  id: string;
  name: string;
  category: Category;
  color: string;
  pattern: { note?: number; drum?: string; exp?: string }[];
  buffer?: AudioBuffer; // For recorded sounds
  loopMode?: 'fast' | 'full';
  playMode?: 'pattern' | 'buffer'; // New: 'pattern' for sequenced notes, 'buffer' for direct audio playback
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
  { id: 'b6', name: 'Indie Kit', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K..HS...K.H.S.H.') },
  { id: 'b7', name: 'R&B Pocket', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K...S.H...K.S.H.') },
  { id: 'b8', name: 'Latin Pop', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.H.S.HHK.H.S.HH') },
  { id: 'b9', name: 'Cinematic', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.......S...K...') },
  { id: 'b10', name: 'Neo Soul', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K..H..S.H.K.S.H.') },
  { id: 'b11', name: 'EDM Drop', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.H.K.H.K.H.K.H.') },
  { id: 'b12', name: 'Hip Hop 90s', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K...S..H.K..S.H.') },
  { id: 'b13', name: 'Drill Hats', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.HHS.HHK.HHS.HH') },
  { id: 'b14', name: 'Dubstep Half', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.......S...K...') },
  { id: 'b15', name: 'Afro R&B', category: 'beat', color: 'bg-red-500', pattern: parsePattern('K.H..HS.K.H.S.H.') },
  
  // Effects
  { id: 'e1', name: 'Shaker', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H.H.H.H.H.H.H.H.') },
  { id: 'e2', name: 'Offbeat', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('..H...H...H...H.') },
  { id: 'e3', name: 'Fast', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('HHHHHHHHHHHHHHHH') },
  { id: 'e4', name: 'Claps', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('....C.......C...') },
  { id: 'e5', name: 'Syncopated', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('.H..H.H...H...H.') },
  { id: 'e6', name: 'Tambourine', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H..HH..HH..HH..H') },
  { id: 'e7', name: 'Studio Hats', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('..H.H...H.H...H.') },
  { id: 'e8', name: 'Air Clap', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('....C...H...C...') },
  { id: 'e9', name: 'Pulse Hats', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H...H.H.H...H.H.') },
  { id: 'e10', name: 'R&B Snap', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('..H.C...H...C...') },
  { id: 'e11', name: 'EDM Riser', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H.H.HHH.H.H.HHH.') },
  { id: 'e12', name: 'Hip Hop Hats', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('H..HH.H..H.HH.H.') },
  { id: 'e13', name: 'Triplet Hats', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('HH.HH.HH.HH.HH.H') },
  { id: 'e14', name: 'Dub Echo Hit', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('....C.......H...') },
  { id: 'e15', name: 'Club Perc', category: 'effect', color: 'bg-orange-500', pattern: parsePattern('.H.HC.H..H.HC.H.') },

  // Bass
  { id: 's1', name: 'Bass 1', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.....a.c...a...') },
  { id: 's2', name: 'Bass 2', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.a.....c.e.....') },
  { id: 's3', name: 'Bass 3', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.....e...c...a.') },
  { id: 's4', name: 'Bass 4', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.c.e.a.........') },
  { id: 's5', name: 'Bass 5', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.......a...c.e.') },
  { id: 's6', name: 'Sub Pulse', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a...a.c...e.c...') },
  { id: 's7', name: 'Funk Bass', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.c.a.e.c.a.e...') },
  { id: 's8', name: 'Warm Root', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.......c.......') },
  { id: 's9', name: 'Drive Bass', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.a.c.a.e.c.a...') },
  { id: 's10', name: '808 Slide', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a...a.e...c.e...') },
  { id: 's11', name: 'Dub Wobble', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.a.a...c.c.e...') },
  { id: 's12', name: 'EDM Saw Bass', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.c.e.c.a.c.e.c.') },
  { id: 's13', name: 'Moog Soul', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a..c.a..e.c.a...') },
  { id: 's14', name: 'Boom Bap Sub', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a.......a.c...e.') },
  { id: 's15', name: 'Afro Bass', category: 'bass', color: 'bg-blue-500', pattern: parsePattern('a..c..a.e..c.a..') },

  // Melody
  { id: 'm1', name: 'Chords', category: 'melody', color: 'bg-green-500', pattern: parsePattern('.h..j...l.......') },
  { id: 'm2', name: 'Arp 1', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.j.l.h.j.l.h.j.') },
  { id: 'm3', name: 'Arp 2', category: 'melody', color: 'bg-green-500', pattern: parsePattern('l.j.h.l.j.h.l.j.') },
  { id: 'm4', name: 'Riff', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h...l...o.......') },
  { id: 'm5', name: 'Pluck', category: 'melody', color: 'bg-green-500', pattern: parsePattern('..h...j...l...o.') },
  { id: 'm6', name: 'Piano Comp', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h...j.l...j.h...') },
  { id: 'm7', name: 'Synth Hook', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.j.l.o.l.j.h...') },
  { id: 'm8', name: 'Guitar Chop', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h..h.j..l..j.h..') },
  { id: 'm9', name: 'Bell Motif', category: 'melody', color: 'bg-green-500', pattern: parsePattern('o...l.j...h.j.l.') },
  { id: 'm10', name: 'Rhodes Keys', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h...j...l.j.h...') },
  { id: 'm11', name: 'EDM Pluck', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.j.l.o.h.j.l.o.') },
  { id: 'm12', name: 'Hip Hop Keys', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.....j...l.h...') },
  { id: 'm13', name: 'Drill Bells', category: 'melody', color: 'bg-green-500', pattern: parsePattern('o.l.j.o...l.j...') },
  { id: 'm14', name: 'Dub Stab', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h.......l...j...') },
  { id: 'm15', name: 'Vocal Pad', category: 'melody', color: 'bg-green-500', pattern: parsePattern('h...h...l...l...') },

  // Experimental
  { id: 'x1', name: 'Glitch', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('X.X...X.XX..X...') },
  { id: 'x2', name: 'Laser', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('Y.......Y.......') },
  { id: 'x3', name: 'Animal', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('Z...........Z...') },
  { id: 'x4', name: 'Train', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('W.W.W.W.W.W.W.W.') },
  { id: 'x5', name: 'Tape Stop', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('....Y.......Y...') },
  { id: 'x6', name: 'Digital Dust', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('X...X.....X.X...') },
  { id: 'x7', name: 'Reverse Hit', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('........W.......') },
  { id: 'x8', name: 'Bass Drop', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('Y.......X.......') },
  { id: 'x9', name: 'Vinyl Fill', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('X.....X.....X...') },
  { id: 'x10', name: 'Echo Throw', category: 'experimental', color: 'bg-fuchsia-500', pattern: parsePattern('....Y...Y.......') },

  // Theme (旋律组)
  { id: 't1', name: '前奏', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('a..c..e..g..a...') },
  { id: 't2', name: '主歌', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('a.c.e.g.a.c.e.a.') },
  { id: 't3', name: '副歌', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('c.e.g.c.e.g.c.e.') },
  { id: 't4', name: '间奏', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('g.e.c..a..c..e..') },
  { id: 't5', name: '尾奏', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('a.......a...a..a') },
  { id: 't6', name: '和声铺垫', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h..h..h..h..h..h') },
  { id: 't7', name: '主旋律 A', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h.j.l...o.l.j...') },
  { id: 't8', name: '主旋律 B', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('l.o.n.l.j.h.j...') },
  { id: 't9', name: '电影铺底', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h.......l.......') },
  { id: 't10', name: '流行副歌', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('c.e.g.h.g.e.c...') },
  { id: 't11', name: 'R&B 主歌', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h...j.l...h.j...') },
  { id: 't12', name: 'EDM Drop Hook', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h.l.o.l.h.l.o.l.') },
  { id: 't13', name: 'Hip Hop Loop', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h...l...j...h...') },
  { id: 't14', name: 'Dub Bass Hook', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('a.c.e...a.c.e...') },
  { id: 't15', name: 'Soul Chorus', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('h.j.l.h.o.l.j...') },
  { id: 't16', name: 'Club Lead', category: 'theme', color: 'bg-yellow-500', pattern: parsePattern('l.o.l.j.l.o.l.j.') },
];

// 4x4 Keyboard notes mapping (MIDI notes)
export const KEYBOARD_NOTES = [
  [60, 61, 62, 63], // C4, C#4, D4, D#4
  [64, 65, 66, 67], // E4, F4, F#4, G4
  [68, 69, 70, 71], // G#4, A4, A#4, B4
  [72, 73, 74, 75], // C5, C#5, D5, D#5
];

function createReverbBuffer(ctx: AudioContext) {
  const length = ctx.sampleRate * 2.0;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
    }
  }
  return buffer;
}

export class SlotChannel {
  input: GainNode;
  outGain: GainNode;

  lpf: BiquadFilterNode;
  hpf: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  panner: StereoPannerNode;
  pannerLFO: OscillatorNode;
  pannerGain: GainNode;

  delay: DelayNode;
  delayFeedback: GainNode;
  delayMix: GainNode;

  reverbMix: GainNode;
  convolver: ConvolverNode;

  sidechainGain: GainNode;
  sidechainLFO: OscillatorNode;
  scDepth: GainNode;

  flangerDelay: DelayNode;
  flangerMix: GainNode;
  flangerLFO: OscillatorNode;

  pitchShift: number = 0;

  constructor(ctx: AudioContext, masterOut: AudioNode) {
    this.input = ctx.createGain();
    this.comp = ctx.createDynamicsCompressor();
    this.lpf = ctx.createBiquadFilter(); this.lpf.type = 'lowpass'; this.lpf.frequency.value = 20000;
    this.hpf = ctx.createBiquadFilter(); this.hpf.type = 'highpass'; this.hpf.frequency.value = 10;
    
    // Flanger
    const flangerSplit = ctx.createGain();
    this.flangerDelay = ctx.createDelay(0.01); this.flangerDelay.delayTime.value = 0.003;
    this.flangerLFO = ctx.createOscillator(); this.flangerLFO.frequency.value = 0.5;
    const flangerDepth = ctx.createGain(); flangerDepth.gain.value = 0.002;
    this.flangerLFO.connect(flangerDepth);
    flangerDepth.connect(this.flangerDelay.delayTime);
    this.flangerMix = ctx.createGain(); this.flangerMix.gain.value = 0;
    this.flangerLFO.start();
    
    // Panner
    this.panner = ctx.createStereoPanner();
    this.pannerLFO = ctx.createOscillator(); this.pannerLFO.frequency.value = 0.5;
    this.pannerGain = ctx.createGain(); this.pannerGain.gain.value = 0;
    this.pannerLFO.connect(this.pannerGain);
    this.pannerGain.connect(this.panner.pan);
    this.pannerLFO.start();

    // Delay
    const delaySplit = ctx.createGain();
    this.delay = ctx.createDelay(1.0); this.delay.delayTime.value = 0.375;
    this.delayFeedback = ctx.createGain(); this.delayFeedback.gain.value = 0.4;
    this.delay.connect(this.delayFeedback); this.delayFeedback.connect(this.delay);
    this.delayMix = ctx.createGain(); this.delayMix.gain.value = 0;

    // Reverb
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createReverbBuffer(ctx);
    this.reverbMix = ctx.createGain(); this.reverbMix.gain.value = 0;

    // Sidechain
    this.sidechainGain = ctx.createGain();
    this.sidechainLFO = ctx.createOscillator(); this.sidechainLFO.frequency.value = 2; // 120bpm -> 2Hz
    this.scDepth = ctx.createGain(); this.scDepth.gain.value = 0;
    this.sidechainLFO.connect(this.scDepth);
    this.scDepth.connect(this.sidechainGain.gain);
    this.sidechainLFO.start();

    this.outGain = ctx.createGain();

    // Routing
    this.input.connect(this.comp);
    this.comp.connect(this.lpf);
    this.lpf.connect(this.hpf);
    this.hpf.connect(flangerSplit);

    flangerSplit.connect(this.panner);
    flangerSplit.connect(this.flangerDelay);
    this.flangerDelay.connect(this.flangerMix);
    this.flangerMix.connect(this.panner);

    this.panner.connect(delaySplit);

    delaySplit.connect(this.sidechainGain);
    delaySplit.connect(this.delay);
    this.delay.connect(this.delayMix);
    this.delayMix.connect(this.sidechainGain);
    
    delaySplit.connect(this.convolver);
    this.convolver.connect(this.reverbMix);
    this.reverbMix.connect(this.sidechainGain);

    this.sidechainGain.connect(this.outGain);
    this.outGain.connect(masterOut);
  }

  applyParams(p: FxParams) {
    const time = this.outGain.context.currentTime;
    this.outGain.gain.setTargetAtTime(p.volume / 100, time, 0.05);

    const lpfFreq = 200 * Math.pow(100, p.lpf / 100); 
    this.lpf.frequency.setTargetAtTime(lpfFreq, time, 0.05);

    const hpfFreq = 10 * Math.pow(500, p.hpf / 100);
    this.hpf.frequency.setTargetAtTime(hpfFreq, time, 0.05);

    this.comp.threshold.setTargetAtTime(-50 * (p.compressor / 100), time, 0.05);
    this.comp.ratio.setTargetAtTime(1 + 19 * (p.compressor / 100), time, 0.05);

    this.flangerMix.gain.setTargetAtTime(p.flanger / 100, time, 0.05);
    this.pannerGain.gain.setTargetAtTime(p.panSwing / 100, time, 0.05);
    this.delayMix.gain.setTargetAtTime(p.delay / 100, time, 0.05);
    this.reverbMix.gain.setTargetAtTime(p.reverb / 100, time, 0.05);
    
    this.scDepth.gain.setTargetAtTime(p.sidechain / 100, time, 0.05);
    this.pitchShift = p.pitch;
  }
}

export class ProjectEngine {
  ctx: AudioContext;
  id: string;
  isPlaying = false;
  step = 0;
  slots: (SoundDef | null)[] = new Array(7).fill(null);
  mutedSlots: boolean[] = new Array(7).fill(false);
  channels: SlotChannel[] = [];
  masterChannel: SlotChannel;
  lookahead = 25.0; // ms
  scheduleAheadTime = 0.1; // s
  nextNoteTime = 0.0;
  lookaheadInterval: any = null;

  constructor(id: string, ctx: AudioContext, masterOut: AudioNode) {
    this.id = id;
    this.ctx = ctx;
    this.masterChannel = new SlotChannel(this.ctx, masterOut);
    for (let i = 0; i < 7; i++) {
      this.channels.push(new SlotChannel(this.ctx, this.masterChannel.input));
    }
  }

  setFxParams(index: number, params: FxParams) {
    if (this.channels[index]) {
      this.channels[index].applyParams(params);
    }
  }

  setMasterFxParams(params: FxParams) {
    this.masterChannel.applyParams(params);
  }

  setSlots(newSlots: (SoundDef | null)[]) {
    this.slots = newSlots;
  }

  setMutedSlots(muted: boolean[]) {
    this.mutedSlots = muted;
  }

  play() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
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
    this.slots.forEach((slot, index) => {
      if (!slot || this.mutedSlots[index]) return;

      // Handle buffer mode (direct audio playback)
      if (slot.playMode === 'buffer' && slot.buffer) {
        // Only play buffer on step 0 to avoid overlapping
        if (stepNumber === 0) {
          this.playBufferDirect(slot.buffer, time, index);
        }
        return;
      }

      // Handle pattern mode (traditional sequenced playback)
      const stepData = slot.pattern[stepNumber];
      if (!stepData) return;

      if (slot.buffer) {
        this.playBuffer(slot.buffer, time, slot.loopMode || 'fast', index);
      } else if (stepData.drum) {
        this.playDrum(stepData.drum, time, index);
      } else if (stepData.note) {
        this.playSynth(stepData.note, slot.category, time, index);
      } else if (stepData.exp) {
        this.playExperimental(stepData.exp, time, index);
      }
    });

    const event = new CustomEvent('step', { detail: { projectId: this.id, step: stepNumber } });
    window.dispatchEvent(event);
  }

  private scheduler() {
    this.lookaheadInterval = setInterval(() => {
      if (!this.isPlaying) return;
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.step, this.nextNoteTime);
        this.nextNote()
      }
    }, this.lookahead);
  }

  private playBuffer(buffer: AudioBuffer, time: number, mode: 'fast' | 'full', channelIndex: number) {
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(this.channels[channelIndex].input);

    const shift = this.channels[channelIndex].pitchShift;
    const rateMultiplier = Math.pow(2, shift / 12);
    source.playbackRate.value = rateMultiplier;

    if (mode === 'fast') {
      const duration = 0.15;
      gain.gain.setValueAtTime(1, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      source.start(time, 0, duration * rateMultiplier);
    } else {
      const measureDuration = 2.0; 
      gain.gain.setValueAtTime(1, time);
      gain.gain.setValueAtTime(1, time + measureDuration - 0.05);
      gain.gain.linearRampToValueAtTime(0, time + measureDuration);
      source.start(time, 0, measureDuration * rateMultiplier); 
    }
  }

  private playBufferDirect(buffer: AudioBuffer, time: number, channelIndex: number) {
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(this.channels[channelIndex].input);

    const shift = this.channels[channelIndex].pitchShift;
    const rateMultiplier = Math.pow(2, shift / 12);
    source.playbackRate.value = rateMultiplier;

    // Play the entire buffer
    const duration = buffer.duration / rateMultiplier;
    gain.gain.setValueAtTime(1, time);
    gain.gain.setValueAtTime(1, time + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    source.start(time, 0, duration);
  }

  private playExperimental(type: string, time: number, channelIndex: number) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.connect(this.channels[channelIndex].input);
    const shift = this.channels[channelIndex].pitchShift;
    const rateMultiplier = Math.pow(2, shift / 12);
    
    if (type === 'glitch') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime((Math.random() * 800 + 200) * rateMultiplier, time);
      osc.frequency.setValueAtTime((Math.random() * 800 + 200) * rateMultiplier, time + 0.05);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === 'laser') {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000 * rateMultiplier, time);
      osc.frequency.exponentialRampToValueAtTime(100 * rateMultiplier, time + 0.2);
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
      mod.frequency.value = 5 * rateMultiplier;
      mod.connect(modGain);
      modGain.gain.value = 100 * rateMultiplier;
      modGain.connect(osc.frequency);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 * rateMultiplier, time);
      osc.frequency.linearRampToValueAtTime(300 * rateMultiplier, time + 0.3);
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
      filter.frequency.setValueAtTime(800 * rateMultiplier, time);
      filter.frequency.linearRampToValueAtTime(400 * rateMultiplier, time + 0.1);
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      noise.playbackRate.value = rateMultiplier;
      noise.start(time);
    }
  }

  private playDrum(type: string, time: number, channelIndex: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.channels[channelIndex].input);

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

  private playSynth(midiNote: number, category: string, time: number, channelIndex: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.channels[channelIndex].input);

    const shift = this.channels[channelIndex].pitchShift;
    const freq = 440 * Math.pow(2, (midiNote + shift - 69) / 12);
    
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

export class GlobalEngineManager {
  ctx: AudioContext | null = null;
  projects: Map<string, ProjectEngine> = new Map();

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

  getProject(id: string): ProjectEngine {
    this.init();
    if (!this.projects.has(id)) {
      const p = new ProjectEngine(id, this.ctx!, this.ctx!.destination);
      this.projects.set(id, p);
    }
    return this.projects.get(id)!;
  }

  async processBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
    this.init();
    const ctx = this.ctx!;
    const bpm = this.detectBPM(buffer);
    const targetBPM = 120;
    const ratio = targetBPM / bpm;
    
    const offset = this.findFirstBeat(buffer);
    const stretched = this.applyWSOLA(buffer, ratio, offset);
    return this.clipToMeasure(stretched, 2.0);
  }

  private detectBPM(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
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
    const ctx = this.ctx!;
    const sampleRate = buffer.sampleRate;
    const inputData = buffer.getChannelData(0);
    
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
        outputData[outPos + i] += val * fadeIn[i];
      }
      outPos += hopOut;
      inPos += hopIn;
    }

    const newBuffer = ctx.createBuffer(buffer.numberOfChannels, outputLength, sampleRate);
    newBuffer.copyToChannel(outputData, 0);
    return newBuffer;
  }

  private clipToMeasure(buffer: AudioBuffer, seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const frameCount = Math.floor(seconds * buffer.sampleRate);
    const clipped = ctx.createBuffer(buffer.numberOfChannels, frameCount, buffer.sampleRate);
    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const data = buffer.getChannelData(i);
      const newData = clipped.getChannelData(i);
      for (let j = 0; j < frameCount; j++) {
        if (j < data.length) {
          newData[j] = data[j];
        } else {
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
}

export const engineManager = new GlobalEngineManager();
