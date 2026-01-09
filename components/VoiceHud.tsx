
import React from 'react';

interface VoiceHudProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  permissionError: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const VoiceHud: React.FC<VoiceHudProps> = ({ isConnected, isSpeaking, isListening, permissionError, onConnect, onDisconnect }) => {
  if (permissionError) {
      return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
             <div className="bg-red-900/80 border border-red-500/50 text-red-200 px-6 py-2 rounded-full uppercase text-xs font-bold tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                 <span className="text-xl">🔇</span>
                 <span>Microphone Access Denied</span>
             </div>
        </div>
      );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
       {!isConnected ? (
          <button 
             onClick={onConnect}
             className="bg-black/80 border border-cyan-500/50 text-cyan-400 px-6 py-2 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-cyan-900/40 hover:scale-105 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2"
          >
             <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
             Initialize Voice Uplink
          </button>
       ) : (
          <div className="flex items-center gap-0 bg-black/90 border border-cyan-500/50 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
             <div className="flex items-center gap-3 pr-4 border-r border-cyan-500/30">
                <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-cyan-600'}`}></div>
                <div className="flex flex-col">
                   <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest leading-none">Commander Link</span>
                   <span className="text-[8px] text-gray-400 font-mono leading-none mt-1">{isSpeaking ? 'TRANSMITTING' : 'LISTENING'}</span>
                </div>
             </div>
             
             {/* Audio Viz Bars */}
             <div className="flex items-center gap-1 px-4 h-6">
                {[...Array(5)].map((_, i) => (
                   <div 
                      key={i} 
                      className={`w-1 bg-cyan-500 rounded-full transition-all duration-75 ease-in-out ${isListening || isSpeaking ? 'animate-[bounce_0.5s_infinite]' : 'h-1'}`}
                      style={{ 
                         height: isListening || isSpeaking ? `${Math.random() * 16 + 4}px` : '4px',
                         animationDelay: `${i * 0.1}s` 
                      }}
                   ></div>
                ))}
             </div>

             <button onClick={onDisconnect} className="pl-4 text-red-500/70 hover:text-red-400 text-[10px] font-bold uppercase">
                Term
             </button>
          </div>
       )}
    </div>
  );
};

export default VoiceHud;
