import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  HelpCircle,
  Building2,
  Shield,
  BookOpen,
  FlaskConical,
  RotateCcw
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: RoleType;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialRole
}) => {
  const { currentRole, schoolConfig, tasks, inventories } = useApp();
  const effectiveRole = initialRole || currentRole || 'TU';

  const [mode, setMode] = useState<'chat' | 'draft-letter' | 'bast-document' | 'incident-report' | 'sop-advice'>('chat');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);

  const roleTitle = 
    effectiveRole === 'TU' ? 'Tata Usaha (Administrasi Sekolah)' : 
    effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah (Keamanan & Sarpras)' : 
    effectiveRole === 'SERVICE' ? 'Layanan Kebersihan (Sanitasi Lingkungan)' :
    effectiveRole === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const quickPromptsByRole: Record<RoleType, Array<{ label: string; mode: 'chat' | 'draft-letter' | 'bast-document' | 'incident-report' | 'sop-advice'; prompt: string }>> = {
    TU: [
      { label: '📝 Nota Pengajuan ATK & Kertas Ujian', mode: 'draft-letter', prompt: 'Pengajuan pengadaan kertas HVS A4/F4, toner printer, dan stopmap arsip kesiswaan untuk kebutuhan semester' },
      { label: '📋 BAST Serah Terima Buku Rapor', mode: 'bast-document', prompt: 'Penyerahan cetakan buku rapor kurikulum merdeka dan buku induk kesiswaan dari percetakan ke sekolah' },
      { label: '❓ Aturan Klasifikasi Kode Surat Dinas', mode: 'sop-advice', prompt: 'Bagaimana penomoran surat dinas, kode klasifikasi kearsipan, dan alur disposisi surat masuk menurut standar dinas?' },
      { label: '⚠️ Laporan Kendala Printer Rusak', mode: 'incident-report', prompt: 'Printer kantor TU mengalami paper jam dan modul penarik kertas patah sehingga menghambat pelayanan mutasi' }
    ],
    PENJAGA: [
      { label: '📝 Permohonan Pengadaan Senter & Gembok', mode: 'draft-letter', prompt: 'Usulan pengadaan lampu senter patroli malam baterai lithium, gembok master-key, dan jas hujan dinas' },
      { label: '📋 BAST Perbaikan Engsel Pagar Utama', mode: 'bast-document', prompt: 'Penyelesaian pekerjaan pengelasan roda dan engsel pintu gerbang utama sekolah' },
      { label: '⚠️ Laporan Insiden Pohon Tumbang / Genteng Bocor', mode: 'incident-report', prompt: 'Hujan deras disertai angin kencang menyebabkan dahan pohon menimpa talang selasar gedung kelas' },
      { label: '❓ SOP Keamanan Tamu & Penyeberangan Siswa', mode: 'sop-advice', prompt: 'Standar Prosedur Operasional penjagaan gerbang, pencatatan tamu buku tamu dinas, dan pengawalan penyeberangan jalan peserta didik' }
    ],
    SERVICE: [
      { label: '📝 Permohonan Bahan Pembersih & Kantong Sampah', mode: 'draft-letter', prompt: 'Amprah bahan habis pakai pembersih lantai, sabun cair cuci tangan, karbol wangi toilet, dan kantong sampah hitam besar' },
      { label: '📋 BAST Pekerjaan Pembersihan Total Saluran Air', mode: 'bast-document', prompt: 'Penyelesaian pengerukan endapan lumpur dan pembersihan got keliling lingkungan sekolah' },
      { label: '⚠️ Laporan Kerusakan Kran & Pipa WC Siswa', mode: 'incident-report', prompt: 'Kran air pada toilet siswa laki-laki patah dan bocor sehingga air tandon terbuang' },
      { label: '❓ SOP Disinfeksi & Penanganan Sampah Organik', mode: 'sop-advice', prompt: 'SOP jadwal sanitasi toilet, sterilisasi ruang kelas, dan teknik pembuatan kompos daun sekolah' }
    ],
    PERPUS: [
      { label: '📝 Usulan Pengadaan Rak Display Buku', mode: 'draft-letter', prompt: 'Permohonan pengadaan 2 unit rak display buku akrilik dan karpet area baca lesehan pemustaka' },
      { label: '📋 BAST Hibah Buku dari Komite / Alumni', mode: 'bast-document', prompt: 'Penerimaan hibah 85 eksemplar buku bacaan pengayaan dan novel edukasi dari paguyuban orang tua' },
      { label: '⚠️ Laporan Buku Rusak Akibat Kelembapan / Rayap', mode: 'incident-report', prompt: 'Ditemukan 15 eksemplar kamus referensi di pojok rak belakang lembap berjamur akibat tempias hujan' },
      { label: '❓ Panduan Klasifikasi DDC & Barcoding Koleksi', mode: 'sop-advice', prompt: 'Bagaimana cara menentukan nomor klasifikasi DDC buku baru dan penataan shelfing perpustakaan?' }
    ],
    LAB_IPA: [
      { label: '📝 Pengajuan Bahan Reagen Praktikum Kimia', mode: 'draft-letter', prompt: 'Usulan pengadaan larutan HCl encer, indikator PP, tabung reaksi, dan spiritus pembakar bunsen' },
      { label: '📋 BAST Kalibrasi Mikroskop & Neraca Ohaus', mode: 'bast-document', prompt: 'Penyelesaian servis dan kalibrasi akurasi 12 unit mikroskop siswa laboratorium IPA' },
      { label: '⚠️ Laporan Pecah Alat Gelas Kimia Saat Praktikum', mode: 'incident-report', prompt: 'Sebuah gelas beker 500ml tersenggol dan pecah saat siswa melakukan pengamatan titik didih' },
      { label: '❓ SOP K3 & Pengelolaan Limbah Laboratorium B3', mode: 'sop-advice', prompt: 'SOP keselamatan kerja laboratorium, penggunaan APD, dan cara netralisasi limbah kimia sebelum dibuang' }
    ]
  };

  const handleSend = async (customPrompt?: string, customMode?: typeof mode) => {
    const textToSend = customPrompt || userInput;
    const activeMode = customMode || mode;
    if (!textToSend.trim()) return;

    setIsLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode: activeMode,
          role: effectiveRole,
          schoolConfig,
          additionalData: {
            taskCount: tasks.filter(t => t.role === effectiveRole).length,
            inventoryCount: inventories.filter(i => i.role === effectiveRole).length
          }
        })
      });

      const data = await res.json();
      if (data && data.reply) {
        setResponseOutput(data.reply);
        setIsAiGenerated(!!data.isAi);
      }
    } catch (err) {
      console.error('Error contacting AI Assistant:', err);
      setResponseOutput('Terjadi kendala saat menghubungi asisten AI. Silakan periksa koneksi atau coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!responseOutput) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // fallback to standard print
      window.print();
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dokumen Hasil Asisten AI SI-OPS - ${schoolConfig.namaSekolah}</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; padding: 2cm; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
            @page { size: A4; margin: 2cm; }
          </style>
        </head>
        <body>
          <pre>${responseOutput}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  <span>Asisten Cerdas AI SI-OPS</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini AI</span>
                  </span>
                </h2>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Kecerdasan Buatan untuk Seluruh Lini Pekerjaan Operasional ({roleTitle})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Tutup Asisten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Mode Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              mode === 'chat' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tanya & Konsultasi</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('draft-letter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              mode === 'draft-letter' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Draf Surat & Nota Dinas</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('bast-document')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              mode === 'bast-document' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Berita Acara (BAST)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('incident-report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              mode === 'incident-report' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Laporan Kronologis Kejadian</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('sop-advice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              mode === 'sop-advice' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>SOP & Kepatuhan SPM</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Preset Chips for current role */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Rekomendasi Cepat Berdasarkan Bidang ({roleTitle}):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(quickPromptsByRole[effectiveRole] || quickPromptsByRole.TU).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMode(item.mode);
                    setUserInput(item.prompt);
                    handleSend(item.prompt, item.mode);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg transition-all text-left cursor-pointer active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Output Area */}
          {isLoading ? (
            <div className="p-8 bg-slate-50 border border-indigo-100 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-indigo-900">
                Kecerdasan AI sedang merumuskan dokumen & telaah dinas resmi...
              </p>
              <p className="text-[11px] text-slate-500">
                Menyelaraskan dengan tata naskah dinas, profil sekolah, dan standar operasional.
              </p>
            </div>
          ) : responseOutput ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Hasil Rumusan Dokumen Kedinasan:
                  </span>
                  {isAiGenerated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ Gemini Live AI
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Cetak Langsung */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors shadow-2xs cursor-pointer"
                    title="Cetak langsung ke kertas resmi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Langsung</span>
                  </button>

                  {/* Salin Teks */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap border border-slate-800 shadow-inner select-text">
                {responseOutput}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
              <Bot className="w-10 h-10 text-indigo-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">
                Siap Membantu Pekerjaan Harian Anda di Seluruh Lini
              </h4>
              <p className="text-[11.5px] text-slate-500 max-w-md mx-auto">
                Ketikkan kebutuhan Anda di bawah ini, atau klik salah satu rekomendasi cepat di atas untuk langsung membuat draf nota dinas, BAST, laporan insiden, atau konsultasi SOP.
              </p>
            </div>
          )}
        </div>

        {/* Input & Action Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                {mode === 'draft-letter' && 'Kebutuhan Pengajuan / Hal yang ingin dimohonkan:'}
                {mode === 'bast-document' && 'Rincian Barang / Pekerjaan yang diserahterimakan:'}
                {mode === 'incident-report' && 'Kronologis Kejadian / Kerusakan yang dialami:'}
                {mode === 'sop-advice' && 'Pertanyaan SOP atau Standar Operasional Pelayanan:'}
                {mode === 'chat' && 'Pertanyaan atau Permintaan Tugas Kedinasan:'}
              </label>
              <textarea
                rows={2}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Contoh: Buatkan pengajuan perbaikan kran air toilet siswa dan pembelian alat pel lantai..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-900 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Proses AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
