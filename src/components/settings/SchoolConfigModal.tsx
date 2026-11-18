import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolConfig, RoleType } from '../../types';
import { KopSurat } from '../common/KopSurat';
import { X, Save, Building, UserCheck, Image as ImageIcon, Upload, Download } from 'lucide-react';

interface SchoolConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolConfigModal: React.FC<SchoolConfigModalProps> = ({ isOpen, onClose }) => {
  const {
    schoolConfig,
    updateSchoolConfig,
    exportBackupJson,
    restoreFromBackupJson,
    currentRole,
    currentUser
  } = useApp();
  const [formData, setFormData] = useState<SchoolConfig>(schoolConfig);
  const [activeTab, setActiveTab] = useState<'identitas' | 'kepsek' | 'operator' | 'kop' | 'backup'>('identitas');
  const [restoreFeedback, setRestoreFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(schoolConfig);
      setRestoreFeedback(null);
    }
  }, [isOpen, schoolConfig]);

  if (!isOpen) return null;

  const activeOperatorRole: RoleType | null = currentUser?.role || currentRole;
  const visibleOperatorRoleKeys: RoleType[] = activeOperatorRole
    ? [activeOperatorRole]
    : ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolConfig(formData);
    onClose();
  };

  const handleUploadLogoKabupaten = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        setFormData(prev => ({ ...prev, logoKabupatenUrl: val, logoKopKiri: val }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoSekolah = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        setFormData(prev => ({ ...prev, logoSekolahUrl: val, logoKopKanan: val }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoAplikasi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, logoAplikasiUrl: event.target?.result as string }));
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
            setRestoreFeedback({ ok: true, text: 'Data cadangan berhasil dipulihkan!' });
            setTimeout(() => onClose(), 800);
          } else {
            setRestoreFeedback({ ok: false, text: 'Format berkas tidak sesuai.' });
          }
        } catch (err) {
          setRestoreFeedback({ ok: false, text: 'Gagal membaca berkas JSON.' });
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
              Konfigurasi identitas sekolah, Kepala Sekolah, dan NIP/NIPPK operator
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
            Kop Surat
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.desaKecamatan || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, desaKecamatan: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    placeholder="Kecamatan..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten/Kota</label>
                  <input
                    type="text"
                    value={formData.kabupatenKota || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kabupatenKota: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    placeholder="Kabupaten/Kota..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Provinsi (Opsional)</label>
                    {formData.provinsi && formData.provinsi.trim() && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, provinsi: '' }))}
                        className="text-[10px] text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer"
                        title="Kosongkan provinsi dari baris alamat"
                      >
                        Hapus / Kosongkan
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.provinsi || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, provinsi: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    placeholder="Kosongkan jika tidak dipakai pada alamat"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Kosongkan jika tidak ingin mencantumkan nama provinsi di baris alamat kop surat.
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.kodePos || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodePos: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    placeholder="Kode Pos..."
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

              {/* LIVE PRATINJAU KOP SURAT REAL-TIME */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pratinjau Langsung Kop Surat (Live Preview Sesuai Keinginan Pengguna)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 italic">
                    Tampilan real-time persis seperti di laporan cetak
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-2xs overflow-x-auto">
                  <KopSurat config={formData} />
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
                    value={formData.kepalaSekolah.nama}
                    placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd. (Kosongkan jika ingin format titik-titik)"
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
                      value={formData.kepalaSekolah.nip}
                      placeholder="Contoh: 19740510 199802 1 003"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        kepalaSekolah: { ...prev.kepalaSekolah, nip: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operator' && (
            <div className="space-y-4">
              {visibleOperatorRoleKeys.map(roleKey => {
                const op = formData.operatorProfiles[roleKey] || {
                  nama: currentUser?.namaLengkap || '',
                  nip: '',
                  jabatan: roleKey === 'PERPUS' ? 'Pengelola Perpustakaan' : 'Laboran Lab IPA',
                  signatureType: 'script',
                  signatureData: ''
                };
                const label = 
                  roleKey === 'TU' ? 'Operator Tata Usaha' : 
                  roleKey === 'PENJAGA' ? 'Petugas Penjaga Sekolah' : 
                  roleKey === 'SERVICE' ? 'Petugas Layanan Kebersihan (Service)' :
                  roleKey === 'PERPUS' ? 'Pengelola Perpustakaan Sekolah' : 'Laboran / Pengelola Lab IPA';
                return (
                  <div key={roleKey} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>{label}</span>
                      </h4>
                      {currentUser && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Akun aktif: @{currentUser.username}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Menampilkan data petugas &amp; NIP/NIPPK khusus layanan Anda untuk lembar pengesahan.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nama Petugas</label>
                        <input
                          type="text"
                          value={op.nama}
                          placeholder="Nama lengkap & gelar (atau kosongkan)"
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
                          value={op.nip}
                          placeholder="Nomor NIP / NIPPK"
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
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                Kop surat resmi 3 Kolom & Logo Aplikasi:
                <br />- <strong>Kolom 1 (Kiri)</strong>: Logo Kabupaten / Lambang Daerah (Unggah JPEG/PNG)
                <br />- <strong>Kolom 2 (Tengah)</strong>: Identitas Satuan Pendidikan & Alamat Lengkap
                <br />- <strong>Kolom 3 (Kanan)</strong>: Logo Sekolah / Tut Wuri Handayani (Unggah JPEG/PNG)
                <br />- <strong>Logo Aplikasi</strong>: Logo identitas sistem SI-OPS pada bilah navigasi dan portal masuk
              </div>

              {/* SECTION: UPLOAD LOGO KOP SURAT & LOGO APLIKASI */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Pengaturan Logo Kop Surat & Logo Aplikasi (Format JPEG / PNG)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. LOGO KABUPATEN */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block">1. Logo Kabupaten / Pemda</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Posisi: Kolom Kiri Kop Surat</span>
                    </div>

                    <div className="h-16 flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded p-1">
                      {formData.logoKabupatenUrl ? (
                        <img src={formData.logoKabupatenUrl} alt="Logo Kab" className="max-h-14 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Logo Lambang Default</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[10.5px] font-semibold transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Upload JPEG</span>
                        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleUploadLogoKabupaten} className="hidden" />
                      </label>
                      {formData.logoKabupatenUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoKabupatenUrl: '', logoKopKiri: '' }))}
                          className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-semibold border border-rose-200"
                          title="Kembalikan ke lambang default"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. LOGO SEKOLAH */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block">2. Logo Sekolah / Tut Wuri</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Posisi: Kolom Kanan Kop Surat</span>
                    </div>

                    <div className="h-16 flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded p-1">
                      {formData.logoSekolahUrl ? (
                        <img src={formData.logoSekolahUrl} alt="Logo Sekolah" className="max-h-14 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Tut Wuri Handayani Default</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[10.5px] font-semibold transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Upload JPEG</span>
                        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleUploadLogoSekolah} className="hidden" />
                      </label>
                      {formData.logoSekolahUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoSekolahUrl: '', logoKopKanan: '' }))}
                          className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-semibold border border-rose-200"
                          title="Kembalikan ke lambang default"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. LOGO APLIKASI */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block">3. Logo Aplikasi SI-OPS</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Posisi: Header & Halaman Masuk</span>
                    </div>

                    <div className="h-16 flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded p-1">
                      {formData.logoAplikasiUrl ? (
                        <img src={formData.logoAplikasiUrl} alt="Logo App" className="max-h-14 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Logo SI-OPS Standar</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded text-[10.5px] font-semibold transition-colors">
                        <Upload className="w-3 h-3 text-emerald-600" />
                        <span>Ganti Logo JPEG</span>
                        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleUploadLogoAplikasi} className="hidden" />
                      </label>
                      {formData.logoAplikasiUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoAplikasiUrl: '' }))}
                          className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-semibold border border-rose-200"
                          title="Kembalikan ke logo standar"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
                {restoreFeedback && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg border text-[11px] font-medium ${
                      restoreFeedback.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {restoreFeedback.text}
                  </div>
                )}
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
