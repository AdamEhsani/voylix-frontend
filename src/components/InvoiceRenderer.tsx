import { TravelInvoice, Passenger, Customer, FlightSegment, InvoiceMeta, Address, BackendCustomer, InvoiceDesignerSettings } from '../types'
import { formatCurrency, cn } from '../utils'
import { InvoicePreview } from './InvoicePreview'
import {
  Plane,
  User,
  CreditCard,
  Info,
  Plus,
  Trash2,
  Save,
  Printer,
  Briefcase,
  Search,
  X,
  Check,
  Globe,
  Loader2,
  Coffee,
  Utensils,
  GlassWater,
  Truck,
  Ban,
  Calculator,
  Edit2
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_URL } from '../config/api'
interface InvoiceRendererProps {
  data?: TravelInvoice
  onUpdate: (data: TravelInvoice) => void
  onSave?: () => void
}
const API_BASE_URL = API_URL;
export function InvoiceRenderer({ data, onUpdate, onSave }: InvoiceRendererProps) {

  if (!data) return null

  const invoiceMeta: InvoiceMeta = data.invoice_meta ?? {
    invoice_type: 'Flug',
    invoice_number: '',
    invoice_id: '',
    invoice_date: '',
    booking_reference: '',
    va_reference: '',
    language: 'de'
  }

  const customer = data.customer ?? {
    customerNumber: '',
    company_name: '',
    company_type: '',
    email: '',
    phone: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: ''
    }
  }

  const address: Address = customer.address ?? {
    street: '',
    postalCode: '',
    city: '',
    country: ''
  }

  const passengers = data.passengers ?? []

  const flightDetails = data.flight_details ?? {
    airline: '',
    file_key: '',
    segmentsTo: [],
    segmentsBack: []
  }
  const segmentsTo = flightDetails.segmentsTo ?? []
  const segmentsBack = flightDetails.segmentsBack ?? []

  const hotelDetails = data.hotelDto ?? {
    name: '',
    location: '',
    check_in: '',
    check_out: '',
    nights: 0,
    room_type: '',
    board_type: '',
    verpflegung: []
  }

  const packageDetails = data.package_details ?? {
    package_name: '',
    destination: '',
    duration: '',
    services: [],
    verpflegung: []
  }

  const payments = data.payments ?? {
    payment_method: '',
    invoice_status: 'offen',
    invoice_total: 0,
    invoice_paid_amount: 0,
    invoice_balance: 0,
    payment_date: '',
    currency: 'EUR',
    line_items: []
  }

  const [invoiceTotal, setInvoiceTotal] = useState<string | number>("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pickingFor, setPickingFor] = useState<'customer' | 'passenger'>('customer')

  const [customers, setCustomers] = useState<BackendCustomer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [printSettings, setPrintSettings] = useState<InvoiceDesignerSettings | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [agencyLogoPath, setAgencyLogoPath] = useState<string | null>(null);

  // Fee Management State
  const [isFeeMainModalOpen, setIsFeeMainModalOpen] = useState(false);
  const [isFeeListModalOpen, setIsFeeListModalOpen] = useState(false);
  const [isCreateFeeModalOpen, setIsCreateFeeModalOpen] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<{ id: number, name: string, amount: number } | null>(null);
  const [backendFees, setBackendFees] = useState<{ id: number, name: string, amount: number }[]>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  // Staging state for the main modal
  const [mainFeeInput, setMainFeeInput] = useState({
    erwachsene: { qty: 1, price: '' },
    kind: { qty: 1, price: '' },
    customs: [] as Array<{ id: number, name: string, qty: number, price: string }>
  });

  const fetchBackendFees = async () => {
    try {
      setIsLoadingFees(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/Fee`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackendFees(data);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const createFee = async (name: string, amount: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/Fee`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, amount })
      });
      if (res.ok) {
        await fetchBackendFees();
        setIsCreateFeeModalOpen(false);
        setFeeToEdit(null);
      }
    } catch (error) {
      console.error("Error creating fee:", error);
    }
  };

  const updateFee = async (id: number, name: string, amount: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/Fee/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, amount })
      });
      if (res.ok) {
        await fetchBackendFees();
        setIsCreateFeeModalOpen(false);
        setFeeToEdit(null);
      }
    } catch (error) {
      console.error("Error updating fee:", error);
    }
  };

  const deleteFee = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/Fee/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchBackendFees();
        if (mainFeeInput.custom?.id === id) {
          setMainFeeInput(prev => ({ ...prev, custom: null }));
        }
      }
    } catch (error) {
      console.error("Error deleting fee:", error);
    }
  };

  useEffect(() => {
    if (isFeeMainModalOpen) {
      fetchBackendFees();
    }
  }, [isFeeMainModalOpen]);

  useEffect(() => {
    const fetchAgencyLogo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Agency`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (res.ok) {
          const agencyData = await res.json();
          setAgencyLogoPath(agencyData.logoPath);
        }
      } catch (error) {
        console.error("Error fetching agency logo:", error);
      }
    };
    fetchAgencyLogo();
  }, []);

  useEffect(() => {
    const total = (payments.line_items ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
    setInvoiceTotal(total);
  }, [payments.line_items]);

  useEffect(() => {
    const cn = data?.customer?.customerNumber;
    if (cn !== undefined && cn !== null && typeof cn !== 'string') {
      onUpdate({
        ...data,
        customer: {
          ...data.customer,
          customerNumber: String(cn)
        }
      });
    }
  }, [data?.customer?.customerNumber]);


  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/customer`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setLoadingCustomers(false);
        return;
      }

      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (isCustomerModalOpen) {
      loadCustomers();
    }
  }, [isCustomerModalOpen]);

  const updateInvoiceMeta = (field: string, value: any) => {
    onUpdate({
      ...data,
      invoice_meta: { ...invoiceMeta, [field]: value }
    })
  }

  const updateCustomer = (field: string, value: any) => {
    onUpdate({
      ...data,
      customer: { ...customer, [field]: value }
    })
  }

  const updateCustomerAddress = (field: string, value: any) => {
    onUpdate({
      ...data,
      customer: {
        ...customer,
        address: { ...address, [field]: value }
      }
    })
  }

  const addPassenger = () => {
    const newPassenger: Passenger = {
      index: passengers.length + 1,
      full_name: '',
      first_name: '',
      last_name: '',
      type: 'ADT',
      age_category: 'adult',
      date_of_birth: '',
      ticket_number: ''
    }

    onUpdate({
      ...data,
      passengers: [...passengers, newPassenger]
    })
  }

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'first_name' || field === 'last_name') {
      updated[index].full_name =
        `${updated[index].first_name} ${updated[index].last_name}`.trim()
    }

    onUpdate({ ...data, passengers: updated })
  }

  const removePassenger = (index: number) => {
    onUpdate({
      ...data,
      passengers: passengers.filter((_, i) => i !== index)
    })
  }

  const updateFlightSegment = (type: 'segmentsTo' | 'segmentsBack', index: number, field: string, value: any) => {
    let finalValue = value;

    // Prevent years longer than 4 digits for datetime-local
    if ((field === 'departure_time' || field === 'arrival_time') && typeof value === 'string') {
      const parts = value.split('-');
      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].substring(0, 4);
        finalValue = parts.join('-');
      }
    }

    const segments = [...(flightDetails[type] ?? [])]
    const segment = { ...segments[index] }

    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      segment[parent] = { ...segment[parent], [child]: finalValue }
    } else {
      segment[field] = finalValue
    }

    segments[index] = segment
    onUpdate({
      ...data,
      flight_details: { ...flightDetails, [type]: segments }
    })
  }

  const addFlightSegment = (type: 'segmentsTo' | 'segmentsBack') => {
    const segments = [...(flightDetails[type] ?? [])]
    const newSegment: FlightSegment = {
      segment_number: segments.length + 1,
      airline: '',
      flight_number: '',
      booking_class: '',
      from: { airport: '', iata: '' },
      to: { airport: '', iata: '' },
      departure_time: '',
      arrival_time: ''
    }
    onUpdate({
      ...data,
      flight_details: { ...flightDetails, [type]: [...segments, newSegment] }
    })
  }

  const removeFlightSegment = (type: 'segmentsTo' | 'segmentsBack', index: number) => {
    const segments = (flightDetails[type] ?? []).filter((_, i) => i !== index)
    onUpdate({
      ...data,
      flight_details: { ...flightDetails, [type]: segments }
    })
  }

  const updateHotelDetails = (field: string, value: any) => {
    onUpdate({
      ...data,
      hotelDto: { ...hotelDetails, [field]: value }
    })
  }

  const updatePackageDetails = (field: string, value: any) => {
    onUpdate({
      ...data,
      package_details: { ...packageDetails, [field]: value }
    })
  }

  const addPackageService = () => {
    onUpdate({
      ...data,
      package_details: {
        ...packageDetails,
        services: [...(packageDetails.services ?? []), '']
      }
    })
  }

  const updatePackageService = (index: number, value: string) => {
    const services = [...(packageDetails.services ?? [])]
    services[index] = value
    onUpdate({
      ...data,
      package_details: { ...packageDetails, services }
    })
  }

  const removePackageService = (index: number) => {
    onUpdate({
      ...data,
      package_details: {
        ...packageDetails,
        services: (packageDetails.services ?? []).filter((_, i) => i !== index)
      }
    })
  }

  const addVerpflegung = (target: 'hotelDto' | 'package_details', type: any) => {
    const current = (data[target] || {}) as any;
    const list = [...(current.verpflegung || [])];

    // Prevent duplicates
    if (list.some(v => v.type === type)) return;

    list.push({ type, details: '' });

    onUpdate({
      ...data,
      [target]: { ...current, verpflegung: list }
    });
  }

  const removeVerpflegung = (target: 'hotelDto' | 'package_details', index: number) => {
    const current = (data[target] || {}) as any;
    const list = (current.verpflegung || []).filter((_, i: number) => i !== index);

    onUpdate({
      ...data,
      [target]: { ...current, verpflegung: list }
    });
  }

  const addFee = (name: string, amount: number) => {
    const items = [...(payments.line_items ?? [])]
    items.push({ name, amount })

    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = Number(payments.invoice_paid_amount || 0)
    const balance = 0

    onUpdate({
      ...data,
      payments: {
        ...payments,
        line_items: items,
        invoice_total: total,
        invoice_balance: balance
      }
    })

    setIsFeeMainModalOpen(false);
    toast.success(`Gebühr "${name}" hinzugefügt`);
  }

  const addMultipleFees = (feesToAdd: { name: string, amount: number }[]) => {
    if (feesToAdd.length === 0) return;

    const items = [...(payments.line_items ?? [])]
    feesToAdd.forEach(f => items.push(f));

    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = Number(payments.invoice_paid_amount || 0)
    const balance = 0

    onUpdate({
      ...data,
      payments: {
        ...payments,
        line_items: items,
        invoice_total: total,
        invoice_balance: balance
      }
    })

    setIsFeeMainModalOpen(false);
    toast.success(`${feesToAdd.length} Gebühren hinzugefügt`);
  }

  const removeFee = (index: number) => {
    const items = [...(payments.line_items ?? [])]
    items.splice(index, 1)

    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = Number(payments.invoice_paid_amount || 0)
    const balance = 0

    onUpdate({
      ...data,
      payments: {
        ...payments,
        line_items: items,
        invoice_total: total,
        invoice_balance: balance
      }
    })
  }

  const handleSelectCustomer = (selected: BackendCustomer) => {
    const fullName = `${selected.firstName} ${selected.lastName}`.trim();
    if (pickingFor === 'customer') {
      onUpdate({
        ...data,
        customer: {
          customerNumber: String(selected.customerNumber || ""),
          company_name: fullName,
          company_type: '',
          email: selected.email,
          phone: selected.phone,
          address: {
            street: selected.street,
            postalCode: selected.postalCode,
            city: selected.city,
            country: selected.country
          }
        }
      })
    } else {
      const newPassenger: Passenger = {
        index: passengers.length + 1,
        full_name: fullName,
        first_name: selected.firstName,
        last_name: selected.lastName,
        type: 'ADT',
        age_category: 'adult',
        date_of_birth: selected.dateOfBirth,
        ticket_number: ''
      }
      onUpdate({ ...data, passengers: [...passengers, newPassenger] })
    }
    setIsCustomerModalOpen(false)
  }

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/PrintSetting/loadSetting`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const settings = await response.json();
        setPrintSettings(settings);
        setIsPrinting(true);
      } else {
        window.print();
      }
    } catch (error) {
      console.error("Error fetching print settings:", error);
      window.print();
    }
  };

  useEffect(() => {
    if (isPrinting && printSettings) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, printSettings]);

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase();
    const email = c.email?.toLowerCase() ?? '';
    const phone = c.phone?.toLowerCase() ?? '';
    return (
      fullName.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      String(c.id).includes(term)
    );
  });

  const handleSave = async () => {
    // Validate customer (Rechnungsempfänger)
    const hasCustomer = !!(
      customer?.company_name?.trim() ||
      customer?.email?.trim() ||
      customer?.phone?.trim() ||
      address?.street?.trim() ||
      address?.city?.trim()
    );

    if (!hasCustomer) {
      toast.error("Bitte wählen Sie einen Kunden aus", {
        description: "Klicken Sie auf 'Kunde suchen', um einen Rechnungsempfänger auszuwählen.",
        position: "top-center",
        duration: 4000
      });
      return;
    }

    const token = localStorage.getItem("token");
    const finalData = buildFinalInvoice();

    const isUpdate = !!data.id;
    const url = isUpdate
      ? `${API_BASE_URL}/api/SaveInvoice/invoice`
      : `${API_BASE_URL}/api/CreateInvoice/invoice`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(finalData),
      });
      if (res.ok && onSave) {
        toast.success("Rechnung erfolgreich gespeichert");
        onSave();
      } else if (!res.ok) {
        toast.error("Fehler beim Speichern der Rechnung");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Fehler beim Speichern der Rechnung");
    }
  };

  const buildFinalInvoice = () => {
    const total = Number(invoiceTotal || 0);
    const paid = Number(data.payments?.invoice_paid_amount || 0);
    return {
      ...data,
      id: data.id ? Number(data.id) : undefined,
      invoice_meta: { ...data.invoice_meta },
      customer: {
        ...data.customer,
        customerNumber: String(data.customer?.customerNumber ?? ""),
        address: { ...data.customer?.address },
      },
      passengers: (data.passengers ?? []).map(p => ({
        ...p,
        full_name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      })),
      flight_details: {
        ...data.flight_details,
        segmentsTo: data.flight_details?.segmentsTo ?? [],
        segmentsBack: data.flight_details?.segmentsBack ?? [],
      },
      hotelDto: data.hotelDto ? { ...data.hotelDto } : undefined,
      package_details: data.package_details ? { ...data.package_details } : undefined,
      payments: {
        payment_method: data.payments?.payment_method ?? '',
        invoice_status: data.payments?.invoice_status ?? 'offen',

        // فقط این یکی مهمه
        invoice_total: Number(invoiceTotal || 0),

        // این دوتا رو همیشه force کن
        invoice_paid_amount: 0,
        invoice_balance: 0,

        payment_date: data.payments?.payment_date ?? '',
        currency: data.payments?.currency ?? 'EUR',

        line_items: (data.payments?.line_items ?? []).map(item => ({
          name: item.name,
          amount: Number(item.amount),
        })),
      },
      agencyUser: {
        ...data.agencyUser
      },
      system_meta: { ...data.system_meta },
      legal_notes: { ...data.legal_notes },
    };
  };

  return (
    <>
      {/* HIDDEN PRINT PREVIEW */}
      {isPrinting && printSettings && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999] overflow-visible">
          <InvoicePreview data={data} settings={printSettings} agencyLogoPath={agencyLogoPath} />
        </div>
      )}

      <div className={cn(
        "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden print:overflow-visible print:shadow-none print:border-none print:bg-white print:text-black",
        isPrinting && "print:hidden"
      )}>

        {/* HEADER */}
        <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <Briefcase size={20} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {invoiceMeta?.invoice_type === 'Flug'
                  ? 'Reise-Rechnung'
                  : 'Rechnung'}
              </h2>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              <Globe size={14} />
              Sprache: <span className="font-medium text-zinc-700 dark:text-zinc-300">{invoiceMeta?.language ?? '-'}</span>
            </p>
          </div>

          <div className="w-full md:w-72 space-y-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Rechnungsdetails</span>
              <span className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500"><Info size={12} /></span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Nummer:</span>
                <input
                  value={invoiceMeta?.invoice_number ?? ''}
                  onChange={e => updateInvoiceMeta('invoice_number', e.target.value)}
                  className="text-xs font-mono text-right bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-emerald-500 outline-none w-32 transition-colors"
                  placeholder="RE-2024-001"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Datum:</span>
                <input
                  value={invoiceMeta?.invoice_date ?? ''}
                  onChange={e => updateInvoiceMeta('invoice_date', e.target.value)}
                  className="text-xs text-right bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-emerald-500 outline-none w-32 transition-colors"
                  placeholder="DD.MM.YYYY"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <User size={14} /> Rechnungsempfänger
            </h3>
            <button
              onClick={() => {
                setPickingFor('customer');
                setIsCustomerModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200 dark:border-emerald-800/50 print:hidden"
            >
              <Search size={14} /> Kunde suchen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Name / Firma</label>
              <input
                readOnly
                value={customer?.company_name ?? ''}
                onChange={e => updateCustomer('company_name', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">E-Mail</label>
              <input
                readOnly
                value={customer?.email ?? ''}
                onChange={e => updateCustomer('email', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Telefon</label>
              <input
                readOnly
                value={customer?.phone ?? ''}
                onChange={e => updateCustomer('phone', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="+49 1234"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Straße</label>
              <input
                readOnly
                value={address?.street ?? ''}
                onChange={e => updateCustomerAddress('street', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Straße"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">PLZ / Stadt</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={address?.postalCode ?? ''}
                  onChange={e => updateCustomerAddress('postalCode', e.target.value)}
                  className="w-20 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="plz"
                />
                <input
                  readOnly
                  value={address?.city ?? ''}
                  onChange={e => updateCustomerAddress('city', e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="stadt"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Land</label>
              <input
                readOnly
                value={address?.country ?? ''}
                onChange={e => updateCustomerAddress('country', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Land"
              />
            </div>
          </div>
        </div>

        {/* PASSENGERS */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <User size={14} /> Reisende
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPickingFor('passenger');
                  setIsCustomerModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 transition-all border border-zinc-200 dark:border-zinc-700 print:hidden"
              >
                <Search size={14} /> Aus Liste
              </button>
              <button
                onClick={addPassenger}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition-all print:hidden"
              >
                <Plus size={14} /> Hinzufügen
              </button>
            </div>
          </div>

          {passengers.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400 text-sm">
              Keine Reisenden erfasst
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passengers.map((p, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center gap-4 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Vorname</label>
                      <input
                        value={p.first_name ?? ''}
                        onChange={e => updatePassenger(i, 'first_name', e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Nachname</label>
                      <input
                        value={p.last_name ?? ''}
                        onChange={e => updatePassenger(i, 'last_name', e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Nachname"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removePassenger(i)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 print:hidden"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FLIGHT DETAILS */}
        {(invoiceMeta.invoice_type === 'Flug' || invoiceMeta.invoice_type === 'Package') && (
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Plane size={14} /> Flugverbindung
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => addFlightSegment('segmentsTo')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition-all print:hidden"
                >
                  <Plus size={14} /> Hinflug Segment
                </button>
                <button
                  onClick={() => addFlightSegment('segmentsBack')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 transition-all print:hidden"
                >
                  <Plus size={14} /> Rückflug Segment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hinflug */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hinflug
                </h4>
                <div className="space-y-3">
                  {segmentsTo.length === 0 && <p className="text-xs text-zinc-400 italic">Keine Segmente erfasst</p>}
                  {segmentsTo.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm space-y-3 group relative">
                      <button
                        onClick={() => removeFlightSegment('segmentsTo', i)}
                        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Flugnummer</label>
                          <input
                            value={s.flight_number ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'flight_number', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="LH123"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Airline</label>
                          <input
                            value={s.airline ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'airline', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Lufthansa"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Von (Airport)</label>
                          <input
                            value={s.from?.airport ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'from.airport', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Frankfurt"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Nach (Airport)</label>
                          <input
                            value={s.to?.airport ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'to.airport', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Istanbul"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Abflug</label>
                          <input
                            type="datetime-local"
                            max="9999-12-31T23:59"
                            value={s.departure_time ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'departure_time', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Ankunft</label>
                          <input
                            type="datetime-local"
                            max="9999-12-31T23:59"
                            value={s.arrival_time ?? ''}
                            onChange={e => updateFlightSegment('segmentsTo', i, 'arrival_time', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rückflug */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Rückflug
                </h4>
                <div className="space-y-3">
                  {segmentsBack.length === 0 && <p className="text-xs text-zinc-400 italic">Keine Segmente erfasst</p>}
                  {segmentsBack.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm space-y-3 group relative">
                      <button
                        onClick={() => removeFlightSegment('segmentsBack', i)}
                        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Flugnummer</label>
                          <input
                            value={s.flight_number ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'flight_number', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="LH123"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Airline</label>
                          <input
                            value={s.airline ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'airline', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Lufthansa"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Von (Airport)</label>
                          <input
                            value={s.from?.airport ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'from.airport', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Istanbul"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Nach (Airport)</label>
                          <input
                            value={s.to?.airport ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'to.airport', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Frankfurt"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Abflug</label>
                          <input
                            type="datetime-local"
                            max="9999-12-31T23:59"
                            value={s.departure_time ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'departure_time', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Ankunft</label>
                          <input
                            type="datetime-local"
                            max="9999-12-31T23:59"
                            value={s.arrival_time ?? ''}
                            onChange={e => updateFlightSegment('segmentsBack', i, 'arrival_time', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOTEL DETAILS */}
        {(invoiceMeta.invoice_type === 'Hotel' || invoiceMeta.invoice_type === 'Package') && (
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Briefcase size={14} /> Hotel Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Hotel Name</label>
                <input
                  value={hotelDetails.name ?? ''}
                  onChange={e => updateHotelDetails('name', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Grand Hotel"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Standort</label>
                <input
                  value={hotelDetails.location ?? ''}
                  onChange={e => updateHotelDetails('location', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Stadt, Land"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Zimmertyp</label>
                <select
                  value={hotelDetails.room_type ?? ''}
                  onChange={e => updateHotelDetails('room_type', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="">Wählen...</option>
                  <option value="Doppelzimmer">Doppelzimmer (DZ)</option>
                  <option value="Einzelzimmer">Einzelzimmer (EZ)</option>
                  <option value="Dreibettzimmer">Dreibettzimmer (TZ)</option>
                  <option value="Suite">Suite</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Studio">Studio</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Check-In</label>
                <input
                  type="date"
                  value={hotelDetails.check_in ?? ''}
                  onChange={e => updateHotelDetails('check_in', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="DD.MM.YYYY"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Check-Out</label>
                <input
                  type="date"
                  value={hotelDetails.check_out ?? ''}
                  onChange={e => updateHotelDetails('check_out', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="DD.MM.YYYY"
                />
              </div>

            </div>

            {/* VERPFLEGUNG TOOLBAR */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Verpflegung & Transfer:</span>
                {[
                  { type: 'none', label: 'Ohne', icon: Ban, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200' },
                  { type: 'breakfast', label: 'Frühstück', icon: Coffee, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100' },
                  { type: 'half_board', label: 'Halbpension', icon: Utensils, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100' },
                  { type: 'full_board', label: 'Vollpension', icon: Utensils, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100' },
                  { type: 'all_inclusive', label: 'All Inclusive', icon: GlassWater, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100' },
                  { type: 'transfer', label: 'Transfer', icon: Truck, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100' },
                ].map((opt) => {
                  const isSelected = (hotelDetails.verpflegung ?? []).some(v => v.type === opt.type);
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      disabled={isSelected}
                      onClick={() => addVerpflegung('hotelDto', opt.type)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all print:hidden",
                        isSelected ? "opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400" : opt.color
                      )}
                    >
                      <opt.icon size={12} /> {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {(hotelDetails.verpflegung ?? []).map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm group">
                    <div className={`p-1.5 rounded-lg ${v.type === 'breakfast' ? 'bg-amber-100 text-amber-600' :
                        v.type === 'half_board' ? 'bg-orange-100 text-orange-600' :
                          v.type === 'full_board' ? 'bg-red-100 text-red-600' :
                            v.type === 'all_inclusive' ? 'bg-emerald-100 text-emerald-600' :
                              v.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
                                'bg-zinc-100 text-zinc-600'
                      }`}>
                      {v.type === 'breakfast' && <Coffee size={14} />}
                      {v.type === 'half_board' && <Utensils size={14} />}
                      {v.type === 'full_board' && <Utensils size={14} />}
                      {v.type === 'all_inclusive' && <GlassWater size={14} />}
                      {v.type === 'transfer' && <Truck size={14} />}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {v.type === 'breakfast' ? 'Frühstück' :
                        v.type === 'half_board' ? 'Halbpension' :
                          v.type === 'full_board' ? 'Vollpension' :
                            v.type === 'all_inclusive' ? 'All Inclusive' :
                              'Transfer'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVerpflegung('hotelDto', idx)}
                      className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FEES */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CreditCard size={14} /> Gebühren & Leistungen
            </h3>
            <button
              onClick={() => setIsFeeMainModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200 dark:border-emerald-800/50 print:hidden"
            >
              <Plus size={14} /> Gebühr hinzufügen
            </button>
          </div>

          <div className="space-y-2">
            {payments.line_items && payments.line_items.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs">
                Keine Gebühren erfasst
              </div>
            ) : (
              (payments.line_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <CreditCard size={14} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item?.name}</span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(
                        Number(item?.amount ?? 0),
                        payments.currency
                      )}
                    </span>
                    <button
                      onClick={() => removeFee(i)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 print:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOTAL */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bereit zum Speichern</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="font-mono text-xs uppercase tracking-tight">Währung: {payments.currency}</span>
          </div>

          <div className="w-full md:w-72 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-500 uppercase">Gesamtpreis</span>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">€</span>
                <input
                  type="number"
                  value={invoiceTotal}
                  disabled
                  className="w-full pl-7 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-bold outline-none cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="p-8 bg-zinc-900 dark:bg-black flex flex-col sm:flex-row gap-4 justify-end print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all border border-zinc-700"
          >
            <Printer size={18} /> Rechnung Drucken
          </button>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Save size={18} /> Rechnung Speichern
          </button>
        </div>

        {/* CUSTOMER MODAL */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Kunde auswählen</h3>
                  <p className="text-sm text-zinc-500">Wählen Sie einen Kunden aus der Datenbank</p>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Name, Firma oder Kundennummer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    autoFocus
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {loadingCustomers ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                      <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
                      <p>Kunden werden geladen...</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full p-4 flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{customer.firstName} {customer.lastName}</p>
                            <p className="text-xs text-zinc-500">
                              {customer.email} • {customer.city}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Check size={16} />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-zinc-500">
                      <Search size={40} className="mx-auto mb-4 opacity-20" />
                      <p>Keine Kunden gefunden</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fee Management Modals */}
        {isFeeMainModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gebühr hinzufügen</h3>
                    <p className="text-xs text-zinc-500">Geben Sie die Gebühren für diese Rechnung ein</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFeeMainModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Row: Erwachsene */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1" />
                  <div className="col-span-4">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">Erwachsene</span>
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block text-center">Anzahl</label>
                    <input
                      type="number"
                      min="1"
                      value={mainFeeInput.erwachsene.qty}
                      onChange={(e) => setMainFeeInput(prev => ({ ...prev, erwachsene: { ...prev.erwachsene, qty: parseInt(e.target.value) || 1 } }))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Preis (€)</label>
                    <input
                      type="number"
                      value={mainFeeInput.erwachsene.price}
                      onChange={(e) => setMainFeeInput(prev => ({ ...prev, erwachsene: { ...prev.erwachsene, price: e.target.value } }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Row: Kind */}
                <div className="grid grid-cols-12 gap-4 items-center border-t border-zinc-50 dark:border-zinc-800/10 pt-4">
                  <div className="col-span-1" />
                  <div className="col-span-4">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">Kind</span>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      value={mainFeeInput.kind.qty}
                      onChange={(e) => setMainFeeInput(prev => ({ ...prev, kind: { ...prev.kind, qty: parseInt(e.target.value) || 1 } }))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={mainFeeInput.kind.price}
                      onChange={(e) => setMainFeeInput(prev => ({ ...prev, kind: { ...prev.kind, price: e.target.value } }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Custom Fees List */}
                {mainFeeInput.customs.map((custom, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center border-t border-zinc-50 dark:border-zinc-800/10 pt-4 group">
                    <div className="col-span-1">
                      <button
                        onClick={() => setMainFeeInput(prev => ({
                          ...prev,
                          customs: prev.customs.filter((_, i) => i !== idx)
                        }))}
                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="col-span-4 truncate">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{custom.name}</span>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={custom.qty}
                        onChange={(e) => setMainFeeInput(prev => ({
                          ...prev,
                          customs: prev.customs.map((c, i) => i === idx ? { ...c, qty: (parseInt(e.target.value) || 1) } : c)
                        }))}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={custom.price}
                        onChange={(e) => setMainFeeInput(prev => ({
                          ...prev,
                          customs: prev.customs.map((c, i) => i === idx ? { ...c, price: e.target.value } : c)
                        }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setIsFeeListModalOpen(true)}
                  className="w-full py-4 mt-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Gebühr aus Liste (Add Gebühr)
                </button>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                <button
                  onClick={() => setIsFeeMainModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    const finalFees: { name: string, amount: number }[] = [];
                    if (parseFloat(mainFeeInput.erwachsene.price) > 0) {
                      finalFees.push({
                        name: `Erwachsene (${mainFeeInput.erwachsene.qty}x ${formatCurrency(parseFloat(mainFeeInput.erwachsene.price), payments.currency)})`,
                        amount: parseFloat(mainFeeInput.erwachsene.price) * mainFeeInput.erwachsene.qty
                      });
                    }
                    if (parseFloat(mainFeeInput.kind.price) > 0) {
                      finalFees.push({
                        name: `Kind (${mainFeeInput.kind.qty}x ${formatCurrency(parseFloat(mainFeeInput.kind.price), payments.currency)})`,
                        amount: parseFloat(mainFeeInput.kind.price) * mainFeeInput.kind.qty
                      });
                    }
                    mainFeeInput.customs.forEach(custom => {
                      if (parseFloat(custom.price) > 0) {
                        finalFees.push({
                          name: `${custom.name} (${custom.qty}x ${formatCurrency(parseFloat(custom.price), payments.currency)})`,
                          amount: parseFloat(custom.price) * custom.qty
                        });
                      }
                    });

                    if (finalFees.length > 0) {
                      addMultipleFees(finalFees);
                      setIsFeeMainModalOpen(false);
                      // Reset
                      setMainFeeInput({
                        erwachsene: { qty: 1, price: '' },
                        kind: { qty: 1, price: '' },
                        customs: []
                      });
                    }
                  }}
                  disabled={!mainFeeInput.erwachsene.price && !mainFeeInput.kind.price && mainFeeInput.customs.filter(c => parseFloat(c.price) > 0).length === 0}
                  className="flex-[2] px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all text-sm shadow-lg shadow-emerald-500/20"
                >
                  Alle hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fee List Modal */}
        {isFeeListModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-white">Gebührenliste</h3>
                <button
                  onClick={() => setIsFeeListModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {isLoadingFees ? (
                  <div className="flex items-center justify-center py-10 opacity-50 scale-75">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                  </div>
                ) : backendFees.length > 0 ? (
                  backendFees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 group">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fee.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-600">{formatCurrency(fee.amount, payments.currency)}</span>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setMainFeeInput(prev => ({
                                ...prev,
                                customs: [...prev.customs, { ...fee, qty: 1, price: fee.amount.toString() }]
                              }));
                              setIsFeeListModalOpen(false);
                            }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors tooltip"
                            title="Auswählen"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setFeeToEdit(fee);
                              setIsCreateFeeModalOpen(true);
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteFee(fee.id)}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calculator size={32} className="mx-auto text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-500 italic">Keine Gebühren definiert</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setFeeToEdit(null);
                    setIsCreateFeeModalOpen(true);
                  }}
                  className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Neue Gebühr
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Fee Modal */}
        {isCreateFeeModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-[280px] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-5 space-y-4">
                <h3 className="font-bold text-center text-zinc-900 dark:text-white">
                  {feeToEdit ? 'Gebühr bearbeiten' : 'Neue Gebühr'}
                </h3>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Titel</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Name (z.B. Visa)"
                    defaultValue={feeToEdit?.name || ''}
                    id="fee-name-input-final"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Standard Preis (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={feeToEdit?.amount || ''}
                    id="fee-amount-input-final"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsCreateFeeModalOpen(false);
                      setFeeToEdit(null);
                    }}
                    className="flex-1 py-3 text-xs font-bold text-zinc-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById('fee-name-input-final') as HTMLInputElement;
                      const amountInput = document.getElementById('fee-amount-input-final') as HTMLInputElement;
                      const name = nameInput.value;
                      const amount = parseFloat(amountInput.value) || 0;
                      if (name) {
                        if (feeToEdit) updateFee(feeToEdit.id, name, amount);
                        else createFee(name, amount);
                      }
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
