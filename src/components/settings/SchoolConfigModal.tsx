import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { KopBorderStyle, RoleType, SchoolConfig, SchoolOfficer } from '../../types';
import { KopSurat } from '../common/KopSurat';
import { KOP_BORDER_OPTIONS, extractBaseLetterhead, getUserIsolationKey } from '../../utils/letterheadHelper';
import { formatOfficialNameWithDegree, formatOfficialNipOrPppk } from '../../utils/formatters';
import {
  X,
  Save,
  Building,
  UserCheck,
  Image as ImageIcon,
  Upload,
  Download,
  RotateCcw,
  ShieldCheck,
  PenTool,
  Eye,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface SchoolConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolConfigModal: React.FC<SchoolConfigModalProps> = ({ isOpen, onClose }) => {
  const {
    schoolConfig,
    effectiveSchoolConfig,
    hasCustomLetterhead,
    hasCustomSignature,
    updateSchoolConfig,
    saveUserLetterhead,
    resetUserLetterhead,
    saveUserSignature,
    resetUserSignature,
    exportBackupJson,
    restoreFromBackupJson,
    currentRole,
    currentUser
  } = useApp();

  const activeOperatorRole: RoleType = currentUser?.role || currentRole || 'TU';

  const [kopForm, setKopForm] = useState({
    pemerintahDaerah: effectiveSchoolConfig.pemerintahDaerah || '',
    dinasPendidikan: effectiveSchoolConfig.dinasPendidikan || '',
    namaSekolah: effectiveSchoolConfig.namaSekolah || '',
    npsn: effectiveSchoolConfig.npsn || '',
    nss: effectiveSchoolConfig.nss || '',
    alamat: effectiveSchoolConfig.alamat || '',
    desaKecamatan: effectiveSchoolConfig.desaKecamatan || '',
    kabupatenKota: effectiveSchoolConfig.kabupatenKota || '',
    provinsi: effectiveSchoolConfig.provinsi || '',
    kodePos: effectiveSchoolConfig.kodePos || '',
    telepon: effectiveSchoolConfig.telepon || '',
    email: effectiveSchoolConfig.email || '',
    website: effectiveSchoolConfig.website || '',
    logoKabupatenUrl: effectiveSchoolConfig.logoKabupatenUrl || '',
    logoSekolahUrl: effectiveSchoolConfig.logoSekolahUrl || '',
    logoKopKiri: effectiveSchoolConfig.logoKopKiri || effectiveSchoolConfig.logoKabupatenUrl || '',
    logoKopKanan: effectiveSchoolConfig.logoKopKanan || effectiveSchoolConfig.logoSekolahUrl || '',
    kopBorderStyle: (effectiveSchoolConfig.kopBorderStyle || 'double_thick') as KopBorderStyle
  });

  const [kepsekForm, setKepsekForm] = useState<SchoolOfficer>(
    effectiveSchoolConfig.kepalaSekolah || {
      nama: '',
      nip: '',
      jabatan: 'Kepala Satuan Pendidikan',
      signatureType: 'script',
      signatureData: ''
    }
  );

  const [wakasekForm, setWakasekForm] = useState<SchoolOfficer>(
    effectiveSchoolConfig.wakilKepalaSekolah || {
      nama: '',
      nip: '',
      jabatan: 'Wakil Kepala Sekolah',
      signatureType: 'script',
      signatureData: ''
    }
  );

  const [operatorForm, setOperatorForm] = useState<SchoolOfficer>(
    effectiveSchoolConfig.operatorProfiles?.[activeOperatorRole] || {
      nama: currentUser?.namaLengkap || '',
      nip: '',
      jabatan: 'Petugas Layanan Operasional',
      signatureType: 'script',
      signatureData: ''
    }
  );

  const [logoAplikasiUrl, setLogoAplikasiUrl] = useState(
    effectiveSchoolConfig.logoAplikasiUrl || schoolConfig.logoAplikasiUrl || ''
  );
  const [activeTab, setActiveTab] = useState<'kop' | 'pengesahan' | 'aplikasi' | 'backup'>('kop');
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const wasOpenKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      wasOpenKeyRef.current = null;
      return;
    }
    const openKey = `${getUserIsolationKey(currentUser) || 'anon'}:${activeOperatorRole}`;
    if (wasOpenKeyRef.current === openKey) {
      return;
    }
    wasOpenKeyRef.current = openKey;

    setKopForm({
      pemerintahDaerah: effectiveSchoolConfig.pemerintahDaerah || '',
      dinasPendidikan: effectiveSchoolConfig.dinasPendidikan || '',
      namaSekolah: effectiveSchoolConfig.namaSekolah || '',
      npsn: effectiveSchoolConfig.npsn || '',
      nss: effectiveSchoolConfig.nss || '',
      alamat: effectiveSchoolConfig.alamat || '',
      desaKecamatan: effectiveSchoolConfig.desaKecamatan || '',
      kabupatenKota: effectiveSchoolConfig.kabupatenKota || '',
      provinsi: effectiveSchoolConfig.provinsi || '',
      kodePos: effectiveSchoolConfig.kodePos || '',
      telepon: effectiveSchoolConfig.telepon || '',
      email: effectiveSchoolConfig.email || '',
      website: effectiveSchoolConfig.website || '',
      logoKabupatenUrl: effectiveSchoolConfig.logoKabupatenUrl || '',
      logoSekolahUrl: effectiveSchoolConfig.logoSekolahUrl || '',
      logoKopKiri: effectiveSchoolConfig.logoKopKiri || effectiveSchoolConfig.logoKabupatenUrl || '',
      logoKopKanan: effectiveSchoolConfig.logoKopKanan || effectiveSchoolConfig.logoSekolahUrl || '',
      kopBorderStyle: (effectiveSchoolConfig.kopBorderStyle || 'double_thick') as KopBorderStyle
    });
    setKepsekForm({
      ...(effectiveSchoolConfig.kepalaSekolah || {
        nama: '',
        nip: '',
        jabatan: 'Kepala Satuan Pendidikan',
        signatureType: 'script',
        signatureData: ''
      })
    });
    setWakasekForm({
      ...(effectiveSchoolConfig.wakilKepalaSekolah || {
        nama: '',
        nip: '',
        jabatan: 'Wakil Kepala Sekolah',
        signatureType: 'script',
        signatureData: ''
      })
    });
    setOperatorForm({
      ...(effectiveSchoolConfig.operatorProfiles?.[activeOperatorRole] || {
        nama: currentUser?.namaLengkap || '',
        nip: '',
        jabatan:
          activeOperatorRole === 'TU'
            ? 'Operator Tata Usaha'
            : activeOperatorRole === 'PENJAGA'
              ? 'Penjaga Sekolah'
              : activeOperatorRole === 'SERVICE'
                ? 'Petugas Layanan Kebersihan'
                : activeOperatorRole === 'PERPUS'
                  ? 'Pengelola Perpustakaan'
                  : 'Laboran IPA',
        signatureType: 'script',
        signatureData: ''
      })
    });
    setLogoAplikasiUrl(effectiveSchoolConfig.logoAplikasiUrl || schoolConfig.logoAplikasiUrl || '');
    setSaveFeedback(null);
    setRestoreFeedback(null);
  }, [isOpen, effectiveSchoolConfig, schoolConfig.logoAplikasiUrl, activeOperatorRole, currentUser]);

  const previewKopConfig: SchoolConfig = useMemo(
    () => ({
      ...effectiveSchoolConfig,
      ...kopForm
    }),
    [effectiveSchoolConfig, kopForm]
  );

  if (!isOpen) return null;

  const showTempFeedback = (text: string, ok = true) => {
    setSaveFeedback({ ok, text });
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleSaveKopMandiri = () => {
    saveUserLetterhead(kopForm);
    showTempFeedback(
      currentUser
        ? `Kop surat pribadi akun @${currentUser.username} tersimpan permanen tanpa memengaruhi pengguna lain.`
        : 'Pengaturan kop surat tersimpan permanen.'
    );
  };

  const handleResetKopMandiri = () => {
    resetUserLetterhead();
    const baseKop = extractBaseLetterhead(schoolConfig);
    setKopForm({
      pemerintahDaerah: baseKop.pemerintahDaerah || '',
      dinasPendidikan: baseKop.dinasPendidikan || '',
      namaSekolah: baseKop.namaSekolah || '',
      npsn: baseKop.npsn || '',
      nss: baseKop.nss || '',
      alamat: baseKop.alamat || '',
      desaKecamatan: baseKop.desaKecamatan || '',
      kabupatenKota: baseKop.kabupatenKota || '',
      provinsi: baseKop.provinsi || '',
      kodePos: baseKop.kodePos || '',
      telepon: baseKop.telepon || '',
      email: baseKop.email || '',
      website: baseKop.website || '',
      logoKabupatenUrl: baseKop.logoKabupatenUrl || '',
      logoSekolahUrl: baseKop.logoSekolahUrl || '',
      logoKopKiri: baseKop.logoKopKiri || baseKop.logoKabupatenUrl || '',
      logoKopKanan: baseKop.logoKopKanan || baseKop.logoSekolahUrl || '',
      kopBorderStyle: (baseKop.kopBorderStyle || 'double_thick') as KopBorderStyle
    });
    showTempFeedback('Kop surat akun Anda dikembalikan permanen ke Template Bawaan Sistem.');
  };

  const handleSavePengesahanMandiri = () => {
    saveUserSignature({
      kepalaSekolah: kepsekForm,
      wakilKepalaSekolah: wakasekForm,
      operatorProfile: operatorForm
    });
    showTempFeedback(
      currentUser
        ? `Lembar pengesahan tanda tangan akun @${currentUser.username} tersimpan permanen secara terisolasi.`
        : 'Lembar pengesahan tanda tangan tersimpan permanen.'
    );
  };

  const handleResetPengesahanMandiri = () => {
    resetUserSignature();
    setKepsekForm({ ...schoolConfig.kepalaSekolah });
    setWakasekForm({
      ...(schoolConfig.wakilKepalaSekolah || {
        nama: '',
        nip: '',
        jabatan: 'Wakil Kepala Sekolah',
        signatureType: 'script',
        signatureData: ''
      })
    });
    setOperatorForm({
      ...(schoolConfig.operatorProfiles?.[activeOperatorRole] || {
        nama: currentUser?.namaLengkap || '',
        nip: '',
        jabatan: 'Petugas Layanan Operasional',
        signatureType: 'script',
        signatureData: ''
      })
    });
    showTempFeedback('Lembar pengesahan akun Anda dikembalikan permanen ke Template Bawaan Sistem.');
  };

  const handleSaveLogoAplikasi = () => {
    updateSchoolConfig({ logoAplikasiUrl });
    showTempFeedback(
      currentUser
        ? `Logo aplikasi untuk akun @${currentUser.username} tersimpan permanen.`
        : 'Logo aplikasi berhasil diperbarui permanen.'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'kop') {
      saveUserLetterhead(kopForm);
    } else if (activeTab === 'pengesahan') {
      saveUserSignature({
        kepalaSekolah: kepsekForm,
        wakilKepalaSekolah: wakasekForm,
        operatorProfile: operatorForm
      });
    } else if (activeTab === 'aplikasi') {
      updateSchoolConfig({ logoAplikasiUrl });
    }
    onClose();
  };

  const handleUploadLogoKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        setKopForm((prev) => ({ ...prev, logoKabupatenUrl: val, logoKopKiri: val }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        setKopForm((prev) => ({ ...prev, logoSekolahUrl: val, logoKopKanan: val }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoAplikasi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoAplikasiUrl(event.target?.result as string);
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
        } catch {
          setRestoreFeedback({ ok: false, text: 'Gagal membaca berkas JSON.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const roleLabel =
    activeOperatorRole === 'TU'
      ? 'Operator Tata Usaha'
      : activeOperatorRole === 'PENJAGA'
        ? 'Petugas Penjaga Sekolah'
        : activeOperatorRole === 'SERVICE'
          ? 'Petugas Layanan Kebersihan (Service)'
          : activeOperatorRole === 'PERPUS'
            ? 'Pengelola Perpustakaan Sekolah'
            : 'Laboran / Pengelola Lab IPA';

  const previewPlaceDate = `${kopForm.kabupatenKota || kopForm.desaKecamatan || 'Teluk'}, ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-4 sm:my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-700" />
              <span>Manajemen Kop Surat &amp; Lembar Pengesahan Mandiri</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentUser ? (
                <>
                  Terisolasi khusus untuk akun <strong className="text-slate-700">@{currentUser.username}</strong> ({currentUser.namaLengkap}) · Perubahan tidak menimpa pengguna lain
                </>
              ) : (
                'Konfigurasi identitas kop surat, garis pembatas, dan lembar pengesahan tanda tangan'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-4 sm:px-5 pt-2 gap-3 text-xs overflow-x-auto whitespace-nowrap bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('kop')}
            className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kop'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Kop Surat Mandiri</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pengesahan')}
            className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pengesahan'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Lembar Pengesahan (Tanda Tangan)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aplikasi')}
            className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'aplikasi'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Logo Aplikasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangkan Data</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[76vh] overflow-y-auto text-xs">
          {saveFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                saveFeedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{saveFeedback.text}</span>
            </div>
          )}

          {/* TAB 1: KOP SURAT MANDIRI (MULTI-TENANT ISOLATED) */}
          {activeTab === 'kop' && (
            <div className="space-y-4">
              {/* Isolation Banner & Status */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900 block">
                      {hasCustomLetterhead
                        ? 'Mode Aktif: Kop Surat Pribadi (Tersimpan Eksklusif untuk Akun Anda)'
                        : 'Mode Aktif: Template Bawaan Sistem (Siap Diedit Menjadi Milik Instansi Anda)'}
                    </span>
                    <span>
                      Perubahan atau reset kop surat hanya berlaku pada akun Anda dan tidak menimpa kop surat milik pengguna lain.
                    </span>
                  </div>
                </div>
                {hasCustomLetterhead && currentUser && (
                  <button
                    type="button"
                    onClick={handleResetKopMandiri}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Bawaan</span>
                  </button>
                )}
              </div>

              {/* Logo Kiri & Kanan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Logo Kiri Kop Surat</span>
                    <span className="text-[10px] text-slate-500 block">
                      Lambang Pemerintah Daerah / Kementerian / Instansi
                    </span>
                  </div>
                  <div className="h-16 flex items-center justify-center bg-white border border-dashed border-slate-300 rounded p-1">
                    {(kopForm.logoKopKiri || kopForm.logoKabupatenUrl) ? (
                      <img
                        src={kopForm.logoKopKiri || kopForm.logoKabupatenUrl}
                        alt="Logo Kiri"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Lambang Pemda Bawaan</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-300 text-slate-700 rounded text-[11px] font-semibold">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Unggah Logo Kiri</span>
                      <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleUploadLogoKiri} className="hidden" />
                    </label>
                    {(kopForm.logoKopKiri || kopForm.logoKabupatenUrl) && (
                      <button
                        type="button"
                        onClick={() => setKopForm((prev) => ({ ...prev, logoKabupatenUrl: '', logoKopKiri: '' }))}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold border border-rose-200 cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Logo Kanan Kop Surat</span>
                    <span className="text-[10px] text-slate-500 block">
                      Logo Sekolah / Tut Wuri Handayani / Unit Kerja
                    </span>
                  </div>
                  <div className="h-16 flex items-center justify-center bg-white border border-dashed border-slate-300 rounded p-1">
                    {(kopForm.logoKopKanan || kopForm.logoSekolahUrl) ? (
                      <img
                        src={kopForm.logoKopKanan || kopForm.logoSekolahUrl}
                        alt="Logo Kanan"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Tut Wuri Bawaan</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 bg-white hover:bg-blue-50 border border-slate-300 text-slate-700 rounded text-[11px] font-semibold">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Unggah Logo Kanan</span>
                      <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleUploadLogoKanan} className="hidden" />
                    </label>
                    {(kopForm.logoKopKanan || kopForm.logoSekolahUrl) && (
                      <button
                        type="button"
                        onClick={() => setKopForm((prev) => ({ ...prev, logoSekolahUrl: '', logoKopKanan: '' }))}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold border border-rose-200 cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Instansi / Kementerian / Dinas / Satuan Pendidikan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Instansi Induk / Kementerian / Pemda (Baris 1)
                  </label>
                  <input
                    type="text"
                    value={kopForm.pemerintahDaerah}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, pemerintahDaerah: e.target.value }))}
                    placeholder="Contoh: PEMERINTAH KABUPATEN BATANG HARI"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dinas / Direktorat / Unit Induk (Baris 2)
                  </label>
                  <input
                    type="text"
                    value={kopForm.dinasPendidikan}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, dinasPendidikan: e.target.value }))}
                    placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Satuan Pendidikan / Instansi (Baris 3)
                  </label>
                  <input
                    type="text"
                    required
                    value={kopForm.namaSekolah}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, namaSekolah: e.target.value }))}
                    placeholder="Contoh: SMP NEGERI SATU ATAP TELUK"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
                    <input
                      type="text"
                      value={kopForm.npsn}
                      onChange={(e) => setKopForm((prev) => ({ ...prev, npsn: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NSS</label>
                    <input
                      type="text"
                      value={kopForm.nss}
                      onChange={(e) => setKopForm((prev) => ({ ...prev, nss: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan Lengkap</label>
                <input
                  type="text"
                  value={kopForm.alamat}
                  onChange={(e) => setKopForm((prev) => ({ ...prev, alamat: e.target.value }))}
                  placeholder="Contoh: Jl. Lintas Jambi - Muara Bulian KM. 45"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desa / Kecamatan</label>
                  <input
                    type="text"
                    value={kopForm.desaKecamatan}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, desaKecamatan: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={kopForm.kabupatenKota}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, kabupatenKota: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Provinsi (Opsional)</label>
                    {kopForm.provinsi.trim() && (
                      <button
                        type="button"
                        onClick={() => setKopForm((prev) => ({ ...prev, provinsi: '' }))}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={kopForm.provinsi}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, provinsi: e.target.value }))}
                    placeholder="Opsional..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={kopForm.kodePos}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, kodePos: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={kopForm.telepon}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, telepon: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pos-el / Email</label>
                  <input
                    type="text"
                    value={kopForm.email}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laman / Website</label>
                  <input
                    type="text"
                    value={kopForm.website}
                    onChange={(e) => setKopForm((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Jenis Garis Pembatas */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Jenis Garis Pembatas Kop Surat</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {KOP_BORDER_OPTIONS.map((opt) => {
                    const selected = kopForm.kopBorderStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setKopForm((prev) => ({ ...prev, kopBorderStyle: opt.id }))}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          selected
                            ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-semibold text-slate-900">{opt.label}</div>
                        <div className="mt-2 mb-1">
                          {opt.id === 'double_thick' && (
                            <>
                              <div className="h-[3px] bg-slate-900 w-full" />
                              <div className="h-[1px] bg-slate-800 w-full mt-[2px]" />
                            </>
                          )}
                          {opt.id === 'double' && (
                            <>
                              <div className="h-[2px] bg-slate-900 w-full" />
                              <div className="h-[2px] bg-slate-800 w-full mt-[2px]" />
                            </>
                          )}
                          {opt.id === 'solid_thick' && <div className="h-[3px] bg-slate-900 w-full" />}
                          {opt.id === 'solid_thin' && <div className="h-[1.5px] bg-slate-800 w-full" />}
                          {opt.id === 'dashed' && <div className="border-b-2 border-dashed border-slate-900 w-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE PREVIEW KOP SURAT */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Preview Kop Surat (Sebelum Disimpan)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveKopMandiri}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Kop Surat Saya</span>
                  </button>
                </div>
                <div className="p-3 bg-white border border-slate-300 rounded-lg overflow-x-auto">
                  <KopSurat config={previewKopConfig} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEMBAR PENGESAHAN TANDA TANGAN MANDIRI (MULTI-TENANT ISOLATED) */}
          {activeTab === 'pengesahan' && (
            <div className="space-y-4">
              {/* Isolation Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900 block">
                      {hasCustomSignature
                        ? 'Mode Aktif: Lembar Pengesahan Pribadi (Terisolasi untuk Akun Anda)'
                        : 'Mode Aktif: Template Bawaan Sistem (Siap Diedit Sesuai Petugas & Pimpinan Anda)'}
                    </span>
                    <span>
                      Data pimpinan &amp; petugas (NIP/NIPPK) pada tab ini hanya berlaku untuk akun Anda dan tidak mengubah akun pengguna lain.
                    </span>
                  </div>
                </div>
                {hasCustomSignature && currentUser && (
                  <button
                    type="button"
                    onClick={handleResetPengesahanMandiri}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Bawaan</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Peringkat 1 (Kiri): Pimpinan Tertinggi / Kepala Sekolah */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900">1. Kiri (Kepala Sekolah / Tertinggi)</h4>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      value={kepsekForm.jabatan || 'Kepala Satuan Pendidikan'}
                      onChange={(e) => setKepsekForm((prev) => ({ ...prev, jabatan: e.target.value }))}
                      placeholder="Contoh: Kepala Sekolah"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap &amp; Gelar</label>
                    <input
                      type="text"
                      value={kepsekForm.nama}
                      onChange={(e) => setKepsekForm((prev) => ({ ...prev, nama: e.target.value }))}
                      placeholder="Kosongkan jika titik-titik"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={kepsekForm.nip}
                      onChange={(e) => setKepsekForm((prev) => ({ ...prev, nip: e.target.value }))}
                      placeholder="Contoh: 19740510 199802 1 003"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Peringkat 2 (Tengah / Kanan): Wakil Kepala Sekolah (Opsional) */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900">2. Wakil Kepala Sekolah (Opsional)</h4>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan Wakil</label>
                    <input
                      type="text"
                      value={wakasekForm.jabatan || 'Wakil Kepala Sekolah'}
                      onChange={(e) => setWakasekForm((prev) => ({ ...prev, jabatan: e.target.value }))}
                      placeholder="Wakil Kepala Sekolah"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Wakil Kepsek &amp; Gelar</label>
                    <input
                      type="text"
                      value={wakasekForm.nama}
                      onChange={(e) => setWakasekForm((prev) => ({ ...prev, nama: e.target.value }))}
                      placeholder="Kosongkan jika tidak dipakai"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIP / NIPPK Wakil Kepsek</label>
                    <input
                      type="text"
                      value={wakasekForm.nip}
                      onChange={(e) => setWakasekForm((prev) => ({ ...prev, nip: e.target.value }))}
                      placeholder="Nomor NIP / NIPPK"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Peringkat Terakhir (Kanan): Operator / Petugas Bersangkutan Saja */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>3. Kanan ({roleLabel})</span>
                    </h4>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan Petugas</label>
                    <input
                      type="text"
                      value={operatorForm.jabatan || roleLabel}
                      onChange={(e) => setOperatorForm((prev) => ({ ...prev, jabatan: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Petugas &amp; Gelar</label>
                    <input
                      type="text"
                      value={operatorForm.nama}
                      onChange={(e) => setOperatorForm((prev) => ({ ...prev, nama: e.target.value }))}
                      placeholder="Nama petugas bersangkutan"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIP atau NIPPK</label>
                    <input
                      type="text"
                      value={operatorForm.nip}
                      onChange={(e) => setOperatorForm((prev) => ({ ...prev, nip: e.target.value }))}
                      placeholder="Nomor NIP / NIPPK"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW LEMBAR PENGESAHAN (TERTINGGI KIRI -> TERENDAH KANAN) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Preview Urutan Resmi (Tertinggi Kiri → Terendah Kanan)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSavePengesahanMandiri}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pengesahan Saya</span>
                  </button>
                </div>

                <div className="p-5 bg-white border border-slate-300 rounded-lg font-serif text-slate-900">
                  <div className={`grid ${wakasekForm.nama.trim() ? 'grid-cols-3' : 'grid-cols-2'} gap-5 text-center text-xs`}>
                    <div className="flex flex-col items-center">
                      <div className="text-slate-600">Mengetahui / Mengesahkan,</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {kepsekForm.jabatan || 'Kepala Sekolah'}
                      </div>
                      <div className="h-14" />
                      <div className="font-bold underline">
                        {kepsekForm.nama.trim()
                          ? formatOfficialNameWithDegree(kepsekForm.nama)
                          : '( .................................................. )'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                        {kepsekForm.nip.trim()
                          ? formatOfficialNipOrPppk(kepsekForm.nip, { defaultPrefix: 'NIP.' })
                          : 'NIP. .................................................'}
                      </div>
                    </div>

                    {wakasekForm.nama.trim() && (
                      <div className="flex flex-col items-center">
                        <div className="text-slate-600">Wakil Kepala Sekolah,</div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {wakasekForm.jabatan || 'Wakil Kepala Sekolah'}
                        </div>
                        <div className="h-14" />
                        <div className="font-bold underline">
                          {formatOfficialNameWithDegree(wakasekForm.nama)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                          {wakasekForm.nip.trim()
                            ? formatOfficialNipOrPppk(wakasekForm.nip, { defaultPrefix: 'NIP.' })
                            : 'NIP. .................................................'}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center">
                      <div className="text-slate-600">{previewPlaceDate}</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {operatorForm.jabatan || roleLabel}
                      </div>
                      <div className="h-14" />
                      <div className="font-bold underline">
                        {operatorForm.nama.trim()
                          ? formatOfficialNameWithDegree(operatorForm.nama)
                          : '( .................................................. )'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                        {operatorForm.nip.trim()
                          ? formatOfficialNipOrPppk(operatorForm.nip, { defaultPrefix: 'NIP.' })
                          : 'NIP / NIPPK. .................................................'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO APLIKASI */}
          {activeTab === 'aplikasi' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Logo Aplikasi SI-OPS (Header &amp; Portal Masuk)</span>
                </h4>
                <div className="h-24 flex items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg p-2">
                  {logoAplikasiUrl ? (
                    <img src={logoAplikasiUrl} alt="Logo Aplikasi" className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Menggunakan logo default SI-OPS</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo Aplikasi (PNG/JPEG)</span>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleUploadLogoAplikasi} className="hidden" />
                  </label>
                  {logoAplikasiUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoAplikasiUrl('')}
                      className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold border border-rose-200 cursor-pointer"
                    >
                      Kembalikan Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveLogoAplikasi}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Logo Aplikasi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP DATA */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Cadangkan / Ekspor Data Sekolah</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Unduh seluruh basis data laporan, tugas harian, inventaris, dan konfigurasi ke dalam file cadangan JSON mandiri agar tidak hilang.
                </p>
                <button
                  type="button"
                  onClick={exportBackupJson}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Tutup
            </button>
            {activeTab !== 'backup' && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan &amp; Tutup</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
