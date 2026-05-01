import React, { useState, useMemo } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Tag, 
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
  X,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const Trades = () => {
  const { trades, journalEntries, accounts } = useTrading();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedTrade, setSelectedTrade] = useState<any>(null);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = t.asset.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [trades, search, filterType]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter(t => t.pnl > 0).length;
    const losses = filteredTrades.filter(t => t.pnl < 0).length;
    const total = filteredTrades.length;
    return { wins, losses, total, winRate: total > 0 ? (wins/total)*100 : 0 };
  }, [filteredTrades]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Trade History</h1>
          <p className="text-sm text-gray-500">Execution logs and journaling data.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all w-64 text-sm"
            />
          </div>
          <div className="flex bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
            {['All', 'Buy', 'Sell'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  filterType === type ? "bg-[#27272a] text-indigo-400" : "text-gray-500 hover:text-white"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'text-indigo-400' },
          { label: 'Ratio', value: `${stats.wins}/${stats.losses}`, color: 'text-white' },
          { label: 'Avg Profit', value: formatCurrency(filteredTrades.filter(t => t.pnl > 0).reduce((a,b) => a+b.pnl, 0) / (stats.wins || 1)), color: 'text-green-500' }
        ].map(stat => (
          <div key={stat.label} className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5">
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{stat.label}</p>
             <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#1c1c1f]">
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-gray-500 font-black">Asset</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-gray-500 font-black">Side</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-gray-500 font-black">Execution</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-gray-500 font-black">P&L</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-gray-500 font-black"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredTrades.map((trade) => {
                const account = accounts.find(a => a.id === trade.accountId);
                return (
                  <tr 
                    key={trade.id} 
                    onClick={() => setSelectedTrade(trade)}
                    className="group hover:bg-[#27272a]/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm tracking-tight">{trade.asset}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">{account?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                        trade.type === 'Buy' ? "bg-green-900/10 text-green-500 border-green-500/20" : "bg-rose-900/10 text-rose-500 border-rose-500/20"
                      )}>
                        {trade.type} {trade.lotSize}L
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-gray-300">{trade.entryPrice.toFixed(5)} → {trade.status === 'Closed' ? (trade.exitPrice?.toFixed(5)) : 'OPEN'}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter mt-1">{format(new Date(trade.createdAt), 'MMM dd | HH:mm')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={cn("font-bold text-sm", trade.pnl >= 0 ? "text-green-500" : "text-rose-500")}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all ml-auto" />
                    </td>
                  </tr>
                );
              })}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    <p className="text-lg">No trades found.</p>
                    <p className="text-sm">Log your first trade to see it here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TradeDetailModal 
        trade={selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
        journal={journalEntries.find(j => j.tradeId === selectedTrade?.id)}
      />
    </div>
  );
};

const TradeDetailModal = ({ trade, onClose, journal }: any) => {
  if (!trade) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#18181b] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#27272a] shadow-2xl overflow-y-auto relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#18181b]/80 backdrop-blur-md p-6 border-b border-[#27272a] flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white tracking-tight">{trade.asset} Details</h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                trade.pnl >= 0 ? "bg-green-900/10 text-green-500 border-green-500/20" : "bg-rose-900/10 text-rose-500 border-rose-500/20"
              )}>
                {trade.pnl >= 0 ? 'WIN' : 'LOSS'}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#09090b] rounded-full transition-colors border border-transparent hover:border-[#27272a]">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
               <section>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Execution Summary</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Entry Price</p>
                      <p className="text-lg font-black font-mono text-white tracking-tighter">{trade.entryPrice.toFixed(5)}</p>
                    </div>
                    <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Exit Price</p>
                      <p className="text-lg font-black font-mono text-white tracking-tighter">{trade.exitPrice?.toFixed(5) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Stop Loss</p>
                      <p className="text-sm font-bold font-mono text-rose-500/80">{trade.stopLoss || 'No SL'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Take Profit</p>
                      <p className="text-sm font-bold font-mono text-green-500/80">{trade.takeProfit || 'No TP'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Risk/Reward</p>
                      <p className="text-sm font-black font-mono text-white tracking-widest">{trade.riskRewardRatio.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Lot Size</p>
                      <p className="text-sm font-black font-mono text-indigo-400">{trade.lotSize} Lots</p>
                    </div>
                  </div>
               </section>

               <section>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Journal Entry</h3>
                  {journal ? (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-600 mb-2 font-black uppercase tracking-widest">Emotion</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-xl text-xs font-bold text-white capitalize">
                             {journal.emotion}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-600 mb-2 font-black uppercase tracking-widest">Strategy</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-widest">
                            {journal.strategy || 'Unspecified'}
                          </div>
                        </div>
                      </div>
                      {journal.mistakes?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-600 mb-2 font-black uppercase tracking-widest">Mistake Audit</p>
                          <div className="flex flex-wrap gap-2">
                             {journal.mistakes.map((m: string) => (
                                <span key={m} className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                   {m}
                                </span>
                             ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-gray-600 mb-2 font-black uppercase tracking-widest">Rationalization</p>
                        <p className="text-sm text-gray-400 bg-[#09090b] p-4 rounded-xl leading-relaxed italic border border-[#27272a]">
                           "{journal.notes || 'No rationalization documented.'}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic bg-[#09090b] p-4 rounded-xl border border-[#27272a]">Null Entry Documented</p>
                  )}
               </section>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Visual Documentation</h3>
               {journal?.imageUrl ? (
                  <div className="rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b] group relative cursor-zoom-in">
                    <img src={journal.imageUrl} alt="Chart Screenshot" className="w-full object-contain grayscale hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <ExternalLink className="w-8 h-8 text-white shadow-2xl" />
                    </div>
                  </div>
               ) : (
                 <div className="aspect-video bg-[#09090b] rounded-xl flex flex-col items-center justify-center text-gray-700 border border-[#27272a] border-dashed">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Screenshot Evidence</p>
                 </div>
               )}

               <div className="p-6 bg-[#09090b] border border-[#27272a] rounded-xl">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Meta Timing</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-600 font-black uppercase tracking-widest font-sans">Open</span>
                        <span className="text-gray-400 font-mono">{format(new Date(trade.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                     </div>
                     {trade.exitTime && (
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-600 font-black uppercase tracking-widest font-sans">Close</span>
                          <span className="text-gray-400 font-mono">{format(new Date(trade.exitTime), 'yyyy-MM-dd HH:mm:ss')}</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Trades;

// Helper icons that were used
const TrendingUp = ({ className }: { className?: string }) => <TrendingUpIcon className={className} />;
import { TrendingUp as TrendingUpIcon, Activity as BarChart2, Image as ImageIcon } from 'lucide-react';
