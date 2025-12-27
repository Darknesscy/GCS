
import React, { useState, useEffect, useRef } from 'react';
import { SelectedZoneInfo, Intel } from '../types';
import { fetchZoneIntel } from '../services/geminiService';

interface InfoBoxProps {
  selectedZoneInfo: SelectedZoneInfo | null;
  onClose: () => void;
  onCenterOnMap: (lat: number, lon: number) => void;
  year?: number;
}

const InfoBox: React.FC<InfoBoxProps> = ({ selectedZoneInfo, onClose, onCenterOnMap, year }) => {
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setIntel(null);
    setLoading(false);
  }, [selectedZoneInfo, year]);

  if (!selectedZoneInfo) return null;

  const { zone, categoryName, categoryColor } = selectedZoneInfo;
  const hexColor = `#${categoryColor.toString(16).padStart(6, '0')}`;
  const isHistory = !!year;

  const handleFetchIntel = async () => {
    setLoading(true);
    const result = await fetchZoneIntel(zone, year);
    setIntel(result);
    setLoading(false);
  };

  const playBriefing = async () => {
    if (!intel?.audioData) return;
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const binary = atob(intel.audioData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  return (
    <div className={`absolute top-4 right-4 backdrop-blur-xl p-0 rounded-lg border z-50 max-w-md w-full animate-in fade-in slide-in-from-right-10 overflow-hidden shadow-2xl transition-colors duration-500 ${isHistory ? 'bg-black/90 border-amber-500/30' : 'bg-black/80 border-cyan-500/30'}`}>
      <div className={`border-b p-4 flex justify-between items-center transition-colors ${isHistory ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
        <div>
          <h2 className={`text-lg font-bold tracking-tighter uppercase ${isHistory ? 'text-amber-500' : 'text-cyan-400'}`}>{zone.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: hexColor }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: hexColor }}>
              {categoryName} {isHistory ? `SECTOR [${year}]` : 'SECTOR'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className={`text-2xl leading-none hover:brightness-125 transition-all ${isHistory ? 'text-amber-500/50' : 'text-cyan-500/50'}`}>&times;</button>
      </div>

      <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
        {intel?.imageUrl && (
          <div className={`relative border rounded overflow-hidden group transition-colors ${isHistory ? 'border-amber-500/20' : 'border-cyan-500/20'}`}>
            <img src={intel.imageUrl} alt="Satellite surveillance" className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className={`absolute top-2 left-2 px-1 bg-black/60 text-[8px] border font-mono transition-colors ${isHistory ? 'text-amber-400 border-amber-500/40' : 'text-cyan-400 border-cyan-500/40'}`}>
              {isHistory ? 'ARCHIVAL FEED :: RESTORED' : 'SATELLITE FEED :: ACTIVE'}
            </div>
            <div className={`absolute bottom-0 left-0 w-full h-[1px] animate-[scan_2s_linear_infinite] ${isHistory ? 'bg-amber-500/50' : 'bg-cyan-500/50'}`}></div>
          </div>
        )}

        <p className="text-gray-300 text-sm leading-relaxed">{zone.description}</p>
        
        <div className={`grid grid-cols-2 gap-4 text-[10px] font-mono border-y py-3 transition-colors ${isHistory ? 'border-amber-500/10' : 'border-cyan-500/10'}`}>
          <div><span className="text-gray-500 uppercase">LAT:</span> {zone.lat.toFixed(4)}</div>
          <div><span className="text-gray-500 uppercase">LON:</span> {zone.lon.toFixed(4)}</div>
          <div className="col-span-2">
            <div className="flex justify-between mb-1"><span className="text-gray-500 uppercase">SEVERITY INDEX:</span> <span>{(zone.intensity * 10).toFixed(1)}/10</span></div>
            <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
              <div className={`h-full shadow-lg transition-all duration-1000 ${isHistory ? 'bg-amber-500 shadow-amber-500/40' : 'bg-cyan-500 shadow-cyan-500/40'}`} style={{ width: `${zone.intensity * 100}%` }} />
            </div>
          </div>
        </div>

        {!intel && (
          <button 
            onClick={handleFetchIntel} 
            disabled={loading}
            className={`w-full py-3 text-xs font-bold uppercase border transition-all flex items-center justify-center gap-2 group ${
              isHistory 
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' 
              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}
          >
            {loading ? <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isHistory ? 'border-amber-500' : 'border-cyan-500'}`} /> : `Decrypt ${isHistory ? 'Archival' : 'Live'} Intelligence`}
          </button>
        )}

        {intel && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {intel.audioData && (
              <button onClick={playBriefing} className={`w-full py-2 text-black text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors shadow-lg ${isHistory ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20' : 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-400/20'}`}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play {isHistory ? 'Temporal' : 'Operational'} Briefing
              </button>
            )}
            
            <div className={`text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-sans border-l-2 pl-3 transition-colors ${isHistory ? 'border-amber-500/30' : 'border-cyan-500/30'}`}>
              {intel.text}
            </div>
            
            <div className={`pt-2 border-t ${isHistory ? 'border-amber-500/10' : 'border-cyan-500/10'}`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isHistory ? 'text-amber-500' : 'text-cyan-500'}`}>Source Verification</h4>
                <span className="text-[8px] text-gray-500 uppercase font-mono">
                  Origin: {isHistory ? 'Chronos Deep Synthesis' : (intel.metadata.groundingChunks?.length ? 'High-Confidence' : 'Internal Analysis')}
                </span>
              </div>
              
              {!isHistory && intel.metadata.groundingChunks && intel.metadata.groundingChunks.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {intel.metadata.groundingChunks.map((c, i) => {
                    const link = c.web?.uri || c.maps?.uri;
                    const title = c.web?.title || c.maps?.title || 'Tactical Report Entry';
                    const type = c.web ? 'WEB' : 'MAPS';
                    if (!link) return null;
                    return (
                      <a 
                        key={i} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] bg-cyan-500/5 border border-cyan-500/10 px-2 py-2 rounded text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group overflow-hidden"
                      >
                        <span className="text-[8px] px-1 bg-cyan-500/20 text-cyan-300 rounded font-bold min-w-[32px] text-center">{type}</span>
                        <span className="truncate flex-grow text-gray-400 group-hover:text-cyan-400">{title}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 italic p-3 bg-gray-900/30 rounded border border-gray-800/50 leading-relaxed font-mono uppercase tracking-tighter">
                  {isHistory 
                    ? `[SYSTEM LOG]: Data reconstructed from archival geopolitical patterns relative to the year ${year}. Direct links to external web sources are unavailable for deep historical synthesis.`
                    : `[SYSTEM WARNING]: NO EXTERNAL GROUNDING LINKS DETECTED. REPORT GENERATED VIA CROSS-CATEGORY SYNTHESIS.`
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoBox;
