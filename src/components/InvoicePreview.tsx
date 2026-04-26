import { API_URL } from "../config/api";
import React from 'react';
import { Printer } from 'lucide-react';
import { InvoiceDesignerSettings, TravelInvoice } from '../types';
import { cn, formatDate } from '../utils';
import LogoAgency from './LogoAgency';

// Voylix: datetime ro be format DE neshon bedim "DD.MM.YYYY HH:mm"
const formatDateTime = (s?: string | null): string => {
  if (!s) return '';
  const str = String(s).trim();
  if (!str) return '';
  // age YYYY-MM-DD ya YYYY-MM-DDTHH:mm bashe Date(...) khob parse mikone
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    // age sa'at sefr-sefr bashe yani fght date dade shod, time neshon nadim
    if (hh === '00' && mi === '00' && !/T|\s\d{2}:\d{2}/.test(str)) {
      return `${dd}.${mm}.${yyyy}`;
    }
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }
  return str;
};

interface InvoicePreviewProps {
  data: TravelInvoice;
  settings: InvoiceDesignerSettings;
  agencyLogoPath?: string | null;
}

export function InvoicePreview({ data, settings, agencyLogoPath }: InvoicePreviewProps) {
  const {
    logoPosition,
    logoSize,
    showIataLogo,
    companyBlockPosition,
    customerBlockPosition,
    sectionVisibility,
    sectionOrdering,
    titleCustomization,
    mode,
    alignment,
    showBorders,
    showDividers,
    primaryColor,
    fontSize
  } = settings;

  const spacingClass = mode === 'compact' ? 'py-1' : 'py-3';
  const borderClass = showBorders ? 'border border-zinc-200 p-4 rounded-lg' : '';
  const dividerClass = showDividers ? 'border-b border-zinc-100' : '';

  const renderSection = (section: string) => {
    if (!sectionVisibility[section]) return null;

    switch (section) {
      case 'header':
        return (
          <div key="header" className={cn("flex flex-col gap-8", dividerClass)}>
            {/* Logo Row */}
            <div className={cn(
              "flex w-full flex-col",
              logoPosition === 'left' && "items-start",
              logoPosition === 'center' && "items-center",
              logoPosition === 'right' && "items-end"
            )}>
              <LogoAgency logoSize={logoSize} logoPosition={logoPosition} />

              {/* IATA Logo */}
              {(data.show_iata_logo !== undefined ? data.show_iata_logo : settings.showIataLogo) && (
                <div className="mt-2">
                  <img
                    src={`${API_URL}/uploads/Logo/IATA`}
                    alt="IATA Logo"
                    style={{ width: logoSize * 0.8 }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if API_URL is not accessible
                      (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/en/thumb/0/00/IATA_logo.svg/1200px-IATA_logo.svg.png';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Company Info Row */}
            <div className={cn(
              "flex w-full",
              companyBlockPosition === 'left' ? "justify-start" : "justify-end"
            )}>
              <div className={cn("text-right", companyBlockPosition === 'left' && "text-left")}>
                <h1 className="text-2xl font-black tracking-tighter mb-2" style={{ color: primaryColor }}>
                  {titleCustomization}
                </h1>
                <div className="text-[8.5px] text-zinc-500 space-y-0.5">
                  <p className="font-bold text-zinc-900">TRAVEL AGENCY CRM GMBH</p>
                  <p>Musterstraße 1, 12345 Berlin</p>
                  <p>Tel: +49 30 12345678 | Email: info@travel-crm.de</p>
                  <p>USt-IdNr.: DE 123 456 789</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'customer':
        return (
          <div key="customer" className={cn("grid grid-cols-2 gap-12", spacingClass, dividerClass)}>
            {/* Customer Block */}
            <div className={cn(customerBlockPosition === 'right' && "order-2")}>
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Rechnungsempfänger</p>
              <div className="space-y-0.5">
                {/* Voylix: agar Firma exist konad — Firma bala, Name pain. Vagarna faghat Name. */}
                {data.customer?.company_name ? (
                  <>
                    <p className="font-bold text-base">{data.customer.company_name}</p>
                    {data.customer?.customer_name && (
                      <p className="text-[10px]">{data.customer.customer_name}</p>
                    )}
                  </>
                ) : (
                  <p className="font-bold text-base">{data.customer?.customer_name}</p>
                )}
                <p className="text-[10px]">{data.customer?.address?.street}</p>
                <p className="text-[10px]">{data.customer?.address?.postalCode} {data.customer?.address?.city}</p>
                <p className="text-[10px]">{data.customer?.address?.country}</p>
              </div>
            </div>

            {/* Meta Block */}
            <div className={cn("text-right space-y-1", customerBlockPosition === 'right' && "order-1 text-left")}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                <span className="text-zinc-400 font-medium">Rechnungsnummer:</span>
                <span className="font-bold">{'R-' + data.id}</span>
                <span className="text-zinc-400 font-medium">Datum:</span>
                <span className="font-bold">{formatDate(data.invoice_meta?.invoice_date ?? null)}</span>
                <span className="text-zinc-400 font-medium">Kundennummer:</span>
                <span className="font-bold">{"C-" + data.customer?.customerNumber}</span>
              </div>
            </div>
          </div>
        );

      case 'passengers':
        if (!data.passengers || data.passengers.length === 0) return null;
        return (
          <div key="passengers" className={cn(spacingClass, dividerClass)}>
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Reiseteilnehmer</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px]">
              {data.passengers.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                  <span className="font-medium text-zinc-800">{p.first_name} {p.last_name}</span>
                  <span className="text-[9px] text-zinc-400">({p.type})</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'flight': {
        const type = data.invoice_meta?.invoice_type;

        const shouldShowFlight =
          type === 'Flug' ||
          type === 'Package';

        const hasFlightData =
          (data.flight_details?.segmentsTo?.length ?? 0) > 0 ||
          (data.flight_details?.segmentsBack?.length ?? 0) > 0;

        if (!shouldShowFlight || !hasFlightData) return null;

        return (
          <div key="flight" className={cn(spacingClass, dividerClass)}>
            <div className="space-y-1">
              {[
                { label: 'Hinflug', segments: data.flight_details.segmentsTo },
                { label: 'Rückflug', segments: data.flight_details.segmentsBack }
              ].map(({ label, segments }, groupIdx) => (
                segments && segments.length > 0 && (
                  <div key={groupIdx} className="overflow-hidden border border-zinc-100 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="px-3 py-1 text-[8px] font-bold text-zinc-400 uppercase whitespace-nowrap" style={{ width: '110px' }}>{label}</th>
                          <th className="px-3 py-1 text-[8px] font-bold text-zinc-500 uppercase">Airline</th>
                          <th className="px-3 py-1 text-[8px] font-bold text-zinc-500 uppercase">Strecke</th>
                          <th className="px-3 py-1 text-[8px] font-bold text-zinc-500 uppercase text-right">Abflug / Ankunft</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {segments.map((s, i) => (
                          <tr key={i} className="text-[9.5px]">
                            <td className="px-3 py-1 text-zinc-700 font-bold whitespace-nowrap">{s.flight_number}</td>
                            <td className="px-3 py-1 text-zinc-700">{s.airline || data.flight_details.airline}</td>
                            <td className="px-3 py-1 text-zinc-700">{s.from?.airport} → {s.to?.airport}</td>
                            <td className="px-3 py-1 text-right text-zinc-700 whitespace-nowrap">
                              <span className="px-3 py-1 text-zinc-700">{formatDateTime(s.departure_time)}</span>
                              <span className="mx-1 text-zinc-300">/</span>
                              <span>{formatDateTime(s.arrival_time)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      }

      case 'hotel': {
        const type = data.invoice_meta?.invoice_type;
        const shouldShowHotel =
          type === 'Hotel' ||
          type === 'Package';
        
        if (!shouldShowHotel || !data.hotelDto) return null;
        return (
          <div key="hotel" className={cn(spacingClass, dividerClass)}>
            <div className={cn("p-2", borderClass)}>
              <div className="grid grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mb-0.5">Hotel / Standort</p>
                  <p className="text-zinc-700 font-bold text-[9.5px] leading-tight">{data.hotelDto.name}</p>
                  <p className="text-zinc-500 text-[8.5px] leading-tight">{data.hotelDto.location}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mb-0.5">Check-In</p>
                  <p className="font-bold text-[9.5px]">{formatDate(data.hotelDto.check_in ?? null)}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mb-0.5">Check-Out</p>
                  <p className="font-bold text-[9.5px]">{formatDate(data.hotelDto.check_out ?? null)}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mb-0.5">Zimmer</p>
                  <p className="text-[9.5px]">{data.hotelDto.room_type}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mb-0.5">Inklusive</p>
                  <p className="text-[8.5px] text-zinc-500">
                    {data.hotelDto.verpflegung?.map(v => {
                      if (v.type === 'breakfast') return 'Frühstück';
                      if (v.type === 'half_board') return 'Halbpension';
                      if (v.type === 'full_board') return 'Vollpension';
                      if (v.type === 'all_inclusive') return 'All Inclusive';
                      if (v.type === 'transfer') return 'Transfer';
                      return '';
                    }).filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'package':
        if (!data.package_details) return null;
        return (
          <div key="package" className={cn(spacingClass, dividerClass)}>
            <div className={cn("space-y-2", borderClass)}>
              {data.package_details.verpflegung && data.package_details.verpflegung.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.package_details.verpflegung.map((v, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-50 rounded border border-zinc-100 text-[8.5px] font-bold">
                      {v.type === 'breakfast' && <span className="text-zinc-600">Frühstück</span>}
                      {v.type === 'half_board' && <span className="text-zinc-600">Halbpension</span>}
                      {v.type === 'full_board' && <span className="text-zinc-600">Vollpension</span>}
                      {v.type === 'all_inclusive' && <span className="text-zinc-600">All Inclusive</span>}
                      {v.type === 'transfer' && <span className="text-zinc-600">Transfer</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div key="payments" className={cn("mb-2", spacingClass)}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b-2 border-zinc-900">
                  <th className="text-left py-2 font-bold">Leistung / Beschreibung</th>
                  <th className="text-right py-2 font-bold">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.payments?.line_items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium">{item.name}</td>
                    <td className="py-2.5 text-right font-bold">{item.amount.toLocaleString('de-DE', { style: 'currency', currency: data.payments.currency })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-900">
                  <td className="py-3 text-base font-bold text-zinc-900">Gesamtbetrag</td>
                  <td className="py-3 text-right text-lg font-bold" style={{ color: primaryColor }}>
                    {Number(data.payments?.invoice_total).toLocaleString('de-DE', { style: 'currency', currency: data.payments.currency })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'footer':
        return (
          <div key="footer" className="mt-auto pt-4 border-t border-zinc-100">
            <div className="grid grid-cols-3 gap-8 text-[8px] text-zinc-400 leading-normal">
              <div>
                <p className="font-bold text-zinc-900 uppercase mb-1">Zahlungsinformationen</p>
                <p>Bitte überweisen Sie den Betrag bis zum {formatDate(data.payments?.payment_date ?? null)}.</p>
                <p>IBAN: DE12 3456 7890 1234 5678 90</p>
                <p>BIC: GENO DE F1 M01</p>
              </div>
              <div>
                <p className="font-bold text-zinc-900 uppercase mb-1">Rechtliche Hinweise</p>
                <p>{data.legal_notes?.immediate_due_notice}</p>
                <p>{data.legal_notes?.tax_change_notice}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900 uppercase mb-1 text-zinc-600">Kontakt</p>
                <p>Travel Agency CRM GmbH</p>
                <p>Am Kupfergraben 6, 10117 Berlin</p>
                <p>www.travel-crm.de</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStorniert = data.payments?.invoice_status === 'storniert';

  return (
    <div
      className={cn(
        "relative w-full flex-1 flex flex-col bg-white text-zinc-900 print:h-auto print:min-h-0",
        alignment === 'center' && "text-center"
      )}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Voylix: Storno-Wasserzeichen — sowohl on-screen ham roy print neshon dade mishe */}
      {isStorniert && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' as any }}
        >
          <span
            className="font-extrabold tracking-widest uppercase select-none"
            style={{
              color: 'rgba(220, 38, 38, 0.18)',
              border: '8px solid rgba(220, 38, 38, 0.18)',
              padding: '12px 40px',
              borderRadius: '12px',
              transform: 'rotate(-22deg)',
              fontSize: '96px',
              letterSpacing: '0.15em',
              whiteSpace: 'nowrap',
            }}
          >
            Storniert
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col min-h-[275mm]">
        {sectionOrdering.map(section => renderSection(section))}
      </div>
    </div>
  );
}
