import React, { useMemo } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Trophy, 
  Skull, 
  Zap, 
  Brain,
  Search,
  Calendar,
  Filter
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

import SmartInsights from '../components/SmartInsights';

const Analytics = () => {
  const { trades, journalEntries } = useTrading();
  const closedTrades = useMemo(() => trades.filter(t => t.status === 'Closed'), [trades]);

  const strategyPnL = useMemo(() => {
    const data: Record<string, number> = {};
    closedTrades.forEach(trade => {
      const journal = journalEntries.find(j => j.tradeId === trade.id);
      const strategy = journal?.strategy || 'Other';
      data[strategy] = (data[strategy] || 0) + trade.pnl;
    });
    return Object.entries(data).map(([name, pnl]) => ({ name, pnl }));
  }, [closedTrades, journalEntries]);

  const assetPerformance = useMemo(() => {
    const data: Record<string, { pnl: number, count: number }> = {};
    closedTrades.forEach(trade => {
      if (!data[trade.asset]) data[trade.asset] = { pnl: 0, count: 0 };
      data[trade.asset].pnl += trade.pnl;
      data[trade.asset].count += 1;
    });
    return Object.entries(data)
      .map(([name, stats]) => ({ name, value: stats.pnl }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [closedTrades]);

  const bestWorstTrades = useMemo(() => {
    if (closedTrades.length === 0) return { best: null, worst: null };
    const sorted = [...closedTrades].sort((a, b) => b.pnl - a.pnl);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  }, [closedTrades]);

  const mistakeAnalysis = useMemo(() => {
    const counts: Record<string, number> = {};
    journalEntries.forEach(j => {
      j.mistakes?.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [journalEntries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-gray-500">Deep dive into your trading psychology and execution patterns.</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4 lg:col-span-1">
          <SmartInsights />
        </div>
        
        {/* Strategy Breakdown */}
        <div className="col-span-4 lg:col-span-3 bg-[#18181b] p-6 rounded-2xl border border-[#27272a] flex flex-col justify-between">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
              <Zap className="w-3 h-3 text-indigo-400" /> PnL by Strategy
           </h3>
           <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={strategyPnL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#71717a' }} 
                    />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#71717a' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]}
                    />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Performance */}
        <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
              <Filter className="w-3 h-3 text-emerald-400" /> Best Assets
           </h3>
           <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={assetPerformance}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {assetPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-3 gap-y-2 gap-x-4 pt-4">
              {assetPerformance.map((asset, i) => (
                <div key={asset.name} className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                   {asset.name}
                </div>
              ))}
           </div>
        </div>

        <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
             <Brain className="w-3 h-3 text-amber-500" /> Psychological Friction
          </h3>
          <div className="space-y-4">
             {mistakeAnalysis.length > 0 ? mistakeAnalysis.map(m => (
               <div key={m.name} className="p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{m.name}</p>
                    <p className="text-xs font-black text-rose-500">{m.value} Instances</p>
                  </div>
                  <div className="w-full bg-[#1c1c1f] h-1 rounded-full overflow-hidden">
                     <div className="bg-rose-500 h-full transition-all" style={{ width: `${Math.min(100, (m.value / closedTrades.length) * 100)}%` }}></div>
                  </div>
               </div>
             )) : (
               <div className="py-10 text-center text-gray-600 italic text-[10px] uppercase font-black tracking-widest">No Patterns Detected</div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Trophy className="w-16 h-16 text-emerald-500" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
               <Trophy className="w-3 h-3 text-emerald-400" /> Peak Execution
            </h3>
            {bestWorstTrades.best ? (
               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-3xl font-black font-mono tracking-tighter text-emerald-500 leading-none mb-2">{bestWorstTrades.best.asset}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{bestWorstTrades.best.type} LOGGED EXECUTION</p>
                     </div>
                     <p className="text-xl font-bold font-mono text-white">+{formatCurrency(bestWorstTrades.best.pnl)}</p>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-[#27272a]">
                     <div>
                        <span className="text-[9px] text-gray-600 block mb-1 uppercase font-black">R/R Achieved</span>
                        <span className="font-mono text-xs font-bold text-white">{bestWorstTrades.best.riskRewardRatio.toFixed(2)}x</span>
                     </div>
                     <div>
                        <span className="text-[9px] text-gray-600 block mb-1 uppercase font-black">Gain Relative</span>
                        <span className="font-mono text-xs font-bold text-white">{bestWorstTrades.best.pnlPercentage.toFixed(2)}%</span>
                     </div>
                  </div>
               </div>
            ) : (
              <p className="text-center text-gray-600 py-10 uppercase text-[9px] font-black tracking-widest">No Winning Data</p>
            )}
         </div>

         <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Skull className="w-16 h-16 text-rose-500" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
               <Skull className="w-3 h-3 text-rose-400" /> Critical Review
            </h3>
            {bestWorstTrades.worst ? (
               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-3xl font-black font-mono tracking-tighter text-rose-500 leading-none mb-2">{bestWorstTrades.worst.asset}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{bestWorstTrades.worst.type} LOGGED LOSS</p>
                     </div>
                     <p className="text-xl font-bold font-mono text-white">{formatCurrency(bestWorstTrades.worst.pnl)}</p>
                  </div>
                  <div className="pt-4 border-t border-[#27272a]">
                     <span className="text-[9px] text-gray-600 block mb-1 uppercase font-black">Status</span>
                     <span className="font-bold text-[10px] text-rose-400/80 uppercase tracking-widest">Review Journal Documentation</span>
                  </div>
               </div>
            ) : (
              <p className="text-center text-gray-600 py-10 uppercase text-[9px] font-black tracking-widest">No Loss Data Recorded</p>
            )}
         </div>
      </div>

      <div className="bg-[#111111] p-8 rounded-3xl border border-white/5">
         <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
            <Brain className="w-5 h-5 text-amber-500" /> Behavioral & Mistake Frequency
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mistakeAnalysis.length > 0 ? mistakeAnalysis.map(m => (
              <div key={m.name} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">{m.name}</p>
                 <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold">{m.value}</p>
                    <p className="text-[10px] text-gray-600 mb-1">Occurrences</p>
                 </div>
                 <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${(m.value / closedTrades.length) * 100}%` }}></div>
                 </div>
              </div>
            )) : (
              <div className="col-span-full py-10 text-center text-gray-600 italic">No psychological patterns identified yet. Keep journaling!</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Analytics;
