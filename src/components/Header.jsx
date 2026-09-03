function Header({ liveCount = 0, totalCount = 0 }) {
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

      <div className="header-badges">
        <div className="badge badge-live-count">
          <span className="pulse-dot" aria-hidden="true"></span>
          <span>{liveCount} AO VIVO</span>
        </div>
        <div className="badge badge-total-count">
          <span>{totalCount} STREAMERS</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
