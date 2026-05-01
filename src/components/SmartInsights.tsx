import React, { useState, useEffect } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { GoogleGenAI } from '@google/genai';
import { Brain, Sparkles, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SmartInsights = () => {
  const { trades, journalEntries } = useTrading();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    if (trades.length === 0) return;
    setLoading(true);
    try {
      const closedTrades = trades.filter(t => t.status === 'Closed');
      const dataString = JSON.stringify({
        trades: closedTrades.slice(-20).map(t => ({
          asset: t.asset,
          type: t.type,
          pnl: t.pnl,
          rr: t.riskRewardRatio,
          mistakes: journalEntries.find(j => j.tradeId === t.id)?.mistakes || []
        }))
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this trading data and provide ONE concise, professional insight (max 2 sentences) for the trader. Focus on patterns, risk management, or common mistakes. Data: ${dataString}`
      });
      
      setInsight(response.text || "No insight generated. Maintain discipline.");
    } catch (err) {
      console.error(err);
      setInsight("Unable to generate analysis at this time. Maintain discipline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsight();
  }, [trades.length]);

  if (trades.length < 1) return <p className="text-[10px] text-indigo-200 mt-2 italic font-medium">Insufficient trade data for semantic derivation.</p>;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-[12px] text-indigo-50 leading-relaxed font-semibold italic">
             "{insight || "Initializing analysis protocol..."}"
          </div>
          <button 
            onClick={generateInsight}
            className="text-[9px] font-black text-indigo-200/60 hover:text-white transition-colors uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3" /> Execute Refresh
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SmartInsights;
