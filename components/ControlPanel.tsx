
import React from 'react';
import { CategoriesData } from '../types';

interface ControlPanelProps {
  categories: CategoriesData;
  activeCategories: Record<string, boolean>;
  toggleCategory: (category) => void;
  rotating: boolean;
  setRotating: (rotating: boolean) => void;
  intensityFilter: number;
  setIntensityFilter: (value: number) => void;
  viewMode: 'live' | 'history';
  setViewMode: (mode: 'live' | 'history') => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  categories, 
  activeCategories, 
  toggleCategory, 
  rotating, 
  setRotating,
  intensityFilter,
  setIntensityFilter,
  viewMode,
  setViewMode,
  selectedYear,
  onYearChange
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={`absolute top-4 left-4 backdrop-blur-md p-4 rounded-lg border z-20 w-72 transition-all shadow-xl ${viewMode === 'history' ? 'bg-black/80 border-amber-500/30 shadow-amber-500/5' : 'bg-black/70 border-cyan-500/30'}`}>
      <div className="flex justify-between items-center mb-3">
        <h1 className={`text-xl font-bold tracking-tight uppercase ${viewMode === 'history' ? 'text-amber-500' : 'text-cyan-400'}`}>
          {viewMode === 'history' ? 'Chronos Archive' : 'Global Status'}
        </h1>
        <div className="flex bg-gray-900 rounded p-0.5 border border-gray-800">
           <button 
             onClick={() => setViewMode('live')}
             className={`px-2 py-1 text-[8px] font-bold uppercase rounded transition-colors ${viewMode === 'live' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}
           >Live</button>
           <button 
             onClick={() => setViewMode('history')}
             className={`px-2 py-1 text-[8px] font-bold uppercase rounded transition-colors ${viewMode === 'history' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}
           >Past</button>
        </div>
      </div>
      
      <p className="text-gray-500 text-[10px] uppercase font-mono mb-4 tracking-widest">
        {viewMode === 'live' ? 'Visualizing Real-Time Vectors' : `Viewing Historical Snapshot: ${selectedYear}`}
      </p>

      {viewMode === 'history' && (
        <div className="mb-6 p-3 bg-amber-500/5 rounded border border-amber-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-amber-500/70 font-bold uppercase">Timeline</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{selectedYear}</span>
          </div>
          <input
            type="range"
            min="1950"
            max={currentYear}
            step="1"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[8px] text-gray-600 mt-1 font-mono">
            <span>1950</span>
            <span>{currentYear}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-1.5">
        {Object.keys(categories).map(key => (
          <button
            key={key}
            onClick={() => toggleCategory(key)}
            className={`flex items-center gap-2 w-full text-left px-3 py-1.5 rounded transition-all duration-200 text-xs border ${
              activeCategories[key] 
                ? 'bg-white/5 border-transparent' 
                : 'bg-transparent border-gray-800/50 grayscale hover:grayscale-0 opacity-40 hover:opacity-100'
            }`}
            style={{
              borderColor: activeCategories[key] ? `#${categories[key].color.toString(16).padStart(6, '0')}40` : undefined,
              boxShadow: activeCategories[key] ? `0 0 10px #${categories[key].color.toString(16).padStart(6, '0')}15` : 'none'
            }}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: `#${categories[key].color.toString(16).padStart(6, '0')}` }}
            />
            <span className="text-gray-300 flex-grow font-medium uppercase tracking-tight">{categories[key].name}</span>
            <span className={`ml-auto text-[10px] font-mono ${activeCategories[key] ? 'text-gray-400' : 'text-gray-600'}`}>{categories[key].zones.length}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Intensity Filter</label>
          <span className={`text-[10px] font-mono ${viewMode === 'history' ? 'text-amber-500' : 'text-cyan-400'}`}>{intensityFilter.toFixed(1)}</span>
        </div>
        <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={intensityFilter}
            onChange={(e) => setIntensityFilter(parseFloat(e.target.value))}
            className={`w-full h-1 rounded-lg appearance-none cursor-pointer transition-colors ${viewMode === 'history' ? 'bg-amber-950 accent-amber-500' : 'bg-cyan-950 accent-cyan-500'}`}
        />
      </div>

      <button
        onClick={() => setRotating(!rotating)}
        className={`w-full mt-4 px-3 py-2 text-[10px] font-bold uppercase rounded border transition-all ${
          viewMode === 'history' 
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30' 
          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        }`}
      >
        {rotating ? 'Freeze Axial Rotation' : 'Engage Orbit'}
      </button>
    </div>
  );
};

export default ControlPanel;
