/**
 * Utilitas pemformatan nama dan gelar resmi kedinasan
 * Sesuai Pedoman Umum Ejaan Bahasa Indonesia (PUEBI/EYD Edisi V) dan Tata Naskah Dinas
 * 
 * Aturan Utama:
 * 1. Pemisahan nama dan gelar belakang dipisahkan koma dan spasi: Nama, S.Pd.
 * 2. Antar-gelar belakang dipisahkan tanda koma dan spasi: Nama, S.Pd., M.Pd.
 * 3. Singkatan gelar belakang diawali huruf kapital dan diakhiri tanda titik pada setiap unsurnya: S.I.Pust., S.Pd., M.Pd., A.Md., S.E., S.H., M.M.
 * 4. Gelar depan (Prof., Dr., Drs., Dra., Ir., H., Hj., K.H., dr., drg.) distandarisasi huruf kapital/kecil dan tanda titiknya.
 */

// Kamus gelar belakang resmi kedinasan Indonesia (terurut dari yang paling spesifik ke umum)
interface DegreeDefinition {
  regex: RegExp;
  canonical: string;
}

const CANONICAL_DEGREES: DegreeDefinition[] = [
  // Perpustakaan & Informasi
  { regex: /\bS\.?\s*I\.?\s*Pust\.?|\bS\.?\s*IPust\.?|\bSIPust\b/gi, canonical: 'S.I.Pust.' },
  { regex: /\bM\.?\s*I\.?\s*Pust\.?|\bM\.?\s*IPust\.?|\bMIPust\b/gi, canonical: 'M.I.Pust.' },
  { regex: /\bA\.?\s*Md\.?\s*Pust\.?|\bAMdPust\b/gi, canonical: 'A.Md.Pust.' },

  // Pendidikan
  { regex: /\bS\.?\s*Pd\.?\s*I\.?|\bSPdI\b/gi, canonical: 'S.Pd.I.' },
  { regex: /\bM\.?\s*Pd\.?\s*I\.?|\bMPdI\b/gi, canonical: 'M.Pd.I.' },
  { regex: /\bS\.?\s*Pd\.?\s*SD\.?|\bSPdSD\b/gi, canonical: 'S.Pd.SD.' },
  { regex: /\bS\.?\s*Pd\.?|\bSPd\b/gi, canonical: 'S.Pd.' },
  { regex: /\bM\.?\s*Pd\.?|\bMPd\b/gi, canonical: 'M.Pd.' },
  { regex: /\bM\.?\s*M\.?\s*Pd\.?|\bMMPd\b/gi, canonical: 'M.M.Pd.' },
  { regex: /\bA\.?\s*Ma\.?\s*Pd\.?|\bAMaPd\b/gi, canonical: 'A.Ma.Pd.' },
  { regex: /\bA\.?\s*Ma\.?|\bAMa\b/gi, canonical: 'A.Ma.' },
  { regex: /\bGr\.?\b/gi, canonical: 'Gr.' },

  // Agama
  { regex: /\bS\.?\s*Ag\.?|\bSAg\b/gi, canonical: 'S.Ag.' },
  { regex: /\bM\.?\s*Ag\.?|\bMAg\b/gi, canonical: 'M.Ag.' },
  { regex: /\bS\.?\s*Th\.?\s*I\.?|\bSThI\b/gi, canonical: 'S.Th.I.' },
  { regex: /\bM\.?\s*Th\.?\s*I\.?|\bMThI\b/gi, canonical: 'M.Th.I.' },
  { regex: /\bS\.?\s*Fil\.?\s*I\.?|\bSFilI\b/gi, canonical: 'S.Fil.I.' },
  { regex: /\bM\.?\s*Fil\.?\s*I\.?|\bMFilI\b/gi, canonical: 'M.Fil.I.' },

  // Komputer & Teknologi Informasi
  { regex: /\bA\.?\s*Md\.?\s*Kom\.?|\bAMdKom\b/gi, canonical: 'A.Md.Kom.' },
  { regex: /\bS\.?\s*Kom\.?|\bSKom\b/gi, canonical: 'S.Kom.' },
  { regex: /\bM\.?\s*Kom\.?|\bMKom\b/gi, canonical: 'M.Kom.' },
  { regex: /\bS\.?\s*Tr\.?\s*Kom\.?|\bSTrKom\b/gi, canonical: 'S.Tr.Kom.' },

  // Kesehatan, Medis & Keperawatan
  { regex: /\bA\.?\s*Md\.?\s*Keb\.?|\bAMdKeb\b/gi, canonical: 'A.Md.Keb.' },
  { regex: /\bA\.?\s*Md\.?\s*Kep\.?|\bAMdKep\b/gi, canonical: 'A.Md.Kep.' },
  { regex: /\bA\.?\s*Md\.?\s*Far\.?|\bAMdFar\b/gi, canonical: 'A.Md.Far.' },
  { regex: /\bA\.?\s*Md\.?\s*Gz\.?|\bAMdGz\b/gi, canonical: 'A.Md.Gz.' },
  { regex: /\bA\.?\s*Md\.?|\bAMd\b/gi, canonical: 'A.Md.' },
  { regex: /\bS\.?\s*Ked\.?|\bSKed\b/gi, canonical: 'S.Ked.' },
  { regex: /\bM\.?\s*Ked\.?|\bMKed\b/gi, canonical: 'M.Ked.' },
  { regex: /\bS\.?\s*Kep\.?|\bSKep\b/gi, canonical: 'S.Kep.' },
  { regex: /\bM\.?\s*Kep\.?|\bMKep\b/gi, canonical: 'M.Kep.' },
  { regex: /\bS\.?\s*Farm\.?|\bSFarm\b/gi, canonical: 'S.Farm.' },
  { regex: /\bM\.?\s*Farm\.?|\bMFarm\b/gi, canonical: 'M.Farm.' },
  { regex: /\bS\.?\s*Gz\.?|\bSGz\b/gi, canonical: 'S.Gz.' },
  { regex: /\bM\.?\s*Gz\.?|\bMGz\b/gi, canonical: 'M.Gz.' },
  { regex: /\bNs\.?\b/gi, canonical: 'Ns.' },
  { regex: /\bApt\.?\b/gi, canonical: 'Apt.' },

  // Sains & Matematika
  { regex: /\bS\.?\s*Si\.?|\bSSi\b/gi, canonical: 'S.Si.' },
  { regex: /\bM\.?\s*Si\.?|\bMSi\b/gi, canonical: 'M.Si.' },

  // Sosial, Politik, Humaniora, Psikologi
  { regex: /\bS\.?\s*Sos\.?|\bSSos\b/gi, canonical: 'S.Sos.' },
  { regex: /\bM\.?\s*Sos\.?|\bMSos\b/gi, canonical: 'M.Sos.' },
  { regex: /\bS\.?\s*Hum\.?|\bSHum\b/gi, canonical: 'S.Hum.' },
  { regex: /\bM\.?\s*Hum\.?|\bMHum\b/gi, canonical: 'M.Hum.' },
  { regex: /\bS\.?\s*Psi\.?|\bSPsi\b/gi, canonical: 'S.Psi.' },
  { regex: /\bM\.?\s*Psi\.?|\bMPsi\b/gi, canonical: 'M.Psi.' },
  { regex: /\bS\.?\s*IP\.?|\bSIP\b/gi, canonical: 'S.IP.' },
  { regex: /\bM\.?\s*IP\.?|\bMIP\b/gi, canonical: 'M.IP.' },
  { regex: /\bS\.?\s*AP\.?|\bSAP\b/gi, canonical: 'S.AP.' },
  { regex: /\bM\.?\s*AP\.?|\bMAP\b/gi, canonical: 'M.AP.' },
  { regex: /\bS\.?\s*Sn\.?|\bSSn\b/gi, canonical: 'S.Sn.' },
  { regex: /\bM\.?\s*Sn\.?|\bMSn\b/gi, canonical: 'M.Sn.' },

  // Ekonomi & Manajemen
  { regex: /\bS\.?\s*E\.?|\bSE\b/gi, canonical: 'S.E.' },
  { regex: /\bM\.?\s*E\.?|\bME\b/gi, canonical: 'M.E.' },
  { regex: /\bM\.?\s*M\.?|\bMM\b/gi, canonical: 'M.M.' },
  { regex: /\bM\.?\s*B\.?\s*A\.?|\bMBA\b/gi, canonical: 'M.B.A.' },
  { regex: /\bS\.?\s*Ak\.?|\bSAk\b/gi, canonical: 'S.Ak.' },
  { regex: /\bM\.?\s*Ak\.?|\bMAK\b/gi, canonical: 'M.Ak.' },

  // Hukum
  { regex: /\bS\.?\s*H\.?|\bSH\b/gi, canonical: 'S.H.' },
  { regex: /\bM\.?\s*H\.?|\bMH\b/gi, canonical: 'M.H.' },
  { regex: /\bM\.?\s*Kn\.?|\bMKn\b/gi, canonical: 'M.Kn.' },

  // Teknik & Terapan
  { regex: /\bS\.?\s*T\.?|\bST\b/gi, canonical: 'S.T.' },
  { regex: /\bM\.?\s*T\.?|\bMT\b/gi, canonical: 'M.T.' },
  { regex: /\bS\.?\s*Tr\.?\s*T\.?|\bSTrT\b/gi, canonical: 'S.Tr.T.' },
  { regex: /\bS\.?\s*Tr\.?|\bSTr\b/gi, canonical: 'S.Tr.' },

  // Internasional & Pascasarjana
  { regex: /\bPh\.?\s*D\.?|\bPhD\b/gi, canonical: 'Ph.D.' },
  { regex: /\bM\.?\s*Sc\.?|\bMSc\b/gi, canonical: 'M.Sc.' },
  { regex: /\bB\.?\s*Sc\.?|\bBSc\b/gi, canonical: 'B.Sc.' },
  { regex: /\bM\.?\s*Ed\.?|\bMEd\b/gi, canonical: 'M.Ed.' },
  { regex: /\bM\.?\s*A\.?|\bMA\b/gi, canonical: 'M.A.' }
];

/**
 * Normalisasi gelar kehormatan / akademik di depan nama
 * Contoh: "Dr H Rahmat Hidayat" -> "Dr. H. Rahmat Hidayat"
 */
function normalizeFrontTitles(text: string): string {
  let result = text.trim();

  // Pola gelar depan berurutan
  const frontPatterns = [
    { regex: /^(?:PROF\.?|Prof\.?)\s+/i, canonical: 'Prof. ' },
    { regex: /^(?:K\.?H\.?|KH\.?)\s+/i, canonical: 'K.H. ' },
    { regex: /^(?:DRS\.?|Drs\.?)\s+/i, canonical: 'Drs. ' },
    { regex: /^(?:DRA\.?|Dra\.?)\s+/i, canonical: 'Dra. ' },
    { regex: /^(?:IR\.?|Ir\.?)\s+/i, canonical: 'Ir. ' },
    { regex: /^(?:DRG\.?|drg\.?)\s+/i, canonical: 'drg. ' },
    { regex: /^(?:DR\.?|Dr\.?)\s+/i, canonical: 'Dr. ' },
    { regex: /^(?:dr\.?)\s+/, canonical: 'dr. ' },
    { regex: /^(?:HJ\.?|Hj\.?)\s+/i, canonical: 'Hj. ' },
    { regex: /^(?:H\.?)\s+/i, canonical: 'H. ' }
  ];

  let matched = true;
  const prefixList: string[] = [];

  while (matched) {
    matched = false;
    for (const pat of frontPatterns) {
      if (pat.regex.test(result)) {
        prefixList.push(pat.canonical.trim());
        result = result.replace(pat.regex, '').trim();
        matched = true;
        break;
      }
    }
  }

  if (prefixList.length > 0) {
    return `${prefixList.join(' ')} ${result}`;
  }
  return result;
}

/**
 * Normalisasi satu token atau rangkaian gelar belakang
 */
function normalizeDegreeChunk(chunk: string): string {
  let cleaned = chunk.trim();
  if (!cleaned) return '';

  for (const def of CANONICAL_DEGREES) {
    if (def.regex.test(cleaned)) {
      cleaned = cleaned.replace(def.regex, def.canonical);
    }
  }

  // Standarisasi titik ganda dan spasi
  cleaned = cleaned
    .replace(/\.+/g, '.')
    .replace(/\s*\.\s*/g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  // Pastikan diakhiri titik jika merupakan singkatan gelar
  if (cleaned.length > 1 && !cleaned.endsWith('.')) {
    cleaned = `${cleaned}.`;
  }

  return cleaned;
}

/**
 * Pemformat nama pejabat / petugas lengkap dengan gelar resmi kedinasan
 * Menghasilkan ejaan yang 100% patuh aturan EYD/PUEBI:
 * "H Zubaidi S.Pd M.Pd" -> "H. Zubaidi, S.Pd., M.Pd."
 * "Nurul Hidayati S.I.Pust" -> "Nurul Hidayati, S.I.Pust."
 */
export function formatOfficialNameWithDegree(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';

  // Jika nama berupa garis titik-titik tanda tangan resmi, pertahankan
  if (trimmed.includes('......') || trimmed.startsWith('(')) {
    return trimmed;
  }

  // Kasus 1: Nama sudah memiliki pemisah koma (format baku: Nama, Gelar1, Gelar2)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    const namePart = normalizeFrontTitles(parts[0].trim());
    
    // Potong semua fragmen gelar di belakang nama
    const degreeFragments: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const fragment = parts[i].trim();
      if (!fragment) continue;

      // Jika dalam satu fragmen terdapat beberapa gelar dipisahkan spasi (misal: "S.Pd M.Pd")
      const words = fragment.split(/\s+/).filter(Boolean);
      let currentAcc = '';
      for (const w of words) {
        // Cek apakah kata ini cocok dengan gelar
        const matchesAny = CANONICAL_DEGREES.some(d => d.regex.test(w));
        if (matchesAny) {
          if (currentAcc) {
            degreeFragments.push(normalizeDegreeChunk(currentAcc));
            currentAcc = '';
          }
          degreeFragments.push(normalizeDegreeChunk(w));
        } else {
          currentAcc = currentAcc ? `${currentAcc} ${w}` : w;
        }
      }
      if (currentAcc) {
        degreeFragments.push(normalizeDegreeChunk(currentAcc));
      }
    }

    if (degreeFragments.length > 0) {
      return `${namePart}, ${degreeFragments.join(', ')}`;
    }
    return namePart;
  }

  // Kasus 2: Nama tidak memiliki tanda koma, tetapi mengandung gelar di bagian belakang
  // Pisahkan kata demi kata dari belakang untuk mengekstrak gelar
  const words = trimmed.split(/\s+/);
  const detectedDegrees: string[] = [];
  const nameWords: string[] = [];

  // Pindai dari belakang ke depan
  let i = words.length - 1;
  while (i >= 0) {
    const word = words[i];
    const isDegree = CANONICAL_DEGREES.some(d => {
      // Reset regex state if global
      const rx = new RegExp(d.regex.source, 'i');
      return rx.test(word);
    });

    if (isDegree && i > 0) {
      detectedDegrees.unshift(normalizeDegreeChunk(word));
      i--;
    } else {
      break;
    }
  }

  for (let j = 0; j <= i; j++) {
    nameWords.push(words[j]);
  }

  const baseName = normalizeFrontTitles(nameWords.join(' '));

  if (detectedDegrees.length > 0) {
    return `${baseName}, ${detectedDegrees.join(', ')}`;
  }

  return baseName;
}
