import { API_URL } from '../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { InvoiceRenderer } from '../components/InvoiceRenderer';
import { InvoicePreview } from '../components/InvoicePreview';
import { ShareModal } from '../components/ShareModel';
import { TravelInvoice, PaymentEntry, InvoiceDesignerSettings } from '../types';
import { Printer, Download, ArrowLeft, Share2, CreditCard, Landmark, Banknote, Train, Check, AlertCircle, Loader2, Ban } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../utils';
import { generateInvoicePdf } from '../utils/pdfExport';
import { toast } from 'sonner';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TravelInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Überweisung');
  const [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString('de-DE'));
  const [isSaving, setIsSaving] = useState(false);
  const [isStornieren, setIsStornieren] = useState(false);

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [shareFileData, setShareFileData] = useState<{ base64: string; fileName: string } | null>(null);
  const [printSettings, setPrintSettings] = useState<InvoiceDesignerSettings | null>(null);
  const [agencyLogoPath, setAgencyLogoPath] = useState<string | null>(null);
  const sharePreviewRef = useRef<HTMLDivElement>(null);

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
        const extractedData = typeof file.extractedJson === 'string' 
          ? JSON.parse(file.extractedJson) 
          : file.extractedJson || {};
        
        // Robust initialization of payments object
        const payments = {
          invoice_total: extractedData.payments?.invoice_total || 0,
          invoice_paid_amount: extractedData.payments?.invoice_paid_amount || 0,
          invoice_balance: extractedData.payments?.invoice_balance || 0,
          invoice_status: extractedData.payments?.invoice_status || "offen",
          currency: extractedData.payments?.currency || "EUR",
          payment_method: extractedData.payments?.payment_method || "Überweisung",
          payment_date: extractedData.payments?.payment_date || null,
          line_items: extractedData.payments?.line_items || [],
          entries: extractedData.payments?.entries || []
        };
        // Robust initialization of customer object
        const customer = {
          customer_number: extractedData.customer?.customer_number || "",
          company_name: extractedData.customer?.company_name || file.customerName || "",
          company_type: extractedData.customer?.company_type || "",
          email: extractedData.customer?.email || file.customerEmail || file.email || "",
          phone: extractedData.customer?.phone || file.customerPhone || file.phone || "",
          address: extractedData.customer?.address || { street: "", PostalCode: "", city: "", country: "" }
        };
        setData({
          ...extractedData,
          id: id,
          customer: customer,
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
      date: paymentDate,
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

  const handleStornieren = async () => {
    if (!data || !id) return;
    if (!window.confirm("Möchten Sie diese Rechnung wirklich stornieren?")) return;

    setIsStornieren(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/SaveInvoice/storno/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Rechnung wurde storniert.");
        setData(prev => prev ? { ...prev, payments: { ...prev.payments, invoice_status: 'storniert' } } : null);
      } else {
        throw new Error("Fehler beim Stornieren.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsStornieren(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    
    // Just open the modal now, it will handle PDF generation if needed or we can do it here
    // User wants a "toolbar" like new invoice.
    setIsShareModalOpen(true);
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
          <button 
            onClick={handleStornieren}
            disabled={isStornieren || data.payments.invoice_status === 'storniert'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isStornieren ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            Stornieren
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Share2 size={16} />
            Teilen
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Hidden container for background PDF generation */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none overflow-hidden">
        <div ref={sharePreviewRef} style={{ width: '210mm' }}>
          {data && printSettings && (
            <InvoicePreview 
              data={data} 
              settings={printSettings} 
              agencyLogoPath={agencyLogoPath} 
            />
          )}
        </div>
      </div>

      {isShareModalOpen && data && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          invoiceData={{
            id: id || '',
            number: data.invoice_meta?.invoice_number || '',
            customerName: data.customer?.company_name || '',
            customerEmail: data.customer?.email || '',
            customerPhone: data.customer?.phone || '',
          }}
          // Pass necessary refs/data for background PDF generation inside modal
          onPreparePdf={async () => {
            const token = localStorage.getItem("token");
            let settings = printSettings;
            if (!settings) {
              const settingsRes = await fetch(`${API_URL}/api/PrintSetting`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (settingsRes.ok) {
                settings = await settingsRes.json();
                setPrintSettings(settings);
              }
            }
            if (!agencyLogoPath) {
              const agencyRes = await fetch(`${API_URL}/api/Agency`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (agencyRes.ok) {
                const agencyData = await agencyRes.json();
                setAgencyLogoPath(agencyData.logoPath);
              }
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            if (sharePreviewRef.current && settings) {
              const fileName = `Rechnung_${data.invoice_meta?.invoice_number || id}.pdf`;
              const result = await generateInvoicePdf(sharePreviewRef.current, fileName);
              return { ...result, fileName };
            }
            throw new Error("PDF could not be generated");
          }}
        />
      )}

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

      </div>
    </div>
  );
}
