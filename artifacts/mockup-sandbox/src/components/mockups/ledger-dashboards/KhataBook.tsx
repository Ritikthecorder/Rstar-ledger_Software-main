import React from 'react';
import { 
  BookOpen, Users, ArrowRightLeft, FileText, 
  BarChart3, Bell, Settings, Info, BellRing, 
  ArrowUpRight, ArrowDownLeft, Search, Plus,
  Menu
} from 'lucide-react';

export function KhataBook() {
  const chartData = [
    { month: 'Apr', credit: 65, debit: 45 },
    { month: 'May', credit: 72, debit: 50 },
    { month: 'Jun', credit: 68, debit: 55 },
    { month: 'Jul', credit: 85, debit: 60 },
    { month: 'Aug', credit: 90, debit: 75 },
    { month: 'Sep', credit: 78, debit: 65 },
    { month: 'Oct', credit: 95, debit: 80 },
    { month: 'Nov', credit: 110, debit: 95 },
    { month: 'Dec', credit: 105, debit: 85 },
    { month: 'Jan', credit: 90, debit: 70 },
    { month: 'Feb', credit: 85, debit: 60 },
    { month: 'Mar', credit: 120, debit: 90 },
  ];

  const transactions = [
    { id: 1, name: 'Rajesh Kumar', type: 'credit', amount: '12,500', date: 'Today, 10:30 AM', desc: 'Wholesale grains' },
    { id: 2, name: 'Meena Devi', type: 'debit', amount: '4,200', date: 'Today, 09:15 AM', desc: 'Transport fee' },
    { id: 3, name: 'Gupta Enterprises', type: 'credit', amount: '45,000', date: 'Yesterday', desc: 'Monthly settlement' },
    { id: 4, name: 'Amit Singh', type: 'debit', amount: '8,500', date: 'Yesterday', desc: 'Shop supplies' },
    { id: 5, name: 'Verma Traders', type: 'credit', amount: '22,400', date: '12 Oct, 2023', desc: 'Spices order #442' },
    { id: 6, name: 'Priya Sharma', type: 'credit', amount: '3,100', date: '11 Oct, 2023', desc: 'Retail purchase' },
    { id: 7, name: 'Daily Wage Workers', type: 'debit', amount: '15,000', date: '10 Oct, 2023', desc: 'Weekly payout' },
    { id: 8, name: 'Kishan Lal', type: 'credit', amount: '8,900', date: '09 Oct, 2023', desc: 'Pending balance' },
  ];

  return (
    <div className="min-h-screen font-serif" style={{ backgroundColor: '#FDFBF7', color: '#2C1D11', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        
        .khata-font {
          font-family: 'Cormorant Garamond', serif;
        }
        .body-font {
          font-family: 'Lora', serif;
        }
        
        .paper-shadow {
          box-shadow: 0 4px 6px -1px rgba(44, 29, 17, 0.05), 0 2px 4px -1px rgba(44, 29, 17, 0.03), inset 0 0 20px rgba(212, 175, 55, 0.02);
        }
        
        .ruled-line {
          background-image: linear-gradient(to right, transparent 50%, rgba(138, 43, 34, 0.1) 50%);
          background-size: 8px 1px;
          background-repeat: repeat-x;
          height: 1px;
        }
        
        .vertical-rule {
          border-left: 2px solid rgba(138, 43, 34, 0.15);
        }
        
        .red-ink {
          color: #8A2B22;
        }
        
        .green-ink {
          color: #2E5C31;
        }

        .gold-ink {
          color: #B8860B;
        }
      `}} />

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-[#8A2B22]/20 relative z-10 flex flex-col" style={{ backgroundColor: '#F8F4EB' }}>
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
          
          <div className="p-6 border-b border-[#8A2B22]/20">
            <h1 className="khata-font text-2xl font-bold red-ink leading-tight">LedgerPro</h1>
            <p className="body-font text-sm text-[#2C1D11]/70 italic mt-1">Digital Bahi-Khata</p>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 body-font">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11] bg-[#EADDCE]/50 border border-[#8A2B22]/10 font-medium">
              <BookOpen size={18} className="red-ink" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <Plus size={18} />
              <span>Entry Book</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <Users size={18} />
              <span>Customers</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <ArrowRightLeft size={18} />
              <span>Transactions</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <FileText size={18} />
              <span>Ledger</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <BarChart3 size={18} />
              <span>Reports</span>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 hover:text-[#2C1D11] transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={18} />
                <span>Reminders</span>
              </div>
              <span className="bg-[#8A2B22] text-[#FDFBF7] text-xs font-bold px-2 py-0.5 rounded-full khata-font">4</span>
            </a>
          </nav>
          
          <div className="p-4 border-t border-[#8A2B22]/20 space-y-1 body-font">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 transition-colors">
              <Settings size={18} />
              <span>Settings</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-[#2C1D11]/80 hover:bg-[#EADDCE]/30 transition-colors">
              <Info size={18} />
              <span>About</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Header */}
          <header className="px-10 py-6 border-b border-[#8A2B22]/20 flex justify-between items-end" style={{ backgroundColor: 'rgba(253, 251, 247, 0.9)' }}>
            <div>
              <p className="body-font text-sm text-[#2C1D11]/60 uppercase tracking-widest mb-1">Account Book For</p>
              <h2 className="khata-font text-4xl font-bold red-ink tracking-wide">Sharma & Sons Trading Co.</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1D11]/40" size={18} />
                <input 
                  type="text" 
                  placeholder="Search entries..." 
                  className="pl-10 pr-4 py-2 bg-transparent border-b border-[#2C1D11]/20 focus:border-[#8A2B22] focus:outline-none body-font text-[#2C1D11] placeholder:text-[#2C1D11]/40 italic w-64"
                />
              </div>
              <button className="bg-[#8A2B22] text-[#FDFBF7] px-6 py-2.5 rounded shadow-sm hover:bg-[#72231c] transition-colors flex items-center gap-2 body-font font-medium">
                <Plus size={18} />
                New Entry
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            
            {/* Urgent Alert */}
            <div className="bg-[#FAF2EB] border border-[#8A2B22]/30 p-5 rounded-md flex items-start gap-4 paper-shadow relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8A2B22]"></div>
              <div className="bg-[#8A2B22]/10 p-2.5 rounded-full red-ink mt-0.5">
                <BellRing size={24} />
              </div>
              <div className="flex-1">
                <h3 className="khata-font text-xl font-bold red-ink mb-1">Overdue Collection Alert</h3>
                <p className="body-font text-[#2C1D11]/80">
                  You have <span className="font-bold">6 entries</span> overdue totaling <span className="font-bold">₹84,200</span>. 
                  <span className="font-bold text-[#8A2B22] ml-1">4 customers</span> are ready to be reminded today.
                </p>
              </div>
              <button className="border border-[#8A2B22] text-[#8A2B22] px-4 py-2 rounded body-font font-medium hover:bg-[#8A2B22] hover:text-[#FDFBF7] transition-colors self-center">
                Send Reminders
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Total Balance', value: '₹2,45,800', desc: 'Net outstanding', color: 'red-ink', isPositive: true },
                { label: 'Total Credit', value: '₹8,42,500', desc: 'Amount to receive', color: 'green-ink', isPositive: true },
                { label: 'Total Debit', value: '₹5,96,700', desc: 'Amount to pay', color: 'red-ink', isPositive: false },
                { label: 'Total Customers', value: '47', desc: 'Active accounts', color: 'gold-ink', isPositive: null },
              ].map((metric, i) => (
                <div key={i} className="bg-white/40 border border-[#2C1D11]/10 p-6 rounded-md paper-shadow relative">
                  <div className="absolute top-0 right-6 w-[2px] h-4 bg-[#8A2B22]/30"></div>
                  <div className="absolute top-0 right-8 w-[2px] h-6 bg-[#8A2B22]/30"></div>
                  
                  <p className="body-font text-sm text-[#2C1D11]/60 uppercase tracking-wider mb-2">{metric.label}</p>
                  <p className={`khata-font text-4xl font-bold ${metric.color} mb-3`}>{metric.value}</p>
                  
                  <div className="ruled-line mb-3"></div>
                  <div className="flex items-center justify-between text-sm body-font">
                    <span className="text-[#2C1D11]/60 italic">{metric.desc}</span>
                    {metric.isPositive !== null && (
                      <span className={metric.isPositive ? "green-ink flex items-center" : "red-ink flex items-center"}>
                        {metric.isPositive ? <ArrowDownLeft size={14} className="mr-1"/> : <ArrowUpRight size={14} className="mr-1"/>}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="col-span-2 bg-white/40 border border-[#2C1D11]/10 p-8 rounded-md paper-shadow">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="khata-font text-2xl font-bold text-[#2C1D11]">Monthly Credit vs Debit</h3>
                    <p className="body-font text-[#2C1D11]/60 italic mt-1">Cash flow over the last 12 months</p>
                  </div>
                  <div className="flex gap-4 text-sm body-font">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2E5C31]"></div>
                      <span>Credit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#8A2B22]"></div>
                      <span>Debit</span>
                    </div>
                  </div>
                </div>
                
                {/* Custom SVG Chart for handmade feel */}
                <div className="h-64 relative flex items-end justify-between border-b-2 border-l-2 border-[#2C1D11]/20 pb-4 pl-4 pt-4">
                  {/* Y-axis labels */}
                  <div className="absolute left-[-40px] top-0 bottom-4 flex flex-col justify-between text-xs body-font text-[#2C1D11]/50 h-full py-4">
                    <span>150k</span>
                    <span>100k</span>
                    <span>50k</span>
                    <span>0</span>
                  </div>
                  
                  {/* Grid lines */}
                  <div className="absolute inset-0 left-4 bottom-4 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full border-t border-dashed border-[#2C1D11]"></div>
                    <div className="w-full border-t border-dashed border-[#2C1D11]"></div>
                    <div className="w-full border-t border-dashed border-[#2C1D11]"></div>
                    <div className="w-full border-t border-[#2C1D11]"></div>
                  </div>

                  {chartData.map((data, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 group z-10 w-full px-1">
                      <div className="flex items-end gap-1 w-full justify-center h-52">
                        <div 
                          className="w-full max-w-[12px] bg-[#2E5C31] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity" 
                          style={{ height: `${(data.credit / 150) * 100}%` }}
                          title={`Credit: ₹${data.credit},000`}
                        ></div>
                        <div 
                          className="w-full max-w-[12px] bg-[#8A2B22] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity" 
                          style={{ height: `${(data.debit / 150) * 100}%` }}
                          title={`Debit: ₹${data.debit},000`}
                        ></div>
                      </div>
                      <span className="text-xs body-font text-[#2C1D11]/70 mt-2 rotate-[-45deg] origin-top-left -ml-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="col-span-1 bg-white/40 border border-[#2C1D11]/10 p-0 rounded-md paper-shadow flex flex-col">
                <div className="p-6 border-b border-[#8A2B22]/20 bg-[#FAF2EB]/50 rounded-t-md">
                  <h3 className="khata-font text-2xl font-bold text-[#2C1D11]">Recent Entries</h3>
                  <p className="body-font text-[#2C1D11]/60 italic mt-1">Last 7 days of activity</p>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  {transactions.map((tx, i) => (
                    <div key={tx.id} className="py-4 relative">
                      {i !== transactions.length - 1 && (
                        <div className="absolute bottom-0 left-0 right-0 ruled-line"></div>
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="khata-font font-bold text-[#2C1D11] text-lg">{tx.name}</h4>
                          <p className="body-font text-xs text-[#2C1D11]/60 italic">{tx.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`khata-font font-bold text-lg ${tx.type === 'credit' ? 'green-ink' : 'red-ink'}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                          </p>
                          <p className="body-font text-xs text-[#2C1D11]/60">{tx.type === 'credit' ? 'Received' : 'Given'}</p>
                        </div>
                      </div>
                      <p className="body-font text-sm text-[#2C1D11]/80">{tx.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-[#8A2B22]/20 text-center">
                  <a href="#" className="khata-font font-bold text-[#8A2B22] hover:text-[#2C1D11] transition-colors italic">View Complete Ledger →</a>
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
