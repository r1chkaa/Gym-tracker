'use client';
import { X } from 'lucide-react';

interface Props {
  targetWeight: string;
  onClose: () => void;
}

export default function PlateCalculator({ targetWeight, onClose }: Props) {
  const weight = Number(targetWeight) || 0;
  const barWeight = 45; // Standard Olympic Bar
  
  let remainingPerSide = (weight - barWeight) / 2;
  const plates = [45, 35, 25, 10, 5, 2.5];
  const result: { [key: number]: number } = {};

  if (remainingPerSide > 0) {
    plates.forEach(plate => {
      const count = Math.floor(remainingPerSide / plate);
      if (count > 0) {
        result[plate] = count;
        remainingPerSide -= count * plate;
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 pb-24">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-gray-800 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <h3 className="text-2xl font-black text-white mb-1">Plate Calculator</h3>
        <div className="flex gap-4 text-gray-500 text-sm font-medium mb-6">
          <span>Target: <strong className="text-white">{weight} lbs</strong></span>
          <span>Bar: <strong className="text-white">{barWeight} lbs</strong></span>
        </div>

        {weight < barWeight ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-bold">
            Weight must be at least 45 lbs (the bar).
          </div>
        ) : Object.keys(result).length === 0 ? (
          <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-2xl text-center font-bold text-xl">
            Just the bar!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Load Per Side:</p>
            {plates.map(plate => result[plate] ? (
              <div key={plate} className="flex justify-between items-center bg-black p-4 rounded-2xl border border-gray-800">
                <span className="text-3xl font-black text-white">
                  {plate} <span className="text-sm text-gray-500 font-medium">lbs</span>
                </span>
                <span className="text-2xl font-bold text-accent">x {result[plate]}</span>
              </div>
            ) : null)}
          </div>
        )}
      </div>
    </div>
  );
}