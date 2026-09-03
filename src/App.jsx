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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(300);

  const nextUpdateAtRef = useRef(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

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

  const fetchStreamers = useCallback(async (isBackground = false) => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(API_URL, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Erro na requisição: status ${response.status}`);
      }
      const data = await response.json();
      const streamersList = Array.isArray(data.streamers) ? data.streamers : [];
      const sortedStreamers = sortStreamers(streamersList);
      
      setStreamers(sortedStreamers);
      const now = Date.now();
      setLastUpdated(now);
      nextUpdateAtRef.current = now + 300000;
      setSecondsLeft(300);
      setError(null);
      if (!isBackground) {
        setCurrentPage(1);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (!isBackground) {
          setError('Não foi possível carregar os streamers. Verifique sua conexão e tente novamente.');
        } else {
          // Erro em atualização em segundo plano: mantém os dados atuais e agenda retry para 60 segundos
          const retryTime = Date.now() + 60000;
          nextUpdateAtRef.current = retryTime;
          setSecondsLeft(60);
        }
      }
    } finally {
      isFetchingRef.current = false;
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Carga inicial e cleanup geral
  useEffect(() => {
    fetchStreamers(false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStreamers]);

  // Timer anti-drift de 1 segundo
  useEffect(() => {
    if (!lastUpdated) return;

    const intervalId = setInterval(() => {
      if (!nextUpdateAtRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((nextUpdateAtRef.current - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        fetchStreamers(true);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastUpdated, fetchStreamers]);

  // Listener para sincronização ao retornar de aba inativa (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && nextUpdateAtRef.current && lastUpdated) {
        const now = Date.now();
        if (now >= nextUpdateAtRef.current) {
          fetchStreamers(true);
        } else {
          setSecondsLeft(Math.max(0, Math.ceil((nextUpdateAtRef.current - now) / 1000)));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastUpdated, fetchStreamers]);

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
    fetchStreamers(false);
  };

  const handleManualRefresh = () => {
    fetchStreamers(true);
  };

  return (
    <div className="app-container">
      <Header
        liveCount={liveCount}
        offlineCount={offlineCount}
        totalCount={totalCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        lastUpdated={lastUpdated}
        secondsLeft={secondsLeft}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
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
