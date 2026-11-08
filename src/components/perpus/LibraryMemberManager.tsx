import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Printer, 
  SlidersHorizontal, 
  IdCard, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileText,
  Calendar,
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LibraryMemberItem, LibraryMemberStats } from '../../types';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
import { KopSurat } from '../common/KopSurat';
import { 
  downloadMemberExcelTemplate, 
  exportMembersToExcel, 
  parseMemberExcelFile 
} from '../../utils/excelHelper';

export const LibraryMemberManager: React.FC = () => {
  const { 
    libraryMembers, 
    addLibraryMember, 
    updateLibraryMember, 
    deleteLibraryMember, 
    deleteMultipleLibraryMembers,
    importLibraryMembers,
    libraryMemberStats, 
    updateLibraryMemberStats,
    schoolConfig 
  } = useApp();

  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'GURU' | 'STAFF' | 'SISWA'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'tamat' | 'nonaktif'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection States
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);
  const [parsedExcelMembers, setParsedExcelMembers] = useState<Omit<LibraryMemberItem, 'id'>[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [activeCardMember, setActiveCardMember] = useState<LibraryMemberItem | null>(null);

  // Print Customization States (Kertas F4/A4, Edit Tanggal Manual, Mode Lengkap/Ringkasan)
  const [printPaperSize, setPrintPaperSize] = useState<'F4' | 'A4'>('F4');
  const [printContentMode, setPrintContentMode] = useState<'full' | 'summary'>('full');
  const [printManualDate, setPrintManualDate] = useState<string>(() => {
    const loc = schoolConfig.kabupatenKota || 'Batang Hari';
    const d = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${loc}, ${d}`;
  });
  const [printNomorDokumen, setPrintNomorDokumen] = useState<string>(() => {
    return `421.2/028/REKAP-ANGGOTA/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`;
  });
  const [isEditPrintDateOpen, setIsEditPrintDateOpen] = useState(false);
  const [isEditNomorDokumenOpen, setIsEditNomorDokumenOpen] = useState(false);
  const [tempPrintDate, setTempPrintDate] = useState('');
  const [tempPrintNomor, setTempPrintNomor] = useState('');

  // Active member for Edit / Delete
  const [activeMember, setActiveMember] = useState<LibraryMemberItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<LibraryMemberItem>>({
    nomorAnggota: '',
    nama: '',
    tipeAnggota: 'SISWA',
    kelasAtauJabatan: '',
    nomorIdentitas: '',
    jenisKelamin: 'L',
    tanggalBergabung: new Date().toISOString().split('T')[0],
    status: 'aktif',
    telepon: '',
    keterangan: ''
  });

  // State for Quick Aggregate Stats Modal with Gender Breakdown
  const [statsForm, setStatsForm] = useState<LibraryMemberStats>({
    siswaLaki: libraryMemberStats.siswaLaki || 0,
    siswaPerempuan: libraryMemberStats.siswaPerempuan || 0,
    guruLaki: libraryMemberStats.guruLaki ?? 10,
    guruPerempuan: libraryMemberStats.guruPerempuan ?? 14,
    guruPendidik: libraryMemberStats.guruPendidik || 24,
    staffLaki: libraryMemberStats.staffLaki ?? 5,
    staffPerempuan: libraryMemberStats.staffPerempuan ?? 3,
    staffTendik: libraryMemberStats.staffTendik || 8,
    lastUpdated: libraryMemberStats.lastUpdated || new Date().toISOString().split('T')[0]
  });

  // Normalized Member Type helper
  const getMemberTypeUpper = (member: LibraryMemberItem): 'GURU' | 'STAFF' | 'SISWA' => {
    const t = String(member.tipeAnggota).toUpperCase();
    if (t === 'GURU') return 'GURU';
    if (t === 'STAFF') return 'STAFF';
    return 'SISWA';
  };

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return libraryMembers.filter(m => {
      const typeUpper = getMemberTypeUpper(m);
      if (activeTab !== 'all' && typeUpper !== activeTab) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const s = (m.status || 'aktif').toLowerCase();
        if (statusFilter === 'tamat') {
          if (s !== 'tamat' && s !== 'alumni') return false;
        } else if (statusFilter === 'aktif') {
          if (s !== 'aktif') return false;
        } else if (statusFilter === 'nonaktif') {
          if (s !== 'nonaktif') return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (m.nama || '').toLowerCase().includes(q);
        const matchNo = (m.nomorAnggota || '').toLowerCase().includes(q);
        const matchId = (m.nomorIdentitas || '').toLowerCase().includes(q);
        const matchRole = (m.kelasAtauJabatan || '').toLowerCase().includes(q);
        const matchStatus = (m.status || '').toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchId && !matchRole && !matchStatus) return false;
      }

      return true;
    });
  }, [libraryMembers, activeTab, statusFilter, searchQuery]);

  // Aggregate stats calculations with gender breakdown for Guru and Staff
  const guruLakiCount = libraryMemberStats.guruLaki ?? (libraryMembers.filter(m => getMemberTypeUpper(m) === 'GURU' && m.jenisKelamin === 'L').length || 10);
  const guruPerempuanCount = libraryMemberStats.guruPerempuan ?? (libraryMembers.filter(m => getMemberTypeUpper(m) === 'GURU' && m.jenisKelamin === 'P').length || 14);
  const totalGuru = (libraryMemberStats.guruPendidik && libraryMemberStats.guruPendidik > 0)
    ? libraryMemberStats.guruPendidik
    : (guruLakiCount + guruPerempuanCount);

  const staffLakiCount = libraryMemberStats.staffLaki ?? (libraryMembers.filter(m => getMemberTypeUpper(m) === 'STAFF' && m.jenisKelamin === 'L').length || 5);
  const staffPerempuanCount = libraryMemberStats.staffPerempuan ?? (libraryMembers.filter(m => getMemberTypeUpper(m) === 'STAFF' && m.jenisKelamin === 'P').length || 3);
  const totalStaff = (libraryMemberStats.staffTendik && libraryMemberStats.staffTendik > 0)
    ? libraryMemberStats.staffTendik
    : (staffLakiCount + staffPerempuanCount);

  const siswaLakiCount = libraryMemberStats.siswaLaki || 0;
  const siswaPerempuanCount = libraryMemberStats.siswaPerempuan || 0;
  const totalSiswa = siswaLakiCount + siswaPerempuanCount;
  const grandTotal = totalSiswa + totalGuru + totalStaff;

  // Registered members count in directory
  const registeredGuruCount = libraryMembers.filter(m => getMemberTypeUpper(m) === 'GURU').length;
  const registeredStaffCount = libraryMembers.filter(m => getMemberTypeUpper(m) === 'STAFF').length;
  const registeredSiswaCount = libraryMembers.filter(m => getMemberTypeUpper(m) === 'SISWA').length;
  const registeredTamatCount = libraryMembers.filter(m => m.status === 'tamat' || m.status === 'alumni').length;

  // Open Add Modal
  const handleOpenAdd = (typeDefault: 'GURU' | 'STAFF' | 'SISWA' = 'SISWA') => {
    const year = new Date().getFullYear();
    const prefix = typeDefault === 'GURU' ? 'ANG-G' : typeDefault === 'STAFF' ? 'ANG-ST' : 'ANG-SW';
    const num = libraryMembers.filter(m => getMemberTypeUpper(m) === typeDefault).length + 1;
    
    setFormData({
      nomorAnggota: `${prefix}-${String(num).padStart(3, '0')}`,
      nama: '',
      tipeAnggota: typeDefault,
      kelasAtauJabatan: typeDefault === 'SISWA' ? 'Kelas VII-A' : typeDefault === 'GURU' ? 'Guru Mata Pelajaran' : 'Staf Tata Usaha',
      nomorIdentitas: '',
      jenisKelamin: 'L',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      status: 'aktif',
      telepon: '',
      keterangan: 'Anggota aktif perpustakaan'
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Member
  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) return;

    addLibraryMember({
      nomorAnggota: formData.nomorAnggota || `ANG-${Date.now().toString().slice(-4)}`,
      nama: formData.nama.trim(),
      tipeAnggota: (formData.tipeAnggota || 'SISWA') as any,
      kelasAtauJabatan: formData.kelasAtauJabatan || '-',
      nomorIdentitas: formData.nomorIdentitas || '',
      jenisKelamin: formData.jenisKelamin || 'L',
      tanggalBergabung: formData.tanggalBergabung || new Date().toISOString().split('T')[0],
      tanggalTerdaftar: formData.tanggalBergabung || new Date().toISOString().split('T')[0],
      status: formData.status || 'aktif',
      telepon: formData.telepon || '',
      keterangan: formData.keterangan || ''
    });

    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (member: LibraryMemberItem) => {
    setActiveMember(member);
    setFormData({
      ...member,
      tipeAnggota: getMemberTypeUpper(member)
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Member
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !formData.nama?.trim()) return;

    updateLibraryMember(activeMember.id, {
      ...formData,
      nama: formData.nama.trim(),
      tanggalBergabung: formData.tanggalBergabung || activeMember.tanggalBergabung,
      tanggalTerdaftar: formData.tanggalBergabung || activeMember.tanggalTerdaftar
    });

    setIsEditModalOpen(false);
    setActiveMember(null);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (member: LibraryMemberItem) => {
    setActiveMember(member);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Member
  const handleConfirmDelete = () => {
    if (activeMember) {
      deleteLibraryMember(activeMember.id);
      setIsDeleteModalOpen(false);
      setActiveMember(null);
    }
  };

  // Save Stats Modal
  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    updateLibraryMemberStats(statsForm);
    setIsStatsModalOpen(false);
  };

  // Bulk Selection Handlers
  const handleToggleSelectAllMembers = () => {
    if (selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map(m => m.id));
    }
  };

  const handleToggleSelectMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDeleteMembers = () => {
    if (selectedMemberIds.length > 0) {
      deleteMultipleLibraryMembers(selectedMemberIds);
      setSelectedMemberIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Download Native Microsoft Excel (.xlsx) Template with Columns & Guide
  const handleDownloadExcelTemplate = () => {
    downloadMemberExcelTemplate();
  };

  // Export Current Library Members to Native Excel (.xlsx)
  const handleExportExcel = () => {
    exportMembersToExcel(filteredMembers);
  };

  // Download CSV Template
  const handleDownloadTemplateCsv = () => {
    const csvContent = 
`Nomor Anggota,Nama Lengkap,Kategori (GURU/STAFF/SISWA),Kelas / Jabatan,NIP / NISN,Jenis Kelamin (L/P),Tanggal Terdaftar,Nomor Telepon,Keterangan\r
ANG-G-001,Dra. Hj. Siti Rahmawati M.Pd,GURU,Guru Bahasa Indonesia,19750512 200003 2 001,P,2026-01-10,081234567890,Anggota Aktif Pendidik\r
ANG-G-002,Drs. Budi Santoso M.Si,GURU,Guru IPA Terpadu,19780214 200501 1 004,L,2026-01-10,081298765432,Anggota Aktif Pendidik\r
ANG-ST-001,Ahmad Fauzi S.Kom,STAFF,Pengelola IT & Tata Usaha,19890918 201402 1 002,L,2026-01-15,085712345678,Anggota Staf TU\r
ANG-ST-002,Dewi Sartika S.AP,STAFF,Administrasi Kepegawaian,19920325 201601 2 003,P,2026-01-15,085698765432,Anggota Staf TU\r
ANG-SW-001,Muhammad Rizky Pratama,SISWA,Kelas VII-A,0087654321,L,2026-07-20,081311223344,Anggota Siswa\r
ANG-SW-002,Aisyah Nur Salsabila,SISWA,Kelas VII-B,0087654322,P,2026-07-20,081322334455,Anggota Siswa\r
ANG-SW-003,Farhan Maulana,SISWA,Kelas VIII-C,0076543210,L,2026-07-20,081333445566,Anggota Siswa`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Daftar_Anggota_Perpustakaan_Excel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Excel (.xlsx, .xls, .csv) File Upload & Auto-Parsing
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      setExcelFileName(file.name);
      setImportStatusMsg(`Membaca dan memetakan kolom dari ${file.name}...`);

      const parsed = await parseMemberExcelFile(file, libraryMembers.length);
      if (parsed.length > 0) {
        setParsedExcelMembers(parsed);
        setImportStatusMsg(`Berhasil membaca ${parsed.length} anggota perpustakaan dari "${file.name}". Periksa pratinjau di bawah dan klik "Simpan & Masukkan ke Anggota".`);
      } else {
        setParsedExcelMembers([]);
        setImportStatusMsg('Tidak ada baris data anggota yang valid pada berkas Excel.');
      }
    } catch (err) {
      console.error('Error parsing member excel:', err);
      setImportStatusMsg('Gagal membaca berkas Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  // Commit Parsed Excel Members
  const handleCommitParsedExcelMembers = () => {
    if (parsedExcelMembers.length === 0) return;
    importLibraryMembers(parsedExcelMembers);
    setImportStatusMsg(`Sukses mengimpor ${parsedExcelMembers.length} anggota perpustakaan baru!`);
    setTimeout(() => {
      setIsImportModalOpen(false);
      setParsedExcelMembers([]);
      setExcelFileName('');
      setImportStatusMsg(null);
    }, 1000);
  };

  // Load Sample Member Data
  const handleLoadSampleCsv = () => {
    const sampleData = 
`Nomor Anggota,Nama Lengkap,Kategori (GURU/STAFF/SISWA),Kelas / Jabatan,NIP / NISN,Jenis Kelamin (L/P),Tanggal Terdaftar,Nomor Telepon,Keterangan
ANG-G-001,Dra. Hj. Siti Rahmawati M.Pd,GURU,Guru Bahasa Indonesia,19750512 200003 2 001,P,2026-01-10,081234567890,Anggota Aktif Pendidik
ANG-G-002,Drs. Budi Santoso M.Si,GURU,Guru IPA Terpadu,19780214 200501 1 004,L,2026-01-10,081298765432,Anggota Aktif Pendidik
ANG-ST-001,Ahmad Fauzi S.Kom,STAFF,Pengelola IT & Tata Usaha,19890918 201402 1 002,L,2026-01-15,085712345678,Anggota Staf TU
ANG-ST-002,Dewi Sartika S.AP,STAFF,Administrasi Kepegawaian,19920325 201601 2 003,P,2026-01-15,085698765432,Anggota Staf TU
ANG-SW-001,Muhammad Rizky Pratama,SISWA,Kelas VII-A,0087654321,L,2026-07-20,081311223344,Anggota Siswa
ANG-SW-002,Aisyah Nur Salsabila,SISWA,Kelas VII-B,0087654322,P,2026-07-20,081322334455,Anggota Siswa
ANG-SW-003,Farhan Maulana,SISWA,Kelas VIII-C,0076543210,L,2026-07-20,081333445566,Anggota Siswa`;
    setImportRawText(sampleData);
    setImportStatusMsg('Contoh data anggota berhasil dimuat. Siap dipratinjau & diimpor!');
  };

  // Parse CSV Line Helper
  const parseCsvLine = (textLine: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    const delimiter = textLine.includes('\t') ? '\t' : (textLine.includes(';') ? ';' : ',');

    for (let i = 0; i < textLine.length; i++) {
      const c = textLine[i];
      if (c === '"') {
        if (inQuotes && textLine[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (!importRawText.trim()) {
      setImportStatusMsg('Silakan tempel teks CSV atau unggah file terlebih dahulu.');
      return;
    }

    const lines = importRawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setImportStatusMsg('Data kosong.');
      return;
    }

    // Check if first line is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('nomor') || firstLineLower.includes('nama') || firstLineLower.includes('anggota');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsedMembers: Omit<LibraryMemberItem, 'id'>[] = [];

    dataLines.forEach((line, idx) => {
      const cols = parseCsvLine(line);
      if (cols.length >= 2 && cols[1]) {
        const noAnggota = cols[0] || `ANG-${Date.now().toString().slice(-4)}-${idx + 1}`;
        const nama = cols[1];
        const rawType = (cols[2] || 'SISWA').toUpperCase();
        const tipeAnggota: 'GURU' | 'STAFF' | 'SISWA' = 
          rawType.includes('GURU') ? 'GURU' :
          rawType.includes('STAF') ? 'STAFF' : 'SISWA';
        const kelasAtauJabatan = cols[3] || (tipeAnggota === 'SISWA' ? 'Kelas VII' : tipeAnggota === 'GURU' ? 'Guru' : 'Staf TU');
        const nomorIdentitas = cols[4] || '';
        const rawJk = (cols[5] || 'L').toUpperCase();
        const jenisKelamin: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';
        const tanggalBergabung = cols[6] || new Date().toISOString().split('T')[0];
        const telepon = cols[7] || '';
        const keterangan = cols[8] || 'Diimpor dari templat otomatis';

        parsedMembers.push({
          nomorAnggota: noAnggota,
          nama,
          tipeAnggota,
          kelasAtauJabatan,
          nomorIdentitas,
          jenisKelamin,
          tanggalBergabung,
          tanggalTerdaftar: tanggalBergabung,
          status: 'aktif',
          telepon,
          keterangan
        });
      }
    });

    if (parsedMembers.length === 0) {
      setImportStatusMsg('Tidak ada baris data valid yang dapat dibaca. Pastikan format kolom sesuai templat.');
      return;
    }

    importLibraryMembers(parsedMembers);
    setImportStatusMsg(`Sukses mengimpor ${parsedMembers.length} anggota perpustakaan baru!`);
    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportRawText('');
      setImportStatusMsg(null);
    }, 1200);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportRawText(content);
        setImportStatusMsg(`File "${file.name}" berhasil dibaca.`);
      }
    };
    reader.readAsText(file);
  };

  const rawKepsekNama = schoolConfig.kepalaSekolah?.nama || '';
  const isDummyKepsek = !rawKepsekNama || /rahmat(\s*hidayat)?/i.test(rawKepsekNama);
  const kepalaSekolahName = isDummyKepsek ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsekNama);

  const pengelolaPerpus = schoolConfig.operatorProfiles?.PERPUS;
  const rawPengelolaNama = pengelolaPerpus?.nama || '';
  const isDummyPengelola = !rawPengelolaNama || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawPengelolaNama) || /rahmat/i.test(rawPengelolaNama);
  const pengelolaName = isDummyPengelola ? 'Pengelola Perpustakaan' : formatOfficialNameWithDegree(rawPengelolaNama);

  // Fungsi Unduh Dokumen HTML Mandiri Standar Dinas Pendidikan
  const handleDownloadMemberReportHtml = () => {
    const isF4 = printPaperSize === 'F4';
    const paperSizeCss = isF4 ? '215mm 330mm' : '210mm 297mm';
    const paperWidth = isF4 ? '215mm' : '210mm';
    const paperMinHeight = isF4 ? '330mm' : '297mm';

    const membersHtmlRows = libraryMembers.map((m, idx) => {
      const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik (Guru)' : m.tipeAnggota === 'STAFF' ? 'Tenaga Kependidikan' : 'Peserta Didik (Siswa)';
      const statusBadge = (m.status || 'aktif').toLowerCase() === 'aktif' ? 'Aktif' : (m.status || '').toLowerCase() === 'tamat' ? 'Tamat / Alumni' : 'Nonaktif';
      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8pt; text-align: center;">${m.nomorAnggota || '-'}</td>
          <td style="font-weight: 600;">${m.nama}</td>
          <td>${typeLabel}</td>
          <td>${m.kelasAtauJabatan || '-'}</td>
          <td style="text-align: center; font-weight: bold;">${m.jenisKelamin || 'L'}</td>
          <td style="font-family: monospace; font-size: 8pt;">${m.nomorIdentitas || '-'}</td>
          <td style="text-align: center;">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Rekapitulasi Anggota Perpustakaan - ${schoolConfig.namaSekolah}</title>
  <style>
    @page {
      size: ${paperSizeCss};
      margin-top: 1.5cm;
      margin-bottom: 1.5cm;
      margin-left: 2.0cm;
      margin-right: 1.5cm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      line-height: 1.25;
      color: #000;
      background: #f1f5f9;
    }
    .page-container {
      width: ${paperWidth};
      min-height: ${paperMinHeight};
      margin: 20px auto;
      padding: 1.5cm 1.5cm 1.5cm 2.0cm;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    .kop-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    .kop-teks {
      text-align: center;
      vertical-align: middle;
      padding: 0 10px;
    }
    .kop-1 { font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.15; }
    .kop-2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; }
    .kop-3 { font-size: 14pt; font-weight: 800; text-transform: uppercase; margin: 2px 0; }
    .kop-alamat { font-size: 8.5pt; font-style: italic; font-family: Arial, sans-serif; }
    .kop-garis {
      border-top: 2.5px solid #000;
      border-bottom: 0.75px solid #000;
      height: 4px;
      margin: 5px 0 12px 0;
    }
    .doc-title {
      text-align: center;
      margin-bottom: 14px;
    }
    .doc-title h2 {
      font-size: 12.5pt;
      font-weight: 800;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0;
    }
    .doc-title .nomor {
      font-size: 10pt;
      font-family: Arial, sans-serif;
      font-weight: 600;
      margin-top: 3px;
    }
    .table-rekap, .table-full {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9.5pt;
    }
    .table-full { font-size: 8.5pt; }
    .table-rekap th, .table-rekap td, .table-full th, .table-full td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .table-full td { padding: 3px 5px; }
    .table-rekap thead th, .table-full thead th {
      background: #f1f5f9;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
    }
    .table-rekap tbody tr, .table-full tbody tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .signatures-wrap {
      width: 100%;
      margin-top: 20px;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .signatures-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 10px;
    }
    .sign-space { height: 75px; }
    .sign-name {
      font-weight: bold;
      text-decoration: underline;
      font-size: 11pt;
    }
    .sign-nip {
      font-size: 9.5pt;
      font-family: Arial, sans-serif;
      margin-top: 2px;
    }
    .toolbar-screen {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: sans-serif;
      z-index: 999;
    }
    .btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      border: none;
      cursor: pointer;
    }
    .btn-blue { background: #2563eb; color: #fff; }
    @media print {
      body { background: #fff !important; }
      .no-print { display: none !important; }
      .page-container {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar-screen no-print">
    <div>
      <strong>Laporan Resmi Anggota Perpustakaan</strong> · Format: ${isF4 ? 'Kertas F4 (Folio 215×330mm)' : 'Kertas A4 (210×297mm)'}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-blue" onclick="window.print()">Cetak / Simpan PDF</button>
    </div>
  </div>

  <div class="page-container">
    <table class="kop-table">
      <tr>
        <td class="kop-teks">
          <div class="kop-1">${schoolConfig.pemerintahDaerah || 'PEMERINTAH KABUPATEN BATANG HARI'}</div>
          <div class="kop-2">${schoolConfig.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</div>
          <div class="kop-3">${schoolConfig.namaSekolah || 'SMP NEGERI SATU ATAP TELUK'}</div>
          <div class="kop-alamat">${schoolConfig.alamat || 'Jalan Teluk RT. 15'}, ${schoolConfig.desaKecamatan || ''} ${schoolConfig.kabupatenKota || 'Batang Hari'}</div>
        </td>
      </tr>
    </table>
    <div class="kop-garis"></div>

    <div class="doc-title">
      <h2>LAPORAN REKAPITULASI JUMLAH & DATA ANGGOTA PERPUSTAKAAN SEKOLAH</h2>
      <div class="nomor">Nomor: ${printNomorDokumen}</div>
      <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">Tahun Ajaran ${new Date().getFullYear()} / ${new Date().getFullYear() + 1}</div>
    </div>

    <!-- Bagian Atas: Total Keseluruhan Anggota Pendidik, Kependidikan, dan Siswa -->
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 6px; text-transform: uppercase;">
      I. REKAPITULASI MATRIKS PEMUSTAKA PERPUSTAKAAN
    </div>
    <table class="table-rekap">
      <thead>
        <tr>
          <th style="width: 35px;">No</th>
          <th>Klasifikasi Pemustaka</th>
          <th style="width: 110px;">Laki-laki (L)</th>
          <th style="width: 110px;">Perempuan (P)</th>
          <th style="width: 120px;">Jumlah Anggota</th>
          <th style="width: 90px;">Rasio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; font-weight: bold;">1</td>
          <td style="font-weight: 600;">Pendidik (Guru Sekolah)</td>
          <td style="text-align: center;">${guruLakiCount} orang</td>
          <td style="text-align: center;">${guruPerempuanCount} orang</td>
          <td style="text-align: center; font-weight: bold;">${totalGuru} orang</td>
          <td style="text-align: center;">${grandTotal > 0 ? ((totalGuru / grandTotal) * 100).toFixed(1) : '0'}%</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">2</td>
          <td style="font-weight: 600;">Tenaga Kependidikan (Staff / TU)</td>
          <td style="text-align: center;">${staffLakiCount} orang</td>
          <td style="text-align: center;">${staffPerempuanCount} orang</td>
          <td style="text-align: center; font-weight: bold;">${totalStaff} orang</td>
          <td style="text-align: center;">${grandTotal > 0 ? ((totalStaff / grandTotal) * 100).toFixed(1) : '0'}%</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">3</td>
          <td style="font-weight: 600;">Peserta Didik (Siswa / Siswi)</td>
          <td style="text-align: center;">${siswaLakiCount} orang</td>
          <td style="text-align: center;">${siswaPerempuanCount} orang</td>
          <td style="text-align: center; font-weight: bold;">${totalSiswa} orang</td>
          <td style="text-align: center;">${grandTotal > 0 ? ((totalSiswa / grandTotal) * 100).toFixed(1) : '0'}%</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding-right: 12px; text-transform: uppercase;">Total Keseluruhan Pemustaka Terdaftar:</td>
          <td style="text-align: center; font-size: 11pt; color: #1e3a8a;">${grandTotal} Orang</td>
          <td style="text-align: center;">100%</td>
        </tr>
      </tfoot>
    </table>

    ${printContentMode === 'full' ? `
    <!-- Bagian Bawah: Data Keseluruhan Anggota Perpustakaan -->
    <div style="font-weight: bold; font-size: 10.5pt; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase;">
      II. DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN SEKOLAH (${libraryMembers.length} PEMUSTAKA)
    </div>
    <table class="table-full">
      <thead>
        <tr>
          <th style="width: 28px;">No</th>
          <th style="width: 75px;">No. Anggota</th>
          <th>Nama Lengkap Pemustaka</th>
          <th style="width: 120px;">Kategori</th>
          <th style="width: 100px;">Kelas / Jabatan</th>
          <th style="width: 35px;">L/P</th>
          <th style="width: 105px;">Nomor Identitas</th>
          <th style="width: 65px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${membersHtmlRows}
      </tbody>
    </table>
    ` : ''}

    <p style="text-align: justify; font-size: 9.5pt; margin: 10px 0;">
      Demikian laporan rekapitulasi data keanggotaan perpustakaan ini disusun dan diverifikasi dengan sebenar-benarnya sebagai dokumen administrasi perpustakaan sekolah yang sah dan akuntabel.
    </p>

    <!-- Lembar Pengesahan Resmi -->
    <div class="signatures-wrap">
      <table class="signatures-table">
        <tr>
          <td>
            <div>Mengetahui / Mengesahkan,</div>
            <div style="font-weight: bold; margin-top: 2px;">Kepala Satuan Pendidikan</div>
            <div class="sign-space"></div>
            <div class="sign-name">${kepalaSekolahName}</div>
            <div class="sign-nip">NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}</div>
          </td>
          <td>
            <div>${printManualDate}</div>
            <div style="font-weight: bold; margin-top: 2px;">Pengelola Perpustakaan</div>
            <div class="sign-space"></div>
            <div class="sign-name">${pengelolaName}</div>
            <div class="sign-nip">NIPPK. ${pengelolaPerpus?.nip || '19970530 202521 1 019'}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Rekap_Anggota_Perpustakaan_${printPaperSize}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Users className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>Pendataan Pemustaka & Anggota Perpustakaan</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Jumlah Anggota Perpustakaan Sekolah
            </h2>
            <p className="text-blue-100/80 text-sm max-w-2xl">
              Rekapitulasi dan direktori keanggotaan pemustaka yang terbagi atas kategori 
              <strong> Guru (Pendidik)</strong>, <strong>Staff (Tenaga Kependidikan)</strong>, dan <strong>Siswa (Peserta Didik)</strong>. 
              Dilengkapi pembaruan data, templet impor otomatis, revisi edit/hapus, serta cetak kartu anggota resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Templat & Impor Otomatis Anggota Sesuai Permintaan */}
            <button
              onClick={() => {
                setParsedExcelMembers([]);
                setExcelFileName('');
                setImportRawText('');
                setImportStatusMsg(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Unduh templat Excel (.xlsx) dan impor data anggota perpustakaan secara otomatis"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>Templat & Impor Excel</span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Ekspor seluruh daftar anggota aktif ke berkas Microsoft Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                setStatsForm({
                  siswaLaki: libraryMemberStats.siswaLaki || 0,
                  siswaPerempuan: libraryMemberStats.siswaPerempuan || 0,
                  guruLaki: libraryMemberStats.guruLaki ?? 10,
                  guruPerempuan: libraryMemberStats.guruPerempuan ?? 14,
                  guruPendidik: libraryMemberStats.guruPendidik || 24,
                  staffLaki: libraryMemberStats.staffLaki ?? 5,
                  staffPerempuan: libraryMemberStats.staffPerempuan ?? 3,
                  staffTendik: libraryMemberStats.staffTendik || 8,
                  lastUpdated: new Date().toISOString().split('T')[0]
                });
                setIsStatsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Perbarui Rekap Jumlah</span>
            </button>

            <button
              onClick={() => handleOpenAdd('SISWA')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Anggota</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap Anggota</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS 4 KATEGORI: TOTAL, GURU, STAFF, SISWA (LENGKAP RINCIAN GENDER L/P & STATUS TAMAT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ANGGOTA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Seluruh Anggota
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {grandTotal.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Pemustaka aktif terdaftar sekolah</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Diperbarui: {libraryMemberStats.lastUpdated || '-'}</span>
            <span className="font-semibold text-blue-700">{libraryMembers.length} di direktori</span>
          </div>
        </div>

        {/* ANGGOTA GURU (PENDIDIK) DENGAN RINCIAN GENDER L & P */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm space-y-3 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Guru (Pendidik)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-950 tracking-tight">
              {totalGuru}
              <span className="text-xs font-semibold text-emerald-700 ml-1">orang</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-2">
              <span>L: <strong>{guruLakiCount}</strong></span>
              <span>•</span>
              <span>P: <strong>{guruPerempuanCount}</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Direktori terdaftar:</span>
            <span className="font-bold text-emerald-700">{registeredGuruCount} guru</span>
          </div>
        </div>

        {/* ANGGOTA STAFF (TENAGA KEPENDIDIKAN) DENGAN RINCIAN GENDER L & P */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm space-y-3 hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Staff (Tendik / TU)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-amber-950 tracking-tight">
              {totalStaff}
              <span className="text-xs font-semibold text-amber-700 ml-1">orang</span>
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-2">
              <span>L: <strong>{staffLakiCount}</strong></span>
              <span>•</span>
              <span>P: <strong>{staffPerempuanCount}</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Direktori terdaftar:</span>
            <span className="font-bold text-amber-800">{registeredStaffCount} staf</span>
          </div>
        </div>

        {/* ANGGOTA SISWA (PESERTA DIDIK) DENGAN RINCIAN L, P & STATUS TAMAT */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-3 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Siswa (Peserta Didik)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-950 tracking-tight">
              {totalSiswa}
              <span className="text-xs font-semibold text-indigo-700 ml-1">siswa</span>
            </div>
            <div className="text-xs text-indigo-700 mt-1 flex items-center gap-2">
              <span>L: <strong>{siswaLakiCount}</strong></span>
              <span>•</span>
              <span>P: <strong>{siswaPerempuanCount}</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-indigo-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Alumni / Tamat:</span>
            <span className="font-bold text-purple-700">{registeredTamatCount} tamat</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & DIRECTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({libraryMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('GURU')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'GURU'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Guru ({registeredGuruCount})
              </button>
              <button
                onClick={() => setActiveTab('STAFF')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'STAFF'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff ({registeredStaffCount})
              </button>
              <button
                onClick={() => setActiveTab('SISWA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'SISWA'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siswa ({registeredSiswaCount})
              </button>
            </div>

            {/* Status Filter Tabs (Semua, Aktif, Tamat / Alumni, Nonaktif) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setStatusFilter('aktif')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === 'aktif'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif
              </button>
              <button
                onClick={() => setStatusFilter('tamat')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === 'tamat'
                    ? 'bg-purple-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Siswa yang sudah tamat belajar / lulus sekolah"
              >
                🎓 Tamat / Alumni ({registeredTamatCount})
              </button>
              <button
                onClick={() => setStatusFilter('nonaktif')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === 'nonaktif'
                    ? 'bg-slate-700 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nonaktif
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, nomor anggota, NIP, NISN, atau status tamat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* BULK ACTION BAR (HAPUS PILIHAN) */}
        {selectedMemberIds.length > 0 && (
          <div className="mb-3 p-3 sm:px-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                {selectedMemberIds.length}
              </span>
              <span className="text-xs font-bold text-rose-900">
                anggota perpustakaan dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMemberIds([])}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
              >
                Batal Pilihan
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Pilihan ({selectedMemberIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Directory Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-semibold text-xs">Belum ada anggota terdaftar untuk filter ini</div>
              <p className="text-[11px] text-slate-400">
                Klik tombol "Daftar Anggota" di atas untuk menambahkan anggota baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-9 text-center">
                      <input
                        type="checkbox"
                        checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                        onChange={handleToggleSelectAllMembers}
                        title="Pilih semua anggota yang tampil"
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">No</th>
                    <th className="py-3 px-3">No. Anggota</th>
                    <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Kelas / Jabatan</th>
                    <th className="py-3 px-3">Nomor Identitas (NIP/NISN)</th>
                    <th className="py-3 px-3 text-center">L/P</th>
                    <th className="py-3 px-3">Tgl Terdaftar</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m, idx) => {
                    const typeUpper = getMemberTypeUpper(m);
                    const formattedName = typeUpper === 'GURU' ? formatOfficialNameWithDegree(m.nama) : m.nama;
                    return (
                      <tr key={m.id} className={`hover:bg-slate-50/80 transition ${selectedMemberIds.includes(m.id) ? 'bg-indigo-50/40' : ''}`}>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(m.id)}
                            onChange={() => handleToggleSelectMember(m.id)}
                            title={`Pilih ${m.nama}`}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-900 text-[11px]">
                          {m.nomorAnggota}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {formattedName}
                          </span>
                          {m.keterangan && (
                            <span className="text-[10px] text-slate-400 block">{m.keterangan}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            typeUpper === 'GURU' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : typeUpper === 'STAFF'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {typeUpper === 'GURU' ? 'Guru' : typeUpper === 'STAFF' ? 'Staff' : 'Siswa'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{m.kelasAtauJabatan}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                          {m.nomorIdentitas || '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">
                          {m.jenisKelamin}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {m.tanggalBergabung || m.tanggalTerdaftar || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            (m.status === 'tamat' || m.status === 'alumni')
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : m.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {(m.status === 'tamat' || m.status === 'alumni') ? '🎓 Tamat / Alumni' : m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setActiveCardMember(m);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Lihat Kartu Anggota"
                            >
                              <IdCard className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit anggota"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(m)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: PERBARUI MASTER JUMLAH ANGGOTA (REKAP AGREGAT) */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">Perbarui Jumlah Anggota Sekolah</h3>
              </div>
              <button 
                onClick={() => setIsStatsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStats} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Sesuaikan angka agregat total anggota perpustakaan sekolah sesuai data Dapodik / buku induk terkini:
              </p>

              <div className="space-y-3">
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-700" />
                    <span>Anggota Siswa (Peserta Didik)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Siswa Laki-laki</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.siswaLaki}
                        onChange={e => setStatsForm({ ...statsForm, siswaLaki: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Siswa Perempuan</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.siswaPerempuan}
                        onChange={e => setStatsForm({ ...statsForm, siswaPerempuan: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-indigo-800 font-semibold pt-1">
                    Total Siswa: {(statsForm.siswaLaki || 0) + (statsForm.siswaPerempuan || 0)} orang
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span>Anggota Guru (Pendidik)</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800">
                      Total: {(statsForm.guruLaki || 0) + (statsForm.guruPerempuan || 0)} orang
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Guru Laki-laki</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.guruLaki ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setStatsForm(prev => ({
                            ...prev,
                            guruLaki: val,
                            guruPendidik: val + (prev.guruPerempuan || 0)
                          }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Guru Perempuan</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.guruPerempuan ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setStatsForm(prev => ({
                            ...prev,
                            guruPerempuan: val,
                            guruPendidik: (prev.guruLaki || 0) + val
                          }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 space-y-2">
                  <div className="font-bold text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-700" />
                      <span>Anggota Staff (Tendik / TU)</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800">
                      Total: {(statsForm.staffLaki || 0) + (statsForm.staffPerempuan || 0)} orang
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Staff Laki-laki</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.staffLaki ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setStatsForm(prev => ({
                            ...prev,
                            staffLaki: val,
                            staffTendik: val + (prev.staffPerempuan || 0)
                          }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Staff Perempuan</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={statsForm.staffPerempuan ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setStatsForm(prev => ({
                            ...prev,
                            staffPerempuan: val,
                            staffTendik: (prev.staffLaki || 0) + val
                          }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStatsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DAFTARKAN ANGGOTA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">Registrasi Anggota Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Anggota *</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorAnggota || ''}
                    onChange={e => setFormData({ ...formData, nomorAnggota: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Pemustaka *</label>
                  <select
                    value={formData.tipeAnggota || 'SISWA'}
                    onChange={e => setFormData({ ...formData, tipeAnggota: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="SISWA">Siswa (Peserta Didik)</option>
                    <option value="GURU">Guru (Pendidik)</option>
                    <option value="STAFF">Staff (Tenaga Kependidikan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.nama || ''}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                  placeholder="Contoh: Dra. Hj. Nurjanah, M.Pd. / Muhammad Arya"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas / Jabatan</label>
                  <input
                    type="text"
                    value={formData.kelasAtauJabatan || ''}
                    onChange={e => setFormData({ ...formData, kelasAtauJabatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Contoh: Kelas VII-A / Guru Bhs. Indonesia"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP / NUPTK / NISN</label>
                  <input
                    type="text"
                    value={formData.nomorIdentitas || ''}
                    onChange={e => setFormData({ ...formData, nomorIdentitas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="Nomor identitas kedinasan / kesiswaan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={formData.status || 'aktif'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tamat">Tamat / Lulus (Alumni)</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formData.tanggalBergabung || ''}
                    onChange={e => setFormData({ ...formData, tanggalBergabung: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan || ''}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Minat baca, duta literasi, dll..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT ANGGOTA (LENGKAPI EDIT SESUAI PERMINTAAN USER) */}
      {isEditModalOpen && activeMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-base">Revisi & Edit Anggota</h3>
                  <span className="text-xs text-blue-200 font-mono">{activeMember.nomorAnggota}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Anggota *</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorAnggota || ''}
                    onChange={e => setFormData({ ...formData, nomorAnggota: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Pemustaka *</label>
                  <select
                    value={formData.tipeAnggota || 'SISWA'}
                    onChange={e => setFormData({ ...formData, tipeAnggota: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="SISWA">Siswa (Peserta Didik)</option>
                    <option value="GURU">Guru (Pendidik)</option>
                    <option value="STAFF">Staff (Tenaga Kependidikan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.nama || ''}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas / Jabatan</label>
                  <input
                    type="text"
                    value={formData.kelasAtauJabatan || ''}
                    onChange={e => setFormData({ ...formData, kelasAtauJabatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP / NUPTK / NISN</label>
                  <input
                    type="text"
                    value={formData.nomorIdentitas || ''}
                    onChange={e => setFormData({ ...formData, nomorIdentitas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={formData.status || 'aktif'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tamat">Tamat / Lulus (Alumni Siswa)</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan || ''}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HAPUS ANGGOTA (LENGKAPI HAPUS SESUAI PERMINTAAN USER) */}
      {isDeleteModalOpen && activeMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Hapus Data Anggota Ini?</h3>
              <p className="text-xs text-slate-500">
                Data anggota berikut akan dihapus dari daftar keanggotaan perpustakaan:
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="font-mono text-blue-900 font-bold">{activeMember.nomorAnggota}</div>
              <div className="font-semibold text-slate-800">{activeMember.nama}</div>
              <div className="text-slate-500">{activeMember.kelasAtauJabatan} ({activeMember.tipeAnggota})</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition"
              >
                Ya, Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: KARTU ANGGOTA PREVIEW & PRINT */}
      {activeCardMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm">Kartu Anggota Perpustakaan</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button 
                  onClick={() => setActiveCardMember(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Card Design */}
            <div className="p-6 bg-slate-100 flex items-center justify-center">
              <div className="w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-white/20 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none pr-4 pb-2">
                  <Users className="w-32 h-32" />
                </div>

                {/* Card Header */}
                <div className="border-b border-white/20 pb-2.5 mb-3">
                  <div className="text-[10px] tracking-wider text-blue-200 font-semibold uppercase">
                    KARTU ANGGOTA PERPUSTAKAAN
                  </div>
                  <div className="font-bold text-xs text-white truncate">
                    {schoolConfig.namaSekolah || 'SMP NEGERI SATU ATAP TELUK'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-white/10 rounded-xl border border-white/20 flex flex-col items-center justify-center text-slate-300">
                    <Users className="w-8 h-8 opacity-60" />
                    <span className="text-[9px] mt-1 text-blue-200 font-semibold uppercase">
                      {activeCardMember.tipeAnggota}
                    </span>
                  </div>

                  <div className="space-y-1 flex-1 text-xs">
                    <div className="font-mono text-[11px] text-amber-300 font-bold">
                      {activeCardMember.nomorAnggota}
                    </div>
                    <div className="font-bold text-white text-sm leading-tight">
                      {activeCardMember.nama}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {activeCardMember.kelasAtauJabatan}
                    </div>
                    {activeCardMember.nomorIdentitas && (
                      <div className="text-[10px] font-mono text-slate-400">
                        ID: {activeCardMember.nomorIdentitas}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-2.5 border-t border-white/20 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Berlaku Selama Menjadi Warga Sekolah</span>
                  <span className="font-mono text-emerald-300 font-semibold uppercase">STATUS: AKTIF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CETAK REKAPITULASI RESMI ANGGOTA PERPUSTAKAAN (STANDAR DINAS PENDIDIKAN - F4 / A4) */}
      {isPrintModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrintModalOpen(false);
          }}
        >
          {/* Dynamic Print Style for F4 vs A4 */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: ${printPaperSize === 'F4' ? '215mm 330mm' : '210mm 297mm'} !important;
                  margin-top: 1.5cm !important;
                  margin-bottom: 1.5cm !important;
                  margin-left: 2.0cm !important;
                  margin-right: 1.5cm !important;
                }
                body {
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                .no-print {
                  display: none !important;
                }
                .printable-member-document {
                  width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                }
                .avoid-break {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                table tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `
          }} />

          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-hidden flex flex-col animate-scaleIn relative">
            {/* Modal Controls Top Bar (No-Print) */}
            <div className="shrink-0 p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">Cetak Dokumen Resmi Rekapitulasi Anggota Perpustakaan</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Format Naskah Dinas Satuan Pendidikan</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Pemilih Ukuran Kertas F4 / A4 */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('F4')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                      printPaperSize === 'F4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Kertas Folio F4 (215mm × 330mm)"
                  >
                    Kertas F4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('A4')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                      printPaperSize === 'A4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Kertas Standar A4 (210mm × 297mm)"
                  >
                    Kertas A4
                  </button>
                </div>

                {/* 2. Pilihan Mode Tampilan Cetak (Lengkap vs Ringkasan Saja) */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPrintContentMode('full')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition flex items-center gap-1 ${
                      printContentMode === 'full' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Bagian atas matriks total pemustaka + bagian bawah tabel keseluruhan anggota"
                  >
                    <span>Lengkap (+ Data Keseluruhan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintContentMode('summary')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition flex items-center gap-1 ${
                      printContentMode === 'summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Hanya ringkasan matriks pemustaka 1 halaman"
                  >
                    <span>Ringkasan Saja</span>
                  </button>
                </div>

                {/* 3. Tombol Edit Tanggal Pengesahan Manual */}
                <button
                  type="button"
                  onClick={() => {
                    setTempPrintDate(printManualDate);
                    setIsEditPrintDateOpen(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Sesuaikan tempat dan tanggal tanda tangan pengesahan"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Edit Tanggal</span>
                </button>

                {/* 4. Tombol Unduh File HTML Mandiri */}
                <button
                  type="button"
                  onClick={handleDownloadMemberReportHtml}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  title="Unduh dokumen lengkap sebagai file .html mandiri"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh HTML</span>
                </button>

                {/* 5. Tombol Cetak / PDF */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  title="Buka dialog cetak browser atau simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Tutup pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Edit Tanggal Bar (Jika Aktif) */}
            {isEditPrintDateOpen && (
              <div className="shrink-0 p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 no-print">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                  <span className="text-xs font-bold text-amber-900 shrink-0">Tempat & Tanggal Pengesahan:</span>
                  <input
                    type="text"
                    value={tempPrintDate}
                    onChange={(e) => setTempPrintDate(e.target.value)}
                    placeholder="Contoh: Batang Hari, 30 September 2026"
                    className="flex-1 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintManualDate(tempPrintDate.trim() || `${schoolConfig.kabupatenKota || 'Batang Hari'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
                      setIsEditPrintDateOpen(false);
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                  >
                    Simpan Tanggal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditPrintDateOpen(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Quick Edit Nomor Surat Bar (Jika Aktif) */}
            {isEditNomorDokumenOpen && (
              <div className="shrink-0 p-3 bg-blue-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2 no-print">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                  <span className="text-xs font-bold text-blue-900 shrink-0">Nomor Dokumen / Surat:</span>
                  <input
                    type="text"
                    value={tempPrintNomor}
                    onChange={(e) => setTempPrintNomor(e.target.value)}
                    placeholder="Contoh: 421.2/028/REKAP-ANGGOTA/2026"
                    className="flex-1 px-3 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintNomorDokumen(tempPrintNomor.trim() || `421.2/028/REKAP-ANGGOTA/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`);
                      setIsEditNomorDokumenOpen(false);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                  >
                    Simpan Nomor
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditNomorDokumenOpen(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Printable Document Container (Mendukung F4 215mm & A4 210mm) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center print:bg-white print:p-0 print:overflow-visible">
              <div 
                className="printable-member-document bg-white text-slate-900 shadow-xl print:shadow-none p-8 sm:p-12 transition-all font-serif"
                style={{
                  width: printPaperSize === 'F4' ? '215mm' : '210mm',
                  minHeight: printPaperSize === 'F4' ? '330mm' : '297mm'
                }}
              >
                {/* 1. Kop Surat Resmi dengan Logo Kiri & Kanan */}
                <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-2" />

                {/* 2. Judul Dokumen Resmi & Nomor Dokumen */}
                <div className="text-center my-4 space-y-1">
                  <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                    LAPORAN REKAPITULASI JUMLAH & DATA ANGGOTA PERPUSTAKAAN SEKOLAH
                  </h4>
                  <div className="text-xs font-mono font-semibold text-slate-800 flex items-center justify-center gap-2">
                    <span>Nomor: {printNomorDokumen}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPrintNomor(printNomorDokumen);
                        setIsEditNomorDokumenOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[10px] underline no-print cursor-pointer"
                      title="Edit nomor dokumen"
                    >
                      (Ubah)
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 font-sans">
                    Tahun Ajaran {new Date().getFullYear()} / {new Date().getFullYear() + 1}
                  </div>
                </div>

                {/* 3. BAGIAN ATAS: REKAPITULASI MATRIKS PEMUSTAKA SEKOLAH */}
                <div className="mb-6 avoid-break">
                  <div className="font-bold font-sans text-xs uppercase tracking-wide text-slate-800 mb-2 flex items-center justify-between border-b pb-1">
                    <span>I. REKAPITULASI JUMLAH ANGGOTA PEMUSTAKA SEKOLAH</span>
                    <span className="text-[10px] text-slate-500 font-normal">Klasifikasi Berdasarkan Kategori & Jenis Kelamin</span>
                  </div>

                  <div className="border border-slate-400 rounded-md overflow-hidden">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                      <thead className="bg-slate-100 font-bold border-b border-slate-400">
                        <tr>
                          <th className="p-2 w-10 text-center border-r border-slate-300">No</th>
                          <th className="p-2 border-r border-slate-300">Klasifikasi Pemustaka</th>
                          <th className="p-2 w-28 text-center border-r border-slate-300">Laki-laki (L)</th>
                          <th className="p-2 w-28 text-center border-r border-slate-300">Perempuan (P)</th>
                          <th className="p-2 w-32 text-center border-r border-slate-300">Total Anggota</th>
                          <th className="p-2 w-20 text-center">Rasio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="p-2 text-center border-r border-slate-300 font-semibold">1</td>
                          <td className="p-2 font-semibold border-r border-slate-300">Pendidik (Guru Sekolah)</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{guruLakiCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{guruPerempuanCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-bold text-slate-900">{totalGuru} orang</td>
                          <td className="p-2 text-center font-medium">{grandTotal > 0 ? ((totalGuru / grandTotal) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center border-r border-slate-300 font-semibold">2</td>
                          <td className="p-2 font-semibold border-r border-slate-300">Tenaga Kependidikan (Staff / TU)</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{staffLakiCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{staffPerempuanCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-bold text-slate-900">{totalStaff} orang</td>
                          <td className="p-2 text-center font-medium">{grandTotal > 0 ? ((totalStaff / grandTotal) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center border-r border-slate-300 font-semibold">3</td>
                          <td className="p-2 font-semibold border-r border-slate-300">Peserta Didik (Siswa / Siswi)</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{siswaLakiCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-medium">{siswaPerempuanCount} orang</td>
                          <td className="p-2 text-center border-r border-slate-300 font-bold text-slate-900">{totalSiswa} orang</td>
                          <td className="p-2 text-center font-medium">{grandTotal > 0 ? ((totalSiswa / grandTotal) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
                        <tr>
                          <td colSpan={4} className="p-2 text-right border-r border-slate-300 uppercase tracking-wide">
                            Total Keseluruhan Pemustaka Terdaftar:
                          </td>
                          <td className="p-2 text-center text-blue-900 font-black text-sm border-r border-slate-300">
                            {grandTotal} Orang
                          </td>
                          <td className="p-2 text-center text-blue-900 font-black">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. BAGIAN BAWAH: DATA KESELURUHAN ANGGOTA PERPUSTAKAAN (JIKA MODE LENGKAP DIPILIH) */}
                {printContentMode === 'full' && (
                  <div className="mb-6">
                    <div className="font-bold font-sans text-xs uppercase tracking-wide text-slate-800 mb-2 flex items-center justify-between border-b pb-1">
                      <span>II. DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN SEKOLAH</span>
                      <span className="text-[10px] text-slate-500 font-normal">Total: {libraryMembers.length} Orang Terdaftar</span>
                    </div>

                    <div className="border border-slate-400 rounded-md overflow-hidden">
                      <table className="w-full text-left font-sans text-[11px] leading-tight border-collapse">
                        <thead className="bg-slate-100 font-bold border-b border-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-1.5 w-7 text-center border-r border-slate-300">No</th>
                            <th className="p-1.5 w-20 text-center border-r border-slate-300">No. Anggota</th>
                            <th className="p-1.5 border-r border-slate-300">Nama Pemustaka</th>
                            <th className="p-1.5 w-28 border-r border-slate-300">Kategori</th>
                            <th className="p-1.5 w-24 border-r border-slate-300">Kelas / Jabatan</th>
                            <th className="p-1.5 w-9 text-center border-r border-slate-300">L/P</th>
                            <th className="p-1.5 w-24 border-r border-slate-300">Identitas</th>
                            <th className="p-1.5 w-16 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {libraryMembers.map((m, idx) => {
                            const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tenaga Kependidikan' : 'Peserta Didik';
                            const statusStr = (m.status || 'aktif').toLowerCase();
                            return (
                              <tr key={m.id || idx} className="hover:bg-slate-50 avoid-break">
                                <td className="p-1.5 text-center border-r border-slate-200 font-semibold">{idx + 1}</td>
                                <td className="p-1.5 text-center font-mono text-[9px] border-r border-slate-200">{m.nomorAnggota || '-'}</td>
                                <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">{m.nama}</td>
                                <td className="p-1.5 border-r border-slate-200 text-slate-700">{typeLabel}</td>
                                <td className="p-1.5 border-r border-slate-200 text-slate-600">{m.kelasAtauJabatan || '-'}</td>
                                <td className="p-1.5 text-center font-bold border-r border-slate-200">{m.jenisKelamin || 'L'}</td>
                                <td className="p-1.5 font-mono text-[9.5px] border-r border-slate-200">{m.nomorIdentitas || '-'}</td>
                                <td className="p-1.5 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    statusStr === 'aktif' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                                  }`}>
                                    {statusStr === 'aktif' ? 'Aktif' : statusStr === 'tamat' ? 'Alumni' : 'Nonaktif'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-justify font-serif text-xs leading-relaxed my-4">
                  Demikian laporan rekapitulasi data keanggotaan perpustakaan sekolah ini disusun dan disahkan dengan sebenar-benarnya sebagai wujud tertib administrasi dan keterbukaan layanan pemustaka di lingkungan satuan pendidikan.
                </p>

                {/* 5. LEMBAR TANDA TANGAN PENGESAHAN RESMI (AVOID BREAK) */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center font-sans text-xs avoid-break">
                  {/* Sisi KIRI: Kepala Satuan Pendidikan */}
                  <div className="flex flex-col items-center">
                    <div className="text-slate-600">Mengetahui / Mengesahkan,</div>
                    <div className="font-semibold text-slate-800 mt-0.5">Kepala Satuan Pendidikan</div>
                    
                    {/* Ruang Bersih Tanda Tangan Fisik (Tinggi 75px) */}
                    <div className="h-20 w-full flex items-center justify-center"></div>

                    <div className="font-bold text-slate-900 underline text-xs">
                      {kepalaSekolahName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                      NIP. {schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}
                    </div>
                  </div>

                  {/* Sisi KANAN: Pengelola Perpustakaan */}
                  <div className="flex flex-col items-center">
                    <div className="text-slate-700 font-medium">
                      {printManualDate}
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">Pengelola Perpustakaan</div>

                    {/* Ruang Bersih Tanda Tangan Fisik (Tinggi 75px) */}
                    <div className="h-20 w-full flex items-center justify-center"></div>

                    <div className="font-bold text-slate-900 underline text-xs">
                      {pengelolaName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                      NIPPK. {pengelolaPerpus?.nip || '19970530 202521 1 019'}
                    </div>
                  </div>
                </div>

                {/* Catatan Kaki Kedinasan */}
                <div className="mt-8 pt-3 border-t border-slate-300 text-[9px] text-slate-500 font-sans italic text-center avoid-break">
                  * Dokumen kedinasan resmi diterbitkan oleh Unit Pengelola Perpustakaan {schoolConfig.namaSekolah}.
                </div>

              </div>
            </div>

            {/* Modal Bottom Bar (No-Print) */}
            <div className="shrink-0 p-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-bold">Ukuran Kertas:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-mono font-bold rounded">
                  {printPaperSize === 'F4' ? 'Folio F4 (215×330mm)' : 'A4 (210×297mm)'}
                </span>
                <span className="mx-1 text-slate-400">·</span>
                <span>Mode: <strong>{printContentMode === 'full' ? 'Lengkap (Matriks + Seluruh Anggota)' : 'Ringkasan Matriks Saja'}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMemberReportHtml}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEMPLAT & IMPOR DATA OTOMATIS ANGGOTA PERPUSTAKAAN */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Templat & Impor Data Anggota Perpustakaan Excel</h3>
                  <p className="text-xs text-indigo-200">
                    Mendukung berkas Microsoft Excel (.xlsx, .xls) & CSV untuk Guru, Staff, dan Siswa
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedExcelMembers([]);
                  setExcelFileName('');
                  setImportStatusMsg(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Template Download Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Unduh Templat Format Excel Resmi:</span>
                  </p>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Dilengkapi kolom Excel resmi: Nomor Anggota, Nama Lengkap & Gelar, Kategori (GURU/STAFF/SISWA), Kelas/Unit Kerja, NIP/NISN, Jenis Kelamin (L/P), Telepon, dan Petunjuk.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Templat Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplateCsv}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center bg-slate-50/60 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto mb-2 opacity-90" />
                <p className="font-bold text-slate-800 text-sm">Unggah Berkas Excel Anggota (.xlsx / .xls / .csv)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Kolom otomatis dipetakan ke direktori keanggotaan perpustakaan</p>
                
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-xs text-xs">
                  <Upload className="w-4 h-4" />
                  <span>{isParsingExcel ? 'Membaca Berkas Excel...' : 'Pilih Berkas Excel / CSV'}</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    onChange={handleExcelFileUpload} 
                    className="hidden" 
                  />
                </label>
                {excelFileName && (
                  <p className="text-[11px] text-slate-600 mt-2 font-mono">
                    Berkas aktif: <strong>{excelFileName}</strong>
                  </p>
                )}
              </div>

              {/* Status Message */}
              {importStatusMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold border flex items-center gap-2 ${
                  importStatusMsg.includes('Sukses') || importStatusMsg.includes('Berhasil') 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importStatusMsg}</span>
                </div>
              )}

              {/* Parsed Excel Members Preview */}
              {parsedExcelMembers.length > 0 && (
                <div className="space-y-2 border border-indigo-200 rounded-xl p-3 bg-indigo-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-indigo-700" />
                      Pratinjau Data ({parsedExcelMembers.length} anggota terbaca dari Excel):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Guru: {parsedExcelMembers.filter(m => m.tipeAnggota === 'GURU').length} · 
                      Staff: {parsedExcelMembers.filter(m => m.tipeAnggota === 'STAFF').length} · 
                      Siswa: {parsedExcelMembers.filter(m => m.tipeAnggota === 'SISWA').length}
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">No</th>
                          <th className="py-2 px-2.5">No. Anggota</th>
                          <th className="py-2 px-2.5">Nama Lengkap</th>
                          <th className="py-2 px-2.5">Kategori</th>
                          <th className="py-2 px-2.5">Kelas / Jabatan</th>
                          <th className="py-2 px-2.5">NIP / NISN</th>
                          <th className="py-2 px-2.5 text-center">L/P</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExcelMembers.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-indigo-700 font-semibold">{m.nomorAnggota}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-900">{m.nama}</td>
                            <td className="py-1.5 px-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.tipeAnggota === 'GURU' ? 'bg-amber-100 text-amber-800' :
                                m.tipeAnggota === 'STAFF' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {m.tipeAnggota}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600">{m.kelasAtauJabatan}</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-500">{m.nomorIdentitas || '-'}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold text-slate-700">{m.jenisKelamin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCommitParsedExcelMembers}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan & Masukkan ke Anggota ({parsedExcelMembers.length} Orang)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary Option: Manual Text Paste */}
              <details className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <summary className="font-semibold text-slate-700 text-xs cursor-pointer select-none">
                  Atau Tempel Baris Teks CSV Secara Manual
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-600">
                      Tempel data teks anggota:
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Muat Contoh Teks</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    placeholder="ANG-G-001,Dra. Siti Rahmawati,GURU,Guru Bahasa Indonesia,19750512 200003 2 001,P,2026-01-10,081234567890,Aktif"
                    className="w-full p-2.5 font-mono text-[11px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={!importRawText.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Impor dari Teks
                    </button>
                  </div>
                </div>
              </details>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedExcelMembers([]);
                  setExcelFileName('');
                  setImportStatusMsg(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus {selectedMemberIds.length} Anggota Pilihan?</h3>
                <p className="text-xs text-slate-500">Tindakan ini menghapus data anggota perpustakaan terpilih secara permanen.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700">{selectedMemberIds.length} anggota terpilih</strong> berikut?
            </p>

            <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-xs">
              {libraryMembers.filter(m => selectedMemberIds.includes(m.id)).slice(0, 6).map(m => (
                <div key={m.id} className="text-slate-700 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-semibold text-slate-900">{m.nama}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({m.nomorAnggota} - {m.tipeAnggota})</span>
                </div>
              ))}
              {selectedMemberIds.length > 6 && (
                <p className="text-[11px] text-slate-500 italic pl-3">
                  ... dan {selectedMemberIds.length - 6} anggota lainnya.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteMembers}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedMemberIds.length} Anggota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
