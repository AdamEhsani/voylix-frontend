import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Landmark,
  X,
  FileSpreadsheet,
  FileText,
  PieChart as PieChartIcon,
  ListChecks,
  Users,
  Clock,
  UserCog,
  Euro,
  Percent,
  Receipt,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils';
import { API_URL } from '../config/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import { downloadCsv, downloadPdfTable, fmtCurrency, fmtDate } from '../utils/reportExport';

// =============================================================================
//  Types
// =============================================================================
interface Summary {
  from: string;
  to: string;
  kpi: {
    totalRevenue: number;
    totalReceived: number;
    totalOutstanding: number;
    totalStorno: number;
    invoiceCount: number;
    avgInvoice: number;
    paymentCount: number;
  };
  paymentMethods: { method: string; count: number; sum: number }[];
  invoiceTypes:   { type: string; count: number; sum: number; avg: number }[];
  statusBreakdown:{ status: string; count: number; sum: number }[];
  revenueOverTime:{ date: string; invoiced: number; count: number }[];
  paymentsOverTime:{ date: string; received: number; count: number }[];
}

interface PaymentRow {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string;
  date: string;
  amount: number;
  method: string;
  note: string | null;
  currency: string;
  invoiceTotal: number;
  invoiceStatus: string;
}

interface InvoiceRow {
  invoiceId: number;
  invoiceNumber: string;
  createdAt: string;
  invoiceDate: string | null;
  travelStartDate: string | null;
  type: string;
  customerName: string;
  customerId: number | null;
  userName: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
  currency: string;
}

interface CustomerRow {
  customerId: number;
  customerName: string;
  invoiceCount: number;
  revenue: number;
  paid: number;
  outstanding: number;
  avgInvoice: number;
}

interface AgingRow {
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  daysOutstanding: number;
  bucket: string;
  total: number;
  paid: number;
  outstanding: number;
  currency: string;
}

interface UserRow {
  userId: number;
  userName: string;
  userType: string;
  invoiceCount: number;
  nonStornoCount: number;
  stornoCount: number;
  stornoRate: number;
  revenue: number;
  avgInvoice: number;
}

type Tab = 'overview' | 'payments' | 'invoices' | 'customers' | 'aging' | 'users' | 'storno' | 'mwst';

// =============================================================================
//  Main Page
// =============================================================================
export function AccountingPage() {
  const [tab, setTab] = useState<Tab>('overview');

  // Period filter state
  const todayIso = new Date().toISOString().slice(0, 10);
  const monthAgoIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();
  const [from, setFrom] = useState<string>(monthAgoIso);
  const [to, setTo]     = useState<string>(todayIso);

  // Quick presets
  const setPreset = (preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all') => {
    const now = new Date();
    const t = now.toISOString().slice(0, 10);
    let f = t;
    switch (preset) {
      case 'today':   f = t; break;
      case 'week':    { const d = new Date(); d.setDate(d.getDate() - 7);  f = d.toISOString().slice(0, 10); break; }
      case 'month':   { const d = new Date(); d.setDate(d.getDate() - 30); f = d.toISOString().slice(0, 10); break; }
      case 'quarter': { const d = new Date(); d.setDate(d.getDate() - 90); f = d.toISOString().slice(0, 10); break; }
      case 'year':    { const d = new Date(); d.setFullYear(d.getFullYear() - 1); f = d.toISOString().slice(0, 10); break; }
      case 'all':     f = '2020-01-01'; break;
    }
    setFrom(f); setTo(t);
  };

  return (
    <div className="space-y-6 xl:-mx-8 2xl:-mx-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Buchhaltung</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Finanzberichte, Auswertungen und Exporte für Ihre Agentur.</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {([['today','Heute'],['week','7 Tage'],['month','30 Tage'],['quarter','Quartal'],['year','Jahr'],['all','Alle']] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setPreset(k)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Von</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Bis</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {([
          ['overview',  'Übersicht',     PieChartIcon],
          ['payments',  'Zahlungen',     Wallet],
          ['invoices',  'Rechnungen',    FileText],
          ['mwst',      'MWsT / UStVA',  Percent],
          ['customers', 'Top-Kunden',    Users],
          ['aging',     'Außenstände',   Clock],
          ['users',     'Mitarbeiter',   UserCog],
          ['storno',    'Stornos',       AlertCircle],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-t-lg",
              tab === key
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/10 -mb-px"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview'  && <OverviewTab from={from} to={to} />}
      {tab === 'payments'  && <PaymentsTab from={from} to={to} />}
      {tab === 'invoices'  && <InvoicesTab from={from} to={to} statusFilter={null} />}
      {tab === 'mwst'      && <MwstTab from={from} to={to} />}
      {tab === 'customers' && <CustomersTab from={from} to={to} />}
      {tab === 'aging'     && <AgingTab />}
      {tab === 'users'     && <UsersTab from={from} to={to} />}
      {tab === 'storno'    && <InvoicesTab from={from} to={to} statusFilter="storniert" />}
    </div>
  );
}

// =============================================================================
//  Helper hook + components
// =============================================================================
function useFetch<T>(url: string | null) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Fehler');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function KpiCard({ label, value, icon: Icon, color, bg, sub }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-xl', bg)}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function ExportBar({ onCsv, onPdf, disabled }: { onCsv: () => void; onPdf: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={disabled}
        onClick={onCsv}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50 disabled:opacity-40 transition-colors"
      >
        <FileSpreadsheet size={14} /> Excel (CSV)
      </button>
      <button
        disabled={disabled}
        onClick={onPdf}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50 disabled:opacity-40 transition-colors"
      >
        <FileText size={14} /> PDF
      </button>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="p-12 flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-emerald-600" size={28} />
      <p className="text-xs text-zinc-500">Lädt …</p>
    </div>
  );
}

function ErrorPanel({ msg }: { msg: string }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center gap-3 text-red-500">
      <AlertCircle size={28} />
      <p className="text-xs">{msg}</p>
    </div>
  );
}

// =============================================================================
//  OVERVIEW TAB
// =============================================================================
function OverviewTab({ from, to }: { from: string; to: string }) {
  const { data, loading, error } = useFetch<Summary>(`${API_URL}/api/Buchhaltung/summary?from=${from}&to=${to}`);

  if (loading) return <LoadingPanel />;
  if (error)   return <ErrorPanel msg={error} />;
  if (!data)   return null;

  const subPeriod = `${fmtDate(data.from)} – ${fmtDate(data.to)}`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Umsatz"        value={fmtCurrency(data.kpi.totalRevenue)}     icon={Euro}        color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" sub={subPeriod} />
        <KpiCard label="Eingenommen"   value={fmtCurrency(data.kpi.totalReceived)}    icon={ArrowUpRight} color="text-blue-600"    bg="bg-blue-50 dark:bg-blue-900/20" />
        <KpiCard label="Offen"         value={fmtCurrency(data.kpi.totalOutstanding)} icon={Clock}       color="text-orange-600"  bg="bg-orange-50 dark:bg-orange-900/20" />
        <KpiCard label="Storno"        value={fmtCurrency(data.kpi.totalStorno)}      icon={AlertCircle} color="text-red-600"     bg="bg-red-50 dark:bg-red-900/20" />
        <KpiCard label="# Rechnungen"  value={data.kpi.invoiceCount.toLocaleString('de-DE')} icon={FileText} color="text-zinc-700"  bg="bg-zinc-100 dark:bg-zinc-800" />
        <KpiCard label="Ø Rechnung"    value={fmtCurrency(data.kpi.avgInvoice)}       icon={TrendingUp}  color="text-purple-600"  bg="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue + Payments over time */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Umsatz vs. Eingang (täglich)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={mergeTimeSeries(data.revenueOverTime, data.paymentsOverTime)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip
                  formatter={(v: any) => fmtCurrency(Number(v))}
                  labelFormatter={(label: any) => fmtDate(label)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="invoiced" stroke="#10b981" name="Umsatz (Rechnungen)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" stroke="#3b82f6" name="Eingang (Zahlungen)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Pie */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Zahlungsarten</h3>
          {data.paymentMethods.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-12">Keine Zahlungen im Zeitraum</p>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    dataKey="sum"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => `${entry.method}: ${fmtCurrency(entry.sum)}`}
                    labelLine={false}
                  >
                    {data.paymentMethods.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Invoice Types Bar */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Umsatz nach Rechnungstyp</h3>
          {data.invoiceTypes.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-12">Keine Daten</p>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={data.invoiceTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RTooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                  <Bar dataKey="sum" fill="#10b981" name="Umsatz" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Breakdown Table */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Status-Aufschlüsselung</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                <th className="text-left py-2 font-bold">Status</th>
                <th className="text-right py-2 font-bold">Anzahl</th>
                <th className="text-right py-2 font-bold">Summe</th>
              </tr>
            </thead>
            <tbody>
              {data.statusBreakdown.map(s => (
                <tr key={s.status} className="border-b border-zinc-50 dark:border-zinc-800/50">
                  <td className="py-2 capitalize">{s.status}</td>
                  <td className="text-right tabular-nums">{s.count}</td>
                  <td className="text-right font-bold tabular-nums">{fmtCurrency(s.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// merge two series by date
function mergeTimeSeries(
  rev: { date: string; invoiced: number }[],
  pay: { date: string; received: number }[],
) {
  const map = new Map<string, { date: string; invoiced: number; received: number }>();
  for (const r of rev) map.set(r.date, { date: r.date, invoiced: r.invoiced, received: 0 });
  for (const p of pay) {
    const e = map.get(p.date) ?? { date: p.date, invoiced: 0, received: 0 };
    e.received = p.received;
    map.set(p.date, e);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// =============================================================================
//  PAYMENTS TAB
// =============================================================================
function PaymentsTab({ from, to }: { from: string; to: string }) {
  const [methodFilter, setMethodFilter] = useState<string>('');
  const url = `${API_URL}/api/Buchhaltung/payments?from=${from}&to=${to}${methodFilter ? `&method=${encodeURIComponent(methodFilter)}` : ''}`;
  const { data, loading, error } = useFetch<PaymentRow[]>(url);

  const total = useMemo(() => (data ?? []).reduce((s, r) => s + r.amount, 0), [data]);

  const cols = [
    { key: 'paymentId',     label: 'Z-ID',         align: 'left'  as const, width: 50  },
    { key: 'date',          label: 'Datum',        align: 'left'  as const, width: 80  },
    { key: 'invoiceNumber', label: 'Rechnung',     align: 'left'  as const, width: 90  },
    { key: 'customerName',  label: 'Kunde',        align: 'left'  as const           },
    { key: 'method',        label: 'Methode',      align: 'left'  as const, width: 110 },
    { key: 'note',          label: 'Notiz',        align: 'left'  as const           },
    { key: 'amount',        label: 'Betrag',       align: 'right' as const, width: 90  },
    { key: 'invoiceTotal',  label: 'Rechn.-Summe', align: 'right' as const, width: 110 },
    { key: 'invoiceStatus', label: 'Status',       align: 'left'  as const, width: 90  },
  ];

  const exportRows = (data ?? []).map(r => ({
    ...r,
    date: fmtDate(r.date),
    amount: r.amount,
    invoiceTotal: r.invoiceTotal,
  }));

  const onCsv = () => downloadCsv(exportRows.map(r => ({
    ...r,
    amount: String(r.amount).replace('.', ','),
    invoiceTotal: String(r.invoiceTotal).replace('.', ','),
  })), `zahlungen_${from}_${to}.csv`, cols.map(c => ({ key: c.key, label: c.label })));

  const onPdf = () => downloadPdfTable({
    title: 'Zahlungen',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}${methodFilter ? `   |   Methode: ${methodFilter}` : ''}`,
    filename: `zahlungen_${from}_${to}.pdf`,
    columns: cols,
    rows: exportRows.map(r => ({
      ...r,
      amount: fmtCurrency(r.amount, r.currency),
      invoiceTotal: fmtCurrency(r.invoiceTotal, r.currency),
    })),
    meta: [
      { label: 'Anzahl', value: String((data ?? []).length) },
      { label: 'Summe', value: fmtCurrency(total) },
    ],
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Zahlungen</h3>
          <span className="text-xs text-zinc-500">{(data ?? []).length} Einträge — Summe: <b>{fmtCurrency(total)}</b></span>
        </div>
        <div className="flex items-center gap-3">
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="">Alle Methoden</option>
            <option value="Überweisung">Überweisung</option>
            <option value="Kreditkarte">Kreditkarte</option>
            <option value="EC Karte">EC Karte</option>
            <option value="Bar">Bar</option>
          </select>
          <ExportBar onCsv={onCsv} onPdf={onPdf} disabled={!data || data.length === 0} />
        </div>
      </div>
      {loading ? <LoadingPanel /> : error ? <ErrorPanel msg={error} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Datum</th>
                <th className="px-4 py-3 text-left">Rechnung</th>
                <th className="px-4 py-3 text-left">Kunde</th>
                <th className="px-4 py-3 text-left">Methode</th>
                <th className="px-4 py-3 text-left">Notiz</th>
                <th className="px-4 py-3 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data ?? []).map(r => (
                <tr key={r.paymentId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/invoices/${r.invoiceId}`} className="text-emerald-600 font-bold hover:underline">{r.invoiceNumber}</Link>
                  </td>
                  <td className="px-4 py-2.5">{r.customerName}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      {methodIcon(r.method)} {r.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500 italic max-w-xs truncate" title={r.note ?? ''}>{r.note || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmtCurrency(r.amount, r.currency)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Keine Zahlungen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function methodIcon(method: string) {
  const m = (method ?? '').toLowerCase();
  if (m.includes('bar'))         return <Banknote size={12} />;
  if (m.includes('ec'))          return <Wallet size={12} />;
  if (m.includes('kredit'))      return <CreditCard size={12} />;
  if (m.includes('überweisung')) return <Landmark size={12} />;
  return <Wallet size={12} />;
}

// =============================================================================
//  INVOICES TAB
// =============================================================================
function InvoicesTab({ from, to, statusFilter }: { from: string; to: string; statusFilter: string | null }) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const params = new URLSearchParams({ from, to });
  if (typeFilter)   params.set('type', typeFilter);
  if (statusFilter) params.set('status', statusFilter);

  const { data, loading, error } = useFetch<InvoiceRow[]>(`${API_URL}/api/Buchhaltung/invoices?${params}`);

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      sum: rows.reduce((s, r) => s + r.total, 0),
      paid: rows.reduce((s, r) => s + r.paid, 0),
      open: rows.reduce((s, r) => s + r.balance, 0),
    };
  }, [data]);

  const cols = [
    { key: 'invoiceNumber', label: 'Rechnung',        align: 'left'  as const, width: 90 },
    { key: 'createdAt',     label: 'Erstellt',        align: 'left'  as const, width: 80 },
    { key: 'invoiceDate',   label: 'Rechn.-Datum',    align: 'left'  as const, width: 90 },
    { key: 'travelStartDate', label: 'Abreise',       align: 'left'  as const, width: 80 },
    { key: 'type',          label: 'Typ',             align: 'left'  as const, width: 70 },
    { key: 'customerName',  label: 'Kunde',           align: 'left'  as const           },
    { key: 'userName',      label: 'Mitarbeiter',     align: 'left'  as const, width: 110 },
    { key: 'total',         label: 'Summe',           align: 'right' as const, width: 80 },
    { key: 'paid',          label: 'Bezahlt',         align: 'right' as const, width: 80 },
    { key: 'balance',       label: 'Offen',           align: 'right' as const, width: 80 },
    { key: 'status',        label: 'Status',          align: 'left'  as const, width: 85 },
  ];

  const exportRows = (data ?? []);
  const filenameBase = statusFilter ? `${statusFilter}` : 'rechnungen';

  const onCsv = () => downloadCsv(
    exportRows.map(r => ({
      ...r,
      createdAt: fmtDate(r.createdAt),
      invoiceDate: fmtDate(r.invoiceDate),
      travelStartDate: fmtDate(r.travelStartDate),
      total: String(r.total).replace('.', ','),
      paid: String(r.paid).replace('.', ','),
      balance: String(r.balance).replace('.', ','),
    })),
    `${filenameBase}_${from}_${to}.csv`,
    cols.map(c => ({ key: c.key, label: c.label })),
  );

  const onPdf = () => downloadPdfTable({
    title: statusFilter ? `Rechnungen — Status: ${statusFilter}` : 'Rechnungen',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}`,
    filename: `${filenameBase}_${from}_${to}.pdf`,
    columns: cols,
    rows: exportRows.map(r => ({
      ...r,
      createdAt: fmtDate(r.createdAt),
      invoiceDate: fmtDate(r.invoiceDate),
      travelStartDate: fmtDate(r.travelStartDate),
      total: fmtCurrency(r.total, r.currency),
      paid: fmtCurrency(r.paid, r.currency),
      balance: fmtCurrency(r.balance, r.currency),
    })),
    meta: [
      { label: 'Anzahl', value: String((data ?? []).length) },
      { label: 'Summe',  value: fmtCurrency(totals.sum) },
      { label: 'Offen',  value: fmtCurrency(totals.open) },
    ],
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{statusFilter === 'storniert' ? 'Stornierte Rechnungen' : 'Rechnungen'}</h3>
          <span className="text-xs text-zinc-500">
            {(data ?? []).length} Einträge — Summe: <b>{fmtCurrency(totals.sum)}</b> · Bezahlt: <b className="text-emerald-600">{fmtCurrency(totals.paid)}</b> · Offen: <b className="text-orange-600">{fmtCurrency(totals.open)}</b>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="">Alle Typen</option>
            <option value="Flug">Flug</option>
            <option value="Hotel">Hotel</option>
            <option value="Pauschal">Pauschal</option>
          </select>
          <ExportBar onCsv={onCsv} onPdf={onPdf} disabled={!data || data.length === 0} />
        </div>
      </div>
      {loading ? <LoadingPanel /> : error ? <ErrorPanel msg={error} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-3 py-3 text-left">Rechnung</th>
                <th className="px-3 py-3 text-left">Erstellt</th>
                <th className="px-3 py-3 text-left">Typ</th>
                <th className="px-3 py-3 text-left">Kunde</th>
                <th className="px-3 py-3 text-left">Mitarbeiter</th>
                <th className="px-3 py-3 text-right">Summe</th>
                <th className="px-3 py-3 text-right">Bezahlt</th>
                <th className="px-3 py-3 text-right">Offen</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data ?? []).map(r => (
                <tr key={r.invoiceId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-3 py-2.5">
                    <Link to={`/invoices/${r.invoiceId}`} className="text-emerald-600 font-bold hover:underline">{r.invoiceNumber}</Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="px-3 py-2.5">{r.type}</td>
                  <td className="px-3 py-2.5">{r.customerName}</td>
                  <td className="px-3 py-2.5">{r.userName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{fmtCurrency(r.total, r.currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">{fmtCurrency(r.paid, r.currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-orange-600">{fmtCurrency(r.balance, r.currency)}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                      r.status === 'bezahlt' ? 'bg-emerald-50 text-emerald-600' :
                      r.status === 'offen' ? 'bg-orange-50 text-orange-600' :
                      r.status === 'storniert' ? 'bg-red-50 text-red-600' :
                      r.status === 'zusammengeführt' ? 'bg-zinc-100 text-zinc-500' :
                      'bg-blue-50 text-blue-600'
                    )}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-400">Keine Rechnungen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  CUSTOMERS TAB
// =============================================================================
function CustomersTab({ from, to }: { from: string; to: string }) {
  const { data, loading, error } = useFetch<CustomerRow[]>(`${API_URL}/api/Buchhaltung/customers?from=${from}&to=${to}`);

  const cols = [
    { key: 'customerName', label: 'Kunde',           align: 'left'  as const           },
    { key: 'invoiceCount', label: '# Rechnungen',    align: 'right' as const, width: 90 },
    { key: 'revenue',      label: 'Umsatz',          align: 'right' as const, width: 100 },
    { key: 'paid',         label: 'Bezahlt',         align: 'right' as const, width: 100 },
    { key: 'outstanding',  label: 'Offen',           align: 'right' as const, width: 100 },
    { key: 'avgInvoice',   label: 'Ø Rechnung',      align: 'right' as const, width: 100 },
  ];

  const onCsv = () => downloadCsv(
    (data ?? []).map(r => ({
      ...r,
      revenue:     String(r.revenue).replace('.', ','),
      paid:        String(r.paid).replace('.', ','),
      outstanding: String(r.outstanding).replace('.', ','),
      avgInvoice:  String(r.avgInvoice).replace('.', ','),
    })),
    `top_kunden_${from}_${to}.csv`,
    cols.map(c => ({ key: c.key, label: c.label })),
  );
  const onPdf = () => downloadPdfTable({
    title: 'Top-Kunden nach Umsatz',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}`,
    filename: `top_kunden_${from}_${to}.pdf`,
    columns: cols,
    rows: (data ?? []).map(r => ({
      ...r,
      revenue: fmtCurrency(r.revenue),
      paid: fmtCurrency(r.paid),
      outstanding: fmtCurrency(r.outstanding),
      avgInvoice: fmtCurrency(r.avgInvoice),
    })),
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Top-Kunden nach Umsatz</h3>
        <ExportBar onCsv={onCsv} onPdf={onPdf} disabled={!data || data.length === 0} />
      </div>
      {loading ? <LoadingPanel /> : error ? <ErrorPanel msg={error} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Kunde</th>
                <th className="px-4 py-3 text-right"># Rechn.</th>
                <th className="px-4 py-3 text-right">Umsatz</th>
                <th className="px-4 py-3 text-right">Bezahlt</th>
                <th className="px-4 py-3 text-right">Offen</th>
                <th className="px-4 py-3 text-right">Ø Rechn.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data ?? []).map((r, i) => (
                <tr key={r.customerId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5 font-bold text-zinc-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-bold">{r.customerName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.invoiceCount}</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmtCurrency(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{fmtCurrency(r.paid)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{fmtCurrency(r.outstanding)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(r.avgInvoice)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">Keine Kunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  AGING TAB
// =============================================================================
function AgingTab() {
  const { data, loading, error } = useFetch<{ rows: AgingRow[]; summary: { bucket: string; count: number; outstanding: number }[] }>(
    `${API_URL}/api/Buchhaltung/aging`,
  );

  const cols = [
    { key: 'invoiceNumber',   label: 'Rechnung',     align: 'left'  as const, width: 90 },
    { key: 'customerName',    label: 'Kunde',        align: 'left'  as const           },
    { key: 'invoiceDate',     label: 'Rechn.-Datum', align: 'left'  as const, width: 90 },
    { key: 'daysOutstanding', label: 'Tage offen',   align: 'right' as const, width: 80 },
    { key: 'bucket',          label: 'Bucket',       align: 'left'  as const, width: 110 },
    { key: 'total',           label: 'Summe',        align: 'right' as const, width: 90 },
    { key: 'paid',            label: 'Bezahlt',      align: 'right' as const, width: 90 },
    { key: 'outstanding',     label: 'Offen',        align: 'right' as const, width: 90 },
  ];

  const onCsv = () => downloadCsv(
    (data?.rows ?? []).map(r => ({
      ...r,
      invoiceDate: fmtDate(r.invoiceDate),
      total:       String(r.total).replace('.', ','),
      paid:        String(r.paid).replace('.', ','),
      outstanding: String(r.outstanding).replace('.', ','),
    })),
    `aussenstaende_${new Date().toISOString().slice(0,10)}.csv`,
    cols.map(c => ({ key: c.key, label: c.label })),
  );
  const onPdf = () => downloadPdfTable({
    title: 'Außenstände (Aging-Report)',
    subtitle: `Stand: ${fmtDate(new Date().toISOString())}`,
    filename: `aussenstaende_${new Date().toISOString().slice(0,10)}.pdf`,
    columns: cols,
    rows: (data?.rows ?? []).map(r => ({
      ...r,
      invoiceDate: fmtDate(r.invoiceDate),
      total: fmtCurrency(r.total, r.currency),
      paid: fmtCurrency(r.paid, r.currency),
      outstanding: fmtCurrency(r.outstanding, r.currency),
    })),
  });

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.summary.map((b, i) => (
            <KpiCard
              key={b.bucket}
              label={b.bucket}
              value={fmtCurrency(b.outstanding)}
              icon={Clock}
              color={['text-yellow-600','text-orange-600','text-red-500','text-red-700'][i] || 'text-zinc-700'}
              bg={['bg-yellow-50 dark:bg-yellow-900/20','bg-orange-50 dark:bg-orange-900/20','bg-red-50 dark:bg-red-900/20','bg-red-100 dark:bg-red-900/30'][i] || 'bg-zinc-100'}
              sub={`${b.count} Rechnungen`}
            />
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Offene Rechnungen — Detail</h3>
          <ExportBar onCsv={onCsv} onPdf={onPdf} disabled={!data || data.rows.length === 0} />
        </div>
        {loading ? <LoadingPanel /> : error ? <ErrorPanel msg={error} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
                <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Rechnung</th>
                  <th className="px-4 py-3 text-left">Kunde</th>
                  <th className="px-4 py-3 text-left">Rechn.-Datum</th>
                  <th className="px-4 py-3 text-right">Tage</th>
                  <th className="px-4 py-3 text-left">Bucket</th>
                  <th className="px-4 py-3 text-right">Offen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(data?.rows ?? []).map(r => (
                  <tr key={r.invoiceId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-2.5">
                      <Link to={`/invoices/${r.invoiceId}`} className="text-emerald-600 font-bold hover:underline">{r.invoiceNumber}</Link>
                    </td>
                    <td className="px-4 py-2.5">{r.customerName}</td>
                    <td className="px-4 py-2.5">{fmtDate(r.invoiceDate)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold">{r.daysOutstanding}</td>
                    <td className="px-4 py-2.5">{r.bucket}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-orange-600">{fmtCurrency(r.outstanding, r.currency)}</td>
                  </tr>
                ))}
                {(data?.rows ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Keine offenen Rechnungen</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
//  USERS TAB
// =============================================================================
function UsersTab({ from, to }: { from: string; to: string }) {
  const { data, loading, error } = useFetch<UserRow[]>(`${API_URL}/api/Buchhaltung/users?from=${from}&to=${to}`);

  const cols = [
    { key: 'userName',       label: 'Mitarbeiter',  align: 'left'  as const           },
    { key: 'userType',       label: 'Rolle',        align: 'left'  as const, width: 80 },
    { key: 'invoiceCount',   label: '# Rechn.',     align: 'right' as const, width: 80 },
    { key: 'nonStornoCount', label: '# Aktiv',      align: 'right' as const, width: 80 },
    { key: 'stornoCount',    label: '# Storno',     align: 'right' as const, width: 80 },
    { key: 'stornoRate',     label: 'Storno-Rate %',align: 'right' as const, width: 100 },
    { key: 'revenue',        label: 'Umsatz',       align: 'right' as const, width: 110 },
    { key: 'avgInvoice',     label: 'Ø Rechn.',     align: 'right' as const, width: 100 },
  ];

  const onCsv = () => downloadCsv(
    (data ?? []).map(r => ({
      ...r,
      stornoRate: String(r.stornoRate).replace('.', ','),
      revenue:    String(r.revenue).replace('.', ','),
      avgInvoice: String(r.avgInvoice).replace('.', ','),
    })),
    `mitarbeiter_${from}_${to}.csv`,
    cols.map(c => ({ key: c.key, label: c.label })),
  );
  const onPdf = () => downloadPdfTable({
    title: 'Mitarbeiter-Performance',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}`,
    filename: `mitarbeiter_${from}_${to}.pdf`,
    columns: cols,
    rows: (data ?? []).map(r => ({
      ...r,
      stornoRate: `${r.stornoRate}%`,
      revenue: fmtCurrency(r.revenue),
      avgInvoice: fmtCurrency(r.avgInvoice),
    })),
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Mitarbeiter-Performance</h3>
        <ExportBar onCsv={onCsv} onPdf={onPdf} disabled={!data || data.length === 0} />
      </div>
      {loading ? <LoadingPanel /> : error ? <ErrorPanel msg={error} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Mitarbeiter</th>
                <th className="px-4 py-3 text-left">Rolle</th>
                <th className="px-4 py-3 text-right"># Rechn.</th>
                <th className="px-4 py-3 text-right">Aktiv</th>
                <th className="px-4 py-3 text-right">Storno</th>
                <th className="px-4 py-3 text-right">Storno-%</th>
                <th className="px-4 py-3 text-right">Umsatz</th>
                <th className="px-4 py-3 text-right">Ø Rechn.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data ?? []).map(r => (
                <tr key={r.userId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5 font-bold">{r.userName}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] uppercase font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{r.userType}</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.invoiceCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{r.nonStornoCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-500">{r.stornoCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.stornoRate}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold">{fmtCurrency(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(r.avgInvoice)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-400">Keine Daten</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  MWsT / UMSATZSTEUER TAB — Für die Vorbereitung der Umsatzsteuer-Voranmeldung (UStVA)
// =============================================================================
interface MwstKpi {
  nettoWithVat: number;
  ustTotal: number;
  bruttoTotal: number;
  nettoNoVat: number;
  gesamtUmsatz: number;
  countWithVat: number;
  countNoVat: number;
  countTotal: number;
}
interface MwstMonthly {
  year: number; month: number;
  label: string; monthName: string;
  count: number; countWithVat: number;
  netto: number; ust: number; brutto: number; nettoNoVat: number;
}
interface MwstDetailRow {
  invoiceId: number; invoiceNumber: string;
  invoiceDate: string;
  customerName: string; type: string;
  netto: number; ustRate: number; ustAmount: number; brutto: number;
  hasMwst: boolean; currency: string;
}
interface MwstResponse {
  from: string; to: string;
  kpi: MwstKpi;
  monthly: MwstMonthly[];
  details: MwstDetailRow[];
}

function MwstTab({ from, to }: { from: string; to: string }) {
  const { data, loading, error } = useFetch<MwstResponse>(`${API_URL}/api/Buchhaltung/mwst?from=${from}&to=${to}`);

  const detailCols = [
    { key: 'invoiceNumber', label: 'Rechnung',     align: 'left'  as const, width: 95 },
    { key: 'invoiceDate',   label: 'Datum',        align: 'left'  as const, width: 85 },
    { key: 'type',          label: 'Typ',          align: 'left'  as const, width: 75 },
    { key: 'customerName',  label: 'Kunde',        align: 'left'  as const           },
    { key: 'netto',         label: 'Netto',        align: 'right' as const, width: 95 },
    { key: 'ustRate',       label: 'USt-Satz',     align: 'right' as const, width: 70 },
    { key: 'ustAmount',     label: 'USt-Betrag',   align: 'right' as const, width: 100 },
    { key: 'brutto',        label: 'Brutto',       align: 'right' as const, width: 100 },
  ];

  const monthlyCols = [
    { key: 'monthName', label: 'Monat',       align: 'left'  as const           },
    { key: 'count',     label: '# Rechn.',    align: 'right' as const, width: 80 },
    { key: 'netto',     label: 'Netto',       align: 'right' as const, width: 110 },
    { key: 'ust',       label: 'USt 19%',     align: 'right' as const, width: 110 },
    { key: 'brutto',    label: 'Brutto',      align: 'right' as const, width: 110 },
    { key: 'nettoNoVat',label: 'Ohne USt',    align: 'right' as const, width: 110 },
  ];

  const onCsvDetails = () => downloadCsv(
    (data?.details ?? []).map(r => ({
      ...r,
      invoiceDate: fmtDate(r.invoiceDate),
      netto:     String(r.netto).replace('.', ','),
      ustRate:   r.hasMwst ? `${Math.round(r.ustRate * 100)}%` : '—',
      ustAmount: String(r.ustAmount).replace('.', ','),
      brutto:    String(r.brutto).replace('.', ','),
    })),
    `umsatzsteuer_${from}_${to}.csv`,
    detailCols.map(c => ({ key: c.key, label: c.label })),
  );

  const onPdfDetails = () => downloadPdfTable({
    title: 'Umsatzsteuer — Detail',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}   |   Hinweis: Unterstützt die UStVA. Für Einreichung Steuerberater konsultieren.`,
    filename: `umsatzsteuer_${from}_${to}.pdf`,
    columns: detailCols,
    rows: (data?.details ?? []).map(r => ({
      ...r,
      invoiceDate: fmtDate(r.invoiceDate),
      netto:     fmtCurrency(r.netto, r.currency),
      ustRate:   r.hasMwst ? `${Math.round(r.ustRate * 100)}%` : '—',
      ustAmount: r.hasMwst ? fmtCurrency(r.ustAmount, r.currency) : '—',
      brutto:    fmtCurrency(r.brutto, r.currency),
    })),
    meta: data ? [
      { label: 'Netto (steuerpfl.)', value: fmtCurrency(data.kpi.nettoWithVat) },
      { label: 'USt eingenommen',    value: fmtCurrency(data.kpi.ustTotal) },
      { label: 'Brutto',             value: fmtCurrency(data.kpi.bruttoTotal) },
      { label: 'Ohne USt',           value: fmtCurrency(data.kpi.nettoNoVat) },
    ] : [],
  });

  const onCsvMonthly = () => downloadCsv(
    (data?.monthly ?? []).map(m => ({
      ...m,
      netto:      String(m.netto).replace('.', ','),
      ust:        String(m.ust).replace('.', ','),
      brutto:     String(m.brutto).replace('.', ','),
      nettoNoVat: String(m.nettoNoVat).replace('.', ','),
    })),
    `ustva_monatlich_${from}_${to}.csv`,
    monthlyCols.map(c => ({ key: c.key, label: c.label })),
  );

  const onPdfMonthly = () => downloadPdfTable({
    title: 'Umsatzsteuer — Monatliche Aufschlüsselung (UStVA-Hilfe)',
    subtitle: `Zeitraum: ${fmtDate(from)} – ${fmtDate(to)}`,
    filename: `ustva_monatlich_${from}_${to}.pdf`,
    columns: monthlyCols,
    rows: (data?.monthly ?? []).map(m => ({
      ...m,
      netto:      fmtCurrency(m.netto),
      ust:        fmtCurrency(m.ust),
      brutto:     fmtCurrency(m.brutto),
      nettoNoVat: fmtCurrency(m.nettoNoVat),
    })),
  });

  if (loading) return <LoadingPanel />;
  if (error)   return <ErrorPanel msg={error} />;
  if (!data)   return null;

  const kpi = data.kpi;
  const subPeriod = `${fmtDate(data.from)} – ${fmtDate(data.to)}`;

  return (
    <div className="space-y-6">
      {/* Steuerberater-Hinweis */}
      <div className="p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 flex items-start gap-3">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <p className="font-bold mb-1">Hinweis zur Umsatzsteuer-Voranmeldung (UStVA)</p>
          <p>
            Diese Auswertung unterstützt die Vorbereitung Ihrer monatlichen/quartalsweisen Umsatzsteuer-Voranmeldung beim Finanzamt. Sie zeigt
            die <b>USt-pflichtigen Umsätze (Netto)</b>, die <b>eingenommene Umsatzsteuer (19%)</b>, sowie steuerfreie Umsätze (z.B. nach
            §19 UStG Kleinunternehmer oder §25 UStG Margensteuerung). Für die offizielle Einreichung bitte Steuerberater konsultieren —
            insbesondere bei Reiseleistungen kann die <b>Margenbesteuerung (§25 UStG)</b> abweichende Berechnungsregeln vorsehen.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Netto (steuerpfl.)"
          value={fmtCurrency(kpi.nettoWithVat)}
          icon={Euro}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
          sub={`${kpi.countWithVat} Rechn.`}
        />
        <KpiCard
          label="USt eingenommen"
          value={fmtCurrency(kpi.ustTotal)}
          icon={Percent}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
          sub="An Finanzamt"
        />
        <KpiCard
          label="Brutto (steuerpfl.)"
          value={fmtCurrency(kpi.bruttoTotal)}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          sub="Netto + USt"
        />
        <KpiCard
          label="Ohne USt"
          value={fmtCurrency(kpi.nettoNoVat)}
          icon={Receipt}
          color="text-zinc-600"
          bg="bg-zinc-100 dark:bg-zinc-800"
          sub={`${kpi.countNoVat} Rechn. (§19/§25)`}
        />
        <KpiCard
          label="Gesamt-Umsatz"
          value={fmtCurrency(kpi.gesamtUmsatz)}
          icon={Euro}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-900/20"
          sub={subPeriod}
        />
      </div>

      {/* Monthly Chart */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
          <Percent size={14} className="text-red-600" /> USt pro Monat (UStVA-Vorbereitung)
        </h3>
        {data.monthly.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-12">Keine Daten im Zeitraum</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="netto" stackId="a" fill="#3b82f6" name="Netto" />
                <Bar dataKey="ust"   stackId="a" fill="#ef4444" name="USt 19%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Monatliche Aufschlüsselung</h3>
          <ExportBar onCsv={onCsvMonthly} onPdf={onPdfMonthly} disabled={!data || data.monthly.length === 0} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Monat</th>
                <th className="px-4 py-3 text-right"># Rechn.</th>
                <th className="px-4 py-3 text-right">Netto</th>
                <th className="px-4 py-3 text-right">USt 19%</th>
                <th className="px-4 py-3 text-right">Brutto</th>
                <th className="px-4 py-3 text-right">Ohne USt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.monthly.map(m => (
                <tr key={m.label} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5 font-bold">{m.monthName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{m.count} <span className="text-zinc-400">({m.countWithVat} m. USt)</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(m.netto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-red-600">{fmtCurrency(m.ust)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold">{fmtCurrency(m.brutto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{fmtCurrency(m.nettoNoVat)}</td>
                </tr>
              ))}
              {data.monthly.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Keine Daten</td></tr>
              )}
            </tbody>
            {data.monthly.length > 0 && (
              <tfoot className="bg-zinc-50 dark:bg-zinc-800/50 font-bold">
                <tr>
                  <td className="px-4 py-3">Gesamt</td>
                  <td className="px-4 py-3 text-right tabular-nums">{kpi.countTotal}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtCurrency(kpi.nettoWithVat)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">{fmtCurrency(kpi.ustTotal)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtCurrency(kpi.bruttoTotal)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtCurrency(kpi.nettoNoVat)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Detail — alle Rechnungen mit/ohne USt</h3>
          <ExportBar onCsv={onCsvDetails} onPdf={onPdfDetails} disabled={!data || data.details.length === 0} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <tr className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-3 py-3 text-left">Rechnung</th>
                <th className="px-3 py-3 text-left">Datum</th>
                <th className="px-3 py-3 text-left">Typ</th>
                <th className="px-3 py-3 text-left">Kunde</th>
                <th className="px-3 py-3 text-right">Netto</th>
                <th className="px-3 py-3 text-right">USt-Satz</th>
                <th className="px-3 py-3 text-right">USt-Betrag</th>
                <th className="px-3 py-3 text-right">Brutto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.details.map(r => (
                <tr key={r.invoiceId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-3 py-2.5">
                    <Link to={`/invoices/${r.invoiceId}`} className="text-emerald-600 font-bold font-mono hover:underline">{r.invoiceNumber}</Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(r.invoiceDate)}</td>
                  <td className="px-3 py-2.5">{r.type}</td>
                  <td className="px-3 py-2.5">{r.customerName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtCurrency(r.netto, r.currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.hasMwst
                      ? <span className="font-bold text-red-600">{Math.round(r.ustRate * 100)}%</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.hasMwst ? fmtCurrency(r.ustAmount, r.currency) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{fmtCurrency(r.brutto, r.currency)}</td>
                </tr>
              ))}
              {data.details.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-400">Keine Rechnungen im Zeitraum</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
