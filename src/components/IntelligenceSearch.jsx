import React, { useState } from 'react';
import { Search, Radio, AlertOctagon, TrendingUp, ShieldAlert, X } from 'lucide-react';
import Sentiment from 'sentiment';

// Initialize Sentiment Analyzer
const sentiment = new Sentiment();

const IntelligenceSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // ⚠️ REPLACE WITH YOUR OWN API KEY (Free Tier is fine for localhost)
    const API_KEY = '505379213637461baf9a1b071bf74b00';

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setAnalysis(null);
        setResults([]);

        try {
            // 1. Fetch News
            const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=15&apiKey=${API_KEY}`);
            const data = await res.json();

            if (data.status === 'error') throw new Error(data.message);

            // 2. Local Sentiment Analysis
            let totalScore = 0;
            let totalComparative = 0;

            const processedArticles = data.articles.map(article => {
                const text = `${article.title} ${article.description || ''}`;
                const result = sentiment.analyze(text);

                totalScore += result.score;
                totalComparative += result.comparative;

                return {
                    ...article,
                    sentiment: result.score,
                    comparative: result.comparative
                };
            });

            // 3. Calculate Global Threat Level
            const avgScore = totalScore / (processedArticles.length || 1);
            let threatLevel = "NEUTRAL";
            let threatColor = "text-yellow-400";

            if (avgScore < -1) { threatLevel = "CRITICAL"; threatColor = "text-red-500"; }
            if (avgScore > 1) { threatLevel = "STABLE"; threatColor = "text-green-400"; }

            setAnalysis({
                totalScan: processedArticles.length,
                avgScore: avgScore.toFixed(2),
                threatLevel,
                threatColor
            });

            setResults(processedArticles);

        } catch (err) {
            console.error("Intel Uplink Failed:", err);
            alert(`Uplink Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-8 right-8 p-4 bg-cyan-900/30 border border-cyan-500/30 rounded-full text-cyan-300 hover:bg-cyan-500/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md group z-50 pointer-events-auto"
            >
                <Search size={24} className="group-hover:animate-pulse" />
            </button>
        );
    }

    return (
        <div className="absolute right-8 bottom-8 w-[400px] z-50 font-sans pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Radio size={16} className="text-cyan-400 animate-pulse" />
                        GLOBAL INTEL UPLINK
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="p-4 border-b border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter Keyword (e.g. Bitcoin, Oil, Cyber)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors uppercase font-mono tracking-wide"
                        />
                        <Search size={16} className="absolute left-3.5 top-3.5 text-white/30" />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`absolute right-2 top-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${loading ? 'bg-white/5 text-white/20' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}
                        >
                            {loading ? 'SCANNING...' : 'SCAN'}
                        </button>
                    </div>
                </form>

                {/* Analysis Dashboard */}
                {analysis && (
                    <div className="p-4 grid grid-cols-2 gap-3 bg-white/5">
                        <div className="p-3 bg-black/20 rounded border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase mb-1">Threat Level</div>
                            <div className={`text-lg font-black tracking-tighter flex items-center gap-2 ${analysis.threatColor}`}>
                                <ShieldAlert size={18} />
                                {analysis.threatLevel}
                            </div>
                        </div>
                        <div className="p-3 bg-black/20 rounded border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase mb-1">Sentiment Score</div>
                            <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-400" />
                                {analysis.avgScore}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {results.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {results.map((article, idx) => (
                                <a
                                    key={idx}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 min-w-[3px] h-3 rounded-full ${article.sentiment > 0 ? 'bg-green-500' : article.sentiment < 0 ? 'bg-red-500' : 'bg-gray-500'}`} />
                                        <div>
                                            <h4 className="text-xs font-bold text-white/90 leading-snug mb-1 group-hover:text-cyan-300 transition-colors">
                                                {article.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                                                <span>{new Date(article.publishedAt).toLocaleTimeString()}</span>
                                                <span>// {article.source.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        !loading && (
                            <div className="p-8 text-center text-white/20 text-xs font-mono uppercase">
                                <AlertOctagon size={32} className="mx-auto mb-3 opacity-20" />
                                Awaiting Uplink Coordinates...
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 text-[10px] text-center text-white/20 border-t border-white/5 font-mono">
                    SECURED CONNECTION // TLS 1.3
                </div>
            </div>
        </div>
    );
};

export default IntelligenceSearch;
