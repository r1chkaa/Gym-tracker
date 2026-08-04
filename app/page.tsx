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
        - Absolute iOS Lock: explicit bottom: 0px with paddingBottom calc absolutely guarantees zero shift on viewport changes.
        - CSS Grid: Forces exactly equal widths (grid-cols-5) so buttons never squeeze, clip, or shift adjacent items.
        - Layout-free animations: Using translate-y and opacity instead of margins/heights to guarantee 60fps buttery smoothness.
      */}
      <div 
        className="fixed inset-x-0 z-[90] flex justify-center pointer-events-none transform-gpu"
        style={{ bottom: '0px', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <nav className="w-[92%] max-w-[400px] h-[72px] grid grid-cols-5 items-center bg-[#0e0e11]/85 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[2.5rem] pointer-events-auto touch-none px-1.5">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            const isCenter = tab.id === 'progression';

            if (isCenter) {
              return (
                <div key={tab.id} className="relative flex items-center justify-center w-full h-full">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`absolute bottom-[10px] flex items-center justify-center w-[64px] h-[64px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none active:scale-90 ${
                      isActive 
                        ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/20' 
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
                className="relative flex flex-col items-center justify-center w-full h-[60px] rounded-[2rem] outline-none active:scale-90 transition-transform duration-300 group"
              >
                {/* Active Background Pill */}
                <div className={`absolute inset-0 rounded-[2rem] transition-all duration-500 ease-out ${isActive ? 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-transparent group-hover:bg-white/5'}`} />
                
                {/* Icon Container (Moves up smoothly when active) */}
                <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? '-translate-y-2.5 text-white' : 'translate-y-0 text-white/40 group-hover:text-white/80'}`}>
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110' : 'scale-100'}`} />
                </div>

                {/* Label Container (Fades in and slides up from bottom, does not affect height) */}
                <span className={`absolute bottom-2.5 z-10 text-[9px] font-black uppercase tracking-widest text-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
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