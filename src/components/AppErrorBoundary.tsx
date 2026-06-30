import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { recordTelemetry } from '../services/telemetry';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    recordTelemetry('error', 'react', `${error.message} · ${info.componentStack || 'composant inconnu'}`);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center p-6">
        <section className="w-full max-w-md glass-card-lg p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-black text-xl">Cet écran a rencontré un problème</h1>
          <p className="text-text-secondary text-sm mt-2">L’incident a été enregistré. Les autres données restent disponibles.</p>
          <p className="text-text-tertiary text-xs mt-3 break-words">{this.state.message}</p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button type="button" onClick={() => window.location.reload()} className="h-12 rounded-2xl bg-orange text-white font-black text-xs flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Réessayer
            </button>
            <button type="button" onClick={() => { window.location.href = '/dashboard'; }} className="h-12 rounded-2xl bg-white/5 text-white font-black text-xs flex items-center justify-center gap-2">
              <Home size={16} /> Accueil
            </button>
          </div>
        </section>
      </main>
    );
  }
}
