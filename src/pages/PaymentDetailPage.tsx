import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Landmark,
  Check,
  AlertCircle,
  Train
} from 'lucide-react';
import { formatCurrency, cn } from '../utils';

export function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Überweisung');
  const [isSaving, setIsSaving] = useState(false);
  const API_URL="https://api.voylix.de";
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState(null);

  // In a real app, we would fetch the invoice details here
  const invoiceNumber = `RE-2026-00${id}`;

  const paymentMethods = [
    { id: 'Überweisung', icon: Landmark, label: 'Überweisung' },
    { id: 'Kreditkarte', icon: CreditCard, label: 'Kreditkarte' },
    { id: 'ICE Karte', icon: Train, label: 'ICE Karte' },
    { id: 'Bar', icon: Banknote, label: 'Bar' },
  ];

useEffect(() => {
  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/Invoices/InvoiceUpdate/${id}`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Fehler beim Laden");
      }

      const data = await response.json();

      // ✅ گرفتن فایل
      const file = data?.fiel?.[0];

      // ✅ parse کردن extractedJson
      let parsed = null;
      if (file?.extractedJson) {
        try {
          parsed = JSON.parse(file.extractedJson);
        } catch (e) {
          console.error("JSON parse error", e);
        }
      }

      // ✅ گرفتن payments
      const extractedPayments = parsed?.payments || null;

      setInvoice(data);
      setPayments(extractedPayments);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchInvoice();
  }
}, [id]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSaving(true);
    try {

      setIsSaving(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/update/PriceUpdate/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method: method
        })
      });

      if (!res.ok) {
        throw new Error("Payment update failed");
      }

      navigate('/invoices');

    } catch (err) {

      console.error("Payment error:", err);

    } finally {

      setIsSaving(false);

    }
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);

    // Redirect back to invoices list
    navigate('/invoices');
  };

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
          <p className="text-sm text-zinc-500">Zahlung erfassen für {invoiceNumber}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Mablagh Faktor (Betrag)</label>
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
            <p className="text-xs text-zinc-400 italic">Gesamtbetrag der Rechnung: {formatCurrency(payments?.invoice_total)}</p>
            <p className="text-xs text-zinc-400 italic">Bereits bezahlt: {formatCurrency(payments?.invoice_balance || 0)}</p>
            <p className="text-xs text-red-400 italic">Verbleibender Betrag: {formatCurrency(payments?.invoice_total - (payments?.invoice_balance || 0))}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Raveshe Pardakht (Zahlungsart)</label>
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

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex gap-3">
            <AlertCircle className="text-blue-500 shrink-0" size={20} />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Die Zahlung wird sofort verbucht und der Status der Rechnung auf "Bezahlt" oder "Teilweise Bezahlt" aktualisiert.
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
            disabled={isSaving || !amount}
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
