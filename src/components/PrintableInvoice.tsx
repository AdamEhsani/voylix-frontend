import React from 'react';
import { TravelInvoice, InvoiceDesignerSettings } from '../types';
import { InvoicePreview } from './InvoicePreview';

interface Props {
  invoice: TravelInvoice;
  settings: InvoiceDesignerSettings;
  visible?: boolean;
}

export function PrintableInvoice({ invoice, settings, visible }: Props) {
  return (
    <div className={visible ? 'block print:block' : 'hidden print:block'}>
      <div className="w-[210mm] min-h-[297mm] bg-white mx-auto">
        <InvoicePreview data={invoice} settings={settings} />
      </div>
    </div>
  );
}