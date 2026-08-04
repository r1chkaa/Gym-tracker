'use client';
import { useState, useEffect, useRef } from 'react';
import ActiveSession from "@/components/ActiveSession";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import Settings from "@/components/Settings";
import Progression from "@/components/Progression";
import { Dumbbell, ListPlus, TrendingUp, BookOpen, Settings as SettingsIcon, X, Crown, Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'workout' | 'builder' | 'progression' | 'analytics' | 'library' | 'settings'>('workout');
  const [previousTab, setPreviousTab] = useState<'workout' | 'builder' | 'progression' | 'analytics' | 'library'>('workout');
  const [isMounted, setIsMounted] = useState(false);
  const [rankGlow, setRankGlow] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setIsMounted(true); 
    const handleGlow = () => setRankGlow(true);
    window.addEventListener('rank-glow-update', handleGlow);
    return () => window.removeEventListener('rank-glow-update', handleGlow);
  }, []);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'workout': return { title: 'Workout', subtitle: 'Log your session' };
      case 'builder': return { title: 'Builder', subtitle: 'Design routines' };
      case 'progression': return { title: 'Rank', subtitle: 'Muscle Mastery' };
      case 'analytics': return { title: 'Analytics', subtitle: 'Track progress' };
      case 'library': return { title: 'Library', subtitle: 'Exercise database' };
      case 'settings': return { title: 'Settings', subtitle: 'App preferences' };
      default: return { title: 'Workout', subtitle: '' };
    }
  };

  const header = getHeaderInfo();

  const handleTabClick = (id: any) => {
    if (id === 'progression') setRankGlow(false);
    setActiveTab(id);
    setPreviousTab(id);
    // Fixes the scroll stuck bug by resetting scroll position
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navItems = [
    { id: 'workout', icon: Dumbbell, label: 'Train' },
    { id: 'builder', icon: ListPlus, label: 'Build' },
    { id: 'progression', icon: Crown, label: 'Rank' }, 
    { id: 'analytics', icon: TrendingUp, label: 'Stats' },
    { id: 'library', icon: BookOpen, label: 'Library' }
  ];

  if (!isMounted) {
    return <div className="h-[100dvh] bg-[hsl(var(--background))] flex items-center justify-center"><Loader2 className="animate-spin text-[hsl(var(--muted))]" size={32}/></div>;
  }

  return (
    <main className="h-[100dvh] max-w-md mx-auto flex flex-col bg-transparent text-[hsl(var(--foreground))] overflow-hidden relative transition-colors duration-300">
      
      {/* Absolute fullscreen background bleed */}
      <div className={`fixed inset-0 w-screen h-screen z-[-2] transition-colors duration-500 ${activeTab === 'progression' ? 'bg-[#09090b]' : 'bg-[hsl(var(--background))]'}`} />

      {/* Main scrolling wrapper - Header is now INSIDE so it scrolls away naturally */}
      <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto pb-32 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        <header className={`flex-none px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-4 flex justify-between items-start transition-colors duration-500 ${activeTab === 'progression' ? 'text-white' : ''}`}>
          <div>
            <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">{header.title}</h1>
            <p className={`font-black tracking-[0.2em] text-[10px] uppercase mt-1 ${activeTab === 'progression' ? 'text-blue-500 drop-shadow-md' : 'text-[hsl(var(--muted))]'}`}>
              {header.subtitle}
            </p>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'settings') { setActiveTab(previousTab); scrollRef.current?.scrollTo(0,0); }
              else { setPreviousTab(activeTab); setActiveTab('settings'); scrollRef.current?.scrollTo(0,0); }
            }}
            className={`p-3 rounded-full transition-all duration-300 shadow-sm border backdrop-blur-md ${activeTab === 'settings' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rotate-90 border-[hsl(var(--foreground))]' : (activeTab === 'progression' ? 'bg-white/10 text-white/70 hover:text-white border-white/20' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--surface))]/80 border-[hsl(var(--border))]')}`}
          >
            {activeTab === 'settings' ? <X size={20} /> : <SettingsIcon size={20} />}
          </button>
        </header>

        <div className="px-4 flex-1 flex flex-col min-h-full">
          {activeTab === 'workout' && <ActiveSession />}
          {activeTab === 'builder' && <WorkoutBuilder />}
          {activeTab === 'progression' && <Progression />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'library' && <ExerciseLibrary />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>

      <div className="fixed bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-50">
        <nav className="flex px-2 py-2 items-center justify-between bg-[hsl(var(--card))]/90 backdrop-blur-2xl border border-[hsl(var(--border))] rounded-[2rem] shadow-xl">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            const isCenter = tab.id === 'progression';

            if (isCenter) {
              return (
                <div key={tab.id} className="relative flex items-center justify-center px-1">
                  <button 
                    onClick={() => handleTabClick(tab.id)}
                    className={`absolute bottom-[-8px] flex items-center justify-center w-16 h-16 rounded-full border-[4px] border-[hsl(var(--background))] transition-all duration-500 active:scale-95 ${isActive ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-[0_5px_15px_rgba(0,0,0,0.2)]' : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:brightness-110'} ${rankGlow && !isActive ? 'animate-pulse bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)] border-transparent' : ''}`}
                  >
                    <tab.icon size={26} strokeWidth={2.5} className={isActive || (rankGlow && !isActive) ? "opacity-100" : "opacity-70"} />
                  </button>
                </div>
              );
            }

            return (
              <button 
                key={tab.id}
                onClick={() => handleTabClick(tab.id)} 
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-3xl transition-all duration-300 ${isActive ? 'text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] shadow-inner border border-[hsl(var(--border))]' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] border border-transparent'}`}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}