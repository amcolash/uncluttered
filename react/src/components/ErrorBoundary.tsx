import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface-canvas p-md flex min-h-screen items-center justify-center">
          <div className="rounded-card border-status-danger/40 bg-surface-card p-lg shadow-card max-w-md border text-center">
            <h2 className="text-status-danger text-lg font-bold">Something went wrong</h2>
            <p className="mt-xs text-text-secondary text-sm">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-md rounded-control bg-brand-primary px-md py-xs text-text-primary hover:bg-brand-hover cursor-pointer text-xs font-semibold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
