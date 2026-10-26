import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, RoleType } from '../../types';
import { exportInventoryToCsv, parseInventoryCsv } from '../../data/taskPresets';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
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
  const { inventories, addInventory, updateInventory, deleteInventory, importInventories, currentRole, schoolConfig } = useApp();
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

  const handleDirectPrintKir = () => {
    const printWindow = window.open('', '_blank');
    const operator = schoolConfig.operatorProfiles?.[effectiveRole] || {
      nama: 'Petugas Layanan Operasional',
      nip: '-',
      jabatan: roleTitle
    };
    const items = inventories.filter(i => i.role === effectiveRole);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Buku Inventaris Sarana Kerja - ${roleTitle} - ${schoolConfig.namaSekolah}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; padding: 20px; color: #111; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h3 { margin: 0; font-size: 13pt; text-transform: uppercase; }
            .header h2 { margin: 2px 0; font-size: 15pt; }
            .header p { margin: 2px 0; font-size: 9pt; color: #444; }
            .title { text-align: center; margin: 15px 0; font-weight: bold; font-size: 12pt; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
            th, td { border: 1px solid #000; padding: 5px 8px; }
            th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
            .signatures { margin-top: 35px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .sig-box { width: 45%; text-align: center; font-size: 9.5pt; }
            @page { size: A4 portrait; margin: 1.5cm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>PEMERINTAH DAERAH · DINAS PENDIDIKAN</h3>
            <h2>${schoolConfig.namaSekolah.toUpperCase()}</h2>
            <p>${schoolConfig.alamat || 'Alamat Sekolah'} · Telp: ${schoolConfig.telepon || '-'} · Email: ${schoolConfig.email || '-'}</p>
          </div>

          <div class="title">BUKU INDUK INVENTARIS SARANA PRASARANA KERJA (KIR)</div>
          <p style="text-align: center; font-size: 9pt; margin-top: -10px;">Unit Kerja: <strong>${roleTitle}</strong> · Tanggal Cetak: ${dateStr}</p>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th>Kode Barang</th>
                <th>Nama Barang & Merk / Tipe</th>
                <th>Kategori</th>
                <th>Jml</th>
                <th>Kondisi</th>
                <th>Lokasi Simpan</th>
                <th>Tahun</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-family: monospace;">${it.kodeBarang}</td>
                  <td><strong>${it.namaBarang}</strong><br><small style="color: #555;">${it.merkModel || '-'}</small></td>
                  <td>${it.kategori}</td>
                  <td style="text-align: center;">${it.jumlah} ${it.satuan}</td>
                  <td style="text-align: center;">${it.kondisi}</td>
                  <td>${it.lokasiPenyimpanan}</td>
                  <td style="text-align: center;">${it.tahunPengadaan || '-'}</td>
                  <td>${it.keterangan || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signatures" style="display: table; width: 100%; margin-top: 40px;">
            <div style="display: table-cell; width: 50%; text-align: center;">
              Mengetahui,<br>
              Kepala ${schoolConfig.namaSekolah}<br><br><br><br>
              <strong>( ${formatOfficialNameWithDegree(schoolConfig.kepalaSekolah.nama)} )</strong><br>
              NIP. ${schoolConfig.kepalaSekolah.nip}
            </div>
            <div style="display: table-cell; width: 50%; text-align: center;">
              ${[schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] ? `${[schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0]}, ` : ''}${dateStr}<br>
              Petugas / Penanggung Jawab Sarpras,<br><br><br><br>
              <strong>( ${formatOfficialNameWithDegree(operator.nama)} )</strong><br>
              NIP. ${operator.nip}
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
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

  const handleDownloadTemplateCsv = () => {
    const csvContent = exportInventoryToCsv(roleInventories);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_inventaris_${effectiveRole.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

              {/* Import Button */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                title="Impor dari berkas CSV atau unduh templat"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impor CSV</span>
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

      {/* Table Container - Mobile friendly responsive scroll */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white print:border-black print:rounded-none">
        <table className="w-full text-left text-xs border-collapse min-w-[650px] sm:min-w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-semibold print:bg-slate-200 print:text-black print:border-black">
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
                <td colSpan={isPrintVersion || readOnly ? 8 : 9} className="py-6 text-center text-slate-400 italic">
                  Belum ada data inventaris untuk kategori ini.
                </td>
              </tr>
            ) : (
              roleInventories.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors print:hover:bg-transparent">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                Impor & Ekspor Data Inventaris ({roleTitle})
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="font-bold text-blue-900">Format Template CSV Inventaris:</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Unduh template format CSV yang sudah siap diisi menggunakan Microsoft Excel atau Google Sheets.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV Inventaris</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50">
                <Upload className="w-7 h-7 text-blue-600 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-800">Unggah Berkas CSV Inventaris</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Kolom otomatis dipetakan ke buku inventaris</p>
                
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-xs">
                  <span>Pilih Berkas CSV</span>
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvImport} className="hidden" />
                </label>
              </div>

              {importStatus && (
                <p className="font-semibold text-center text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                  {importStatus}
                </p>
              )}
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
    </div>
  );
};
