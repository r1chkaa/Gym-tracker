'use client';
import { useState, useEffect } from 'react';
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

  const [pastWorkoutDate, setPastWorkoutDate] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleGlow = () => setRankGlow(true);
    window.addEventListener('rank-glow-update', handleGlow);

    const handlePastWorkout = (e: any) => {
      setPastWorkoutDate(e.detail.timestamp);
      setActiveTab('workout');
      setPreviousTab('analytics');
    };
    window.addEventListener('start-past-workout', handlePastWorkout);

    return () => {
      window.removeEventListener('rank-glow-update', handleGlow);
      window.removeEventListener('start-past-workout', handlePastWorkout);
    };
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
    <main className={`min-h-[100dvh] w-full max-w-md mx-auto flex flex-col relative transition-colors duration-300 text-[hsl(var(--foreground))] ${activeTab === 'progression' ? 'bg-transparent' : 'bg-[hsl(var(--background))]'}`}>      {/* 
        Force Unlock Global Scrolling:
        This overrides the native app lock in layout.tsx/globals.css so the 
        page scrolls natively and the bottom lock gap disappears completely.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        html, body { 
          overflow: visible !important; 
          height: auto !important; 
          overscroll-behavior-y: auto !important; 
        }
      `}} />

      {/* Global Fixed Background specifically to cover the entire screen for Progression */}
      {activeTab === 'progression' && (
        <div className="fixed inset-0 w-screen h-screen z-[-1] bg-[#09090b] transition-opacity duration-500" />
      )}

      {/* 
        Native Scroll Container:
        No overflow-hidden locks. The header is placed INSIDE this flow so it 
        scrolls away as the user scrolls down the page.
      */}
      <div className={`flex flex-col w-full pb-32 ${activeTab === 'progression' ? 'px-0' : 'px-4'}`}>
        
        <header className={`pt-[max(env(safe-area-inset-top),3rem)] pb-4 flex justify-between items-start transition-colors duration-500 ${activeTab === 'progression' ? 'text-white px-6' : ''}`}>
          <div>
            <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">{header.title}</h1>
            <p className={`font-black tracking-[0.2em] text-[10px] uppercase mt-1 ${activeTab === 'progression' ? 'text-blue-500 drop-shadow-md' : 'text-[hsl(var(--muted))]'}`}>
              {header.subtitle}
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'settings') setActiveTab(previousTab);
              else { setPreviousTab(activeTab); setActiveTab('settings'); }
            }}
            className={`p-3 rounded-full transition-all duration-300 shadow-sm border ${activeTab === 'settings' ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rotate-90 border-[hsl(var(--foreground))]' : (activeTab === 'progression' ? 'bg-white/10 text-white/70 hover:text-white border-white/20' : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] border-[hsl(var(--border))]')}`}
          >
            {activeTab === 'settings' ? <X size={20} /> : <SettingsIcon size={20} />}
          </button>
        </header>

        {activeTab === 'workout' && <ActiveSession pastWorkoutDate={pastWorkoutDate} onClearPastDate={() => setPastWorkoutDate(null)} />}
        {activeTab === 'builder' && <WorkoutBuilder />}
        {activeTab === 'progression' && <Progression />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'library' && <ExerciseLibrary />}
        {activeTab === 'settings' && <Settings />}
      </div>
{/* 
        Fixed Floating Nav:
        - Bulletproof iOS startup fix: fixed bottom-0 with paddingBottom calc ensures it never drops to 0px on initial paint.
        - Premium deep-glass aesthetic with Apple-like spring animations (cubic-bezier).
        - touch-none and replacement of mobile hover states with active states fix the "swipe away" sticky bug.
      */}
      <div 
        className="fixed bottom-0 inset-x-0 w-full z-[90] flex justify-center pointer-events-none transform-gpu"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <nav className="w-[92%] max-w-[400px] flex px-2 py-2 items-center justify-between bg-[#0e0e11]/80 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[2.5rem] pointer-events-auto touch-none">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            const isCenter = tab.id === 'progression';

            if (isCenter) {
              return (
                <div key={tab.id} className="relative flex items-center justify-center px-2">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`absolute bottom-[-6px] flex items-center justify-center w-[64px] h-[64px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none active:scale-90 ${
                      isActive 
                        ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/20 scale-100' 
                        : 'bg-[#18181b] text-white/50 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] md:hover:text-white'
                    } ${rankGlow && !isActive ? 'animate-pulse bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)] border-transparent' : ''}`}
                  >
                    <tab.icon size={28} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110 opacity-100' : 'opacity-80'}`} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`group flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-[2rem] transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none active:scale-90 active:bg-white/5 ${
                  isActive 
                    ? 'text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                    : 'text-white/40 md:hover:text-white/80'
                }`}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'opacity-100 max-h-4 translate-y-0 mt-1' : 'opacity-0 max-h-0 translate-y-2 overflow-hidden'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}