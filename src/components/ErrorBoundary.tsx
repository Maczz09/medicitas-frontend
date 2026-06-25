import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="glass flex max-w-md flex-col items-center gap-4 rounded-3xl p-10 text-center shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bad/15">
            <AlertTriangle className="h-7 w-7 text-rose-300" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink-100">Algo salió mal</p>
            <p className="mt-1 text-sm text-ink-400">{this.state.message ?? 'Error inesperado en la aplicación.'}</p>
          </div>
          <button
            onClick={() => window.location.assign('/')}
            className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
}
