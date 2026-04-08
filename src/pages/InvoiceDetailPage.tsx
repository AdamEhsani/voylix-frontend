import React, { useState, useEffect } from 'react';
import { InvoiceRenderer } from '../components/InvoiceRenderer';
import { TravelInvoice, PaymentEntry } from '../types';
import { Printer, Download, ArrowLeft, Share2, CreditCard, Landmark, Banknote, Train, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../utils';
const API_URL="https://api.voylix.de";
export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TravelInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Überweisung');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_URL}/api/uploadedFiles/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!res.ok) throw new Error("Failed to fetch invoice data");

        const file = await res.json();

        // Ensure the data structure matches TravelInvoice
        const extractedData =
          typeof file.extractedJson === "string"
            ? JSON.parse(file.extractedJson)
            : file.extractedJson;

        // Robust initialization of payments object
        const payments = {
          invoice_total: Number(extractedData.payments?.invoice_total) || 0,
          invoice_paid_amount: Number(extractedData.payments?.invoice_paid_amount) || 0,
          invoice_balance: Number(extractedData.payments?.invoice_balance) || 0,
          currency: extractedData.payments?.currency || "EUR",
          payment_method: extractedData.payments?.payment_method || "Überweisung",
          payment_date: extractedData.payments?.payment_date || null,
          line_items: extractedData.payments?.line_items || [],
          entries: extractedData.payments?.entries || []
        };

        setData({
          ...extractedData, 
          id: id,
          payments: payments
        });
      } catch (error) {
        console.error("Error loading invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const paymentMethods = [
    { id: 'Überweisung', icon: Landmark, label: 'Überweisung' },
    { id: 'Kreditkarte', icon: CreditCard, label: 'Kreditkarte' },
    { id: 'ICE Karte', icon: Train, label: 'ICE Karte' },
    { id: 'Bar', icon: Banknote, label: 'Bar' },
  ];

  const handleSavePayment = async () => {
    if (!amount || parseFloat(amount) <= 0 || !data) return;

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const newEntry: PaymentEntry = {
      id: Math.random().toString(36).substr(2, 9),
      amount: parseFloat(amount),
      method: method,
      date: new Date().toLocaleDateString('de-DE'),
      status: 'paid'
    };

    setData(prev => {
      if (!prev) return null;
      const newPaidAmount = (Number(prev.payments.invoice_paid_amount) || 0) + newEntry.amount;
      const newBalance = (Number(prev.payments.invoice_total) || 0) - newPaidAmount;

      return {
        ...prev,
        payments: {
          ...prev.payments,
          invoice_paid_amount: newPaidAmount,
          invoice_balance: newBalance,
          entries: [...(prev.payments.entries || []), newEntry]
        }
      };
    });

    setAmount('');
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-zinc-500">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="font-medium">Rechnungsdetails werden geladen...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-zinc-500">
        <AlertCircle size={40} className="text-red-500" />
        <p className="font-medium">Rechnung konnte nicht gefunden werden.</p>
        <button onClick={() => navigate(-1)} className="text-emerald-600 font-bold hover:underline">Zurück</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Rechnung bearbeiten</h1>
            <p className="text-sm text-zinc-500">Passen Sie alle Details der Rechnung an</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <Share2 size={16} /> Teilen
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pb-20">
        <InvoiceRenderer
          data={data}
          onUpdate={setData}
          onSave={() => {
            setIsSaving(true);
            setTimeout(() => {
              setIsSaving(false);
              alert('Rechnung erfolgreich gespeichert!');
            }, 1000);
          }}
        />

        {/* Payment Form - Keep it as a separate section for professional bookkeeping */}


        {/* <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden print:hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Zahlung erfassen</h3>
            <p className="text-sm text-zinc-500">Buchen Sie eine neue Zahlung für diese Rechnung</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mablagh Faktor (Betrag)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>


              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Raveshe Pardakht (Zahlungsart)</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        method === m.id
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600"
                          : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        method === m.id ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-zinc-100 dark:bg-zinc-800"
                      )}>
                        <m.icon size={16} />
                      </div>
                      <span className="font-bold text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <AlertCircle size={14} />
                <span>Zahlung wird sofort im Verlauf oben angezeigt</span>
              </div>
              <button
                onClick={handleSavePayment}
                disabled={isSaving || !amount}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
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
        </div> */}
        
      </div>
    </div>
  );
}
