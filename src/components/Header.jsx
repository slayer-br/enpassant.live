function Header({
  liveCount = 0,
  offlineCount = 0,
  totalCount = 0,
  theme = 'dark',
  onToggleTheme,
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="header-title">
          <span className="chess-icon" aria-hidden="true">♟️</span> EnPassant.live
        </h1>
        <p className="header-subtitle">
          Acompanhe os mestres e criadores de xadrez em tempo real
        </p>
      </div>

      <div className="header-actions">
        <div className="header-badges">
          <div className="badge badge-live-count">
            <span className="pulse-dot" aria-hidden="true"></span>
            <span>{liveCount} AO VIVO</span>
          </div>
          <div className="badge badge-offline-count">
            <span className="dot dot-offline" aria-hidden="true"></span>
            <span>{offlineCount} OFFLINE</span>
          </div>
          <div className="badge badge-total-count">
            <span>{totalCount} STREAMERS</span>
          </div>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
            title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            {theme === 'dark' ? (
              <svg
                className="theme-icon icon-sun"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg
                className="theme-icon icon-moon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
