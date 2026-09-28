import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ArchiveDocument, RoleType } from '../../types';
import { exportElementToPdf } from '../../utils/pdfExport';
import { generateOfficialDocumentHtml } from '../../utils/htmlExport';
import { 
  Archive, 
  Search, 
  Filter, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  Shield, 
  Sparkles, 
  Eye, 
  Clock, 
  AlertCircle, 
  Plus, 
  FileCheck2, 
  Stamp, 
  Camera, 
  Trash2, 
  FileSpreadsheet,
  Check,
  ChevronRight,
  ExternalLink,
  ClipboardList
} from 'lucide-react';

interface DocumentArchiveViewProps {
  onOpenDocument: (reportType: 'monthly' | 'annual', reportData: any) => void;
}

export const DocumentArchiveView: React.FC<DocumentArchiveViewProps> = ({ onOpenDocument }) => {
  const { 
    archives, 
    addArchive, 
    updateArchive, 
    deleteArchive, 
    archiveReport, 
    schoolConfig, 
    tasks, 
    inventories,
    monthlyReports,
    annualReports,
    currentRole 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | RoleType>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'monthly' | 'annual'>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [notification, setNotification] = useState<string | null>(null);
  const [isBapModalOpen, setIsBapModalOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<ArchiveDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<ArchiveDocument | null>(null);
  const [inspectorName, setInspectorName] = useState('Drs. H. AHMAD FAUZI, M.Pd.');
  const [inspectorNip, setInspectorNip] = useState('NIP. 19681120 199403 1 004');
  const [inspectorInstitution, setInspectorInstitution] = useState('Pengawas Satuan Pendidikan Disdik');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter archives
  const filteredArchives = useMemo(() => {
    return archives.filter(doc => {
      // Role filter
      if (selectedRole !== 'ALL' && doc.role !== selectedRole) return false;
      // Type filter
      if (selectedType !== 'ALL' && doc.documentType !== selectedType) return false;
      // Year filter
      if (selectedYear !== 'ALL' && String(doc.year) !== selectedYear) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && doc.approvalStatus !== selectedStatus) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchReg = doc.regNumber.toLowerCase().includes(q);
        const matchSurat = doc.nomorSurat.toLowerCase().includes(q);
        const matchOp = doc.operatorName.toLowerCase().includes(q);
        const matchPeriod = doc.period.toLowerCase().includes(q);
        return matchTitle || matchReg || matchSurat || matchOp || matchPeriod;
      }

      return true;
    });
  }, [archives, selectedRole, selectedType, selectedYear, selectedStatus, searchQuery]);

  // Statistics for Audit Readiness
  const stats = useMemo(() => {
    const total = archives.length;
    const verified = archives.filter(a => a.approvalStatus === 'disahkan_kepsek').length;
    const withPhotos = archives.filter(a => a.checklist.hasPhotos).length;
    const readinessScore = total > 0 ? Math.round((verified / total) * 100) : 100;
    return { total, verified, withPhotos, readinessScore };
  }, [archives]);

  // Handle direct HTML download of archived document
  const handleDownloadArchivedHtml = (doc: ArchiveDocument) => {
    try {
      const fullHtml = generateOfficialDocumentHtml({
        reportType: doc.documentType as any,
        reportData: doc.reportData,
        schoolConfig,
        tasks,
        inventories,
        manualDate: doc.reportData?.manualDocDate,
        nomorSurat: doc.nomorSurat
      });

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.regNumber.replace(/\//g, '_')}_${doc.title.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Berkas HTML resmi "${doc.title}" berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      showNotification('Gagal mengunduh berkas HTML.');
    }
  };

  // Quick Archive Active Monthly Report
  const handleArchiveCurrentActive = () => {
    const role = currentRole || 'TU';
    const month = 9;
    const year = 2026;
    const activeReport = monthlyReports.find(r => r.role === role && r.month === month && r.year === year) || {
      id: `rep-${role.toLowerCase()}-${year}-${month}`,
      role,
      month,
      year,
      manualDocDate: `${schoolConfig.kabupatenKota}, 30 September ${year}`,
      summary: `Laporan Bulanan Kinerja ${role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan'} Bulan September ${year}.`,
      achievements: [
        'Pelaksanaan tugas operasional harian 100% tuntas sesuai standar SPM',
        'Penatausahaan administrasi dan pemeliharaan fasilitas terpelihara optimal'
      ],
      obstacles: ['Tidak ada kendala mayor.'],
      solutions: ['Koordinasi berkelanjutan bersama tim.'],
      approvalStatus: 'disahkan_kepsek'
    };

    const doc = archiveReport('monthly', activeReport);
    showNotification(`Laporan bulan ini berhasil diarsipkan dengan No. Reg: ${doc.regNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Audit Readiness Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>LEMARI ARSIP DOKUMEN RESMI · SIAP AUDIT & PEMERIKSAAN DINAS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Repositori Arsip Dokumen Kedinasan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Seluruh laporan kinerja bulanan, tahunan, buku inventaris, dan bukti dokumentasi lapangan tersimpan secara terstruktur dengan penomoran registrasi resmi untuk keperluan pemeriksaan pengawas, akreditasi, atau inspektorat.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleArchiveCurrentActive}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Arsipkan Laporan Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBapModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Berita Acara Pemeriksaan (BAP)</span>
            </button>
          </div>
        </div>

        {/* 4 Inspection Indicator Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Total Berkas Diarsipkan</div>
            <div className="text-xl font-black text-white mt-1">{stats.total} Dokumen</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tersedia untuk diinspeksi</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-emerald-400 font-medium">Telah Disahkan Kepsek</div>
            <div className="text-xl font-black text-emerald-300 mt-1">{stats.verified} Dokumen</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Lengkap TTD & Cap Stempel</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-sky-400 font-medium">Lampiran Bukti Fisik</div>
            <div className="text-xl font-black text-sky-300 mt-1">{stats.withPhotos} Berkas</div>
            <div className="text-[10px] text-sky-400/80 mt-0.5">Foto kegiatan & geotag/waktu</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-amber-400 font-medium">Status Kesiapan Audit</div>
            <div className="text-xl font-black text-amber-300 mt-1">{stats.readinessScore}% Siap</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Bebas temuan administrasi</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan No. Registrasi, Nomor Surat, Judul Laporan, atau Petugas..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Quick Clear or Count */}
          <div className="text-xs text-slate-500 shrink-0 self-center">
            Menampilkan <span className="font-bold text-slate-800">{filteredArchives.length}</span> dari {archives.length} dokumen
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Bidang:
          </span>

          <button
            type="button"
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              selectedRole === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Bidang
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('TU')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              selectedRole === 'TU'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tata Usaha (TU)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('PENJAGA')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              selectedRole === 'PENJAGA'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Penjaga Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('SERVICE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              selectedRole === 'SERVICE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Layanan Kebersihan (Service)</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Type Filter */}
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mr-1">
            Jenis:
          </span>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Jenis Laporan</option>
            <option value="monthly">Laporan Bulanan Kinerja</option>
            <option value="annual">Laporan Tahunan Kinerja</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Status Pengesahan</option>
            <option value="disahkan_kepsek">Disahkan Kepala Sekolah</option>
            <option value="diajukan">Menunggu Verifikasi (Diajukan)</option>
            <option value="draft">Konsep (Draft)</option>
          </select>
        </div>
      </div>

      {/* Document Archive List */}
      <div className="space-y-3.5">
        {filteredArchives.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Archive className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada arsip dokumen yang sesuai</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter bidang dan jenis dokumen di atas.
            </p>
          </div>
        ) : (
          filteredArchives.map((doc) => {
            const roleBadge = {
              TU: { bg: 'bg-sky-50 text-sky-800 border-sky-200', label: 'Tata Usaha (TU)' },
              PENJAGA: { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Penjaga Sekolah' },
              SERVICE: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Layanan Kebersihan' }
            }[doc.role];

            return (
              <div 
                key={doc.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Document Reg & Title */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-900 text-white rounded">
                        {doc.regNumber}
                      </span>
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500">
                        {doc.period}
                      </span>
                      {doc.approvalStatus === 'disahkan_kepsek' ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disahkan Kepala Sekolah</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>{doc.approvalStatus}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-mono">
                      <span>No. Surat: <strong className="text-slate-700 font-sans">{doc.nomorSurat}</strong></span>
                      <span>Petugas: <strong className="text-slate-700 font-sans">{doc.operatorName}</strong> ({doc.operatorNip})</span>
                    </div>
                  </div>

                  {/* Right: Direct Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* BUKA & CETAK DOKUMEN */}
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc.documentType as any, doc.reportData)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                      title="Lihat dokumen lengkap dengan Kop & Pengesahan Resmi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat & Cetak Resmi</span>
                    </button>

                    {/* UNDUH HTML RESMI */}
                    <button
                      type="button"
                      onClick={() => handleDownloadArchivedHtml(doc)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-300 cursor-pointer"
                      title="Unduh berkas HTML mandiri lengkap CSS"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Unduh HTML</span>
                    </button>

                    {/* DETAIL CATATAN AUDIT */}
                    <button
                      type="button"
                      onClick={() => setInspectingDoc(doc)}
                      className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors border border-slate-200 cursor-pointer"
                      title="Catatan Pemeriksaan & Checklist Kelengkapan"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {/* HAPUS BERKAS ARSIP */}
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="flex items-center gap-1.5 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors border border-rose-200 cursor-pointer"
                      title="Hapus berkas arsip ini dari repositori"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                </div>

                {/* Audit Checklist Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-700">Kelengkapan Bukti Fisik:</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3 h-3 text-emerald-600" /> Kop Surat Dinas
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3 h-3 text-emerald-600" /> Lembar Pengesahan
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3 h-3 text-emerald-600" /> TTD Petugas & Kepsek
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3 h-3 text-emerald-600" /> Cap Stempel Sekolah
                    </span>
                    {doc.checklist.hasPhotos ? (
                      <span className="flex items-center gap-1 text-sky-700 font-medium">
                        <Camera className="w-3 h-3 text-sky-600" /> {doc.checklist.photoCount} Foto Bukti
                      </span>
                    ) : (
                      <span className="text-slate-400">Tanpa Foto</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Diarsipkan: {new Date(doc.dateArchived).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BERITA ACARA PEMERIKSAAN (BAP) MODAL */}
      {isBapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Formulir Berita Acara Pemeriksaan (BAP)
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsBapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dokumen resmi pernyataan bahwa seluruh arsip dokumen operasional (Tata Usaha, Penjaga, Layanan Kebersihan) pada <strong>{schoolConfig.namaSekolah}</strong> telah ditinjau dan dinyatakan lengkap.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pejabat Pemeriksa / Auditor:</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP / NIPPK Pemeriksa:</label>
                <input
                  type="text"
                  value={inspectorNip}
                  onChange={(e) => setInspectorNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan / Instansi Pemeriksa:</label>
                <input
                  type="text"
                  value={inspectorInstitution}
                  onChange={(e) => setInspectorInstitution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Verifikasi Dokumen: LENGKAP & MEMENUHI SYARAT</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Total {archives.length} berkas kedinasan siap diajukan ke Sistem Informasi Kinerja & Audit Disdik.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBapModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsBapModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Cetak Lembar BAP Resmi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR INSPECTION NOTES */}
      {inspectingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Detail Verifikasi Arsip Dokumen
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-mono text-indigo-700 font-bold">{inspectingDoc.regNumber}</div>
                <div className="font-bold text-slate-900">{inspectingDoc.title}</div>
                <div className="text-slate-500">{inspectingDoc.nomorSurat}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Verifikator / Pengawas:</label>
                <textarea
                  rows={3}
                  value={inspectingDoc.inspectionNotes || ''}
                  onChange={(e) => {
                    const notes = e.target.value;
                    setInspectingDoc(prev => prev ? { ...prev, inspectionNotes: notes } : null);
                    updateArchive(inspectingDoc.id, { inspectionNotes: notes });
                  }}
                  placeholder="Masukkan catatan evaluasi pemeriksaan di sini..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Pengesahan:</label>
                <select
                  value={inspectingDoc.approvalStatus}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    setInspectingDoc(prev => prev ? { ...prev, approvalStatus: status } : null);
                    updateArchive(inspectingDoc.id, { approvalStatus: status });
                    showNotification('Status dokumen berhasil diperbarui!');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white"
                >
                  <option value="disahkan_kepsek">Disahkan Kepala Sekolah (Resmi)</option>
                  <option value="disetujui_kasubag">Disetujui Kasubag / Tim Penilai</option>
                  <option value="diajukan">Diajukan (Menunggu Tinjauan)</option>
                  <option value="draft">Konsep (Draft)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDocToDelete(inspectingDoc)}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Berkas Arsip</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS BERKAS ARSIP (ANTI-GAGAL / TANPA WINDOW.CONFIRM) */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Hapus Berkas Arsip
                </h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus berkas arsip kedinasan ini secara permanen dari repositori? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-mono text-indigo-700 font-bold">{docToDelete.regNumber}</div>
              <div className="font-bold text-slate-900">{docToDelete.title}</div>
              <div className="text-slate-600">Nomor: {docToDelete.nomorSurat}</div>
              <div className="text-slate-500 text-[11px]">Petugas: {docToDelete.operatorName}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = docToDelete.id;
                  const targetReg = docToDelete.regNumber;
                  deleteArchive(targetId);
                  setDocToDelete(null);
                  if (inspectingDoc?.id === targetId) {
                    setInspectingDoc(null);
                  }
                  showNotification(`Berkas arsip ${targetReg} berhasil dihapus dari repositori.`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
