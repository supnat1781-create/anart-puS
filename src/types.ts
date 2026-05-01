import { User } from 'firebase/auth';

export interface Account {
  id: string;
  userId: string;
  name: string;
  platform: string;
  currency: string;
  balance: number;
  initialBalance: number;
  createdAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  asset: string;
  type: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  pnl: number;
  pnlPercentage: number;
  riskRewardRatio: number;
  status: 'Open' | 'Closed';
  entryTime: string;
  exitTime?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  tradeId: string;
  userId: string;
  notes: string;
  emotion: string;
  mistakes: string[];
  strategy: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  date: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export type Page = 'dashboard' | 'trades' | 'add-trade' | 'analytics' | 'portfolio';
