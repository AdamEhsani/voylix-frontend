import React, { useState, useEffect } from 'react';
import { 
  Layout as LayoutIcon, 
  Settings, 
  Eye, 
  Printer, 
  Save,
  X,
  ChevronRight, 
  ChevronDown, 
  Move, 
  Trash2, 
  Check, 
  Undo, 
  Type as TypeIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Square,
  Minus,
  Palette,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { InvoiceDesignerSettings, TravelInvoice } from '../types';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { InvoicePreview } from '../components/InvoicePreview';
import LogoAgency from '../components/LogoAgency';
import { API_URL } from "../config/api";

const DEFAULT_SETTINGS: InvoiceDesignerSettings = {
  logoPosition: 'left',
  logoSize: 120,
  showIataLogo: false,
  companyBlockPosition: 'right',
  customerBlockPosition: 'left',
  sectionOrdering: ['header', 'customer', 'passengers', 'flight', 'hotel', 'package', 'payments', 'footer'],
  sectionVisibility: {
    header: true,
    customer: true,
    passengers: true,
    flight: true,
    hotel: true,
    package: true,
    payments: true,
    footer: true
  },
  titleCustomization: 'REISE-RECHNUNG',
  mode: 'spacious',
  alignment: 'left',
  showBorders: false,
  showDividers: true,
  primaryColor: '#10b981',
  fontSize: 12
};

const MOCK_INVOICE: TravelInvoice = {
  invoice_meta: {
    invoice_type: 'travel_invoice',
    invoice_number: 'RE-2024-001',
    invoice_date: '27.03.2024',
    booking_reference: 'ABC123XYZ',
    va_reference: 'VA-999',
    language: 'de'
  },
  customer: {
    customer_number: 'C-1001',
    company_name: 'Max Mustermann',
    company_type: 'Privat',
    address: {
      street: 'Musterstraße 123',
      postalCode: '12345',
      city: 'Musterstadt',
      country: 'Deutschland'
    }
  },
  passengers: [
    { index: 1, first_name: 'Max', last_name: 'Mustermann', full_name: 'Max Mustermann', type: 'ADT', age_category: 'adult', date_of_birth: '01.01.1980', ticket_number: '123-4567890' },
    { index: 2, first_name: 'Erika', last_name: 'Mustermann', full_name: 'Erika Mustermann', type: 'ADT', age_category: 'adult', date_of_birth: '01.01.1985', ticket_number: '123-4567891' }
  ],
  flight_details: {
    airline: 'Lufthansa',
    file_key: 'ABC-123',
    segmentsTo: [
      { 
        segment_number: 1, 
        airline: 'Lufthansa',
        flight_number: 'LH123', 
        booking_class: 'Y',
        from: { iata: 'FRA', airport: 'Frankfurt' }, 
        to: { iata: 'IST', airport: 'Istanbul' },
        departure_time: '10:00',
        arrival_time: '14:00'
      }
    ],
    segmentsBack: [
      { 
        segment_number: 1, 
        airline: 'Lufthansa',
        flight_number: 'LH124', 
        booking_class: 'Y',
        from: { iata: 'IST', airport: 'Istanbul' }, 
        to: { iata: 'FRA', airport: 'Frankfurt' },
        departure_time: '16:00',
        arrival_time: '18:00'
      }
    ]
  },
  hotelDto: {
    name: 'Grand Resort & Spa',
    location: 'Antalya, Türkei',
    check_in: '15.06.2024',
    check_out: '22.06.2024',
    nights: 7,
    room_type: 'Doppelzimmer Meerblick',
    board_type: 'All Inclusive',
    verpflegung: []
  },
  package_details: {
    package_name: 'Sommer Sonne Strand Paket',
    destination: 'Türkische Riviera',
    duration: '8 Tage / 7 Nächte',
    services: ['Transfer Flughafen-Hotel-Flughafen', 'Reiseleitung vor Ort', 'Willkommens-Cocktail'],
    verpflegung: []
  },
  payments: {
    payment_method: 'Banküberweisung',
    invoice_status: 'offen',
    invoice_total: 1250.50,
    invoice_paid_amount: 0,
    invoice_balance: 1250.50,
    payment_date: '27.03.2024',
    currency: 'EUR',
    line_items: [
      { name: 'Flugpreis p.P.', amount: 450 },
      { name: 'Servicegebühr', amount: 50 },
      { name: 'Steuern & Gebühren', amount: 250.50 }
    ]
  },
  booking: {
    booking_date: '27.03.2024',
    travel_start_date: '15.06.2024',
    travel_end_date: '22.06.2024',
    services: []
  },
  legal_notes: {
    immediate_due_notice: 'Zahlbar innerhalb von 14 Tagen.',
    tax_change_notice: 'Umsatzsteuerfrei gemäß § 25 UStG.',
    usa_esta_notice: 'Bitte beachten Sie die Einreisebestimmungen.'
  },
  system_meta: {
    source_type: 'pdf',
    extraction_model: 'gemini-pro',
    extracted_at: '2024-03-27T10:00:00Z'
  }
};

export function InvoiceDesignerPage() {
  const [settings, setSettings] = useState<InvoiceDesignerSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'style'>('layout');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agencyLogoPath, setAgencyLogoPath] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to fetch from custom API first
        const response = await fetch(`${API_URL}/api/PrintSetting/loadSetting`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data) setSettings(data);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('invoice_designer_settings');
          if (saved) setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load settings from DB:', error);
        const saved = localStorage.getItem('invoice_designer_settings');
        if (saved) setSettings(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<InvoiceDesignerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const token = localStorage.getItem("token");

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to custom API
      const response = await fetch(`${API_URL}/api/PrintSetting/saveSetting`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save to DB');

      // Also save to localStorage as backup
      localStorage.setItem('invoice_designer_settings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save to database. Saving locally instead.');
      localStorage.setItem('invoice_designer_settings', JSON.stringify(settings));
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('invoice_designer_settings');
    toast.success('Settings reset to default');
  };

  const toggleVisibility = (section: string) => {
    setSettings(prev => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [section]: !prev.sectionVisibility[section]
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="text-emerald-500 animate-spin mb-4" size={48} />
        <p className="text-zinc-500 font-medium">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* LEFT CONTROL PANEL */}
        <div className="w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-xl z-10 print:hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <LayoutIcon className="text-emerald-500" size={20} />
                Invoice Designer
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Customize your print layout</p>
            </div>
          </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('layout')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === 'layout' ? "text-emerald-500 border-b-2 border-emerald-500" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Layout
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === 'content' ? "text-emerald-500 border-b-2 border-emerald-500" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Content
          </button>
          <button 
            onClick={() => setActiveTab('style')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === 'style' ? "text-emerald-500 border-b-2 border-emerald-500" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Style
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Logo Position */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Logo Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateSettings({ logoPosition: pos })}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1",
                        settings.logoPosition === pos 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" 
                          : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                      )}
                    >
                      {pos === 'left' && <AlignLeft size={16} />}
                      {pos === 'center' && <AlignCenter size={16} />}
                      {pos === 'right' && <AlignRight size={16} />}
                      <span className="capitalize">{pos}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Size */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Logo Size
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="60"
                    max="150"
                    step="10"
                    value={settings.logoSize}
                    onChange={(e) => updateSettings({ logoSize: parseInt(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 w-12 text-right">
                    {settings.logoSize}px
                  </span>
                </div>
              </div>

              {/* IATA Logo Toggle */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> IATA Logo
                </label>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Show IATA Logo</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showIataLogo} 
                    onChange={(e) => updateSettings({ showIataLogo: e.target.checked })}
                    className="accent-emerald-500"
                  />
                </div>
              </div>

              {/* Block Positions */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Company Block</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['left', 'right'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => updateSettings({ companyBlockPosition: pos as any })}
                        className={cn(
                          "p-2 rounded-lg border text-xs font-medium transition-all",
                          settings.companyBlockPosition === pos 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" 
                            : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                        )}
                      >
                        {pos === 'left' ? 'Left' : 'Right'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer Block</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['left', 'right'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => updateSettings({ customerBlockPosition: pos as any })}
                        className={cn(
                          "p-2 rounded-lg border text-xs font-medium transition-all",
                          settings.customerBlockPosition === pos 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" 
                            : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                        )}
                      >
                        {pos === 'left' ? 'Left' : 'Right'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section Ordering */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Move size={14} /> Section Order
                </label>
                <div className="space-y-1">
                  {settings.sectionOrdering.map((section, index) => (
                    <div 
                      key={section}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                    >
                      <span className="text-xs font-medium capitalize">{section}</span>
                      <div className="flex gap-1">
                        <button 
                          disabled={index === 0}
                          onClick={() => {
                            const newOrder = [...settings.sectionOrdering];
                            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                            updateSettings({ sectionOrdering: newOrder });
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="rotate-180" size={14} />
                        </button>
                        <button 
                          disabled={index === settings.sectionOrdering.length - 1}
                          onClick={() => {
                            const newOrder = [...settings.sectionOrdering];
                            [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                            updateSettings({ sectionOrdering: newOrder });
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacing Mode */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Columns size={14} /> Density
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['compact', 'spacious'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ mode: m })}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-medium transition-all",
                        settings.mode === m 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" 
                          : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                      )}
                    >
                      <span className="capitalize">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Square size={14} /> Decorations
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Show Borders</span>
                    <input 
                      type="checkbox" 
                      checked={settings.showBorders} 
                      onChange={(e) => updateSettings({ showBorders: e.target.checked })}
                      className="accent-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Show Dividers</span>
                    <input 
                      type="checkbox" 
                      checked={settings.showDividers} 
                      onChange={(e) => updateSettings({ showDividers: e.target.checked })}
                      className="accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Title Customization */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TypeIcon size={14} /> Invoice Title
                </label>
                <input 
                  type="text"
                  value={settings.titleCustomization}
                  onChange={(e) => updateSettings({ titleCustomization: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="e.g. REISE-RECHNUNG"
                />
              </div>

              {/* Section Visibility */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Section Visibility</label>
                <div className="space-y-1">
                  {Object.entries(settings.sectionVisibility).map(([section, visible]) => (
                    <button
                      key={section}
                      onClick={() => toggleVisibility(section)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
                        visible 
                          ? "bg-emerald-50/50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400" 
                          : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800/30"
                      )}
                    >
                      <span className="capitalize">{section}</span>
                      {visible ? <Eye size={14} /> : <Eye className="opacity-30" size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Primary Color */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} /> Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TypeIcon size={14} /> Base Font Size
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="8"
                    max="16"
                    step="0.5"
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseFloat(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 w-12 text-right">
                    {settings.fontSize}px
                  </span>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft size={14} /> Global Alignment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['left', 'center'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateSettings({ alignment: align })}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2",
                        settings.alignment === align 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" 
                          : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                      )}
                    >
                      {align === 'left' ? <AlignLeft size={14} /> : <AlignCenter size={14} />}
                      <span className="capitalize">{align}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button 
              onClick={resetSettings}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-zinc-700 dark:text-zinc-300 hover:text-red-600 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
            >
              <X size={14} />
              Reset
            </button>
          </div>
          {/* <button 
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Printer size={18} />
            Print Invoice
          </button> */}
        </div>
      </div>

      {/* RIGHT PREVIEW AREA */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-zinc-100  print:p-0 print:bg-white print:overflow-visible">
        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full print:min-h-0 origin-top transition-transform duration-500">
          <InvoicePreview data={MOCK_INVOICE} settings={settings} agencyLogoPath={agencyLogoPath} />
        </div>
      </div>
    </div>
  );
}

