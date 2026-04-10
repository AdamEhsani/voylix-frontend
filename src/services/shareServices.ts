import { SHARE_CONFIG } from '../config/shareConfig';

export interface SharePayload {
  channel: 'email' | 'whatsapp';
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  message?: string;
  fileName: string;
  fileBase64: string; // Base64 encoded PDF
  metadata?: Record<string, any>;
}

class ShareService {
  /**
   * Sends the invoice data and file to the configured webhook.
   */
  async sendInvoice(payload: SharePayload): Promise<void> {
    
    try {
      const response = await fetch(SHARE_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: SHARE_CONFIG.HEADERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send invoice: ${response.status} ${errorText}`);
      }
      
    } catch (error) {
      console.error('Error in ShareService.sendInvoice:', error);
      throw error;
    }
  }
}

export const shareService = new ShareService();
