import React, { useState } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, 
  Image as ImageIcon, 
  X, 
  Save, 
  AlertCircle,
  HelpCircle,
  Smile,
  Meh,
  Frown,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const emotions = [
  { id: 'confident', label: 'Confident', icon: Smile, color: 'text-emerald-500' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-400' },
  { id: 'fearful', label: 'Fearful', icon: Frown, color: 'text-rose-500' },
  { id: 'fomo', label: 'FOMO', icon: Zap, color: 'text-amber-500' },
];

const strategies = ['Scalping', 'Swing', 'Day Trading', 'Position Trading', 'Trend Following', 'Mean Reversion'];
const mistakeTags = ['Overtrading', 'Early Exit', 'Late Entry', 'Poor RR', 'Emotional', 'No SL', 'Revenge Trading'];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const AddTrade = () => {
  const { user } = useAuth();
  const { accounts } = useTrading();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [accountId, setAccountId] = useState('');
  const [asset, setAsset] = useState('');
  const [type, setType] = useState<'Buy' | 'Sell'>('Buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [lotSize, setLotSize] = useState('0.01');
  const [status, setStatus] = useState<'Open' | 'Closed'>('Closed');
  
  // Journal State
  const [notes, setNotes] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId || !asset || !entryPrice) {
      setError('Please fill in all required fields (Account, Asset, Entry Price).');
      return;
    }

    if (status === 'Closed' && !exitPrice) {
      setError('Please provide an Exit Price for closed trades.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ePrice = parseFloat(entryPrice);
      const exPrice = status === 'Closed' ? parseFloat(exitPrice) : 0;
      const stopL = parseFloat(stopLoss) || 0;
      const takeP = parseFloat(takeProfit) || 0;
      const lots = parseFloat(lotSize) || 0.01;

      if (isNaN(ePrice) || isNaN(exPrice) || isNaN(stopL) || isNaN(takeP) || isNaN(lots)) {
        throw new Error('Please enter valid numeric values for prices and lots.');
      }
      
      // Basic PnL Calculation
      const diff = type === 'Buy' ? (exPrice - ePrice) : (ePrice - exPrice);
      const pnl = status === 'Closed' ? diff * lots * 1000 : 0; 
      const pnlPercentage = status === 'Closed' ? (diff / ePrice) * 100 : 0;

      const slDist = Math.abs(ePrice - stopL);
      const tpDist = Math.abs(ePrice - takeP);
      const rrRatio = tpDist > 0 && slDist > 0 ? tpDist / slDist : 0;

      // Check image size (Firestore limit is 1MB total doc size)
      if (image && image.length > 800000) { // Approx 800KB limit for base64 to be safe
         throw new Error('Screenshot is too large. Please use a smaller image (under 500KB recommended).');
      }

      // 1. Create Trade
      let tradeRef;
      try {
        tradeRef = await addDoc(collection(db, 'trades'), {
          userId: user.uid,
          accountId,
          asset: asset.toUpperCase().trim(),
          type,
          entryPrice: ePrice,
          exitPrice: exPrice,
          stopLoss: stopL,
          takeProfit: takeP,
          lotSize: lots,
          status,
          pnl: pnl || 0,
          pnlPercentage: pnlPercentage || 0,
          riskRewardRatio: rrRatio || 0,
          entryTime: new Date().toISOString(),
          exitTime: status === 'Closed' ? new Date().toISOString() : null,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'trades', { currentUser: user });
      }

      // 2. Create Journal Entry
      try {
        await addDoc(collection(db, 'journalEntries'), {
          tradeId: tradeRef!.id,
          userId: user.uid,
          notes: notes.trim(),
          emotion,
          mistakes: selectedMistakes,
          strategy: selectedStrategy || 'Unspecified',
          imageUrl: image,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'journalEntries', { currentUser: user });
      }

      // 3. Update Account Balance
      if (status === 'Closed' && pnl !== 0) {
        try {
          const accountRef = doc(db, 'accounts', accountId);
          await updateDoc(accountRef, {
            balance: increment(pnl)
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, { currentUser: user });
        }
      }

      navigate('/trades');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.startsWith('{')) {
        const errorData = JSON.parse(err.message);
        setError(`System Error: ${errorData.error}. Check your internet connection or account permissions.`);
      } else {
        setError(err.message || 'Failed to save trade record. Please check all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMistake = (tag: string) => {
    setSelectedMistakes(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Log New Execution</h1>
        <p className="text-sm text-gray-500">Record your execution and document your reasoning for the ledger.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Execution Details */}
          <section className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Zap className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="text-[10px] font-black font-sans uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 relative z-10">
              <Info className="w-3 h-3 text-indigo-400" /> Execution Parameters
            </h2>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Target Account</label>
                <select 
                  value={accountId} 
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm"
                >
                  <option value="">Select Internal Hub</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} • {acc.platform}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Asset Node</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BTC/USD"
                    value={asset}
                    onChange={e => setAsset(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Command Type</label>
                  <div className="flex bg-[#09090b] rounded-xl p-1 border border-[#27272a]">
                    <button 
                      type="button"
                      onClick={() => setType('Buy')}
                      className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", type === 'Buy' ? "bg-green-900/20 text-green-500 shadow-sm border border-green-500/20" : "text-gray-600")}
                    >Buy</button>
                    <button 
                      type="button"
                      onClick={() => setType('Sell')}
                      className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", type === 'Sell' ? "bg-rose-900/20 text-rose-500 shadow-sm border border-rose-500/20" : "text-gray-600")}
                    >Sell</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Entry Vector</label>
                  <input 
                    type="number" step="any"
                    value={entryPrice}
                    onChange={e => setEntryPrice(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Volume (Lots)</label>
                  <input 
                    type="number" step="0.01"
                    value={lotSize}
                    onChange={e => setLotSize(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Stop Loss</label>
                  <input 
                    type="number" step="any"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-rose-500/50 outline-none transition-colors text-white text-sm font-mono text-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Take Profit</label>
                  <input 
                    type="number" step="any"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-green-500/50 outline-none transition-colors text-white text-sm font-mono text-green-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Execution State</label>
                <div className="flex bg-[#09090b] rounded-xl p-1 border border-[#27272a]">
                  <button 
                    type="button"
                    onClick={() => setStatus('Open')}
                    className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", status === 'Open' ? "bg-amber-900/20 text-amber-500 border border-amber-500/20" : "text-gray-600")}
                  >Active</button>
                  <button 
                    type="button"
                    onClick={() => setStatus('Closed')}
                    className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", status === 'Closed' ? "bg-indigo-900/20 text-indigo-400 border border-indigo-500/20" : "text-gray-600")}
                  >Closed</button>
                </div>
              </div>

              {status === 'Closed' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Exit Vector</label>
                  <input 
                    type="number" step="any"
                    value={exitPrice}
                    onChange={e => setExitPrice(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm font-mono"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Journal & Reasoning */}
          <section className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-6 flex flex-col">
            <h2 className="text-[10px] font-black font-sans uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
              <HelpCircle className="w-3 h-3 text-emerald-400" /> Psychological Reasoning
            </h2>

            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Internal State Emotion</label>
                <div className="grid grid-cols-4 gap-2">
                  {emotions.map(emo => (
                    <button
                      key={emo.id}
                      type="button"
                      onClick={() => setEmotion(emo.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        emotion === emo.id ? "bg-[#09090b] border-indigo-500/30 text-indigo-400" : "bg-transparent border-[#27272a] opacity-30 blur-[0.3px] grayscale"
                      )}
                    >
                      <emo.icon className={cn("w-5 h-5", emotion === emo.id ? emo.color : "text-gray-500")} />
                      <span className="text-[9px] font-black uppercase tracking-tighter">{emo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Selected Strategy</label>
                <select 
                  value={selectedStrategy}
                  onChange={e => setSelectedStrategy(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-white text-sm"
                >
                  <option value="">Baseline Strategy</option>
                  {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Behavioral Anomalies</label>
                <div className="flex flex-wrap gap-2">
                  {mistakeTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleMistake(tag)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                        selectedMistakes.includes(tag) 
                          ? "bg-rose-900/10 border-rose-500/30 text-rose-500" 
                          : "bg-[#09090b] border-[#27272a] text-gray-600"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Post-Execution Documentation</label>
                <textarea 
                  rows={4}
                  placeholder="Higher timeframe confluence? Key level rejection? Emotional triggers?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors text-xs text-white resize-none font-mono tracking-tight leading-relaxed"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Image Attachment */}
        <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
           <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Evidence Documentation (Screenshot)</label>
           <div {...getRootProps()} className={cn(
             "h-40 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
             isDragActive ? "border-indigo-500 bg-indigo-500/5 shadow-2xl" : "border-[#27272a] hover:border-indigo-500/50 bg-[#09090b]"
           )}>
             <input {...getInputProps()} />
             {image ? (
               <div className="relative group w-full h-full p-2">
                 <img src={image} alt="Chart" className="w-full h-full object-cover rounded-lg grayscale hover:grayscale-0 transition-all duration-500" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setImage(null); }}
                     className="bg-rose-600/20 text-rose-500 border border-rose-500/20 p-2 rounded-full hover:bg-rose-600 hover:text-white transition-all"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 <ImageIcon className="w-6 h-6 text-gray-700 mb-2" />
                 <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Relocate files or <span className="text-indigo-400">Scan Directory</span></p>
               </>
             )}
           </div>
        </div>

        {error && (
          <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            Commit to Ledger
          </button>
          <button
            type="button"
            onClick={() => navigate('/trades')}
            className="px-8 bg-[#18181b] border border-[#27272a] text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#09090b] transition-all"
          >
            Abort
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
