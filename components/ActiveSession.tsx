'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, Play, ChevronRight, ArrowLeft, ChevronUp, ChevronDown, Trash2, SkipForward, Info, PlayCircle } from 'lucide-react';
import { db, defaultExercises, type Template } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const allExercises = Object.values(defaultExercises.exercises).flat();
const getExerciseDetails = (id: string) => allExercises.find(ex => ex.id === id);

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
    const emblemNum = [100, 75, 50, 25, 10, 5, 3, 2, 1].find(e => titanLevel >= e) || 1;
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

const getMuscleDetails = (xp: number) => {
  const level = Math.floor(Math.sqrt(xp / 500)) + 1;
  const currentXP = Math.pow(level - 1, 2) * 500;
  const nextXP = Math.pow(level, 2) * 500;
  const progress = xp === 0 ? 0 : ((xp - currentXP) / (nextXP - currentXP)) * 100;
  let hex = "#9ca3af";
  if (level >= 10) hex = "#22c55e"; if (level >= 20) hex = "#3b82f6"; if (level >= 30) hex = "#a855f7";
  if (level >= 50) hex = "#eab308"; if (level >= 75) hex = "#ef4444"; if (level >= 100) hex = "#22d3ee";
  return { level, progress, currentXP, nextXP, hex };
};

const CinematicSummary = ({ initialPoints, earnedPoints, initialXP, earnedXP, onComplete }: any) => {
  const [step, setStep] = useState<'rank' | 'xp'>('rank');
  const [displayPoints, setDisplayPoints] = useState(initialPoints);
  const [displayXP, setDisplayXP] = useState<Record<string, number>>(initialXP);
  const [isLevelingUp, setIsLevelingUp] = useState<string | false>(false); // Tracks what is currently flashing

  // Continuous Points Engine
  useEffect(() => {
    if (step !== 'rank') return;
    let current = initialPoints;
    const target = initialPoints + earnedPoints;
    let lastTime = performance.now();
    let pausedUntil = 0;
    let animationFrameId: number;

    const tick = (now: number) => {
      if (now < pausedUntil) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      setIsLevelingUp(false); // Clear any active flash

      const dt = Math.min(now - lastTime, 50); // Cap frame delta
      lastTime = now;

      const previousRank = getAccountRank(current);
      const remaining = target - current;
      // Dynamic speed: fast if far, slows down organically near the end
      let speed = Math.max(15, (earnedPoints / 50)); 
      if (remaining < speed) speed = remaining; 

      current += speed;

      if (current >= target) {
        current = target;
        setDisplayPoints(current);
        return;
      }

      const newRank = getAccountRank(current);
      if (newRank.name !== previousRank.name || newRank.tier !== previousRank.tier) {
        setIsLevelingUp("RANK UP!");
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        pausedUntil = now + 1200; // Pause execution for 1.2s to show off the level up
        current = newRank.current; // Snap exactly to the boundary during the pause
      }

      setDisplayPoints(current);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, initialPoints, earnedPoints]);

  // Continuous XP Engine
  useEffect(() => {
    if (step !== 'xp') return;
    let currentXP = { ...initialXP };
    const targetXP: Record<string, number> = {};
    Object.keys(earnedXP).forEach(m => targetXP[m] = (initialXP[m] || 0) + earnedXP[m]);
    
    let lastTime = performance.now();
    let pausedUntil = 0;
    let animationFrameId: number;

    const tick = (now: number) => {
      if (now < pausedUntil) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      setIsLevelingUp(false);

      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      let isFinished = true;
      let triggeredLevelUp = false;

      Object.keys(earnedXP).forEach(muscle => {
        const target = targetXP[muscle];
        if (currentXP[muscle] >= target) return;
        
        isFinished = false;
        const prevDetails = getMuscleDetails(currentXP[muscle]);
        
        const remaining = target - currentXP[muscle];
        let speed = Math.max(5, (earnedXP[muscle] / 40));
        if (remaining < speed) speed = remaining;

        currentXP[muscle] += speed;

        const newDetails = getMuscleDetails(currentXP[muscle]);
        if (newDetails.level > prevDetails.level && !triggeredLevelUp) {
          triggeredLevelUp = true;
          setIsLevelingUp(`${muscle.toUpperCase()} LVL UP!`);
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50, 100]);
          pausedUntil = now + 1000;
          currentXP[muscle] = newDetails.currentXP; // Snap to boundary
        }
      });

      setDisplayXP({ ...currentXP });

      if (!isFinished) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, initialXP, earnedXP]);

  const handleNext = () => {
    if (step === 'rank') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setStep('xp');
    } else {
      onComplete();
    }
  };

  const currentRank = getAccountRank(displayPoints);
  const isGod = currentRank.name === 'God';

  return (
    <div className="fixed inset-0 w-screen h-screen z-[200] bg-[#09090b] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700" onClick={handleNext}>
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />

      {step === 'rank' && (
        <div className={`w-full max-w-sm flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 relative z-10 transition-transform ${isLevelingUp ? 'scale-110 drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]' : ''}`}>
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-8">{isLevelingUp || "Workout Complete"}</span>
          
          <div className="relative flex justify-center items-center mb-8 w-48 h-48">
            <div className={`absolute inset-0 blur-[60px] rounded-full ${isLevelingUp ? 'bg-white opacity-80 animate-ping' : 'bg-blue-500/20 animate-pulse'}`} />
            <img src={`/ranks/${currentRank.image}`} alt="Rank" className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>

          <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-1 drop-shadow-md">{currentRank.name}</h2>
          <span className="text-xs font-bold text-white/60 tracking-[0.3em] uppercase mb-12">{currentRank.tier || `LEVEL ${currentRank.tier}`}</span>

          <div className="w-full flex justify-between items-end mb-3 px-1">
            <span className="text-xl font-black tracking-widest text-white">{Math.floor(displayPoints).toLocaleString()} PTS</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{currentRank.next ? `${currentRank.next.toLocaleString()}` : 'MAX'}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-r-full transition-none ${isGod ? 'bg-gradient-to-r from-yellow-500 to-white' : 'bg-blue-500'}`} style={{ width: `${currentRank.progress}%` }} />
          </div>

          <div className="mt-16 text-[10px] text-white/30 font-black uppercase tracking-widest animate-pulse">Tap to continue</div>
        </div>
      )}

      {step === 'xp' && (
        <div className={`w-full max-w-sm flex flex-col items-center animate-in slide-in-from-right-8 duration-500 relative z-10 transition-transform ${isLevelingUp ? 'scale-105' : ''}`}>
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-8">{isLevelingUp || "Muscle Mastery"}</span>
          
          <div className="w-full space-y-4">
            {Object.entries(earnedXP).map(([muscle, totalAdded]: any, idx) => {
              const currentAnimatedXP = displayXP[muscle] || 0;
              const details = getMuscleDetails(currentAnimatedXP);
              const isThisMuscleLeveling = isLevelingUp && isLevelingUp.includes(muscle.toUpperCase());
              
              return (
                <div key={muscle} className={`bg-white/5 border p-5 rounded-3xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 fill-mode-both transition-all ${isThisMuscleLeveling ? 'border-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-105' : 'border-white/10'}`} style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-xl">{muscle}</span>
                      <span className="text-[10px] font-black tracking-widest" style={{ color: details.hex }}>LVL {details.level}</span>
                    </div>
                    <span className="font-black text-blue-400 text-lg">+{Math.floor(currentAnimatedXP - (initialXP[muscle]||0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-white/40 mb-3 px-0.5">
                    <span>{Math.floor(currentAnimatedXP).toLocaleString()}</span>
                    <span>{details.nextXP.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-r-full transition-none" style={{ width: `${details.progress}%`, backgroundColor: details.hex, boxShadow: `0 0 10px ${details.hex}` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-[10px] text-white/30 font-black uppercase tracking-widest animate-pulse">Tap to finish</div>
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

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
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
  const [initialHistoricalXP, setInitialHistoricalXP] = useState<Record<string, number>>({});

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
    try { const audio = new Audio(`/sounds/${filename}`); audio.play().catch(() => {}); } catch(e) {}
  };

  const requestWakeLock = async () => { if ('wakeLock' in navigator && useWakeLock) { try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {} } };
  const releaseWakeLock = async () => { if (wakeLockRef.current) { try { await wakeLockRef.current.release(); wakeLockRef.current = null; } catch (err) {} } };

  useEffect(() => {
    if (!showTimerOverlay || restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev === 1) { 
          triggerHaptic(true); playAudio('timerend.mp3'); setShowTimerOverlay(false);
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

  const startWorkout = async () => {
    if (!previewTemplate) return;
    triggerHaptic();
    await requestWakeLock();
    
    let points = 0;
    const vols: Record<string, number> = {};
    const exToCat: Record<string, string> = {};
    Object.entries(defaultExercises.exercises).forEach(([cat, exes]) => exes.forEach(ex => exToCat[ex.id] = cat));

    allSets.forEach(set => {
      if(set.isCompleted) {
        points += (set.weight * set.reps) * (1 + (set.weight / 150));
        if (exToCat[set.exerciseId]) vols[exToCat[set.exerciseId]] = (vols[exToCat[set.exerciseId]] || 0) + (set.weight * set.reps);
      }
    });
    
    setInitialHistoricalPoints(points);
    setInitialHistoricalXP(vols);

    setActiveTemplate(previewTemplate);
    setPreviewTemplate(null);
    setSessionId(crypto.randomUUID());
    setExerciseIndex(0);
    setCompletedSets(0);
    setSessionPoints(0);
    setSessionXP({});
    setWeight("");
    setReps("");
  };

  const handleSkipTimer = () => {
    triggerHaptic(); playAudio('timerend.mp3'); setShowTimerOverlay(false); setRestTimer(0);
    if (isExerciseDone && !isWorkoutDone) { setExerciseIndex(i => i + 1); setCompletedSets(0); setWeight(""); setReps(""); }
  };

  const endWorkout = async (finalPoints: number, finalXP: Record<string, number>) => {
    await releaseWakeLock(); triggerHaptic(true);
    setWorkoutSummary({ points: finalPoints, xp: finalXP });
  };

  const closeSummary = () => {
    setWorkoutSummary(null);
    setActiveTemplate(null);
    window.dispatchEvent(new Event('rank-glow-update'));
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await db.templates.delete(id);
    }
  };

  const handleLogSet = async () => {
    if (!sessionId || !weight || !reps || !currentExercise) return;
    triggerHaptic();
    
    const wNum = Number(weight); const rNum = Number(reps);
    const pointsGained = (wNum * rNum) * (1 + (wNum / 150));
    const xpGained = wNum * rNum;
    const exCategory = Object.entries(defaultExercises.exercises).find(([_, exes]) => exes.some(e => e.id === currentExercise.id))?.[0] || 'Unknown';

    const newSessionPoints = sessionPoints + pointsGained;
    const newSessionXP = { ...sessionXP, [exCategory]: (sessionXP[exCategory] || 0) + xpGained };

    setSessionPoints(newSessionPoints); setSessionXP(newSessionXP);

    try {
      await db.sets.add({
        id: crypto.randomUUID(), sessionId, exerciseId: currentExercise.id,
        setNumber: completedSets + 1, weight: wNum, reps: rNum,
        isCompleted: true, timestamp: Date.now(), tag: currentTag
      });
      
      const newCompleted = completedSets + 1;
      setCompletedSets(newCompleted);
      
      if (newCompleted >= plannedSets.length && exerciseIndex >= activeTemplate!.exercises.length - 1) {
        endWorkout(newSessionPoints, newSessionXP);
      } else {
        setRestTimer(defaultTimer); setShowTimerOverlay(true);
      }
      setWeight(""); setReps("");
    } catch (error) {}
  };

  const adjustValue = (setter: any, val: string, delta: number) => { setter((prev: string) => Math.max(0, Number(prev || 0) + delta).toString()); };
  const tagLabels = { normal: 'Normal', warmup: 'Warm-up', drop: 'Dropset', failure: 'Failure' };

  if (workoutSummary) {
    return <CinematicSummary initialPoints={initialHistoricalPoints} earnedPoints={workoutSummary.points} initialXP={initialHistoricalXP} earnedXP={workoutSummary.xp} onComplete={closeSummary} />;
  }

  // Pre-Workout Preview Screen
  if (previewTemplate) {
    return (
      <div className="absolute inset-0 bg-[hsl(var(--background))] z-50 flex flex-col px-4 pt-4 animate-in slide-in-from-right-4 duration-300 w-screen min-h-screen pb-32">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setPreviewTemplate(null)} className="p-3 bg-[hsl(var(--surface))] rounded-2xl border border-[hsl(var(--border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))]">Preview Routine</span>
            <h2 className="text-3xl font-black text-[hsl(var(--foreground))] leading-tight truncate">{previewTemplate.name}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {previewTemplate.exercises.map((setup, i) => {
            const ex = getExerciseDetails(setup.exerciseId);
            return (
              <div key={i} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center font-black text-xs text-[hsl(var(--muted))]">{i + 1}</div>
                  <div>
                    <h4 className="font-black text-[hsl(var(--foreground))] text-sm leading-tight">{ex?.name || 'Unknown'}</h4>
                    <span className="text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-widest">{setup.sets.length} SETS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-none pb-safe pt-4 border-t border-[hsl(var(--border))]">
          <button onClick={startWorkout} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95">
            <PlayCircle size={28} /> START WORKOUT
          </button>
        </div>
      </div>
    );
  }

  // Template List Screen
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
            <div key={template.id} onClick={() => setPreviewTemplate(template)} className="w-full bg-[hsl(var(--surface))] hover:brightness-110 transition-all duration-300 p-4 rounded-[2rem] border border-[hsl(var(--border))] flex justify-between items-center shadow-sm cursor-pointer group active:scale-95">
              <div className="flex-1 pl-2">
                <h3 className="text-2xl font-black text-[hsl(var(--foreground))] truncate">{template.name}</h3>
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.15em] mt-1.5">{template.exercises.length} EXERCISES</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDeleteTemplate(e, template.id, template.name)} className="p-3 text-[hsl(var(--muted))] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors active:scale-95">
                  <Trash2 size={20} />
                </button>
                <div className="bg-[hsl(var(--background))] p-4 rounded-full border-2 border-[hsl(var(--border))] group-hover:border-blue-500 transition-all shadow-inner">
                  <Play className="text-[hsl(var(--foreground))] ml-1" size={20} fill="currentColor" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (!currentExercise || !currentSetup) return null;

  return (
    <div className="bg-transparent rounded-[2rem] p-0 relative flex flex-col mt-2">
      {showTimerOverlay && (
        <div className="fixed inset-0 w-screen h-screen z-[100] bg-[#09090b]/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <span className="text-blue-500 font-black tracking-[0.4em] uppercase text-sm mb-12 drop-shadow-md">Take a break</span>
          <div className="relative w-64 h-64 flex items-center justify-center mb-16">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="hsl(var(--surface))" strokeWidth="8" fill="none" />
              <circle cx="128" cy="128" r="120" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="753" strokeDashoffset={753 - (753 * (restTimer || 0)) / defaultTimer} className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className="text-7xl font-black text-white tracking-tighter">{formatTime(restTimer || 0)}</span>
          </div>
          <div className="flex flex-col items-center mb-16">
            <span className="text-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest mb-3">Up Next</span>
            <span className="text-2xl font-black text-white text-center px-6">
              {isExerciseDone && !isWorkoutDone ? getExerciseDetails(activeTemplate.exercises[exerciseIndex + 1]?.exerciseId)?.name : `${currentExercise.name} (Set ${completedSets + 1})`}
            </span>
          </div>
          <button onClick={handleSkipTimer} className="flex items-center gap-2 text-white/50 hover:text-white bg-white/10 px-8 py-4 rounded-full font-black tracking-widest uppercase text-xs border border-white/20 transition-all active:scale-95 shadow-sm">
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
            <span className="bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-3 py-1.5 rounded-lg text-xs font-bold border border-[hsl(var(--border))] shadow-inner">{completedSets}/{plannedSets.length} Sets</span>
            {!isExerciseDone && <span className="text-blue-500 text-xs font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-inner">{tagLabels[currentTag as keyof typeof tagLabels]}</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
          <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Weight ({unit})</label></div>
          <div className="relative flex items-center">
            <input type="number" placeholder="0" value={weight} disabled={isExerciseDone} onChange={(e) => setWeight(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))] disabled:opacity-50" />
            <div className="absolute right-0 flex flex-col gap-1.5">
              <button disabled={isExerciseDone} onClick={() => adjustValue(setWeight, weight, 5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronUp size={16}/></button>
              <button disabled={isExerciseDone} onClick={() => adjustValue(setWeight, weight, -5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronDown size={16}/></button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
          <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Reps</label></div>
          <div className="relative flex items-center">
            <input type="number" placeholder="0" value={reps} disabled={isExerciseDone} onChange={(e) => setReps(e.target.value)} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))] disabled:opacity-50" />
            <div className="absolute right-0 flex flex-col gap-1.5">
              <button disabled={isExerciseDone} onClick={() => adjustValue(setReps, reps, 1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronUp size={16}/></button>
              <button disabled={isExerciseDone} onClick={() => adjustValue(setReps, reps, -1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 disabled:opacity-30"><ChevronDown size={16}/></button>
            </div>
          </div>
        </div>
      </div>

      {!isExerciseDone ? (
        <button onClick={handleLogSet} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
          <Check size={24} strokeWidth={3} /> LOG {tagLabels[currentTag as keyof typeof tagLabels].toUpperCase()}
        </button>
      ) : (
        <button onClick={() => { setExerciseIndex(i => i + 1); setCompletedSets(0); setWeight(""); setReps(""); }} className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
          Next Exercise <ChevronRight size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}