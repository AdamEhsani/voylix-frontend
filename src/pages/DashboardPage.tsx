import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  FileText,
  Coins,
  Clock,
  Search,
  ArrowUpDown,
  Filter,
  ChevronRight,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../utils';
import LogoAgency from '../components/LogoAgency';
import { API_URL } from "../config/api";

type UnpaidInvoice = {
  invoiceId: number;
  createdAt: string;
  customerId?: string;
  customerName?: string;
  balance: number;
  status?: string;
};

type DashboardResponse = {
  token: number;
  rechnungenCount: number;
  customersCount: number;
  unpaidInvoicesCount: number;
  unpaidInvoices: UnpaidInvoice[];
};

export function DashboardPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse>({
    token: 0,
    rechnungenCount: 0,
    customersCount: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoices: [],
  });

  // Search, Sort, Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/Dashboard`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data: DashboardResponse = await response.json();
        setDashboard({
          token: data.token ?? 0,
          rechnungenCount: data.rechnungenCount ?? 0,
          customersCount: data.customersCount ?? 0,
          unpaidInvoicesCount: data.unpaidInvoicesCount ?? 0,
          unpaidInvoices: data.unpaidInvoices ?? [],
        });
      } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = [
    {
      label: 'Token-Guthaben',
      value: dashboard.token.toLocaleString('de-DE'),
      icon: Coins,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      description: 'Verfügbares Guthaben für KI-Extraktionen',
    },
    {
      label: 'Rechnungen gesamt',
      value: dashboard.rechnungenCount.toLocaleString('de-DE'),
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Alle erstellten Rechnungen im System',
    },
    {
      label: 'Aktive Kunden',
      value: dashboard.customersCount.toLocaleString('de-DE'),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Kunden mit mindestens einer Buchung',
    },
    {
      label: 'Unbezahlt',
      value: dashboard.unpaidInvoicesCount.toLocaleString('de-DE'),
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Offene Rechnungen zur Nachverfolgung',
    },
  ];

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...dashboard.unpaidInvoices];

    // Filter by Month and Year
    result = result.filter((inv) => {
      const date = new Date(inv.createdAt);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.customerName?.toLowerCase().includes(lowerSearch) ||
          inv.invoiceId.toString().includes(lowerSearch)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.balance - b.balance;
      } else if (sortBy === 'name') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [dashboard.unpaidInvoices, searchTerm, sortBy, sortOrder, selectedMonth, selectedYear]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Willkommen zurück. Hier ist die Übersicht Ihrer Agentur.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LogoAgency />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn('p-3 rounded-2xl transition-colors', stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp size={16} className="text-zinc-400" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] text-zinc-500 mt-2 line-clamp-1">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="text-orange-500" size={24} />
                  Offene Rechnungen
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Verwalten und Nachverfolgen Ihrer unbezahlten Forderungen.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all w-full sm:w-64"
                  />
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <button
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else setSortBy('date');
                  }}
                  className={cn(
                    "p-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                    sortBy === 'date' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600"
                  )}
                >
                  <ArrowUpDown size={16} />
                  Datum
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rechnung</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Kunde</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Datum</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Betrag</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6">
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredAndSortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-zinc-500">
                      Keine unbezahlten Rechnungen für diesen Zeitraum gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInvoices.map((invoice) => (
                    <tr
                      key={invoice.invoiceId}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 group-hover:text-emerald-600 transition-colors">
                            <FileText size={16} />
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-white">RE-{invoice.invoiceId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{invoice.customerName || 'Unbekannter Kunde'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-zinc-500">{formatDate(invoice.createdAt)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(invoice.balance)}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => navigate(`/payment/${invoice.invoiceId}`)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
                            invoice.status?.toLowerCase() === 'bezahlt'
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 hover:bg-orange-200"
                          )}
                        >
                          {invoice.status || 'Offen'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          to={`/invoices/${invoice.invoiceId}`}
                          className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors inline-block"
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              to="/invoices"
              className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Alle Rechnungen in der Übersicht anzeigen
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

