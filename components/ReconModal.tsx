
import React, { useState, useRef } from 'react';
import { analyzeReconImage } from '../services/geminiService';
import { ReconReport } from '../types';

interface ReconModalProps {
  onClose: () => void;
}

const ReconModal: React.FC<ReconModalProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<ReconReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
         const base64 = ev.target?.result as string;
         setImage(base64);
         setReport(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    // Remove data:image/...;base64, prefix for API
    const base64Clean = image.split(',')[1];
    const result = await analyzeReconImage(base64Clean);
    setReport(result);
    setAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-black border border-cyan-500/30 w-full max-w-2xl rounded-lg shadow-2xl shadow-cyan-500/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 bg-cyan-950/10">
             <div className="flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <h2 className="text-cyan-400 font-bold uppercase tracking-widest text-sm">Visual Intelligence Uplink</h2>
             </div>
             <button onClick={onClose} className="text-cyan-500 hover:text-cyan-300">&times;</button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {!image ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cyan-500/20 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/5 transition-colors group"
                >
                   <span className="text-4xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📁</span>
                   <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest">Upload Surveillance Imagery</p>
                   <p className="text-gray-600 text-[10px] mt-2">Supports JPG, PNG (Max 5MB)</p>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="relative group rounded-lg overflow-hidden border border-cyan-500/20">
                      <img src={image} alt="Recon" className="w-full h-auto object-cover opacity-80" />
                      {analyzing && (
                        <div className="absolute inset-0 bg-cyan-500/10 animate-pulse">
                           <div className="w-full h-1 bg-cyan-400 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-1 bg-black/70 text-[8px] text-cyan-400 font-mono border border-cyan-500/30">SOURCE: UPLOAD</div>
                   </div>

                   <div className="flex flex-col space-y-4">
                      {!report ? (
                         <div className="flex-grow flex flex-col justify-center">
                            <button 
                               onClick={handleAnalyze} 
                               disabled={analyzing}
                               className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold uppercase text-xs tracking-widest transition-all"
                            >
                               {analyzing ? 'Processing Vector Analysis...' : 'Initiate Analysis'}
                            </button>
                            <button 
                               onClick={() => { setImage(null); setReport(null); }}
                               className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 underline text-center"
                            >
                               Discard Image
                            </button>
                         </div>
                      ) : (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-5">
                            <div className="border-l-2 border-cyan-500 pl-3">
                               <div className="text-[9px] text-gray-500 uppercase font-bold">Threat Assessment</div>
                               <div className={`text-2xl font-mono font-bold ${report.threatScore > 50 ? 'text-red-500' : 'text-cyan-300'}`}>
                                  {report.threatScore}/100
                               </div>
                            </div>
                            
                            <div>
                               <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Tactical Breakdown</div>
                               <p className="text-xs text-gray-300 leading-relaxed">{report.analysis}</p>
                            </div>

                            {report.detectedAssets && report.detectedAssets.length > 0 && (
                               <div>
                                  <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Identified Signatures</div>
                                  <div className="flex flex-wrap gap-1">
                                     {report.detectedAssets.map((asset, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-cyan-900/40 border border-cyan-500/20 text-[9px] text-cyan-400 font-mono uppercase">{asset}</span>
                                     ))}
                                  </div>
                               </div>
                            )}

                            <div className="bg-cyan-500/5 p-3 rounded border border-cyan-500/10">
                               <div className="text-[9px] text-cyan-500 uppercase font-bold mb-1">AI Recommendation</div>
                               <p className="text-[10px] text-gray-400 font-mono">{report.tacticalRecommendation}</p>
                            </div>
                         </div>
                      )}
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ReconModal;
