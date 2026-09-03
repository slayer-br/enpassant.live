function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination-container" aria-label="Navegação da paginação">
      <button
        type="button"
        className="btn-pagination"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Ir para a página anterior"
      >
        &lt; Anterior
      </button>

      <div className="pagination-pages" role="list">
        {pages.map((page) => {
          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              className={`btn-page-number ${isCurrent ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Página ${page}`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn-pagination"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Ir para a próxima página"
      >
        Próxima &gt;
      </button>

      <div className="pagination-info" aria-live="polite">
        Página {currentPage} de {totalPages}
      </div>
    </nav>
  );
}

export default Pagination;
