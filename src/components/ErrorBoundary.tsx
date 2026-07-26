import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

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
        <div className="min-h-screen bg-[#0e1116] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold font-mono text-white mb-2 uppercase tracking-wide">
              Cockpit Interface Exception
            </h2>

            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              An unhandled render state occurred in the cockpit interface. Click below to clear cache and restore safe flight briefing state.
            </p>

            {this.state.error && (
              <pre className="p-3 rounded-xl bg-slate-950 text-red-300 text-xs font-mono text-left overflow-x-auto mb-6 max-h-40">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Restore Airspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
