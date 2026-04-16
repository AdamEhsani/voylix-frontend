import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calculator, 
  Download, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, cn } from '../utils';

interface AccountingEntry {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  method: string;
  status: string;
  currency: string;
}
import { API_URL } from '../config/api';
export function AccountingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/uploadedFiles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load accounting data");
      }

      const data = await res.json();

      const mapped = data.map((file: any) => {
        const json =
          typeof file.extractedJson === "string"
            ? JSON.parse(file.extractedJson)
            : file.extractedJson || {};

        const payments = json?.payments || {};
        const customer = json?.customer || {};

        return {
          id: file.id,
          invoiceNumber: json?.invoice_meta?.invoice_number ?? `INV-${file.id}`,
          customerName: customer?.customer_name ?? customer?.company_name ?? "Unbekannt",
          totalAmount: parseFloat(payments?.invoice_total) || 0,
          paidAmount: parseFloat(payments?.invoice_paid_amount) || 0,
          balance: parseFloat(payments?.invoice_balance) || 0,
          method: payments?.payment_method ?? "N/A",
          status: payments?.invoice_status ?? "Offen",
          currency: payments?.currency ?? "EUR",
          date:payments?.payment_date ? payments.payment_date : new Date(file.createdAt).toLocaleDateString("de-DE")
        };
      });

      setEntries(mapped);
    } catch (err: any) {
      console.error("Error loading accounting data:", err);
      setError(err.message || "Ein Fehler ist beim Laden der Buchhaltungsdaten aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, []);

  const filteredEntries = entries.filter(entry => 
    entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalRevenue = filteredEntries.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = filteredEntries.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = filteredEntries.reduce((acc, curr) => acc + curr.balance, 0);

  // Pagination logic
  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'bezahlt') return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800";
    if (s === 'offen') return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800";
    return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800";
  };

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('bar')) return <Banknote size={14} />;
    if (m.includes('karte') || m.includes('credit')) return <CreditCard size={14} />;
    if (m.includes('überweisung') || m.includes('online')) return <ArrowUpRight size={14} />;
    return <Wallet size={14} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Buchhaltung</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Übersicht über alle Zahlungen und Außenstände.</p>
        </div>
        <button 
          onClick={() => {/* Export logic */}}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Download size={20} /> Exportieren
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gesamtumsatz</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Eingegangen</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Offen</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Kunde oder Rechnungsnummer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none appearance-none min-w-[140px]">
              <option>Alle Zeiträume</option>
              <option>Dieser Monat</option>
              <option>Letzter Monat</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Accounting Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Kunde</th>
                <th className="px-6 py-4">Rechnung</th>
                <th className="px-6 py-4">Datum</th>
                <th className="px-6 py-4">Gesamt</th>
                <th className="px-6 py-4">Bezahlt</th>
                <th className="px-6 py-4">Restbetrag</th>
                <th className="px-6 py-4">Methode</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-sm text-zinc-500">Daten werden geladen...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <button 
                        onClick={loadAccountingData}
                        className="mt-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Calculator className="w-8 h-8 text-zinc-300" />
                      <p className="text-sm text-zinc-500">Keine Buchungsdaten gefunden.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{entry.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">R-{entry.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">{entry.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(entry.totalAmount, entry.currency)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-emerald-600 font-medium">{formatCurrency(entry.balance, entry.currency)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        entry.paidAmount > 0 ? "text-red-500" : "text-zinc-400"
                      )}>
                        {formatCurrency(entry.paidAmount, entry.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {getMethodIcon(entry.method)}
                        {entry.method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusStyles(entry.status)
                      )}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Zeige {totalItems === 0 ? 0 : startIndex + 1} bis {endIndex} von {totalItems} Einträgen
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30" 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum + (5 - i - 1) > totalPages) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                if (pageNum > totalPages || pageNum < 1) return null;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      currentPage === pageNum 
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
