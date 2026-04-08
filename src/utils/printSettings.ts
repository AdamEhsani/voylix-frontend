import { InvoiceDesignerSettings } from '../types';

export const DEFAULT_SETTINGS: InvoiceDesignerSettings = {
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
  titleCustomization: 'RECHNUNG',
  mode: 'spacious',
  alignment: 'left',
  showBorders: false,
  showDividers: true,
  primaryColor: '#101bb9',
  fontSize: 8
};

export function mergePrintSettings(
  incoming?: Partial<InvoiceDesignerSettings> | null
): InvoiceDesignerSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...incoming,
    sectionOrdering: incoming?.sectionOrdering ?? DEFAULT_SETTINGS.sectionOrdering,
    sectionVisibility: {
      ...DEFAULT_SETTINGS.sectionVisibility,
      ...(incoming?.sectionVisibility ?? {})
    }
  };
}