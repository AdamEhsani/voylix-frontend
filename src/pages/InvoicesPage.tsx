import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  X,
  Combine,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency, cn, formatDate } from '../utils';
import { API_URL } from "../config/api";
interface InvoicePassenger {
  index: number | null;
  fullName: string | null;
}

interface Invoice {
  id: number;
  number: string;          // Rechnungsnummer (Backend liefert "RE-NNNNN")
  customer: string;
  date: string;            // Rechnungsdatum
  abreiseDate: string;     // Abreise / Check-in
  amount: number;
  status: string;
  type: string;
  destination: string;
  departureTime: string | null;
  user: string | null;
  userType: string | null;
  passengers: InvoicePassenger[];
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Voylix: Multi-select baray Zusammenführen
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showMerged, setShowMerged] = useState(false); // namayesh-e Rechnung-haye zusammengeführt
  const [isMerging, setIsMerging] = useState(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Endpoint jadid: az jadval Invoice (+ children) mikhune.
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load invoices");
      }

      const data: any[] = await res.json();

      // Voylix: agar abreiseDate khali bud, az departureTime ISO ham ye fallback dorost-paziri mikonim.
      const isoToDe = (iso?: string | null): string => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      };

      const mapped: Invoice[] = data.map((row) => {
        const abreiseFromBackend =
          row.abreiseDate ?? row.AbreiseDate ?? row.abreise_date ?? "";
        const abreiseFallback = abreiseFromBackend || isoToDe(row.departureTime);
        // Voylix: Rechnungsnummer az backend miad (RE-NNNNN — per-agency lückenlos).
        // Fallback baray-e qadimi-ye `R-${id}` ha hanouz hifz mishe age field nayad.
        const rechnungsNummer =
          row.rechnungsNummer ?? row.RechnungsNummer ?? `R-${row.id}`;
        return {
          id: row.id,
          number: rechnungsNummer,
          customer: row.customer ?? "Unknown",
          date: row.date ?? "",
          abreiseDate: abreiseFallback,
          amount: typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0),
          status: row.status ?? "offen",
          type: row.type ?? "Flug",
          destination: row.destination ?? "",
          departureTime: row.departureTime ?? null,
          user: row.user ?? "Unbekannt",
          userType: row.userType ?? "Unbekannt",
          passengers: Array.isArray(row.passengers) ? row.passengers : []
        };
      });

      setInvoices(mapped);
    } catch (err: any) {
      console.error("Error loading invoices:", err);
      setError(err.message || "An error occurred while loading invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    // Voylix: zusammengeführte Rechnungen ro be tor pishfarz makhfi mikonim
    if (!showMerged && (inv.status ?? '').toLowerCase() === 'zusammengeführt') return false;

    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.status.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (startDate || endDate) {
      // Parse the DD.MM.YYYY date for comparison
      const parts = inv.date.split('.');
      if (parts.length === 3) {
        const invDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (invDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (invDate > end) return false;
        }
      } else {
        // Fallback for YYYY-MM-DD
        const invDate = new Date(inv.date);
        if (!isNaN(invDate.getTime())) {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (invDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (invDate > end) return false;
          }
        }
      }
    }

    return true;
  });

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
    // Voylix: Pauschal canonical, "package" legacy alias
    if (normalizedType.includes('pauschal') || normalizedType.includes('package')) return <Briefcase size={14} />;
    return <FileText size={14} />;
  };

  const getTypeStyles = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('flug')) return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400";
    if (normalizedType.includes('hotel')) return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
    if (normalizedType.includes('pauschal') || normalizedType.includes('package')) return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400";
    return "bg-zinc-50 dark:bg-zinc-900/20 text-zinc-600 dark:text-zinc-400";
  };

  // -------- Multi-select / Zusammenführen helpers --------
  const isMergeBlocked = (status: string) => {
    const s = (status ?? '').toLowerCase();
    return s === 'storniert' || s === 'zusammengeführt';
  };

  const toggleSelected = (id: number, status: string) => {
    if (isMergeBlocked(status)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selectable invoices on the CURRENT page (not blocked by status)
  const selectableOnPage = useMemo(
    () => filteredInvoices
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .filter(i => !isMergeBlocked(i.status))
      .map(i => i.id),
    [filteredInvoices, currentPage, itemsPerPage]
  );

  const allOnPageSelected = selectableOnPage.length > 0 && selectableOnPage.every(id => selectedIds.has(id));

  const togglePageSelect = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        selectableOnPage.forEach(id => next.delete(id));
      } else {
        selectableOnPage.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Validate same customer for selected invoices
  const selectedInvoices = useMemo(
    () => invoices.filter(i => selectedIds.has(i.id)),
    [invoices, selectedIds]
  );
  const distinctSelectedCustomers = useMemo(
    () => Array.from(new Set(selectedInvoices.map(i => i.customer ?? ''))),
    [selectedInvoices]
  );
  const sameCustomerSelected = distinctSelectedCustomers.length <= 1;
  const selectedTotal = useMemo(
    () => selectedInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
    [selectedInvoices]
  );

  const handleMerge = async () => {
    if (selectedIds.size < 2) {
      toast.error('Mindestens 2 Rechnungen auswählen.');
      return;
    }
    if (!sameCustomerSelected) {
      toast.error('Alle ausgewählten Rechnungen müssen denselben Kunden haben.');
      return;
    }
    setIsMerging(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/invoices/merge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Zusammenführen fehlgeschlagen.');
      }
      const data = await res.json();
      toast.success(`Rechnungen wurden zusammengeführt: R-${data.mergedId}`);
      clearSelection();
      setShowMergeConfirm(false);
      // Direkt zur neuen Rechnung navigieren
      navigate(`/invoices/${data.mergedId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'Fehler beim Zusammenführen');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    // Voylix: neg-margin baray escape kardan az max-w-7xl-e DashboardLayout — jadval ja-tar mishe va niaze be scroll kam mishe.
    <div className="space-y-6 xl:-mx-8 2xl:-mx-16">
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
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Suche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Nummer oder Kunde suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 w-full lg:w-auto">
            <div className="space-y-1.5 flex-1 sm:flex-none sm:w-44">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Von</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 flex-1 sm:flex-none sm:w-44">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Bis</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              onClick={() => setShowMerged(v => !v)}
              className={cn(
                "h-[38px] px-3 flex items-center gap-2 text-xs font-bold rounded-lg transition-colors border",
                showMerged
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
              title="Zusammengeführte Rechnungen anzeigen / ausblenden"
            >
              <Combine size={14} /> {showMerged ? 'Zusammengeführte ausblenden' : 'Zusammengeführte zeigen'}
            </button>

            {(startDate || endDate || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="h-[38px] px-4 flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-transparent hover:border-red-200"
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-2 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePageSelect}
                    className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title="Alle auf dieser Seite auswählen"
                  />
                </th>
                <th className="px-3 py-3">Rechnungsnr.</th>
                <th className="px-2 py-3">Typ</th>
                <th className="px-3 py-3">Kunde</th>
                <th className="px-2 py-3 text-center">Reiseteilnehmer</th>
                <th className="px-3 py-3">Rechnungsdatum</th>
                <th className="px-3 py-3">Abreise Datum</th>
                <th className="px-3 py-3">Reiseziel</th>
                <th className="px-3 py-3">Betrag</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-2 py-3 text-right">Aktionen</th>
                <th className="px-3 py-3 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-sm text-zinc-500">Rechnungen werden geladen...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center">
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
                  <td colSpan={12} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-8 h-8 text-zinc-300" />
                      <p className="text-sm text-zinc-500">Keine Rechnungen gefunden.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInvoices.map((inv) => {
                  const isMerged = (inv.status ?? '').toLowerCase() === 'zusammengeführt';
                  const isStorno = (inv.status ?? '').toLowerCase() === 'storniert';
                  const blocked = isMergeBlocked(inv.status);
                  const checked = selectedIds.has(inv.id);
                  return (
                  <tr
                    key={inv.id}
                    className={cn(
                      "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group",
                      checked && "bg-emerald-50/40 dark:bg-emerald-900/10",
                      isMerged && "opacity-60"
                    )}
                  >
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={blocked}
                        onChange={() => toggleSelected(inv.id, inv.status)}
                        className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={blocked ? `Nicht auswählbar (${inv.status})` : 'Für Zusammenführung auswählen'}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{inv.number}</span>
                    </td>
                    <td className="px-2 py-3">
                      <div className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-lg",
                        getTypeStyles(inv.type)
                      )}>
                        {getTypeIcon(inv.type)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {inv.customer}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="relative inline-flex items-center justify-center group/pax">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {inv.passengers?.length ?? 0}
                        </span>
                        {(inv.passengers?.length ?? 0) > 0 && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/pax:block z-50 w-56 rounded-md bg-zinc-900 text-white shadow-lg p-2 text-xs space-y-0.5">
                            {inv.passengers!.map((p: any, i: number) => (
                              <div key={i}>{(i + 1) + '. ' + (p.fullName ?? '').toLowerCase()}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-zinc-500">{inv.date}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-zinc-500">{inv.abreiseDate || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-zinc-500">{inv.destination}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-zinc-500">
                        {new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        }).format(inv.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={inv.userType === "admin" && !blocked ? `/payment/${inv.id}` : "#"}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap",
                          inv.status.toLowerCase() === 'bezahlt' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                            inv.status.toLowerCase() === 'offen' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
                              inv.status.toLowerCase() === 'zusammengeführt' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" :
                                "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        )}
                      >
                        {inv.status}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="inline-flex p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Ansehen"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="text-xs text-zinc-500">{inv.user}</span>
                    </td>
                  </tr>
                  );
                })
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

      {/* Floating Action Bar — Multi-Select / Zusammenführen */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden">
          <div className="flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl rounded-full px-4 py-2.5 border border-zinc-700 dark:border-zinc-300 animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
              {selectedIds.size}
            </div>
            <div className="text-xs">
              <div className="font-bold">
                {selectedIds.size} ausgewählt
              </div>
              <div className="text-[10px] opacity-70">
                {sameCustomerSelected
                  ? `Gesamt: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(selectedTotal)}`
                  : 'Mehrere Kunden — bitte denselben Kunden wählen'}
              </div>
            </div>
            <div className="h-6 w-px bg-zinc-700 dark:bg-zinc-300 mx-1" />
            <button
              onClick={() => setShowMergeConfirm(true)}
              disabled={selectedIds.size < 2 || !sameCustomerSelected}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-full transition-colors"
            >
              <Combine size={14} />
              Zusammenführen
            </button>
            <button
              onClick={clearSelection}
              className="p-1.5 text-zinc-400 hover:text-white dark:hover:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 rounded-full transition-colors"
              title="Auswahl aufheben"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Merge Modal */}
      {showMergeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <Combine size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Rechnungen zusammenführen?
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {selectedIds.size} Rechnungen werden zu einer kombinierten Rechnung
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase">Ausgewählte Rechnungen</p>
                <div className="space-y-1">
                  {selectedInvoices.map(inv => (
                    <div key={inv.id} className="flex justify-between text-xs bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                      <span className="font-mono font-bold">{inv.number}</span>
                      <span className="text-zinc-500 truncate mx-3">{inv.customer}</span>
                      <span className="font-bold whitespace-nowrap">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(inv.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Kunde</span>
                  <span className="font-bold">{distinctSelectedCustomers[0]}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Neuer Gesamtbetrag</span>
                  <span className="text-emerald-600">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(selectedTotal)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg flex gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Die Quell-Rechnungen werden als <b>„zusammengeführt"</b> markiert und in der Standard-Liste ausgeblendet.
                  Daten gehen nicht verloren — sie bleiben in der DB und können über „Zusammengeführte zeigen" eingesehen werden.
                </p>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowMergeConfirm(false)}
                disabled={isMerging}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {isMerging ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Zusammenführen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
