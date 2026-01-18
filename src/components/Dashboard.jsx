import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Landmark, Activity, X, AlertTriangle } from 'lucide-react';
import { countryData } from '../data/mockData';

const StatCard = ({ label, value, color = "text-white" }) => (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
        <div className="text-xs text-white/40 mb-1 uppercase">{label}</div>
        <div className={`text-xl font-bold font-mono ${color}`}>{value || "-"}</div>
    </div>
);

// Utility: Calculate Live Number based on Annual Growth Rate
const useLiveEstimate = (baseValueStr, growthRateStr, baseYear) => {
    const [liveValue, setLiveValue] = useState(baseValueStr);

    useEffect(() => {
        // Clean strings to numbers (e.g., "334.9M" -> 334900000)
        const parseValue = (str) => {
            if (!str) return 0;
            const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
            if (str.includes('T')) return num * 1000000000000;
            if (str.includes('B')) return num * 1000000000;
            if (str.includes('M')) return num * 1000000;
            return num;
        };

        const baseVal = parseValue(baseValueStr);
        const growthRate = parseFloat(growthRateStr) / 100; // e.g. "2.5%" -> 0.025

        if (!baseVal || isNaN(growthRate) || !baseYear) {
            setLiveValue(baseValueStr);
            return;
        }

        const tick = () => {
            const now = new Date();
            // Calculate exact years passed since Jan 1st of the base year
            const startOfBaseYear = new Date(baseYear, 0, 1);
            const millisecondsDiff = now - startOfBaseYear;
            const yearsElapsed = millisecondsDiff / (1000 * 60 * 60 * 24 * 365.25);

            // Linear interpolation formula: Base * (1 + (rate * years))
            // For population, this adds people every second
            const currentEst = baseVal * (1 + (growthRate * yearsElapsed));

            // Formatting back to string
            if (baseValueStr.includes('T') || baseValueStr.includes('B')) {
                // Keep money formats simpler, maybe update less often
                setLiveValue(`$${(currentEst / (baseValueStr.includes('T') ? 1e12 : 1e9)).toFixed(3)}${baseValueStr.includes('T') ? 'T' : 'B'}`);
            } else {
                // For population, show full integer with commas for that "Ticker" feel
                setLiveValue(Math.floor(currentEst).toLocaleString());
            }
        };

        const interval = setInterval(tick, 50); // Update every 50ms for smooth effect
        tick(); // Run immediately
        return () => clearInterval(interval);
    }, [baseValueStr, growthRateStr, baseYear]);

    return liveValue;
};

// New Component to display Official + Live Data
const DualStatCard = ({ label, baseValue, growth, year }) => {
    const liveValue = useLiveEstimate(baseValue, growth, year);

    return (
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-white/40 mb-1 uppercase">{label}</div>

            {/* Live Number */}
            <div className="text-lg font-bold font-mono text-white tracking-tight">
                {liveValue}
                <span className="text-[10px] text-cyan-400 font-normal ml-2 animate-pulse">
                    ● LIVE
                </span>
            </div>

            {/* Official Number */}
            <div className="text-[10px] text-white/30 mt-1 font-mono">
                Official ({year}): {baseValue}
            </div>
        </div>
    );
};

const Dashboard = ({ selectedCountryName, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');



    // DEBUG LOGGING: Open your browser console to see these
    useEffect(() => {
        console.log("Dashboard Mounted.");
        console.log("Selected Country:", selectedCountryName);
        console.log("Available Data Keys:", Object.keys(countryData));
    }, [selectedCountryName]);

    // SAFETY CHECK 1: Ensure countryData exists
    if (!countryData) {
        console.error("CRITICAL: countryData is undefined. Check import in Dashboard.jsx");
        return null;
    }

    // Lookup Logic with explicit logging
    let country = countryData[selectedCountryName];
    let isFallback = false;

    if (!country) {
        console.warn(`Data for ${selectedCountryName} not found. Falling back to US data.`);
        // SAFETY CHECK 2: Ensure fallback exists
        if (countryData["United States of America"]) {
            country = countryData["United States of America"];
            isFallback = true;
        } else {
            console.error("CRITICAL: Fallback 'United States of America' not found in mockData.");
            // Ultimate fallback to prevent crash
            country = {
                name: "Unknown",
                risk: "Unknown",
                activeUsers: "0",
                segments: [],
                gdp: "N/A",
                growth: "N/A",
                population: "N/A"
            };
        }
    }

    // Prevent rendering if still invalid (should be caught by ultimate fallback above)
    if (!country) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'economics', label: 'Economics', icon: Landmark },
        { id: 'demographics', label: 'Demographics', icon: Users },
    ];

    // Helper to estimate GDP Per Capita from string values (e.g., "$14.5B" / "40.6M")
    const calculatePerCapita = (gdpStr, popStr) => {
        if (!gdpStr || !popStr || gdpStr === "N/A" || popStr === "N/A") return "N/A";

        const parseValue = (str) => {
            const num = parseFloat(str.replace(/[^0-9.]/g, ''));
            if (str.includes('T')) return num * 1000000000000;
            if (str.includes('B')) return num * 1000000000;
            if (str.includes('M')) return num * 1000000;
            return num;
        };

        const gdpVal = parseValue(gdpStr);
        const popVal = parseValue(popStr);

        if (!popVal) return "N/A";

        const perCapita = Math.round(gdpVal / popVal);
        return `$${perCapita.toLocaleString()}`;
    };

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 h-full w-[400px] z-10 p-4 font-sans"
        >
            <div className="h-full w-full rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative text-white">

                {/* Header */}
                <div className="p-6 border-b border-white/5 relative bg-gradient-to-r from-blue-900/40 to-purple-900/40">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white cursor-pointer z-50">
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
                        <div>
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                                {selectedCountryName || "Unknown Region"}
                            </h2>
                            {isFallback && (
                                <div className="flex items-center gap-1 text-xs text-orange-400 font-mono mt-1">
                                    <AlertTriangle size={10} />
                                    <span>Simulated Data (Target Unreachable)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-white/40 uppercase tracking-widest">Stability Risk</span>
                            <span className={`text-sm font-semibold ${country.risk === 'Low' ? 'text-green-400' : country.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                {country.risk || "N/A"}
                            </span>
                        </div>
                        {/* Removed 'Est. Users' as per request */}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-4 gap-4 border-b border-white/5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon size={14} />
                                {tab.label}
                            </div>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <h3 className="text-white/70 text-sm mb-3 flex items-center gap-2"><BarChart3 size={16} /> Market Segments</h3>
                                        <div className="space-y-3">
                                            {country.segments && country.segments.length > 0 ? (
                                                country.segments.map(seg => (
                                                    <div key={seg.name}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-white/60">{seg.name}</span>
                                                            <span className="text-white font-mono">{seg.value}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${seg.value}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-white/30 italic">No market data available.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'economics' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <DualStatCard
                                        label="Population"
                                        baseValue={country.population}
                                        growth={country.growth}
                                        year={country.dataYear || 2023}
                                    />
                                    <DualStatCard
                                        label="GDP"
                                        baseValue={country.gdp}
                                        growth={country.growth}
                                        year={country.dataYear || 2023}
                                    />
                                    <StatCard label="Growth" value={country.growth} color="text-green-400" />
                                    <StatCard
                                        label="GDP Per Capita"
                                        value={calculatePerCapita(country.gdp, country.population)}
                                    />
                                </div>
                            )}
                            {activeTab === 'demographics' && (
                                <div className="space-y-6">
                                    {country.demographics ? (
                                        <>
                                            {/* Age Distribution */}
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <h3 className="text-white/70 text-sm mb-3">Age Structure</h3>
                                                <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-2">
                                                    {country.demographics.age.map((item, i) => (
                                                        <div
                                                            key={item.name}
                                                            style={{ width: `${item.value}%` }}
                                                            className={`h-full ${i === 0 ? 'bg-cyan-500' : i === 1 ? 'bg-blue-500' : 'bg-indigo-500'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-xs text-white/40">
                                                    {country.demographics.age.map((item, i) => (
                                                        <div key={item.name} className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-cyan-500' : i === 1 ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                                                            {item.name}: {item.value}%
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Ethnicity List */}
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <h3 className="text-white/70 text-sm mb-3">Ethnic Groups</h3>
                                                <div className="space-y-2">
                                                    {country.demographics.ethnicity.map(eth => (
                                                        <div key={eth.name} className="flex justify-between items-center text-xs">
                                                            <span className="text-white/60">{eth.name}</span>
                                                            <span className="text-white font-mono">{eth.value}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-white/30">
                                            <AlertTriangle className="mx-auto mb-2 opacity-50" />
                                            No detailed demographic data for this region.
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-white/30 text-center font-mono">
                    ORBIS SEPTUM // DATA ENGINE v2.0
                </div>
            </div>
        </motion.div>
    );
};



export default Dashboard;
