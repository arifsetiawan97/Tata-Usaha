import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolConfig, RoleType } from '../../types';
import { X, Save, Building, UserCheck, Stamp, Image as ImageIcon, Upload, Download } from 'lucide-react';

interface SchoolConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolConfigModal: React.FC<SchoolConfigModalProps> = ({ isOpen, onClose }) => {
  const { schoolConfig, updateSchoolConfig, exportBackupJson, restoreFromBackupJson } = useApp();
  const [formData, setFormData] = useState<SchoolConfig>(schoolConfig);
  const [activeTab, setActiveTab] = useState<'identitas' | 'kepsek' | 'operator' | 'kop' | 'backup'>('identitas');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolConfig(formData);
    onClose();
  };

  const handleUploadStempel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, customStempelUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadKepsekSig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          kepalaSekolah: { ...prev.kepalaSekolah, signatureImage: event.target?.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const ok = restoreFromBackupJson(json);
          if (ok) {
            alert('Data cadangan berhasil dipulihkan!');
            onClose();
          } else {
            alert('Format berkas tidak sesuai.');
          }
        } catch (err) {
          alert('Gagal membaca berkas JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-4 sm:my-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Pengaturan Satuan Pendidikan & Lembar Pengesahan
            </h3>
            <p className="text-[11px] text-slate-500">
              Konfigurasi identitas sekolah, Kepala Sekolah, NIP/NIPPK operator, dan cap stempel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher - Responsive horizontal scroll */}
        <div className="flex border-b border-slate-200 px-4 sm:px-5 pt-2 gap-2 text-xs overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('identitas')}
            className={`pb-2 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'identitas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Identitas Sekolah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kepsek')}
            className={`pb-2 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'kepsek'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kepala Sekolah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operator')}
            className={`pb-2 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'operator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Operator (NIP/NIPPK)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kop')}
            className={`pb-2 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'kop'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kop & Stempel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cadangkan Data
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {activeTab === 'identitas' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pemerintah Daerah (Baris 1 Kop Surat)</label>
                <input
                  type="text"
                  required
                  value={formData.pemerintahDaerah}
                  onChange={(e) => setFormData(prev => ({ ...prev, pemerintahDaerah: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dinas Pendidikan (Baris 2 Kop Surat)</label>
                <input
                  type="text"
                  required
                  value={formData.dinasPendidikan}
                  onChange={(e) => setFormData(prev => ({ ...prev, dinasPendidikan: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Satuan Pendidikan (Baris 3 Kop Surat)</label>
                <input
                  type="text"
                  required
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaSekolah: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    required
                    value={formData.npsn}
                    onChange={(e) => setFormData(prev => ({ ...prev, npsn: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NSS</label>
                  <input
                    type="text"
                    value={formData.nss}
                    onChange={(e) => setFormData(prev => ({ ...prev, nss: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan</label>
                <input
                  type="text"
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.desaKecamatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, desaKecamatan: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten/Kota</label>
                  <input
                    type="text"
                    value={formData.kabupatenKota}
                    onChange={(e) => setFormData(prev => ({ ...prev, kabupatenKota: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.kodePos}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodePos: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData(prev => ({ ...prev, telepon: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email / Pos-el</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Website / Laman</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kepsek' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900">Kepala Satuan Pendidikan (Mengetahui di Sisi Kiri Dokumen)</h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={formData.kepalaSekolah.nama}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      kepalaSekolah: { ...prev.kepalaSekolah, nama: e.target.value }
                    }))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIP</label>
                    <input
                      type="text"
                      required
                      value={formData.kepalaSekolah.nip}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        kepalaSekolah: { ...prev.kepalaSekolah, nip: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah.pangkatGolongan || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        kepalaSekolah: { ...prev.kepalaSekolah, pangkatGolongan: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                      placeholder="Pembina Utama Muda, IV/c"
                    />
                  </div>
                </div>

                {/* Upload Foto TTD Kepala Sekolah */}
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1">Upload File Tanda Tangan Kepala Sekolah (Opsional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-medium text-slate-700">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pilih Foto TTD (PNG/JPG)</span>
                      <input type="file" accept="image/*" onChange={handleUploadKepsekSig} className="hidden" />
                    </label>
                    {formData.kepalaSekolah.signatureImage && (
                      <div className="flex items-center gap-2 border border-slate-300 p-1 rounded bg-white">
                        <img src={formData.kepalaSekolah.signatureImage} alt="TTD Kepsek" className="h-8 max-w-[100px] object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            kepalaSekolah: { ...prev.kepalaSekolah, signatureImage: undefined }
                          }))}
                          className="text-rose-600 hover:text-rose-800 text-[10px]"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operator' && (
            <div className="space-y-4">
              {(['TU', 'PENJAGA', 'SERVICE'] as RoleType[]).map(roleKey => {
                const op = formData.operatorProfiles[roleKey];
                const label = roleKey === 'TU' ? 'Operator Tata Usaha' : roleKey === 'PENJAGA' ? 'Petugas Penjaga Sekolah' : 'Petugas Layanan Kebersihan (Service)';
                return (
                  <div key={roleKey} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900">{label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nama Petugas</label>
                        <input
                          type="text"
                          required
                          value={op.nama}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            operatorProfiles: {
                              ...prev.operatorProfiles,
                              [roleKey]: { ...op, nama: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">NIP atau NIPPK</label>
                        <input
                          type="text"
                          required
                          value={op.nip}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            operatorProfiles: {
                              ...prev.operatorProfiles,
                              [roleKey]: { ...op, nip: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'kop' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                Kop surat resmi 3 Kolom:
                <br />- <strong>Kolom 1</strong>: Logo Kabupaten / Lambang Daerah
                <br />- <strong>Kolom 2</strong>: Identitas Resmi Sekolah (Pemerintah Daerah, Dinas, NPSN, Alamat)
                <br />- <strong>Kolom 3</strong>: Logo Tut Wuri Handayani / Lambang Sekolah
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teks Melingkar Atas Stempel</label>
                <input
                  type="text"
                  value={formData.stempelTextLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, stempelTextLine1: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  placeholder="Contoh: DINAS PENDIDIKAN KOTA BOGOR"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teks Melingkar Bawah Stempel</label>
                <input
                  type="text"
                  value={formData.stempelTextLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, stempelTextLine2: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  placeholder="Contoh: SMP NEGERI 1 BOGOR RAYA"
                />
              </div>

              {/* Upload Cap Stempel Custom */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">Upload File Cap Stempel Sekolah Resmi (Opsional)</label>
                <p className="text-[10.5px] text-slate-500 mb-2">
                  Jika Anda memiliki gambar cap stempel fisik sekolah (format PNG transparan), Anda dapat mengunggahnya di sini:
                </p>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-medium text-slate-700">
                    <Stamp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Cap Stempel PNG</span>
                    <input type="file" accept="image/*" onChange={handleUploadStempel} className="hidden" />
                  </label>

                  {formData.customStempelUrl && (
                    <div className="flex items-center gap-2 border border-slate-300 p-1 rounded bg-white">
                      <img src={formData.customStempelUrl} alt="Cap Stempel" className="h-10 w-10 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, customStempelUrl: undefined }))}
                        className="text-rose-600 hover:text-rose-800 text-[10px]"
                      >
                        Gunakan Stempel Default
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.stempelEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, stempelEnabled: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Tampilkan Cap Stempel Resmi di Lembar Pengesahan</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Cadangkan / Ekspor Data Sekolah</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Unduh seluruh basis data laporan, tugas harian, inventaris, dan konfigurasi sekolah ke dalam file cadangan JSON mandiri agar tidak akan pernah hilang.
                </p>
                <button
                  type="button"
                  onClick={exportBackupJson}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh File Cadangan (JSON)</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Pulihkan Data dari Berkas Cadangan</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Pilih file JSON cadangan yang telah diunduh sebelumnya untuk mengembalikan seluruh catatan tugas dan inventaris.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas Cadangan JSON</span>
                  <input type="file" accept=".json,application/json" onChange={handleRestoreFile} className="hidden" />
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
