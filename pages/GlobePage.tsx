
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { fetchConflictZones, fetchHistoricalConflictZones, fetchGlobalTicker, fetchGlobalMetrics, fetchRegionalIntel, fetchStrategicAssets, fetchScenarioZones } from '../services/geminiService';
import { fetchGlobalWeather } from '../services/weatherService';
import { CategoriesData, Category, SelectedZoneInfo, GlobalMetrics, RegionalIntel, Zone, WeatherPoint, StrategicAsset } from '../types';
import Globe from '../components/Globe';
import ControlPanel from '../components/ControlPanel';
import InfoBox from '../components/InfoBox';
import BottomHud from '../components/BottomHud';
import LoadingSpinner from '../components/LoadingSpinner';
import SecurityOverlay from '../components/SecurityOverlay';
import VoiceHud from '../components/VoiceHud';
import ReconModal from '../components/ReconModal';
import { useCommanderVoice } from '../hooks/useCommanderVoice';
import { getRegionFromLatLon } from '../utils/geo';
import { playHoverSound, playClickSound, playDataStreamSound, playAlertSound } from '../utils/soundEffects';

const GlobePage: React.FC = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [categoriesData, setCategoriesData] = useState<CategoriesData | null>(null);
  const [tickerText, setTickerText] = useState("ESTABLISHING SECURE CONNECTION...");
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    environmental: true, social: true, government: true, species: true, radiation: true, war: true, phenomena: true
  });
  const [rotationSpeed, setRotationSpeed] = useState(0.002);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<SelectedZoneInfo | null>(null);
  const [intensityFilter, setIntensityFilter] = useState(0.0);
  const [globeTarget, setGlobeTarget] = useState<{lat: number, lon: number} | null>(null);
  
  const [showRecon, setShowRecon] = useState(false);
  const [scenarioActive, setScenarioActive] = useState(false);

  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherPoint[]>([]);
  const [strategicAssets, setStrategicAssets] = useState<StrategicAsset[]>([]);

  const [currentRegion, setCurrentRegion] = useState<string>("Global");
  const [regionalIntel, setRegionalIntel] = useState<RegionalIntel | null>(null);
  const [loadingRegional, setLoadingRegional] = useState(false);

  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (mode: 'live' | 'history', year: number) => {
    setLoading(true);
    playDataStreamSound();
    setScenarioActive(false); 
    try {
      if (mode === 'live') {
          const [data, ticker, metrics, assets] = await Promise.all([
            fetchConflictZones(),
            fetchGlobalTicker(),
            fetchGlobalMetrics(),
            fetchStrategicAssets()
          ]);
          
          // Enforce visual identity: Phenomena markers should always be white
          if (data && data.phenomena) {
             data.phenomena.color = 0xffffff;
          }

          setCategoriesData(data);
          setTickerText(ticker);
          setGlobalMetrics(metrics);
          setStrategicAssets(assets);
      } else {
          const [data, ticker] = await Promise.all([
              fetchHistoricalConflictZones(year),
              fetchGlobalTicker(year)
          ]);
          
          // Enforce visual identity for history as well
          if (data && data.phenomena) {
             data.phenomena.color = 0xffffff;
          }

          setCategoriesData(data);
          setTickerText(ticker);
          setGlobalMetrics(null); 
          setShowWeather(false);
          setStrategicAssets([]);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Periodic Telemetry Update (Every 60s)
  useEffect(() => {
    if (!accessGranted || viewMode !== 'live' || scenarioActive) return;
    
    const refreshTelemetry = async () => {
      try {
        const [metrics, assets, ticker] = await Promise.all([
          fetchGlobalMetrics(),
          fetchStrategicAssets(),
          fetchGlobalTicker()
        ]);
        setGlobalMetrics(metrics);
        setStrategicAssets(assets);
        setTickerText(ticker);
        console.debug("Telemetry sync complete.");
      } catch (e) {
        console.warn("Telemetry sync failed", e);
      }
    };

    const interval = setInterval(refreshTelemetry, 60000);
    return () => clearInterval(interval);
  }, [accessGranted, viewMode, scenarioActive]);

  const handleRunScenario = async (scenario: string) => {
     setLoading(true);
     setTickerText(`SIMULATION RUNNING: ${scenario.toUpperCase()}`);
     playAlertSound();
     try {
        const data = await fetchScenarioZones(scenario);
        if (data && data.phenomena) data.phenomena.color = 0xffffff;
        setCategoriesData(data);
        setScenarioActive(true);
        setGlobalMetrics({ cyberLevel: 75, civilUnrest: 85, economicInstability: 60, defcon: 2 });
     } catch (e) {
        console.error("Scenario failed", e);
     } finally {
        setLoading(false);
     }
  };

  const handleResetScenario = () => {
     playClickSound();
     loadData('live', selectedYear);
  };

  const handleUpdateView = useCallback((lat: number, lon: number) => {
    setRotationSpeed(0); // Pause rotation when focusing
    setGlobeTarget({ lat, lon });
    const region = getRegionFromLatLon(lat, lon);
    setCurrentRegion(region);
    playClickSound();
  }, []);

  const handleToggleCategory = useCallback((category: string, active: boolean) => {
    setActiveCategories(prev => ({ ...prev, [category]: active }));
    playClickSound();
  }, []);

  const handleInspectZone = useCallback((name: string) => {
      if (!categoriesData) return;
      let foundZone: Zone | null = null;
      let foundCat: string = '';
      let foundColor: number = 0;

      for (const [, rawCat] of Object.entries(categoriesData)) {
          const cat = rawCat as Category;
          const z = cat.zones.find(z => z.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(z.name.toLowerCase()));
          if (z) {
              foundZone = z;
              foundCat = cat.name;
              foundColor = cat.color;
              break;
          }
      }

      if (foundZone) {
          handleUpdateView(foundZone.lat, foundZone.lon);
          setSelectedZoneInfo({ zone: foundZone, categoryName: foundCat, categoryColor: foundColor });
      }
  }, [categoriesData, handleUpdateView]);

  const { connect, disconnect, isConnected, isSpeaking, isListening, permissionError } = useCommanderVoice({
    onUpdateView: handleUpdateView,
    onToggleCategory: handleToggleCategory,
    onRunScenario: handleRunScenario,
    onInspectZone: handleInspectZone
  });

  useEffect(() => {
    if (accessGranted) {
        loadData(viewMode, selectedYear);
    }
  }, [viewMode, accessGranted]);

  useEffect(() => {
    if (showWeather && viewMode === 'live' && categoriesData && !scenarioActive) {
        const allZones: Zone[] = [];
        Object.values(categoriesData).forEach((cat: any) => allZones.push(...cat.zones));
        fetchGlobalWeather(allZones).then(data => setWeatherData(data));
        const interval = setInterval(() => {
            fetchGlobalWeather(allZones).then(data => setWeatherData(data));
        }, 300000);
        return () => clearInterval(interval);
    }
  }, [showWeather, viewMode, categoriesData, scenarioActive]);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    playClickSound();
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      loadData('history', year);
    }, 1000);
  }, [loadData]);

  const toggleCategory = useCallback((category: string) => {
    setActiveCategories(prev => ({ ...prev, [category]: !prev[category] }));
    playHoverSound();
  }, []);

  const handleMarkerClick = useCallback((zoneInfo: SelectedZoneInfo) => {
    playClickSound();
    setSelectedZoneInfo(zoneInfo);
    setRotationSpeed(0); // Pause on click
    setGlobeTarget({ lat: zoneInfo.zone.lat, lon: zoneInfo.zone.lon });
    const region = getRegionFromLatLon(zoneInfo.zone.lat, zoneInfo.zone.lon);
    setCurrentRegion(region);
  }, []);

  const handleCenterOnMap = useCallback((lat: number, lon: number) => {
    setRotationSpeed(0);
    setGlobeTarget({ lat, lon });
    playClickSound();
  }, []);
  
  const handleCloseInfo = () => {
      setSelectedZoneInfo(null);
      setCurrentRegion("Global");
      setRotationSpeed(0.002); // Resume rotation
      setGlobeTarget(null);
      playClickSound();
  };

  const activeZonesInRegion = useMemo(() => {
    if (!categoriesData) return [];
    let zones: { zone: Zone; category: Category }[] = [];
    (Object.values(categoriesData) as Category[]).forEach(cat => {
        cat.zones.forEach(z => {
            if (currentRegion === "Global") {
                zones.push({ zone: z, category: cat });
            } else {
                if (getRegionFromLatLon(z.lat, z.lon) === currentRegion) {
                    zones.push({ zone: z, category: cat });
                }
            }
        });
    });
    return zones.sort((a, b) => b.zone.intensity - a.zone.intensity);
  }, [categoriesData, currentRegion]);

  useEffect(() => {
     if(scenarioActive) {
        setRegionalIntel({ regionName: currentRegion, threatLevel: 99, summary: "SIMULATION DATA ONLY. REAL-WORLD INTEL OFFLINE." });
        return;
     }

     const fetchIntel = async () => {
         setLoadingRegional(true);
         const zoneNames = activeZonesInRegion.slice(0, 5).map(z => z.zone.name);
         const intel = await fetchRegionalIntel(currentRegion, zoneNames);
         setRegionalIntel(intel);
         setLoadingRegional(false);
     };
     const timer = setTimeout(fetchIntel, 500);
     return () => clearTimeout(timer);
  }, [currentRegion, activeZonesInRegion, scenarioActive]); 

  const selectedZoneWeather = useMemo(() => {
      if (!selectedZoneInfo || !showWeather) return undefined;
      return weatherData.find(p => 
          Math.abs(p.lat - selectedZoneInfo.zone.lat) < 0.1 && 
          Math.abs(p.lon - selectedZoneInfo.zone.lon) < 0.1
      );
  }, [selectedZoneInfo, showWeather, weatherData]);

  if (!accessGranted) {
      return <SecurityOverlay onAccessGranted={() => setAccessGranted(true)} />;
  }

  return (
    <div className={`w-full h-screen bg-black relative overflow-hidden flex flex-col transition-colors duration-1000 ${viewMode === 'history' ? 'bg-[#050500]' : 'bg-black'}`}>
      
      {viewMode === 'live' && globalMetrics && globalMetrics.defcon <= 2 && (
         <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(255,0,0,0.2)] border-[20px] border-red-500/10 animate-pulse"></div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center">
            <LoadingSpinner />
            <div className="absolute mt-16 text-cyan-400 font-bold uppercase tracking-widest animate-pulse">
                {scenarioActive ? 'Simulating Scenario...' : 'Processing Global Vectors...'}
            </div>
        </div>
      )}

      {showRecon && <ReconModal onClose={() => setShowRecon(false)} />}

      {viewMode === 'live' && !scenarioActive && (
        <VoiceHud 
          isConnected={isConnected} 
          isSpeaking={isSpeaking} 
          isListening={isListening}
          permissionError={permissionError}
          onConnect={connect} 
          onDisconnect={disconnect} 
        />
      )}

      <div className="flex-grow relative pb-48"> 
        {categoriesData && (
          <>
            <Globe 
              categories={categoriesData} 
              activeCategories={activeCategories}
              onMarkerClick={handleMarkerClick}
              rotationSpeed={rotationSpeed}
              intensityFilter={intensityFilter}
              globeTarget={globeTarget}
              weatherData={weatherData}
              showWeather={showWeather}
              assets={strategicAssets}
              year={viewMode === 'history' ? selectedYear : undefined}
            />
            <ControlPanel
              categories={categoriesData}
              activeCategories={activeCategories}
              toggleCategory={toggleCategory}
              rotationSpeed={rotationSpeed}
              setRotationSpeed={setRotationSpeed}
              intensityFilter={intensityFilter}
              setIntensityFilter={setIntensityFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              metrics={globalMetrics}
              showWeather={showWeather}
              setShowWeather={setShowWeather}
              onOpenRecon={() => setShowRecon(true)}
              onRunScenario={handleRunScenario}
              scenarioActive={scenarioActive}
              resetScenario={handleResetScenario}
            />
            <InfoBox 
              selectedZoneInfo={selectedZoneInfo} 
              onClose={handleCloseInfo} 
              onCenterOnMap={handleCenterOnMap} 
              year={viewMode === 'history' ? selectedYear : undefined}
              weather={selectedZoneWeather}
            />
          </>
        )}
      </div>
      
      <BottomHud 
        region={currentRegion}
        regionalIntel={regionalIntel}
        loading={loadingRegional}
        activeZones={activeZonesInRegion}
        isGlobal={currentRegion === "Global"}
        metrics={globalMetrics}
      />

      <div className={`h-10 border-t flex items-center z-50 overflow-hidden transition-colors relative ${viewMode === 'history' ? 'bg-amber-950/20 border-amber-500/20' : 'bg-black border-cyan-500/20'}`}>
        <div className={`h-full px-4 flex items-center border-r text-[10px] font-bold tracking-widest whitespace-nowrap transition-colors ${viewMode === 'history' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
          {viewMode === 'history' ? `ARCHIVAL INTEL FEED [${selectedYear}]` : 'LIVE WATCH FEED'}
        </div>
        <div className="flex-grow relative overflow-hidden">
          <div className={`absolute whitespace-nowrap animate-[ticker_40s_linear_infinite] hover:pause text-xs font-mono py-2 ${viewMode === 'history' ? 'text-amber-500/60' : 'text-cyan-500/70'}`}>
            {tickerText} • {tickerText} • {tickerText}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0891b2; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GlobePage;
