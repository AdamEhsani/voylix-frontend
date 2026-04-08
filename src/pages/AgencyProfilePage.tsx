import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  CreditCard, 
  Clock,
  Save,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const API_URL="https://api.voylix.de";

export function AgencyProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    postalCode: '',
    city: '',
    taxInfo: '',
    vatId: '',
    iban: '',
    bic: '',
    bankName: '',
  });

  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/Agency`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        
        setForm({
          name: data.name || '',
          legalName: data.legalName || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          taxInfo: data.taxInfo || '',
          vatId: data.vatId || '',
          iban: data.iban || '',
          bic: data.bic || '',
          bankName: data.bankName || '',
        });

if (data.logoPath) {
  const cleanPath = normalizePath(data.logoPath);
  
  setLogoPreview(`${API_URL}${cleanPath}`);
}
      } catch (err) {
        console.error("Fehler beim Laden der Agentur:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchAgency();
  }, []);

  const normalizePath = (path: string) => {
  return path.replace(/^\/?wwwroot/, "");
};

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("Name", form.name);
      formData.append("LegalName", form.legalName);
      formData.append("Email", form.email);
      formData.append("Phone", form.phone);
      formData.append("Website", form.website);
      formData.append("Address", form.address);
      formData.append("PostalCode", form.postalCode);
      formData.append("City", form.city);
      formData.append("TaxInfo", form.taxInfo);
      formData.append("VatId", form.vatId);
      formData.append("Iban", form.iban);
      formData.append("Bic", form.bic);
      formData.append("BankName", form.bankName);

      if (logoFile) {
        formData.append("Logo", logoFile);
      }

      const response = await fetch(`${API_URL}/api/Agency`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Fehler beim Speichern");
      }

      const result = await response.json();
      
      if (result.logoPath) {
        setLogoPreview(`${API_URL}${result.logoPath}`);
      }
      
      alert("Agenturprofil erfolgreich gespeichert.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
        <p>Profil wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Agenturprofil</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Verwalten Sie Ihre Unternehmensdaten und Rechnungseinstellungen.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {loading ? "Speichern..." : "Änderungen speichern"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Logo & Basic Info */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={48} />
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  <Camera size={18} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{form.name || 'Agenturname'}</h2>
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500">Status</span>
                <span className="font-bold text-emerald-600">Verifiziert</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Mitglied seit</span>
                <span className="font-bold text-zinc-900 dark:text-white">Januar 2026</span>
              </div>
            </div>
          </div>

          {/* <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-zinc-400" /> Geschäftszeiten
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Mo - Fr</span>
                <span className="font-medium">09:00 - 18:00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Sa</span>
                <span className="font-medium">10:00 - 14:00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">So</span>
                <span className="font-medium text-red-500">Geschlossen</span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-8">Allgemeine Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Agenturname</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    name="name"
                    value={form.name} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Rechtlicher Name</label>
                <input 
                  type="text" 
                  name="legalName"
                  value={form.legalName} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">E-Mail-Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="email" 
                    name="email"
                    value={form.email} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Telefonnummer</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="tel" 
                    name="phone"
                    value={form.phone} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-500">Webseite</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="url" 
                    name="website"
                    value={form.website} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address & Tax */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-8">Adresse & Steuern</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-500">Straße & Hausnummer</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    name="address"
                    value={form.address} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">PLZ</label>
                <input 
                  type="text" 
                  name="postalCode"
                  value={form.postalCode} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Stadt</label>
                <input 
                  type="text" 
                  name="city"
                  value={form.city} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Steuernummer</label>
                <input 
                  type="text" 
                  name="taxInfo"
                  value={form.taxInfo} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">USt-ID</label>
                <input 
                  type="text" 
                  name="vatId"
                  value={form.vatId} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
              <CreditCard size={20} className="text-zinc-400" /> Bankverbindung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-500">IBAN</label>
                <input 
                  type="text" 
                  name="iban"
                  value={form.iban} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">BIC</label>
                <input 
                  type="text" 
                  name="bic"
                  value={form.bic} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Bankname</label>
                <input 
                  type="text" 
                  name="bankName"
                  value={form.bankName} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
