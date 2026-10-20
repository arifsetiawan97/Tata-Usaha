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
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { Bot, Sparkles } from 'lucide-react';

function MainLayout() {
  const { currentRole, activeNavTab } = useApp();
  const [isFloatingAiOpen, setIsFloatingAiOpen] = useState(false);

  // Print view state
  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    reportType: 'monthly' | 'annual';
    reportData: any;
    autoPrint?: boolean;
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
          autoPrint={printState.autoPrint}
          onBack={() => setPrintState(null)}
        />
      </div>
    );
  }

  const handleOpenPrint = (reportType: 'monthly' | 'annual', data: any, options?: { autoPrint?: boolean }) => {
    setPrintState({
      isOpen: true,
      reportType,
      reportData: data,
      autoPrint: options?.autoPrint
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
            Sistem Informasi Operator Layanan Operasional (TU, Penjaga, Service, Perpustakaan, Lab IPA) · Standar Tata Kelola Satuan Pendidikan
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Kop 3 Kolom · Lembar Pengesahan NIP/NIPPK · E-Sign & Stempel
          </p>
        </div>
      </footer>

      {/* Floating Global AI Assistant Trigger */}
      <button
        type="button"
        onClick={() => setIsFloatingAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer no-print ring-4 ring-indigo-400/20"
        title="Buka Asisten Cerdas AI SI-OPS"
      >
        <Bot className="w-5 h-5 text-amber-300" />
        <span className="text-xs tracking-wide">Asisten AI SI-OPS</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      </button>

      {/* Global AI Assistant Modal */}
      {isFloatingAiOpen && (
        <AiAssistantModal
          isOpen={isFloatingAiOpen}
          onClose={() => setIsFloatingAiOpen(false)}
          initialRole={currentRole}
        />
      )}
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
