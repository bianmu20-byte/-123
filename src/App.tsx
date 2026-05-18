import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, UserCircle2, X, Mic, MicOff, Upload, Plus, Save, RotateCcw, Shuffle, Keyboard, Circle, Wand2, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AUDIO_STYLES, AVAILABLE_SOUNDS, AudioStyleId, SoundDef, engineManager, FxParams, defaultFx, KEYBOARD_NOTES } from './audio';
import { cn } from './lib/utils';

const KEYBOARD_INSTRUMENT_MODES = [
  { id: 'piano', name: 'Piano', color: 'bg-blue-500', waveform: 'sine' as OscillatorType },
  { id: 'synth', name: 'Synth', color: 'bg-purple-500', waveform: 'sawtooth' as OscillatorType },
  { id: 'bass', name: 'Bass', color: 'bg-cyan-500', waveform: 'square' as OscillatorType },
  { id: 'bell', name: 'Bell', color: 'bg-amber-500', waveform: 'triangle' as OscillatorType },
];

const KEYBOARD_PHYSICAL_KEYS = ['a','s','d','f','g','h','j','k','l','q','w','e','r','t','y','u'];
const KEYBOARD_NOTE_LABELS = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5','C#5','D5','D#5'];
const FLAT_KEYBOARD_NOTES = KEYBOARD_NOTES.flat();

interface TabData {
  id: string;
  name: string;
  slots: (SoundDef | null)[];
  mutedSlots: boolean[];
  fxSlots: FxParams[];
  masterFx: FxParams;
  styleId: AudioStyleId;
  isPlaying: boolean;
  activeStep: number;
}

interface StylePreset {
  id: string;
  name: string;
  slotIds: string[];
  accent: string;
  glow: string;
  panel: string;
  energy: number[];
  fxSlots: FxParams[];
  masterFx: FxParams;
}

type ColorMode = 'night' | 'day';

const makeFx = (overrides: Partial<FxParams> = {}): FxParams => ({
  ...defaultFx(),
  ...overrides,
});

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'neon',
    name: 'Neon Loop',
    slotIds: ['b1', 'e5', 's3', 't6', 't3', 'm5', 'x1'],
    accent: '#34d399',
    glow: 'rgba(52, 211, 153, 0.32)',
    panel: 'rgba(16, 185, 129, 0.08)',
    energy: [1, 0.36, 0.7, 0.42, 0.94, 0.38, 0.78, 0.44, 1, 0.34, 0.72, 0.4, 0.92, 0.36, 0.76, 0.48],
    fxSlots: [
      makeFx({ volume: 92, compressor: 32 }),
      makeFx({ hpf: 8, volume: 58, panSwing: 18 }),
      makeFx({ lpf: 62, volume: 86, sidechain: 30, compressor: 46 }),
      makeFx({ lpf: 55, volume: 46, sidechain: 22, reverb: 36 }),
      makeFx({ lpf: 72, volume: 54, delay: 12, reverb: 24 }),
      makeFx({ hpf: 12, volume: 48, delay: 34, panSwing: 30 }),
      makeFx({ hpf: 18, volume: 28, delay: 16, flanger: 26 }),
    ],
    masterFx: makeFx({ volume: 88, compressor: 18, reverb: 8 }),
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    slotIds: ['b3', 'e3', 's4', 'm2', 't4', 'e4', 'x2'],
    accent: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.3)',
    panel: 'rgba(37, 99, 235, 0.09)',
    energy: [1, 0.52, 0.82, 0.55, 1, 0.5, 0.85, 0.58, 1, 0.5, 0.82, 0.54, 1, 0.5, 0.9, 0.62],
    fxSlots: [
      makeFx({ volume: 96, compressor: 48 }),
      makeFx({ hpf: 18, volume: 42, panSwing: 10 }),
      makeFx({ lpf: 50, volume: 92, sidechain: 42, compressor: 58 }),
      makeFx({ lpf: 68, volume: 52, delay: 18 }),
      makeFx({ hpf: 8, lpf: 70, volume: 46, reverb: 20 }),
      makeFx({ hpf: 14, volume: 38, reverb: 12 }),
      makeFx({ hpf: 22, volume: 24, delay: 24, flanger: 34 }),
    ],
    masterFx: makeFx({ volume: 90, compressor: 30 }),
  },
  {
    id: 'dream',
    name: 'Dream Pop',
    slotIds: ['b2', 'e2', 's1', 'm1', 't6', 'm5', 'x3'],
    accent: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.3)',
    panel: 'rgba(219, 39, 119, 0.08)',
    energy: [0.8, 0.34, 0.62, 0.38, 0.72, 0.34, 0.64, 0.44, 0.78, 0.32, 0.58, 0.38, 0.68, 0.34, 0.62, 0.48],
    fxSlots: [
      makeFx({ volume: 72, compressor: 18 }),
      makeFx({ hpf: 12, volume: 36, panSwing: 28 }),
      makeFx({ lpf: 48, volume: 64, sidechain: 20 }),
      makeFx({ lpf: 58, volume: 54, reverb: 48, delay: 18 }),
      makeFx({ lpf: 42, volume: 50, sidechain: 18, reverb: 58 }),
      makeFx({ hpf: 20, volume: 44, delay: 42, panSwing: 44 }),
      makeFx({ hpf: 8, volume: 18, reverb: 35, flanger: 18 }),
    ],
    masterFx: makeFx({ volume: 82, reverb: 18, compressor: 12 }),
  },
  {
    id: 'breaks',
    name: 'Break Lab',
    slotIds: ['b2', 'e5', 's5', 'm4', 't2', 'e1', 'x1'],
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.28)',
    panel: 'rgba(234, 88, 12, 0.08)',
    energy: [1, 0.42, 0.68, 0.54, 0.88, 0.5, 0.76, 0.44, 0.94, 0.38, 0.82, 0.52, 0.9, 0.44, 0.72, 0.58],
    fxSlots: [
      makeFx({ volume: 94, compressor: 40 }),
      makeFx({ hpf: 10, volume: 54, panSwing: 24 }),
      makeFx({ lpf: 58, volume: 84, sidechain: 24, compressor: 36 }),
      makeFx({ lpf: 74, volume: 56, delay: 10 }),
      makeFx({ lpf: 66, volume: 50, reverb: 18 }),
      makeFx({ hpf: 18, volume: 38, panSwing: 36 }),
      makeFx({ hpf: 20, volume: 32, delay: 20, flanger: 24 }),
    ],
    masterFx: makeFx({ volume: 88, compressor: 24, reverb: 6 }),
  },
  {
    id: 'indie',
    name: 'Indie Band',
    slotIds: ['b6', 'e6', 's8', 'm8', 't7', 'm6', 'x7'],
    accent: '#a3e635',
    glow: 'rgba(163, 230, 53, 0.24)',
    panel: 'rgba(101, 163, 13, 0.08)',
    energy: [0.92, 0.4, 0.66, 0.5, 0.86, 0.36, 0.72, 0.48, 0.94, 0.38, 0.7, 0.46, 0.84, 0.4, 0.68, 0.52],
    fxSlots: [
      makeFx({ volume: 88, compressor: 34 }),
      makeFx({ hpf: 14, volume: 46, panSwing: 18 }),
      makeFx({ lpf: 58, volume: 78, compressor: 22 }),
      makeFx({ hpf: 10, lpf: 76, volume: 56, reverb: 14 }),
      makeFx({ lpf: 74, volume: 52, delay: 10, reverb: 18 }),
      makeFx({ lpf: 82, volume: 44, delay: 16 }),
      makeFx({ hpf: 22, volume: 16, reverb: 28 }),
    ],
    masterFx: makeFx({ volume: 86, compressor: 18, reverb: 6 }),
  },
  {
    id: 'rnb',
    name: 'R&B Studio',
    slotIds: ['b7', 'e7', 's7', 'm6', 't8', 'm9', 'x6'],
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.24)',
    panel: 'rgba(126, 34, 206, 0.08)',
    energy: [0.78, 0.34, 0.52, 0.44, 0.74, 0.36, 0.58, 0.5, 0.82, 0.32, 0.54, 0.42, 0.72, 0.34, 0.6, 0.48],
    fxSlots: [
      makeFx({ volume: 76, compressor: 18 }),
      makeFx({ hpf: 18, volume: 34, panSwing: 34 }),
      makeFx({ lpf: 50, volume: 76, sidechain: 12, compressor: 28 }),
      makeFx({ lpf: 66, volume: 50, reverb: 32, delay: 16 }),
      makeFx({ lpf: 72, volume: 48, delay: 22, reverb: 24 }),
      makeFx({ hpf: 20, volume: 34, delay: 40, panSwing: 38 }),
      makeFx({ hpf: 24, volume: 12, flanger: 12 }),
    ],
    masterFx: makeFx({ volume: 82, compressor: 14, reverb: 12 }),
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    slotIds: ['b9', 'e8', 's8', 't9', 'm9', 't5', 'x7'],
    accent: '#facc15',
    glow: 'rgba(250, 204, 21, 0.22)',
    panel: 'rgba(202, 138, 4, 0.08)',
    energy: [0.7, 0.24, 0.38, 0.28, 0.62, 0.24, 0.42, 0.32, 0.82, 0.26, 0.5, 0.34, 0.72, 0.24, 0.44, 0.4],
    fxSlots: [
      makeFx({ lpf: 62, volume: 64, compressor: 12, reverb: 20 }),
      makeFx({ hpf: 22, volume: 24, reverb: 30 }),
      makeFx({ lpf: 42, volume: 60, reverb: 24 }),
      makeFx({ lpf: 48, volume: 58, reverb: 68, delay: 18 }),
      makeFx({ hpf: 18, lpf: 70, volume: 36, delay: 44, reverb: 48 }),
      makeFx({ lpf: 60, volume: 38, reverb: 54 }),
      makeFx({ hpf: 18, volume: 20, delay: 30, reverb: 40 }),
    ],
    masterFx: makeFx({ volume: 78, reverb: 26, compressor: 10 }),
  },
  {
    id: 'latin',
    name: 'Latin Pop',
    slotIds: ['b8', 'e6', 's7', 'm8', 't10', 'e9', 'x5'],
    accent: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.24)',
    panel: 'rgba(225, 29, 72, 0.08)',
    energy: [0.96, 0.48, 0.7, 0.58, 0.9, 0.5, 0.76, 0.56, 0.98, 0.46, 0.72, 0.58, 0.88, 0.48, 0.74, 0.62],
    fxSlots: [
      makeFx({ volume: 88, compressor: 26 }),
      makeFx({ hpf: 16, volume: 48, panSwing: 30 }),
      makeFx({ lpf: 56, volume: 74, compressor: 22 }),
      makeFx({ hpf: 12, lpf: 78, volume: 50, reverb: 18 }),
      makeFx({ lpf: 78, volume: 52, delay: 14, reverb: 16 }),
      makeFx({ hpf: 20, volume: 34, panSwing: 48 }),
      makeFx({ hpf: 16, volume: 18, delay: 18, flanger: 16 }),
    ],
    masterFx: makeFx({ volume: 86, compressor: 18, reverb: 8 }),
  },
  {
    id: 'neo-soul',
    name: 'Neo Soul R&B',
    slotIds: ['b10', 'e10', 's13', 'm10', 't11', 'm15', 'x9'],
    accent: '#d8b4fe',
    glow: 'rgba(216, 180, 254, 0.22)',
    panel: 'rgba(147, 51, 234, 0.07)',
    energy: [0.74, 0.3, 0.5, 0.42, 0.7, 0.34, 0.58, 0.46, 0.78, 0.32, 0.52, 0.42, 0.68, 0.34, 0.56, 0.48],
    fxSlots: [
      makeFx({ volume: 72, compressor: 16, reverb: 8 }),
      makeFx({ hpf: 16, volume: 30, panSwing: 42 }),
      makeFx({ lpf: 44, volume: 76, compressor: 24, sidechain: 8 }),
      makeFx({ lpf: 58, volume: 52, reverb: 42, delay: 18 }),
      makeFx({ lpf: 70, volume: 46, reverb: 30, delay: 22 }),
      makeFx({ lpf: 46, volume: 34, reverb: 56 }),
      makeFx({ hpf: 20, volume: 12, delay: 20, flanger: 10 }),
    ],
    masterFx: makeFx({ volume: 80, compressor: 12, reverb: 14 }),
  },
  {
    id: 'edm',
    name: 'EDM Festival',
    slotIds: ['b11', 'e11', 's12', 'm11', 't12', 't16', 'x8'],
    accent: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.24)',
    panel: 'rgba(8, 145, 178, 0.08)',
    energy: [1, 0.54, 0.9, 0.58, 1, 0.56, 0.94, 0.62, 1, 0.54, 0.92, 0.58, 1, 0.56, 0.96, 0.66],
    fxSlots: [
      makeFx({ volume: 94, compressor: 42 }),
      makeFx({ hpf: 18, volume: 40, panSwing: 12 }),
      makeFx({ lpf: 72, volume: 86, sidechain: 58, compressor: 52 }),
      makeFx({ hpf: 8, lpf: 82, volume: 54, delay: 18 }),
      makeFx({ lpf: 88, volume: 58, sidechain: 34, delay: 18, reverb: 16 }),
      makeFx({ hpf: 10, volume: 42, delay: 32, panSwing: 30 }),
      makeFx({ hpf: 20, volume: 26, delay: 22, flanger: 28 }),
    ],
    masterFx: makeFx({ volume: 88, compressor: 34, reverb: 6 }),
  },
  {
    id: 'hiphop',
    name: 'Hip Hop Tape',
    slotIds: ['b12', 'e12', 's14', 'm12', 't13', 'm10', 'x9'],
    accent: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.22)',
    panel: 'rgba(180, 83, 9, 0.07)',
    energy: [0.9, 0.32, 0.62, 0.42, 0.84, 0.34, 0.58, 0.48, 0.9, 0.3, 0.64, 0.4, 0.82, 0.34, 0.6, 0.5],
    fxSlots: [
      makeFx({ volume: 86, compressor: 34 }),
      makeFx({ hpf: 16, volume: 38, panSwing: 20 }),
      makeFx({ lpf: 40, volume: 82, compressor: 28 }),
      makeFx({ lpf: 56, volume: 44, reverb: 24 }),
      makeFx({ lpf: 68, volume: 46, delay: 14, reverb: 16 }),
      makeFx({ hpf: 8, lpf: 60, volume: 32, reverb: 28 }),
      makeFx({ hpf: 14, volume: 20, delay: 18, flanger: 8 }),
    ],
    masterFx: makeFx({ volume: 84, compressor: 24, reverb: 8 }),
  },
  {
    id: 'drill',
    name: 'Drill Bells',
    slotIds: ['b13', 'e13', 's10', 'm13', 't13', 'e12', 'x5'],
    accent: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.24)',
    panel: 'rgba(67, 56, 202, 0.08)',
    energy: [0.88, 0.42, 0.68, 0.48, 0.9, 0.42, 0.72, 0.52, 0.92, 0.44, 0.7, 0.5, 0.86, 0.42, 0.74, 0.56],
    fxSlots: [
      makeFx({ volume: 84, compressor: 30 }),
      makeFx({ hpf: 20, volume: 34, panSwing: 34 }),
      makeFx({ lpf: 46, volume: 86, sidechain: 10, pitch: -2, compressor: 34 }),
      makeFx({ hpf: 14, lpf: 62, volume: 48, delay: 30, reverb: 22 }),
      makeFx({ hpf: 8, lpf: 70, volume: 42, delay: 18 }),
      makeFx({ hpf: 18, volume: 26, panSwing: 42 }),
      makeFx({ hpf: 16, volume: 16, delay: 24, flanger: 18 }),
    ],
    masterFx: makeFx({ volume: 82, compressor: 22, reverb: 10 }),
  },
  {
    id: 'dub-bass',
    name: 'Echo Bass',
    slotIds: ['b14', 'e14', 's11', 'm14', 't14', 'e9', 'x10'],
    accent: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.24)',
    panel: 'rgba(13, 148, 136, 0.08)',
    energy: [0.96, 0.3, 0.54, 0.36, 0.78, 0.3, 0.58, 0.42, 0.96, 0.32, 0.56, 0.38, 0.84, 0.3, 0.62, 0.46],
    fxSlots: [
      makeFx({ lpf: 66, volume: 80, compressor: 24, reverb: 10 }),
      makeFx({ hpf: 18, volume: 26, delay: 44, reverb: 18 }),
      makeFx({ lpf: 38, volume: 90, sidechain: 22, flanger: 20, compressor: 36 }),
      makeFx({ hpf: 12, lpf: 54, volume: 40, delay: 56, reverb: 30 }),
      makeFx({ lpf: 46, volume: 50, sidechain: 18, flanger: 18 }),
      makeFx({ hpf: 22, volume: 24, panSwing: 46 }),
      makeFx({ hpf: 16, volume: 20, delay: 60, reverb: 26 }),
    ],
    masterFx: makeFx({ volume: 82, compressor: 20, reverb: 16 }),
  },
  {
    id: 'afro-rnb',
    name: 'Afro R&B',
    slotIds: ['b15', 'e15', 's15', 'm8', 't15', 'm15', 'x6'],
    accent: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.22)',
    panel: 'rgba(194, 65, 12, 0.08)',
    energy: [0.94, 0.46, 0.7, 0.54, 0.88, 0.48, 0.76, 0.58, 0.96, 0.44, 0.72, 0.54, 0.86, 0.48, 0.78, 0.6],
    fxSlots: [
      makeFx({ volume: 84, compressor: 22 }),
      makeFx({ hpf: 16, volume: 42, panSwing: 36 }),
      makeFx({ lpf: 54, volume: 78, compressor: 22 }),
      makeFx({ hpf: 10, lpf: 78, volume: 48, reverb: 16 }),
      makeFx({ lpf: 72, volume: 50, delay: 16, reverb: 18 }),
      makeFx({ lpf: 48, volume: 34, reverb: 44 }),
      makeFx({ hpf: 18, volume: 14, delay: 16, flanger: 12 }),
    ],
    masterFx: makeFx({ volume: 84, compressor: 18, reverb: 8 }),
  },
];

const STORAGE_KEY = 'codex-music-workbench-v1';
const COLOR_MODE_STORAGE_KEY = 'codex-music-workbench-color-mode';

const findSound = (id: string) => AVAILABLE_SOUNDS.find((sound) => sound.id === id) ?? null;

const audioStyleForPreset = (presetId: string): AudioStyleId => {
  if (['warehouse', 'edm'].includes(presetId)) return 'club';
  if (['breaks', 'dub-bass'].includes(presetId)) return 'techno';
  if (['dream', 'cinematic'].includes(presetId)) return 'synthwave';
  if (['hiphop', 'drill'].includes(presetId)) return 'trap';
  if (['indie', 'rnb', 'neo-soul', 'afro-rnb', 'latin'].includes(presetId)) return 'piano';
  return 'default';
};

const createStyleTab = (preset: StylePreset, id = 'tab-1', styleId: AudioStyleId = audioStyleForPreset(preset.id)): TabData => {
  const slots = preset.slotIds.map(findSound);

  return {
    id,
    name: preset.name,
    slots,
    mutedSlots: new Array(7).fill(false),
    fxSlots: preset.fxSlots,
    masterFx: preset.masterFx,
    styleId,
    isPlaying: false,
    activeStep: 0
  };
};

const createCodexSongTab = (): TabData => createStyleTab(STYLE_PRESETS[0]);

const hydrateColorMode = (): ColorMode => {
  if (typeof window === 'undefined') return 'night';
  return window.localStorage.getItem(COLOR_MODE_STORAGE_KEY) === 'day' ? 'day' : 'night';
};

const hydrateSavedTabs = (): { tabs: TabData[]; styleId: string } | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as {
      styleId?: string;
      tabs?: Array<Omit<TabData, 'slots'> & { slotIds: Array<string | null> }>;
    };
    const tabs = saved.tabs?.map((tab) => ({
      ...tab,
      slots: tab.slotIds.map((id) => id ? findSound(id) : null),
      styleId: tab.styleId ?? 'default',
      isPlaying: false,
      activeStep: 0,
    }));

    if (!tabs?.length) return null;
    return { tabs, styleId: saved.styleId ?? STYLE_PRESETS[0].id };
  } catch {
    return null;
  }
};

export default function App() {
  const [initialWorkbench] = useState(hydrateSavedTabs);
  const [tabs, setTabs] = useState<TabData[]>(() => initialWorkbench?.tabs ?? [createCodexSongTab()]);
  const [selectedStyleId, setSelectedStyleId] = useState(initialWorkbench?.styleId ?? STYLE_PRESETS[0].id);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'loaded'>('idle');
  const [colorMode, setColorMode] = useState<ColorMode>(hydrateColorMode);
  
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const activeStyle = STYLE_PRESETS.find((style) => style.id === selectedStyleId) ?? STYLE_PRESETS[0];
  const beatEnergy = activeTab.isPlaying ? activeStyle.energy[activeTab.activeStep] ?? 0.5 : 0;
  const downbeat = activeTab.activeStep % 4 === 0;
  const sweepPosition = `${(activeTab.activeStep / 15) * 100}%`;

  const [hoveredFxSlot, setHoveredFxSlot] = useState<number | null>(null);
  const fxTimeoutRef = useRef<NodeJS.Timeout>();

  const [hoveredTabFxId, setHoveredTabFxId] = useState<string | null>(null);
  const tabFxTimeoutRef = useRef<NodeJS.Timeout>();

  // Recording & Upload states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState<SoundDef[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard states
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isRecordingKeyboard, setIsRecordingKeyboard] = useState(false);
  const [keyboardInstrumentMode, setKeyboardInstrumentMode] = useState(KEYBOARD_INSTRUMENT_MODES[0].id);
  const [recordedNotes, setRecordedNotes] = useState<{time: number, note: number}[]>([]);
  const [pressedKeyboardNotes, setPressedKeyboardNotes] = useState<number[]>([]);
  const pressedKeyboardKeysRef = useRef<Set<number>>(new Set());
  const recordStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleStep = (e: any) => {
      const { projectId, step } = e.detail;
      setTabs(prev => prev.map(t => t.id === projectId ? { ...t, activeStep: step } : t));
    };
    window.addEventListener('step', handleStep);
    return () => window.removeEventListener('step', handleStep);
  }, []);

  useEffect(() => {
    const initialTab = tabs[0];
    const engine = engineManager.getProject(initialTab.id);
    engine.setSlots(initialTab.slots);
    engine.setMutedSlots(initialTab.mutedSlots);
    initialTab.fxSlots.forEach((fx, index) => engine.setFxParams(index, fx));
    engine.setMasterFxParams(initialTab.masterFx);
  }, []);

  useEffect(() => {
    setSaveStatus('idle');
  }, [tabs, selectedStyleId]);

  useEffect(() => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (!isKeyboardVisible) return;

    const handleKeydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const index = KEYBOARD_PHYSICAL_KEYS.indexOf(key);
      if (index !== -1) {
        e.preventDefault();
        const note = FLAT_KEYBOARD_NOTES[index];
        if (!pressedKeyboardKeysRef.current.has(note)) {
          pressedKeyboardKeysRef.current.add(note);
          setPressedKeyboardNotes(Array.from(pressedKeyboardKeysRef.current));
          handleKeyboardKeyPress(note);
        }
      }
    };

    const handleKeyup = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const index = KEYBOARD_PHYSICAL_KEYS.indexOf(key);
      if (index !== -1) {
        const note = FLAT_KEYBOARD_NOTES[index];
        if (pressedKeyboardKeysRef.current.delete(note)) {
          setPressedKeyboardNotes(Array.from(pressedKeyboardKeysRef.current));
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
      pressedKeyboardKeysRef.current.clear();
      setPressedKeyboardNotes([]);
    };
  }, [isKeyboardVisible, isRecordingKeyboard]);

  const syncProjectEngine = (tab: TabData) => {
    const engine = engineManager.getProject(tab.id);
    engine.setStyle(tab.styleId);
    engine.setSlots(tab.slots);
    engine.setMutedSlots(tab.mutedSlots);
    tab.fxSlots.forEach((fx, index) => engine.setFxParams(index, fx));
    engine.setMasterFxParams(tab.masterFx);
  };

  const persistWorkbench = (nextTabs = tabs, styleId = selectedStyleId) => {
    const payload = {
      styleId,
      tabs: nextTabs.map((tab) => ({
        ...tab,
        slotIds: tab.slots.map((slot) => slot?.id ?? null),
        slots: undefined,
        isPlaying: false,
        activeStep: 0,
      })),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSaveStatus('saved');
  };

  const loadWorkbench = () => {
    const saved = hydrateSavedTabs();
    if (!saved) return;
    setTabs(saved.tabs);
    setSelectedStyleId(saved.styleId);
    setActiveTabId(saved.tabs[0].id);
    saved.tabs.forEach(syncProjectEngine);
    setSaveStatus('loaded');
  };

  const applyStylePreset = (styleId: string) => {
    const preset = STYLE_PRESETS.find((style) => style.id === styleId) ?? STYLE_PRESETS[0];
    const styledTab = createStyleTab(preset, activeTab.id, activeTab.styleId);
    const nextTab = {
      ...styledTab,
      name: preset.name,
      isPlaying: activeTab.isPlaying,
      activeStep: activeTab.activeStep,
    };
    setSelectedStyleId(styleId);
    setTabs(prev => prev.map(t => t.id === activeTab.id ? nextTab : t));
    syncProjectEngine(nextTab);
  };

  const shuffleActiveTab = () => {
    const pick = (category: string) => {
      const pool = AVAILABLE_SOUNDS.filter(sound => sound.category === category);
      return pool[Math.floor(Math.random() * pool.length)] ?? null;
    };
    const nextSlots = [
      pick('beat'),
      pick('effect'),
      pick('bass'),
      pick('melody'),
      pick('theme'),
      pick('effect'),
      pick('experimental'),
    ];
    const nextFx = activeStyle.fxSlots.map((fx) => makeFx({
      ...fx,
      volume: Math.max(22, Math.min(100, fx.volume + Math.round(Math.random() * 16 - 8))),
      panSwing: Math.max(0, Math.min(55, fx.panSwing + Math.round(Math.random() * 18))),
      delay: Math.max(0, Math.min(48, fx.delay + Math.round(Math.random() * 12 - 3))),
    }));
    const nextTab = {
      ...activeTab,
      name: `${activeStyle.name} Sketch`,
      slots: nextSlots,
      fxSlots: nextFx,
      masterFx: activeStyle.masterFx,
    };
    setTabs(prev => prev.map(t => t.id === activeTab.id ? nextTab : t));
    syncProjectEngine(nextTab);
  };

  const resetWorkbench = () => {
    const fresh = createCodexSongTab();
    setTabs([fresh]);
    setActiveTabId(fresh.id);
    setSelectedStyleId(STYLE_PRESETS[0].id);
    syncProjectEngine(fresh);
    window.localStorage.removeItem(STORAGE_KEY);
    setSaveStatus('idle');
  };

  const addNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TabData = {
      ...createStyleTab(activeStyle, newId),
      name: `${activeStyle.name} ${tabs.length + 1}`,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    syncProjectEngine(newTab);
  };

  const togglePlayTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const engine = engineManager.getProject(id);
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    engine.setStyle(tab.styleId);
    
    if (!tab.isPlaying) {
      engine.play();
      setTabs(prev => prev.map(t => t.id === id ? { ...t, isPlaying: true } : t));
    } else {
      engine.stop();
      setTabs(prev => prev.map(t => t.id === id ? { ...t, isPlaying: false, activeStep: 0 } : t));
    }
  };

  const handleModuleMouseEnter = (index: number) => {
    if (activeTab.slots[index]) {
      clearTimeout(fxTimeoutRef.current);
      clearTimeout(tabFxTimeoutRef.current);
      setHoveredTabFxId(null);
      setHoveredFxSlot(index);
    }
  };

  const handleModuleMouseLeave = () => {
    fxTimeoutRef.current = setTimeout(() => setHoveredFxSlot(null), 300);
  };

  const handleTabMouseEnter = (id: string) => {
    clearTimeout(tabFxTimeoutRef.current);
    clearTimeout(fxTimeoutRef.current);
    setHoveredFxSlot(null);
    setHoveredTabFxId(id);
  };

  const handleTabMouseLeave = () => {
    tabFxTimeoutRef.current = setTimeout(() => setHoveredTabFxId(null), 300);
  };

  const handleFxChange = (key: keyof FxParams, value: number) => {
    if (hoveredFxSlot === null) return;
    
    const newFx = [...activeTab.fxSlots];
    newFx[hoveredFxSlot] = { ...newFx[hoveredFxSlot], [key]: value };
    
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, fxSlots: newFx } : t));
    engineManager.getProject(activeTab.id).setFxParams(hoveredFxSlot, newFx[hoveredFxSlot]);
  };

  const handleMasterFxChange = (key: keyof FxParams, value: number) => {
    if (!hoveredTabFxId) return;
    
    setTabs(prev => prev.map(t => {
      if (t.id === hoveredTabFxId) {
        const newFx = { ...t.masterFx, [key]: value };
        engineManager.getProject(hoveredTabFxId).setMasterFxParams(newFx);
        return { ...t, masterFx: newFx };
      }
      return t;
    }));
  };

  const handleResetFx = () => {
    if (hoveredFxSlot === null) return;
    const resetValues = defaultFx();
    const newFx = [...activeTab.fxSlots];
    newFx[hoveredFxSlot] = resetValues;
    
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, fxSlots: newFx } : t));
    engineManager.getProject(activeTab.id).setFxParams(hoveredFxSlot, resetValues);
  };

  const handleResetMasterFx = () => {
    if (!hoveredTabFxId) return;
    const resetValues = defaultFx();
    
    setTabs(prev => prev.map(t => {
      if (t.id === hoveredTabFxId) {
        engineManager.getProject(hoveredTabFxId).setMasterFxParams(resetValues);
        return { ...t, masterFx: resetValues };
      }
      return t;
    }));
  };

  const handleStyleChange = (styleId: AudioStyleId) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, styleId } : t));
    engineManager.getProject(activeTab.id).setStyle(styleId);
  };

  const toggleMute = (index: number) => {
    if (!activeTab.slots[index]) return;
    const newMuted = [...activeTab.mutedSlots];
    newMuted[index] = !newMuted[index];
    
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, mutedSlots: newMuted } : t));
    engineManager.getProject(activeTab.id).setMutedSlots(newMuted);
  };

  const handleDragStart = (e: React.DragEvent, item: SoundDef) => {
    const cleanItem = { ...item, buffer: undefined }; 
    e.dataTransfer.setData('application/json', JSON.stringify(cleanItem));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const itemData = JSON.parse(data) as SoundDef;
      
      let item = AVAILABLE_SOUNDS.find(s => s.id === itemData.id) || recordedSounds.find(s => s.id === itemData.id);
      
      if (!item) return;

      const newSlots = [...activeTab.slots];
      newSlots[slotIndex] = item;
      
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, slots: newSlots } : t));
      const engine = engineManager.getProject(activeTab.id);
      engine.setStyle(activeTab.styleId);
      engine.setSlots(newSlots);
      
      if (!activeTab.isPlaying) {
         engine.play();
         setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, isPlaying: true } : t));
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleClearSlot = (index: number) => {
    const newSlots = [...activeTab.slots];
    newSlots[index] = null;
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, slots: newSlots } : t));
    engineManager.getProject(activeTab.id).setSlots(newSlots);
  };

  const toggleLoopMode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecordedSounds(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newMode = s.loopMode === 'fast' ? 'full' : 'fast';
      return {
        ...s,
        loopMode: newMode,
        pattern: newMode === 'fast' ? new Array(16).fill({ note: 1 }) : [{ note: 1 }, ...new Array(15).fill({})]
      };
    }));
    
    // Update active slots
    const newSlots = activeTab.slots.map(slot => {
      if (slot && slot.id === id) {
        const newMode = slot.loopMode === 'fast' ? 'full' : 'fast';
        return {
          ...slot,
          loopMode: newMode,
          pattern: newMode === 'fast' ? new Array(16).fill({ note: 1 }) : [{ note: 1 }, ...new Array(15).fill({})]
        };
      }
      return slot;
    });
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, slots: newSlots } : t));
    engineManager.getProject(activeTab.id).setSlots(newSlots);
  };

  // Recording & Upload Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        engineManager.init();
        if (engineManager.ctx) {
          try {
            const rawBuffer = await engineManager.ctx.decodeAudioData(arrayBuffer);
            const processedBuffer = await engineManager.processBuffer(rawBuffer);
            
            const newSound: SoundDef = {
              id: `rec-${Date.now()}`,
              name: `Voice Rec ${recordedSounds.filter(s => s.id.startsWith('rec-')).length + 1}`,
              category: 'custom',
              color: 'bg-pink-500',
              pattern: [], // Empty pattern for buffer mode
              buffer: processedBuffer,
              loopMode: 'full',
              playMode: 'buffer' // Use buffer mode for direct audio playback
            };
            setRecordedSounds(prev => [...prev, newSound]);
          } catch (err) {
            console.error('Recording process error:', err);
          }
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      engineManager.init();
      if (engineManager.ctx) {
        const rawBuffer = await engineManager.ctx.decodeAudioData(arrayBuffer);
        const processedBuffer = await engineManager.processBuffer(rawBuffer);
        
        const newSound: SoundDef = {
          id: `upload-${Date.now()}`,
          name: file.name.substring(0, 10),
          category: 'custom',
          color: 'bg-teal-500',
          pattern: [{ note: 1 }, ...new Array(15).fill({})],
          buffer: processedBuffer,
          loopMode: 'full'
        };
        setRecordedSounds(prev => [...prev, newSound]);
      }
    } catch (err) {
      console.error('File upload error:', err);
    }
    event.target.value = '';
  };

  // Keyboard functions
  const playKeyboardNote = (note: number) => {
    engineManager.init();
    if (!engineManager.ctx) return;

    const instrument = KEYBOARD_INSTRUMENT_MODES.find(i => i.id === keyboardInstrumentMode) ?? KEYBOARD_INSTRUMENT_MODES[0];
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    const now = engineManager.ctx.currentTime;

    const gain = engineManager.ctx.createGain();
    const filter = engineManager.ctx.createBiquadFilter();
    const master = engineManager.ctx.createGain();

    let mainInput: AudioNode;
    const osc = engineManager.ctx.createOscillator();
    osc.type = instrument.waveform;
    osc.frequency.value = frequency * (instrument.id === 'bass' ? 0.5 : 1);

    if (instrument.id === 'synth') {
      const osc2 = engineManager.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.value = frequency * 1.01;
      const mix = engineManager.ctx.createGain();
      mix.gain.value = 0.5;
      osc.connect(mix);
      osc2.connect(mix);
      mainInput = mix;
      osc2.start(now);
      osc2.stop(now + 0.35);
    } else if (instrument.id === 'bell') {
      const mod = engineManager.ctx.createOscillator();
      mod.type = 'triangle';
      mod.frequency.value = 220;
      const modGain = engineManager.ctx.createGain();
      modGain.gain.value = 40;
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      mainInput = osc;
      mod.start(now);
      mod.stop(now + 0.5);
    } else {
      mainInput = osc;
    }

    if (instrument.id === 'bass') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(1.5, now);
      gain.gain.setValueAtTime(0.35, now);
    } else if (instrument.id === 'bell') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.8, now);
      gain.gain.setValueAtTime(0.18, now);
    } else if (instrument.id === 'synth') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(1.2, now);
      gain.gain.setValueAtTime(0.22, now);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.Q.setValueAtTime(0.8, now);
      gain.gain.setValueAtTime(0.2, now);
    }

    mainInput.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    master.connect(engineManager.ctx.destination);

    const release = instrument.id === 'bell' ? 0.6 : instrument.id === 'bass' ? 0.5 : 0.35;
    gain.gain.setTargetAtTime(0.0001, now + 0.02, 0.08);
    master.gain.setValueAtTime(1, now);

    osc.start(now);
    osc.stop(now + release);

    if (instrument.id === 'synth') {
      // synth second oscillator is stopped above
    }
  };

  const startKeyboardRecording = () => {
    setIsRecordingKeyboard(true);
    setRecordedNotes([]);
    recordStartTimeRef.current = Date.now();
  };

  const stopKeyboardRecording = () => {
    setIsRecordingKeyboard(false);
    if (recordedNotes.length > 0) {
      const totalDuration = Math.max(1, Date.now() - recordStartTimeRef.current);
      const stepDuration = totalDuration / 16;
      const stepNotes = new Array<Set<number>>(16).fill(null).map(() => new Set<number>());

      recordedNotes.forEach(({ time, note }) => {
        const step = Math.min(15, Math.max(0, Math.floor((time - recordStartTimeRef.current) / stepDuration)));
        stepNotes[step].add(note);
      });

      const pattern = stepNotes.map((notes) => {
        if (notes.size === 0) return {};
        const values = Array.from(notes).sort((a, b) => a - b);
        return { note: values.length === 1 ? values[0] : values };
      });

      const instrument = KEYBOARD_INSTRUMENT_MODES.find(i => i.id === keyboardInstrumentMode) ?? KEYBOARD_INSTRUMENT_MODES[0];
      const newSound: SoundDef = {
        id: `keyboard-${Date.now()}`,
        name: `${instrument.name} Seq ${recordedSounds.filter(s => s.id.startsWith('keyboard-')).length + 1}`,
        category: 'custom',
        color: instrument.color,
        pattern,
        loopMode: 'full'
      };

      setRecordedSounds(prev => [...prev, newSound]);
    }
  };

  const handleKeyboardNoteDown = (note: number) => {
    if (!pressedKeyboardKeysRef.current.has(note)) {
      pressedKeyboardKeysRef.current.add(note);
      setPressedKeyboardNotes(Array.from(pressedKeyboardKeysRef.current));
      handleKeyboardKeyPress(note);
    }
  };

  const handleKeyboardNoteUp = (note: number) => {
    if (pressedKeyboardKeysRef.current.delete(note)) {
      setPressedKeyboardNotes(Array.from(pressedKeyboardKeysRef.current));
    }
  };

  const handleKeyboardKeyPress = (note: number) => {
    playKeyboardNote(note);
    if (isRecordingKeyboard) {
      setRecordedNotes(prev => [...prev, { time: Date.now(), note }]);
    }
  };

  const categories = [
    { id: 'beat', name: 'Beats' },
    { id: 'effect', name: 'Effects' },
    { id: 'melody', name: 'Melodies' },
    { id: 'bass', name: 'Basses' },
    { id: 'experimental', name: 'Experimental' },
    { id: 'theme', name: '旋律组' },
    { id: 'custom', name: 'Custom / Recorded' },
  ];

  const fxConfig: { key: keyof FxParams; name: string; min: number; max: number }[] = [
    { key: 'lpf', name: 'DJ Lowpass', min: 0, max: 100 },
    { key: 'hpf', name: 'Highpass', min: 0, max: 100 },
    { key: 'volume', name: 'Fade Vol', min: 0, max: 100 },
    { key: 'sidechain', name: 'Ducking', min: 0, max: 100 },
    { key: 'reverb', name: 'Reverb', min: 0, max: 100 },
    { key: 'delay', name: 'Echo', min: 0, max: 100 },
    { key: 'pitch', name: 'Speed/Pitch', min: -12, max: 12 },
    { key: 'panSwing', name: 'Pan Swing', min: 0, max: 100 },
    { key: 'compressor', name: 'Compressor', min: 0, max: 100 },
    { key: 'flanger', name: 'Flanger', min: 0, max: 100 },
  ];

  const workbenchStyle = {
    background:
      colorMode === 'day'
        ? `radial-gradient(circle at 50% 18%, ${activeStyle.panel}, transparent 40%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(245,247,250,0.86))`
        : `radial-gradient(circle at 50% 20%, ${activeStyle.panel}, transparent 36%), linear-gradient(135deg, ${activeStyle.panel}, rgba(24, 24, 27, 0.5))`,
    borderColor: activeTab.isPlaying
      ? activeStyle.accent
      : colorMode === 'day'
        ? 'rgba(15,23,42,0.1)'
        : 'rgba(255,255,255,0.05)',
  } as React.CSSProperties;
  const isDayMode = colorMode === 'day';
  const softButtonClass = isDayMode
    ? "bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-900/10"
    : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5";
  const mutedTextClass = isDayMode ? "text-slate-500" : "text-zinc-500";
  const hairlineClass = isDayMode ? "bg-slate-200" : "bg-zinc-800";

  return (
    <div
      className={cn(
        "h-screen font-sans flex flex-col overflow-hidden select-none transition-colors duration-300",
        isDayMode ? "bg-slate-100 text-slate-700" : "bg-[#0c0c0e] text-zinc-300"
      )}
      style={{
        background: isDayMode
          ? `linear-gradient(180deg, #f8fafc 0%, #eef4f8 58%, rgba(255,255,255,0.8) 100%)`
          : `linear-gradient(180deg, #0c0c0e 0%, #101014 58%, ${activeStyle.panel} 100%)`,
      }}
    >
      
      {/* Header / Tabs */}
      <header className={cn(
        "px-6 flex flex-shrink-0 items-end justify-between border-b backdrop-blur-md z-10 w-full pt-4",
        isDayMode ? "border-slate-900/10 bg-white/80" : "border-white/5 bg-black/40"
      )}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0 w-full md:w-auto">
          {tabs.map((tab) => (
             <div 
               key={tab.id}
               onClick={() => setActiveTabId(tab.id)}
               onMouseEnter={() => handleTabMouseEnter(tab.id)}
               onMouseLeave={handleTabMouseLeave}
               className={cn(
                 "group relative flex items-center gap-3 px-4 py-3 rounded-t-lg font-bold tracking-widest uppercase text-[10px] cursor-pointer transition-all border border-b-0 min-w-max",
                 activeTabId === tab.id
                   ? isDayMode ? "bg-white border-slate-900/10 text-slate-950 shadow-sm" : "bg-zinc-900 border-white/10 text-white"
                   : isDayMode ? "bg-slate-900/5 border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/70" : "bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-black/40"
               )}
             >
                <button 
                  onClick={(e) => togglePlayTab(e, tab.id)}
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-colors",
                    tab.isPlaying ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : isDayMode ? "bg-slate-900/10 text-slate-700 hover:bg-slate-900/15" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {tab.isPlaying ? <Square className="w-2.5 h-2.5" fill="currentColor"/> : <Play className="w-2.5 h-2.5 ml-0.5" fill="currentColor"/>}
                </button>
                <span>{tab.name}</span>
                <span className="flex gap-0.5 w-3 mt-0.5 opacity-80">
                  {tab.isPlaying && (
                     <>
                       <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                       <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse delay-75"></span>
                       <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
                     </>
                  )}
                </span>
             </div>
          ))}

          <button 
             onClick={addNewTab}
             className={cn(
               "px-4 py-3 rounded-t-lg transition-colors uppercase tracking-widest text-[10px] font-bold border border-transparent flex items-center gap-1.5 ml-2",
               isDayMode ? "bg-slate-900/5 hover:bg-white/80 text-slate-500 hover:text-slate-900" : "bg-black/20 hover:bg-black/40 text-zinc-500 hover:text-zinc-300"
             )}
          >
             <Plus size={12} strokeWidth={3} />
             New
          </button>

          <button
             onClick={() => setIsKeyboardVisible(true)}
             aria-label="Open keyboard"
             className={cn(
               "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-sm",
               isKeyboardVisible ? "bg-emerald-500 text-white" : isDayMode ? "bg-slate-900/5 text-slate-600 hover:bg-white hover:text-slate-950 border-slate-900/10" : "bg-black/20 text-zinc-400 hover:bg-white/10 hover:text-white"
             )}
          >
             <Keyboard className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] font-medium uppercase tracking-widest pb-3 h-full mb-1">
          <div className={cn("flex items-center gap-2 px-2 py-1.5 rounded border", isDayMode ? "bg-slate-900/5 border-slate-900/10" : "bg-white/5 border-white/5")}>
            <span className={mutedTextClass}>Preset</span>
            <select
              value={selectedStyleId}
              onChange={(e) => applyStylePreset(e.target.value)}
              className={cn("bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none", isDayMode ? "text-slate-950" : "text-white")}
              title="Switch loops, FX, and visual energy while keeping the current Sound Style"
            >
              {STYLE_PRESETS.map((style) => (
                <option key={style.id} value={style.id} className={isDayMode ? "bg-white text-slate-950" : "bg-zinc-900 text-white"}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={shuffleActiveTab}
            className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors", softButtonClass)}
          >
            <Shuffle size={11} />
            Shuffle
          </button>
          <button
            onClick={() => persistWorkbench()}
            className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors", softButtonClass)}
          >
            <Save size={11} />
            {saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={loadWorkbench}
            className={cn("px-2 py-1.5 rounded border transition-colors", softButtonClass)}
          >
            {saveStatus === 'loaded' ? 'Loaded' : 'Load'}
          </button>
          <button
            onClick={resetWorkbench}
            className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors", softButtonClass)}
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <button
            onClick={() => setColorMode(prev => prev === 'night' ? 'day' : 'night')}
            className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors", softButtonClass)}
            aria-label={isDayMode ? 'Switch to night mode' : 'Switch to day mode'}
            title={isDayMode ? 'Switch to night mode' : 'Switch to day mode'}
          >
            {isDayMode ? <Moon size={11} /> : <Sun size={11} />}
            {isDayMode ? 'Night' : 'Day'}
          </button>
          <div className={cn("flex gap-4 px-3 py-1.5 rounded flex-shrink-0 opacity-80", isDayMode ? "bg-slate-900/5 text-slate-800" : "bg-white/5 text-white")}>
             <span>BPM: 120</span>
             <span className={isDayMode ? "text-slate-300" : "text-white/20"}>|</span>
             <span>KEY: C MAJ</span>
             <span className={isDayMode ? "text-slate-300" : "text-white/20"}>|</span>
             <span className="w-20 text-right">STEP: {activeTab.activeStep + 1}/16</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-0 flex-1 w-full flex flex-col p-6 gap-5 overflow-hidden">
        <section className="shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className={cn("w-4 h-4", mutedTextClass)} />
            <h2 className={cn("text-[9px] font-bold uppercase tracking-[0.2em]", isDayMode ? "text-slate-500" : "text-zinc-600")}>Sound Style</h2>
            <span className={cn("text-[9px] uppercase tracking-widest", isDayMode ? "text-slate-400" : "text-zinc-700")}>Same loops, different tone</span>
            <div className={cn("h-px flex-1", hairlineClass)}></div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {AUDIO_STYLES.map((style) => {
              const selected = activeTab.styleId === style.id;

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleStyleChange(style.id)}
                  className={cn(
                    "h-9 shrink-0 rounded border px-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    selected
                      ? isDayMode ? "border-slate-900/20 bg-white text-slate-950 shadow-sm" : "border-white/30 bg-white/15 text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                      : isDayMode ? "border-slate-900/10 bg-white/55 text-slate-500 hover:bg-white hover:text-slate-900" : "border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                  )}
                  title={`Switch ${activeTab.name} to the ${style.name} sound without changing its loops`}
                >
                  <span className={cn("h-2 w-2 rounded-full", style.accent)}></span>
                  {style.name}
                </button>
              )
            })}
          </div>
        </section>
        
        {/* TOP: Performance Modules (Drop Zones) */}
        <section
          className="min-h-[410px] flex-[1.25] rounded-2xl border px-8 pt-8 pb-6 flex flex-col overflow-hidden relative transition-colors duration-150"
          style={workbenchStyle}
        >
          <div className="pointer-events-none absolute inset-0 opacity-35">
            <div
              className="absolute inset-6 rounded-2xl border transition-[opacity,transform] duration-150"
              style={{
                borderColor: activeStyle.accent,
                opacity: activeTab.isPlaying ? 0.14 + beatEnergy * 0.22 : 0,
                transform: activeTab.isPlaying ? `scale(${downbeat ? 1.015 : 1.006})` : 'scale(1)',
              }}
            />
            <div
              className="absolute inset-x-8 top-5 h-px transition-all duration-150"
              style={{
                background: `linear-gradient(90deg, transparent, ${activeStyle.accent}, transparent)`,
                opacity: activeTab.isPlaying ? 0.24 + beatEnergy * 0.44 : 0.12,
              }}
            />
            <div
              className="absolute top-8 bottom-12 w-px transition-transform duration-100"
              style={{
                left: 0,
                transform: `translateX(${sweepPosition})`,
                background: `linear-gradient(180deg, transparent, ${activeStyle.accent}, transparent)`,
                opacity: activeTab.isPlaying ? 0.16 + beatEnergy * 0.34 : 0,
              }}
            />
            <div className="absolute bottom-4 left-10 right-10 flex items-end gap-1 opacity-70">
              {activeStyle.energy.map((energy, index) => {
                const isCurrent = activeTab.isPlaying && index === activeTab.activeStep;
                return (
                  <div
                    key={index}
                    className="relative flex-1 rounded-full transition-all duration-100"
                    style={{
                      height: `${4 + energy * 14}px`,
                      background: activeStyle.accent,
                      opacity: isCurrent ? 0.58 : 0.08 + energy * 0.12,
                      transform: isCurrent ? `scaleY(${1.04 + beatEnergy * 0.22})` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className={cn("text-sm font-bold uppercase tracking-widest", isDayMode ? "text-slate-600" : "text-zinc-400")}>Performance Matrix</h2>
              <span
                className="rounded px-2 py-1 text-[9px] font-bold uppercase tracking-widest border"
                style={{ color: activeStyle.accent, borderColor: activeStyle.glow, background: activeStyle.panel }}
              >
                {activeStyle.name}
              </span>
            </div>
            <div className="flex gap-4">
              <span className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", mutedTextClass)}>
                Drag sounds into slots
              </span>
              <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                <span
                  className={cn("w-1.5 h-1.5 rounded-full", activeTab.isPlaying ? "animate-pulse" : "")}
                  style={{ backgroundColor: activeStyle.accent }}
                ></span>
                {activeTab.isPlaying ? "Playing" : "Ready To Play"}
              </span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-16 gap-1">
            {activeStyle.energy.map((energy, index) => {
              const isCurrent = activeTab.isPlaying && index === activeTab.activeStep;
              const isBeat = index % 4 === 0;
              return (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-100",
                    isBeat ? isDayMode ? "bg-slate-900/15" : "bg-white/15" : isDayMode ? "bg-slate-900/8" : "bg-white/8"
                  )}
                  style={{
                    backgroundColor: isCurrent ? activeStyle.accent : undefined,
                    opacity: isCurrent ? 1 : 0.25 + energy * 0.45,
                    transform: isCurrent ? 'scaleY(1.5)' : undefined,
                  }}
                />
              );
            })}
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center overflow-x-auto pt-3 pb-10">
            <div className="flex gap-2 sm:gap-3 justify-center flex-nowrap min-w-max">
              {activeTab.slots.map((slot, index) => {
                const isPlayingNow = activeTab.isPlaying && slot && slot.pattern[activeTab.activeStep] && (slot.pattern[activeTab.activeStep].note || slot.pattern[activeTab.activeStep].drum || slot.pattern[activeTab.activeStep].exp);
                const isMuted = activeTab.mutedSlots[index];

                return (
                  <div 
                    key={index}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    onClick={() => toggleMute(index)}
                    onMouseEnter={() => handleModuleMouseEnter(index)}
                    onMouseLeave={handleModuleMouseLeave}
                    className={cn(
                      "relative w-14 h-32 sm:w-20 sm:h-44 lg:w-24 lg:h-56 rounded-xl border-2 flex flex-col items-center justify-end pb-2 transition-all overflow-hidden cursor-pointer",
                      slot
                        ? isMuted
                          ? isDayMode ? 'border-slate-900/10 bg-slate-200/80' : 'border-white/5 bg-zinc-900'
                          : isDayMode ? 'border-slate-900/15 bg-white shadow-lg' : 'border-white/20 bg-zinc-800 shadow-xl'
                        : isDayMode ? 'bg-white/50 border-slate-900/15 border-dashed hover:bg-white' : 'bg-white/5 border-white/10 border-dashed hover:bg-white/10'
                    )}
                    style={{
                      borderColor: (!isMuted && isPlayingNow) ? activeStyle.accent : undefined,
                      transform: (!isMuted && isPlayingNow) ? `translateY(-${3 + beatEnergy * 3}px)` : undefined,
                    }}
                  >
                    {slot && activeTab.isPlaying && !isMuted && (
                      <div className="absolute left-2 right-2 top-2 z-20 flex gap-1">
                        {slot.pattern.map((step, stepIndex) => {
                          const hasHit = Boolean(step.note || step.drum || step.exp);
                          const isCurrentHit = hasHit && stepIndex === activeTab.activeStep;
                          return (
                            <span
                              key={stepIndex}
                              className="h-1 flex-1 rounded-full transition-all duration-100"
                              style={{
                                backgroundColor: hasHit ? activeStyle.accent : 'rgba(255,255,255,0.12)',
                                opacity: isCurrentHit ? 1 : hasHit ? 0.38 : 0.16,
                                transform: isCurrentHit ? 'scaleY(2.2)' : undefined,
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                    <AnimatePresence>
                      {slot && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isMuted ? 0.3 : 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-0 flex flex-col items-center justify-end pb-3 z-10"
                        >
                          {/* Avatar representation */}
                          <div 
                            className={cn("w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mb-2 border border-white/10 transition-transform duration-100", slot.color)}
                            style={{
                              transform: (!isMuted && isPlayingNow) ? `scale(${1.06 + beatEnergy * 0.08})` : undefined,
                            }}
                          >
                            <UserCircle2 className="w-2/3 h-2/3 text-white/80" strokeWidth={1.5} />
                          </div>
                          
                          <div className={cn("text-[8px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest truncate w-full text-center px-1", isDayMode ? "text-slate-700" : "text-zinc-300")}>{slot.name}</div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleClearSlot(index); }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/50 hover:text-white transition-colors"
                          >
                            <X className="w-2.5 h-2.5" strokeWidth={3} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Visualizer Backdrop */}
                    {slot && activeTab.isPlaying && !isMuted && (
                      <motion.div 
                        className={cn("absolute inset-x-0 bottom-0 opacity-20", slot.color)}
                        animate={{ height: isPlayingNow ? '100%' : '10%' }}
                        transition={{ duration: 0.1 }}
                      />
                    )}
                    
                    {!slot && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <span className={cn("text-xl font-light", isDayMode ? "text-slate-900/20" : "text-white/10")}>+</span>
                          <span className={cn("text-[8px] font-bold uppercase tracking-widest", isDayMode ? "text-slate-900/25" : "text-white/15")}>Drop</span>
                       </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Fx Panel - Slot Level */}
        <AnimatePresence>
          {hoveredFxSlot !== null && activeTab.slots[hoveredFxSlot] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onMouseEnter={() => clearTimeout(fxTimeoutRef.current)}
              onMouseLeave={handleModuleMouseLeave}
              className="absolute z-50 left-0 right-0 top-[50%] lg:top-[60%] mx-auto w-[95%] max-w-5xl bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Module FX: {activeTab.slots[hoveredFxSlot]?.name} (Slot {hoveredFxSlot + 1})
                  </h3>
                  <button 
                    onClick={handleResetFx}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-emerald-400 uppercase tracking-tighter transition-colors border border-emerald-500/20"
                  >
                    Reset FX
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6">
                {fxConfig.map(cfg => (
                  <div key={cfg.key} className="flex flex-col gap-2">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{cfg.name}</span>
                        <span className="text-[10px] text-zinc-300 font-mono bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0 min-w-[28px] text-center">
                           {activeTab.fxSlots[hoveredFxSlot][cfg.key]}
                        </span>
                     </div>
                     <input 
                        type="range"
                        min={cfg.min}
                        max={cfg.max}
                        value={activeTab.fxSlots[hoveredFxSlot][cfg.key]}
                        onChange={(e) => handleFxChange(cfg.key, parseFloat(e.target.value))}
                        className="w-full h-1.5 focus:outline-none appearance-none bg-zinc-800 rounded-lg cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
                     />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fx Panel - Master/Tab Level */}
        <AnimatePresence>
          {hoveredTabFxId !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onMouseEnter={() => clearTimeout(tabFxTimeoutRef.current)}
              onMouseLeave={handleTabMouseLeave}
              className="absolute z-50 left-0 right-0 top-16 mx-auto w-[95%] max-w-5xl bg-indigo-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-b-2xl p-6 shadow-2xl flex flex-col gap-5 pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 text-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Master FX: {tabs.find(t => t.id === hoveredTabFxId)?.name}
                  </h3>
                  <button 
                    onClick={handleResetMasterFx}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-[9px] font-bold text-indigo-300 uppercase tracking-tighter transition-colors border border-indigo-500/30"
                  >
                    Reset Global
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6">
                {fxConfig.map(cfg => {
                  const t = tabs.find(t => t.id === hoveredTabFxId);
                  if (!t) return null;
                  return (
                    <div key={cfg.key} className="flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] text-indigo-300/80 uppercase tracking-wider">{cfg.name}</span>
                          <span className="text-[10px] text-indigo-200 font-mono bg-indigo-900/50 px-1.5 py-0.5 rounded flex-shrink-0 min-w-[28px] text-center">
                             {t.masterFx[cfg.key]}
                          </span>
                       </div>
                       <input 
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          value={t.masterFx[cfg.key]}
                          onChange={(e) => handleMasterFxChange(cfg.key, parseFloat(e.target.value))}
                          className="w-full h-1.5 focus:outline-none appearance-none bg-indigo-950/50 rounded-lg cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full outline border border-indigo-800/50"
                       />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM: Music Modules (Draggable Sounds) */}
        <section className={cn(
          "relative z-20 h-52 flex flex-col gap-2 shrink-0 rounded-2xl border p-3",
          isDayMode ? "border-slate-900/10 bg-white/85 shadow-[0_-18px_40px_rgba(148,163,184,0.25)]" : "border-white/5 bg-[#0d0d10] shadow-[0_-18px_40px_rgba(0,0,0,0.35)]"
        )}>
          <div className="flex items-center gap-2">
            <h2 className={cn("text-[9px] font-bold uppercase tracking-[0.2em]", isDayMode ? "text-slate-500" : "text-zinc-600")}>Sample Library</h2>
            <div className={cn("flex-1 h-px", hairlineClass)}></div>
            
            {/* Record Controls */}
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="audio/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all", isDayMode ? "bg-slate-900/5 text-slate-500 hover:bg-slate-900/10" : "bg-white/5 text-zinc-400 hover:bg-white/10")}
              >
                <Upload size={10} />
                Upload
              </button>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : isDayMode ? "bg-slate-900/5 text-slate-500 hover:bg-slate-900/10" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
              >
                {isRecording ? <MicOff size={10} /> : <Mic size={10} />}
                {isRecording ? 'Stop Voice' : 'Voice Rec'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-none pb-4">
            {categories.map((cat) => {
              const staticItems = AVAILABLE_SOUNDS.filter(s => s.category === cat.id);
              const customItems = cat.id === 'custom' ? recordedSounds : [];
              const items = [...staticItems, ...customItems];
              
              if (items.length === 0 && cat.id !== 'custom') return null;
              
              return (
                <div key={cat.id} className="flex flex-col gap-1.5">
                  <h3 className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", mutedTextClass)}>{cat.name}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {items.length === 0 && cat.id === 'custom' && (
                       <div className={cn("text-[9px] italic pl-1 py-2", isDayMode ? "text-slate-400" : "text-zinc-700")}>No recordings yet. Hit 'Rec New' upward!</div>
                    )}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className={cn(
                          "flex-none w-32 rounded-lg border p-3 flex flex-col justify-between cursor-grab active:cursor-grabbing group transition-colors relative origin-center",
                          isDayMode ? "bg-white border-slate-900/10 hover:bg-slate-50 shadow-sm" : "bg-zinc-800/80 border-white/5 hover:bg-zinc-700"
                        )}
                        title={item.name}
                      >
                         {cat.id === 'custom' && (
                           <button 
                             onClick={(e) => toggleLoopMode(e, item.id)}
                             className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-zinc-600 hover:bg-zinc-500 rounded text-[7px] font-bold text-white shadow-md z-10 uppercase transition-colors"
                           >
                             {item.loopMode === 'fast' ? 'FAST' : 'FULL'}
                           </button>
                         )}
                         <div className="flex justify-between items-start mb-2">
                            <span className={cn("text-[9px] font-bold uppercase truncate", isDayMode ? "text-slate-800" : "text-white")}>{item.name}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.color)}></div>
                         </div>
                         <div className="space-y-1.5 mt-auto">
                           <div className="h-4 w-full flex items-end gap-0.5">
                              {[1,3,2,5,4,6].map((h, i) => (
                                <div key={i} className={cn("w-1 flex-1 rounded-t-sm opacity-40 group-hover:opacity-60", item.color)} style={{ height: `${h * 15}%`}}></div>
                              ))}
                           </div>
                           <div className={cn("text-[8px] uppercase tracking-tighter truncate", isDayMode ? "text-slate-400" : "text-zinc-600")}>{cat.id === 'custom' ? 'RECORDED' : cat.id === 'beat' ? 'LOOP / 120' : 'SYNTH'}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        
      </main>

      {/* Floating Keyboard */}
      <AnimatePresence>
        {isKeyboardVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setIsKeyboardVisible(false);
              }
            }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 shadow-2xl overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 p-4 border-b border-white/10">
                <div className="space-y-1">
                  <h2 className="text-base font-bold uppercase tracking-[0.25em] text-zinc-100">Keyboard</h2>
                  <p className="text-[11px] text-zinc-500 max-w-sm">Tap multiple keys to play chords. Click outside this panel to close.</p>
                </div>
                <button
                  onClick={() => setIsKeyboardVisible(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
                  aria-label="Close keyboard"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {KEYBOARD_INSTRUMENT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setKeyboardInstrumentMode(mode.id)}
                      className={cn(
                        "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all border",
                        keyboardInstrumentMode === mode.id
                          ? `${mode.color} text-white border-current`
                          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {mode.name}
                    </button>
                  ))}

                  <button
                    onClick={isRecordingKeyboard ? stopKeyboardRecording : startKeyboardRecording}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                      isRecordingKeyboard
                        ? "bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                        : "bg-white/10 text-zinc-300 border-white/10 hover:bg-white/20"
                    )}
                    aria-label={isRecordingKeyboard ? 'Stop sequencer recording' : 'Start sequencer recording'}
                  >
                    <Circle className={cn("w-4 h-4", isRecordingKeyboard ? 'text-white' : 'text-red-500')} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {KEYBOARD_NOTES.map((row, rowIndex) =>
                    row.map((note, colIndex) => {
                      const keyIndex = rowIndex * 4 + colIndex;
                      const physicalKey = KEYBOARD_PHYSICAL_KEYS[keyIndex];
                      const isPressed = pressedKeyboardNotes.includes(note);
                      const instrument = KEYBOARD_INSTRUMENT_MODES.find(i => i.id === keyboardInstrumentMode) ?? KEYBOARD_INSTRUMENT_MODES[0];
                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onMouseDown={() => handleKeyboardNoteDown(note)}
                          onMouseUp={() => handleKeyboardNoteUp(note)}
                          onMouseLeave={() => handleKeyboardNoteUp(note)}
                          className={cn(
                            "aspect-square rounded-2xl border flex flex-col items-center justify-center text-xs font-mono transition-all",
                            isPressed
                              ? `${instrument.color} text-white border-white/50 shadow-lg shadow-current scale-105`
                              : "bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border-white/10 text-zinc-300 hover:text-white"
                          )}
                        >
                          <span>{KEYBOARD_NOTE_LABELS[keyIndex]}</span>
                          <span className="text-[8px] opacity-70 mt-1">{physicalKey.toUpperCase()}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 px-4 py-3 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>{isRecordingKeyboard ? `Recording ${recordedNotes.length} notes` : 'Click the red button to capture your performance'}</span>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  {keyboardInstrumentMode}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
