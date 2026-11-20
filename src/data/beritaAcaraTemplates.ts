import {
  BeritaAcaraTemplateId,
  GeneratedBeritaAcaraContent,
  SchoolConfig
} from '../types';
import {
  formatOfficialIndonesianOpeningDate,
  formatOfficialNameWithDegree,
  formatOfficialNipOrPppk,
  formatRupiah
} from '../utils/formatters';

export type BeritaAcaraFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'textarea'
  | 'items_list';

export interface BeritaAcaraFieldDef {
  key: string;
  label: string;
  type: BeritaAcaraFieldType;
  placeholder?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  halfWidth?: boolean;
  section?: string;
}

export interface BeritaAcaraTemplateDef {
  id: BeritaAcaraTemplateId;
  category:
    | 'Kesiswaan & Akademik'
    | 'Aset & Sapras'
    | 'Kepegawaian & Rapat'
    | 'Keuangan & Kearsipan'
    | 'Persuratan & Layanan Umum';
  shortTitle: string;
  fullTitle: string;
  description: string;
  defaultValues: (config: SchoolConfig) => Record<string, any>;
  fields: BeritaAcaraFieldDef[];
  buildContent: (values: Record<string, any>, config: SchoolConfig) => GeneratedBeritaAcaraContent;
}

function getPlaceName(config: SchoolConfig): string {
  return (
    [config.desaKecamatan, config.kabupatenKota]
      .find(s => typeof s === 'string' && s.trim().length > 0)
      ?.replace(/^(Kecamatan|Kec\.|Kabupaten|Kab\.|Kota)\s+/i, '')
      .trim() || 'Sekolah'
  );
}

function getKepsekInfo(config: SchoolConfig) {
  const rawName = config.kepalaSekolah?.nama || '';
  const isDummy = !rawName.trim() || /rahmat(\s*hidayat)?/i.test(rawName);
  const nama = isDummy ? '( .................................................. )' : formatOfficialNameWithDegree(rawName);
  const rawNip = config.kepalaSekolah?.nip || '';
  const isDummyNip = !rawNip.trim() || /19740510\s*199802\s*1\s*003/.test(rawNip);
  const nip = isDummy || isDummyNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIP', placeholderDots: true })
    : formatOfficialNipOrPppk(rawNip, { defaultPrefix: 'NIP', placeholderDots: true });
  return {
    nama,
    nip,
    jabatan: config.kepalaSekolah?.jabatan || 'Kepala Sekolah',
    signatureImage: !isDummy ? config.kepalaSekolah?.signatureImage : undefined
  };
}

function getTuOperatorInfo(config: SchoolConfig) {
  const tu = config.operatorProfiles?.TU;
  const rawName = tu?.nama || '';
  const isDummy = !rawName.trim() || /nurul|rahmat/i.test(rawName);
  const nama = isDummy ? '( .................................................. )' : formatOfficialNameWithDegree(rawName);
  const rawNip = tu?.nip || '';
  const isDummyNip = !rawNip.trim() || /19920815\s*202321\s*2\s*024/.test(rawNip);
  const nip = isDummy || isDummyNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIPPK', placeholderDots: true })
    : formatOfficialNipOrPppk(rawNip, { defaultPrefix: 'NIPPK', placeholderDots: true });
  return {
    nama,
    nip,
    jabatan: tu?.jabatan || 'Kepala / Pelaksana Tata Usaha',
    signatureImage: !isDummy ? tu?.signatureImage : undefined
  };
}

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function safeInt(val: any): number {
  const n = parseInt(String(val ?? '0'), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function safeFloat(val: any): number {
  const n = parseFloat(String(val ?? '0').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatSignatoryNip(raw: string | undefined, defaultPrefix: 'NIP' | 'PPPK' | 'NIPPK' = 'NIP'): string {
  return formatOfficialNipOrPppk(raw || '', { defaultPrefix, placeholderDots: true });
}

function formatSignatoryName(raw: string | undefined): string {
  const clean = (raw || '').trim();
  if (!clean) return '( .................................................. )';
  return formatOfficialNameWithDegree(clean);
}

/**
 * Parse baris teks multi-kolom (dipisah tanda "|" atau ";") menjadi array sel yang rapi.
 */
function parseStructuredLines(rawText: string, expectedCols: number, fallbackCols: string[]): string[][] {
  const lines = (rawText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [fallbackCols];
  return lines.map((line, idx) => {
    const parts = line.split(/\s*[|;]\s*/).map(p => p.trim());
    const row = Array.from({ length: expectedCols }, (_, cIdx) => parts[cIdx] || '-');
    return [String(idx + 1), ...row];
  });
}

export const BERITA_ACARA_TEMPLATES: BeritaAcaraTemplateDef[] = [
  // 1. KELULUSAN SISWA
  {
    id: 'kelulusan',
    category: 'Kesiswaan & Akademik',
    shortTitle: 'Berita Acara Kelulusan Siswa',
    fullTitle: 'Berita Acara Rapat Dewan Guru Penetapan Kelulusan Peserta Didik',
    description: 'Penetapan kelulusan akhir jenjang kelas VI / IX / XII beserta tabel rekapitulasi peserta lulus dan tidak lulus.',
    defaultValues: (config) => {
      const kepsek = getKepsekInfo(config);
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `421.3/BA-LULUS/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        pukul: '09.00 WIB s.d. Selesai',
        tempat: `Ruang Rapat ${config.namaSekolah || 'Sekolah'}`,
        tahunPelajaran: `${year - 1}/${year}`,
        tingkatKelas: 'Kelas IX / Akhir Jenjang',
        dasarHukum: `Permendikbudristek Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan serta Pedoman Pengelolaan Ijazah Tahun ${year}`,
        pesertaL: 18,
        pesertaP: 16,
        lulusL: 18,
        lulusP: 16,
        tidakLulusL: 0,
        tidakLulusP: 0,
        jumlahHadirGuru: 14,
        catatanKeputusan: 'Seluruh peserta didik telah menyelesaikan seluruh program pembelajaran, memperoleh nilai sikap/perilaku minimal Baik, serta mengikuti Asesmen Sumatif Akhir Jenjang sesuai Kriteria Ketuntasan dan Kelulusan Satuan Pendidikan.',
        penandatanganKiriNama: kepsek.nama,
        penandatanganKiriNip: kepsek.nip,
        penandatanganKananJabatan: 'Ketua Panitia / Sekretaris Rapat',
        penandatanganKananNama: tu.nama.includes('...') ? '' : tu.nama,
        penandatanganKananNip: tu.nip.includes('...') ? '' : tu.nip
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true, section: 'Identitas Surat' },
      { key: 'tanggal', label: 'Tanggal Rapat Penetapan', type: 'date', halfWidth: true, section: 'Identitas Surat' },
      { key: 'pukul', label: 'Waktu / Pukul', type: 'text', halfWidth: true, section: 'Identitas Surat' },
      { key: 'tempat', label: 'Tempat Rapat', type: 'text', halfWidth: true, section: 'Identitas Surat' },
      { key: 'tahunPelajaran', label: 'Tahun Pelajaran', type: 'text', placeholder: 'mis. 2025/2026', halfWidth: true, section: 'Data Kelulusan' },
      { key: 'tingkatKelas', label: 'Jenjang / Tingkat Akhir', type: 'text', placeholder: 'mis. Kelas IX / Kelas VI', halfWidth: true, section: 'Data Kelulusan' },
      { key: 'pesertaL', label: 'Peserta Terdaftar (Laki-laki)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'pesertaP', label: 'Peserta Terdaftar (Perempuan)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'lulusL', label: 'Dinyatakan Lulus (Laki-laki)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'lulusP', label: 'Dinyatakan Lulus (Perempuan)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'tidakLulusL', label: 'Tidak Lulus (Laki-laki)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'tidakLulusP', label: 'Tidak Lulus (Perempuan)', type: 'number', halfWidth: true, section: 'Rekapitulasi Jumlah Siswa' },
      { key: 'jumlahHadirGuru', label: 'Jumlah Dewan Guru Hadir', type: 'number', halfWidth: true, section: 'Data Rapat' },
      { key: 'dasarHukum', label: 'Dasar Hukum / Pedoman', type: 'textarea', section: 'Konsiderans & Keputusan' },
      { key: 'catatanKeputusan', label: 'Pertimbangan & Keputusan Rapat', type: 'textarea', section: 'Konsiderans & Keputusan' },
      { key: 'penandatanganKananJabatan', label: 'Jabatan Sekretaris / Panitia (Kanan)', type: 'text', halfWidth: true, section: 'Pejabat Pengesah' },
      { key: 'penandatanganKananNama', label: 'Nama Sekretaris / Panitia', type: 'text', halfWidth: true, section: 'Pejabat Pengesah' },
      { key: 'penandatanganKananNip', label: 'NIP / PPPK Sekretaris / Panitia', type: 'text', halfWidth: true, section: 'Pejabat Pengesah' }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);

      const pL = safeInt(v.pesertaL);
      const pP = safeInt(v.pesertaP);
      const pTot = pL + pP;

      const lL = safeInt(v.lulusL);
      const lP = safeInt(v.lulusP);
      const lTot = lL + lP;

      const tlL = safeInt(v.tidakLulusL);
      const tlP = safeInt(v.tidakLulusP);
      const tlTot = tlL + tlP;

      const pctLulus = pTot > 0 ? ((lTot / pTot) * 100).toFixed(2) : '0.00';
      const pctTidakLulus = pTot > 0 ? ((tlTot / pTot) * 100).toFixed(2) : '0.00';

      return {
        templateId: 'kelulusan',
        templateTitle: 'Berita Acara Kelulusan Siswa',
        documentHeading: 'BERITA ACARA',
        documentSubHeading: `RAPAT DEWAN GURU PENETAPAN KELULUSAN PESERTA DIDIK TAHUN PELAJARAN ${v.tahunPelajaran || '-'}`,
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, pukul ${v.pukul || '09.00 WIB s.d. selesai'}, bertempat di ${v.tempat || config.namaSekolah}, telah dilaksanakan Rapat Pleno Dewan Guru ${config.namaSekolah} dalam rangka membahas dan menetapkan kelulusan peserta didik ${v.tingkatKelas || 'Tingkat Akhir'} Tahun Pelajaran ${v.tahunPelajaran || '-'}${v.jumlahHadirGuru ? `, yang dihadiri oleh Kepala Sekolah beserta ${v.jumlahHadirGuru} orang Pendidik dan Tenaga Kependidikan` : ''}.`,
        basisParagraphs: [
          `Pelaksanaan rapat penetapan kelulusan ini berpedoman pada: ${v.dasarHukum || 'Ketentuan peraturan perundang-undangan yang berlaku di lingkungan Kementerian Pendidikan Dasar dan Menengah serta Kriteria Kelulusan Satuan Pendidikan.'}`
        ],
        bodyParagraphs: [
          `Berdasarkan hasil verifikasi capaian nilai rapor, nilai praktik/portofolio, sikap perilaku, serta hasil Asesmen Sumatif Akhir Jenjang Tahun Pelajaran ${v.tahunPelajaran || '-'}, Rapat Dewan Guru memutuskan hasil kelulusan peserta didik dengan rincian sebagai berikut:`
        ],
        tables: [
          {
            title: 'REKAPITULASI HASIL PENETAPAN KELULUSAN PESERTA DIDIK',
            columns: [
              { header: 'No', align: 'center', widthPercent: 8 },
              { header: 'Uraian Status Peserta Didik', align: 'left', widthPercent: 42 },
              { header: 'Laki-laki', align: 'center', widthPercent: 12 },
              { header: 'Perempuan', align: 'center', widthPercent: 13 },
              { header: 'Jumlah', align: 'center', widthPercent: 12 },
              { header: 'Persentase', align: 'center', widthPercent: 13 }
            ],
            rows: [
              ['1', 'Jumlah Peserta Didik Terdaftar', String(pL), String(pP), String(pTot), '100,00 %'],
              ['2', 'Peserta Didik Dinyatakan LULUS', String(lL), String(lP), String(lTot), `${pctLulus.replace('.', ',')} %`],
              ['3', 'Peserta Didik Dinyatakan TIDAK LULUS', String(tlL), String(tlP), String(tlTot), `${pctTidakLulus.replace('.', ',')} %`]
            ],
            footerRow: ['TOTAL', 'Peserta Didik Ditetapkan Dalam Pleno', String(lL + tlL), String(lP + tlP), String(lTot + tlTot), `${pctLulus.replace('.', ',')} % Lulus`]
          }
        ],
        detailSectionTitle: 'Catatan Pertimbangan & Keputusan Rapat:',
        detailPairs: [
          { label: 'Tahun Pelajaran', value: v.tahunPelajaran || '-' },
          { label: 'Tingkat / Jenjang', value: v.tingkatKelas || '-' },
          { label: 'Keputusan Pleno', value: v.catatanKeputusan || '-' }
        ],
        closingParagraph: 'Demikian Berita Acara Rapat Penetapan Kelulusan Peserta Didik ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai dasar penerbitan Surat Keterangan Lulus (SKL), pengisian blangko ijazah, serta laporan resmi kepada Dinas Pendidikan terkait.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Sekretaris / Ketua Panitia,',
          jabatan: v.penandatanganKananJabatan || 'Sekretaris Rapat Kelulusan',
          nama: formatSignatoryName(v.penandatanganKananNama),
          nip: formatSignatoryNip(v.penandatanganKananNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 40
        }
      };
    }
  },

  // 2. KENAIKAN KELAS
  {
    id: 'kenaikan_kelas',
    category: 'Kesiswaan & Akademik',
    shortTitle: 'Berita Acara Kenaikan Kelas',
    fullTitle: 'Berita Acara Rapat Dewan Guru Penentuan Kenaikan Kelas',
    description: 'Penetapan kenaikan kelas akhir semester genap beserta rekap per tingkat kelas.',
    defaultValues: (config) => {
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `421.3/BA-NAIK/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        pukul: '09.00 WIB s.d. Selesai',
        tempat: `Ruang Guru ${config.namaSekolah || 'Sekolah'}`,
        tahunPelajaran: `${year - 1}/${year}`,
        semester: 'Genap (Semester II)',
        rincianKelas: 'Kelas VII | 16 | 15 | 31 | 0\nKelas VIII | 14 | 17 | 31 | 0',
        catatanRapat: 'Penetapan kenaikan kelas didasarkan pada ketuntasan capaian kompetensi rapor semester ganjil dan genap, presensi minimal, serta penilaian sikap peserta didik.',
        notulisNama: tu.nama.includes('...') ? '' : tu.nama,
        notulisNip: tu.nip.includes('...') ? '' : tu.nip
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Rapat', type: 'date', halfWidth: true },
      { key: 'pukul', label: 'Pukul', type: 'text', halfWidth: true },
      { key: 'tempat', label: 'Tempat Rapat', type: 'text', halfWidth: true },
      { key: 'tahunPelajaran', label: 'Tahun Pelajaran', type: 'text', halfWidth: true },
      { key: 'semester', label: 'Semester', type: 'text', halfWidth: true },
      {
        key: 'rincianKelas',
        label: 'Data Per Tingkat Kelas (Format: Tingkat | Jml L | Jml P | Naik | Tinggal)',
        type: 'textarea',
        helperText: 'Satu baris untuk setiap tingkat kelas, pisahkan dengan tanda "|". Contoh: Kelas VII | 16 | 15 | 31 | 0'
      },
      { key: 'catatanRapat', label: 'Keputusan & Catatan Rapat', type: 'textarea' },
      { key: 'notulisNama', label: 'Nama Sekretaris / Wakil Kurikulum', type: 'text', halfWidth: true },
      { key: 'notulisNip', label: 'NIP / PPPK Sekretaris', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);

      const lines = (v.rincianKelas || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
      let totL = 0, totP = 0, totNaik = 0, totTinggal = 0;
      const rows = (lines.length ? lines : ['Kelas VII | 0 | 0 | 0 | 0']).map((line: string, i: number) => {
        const cols = line.split(/\s*[|;]\s*/).map(c => c.trim());
        const kls = cols[0] || `Kelas ${i + 1}`;
        const l = safeInt(cols[1]);
        const p = safeInt(cols[2]);
        const naik = safeInt(cols[3]);
        const tinggal = safeInt(cols[4]);
        totL += l; totP += p; totNaik += naik; totTinggal += tinggal;
        return [String(i + 1), kls, String(l), String(p), String(l + p), String(naik), String(tinggal)];
      });

      return {
        templateId: 'kenaikan_kelas',
        templateTitle: 'Berita Acara Kenaikan Kelas',
        documentHeading: 'BERITA ACARA',
        documentSubHeading: `RAPAT DEWAN GURU PENETAPAN KENAIKAN KELAS TAHUN PELAJARAN ${v.tahunPelajaran || '-'}`,
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, pukul ${v.pukul || '09.00 WIB s.d. selesai'}, bertempat di ${v.tempat || config.namaSekolah}, telah dilaksanakan Rapat Pleno Dewan Guru ${config.namaSekolah} untuk menetapkan kenaikan kelas peserta didik pada ${v.semester || 'Semester Genap'} Tahun Pelajaran ${v.tahunPelajaran || '-'}.`,
        basisParagraphs: [
          'Dasar Pelaksanaan: Kurikulum Operasional Satuan Pendidikan dan Peraturan Akademik tentang Kriteria Kenaikan Kelas serta evaluasi hasil belajar selama 2 (dua) semester.'
        ],
        bodyParagraphs: [
          'Setelah mencermati laporan nilai akademik, kehadiran, dan pembinaan sikap dari seluruh Wali Kelas serta Guru Mata Pelajaran, Rapat Dewan Guru memutuskan rekapitulasi kenaikan kelas sebagai berikut:'
        ],
        tables: [
          {
            title: 'REKAPITULASI PENETAPAN KENAIKAN KELAS',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Tingkat / Rombel', align: 'left', widthPercent: 28 },
              { header: 'L', align: 'center', widthPercent: 10 },
              { header: 'P', align: 'center', widthPercent: 10 },
              { header: 'Jumlah', align: 'center', widthPercent: 13 },
              { header: 'Naik Kelas', align: 'center', widthPercent: 16 },
              { header: 'Tinggal Kelas', align: 'center', widthPercent: 16 }
            ],
            rows,
            footerRow: ['TOTAL', 'Seluruh Tingkat Kelas', String(totL), String(totP), String(totL + totP), String(totNaik), String(totTinggal)]
          }
        ],
        detailSectionTitle: 'Keputusan & Tindak Lanjut:',
        detailPairs: [
          { label: 'Tahun Pelajaran', value: `${v.tahunPelajaran || '-'} (${v.semester || 'Genap'})` },
          { label: 'Catatan Rapat', value: v.catatanRapat || '-' }
        ],
        closingParagraph: 'Demikian Berita Acara Penentuan Kenaikan Kelas ini dibuat untuk dijadikan pedoman pembagian buku laporan hasil belajar (rapor) dan pemutakhiran data peserta didik pada Dapodik.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Sekretaris / Notulis Rapat,',
          jabatan: 'Wakil Kurikulum / Tata Usaha',
          nama: formatSignatoryName(v.notulisNama),
          nip: formatSignatoryNip(v.notulisNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 45
        }
      };
    }
  },

  // 3. SERAH TERIMA BARANG / BAST INVENTARIS
  {
    id: 'bast_barang',
    category: 'Aset & Sapras',
    shortTitle: 'BAST Barang / Aset Inventaris',
    fullTitle: 'Berita Acara Serah Terima Barang / Sarana Prasarana (BAST)',
    description: 'Serah terima barang pengadaan BOS, bantuan dinas, atau mutasi inventaris lengkap dengan Pihak I & II.',
    defaultValues: (config) => {
      const kepsek = getKepsekInfo(config);
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `027/BAST-SARPRAS/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        tempat: config.namaSekolah || 'Satuan Pendidikan',
        sumberPengadaan: `Belanja Modal / Pengadaan Dana BOSP Tahun Anggaran ${year}`,
        pihak1Nama: tu.nama.includes('...') ? '' : tu.nama,
        pihak1Nip: tu.nip.includes('...') ? '' : tu.nip,
        pihak1Jabatan: 'Pengurus Barang / Bendahara Barang Sekolah',
        pihak2Nama: kepsek.nama.includes('...') ? '' : kepsek.nama,
        pihak2Nip: kepsek.nip.includes('...') ? '' : kepsek.nip,
        pihak2Jabatan: 'Kepala Satuan Pendidikan / Penanggung Jawab Unit',
        daftarBarang: 'Laptop Administrasi TU | Lenovo ThinkPad / Core i5 | 1 Unit | Baik | Ruang Tata Usaha\nPrinter Laserjet | Epson EcoTank L3210 | 1 Unit | Baik | Meja Administrasi TU',
        saksi1Nama: '',
        saksi2Nama: ''
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor BAST', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Serah Terima', type: 'date', halfWidth: true },
      { key: 'tempat', label: 'Lokasi Serah Terima', type: 'text', halfWidth: true },
      { key: 'sumberPengadaan', label: 'Dasar / Sumber Pengadaan', type: 'text', halfWidth: true },
      { key: 'pihak1Nama', label: 'PIHAK PERTAMA (Yang Menyerahkan)', type: 'text', halfWidth: true, section: 'Para Pihak' },
      { key: 'pihak1Nip', label: 'NIP / PPPK Pihak Pertama', type: 'text', halfWidth: true, section: 'Para Pihak' },
      { key: 'pihak1Jabatan', label: 'Jabatan Pihak Pertama', type: 'text', section: 'Para Pihak' },
      { key: 'pihak2Nama', label: 'PIHAK KEDUA (Yang Menerima)', type: 'text', halfWidth: true, section: 'Para Pihak' },
      { key: 'pihak2Nip', label: 'NIP / PPPK Pihak Kedua', type: 'text', halfWidth: true, section: 'Para Pihak' },
      { key: 'pihak2Jabatan', label: 'Jabatan Pihak Kedua', type: 'text', section: 'Para Pihak' },
      {
        key: 'daftarBarang',
        label: 'Daftar Barang (Format: Nama Barang | Merk/Spesifikasi | Jumlah | Kondisi | Keterangan)',
        type: 'textarea',
        helperText: 'Pisahkan kolom dengan "|" dan satu barang per baris. Anda juga dapat menekan tombol "Ambil dari Inventaris TU".'
      },
      { key: 'saksi1Nama', label: 'Saksi I (Opsional)', type: 'text', halfWidth: true },
      { key: 'saksi2Nama', label: 'Saksi II (Opsional)', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);

      const rows = parseStructuredLines(
        v.daftarBarang,
        5,
        ['1', '-', '-', '-', '-', '-']
      );

      const witnesses: { nama: string; jabatan: string }[] = [];
      if (v.saksi1Nama?.trim()) witnesses.push({ nama: formatSignatoryName(v.saksi1Nama), jabatan: 'Saksi I' });
      if (v.saksi2Nama?.trim()) witnesses.push({ nama: formatSignatoryName(v.saksi2Nama), jabatan: 'Saksi II' });

      return {
        templateId: 'bast_barang',
        templateTitle: 'Berita Acara Serah Terima Barang (BAST)',
        documentHeading: 'BERITA ACARA SERAH TERIMA BARANG',
        documentSubHeading: `INVENTARIS SARANA PRASARANA ${config.namaSekolah.toUpperCase()}`,
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.tempat || config.namaSekolah}, kami yang bertanda tangan di bawah ini:`,
        basisParagraphs: [],
        partyBoxes: [
          {
            partyTitle: 'PIHAK PERTAMA (Yang Menyerahkan)',
            nama: formatSignatoryName(v.pihak1Nama),
            nip: formatSignatoryNip(v.pihak1Nip, 'NIPPK'),
            jabatan: v.pihak1Jabatan || 'Pengurus / Penyedia Barang',
            unit: config.namaSekolah
          },
          {
            partyTitle: 'PIHAK KEDUA (Yang Menerima)',
            nama: formatSignatoryName(v.pihak2Nama),
            nip: formatSignatoryNip(v.pihak2Nip, 'NIP'),
            jabatan: v.pihak2Jabatan || 'Penanggung Jawab / Penerima Barang',
            unit: config.namaSekolah
          }
        ],
        bodyParagraphs: [
          `Berdasarkan ${v.sumberPengadaan || 'ketentuan pengelolaan barang milik satuan pendidikan'}, PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA dan PIHAK KEDUA telah memeriksa serta menerima dengan baik barang-barang inventaris sekolah sebagaimana tercantum dalam daftar berikut:`
        ],
        tables: [
          {
            title: 'DAFTAR RINCIAN BARANG YANG DISERAHTERIMAKAN',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Nama Barang', align: 'left', widthPercent: 25 },
              { header: 'Merk / Spesifikasi', align: 'left', widthPercent: 25 },
              { header: 'Jumlah', align: 'center', widthPercent: 14 },
              { header: 'Kondisi', align: 'center', widthPercent: 12 },
              { header: 'Lokasi / Ket.', align: 'left', widthPercent: 17 }
            ],
            rows,
            footerRow: ['TOTAL', `${rows.length} Jenis Barang`, 'Telah Diperiksa & Sesuai', '-', 'Lengkap', 'Siap Digunakan']
          }
        ],
        closingParagraph: 'Sejak ditandatanganinya Berita Acara Serah Terima ini, tanggung jawab pengelolaan, pemeliharaan, dan pencatatan pada Kartu Inventaris Barang (KIB/KIR) beralih kepada PIHAK KEDUA. Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.',
        signatoryLayout: 'ordered_hierarchy',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'PIHAK KEDUA,',
          jabatan: v.pihak2Jabatan || 'Yang Menerima',
          nama: formatSignatoryName(v.pihak2Nama),
          nip: formatSignatoryNip(v.pihak2Nip, 'NIP'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 65
        },
        centerBottomSignatory: {
          roleLabel: 'PIHAK PERTAMA,',
          jabatan: v.pihak1Jabatan || 'Yang Menyerahkan',
          nama: formatSignatoryName(v.pihak1Nama),
          nip: formatSignatoryNip(v.pihak1Nip, 'NIPPK'),
          rankOrder: 60
        },
        orderedSignatories: [
          {
            roleLabel: 'Mengetahui / Mengesahkan,',
            jabatan: kepsek.jabatan,
            nama: kepsek.nama,
            nip: kepsek.nip,
            signatureImage: kepsek.signatureImage,
            rankOrder: 100
          },
          {
            roleLabel: 'PIHAK KEDUA (Yang Menerima),',
            jabatan: v.pihak2Jabatan || 'Penerima / Penanggung Jawab Unit',
            nama: formatSignatoryName(v.pihak2Nama),
            nip: formatSignatoryNip(v.pihak2Nip, 'NIP'),
            dateLine: `${place}, ${dt.formattedLong}`,
            rankOrder: 65
          },
          {
            roleLabel: 'PIHAK PERTAMA (Yang Menyerahkan),',
            jabatan: v.pihak1Jabatan || 'Pengurus / Penyedia Barang',
            nama: formatSignatoryName(v.pihak1Nama),
            nip: formatSignatoryNip(v.pihak1Nip, 'NIPPK'),
            rankOrder: 60
          }
        ],
        witnesses: witnesses.length > 0 ? witnesses : undefined
      };
    }
  },

  // 4. SERAH TERIMA JABATAN / TUGAS KEDINASAN
  {
    id: 'serah_terima_jabatan',
    category: 'Kepegawaian & Rapat',
    shortTitle: 'Serah Terima Jabatan / Tugas',
    fullTitle: 'Berita Acara Serah Terima Jabatan dan Memori Tugas Kedinasan',
    description: 'Alih tugas koordinator TU, bendahara BOS, pengelola perpustakaan, atau tugas tambahan guru.',
    defaultValues: (config) => {
      const year = new Date().getFullYear();
      return {
        nomorSurat: `800/BA-SERTIJAB/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        tempat: `Ruang Kepala ${config.namaSekolah || 'Sekolah'}`,
        dasarSk: `Surat Keputusan Kepala ${config.namaSekolah || 'Sekolah'} Nomor 800/SK-TUGAS/${year}`,
        namaJabatan: 'Bendahara Dana BOSP / Pengelola Administrasi Tata Usaha',
        pejabatLamaNama: '',
        pejabatLamaNip: '',
        pejabatBaruNama: '',
        pejabatBaruNip: '',
        berkasDiserahkan: 'Buku Kas Umum (BKU) & Rekening Koran | 1 Bundel | Lengkap & Sudah Rekonsiliasi\nArsip SPJ BOS Semester Berjalan | 2 Odner | Tersusun Rapi\nKunci Brankas & Token Perbankan Sekolah | 1 Set | Berfungsi Baik'
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Sertijab', type: 'date', halfWidth: true },
      { key: 'tempat', label: 'Tempat Pelaksanaan', type: 'text', halfWidth: true },
      { key: 'namaJabatan', label: 'Nama Jabatan / Tugas yang Diserahkan', type: 'text', halfWidth: true },
      { key: 'dasarSk', label: 'Nomor & Tanggal SK Penetapan', type: 'text' },
      { key: 'pejabatLamaNama', label: 'Nama Pejabat Lama (Pihak I)', type: 'text', halfWidth: true },
      { key: 'pejabatLamaNip', label: 'NIP / PPPK Pejabat Lama', type: 'text', halfWidth: true },
      { key: 'pejabatBaruNama', label: 'Nama Pejabat Baru (Pihak II)', type: 'text', halfWidth: true },
      { key: 'pejabatBaruNip', label: 'NIP / PPPK Pejabat Baru', type: 'text', halfWidth: true },
      {
        key: 'berkasDiserahkan',
        label: 'Memori / Berkas / Aset Jabatan (Format: Nama Dokumen/Barang | Jumlah | Kondisi)',
        type: 'textarea'
      }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const rows = parseStructuredLines(v.berkasDiserahkan, 3, ['1', '-', '-', '-']);

      return {
        templateId: 'serah_terima_jabatan',
        templateTitle: 'Berita Acara Serah Terima Jabatan',
        documentHeading: 'BERITA ACARA SERAH TERIMA JABATAN',
        documentSubHeading: (v.namaJabatan || 'TUGAS KEDINASAN SATUAN PENDIDIKAN').toUpperCase(),
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.tempat || config.namaSekolah}, berdasarkan ${v.dasarSk || 'Surat Keputusan Kepala Sekolah'}, kami yang bertanda tangan di bawah ini melaksanakan serah terima jabatan/tugas sebagai ${v.namaJabatan || '-'}:`,
        basisParagraphs: [],
        partyBoxes: [
          {
            partyTitle: 'PIHAK PERTAMA (Pejabat Lama)',
            nama: formatSignatoryName(v.pejabatLamaNama),
            nip: formatSignatoryNip(v.pejabatLamaNip, 'NIP'),
            jabatan: `${v.namaJabatan || 'Pejabat'} (Lama)`,
            unit: config.namaSekolah
          },
          {
            partyTitle: 'PIHAK KEDUA (Pejabat Baru)',
            nama: formatSignatoryName(v.pejabatBaruNama),
            nip: formatSignatoryNip(v.pejabatBaruNip, 'NIPPK'),
            jabatan: `${v.namaJabatan || 'Pejabat'} (Baru)`,
            unit: config.namaSekolah
          }
        ],
        bodyParagraphs: [
          `PIHAK PERTAMA menyerahkan tugas, wewenang, tanggung jawab, serta memori jabatan beserta seluruh berkas administrasi dan kelengkapan kerja kepada PIHAK KEDUA, dengan rincian serah terima sebagai berikut:`
        ],
        tables: [
          {
            title: 'DAFTAR BERKAS, DOKUMEN & KELENGKAPAN JABATAN',
            columns: [
              { header: 'No', align: 'center', widthPercent: 8 },
              { header: 'Uraian Berkas / Memori Tugas / Aset', align: 'left', widthPercent: 48 },
              { header: 'Volume / Jumlah', align: 'center', widthPercent: 20 },
              { header: 'Keterangan / Kondisi', align: 'left', widthPercent: 24 }
            ],
            rows
          }
        ],
        closingParagraph: 'Terhitung mulai tanggal penandatanganan Berita Acara ini, seluruh hak, kewajiban, dan tanggung jawab jabatan sebagaimana dimaksud beralih sepenuhnya kepada PIHAK KEDUA. Demikian Berita Acara ini dibuat dengan penuh tanggung jawab.',
        signatoryLayout: 'ordered_hierarchy',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'PIHAK PERTAMA (Yang Menyerahkan),',
          jabatan: 'Pejabat Lama',
          nama: formatSignatoryName(v.pejabatLamaNama),
          nip: formatSignatoryNip(v.pejabatLamaNip, 'NIP'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 65
        },
        centerBottomSignatory: {
          roleLabel: 'PIHAK KEDUA (Yang Menerima),',
          jabatan: 'Pejabat Baru',
          nama: formatSignatoryName(v.pejabatBaruNama),
          nip: formatSignatoryNip(v.pejabatBaruNip, 'NIPPK'),
          rankOrder: 60
        },
        orderedSignatories: [
          {
            roleLabel: 'Mengetahui / Mengesahkan,',
            jabatan: kepsek.jabatan,
            nama: kepsek.nama,
            nip: kepsek.nip,
            signatureImage: kepsek.signatureImage,
            rankOrder: 100
          },
          {
            roleLabel: 'PIHAK PERTAMA (Yang Menyerahkan),',
            jabatan: `${v.namaJabatan || 'Pejabat'} (Lama)`,
            nama: formatSignatoryName(v.pejabatLamaNama),
            nip: formatSignatoryNip(v.pejabatLamaNip, 'NIP'),
            dateLine: `${place}, ${dt.formattedLong}`,
            rankOrder: 65
          },
          {
            roleLabel: 'PIHAK KEDUA (Yang Menerima),',
            jabatan: `${v.namaJabatan || 'Pejabat'} (Baru)`,
            nama: formatSignatoryName(v.pejabatBaruNama),
            nip: formatSignatoryNip(v.pejabatBaruNip, 'NIPPK'),
            rankOrder: 60
          }
        ]
      };
    }
  },

  // 5. RAPAT DINAS / KOMITE / DEWAN GURU
  {
    id: 'rapat_dinas',
    category: 'Kepegawaian & Rapat',
    shortTitle: 'Berita Acara Rapat Dinas / Komite',
    fullTitle: 'Berita Acara Rapat Dinas Dewan Guru & Tenaga Kependidikan',
    description: 'Dokumentasi rapat dinas sekolah, penyusunan RKAS, pembagian tugas mengajar, atau rapat komite.',
    defaultValues: (config) => {
      const kepsek = getKepsekInfo(config);
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `005/BA-RAPAT/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        pukul: '08.30 WIB s.d. 11.30 WIB',
        tempat: `Aula / Ruang Rapat ${config.namaSekolah || 'Sekolah'}`,
        agendaRapat: 'Evaluasi Kinerja Semester Berjalan dan Penyusunan Program Kerja Sekolah',
        pemimpinRapat: kepsek.nama.includes('...') ? 'Kepala Sekolah' : kepsek.nama,
        jumlahDiundang: 18,
        jumlahHadir: 17,
        pokokKeputusan: 'Pembagian Tugas Mengajar & Tugas Tambahan GTK | Disepakati oleh forum & dituangkan ke dalam SK Kepala Sekolah | Kepala Sekolah & TU\nOptimalisasi Layanan Perpustakaan & Laboratorium | Penjadwalan kunjungan wajib kelas dan pemutakhiran inventaris | Koordinator Perpus & Lab\nPenertiban Administrasi Surat & Arsip Digital | Seluruh surat keluar wajib melalui registrasi Tata Usaha | Tata Usaha',
        notulisNama: tu.nama.includes('...') ? '' : tu.nama,
        notulisNip: tu.nip.includes('...') ? '' : tu.nip
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara Rapat', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Rapat', type: 'date', halfWidth: true },
      { key: 'pukul', label: 'Waktu / Pukul', type: 'text', halfWidth: true },
      { key: 'tempat', label: 'Tempat Rapat', type: 'text', halfWidth: true },
      { key: 'agendaRapat', label: 'Agenda / Topik Utama Rapat', type: 'text' },
      { key: 'pemimpinRapat', label: 'Pemimpin Rapat', type: 'text', halfWidth: true },
      { key: 'jumlahDiundang', label: 'Jumlah Undangan', type: 'number', halfWidth: true },
      { key: 'jumlahHadir', label: 'Jumlah Peserta Hadir', type: 'number', halfWidth: true },
      {
        key: 'pokokKeputusan',
        label: 'Pokok Pembahasan & Keputusan (Format: Agenda Pembahasan | Keputusan Rapat | Penanggung Jawab)',
        type: 'textarea'
      },
      { key: 'notulisNama', label: 'Nama Notulis Rapat', type: 'text', halfWidth: true },
      { key: 'notulisNip', label: 'NIP / PPPK Notulis', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const diundang = safeInt(v.jumlahDiundang);
      const hadir = safeInt(v.jumlahHadir);
      const tidakHadir = Math.max(0, diundang - hadir);
      const rows = parseStructuredLines(v.pokokKeputusan, 3, ['1', v.agendaRapat || '-', 'Disepakati bersama', 'Semua Pihak']);

      return {
        templateId: 'rapat_dinas',
        templateTitle: 'Berita Acara Rapat Dinas',
        documentHeading: 'BERITA ACARA RAPAT DINAS',
        documentSubHeading: (v.agendaRapat || 'RAPAT KOORDINASI SATUAN PENDIDIKAN').toUpperCase(),
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, pukul ${v.pukul || '08.30 WIB s.d. selesai'}, bertempat di ${v.tempat || config.namaSekolah}, telah diselenggarakan Rapat Dinas ${config.namaSekolah} dengan agenda pembahasan "${v.agendaRapat || '-'}".`,
        basisParagraphs: [
          `Rapat dipimpin oleh ${v.pemimpinRapat || 'Kepala Sekolah'} dan dihadiri oleh ${hadir} orang peserta dari total ${diundang} undangan (berhalangan hadir: ${tidakHadir} orang, daftar hadir terlampir).`
        ],
        bodyParagraphs: [
          'Setelah mendengarkan pemaparan pimpinan rapat dan musyawarah mufakat peserta rapat, ditetapkan pokok-pokok keputusan resmi sebagai berikut:'
        ],
        tables: [
          {
            title: 'RISALAH & KEPUTUSAN HASIL RAPAT DINAS',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Materi / Agenda Bahasan', align: 'left', widthPercent: 31 },
              { header: 'Hasil Keputusan / Kesepakatan', align: 'left', widthPercent: 40 },
              { header: 'Penanggung Jawab', align: 'left', widthPercent: 22 }
            ],
            rows
          }
        ],
        closingParagraph: 'Demikian Berita Acara Rapat Dinas ini dibuat dengan sebenarnya sebagai dokumen resmi hasil musyawarah kedinasan untuk dilaksanakan oleh seluruh unsur satuan pendidikan.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Pimpinan Rapat,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Notulis Rapat,',
          jabatan: 'Tata Usaha / Sekretaris Rapat',
          nama: formatSignatoryName(v.notulisNama),
          nip: formatSignatoryNip(v.notulisNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 25
        }
      };
    }
  },

  // 6. PEMERIKSAAN KAS & PENUTUPAN BKU BOS
  {
    id: 'pemeriksaan_kas',
    category: 'Keuangan & Kearsipan',
    shortTitle: 'Pemeriksaan Kas & Penutupan BKU',
    fullTitle: 'Berita Acara Pemeriksaan Kas dan Rekonsiliasi BKU Dana BOSP',
    description: 'Pemeriksaan rutin kas tunai dan saldo bank Bendahara BOS oleh Kepala Sekolah tiap akhir bulan/triwulan.',
    defaultValues: (config) => {
      const year = new Date().getFullYear();
      const monthName = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][new Date().getMonth()];
      return {
        nomorSurat: `900/BA-KAS/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        tempat: `Ruang Tata Usaha ${config.namaSekolah || 'Sekolah'}`,
        periodeKas: `Bulan ${monthName} ${year}`,
        sumberDana: 'Dana BOSP Reguler',
        bendaharaNama: '',
        bendaharaNip: '',
        saldoBukuBku: 15500000,
        saldoKasTunai: 1250000,
        saldoBank: 14250000,
        penjelasanSelisih: 'Tidak terdapat selisih antara catatan Buku Kas Umum (BKU) dengan fisik uang tunai di brankas serta saldo rekening koran bank.'
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Pemeriksaan', type: 'date', halfWidth: true },
      { key: 'periodeKas', label: 'Periode Penutupan BKU', type: 'text', halfWidth: true },
      { key: 'sumberDana', label: 'Jenis Dana', type: 'text', halfWidth: true },
      { key: 'bendaharaNama', label: 'Nama Bendahara Sekolah', type: 'text', halfWidth: true },
      { key: 'bendaharaNip', label: 'NIP / PPPK Bendahara', type: 'text', halfWidth: true },
      { key: 'saldoBukuBku', label: 'Saldo Menurut BKU (Rp)', type: 'number', halfWidth: true },
      { key: 'saldoKasTunai', label: 'Uang Tunai di Brankas (Rp)', type: 'number', halfWidth: true },
      { key: 'saldoBank', label: 'Saldo Rekening Bank (Rp)', type: 'number', halfWidth: true },
      { key: 'tempat', label: 'Tempat Pemeriksaan', type: 'text', halfWidth: true },
      { key: 'penjelasanSelisih', label: 'Catatan / Penjelasan Hasil Pemeriksaan', type: 'textarea' }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);

      const bku = safeFloat(v.saldoBukuBku);
      const tunai = safeFloat(v.saldoKasTunai);
      const bank = safeFloat(v.saldoBank);
      const totalFisik = tunai + bank;
      const selisih = totalFisik - bku;

      return {
        templateId: 'pemeriksaan_kas',
        templateTitle: 'Berita Acara Pemeriksaan Kas',
        documentHeading: 'BERITA ACARA PEMERIKSAAN KAS',
        documentSubHeading: `REKONSILIASI BUKU KAS UMUM (${(v.sumberDana || 'DANA BOSP').toUpperCase()})`,
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.tempat || config.namaSekolah}, Kepala ${config.namaSekolah} selaku Atasan Langsung/Penanggung Jawab Anggaran telah melakukan pemeriksaan kas dan penutupan Buku Kas Umum (BKU) untuk periode ${v.periodeKas || '-'} yang dikelola oleh:`,
        basisParagraphs: [
          `Nama Bendahara: ${formatSignatoryName(v.bendaharaNama)} (${formatSignatoryNip(v.bendaharaNip, 'NIPPK')}) · Sumber Dana: ${v.sumberDana || 'Dana BOSP Reguler'}.`
        ],
        bodyParagraphs: [
          'Dari hasil pencocokan antara pembukuan pada Buku Kas Umum (BKU), buku pembantu kas/bank, bukti pengeluaran (SPJ), serta perhitungan fisik uang tunai dan rekening koran diperoleh rincian sebagai berikut:'
        ],
        tables: [
          {
            title: 'HASIL PEMERIKSAAN DAN PENCOCOKAN SALDO KAS',
            columns: [
              { header: 'No', align: 'center', widthPercent: 8 },
              { header: 'Komponen Kas & Pembukuan', align: 'left', widthPercent: 54 },
              { header: 'Jumlah Nominal (Rp)', align: 'right', widthPercent: 38 }
            ],
            rows: [
              ['1', 'Saldo Menurut Buku Kas Umum (BKU) Akhir Periode', formatRupiah(bku)],
              ['2', 'Uang Tunai di Brankas / Kas Tunai Bendahara', formatRupiah(tunai)],
              ['3', 'Saldo pada Rekening Koran Bank Sekolah', formatRupiah(bank)],
              ['4', 'Jumlah Saldo Kas Tunai + Saldo Bank', formatRupiah(totalFisik)],
              ['5', 'Selisih Antara Saldo Fisik/Bank dengan BKU', selisih === 0 ? 'Rp 0 (NIHIL / COCOK)' : formatRupiah(selisih)]
            ]
          }
        ],
        detailSectionTitle: 'Catatan Hasil Pemeriksaan:',
        detailPairs: [
          { label: 'Periode Penutupan', value: v.periodeKas || '-' },
          { label: 'Kesimpulan Pemeriksa', value: v.penjelasanSelisih || '-' }
        ],
        closingParagraph: 'Demikian Berita Acara Pemeriksaan Kas ini dibuat dengan sebenar-benarnya sebagai pertanggungjawaban pengelolaan keuangan satuan pendidikan yang transparan dan akuntabel.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Pemeriksa / Kepala Sekolah,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Yang Diperiksa / Bendahara,',
          jabatan: `Bendahara ${v.sumberDana || 'BOSP'}`,
          nama: formatSignatoryName(v.bendaharaNama),
          nip: formatSignatoryNip(v.bendaharaNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 40
        }
      };
    }
  },

  // 7. PELAKSANAAN UJIAN / ASESMEN SEKOLAH
  {
    id: 'pelaksanaan_ujian',
    category: 'Kesiswaan & Akademik',
    shortTitle: 'Pelaksanaan Ujian / Asesmen',
    fullTitle: 'Berita Acara Pelaksanaan Ujian / Asesmen Satuan Pendidikan',
    description: 'Berita acara resmi tiap ruang/sesi pelaksanaan ANBK, TKA, Asesmen Sumatif, atau Ujian Sekolah.',
    defaultValues: (config) => {
      const year = new Date().getFullYear();
      return {
        nomorSurat: `422/BA-UJIAN/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        pukul: '07.30 WIB s.d. 09.30 WIB',
        namaUjian: `Asesmen Sumatif Akhir Tahun (ASAT) Tahun Pelajaran ${year - 1}/${year}`,
        mataPelajaran: 'Bahasa Indonesia (Sesi I)',
        ruangUjian: 'Ruang 01 / Lab Komputer',
        pesertaTerdaftar: 32,
        pesertaHadir: 32,
        pesertaTidakHadirNomor: '- (Semua Hadir)',
        catatanKejadian: 'Nihil. Pelaksanaan ujian berlangsung dengan tertib, aman, dan lancar tanpa kendala teknis.',
        pengawasNama: '',
        pengawasNip: '',
        proktorNama: '',
        proktorNip: ''
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Pelaksanaan', type: 'date', halfWidth: true },
      { key: 'namaUjian', label: 'Nama Kegiatan Ujian / Asesmen', type: 'text' },
      { key: 'mataPelajaran', label: 'Mata Uji / Sesi', type: 'text', halfWidth: true },
      { key: 'ruangUjian', label: 'Ruang / Sesi Ujian', type: 'text', halfWidth: true },
      { key: 'pukul', label: 'Waktu Pelaksanaan', type: 'text', halfWidth: true },
      { key: 'pesertaTerdaftar', label: 'Peserta Seharusnya (Terdaftar)', type: 'number', halfWidth: true },
      { key: 'pesertaHadir', label: 'Peserta Hadir', type: 'number', halfWidth: true },
      { key: 'pesertaTidakHadirNomor', label: 'Nomor Peserta Tidak Hadir & Alasan', type: 'text', halfWidth: true },
      { key: 'catatanKejadian', label: 'Catatan Kejadian Selama Ujian', type: 'textarea' },
      { key: 'pengawasNama', label: 'Nama Pengawas Ruang', type: 'text', halfWidth: true },
      { key: 'pengawasNip', label: 'NIP / PPPK Pengawas', type: 'text', halfWidth: true },
      { key: 'proktorNama', label: 'Nama Proktor / Ketua Panitia', type: 'text', halfWidth: true },
      { key: 'proktorNip', label: 'NIP / PPPK Proktor / Panitia', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const terdaftar = safeInt(v.pesertaTerdaftar);
      const hadir = safeInt(v.pesertaHadir);
      const tidakHadir = Math.max(0, terdaftar - hadir);

      return {
        templateId: 'pelaksanaan_ujian',
        templateTitle: 'Berita Acara Pelaksanaan Ujian',
        documentHeading: 'BERITA ACARA PELAKSANAAN ASESMEN / UJIAN',
        documentSubHeading: (v.namaUjian || 'ASESMEN SATUAN PENDIDIKAN').toUpperCase(),
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.ruangUjian || 'Ruang Ujian'} ${config.namaSekolah}, telah dilaksanakan ${v.namaUjian || 'Ujian Sekolah'} untuk Mata Uji/Sesi ${v.mataPelajaran || '-'} mulai pukul ${v.pukul || '07.30 WIB s.d. selesai'}.`,
        basisParagraphs: [],
        bodyParagraphs: [
          'Rekapitulasi kehadiran peserta serta catatan kondisi pelaksanaan asesmen pada ruang tersebut adalah sebagai berikut:'
        ],
        tables: [
          {
            title: 'DATA KEHADIRAN PESERTA UJIAN',
            columns: [
              { header: 'No', align: 'center', widthPercent: 8 },
              { header: 'Keterangan Kehadiran Peserta', align: 'left', widthPercent: 52 },
              { header: 'Jumlah / Keterangan', align: 'center', widthPercent: 40 }
            ],
            rows: [
              ['1', 'Jumlah Peserta Seharusnya (Terdaftar)', `${terdaftar} Peserta`],
              ['2', 'Jumlah Peserta Hadir Mengikuti Ujian', `${hadir} Peserta`],
              ['3', 'Jumlah Peserta Tidak Hadir', `${tidakHadir} Peserta`],
              ['4', 'Nomor Peserta / Identitas Tidak Hadir', v.pesertaTidakHadirNomor || '-']
            ]
          }
        ],
        detailSectionTitle: 'Catatan Kondisi Pelaksanaan:',
        detailPairs: [
          { label: 'Mata Pelajaran / Sesi', value: v.mataPelajaran || '-' },
          { label: 'Ruang Pelaksanaan', value: v.ruangUjian || '-' },
          { label: 'Kejadian Penting', value: v.catatanKejadian || 'Nihil, ujian berjalan lancar.' }
        ],
        closingParagraph: 'Demikian Berita Acara Pelaksanaan Asesmen/Ujian ini dibuat dengan sesungguhnya untuk dilampirkan bersama daftar hadir dan berkas hasil ujian.',
        signatoryLayout: 'ordered_hierarchy',
        leftSignatory: {
          roleLabel: 'Mengetahui,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Pengawas Ruang,',
          jabatan: 'Pengawas Ujian',
          nama: formatSignatoryName(v.pengawasNama),
          nip: formatSignatoryNip(v.pengawasNip, 'NIP'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 50
        },
        centerBottomSignatory: {
          roleLabel: 'Proktor / Panitia Ujian,',
          jabatan: 'Proktor / Sekretaris Panitia',
          nama: formatSignatoryName(v.proktorNama),
          nip: formatSignatoryNip(v.proktorNip, 'NIPPK'),
          rankOrder: 40
        },
        orderedSignatories: [
          {
            roleLabel: 'Mengetahui,',
            jabatan: kepsek.jabatan,
            nama: kepsek.nama,
            nip: kepsek.nip,
            signatureImage: kepsek.signatureImage,
            rankOrder: 100
          },
          {
            roleLabel: 'Pengawas Ruang,',
            jabatan: 'Pengawas Ujian',
            nama: formatSignatoryName(v.pengawasNama),
            nip: formatSignatoryNip(v.pengawasNip, 'NIP'),
            dateLine: `${place}, ${dt.formattedLong}`,
            rankOrder: 50
          },
          {
            roleLabel: 'Proktor / Panitia Ujian,',
            jabatan: 'Proktor / Sekretaris Panitia',
            nama: formatSignatoryName(v.proktorNama),
            nip: formatSignatoryNip(v.proktorNip, 'NIPPK'),
            rankOrder: 40
          }
        ]
      };
    }
  },

  // 8. PEMUSNAHAN ARSIP / PENGHAPUSAN BARANG RUSAK BERAT
  {
    id: 'pemusnahan_arsip_barang',
    category: 'Keuangan & Kearsipan',
    shortTitle: 'Pemusnahan Arsip / Penghapusan Aset',
    fullTitle: 'Berita Acara Pemusnahan Arsip / Penghapusan Barang Rusak Berat',
    description: 'Penghapusan barang inventaris rusak berat yang tidak layak pakai atau pemusnahan arsip inaktif sesuai JRA.',
    defaultValues: (config) => {
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `045/BA-HAPUS/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        tempat: `Halaman Belakang ${config.namaSekolah || 'Sekolah'}`,
        jenisObjek: 'Barang Inventaris Rusak Berat (Tidak Layak Pakai)',
        dasarSurat: `SK Tim Penghapusan Barang / Penilai Arsip Kepala Sekolah Tahun ${year}`,
        caraPemusnahan: 'Dihancurkan / Dilepas Komponen Rusak & Dicatat Penghapusan pada KIB/KIR',
        daftarItem: 'Kursi Belajar Kayu (Rusak Berat) | Tahun 2015 | 6 Buah | Kayu lapuk & patah tidak dapat diperbaiki\nPrinter Inkjet Lama (Mati Total) | Tahun 2018 | 1 Unit | Mainboard & printhead rusak total',
        ketuaTimNama: tu.nama.includes('...') ? '' : tu.nama,
        ketuaTimNip: tu.nip.includes('...') ? '' : tu.nip,
        saksi1Nama: '',
        saksi2Nama: ''
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Pelaksanaan', type: 'date', halfWidth: true },
      {
        key: 'jenisObjek',
        label: 'Jenis Objek',
        type: 'select',
        options: [
          { value: 'Barang Inventaris Rusak Berat (Tidak Layak Pakai)', label: 'Penghapusan Barang Rusak Berat' },
          { value: 'Arsip Inaktif Yang Telah Habis Masa Retensi (JRA)', label: 'Pemusnahan Arsip Inaktif' }
        ],
        halfWidth: true
      },
      { key: 'tempat', label: 'Lokasi Pelaksanaan', type: 'text', halfWidth: true },
      { key: 'dasarSurat', label: 'Dasar SK / Persetujuan', type: 'text' },
      { key: 'caraPemusnahan', label: 'Metode / Cara Penghapusan / Pemusnahan', type: 'text' },
      {
        key: 'daftarItem',
        label: 'Daftar Item (Format: Nama Barang/Arsip | Kurun Tahun | Jumlah | Kondisi/Alasan)',
        type: 'textarea'
      },
      { key: 'ketuaTimNama', label: 'Ketua Tim / Pengurus Barang', type: 'text', halfWidth: true },
      { key: 'ketuaTimNip', label: 'NIP / PPPK Ketua Tim', type: 'text', halfWidth: true },
      { key: 'saksi1Nama', label: 'Nama Saksi I', type: 'text', halfWidth: true },
      { key: 'saksi2Nama', label: 'Nama Saksi II', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const rows = parseStructuredLines(v.daftarItem, 4, ['1', '-', '-', '-', '-']);

      const witnesses: { nama: string; jabatan: string }[] = [];
      if (v.saksi1Nama?.trim()) witnesses.push({ nama: formatSignatoryName(v.saksi1Nama), jabatan: 'Saksi I' });
      if (v.saksi2Nama?.trim()) witnesses.push({ nama: formatSignatoryName(v.saksi2Nama), jabatan: 'Saksi II' });

      return {
        templateId: 'pemusnahan_arsip_barang',
        templateTitle: 'Berita Acara Pemusnahan / Penghapusan',
        documentHeading: 'BERITA ACARA PEMUSNAHAN / PENGHAPUSAN',
        documentSubHeading: (v.jenisObjek || 'BARANG INVENTARIS / ARSIP SEKOLAH').toUpperCase(),
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.tempat || config.namaSekolah}, Tim Pelaksana telah melaksanakan pemusnahan / penghapusan terhadap ${v.jenisObjek || 'Barang Inventaris / Arsip'} milik ${config.namaSekolah}.`,
        basisParagraphs: [
          `Dasar Pelaksanaan: ${v.dasarSurat || '-'} · Metode Pelaksanaan: ${v.caraPemusnahan || '-'}.`
        ],
        bodyParagraphs: [
          'Daftar rincian item barang rusak berat / arsip yang telah habis nilai gunanya dan dimusnahkan/dihapuskan dari daftar aktif adalah sebagai berikut:'
        ],
        tables: [
          {
            title: 'DAFTAR OBJEK YANG DIMUSNAHKAN / DIHAPUSKAN',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Nama Barang / Uraian Arsip', align: 'left', widthPercent: 32 },
              { header: 'Kurun Tahun', align: 'center', widthPercent: 14 },
              { header: 'Jumlah', align: 'center', widthPercent: 14 },
              { header: 'Kondisi / Alasan', align: 'left', widthPercent: 33 }
            ],
            rows
          }
        ],
        closingParagraph: 'Seluruh objek sebagaimana tercantum di atas telah selesai dimusnahkan/dihapuskan disaksikan oleh saksi-saksi. Berita Acara ini menjadi bukti sah mutasi/penghapusan aset dan arsip di lingkungan satuan pendidikan.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Menyetujui,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Ketua Tim / Pelaksana,',
          jabatan: 'Pengurus Barang / Arsiparis TU',
          nama: formatSignatoryName(v.ketuaTimNama),
          nip: formatSignatoryNip(v.ketuaTimNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 40
        },
        witnesses: witnesses.length > 0 ? witnesses : undefined
      };
    }
  },

  // 9. SPMB / PPDB (PENERIMAAN PESERTA DIDIK BARU)
  {
    id: 'ppdb_spmb',
    category: 'Kesiswaan & Akademik',
    shortTitle: 'Penerimaan Siswa Baru (SPMB/PPDB)',
    fullTitle: 'Berita Acara Penetapan Hasil Seleksi Penerimaan Murid Baru (SPMB/PPDB)',
    description: 'Penetapan hasil seleksi siswa baru per jalur (Domisili/Zonasi, Afirmasi, Prestasi, Mutasi) untuk dilaporkan ke Dinas.',
    defaultValues: (config) => {
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `422.1/BA-SPMB/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        tempat: `Sekretariat SPMB ${config.namaSekolah || 'Sekolah'}`,
        tahunPelajaran: `${year}/${year + 1}`,
        dayaTampung: 64,
        rincianJalur: 'Jalur Domisili / Zonasi | 36 | 19 | 17 | 36\nJalur Afirmasi | 12 | 5 | 5 | 10\nJalur Prestasi & Mutasi | 16 | 7 | 7 | 14',
        ketuaPanitiaNama: tu.nama.includes('...') ? '' : tu.nama,
        ketuaPanitiaNip: tu.nip.includes('...') ? '' : tu.nip
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Penetapan', type: 'date', halfWidth: true },
      { key: 'tahunPelajaran', label: 'Tahun Pelajaran Baru', type: 'text', halfWidth: true },
      { key: 'dayaTampung', label: 'Total Daya Tampung Sekolah', type: 'number', halfWidth: true },
      { key: 'tempat', label: 'Lokasi Rapat Pleno Panitia', type: 'text' },
      {
        key: 'rincianJalur',
        label: 'Rekap Per Jalur (Format: Nama Jalur | Kuota/Pendaftar | Diterima L | Diterima P | Daftar Ulang)',
        type: 'textarea'
      },
      { key: 'ketuaPanitiaNama', label: 'Ketua / Sekretaris Panitia SPMB', type: 'text', halfWidth: true },
      { key: 'ketuaPanitiaNip', label: 'NIP / PPPK Panitia', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const lines = (v.rincianJalur || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
      let totPendaftar = 0, totL = 0, totP = 0, totUlang = 0;

      const rows = (lines.length ? lines : ['Jalur Domisili | 0 | 0 | 0 | 0']).map((line: string, i: number) => {
        const cols = line.split(/\s*[|;]\s*/).map(c => c.trim());
        const jalur = cols[0] || `Jalur ${i + 1}`;
        const kuota = safeInt(cols[1]);
        const l = safeInt(cols[2]);
        const p = safeInt(cols[3]);
        const ulang = safeInt(cols[4]);
        totPendaftar += kuota; totL += l; totP += p; totUlang += ulang;
        return [String(i + 1), jalur, String(kuota), String(l), String(p), String(l + p), String(ulang)];
      });

      return {
        templateId: 'ppdb_spmb',
        templateTitle: 'Berita Acara Penetapan SPMB / PPDB',
        documentHeading: 'BERITA ACARA PENETAPAN HASIL SELEKSI',
        documentSubHeading: `SISTEM PENERIMAAN MURID BARU (SPMB / PPDB) TAHUN PELAJARAN ${v.tahunPelajaran || '-'}`,
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, bertempat di ${v.tempat || config.namaSekolah}, Panitia SPMB/PPDB bersama Dewan Guru ${config.namaSekolah} telah melaksanakan verifikasi berkas, pemeringkatan seleksi, dan penetapan calon peserta didik baru Tahun Pelajaran ${v.tahunPelajaran || '-'} (total daya tampung: ${safeInt(v.dayaTampung)} peserta didik).`,
        basisParagraphs: [
          'Pelaksanaan seleksi memedomani Petunjuk Teknis SPMB/PPDB Dinas Pendidikan Kabupaten/Kota secara objektif, transparan, dan akuntabel.'
        ],
        bodyParagraphs: [
          'Berdasarkan hasil verifikasi administrasi dan seleksi per jalur pendaftaran, ditetapkan hasil penerimaan peserta didik baru sebagai berikut:'
        ],
        tables: [
          {
            title: 'REKAPITULASI HASIL PENERIMAAN PER JALUR PENDAFTARAN',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Jalur Pendaftaran', align: 'left', widthPercent: 31 },
              { header: 'Pendaftar', align: 'center', widthPercent: 12 },
              { header: 'Diterima (L)', align: 'center', widthPercent: 12 },
              { header: 'Diterima (P)', align: 'center', widthPercent: 12 },
              { header: 'Total Diterima', align: 'center', widthPercent: 13 },
              { header: 'Daftar Ulang', align: 'center', widthPercent: 13 }
            ],
            rows,
            footerRow: ['TOTAL', 'Seluruh Jalur Seleksi', String(totPendaftar), String(totL), String(totP), String(totL + totP), String(totUlang)]
          }
        ],
        closingParagraph: 'Demikian Berita Acara Penetapan Hasil SPMB/PPDB ini dibuat dengan sebenarnya sebagai dasar pengumuman resmi dan penginputan peserta didik baru ke dalam sistem Dapodik.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Ketua / Sekretaris Panitia,',
          jabatan: 'Panitia SPMB / Tata Usaha',
          nama: formatSignatoryName(v.ketuaPanitiaNama),
          nip: formatSignatoryNip(v.ketuaPanitiaNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 60
        }
      };
    }
  },

  // 10. KEHILANGAN / KERUSAKAN SARANA PRASARANA
  {
    id: 'kehilangan_kerusakan',
    category: 'Aset & Sapras',
    shortTitle: 'Kehilangan / Kerusakan Barang',
    fullTitle: 'Berita Acara Kejadian Kehilangan / Kerusakan Berat Aset Sekolah',
    description: 'Laporan kejadian resmi kehilangan, pencurian, atau kerusakan akibat force majeure untuk keperluan pertanggungjawaban aset.',
    defaultValues: (config) => {
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `028/BA-KEJADIAN/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        waktuDiketahui: '06.45 WIB',
        lokasiKejadian: `Gedung Ruang Kelas / Tata Usaha ${config.namaSekolah || 'Sekolah'}`,
        jenisKejadian: 'Kerusakan Akibat Bencana / Cuaca Ekstrem',
        kronologi: 'Pada pagi hari saat pengecekan rutin lingkungan sekolah, ditemukan beberapa sarana/aset mengalami kerusakan akibat hujan deras disertai angin kencang pada malam sebelumnya.',
        daftarAset: 'Pintu Jendela Ruang Kelas | INV-2021-014 | 2 Unit | Kusen & engsel patah/rusak',
        tindakLanjut: 'Melakukan pengamanan lokasi, mendokumentasikan foto kondisi aset, serta mengajukan usulan perbaikan melalui anggaran pemeliharaan BOSP.',
        pelaporNama: tu.nama.includes('...') ? '' : tu.nama,
        pelaporNip: tu.nip.includes('...') ? '' : tu.nip,
        saksi1Nama: ''
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Diketahui / Laporan', type: 'date', halfWidth: true },
      { key: 'waktuDiketahui', label: 'Waktu Diketahui', type: 'text', halfWidth: true },
      { key: 'lokasiKejadian', label: 'Lokasi Kejadian', type: 'text', halfWidth: true },
      {
        key: 'jenisKejadian',
        label: 'Kategori Kejadian',
        type: 'select',
        options: [
          { value: 'Kerusakan Akibat Bencana / Cuaca Ekstrem', label: 'Kerusakan Akibat Bencana / Cuaca' },
          { value: 'Kehilangan Barang / Aset Sekolah', label: 'Kehilangan Barang / Pencurian' },
          { value: 'Kerusakan Teknis Mendadak / Korsleting', label: 'Kerusakan Teknis / Korsleting' }
        ]
      },
      { key: 'kronologi', label: 'Uraian Kronologi Kejadian', type: 'textarea' },
      {
        key: 'daftarAset',
        label: 'Daftar Barang / Dokumen Terdampak (Format: Nama Barang | Kode Inventaris | Jumlah | Kondisi/Keterangan)',
        type: 'textarea'
      },
      { key: 'tindakLanjut', label: 'Langkah Penanganan & Tindak Lanjut', type: 'textarea' },
      { key: 'pelaporNama', label: 'Nama Pelapor / Penanggung Jawab', type: 'text', halfWidth: true },
      { key: 'pelaporNip', label: 'NIP / PPPK Pelapor', type: 'text', halfWidth: true },
      { key: 'saksi1Nama', label: 'Nama Saksi (Penjaga / Guru)', type: 'text', halfWidth: true }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const rows = parseStructuredLines(v.daftarAset, 4, ['1', '-', '-', '-', '-']);
      const witnesses = v.saksi1Nama?.trim()
        ? [{ nama: formatSignatoryName(v.saksi1Nama), jabatan: 'Saksi Kejadian' }]
        : undefined;

      return {
        templateId: 'kehilangan_kerusakan',
        templateTitle: 'Berita Acara Kejadian Kehilangan / Kerusakan',
        documentHeading: 'BERITA ACARA KEJADIAN',
        documentSubHeading: (v.jenisKejadian || 'KEHILANGAN / KERUSAKAN SARANA PRASARANA').toUpperCase(),
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, sekitar pukul ${v.waktuDiketahui || '07.00 WIB'}, bertempat di ${v.lokasiKejadian || config.namaSekolah}, telah diketahui adanya kejadian ${v.jenisKejadian || 'kerusakan/kehilangan sarana prasarana sekolah'}.`,
        basisParagraphs: [
          `Kronologi Kejadian: ${v.kronologi || '-'}`
        ],
        bodyParagraphs: [
          'Adapun rincian aset / dokumen sekolah yang terdampak dalam kejadian tersebut adalah sebagai berikut:'
        ],
        tables: [
          {
            title: 'DAFTAR SARANA / DOKUMEN TERDAMPAK',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Nama Barang / Dokumen', align: 'left', widthPercent: 32 },
              { header: 'Kode / Tahun', align: 'center', widthPercent: 18 },
              { header: 'Jumlah', align: 'center', widthPercent: 13 },
              { header: 'Kondisi / Keterangan', align: 'left', widthPercent: 30 }
            ],
            rows
          }
        ],
        detailSectionTitle: 'Tindak Lanjut Penanganan:',
        detailPairs: [
          { label: 'Lokasi Kejadian', value: v.lokasiKejadian || '-' },
          { label: 'Tindak Lanjut', value: v.tindakLanjut || '-' }
        ],
        closingParagraph: 'Demikian Berita Acara Kejadian ini dibuat berdasarkan fakta di lapangan untuk dipergunakan sebagai kelengkapan administrasi pengamanan, usulan perbaikan, ataupun pelaporan kepada instansi berwenang.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Kepala Sekolah,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Pelapor / Pengurus Barang,',
          jabatan: 'Tata Usaha / Sarpras',
          nama: formatSignatoryName(v.pelaporNama),
          nip: formatSignatoryNip(v.pelaporNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 40
        },
        witnesses
      };
    }
  },

  // 11. RAPAT UMUM ANTARA PIHAK SEKOLAH DAN ORANG TUA / WALI SISWA
  {
    id: 'rapat_sekolah_orang_tua',
    category: 'Kepegawaian & Rapat',
    shortTitle: 'Rapat Umum Sekolah & Orang Tua',
    fullTitle: 'Berita Acara Rapat Umum Antara Pihak Sekolah dan Orang Tua / Wali Siswa',
    description: 'Dokumentasi resmi musyawarah umum pihak sekolah bersama orang tua/wali murid dan komite sekolah beserta butir kesepakatannya.',
    defaultValues: (config) => {
      const kepsek = getKepsekInfo(config);
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `005/BA-RAPAT-ORTU/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        pukul: '09.00 WIB s.d. 11.30 WIB',
        tempat: `Aula / Ruang Pertemuan ${config.namaSekolah || 'Sekolah'}`,
        tahunPelajaran: `${year}/${year + 1}`,
        sasaranPeserta: 'Seluruh Orang Tua / Wali Siswa, Pengurus Komite Sekolah, Dewan Guru, dan Staf Tata Usaha',
        agendaRapat: 'Sosialisasi Program Kerja Sekolah, Tata Tertib Peserta Didik, Kalender Pendidikan, dan Sinergi Pembinaan Siswa',
        pemimpinRapat: kepsek.nama.includes('...') ? 'Kepala Sekolah' : kepsek.nama,
        jumlahUndanganOrtu: 120,
        jumlahHadirOrtu: 112,
        jumlahHadirSekolah: 18,
        pokokKeputusan:
          'Program Kerja & Kalender Pendidikan Tahun Berjalan | Orang tua/wali memahami dan mendukung agenda pembelajaran, asesmen, serta kegiatan pembinaan karakter siswa | Kepala Sekolah & Waka Kurikulum\nTata Tertib, Kedisiplinan & Kehadiran Peserta Didik | Disepakati komunikasi aktif antara wali kelas dan orang tua untuk pemantauan kehadiran, ketertiban seragam, serta izin siswa | Wali Kelas, BK & Orang Tua\nSinergi Komite & Dukungan Lingkungan Belajar | Pengurus Komite dan orang tua/wali sepakat mendukung program peningkatan mutu layanan sekolah sesuai ketentuan peraturan perundang-undangan | Komite Sekolah & Tata Usaha',
        ketuaKomiteNama: '',
        ketuaKomiteJabatan: 'Ketua Komite Sekolah / Perwakilan Orang Tua',
        notulisNama: tu.nama.includes('...') ? '' : tu.nama,
        notulisNip: tu.nip.includes('...') ? '' : tu.nip,
        saksiOrtuNama: ''
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Berita Acara Rapat', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Rapat Umum', type: 'date', halfWidth: true },
      { key: 'pukul', label: 'Waktu / Pukul Pelaksanaan', type: 'text', halfWidth: true },
      { key: 'tahunPelajaran', label: 'Tahun Pelajaran', type: 'text', halfWidth: true },
      { key: 'tempat', label: 'Tempat Rapat Umum', type: 'text' },
      { key: 'sasaranPeserta', label: 'Unsur Peserta Rapat', type: 'text' },
      { key: 'agendaRapat', label: 'Agenda / Topik Utama Rapat Umum', type: 'text' },
      { key: 'pemimpinRapat', label: 'Pemimpin Rapat', type: 'text', halfWidth: true },
      { key: 'jumlahUndanganOrtu', label: 'Jumlah Orang Tua Diundang', type: 'number', halfWidth: true },
      { key: 'jumlahHadirOrtu', label: 'Jumlah Orang Tua Hadir', type: 'number', halfWidth: true },
      { key: 'jumlahHadirSekolah', label: 'Jumlah Unsur Sekolah Hadir', type: 'number', halfWidth: true },
      {
        key: 'pokokKeputusan',
        label: 'Pokok Bahasan & Kesepakatan Bersama (Format: Pokok Bahasan | Hasil Kesepakatan | Pihak Terkait)',
        type: 'textarea'
      },
      { key: 'ketuaKomiteNama', label: 'Nama Perwakilan Orang Tua / Ketua Komite', type: 'text', halfWidth: true },
      { key: 'ketuaKomiteJabatan', label: 'Jabatan Perwakilan Orang Tua', type: 'text', halfWidth: true },
      { key: 'notulisNama', label: 'Nama Notulis / Sekretaris Rapat (TU)', type: 'text', halfWidth: true },
      { key: 'notulisNip', label: 'NIP / PPPK Notulis', type: 'text', halfWidth: true },
      { key: 'saksiOrtuNama', label: 'Nama Saksi Perwakilan Orang Tua (Opsional)', type: 'text' }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const undanganOrtu = safeInt(v.jumlahUndanganOrtu);
      const hadirOrtu = safeInt(v.jumlahHadirOrtu);
      const hadirSekolah = safeInt(v.jumlahHadirSekolah);
      const pctOrtu = undanganOrtu > 0 ? ((hadirOrtu / undanganOrtu) * 100).toFixed(1).replace('.', ',') : '0,0';
      const rows = parseStructuredLines(v.pokokKeputusan, 3, [
        '1',
        v.agendaRapat || '-',
        'Disepakati secara musyawarah mufakat',
        'Sekolah & Orang Tua'
      ]);
      const witnesses = v.saksiOrtuNama?.trim()
        ? [{ nama: formatSignatoryName(v.saksiOrtuNama), jabatan: 'Saksi Perwakilan Orang Tua / Wali Siswa' }]
        : undefined;

      return {
        templateId: 'rapat_sekolah_orang_tua',
        templateTitle: 'Berita Acara Rapat Umum Sekolah & Orang Tua Siswa',
        documentHeading: 'BERITA ACARA',
        documentSubHeading: 'RAPAT UMUM ANTARA PIHAK SEKOLAH DAN ORANG TUA / WALI SISWA',
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        openingParagraph: `${dt.sentencePrefix}, pukul ${v.pukul || '09.00 WIB s.d. selesai'}, bertempat di ${v.tempat || config.namaSekolah}, telah dilaksanakan Rapat Umum antara Pihak ${config.namaSekolah || 'Satuan Pendidikan'} bersama Orang Tua / Wali Peserta Didik Tahun Pelajaran ${v.tahunPelajaran || '-'} dengan agenda utama "${v.agendaRapat || '-'}".`,
        basisParagraphs: [
          `Rapat umum dipimpin oleh ${v.pemimpinRapat || 'Kepala Sekolah'} dan dihadiri oleh ${hadirSekolah} orang unsur pihak sekolah (Kepala Sekolah, Dewan Guru, dan Tata Usaha) serta ${hadirOrtu} orang Orang Tua / Wali Siswa dari total ${undanganOrtu} undangan (tingkat kehadiran ${pctOrtu}%, daftar hadir terlampir sebagai bagian tidak terpisahkan dari Berita Acara ini).`
        ],
        bodyParagraphs: [
          'Setelah mendengarkan pemaparan program satuan pendidikan, sesi dialog terbuka, serta musyawarah mufakat antara pihak sekolah dan orang tua/wali siswa, forum rapat umum menetapkan hasil kesepakatan bersama sebagai berikut:'
        ],
        tables: [
          {
            title: 'RISALAH & KESEPAKATAN RAPAT UMUM SEKOLAH DAN ORANG TUA SISWA',
            columns: [
              { header: 'No', align: 'center', widthPercent: 7 },
              { header: 'Pokok Bahasan / Program', align: 'left', widthPercent: 30 },
              { header: 'Hasil Keputusan & Kesepakatan Bersama', align: 'left', widthPercent: 42 },
              { header: 'Penanggung Jawab', align: 'left', widthPercent: 21 }
            ],
            rows
          }
        ],
        detailSectionTitle: 'Ringkasan Kehadiran & Unsur Forum:',
        detailPairs: [
          { label: 'Tahun Pelajaran', value: v.tahunPelajaran || '-' },
          { label: 'Unsur Peserta Rapat', value: v.sasaranPeserta || '-' },
          { label: 'Kehadiran Orang Tua / Wali', value: `${hadirOrtu} orang hadir dari ${undanganOrtu} undangan (${pctOrtu}%)` },
          { label: 'Kehadiran Pihak Sekolah', value: `${hadirSekolah} orang (Pimpinan, Dewan Guru & Staf TU)` },
          { label: 'Total Peserta Forum', value: `${hadirOrtu + hadirSekolah} orang` }
        ],
        closingParagraph: 'Demikian Berita Acara Rapat Umum antara Pihak Sekolah dan Orang Tua / Wali Siswa ini dibuat dengan sebenar-benarnya sebagai dokumen resmi hasil kesepakatan bersama untuk dipedomani dan dilaksanakan oleh seluruh pihak terkait.',
        signatoryLayout: 'ordered_hierarchy',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Perwakilan Orang Tua / Wali Siswa,',
          jabatan: v.ketuaKomiteJabatan || 'Ketua Komite Sekolah / Perwakilan Orang Tua',
          nama: formatSignatoryName(v.ketuaKomiteNama),
          nip: 'Perwakilan Orang Tua / Wali Peserta Didik',
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 75
        },
        centerBottomSignatory: {
          roleLabel: 'Notulis / Sekretaris Rapat,',
          jabatan: 'Tata Usaha Satuan Pendidikan',
          nama: formatSignatoryName(v.notulisNama),
          nip: formatSignatoryNip(v.notulisNip, 'NIPPK'),
          rankOrder: 25
        },
        orderedSignatories: [
          {
            roleLabel: 'Mengetahui / Mengesahkan,',
            jabatan: kepsek.jabatan,
            nama: kepsek.nama,
            nip: kepsek.nip,
            signatureImage: kepsek.signatureImage,
            rankOrder: 100
          },
          {
            roleLabel: 'Perwakilan Orang Tua / Wali Siswa,',
            jabatan: v.ketuaKomiteJabatan || 'Ketua Komite Sekolah / Perwakilan Orang Tua',
            nama: formatSignatoryName(v.ketuaKomiteNama),
            nip: 'Perwakilan Orang Tua / Wali Peserta Didik',
            dateLine: `${place}, ${dt.formattedLong}`,
            rankOrder: 75
          },
          {
            roleLabel: 'Notulis / Sekretaris Rapat,',
            jabatan: 'Tata Usaha Satuan Pendidikan',
            nama: formatSignatoryName(v.notulisNama),
            nip: formatSignatoryNip(v.notulisNip, 'NIPPK'),
            rankOrder: 25
          }
        ],
        witnesses
      };
    }
  },

  // 12. SURAT PENGANTAR BEROBAT RESMI (UNTUK SISWA, GURU, MAUPUN STAF/PEGAWAI)
  {
    id: 'surat_pengantar_berobat',
    category: 'Persuratan & Layanan Umum',
    shortTitle: 'Surat Pengantar Berobat',
    fullTitle: 'Surat Pengantar Berobat / Pemeriksaan Kesehatan Resmi',
    description: 'Surat pengantar resmi dan sah dari sekolah untuk pelayanan pemeriksaan kesehatan/berobat ke Puskesmas, Klinik, atau Rumah Sakit.',
    defaultValues: (config) => {
      const tu = getTuOperatorInfo(config);
      const year = new Date().getFullYear();
      return {
        nomorSurat: `441.5/SP-BEROBAT/${config.npsn || 'SEKOLAH'}/${year}`,
        tanggal: getTodayIso(),
        waktuBerangkat: '09.30 WIB',
        faskesTujuan: 'Kepala Puskesmas / Dokter Pemeriksa Fasilitas Kesehatan',
        alamatFaskes: 'Tempat',
        statusPasien: 'Peserta Didik (Siswa)',
        namaPasien: '',
        nomorIdentitas: '',
        tempatTglLahir: '',
        jenisKelamin: 'Laki-laki',
        kelasAtauJabatan: '',
        nomorBpjs: '-',
        alamatPasien: '',
        waliKontakDarurat: '',
        keluhanMedis: 'Mengalami gangguan kesehatan pada jam operasional sekolah (demam / pusing / keluhan fisik) sehingga memerlukan pemeriksaan medis dan penanganan dokter.',
        pendampingNama: tu.nama.includes('...') ? '' : tu.nama,
        pendampingNip: tu.nip.includes('...') ? '' : tu.nip,
        pendampingJabatan: tu.jabatan || 'Petugas UKS / Pelaksana Tata Usaha'
      };
    },
    fields: [
      { key: 'nomorSurat', label: 'Nomor Surat Pengantar', type: 'text', halfWidth: true },
      { key: 'tanggal', label: 'Tanggal Surat', type: 'date', halfWidth: true },
      { key: 'waktuBerangkat', label: 'Waktu / Pukul Keberangkatan', type: 'text', halfWidth: true },
      {
        key: 'statusPasien',
        label: 'Status Warga Sekolah',
        type: 'select',
        halfWidth: true,
        options: [
          { value: 'Peserta Didik (Siswa)', label: 'Peserta Didik (Siswa)' },
          { value: 'Pendidik (Guru)', label: 'Pendidik (Guru)' },
          { value: 'Tenaga Kependidikan (TU / Staf)', label: 'Tenaga Kependidikan (TU / Staf)' }
        ]
      },
      { key: 'faskesTujuan', label: 'Ditujukan Kepada (Puskesmas / Klinik / RS)', type: 'text' },
      { key: 'alamatFaskes', label: 'Kota / Lokasi Faskes Tujuan', type: 'text', halfWidth: true },
      { key: 'namaPasien', label: 'Nama Lengkap Pasien', type: 'text', halfWidth: true },
      { key: 'nomorIdentitas', label: 'NISN / NIP / NIPPK / NIK', type: 'text', halfWidth: true },
      { key: 'tempatTglLahir', label: 'Tempat, Tgl. Lahir / Umur', type: 'text', halfWidth: true, placeholder: 'Contoh: Teluk, 12 Mei 2012 (14 Tahun)' },
      {
        key: 'jenisKelamin',
        label: 'Jenis Kelamin',
        type: 'select',
        halfWidth: true,
        options: [
          { value: 'Laki-laki', label: 'Laki-laki' },
          { value: 'Perempuan', label: 'Perempuan' }
        ]
      },
      { key: 'kelasAtauJabatan', label: 'Kelas / Jabatan / Unit Kerja', type: 'text', halfWidth: true, placeholder: 'Contoh: Kelas VIII-A / Guru Mapel' },
      { key: 'nomorBpjs', label: 'Nomor Kartu JKN / BPJS / KIS (Opsional)', type: 'text', halfWidth: true },
      { key: 'waliKontakDarurat', label: 'Nama Orang Tua / Wali & No. HP Darurat', type: 'text', halfWidth: true },
      { key: 'alamatPasien', label: 'Alamat Lengkap Tempat Tinggal', type: 'text' },
      { key: 'keluhanMedis', label: 'Keluhan Awal / Keperluan Pemeriksaan Medis', type: 'textarea' },
      { key: 'pendampingNama', label: 'Petugas Pendamping / Pengantar (UKS / TU)', type: 'text', halfWidth: true },
      { key: 'pendampingNip', label: 'NIP / PPPK Pendamping (Opsional)', type: 'text', halfWidth: true },
      { key: 'pendampingJabatan', label: 'Jabatan Petugas Pendamping', type: 'text' }
    ],
    buildContent: (v, config) => {
      const dt = formatOfficialIndonesianOpeningDate(v.tanggal);
      const place = getPlaceName(config);
      const kepsek = getKepsekInfo(config);
      const faskes = v.faskesTujuan?.trim() || 'Pimpinan / Dokter Jaga Puskesmas / Klinik / Rumah Sakit';
      const lokasiFaskes = v.alamatFaskes?.trim() || 'Tempat';

      return {
        templateId: 'surat_pengantar_berobat',
        templateTitle: 'Surat Pengantar Berobat Resmi',
        documentHeading: 'SURAT PENGANTAR BEROBAT',
        documentSubHeading: 'PELAYANAN PEMERIKSAAN KESEHATAN WARGA SATUAN PENDIDIKAN',
        nomorSurat: v.nomorSurat || '-',
        docDateLocation: `${place}, ${dt.formattedLong}`,
        recipientLines: [
          'Kepada Yth.',
          faskes,
          `di ${lokasiFaskes}`
        ],
        openingParagraph: `Dengan hormat, yang bertanda tangan di bawah ini Kepala ${config.namaSekolah || 'Satuan Pendidikan'}, dengan ini menerangkan dan mengantarkan warga satuan pendidikan kami yang tersebut identitasnya di bawah ini untuk mendapatkan pelayanan pemeriksaan kesehatan dan pengobatan:`,
        basisParagraphs: [],
        detailSectionTitle: 'Identitas Pasien / Yang Diberi Pengantar:',
        detailPairs: [
          { label: 'Nama Lengkap', value: v.namaPasien?.trim() || '........................................................' },
          { label: 'Status di Sekolah', value: v.statusPasien || 'Peserta Didik (Siswa)' },
          { label: 'NISN / NIP / NIK', value: v.nomorIdentitas?.trim() || '........................................................' },
          { label: 'Tempat, Tgl. Lahir / Umur', value: v.tempatTglLahir?.trim() || '........................................................' },
          { label: 'Jenis Kelamin', value: v.jenisKelamin || 'Laki-laki' },
          { label: 'Kelas / Jabatan / Unit', value: v.kelasAtauJabatan?.trim() || '........................................................' },
          { label: 'Nomor JKN / BPJS / KIS', value: v.nomorBpjs?.trim() || '-' },
          { label: 'Alamat Tempat Tinggal', value: v.alamatPasien?.trim() || '........................................................' },
          { label: 'Orang Tua / Wali & No. HP', value: v.waliKontakDarurat?.trim() || '........................................................' },
          { label: 'Hari, Tanggal & Pukul', value: `${dt.formattedLong}, Pukul ${v.waktuBerangkat || '-'}` },
          { label: 'Keluhan / Keperluan Medis', value: v.keluhanMedis?.trim() || 'Pemeriksaan kesehatan umum dan pengobatan medis.' },
          {
            label: 'Petugas Pendamping',
            value: v.pendampingNama?.trim()
              ? `${formatSignatoryName(v.pendampingNama)} (${v.pendampingJabatan || 'Petugas UKS / TU'})`
              : 'Didampingi Orang Tua / Wali / Mandiri'
          }
        ],
        bodyParagraphs: [
          `Sehubungan dengan kondisi tersebut, kami mohon bantuan Bapak/Ibu Dokter serta tenaga medis pada ${faskes} untuk berkenan melakukan pemeriksaan kesehatan, memberikan pengobatan ataupun tindakan medis yang diperlukan sesuai ketentuan, serta menerbitkan surat keterangan medis apabila diperlukan sebagai dasar administrasi sekolah.`
        ],
        tables: [],
        closingParagraph: 'Demikian Surat Pengantar Berobat ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian, bantuan, dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.',
        signatoryLayout: 'two_col',
        leftSignatory: {
          roleLabel: 'Mengetahui / Mengesahkan,',
          jabatan: kepsek.jabatan,
          nama: kepsek.nama,
          nip: kepsek.nip,
          signatureImage: kepsek.signatureImage,
          rankOrder: 100
        },
        rightSignatory: {
          roleLabel: 'Petugas Pengantar / UKS,',
          jabatan: v.pendampingJabatan || 'Pelaksana Tata Usaha / UKS',
          nama: formatSignatoryName(v.pendampingNama),
          nip: formatSignatoryNip(v.pendampingNip, 'NIPPK'),
          dateLine: `${place}, ${dt.formattedLong}`,
          rankOrder: 25
        }
      };
    }
  }
];
