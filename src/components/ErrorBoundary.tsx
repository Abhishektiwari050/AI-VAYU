import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sky-100 flex items-center justify-center p-6 text-center font-sans">
          <div className="cirrus-card max-w-lg w-full p-8 shadow-2xl border border-sky-200 bg-white rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              System Recovery Mode
            </h2>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              An unhandled render state occurred in the cockpit interface. Click below to clear cache and restore safe flight briefing state.
            </p>

            {this.state.error && (
              <pre className="p-3 rounded-xl bg-slate-900 text-red-300 text-xs font-mono text-left overflow-x-auto mb-6 max-h-40">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="cirrus-btn-obsidian cursor-pointer inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Restore Airspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}
