import React, { useState } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const Portfolio = () => {
  const { user } = useAuth();
  const { accounts, loading } = useTrading();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New account form state
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !initialBalance) {
      setError('Please provide a name and initial balance.');
      return;
    }

    setError(null);
    try {
      const balanceNum = parseFloat(initialBalance);
      if (isNaN(balanceNum)) throw new Error('Balance must be a valid number.');

      await addDoc(collection(db, 'accounts'), {
        userId: user.uid,
        name: name.trim(),
        platform: platform.trim(),
        initialBalance: balanceNum,
        balance: balanceNum,
        currency,
        createdAt: new Date().toISOString()
      });
      
      setShowAddAccount(false);
      setName('');
      setPlatform('');
      setInitialBalance('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize account. Check your connection.');
    }
  };

  const deleteAccount = async (id: string) => {
    if (confirm('Are you sure? This will delete all trade history associated with this ID (manual cleanup required).')) {
      await deleteDoc(doc(db, 'accounts', id));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Portfolio Management</h1>
          <p className="text-sm text-gray-500">Manage your trading accounts and capital allocation.</p>
        </div>
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </header>

      {showAddAccount && (
        <div className="bg-[#18181b] p-8 rounded-2xl border border-indigo-500/20 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 className="w-24 h-24 text-indigo-400" />
           </div>
           <h3 className="text-lg font-bold mb-6 text-white">New Trading Hub</h3>
           <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Account Name</label>
                 <input 
                   type="text" 
                   placeholder="e.g. XM Global" 
                   value={name}
                   onChange={e => setName(e.target.value)}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm text-white"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Platform / Broker</label>
                 <input 
                   type="text" 
                   placeholder="e.g. MT5" 
                   value={platform}
                   onChange={e => setPlatform(e.target.value)}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm text-white"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Initial Capital</label>
                 <input 
                   type="number" 
                   placeholder="1000.00" 
                   value={initialBalance}
                   onChange={e => setInitialBalance(e.target.value)}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm text-white font-mono"
                 />
              </div>
              <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 transition-all">Setup Account</button>
                 <button type="button" onClick={() => setShowAddAccount(false)} className="px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl text-gray-500 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
              </div>
              {error && (
                <div className="md:col-span-4 mt-4 p-4 bg-rose-900/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] hover:border-indigo-500/20 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 bg-indigo-500/5 w-24 h-24 rounded-full blur-2xl transition-colors"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl group-hover:text-indigo-400 transition-all shadow-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <button 
                onClick={() => deleteAccount(account.id)}
                className="p-2 text-gray-700 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold tracking-tight text-white mb-1">{account.name}</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-[#27272a] pb-4 mb-4">{account.platform}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Current Capital</p>
                      <p className="text-3xl font-black font-mono tracking-tighter text-white">{formatCurrency(account.balance, account.currency)}</p>
                   </div>
                   <div className={cn(
                     "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                     account.balance >= account.initialBalance ? "bg-green-900/10 text-green-500 border-green-500/20" : "bg-rose-900/10 text-rose-500 border-rose-500/20"
                   )}>
                     {account.balance >= account.initialBalance ? '+' : ''}{((account.balance - account.initialBalance) / account.initialBalance * 100).toFixed(2)}%
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl">
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Initial</p>
                      <p className="font-bold text-sm text-gray-500 font-mono">{formatCurrency(account.initialBalance, account.currency)}</p>
                   </div>
                   <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl">
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Delta</p>
                      <p className={cn("font-bold text-sm font-mono", account.balance >= account.initialBalance ? "text-green-500" : "text-rose-500")}>
                        {account.balance >= account.initialBalance ? '+' : ''}{formatCurrency(account.balance - account.initialBalance, account.currency)}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {accounts.length === 0 && !loading && (
          <div className="col-span-full border-2 border-dashed border-[#27272a] rounded-2xl p-20 text-center space-y-6">
             <div className="inline-flex p-6 bg-[#18181b] rounded-full border border-[#27272a]">
                <Wallet className="w-10 h-10 text-gray-700" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">No Accounts Found</h2>
               <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">Infrastructure is ready. Connect your first trading hub to start tracking performance metrics.</p>
             </div>
             <button
               onClick={() => setShowAddAccount(true)}
               className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
             >
                Connect Now
             </button>
          </div>
        )}
      </div>

      <section className="bg-[#18181b] p-8 rounded-2xl border border-[#27272a]">
         <div className="flex items-center gap-3 mb-8">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">System Deposits</h2>
         </div>
         <div className="space-y-3 opacity-30 pointer-events-none grayscale">
            {[1,2].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#09090b] border border-[#27272a] rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                       <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="font-bold text-sm text-white">Genesis Deposit</p>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Internal Ledger • System Node</p>
                    </div>
                 </div>
                 <p className="font-bold font-mono text-green-500">+$10,000.00</p>
              </div>
            ))}
            <div className="text-center py-4">
              <span className="text-[9px] text-[#27272a] font-black uppercase tracking-[0.2em] italic">End of Log</span>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Portfolio;
