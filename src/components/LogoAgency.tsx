import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { useLogo } from "../contexts/LogoContext";

interface LogoAgencyProps {
  logoSize?: number;
  logoPosition?: 'left' | 'center' | 'right';
  className?: string;
}

export default function LogoAgency({ logoSize = 80, logoPosition = 'left', className = "" }: LogoAgencyProps) {
  const { logoUrl, loading } = useLogo();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 overflow-hidden border-4 border-white dark:border-zinc-900 ${className}`}
      style={{ width: logoSize, height: logoSize }}
    >
      {!loading && logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Building2 size={logoSize * 0.5} />
      )}
    </div>
  );
}
