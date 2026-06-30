export type TelemetryLevel = 'info' | 'warning' | 'error';

export interface TelemetryEvent {
  id: string;
  level: TelemetryLevel;
  source: string;
  message: string;
  path: string;
  createdAt: string;
}

const STORAGE_KEY = 'sartal-telemetry';
const MAX_EVENTS = 100;

export function getTelemetryEvents(): TelemetryEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TelemetryEvent[];
  } catch {
    return [];
  }
}

export function recordTelemetry(level: TelemetryLevel, source: string, message: string) {
  const event: TelemetryEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    source,
    message: message.slice(0, 500),
    path: window.location.pathname,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...getTelemetryEvents()].slice(0, MAX_EVENTS)));
  } catch {
    // Monitoring must never interrupt an operational workflow.
  }
  return event;
}

export function clearTelemetryEvents() {
  localStorage.removeItem(STORAGE_KEY);
}

export function installGlobalTelemetry() {
  const handleError = (event: ErrorEvent) => {
    recordTelemetry('error', 'window', event.error instanceof Error ? event.error.message : event.message);
  };
  const handleRejection = (event: PromiseRejectionEvent) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promesse rejetée');
    recordTelemetry('error', 'promise', message);
  };
  const handleOffline = () => recordTelemetry('warning', 'network', 'Connexion internet interrompue.');
  const handleOnline = () => recordTelemetry('info', 'network', 'Connexion internet rétablie.');

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}
