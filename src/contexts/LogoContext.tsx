import { API_URL } from "../config/api";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

type LogoContextType = {
  logoUrl: string | null;
  loading: boolean;
};

const LogoContext = createContext<LogoContextType>({
  logoUrl: null,
  loading: true,
});

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLogoUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const url = `${API_URL}/uploads/logo/agency?token=${token}`;

    const img = new Image();
    img.src = url;

    img.onload = () => {
      setLogoUrl(url);
      setLoading(false);
    };

    img.onerror = () => {
      setLogoUrl(null);
      setLoading(false);
    };
  }, [token]);

  return (
    <LogoContext.Provider value={{ logoUrl, loading }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
