import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';
import StreamerGrid from './components/StreamerGrid.jsx';
import Pagination from './components/Pagination.jsx';
import './App.css';

const ITEMS_PER_PAGE = 12;
const API_URL = 'https://api.chess.com/pub/streamers';
const THEME_STORAGE_KEY = 'enpassant-theme';

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    console.warn('Erro ao acessar localStorage:', e);
  }
  return 'dark';
};

const sortStreamers = (list) => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const isLiveA = a.is_live === true;
    const isLiveB = b.is_live === true;

    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;

    const nameA = String(a.username || '');
    const nameB = String(b.username || '');

    const comparison = nameA.localeCompare(
      nameB,
      'pt-BR',
      {
        sensitivity: 'base',
        numeric: true
      }
    );

    if (comparison === 0) {
      return nameA.localeCompare(nameB, 'pt-BR');
    }

    return comparison;
  });
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (e) {
        console.warn('Falha ao salvar tema no localStorage:', e);
      }
      return nextTheme;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#0d1117');
    }
  }, [theme]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch (err) {
        console.warn('Erro ao verificar preferencia do sistema:', err);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const fetchStreamers = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, { signal });
      if (!response.ok) {
        throw new Error(`Erro na requisição: status ${response.status}`);
      }
      const data = await response.json();
      const streamersList = Array.isArray(data.streamers) ? data.streamers : [];
      const sortedStreamers = sortStreamers(streamersList);
      setStreamers(sortedStreamers);
      setCurrentPage(1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Não foi possível carregar os streamers. Verifique sua conexão e tente novamente.');
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStreamers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchStreamers]);

  const totalCount = streamers.length;
  const liveCount = streamers.filter((streamer) => streamer.is_live === true).length;
  const offlineCount = totalCount - liveCount;

  const totalPages = Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetry = () => {
    fetchStreamers();
  };

  return (
    <div className="app-container">
      <Header
        liveCount={liveCount}
        offlineCount={offlineCount}
        totalCount={totalCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {!loading && !error && streamers.length === 0 && <EmptyState />}

        {!loading && !error && streamers.length > 0 && (
          <>
            <StreamerGrid streamers={currentStreamers} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Dados fornecidos pela API pública oficial do <a href="https://www.chess.com" target="_blank" rel="noopener noreferrer">Chess.com</a></p>
      </footer>
    </div>
  );
}

export default App;
