import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '../utils';

// Voylix: Photon (Komoot) — geocoder-e raygan, sari, mahsus baray-e autocomplete-e Adresse
// API: https://photon.komoot.io/api/?q=<query>&lang=de&limit=N
// Khoroji GeoJSON-e standard. Hich API key lazem nadarad.

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  osm_key?: string;
  osm_value?: string;
}

interface PhotonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: PhotonProperties;
}

export interface AddressSelection {
  street: string;     // street name (without house number)
  postalCode: string;
  city: string;
  country: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (addr: AddressSelection) => void;
  placeholder?: string;
  /** Min number of characters before searching. Default 4. */
  minChars?: number;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  minChars = 4,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Vaqti user yek pishnehad ro click mikone, ye flag mikhabe
  // ta useEffect dobare query nazane.
  const skipNextSearchRef = useRef(false);

  // Click-outside → close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = value.trim();
    if (trimmed.length < minChars) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        // Bbox-e Almaan baray bias — mostaqim azish javab-e behtari migiri
        const bbox = '5.866,47.270,15.041,55.058';
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=de&limit=10&bbox=${bbox}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error('Photon error');
        const data: { features: PhotonFeature[] } = await res.json();
        const features = (data.features ?? []).filter(f => {
          const p = f.properties;
          // Faqat Almaan ya neshani-haye dakhel-e bbox ke postcode darand
          const isDe = p.country === 'Germany' || p.country === 'Deutschland' || p.countrycode === 'DE';
          // Hadafmast: street ya place ke postcode + city dare
          const hasUseful = !!(p.street || p.name);
          return isDe && hasUseful;
        });
        // De-duplicate ba esme khiaaban + postcode
        const seen = new Set<string>();
        const unique = features.filter(f => {
          const key = `${(f.properties.street ?? f.properties.name ?? '').toLowerCase()}|${f.properties.postcode ?? ''}|${f.properties.city ?? ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 7);
        setSuggestions(unique);
        setOpen(unique.length > 0);
        setActiveIdx(-1);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Address autocomplete error:', err);
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minChars]);

  const formatLine1 = (p: PhotonProperties) => {
    const street = p.street ?? p.name ?? '';
    return p.housenumber ? `${street} ${p.housenumber}` : street;
  };
  const formatLine2 = (p: PhotonProperties) => {
    const parts = [p.postcode, p.city ?? p.district ?? p.state]
      .filter(Boolean) as string[];
    return parts.join(' ');
  };

  const handleSelect = (f: PhotonFeature) => {
    const p = f.properties;
    const street = p.street ?? p.name ?? '';
    const selection: AddressSelection = {
      street: street,                                  // bedoone Hausnr — user khodash bezane
      postalCode: p.postcode ?? '',
      city: p.city ?? p.district ?? p.state ?? '',
      country: p.country === 'Germany' ? 'Deutschland' : (p.country ?? 'Deutschland'),
    };
    skipNextSearchRef.current = true;
    onChange(street);                                  // input-e Straße faqat ba esm-e khiaaban por mishe
    onSelect(selection);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(idx => Math.min(idx + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(idx => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Straße eingeben (ab 4 Zeichen)'}
          autoComplete="off"
          className={cn(
            'w-full px-4 py-2.5 pr-9 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all',
            className,
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl divide-y divide-zinc-100 dark:divide-zinc-800">
          {suggestions.map((f, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(f)}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                'w-full text-left px-4 py-2.5 transition-colors flex items-start gap-2',
                activeIdx === i
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
              )}
            >
              <MapPin size={14} className="mt-0.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {formatLine1(f.properties)}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {formatLine2(f.properties) || f.properties.country || ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
