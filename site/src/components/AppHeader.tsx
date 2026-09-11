import type { MouseEvent } from 'react';

interface AppHeaderProps {
  totalXp: number;
}

function focusMainContent(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById('main-content')?.focus();
}

export function AppHeader({ totalXp }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="skip-link" href="#/" onClick={focusMainContent}>
        Перейти до вмісту
      </a>

      <div className="page-shell app-header__inner">
        <a className="brand" href="#/" aria-label="КодКвест — на головну">
          <span className="brand__mark" aria-hidden="true">
            <span>К</span>
          </span>
          <span className="brand__name">КодКвест</span>
        </a>

        <nav className="app-header__nav" aria-label="Головна навігація">
          <a className="nav-link" href="#/">
            Курс
          </a>
          <span className="xp-counter" aria-label={`${totalXp} очок досвіду`}>
            <span aria-hidden="true">✦</span>
            {totalXp} XP
          </span>
        </nav>
      </div>
    </header>
  );
}
