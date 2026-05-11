import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

// Voylix: agency-info-e fa'aal — yek bar load mishe va be hame component-haye namayesh
// (mese InvoicePreview) provide mishe. Az endpoint /api/Agency miad.
export interface AgencyInfo {
  id?: number;
  name?: string;
  legalName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  vatId?: string;
  taxInfo?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  workingHours?: string;
  logoPath?: string;
}

interface AgencyContextValue {
  agency: AgencyInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AgencyContext = createContext<AgencyContextValue>({
  agency: null,
  loading: true,
  refresh: async () => {},
});

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [agency, setAgency]   = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgency = async () => {
    if (!token) {
      setAgency(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/Agency`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAgency(null);
        return;
      }
      const data = await res.json();
      // Endpoint bargasht: { agency: {...}, emailUser: "..." }
      const a = data?.agency ?? data;
      if (a) {
        setAgency({
          id:           a.id,
          name:         a.name,
          legalName:    a.legalName,
          address:      a.address,
          postalCode:   a.postalCode,
          city:         a.city,
          phone:        a.phone,
          email:        a.email,
          website:      a.website,
          vatId:        a.vatId,
          taxInfo:      a.taxInfo,
          iban:         a.iban,
          bic:          a.bic,
          bankName:     a.bankName,
          workingHours: a.workingHours,
          logoPath:     a.logoPath,
        });
      } else {
        setAgency(null);
      }
    } catch (e) {
      console.error('Failed to fetch agency:', e);
      setAgency(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AgencyContext.Provider value={{ agency, loading, refresh: fetchAgency }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  return useContext(AgencyContext);
}
