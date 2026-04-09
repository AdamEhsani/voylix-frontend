import { InvoiceDesignerSettings } from '../types';
import { mergePrintSettings } from './printSettings';
import { API_URL } from "../config/api";

export async function fetchPrintSettings(): Promise<InvoiceDesignerSettings> {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/PrintSetting/loadSetting`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error();

    const data = await response.json();
    return mergePrintSettings(data);
  } catch {
    const saved = localStorage.getItem('invoice_designer_settings');
    if (saved) {
      try {
        return mergePrintSettings(JSON.parse(saved));
      } catch {
        return mergePrintSettings();
      }
    }
    return mergePrintSettings();
  }
}