import Dexie, { type Table } from 'dexie';
import allExercisesData from './exercises.json';

const CATEGORIES = ["Chest", "Back", "Tricep", "Bicep", "Shoulder", "Forearms", "Legs", "Core"];

const muscleMapping: Record<string, string> = {
  'chest': 'Chest',
  'lats': 'Back',
  'middle back': 'Back',
  'lower back': 'Back',
  'traps': 'Back',
  'neck': 'Back',
  'triceps': 'Tricep',
  'biceps': 'Bicep',
  'shoulders': 'Shoulder',
  'forearms': 'Forearms',
  'quadriceps': 'Legs',
  'hamstrings': 'Legs',
  'calves': 'Legs',
  'glutes': 'Legs',
  'abdominals': 'Core'
};

const structuredExercises: Record<string, any[]> = {};
CATEGORIES.forEach(cat => structuredExercises[cat] = []);

allExercisesData.forEach((ex: any) => {
  if (!ex.primaryMuscles || ex.primaryMuscles.length === 0) return;
  
  const primaryMuscle = ex.primaryMuscles[0];
  const myCategory = muscleMapping[primaryMuscle];
  
  if (myCategory && structuredExercises[myCategory]) {
    let formattedEquipment = 'Bodyweight';
    if (ex.equipment) {
      formattedEquipment = ex.equipment === 'body only' 
        ? 'Bodyweight' 
        : ex.equipment.charAt(0).toUpperCase() + ex.equipment.slice(1);
    }

    structuredExercises[myCategory].push({
      id: ex.id,
      name: ex.name,
      level: ex.level ? ex.level.charAt(0).toUpperCase() + ex.level.slice(1) : 'Beginner',
      mechanic: ex.mechanic === 'compound' ? 'Compound' : 'Isolation',
      equipment: formattedEquipment,
      primaryMuscles: ex.primaryMuscles || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
      images: ex.images || []
    });
  }
});

export const defaultExercises = {
  categories: CATEGORIES,
  exercises: structuredExercises
};

export interface Template {
  id: string;
  name: string;
  order: number;
  exercises: { 
    exerciseId: string; 
    sets: { tag: 'normal' | 'warmup' | 'drop' | 'failure'; targetReps: string }[];
  }[];
}

export interface Session {
  id: string;
  templateId?: string;
  startTime: number;
  endTime?: number;
  bodyWeight?: number;
}

export interface LoggedSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
  timestamp: number;
  tag?: 'normal' | 'warmup' | 'drop' | 'failure';
}

export interface BodyWeightLog {
  id: string;
  weight: number;
  date: number;
}

export interface Favorite {
  exerciseId: string;
}

export class GymTrackerDB extends Dexie {
  templates!: Table<Template, string>;
  sessions!: Table<Session, string>;
  sets!: Table<LoggedSet, string>;
  bodyWeightLogs!: Table<BodyWeightLog, string>;
  favorites!: Table<Favorite, string>;

  constructor() {
    super('GymTrackerDB');
    this.version(5).stores({
      templates: 'id, order',
      sessions: 'id, startTime, templateId',
      sets: 'id, sessionId, exerciseId, [exerciseId+timestamp], isCompleted',
      bodyWeightLogs: 'id, date',
      favorites: 'exerciseId'
    });
  }
}

export const db = new GymTrackerDB();