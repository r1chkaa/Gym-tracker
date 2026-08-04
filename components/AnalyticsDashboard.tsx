'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultExercises, type LoggedSet } from '@/lib/db';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { Weight, Check, Activity, CalendarDays, ChevronLeft, ChevronRight, X, Loader2, Plus } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [weightInput, setWeightInput] = useState("");
  const [unit, setUnit] = useState('lbs');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const formatInput = (val: string) => val.replace(/^0+(?=\d)/, '');

  useEffect(() => { setUnit(localStorage.getItem('gym_unit') || 'lbs'); }, []);

  const weightLogs = useLiveQuery(() => db.bodyWeightLogs.orderBy('date').toArray());
  const allSets = useLiveQuery(() => db.sets.toArray());
  
  const allExFlat = useMemo(() => defaultExercises.categories.flatMap(c => defaultExercises.exercises[c as keyof typeof defaultExercises.exercises]), []);

  if (weightLogs === undefined || allSets === undefined) {
    return <div className="h-full flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-[hsl(var(--muted))]" size={32}/></div>;
  }

  const chartData = weightLogs.map(log => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: log.weight
  }));

  const calculateVolume = () => {
    const categoryVolume: Record<string, number> = {};
    defaultExercises.categories.forEach(cat => categoryVolume[cat] = 0);
    const exToCategory: Record<string, string> = {};
    Object.entries(defaultExercises.exercises).forEach(([cat, exes]) => exes.forEach(ex => exToCategory[ex.id] = cat));
    allSets.forEach(set => {
      if (exToCategory[set.exerciseId]) categoryVolume[exToCategory[set.exerciseId]] += (set.weight * set.reps);
    });
    return Object.entries(categoryVolume).filter(([_, vol]) => vol > 0).sort((a, b) => b[1] - a[1]);
  };

  const volumeData = calculateVolume();

  const handleLogWeight = async () => {
    if (!weightInput) return;
    await db.bodyWeightLogs.add({ id: crypto.randomUUID(), weight: Number(weightInput), date: Date.now() });
    setWeightInput("");
  };

  const workoutDates = new Set(allSets.map(set => {
    const d = new Date(set.timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [];

  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ d: daysInPrevMonth - firstDayIndex + i + 1, m: prevM, y: prevY, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ d, m: month, y: year, isCurrentMonth: true });
  }
  const nextM = month === 11 ? 0 : month + 1;
  const nextY = month === 11 ? year + 1 : year;
  const remainingSlots = 42 - calendarCells.length;
  for (let d = 1; d <= remainingSlots; d++) {
    calendarCells.push({ d, m: nextM, y: nextY, isCurrentMonth: false });
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectedDaySets = [...allSets].sort((a, b) => a.timestamp - b.timestamp).filter(s => {
    const d = new Date(s.timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateString;
  });

  const setsByExercise = selectedDaySets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<string, LoggedSet[]>);

  const handleDayClick = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const cellDate = new Date(y, m, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Hard block any future dates
    if (cellDate > today) return; 

    setSelectedDateString(dateStr);
    setShowWorkoutModal(true);
  };

  const handleLogPastWorkout = () => {
    if (!selectedDateString) return;
    const [y, m, d] = selectedDateString.split('-').map(Number);
    const timestamp = new Date(y, m, d).getTime();
    window.dispatchEvent(new CustomEvent('start-past-workout', { detail: { timestamp } }));
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-[hsl(var(--card))] rounded-[2rem] p-5 sm:p-6 border border-[hsl(var(--border))] shadow-sm">
        <h2 className="text-xl font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-500" /> Workout History
        </h2>
        
        <div className="flex justify-between items-center mb-5 bg-[hsl(var(--surface))] rounded-xl p-1 border border-[hsl(var(--border))]">
          <button onClick={prevMonth} className="p-3 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronLeft size={18}/></button>
          <span className="font-black tracking-widest uppercase text-[hsl(var(--foreground))] text-sm">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="p-3 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95"><ChevronRight size={18}/></button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <span key={d} className="text-[10px] font-black text-[hsl(var(--muted))]">{d}</span>)}
        </div>
        
        <div className="grid grid-cols-7 grid-rows-6 gap-1.5">
          {calendarCells.map((cell, idx) => {
            const dateStr = `${cell.y}-${cell.m}-${cell.d}`;
            const isWorkout = workoutDates.has(dateStr);
            
            const cellDate = new Date(cell.y, cell.m, cell.d);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const isToday = cellDate.getTime() === today.getTime();
            const isFuture = cellDate > today;
            
            let baseClasses = "aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ";

            if (isFuture) {
              baseClasses += "opacity-20 cursor-not-allowed text-[hsl(var(--muted))] bg-[hsl(var(--surface))]";
            } else if (!isWorkout) {
              baseClasses += "opacity-40 cursor-pointer text-[hsl(var(--muted))] bg-[hsl(var(--surface))] hover:opacity-80 active:scale-95 border border-transparent border-dashed hover:border-[hsl(var(--border))]";
            } else {
              baseClasses += "cursor-pointer ";
              if (cell.isCurrentMonth) {
                baseClasses += "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:brightness-110 active:scale-95 ";
              } else {
                baseClasses += "bg-blue-500/30 text-blue-400 active:scale-95 ";
              }
            }
            
            if (isToday && !isWorkout) {
               baseClasses = baseClasses.replace('opacity-40', 'opacity-100 border-blue-500 text-blue-500 bg-blue-500/10 border-solid');
            }
            
            return (
              <button 
                key={`${dateStr}-${idx}`} 
                onClick={() => {
                  if (isFuture) return;
                  if (!cell.isCurrentMonth) setCurrentMonth(new Date(cell.y, cell.m, 1));
                  handleDayClick(dateStr);
                }}
                className={baseClasses}
                disabled={isFuture}
              >
                {cell.d}
              </button>
            )
          })}
        </div>
      </div>

      {showWorkoutModal && (
        <div className="fixed inset-0 bg-[#09090b]/95 backdrop-blur-2xl z-[200] flex flex-col w-screen h-screen px-4 pt-[max(env(safe-area-inset-top),3rem)] animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--card))] w-full max-w-md mx-auto rounded-[2rem] p-6 border border-[hsl(var(--border))] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-[hsl(var(--border))] pb-4">
              <div>
                <h3 className="text-2xl font-black text-[hsl(var(--foreground))]">Day Summary</h3>
                <p className="text-blue-500 text-xs font-black mt-1 uppercase tracking-widest">
                  {selectedDateString ? new Date(Number(selectedDateString.split('-')[0]), Number(selectedDateString.split('-')[1]), Number(selectedDateString.split('-')[2])).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </p>
              </div>
              <button onClick={() => setShowWorkoutModal(false)} className="text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-3 rounded-full transition-colors shadow-sm active:scale-95"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-10">
              {Object.keys(setsByExercise).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-60 text-center">
                  <span className="text-[hsl(var(--foreground))] font-black text-lg tracking-tight mb-4">No workout logged</span>
                  <button onClick={handleLogPastWorkout} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-sm transition-all active:scale-95 shadow-md">
                    <Plus size={16} /> Log Past Workout
                  </button>
                </div>
              ) : (
                Object.entries(setsByExercise).map(([exId, sets]) => {
                  const exName = allExFlat.find(e => e.id === exId)?.name || 'Unknown Exercise';
                  return (
                    <div key={exId} className="bg-[hsl(var(--surface))] p-5 rounded-[1.5rem] border border-[hsl(var(--border))] shadow-sm">
                      <h4 className="font-black text-base text-[hsl(var(--foreground))] mb-4">{exName}</h4>
                      <div className="space-y-2.5">
                        {sets.map((s, i) => (
                          <div key={s.id} className="flex justify-between items-center text-sm bg-[hsl(var(--background))] p-3 rounded-xl border border-[hsl(var(--border))] shadow-inner">
                            <span className="text-[hsl(var(--muted))] font-bold flex items-center gap-3">
                              Set {i + 1} 
                              {s.tag && s.tag !== 'normal' && <span className="text-[9px] uppercase bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-2 py-1 rounded border border-[hsl(var(--border))] tracking-widest font-black">{s.tag}</span>}
                            </span>
                            <span className="font-black text-[hsl(var(--foreground))]">{s.weight} <span className="text-[10px] text-[hsl(var(--muted))] font-bold">{unit}</span> × {s.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[hsl(var(--card))] rounded-[2rem] p-5 sm:p-6 border border-[hsl(var(--border))] shadow-sm">
        <h2 className="text-xl font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
          <Weight size={20} className="text-blue-500" /> Bodyweight
        </h2>
        
        <div className="relative mb-6">
          <input 
            type="number" 
            placeholder={`Enter current weight...`}
            value={weightInput} 
            onChange={(e) => setWeightInput(formatInput(e.target.value))} 
            className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-lg font-black p-5 pr-16 rounded-[1.5rem] border border-[hsl(var(--border))] focus:border-blue-500 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-inner transition-colors" 
          />
          <button 
            onClick={handleLogWeight} 
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-3 rounded-xl active:scale-95 transition-all shadow-md"
          >
            <Check size={20} strokeWidth={4} />
          </button>
        </div>

        {chartData.length > 0 ? (
          <div className="h-48 w-full -ml-4 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted))" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted))" fontSize={10} width={40} axisLine={false} tickLine={false} />
                <Tooltip isAnimationActive={false} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '1rem', fontWeight: '900', color: 'hsl(var(--foreground))' }} itemStyle={{ color: '#3b82f6' }} />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 opacity-50 border-2 border-dashed border-[hsl(var(--border))] rounded-3xl">
             <span className="text-[hsl(var(--foreground))] font-black text-sm tracking-tight">Log your weight to see trends.</span>
          </div>
        )}
      </div>

      <div className="bg-[hsl(var(--card))] rounded-[2rem] p-5 sm:p-6 border border-[hsl(var(--border))] shadow-sm mb-4">
        <h2 className="text-xl font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" /> Total Volume
        </h2>
        {volumeData.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {volumeData.map(([cat, vol]) => (
              <div key={cat} className="bg-[hsl(var(--surface))] p-4 rounded-xl border border-[hsl(var(--border))] flex flex-col justify-between shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] mb-1">{cat}</span>
                <span className="text-[hsl(var(--foreground))] font-black text-xl">{vol.toLocaleString()} <span className="text-[10px] font-bold text-[hsl(var(--muted))]">{unit}</span></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 opacity-50 border-2 border-dashed border-[hsl(var(--border))] rounded-3xl">
             <span className="text-[hsl(var(--foreground))] font-black text-sm tracking-tight">Complete workouts to track volume.</span>
          </div>
        )}
      </div>
    </div>
  );
}