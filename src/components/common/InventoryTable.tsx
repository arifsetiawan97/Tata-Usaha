import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, RoleType } from '../../types';
import { exportInventoryToCsv, parseInventoryCsv } from '../../data/taskPresets';
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
  Check
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
  const { inventories, addInventory, updateInventory, deleteInventory, importInventories, currentRole } = useApp();
  const effectiveRole = role || currentRole || 'TU';
  const roleTitle = effectiveRole === 'TU' ? 'Tata Usaha' : effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [importStatus, setImportStatus] = useState('');

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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
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
    </div>
  );
};
