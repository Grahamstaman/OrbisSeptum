import React, { useState } from 'react';
import GlobeComponent from './components/GlobeComponent';
import Dashboard from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);

  return (
    <div className="relative w-screen h-screen bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Globe Layer */}
      <GlobeComponent onCountryClick={setSelectedCountry} />

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          ORBIS<span className="text-cyan-500">SEPTUM</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#0f0]"></div>
          <p className="text-xs text-cyan-300 font-mono tracking-widest opacity-80">
            SYSTEM ONLINE // MONITORING GLOBAL STREAMS
          </p>
        </div>
      </div>

      {/* Dashboard Side Panel */}
      <AnimatePresence>
        {selectedCountry && (
          <Dashboard
            key="dashboard"
            selectedCountryName={selectedCountry}
            onClose={() => setSelectedCountry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
