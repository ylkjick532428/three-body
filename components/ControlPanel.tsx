import React from 'react';
import { Play, Pause, RotateCcw, Activity, Settings, Github } from 'lucide-react';
import { SimulationPreset } from '../types';

interface ControlPanelProps {
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  onReset: (preset: SimulationPreset) => void;
  gConstant: number;
  setGConstant: (v: number) => void;
  timeScale: number;
  setTimeScale: (v: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  setIsRunning,
  onReset,
  gConstant,
  setGConstant,
  timeScale,
  setTimeScale
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-6 flex flex-col gap-6 h-full w-80 shadow-2xl z-10">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-indigo-500" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Three Body Sim
        </h1>
      </div>

      {/* Playback Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all ${
            isRunning 
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run</>}
        </button>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenarios</h2>
        <div className="grid grid-cols-1 gap-2">
          {Object.values(SimulationPreset).map((preset) => (
            <button
              key={preset}
              onClick={() => onReset(preset)}
              className="text-left px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 hover:text-white transition-colors border border-slate-700/50 flex items-center gap-2 group"
            >
              <RotateCcw size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Physics Params & Footer Container */}
      <div className="mt-auto space-y-6">
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Settings size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Universe Constants</h2>
          </div>
          
          <div>
            <label className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Gravitational Constant (G)</span>
              <span className="text-indigo-400">{gConstant.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={gConstant}
              onChange={(e) => setGConstant(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Time Dilation</span>
              <span className="text-indigo-400">{timeScale.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-slate-500">
          <span className="text-xs font-mono">Build v1.0.0</span>
          <a 
            href="https://github.com/google/genai-js" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-slate-300 transition-colors"
            aria-label="View on GitHub"
          >
            <Github size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;