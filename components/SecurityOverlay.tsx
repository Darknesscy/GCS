
import React, { useEffect, useState } from 'react';

interface SecurityOverlayProps {
  onAccessGranted: () => void;
}

const SecurityOverlay: React.FC<SecurityOverlayProps> = ({ onAccessGranted }) => {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");

  useEffect(() => {
    // Matrix code effect
    const interval = setInterval(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
        let r = "";
        for(let i=0; i<8; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
        setCode(r);
    }, 50);

    const timeouts = [
      setTimeout(() => setStep(1), 1000), // Identity
      setTimeout(() => setStep(2), 2500), // Biometric
      setTimeout(() => setStep(3), 4000), // Decryption
      setTimeout(() => setStep(4), 5500), // Access
      setTimeout(() => onAccessGranted(), 6500), 
    ];
    return () => {
        clearInterval(interval);
        timeouts.forEach(clearTimeout);
    };
  }, [onAccessGranted]);

  return (
    <div className="fixed inset-0 z-[999] bg-black text-cyan-500 font-mono flex flex-col items-center justify-center pointer-events-none cursor-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)]"></div>
      
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>

      {/* Scanner Visual */}
      <div className="relative w-80 h-80 border border-cyan-500/30 rounded-full flex items-center justify-center mb-8 bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-[spin_3s_linear_infinite] shadow-[0_0_15px_#06b6d4]"></div>
        <div className="absolute inset-4 rounded-full border-b-2 border-cyan-600 animate-[spin_2s_linear_infinite_reverse] opacity-50"></div>
        <div className="absolute inset-10 rounded-full border-l-2 border-cyan-200 animate-[spin_5s_linear_infinite] opacity-30"></div>
        
        <div className="w-56 h-56 bg-cyan-900/10 rounded-full flex items-center justify-center relative overflow-hidden">
           {step >= 2 && (
             <>
               <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
               <div className="w-full h-1 bg-cyan-400/80 absolute animate-[scan_1s_ease-in-out_infinite] shadow-[0_0_10px_#06b6d4]"></div>
               <div className="absolute top-10 left-10 text-[8px] text-cyan-200">{code}</div>
               <div className="absolute bottom-10 right-10 text-[8px] text-cyan-200">{code.split('').reverse().join('')}</div>
             </>
           )}
           <span className="text-5xl animate-pulse filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
             {step < 4 ? '👁️' : '🔓'}
           </span>
        </div>
      </div>

      <div className="h-32 flex flex-col items-center justify-end space-y-3 z-10">
        {step === 0 && <p className="animate-pulse tracking-widest text-sm">INITIALIZING SECURE HANDSHAKE...</p>}
        {step === 1 && <p className="text-emerald-400 font-bold tracking-widest text-lg drop-shadow-[0_0_5px_currentColor]">IDENTITY CONFIRMED: COMMANDER</p>}
        {step === 2 && (
            <div className="flex flex-col items-center gap-2">
                <p className="text-cyan-300 tracking-[0.2em]">RETINAL SCAN ACTIVE</p>
                <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-cyan-500 animate-bounce" style={{animationDelay: `${i*0.1}s`}}></div>)}
                </div>
            </div>
        )}
        {step === 3 && (
          <div className="flex flex-col items-center w-64">
            <p className="text-amber-400 font-mono text-xs mb-1 flex justify-between w-full">
                <span>DECRYPTING SATELLITE UPLINK</span>
                <span>{Math.floor(Math.random()*99)}%</span>
            </p>
            <div className="w-full h-2 bg-gray-900 mt-1 rounded overflow-hidden border border-amber-900/50">
              <div className="h-full bg-amber-500 animate-[width_1.5s_ease-out_forwards] shadow-[0_0_10px_#f59e0b]" style={{width: '100%'}}></div>
            </div>
            <p className="text-[9px] text-amber-700 mt-1 self-start font-mono">{code}</p>
          </div>
        )}
        {step === 4 && <p className="text-3xl font-black text-white tracking-[0.5em] animate-ping drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">ACCESS GRANTED</p>}
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-1">
        <div className="text-[10px] text-cyan-800 font-black tracking-[0.3em]">SECURE PROTOCOL V.9.2</div>
        <div className="text-[8px] text-cyan-900">UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE</div>
      </div>
    </div>
  );
};

export default SecurityOverlay;
