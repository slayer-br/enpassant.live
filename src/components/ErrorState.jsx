function ErrorState({ message, onRetry }) {
  return (
    <section className="state-container error-state" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2 className="error-title">Ocorreu um erro</h2>
      <p className="state-message">
        {message || 'Não foi possível carregar os streamers. Tente novamente mais tarde.'}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-retry" onClick={onRetry}>
          Tentar Novamente
        </button>
      )}
    </section>
  );
}

export default ErrorState;
