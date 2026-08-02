'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { Download, Trash2, Database, Scale, Clock, Sun, Moon, User, Upload } from 'lucide-react';

export default function Settings() {
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
    const confirm = window.confirm(`Convert all logged weights from ${unit} to ${newUnit}?`);
    if (confirm) {
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
        alert(`Successfully converted database to ${newUnit}.`);
      } catch (err) {
        console.error("Failed to convert database:", err);
      }
    }
  };

  const handleTimerChange = (type: 'min' | 'sec', val: string) => {
    let num = parseInt(val) || 0;
    if (type === 'sec' && num > 59) num = 59; // Cap seconds
    
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
    if (window.confirm("WARNING: This will permanently delete all data. Are you sure?")) {
      await db.templates.clear();
      await db.sets.clear();
      await db.bodyWeightLogs.clear();
      window.location.reload();
    }
  };

  const handleExportDB = async () => {
    try {
      // Dynamically import to avoid server-side prerendering errors
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
           // Dynamically import to avoid server-side prerendering errors
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[hsl(var(--card))] rounded-3xl p-6 border border-[hsl(var(--border))] shadow-sm">
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-6">Preferences</h2>
        
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={20} className="text-[hsl(var(--muted))]" /> : <Sun size={20} className="text-[hsl(var(--muted))]" />}
              <span className="text-[hsl(var(--foreground))] font-bold">App Theme</span>
            </div>
            <div className="flex bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] p-1">
              <button onClick={() => handleThemeChange('light')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>Light</button>
              <button onClick={() => handleThemeChange('dark')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>Dark</button>
            </div>
          </div>

          {/* Gender Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User size={20} className="text-[hsl(var(--muted))]" />
              <span className="text-[hsl(var(--foreground))] font-bold">Anatomy Model</span>
            </div>
            <div className="flex bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] p-1">
              <button onClick={() => handleGenderChange('male')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${gender === 'male' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>Male</button>
              <button onClick={() => handleGenderChange('female')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${gender === 'female' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>Female</button>
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Scale size={20} className="text-[hsl(var(--muted))]" />
              <span className="text-[hsl(var(--foreground))] font-bold">Weight Unit</span>
            </div>
            <div className="flex bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] p-1">
              <button onClick={() => handleUnitChange('lbs')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${unit === 'lbs' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>lbs</button>
              <button onClick={() => handleUnitChange('kg')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${unit === 'kg' ? 'bg-blue-600 text-white' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}>kg</button>
            </div>
          </div>

          {/* Precise Rest Timer */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-[hsl(var(--muted))]" />
              <span className="text-[hsl(var(--foreground))] font-bold">Rest Timer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input type="number" value={timerMin} onChange={(e) => handleTimerChange('min', e.target.value)} className="w-16 bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-center font-bold p-2 rounded-lg border border-[hsl(var(--border))] focus:border-blue-500 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="absolute text-[10px] text-[hsl(var(--muted))] font-bold top-full left-0 w-full text-center mt-1">MIN</span>
              </div>
              <span className="font-bold text-[hsl(var(--foreground))] pb-4">:</span>
              <div className="relative">
                <input type="number" value={timerSec} onChange={(e) => handleTimerChange('sec', e.target.value)} className="w-16 bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-center font-bold p-2 rounded-lg border border-[hsl(var(--border))] focus:border-blue-500 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="absolute text-[10px] text-[hsl(var(--muted))] font-bold top-full left-0 w-full text-center mt-1">SEC</span>
              </div>
            </div>
          </div>

          {/* Wake Lock */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sun size={20} className="text-[hsl(var(--muted))]" />
              <div>
                <span className="text-[hsl(var(--foreground))] font-bold block">Keep Screen Awake</span>
                <span className="text-[hsl(var(--muted))] text-xs">Prevents phone from locking</span>
              </div>
            </div>
            <button onClick={() => handleWakeLockChange(!wakeLock)} className={`w-12 h-6 rounded-full transition-colors relative border border-[hsl(var(--border))] ${wakeLock ? 'bg-blue-500' : 'bg-[hsl(var(--surface))]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${wakeLock ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-3xl p-6 border border-[hsl(var(--border))] shadow-sm mb-10">
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
          <Database size={20} className="text-blue-500" /> Database
        </h2>
        <div className="space-y-4">
          <button onClick={handleExportDB} className="w-full bg-[hsl(var(--surface))] hover:brightness-110 text-[hsl(var(--foreground))] font-bold py-4 px-4 rounded-2xl flex justify-between items-center transition-all border border-[hsl(var(--border))]">
            <span>Export Data (.json)</span>
            <Download size={20} />
          </button>
          
          <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImportDB} 
              className="hidden" 
          />
          <button onClick={handleImportDBClick} className="w-full bg-[hsl(var(--surface))] hover:brightness-110 text-[hsl(var(--foreground))] font-bold py-4 px-4 rounded-2xl flex justify-between items-center transition-all border border-[hsl(var(--border))]">
            <span>Import Data (.json)</span>
            <Upload size={20} />
          </button>

          <button onClick={handleClearData} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 px-4 rounded-2xl flex justify-between items-center transition-colors border border-red-500/20">
            <span>Delete All Data</span>
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}