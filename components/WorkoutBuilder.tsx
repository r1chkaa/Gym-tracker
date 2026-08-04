'use client';
import { useState } from 'react';
import { defaultExercises, db } from '@/lib/db';
import { Save, Plus, Trash2, X, ChevronRight, ArrowLeft, ChevronDown, ChevronUp, PenLine, Search, Info } from 'lucide-react';

type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

interface PlannedExercise {
  id: string;
  name: string;
  sets: { tag: SetType, targetReps: string }[];
}

export default function WorkoutBuilder() {
  const [templateName, setTemplateName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<PlannedExercise[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoModal, setShowInfoModal] = useState<any | null>(null);

  const tagLabels = { normal: 'Normal', warmup: 'Warm-up', drop: 'Dropset', failure: 'Failure' };

  const handleAddExercise = (exercise: {id: string, name: string}) => {
    const newExercises: PlannedExercise[] = [
      ...selectedExercises, 
      { id: exercise.id, name: exercise.name, sets: [{ tag: 'normal' as SetType, targetReps: '8-12' }] }
    ];
    setSelectedExercises(newExercises);
    setIsModalOpen(false);
    setActiveCategory(null);
    setSearchQuery("");
  };

  const addSet = (exIndex: number) => {
    const updated = [...selectedExercises];
    updated[exIndex].sets.push({ tag: 'normal', targetReps: '8-12' });
    setSelectedExercises(updated);
  };

  const cycleTag = (exIndex: number, setIndex: number) => {
    const tags: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const current = selectedExercises[exIndex].sets[setIndex].tag;
    const next = tags[(tags.indexOf(current) + 1) % tags.length];
    const updated = [...selectedExercises];
    updated[exIndex].sets[setIndex].tag = next;
    setSelectedExercises(updated);
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const updated = [...selectedExercises];
    updated[exIndex].sets.splice(setIndex, 1);
    setSelectedExercises(updated);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= selectedExercises.length) return;
    const updated = [...selectedExercises];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setSelectedExercises(updated);
  };

  const handleSaveTemplate = async () => {
    if (selectedExercises.length === 0) return;
    try {
      await db.templates.add({
        id: crypto.randomUUID(),
        name: templateName || "Unnamed Routine",
        order: 0,
        exercises: selectedExercises.map(ex => ({ exerciseId: ex.id, sets: ex.sets }))
      });
      alert("Routine saved successfully!");
      setTemplateName("");
      setSelectedExercises([]);
    } catch (error) { console.error("Failed to save template:", error); }
  };

  if (showInfoModal) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex flex-col p-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-6 pt-[max(env(safe-area-inset-top),1rem)]">
          <h2 className="text-2xl font-black text-white">{showInfoModal.name}</h2>
          <button onClick={() => setShowInfoModal(null)} className="text-white/50 hover:text-white p-2 bg-white/10 rounded-full border border-white/20"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {showInfoModal.images?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {showInfoModal.images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <img src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`} alt="Step" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {showInfoModal.instructions?.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <ol className="list-decimal list-outside pl-4 space-y-3 text-sm text-white/90 marker:text-blue-500 marker:font-black">
                {showInfoModal.instructions.map((step: string, idx: number) => <li key={idx} className="pl-2 leading-relaxed">{step}</li>)}
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent rounded-[2rem] p-0 relative flex flex-col h-full">
      
      <div className="flex-none flex items-center gap-3 mb-6 border-b border-[hsl(var(--border))] pb-3 focus-within:border-blue-500 transition-colors mx-2 mt-4">
        <input 
          type="text" 
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="w-full bg-transparent text-[hsl(var(--foreground))] text-3xl font-black outline-none placeholder:text-[hsl(var(--muted))]"
          placeholder="Routine Name..."
        />
        <PenLine className="text-[hsl(var(--muted))]" size={20} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-10">
        {selectedExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-60 animate-in fade-in duration-500 text-center">
            <span className="text-[hsl(var(--foreground))] font-black text-xl tracking-tight mb-2 leading-tight">Tap below to add<br/>your first exercise.</span>
          </div>
        )}
        
        {selectedExercises.map((ex, exIdx) => (
          <div key={exIdx} className="bg-[hsl(var(--surface))] rounded-3xl p-5 border border-[hsl(var(--border))] shadow-sm mb-4 animate-in slide-in-from-bottom-2 relative">
             <div className="flex justify-between items-start mb-4">
                 <h3 className="font-black text-[hsl(var(--foreground))] text-xl pr-2 leading-tight">{ex.name}</h3>
                 <div className="flex flex-col gap-1 items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-1 shrink-0">
                     <button onClick={() => moveExercise(exIdx, -1)} disabled={exIdx === 0} className="text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] disabled:opacity-20 transition-colors p-1"><ChevronUp size={16}/></button>
                     <div className="w-full h-px bg-[hsl(var(--border))]"></div>
                     <button onClick={() => moveExercise(exIdx, 1)} disabled={exIdx === selectedExercises.length - 1} className="text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] disabled:opacity-20 transition-colors p-1"><ChevronDown size={16}/></button>
                 </div>
             </div>
             
             <div className="space-y-2.5">
                {ex.sets.map((set, setIdx) => (
                   <div key={setIdx} className="flex justify-between items-center bg-[hsl(var(--background))] p-3 rounded-2xl border border-[hsl(var(--border))] shadow-inner">
                       <span className="font-bold text-[hsl(var(--muted))] w-14 uppercase text-[10px] tracking-widest">Set {setIdx + 1}</span>
                       <button 
                         onClick={() => cycleTag(exIdx, setIdx)} 
                         className={`flex-1 mx-2 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase transition-colors active:scale-95 border ${
                           set.tag === 'normal' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-transparent' :
                           set.tag === 'warmup' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                           set.tag === 'drop' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                           'bg-red-500/10 text-red-500 border-red-500/20'
                         }`}
                       >
                          {tagLabels[set.tag]}
                       </button>
                       <button onClick={() => removeSet(exIdx, setIdx)} className="text-[hsl(var(--muted))] hover:text-red-500 p-2 active:scale-75 transition-transform"><Trash2 size={16}/></button>
                   </div>
                ))}
             </div>
             
             <div className="flex gap-2 mt-4">
                 <button onClick={() => addSet(exIdx)} className="flex-1 bg-blue-500/10 text-blue-500 font-black py-3 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-blue-500/20 active:scale-95 transition-all border border-blue-500/20">
                    + Add Set
                 </button>
                 <button onClick={() => removeExercise(exIdx)} className="bg-red-500/10 text-red-500 font-black px-4 py-3 rounded-2xl hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20">
                    <Trash2 size={16} />
                 </button>
             </div>
          </div>
        ))}
      </div>

      <div className="flex-none space-y-4 pt-4 pb-8 border-t border-[hsl(var(--border))] z-10 relative bg-[hsl(var(--background))]">
        <button onClick={() => setIsModalOpen(true)} className="w-full bg-[hsl(var(--surface))] text-blue-500 p-4 rounded-2xl border border-blue-500/30 font-black flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95 hover:brightness-110">
          <Plus size={20} /> ADD EXERCISE
        </button>

        <button onClick={handleSaveTemplate} disabled={selectedExercises.length === 0} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[hsl(var(--surface))] disabled:text-[hsl(var(--muted))] disabled:border disabled:border-[hsl(var(--border))] text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
          <Save size={20} /> SAVE ROUTINE
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[hsl(var(--background))]/95 backdrop-blur-xl z-[100] flex flex-col p-4 pt-[max(env(safe-area-inset-top),3rem)] animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-[hsl(var(--foreground))]">{activeCategory || "Muscle Group"}</h2>
            <button onClick={() => {setIsModalOpen(false); setActiveCategory(null); setSearchQuery("");}} className="text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-2 rounded-full transition-colors shadow-sm">
              <X size={24} />
            </button>
          </div>
          
          {activeCategory && (
             <div className="relative mb-6">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search size={18} className="text-[hsl(var(--muted))]" />
               </div>
               <input 
                 type="text" 
                 placeholder={`Search in ${activeCategory}...`}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-sm font-bold py-3.5 pl-12 pr-4 rounded-xl border border-[hsl(var(--border))] focus:border-blue-500 focus:outline-none transition-colors shadow-inner placeholder:text-[hsl(var(--muted))]"
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-4 flex items-center text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
                   <X size={16} />
                 </button>
               )}
             </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pb-20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {!activeCategory ? (
              defaultExercises.categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-5 rounded-2xl flex justify-between items-center hover:brightness-110 transition-all text-lg font-black text-[hsl(var(--foreground))] shadow-sm active:scale-95">
                  {cat} <ChevronRight size={20} className="text-[hsl(var(--muted))]" />
                </button>
              ))
            ) : (
              <>
                <button onClick={() => {setActiveCategory(null); setSearchQuery("");}} className="w-full text-left p-3 mb-2 text-blue-500 font-bold flex items-center gap-2 hover:bg-[hsl(var(--surface))] rounded-xl transition-colors">
                  <ArrowLeft size={16} /> Back to Groups
                </button>
                {defaultExercises.exercises[activeCategory as keyof typeof defaultExercises.exercises]
                  ?.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ex => (
                  <div key={ex.id} className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-2 pl-4 rounded-xl flex items-center justify-between shadow-sm active:scale-95 transition-all">
                    <button onClick={() => {handleAddExercise(ex); setSearchQuery("");}} className="flex-1 text-left flex flex-col gap-1.5 min-w-0 pr-2">
                      <span className="block text-[hsl(var(--foreground))] font-black text-base truncate w-full">{ex.name}</span>
                      <span className="text-[hsl(var(--muted))] text-[9px] font-black uppercase tracking-widest bg-[hsl(var(--background))] px-2 py-1 rounded border border-[hsl(var(--border))] w-fit">{ex.equipment}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowInfoModal(ex); }} className="text-blue-500 p-3 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 active:scale-95 transition-all shrink-0">
                      <Info size={20} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}