
import React, { useState, useEffect } from 'react';
import { CategoriesData, GlobalMetrics } from '../types';

interface ControlPanelProps {
  categories: CategoriesData;
  activeCategories: Record<string, boolean>;
  toggleCategory: (category: string) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
  intensityFilter: number;
  setIntensityFilter: (value: number) => void;
  viewMode: 'live' | 'history';
  setViewMode: (mode: 'live' | 'history') => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  metrics?: GlobalMetrics | null;
  showWeather: boolean;
  setShowWeather: (show: boolean) => void;
  onOpenRecon: () => void;
  onRunScenario: (scenario: string) => void;
  scenarioActive: boolean;
  resetScenario: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  categories, 
  activeCategories, 
  toggleCategory, 
  rotationSpeed, 
  setRotationSpeed,
  intensityFilter,
  setIntensityFilter,
  viewMode,
  setViewMode,
  selectedYear,
  onYearChange,
  metrics,
  showWeather,
  setShowWeather,
  onOpenRecon,
  onRunScenario,
  scenarioActive,
  resetScenario
}) => {
  const currentYear = new Date().getFullYear();
  const [scenarioInput, setScenarioInput] = useState("");
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [sysLoad, setSysLoad] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setSysLoad(Math.floor(40 + Math.random() * 15));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleScenarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!scenarioInput.trim()) return;
    setScenarioLoading(true);
    await onRunScenario(scenarioInput);
    setScenarioLoading(false);
    setScenarioInput("");
  };

  return (
    <div className={`tactical-frame absolute top-4 left-4 backdrop-blur-2xl p-5 rounded-sm border z-20 w-80 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar ${viewMode === 'history' ? 'bg-black/90 border-amber-500/30' : 'bg-black/85 border-cyan-500/40'}`}>
      <div className="absolute top-0 right-2 text-[6px] text-cyan-800 font-mono tracking-widest uppercase opacity-40">UPLINK_STABLE_v9.2</div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-xl font-black tracking-tighter uppercase drop-shadow-[0_0_8px_currentColor] ${viewMode === 'history' ? 'text-amber-500' : 'text-cyan-400'}`}>
          {viewMode === 'history' ? 'Chronos' : 'Tactical Watch'}
        </h1>
        <div className="flex bg-white/5 rounded p-0.5 border border-white/10">
           <button 
             onClick={() => setViewMode('live')}
             className={`px-3 py-1 text-[9px] font-black uppercase rounded transition-all ${viewMode === 'live' ? 'bg-cyan-500 text-black shadow-[0_0_10px_#06b6d4]' : 'text-gray-600 hover:text-gray-400'}`}
           >Live</button>
           <button 
             onClick={() => setViewMode('history')}
             className={`px-3 py-1 text-[9px] font-black uppercase rounded transition-all ${viewMode === 'history' ? 'bg-amber-500 text-black shadow-[0_0_10px_#f59e0b]' : 'text-gray-600 hover:text-gray-400'}`}
           >Past</button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between border border-white/5 p-2 bg-white/5">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Load</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${sysLoad}%` }}></div>
            </div>
            <span className="text-[8px] font-mono text-cyan-500">{sysLoad}%</span>
          </div>
      </div>

      {metrics && viewMode === 'live' && (
        <div className={`mb-6 space-y-3 p-3 bg-white/5 border rounded-sm transition-colors ${metrics.defcon <= 2 ? 'border-red-500/50 bg-red-950/20' : 'border-cyan-500/20'}`}>
            <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${metrics.defcon <= 2 ? 'text-red-400' : 'text-cyan-500'}`}>Operational Status</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${metrics.defcon <= 2 ? 'bg-red-500 text-black animate-pulse' : 'bg-green-500 text-black'}`}>DEFCON {metrics.defcon}</span>
            </div>
            
            {[
                { label: 'Cyber', val: metrics.cyberLevel },
                { label: 'Unrest', val: metrics.civilUnrest },
                { label: 'Economic', val: metrics.economicInstability }
            ].map(m => (
                <div key={m.label} className="space-y-1">
                    <div className={`flex justify-between text-[8px] font-bold uppercase ${metrics.defcon <= 2 ? 'text-red-300' : 'text-cyan-300'}`}>
                        <span>{m.label}</span>
                        <span>{m.val}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full shadow-[0_0_8px] transition-all duration-1000 ${metrics.defcon <= 2 ? 'bg-red-500 shadow-red-500' : 'bg-cyan-500 shadow-cyan-500'}`} 
                            style={{ width: `${m.val}%` }} 
                        />
                    </div>
                </div>
            ))}
        </div>
      )}
      
      {viewMode === 'live' && !scenarioActive && (
         <form onSubmit={handleScenarioSubmit} className="mb-5">
            <div className="relative flex items-center border border-white/10 focus-within:border-purple-500/50 transition-all rounded-sm overflow-hidden bg-black/40">
               <input 
                  type="text" 
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  placeholder="Inject scenario vector..."
                  className="w-full bg-transparent px-3 py-2 text-[10px] text-white focus:outline-none placeholder-gray-700 font-mono"
               />
               <button 
                  type="submit" 
                  disabled={scenarioLoading || !scenarioInput}
                  className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-20 transition-all"
               >
                  {scenarioLoading ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div> : "▶"}
               </button>
            </div>
         </form>
      )}

      {scenarioActive && (
         <button 
            onClick={resetScenario}
            className="w-full mb-5 py-2 bg-purple-900/30 border border-purple-500/50 text-purple-300 text-[9px] font-black uppercase hover:bg-purple-900/50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
         >
            Purge Simulation Matrix
         </button>
      )}

      {viewMode === 'live' && (
         <button 
            onClick={onOpenRecon}
            className="w-full mb-5 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all rounded-sm"
         >
            📷 Sensor Image Analysis
         </button>
      )}

      {viewMode === 'history' && (
        <div className="mb-6 p-4 bg-amber-500/5 rounded-sm border border-amber-500/20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Archive Timeline</span>
            <span className="text-sm font-black text-amber-400 font-mono">{selectedYear}</span>
          </div>
          <input
            type="range"
            min="1950"
            max={currentYear}
            step="1"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      )}
      
      <div className="space-y-2 mb-6">
        <h3 className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em] mb-2 border-b border-white/5 pb-1 opacity-60">Neural Sensors</h3>
        {Object.keys(categories).map(key => (
          <button
            key={key}
            onClick={() => toggleCategory(key)}
            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-sm transition-all duration-300 border ${
              activeCategories[key] 
                ? 'bg-white/5 border-white/10' 
                : 'bg-transparent border-transparent opacity-20 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
            style={{
              borderColor: activeCategories[key] ? `#${categories[key].color.toString(16).padStart(6, '0')}40` : undefined,
            }}
          >
            <div 
              className="w-2.5 h-2.5 rounded-sm shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: `#${categories[key].color.toString(16).padStart(6, '0')}`, color: `#${categories[key].color.toString(16).padStart(6, '0')}` }}
            />
            <span className="text-gray-300 flex-grow font-black text-[10px] uppercase tracking-tight">{categories[key].name}</span>
            <span className={`text-[9px] font-mono ${activeCategories[key] ? 'text-gray-500' : 'text-gray-700'}`}>{categories[key].zones.length}</span>
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t border-white/5 space-y-6">
        {viewMode === 'live' && (
           <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowWeather(!showWeather)}>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${showWeather ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`}>Global Atmosphere</span>
              <div className={`w-9 h-5 rounded-sm p-0.5 transition-all border ${showWeather ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10'}`}>
                 <div className={`w-3.5 h-3.5 rounded-sm shadow-lg transition-all ${showWeather ? 'bg-cyan-400 translate-x-4' : 'bg-gray-700 translate-x-0'}`}></div>
              </div>
           </div>
        )}

        <div>
            <div className="flex justify-between items-center mb-2">
            <label className="text-gray-600 text-[8px] font-black uppercase tracking-[0.2em]">Intensity Cutoff</label>
            <span className={`text-[10px] font-mono font-bold ${viewMode === 'history' ? 'text-amber-500' : 'text-cyan-400'}`}>{intensityFilter.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={intensityFilter}
                onChange={(e) => setIntensityFilter(parseFloat(e.target.value))}
                className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer transition-all ${viewMode === 'history' ? 'accent-amber-500' : 'accent-cyan-500'}`}
            />
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
            <label className="text-gray-600 text-[8px] font-black uppercase tracking-[0.2em]">Rotation Speed</label>
            <span className={`text-[10px] font-mono font-bold ${viewMode === 'history' ? 'text-amber-500' : 'text-cyan-400'}`}>{(rotationSpeed * 1000).toFixed(1)}</span>
            </div>
            <input
                type="range"
                min="0.0001"
                max="0.02"
                step="0.0001"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer transition-all ${viewMode === 'history' ? 'accent-amber-500' : 'accent-cyan-500'}`}
            />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
