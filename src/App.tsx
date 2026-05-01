import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TradingProvider } from './contexts/TradingContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import AddTrade from './pages/AddTrade';
import Analytics from './pages/Analytics';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import { motion, AnimatePresence } from 'motion/react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-blue-500"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-8 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TradingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/trades" element={<Trades />} />
                      <Route path="/add-trade" element={<AddTrade />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TradingProvider>
    </AuthProvider>
  );
}
