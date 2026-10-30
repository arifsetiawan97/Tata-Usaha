import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, RoleType } from '../../types';
import { exportInventoryToCsv, parseInventoryCsv } from '../../data/taskPresets';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
import { KopSurat } from './KopSurat';
import { 
  downloadInventoryExcelTemplate, 
  exportInventoriesToExcel, 
  parseInventoryExcelFile 
} from '../../utils/excelHelper';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  PackageCheck, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Search, 
  Upload, 
  Download, 
  FileSpreadsheet,
  Check,
  Sparkles,
  Printer,
  Bot
} from 'lucide-react';

interface InventoryTableProps {
  role?: RoleType;
  isPrintVersion?: boolean;
  readOnly?: boolean;
  title?: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  role,
  isPrintVersion = false,
  readOnly = false,
  title
}) => {
  const { inventories, addInventory, updateInventory, deleteInventory, deleteMultipleInventories, importInventories, currentRole, schoolConfig } = useApp();
  const effectiveRole = role || currentRole || 'TU';
  const roleTitle = 
    effectiveRole === 'TU' ? 'Tata Usaha' : 
    effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah' : 
    effectiveRole === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    effectiveRole === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const [parsedExcelItems, setParsedExcelItems] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // AI Sarpras Audit State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<{
    conditionSummary: string;
    readinessScore: number;
    priorityAction: string;
    recommendations: string[];
    isAi?: boolean;
  } | null>(null);
  const [showAiAuditModal, setShowAiAuditModal] = useState(false);

  const handleRunAiAudit = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/gemini/analyze-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: effectiveRole,
          inventories: inventories.filter(i => i.role === effectiveRole),
          schoolConfig
        })
      });
      const data = await res.json();
      if (data && data.data) {
        setAiAuditResult({ ...data.data, isAi: data.isAi });
        setShowAiAuditModal(true);
      }
    } catch (err) {
      console.error('Error running AI sarpras audit:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const [isKirPrintModalOpen, setIsKirPrintModalOpen] = useState(false);

  const handleDirectPrintKir = () => {
    setIsKirPrintModalOpen(true);
  };

  // Form state
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'role'>>({
    kodeBarang: '',
    namaBarang: '',
    merkModel: '',
    kategori: '',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: '',
    tahunPengadaan: new Date().getFullYear(),
    keterangan: ''
  });

  const roleInventories = inventories.filter(item => {
    if (item.role !== effectiveRole) return false;
    if (filterKondisi !== 'all' && item.kondisi !== filterKondisi) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.namaBarang.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.lokasiPenyimpanan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countBaik = inventories.filter(i => i.role === effectiveRole && i.kondisi === 'Baik').length;
  const countRusakRingan = inventories.filter(i => i.role === effectiveRole && i.kondisi === 'Rusak Ringan').length;
  const countRusakBerat = inventories.filter(i => i.role === effectiveRole && i.kondisi === 'Rusak Berat').length;
  const totalBarang = inventories.filter(i => i.role === effectiveRole).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      kodeBarang: `INV-${effectiveRole}-${String(totalBarang + 1).padStart(2, '0')}`,
      namaBarang: '',
      merkModel: '',
      kategori: effectiveRole === 'TU' ? 'Peralatan TIK & Kantor' : effectiveRole === 'PENJAGA' ? 'Alat Keamanan & Perbaikan' : 'Alat Kebersihan',
      jumlah: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      lokasiPenyimpanan: '',
      tahunPengadaan: new Date().getFullYear(),
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      merkModel: item.merkModel,
      kategori: item.kategori,
      jumlah: item.jumlah,
      satuan: item.satuan,
      kondisi: item.kondisi,
      lokasiPenyimpanan: item.lokasiPenyimpanan,
      tahunPengadaan: item.tahunPengadaan,
      keterangan: item.keterangan
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) return;

    if (editingItem) {
      updateInventory(editingItem.id, formData);
    } else {
      addInventory({
        ...formData,
        role: effectiveRole
      });
    }
    setIsModalOpen(false);
  };

  const handleDownloadExcelTemplate = () => {
    downloadInventoryExcelTemplate(effectiveRole);
  };

  const handleExportExcel = () => {
    exportInventoriesToExcel(roleInventories, roleTitle);
  };

  const handleDownloadTemplateCsv = () => {
    const csvContent = exportInventoryToCsv(roleInventories, effectiveRole);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_inventaris_${effectiveRole.toLowerCase()}_excel.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      setExcelFileName(file.name);
      setImportStatus(`Membaca berkas ${file.name}...`);

      const parsed = await parseInventoryExcelFile(file, effectiveRole);
      if (parsed.length > 0) {
        setParsedExcelItems(parsed);
        setImportStatus(`Berhasil membaca ${parsed.length} barang dari berkas "${file.name}". Silakan tinjau dan konfirmasi.`);
      } else {
        setParsedExcelItems([]);
        setImportStatus('Tidak ada data barang yang valid pada berkas Excel.');
      }
    } catch (err) {
      console.error('Error parsing inventory excel:', err);
      setImportStatus('Format berkas tidak valid. Pastikan format .xlsx, .xls, atau .csv');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  const handleCommitParsedExcelImport = () => {
    if (parsedExcelItems.length === 0) return;
    importInventories(parsedExcelItems);
    setImportStatus(`Berhasil mengimpor ${parsedExcelItems.length} barang inventaris!`);
    setTimeout(() => {
      setIsImportModalOpen(false);
      setParsedExcelItems([]);
      setExcelFileName('');
      setImportStatus('');
    }, 1000);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === roleInventories.length && roleInventories.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(roleInventories.map(i => i.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      deleteMultipleInventories(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = parseInventoryCsv(content, effectiveRole);
          if (parsed.length > 0) {
            importInventories(parsed);
            setImportStatus(`Berhasil mengimpor ${parsed.length} barang inventaris!`);
            setTimeout(() => {
              setIsImportModalOpen(false);
              setImportStatus('');
            }, 1200);
          } else {
            setImportStatus('Tidak ada data barang yang valid pada berkas CSV.');
          }
        } catch (err) {
          setImportStatus('Format berkas CSV tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full">
      {/* Header & Controls */}
      {!isPrintVersion && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {title || `Daftar Inventaris Sarana Kerja: ${roleTitle}`}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Total: {totalBarang} aset</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">Baik: {countBaik}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-medium">Rusak Ringan: {countRusakRingan}</span>
              {countRusakBerat > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-700 font-medium">Rusak Berat: {countRusakBerat}</span>
                </>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode/nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-32 sm:w-44"
                />
              </div>

              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>

              {/* Direct Print KIR Button */}
              <button
                type="button"
                onClick={handleDirectPrintKir}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Cetak langsung Buku Inventaris Sarana Kerja (KIR) resmi ke printer"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Cetak Langsung (KIR)</span>
              </button>

              {/* AI Sarpras Audit Button */}
              <button
                type="button"
                onClick={handleRunAiAudit}
                disabled={isAnalyzingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Lakukan audit kelayakan sarana prasarana cerdas otomatis dengan Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{isAnalyzingAi ? 'Menganalisis AI...' : 'Audit Sarpras (AI)'}</span>
              </button>

              {/* Ekspor Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Ekspor seluruh buku inventaris ini ke berkas Microsoft Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => {
                  setParsedExcelItems([]);
                  setExcelFileName('');
                  setImportStatus('');
                  setIsImportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Impor dari berkas Excel (.xlsx) atau CSV dengan pemetaan kolom otomatis"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Impor Excel / CSV</span>
              </button>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Barang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* For Print Version: Formal Subtitle */}
      {isPrintVersion && (
        <div className="mb-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            {title || `LAMPIRAN: BUKU INVENTARIS OPERASIONAL KERJA (${roleTitle.toUpperCase()})`}
          </h4>
          <p className="text-[10px] text-slate-600 mb-1">
            Data tercatat per {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Bulk Delete / Selection Action Bar */}
      {selectedIds.length > 0 && !isPrintVersion && !readOnly && (
        <div className="mb-3 p-2.5 sm:px-4 bg-rose-50 border border-rose-200 rounded-lg flex flex-wrap items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-rose-900">
              barang inventaris dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
            >
              Batal Pilihan
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Pilihan ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container - Mobile friendly responsive scroll */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white print:border-black print:rounded-none">
        <table className="w-full text-left text-xs border-collapse min-w-[650px] sm:min-w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-semibold print:bg-slate-200 print:text-black print:border-black">
              {!isPrintVersion && !readOnly && (
                <th className="py-2 px-2 text-center w-8 border-r border-slate-200 print:border-black no-print">
                  <input
                    type="checkbox"
                    checked={roleInventories.length > 0 && selectedIds.length === roleInventories.length}
                    onChange={handleToggleSelectAll}
                    title="Pilih semua barang inventaris"
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-2 px-2 text-center w-8 border-r border-slate-200 print:border-black">No</th>
              <th className="py-2 px-2.5 border-r border-slate-200 print:border-black">Kode Barang</th>
              <th className="py-2 px-3 border-r border-slate-200 print:border-black">Nama Barang & Merk / Tipe</th>
              <th className="py-2 px-2.5 border-r border-slate-200 print:border-black">Kategori</th>
              <th className="py-2 px-2 text-center border-r border-slate-200 print:border-black">Jumlah</th>
              <th className="py-2 px-2 text-center border-r border-slate-200 print:border-black">Kondisi</th>
              <th className="py-2 px-2.5 border-r border-slate-200 print:border-black">Lokasi Simpan</th>
              <th className="py-2 px-2.5 border-r border-slate-200 print:border-black">Keterangan</th>
              {!isPrintVersion && !readOnly && (
                <th className="py-2 px-2 text-center w-16 no-print">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black">
            {roleInventories.length === 0 ? (
              <tr>
                <td colSpan={isPrintVersion || readOnly ? 8 : 10} className="py-6 text-center text-slate-400 italic">
                  Belum ada data inventaris untuk kategori ini.
                </td>
              </tr>
            ) : (
              roleInventories.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors print:hover:bg-transparent ${selectedIds.includes(item.id) ? 'bg-blue-50/40' : ''}`}>
                  {!isPrintVersion && !readOnly && (
                    <td className="py-2 px-2 text-center border-r border-slate-200 print:border-black no-print">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleSelectItem(item.id)}
                        title={`Pilih ${item.namaBarang}`}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200 print:border-black print:text-black">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 font-mono font-medium text-slate-800 text-[11px] border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                    {item.kodeBarang}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 print:border-black">
                    <p className="font-semibold text-slate-900 print:text-black">{item.namaBarang}</p>
                    <p className="text-[10px] text-slate-500 print:text-slate-800">{item.merkModel}</p>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 text-[11px] border-r border-slate-200 print:border-black print:text-black">
                    {item.kategori}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-slate-900 border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                    {item.jumlah} {item.satuan}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-200 print:border-black whitespace-nowrap">
                    {isPrintVersion ? (
                      <span className="font-medium text-slate-900 print:text-black">
                        {item.kondisi}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        item.kondisi === 'Baik' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : item.kondisi === 'Rusak Ringan'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {item.kondisi === 'Baik' && <PackageCheck className="w-2.5 h-2.5" />}
                        {item.kondisi === 'Rusak Ringan' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {item.kondisi === 'Rusak Berat' && <AlertCircle className="w-2.5 h-2.5" />}
                        {item.kondisi}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 text-[11px] border-r border-slate-200 print:border-black print:text-black">
                    {item.lokasiPenyimpanan}
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 text-[11px] border-r border-slate-200 print:border-black print:text-black">
                    {item.keterangan || '-'}
                  </td>
                  {!isPrintVersion && !readOnly && (
                    <td className="py-2 px-2 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit barang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteInventory(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Hapus barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg my-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                {editingItem ? 'Edit Inventaris Barang' : 'Tambah Inventaris Barang Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeBarang}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodeBarang: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.kategori}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Komputer PC All-in-One, Senter Patroli, Gerobak Sampah"
                  value={formData.namaBarang}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaBarang: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Merk / Model / Spesifikasi</label>
                  <input
                    type="text"
                    value={formData.merkModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, merkModel: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pengadaan</label>
                  <input
                    type="number"
                    value={formData.tahunPengadaan}
                    onChange={(e) => setFormData(prev => ({ ...prev, tahunPengadaan: parseInt(e.target.value) || 2026 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.jumlah}
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={formData.satuan}
                    onChange={(e) => setFormData(prev => ({ ...prev, satuan: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData(prev => ({ ...prev, kondisi: e.target.value as any }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan / Penempatan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pos Jaga Depan, Ruang TU, Gudang Service"
                  value={formData.lokasiPenyimpanan}
                  onChange={(e) => setFormData(prev => ({ ...prev, lokasiPenyimpanan: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Fungsi Khusus</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Catatan kondisi, nomor register atau peruntukan"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Inventaris'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import / Export Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Templat & Impor Data Inventaris ({roleTitle})
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Mendukung berkas Microsoft Excel (.xlsx, .xls) & CSV dengan kolom otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedExcelItems([]);
                  setExcelFileName('');
                }}
                className="p-1 rounded-lg hover:bg-white/15 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Template Download Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Unduh Templat Format Excel Resmi:</span>
                  </p>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Dilengkapi kolom Excel resmi kedinasan: Kode, Nama Barang & Merk, Kategori, Jumlah, Satuan, Kondisi, Lokasi Simpan, Sumber Dana, dan Keterangan.
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
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center bg-slate-50/60 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-90" />
                <p className="font-bold text-slate-800 text-sm">Unggah Berkas Excel Inventaris (.xlsx / .xls / .csv)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Kolom otomatis dipetakan ke buku inventaris sarana kerja</p>
                
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-xs text-xs">
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
              {importStatus && (
                <div className={`p-3 rounded-lg text-xs font-semibold border flex items-center gap-2 ${
                  importStatus.includes('Berhasil') 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {/* Parsed Excel Items Preview */}
              {parsedExcelItems.length > 0 && (
                <div className="space-y-2 border border-blue-200 rounded-xl p-3 bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-blue-700" />
                      Pratinjau Data ({parsedExcelItems.length} barang inventaris terbaca):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total Aset: {parsedExcelItems.reduce((acc, it) => acc + (it.jumlah || 1), 0)} unit
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">No</th>
                          <th className="py-2 px-2.5">Kode</th>
                          <th className="py-2 px-2.5">Nama Barang</th>
                          <th className="py-2 px-2.5">Kategori</th>
                          <th className="py-2 px-2.5 text-center">Jml</th>
                          <th className="py-2 px-2.5">Kondisi</th>
                          <th className="py-2 px-2.5">Lokasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExcelItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">{item.kodeBarang}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">{item.namaBarang}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{item.kategori}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold text-slate-800">{item.jumlah} {item.satuan}</td>
                            <td className="py-1.5 px-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                                item.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.kondisi}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-500">{item.lokasiPenyimpanan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCommitParsedExcelImport}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan & Masukkan ke Inventaris ({parsedExcelItems.length} Barang)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedExcelItems([]);
                  setExcelFileName('');
                  setImportStatus('');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SARPRAS AUDIT MODAL */}
      {showAiAuditModal && aiAuditResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Audit Kelayakan Sarpras AI
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Analisis Kesiapsiagaan Aset & Sarana Kerja ({roleTitle})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Score card */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                    Indeks Kelayakan Sarpras:
                  </p>
                  <p className="text-2xl font-black text-indigo-700">
                    {aiAuditResult.readinessScore}%
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  aiAuditResult.readinessScore >= 80 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : aiAuditResult.readinessScore >= 60 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {aiAuditResult.readinessScore >= 80 ? '✓ Sangat Laik Pakai' : aiAuditResult.readinessScore >= 60 ? '⚠️ Butuh Pemeliharaan' : '🚨 Kritis'}
                </span>
              </div>

              {/* Condition Summary */}
              <div>
                <p className="font-bold text-slate-800 mb-1">Ringkasan Kondisi Lapangan:</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  {aiAuditResult.conditionSummary}
                </div>
              </div>

              {/* Priority Action */}
              <div>
                <p className="font-bold text-rose-800 mb-1">Tindakan Prioritas Utama:</p>
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{aiAuditResult.priorityAction}</span>
                </div>
              </div>

              {/* Technical Recommendations */}
              <div>
                <p className="font-bold text-slate-800 mb-1">Rekomendasi Tindak Lanjut:</p>
                <ul className="space-y-1.5">
                  {aiAuditResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDirectPrintKir}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Buku KIR</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiAuditModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus {selectedIds.length} Barang Terpilih?</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen dan menghapus barang dari inventaris.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Anda akan menghapus data <strong className="text-rose-700 font-bold">{selectedIds.length} barang inventaris</strong> yang dipilih berikut:
            </p>

            <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5 text-xs">
              {roleInventories.filter(i => selectedIds.includes(i.id)).slice(0, 6).map(item => (
                <div key={item.id} className="text-slate-700 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-semibold text-slate-900">{item.namaBarang}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({item.kodeBarang})</span>
                </div>
              ))}
              {selectedIds.length > 6 && (
                <p className="text-[11px] text-slate-500 italic pl-3">
                  ... dan {selectedIds.length - 6} barang lainnya terpilih.
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
                onClick={handleConfirmBulkDelete}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedIds.length} Barang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK RESMI BUKU INVENTARIS SARPRAS (KIR) DENGAN KOP SURAT */}
      {isKirPrintModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsKirPrintModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn relative">
            {/* Top Bar Controls */}
            <div className="shrink-0 p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Pratinjau Cetak Buku Inventaris Sarana Kerja (KIR)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsKirPrintModalOpen(false)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-900 bg-white font-serif leading-relaxed text-xs sm:text-sm print:p-0 print:overflow-visible">
              {/* Kop Surat Resmi Sekolah dengan Logo Kiri & Kanan */}
              <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-4" />

              {/* Judul Dokumen KIR */}
              <div className="text-center mb-6 space-y-1">
                <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                  BUKU INDUK INVENTARIS SARANA PRASARANA KERJA (KIR)
                </h4>
                <div className="text-xs font-sans text-slate-600">
                  Unit Kerja: <strong>{roleTitle}</strong> · Satuan Pendidikan: <strong>{schoolConfig.namaSekolah}</strong>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Tabel Inventaris */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[11px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 print:bg-slate-200">
                      <th className="py-2 px-2 text-center w-8 border border-slate-400">No</th>
                      <th className="py-2 px-2 border border-slate-400">Kode Barang</th>
                      <th className="py-2 px-2.5 border border-slate-400">Nama Barang & Merk / Tipe</th>
                      <th className="py-2 px-2 border border-slate-400">Kategori</th>
                      <th className="py-2 px-2 text-center border border-slate-400">Jumlah</th>
                      <th className="py-2 px-2 text-center border border-slate-400">Kondisi</th>
                      <th className="py-2 px-2 border border-slate-400">Lokasi Simpan</th>
                      <th className="py-2 px-2 text-center border border-slate-400">Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleInventories.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500 italic border border-slate-300">
                          Belum ada data barang inventaris yang tercatat untuk unit kerja ini.
                        </td>
                      </tr>
                    ) : (
                      roleInventories.map((it, idx) => (
                        <tr key={it.id} className="border-b border-slate-300">
                          <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-mono text-[10px] border border-slate-300">{it.kodeBarang}</td>
                          <td className="py-1.5 px-2.5 border border-slate-300">
                            <span className="font-bold text-slate-900 block">{it.namaBarang}</span>
                            <span className="text-[10px] text-slate-500 block">{it.merkModel || '-'}</span>
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300">{it.kategori}</td>
                          <td className="py-1.5 px-2 text-center font-bold border border-slate-300">{it.jumlah} {it.satuan}</td>
                          <td className="py-1.5 px-2 text-center border border-slate-300">
                            <span className={`text-[10px] font-bold ${
                              it.kondisi === 'Baik' ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {it.kondisi}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300">{it.lokasiPenyimpanan}</td>
                          <td className="py-1.5 px-2 text-center font-mono border border-slate-300">{it.tahunPengadaan || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 print:bg-slate-200">
                    <tr>
                      <td colSpan={4} className="py-2 px-2 text-center uppercase text-[10px]">
                        Total Aset Terdata: {roleInventories.length} Jenis Barang
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-900">
                        {roleInventories.reduce((s, i) => s + (Number(i.jumlah) || 1), 0)} Unit
                      </td>
                      <td colSpan={3} className="py-2 px-2 text-slate-600 text-[10px]">
                        Baik: {countBaik} · Rusak Ringan: {countRusakRingan} · Rusak Berat: {countRusakBerat}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Lembar Tanda Tangan Pengesahan KIR */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center font-sans text-xs break-inside-avoid">
                <div className="flex flex-col items-center">
                  <div className="text-slate-600">Mengetahui,</div>
                  <div className="font-semibold text-slate-800 mt-0.5">Kepala {schoolConfig.namaSekolah}</div>
                  <div className="h-20 flex items-center justify-center">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="font-bold text-slate-900 underline text-xs">
                    {formatOfficialNameWithDegree(schoolConfig.kepalaSekolah.nama)}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    NIP: {schoolConfig.kepalaSekolah.nip}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-slate-600">
                    {[schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || 'Sekolah'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">Petugas / Penanggung Jawab Sarpras</div>
                  <div className="h-20 flex items-center justify-center">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="font-bold text-slate-900 underline text-xs">
                    {formatOfficialNameWithDegree(schoolConfig.operatorProfiles?.[effectiveRole]?.nama || 'Petugas Layanan Operasional')}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    NIP: {schoolConfig.operatorProfiles?.[effectiveRole]?.nip || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Footer */}
            <div className="shrink-0 p-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between no-print">
              <span className="text-xs text-slate-600 font-medium">Buku Inventaris (KIR) Siap Cetak</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsKirPrintModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
