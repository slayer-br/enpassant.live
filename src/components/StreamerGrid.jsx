import StreamerCard from './StreamerCard.jsx';

function StreamerGrid({ streamers = [] }) {
  return (
    <section className="streamer-grid" aria-label="Lista de streamers de xadrez">
      {streamers.map((streamer, index) => (
        <StreamerCard
          key={streamer.username || `streamer-${index}`}
          streamer={streamer}
        />
      ))}
    </section>
  );
}

export default StreamerGrid;
