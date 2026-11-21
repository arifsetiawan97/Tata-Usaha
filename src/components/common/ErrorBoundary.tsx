import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onResetHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kendala teknis saat memuat tampilan.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SI-OPS ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onResetHome?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">
                  Halaman Mengalami Kendala Teknis
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Jangan khawatir — data Anda tersimpan aman di Database Admin. Silakan muat ulang tampilan atau kembali ke halaman pembuka.
                </p>
              </div>
            </div>

            {this.state.errorMessage && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono break-words">
                Rincian: {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Halaman Pembuka</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
