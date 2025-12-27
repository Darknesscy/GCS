
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { fetchConflictZones, fetchHistoricalConflictZones, fetchGlobalTicker } from '../services/geminiService';
import { CategoriesData, Category, SelectedZoneInfo } from '../types';
import Globe from '../components/Globe';
import ControlPanel from '../components/ControlPanel';
import InfoBox from '../components/InfoBox';
import LoadingSpinner from '../components/LoadingSpinner';

const GlobePage: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<CategoriesData | null>(null);
  const [tickerText, setTickerText] = useState("ESTABLISHING DATA LINK... STANDBY...");
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    environmental: true, social: true, government: true, species: true, radiation: true, war: true
  });
  const [rotating, setRotating] = useState(true);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<SelectedZoneInfo | null>(null);
  const [intensityFilter, setIntensityFilter] = useState(0.0);
  const [globeTarget, setGlobeTarget] = useState<{lat: number, lon: number} | null>(null);
  
  // Temporal State
  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (mode: 'live' | 'history', year: number) => {
    setLoading(true);
    try {
      const [data, ticker] = await Promise.all([
        mode === 'live' ? fetchConflictZones() : fetchHistoricalConflictZones(year),
        fetchGlobalTicker(mode === 'live' ? undefined : year)
      ]);
      setCategoriesData(data);
      setTickerText(ticker);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(viewMode, selectedYear);
  }, [viewMode]); // Initial and mode toggle

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    
    // Debounce fetching during sliding
    fetchTimeoutRef.current = setTimeout(() => {
      loadData('history', year);
    }, 1000);
  }, [loadData]);

  const toggleCategory = useCallback((category: string) => {
    setActiveCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const handleMarkerClick = useCallback((zoneInfo: SelectedZoneInfo) => {
    setSelectedZoneInfo(zoneInfo);
    setGlobeTarget(null);
  }, []);

  const handleCenterOnMap = useCallback((lat: number, lon: number) => {
    setRotating(false);
    setGlobeTarget({ lat, lon });
  }, []);

  if (loading && !categoriesData) return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-cyan-400">
      <LoadingSpinner />
      <div className="mt-8 text-center space-y-2">
        <p className="text-xl font-bold tracking-[0.3em] uppercase animate-pulse">
          {viewMode === 'live' ? 'Synchronizing Global Sphere' : `Retrieving Archives: ${selectedYear}`}
        </p>
        <p className="text-xs text-gray-500 font-mono uppercase">
          {viewMode === 'live' ? 'Encrypting Channels // Downloading Geospatial Data' : 'Reconstructing Geopolitical Patterns'}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`w-full h-screen bg-black relative overflow-hidden flex flex-col transition-colors duration-1000 ${viewMode === 'history' ? 'bg-[#050500]' : 'bg-black'}`}>
      {loading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <span className="text-cyan-400 text-[10px] font-bold mt-2 animate-pulse tracking-widest uppercase">Fetching Temporal Data</span>
          </div>
        </div>
      )}
      
      <div className="flex-grow relative">
        {categoriesData && (
          <>
            <Globe 
              categories={categoriesData} 
              activeCategories={activeCategories}
              onMarkerClick={handleMarkerClick}
              rotating={rotating}
              intensityFilter={intensityFilter}
              globeTarget={globeTarget}
            />
            <ControlPanel
              categories={categoriesData}
              activeCategories={activeCategories}
              toggleCategory={toggleCategory}
              rotating={rotating}
              setRotating={setRotating}
              intensityFilter={intensityFilter}
              setIntensityFilter={setIntensityFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
            />
            <InfoBox 
              selectedZoneInfo={selectedZoneInfo} 
              onClose={() => setSelectedZoneInfo(null)} 
              onCenterOnMap={handleCenterOnMap} 
              year={viewMode === 'history' ? selectedYear : undefined}
            />
          </>
        )}
      </div>

      {/* Global Intelligence Ticker */}
      <div className={`h-10 border-t flex items-center z-50 overflow-hidden transition-colors ${viewMode === 'history' ? 'bg-amber-950/20 border-amber-500/20' : 'bg-black border-cyan-500/20'}`}>
        <div className={`h-full px-4 flex items-center border-r text-[10px] font-bold tracking-widest whitespace-nowrap transition-colors ${viewMode === 'history' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
          {viewMode === 'history' ? `ARCHIVAL INTEL FEED [${selectedYear}]` : 'LIVE INTEL FEED'}
        </div>
        <div className="flex-grow relative overflow-hidden">
          <div className={`absolute whitespace-nowrap animate-[ticker_40s_linear_infinite] hover:pause text-xs font-mono py-2 ${viewMode === 'history' ? 'text-amber-500/60' : 'text-cyan-500/70'}`}>
            {tickerText} • {tickerText} • {tickerText}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0891b2; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GlobePage;
