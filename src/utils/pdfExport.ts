import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Utility to generate a PDF from an HTML element in the background.
 */
export async function generateInvoicePdf(element: HTMLElement, fileName: string): Promise<{ blob: Blob; base64: string }> {
  try {
    // We use a high scale for better quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
    * {
      color: revert !important;
      background-color: revert !important;
      border-color: revert !important;
    }
    body, * {
      --tw-prose-body: #374151;
    }
  `;
        clonedDoc.head.appendChild(style);

        const elements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const computed = window.getComputedStyle(el);
          const bg = computed.backgroundColor;
          const color = computed.color;
          if (bg.includes('oklch')) el.style.backgroundColor = '#ffffff';
          if (color.includes('oklch')) el.style.color = '#000000';
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const blob = pdf.output('blob');

    // Convert to base64 for easy API transmission
    const base64 = pdf.output('datauristring').split(',')[1];

    return { blob, base64 };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}
