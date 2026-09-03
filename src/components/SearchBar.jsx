function SearchBar({ value, onChange, onClear, totalMatches }) {
  const hasValue = value.length > 0;
  const isSearching = value.trim().length > 0;

  return (
    <div className="search-toolbar">
      <div className="search-input-wrapper">
        <label htmlFor="streamer-search-input" className="sr-only">
          Buscar streamer por username
        </label>
        <span className="search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          id="streamer-search-input"
          type="search"
          className="search-input"
          placeholder="Buscar streamer por username..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {hasValue && (
          <button
            type="button"
            className="btn-search-clear"
            onClick={onClear}
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isSearching && totalMatches > 0 && (
        <div className="search-feedback">
          <span>
            {totalMatches} {totalMatches === 1 ? 'streamer encontrado' : 'streamers encontrados'}
          </span>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
