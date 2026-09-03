/**
 * Gera o array determinístico de páginas e tokens de reticências.
 * @param {number} currentPage - Página atualmente ativa (1-based)
 * @param {number} totalPages - Total de páginas disponíveis
 * @param {number} [siblingCount=1] - Quantidade de vizinhos ao redor da atual (padrão estrito: 1)
 * @returns {Array<number|'DOTS_LEFT'|'DOTS_RIGHT'>} Lista de tokens da paginação
 */
export function getPaginationPages(currentPage, totalPages, siblingCount = 1) {
  const safeTotalPages = Math.max(0, Math.floor(totalPages) || 0);
  if (safeTotalPages <= 1) {
    return safeTotalPages === 1 ? [1] : [];
  }

  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(currentPage) || 1),
    safeTotalPages
  );

  // Limiar pequeno: exibe todas sem reticências
  if (safeTotalPages <= 7) {
    return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
  }

  // Caso 1: Próximo do início (páginas 1 a 4)
  if (safeCurrentPage <= 4) {
    return [1, 2, 3, 4, 5, 'DOTS_RIGHT', safeTotalPages];
  }

  // Caso 2: Próximo do fim (últimas 4 páginas)
  if (safeCurrentPage >= safeTotalPages - 3) {
    return [
      1,
      'DOTS_LEFT',
      safeTotalPages - 4,
      safeTotalPages - 3,
      safeTotalPages - 2,
      safeTotalPages - 1,
      safeTotalPages
    ];
  }

  // Caso 3: Meio (entre 5 e totalPages - 4)
  return [
    1,
    'DOTS_LEFT',
    safeCurrentPage - 1,
    safeCurrentPage,
    safeCurrentPage + 1,
    'DOTS_RIGHT',
    safeTotalPages
  ];
}

function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const paginationItems = getPaginationPages(currentPage, totalPages, 1);

  return (
    <nav className="pagination-container" aria-label="Navegação da paginação">
      <div className="pagination-controls">
        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Ir para a primeira página"
        >
          &laquo; Primeira
        </button>

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
          {paginationItems.map((item) => {
            if (item === 'DOTS_LEFT') {
              return (
                <span
                  key="dots-left"
                  className="pagination-ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            if (item === 'DOTS_RIGHT') {
              return (
                <span
                  key="dots-right"
                  className="pagination-ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const page = item;
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

        <button
          type="button"
          className="btn-pagination"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Ir para a última página"
        >
          Última &raquo;
        </button>
      </div>

      <div className="pagination-info" aria-live="polite">
        Página {currentPage} de {totalPages}
      </div>
    </nav>
  );
}

export default Pagination;
