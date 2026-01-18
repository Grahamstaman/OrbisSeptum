import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Activity, Thermometer, Wind, Zap } from 'lucide-react';
import { globalEvents, seismicData } from '../data/mockData';

const EventItem = ({ event, icon: Icon, color }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
        <div className={`mt-0.5 p-1.5 rounded-full ${color} bg-opacity-20`}>
            <Icon size={14} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
            <div className="text-xs font-bold text-white/90">{event.title}</div>
            <div className="text-[10px] text-white/50 font-mono mt-0.5 uppercase tracking-wide">
                {event.date || new Date(event.timestamp).toLocaleDateString()}
                {event.val && ` • MAG ${event.val}`}
            </div>
        </div>
    </div>
);

const GlobalEventsPanel = () => {
    const [activeTab, setActiveTab] = useState('events'); // 'events' (NASA) or 'seismic' (USGS)

    // Safety check for empty data
    const safeEvents = globalEvents || [];
    const safeSeismic = seismicData || [];

    return (
        <div className="absolute left-8 top-32 w-80 max-h-[calc(100vh-160px)] flex flex-col pointer-events-auto">
            {/* Panel Header */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-t-xl border border-white/10 p-4 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity size={16} className="text-cyan-400" />
                        GLOBAL INTEL
                    </h3>
                    <div className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                        LIVE FEED
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex-1 pb-3 text-xs font-medium transition-colors border-b-2 ${activeTab === 'events' ? 'border-cyan-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                    >
                        EVENTS ({safeEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('seismic')}
                        className={`flex-1 pb-3 text-xs font-medium transition-colors border-b-2 ${activeTab === 'seismic' ? 'border-orange-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                    >
                        SEISMIC ({safeSeismic.length})
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-b-xl border-x border-b border-white/10 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto custom-scrollbar p-3 space-y-2 flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'events' ? (
                            <motion.div
                                key="events"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {safeEvents.length > 0 ? safeEvents.map(evt => (
                                    <EventItem
                                        key={evt.id}
                                        event={evt}
                                        icon={evt.type === 'Wildfires' ? Thermometer : evt.type === 'Severe Storms' ? Wind : Zap}
                                        color="text-red-400 bg-red-400"
                                    />
                                )) : (
                                    <div className="text-xs text-white/30 italic text-center py-4">No active anomalies detected.</div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="seismic"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {safeSeismic.length > 0 ? safeSeismic.map(quake => (
                                    <EventItem
                                        key={quake.id}
                                        event={quake}
                                        icon={Activity}
                                        color="text-orange-400 bg-orange-400"
                                    />
                                )) : (
                                    <div className="text-xs text-white/30 italic text-center py-4">Lithosphere stable.</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Gradient */}
                <div className="h-6 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none sticky bottom-0" />
            </div>
        </div>
    );
};

export default GlobalEventsPanel;
