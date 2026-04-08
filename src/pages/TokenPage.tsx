import { useState } from 'react';
import { 
  Coins, 
  History, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, cn } from '../utils';

const transactions = [
  { id: '1', type: 'usage', description: 'Rechnungsextraktion RE-2026-001', amount: -1, date: '02.03.2026, 14:20', balance: 1250 },
  { id: '2', type: 'usage', description: 'Rechnungsextraktion RE-2026-002', amount: -1, date: '01.03.2026, 09:15', balance: 1251 },
  { id: '3', type: 'purchase', description: 'Token-Paket "Business"', amount: 500, date: '25.02.2026, 11:00', balance: 1252 },
  { id: '4', type: 'usage', description: 'Rechnungsextraktion RE-2026-003', amount: -1, date: '24.02.2026, 16:45', balance: 752 },
];

const packages = [
  { name: 'Starter', tokens: 100, price: 49, popular: false },
  { name: 'Business', tokens: 500, price: 199, popular: true },
  { name: 'Enterprise', tokens: 2000, price: 699, popular: false },
];

export function TokenPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Token-System</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Verwalten Sie Ihr Guthaben für die automatisierte Rechnungsextraktion.</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-200 dark:shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Aktuelles Guthaben</p>
            <div className="flex items-center gap-3">
              <Coins size={40} className="text-emerald-200" />
              <h2 className="text-5xl font-bold">1.250</h2>
              <span className="text-emerald-200 font-bold text-xl">Tokens</span>
            </div>
            <p className="text-emerald-100 text-xs mt-4 flex items-center gap-1">
              <Zap size={12} /> Entspricht ca. 1.250 weiteren Extraktionen
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-2">
              <ShoppingCart size={20} /> Tokens aufladen
            </button>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <History size={20} className="text-zinc-400" /> Transaktionsverlauf
            </h3>
            <button className="text-sm font-semibold text-emerald-600 hover:underline">Alle anzeigen</button>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      t.type === 'purchase' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                    )}>
                      {t.type === 'purchase' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{t.description}</p>
                      <p className="text-xs text-zinc-500">{t.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      t.type === 'purchase' ? "text-emerald-600" : "text-orange-600"
                    )}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount} Tokens
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono">Saldo: {t.balance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Packages */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-zinc-400" /> Token-Pakete
          </h3>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.name} className={cn(
                "p-6 rounded-2xl border transition-all relative group cursor-pointer",
                pkg.popular 
                  ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800"
              )}>
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Beliebteste Wahl
                  </span>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{pkg.name}</h4>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{pkg.tokens} <span className="text-sm font-medium">Tokens</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(pkg.price)}</p>
                    <p className="text-[10px] text-zinc-400">Einmalzahlung</p>
                  </div>
                </div>
                <button className={cn(
                  "w-full py-2 rounded-lg font-bold text-sm transition-colors",
                  pkg.popular 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600"
                )}>
                  Paket wählen
                </button>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Sofortige Gutschrift
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Unbegrenzte Gültigkeit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
