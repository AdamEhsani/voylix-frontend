import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Phone,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '../utils';
import { useNavigate } from "react-router-dom";
const API_URL="https://api.voylix.de";
interface APICustomer {
  id: number;
  agencyId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  phone: string;
  email: string;
  createdAt?: string;
  total_spent?: number;
  balance_due?: number;
  city?: string;
  country?: string;
  postalCode?: string;
  street?: string;

  company?: {
    name?: '',
    street?: '',
    city?: '',
    postalCode?: '',
    country?: '',
    phone?: ''
  }
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bar');
  const [editingCustomer, setEditingCustomer] = useState<APICustomer | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof APICustomer; direction: 'asc' | 'desc' } | null>(null);
  const [customers, setCustomers] = useState<APICustomer[]>([]);
  const token = localStorage.getItem("token");

  const loadCustomers = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/customer`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        // Fallback to empty or handle error
        setLoading(false);
        return;
      }

      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const deleteCustomer = async (customer: APICustomer) => {
    if (!window.confirm(`Möchten Sie den Kunden ${customer.firstName} ${customer.lastName} wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/customer/${customer.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );

      if (!response.ok) {
        throw new Error("Löschen fehlgeschlagen");
      }

      setCustomers(prev => prev.filter(c => c.id !== customer.id));

    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const response = await fetch(
        `${API_URL}/api/update/CustomerUpdate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            Id: editingCustomer.id,
            FirstName: editingCustomer.firstName,
            LastName: editingCustomer.lastName,
            DateOfBirth: editingCustomer.dateOfBirth,
            Nationality: editingCustomer.nationality,
            Phone: editingCustomer.phone,
            Email: editingCustomer.email,
            PaidAmount: paymentAmount ? parseFloat(paymentAmount) : 0,
            city: editingCustomer.city,
            country: editingCustomer.country,
            postalCode: editingCustomer.postalCode,
            street: editingCustomer.street,
            passportNumber: editingCustomer.passportNumber,
            passportExpiry: editingCustomer.passportExpiry,

            Company: editingCustomer.company?.name
              ? {
                Name: editingCustomer.company.name,
                Street: editingCustomer.company.street,
                City: editingCustomer.company.city,
                PostalCode: editingCustomer.company.postalCode,
                Country: editingCustomer.company.country,
                Phone: editingCustomer.company.phone
              }
              : null
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Server error:", text);
        throw new Error("Update failed");
      }

      const data = await response.json();

      setCustomers(prev =>
        prev.map(c => c.id === data.id ? data : c)
      );

      await loadCustomers();
      setEditingCustomer(null);

    } catch (err) {
      console.error(err);
    }
  };

  const requestSort = (key: keyof APICustomer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = React.useMemo(() => {
    let sortableItems = [...customers].filter(customer =>
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [customers, sortConfig, searchTerm]);

  const SortIcon = ({ columnKey }: { columnKey: keyof APICustomer }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={12} className="ml-1 text-emerald-600" />
      : <ChevronDown size={12} className="ml-1 text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kundenverwaltung</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Verwalten Sie Ihre Kunden und deren Kontaktdaten.</p>
        </div>
        <Link
          to="/customers/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} /> Neuer Kunde
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <p className="text-zinc-500 font-medium">Kunden werden geladen...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th
                    onClick={() => requestSort('firstName')}
                    className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center">
                      Kunde
                      <SortIcon columnKey="firstName" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort('phone')}
                    className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden md:table-cell cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center">
                      Telefon
                      <SortIcon columnKey="phone" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort('total_spent')}
                    className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden lg:table-cell cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center">
                      Umsatz
                      <SortIcon columnKey="total_spent" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort('balance_due')}
                    className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon columnKey="balance_due" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold">
                          {customer.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">{customer.firstName} {customer.lastName}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Phone size={12} />
                        <span>{customer.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.total_spent || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        (customer.balance_due || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {(customer.balance_due || 0) > 0
                          ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.balance_due || 0)
                          : (customer.balance_due || 0) < 0
                            ? `+${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Math.abs(customer.balance_due || 0))}`
                            : '0,00 €'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingCustomer(customer); }}
                          className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      Keine Kunden gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Kunde bearbeiten</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{editingCustomer.phone} | {editingCustomer.email}</p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-12">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit2 size={14} /> Persönliche Informationen
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Vorname</label>
                        <input
                          type="text"
                          value={editingCustomer.firstName}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nachname</label>
                        <input
                          type="text"
                          value={editingCustomer.lastName}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">E-Mail</label>
                        <input
                          type="email"
                          value={editingCustomer.email}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Telefon</label>
                        <input
                          type="text"
                          value={editingCustomer.phone || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Geburtsdatum</label>
                        <input
                          type="text"
                          value={editingCustomer.dateOfBirth}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nationalität</label>
                        <input
                          type="text"
                          value={editingCustomer.nationality || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, nationality: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Straße</label>
                        <input
                          type="text"
                          value={editingCustomer.street}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, street: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Plz</label>
                        <input
                          type="text"
                          value={editingCustomer.postalCode}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, postalCode: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Stadt</label>
                        <input
                          type="text"
                          value={editingCustomer.city}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Land</label>
                        <input
                          type="text"
                          value={editingCustomer.country}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, country: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Passport Nr</label>
                        <input
                          type="text"
                          value={editingCustomer.passportNumber || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, passportNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Passport gültig bis</label>
                        <input
                          type="date"
                          value={editingCustomer.passportExpiry}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, passportExpiry: e.target.value })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right Column: Finance & Payments */}
                {/* <div className="space-y-8">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-6">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> Finanzen & Zahlung
                    </h4>
                    
                    <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Zahlungsmethode</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['Kreditkarte', 'Bar', 'ICE', 'Überweisung'].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={cn(
                                "px-3 py-2 text-[10px] font-bold rounded-lg border transition-all",
                                paymentMethod === method
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-500"
                              )}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Betrag erfassen</p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">€</span>
                            <input 
                              type="number"
                              placeholder="Betrag"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <button 
                            onClick={handleAddPayment}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Buchen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-12">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit2 size={14} /> Unternehmen Informationen
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Firmenname</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.name || ''}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              company: {
                                ...(editingCustomer.company || {}),
                                name: e.target.value
                              }
                            })
                          }
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Straße</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.street || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, company: { ...editingCustomer.company, street: e.target.value } })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Sdadt</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.city || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, company: { ...editingCustomer.company, city: e.target.value } })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Postleitzahl</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.postalCode || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, company: { ...editingCustomer.company, postalCode: e.target.value } })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Land</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.country || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, company: { ...editingCustomer.company, country: e.target.value } })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Telefon</label>
                        <input
                          type="text"
                          value={editingCustomer.company?.phone || ''}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, company: { ...editingCustomer.company, phone: e.target.value } })}
                          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-800/50">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-6 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="flex items-center gap-2 px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-xl"
              >
                <Save size={18} /> Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}