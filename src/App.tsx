import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { RoleSelectView } from './components/common/RoleSelectView';
import { RoleWorkspaceView } from './components/roles/RoleWorkspaceView';
import { TupoksiManagerView } from './components/roles/TupoksiManagerView';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { AnnualReportView } from './components/reports/AnnualReportView';
import { PrintDocumentView } from './components/reports/PrintDocumentView';
import { InventoryTable } from './components/common/InventoryTable';
import { DocumentArchiveView } from './components/archive/DocumentArchiveView';

function MainLayout() {
  const { currentRole, activeNavTab } = useApp();

  // Print view state
  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    reportType: 'monthly' | 'annual';
    reportData: any;
  } | null>(null);

  if (!currentRole) {
    return <RoleSelectView />;
  }

  if (printState && printState.isOpen) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <PrintDocumentView
          reportType={printState.reportType}
          reportData={printState.reportData}
          onBack={() => setPrintState(null)}
        />
      </div>
    );
  }

  const handleOpenPrint = (reportType: 'monthly' | 'annual', data: any) => {
    setPrintState({
      isOpen: true,
      reportType,
      reportData: data
    });
  };

  const renderActiveContent = () => {
    if (activeNavTab === 'archive') {
      return <DocumentArchiveView onOpenDocument={handleOpenPrint} />;
    }
    return <RoleWorkspaceView role={currentRole} onOpenPrint={handleOpenPrint} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveContent()}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            Sistem Informasi Operator Layanan Operasional (TU, Penjaga Sekolah, Service) · Standar Tata Kelola Satuan Pendidikan
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Kop 3 Kolom · Lembar Pengesahan NIP/NIPPK · E-Sign & Stempel
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
