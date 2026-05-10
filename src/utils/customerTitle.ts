// Voylix: title (Anrede) bedone migration. Tu FirstName-e DB store mishe ba prefix.
// Masalan: title="Dr.", firstName="Mahdi" → DB.FirstName = "Dr. Mahdi"
// Mahabe: hangaame namayesh-e moshtari to faktor ya jadval, "FirstName LastName" automatic
// shamel-e title mishe — hich taghir-e component-i tu Druck/Liste lazem nadarad.

export const KNOWN_TITLES: string[] = [
  // longer titles first, ta sub-strings (mesle "Dr.") ja-ye titre tul-tar match nashe
  'Prof. Dr. med. dent.',
  'Prof. Dr. med.',
  'Prof. Dr.',
  'Prof.',
  'Dr. med. dent.',
  'Dr. med.',
  'Dr. rer. nat.',
  'Dr. phil.',
  'Dr. Ing.',
  'Dr.-Ing.',
  'Dipl.-Ing.',
  'Dipl.-Kfm.',
  'Dipl.-Kffr.',
  'Mag.',
  'Dr.',
  'Herr',
  'Frau',
  'Mr.',
  'Mrs.',
  'Ms.',
];

/**
 * Parse out title from a stored FirstName.
 * - "Dr. Mahdi" → { title: "Dr.", firstName: "Mahdi" }
 * - "Mahdi"     → { title: "",   firstName: "Mahdi" }
 * - ""          → { title: "",   firstName: "" }
 *
 * Comparing case-insensitively dar prefix-e FirstName-e modell-shode.
 */
export function parseTitleAndName(stored: string | null | undefined): { title: string; firstName: string } {
  const raw = (stored ?? '').trim();
  if (!raw) return { title: '', firstName: '' };

  // longest-first scan
  for (const t of KNOWN_TITLES) {
    const lowerStored = raw.toLowerCase();
    const lowerTitle  = t.toLowerCase();
    if (
      lowerStored === lowerTitle ||
      lowerStored.startsWith(lowerTitle + ' ')
    ) {
      const rest = raw.slice(t.length).trimStart();
      return { title: t, firstName: rest };
    }
  }
  return { title: '', firstName: raw };
}

/**
 * Combine title + firstName for storage.
 */
export function joinTitleAndName(title: string | null | undefined, firstName: string | null | undefined): string {
  const t = (title ?? '').trim();
  const f = (firstName ?? '').trim();
  if (!t) return f;
  if (!f) return t;
  return `${t} ${f}`;
}
