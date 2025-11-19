import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import SimulationCanvas from './components/SimulationCanvas';
import OraclePanel from './components/OraclePanel';
import { Body, SimulationPreset } from './types';
import { generateInitialState } from './services/physicsUtils';

// Default window dimensions (updated on mount)
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isRunning, setIsRunning] = useState(false);
  const [gConstant, setGConstant] = useState(1.5);
  const [timeScale, setTimeScale] = useState(1.0);
  
  // State for bodies. Note: SimulationCanvas uses a Ref for the intense loop,
  // but syncs back to this state periodically so OraclePanel can read it.
  const [bodies, setBodies] = useState<Body[]>([]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 320, // Subtract sidebar width
        height: window.innerHeight
      });
    };

    // Initial set
    handleResize();
    
    // Set initial bodies based on initial size
    const initial = generateInitialState(SimulationPreset.STABLE_FIGURE_8, window.innerWidth - 320, window.innerHeight);
    setBodies(initial);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleReset = (preset: SimulationPreset) => {
    setIsRunning(false);
    // Small timeout to allow render cycle to clear before resetting positions
    setTimeout(() => {
        const newBodies = generateInitialState(preset, dimensions.width, dimensions.height);
        setBodies(newBodies);
        // Auto start for better UX? Let's keep it paused so user sees the setup.
    }, 50);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <ControlPanel 
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        onReset={handleReset}
        gConstant={gConstant}
        setGConstant={setGConstant}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
      />

      {/* Main Content */}
      <main className="flex-1 relative">
        <SimulationCanvas 
            bodies={bodies}
            setBodies={setBodies}
            isRunning={isRunning}
            gConstant={gConstant}
            timeScale={timeScale}
            width={dimensions.width}
            height={dimensions.height}
        />
        
        {/* AI Overlay */}
        <OraclePanel bodies={bodies} />
        
        {/* Title Overlay (if desired, simpler just to have it in sidebar) */}
        <div className="absolute bottom-6 right-6 pointer-events-none opacity-30">
            <h1 className="text-6xl font-black tracking-tighter text-slate-800 select-none">
                TRISOLARIS
            </h1>
        </div>
      </main>
    </div>
  );
};

export default App;