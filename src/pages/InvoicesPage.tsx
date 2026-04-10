import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Plane,
  Landmark,
  Briefcase,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../utils';
import { API_URL } from "../config/api";
interface Invoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
  type: string;
}

export function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Note: Using the URL provided by the user. 
      // In a real app, this might be an environment variable.
      const res = await fetch(`${API_URL}/api/uploadedFiles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load invoices");
      }

      const data = await res.json();

      const mapped = data.map((file: any) => {
        const json =
          typeof file.extractedJson === "string"
            ? JSON.parse(file.extractedJson)
            : file.extractedJson || {};

        return {
          id: file.id,
          number: json?.invoice_meta?.invoice_number ?? `INV-${file.id}`,
          customer:
            json?.customer?.customer_name ??
            json?.customer?.company_name ??
            "Unknown",
          date:
            json?.invoice_meta?.invoice_date ??
            new Date(file.createdAt).toLocaleDateString("de-DE"),
          amount: json?.payments?.invoice_total ?? 0,
          status: json?.payments?.invoice_status ?? "Offen",
          type: json?.invoice_meta?.invoice_type ?? "Flug"
        };
      });

      setInvoices(mapped);
    } catch (err: any) {
      console.error("Error loading invoices:", err);
      setError(err.message || "An error occurred while loading invoices");
      // Fallback to empty list or mock data if needed for demo purposes
      // setInvoices([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const getTypeIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('flug')) return <Plane size={14} />;
    if (normalizedType.includes('hotel')) return <Landmark size={14} />;
    if (normalizedType.includes('pauschal')) return <Briefcase size={14} />;
    return <FileText size={14} />;
  };

  const getTypeStyles = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('flug')) return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400";
    if (normalizedType.includes('hotel')) return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
    if (normalizedType.includes('pauschal')) return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400";
    return "bg-zinc-50 dark:bg-zinc-900/20 text-zinc-600 dark:text-zinc-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Rechnungen</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Verwalten und verfolgen Sie alle Ihre Reiseabrechnungen.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/pdf-import"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Download size={20} className="rotate-180" /> PDF Import
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
              <Plus size={20} /> Neue Rechnung
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <Link 
                to="/invoices/new/flight"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                  <Plane size={16} />
                </div>
                Flug
              </Link>
              <Link 
                to="/invoices/new/hotel"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Landmark size={16} />
                </div>
                Hotel
              </Link>
              <Link 
                to="/invoices/new/package"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                  <Briefcase size={16} />
                </div>
                Pauschal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Rechnungsnummer oder Kunde suchen..."
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

      {/* Invoices Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Rechnungsnummer</th>
                <th className="px-6 py-4">Typ</th>
                <th className="px-6 py-4">Kunde</th>
                <th className="px-6 py-4">Datum</th>
                <th className="px-6 py-4">Betrag</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-sm text-zinc-500">Rechnungen werden geladen...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <button 
                        onClick={loadInvoices}
                        className="mt-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-8 h-8 text-zinc-300" />
                      <p className="text-sm text-zinc-500">Keine Rechnungen gefunden.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{inv.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        getTypeStyles(inv.type)
                      )}>
                        {getTypeIcon(inv.type)}
                        {inv.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{inv.customer}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">{inv.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(inv.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        to={inv.status === "bezahlt" || inv.status === "storniert" ? "#" : `/payment/${inv.id}`}
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer",
                          inv.status.toLowerCase() === 'bezahlt' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                          inv.status.toLowerCase() === 'offen' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
                          "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        )}
                      >
                        {inv.status}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/invoices/${inv.id}`}
                          className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Ansehen"
                        >
                          <Eye size={18} />
                        </Link>
                        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
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
            Zeige {totalItems === 0 ? 0 : startIndex + 1} bis {endIndex} von {totalItems} Rechnungen
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
                // Simple pagination window logic
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
