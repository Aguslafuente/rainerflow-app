export default function Loading() {
  return (
    <div className="page-loading" aria-busy="true" aria-label="Cargando">
      <div className="sk sk-title" />
      <div className="sk sk-sub" />
      <div className="skeleton-stats">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
      <div className="sk sk-panel" />
    </div>
  );
}
