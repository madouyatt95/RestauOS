export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-text-secondary text-xs font-bold">Ouverture du module…</p>
      </div>
    </div>
  );
}
