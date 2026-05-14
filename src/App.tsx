import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, UserCircle2, X, Mic, MicOff, Upload, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AVAILABLE_SOUNDS, SoundDef, engineManager, FxParams, defaultFx, KEYBOARD_NOTES } from './audio';
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
  isPlaying: boolean;
  activeStep: number;
}

export default function App() {
  const [tabs, setTabs] = useState<TabData[]>([{
    id: 'tab-1',
    name: 'Arrangement 1',
    slots: new Array(7).fill(null),
    mutedSlots: new Array(7).fill(false),
    fxSlots: new Array(7).fill(null).map(defaultFx),
    masterFx: defaultFx(),
    isPlaying: false,
    activeStep: 0
  }]);
  
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

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
  const [pressedKeyboardNote, setPressedKeyboardNote] = useState<number | null>(null);
  const pressedKeyTimeoutRef = useRef<NodeJS.Timeout>();
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
    if (!isKeyboardVisible) return;

    const handleKeydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const index = KEYBOARD_PHYSICAL_KEYS.indexOf(key);
      if (index !== -1) {
        e.preventDefault();
        const note = FLAT_KEYBOARD_NOTES[index];
        handleKeyboardKeyPress(note);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isKeyboardVisible, isRecordingKeyboard, recordedNotes]);

  const addNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: newId,
      name: `Arrangement ${tabs.length + 1}`,
      slots: new Array(7).fill(null),
      mutedSlots: new Array(7).fill(false),
      fxSlots: new Array(7).fill(null).map(defaultFx),
      masterFx: defaultFx(),
      isPlaying: false,
      activeStep: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const togglePlayTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const engine = engineManager.getProject(id);
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    
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
      // Generate pattern from recorded notes
      const pattern = new Array(16).fill(null).map(() => ({}));
      const totalDuration = Date.now() - recordStartTimeRef.current;
      const stepDuration = totalDuration / 16;
      
      recordedNotes.forEach(({time, note}) => {
        const step = Math.floor((time - recordStartTimeRef.current) / stepDuration);
        if (step >= 0 && step < 16) {
          pattern[step] = { note };
        }
      });

      const instrument = KEYBOARD_INSTRUMENT_MODES.find(i => i.id === keyboardInstrumentMode) ?? KEYBOARD_INSTRUMENT_MODES[0];
      const newSound: SoundDef = {
        id: `keyboard-${Date.now()}`,
        name: `${instrument.name} Seq ${recordedSounds.filter(s => s.id.startsWith('keyboard-')).length + 1}`,
        category: 'custom',
        color: instrument.color,
        pattern: new Array(16).fill(null).map(() => ({})),
        loopMode: 'full'
      };
      pattern.forEach((value, idx) => {
        if (value && Object.keys(value).length) {
          newSound.pattern[idx] = value;
        }
      });

      setRecordedSounds(prev => [...prev, newSound]);
    }
  };

  const handleKeyboardKeyPress = (note: number) => {
    playKeyboardNote(note);
    setPressedKeyboardNote(note);
    clearTimeout(pressedKeyTimeoutRef.current);
    pressedKeyTimeoutRef.current = setTimeout(() => setPressedKeyboardNote(null), 150);
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

  return (
    <div className="h-screen bg-[#0c0c0e] text-zinc-300 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Header / Tabs */}
      <header className="px-6 flex flex-shrink-0 items-end justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-10 w-full pt-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0 w-full md:w-auto">
          {tabs.map((tab) => (
             <div 
               key={tab.id}
               onClick={() => setActiveTabId(tab.id)}
               onMouseEnter={() => handleTabMouseEnter(tab.id)}
               onMouseLeave={handleTabMouseLeave}
               className={cn(
                 "group relative flex items-center gap-3 px-4 py-3 rounded-t-lg font-bold tracking-widest uppercase text-[10px] cursor-pointer transition-all border border-b-0 min-w-max",
                 activeTabId === tab.id ? "bg-zinc-900 border-white/10 text-white" : "bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-black/40"
               )}
             >
                <button 
                  onClick={(e) => togglePlayTab(e, tab.id)}
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-colors",
                    tab.isPlaying ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-white/10 text-white hover:bg-white/20"
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
             className="px-4 py-3 rounded-t-lg bg-black/20 hover:bg-black/40 text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest text-[10px] font-bold border border-transparent flex items-center gap-1.5 ml-2"
          >
             <Plus size={12} strokeWidth={3} />
             New
          </button>

          <button 
             onClick={() => setIsKeyboardVisible(!isKeyboardVisible)}
             className="px-4 py-3 rounded-t-lg bg-black/20 hover:bg-black/40 text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest text-[10px] font-bold border border-transparent flex items-center gap-1.5 ml-2"
          >
             Keyboard
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[10px] font-medium uppercase tracking-widest opacity-60 pb-3 h-full mb-1">
          <div className="flex gap-4 bg-white/5 px-3 py-1.5 rounded text-white flex-shrink-0">
             <span>BPM: 120</span>
             <span className="text-white/20">|</span>
             <span>KEY: C MAJ</span>
             <span className="text-white/20">|</span>
             <span className="w-20 text-right">STEP: {activeTab.activeStep + 1}/16</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col p-6 gap-6 overflow-hidden">
        
        {/* TOP: Performance Modules (Drop Zones) */}
        <section className="flex-1 bg-zinc-900/50 rounded-2xl border border-white/5 p-8 flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Performance Matrix (Drop Zone)</h2>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Tips: Click module to MUTE
              </span>
              <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                <span className={cn("w-1.5 h-1.5 rounded-full bg-emerald-400", activeTab.isPlaying ? "animate-pulse" : "")}></span>
                {activeTab.isPlaying ? "Playing" : "Ready To Play"}
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-x-auto py-4">
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
                      slot ? (isMuted ? 'border-white/5 bg-zinc-900' : 'border-white/20 bg-zinc-800 shadow-xl') : 'bg-white/5 border-white/10 border-dashed hover:bg-white/10'
                    )}
                  >
                    <AnimatePresence>
                      {slot && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isMuted ? 0.3 : 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-0 flex flex-col items-center justify-end pb-3 z-10"
                        >
                          {/* Avatar representation */}
                          <motion.div 
                            animate={{ 
                              y: (!isMuted && isPlayingNow) ? -10 : 0, 
                              scale: (!isMuted && isPlayingNow) ? 1.1 : 1 
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className={cn("w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mb-2 shadow-xl border border-white/10", slot.color)}
                          >
                            <UserCircle2 className="w-2/3 h-2/3 text-white/80" strokeWidth={1.5} />
                          </motion.div>
                          
                          <div className="text-[8px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest text-zinc-300 truncate w-full text-center px-1">{slot.name}</div>
                          
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
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/10 text-xl font-light">+</span>
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
        <section className="h-56 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Sample Library</h2>
            <div className="flex-1 h-px bg-zinc-800"></div>
            
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
                className="flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all bg-white/5 text-zinc-400 hover:bg-white/10"
              >
                <Upload size={10} />
                Upload
              </button>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-zinc-400 hover:bg-white/10"
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
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">{cat.name}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {items.length === 0 && cat.id === 'custom' && (
                       <div className="text-[9px] text-zinc-700 italic pl-1 py-2">No recordings yet. Hit 'Rec New' upward!</div>
                    )}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className="flex-none w-32 bg-zinc-800/80 rounded-lg border border-white/5 p-3 flex flex-col justify-between hover:bg-zinc-700 cursor-grab active:cursor-grabbing group transition-colors relative origin-center"
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
                            <span className="text-[9px] font-bold text-white uppercase truncate">{item.name}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.color)}></div>
                         </div>
                         <div className="space-y-1.5 mt-auto">
                           <div className="h-4 w-full flex items-end gap-0.5">
                              {[1,3,2,5,4,6].map((h, i) => (
                                <div key={i} className={cn("w-1 flex-1 rounded-t-sm opacity-40 group-hover:opacity-60", item.color)} style={{ height: `${h * 15}%`}}></div>
                              ))}
                           </div>
                           <div className="text-[8px] text-zinc-600 uppercase tracking-tighter truncate">{cat.id === 'custom' ? 'RECORDED' : cat.id === 'beat' ? 'LOOP / 120' : 'SYNTH'}</div>
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">4x4 Keyboard</h2>
                <p className="mt-2 text-[10px] text-zinc-500 max-w-xs">Choose an instrument mode, then play with mouse or keyboard while the panel is open.</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <button 
                    onClick={isRecordingKeyboard ? stopKeyboardRecording : startKeyboardRecording}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all",
                      isRecordingKeyboard ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-zinc-400 hover:bg-white/20"
                    )}
                  >
                    {isRecordingKeyboard ? 'Stop Seq' : 'Seq Rec'}
                  </button>
                  <button 
                    onClick={() => setIsKeyboardVisible(false)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {KEYBOARD_INSTRUMENT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setKeyboardInstrumentMode(mode.id)}
                      className={cn(
                        "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border",
                        keyboardInstrumentMode === mode.id ? `${mode.color} text-white border-current` : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {mode.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
                {KEYBOARD_NOTES.map((row, rowIndex) => 
                  row.map((note, colIndex) => {
                    const keyIndex = rowIndex * 4 + colIndex;
                    const physicalKey = KEYBOARD_PHYSICAL_KEYS[keyIndex];
                    const isPressed = pressedKeyboardNote === note;
                    const instrument = KEYBOARD_INSTRUMENT_MODES.find(i => i.id === keyboardInstrumentMode) ?? KEYBOARD_INSTRUMENT_MODES[0];
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onMouseDown={() => handleKeyboardKeyPress(note)}
                        className={cn(
                          "aspect-square border rounded-lg flex flex-col items-center justify-center text-xs font-mono transition-all",
                          isPressed 
                            ? `${instrument.color} text-white border-white/50 shadow-lg shadow-current scale-105` 
                            : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-white/20 text-zinc-400 hover:text-white"
                        )}
                      >
                        <span>{KEYBOARD_NOTE_LABELS[keyIndex]}</span>
                        <span className="text-[8px] opacity-70 mt-1">{physicalKey.toUpperCase()}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-zinc-500">
                {isRecordingKeyboard ? `Recording... Notes: ${recordedNotes.length}` : 'Click Record to start capturing your performance'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
