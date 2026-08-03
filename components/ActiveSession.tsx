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
  
  const [skipRank, setSkipRank] = useState(false);
  const [skipXP, setSkipXP] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState<string | false>(false);

  // Points Animation Engine (Easing-based)
  useEffect(() => {
    if (step !== 'rank') return;
    const target = initialPoints + earnedPoints;
    let startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      if (skipRank) {
        setDisplayPoints(target);
        return;
      }

      let elapsed = now - startTime;
      let progress = Math.min(elapsed / 2500, 1);
      // easeOutQuart
      let eased = 1 - Math.pow(1 - progress, 4);

      let current = initialPoints + (target - initialPoints) * eased;
      setDisplayPoints(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayPoints(target);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, skipRank, initialPoints, earnedPoints]);

  // XP Animation Engine (Easing-based)
  useEffect(() => {
    if (step !== 'xp') return;
    const targetXP: Record<string, number> = {};
    Object.keys(earnedXP).forEach(m => targetXP[m] = (initialXP[m] || 0) + earnedXP[m]);
    
    let startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      if (skipXP) {
        setDisplayXP(targetXP);
        return;
      }

      let elapsed = now - startTime;
      let progress = Math.min(elapsed / 2500, 1);
      // easeOutQuart
      let eased = 1 - Math.pow(1 - progress, 4);

      let currentXP: Record<string, number> = {};
      Object.keys(targetXP).forEach(m => {
        currentXP[m] = (initialXP[m] || 0) + (targetXP[m] - (initialXP[m] || 0)) * eased;
      });

      setDisplayXP(currentXP);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayXP(targetXP);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, skipXP, initialXP, earnedXP]);

  const handleNext = () => {
    if (step === 'rank') {
      if (!skipRank) {
        setSkipRank(true);
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        setStep('xp');
      }
    } else {
      if (!skipXP) {
        setSkipXP(true);
      } else {
        onComplete();
      }
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
              
              return (
                <div key={muscle} className={`bg-white/5 border p-5 rounded-3xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 fill-mode-both transition-all border-white/10`} style={{ animationDelay: `${idx * 150}ms` }}>
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
  const bwLogs = useLiveQuery(() => db.bodyWeightLogs.orderBy('date').toArray());
  const userBw = bwLogs && bwLogs.length > 0 ? bwLogs[bwLogs.length - 1].weight : 0;
  
  const [unit, setUnit] = useState('lbs');
  const [defaultTimer, setDefaultTimer] = useState(90);
  const [useWakeLock, setUseWakeLock] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Standard Mode State
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [completedSets, setCompletedSets] = useState<number>(0);

  // Dropset State
  const [dropsets, setDropsets] = useState([{ weight: "", reps: "", leftWeight: "", leftReps: "", rightWeight: "", rightReps: "" }]);

  // Unilateral State
  const [leftWeight, setLeftWeight] = useState("");
  const [leftReps, setLeftReps] = useState("");
  const [rightWeight, setRightWeight] = useState("");
  const [rightReps, setRightReps] = useState("");

  // Bodyweight State
  const [bwMode, setBwMode] = useState<'strict' | 'weighted' | 'assisted'>('strict');
  const [bwExtra, setBwExtra] = useState("");
  
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [totalRestTime, setTotalRestTime] = useState<number>(90);
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

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const currentSetup = activeTemplate?.exercises[exerciseIndex];
  const currentExercise = currentSetup ? getExerciseDetails(currentSetup.exerciseId) : null;
  const plannedSets = currentSetup?.sets || [];
  const currentPlannedSet = plannedSets[completedSets] || { tag: 'normal', targetReps: '8-12' };
  const currentTag = currentPlannedSet.tag;
  
  const isExerciseDone = completedSets >= plannedSets.length;
  const isWorkoutDone = isExerciseDone && exerciseIndex >= (activeTemplate?.exercises.length || 0) - 1;

  const isUnilateral = !!currentExercise?.name.toLowerCase().match(/(one arm|single arm|alternating|unilateral)/);
  const isBodyweight = currentExercise?.equipment === 'Bodyweight';

  // Reset local form states on set/exercise change
  useEffect(() => {
    setWeight("");
    setReps("");
    setDropsets([{ weight: "", reps: "", leftWeight: "", leftReps: "", rightWeight: "", rightReps: "" }]);
    setLeftWeight(""); setLeftReps(""); setRightWeight(""); setRightReps("");
    setBwExtra(""); setBwMode('strict');
  }, [exerciseIndex, completedSets]);

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
          triggerHaptic(true); 
          playAudio('timerend.mp3'); 
          setShowTimerOverlay(false);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Rest Complete', { body: 'Time for your next set!', icon: '/icon512_maskable.png' });
          }

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
  };

  const handleSkipTimer = () => {
    triggerHaptic(); playAudio('timerend.mp3'); setShowTimerOverlay(false); setRestTimer(0);
    if (isExerciseDone && !isWorkoutDone) { 
      setExerciseIndex(i => i + 1); 
      setCompletedSets(0); 
    }
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
    if (!sessionId || !currentExercise) return;
    triggerHaptic();

    const exCategory = Object.entries(defaultExercises.exercises).find(([_, exes]) => exes.some(e => e.id === currentExercise.id))?.[0] || 'Unknown';
    let pointsGained = 0;
    let xpGained = 0;
    const setsToLog: { weight: number, reps: number }[] = [];

    if (currentTag === 'drop') {
      if (isUnilateral) {
        if (dropsets.some(d => !d.leftWeight || !d.leftReps || !d.rightWeight || !d.rightReps)) return;
        dropsets.forEach(d => {
          const lw = Number(d.leftWeight); const lr = Number(d.leftReps);
          const rw = Number(d.rightWeight); const rr = Number(d.rightReps);
          pointsGained += ((lw * lr) * (1 + (lw / 150))) + ((rw * rr) * (1 + (rw / 150)));
          xpGained += (lw * lr) + (rw * rr);
          setsToLog.push({ weight: lw, reps: lr });
          setsToLog.push({ weight: rw, reps: rr });
        });
      } else {
        if (dropsets.some(d => !d.weight || !d.reps)) return;
        dropsets.forEach(d => {
          const w = Number(d.weight); const r = Number(d.reps);
          pointsGained += (w * r) * (1 + (w / 150));
          xpGained += w * r;
          setsToLog.push({ weight: w, reps: r });
        });
      }
    } else if (isUnilateral) {
      if (!leftWeight || !leftReps || !rightWeight || !rightReps) return;
      const lw = Number(leftWeight); const lr = Number(leftReps);
      const rw = Number(rightWeight); const rr = Number(rightReps);
      pointsGained += ((lw * lr) * (1 + (lw / 150))) + ((rw * rr) * (1 + (rw / 150)));
      xpGained += (lw * lr) + (rw * rr);
      setsToLog.push({ weight: lw, reps: lr });
      setsToLog.push({ weight: rw, reps: rr });
    } else if (isBodyweight) {
      const r = Number(reps);
      if (!r) return;
      
      let actualWeight = userBw;
      if (bwMode === 'weighted') actualWeight += Number(bwExtra || 0);
      else if (bwMode === 'assisted') actualWeight = Math.max(0, actualWeight - Number(bwExtra || 0));
      
      pointsGained += (actualWeight * r) * (1 + (actualWeight / 150));
      xpGained += actualWeight * r;
      setsToLog.push({ weight: actualWeight, reps: r });
    } else {
      if (!weight || !reps) return;
      const wNum = Number(weight); const rNum = Number(reps);
      pointsGained += (wNum * rNum) * (1 + (wNum / 150));
      xpGained += wNum * rNum;
      setsToLog.push({ weight: wNum, reps: rNum });
    }

    const newSessionPoints = sessionPoints + pointsGained;
    const newSessionXP = { ...sessionXP, [exCategory]: (sessionXP[exCategory] || 0) + xpGained };

    setSessionPoints(newSessionPoints); setSessionXP(newSessionXP);

    try {
      for (const s of setsToLog) {
        await db.sets.add({
          id: crypto.randomUUID(), sessionId, exerciseId: currentExercise.id,
          setNumber: completedSets + 1, weight: s.weight, reps: s.reps,
          isCompleted: true, timestamp: Date.now(), tag: currentTag
        });
      }
      
      const newCompleted = completedSets + 1;
      setCompletedSets(newCompleted);
      
      if (newCompleted >= plannedSets.length && exerciseIndex >= activeTemplate!.exercises.length - 1) {
        endWorkout(newSessionPoints, newSessionXP);
      } else {
        setRestTimer(defaultTimer); setTotalRestTime(defaultTimer); setShowTimerOverlay(true);
      }
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
          <div className="relative w-64 h-64 flex items-center justify-center mb-10">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="hsl(var(--surface))" strokeWidth="8" fill="none" />
              <circle cx="128" cy="128" r="120" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="753" strokeDashoffset={753 - (753 * (restTimer || 0)) / totalRestTime} className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className="text-7xl font-black text-white tracking-tighter">{formatTime(restTimer || 0)}</span>
          </div>

          <button onClick={() => { setRestTimer(prev => (prev || 0) + 30); setTotalRestTime(prev => prev + 30); }} className="mb-12 px-6 py-2 border-2 border-white/20 text-white font-black tracking-widest text-xs uppercase rounded-full hover:bg-white/10 active:scale-95 transition-all shadow-sm">
            + 30 SEC
          </button>

          <div className="flex flex-col items-center mb-10">
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

      {currentTag === 'drop' && !isExerciseDone ? (
        <div className="flex flex-col gap-4 mb-6 animate-in slide-in-from-bottom-2">
          {dropsets.map((ds, i) => (
            <div key={i} className="flex flex-col gap-3 bg-[hsl(var(--surface))] p-4 rounded-3xl border border-[hsl(var(--border))] shadow-sm relative">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[hsl(var(--muted))] text-[10px] uppercase tracking-widest bg-[hsl(var(--background))] px-2 py-1 rounded-md border border-[hsl(var(--border))]">Drop #{i + 1}</span>
                {i > 0 && (
                  <button onClick={() => setDropsets(d => d.filter((_, idx) => idx !== i))} className="text-[hsl(var(--muted))] hover:text-red-500 active:scale-75 transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {isUnilateral ? (
                <>
                  {/* Left Arm Drop */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                      <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">L Arm Wgt</span>
                      <input type="number" placeholder="0" value={ds.leftWeight} onChange={(e) => {
                        const newDs = [...dropsets]; newDs[i].leftWeight = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                      }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                    </div>
                    <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                      <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">L Arm Reps</span>
                      <input type="number" placeholder="0" value={ds.leftReps} onChange={(e) => {
                        const newDs = [...dropsets]; newDs[i].leftReps = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                      }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                    </div>
                  </div>
                  {/* Right Arm Drop */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                      <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">R Arm Wgt</span>
                      <input type="number" placeholder="0" value={ds.rightWeight} onChange={(e) => {
                        const newDs = [...dropsets]; newDs[i].rightWeight = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                      }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                    </div>
                    <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                      <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">R Arm Reps</span>
                      <input type="number" placeholder="0" value={ds.rightReps} onChange={(e) => {
                        const newDs = [...dropsets]; newDs[i].rightReps = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                      }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-4">
                  <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                    <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">Weight</span>
                    <input type="number" placeholder="0" value={ds.weight} onChange={(e) => {
                      const newDs = [...dropsets]; newDs[i].weight = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                    }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                  </div>
                  <div className="flex-1 relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                    <span className="absolute -top-2 left-2 bg-[hsl(var(--surface))] px-1.5 text-[8px] font-black uppercase text-[hsl(var(--muted))] tracking-widest rounded-sm">Reps</span>
                    <input type="number" placeholder="0" value={ds.reps} onChange={(e) => {
                      const newDs = [...dropsets]; newDs[i].reps = e.target.value.replace(/^0+(?=\d)/, ''); setDropsets(newDs);
                    }} className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black text-center py-3 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--muted))]" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setDropsets([...dropsets, { weight: "", reps: "", leftWeight: "", leftReps: "", rightWeight: "", rightReps: "" }])} className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm">
            + Add Drop
          </button>
        </div>
      ) : isUnilateral && !isExerciseDone ? (
        <div className="flex flex-col gap-4 mb-6 animate-in slide-in-from-bottom-2">
          {/* Left Arm */}
          <div className="bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
            <span className="absolute -top-3 left-4 bg-[hsl(var(--background))] px-2 text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-widest border border-[hsl(var(--border))] rounded-md">Left Arm</span>
            <div className="flex gap-4 mt-2">
              <div className="flex-1 relative flex items-center">
                <input type="number" placeholder="0" value={leftWeight} onChange={(e) => setLeftWeight(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-4xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                <span className="absolute right-0 text-[10px] font-bold text-[hsl(var(--muted))] uppercase">{unit}</span>
              </div>
              <div className="w-[1px] bg-[hsl(var(--border))]" />
              <div className="flex-1 relative flex items-center">
                <input type="number" placeholder="0" value={leftReps} onChange={(e) => setLeftReps(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-4xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                <span className="absolute right-0 text-[10px] font-bold text-[hsl(var(--muted))] uppercase">Reps</span>
              </div>
            </div>
          </div>

          {/* Right Arm */}
          <div className="bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
            <span className="absolute -top-3 left-4 bg-[hsl(var(--background))] px-2 text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-widest border border-[hsl(var(--border))] rounded-md">Right Arm</span>
            <div className="flex gap-4 mt-2">
              <div className="flex-1 relative flex items-center">
                <input type="number" placeholder="0" value={rightWeight} onChange={(e) => setRightWeight(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-4xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                <span className="absolute right-0 text-[10px] font-bold text-[hsl(var(--muted))] uppercase">{unit}</span>
              </div>
              <div className="w-[1px] bg-[hsl(var(--border))]" />
              <div className="flex-1 relative flex items-center">
                <input type="number" placeholder="0" value={rightReps} onChange={(e) => setRightReps(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-4xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                <span className="absolute right-0 text-[10px] font-bold text-[hsl(var(--muted))] uppercase">Reps</span>
              </div>
            </div>
          </div>
        </div>
      ) : isBodyweight && !isExerciseDone ? (
        <div className="flex flex-col gap-4 mb-6 animate-in slide-in-from-bottom-2">
          <div className="flex bg-[hsl(var(--surface))] rounded-xl p-1 border border-[hsl(var(--border))] shadow-inner">
            <button onClick={() => setBwMode('strict')} className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors ${bwMode === 'strict' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Bodyweight</button>
            <button onClick={() => setBwMode('weighted')} className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors ${bwMode === 'weighted' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Weighted</button>
            <button onClick={() => setBwMode('assisted')} className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors ${bwMode === 'assisted' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Assisted</button>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
              <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">{bwMode === 'strict' ? 'Current BW' : bwMode === 'weighted' ? '+ Extra Weight' : '- Band Resist.'}</label></div>
              <div className="relative flex items-center justify-center">
                {bwMode === 'strict' ? (
                  <div className="w-full text-[hsl(var(--foreground))] text-5xl font-black text-center">{userBw}<span className="text-xl ml-1">{unit}</span></div>
                ) : (
                  <input type="number" placeholder="0" value={bwExtra} onChange={(e) => setBwExtra(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                )}
                {bwMode !== 'strict' && (
                  <div className="absolute right-0 flex flex-col gap-1.5">
                    <button onClick={() => adjustValue(setBwExtra, bwExtra, 5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronUp size={16}/></button>
                    <button onClick={() => adjustValue(setBwExtra, bwExtra, -5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronDown size={16}/></button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
              <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Reps</label></div>
              <div className="relative flex items-center">
                <input type="number" placeholder="0" value={reps} onChange={(e) => setReps(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
                <div className="absolute right-0 flex flex-col gap-1.5">
                  <button onClick={() => adjustValue(setReps, reps, 1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronUp size={16}/></button>
                  <button onClick={() => adjustValue(setReps, reps, -1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronDown size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !isExerciseDone ? (
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
            <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Weight ({unit})</label></div>
            <div className="relative flex items-center">
              <input type="number" placeholder="0" value={weight} onChange={(e) => setWeight(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
              <div className="absolute right-0 flex flex-col gap-1.5">
                <button onClick={() => adjustValue(setWeight, weight, 5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronUp size={16}/></button>
                <button onClick={() => adjustValue(setWeight, weight, -5)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronDown size={16}/></button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[hsl(var(--surface))] rounded-3xl p-4 border border-[hsl(var(--border))] shadow-sm relative">
            <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest px-2">Reps</label></div>
            <div className="relative flex items-center">
              <input type="number" placeholder="0" value={reps} onChange={(e) => setReps(e.target.value.replace(/^0+(?=\d)/, ''))} className="w-full bg-transparent text-[hsl(var(--foreground))] text-5xl font-black text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[hsl(var(--border))]" />
              <div className="absolute right-0 flex flex-col gap-1.5">
                <button onClick={() => adjustValue(setReps, reps, 1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronUp size={16}/></button>
                <button onClick={() => adjustValue(setReps, reps, -1)} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] p-2 rounded-xl border border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronDown size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isExerciseDone ? (
        <button onClick={handleLogSet} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
          <Check size={24} strokeWidth={3} /> LOG {tagLabels[currentTag as keyof typeof tagLabels].toUpperCase()}
        </button>
      ) : (
        <button onClick={() => { setExerciseIndex(i => i + 1); setCompletedSets(0); }} className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
          Next Exercise <ChevronRight size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}