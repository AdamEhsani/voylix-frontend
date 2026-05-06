import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Landmark,
  Check,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { API_URL } from "../config/api";
import { toast } from 'sonner';

// Voylix: clean DTO ke AddPaymentController mifreste
interface PaymentDetail {
  invoiceId: number;
  invoiceNumber?: string | null;
  invoiceType?: string | null;
  invoiceStatus?: string | null;
  invoiceTotal: number;
  invoicePaidAmount: number;
  invoiceBalance: number;
  currency?: string | null;
  paymentMethod?: string | null;
  paymentDate?: string | null;     // yyyy-MM-dd
  customerId?: number | null;
  customerName?: string | null;
}

export function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail]   = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Form state
  const [amount, setAmount]           = useState('');
  const [method, setMethod]           = useState<string>('Überweisung');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10) // default emrooz
  );
  const [note, setNote]               = useState<string>('');
  const [isSaving, setIsSaving]       = useState(false);

  const paymentMethods = [
    { id: 'Überweisung', icon: Landmark,  label: 'Überweisung' },
    { id: 'Kreditkarte', icon: CreditCard, label: 'Kreditkarte' },
    { id: 'EC Karte',    icon: Wallet,     label: 'EC Karte'    },
    { id: 'Bar',         icon: Banknote,   label: 'Bar'         },
  ];

  // -------- Load --------
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/api/AddPayment/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Fehler beim Laden');

        const data = (await res.json()) as PaymentDetail;
        setDetail(data);

        // method default az invoice begir agar dasht
        if (data.paymentMethod) setMethod(data.paymentMethod);
        if (data.paymentDate)   setPaymentDate(data.paymentDate);
      } catch (err: any) {
        setError(err.message ?? 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // -------- Save --------
  const handleSave = async () => {
    if (!detail || !id) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Bitte einen gültigen Betrag eingeben.');
      return;
    }
    if (!paymentDate) {
      toast.error('Bitte ein Datum auswählen.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/AddPayment/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amt,
          method: method,
          date:   paymentDate,    // ISO yyyy-MM-dd
          note:   note.trim() || null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Zahlung konnte nicht gespeichert werden.');
      }

      toast.success('Zahlung wurde erfasst.');
      navigate('/accounting');
    } catch (err: any) {
      toast.error(err.message ?? 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // -------- Loading / Error --------
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-red-500 font-bold">{error ?? 'Rechnung nicht gefunden.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
        >
          Zurück
        </button>
      </div>
    );
  }

  // -------- Derived numbers --------
  const total      = Number(detail.invoiceTotal      ?? 0);
  const alreadyPaid = Number(detail.invoicePaidAmount ?? 0);
  const remaining  = Math.max(0, total - alreadyPaid);
  const enteredAmt = parseFloat(amount) || 0;
  const newPaid    = alreadyPaid + enteredAmt;
  const newBalance = total - newPaid;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Bezahlt Detail</h1>
          <p className="text-sm text-zinc-500">
            Zahlung erfassen für{' '}
            <span className="font-semibold">
              {detail.invoiceNumber ?? `RE-${detail.invoiceId}`}
            </span>
            {detail.customerName ? ` — ${detail.customerName}` : ''}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Betrag</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">€</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-3xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <p className="text-zinc-400 italic">Gesamtbetrag der Rechnung:</p>
              <p className="text-right font-semibold text-zinc-600 dark:text-zinc-300">
                {formatCurrency(total)}
              </p>
              <p className="text-zinc-400 italic">Bereits bezahlt:</p>
              <p className="text-right font-semibold text-emerald-600">
                {formatCurrency(alreadyPaid)}
              </p>
              <p className="text-zinc-400 italic">Verbleibender Betrag:</p>
              <p className="text-right font-semibold text-red-500">
                {formatCurrency(remaining)}
              </p>
              {enteredAmt > 0 && (
                <>
                  <p className="text-zinc-500 italic mt-1">Nach dieser Zahlung:</p>
                  <p className="text-right font-bold mt-1 text-zinc-900 dark:text-white">
                    {formatCurrency(Math.max(0, newBalance))} offen
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Date Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Datum</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Zahlungsart</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    method === m.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    method === m.id ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    <m.icon size={20} />
                  </div>
                  <span className="font-bold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notiz */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Notiz (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="z.B. Kunde ist mit Restbetrag im Verzug, Zahlungsabsprache, Sonderkonditionen ..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-y"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex gap-3">
            <AlertCircle className="text-blue-500 shrink-0" size={20} />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Die Zahlung wird sofort verbucht und der Status der Rechnung auf "bezahlt" oder "teilweise_bezahlt" aktualisiert.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !amount || !paymentDate}
            className="flex-[2] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={20} />
            )}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
