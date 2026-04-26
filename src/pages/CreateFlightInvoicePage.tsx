import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TravelInvoice } from '../types';
import { InvoiceRenderer } from '../components/InvoiceRenderer';

export function CreateFlightInvoicePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<TravelInvoice>({
    invoice_meta: {
      invoice_type: "Flug",
      invoice_number: `RE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_id: `R-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_date: new Date().toISOString().slice(0, 10),
      booking_reference: "",
      va_reference: "",
      language: "de"
    },
    agencyUser:{
      agencyId:"",
      name:"",
      nachName:"",
      id:"",
      type:""
    },
    customer: {
      customerNumber: "",
      customer_name: "",
      company_name: "",
      company_type: "",
      email: "",
      phone: "",
      address: { street: "", postalCode: "", city: "", country: "" }
    },
    booking: {
      booking_date: new Date().toISOString().slice(0, 10),
      travel_start_date: "",
      travel_end_date: "",
      services: []
    },
    passengers: [],
    flight_details: {
      airline: "",
      file_key: "",
      segmentsTo: [],
      segmentsBack: []
    },
    payments: {
      payment_method: "",
      invoice_status: "offen",
      invoice_total: 0,
      invoice_paid_amount: 0,
      invoice_balance: 0,
      payment_date: "",
      currency: "EUR",
      line_items: []
    },
    legal_notes: {
      immediate_due_notice: "Der Rechnungsbetrag ist sofort fällig.",
      tax_change_notice: "Preisanpassungen aufgrund von Steueränderungen vorbehalten.",
      usa_esta_notice: "Bitte beachten Sie die ESTA-Einreisebestimmungen für die USA."
    },
    system_meta: {
      source_type: "manual",
      extraction_model: "manual",
      extracted_at: new Date().toISOString()
    }
  });

  const handleUpdate = (updatedData: TravelInvoice) => {
    setData(updatedData);
  };

  const handleSave = () => {
    navigate('/invoices');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Neue Rechnung</h1>
            <p className="text-sm text-zinc-500">Erstellen Sie eine neue Rechnung für Flugbuchungen</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <InvoiceRenderer 
          data={data} 
          onUpdate={handleUpdate} 
          onSave={handleSave} 
        />
      </div>
    </div>
  );
}
