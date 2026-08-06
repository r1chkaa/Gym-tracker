'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { Download, Trash2, Database, Scale, Clock, Sun, Moon, User, Upload, X } from 'lucide-react';
export default function Settings() {
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unit, setUnit] = useState('lbs');
  const [timerMin, setTimerMin] = useState(1);
  const [timerSec, setTimerSec] = useState(30);
  const [wakeLock, setWakeLock] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [gender, setGender] = useState('male');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUnit(localStorage.getItem('gym_unit') || 'lbs');
    
    const totalSecs = Number(localStorage.getItem('gym_timer')) || 90;
    setTimerMin(Math.floor(totalSecs / 60));
    setTimerSec(totalSecs % 60);
    
    setWakeLock(localStorage.getItem('gym_wakelock') === 'true');

    const savedTheme = localStorage.getItem('gym_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    setGender(localStorage.getItem('gym_gender') || 'male');
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('gym_theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleGenderChange = (newGender: string) => {
    setGender(newGender);
    localStorage.setItem('gym_gender', newGender);
  };

  const handleUnitChange = async (newUnit: string) => {
    if (unit === newUnit) return;
    const factor = newUnit === 'kg' ? (1 / 2.20462) : 2.20462;
    try {
      await db.transaction('rw', db.sets, db.bodyWeightLogs, async () => {
        const allSets = await db.sets.toArray();
        for (const s of allSets) await db.sets.update(s.id, { weight: Math.round(s.weight * factor * 10) / 10 });
        const allBodyWeight = await db.bodyWeightLogs.toArray();
        for (const bw of allBodyWeight) await db.bodyWeightLogs.update(bw.id, { weight: Math.round(bw.weight * factor * 10) / 10 });
      });
      setUnit(newUnit);
      localStorage.setItem('gym_unit', newUnit);
    } catch (err) {
      console.error("Failed to convert database:", err);
    }
  };

  const handleTimerChange = (type: 'min' | 'sec', val: string) => {
    let num = parseInt(val) || 0;
    if (type === 'sec' && num > 59) num = 59;
    
    const newMin = type === 'min' ? num : timerMin;
    const newSec = type === 'sec' ? num : timerSec;
    
    setTimerMin(newMin);
    setTimerSec(newSec);
    localStorage.setItem('gym_timer', ((newMin * 60) + newSec).toString());
  };

  const handleWakeLockChange = (checked: boolean) => {
    setWakeLock(checked);
    localStorage.setItem('gym_wakelock', checked.toString());
  };

const handleClearData = async () => {
    if (window.confirm("WARNING: This will permanently delete all data, including your rank. Are you sure?")) {
      setIsDeleting(true);
      await db.templates.clear();
      await db.sets.clear();
      await db.bodyWeightLogs.clear();
      await db.favorites.clear();
      localStorage.clear();
      
      // Plant a flag so the app knows to fade in from white on the next boot
      localStorage.setItem('gym_wiped_flash', 'true');
      
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    }
  };

  const handleExportDB = async () => {
    try {
      const { exportDB } = await import("dexie-export-import");
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export database. Check console for details.");
    }
  };

  const handleImportDBClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportDB = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.confirm("WARNING: This will overwrite any existing data with the imported data. Are you sure?")) {
       try {
           const { importInto } = await import("dexie-export-import");
           
           await db.templates.clear();
           await db.sets.clear();
           await db.bodyWeightLogs.clear();
           await db.favorites.clear();
           
           await importInto(db, file, { clearTablesBeforeImport: true });
           alert("Database successfully imported!");
           window.location.reload();
       } catch (error) {
           console.error("Import failed:", error);
           alert("Failed to import database. Please ensure the file is a valid Gym Tracker backup.");
       }
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

return (
    <>
      {isDeleting && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center animate-[system-overload_2.5s_ease-in_forwards] pointer-events-none origin-center mix-blend-screen">
<style dangerouslySetInnerHTML={{__html: `
            @keyframes system-overload {
              0% { opacity: 0; transform: scale(1); backdrop-filter: blur(0px) brightness(1); background-color: transparent; }
              20% { opacity: 0.5; transform: scale(1.05); backdrop-filter: blur(2px) brightness(1.5) hue-rotate(90deg); background-color: rgba(255,255,255,0.1); }
              40% { opacity: 0.8; transform: scale(1.1); backdrop-filter: blur(5px) brightness(2) hue-rotate(-90deg); background-color: rgba(255,255,255,0.3); }
              60% { opacity: 1; transform: scale(1.2); backdrop-filter: blur(10px) brightness(4); background-color: rgba(255,255,255,0.6); }
              80% { opacity: 1; transform: scale(1.5); backdrop-filter: blur(20px) brightness(10); background-color: rgba(255,255,255,0.9); }
              100% { opacity: 1; transform: scale(2); backdrop-filter: blur(50px) brightness(20); background-color: white; }
            }
          `}} />
        </div>
      )}
    <div className="space-y-6 animate-in fade-in duration-300">
{showTimerModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overscroll-none touch-none">
          <div className="bg-[#0e0e11] w-full max-w-[340px] rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-[0.98] slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex justify-between items-center p-6 border-b border-white/5 relative">
              <span className="font-black text-white text-sm uppercase tracking-[0.2em] opacity-80">Rest Timer</span>
              <button onClick={() => setShowTimerModal(false)} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white active:scale-95 transition-all border border-white/10"><X size={16} strokeWidth={3} /></button>
            </div>
            
            <div className="flex justify-center items-center h-[260px] relative bg-transparent">
              {/* Highlight Pill */}
              <div className="absolute top-1/2 -translate-y-1/2 w-[90%] h-[64px] bg-white/5 rounded-[1.5rem] pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] border border-white/5" />
              
              {/* Fade Masks */}
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#0e0e11] to-transparent z-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#0e0e11] to-transparent z-20 pointer-events-none" />

              {/* Minutes Wheel */}
              <div className="flex w-1/2 justify-center h-full overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10 pointer-events-auto"
                   ref={(el) => { if (el && el.scrollTop === 0 && timerMin > 0) el.scrollTop = timerMin * 64; }}
                   onScroll={(e) => {
                     const el = e.currentTarget;
                     const idx = Math.round(el.scrollTop / 64);
                     if(idx !== timerMin) {
                        setTimerMin(idx);
                        localStorage.setItem('gym_timer', ((idx * 60) + timerSec).toString());
                     }
                   }}>
                <div className="flex flex-col w-full">
                  <div className="h-[98px] shrink-0 w-full" />
                  {Array.from({length: 60}).map((_, i) => (
                    <div key={`m-${i}`} className="h-[64px] shrink-0 w-full flex items-center justify-center snap-center">
                      <span className={`font-black transition-all duration-300 transform-gpu ${timerMin === i ? 'text-5xl text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-3xl text-white/30 scale-90'}`}>{i.toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                  <div className="h-[98px] shrink-0 w-full" />
                </div>
              </div>

              <span className="font-black text-white/30 z-10 text-4xl mb-2">:</span>

              {/* Seconds Wheel */}
              <div className="flex w-1/2 justify-center h-full overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10 pointer-events-auto"
                   ref={(el) => { if (el && el.scrollTop === 0 && timerSec > 0) el.scrollTop = timerSec * 64; }}
                   onScroll={(e) => {
                     const el = e.currentTarget;
                     const idx = Math.round(el.scrollTop / 64);
                     if(idx !== timerSec) {
                        setTimerSec(idx);
                        localStorage.setItem('gym_timer', ((timerMin * 60) + idx).toString());
                     }
                   }}>
                <div className="flex flex-col w-full">
                  <div className="h-[98px] shrink-0 w-full" />
                  {Array.from({length: 60}).map((_, i) => (
                    <div key={`s-${i}`} className="h-[64px] shrink-0 w-full flex items-center justify-center snap-center">
                      <span className={`font-black transition-all duration-300 transform-gpu ${timerSec === i ? 'text-5xl text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-3xl text-white/30 scale-90'}`}>{i.toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                  <div className="h-[98px] shrink-0 w-full" />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5">
              <button onClick={() => setShowTimerModal(false)} className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-[1.5rem] hover:bg-blue-500 active:scale-95 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 animate-in fade-in duration-300 pb-12">
        <div>
          <h2 className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest mb-3 px-4">Preferences</h2>
          <div className="bg-[hsl(var(--card))] rounded-[2rem] border border-[hsl(var(--border))] shadow-sm overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3"><Moon size={20} className="text-[hsl(var(--muted))]" /><span className="text-[hsl(var(--foreground))] font-bold text-sm">App Theme</span></div>
              <div className="flex bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] p-1">
                <button onClick={() => handleThemeChange('light')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Light</button>
                <button onClick={() => handleThemeChange('dark')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Dark</button>
              </div>
            </div>

            <div className="flex justify-between items-center p-5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3"><User size={20} className="text-[hsl(var(--muted))]" /><span className="text-[hsl(var(--foreground))] font-bold text-sm">Anatomy Model</span></div>
              <div className="flex bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] p-1">
                <button onClick={() => handleGenderChange('male')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${gender === 'male' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Male</button>
                <button onClick={() => handleGenderChange('female')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${gender === 'female' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>Female</button>
              </div>
            </div>

            <div className="flex justify-between items-center p-5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3"><Scale size={20} className="text-[hsl(var(--muted))]" /><span className="text-[hsl(var(--foreground))] font-bold text-sm">Weight Unit</span></div>
              <div className="flex bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] p-1">
                <button onClick={() => handleUnitChange('lbs')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${unit === 'lbs' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>lbs</button>
                <button onClick={() => handleUnitChange('kg')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${unit === 'kg' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md' : 'text-[hsl(var(--muted))]'}`}>kg</button>
              </div>
            </div>

            <button onClick={() => setShowTimerModal(true)} className="flex w-full justify-between items-center p-5 border-b border-[hsl(var(--border))] active:bg-[hsl(var(--surface))] transition-colors text-left">
              <div className="flex items-center gap-3"><Clock size={20} className="text-[hsl(var(--muted))]" /><span className="text-[hsl(var(--foreground))] font-bold text-sm">Rest Timer</span></div>
              <div className="flex items-center gap-1.5 text-[hsl(var(--foreground))] font-black text-sm bg-[hsl(var(--background))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">
                <span>{timerMin.toString().padStart(2, '0')}:{timerSec.toString().padStart(2, '0')}</span>
              </div>
            </button>

            <div className="flex justify-between items-center p-5">
              <div className="flex items-center gap-3"><Sun size={20} className="text-[hsl(var(--muted))]" />
                <div className="flex flex-col">
                  <span className="text-[hsl(var(--foreground))] font-bold text-sm">Keep Awake</span>
                </div>
              </div>
              <button onClick={() => handleWakeLockChange(!wakeLock)} className={`w-12 h-6 rounded-full transition-colors relative border border-[hsl(var(--border))] ${wakeLock ? 'bg-[hsl(var(--foreground))] border-transparent' : 'bg-[hsl(var(--background))]'}`}>
                <div className={`w-4 h-4 bg-[hsl(var(--background))] rounded-full absolute top-[3px] transition-all shadow-sm ${wakeLock ? 'left-7 bg-[hsl(var(--background))]' : 'left-1 bg-[hsl(var(--muted))]'}`} />
              </button>
            </div>

          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-black text-[hsl(var(--muted))] uppercase tracking-widest mb-3 px-4">Database</h2>
          <div className="bg-[hsl(var(--card))] rounded-[2rem] border border-[hsl(var(--border))] shadow-sm overflow-hidden flex flex-col">
            <button onClick={handleExportDB} className="flex justify-between items-center p-5 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--surface))] active:bg-[hsl(var(--background))] transition-colors">
              <span className="font-bold text-[hsl(var(--foreground))] text-sm">Export Data (.json)</span>
              <Download size={18} className="text-[hsl(var(--muted))]" />
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportDB} className="hidden" />
            <button onClick={handleImportDBClick} className="flex justify-between items-center p-5 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--surface))] active:bg-[hsl(var(--background))] transition-colors">
              <span className="font-bold text-[hsl(var(--foreground))] text-sm">Import Data (.json)</span>
              <Upload size={18} className="text-[hsl(var(--muted))]" />
            </button>
            <button onClick={handleClearData} className="flex justify-between items-center p-5 bg-red-500/5 hover:bg-red-500/10 active:bg-red-500/20 transition-colors">
              <span className="font-bold text-red-500 text-sm">Delete All Data</span>
              <Trash2 size={18} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}