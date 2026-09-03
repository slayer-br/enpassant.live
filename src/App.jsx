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

function App() {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      setStreamers(streamersList);
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
  const liveCount = streamers.filter((streamer) => streamer.is_live).length;

  const totalPages = Math.ceil(streamers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      <Header liveCount={liveCount} totalCount={totalCount} />

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
    </div>
  );
}

export default App;
