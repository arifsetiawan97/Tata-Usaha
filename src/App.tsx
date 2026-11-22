import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { RoleSelectView } from './components/common/RoleSelectView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { resolveBackgroundPresentation, SERVICE_BACKGROUND_PRESETS } from './utils/backgroundHelper';

const RoleWorkspaceView = lazy(() =>
  import('./components/roles/RoleWorkspaceView').then(m => ({ default: m.RoleWorkspaceView }))
);
const PrintDocumentView = lazy(() =>
  import('./components/reports/PrintDocumentView').then(m => ({ default: m.PrintDocumentView }))
);
const DocumentArchiveView = lazy(() =>
  import('./components/archive/DocumentArchiveView').then(m => ({ default: m.DocumentArchiveView }))
);
const AiAssistantModal = lazy(() =>
  import('./components/common/AiAssistantModal').then(m => ({ default: m.AiAssistantModal }))
);
const AdminAccessPanelModal = lazy(() =>
  import('./components/common/AdminAccessPanelModal').then(m => ({ default: m.AdminAccessPanelModal }))
);

const LazyViewFallback = () => (
  <div className="min-h-[240px] flex items-center justify-center p-8 text-slate-500 text-xs gap-2">
    <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
    <span>Memuat modul layanan...</span>
  </div>
);

function MainLayout() {
  const { currentRole, activeNavTab, getServiceBackground } = useApp();
  const [isFloatingAiOpen, setIsFloatingAiOpen] = useState(false);
  const [isOwnerAdminOpen, setIsOwnerAdminOpen] = useState(false);

  // Private owner-only triggers: Alt+Shift+A, Ctrl+Alt+A, F9, Ctrl+Shift+A, 5x tap logo/footer, or #owner-admin / ?owner=admin / ?admin=1 / #admin
  useEffect(() => {
    const checkUrlTrigger = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const ownerParam = (params.get('owner') || '').toLowerCase();
      const adminParam = (params.get('admin') || '').toLowerCase();
      if (
        hash.includes('owner-admin') ||
        hash === '#admin' ||
        ownerParam === 'admin' ||
        adminParam === '1' ||
        adminParam === 'true'
      ) {
        setIsOwnerAdminOpen(true);
      }
    };
    checkUrlTrigger();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const isAltShiftA = e.altKey && e.shiftKey && key === 'a';
      const isCtrlAltA = (e.ctrlKey || e.metaKey) && e.altKey && key === 'a';
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && key === 'a';
      const isF9 = e.key === 'F9';
      if (isAltShiftA || isCtrlAltA || isCtrlShiftA || isF9) {
        e.preventDefault();
        setIsOwnerAdminOpen(true);
      }
    };

    const handleCustomOpen = () => {
      setIsOwnerAdminOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', checkUrlTrigger);
    window.addEventListener('popstate', checkUrlTrigger);
    window.addEventListener('siops-open-owner-panel', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', checkUrlTrigger);
      window.removeEventListener('popstate', checkUrlTrigger);
      window.removeEventListener('siops-open-owner-panel', handleCustomOpen);
    };
  }, []);

  // Print view state
  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    reportType: 'monthly' | 'annual';
    reportData: any;
    autoPrint?: boolean;
  } | null>(null);

  if (!currentRole) {
    return (
      <>
        <RoleSelectView />
        {isOwnerAdminOpen && (
          <Suspense fallback={null}>
            <AdminAccessPanelModal
              isOpen={isOwnerAdminOpen}
              onClose={() => setIsOwnerAdminOpen(false)}
            />
          </Suspense>
        )}
      </>
    );
  }

  if (printState && printState.isOpen) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 print:p-0 print:m-0 print:bg-white print:min-h-0">
        <Suspense fallback={<LazyViewFallback />}>
          <PrintDocumentView
            reportType={printState.reportType}
            reportData={printState.reportData}
            autoPrint={printState.autoPrint}
            onBack={() => setPrintState(null)}
          />
        </Suspense>
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
      return (
        <Suspense fallback={<LazyViewFallback />}>
          <DocumentArchiveView onOpenDocument={handleOpenPrint} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LazyViewFallback />}>
        <RoleWorkspaceView role={currentRole} onOpenPrint={handleOpenPrint} />
      </Suspense>
    );
  };

  const activeServiceBg = getServiceBackground(currentRole);
  const serviceBgPresentation = resolveBackgroundPresentation(
    activeServiceBg,
    SERVICE_BACKGROUND_PRESETS,
    'service'
  );

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Per-User Service Workspace Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-300 print:hidden"
        style={serviceBgPresentation.layerStyle}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-300 print:hidden"
        style={serviceBgPresentation.overlayStyle}
      />

      <div className="relative z-10">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveContent()}
        </main>
      </div>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/90 backdrop-blur-xs py-4 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>
            Sistem Informasi Operator Layanan Operasional (TU, Penjaga, Service, Perpustakaan, Lab IPA) · Standar Tata Kelola Satuan Pendidikan
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            Kop 3 Kolom · Lembar Pengesahan NIP/NIPPK · Tanda Tangan Basah
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
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
      </button>

      {/* Global AI Assistant Modal */}
      {isFloatingAiOpen && (
        <Suspense fallback={null}>
          <AiAssistantModal
            isOpen={isFloatingAiOpen}
            onClose={() => setIsFloatingAiOpen(false)}
            initialRole={currentRole}
          />
        </Suspense>
      )}

      {/* Hidden Owner-Only Admin Panel Modal */}
      {isOwnerAdminOpen && (
        <Suspense fallback={null}>
          <AdminAccessPanelModal
            isOpen={isOwnerAdminOpen}
            onClose={() => setIsOwnerAdminOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function SafeAppShell() {
  const { setCurrentRole } = useApp();
  return (
    <ErrorBoundary onResetHome={() => setCurrentRole(null)}>
      <MainLayout />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SafeAppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
