import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, UserCircle2, X, Mic, MicOff, Save, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AVAILABLE_SOUNDS, SoundDef, engine } from './audio';
import { cn } from './lib/utils';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [slots, setSlots] = useState<(SoundDef | null)[]>(new Array(7).fill(null));
  const [mutedSlots, setMutedSlots] = useState<boolean[]>(new Array(7).fill(false));
  const [activeStep, setActiveStep] = useState(0);
  
  // Recording & Upload states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState<SoundDef[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleStep = (e: any) => {
      setActiveStep(e.detail.step);
    };
    window.addEventListener('step', handleStep);
    return () => window.removeEventListener('step', handleStep);
  }, []);

  const handlePlayToggle = () => {
    if (!isPlaying) {
      engine.init(); // Must be called on user interaction
      engine.play();
      setIsPlaying(true);
    } else {
      engine.stop();
      setIsPlaying(false);
      setActiveStep(0);
    }
  };

  const toggleMute = (index: number) => {
    if (!slots[index]) return;
    const newMuted = [...mutedSlots];
    newMuted[index] = !newMuted[index];
    setMutedSlots(newMuted);
    engine.setMutedSlots(newMuted);
  };

  const handleDragStart = (e: React.DragEvent, item: SoundDef) => {
    // We need to handle the buffer separately if it exists, or just pass IDs.
    // For simplicity, we'll stringify but remember buffers are held in a global pool or reference.
    // Actually, since we are in a SPA, we can just pass the sound object if it's already in our state.
    const cleanItem = { ...item, buffer: undefined }; // Can't stringify buffers
    e.dataTransfer.setData('application/json', JSON.stringify(cleanItem));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const itemData = JSON.parse(data) as SoundDef;
      
      // Look up recorded sound if it's custom
      let item = AVAILABLE_SOUNDS.find(s => s.id === itemData.id) || recordedSounds.find(s => s.id === itemData.id);
      
      if (!item) return;

      const newSlots = [...slots];
      newSlots[slotIndex] = item;
      setSlots(newSlots);
      engine.setSlots(newSlots);
      
      // Auto play on first drop if not playing
      if (!isPlaying) {
         handlePlayToggle();
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
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    engine.setSlots(newSlots);
  };

  // Recording & Upload Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        engine.init();
        if (engine.ctx) {
          try {
            const rawBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
            // Process the recording to fit the loop
            const processedBuffer = await engine.processBuffer(rawBuffer);
            
            const newSound: SoundDef = {
              id: `rec-${Date.now()}`,
              name: `Rec ${recordedSounds.length + 1}`,
              category: 'custom',
              color: 'bg-pink-500',
              pattern: [{ note: 1 }, ...new Array(15).fill({})], 
              buffer: processedBuffer,
              loopMode: 'full' // default to full/smart loop for better alignment
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
      engine.init();
      if (engine.ctx) {
        const rawBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
        // Requirement 1-5: Intelligent BPM detect, stretch, align, seamless loop
        const processedBuffer = await engine.processBuffer(rawBuffer);
        
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
    const newSlots = slots.map(slot => {
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
    setSlots(newSlots);
    engine.setSlots(newSlots);
  };

  // Group sounds by category
  const categories = [
    { id: 'beat', name: 'Beats' },
    { id: 'effect', name: 'Effects' },
    { id: 'melody', name: 'Melodies' },
    { id: 'bass', name: 'Basses' },
    { id: 'experimental', name: 'Experimental' },
    { id: 'custom', name: 'Custom / Recorded' },
  ];

  return (
    <div className="h-screen bg-[#0c0c0e] text-zinc-300 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Header / Transport */}
      <header className="h-16 px-8 flex flex-shrink-0 items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-10 w-full">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-1 h-4 bg-white rounded-full mx-0.5"></div>
            <div className="w-1 h-2 bg-white rounded-full mx-0.5"></div>
            <div className="w-1 h-5 bg-white rounded-full mx-0.5"></div>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase">Flux Audio Workstation</h1>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-widest opacity-60">
          <div>BPM: 120</div>
          <div>KEY: C MAJ</div>
          <div>STEP: {activeStep + 1}/16</div>
        </div>

        <button 
          onClick={handlePlayToggle}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded font-bold transition-all text-xs tracking-widest uppercase",
            isPlaying ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/10 hover:bg-white/20 border border-white/5 text-white"
          )}
        >
          {isPlaying ? <Square className="w-4 h-4" fill="currentColor"/> : <Play className="w-4 h-4" fill="currentColor"/>}
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col p-6 gap-6 overflow-hidden">
        
        {/* TOP: Performance Modules (Drop Zones) */}
        <section className="flex-1 bg-zinc-900/50 rounded-2xl border border-white/5 p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Performance Matrix (Drop Zone)</h2>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Tips: Click module to MUTE
              </span>
              <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                <span className={cn("w-1.5 h-1.5 rounded-full bg-emerald-400", isPlaying ? "animate-pulse" : "")}></span>
                {isPlaying ? "Playing" : "Ready To Play"}
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-x-auto py-4">
            <div className="flex gap-2 sm:gap-3 justify-center flex-nowrap min-w-max">
              {slots.map((slot, index) => {
                const isPlayingNow = isPlaying && slot && slot.pattern[activeStep] && (slot.pattern[activeStep].note || slot.pattern[activeStep].drum);
                const isMuted = mutedSlots[index];

                return (
                  <div 
                    key={index}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    onClick={() => toggleMute(index)}
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
                    {slot && isPlaying && !isMuted && (
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
                {isRecording ? 'Stop' : 'Rec New'}
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
    </div>
  );
}
