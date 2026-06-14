'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-[var(--void)]">
          <div className="glass-panel p-8 text-center max-w-md">
            <h2 className="text-xl text-[var(--frost)] mb-4">出现了一些问题</h2>
            <p className="text-[var(--muted)] mb-6">请刷新页面重试</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="accent-button"
            >刷新页面</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
