export function NotFound() {
  return (
    <main className="not-found-main" id="main-content" tabIndex={-1}>
      <div className="page-shell not-found-panel">
        <span className="not-found-panel__code" aria-hidden="true">404</span>
        <p className="eyebrow">Маршрут загубився</p>
        <h1>Місії не знайдено</h1>
        <p>
          Схоже, такої адреси в КодКвесті немає. Повернися до мапи — усі 24 місії чекають там.
        </p>
        <a className="button button--primary" href="#/">
          Повернутися до мапи
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  );
}
