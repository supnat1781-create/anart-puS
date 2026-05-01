import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Account, Trade, JournalEntry } from '../types';

interface TradingContextType {
  accounts: Account[];
  trades: Trade[];
  journalEntries: JournalEntry[];
  loading: boolean;
}

const TradingContext = createContext<TradingContextType>({
  accounts: [],
  trades: [],
  journalEntries: [],
  loading: true,
});

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setTrades([]);
      setJournalEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribeAccounts = onSnapshot(qAccounts, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });

    const qTrades = query(collection(db, 'trades'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeTrades = onSnapshot(qTrades, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
    });

    const qJournal = query(collection(db, 'journalEntries'), where('userId', '==', user.uid));
    const unsubscribeJournal = onSnapshot(qJournal, (snapshot) => {
      setJournalEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
      setLoading(false);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeTrades();
      unsubscribeJournal();
    };
  }, [user]);

  return (
    <TradingContext.Provider value={{ accounts, trades, journalEntries, loading }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => useContext(TradingContext);
