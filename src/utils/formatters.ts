/**
 * Utilitas pemformatan nama dan gelar resmi kedinasan
 * Sesuai Pedoman Umum Ejaan Bahasa Indonesia (PUEBI) dan Tata Naskah Dinas
 */

export function formatOfficialNameWithDegree(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';

  // Pemetaan kanonikal gelar akademik / profesi (huruf besar & kecil standar resmi)
  const degreeMap = [
    { regex: /\bS\.?\s*Pd\.?\s*I\.?/gi, canonical: 'S.Pd.I.' },
    { regex: /\bM\.?\s*Pd\.?\s*I\.?/gi, canonical: 'M.Pd.I.' },
    { regex: /\bS\.?\s*Pd\.?/gi, canonical: 'S.Pd.' },
    { regex: /\bM\.?\s*Pd\.?/gi, canonical: 'M.Pd.' },
    { regex: /\bS\.?\s*Ag\.?/gi, canonical: 'S.Ag.' },
    { regex: /\bM\.?\s*Ag\.?/gi, canonical: 'M.Ag.' },
    { regex: /\bA\.?\s*Ma\.?\s*Pd\.?/gi, canonical: 'A.Ma.Pd.' },
    { regex: /\bA\.?\s*Ma\.?/gi, canonical: 'A.Ma.' },
    { regex: /\bA\.?\s*Md\.?\s*Kom\.?/gi, canonical: 'A.Md.Kom.' },
    { regex: /\bA\.?\s*Md\.?\s*Keb\.?/gi, canonical: 'A.Md.Keb.' },
    { regex: /\bA\.?\s*Md\.?\s*Kep\.?/gi, canonical: 'A.Md.Kep.' },
    { regex: /\bA\.?\s*Md\.?/gi, canonical: 'A.Md.' },
    { regex: /\bS\.?\s*Kom\.?/gi, canonical: 'S.Kom.' },
    { regex: /\bM\.?\s*Kom\.?/gi, canonical: 'M.Kom.' },
    { regex: /\bS\.?\s*Si\.?/gi, canonical: 'S.Si.' },
    { regex: /\bM\.?\s*Si\.?/gi, canonical: 'M.Si.' },
    { regex: /\bS\.?\s*Sos\.?/gi, canonical: 'S.Sos.' },
    { regex: /\bM\.?\s*Sos\.?/gi, canonical: 'M.Sos.' },
    { regex: /\bS\.?\s*Hum\.?/gi, canonical: 'S.Hum.' },
    { regex: /\bM\.?\s*Hum\.?/gi, canonical: 'M.Hum.' },
    { regex: /\bS\.?\s*Ked\.?/gi, canonical: 'S.Ked.' },
    { regex: /\bM\.?\s*Ked\.?/gi, canonical: 'M.Ked.' },
    { regex: /\bS\.?\s*Farm\.?/gi, canonical: 'S.Farm.' },
    { regex: /\bM\.?\s*Farm\.?/gi, canonical: 'M.Farm.' },
    { regex: /\bS\.?\s*Psi\.?/gi, canonical: 'S.Psi.' },
    { regex: /\bM\.?\s*Psi\.?/gi, canonical: 'M.Psi.' },
    { regex: /\bS\.?\s*Kep\.?/gi, canonical: 'S.Kep.' },
    { regex: /\bM\.?\s*Kep\.?/gi, canonical: 'M.Kep.' },
    { regex: /\bS\.?\s*Gz\.?/gi, canonical: 'S.Gz.' },
    { regex: /\bM\.?\s*Gz\.?/gi, canonical: 'M.Gz.' },
    { regex: /\bS\.?\s*Sn\.?/gi, canonical: 'S.Sn.' },
    { regex: /\bM\.?\s*Sn\.?/gi, canonical: 'M.Sn.' },
    { regex: /\bS\.?\s*IP\.?/gi, canonical: 'S.IP.' },
    { regex: /\bM\.?\s*IP\.?/gi, canonical: 'M.IP.' },
    { regex: /\bS\.?\s*AP\.?/gi, canonical: 'S.AP.' },
    { regex: /\bM\.?\s*AP\.?/gi, canonical: 'M.AP.' },
    { regex: /\bS\.?\s*E\.?|\bSE\b/gi, canonical: 'S.E.' },
    { regex: /\bM\.?\s*E\.?/gi, canonical: 'M.E.' },
    { regex: /\bS\.?\s*H\.?|\bSH\b/gi, canonical: 'S.H.' },
    { regex: /\bM\.?\s*H\.?/gi, canonical: 'M.H.' },
    { regex: /\bS\.?\s*T\.?|\bST\b/gi, canonical: 'S.T.' },
    { regex: /\bM\.?\s*T\.?/gi, canonical: 'M.T.' },
    { regex: /\bM\.?\s*M\.?|\bMM\b/gi, canonical: 'M.M.' },
    { regex: /\bM\.?\s*B\.?\s*A\.?/gi, canonical: 'M.B.A.' },
    { regex: /\bNs\.?/gi, canonical: 'Ns.' },
    { regex: /\bApt\.?/gi, canonical: 'Apt.' }
  ];

  function normalizeFrontTitle(str: string): string {
    return str
      .replace(/^DRS\.\s+/i, 'Drs. ')
      .replace(/^DRA\.\s+/i, 'Dra. ')
      .replace(/^PROF\.\s+/i, 'Prof. ')
      .replace(/^IR\.\s+/i, 'Ir. ')
      .replace(/^HJ\.\s+/i, 'Hj. ')
      .replace(/^DR\.\s+/i, 'Dr. ');
  }

  function normalizeDegrees(degStr: string): string {
    let d = degStr;
    for (const item of degreeMap) {
      if (item.regex.test(d)) {
        d = d.replace(item.regex, item.canonical);
      }
    }
    return d.replace(/\.+/g, '.').replace(/\s+/g, ' ').trim();
  }

  // Jika nama memiliki gelar di belakang tanda koma (e.g. ZUBAIDI, S.Ag., M.Pd.)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    const namePart = normalizeFrontTitle(parts[0].trim());
    const degreeParts = parts.slice(1).map(p => p.trim()).filter(Boolean);
    const formattedDegrees = degreeParts.map(normalizeDegrees);
    return `${namePart}, ${formattedDegrees.join(', ')}`;
  }

  // Jika tidak ada tanda koma tetapi mengandung gelar
  let formatted = normalizeFrontTitle(trimmed);
  return normalizeDegrees(formatted);
}
