import React from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Login = () => {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#18181b] p-10 rounded-2xl border border-[#27272a] text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <TrendingUp className="w-24 h-24 text-indigo-400" />
        </div>

        <div className="inline-flex bg-indigo-500/10 p-4 rounded-2xl mb-8 border border-indigo-500/20">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tighter text-white uppercase italic">Nexus<span className="text-indigo-400">Trade</span></h1>
        <p className="text-gray-500 mb-10 leading-relaxed text-sm px-4">
          Professional-grade analytics for serious market participants. 
          Master your psychology through systematic logging.
        </p>

        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-3 w-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          <span>Authenticate with Oracle</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>

        <p className="text-[9px] text-gray-700 mt-10 uppercase tracking-[0.3em] font-mono">
          E2E Latency Optimized • Tier-4 Infrastructure
        </p>
      </motion.div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl text-center px-4">
        {[
          { label: 'Deep Semantic Analysis', desc: 'Isolate psychological anomalies before they manifest as losses.' },
          { label: 'Visual Documentation', desc: 'Every tick, every candle, documented with high-fidelity visual evidence.' },
          { label: 'Global Aggregation', desc: 'Infinite account consolidation within a unified high-speed dashboard.' },
        ].map((feat, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{feat.label}</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-black uppercase tracking-tight">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Login;
