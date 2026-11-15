import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BookMarked, 
  PieChart, 
  Bell, 
  Settings, 
  Info,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

export function PeopleFirst() {
  const chartData = [
    { name: "Jan", credit: 45000, debit: 32000 },
    { name: "Feb", credit: 52000, debit: 38000 },
    { name: "Mar", credit: 61000, debit: 41000 },
    { name: "Apr", credit: 58000, debit: 45000 },
    { name: "May", credit: 72000, debit: 48000 },
    { name: "Jun", credit: 68000, debit: 52000 },
    { name: "Jul", credit: 85000, debit: 55000 },
    { name: "Aug", credit: 82000, debit: 59000 },
    { name: "Sep", credit: 91000, debit: 62000 },
    { name: "Oct", credit: 95000, debit: 65000 },
    { name: "Nov", credit: 88000, debit: 61000 },
    { name: "Dec", credit: 104500, debit: 68700 },
  ];

  const recentTransactions = [
    { name: "Priya Sharma", type: "credit", amount: 12500, date: "Today", initial: "PS", color: "bg-pink-200 text-pink-700" },
    { name: "Rahul Verma", type: "debit", amount: 4200, date: "Today", initial: "RV", color: "bg-blue-200 text-blue-700" },
    { name: "Amit Patel", type: "credit", amount: 8900, date: "Yesterday", initial: "AP", color: "bg-green-200 text-green-700" },
    { name: "Neha Gupta", type: "debit", amount: 1500, date: "Yesterday", initial: "NG", color: "bg-purple-200 text-purple-700" },
    { name: "Suresh Kumar", type: "credit", amount: 21000, date: "2 days ago", initial: "SK", color: "bg-orange-200 text-orange-700" },
    { name: "Kavita Desai", type: "credit", amount: 5400, date: "3 days ago", initial: "KD", color: "bg-teal-200 text-teal-700" },
    { name: "Vikram Singh", type: "debit", amount: 3200, date: "4 days ago", initial: "VS", color: "bg-yellow-200 text-yellow-700" },
    { name: "Anjali Rao", type: "credit", amount: 11200, date: "5 days ago", initial: "AR", color: "bg-indigo-200 text-indigo-700" },
  ];

  const overdueFriends = [
    { name: "Rahul V.", initial: "RV", color: "bg-blue-200 text-blue-700" },
    { name: "Neha G.", initial: "NG", color: "bg-purple-200 text-purple-700" },
    { name: "Vikram S.", initial: "VS", color: "bg-yellow-200 text-yellow-700" },
    { name: "Anita K.", initial: "AK", color: "bg-red-200 text-red-700" },
  ];

  return (
    <div className="min-h-screen p-4 flex gap-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 relative overflow-hidden bg-slate-50">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .mesh-bg {
          background-color: #fcf5ee;
          background-image: 
            radial-gradient(at 13% 13%, hsla(28, 86%, 88%, 1) 0px, transparent 50%),
            radial-gradient(at 85% 12%, hsla(263, 67%, 92%, 1) 0px, transparent 50%),
            radial-gradient(at 88% 79%, hsla(164, 57%, 89%, 1) 0px, transparent 50%),
            radial-gradient(at 18% 85%, hsla(335, 68%, 91%, 1) 0px, transparent 50%);
          background-size: cover;
          background-attachment: fixed;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        .glass-pill {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
      `}} />

      {/* Mesh Background */}
      <div className="absolute inset-0 mesh-bg z-0 pointer-events-none"></div>

      {/* Navigation Sidebar */}
      <nav className="glass-card rounded-[2rem] w-64 flex-shrink-0 flex flex-col p-6 z-10 relative">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-300 to-rose-300 flex items-center justify-center text-white shadow-sm font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-800">Sharma & Sons</h1>
            <p className="text-xs text-slate-500 font-medium">Trading Co.</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<BookOpen size={18} />} label="Entry Book" />
          <NavItem icon={<Users size={18} />} label="Customers" />
          <NavItem icon={<ArrowLeftRight size={18} />} label="Transactions" />
          <NavItem icon={<BookMarked size={18} />} label="Ledger" />
          <NavItem icon={<PieChart size={18} />} label="Reports" />
          
          <div className="mt-8 mb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Connect</div>
          
          <div className="relative">
            <NavItem icon={<Bell size={18} />} label="Reminders" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-rose-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">4</span>
          </div>
        </div>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/40">
          <NavItem icon={<Settings size={18} />} label="Settings" />
          <NavItem icon={<Info size={18} />} label="About" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 h-[calc(100vh-2rem)] overflow-hidden">
        {/* Header Area */}
        <header className="flex justify-between items-end mb-8 px-2">
          <div>
            <h2 className="text-lg font-medium text-slate-500 mb-1">Welcome back, Rohan 👋</h2>
            <div className="text-[3.5rem] font-extrabold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-500 drop-shadow-sm">
              ₹2,45,800
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
              <span className="glass-pill px-3 py-1 rounded-full flex items-center gap-1.5 text-emerald-600">
                <ArrowUpRight size={14} /> ₹8,42,500 owed to you
              </span>
              <span className="glass-pill px-3 py-1 rounded-full flex items-center gap-1.5 text-rose-500">
                <ArrowDownLeft size={14} /> ₹5,96,700 you owe
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">47</div>
              </div>
              <span className="text-sm font-semibold">Active friends</span>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-slate-800/20 transition-all flex items-center gap-2">
              <span className="text-xl leading-none mb-0.5">+</span> New Entry
            </button>
          </div>
        </header>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-8 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            
            {/* Friendly Alert */}
            <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h3 className="text-2xl font-bold mb-1">You're owed ₹84,200</h3>
                  <p className="text-slate-600 font-medium text-sm">From 6 friends · 4 are ready for a gentle nudge</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2 mr-2">
                    {overdueFriends.map((f, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center text-sm font-bold shadow-sm ${f.color}`}>
                        {f.initial}
                      </div>
                    ))}
                  </div>
                  <button className="glass-pill px-5 py-2.5 rounded-xl font-bold text-rose-600 shadow-sm hover:bg-white/80 transition-all text-sm">
                    Send reminders
                  </button>
                </div>
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="glass-card rounded-[2rem] p-6 flex-1 min-h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">Your year at a glance</h3>
                  <p className="text-sm text-slate-500 font-medium">Money flowing in vs out</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div> Money In
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div> Money Out
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                      cursor={{ stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="credit" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#colorCredit)" />
                    <Area type="monotone" dataKey="debit" stroke="#fb7185" strokeWidth={4} fillOpacity={1} fill="url(#colorDebit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* Right Column - Feed */}
          <div className="w-96 glass-card rounded-[2rem] p-6 flex flex-col h-full overflow-hidden">
            <h3 className="text-lg font-bold mb-1">Who you saw recently</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Latest 8 interactions</p>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {recentTransactions.map((tx, idx) => (
                <div key={idx} className="group p-3 -mx-3 rounded-2xl hover:bg-white/40 transition-all flex items-center justify-between cursor-pointer border border-transparent hover:border-white/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${tx.color}`}>
                      {tx.initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{tx.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1 mt-0.5">
                      {tx.type === 'credit' ? 'Received' : 'Given'}
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -mr-3" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-3 text-sm font-bold text-slate-600 bg-white/40 hover:bg-white/60 rounded-xl transition-colors">
              View all interactions
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${
      active 
        ? 'bg-white shadow-sm text-slate-800' 
        : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
    }`}>
      {icon}
      {label}
    </button>
  );
}
