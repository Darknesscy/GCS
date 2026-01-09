
import React, { useEffect, useRef } from 'react';
import { RegionalIntel, Zone, Category, GlobalMetrics } from '../types';

interface BottomHudProps {
  region: string;
  regionalIntel: RegionalIntel | null;
  loading: boolean;
  activeZones: { zone: Zone; category: Category }[];
  isGlobal: boolean;
  metrics?: GlobalMetrics | null;
}

const BottomHud: React.FC<BottomHudProps> = ({ region, regionalIntel, loading, activeZones, isGlobal, metrics }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topologyRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let offset = 0;
    const dataPoints = Array.from({ length: 60 }, () => Math.random() * 30);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 0.5;
      for(let i=0; i<canvas.width; i+=20) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      ctx.strokeStyle = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const widthStep = canvas.width / dataPoints.length;
      dataPoints.shift();
      dataPoints.push(10 + Math.random() * 40 + (regionalIntel?.threatLevel || 0) / 2);

      dataPoints.forEach((p, i) => {
        const x = i * widthStep;
        const y = canvas.height - p;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      offset = (offset + 1.5) % canvas.width;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(offset, 0, 3, canvas.height);

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [regionalIntel]);

  // Topology Visualizer
  useEffect(() => {
    const canvas = topologyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    }));

    let anim: number;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 0.5;

        nodes.forEach((n, i) => {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

            nodes.forEach((n2, j) => {
                if (i === j) return;
                const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
                if (dist < 50) {
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                }
            });
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(n.x - 1, n.y - 1, 2, 2);
        });
        anim = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(anim);
  }, []);

  const defconColor = metrics?.defcon === 1 || metrics?.defcon === 2 ? 'text-red-500' : 
                      metrics?.defcon === 3 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/95 backdrop-blur-3xl border-t border-cyan-500/30 z-40 flex overflow-hidden animate-in slide-in-from-bottom-20 duration-1000 tactical-frame">
      
      {/* SECTION 1: REGION STATUS */}
      <div className="w-[20%] min-w-[220px] border-r border-cyan-500/10 p-5 flex flex-col justify-between relative bg-cyan-950/5">
        <div className="absolute top-1 right-2 text-[6px] text-cyan-900 font-mono tracking-widest uppercase">Node_Link_07</div>
        <div>
          <h3 className="text-[10px] text-cyan-600 uppercase tracking-[0.4em] font-black opacity-60">Tactical Sector</h3>
          <h2 className={`text-2xl font-black uppercase tracking-tighter mt-1 truncate drop-shadow-lg ${isGlobal ? 'text-cyan-400' : 'text-amber-400'}`}>
            {region.toUpperCase()}
          </h2>
        </div>
        
        <div className="space-y-4">
           <div className="flex justify-between items-end">
              <span className="text-[9px] text-gray-500 font-mono tracking-widest font-black">THREAT_LEVEL</span>
              <span className={`text-2xl font-mono font-black ${ (regionalIntel?.threatLevel || 0) > 70 ? 'text-red-500 animate-pulse' : 'text-cyan-300'}`}>
                {regionalIntel ? (regionalIntel.threatLevel) : '--'}%
              </span>
           </div>
           <div className="relative h-12 border-t border-cyan-500/10 pt-2">
             <canvas ref={canvasRef} width={220} height={40} className="w-full h-10 opacity-90" />
           </div>
        </div>
      </div>

      {/* SECTION 2: GLOBAL SYSTEM MATRIX */}
      <div className="w-[20%] min-w-[220px] border-r border-cyan-500/10 p-5 flex flex-col justify-between relative bg-black/80">
        <div className="absolute top-1 right-2 text-[6px] text-cyan-900 font-mono tracking-widest uppercase">Stability_Grid</div>
        
        <div className="flex justify-between items-start">
           <h3 className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black opacity-60">Global Stability</h3>
           <div className="flex flex-col items-end">
             <span className="text-[8px] text-gray-700 font-black uppercase">DEFCON</span>
             <span className={`text-3xl font-black font-mono leading-none ${defconColor} drop-shadow-[0_0_15px_currentColor]`}>
               {metrics?.defcon || 'X'}
             </span>
           </div>
        </div>

        <div className="space-y-3 mt-2">
          {[
            { label: 'CYBER', val: metrics?.cyberLevel || 0 },
            { label: 'CIVIL', val: metrics?.civilUnrest || 0 },
            { label: 'ECON', val: metrics?.economicInstability || 0 }
          ].map(m => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
                <span>{m.label}</span>
                <span className={m.val > 70 ? 'text-red-400' : 'text-cyan-400'}>{m.val}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-1500 shadow-[0_0_10px_currentColor] ${m.val > 70 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${m.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: TACTICAL SUMMARY */}
      <div className="w-[40%] p-5 border-r border-cyan-500/10 relative bg-black/20">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] text-cyan-500 uppercase tracking-[0.4em] font-black flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
            Neural Intel Stream
            </h3>
            <canvas ref={topologyRef} width={100} height={20} className="opacity-30" />
        </div>
        
        <div className="h-full bg-cyan-500/5 rounded-sm border border-cyan-500/10 p-5 overflow-y-auto custom-scrollbar shadow-inner relative">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent)] pointer-events-none"></div>
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-3 text-cyan-500/20">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-mono animate-pulse tracking-[0.5em] font-black">SYNCING_VECTORS...</span>
             </div>
           ) : (
             <p className="text-[13px] text-cyan-50/70 font-mono leading-relaxed tracking-tight selection:bg-cyan-500/40">
               {regionalIntel?.summary || "STATION_STANDBY: Uplink established. Awaiting target acquisition protocols."}
             </p>
           )}
        </div>
      </div>

      {/* SECTION 4: VECTOR LIST */}
      <div className="w-[20%] p-5 flex flex-col min-w-[200px] bg-cyan-950/5">
        <h3 className="text-[10px] text-gray-700 uppercase tracking-[0.4em] font-black mb-3 border-b border-cyan-500/10 pb-2">
           Live Vectors [{activeZones.length}]
        </h3>
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2">
           {activeZones.map((item, idx) => (
             <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-sm hover:bg-cyan-500/10 transition-all cursor-pointer group hover:border-cyan-500/30">
                <div className="flex items-center gap-3 truncate">
                   <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: `#${item.category.color.toString(16).padStart(6, '0')}`, color: `#${item.category.color.toString(16).padStart(6, '0')}` }}></div>
                   <span className="text-[10px] text-gray-300 font-black group-hover:text-cyan-400 uppercase tracking-tighter truncate">{item.zone.name}</span>
                </div>
                <span className="text-[9px] font-mono text-cyan-900 font-bold ml-1">{(item.zone.intensity * 10).toFixed(1)}</span>
             </div>
           ))}
           {activeZones.length === 0 && (
              <div className="text-[10px] text-gray-800 italic font-mono mt-4 text-center tracking-widest opacity-50">NO_ACTIVE_SIGNALS</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BottomHud;
