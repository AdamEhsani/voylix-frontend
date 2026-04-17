import { API_URL } from "../config/api";
import React from 'react';
import { Printer } from 'lucide-react';
import { InvoiceDesignerSettings, TravelInvoice } from '../types';
import { cn } from '../utils';
import LogoAgency from './LogoAgency';

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
                <div className="text-[10px] text-zinc-500 space-y-0.5">
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
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Rechnungsempfänger</p>
              <div className="space-y-1">
                <p className="font-bold text-lg">{data.customer?.company_name}</p>
                <p>{data.customer?.address?.street}</p>
                <p>{data.customer?.address?.postalCode} {data.customer?.address?.city}</p>
                <p>{data.customer?.address?.country}</p>
              </div>
            </div>

            {/* Meta Block */}
            <div className={cn("text-right space-y-1", customerBlockPosition === 'right' && "order-1 text-left")}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-zinc-400 font-medium">Rechnungsnummer:</span>
                <span className="font-bold">{'R-' + data.id}</span>
                <span className="text-zinc-400 font-medium">Datum:</span>
                <span className="font-bold">{data.invoice_meta?.invoice_date}</span>
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Reiseteilnehmer</h3>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {data.passengers.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="font-medium">{p.first_name} {p.last_name}</span>
                  <span className="text-[10px] text-zinc-400">({p.type})</span>
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
                          <th className="px-3 py-1.5 text-[9px] font-bold text-zinc-400 uppercase w-16">{label}</th>
                          <th className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase">Airline</th>
                          <th className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase">Strecke</th>
                          <th className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase text-right">Abflug / Ankunft</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {segments.map((s, i) => (
                          <tr key={i} className="text-[10px]">
                            <td className="px-3 py-1.5 text-zinc-700 font-bold">{s.flight_number}</td>
                            <td className="px-3 py-1.5 text-zinc-700">{s.airline || data.flight_details.airline}</td>
                            <td className="px-3 py-1.5 text-zinc-700">{s.from?.airport} → {s.to?.airport}</td>
                            <td className="px-3 py-1.5 text-right text-zinc-700 whitespace-nowrap">
                              <span className="font-bold">{s.departure_time}</span>
                              <span className="mx-1 text-zinc-300">/</span>
                              <span>{s.arrival_time}</span>
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
            <div className={cn("p-3", borderClass)}>
              <div className="grid grid-cols-5 gap-4 items-center">

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">Hotel / Standort</p>
                  <p className="text-zinc-700 font-bold text-[10px]">{data.hotelDto.name}</p>
                  <p className="text-zinc-500 text-[9px]">{data.hotelDto.location}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">Check-In</p>
                  <p className="font-bold text-[10px]">{data.hotelDto.check_in}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">Check-Out</p>
                  <p className="font-bold text-[10px]">{data.hotelDto.check_out}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">Zimmer</p>
                  <p className="text-[10px]">{data.hotelDto.room_type}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">Inklusive</p>
                  <p className="text-[9px] text-zinc-500">
                    {data.hotelDto.verpflegung?.map(v => {
                      if (v.type === 'breakfast') return 'Frühstück';
                      if (v.type === 'half_board') return 'HP';
                      if (v.type === 'full_board') return 'VP';
                      if (v.type === 'all_inclusive') return 'All Inclusive';
                      if (v.type === 'transfer') return 'Transfer';
                      return '';
                    }).join(', ')}
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
            <div className={cn("space-y-4", borderClass)}>
              {/* Package Verpflegung */}
              {data.package_details.verpflegung && data.package_details.verpflegung.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.package_details.verpflegung.map((v, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded border border-zinc-100 text-[10px] font-bold">
                      {v.type === 'breakfast' && <span className="text-amber-600">Frühstück</span>}
                      {v.type === 'half_board' && <span className="text-orange-600">Halbpension</span>}
                      {v.type === 'full_board' && <span className="text-red-600">Vollpension</span>}
                      {v.type === 'all_inclusive' && <span className="text-emerald-600">All Inclusive</span>}
                      {v.type === 'transfer' && <span className="text-blue-600">Transfer</span>}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-900">
                  <th className="text-left py-2 font-black uppercase tracking-tighter">Leistung / Beschreibung</th>
                  <th className="text-right py-2 font-black uppercase tracking-tighter">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.payments?.line_items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-right font-bold">{item.amount.toLocaleString('de-DE', { style: 'currency', currency: data.payments.currency })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-900">
                  <td className="py-4 text-lg font-black uppercase tracking-tighter">Gesamtbetrag</td>
                  <td className="py-4 text-right text-xl font-black" style={{ color: primaryColor }}>
                    {Number(data.payments?.invoice_total).toLocaleString('de-DE', { style: 'currency', currency: data.payments.currency })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'footer':
        return (
          <div key="footer" className="mt-auto pt-1 border-t border-zinc-100">
            <div className="grid grid-cols-3 gap-8 text-[9px] text-zinc-400 leading-relaxed">
              <div>
                <p className="font-bold text-zinc-900 uppercase mb-1">Zahlungsinformationen</p>
                <p>Bitte überweisen Sie den Betrag bis zum {data.payments?.payment_date}.</p>
                <p>IBAN: DE12 3456 7890 1234 5678 90</p>
                <p>BIC: GENO DE F1 M01</p>
              </div>
              <div>
                <p className="font-bold text-zinc-900 uppercase mb-1">Rechtliche Hinweise</p>
                <p>{data.legal_notes?.immediate_due_notice}</p>
                <p>{data.legal_notes?.tax_change_notice}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900 uppercase mb-1">Kontakt</p>
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

  return (
    <div
      className={cn(
        "w-full min-h-full flex flex-col bg-white text-zinc-900 print:h-auto print:min-h-0",
        alignment === 'center' && "text-center"
      )}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div className="p-12 flex-1 flex flex-col">
        {sectionOrdering.map(section => renderSection(section))}
      </div>
    </div>
  );
}
