import React, { useState } from 'react';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { Body, OracleResponse } from '../types';
import { consultTheOracle } from '../services/geminiService';

interface OraclePanelProps {
  bodies: Body[];
}

const OraclePanel: React.FC<OraclePanelProps> = ({ bodies }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [oracleData, setOracleData] = useState<OracleResponse | null>(null);

  const handleConsult = async () => {
    setIsLoading(true);
    try {
      const data = await consultTheOracle(bodies);
      setOracleData(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-6 right-6 w-80 z-20">
      {/* Trigger Button */}
      {!oracleData && !isLoading && (
        <button
          onClick={handleConsult}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 font-semibold"
        >
          <BrainCircuit size={20} />
          Consult the Oracle
        </button>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="w-full bg-slate-900/90 backdrop-blur border border-indigo-500/30 p-4 rounded-lg flex items-center justify-center gap-3 text-indigo-300 shadow-xl">
          <Loader2 className="animate-spin" size={24} />
          <span>Communing with the stars...</span>
        </div>
      )}

      {/* Result Card */}
      {oracleData && !isLoading && (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-6 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-5 duration-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-2xl font-bold tracking-tighter ${
                oracleData.era === 'Stable Era' ? 'text-emerald-400' : 'text-rose-500'
            }`}>
              {oracleData.era}
            </h2>
            <button 
                onClick={handleConsult} 
                className="text-slate-500 hover:text-indigo-400 transition-colors"
                title="Refresh Prediction"
            >
                <Sparkles size={18} />
            </button>
          </div>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-4 italic border-l-2 border-indigo-500 pl-3">
            "{oracleData.description}"
          </p>

          <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Directive
            </span>
            <p className="text-slate-200 font-medium">
              {oracleData.recommendation}
            </p>
          </div>
          
          <button 
            onClick={() => setOracleData(null)}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 w-full text-center underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default OraclePanel;