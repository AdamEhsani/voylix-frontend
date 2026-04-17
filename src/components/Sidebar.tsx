import {
  LayoutDashboard,
  Users,
  FileText,
  Coins,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  Layout,
  Calculator
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Rechnungen', path: '/invoices' },
  { icon: Calculator, label: 'Buchhaltung', path: '/accounting' },
  { icon: Users, label: 'Kundenverwaltung', path: '/customers' },
  { icon: Layout, label: 'Invoice Designer', path: '/invoices/designer' },
  { icon: Coins, label: 'Token-System', path: '/tokens' },
  { icon: Building2, label: 'Agenturprofil', path: '/agency' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { logout, user } = useAuth();
 
  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm print:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-40 print:hidden",
        isOpen ? "w-64" : "w-20",
        !isOpen && "hidden lg:block"
      )}>
        <div className="flex flex-col h-full">

          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            {isOpen && <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Rechino</span>}
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;

              const isDisabled =
                item.path === "/accounting" &&
                (user?.type ?? "").toLowerCase() !== "admin";

              return (
                <Link
                  key={item.path}
                  to={isDisabled ? "#" : item.path}
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-600 dark:text-zinc-400",

                    isDisabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                  {isOpen && isActive && !isDisabled && (
                    <ChevronRight size={16} className="ml-auto opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
            >
              <LogOut size={20} />
              {isOpen && <span className="font-medium">Abmelden</span>}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}