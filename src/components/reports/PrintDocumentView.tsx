import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { KopSurat } from '../common/KopSurat';
import { OfficialApprovalSheet } from '../common/OfficialApprovalSheet';
import { InventoryTable } from '../common/InventoryTable';
import { MonthlyReport, AnnualReport, RoleType } from '../../types';
import { exportElementToPdf } from '../../utils/pdfExport';
import { generateOfficialDocumentHtml } from '../../utils/htmlExport';
import { 
  isTaskInMonth, 
  isTaskInYear, 
  getTaskClassification, 
  OFFICIAL_TUPOKSI_DEFINITIONS 
} from '../../utils/taskClassification';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Check, 
  Settings2,
  FileCheck2,
  Loader2,
  Eye,
  Smartphone,
  Monitor,
  Archive,
  Target,
  BookmarkCheck
} from 'lucide-react';

interface PrintDocumentViewProps {
  reportType: 'monthly' | 'annual';
  reportData: MonthlyReport | AnnualReport;
  onBack: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const PrintDocumentView: React.FC<PrintDocumentViewProps> = ({
  reportType,
  reportData,
  onBack
}) => {
  const { schoolConfig, currentRole, tasks, inventories, archiveReport } = useApp();
  const printableRef = useRef<HTMLDivElement>(null);

  const role: RoleType = reportData.role || currentRole || 'TU';
  const operator = schoolConfig.operatorProfiles[role];
  const roleTitle = role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';

  const isMonthly = reportType === 'monthly';
  const monthlyData = isMonthly ? (reportData as MonthlyReport) : null;
  const annualData = !isMonthly ? (reportData as AnnualReport) : null;

  const [manualDate, setManualDate] = useState<string>(
    reportData.manualDocDate || `${schoolConfig.kabupatenKota}, 30 September 2026`
  );

  const [nomorSurat, setNomorSurat] = useState<string>(
    `800/${isMonthly ? `LAP-BLN/${monthlyData?.month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`
  );

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [archivedSuccess, setArchivedSuccess] = useState<string | null>(null);
  const [mobileFitScale, setMobileFitScale] = useState(false);

  // Relevant tasks for this report using robust string date parsing
  const relevantTasks = tasks.filter(t => {
    if (t.role !== role) return false;
    if (isMonthly && monthlyData) {
      return isTaskInMonth(t.date, monthlyData.month, monthlyData.year);
    }
    if (!isMonthly && annualData) {
      return isTaskInYear(t.date, annualData.year);
    }
    return true;
  });

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category) === 'tambahan');
  const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
  const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;

  // 1. Direct PDF Generation & Download (Supporting OKLCH & Tailwind CSS v4)
  const handleSavePdf = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadSuccess(null);
    setPdfProgress('Menyiapkan tata letak...');

    try {
      const fileName = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await exportElementToPdf(printableRef.current, {
        fileName,
        margin: [10, 10, 10, 10], // 10mm margins for A4
        scale: 2,
        quality: 0.98,
        onProgress: (msg) => setPdfProgress(msg)
      });

      setDownloadSuccess('File PDF berhasil disimpan dan diunduh!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback: trigger standard print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  // 2. Standard Browser Print
  const handlePrint = () => {
    window.print();
  };

  // 3. Download Self-Contained Standard HTML Document with Embedded CSS
  const handleDownloadHtml = () => {
    try {
      const fullHtml = generateOfficialDocumentHtml({
        reportType,
        reportData,
        schoolConfig,
        tasks,
        inventories,
        manualDate,
        nomorSurat
      });

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess('Dokumen HTML resmi (Standar A4) berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Download HTML error:', err);
    }
  };

  // 4. Archive Document into Audit Repository
  const handleArchive = () => {
    const doc = archiveReport(reportType, reportData);
    setArchivedSuccess(`Dokumen berhasil diarsipkan ke Halaman Arsip Pemeriksaan (No. Reg: ${doc.regNumber})`);
    setTimeout(() => setArchivedSuccess(null), 5000);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Floating Control Toolbar (Hidden in Print & Export) */}
      <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sticky top-2 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Cetak & Unduh Dokumen Kedinasan Resmi</span>
            </h2>
            <p className="text-[10.5px] text-slate-400 truncate hidden xs:block">
              Format A4 Standard dengan Kop Surat 3 Kolom & Lembar Pengesahan
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tanggal Manual Input */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 w-full xs:w-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 shrink-0">Tgl:</span>
            <input
              type="text"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-hidden w-full xs:w-48 sm:w-52"
              placeholder="Kota Bogor, 30 September 2026"
            />
          </div>

          {/* SIMPAN PDF (Direct PDF Export) */}
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Download langsung berkas PDF A4 sempurna"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{pdfProgress || 'Memproses PDF...'}</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5 text-rose-200" />
                <span>Simpan PDF (Langsung)</span>
              </>
            )}
          </button>

          {/* CETAK / PRINT DIALOG */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer"
            title="Buka dialog cetak browser"
          >
            <Printer className="w-3.5 h-3.5 text-blue-200" />
            <span>Dialog Cetak</span>
          </button>

          {/* UNDUH HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            title="Download berkas HTML mandiri berstandar resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh HTML</span>
          </button>

          {/* ARSIPKAN DOKUMEN (AUDIT READY) */}
          <button
            type="button"
            onClick={handleArchive}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer"
            title="Simpan dokumen ke Lemari Arsip Pemeriksaan / Audit"
          >
            <Archive className="w-3.5 h-3.5 text-amber-200" />
            <span>Arsipkan Dokumen</span>
          </button>
        </div>
      </div>

      {/* Notice Message if any */}
      {downloadSuccess && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {archivedSuccess && (
        <div className="no-print bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Archive className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{archivedSuccess}</span>
        </div>
      )}

      {/* Mobile Fit Helper Bar */}
      <div className="no-print flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-800 sm:hidden">
        <span className="text-[11px]">Tampilan Kertas A4 Kedinasan:</span>
        <button
          type="button"
          onClick={() => setMobileFitScale(!mobileFitScale)}
          className="flex items-center gap-1 font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[10px]"
        >
          {mobileFitScale ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          <span>{mobileFitScale ? 'Ukuran Penuh (Geser)' : 'Sesuaikan Lebar Layar'}</span>
        </button>
      </div>

      {/* PRINTABLE OFFICIAL DOCUMENT CONTAINER (A4 CALIBRATED PAGES) */}
      <div className="overflow-x-auto pb-10">
        <div ref={printableRef} className="space-y-8 max-w-[850px] mx-auto">
          {(() => {
            const tasksPerPage = 10;
            const taskChunks: typeof relevantTasks[] = [];
            if (relevantTasks.length === 0) {
              taskChunks.push([]);
            } else {
              for (let i = 0; i < relevantTasks.length; i += tasksPerPage) {
                taskChunks.push(relevantTasks.slice(i, i + tasksPerPage));
              }
            }
            const roleInventories = inventories.filter(inv => inv.role === role);
            const tasksWithPhotos = relevantTasks.filter(t => !!t.photoUrl);
            const totalPages = 1 + taskChunks.length + 1 + 1; // Page 1 + N Task Pages + Lampiran Sarpras & Foto + Lembar Pengesahan

            return (
              <>
                {/* ========================================================
                    LEMBAR 1: KOP SURAT, IDENTITAS, RINGKASAN KINERJA
                    ======================================================== */}
                <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                  <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lembar 1 dari {totalPages} (Dokumen Induk Laporan Kinerja)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                </div>

                <div 
                  className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-6 sm:p-8 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                    mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                  }`}
                  style={{ 
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    {/* KOP SURAT 3 KOLOM */}
                    <KopSurat config={schoolConfig} isPrintVersion={true} />

                    {/* DOKUMEN HEADING */}
                    <div className="text-center my-3.5 break-inside-avoid">
                      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-950">
                        {isMonthly 
                          ? `LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                          : `LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                        }
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        BIDANG: {roleTitle.toUpperCase()}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {isMonthly 
                          ? `Periode: Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
                          : `Tahun Anggaran: ${annualData?.year || 2026}`
                        }
                      </p>
                      <p className="text-[11px] font-mono text-slate-600 mt-1">
                        Nomor: {nomorSurat}
                      </p>
                    </div>

                    {/* IDENTITAS PELAKSANA TUGAS */}
                    <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded text-xs break-inside-avoid print:bg-transparent print:border-black">
                      <table className="w-full border-none">
                        <tbody>
                          <tr>
                            <td className="w-40 sm:w-48 font-semibold border-none py-0.5">Nama Petugas Pelaksana</td>
                            <td className="w-4 border-none py-0.5">:</td>
                            <td className="font-bold border-none py-0.5">{operator.nama}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">NIP / NIPPK</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{operator.nip}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Pangkat / Golongan</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{operator.pangkatGolongan || '-'}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Jabatan / Satuan Tugas</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{operator.jabatan}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Unit Kerja / Sekolah</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{schoolConfig.namaSekolah}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* RINGKASAN KINERJA */}
                    <div className="my-3 text-xs break-inside-avoid">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2 print:border-black">
                        I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL
                      </h4>
                      <p className="text-justify leading-relaxed text-slate-800 indent-6">
                        {reportData.summary}
                      </p>

                      {/* CAPAIAN / MILESTONES */}
                      <div className="mt-2.5">
                        <p className="font-semibold text-slate-900 mb-1">
                          Rincian Capaian Indikator Kinerja yang Terlaksana:
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                          {isMonthly ? (
                            monthlyData?.achievements.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          ) : (
                            annualData?.annualMilestones.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          )}
                        </ol>
                      </div>

                      {/* KENDALA & SOLUSI / REKOMENDASI */}
                      {isMonthly && monthlyData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5 pt-1.5 border-t border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Kendala / Hambatan di Lapangan:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.obstacles.map((obs, idx) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Solusi & Upaya Pemecahan Masalah:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.solutions.map((sol, idx) => (
                                <li key={idx}>{sol}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {!isMonthly && annualData && (
                        <div className="mt-2.5 pt-1.5 border-t border-slate-200">
                          <p className="font-semibold text-slate-900 mb-1">Rekomendasi Rencana Strategis & Kebutuhan Operasional:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {annualData.strategicRecommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ========================================================
                          II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN
                          ======================================================== */}
                      <div className="mt-3.5 pt-2 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2 print:border-black">
                          II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN LAYANAN OPERASIONAL
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                            <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                              <span>A. Tugas Pokok (Tupoksi Standar):</span>
                              <span className="font-mono text-[9.5px] text-blue-800 font-bold">({tupoksiCompleted.length}/{tupoksiTasks.length} Tuntas)</span>
                            </p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                              {OFFICIAL_TUPOKSI_DEFINITIONS[role].tupoksiList.map((item, idx) => (
                                <li key={idx} className="leading-tight">{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                            <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                              <span>B. Tugas Tambahan & Insidental:</span>
                              <span className="font-mono text-[9.5px] text-amber-800 font-bold">({tambahanCompleted.length}/{tambahanTasks.length} Tuntas)</span>
                            </p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                              {OFFICIAL_TUPOKSI_DEFINITIONS[role].tugasTambahanList.map((item, idx) => (
                                <li key={idx} className="leading-tight">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lembar 1 Page Footer */}
                  <div className="pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                    <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 1 dari {totalPages}</span>
                  </div>
                </div>

                {/* ========================================================
                    LEMBAR LAMPIRAN I: REKAPITULASI RINCIAN TUGAS HARIAN
                    (DYNAMIC CHUNKED PAGINATION - 10 TUGAS PER LEMBAR A4)
                    ======================================================== */}
                {taskChunks.map((chunk, chunkIdx) => {
                  const pageNum = 2 + chunkIdx;
                  const isFirstChunk = chunkIdx === 0;

                  return (
                    <React.Fragment key={chunkIdx}>
                      <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                        <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lembar {pageNum} dari {totalPages} (Lampiran I: Rekapitulasi Rincian Catatan Tugas Harian {taskChunks.length > 1 ? `- Bagian ${chunkIdx + 1}` : ''})</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                      </div>

                      <div 
                        className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-6 sm:p-8 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                          mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                        }`}
                        style={{ 
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          {/* HEADER LANJUTAN DOKUMEN */}
                          <div className="border-b-2 border-slate-900 pb-2 mb-3.5 text-xs flex justify-between items-center font-semibold text-slate-700">
                            <span>{schoolConfig.namaSekolah} — Lampiran I: Rekapitulasi Tugas {roleTitle}</span>
                            <span className="font-mono text-[10.5px]">No: {nomorSurat}</span>
                          </div>

                          <div className="my-2 text-xs">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2.5 print:border-black break-inside-avoid">
                              III. REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN {taskChunks.length > 1 ? `(BAGIAN ${chunkIdx + 1})` : ''}
                            </h4>

                            <div className="w-full overflow-hidden">
                              <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[11px]">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                    <th className="py-1.5 px-2 text-center w-8 border border-slate-400 print:border-black">No</th>
                                    <th className="py-1.5 px-2 w-20 border border-slate-400 print:border-black">Tanggal</th>
                                    <th className="py-1.5 px-2 w-22 border border-slate-400 print:border-black">Klasifikasi</th>
                                    <th className="py-1.5 px-2.5 border border-slate-400 print:border-black">Uraian Tugas / Pekerjaan Kedinasan</th>
                                    <th className="py-1.5 px-2 border border-slate-400 print:border-black">Lokasi</th>
                                    <th className="py-1.5 px-2 text-center border border-slate-400 print:border-black whitespace-nowrap">Waktu</th>
                                    <th className="py-1.5 px-2 border border-slate-400 print:border-black">Volume</th>
                                    <th className="py-1.5 px-2 text-center border border-slate-400 print:border-black">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {chunk.length === 0 ? (
                                    <tr>
                                      <td colSpan={8} className="py-6 text-center text-slate-500 italic border border-slate-400 print:border-black">
                                        Tidak ada catatan tugas operasional pada periode ini.
                                      </td>
                                    </tr>
                                  ) : (
                                    chunk.map((t, idx) => {
                                      const isPokok = getTaskClassification(role, t.category) === 'pokok';
                                      return (
                                        <tr key={t.id} className="border-b border-slate-300 print:border-black">
                                          <td className="py-1.5 px-2 text-center font-mono border border-slate-300 print:border-black">
                                            {chunkIdx * tasksPerPage + idx + 1}
                                          </td>
                                          <td className="py-1.5 px-2 font-mono whitespace-nowrap border border-slate-300 print:border-black">{t.date}</td>
                                          <td className="py-1.5 px-2 text-[9.5px] border border-slate-300 print:border-black whitespace-nowrap">
                                            <span className={`font-semibold ${isPokok ? 'text-blue-900' : 'text-amber-900'}`}>
                                              {isPokok ? 'Tugas Pokok' : 'Tambahan'}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2.5 border border-slate-300 print:border-black">
                                            <span className="font-semibold text-slate-900 block">{t.title}</span>
                                            <span className="text-[10px] text-slate-600 block mt-0.5">{t.description}</span>
                                            {t.photoUrl && (
                                              <span className="text-[9px] text-blue-600 font-medium inline-block mt-0.5 no-print">📷 Ada bukti foto</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 px-2 border border-slate-300 print:border-black">{t.location}</td>
                                          <td className="py-1.5 px-2 text-center border border-slate-300 print:border-black whitespace-nowrap">{t.timeStart} - {t.timeEnd}</td>
                                          <td className="py-1.5 px-2 border border-slate-300 print:border-black font-medium">{t.volumeUnit}</td>
                                          <td className="py-1.5 px-2 text-center border border-slate-300 print:border-black font-semibold uppercase text-[9.5px]">
                                            {t.status === 'selesai' ? (
                                              <span className="text-emerald-700">Selesai 100%</span>
                                            ) : (
                                              <span className="text-amber-700">Dalam Proses</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                  {chunkIdx === taskChunks.length - 1 && relevantTasks.length > 0 && (
                                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200 print:border-black text-[10px]">
                                      <td colSpan={3} className="py-1.5 px-2 text-center font-bold">TOTAL REKAPITULASI</td>
                                      <td colSpan={4} className="py-1.5 px-2">
                                        {relevantTasks.length} Tugas Operasional Terlaksana ({tupoksiTasks.length} Tugas Pokok / {tambahanTasks.length} Tugas Tambahan)
                                      </td>
                                      <td className="py-1.5 px-2 text-center text-emerald-800 font-bold">
                                        {completedCount}/{relevantTasks.length} Tuntas
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Page Footer */}
                        <div className="pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                          <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman {pageNum} dari {totalPages}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* ========================================================
                    LEMBAR LAMPIRAN II: SARANA PRASARANA (INVENTARIS) & FOTO
                    (TERPISAH BERSIH & RAPI AGAR TIDAK MENEKAN PENGESAHAN)
                    ======================================================== */}
                {(() => {
                  const invPageNum = 1 + taskChunks.length + 1;
                  return (
                    <>
                      <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                        <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lembar {invPageNum} dari {totalPages} (Lampiran II: Sarana Prasarana & Dokumentasi Foto Bukti)</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                      </div>

                      <div 
                        className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-6 sm:p-8 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                          mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                        }`}
                        style={{ 
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          {/* HEADER LANJUTAN DOKUMEN */}
                          <div className="border-b-2 border-slate-900 pb-2 mb-3.5 text-xs flex justify-between items-center font-semibold text-slate-700">
                            <span>{schoolConfig.namaSekolah} — Lampiran II: Sarana Prasarana & Dokumentasi</span>
                            <span className="font-mono text-[10.5px]">No: {nomorSurat}</span>
                          </div>

                          {/* LAMPIRAN INVENTARIS SARANA PRASARANA KERJA */}
                          <div className="my-2 text-xs">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1.5 print:border-black break-inside-avoid">
                              III. LAMPIRAN DAFTAR INVENTARIS SARANA PRASARANA OPERASIONAL KERJA
                            </h4>
                            <p className="text-[10.5px] text-slate-600 mb-2">
                              Peralatan dinas pendukung operasional yang dipertanggungjawabkan kepada Operator Layanan Operasional ({roleTitle}):
                            </p>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[11px]">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 print:bg-slate-200">
                                    <th className="py-1 px-2 text-center w-8 border border-slate-400">No</th>
                                    <th className="py-1 px-2 border border-slate-400">Kode Barang</th>
                                    <th className="py-1 px-2.5 border border-slate-400">Nama Barang / Spesifikasi</th>
                                    <th className="py-1 px-2 text-center border border-slate-400">Jml</th>
                                    <th className="py-1 px-2 border border-slate-400">Kondisi</th>
                                    <th className="py-1 px-2 border border-slate-400">Lokasi Penempatan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {roleInventories.length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className="py-4 text-center text-slate-500 italic border border-slate-300">
                                        Belum ada catatan inventaris sarana prasarana.
                                      </td>
                                    </tr>
                                  ) : (
                                    roleInventories.slice(0, 8).map((item, idx) => (
                                      <tr key={item.id} className="border-b border-slate-300">
                                        <td className="py-1 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                                        <td className="py-1 px-2 font-mono text-[10px] border border-slate-300">{item.kodeBarang}</td>
                                        <td className="py-1 px-2.5 border border-slate-300">
                                          <span className="font-semibold text-slate-900 block">{item.namaBarang}</span>
                                          <span className="text-[9.5px] text-slate-500 block">{item.merkModel}</span>
                                        </td>
                                        <td className="py-1 px-2 text-center font-semibold border border-slate-300">{item.jumlah} {item.satuan}</td>
                                        <td className="py-1 px-2 border border-slate-300">
                                          <span className={`text-[10px] font-bold ${
                                            item.kondisi === 'Baik' ? 'text-emerald-700' : 'text-amber-700'
                                          }`}>
                                            {item.kondisi}
                                          </span>
                                        </td>
                                        <td className="py-1 px-2 border border-slate-300 text-[10px]">{item.lokasiPenyimpanan}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* LAMPIRAN DOKUMENTASI FOTO (JIKA ADA BUKTI FOTO) */}
                          <div className="mt-4 pt-2 border-t border-slate-200 text-xs break-inside-avoid">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2 print:border-black">
                              IV. LAMPIRAN DOKUMENTASI FOTO BUKTI PEKERJAAN LAPANGAN
                            </h4>
                            {tasksWithPhotos.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-2">
                                {tasksWithPhotos.slice(0, 4).map((t) => (
                                  <div key={t.id} className="border border-slate-300 p-2 rounded-lg bg-slate-50 print:bg-transparent print:border-black">
                                    <img 
                                      src={t.photoUrl} 
                                      alt={t.title} 
                                      className="w-full h-24 object-cover rounded border border-slate-200" 
                                    />
                                    <p className="font-bold text-[10px] text-slate-900 mt-1 truncate">{t.title}</p>
                                    <p className="text-[9px] text-slate-600 truncate">{t.date} · {t.location}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-[11px] italic">
                                Dokumentasi foto pendukung pekerjaan operasional tersimpan dalam sistem arsip digital satuan pendidikan.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lembar Footer */}
                        <div className="pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                          <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman {invPageNum} dari {totalPages}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ========================================================
                    LEMBAR FINAL: LEMBAR PENGESAHAN RESMI (MANDIRI & 100% ANTI-TERPOTONG)
                    ======================================================== */}
                <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lembar {totalPages} dari {totalPages} (LEMBAR PENGESAHAN RESMI KEDINASAN - DIJAMIN UTUH)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Standar Naskah Dinas Permendikbud</span>
                </div>

                <div 
                  className={`print-page bg-white border-2 border-slate-300 shadow-xl rounded-xl p-5 sm:p-7 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                    mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                  }`}
                  style={{ 
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    {/* KOP PENGESAHAN RESMI KEDINASAN */}
                    <KopSurat config={schoolConfig} isPrintVersion={true} />

                    {/* JUDUL LEMBAR PENGESAHAN */}
                    <div className="text-center my-2.5 break-inside-avoid">
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline decoration-2 underline-offset-4">
                        LEMBAR PENGESAHAN RESMI
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        LAPORAN {isMonthly ? 'BULANAN' : 'TAHUNAN'} KINERJA OPERATOR LAYANAN OPERASIONAL
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                        Bidang: {roleTitle.toUpperCase()} · Satuan Pendidikan: {schoolConfig.namaSekolah}
                      </p>
                      <p className="text-[10.5px] font-mono text-slate-600 mt-0.5">
                        Nomor Dokumen Pengesahan: {nomorSurat}
                      </p>
                    </div>

                    {/* PERNYATAAN PENGESAHAN KEDINASAN */}
                    <div className="my-2 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] leading-relaxed text-slate-800 print:bg-transparent print:border-black break-inside-avoid">
                      <p className="text-justify indent-5">
                        Berdasarkan hasil pemeriksaan administratif, verifikasi faktual lapangan, serta evaluasi atas seluruh bukti rekapitulasi pelaksanaan tugas harian dan pemeliharaan sarana prasarana operasional di lingkungan {schoolConfig.namaSekolah}, maka laporan kinerja {isMonthly ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}` : `Tahun Anggaran ${annualData?.year || 2026}`} ini dinyatakan <strong>TELAH MEMENUHI KETENTUAN STANDAR PELAYANAN MINIMAL (SPM)</strong>, disetujui, dan disahkan secara berjenjang sebagai dokumen akuntabilitas kedinasan yang sah dan dapat dipertanggungjawabkan.
                      </p>
                    </div>

                    {/* MATRIKS VERIFIKASI DATA LAPORAN */}
                    <div className="my-2 break-inside-avoid text-xs">
                      <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10.5px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="w-44 py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Nama Petugas Pelaksana</td>
                            <td className="py-0.5 px-2 font-bold text-slate-900">{operator.nama}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">NIP / NIPPK</td>
                            <td className="py-0.5 px-2 font-mono text-slate-800">{operator.nip}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Jabatan Kedinasan</td>
                            <td className="py-0.5 px-2 text-slate-800">{operator.jabatan}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Periode Evaluasi Kinerja</td>
                            <td className="py-0.5 px-2 font-semibold text-slate-800">
                              {isMonthly 
                                ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
                                : `Tahun Anggaran ${annualData?.year || 2026}`}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Pejabat Pengesah (Penilai)</td>
                            <td className="py-0.5 px-2 font-bold text-slate-900">
                              {schoolConfig.kepalaSekolah.nama} ({schoolConfig.kepalaSekolah.nip})
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* LEMBAR PENGESAHAN RESMI (TANDA TANGAN & CAP STEMPEL BERSIH UTUH) */}
                    <div className="mt-1 pt-0.5 break-inside-avoid">
                      <OfficialApprovalSheet
                        config={schoolConfig}
                        role={role}
                        manualDate={manualDate}
                        onDateChange={(d) => setManualDate(d)}
                        isPrintVersion={false}
                      />
                    </div>
                  </div>

                  {/* Lembar Terakhir Page Footer */}
                  <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                    <span>{schoolConfig.namaSekolah} · Lembar Pengesahan Resmi Kedinasan · Halaman {totalPages} dari {totalPages} (Selesai)</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
