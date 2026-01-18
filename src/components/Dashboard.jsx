import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Landmark, Activity, X, AlertTriangle } from 'lucide-react';
import { countryData } from '../data/mockData';

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
                                    <StatCard label="GDP" value={country.gdp} />
                                    <StatCard label="Growth" value={country.growth} color="text-green-400" />
                                    <StatCard label="Population" value={country.population} />
                                    {/* REPLACED HARDCODED VALUE WITH DYNAMIC CALCULATION */}
                                    <StatCard
                                        label="GDP Per Capita"
                                        value={calculatePerCapita(country.gdp, country.population)}
                                    />
                                </div>
                            )}
                            {activeTab === 'demographics' && (
                                <div className="text-center py-8 text-white/30">
                                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Demographic breakdown visualization placeholder.</p>
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

const StatCard = ({ label, value, color = "text-white" }) => (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
        <div className="text-xs text-white/40 mb-1 uppercase">{label}</div>
        <div className={`text-xl font-bold font-mono ${color}`}>{value || "-"}</div>
    </div>
);

export default Dashboard;
