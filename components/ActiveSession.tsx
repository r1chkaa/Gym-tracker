'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, Play, ChevronRight, ArrowLeft, ChevronUp, ChevronDown, Trophy, Zap, SkipForward, Trash2 } from 'lucide-react';
import { db, defaultExercises, type Template } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const allExercises = Object.values(defaultExercises.exercises).flat();
const getExerciseDetails = (id: string) => allExercises.find(ex => ex.id === id);

// Rank Engine
const RANK_THRESHOLDS = [0, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 350000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 3500000, 4500000, 5000000, 6000000, 7000000, 8000000, 9000000];
const RANKS = ["Wood", "Chalk", "Iron", "Steel", "Contender", "Gladiator", "Juggernaut", "Colossus", "Olympian"];
const TIERS = ["I", "II", "III"];

function getAccountRank(points: number) {
  if (points >= 25000000) return { name: "God", tier: "", fullName: "God Rank", image: "god.png", current: 25000000, next: 25000000, progress: 100 };
  if (points >= 10000000) {
    let titanLevel = Math.floor((points - 10000000) / 150000) + 1;
    if (titanLevel > 100) titanLevel = 100;
    const currentThresh = 10000000 + ((titanLevel - 1) * 150000);
    const nextThresh = titanLevel === 100 ? 25000000 : 10000000 + (titanLevel * 150000);
    const progress = ((points - currentThresh) / (nextThresh - currentThresh)) * 100;
    const titanEmblems = [100, 75, 50, 25, 10, 5, 3, 2, 1];
    const emblemNum = titanEmblems.find(e => titanLevel >= e) || 1;
    return { name: "Titan", tier: titanLevel.toString(), fullName: `Titan ${titanLevel}`, image: `titan${emblemNum}.png`, current: currentThresh, next: nextThresh, progress };
  }
  let currentTierIndex = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) { if (points >= RANK_THRESHOLDS[i]) currentTierIndex = i; }
  const currentThresh = RANK_THRESHOLDS[currentTierIndex];
  const nextThresh = currentTierIndex === RANK_THRESHOLDS.length - 1 ? 10000000 : RANK_THRESHOLDS[currentTierIndex + 1];
  const rankName = RANKS[Math.floor(currentTierIndex / 3)];
  const tierName = TIERS[currentTierIndex % 3];
  const tierNum = (currentTierIndex % 3) + 1;
  return { name: rankName, tier: tierName, fullName: `${rankName} ${tierName}`, image: `${rankName.toLowerCase()}${tierNum}.png`, current: currentThresh, next: nextThresh, progress: ((points - currentThresh) / (nextThresh - currentThresh)) * 100 };
}

// Cinematic Summary Component
const CinematicSummary = ({ initialPoints, earnedPoints, earnedXP, onComplete }: any) => {
  const [step, setStep] = useState<'rank' | 'xp'>('rank');
  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayXP, setDisplayXP] = useState<Record<string, number>>({});
  
  const currentRank = getAccountRank(initialPoints + displayPoints);
  const isGod = currentRank.name === 'God';

  // Animate Rank Points smoothly
  useEffect(() => {
    if (step !== 'rank') return;
    let startTimestamp: number | null = null;
    const duration = 2000; // 2 second fill
    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayPoints(earnedPoints * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [step, earnedPoints]);

  // Animate Muscle XP smoothly
  useEffect(() => {
    if (step !== 'xp') return;
    let startTimestamp: number | null = null;
    const duration = 2000; 
    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const newXP: Record<string, number> = {};
      Object.entries(earnedXP).forEach(([muscle, maxXP]: any) => {
        newXP[muscle] = maxXP * ease;
      });
      setDisplayXP(newXP);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [step, earnedXP]);

  const handleNext = () => {
    if (step === 'rank') {
      // Small haptic for transitioning to XP
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setStep('xp');
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700" onClick={handleNext}>
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />

      {step === 'rank' && (
        <div className="w-full max-w-sm flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 relative z-10">
          <span className="text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-[0.4em] mb-8">Workout Complete</span>
          
          <div className="relative flex justify-center items-center mb-8 w-48 h-48">
            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
            <img src={`/ranks/${currentRank.image}`} alt="Rank" className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>

          <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-1 drop-shadow-md">{currentRank.name}</h2>
          <span className="text-xs font-bold text-white/60 tracking-[0.3em] uppercase mb-12">{currentRank.tier || `LEVEL ${currentRank.tier}`}</span>

          <div className="w-full flex justify-between items-end mb-3 px-1">
            <span className="text-xl font-black tracking-widest text-white">+{Math.floor(displayPoints).toLocaleString()} PTS</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{currentRank.next ? `${currentRank.next.toLocaleString()}` : 'MAX'}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-r-full transition-all duration-100 ${isGod ? 'bg-gradient-to-r from-yellow-500 to-white' : 'bg-blue-500'}`} style={{ width: `${currentRank.progress}%` }} />
          </div>

          <div className="mt-16 text-[10px] text-white/30 font-black uppercase tracking-widest animate-bounce">Tap to continue</div>
        </div>
      )}

      {step === 'xp' && (
        <div className="w-full max-w-sm flex flex-col items-center animate-in slide-in-from-right-8 duration-500 relative z-10">
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-8">Muscle Mastery</span>
          
          <div className="w-full space-y-4">
            {Object.entries(earnedXP).map(([muscle, maxXP]: any, idx) => {
              const currentXP = displayXP[muscle] || 0;
              const progress = Math.min(100, (currentXP / maxXP) * 100);
              
              return (
                <div key={muscle} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-white text-lg">{muscle}</span>
                    <span className="font-black text-blue-400 text-lg">+{Math.floor(currentXP).toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-r-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-[10px] text-white/30 font-black uppercase tracking-widest animate-bounce">Tap to finish</div>
        </div>
      )}
    </div>
  );
};

export default function ActiveSession() {
  const templates = useLiveQuery(() => db.templates.toArray());
  const allSets = useLiveQuery(() => db.sets.toArray()) || [];
  
  const [unit, setUnit] = useState('lbs');
  const [defaultTimer, setDefaultTimer] = useState(90);
  const [useWakeLock, setUseWakeLock] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [completedSets, setCompletedSets] = useState<number>(0);
  
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showTimerOverlay, setShowTimerOverlay] = useState(false);
  
  const [workoutSummary, setWorkoutSummary] = useState<any | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionXP, setSessionXP] = useState<Record<string, number>>({});
  const [initialHistoricalPoints, setInitialHistoricalPoints] = useState(0);

  useEffect(() => {
    setUnit(localStorage.getItem('gym_unit') || 'lbs');
    setDefaultTimer(Number(localStorage.getItem('gym_timer')) || 90);
    setUseWakeLock(localStorage.getItem('gym_wakelock') === 'true');
  }, []);

  const currentSetup = activeTemplate?.exercises[exerciseIndex];
  const currentExercise = currentSetup ? getExerciseDetails(currentSetup.exerciseId) : null;
  const plannedSets = currentSetup?.sets || [];
  const currentPlannedSet = plannedSets[completedSets] || { tag: 'normal', targetReps: '8-12' };
  const currentTag = currentPlannedSet.tag;
  
  const isExerciseDone = completedSets >= plannedSets.length;
  const isWorkoutDone = isExerciseDone && exerciseIndex >= (activeTemplate?.exercises.length || 0) - 1;

  const triggerHaptic = (heavy = false) => { 
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(heavy ? [50, 100, 50] : 50); 
  };

  const playAudio = (filename: string) => {
    try {
      const audio = new Audio(`/sounds/${filename}`);
      audio.play().catch(() => {});
    } catch(e) {}
  };

  const requestWakeLock = async () => { if ('wakeLock' in navigator && useWakeLock) { try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {} } };
  const releaseWakeLock = async () => { if (wakeLockRef.current) { try { await wakeLockRef.current.release(); wakeLockRef.current = null; } catch (err) {} } };

  useEffect(() => {
    if (!showTimerOverlay || restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev === 1) { 
          triggerHaptic(true); 
          playAudio('timerend.mp3');
          setShowTimerOverlay(false);
          if (isExerciseDone && !isWorkoutDone) setExerciseIndex(i => i + 1);
          return 0; 
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer, showTimerOverlay, isExerciseDone, isWorkoutDone]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startWorkout = async (template: Template) => {
    triggerHaptic();
    await requestWakeLock();
    
    let points = 0;
    allSets.forEach(set => {
      if(set.isCompleted) points += (set.weight * set.reps) * (1 + (set.weight / 150));
    });
    setInitialHistoricalPoints(points);

    setActiveTemplate(template);
    setSessionId(crypto.randomUUID());
    setExerciseIndex(0);
    setCompletedSets(0);
    setSessionPoints(0);
    setSessionXP({});
    setWeight("");
    setReps("");
  };

  const handleSkipTimer = () => {
    triggerHaptic();
    playAudio('timerend.mp3');
    setShowTimerOverlay(false);
    setRestTimer(0);
    if (isExerciseDone && !isWorkoutDone) {
      setExerciseIndex(i => i + 1);
      setCompletedSets(0);
      setWeight("");
      setReps("");
    }
  };

  const endWorkout = async (finalPoints: number, finalXP: Record<string, number>) => {
    await releaseWakeLock();
    triggerHaptic(true);
    setWorkoutSummary({ points: finalPoints, xp: finalXP });
  };

  const closeSummary = () => {
    setWorkoutSummary(null);
    setActiveTemplate(null);
    // Trigger global event so the Rank nav button glows
    window.dispatchEvent(new Event('rank-glow-update'));
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await db.templates.delete(id);
    }
  };

  const handleLogSet = async () => {
    if (!sessionId || !weight || !reps || !currentExercise) return;
    triggerHaptic();
    
    const wNum = Number(weight);
    const rNum = Number(reps);
    
    const pointsGained = (wNum * rNum) * (1 + (wNum / 150));
    const xpGained = wNum * rNum;
    
    const exCategory = Object.entries(defaultExercises.exercises).find(([_, exes]) => exes.some(e => e.id === currentExercise.id))?.[0] || 'Unknown';

    const newSessionPoints = sessionPoints + pointsGained;
    const newSessionXP = { ...sessionXP, [exCategory]: (sessionXP[exCategory] || 0) + xpGained };

    setSessionPoints(newSessionPoints);
    setSessionXP(newSessionXP);

    try {
      await db.sets.add({
        id: crypto.randomUUID(),
        sessionId,
        exerciseId: currentExercise.id,
        setNumber: completedSets + 1,
        weight: wNum,
        reps: rNum,
        isCompleted: true,
        timestamp: Date.now(),
        tag: currentTag
      });
      
      const newCompleted = completedSets + 1;
      setCompletedSets(newCompleted);
      
      if (newCompleted >= plannedSets.length && exerciseIndex >= activeTemplate!.exercises.length - 1) {
        endWorkout(newSessionPoints, newSessionXP);
      } else {
        setRestTimer(defaultTimer);
        setShowTimerOverlay(true);
      }
      setWeight("");
      setReps("");
    } catch (error) {}
  };

  const adjustValue = (setter: any, val: string, delta: number) => {
    setter((prev: string) => Math.max(0, Number(prev || 0) + delta).toString());
  };

  const tagLabels = { normal: 'Normal', warmup: 'Warm-up', drop: 'Dropset', failure: 'Failure' };

  if (workoutSummary) {
    return (
      <CinematicSummary 
        initialPoints={initialHistoricalPoints} 
        earnedPoints={workoutSummary.points} 
        earnedXP={workoutSummary.xp} 
        onComplete={closeSummary} 
      />
    );
  }

  if (!activeTemplate) {
    return (
      <div className="space-y-4 pt-4 pb-10">
        {!templates || templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-50 animate-in fade-in duration-500">
            <span className="text-[hsl(var(--foreground))] font-black text-2xl tracking-tight mb-2 text-center leading-tight">No routines found.</span>
            <span className="text-[hsl(var(--muted))] text-xs font-black uppercase tracking-[0.2em]">Go to the build tab</span>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="w-full bg-[hsl(var(--surface))] hover:brightness-110 transition-all duration-300 p-4 rounded-[2rem] border border-[hsl(var(--border))] flex justify-between items-center shadow-sm">
              <div className="flex-1 cursor-pointer pl-2" onClick={() => startWorkout(template)}>
                <h3 className="text-2xl font-black text-[hsl(var(--foreground))] truncate">{template.name}</h3>
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.15em] mt-1.5">{template.exercises.length} EXERCISES</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDeleteTemplate(template.id, template.name)} className="p-3 text-[hsl(var(--muted))] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors active:scale-95">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => startWorkout(template)} className="bg-[hsl(var(--background))] p-4 rounded-full border-2 border-[hsl(var(--border))] hover:border-blue-500 transition-all shadow-inner active:scale-95">
                  <Play className="text-[hsl(var(--foreground))] ml-1" size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (!currentExercise || !currentSetup) return null;

  return (
    <div className="bg-[hsl(var(--background))] rounded-[2rem] p-0 relative flex flex-col mt-2">
      
      {showTimerOverlay && (
        <div className="fixed inset-0 z-[100] bg-[hsl(var(--background))]/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <span className="text-blue-500 font-black tracking-[0.4em] uppercase text-sm mb-12 drop-shadow-md">
            Take a break
          </span>
          
          <div className="relative w-64 h-64 flex items-center justify-center mb-16">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="hsl(var(--surface))" strokeWidth="8" fill="none" />
              <circle cx="128" cy="128" r="120" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="753" strokeDashoffset={753 - (753 * (restTimer || 0)) / defaultTimer} className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className="text-7xl font-black text-[hsl(var(--foreground))] tracking-tighter">
              {formatTime(restTimer || 0)}
            </span>
          </div>

          <div className="flex flex-col items-center mb-16">
            <span className="text-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest mb-3">Up Next</span>
            <span className="text-2xl font-black text-[hsl(var(--foreground))] text-center px-6">
              {isExerciseDone && !isWorkoutDone 
                ? getExerciseDetails(activeTemplate.exercises[exerciseIndex + 1]?.exerciseId)?.name 
                : `${currentExercise.name} (Set ${completedSets + 1})`}
            </span>
          </div>

          <button onClick={handleSkipTimer} className="flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] px-8 py-4 rounded-full font-black tracking-widest uppercase text-xs border border-[hsl(var(--border))] transition-all active:scale-95 shadow-sm">
            Skip Rest <SkipForward size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1 pr-4">
          <button onClick={() => { setActiveTemplate(null); }} className="text-[hsl(var(--muted))] flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-[hsl(var(--foreground))] transition-colors bg-[hsl(var(--surface))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] w-fit shadow-sm">
            <ArrowLeft size={14} /> End Session
          </button>
          <h2 className="text-3xl font-black text-[hsl(var(--foreground))] mb-3 leading-tight">{currentExercise.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-3 py-1.5 rounded-lg text-xs font-bold border border-[hsl(var(--border))] shadow-inner">
              {completedSets}/{plannedSets.length} Sets
            </span>
            {!isExerciseDone && (
              <span className="text-blue-500 text-xs font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-inner">
                {tagLabels[currentTag as keyof typeof tagLabels]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Weight ({unit})</label>
          </div>
          <div className="relative flex items-center">
            <input 
              type="number" 
              placeholder="0"
              value={weight}
              disabled={isExerciseDone}
              onChange={(e) => setWeight(e.target.value.replace(/^0+(?=\d)/, ''))}
              className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))] disabled:opacity-50"
            />
            <div className="absolute right-0 flex flex-col gap-1.5">
              <button disabled={isExerciseDone} onClick={() => adjustValue(setWeight, weight, 5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronUp size={16}/></button>
              <button disabled={isExerciseDone} onClick={() => adjustValue(setWeight, weight, -5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronDown size={16}/></button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Reps</label>
          </div>
          <div className="relative flex items-center">
            <input 
              type="number" 
              placeholder="0"
              value={reps}
              disabled={isExerciseDone}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))] disabled:opacity-50"
            />
            <div className="absolute right-0 flex flex-col gap-1.5">
              <button disabled={isExerciseDone} onClick={() => adjustValue(setReps, reps, 1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronUp size={16}/></button>
              <button disabled={isExerciseDone} onClick={() => adjustValue(setReps, reps, -1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronDown size={16}/></button>
            </div>
          </div>
        </div>
      </div>

      {!isExerciseDone ? (
        <button onClick={handleLogSet} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
          <Check size={24} strokeWidth={3} />
          LOG {tagLabels[currentTag as keyof typeof tagLabels].toUpperCase()}
        </button>
      ) : (
        <button onClick={() => { setExerciseIndex(i => i + 1); setCompletedSets(0); setWeight(""); setReps(""); }} className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
          Next Exercise <ChevronRight size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}