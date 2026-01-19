import React, { useState } from 'react';
import GlobeComponent from './components/GlobeComponent';
import Dashboard from './components/Dashboard';
import GlobalEventsPanel from './components/GlobalEventsPanel';
import IntelligenceSearch from './components/IntelligenceSearch';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  const [isRotationPaused, setIsRotationPaused] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Globe Layer */}
      <ErrorBoundary fallback={
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#050510]">
          <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm max-w-md">
            <h3 className="text-xl font-bold text-red-400 mb-2">3D VISUALIZATION OFFLINE</h3>
            <p className="text-sm text-white/50 mb-4">
              Hardware acceleration is disabled or WebGL is not supported.
              The dashboard is running in 2D fallback mode.
            </p>
            <div className="text-xs text-white/30 font-mono">
              ERROR: WEBGL_CONTEXT_LOST
            </div>
          </div>
        </div>
      }>
        <GlobeComponent
          onCountryClick={setSelectedCountryData}
          isRotationPaused={isRotationPaused}
        />
      </ErrorBoundary>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-auto">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          ORBIS<span className="text-cyan-500">SEPTUM</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${isRotationPaused ? 'bg-yellow-500' : 'bg-green-500'} rounded-full animate-pulse shadow-[0_0_10px_#0f0]`}></div>
            <p className="text-xs text-cyan-300 font-mono tracking-widest opacity-80">
              {isRotationPaused ? 'SYSTEM STANDBY' : 'SYSTEM ONLINE'} // GLOBAL SITUATION MONITORING
            </p>
          </div>

          <button
            onClick={() => setIsRotationPaused(!isRotationPaused)}
            className="px-3 py-1 bg-cyan-900/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded hover:bg-cyan-500/20 transition-all uppercase tracking-widest backdrop-blur-sm"
          >
            {isRotationPaused ? 'RESUME ROTATION' : 'PAUSE ROTATION'}
          </button>
        </div>
      </div>

      {/* Left-Hand Global Events Panel */}
      <GlobalEventsPanel />

      {/* New Reporting Tool */}
      <IntelligenceSearch />

      {/* Dashboard Side Panel */}
      <AnimatePresence>
        {selectedCountryData && (
          <Dashboard
            key="dashboard"
            selectedCountryName={selectedCountryData.NAME || selectedCountryData.name || selectedCountryData.ADMIN || "Unknown"}
            onClose={() => setSelectedCountryData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
