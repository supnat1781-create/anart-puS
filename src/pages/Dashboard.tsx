import React, { useMemo } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Lock,
  History,
  LayoutGrid
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import SmartInsights from '../components/SmartInsights';

const Dashboard = () => {
  const { accounts, trades, loading } = useTrading();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const closedTrades = trades.filter(t => t.status === 'Closed');
    
    const winRate = closedTrades.length > 0 
      ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length) * 100 
      : 0;

    const totalPnL = closedTrades.reduce((acc, curr) => acc + curr.pnl, 0);
    
    const avgWin = closedTrades.filter(t => t.pnl > 0).reduce((acc, curr) => acc + curr.pnl, 0) / (closedTrades.filter(t => t.pnl > 0).length || 1);
    const avgLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((acc, curr) => acc + curr.pnl, 0) / (closedTrades.filter(t => t.pnl < 0).length || 1));
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return { totalBalance, winRate, totalPnL, rrRatio, totalTrades: closedTrades.length };
  }, [accounts, trades]);

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];
    let currentBalance = accounts.reduce((acc, curr) => acc + curr.initialBalance, 0);
    const sortedTrades = [...trades]
      .filter(t => t.status === 'Closed')
      .sort((a, b) => new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime());

    return sortedTrades.map(trade => {
      currentBalance += trade.pnl;
      return {
        date: format(new Date(trade.exitTime!), 'MMM d'),
        equity: currentBalance
      };
    });
  }, [trades, accounts]);

  if (accounts.length === 0 && !loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
         <div className="relative">
           <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse"></div>
           <div className="relative bg-[#18181b] p-8 rounded-full border border-[#27272a] shadow-2xl">
             <Globe className="w-16 h-16 text-indigo-400" />
           </div>
         </div>
         <div className="space-y-2">
           <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Nexus<span className="text-indigo-400">Hub</span> Null</h2>
           <p className="text-gray-500 max-w-md mx-auto text-sm font-medium">No active capital nodes detected. Initialize your first portfolio hub to begin document extraction.</p>
         </div>
         <button 
           onClick={() => navigate('/portfolio')}
           className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/10 active:scale-95"
         >
           Initialize Portfolio
         </button>
       </div>
     );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[#27272a]/50">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-widest uppercase italic">System<span className="text-indigo-400">Overview</span></h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Global Aggregate</span>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20">
              {formatCurrency(metrics.totalBalance)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Protocol Status</span>
              <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                Nominal
              </div>
           </div>
           <button 
             onClick={() => navigate('/add-trade')}
             className="bg-[#18181b] border border-[#27272a] hover:border-indigo-500/50 text-white p-3 rounded-xl transition-all group"
           >
             <Zap className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
           </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Equity Curve (Large) */}
        <div className="md:col-span-3 row-span-2 bg-[#18181b] border border-[#27272a] rounded-2xl p-7 relative overflow-hidden group shadow-sm">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-32 h-32 text-indigo-400" />
           </div>
           
           <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                 <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Portfolio Equilibrium</h3>
                 <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Cumulative Equity Dynamics</p>
              </div>
              <div className="flex gap-2">
                 <span className="px-2 py-1 bg-[#09090b] text-[9px] font-black text-gray-500 rounded border border-[#27272a]">30D</span>
                 <span className="px-2 py-1 bg-indigo-500/10 text-[9px] font-black text-indigo-400 rounded border border-indigo-500/20">MAX</span>
              </div>
           </div>

           <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    labelStyle={{ color: '#4b5563', marginBottom: '4px', textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#818cf8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between group">
           <div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Execution Edge</h3>
              <p className="text-3xl font-black font-mono tracking-tighter text-white">
                {formatNumber(metrics.winRate, 1)}<span className="text-gray-700">%</span>
              </p>
           </div>
           <div className="mt-4 pt-4 border-t border-[#27272a] flex items-center justify-between text-[10px] font-black uppercase text-gray-600">
              <span>Win/Loss Internal</span>
              <span className={cn(metrics.winRate > 50 ? "text-green-500" : "text-rose-500")}>
                {metrics.winRate > 50 ? 'Positive Bias' : 'Correction Req'}
              </span>
           </div>
        </div>

        {/* Card 3: Avg R/R */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between">
           <div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Efficiency Factor</h3>
              <p className="text-3xl font-black font-mono tracking-tighter text-white">
                {formatNumber(metrics.rrRatio, 1)}<span className="text-gray-700 text-xl font-sans tracking-widest uppercase ml-1">RR</span>
              </p>
           </div>
           <div className="mt-4 pt-4 border-t border-[#27272a] flex items-center justify-between text-[10px] font-black uppercase text-gray-600">
              <span>Risk Topology</span>
              <span className="text-indigo-400">Optimization Active</span>
           </div>
        </div>

        {/* Card 4: Recent History (col-span-2) */}
        <div className="md:col-span-2 bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sequential Ledger</h3>
              <History className="w-4 h-4 text-gray-700" />
           </div>
           <div className="space-y-3">
              {trades.slice(0, 4).map((trade) => (
                 <div key={trade.id} className="flex items-center justify-between p-3 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                       <div className={cn("p-1.5 rounded-lg border", trade.pnl >= 0 ? "bg-green-900/10 text-green-500 border-green-500/20" : "bg-rose-900/10 text-rose-500 border-rose-500/20")}>
                          <Zap className="w-3 h-3" />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tighter">{trade.asset}</p>
                          <p className="text-[9px] text-gray-600 font-black uppercase">{trade.type} • {trade.lotSize}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={cn("text-[11px] font-black font-mono tracking-tighter", trade.pnl >= 0 ? "text-green-500" : "text-rose-500")}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                       </p>
                       <p className="text-[9px] text-gray-600 font-black uppercase">{format(new Date(trade.createdAt), 'HH:mm')}</p>
                    </div>
                 </div>
              ))}
              {trades.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[#27272a] rounded-xl">
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">No Sequences Recorded</p>
                </div>
              )}
           </div>
        </div>

        {/* Card 5: Portfolio Mix */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden group">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural Mapping</h3>
              <Activity className="w-4 h-4 text-gray-700" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                 <span>Total Scans</span>
                 <span className="text-white font-mono">{metrics.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                 <span>Net Delta</span>
                 <span className={cn("font-mono", metrics.totalPnL >= 0 ? "text-green-500" : "text-rose-500")}>
                    {metrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(metrics.totalPnL)}
                 </span>
              </div>
           </div>
           <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-700">
              <LayoutGrid className="w-24 h-24 text-gray-400" />
           </div>
        </div>

        {/* Card 6: AI Insights */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-indigo-600/10">
           <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Zap className="w-12 h-12 text-white" />
           </div>
           <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock className="w-3 h-3 text-indigo-200" /> AI Semantic Analysis
           </h3>
           <div className="relative z-10">
              <SmartInsights />
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
