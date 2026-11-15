import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BookOpen, 
  Clock, 
  Command,
  FileText, 
  LayoutDashboard, 
  RefreshCw, 
  Search, 
  Settings, 
  TerminalSquare, 
  Users, 
  Wallet,
  Wifi,
  Info,
  Bell
} from 'lucide-react';

export function TraderTerminal() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const recentTransactions = [
    { id: 'TX-8921', name: 'Rajesh Kumar', type: 'credit', amount: 45000, date: 'Today, 14:32', status: 'SETTLED' },
    { id: 'TX-8920', name: 'Mehta Distributors', type: 'debit', amount: 12500, date: 'Today, 11:15', status: 'PENDING' },
    { id: 'TX-8919', name: 'Singh Electronics', type: 'credit', amount: 8900, date: 'Yesterday, 16:45', status: 'SETTLED' },
    { id: 'TX-8918', name: 'Anita Desai', type: 'debit', amount: 3200, date: 'Yesterday, 09:30', status: 'SETTLED' },
    { id: 'TX-8917', name: 'Gupta Enterprises', type: 'credit', amount: 150000, date: '12 Oct, 14:20', status: 'SETTLED' },
    { id: 'TX-8916', name: 'Verma Brothers', type: 'debit', amount: 4500, date: '11 Oct, 10:10', status: 'SETTLED' },
    { id: 'TX-8915', name: 'Choudhary Mills', type: 'credit', amount: 28400, date: '10 Oct, 15:55', status: 'SETTLED' },
    { id: 'TX-8914', name: 'Balaji Stores', type: 'debit', amount: 11200, date: '09 Oct, 08:40', status: 'PENDING' },
  ];

  const monthlyData = [
    { month: 'NOV', credit: 65, debit: 45 },
    { month: 'DEC', credit: 58, debit: 50 },
    { month: 'JAN', credit: 72, debit: 60 },
    { month: 'FEB', credit: 85, debit: 65 },
    { month: 'MAR', credit: 90, debit: 75 },
    { month: 'APR', credit: 82, debit: 68 },
    { month: 'MAY', credit: 95, debit: 80 },
    { month: 'JUN', credit: 110, debit: 85 },
    { month: 'JUL', credit: 105, debit: 90 },
    { month: 'AUG', credit: 115, debit: 95 },
    { month: 'SEP', credit: 125, debit: 100 },
    { month: 'OCT', credit: 140, debit: 110 },
  ];

  const topCustomers = [
    { rank: 1, name: 'Gupta Enterprises', balance: 150000, status: 'cr' },
    { rank: 2, name: 'Mehta Distributors', balance: -85000, status: 'dr' },
    { rank: 3, name: 'Rajesh Kumar', balance: 45000, status: 'cr' },
    { rank: 4, name: 'Balaji Stores', balance: -32000, status: 'dr' },
    { rank: 5, name: 'Singh Electronics', balance: 28000, status: 'cr' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#8a8a8a] font-mono selection:bg-[#00ff00] selection:text-black overflow-hidden flex flex-col h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap');
        
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        .terminal-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .terminal-scroll::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-left: 1px solid #1f1f1f;
        }
        .terminal-scroll::-webkit-scrollbar-thumb {
          background: #333;
        }
        .terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .crt-line::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        
        .flicker {
          animation: flicker 0.15s infinite;
        }
        
        @keyframes flicker {
          0% { opacity: 0.98; }
          50% { opacity: 1; }
          100% { opacity: 0.98; }
        }
      `}</style>

      {/* Top Header / Menu Bar */}
      <header className="flex-none h-8 bg-[#111] border-b border-[#333] flex items-center justify-between px-3 text-xs select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold tracking-wider">
            <TerminalSquare size={14} className="text-[#00ff00]" />
            LEDGER_PRO // TERMINAL
          </div>
          <div className="flex space-x-1 text-[10px]">
            <button className="px-2 py-0.5 hover:bg-[#222] text-[#ccc]">File</button>
            <button className="px-2 py-0.5 hover:bg-[#222] text-[#ccc]">Edit</button>
            <button className="px-2 py-0.5 hover:bg-[#222] text-[#ccc]">View</button>
            <button className="px-2 py-0.5 hover:bg-[#222] text-[#ccc]">Tools</button>
            <button className="px-2 py-0.5 hover:bg-[#222] text-[#ccc]">Help</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-[#555]">v3.14.2</span>
          <div className="flex items-center gap-1.5 text-[#00ff00]">
            <Wifi size={12} />
            SYNCED
          </div>
          <span className="text-[#ccc] w-[60px] text-right tabular-nums">{time}</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-56 flex-none bg-[#0d0d0d] border-r border-[#222] flex flex-col p-2 text-xs">
          <div className="p-3 mb-4 border border-[#333] bg-[#111]">
            <h1 className="text-[#fff] font-bold text-sm tracking-tight truncate uppercase">Sharma & Sons</h1>
            <p className="text-[#666] text-[10px] mt-1 uppercase">Trading Co. · ID: SS-8492</p>
          </div>

          <div className="flex-1 space-y-1">
            <div className="text-[#444] text-[9px] uppercase font-bold mb-2 px-2 mt-4">Core</div>
            <NavItem icon={<LayoutDashboard size={14} />} label="Dashboard" active />
            <NavItem icon={<BookOpen size={14} />} label="Entry Book" shortcut="⌘E" />
            <NavItem icon={<Users size={14} />} label="Customers" shortcut="⌘C" />
            <NavItem icon={<Activity size={14} />} label="Transactions" shortcut="⌘T" />
            <NavItem icon={<Wallet size={14} />} label="Ledger" />
            
            <div className="text-[#444] text-[9px] uppercase font-bold mb-2 px-2 mt-6">Analytics</div>
            <NavItem icon={<FileText size={14} />} label="Reports" />
            <NavItem icon={<Bell size={14} />} label="Reminders" badge="4" shortcut="⌘R" alert />
            
            <div className="text-[#444] text-[9px] uppercase font-bold mb-2 px-2 mt-6">System</div>
            <NavItem icon={<Settings size={14} />} label="Settings" />
            <NavItem icon={<Info size={14} />} label="About" />
          </div>
          
          <div className="p-3 border-t border-[#222] bg-[#111] mt-auto">
            <div className="text-[10px] text-[#888] mb-1 flex items-center justify-between">
              <span>USER</span>
              <span className="text-[#00ff00]">ACTIVE</span>
            </div>
            <div className="text-white text-xs truncate">admin@sharmasons.in</div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] terminal-scroll overflow-y-auto p-4 gap-4 crt-line relative">
          
          {/* Top Command Bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-[#111] border border-[#333] flex items-center px-3 py-1.5 focus-within:border-[#00ff00] focus-within:bg-[#001100] transition-colors">
              <span className="text-[#00ff00] mr-2">❯</span>
              <input 
                type="text" 
                placeholder="Search entries, customers, or commands..." 
                className="bg-transparent border-none outline-none w-full text-white text-xs placeholder:text-[#444]"
              />
              <div className="flex items-center gap-1 text-[#555] text-[10px]">
                <Command size={10} />
                <span>K</span>
              </div>
            </div>
            <button className="bg-[#00ff00] text-black px-4 py-1.5 text-xs font-bold hover:bg-[#00cc00] flex items-center gap-2 uppercase">
              <span>New Entry</span>
              <span className="text-black/50 text-[10px] bg-black/10 px-1">⌘N</span>
            </button>
          </div>

          {/* Urgent Alerts Row */}
          <div className="bg-[#1a0f0f] border border-[#ff0000] p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-[#ff0000] animate-pulse" />
              <span className="text-[#ff0000] text-xs font-bold uppercase tracking-wider">Overdue Alert</span>
              <span className="text-[#888] text-xs">|</span>
              <span className="text-white text-xs"><span className="text-[#ff0000]">6</span> Entries</span>
              <span className="text-[#888] text-xs">|</span>
              <span className="text-white text-xs tabular-nums tracking-wider">₹84,200 <span className="text-[#888]">OUTSTANDING</span></span>
              <span className="text-[#888] text-xs">|</span>
              <span className="text-white text-xs"><span className="text-[#ff0000]">4</span> Ready to remind</span>
            </div>
            <button className="text-[#ff0000] border border-[#ff0000] px-3 py-1 text-[10px] hover:bg-[#ff0000] hover:text-black transition-colors uppercase font-bold">
              Action Required
            </button>
          </div>

          {/* Core Metrics Quad */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard 
              label="TOTAL BALANCE" 
              value="₹2,45,800" 
              trend="+12.5%" 
              trendUp={true} 
              color="text-white"
            />
            <MetricCard 
              label="TOTAL CREDIT (RECV)" 
              value="₹8,42,500" 
              trend="+5.2%" 
              trendUp={true} 
              color="text-[#00ff00]"
            />
            <MetricCard 
              label="TOTAL DEBIT (GIVEN)" 
              value="₹5,96,700" 
              trend="-2.1%" 
              trendUp={false} 
              color="text-[#ff0000]"
            />
            <MetricCard 
              label="ACTIVE CUSTOMERS" 
              value="47" 
              trend="+3" 
              trendUp={true} 
              color="text-white"
            />
          </div>

          {/* Charts & Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[300px]">
            
            {/* Chart Area */}
            <div className="col-span-2 border border-[#333] bg-[#111] flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#0d0d0d]">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Monthly Volatility (CR vs DR)</h2>
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00ff00] inline-block"></span> CR</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ff0000] inline-block"></span> DR</div>
                </div>
              </div>
              <div className="flex-1 p-4 flex items-end justify-between gap-1">
                {monthlyData.map((d, i) => {
                  const max = 150;
                  const crHeight = (d.credit / max) * 100;
                  const drHeight = (d.debit / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-black border border-[#444] p-1.5 text-[9px] opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                        <div className="text-[#00ff00]">CR: ₹{d.credit},000</div>
                        <div className="text-[#ff0000]">DR: ₹{d.debit},000</div>
                      </div>
                      
                      <div className="w-full max-w-[16px] flex flex-col justify-end gap-[1px] h-full pb-6 relative">
                        <div 
                          className="w-full bg-[#00ff00]/80 hover:bg-[#00ff00] transition-colors border-t border-[#00ff00]" 
                          style={{ height: `${crHeight}%` }}
                        ></div>
                        <div 
                          className="w-full bg-[#ff0000]/80 hover:bg-[#ff0000] transition-colors border-b border-[#ff0000]" 
                          style={{ height: `${drHeight}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-[#666] absolute bottom-0">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="border border-[#333] bg-[#111] flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#0d0d0d]">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Top Exposure</h2>
                <button className="text-[10px] hover:text-white">VIEW ALL</button>
              </div>
              <div className="flex-1 overflow-auto terminal-scroll">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-[#555] border-b border-[#222] bg-[#0a0a0a]">
                      <th className="py-2 px-3 font-normal text-[10px]">#</th>
                      <th className="py-2 px-3 font-normal text-[10px]">ENTITY</th>
                      <th className="py-2 px-3 font-normal text-[10px] text-right">NET BAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={i} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-2 px-3 text-[#555] text-[10px] w-8">{c.rank}</td>
                        <td className="py-2 px-3 text-[#ccc] truncate max-w-[120px]">{c.name}</td>
                        <td className={`py-2 px-3 text-right tabular-nums ${c.status === 'cr' ? 'text-[#00ff00]' : 'text-[#ff0000]'}`}>
                          {c.balance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Transactions Feed */}
          <div className="border border-[#333] bg-[#111] flex flex-col mb-6">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#0d0d0d]">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Live Ledger Feed</h2>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff00]"></span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-[10px] hover:text-white px-2 py-1 border border-[#333]">FILTER</button>
                <button className="text-[10px] hover:text-white px-2 py-1 border border-[#333]">EXPORT</button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="text-[#555] border-b border-[#222] bg-[#0a0a0a] text-[10px]">
                    <th className="py-2 px-3 font-normal">TIME/DATE</th>
                    <th className="py-2 px-3 font-normal">TXID</th>
                    <th className="py-2 px-3 font-normal">CUSTOMER</th>
                    <th className="py-2 px-3 font-normal">TYPE</th>
                    <th className="py-2 px-3 font-normal text-right">AMOUNT (₹)</th>
                    <th className="py-2 px-3 font-normal text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {recentTransactions.map((tx, i) => (
                    <tr key={tx.id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors group">
                      <td className="py-2 px-3 text-[#777]">{tx.date}</td>
                      <td className="py-2 px-3 text-[#555] group-hover:text-white transition-colors">{tx.id}</td>
                      <td className="py-2 px-3 text-[#ccc]">{tx.name}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border ${
                          tx.type === 'credit' 
                            ? 'text-[#00ff00] border-[#00ff00]/30 bg-[#00ff00]/5' 
                            : 'text-[#ff0000] border-[#ff0000]/30 bg-[#ff0000]/5'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        tx.type === 'credit' ? 'text-[#00ff00]' : 'text-[#ff0000]'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={tx.status === 'SETTLED' ? 'text-[#555]' : 'text-[#ffff00]'}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-1.5 border-t border-[#222] text-center bg-[#0d0d0d]">
              <button className="text-[10px] text-[#666] hover:text-white uppercase tracking-widest w-full">Load More Transactions ▼</button>
            </div>
          </div>

        </main>
      </div>
      
      {/* Footer Status Bar */}
      <footer className="flex-none h-6 bg-[#000] border-t border-[#333] flex items-center px-3 text-[10px] justify-between z-10 text-[#555] uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span>NORMAL</span>
          <span className="text-[#00ff00]">SYS.OK</span>
          <span>MEM: 42MB</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#00ff00] bg-[#00ff00]/10 px-1 border border-[#00ff00]/20">INSERT</span>
          <span>UTF-8</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}

// Sub-components

function NavItem({ icon, label, active, shortcut, badge, alert }: any) {
  return (
    <button 
      className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors text-left group ${
        active 
          ? 'bg-[#1a1a1a] text-white border-l-2 border-[#00ff00]' 
          : 'text-[#888] hover:bg-[#111] hover:text-[#ccc] border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-[#00ff00]' : 'group-hover:text-white transition-colors'}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${
            alert ? 'bg-[#ff0000] text-black animate-pulse' : 'bg-[#333] text-white'
          }`}>
            {badge}
          </span>
        )}
        {shortcut && (
          <span className="text-[9px] text-[#444] hidden group-hover:block font-bold">
            {shortcut}
          </span>
        )}
      </div>
    </button>
  );
}

function MetricCard({ label, value, trend, trendUp, color }: any) {
  return (
    <div className="border border-[#333] bg-[#111] p-3 hover:border-[#555] transition-colors group flex flex-col justify-between h-24">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className={`text-xl font-bold tracking-tight tabular-nums ${color}`}>{value}</span>
        <span className={`text-[10px] flex items-center gap-0.5 ${trendUp ? 'text-[#00ff00]' : 'text-[#ff0000]'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </span>
      </div>
    </div>
  );
}
