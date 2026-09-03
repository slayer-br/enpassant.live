function LoadingState() {
  return (
    <section className="state-container loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p className="state-message">Carregando streamers de xadrez...</p>
    </section>
  );
}

export default LoadingState;
