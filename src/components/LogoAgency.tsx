import { useState } from "react";
import { Building2 } from "lucide-react";
import { useLogo } from "../contexts/LogoContext";

export default function LogoAgency({ className = "" }) {
  const { logoUrl, loading } = useLogo();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative w-20 h-20 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 overflow-hidden border-4 border-white dark:border-zinc-900 ${className}`}
    >
      {!loading && logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Building2 size={40} />
      )}
    </div>
  );
}