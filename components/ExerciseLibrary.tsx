'use client';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { defaultExercises, db } from '@/lib/db';
import { 
  Dumbbell, Activity, ArrowLeft, BarChart, Heart, 
  Target, Link, PersonStanding, CircleDashed, Settings2, GripHorizontal, ChevronRight, X, Search, Weight, Circle, LifeBuoy, Scaling, Infinity as InfinityIcon
} from 'lucide-react';

const MuscleIcons = {
  Chest: () => <img src="/icons/chest.svg" alt="Chest" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Back: () => <img src="/icons/back.svg" alt="Back" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Tricep: () => <img src="/icons/tricep.svg" alt="Tricep" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Bicep: () => <img src="/icons/bicep.svg" alt="Bicep" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Shoulder: () => <img src="/icons/shoulder.svg" alt="Shoulder" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Forearms: () => <img src="/icons/forearms.svg" alt="Forearms" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Legs: () => <img src="/icons/legs.svg" alt="Legs" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />,
  Core: () => <img src="/icons/core.svg" alt="Core" className="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />
};

const getMechanicIcon = (m: string) => m === 'Compound' ? <Activity size={12} className="text-blue-500" /> : <Target size={12} className="text-cyan-500" />;

const getEquipmentIcon = (e: string) => {
  const eq = e.toLowerCase();
  if (eq.includes('kettlebell')) return <Weight size={12} className="text-orange-500" />;
  if (eq.includes('dumbbell')) return <Dumbbell size={12} className="text-purple-400" />;
  if (eq.includes('barbell')) return <GripHorizontal size={12} className="text-blue-500" />;
  if (eq.includes('bands')) return <InfinityIcon size={12} className="text-yellow-500" />;
  if (eq.includes('e-z')) return <Scaling size={12} className="text-green-400" />;
  if (eq.includes('cable')) return <Link size={12} className="text-cyan-400" />;
  if (eq.includes('medicine')) return <Circle size={12} className="text-red-400" />;
  if (eq.includes('exercise ball')) return <LifeBuoy size={12} className="text-teal-400" />;
  if (eq.includes('bodyweight') || eq.includes('body')) return <PersonStanding size={12} className="text-green-500" />;
  if (eq.includes('machine')) return <Settings2 size={12} className="text-gray-400" />;
  if (eq.includes('foam')) return <CircleDashed size={12} className="text-pink-400" />;
  return <Settings2 size={12} className="text-[hsl(var(--muted))]" />;
};

export default function ExerciseLibrary() {
  const { categories, exercises } = defaultExercises;
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const favoriteDocs = useLiveQuery(() => db.favorites.toArray()) || [];
  const favoriteIds = useMemo(() => new Set(favoriteDocs.map(f => f.exerciseId)), [favoriteDocs]);

  const activeExercises = useMemo(() => activeCategory ? exercises[activeCategory as keyof typeof exercises] || [] : [], [activeCategory, exercises]);
  const equipmentTypes = useMemo(() => Array.from(new Set(activeExercises.map(ex => ex.equipment))).sort(), [activeExercises]);

  const filteredExercises = useMemo(() => {
    let list = activeExercises;
    if (selectedEquipment === 'Favorites') list = list.filter(ex => favoriteIds.has(ex.id));
    else if (selectedEquipment) list = list.filter(ex => ex.equipment === selectedEquipment);
    if (searchQuery) list = list.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [activeExercises, selectedEquipment, favoriteIds, searchQuery]);

  const toggleFavorite = async (e: React.MouseEvent, exId: string) => {
    e.stopPropagation(); 
    if (favoriteIds.has(exId)) {
      await db.favorites.delete(exId);
    } else {
      await db.favorites.add({ exerciseId: exId });
    }
  };

  const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (selectedExercise) {
    const isFav = favoriteIds.has(selectedExercise.id);
    return (
      <div className="fixed inset-0 z-[100] bg-[hsl(var(--background))] flex flex-col animate-in slide-in-from-right-4 duration-300 w-screen h-screen">
        <div className="flex-none flex items-center justify-between p-6 pt-[max(env(safe-area-inset-top),3rem)] relative z-10 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-sm">
          <button onClick={() => setSelectedExercise(null)} className="p-2 bg-[hsl(var(--surface))] rounded-xl text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors flex-shrink-0 border border-[hsl(var(--border))]">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 px-3 truncate text-center">
            <h2 className="text-xl font-black text-[hsl(var(--foreground))] truncate">{selectedExercise.name}</h2>
          </div>
          <button onClick={(e) => toggleFavorite(e, selectedExercise.id)} className="p-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl transition-transform active:scale-75 flex-shrink-0">
            <Heart size={20} className={isFav ? "fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-[hsl(var(--muted))] hover:text-red-400"} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-32 max-w-[600px] mx-auto w-full">
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
              <BarChart size={12} className={selectedExercise.level === 'Beginner' ? 'text-green-500' : selectedExercise.level === 'Intermediate' ? 'text-yellow-500' : 'text-red-500'} /> {selectedExercise.level}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
              {getMechanicIcon(selectedExercise.mechanic)} {selectedExercise.mechanic}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
              {getEquipmentIcon(selectedExercise.equipment)} {selectedExercise.equipment}
            </span>
          </div>

          {selectedExercise.images && selectedExercise.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {selectedExercise.images.map((imgPath: string, idx: number) => (
                <button key={idx} onClick={() => setFullscreenImage(imgPath)} className="aspect-square bg-[hsl(var(--card))] rounded-[1.5rem] border-2 border-[hsl(var(--border))] overflow-hidden flex items-center justify-center transition-transform active:scale-95 shadow-md">
                  <img src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imgPath}`} alt="Step" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-[hsl(var(--surface))] rounded-[1.5rem] border border-[hsl(var(--border))] p-5 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] flex items-center gap-2 border-b border-[hsl(var(--border))] pb-2">
              <Target size={14} /> Muscle Activation
            </h4>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider block mb-2">Primary</span>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.primaryMuscles.map((m: string) => (
                    <span key={m} className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-lg">
                      {capitalize(m)}
                    </span>
                  ))}
                </div>
              </div>
              {selectedExercise.secondaryMuscles.length > 0 && (
                <div>
                  <span className="text-[9px] font-black uppercase text-[hsl(var(--muted))] tracking-wider block mb-2">Secondary</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.secondaryMuscles.map((m: string) => (
                      <span key={m} className="bg-[hsl(var(--card))] text-[hsl(var(--muted))] border border-[hsl(var(--border))] text-xs font-bold px-3 py-1 rounded-lg">
                        {capitalize(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
            <div className="bg-[hsl(var(--surface))] rounded-[1.5rem] border border-[hsl(var(--border))] p-5 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted))] mb-4 border-b border-[hsl(var(--border))] pb-2">Execution Steps</h4>
              <ol className="list-decimal list-outside pl-4 space-y-3 text-sm text-[hsl(var(--foreground))] font-medium marker:text-blue-500 marker:font-black">
                {selectedExercise.instructions.map((step: string, idx: number) => (
                  <li key={idx} className="pl-2 leading-relaxed opacity-90">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {fullscreenImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
            <button className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/20">
              <X size={24} />
            </button>
            <img src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${fullscreenImage}`} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-[2rem] bg-[hsl(var(--card))] p-2 shadow-2xl ring-4 ring-[hsl(var(--border))]" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  if (activeCategory) {
    return (
      <div className="fixed inset-0 z-[60] bg-[hsl(var(--background))] flex flex-col animate-in slide-in-from-right-4 duration-300 w-screen h-screen">
        <div className="flex-none flex items-center gap-4 p-6 pt-[max(env(safe-area-inset-top),3rem)] bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-sm z-10">
          <button onClick={() => { setActiveCategory(null); setSelectedEquipment(null); setSearchQuery(""); }} className="p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-black text-[hsl(var(--foreground))] uppercase tracking-wider truncate flex-1">
            {activeCategory}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col min-w-0 max-w-[600px] mx-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="relative mt-4 mx-4 mb-3">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-[hsl(var(--muted))]" />
            </div>
            <input 
              type="text" 
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm font-bold py-3 pl-10 pr-3 rounded-xl border border-[hsl(var(--border))] focus:border-blue-500 focus:outline-none transition-colors shadow-inner placeholder:text-[hsl(var(--muted))]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-3 flex items-center text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
                <X size={14} />
              </button>
            )}
          </div>

          {equipmentTypes.length > 0 && (
            <div className="flex-none mb-3 border-b border-[hsl(var(--border))]/50 pb-3">
              {/* Perfectly aligned padding for the 'All' pill */}
              <div className="flex gap-2 overflow-x-auto px-4 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button onClick={() => setSelectedEquipment(null)} className={`flex-shrink-0 snap-start whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all border ${!selectedEquipment ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]' : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted))] border-[hsl(var(--border))] hover:border-[hsl(var(--muted))]'}`}>All</button>
                <button onClick={() => setSelectedEquipment('Favorites')} className={`flex-shrink-0 snap-start whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all border flex items-center gap-1.5 ${selectedEquipment === 'Favorites' ? 'bg-red-500 text-white border-red-500' : 'bg-[hsl(var(--surface))] text-red-400 border-[hsl(var(--border))] hover:border-red-400/50'}`}>
                  <Heart size={12} className={selectedEquipment === 'Favorites' ? 'fill-white' : 'fill-red-400'} /> Favorites
                </button>
                {equipmentTypes.map(eq => (
                  <button key={eq} onClick={() => setSelectedEquipment(eq)} className={`flex-shrink-0 snap-start whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all border ${selectedEquipment === eq ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]' : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted))] border-[hsl(var(--border))] hover:border-[hsl(var(--muted))]'}`}>{eq}</button>
                ))}
                <div className="w-4 flex-shrink-0" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 px-4 pb-32">
            {filteredExercises.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 opacity-60">
                 <span className="text-[hsl(var(--foreground))] font-black text-lg tracking-tight">No exercises found.</span>
               </div>
            ) : (
              filteredExercises.map((ex) => {
                const isFav = favoriteIds.has(ex.id);
                return (
                  <div 
                    key={ex.id} 
                    onClick={() => setSelectedExercise(ex)}
                    className="bg-[hsl(var(--surface))] rounded-2xl border border-[hsl(var(--border))] shadow-sm transition-all duration-200 cursor-pointer overflow-hidden flex-shrink-0 hover:border-blue-500/40 hover:brightness-110"
                  >
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[hsl(var(--foreground))] font-black text-base leading-tight pr-2 truncate">{ex.name}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={(e) => toggleFavorite(e, ex.id)} className="p-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-full transition-transform active:scale-75">
                            <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : "text-[hsl(var(--muted))] hover:text-red-400"} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2 py-1 rounded flex items-center gap-1">
                          <BarChart size={10} className={ex.level === 'Beginner' ? 'text-green-500' : ex.level === 'Intermediate' ? 'text-yellow-500' : 'text-red-500'} /> {ex.level}
                        </span>
                        <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2 py-1 rounded flex items-center gap-1">
                          {getMechanicIcon(ex.mechanic)} {ex.mechanic}
                        </span>
                        <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2 py-1 rounded flex items-center gap-1">
                          {getEquipmentIcon(ex.equipment)} {ex.equipment}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="flex-1 grid grid-cols-2 grid-rows-4 gap-3 pb-8 px-4 h-full min-h-0 max-h-[calc(100dvh-150px)] overflow-hidden">
      {categories.map((category) => {
        const Icon = MuscleIcons[category as keyof typeof MuscleIcons];
        return (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className="group relative flex flex-col items-center justify-center w-full h-full bg-[hsl(var(--surface))] rounded-[2rem] border border-[hsl(var(--border))] shadow-sm hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 active:scale-[0.95] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center transform-gpu group-hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 mb-1 flex items-center justify-center drop-shadow-md">
                {Icon && <Icon />}
              </div>
              <span className="font-black text-[13px] tracking-widest uppercase text-[hsl(var(--foreground))] drop-shadow-sm">
                {category}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}