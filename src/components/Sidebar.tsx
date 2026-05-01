import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  PlusCircle, 
  PieChart, 
  Wallet, 
  LogOut,
  TrendingUp
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BarChart2, label: 'Trades', path: '/trades' },
    { icon: PlusCircle, label: 'Add Trade', path: '/add-trade' },
    { icon: PieChart, label: 'Analytics', path: '/analytics' },
    { icon: Wallet, label: 'Portfolio', path: '/portfolio' },
  ];

  return (
    <aside className="w-20 lg:w-[72px] border-r border-[#27272a] bg-[#09090b] flex flex-col items-center py-6 gap-8 h-screen sticky top-0 shrink-0">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/20">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>

      <nav className="flex flex-col gap-6 flex-1 px-4 py-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative",
              isActive 
                ? "bg-[#27272a] text-indigo-400" 
                : "text-gray-500 hover:text-white hover:bg-[#27272a]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <div className="absolute left-full ml-4 px-2 py-1 bg-[#18181b] border border-[#27272a] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
              {item.label}
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pb-4">
        <button
          onClick={() => auth.signOut()}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all group relative"
        >
          <LogOut className="w-5 h-5" />
          <div className="absolute left-full ml-4 px-2 py-1 bg-[#18181b] border border-[#27272a] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Logout
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
