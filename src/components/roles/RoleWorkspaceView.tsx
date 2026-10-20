import React, { useState } from 'react';
import { useApp, RoleSubTab } from '../../context/AppContext';
import { RoleType } from '../../types';
import { PenjagaView } from './PenjagaView';
import { TUView } from './TUView';
import { ServiceView } from './ServiceView';
import { PerpusView } from './PerpusView';
import { LabIpaView } from './LabIpaView';
import { TupoksiManagerView } from './TupoksiManagerView';
import { MonthlyReportView } from '../reports/MonthlyReportView';
import { AnnualReportView } from '../reports/AnnualReportView';
import { InventoryTable } from '../common/InventoryTable';
import { initialSchoolConfig } from '../../data/initialData';
import { 
  Shield, 
  Building2, 
  Sparkles, 
  BookOpen,
  FlaskConical,
  CalendarDays, 
  CheckSquare, 
  FileText, 
  Award, 
  Boxes,
  UserCheck,
  Printer,
  Bot
} from 'lucide-react';
import { AiAssistantModal } from '../common/AiAssistantModal';

interface RoleWorkspaceViewProps {
  role: RoleType;
  onOpenPrint: (reportType: 'monthly' | 'annual', data: any, options?: { autoPrint?: boolean }) => void;
}

export const RoleWorkspaceView: React.FC<RoleWorkspaceViewProps> = ({ role, onOpenPrint }) => {
  const { 
    schoolConfig, 
    tasks, 
    roleSubTabs, 
    setRoleSubTab, 
    tupoksiDefinitions,
    inventories,
    monthlyReports,
    generateMonthlyReportFromTasks
  } = useApp();

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const handleDirectPrintCurrentMonth = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const existing = monthlyReports.find(r => r.role === role && r.month === currentMonth && r.year === currentYear);
    const reportData = existing || generateMonthlyReportFromTasks(role, currentMonth, currentYear);
    onOpenPrint('monthly', reportData, { autoPrint: true });
  };

  const currentSubTab = roleSubTabs[role] || 'tasks';

  const operator = schoolConfig.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    jabatan: 'Operator'
  };
  const roleTasks = tasks.filter(t => t.role === role);
  const roleCompletedTasks = roleTasks.filter(t => t.status === 'selesai').length;
  const roleTupoksiItems = (tupoksiDefinitions[role]?.tupoksiList?.length || 0) + (tupoksiDefinitions[role]?.tugasTambahanList?.length || 0);
  const roleInventories = inventories.filter(i => i.role === role);

  const roleMeta = {
    PENJAGA: {
      title: 'Ruang Kerja Penjaga Sekolah',
      subtitle: 'Standar Keamanan, Sapras, Buka-Tutup Pintu & Ronda Lingkungan Sekolah',
      icon: Shield,
      themeBg: 'from-blue-900 via-slate-900 to-indigo-950',
      activeColor: 'bg-blue-600 text-white shadow-xs',
      sublabel: 'Keamanan & Sapras'
    },
    TU: {
      title: 'Ruang Kerja Tata Usaha (TU)',
      subtitle: 'Standar Administrasi Kepegawaian, Persuratan, Kesiswaan & Kearsipan',
      icon: Building2,
      themeBg: 'from-sky-900 via-slate-900 to-blue-950',
      activeColor: 'bg-sky-600 text-white shadow-xs',
      sublabel: 'Administrasi & Persuratan'
    },
    SERVICE: {
      title: 'Ruang Kerja Layanan Kebersihan (Service)',
      subtitle: 'Standar Sanitasi, Kebersihan Gedung, Pemilahan Sampah & Lingkungan Belajar',
      icon: Sparkles,
      themeBg: 'from-emerald-900 via-slate-900 to-teal-950',
      activeColor: 'bg-emerald-600 text-white shadow-xs',
      sublabel: 'Sanitasi & Lingkungan'
    },
    PERPUS: {
      title: 'Ruang Kerja Layanan Perpustakaan',
      subtitle: 'Standar Sirkulasi Koleksi, Pengolahan DDC/Barcode, Literasi & Perawatan Buku',
      icon: BookOpen,
      themeBg: 'from-purple-900 via-slate-900 to-indigo-950',
      activeColor: 'bg-purple-600 text-white shadow-xs',
      sublabel: 'Literasi & Bahan Pustaka'
    },
    LAB_IPA: {
      title: 'Ruang Kerja Laboratorium IPA',
      subtitle: 'Standar Penyiapan Praktikum Sains, Keselamatan K3, Kalibrasi & Inventaris Lab',
      icon: FlaskConical,
      themeBg: 'from-teal-900 via-slate-900 to-cyan-950',
      activeColor: 'bg-teal-600 text-white shadow-xs',
      sublabel: 'Praktikum & Laboran IPA'
    }
  }[role];

  const RoleIcon = roleMeta.icon;

  const subNavItems: Array<{
    id: RoleSubTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
  }> = [
    {
      id: 'tasks',
      label: 'Jurnal Tugas Harian',
      icon: CalendarDays,
      badge: `${roleTasks.length} tugas`
    },
    {
      id: 'tupoksi',
      label: 'Tugas Pokok & Tambahan',
      icon: CheckSquare,
      badge: `${roleTupoksiItems} butir`
    },
    {
      id: 'monthly',
      label: 'Laporan Bulanan',
      icon: FileText
    },
    {
      id: 'annual',
      label: 'Laporan Tahunan',
      icon: Award
    },
    {
      id: 'inventory',
      label: 'Inventaris Sarpras',
      icon: Boxes,
      badge: `${roleInventories.length} item`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header for this Role */}
      <div className={`p-5 rounded-2xl bg-gradient-to-r ${roleMeta.themeBg} text-white shadow-md border border-slate-700/50`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <RoleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold tracking-tight">
                  {roleMeta.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30">
                  {roleMeta.sublabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {roleMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Actions (Cetak Langsung & Asisten AI) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDirectPrintCurrentMonth}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              title="Langsung cetak dokumen laporan bulanan resmi bulan ini ke printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Langsung (Bulan Ini)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              title="Konsultasikan SOP, buat draf surat resmi, atau BAST dengan Asisten AI"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>Asisten AI</span>
            </button>

            {/* Operator Profile Card */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-right sm:text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {operator.nama}
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {operator.nip}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Sub-Navigation Bar for this Role */}
        <div className="mt-5 pt-3 border-t border-white/15 flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
          {subNavItems.map(item => {
            const ItemIcon = item.icon;
            const isActive = currentSubTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoleSubTab(role, item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? roleMeta.activeColor
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-transparent'
                }`}
              >
                <ItemIcon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/30 text-white' : 'bg-black/30 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on selected sub-tab for this operational role */}
      <div className="transition-all">
        {currentSubTab === 'tasks' && (
          <div>
            {role === 'PENJAGA' && <PenjagaView />}
            {role === 'TU' && <TUView />}
            {role === 'SERVICE' && <ServiceView />}
            {role === 'PERPUS' && <PerpusView />}
            {role === 'LAB_IPA' && <LabIpaView />}
          </div>
        )}

        {currentSubTab === 'tupoksi' && (
          <TupoksiManagerView initialRole={role} />
        )}

        {currentSubTab === 'monthly' && (
          <MonthlyReportView 
            initialRole={role} 
            lockRole={true} 
            onOpenPrint={onOpenPrint} 
          />
        )}

        {currentSubTab === 'annual' && (
          <AnnualReportView 
            initialRole={role} 
            lockRole={true} 
            onOpenPrint={onOpenPrint} 
          />
        )}

        {currentSubTab === 'inventory' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Daftar Sarana Prasarana & Alat Operasional ({operator.jabatan})
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {roleInventories.length} item terdaftar
              </span>
            </div>
            <InventoryTable role={role} />
          </div>
        )}
      </div>

      {/* AI Assistant Modal for this Role */}
      {isAiAssistantOpen && (
        <AiAssistantModal
          isOpen={isAiAssistantOpen}
          onClose={() => setIsAiAssistantOpen(false)}
          initialRole={role}
        />
      )}
    </div>
  );
};
