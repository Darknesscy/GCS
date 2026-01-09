
import React, { useState, useEffect, useRef } from 'react';
import { SelectedZoneInfo, Intel, SimulationReport, WeatherPoint, TrustAnalysis } from '../types';
import { fetchZoneIntel, runZoneSimulation, generateBriefingVideo } from '../services/geminiService';
import { decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

interface InfoBoxProps {
  selectedZoneInfo: SelectedZoneInfo | null;
  onClose: () => void;
  onCenterOnMap: (lat: number, lon: number) => void;
  year?: number;
  weather?: WeatherPoint;
}

const CompartmentHeader: React.FC<{ title: string; icon?: string; active?: boolean }> = ({ title, icon, active }) => (
    <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${active ? 'border-cyan-500/50 text-cyan-400' : 'border-white/10 text-gray-500'}`}>
        <span className="text-xs">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{title}</span>
    </div>
);

const InfoBox: React.FC<InfoBoxProps> = ({ selectedZoneInfo, onClose, onCenterOnMap, year, weather }) => {
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState<SimulationReport | null>(null);
  const [activeCompartment, setActiveCompartment] = useState<'situation' | 'verification' | 'forecast'>('situation');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setIntel(null);
    setSimulation(null);
    setVideoUrl(null);
    setActiveCompartment('situation');
    setLoading(false);

    if (selectedZoneInfo) {
      handleFetchIntel();
    }
  }, [selectedZoneInfo, year]);

  if (!selectedZoneInfo) return null;

  const { zone, categoryName, categoryColor } = selectedZoneInfo;
  const hexColor = `#${categoryColor.toString(16).padStart(6, '0')}`;

  const handleFetchIntel = async () => {
    setLoading(true);
    const result = await fetchZoneIntel(zone, year);
    setIntel(result);
    setLoading(false);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    const result = await runZoneSimulation(zone);
    setSimulation(result);
    setSimulating(false);
  };

  const handleGenerateVideo = async () => {
    if (generatingVideo) return;
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
    setGeneratingVideo(true);
    const url = await generateBriefingVideo(zone);
    setVideoUrl(url);
    setGeneratingVideo(false);
  };

  const playBriefing = async () => {
    if (!intel?.audioData) return;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const buffer = await decodeAudioData(base64ToUint8Array(intel.audioData), ctx, 24000);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  // Safe fallback for trust data if loading legacy/mock data
  const trustData: TrustAnalysis = intel?.trust || { score: 0, level: 'UNVERIFIED', sourceCount: 0, verificationNote: 'No data' };

  return (
    <div className="tactical-frame absolute right-4 top-4 w-[480px] max-h-[90vh] bg-[#050505]/95 backdrop-blur-3xl rounded-sm border border-cyan-500/30 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] z-30 animate-in slide-in-from-right-10 duration-500 overflow-hidden">
      
      {/* Decorative ID */}
      <div className="absolute top-1 right-2 text-[6px] text-cyan-900 font-mono tracking-widest pointer-events-none">ZN_ID_{zone.name.replace(/\s+/g, '_').toUpperCase()}_SECURE</div>

      {/* HEADER COMPARTMENT */}
      <div className="p-5 border-b border-cyan-500/20 bg-[linear-gradient(45deg,rgba(6,182,212,0.1)_0%,transparent_100%)] relative">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm shadow-[0_0_5px_currentColor]" style={{ backgroundColor: hexColor, color: hexColor }}></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {categoryName}
                </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{zone.name}</h2>
          </div>
          <button onClick={onClose} className="text-cyan-600 hover:text-white text-2xl leading-none transition-colors">&times;</button>
        </div>

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Severity', val: zone.severity, color: zone.severity > 7 ? 'text-red-500' : 'text-cyan-400' },
              { label: 'Radius', val: `${zone.affectedRadius}km` },
              { label: 'Accuracy', val: `${trustData.score}%`, color: trustData.score > 80 ? 'text-green-400' : 'text-orange-400' },
              { label: 'Uplinks', val: trustData.sourceCount }
            ].map(m => (
              <div key={m.label} className="px-2 py-1.5 bg-white/5 border border-white/5 rounded-sm flex flex-col justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-black tracking-widest">{m.label}</span>
                  <span className={`text-sm font-black font-mono leading-none mt-0.5 ${m.color || 'text-white'}`}>{m.val}</span>
              </div>
            ))}
        </div>
      </div>

      {/* COMPARTMENT NAVIGATION */}
      <div className="flex border-b border-white/5 bg-black/40">
         {[
            { id: 'situation', label: 'Situation Report', icon: '⚡' },
            { id: 'verification', label: 'Truth Integrity', icon: '🛡️' },
            { id: 'forecast', label: 'Neural Forecast', icon: '🔮' }
         ].map(t => (
           <button 
             key={t.id}
             onClick={() => setActiveCompartment(t.id as any)}
             className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.1em] transition-all relative flex items-center justify-center gap-2 ${activeCompartment === t.id ? 'text-cyan-400 bg-cyan-500/5' : 'text-gray-600 hover:text-gray-400'}`}
           >
             <span>{t.icon}</span> {t.label}
             {activeCompartment === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>}
           </button>
         ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow overflow-y-auto p-5 custom-scrollbar bg-[#080808]">
        {!intel && loading ? (
             <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 animate-pulse">Establishing Secure Handshake...</span>
             </div>
        ) : !intel ? (
             <div className="text-center py-10 text-gray-600 text-xs">No Intelligence Loaded</div>
        ) : (
            <>
                {/* COMPARTMENT 1: SITUATION */}
                {activeCompartment === 'situation' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Media Box */}
                        <div className="relative rounded-sm overflow-hidden border border-cyan-500/10 bg-black">
                            {generatingVideo && (
                                <div className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <span className="text-[8px] text-purple-400 uppercase font-black animate-pulse">Rendering Veo-3.1 Stream</span>
                                    </div>
                                </div>
                            )}
                            {videoUrl ? (
                                <video src={videoUrl} autoPlay loop muted className="w-full h-40 object-cover" />
                            ) : (
                                <img src={intel.imageUrl || 'https://via.placeholder.com/400x200/000/000'} alt="Sat View" className="w-full h-40 object-cover opacity-60" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent flex justify-between items-end">
                                <span className="text-[8px] text-cyan-400 bg-black/60 px-1 border border-cyan-500/20 font-mono">LIVE_FEED_SAT_44</span>
                                <div className="flex gap-1">
                                    {intel.audioData && (
                                        <button onClick={playBriefing} className="w-6 h-6 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50 rounded-sm flex items-center justify-center transition-all">🔊</button>
                                    )}
                                    {!videoUrl && !year && (
                                        <button onClick={handleGenerateVideo} className="w-6 h-6 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-500/50 rounded-sm flex items-center justify-center transition-all">🎬</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Text Intel */}
                        <div className="space-y-4">
                            <div>
                                <CompartmentHeader title="Executive Summary" />
                                <p className="text-[11px] text-cyan-50/90 leading-relaxed font-mono border-l-2 border-cyan-500/50 pl-3">{intel.summary}</p>
                            </div>
                            <div>
                                <CompartmentHeader title="Tactical Dynamics" />
                                <p className="text-[10px] text-gray-400 leading-relaxed">{intel.currentDynamics}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* COMPARTMENT 2: VERIFICATION (THE BRAIN) */}
                {activeCompartment === 'verification' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        
                        {/* Trust Score Visualizer */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-sm relative overflow-hidden">
                             <div className="flex justify-between items-end mb-2 relative z-10">
                                <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Trust Integrity Score</span>
                                <span className={`text-3xl font-black font-mono ${trustData.score > 80 ? 'text-green-400' : trustData.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{trustData.score}/100</span>
                             </div>
                             <div className="w-full h-2 bg-black rounded-full overflow-hidden relative z-10">
                                 <div 
                                    className={`h-full transition-all duration-1000 ${trustData.score > 80 ? 'bg-green-500' : trustData.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${trustData.score}%` }}
                                 ></div>
                             </div>
                             <p className="text-[9px] text-gray-500 mt-2 font-mono relative z-10 uppercase">{trustData.verificationNote}</p>
                             
                             {/* Background Grid */}
                             <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent_95%,#fff_95%)] bg-[length:10px_10px]"></div>
                        </div>

                        {/* Source List */}
                        <div>
                             <CompartmentHeader title={`Verified Uplinks (${trustData.sourceCount})`} icon="📡" />
                             <div className="flex flex-col gap-2">
                                {intel.metadata.groundingChunks?.map((chunk, i) => (
                                    chunk.web ? (
                                        <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-black border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group rounded-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-1 h-6 bg-cyan-900 group-hover:bg-cyan-500 transition-colors"></div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[9px] font-bold text-gray-300 group-hover:text-cyan-300 truncate max-w-[250px] uppercase">{chunk.web.title}</span>
                                                    <span className="text-[8px] text-gray-600 font-mono truncate max-w-[250px]">{new URL(chunk.web.uri).hostname}</span>
                                                </div>
                                            </div>
                                            <span className="text-gray-600 text-xs group-hover:text-cyan-500">↗</span>
                                        </a>
                                    ) : null
                                ))}
                                {trustData.sourceCount === 0 && (
                                    <div className="p-4 border border-red-500/20 bg-red-900/5 text-center">
                                        <p className="text-[10px] text-red-400 font-mono uppercase">⚠ No Verified Uplinks Established</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                )}

                {/* COMPARTMENT 3: FORECAST */}
                {activeCompartment === 'forecast' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                        {!simulation ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4 border border-dashed border-purple-500/30 rounded-sm bg-purple-900/5">
                                <div className="text-3xl opacity-50">🧠</div>
                                <div className="text-center px-6">
                                    <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest mb-1">Neural Simulation Matrix</p>
                                    <p className="text-[9px] text-gray-500 mb-4">Run predictive models to determine escalation probability.</p>
                                    <button 
                                        onClick={handleRunSimulation}
                                        disabled={simulating}
                                        className="px-6 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-400 text-[9px] font-black uppercase hover:bg-purple-500/20 transition-all rounded-sm"
                                    >
                                        {simulating ? 'Calculating Vectors...' : 'Run Simulation'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-500/30 rounded-sm">
                                    <span className="text-[9px] text-purple-300 uppercase font-black">Escalation Probability</span>
                                    <span className="text-xl font-black font-mono text-white">{(simulation.probability * 100).toFixed(0)}%</span>
                                </div>

                                <div>
                                    <CompartmentHeader title="Projected Outcome" />
                                    <p className="text-[10px] text-gray-300 italic border-l-2 border-purple-500/50 pl-3">{simulation.outcome}</p>
                                </div>

                                <div>
                                    <CompartmentHeader title="Strategic Timeline" />
                                    <div className="space-y-3 relative">
                                        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-purple-500/20"></div>
                                        {simulation.timeline.map((event, i) => (
                                            <div key={i} className="pl-5 relative">
                                                <div className="absolute left-[3px] top-1.5 w-1.5 h-1.5 bg-purple-900 border border-purple-500 rounded-full z-10"></div>
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className="text-[9px] text-purple-400 font-mono font-bold uppercase">{event.timeframe}</span>
                                                    <span className={`text-[7px] font-black px-1.5 rounded-sm ${event.riskLevel === 'CRITICAL' ? 'bg-red-500 text-black' : 'bg-purple-900 text-purple-300'}`}>{event.riskLevel}</span>
                                                </div>
                                                <p className="text-[10px] text-white font-bold leading-tight">{event.headline}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      <div className="p-4 bg-black/80 border-t border-cyan-500/20 flex justify-between items-center">
         <button onClick={() => onCenterOnMap(zone.lat, zone.lon)} className="text-[9px] text-cyan-600 hover:text-cyan-400 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group">
            <span className="group-hover:rotate-45 transition-transform duration-500">⌖</span> Align Orbital Grid
         </button>
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[7px] text-gray-600 font-mono tracking-widest">SECURE_LINK</span>
         </div>
      </div>
    </div>
  );
};

export default InfoBox;
