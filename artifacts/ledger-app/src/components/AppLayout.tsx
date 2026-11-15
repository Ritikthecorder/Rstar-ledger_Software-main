import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BookOpen,
  BarChart2,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
  ClipboardList,
  Info,
  BellRing,
  HardDrive,
} from "lucide-react";
import { useOverdueReminders } from "@/hooks/useOverdueReminders";
import { usePermissions } from "@/hooks/usePermissions";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entry", label: "Entry Book", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const connectNav = [
  { href: "/reminders", label: "Reminders", icon: BellRing },
];

const footerNav = [
  { href: "/backup", label: "Backup & Sync", icon: HardDrive },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const settings = useSettingsStore((s) => s.settings);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: overdue } = useOverdueReminders();
  const overdueCount = overdue?.filter((e) => !e.alreadySent || !e.cooldownActive).length ?? 0;
  const { canManageTeam, role } = usePermissions();

  const allowedMainHrefs =
    role === "owner"
      ? ["/", "/entry", "/customers", "/transactions", "/ledger", "/reports"]
      : role === "staff"
      ? ["/entry", "/customers", "/transactions"]
      : ["/customers", "/transactions"]; // viewer

  const businessName = settings?.business_name || "LedgerPro";
  const initial = businessName.charAt(0).toUpperCase();
  const tagline = businessName === "LedgerPro" ? "Friendly Khata" : "Trading Co.";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const NavItem = ({
    href,
    label,
    Icon,
    badge,
    onClick,
  }: {
    href: string;
    label: string;
    Icon: typeof LayoutDashboard;
    badge?: number;
    onClick?: () => void;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition-all font-semibold text-sm ${
          active
            ? "bg-white shadow-sm text-slate-800"
            : "text-slate-500 hover:bg-white/40 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-rose-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-300 to-rose-300 flex items-center justify-center text-white shadow-sm font-bold text-xl">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm leading-tight text-slate-800 dark:text-slate-100 truncate">
            {businessName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tagline}</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="space-y-1">
        {mainNav
          .filter((item) => allowedMainHrefs.includes(item.href))
          .map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              onClick={onClose}
            />
          ))}

        <div className="mt-2 mb-1 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Connect
        </div>

        {connectNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            badge={item.href === "/reminders" ? overdueCount : undefined}
            onClick={onClose}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="space-y-1 pt-1">
        {footerNav
          .filter((item) => (role === "owner" ? true : false))
          .map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              onClick={onClose}
            />
          ))}
        {canManageTeam && (
          <NavItem
            href="/admin"
            label="Admin"
            Icon={Settings}
            onClick={onClose}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-4 py-2.5 rounded-2xl text-slate-500 hover:bg-white/40 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5 font-semibold"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <Moon className="h-[18px] w-[18px] shrink-0" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-4 py-2.5 rounded-2xl text-slate-500 hover:bg-white/40 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5 font-semibold"
          onClick={signOut}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen p-4 gap-4 md:gap-6">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col glass-card rounded-[2rem] w-64 shrink-0 sticky top-4 h-auto self-start">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-72 m-3 glass-card rounded-[2rem] flex flex-col self-start">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden glass-card rounded-2xl flex items-center gap-3 px-4 py-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-300 to-rose-300 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              {initial}
            </div>
            <span className="font-bold text-sm">{businessName}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
