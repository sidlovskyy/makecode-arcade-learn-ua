export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <a className="brand brand--footer" href="#/" aria-label="КодКвест — на головну">
          <span className="brand__mark" aria-hidden="true">
            <span>К</span>
          </span>
          <span className="brand__name">КодКвест</span>
        </a>
        <p>
          КодКвест — незалежний навчальний проєкт. Microsoft MakeCode є продуктом Microsoft.
        </p>
      </div>
    </footer>
  );
}
