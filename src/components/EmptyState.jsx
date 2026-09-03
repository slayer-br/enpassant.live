function EmptyState() {
  return (
    <section className="state-container empty-state">
      <div className="empty-icon" aria-hidden="true">♟️</div>
      <h2 className="empty-title">Nenhum streamer encontrado</h2>
      <p className="state-message">
        No momento não há nenhum streamer de xadrez disponível na lista.
      </p>
    </section>
  );
}

export default EmptyState;
