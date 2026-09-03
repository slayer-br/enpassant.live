import placeholderAvatar from '../assets/chess-avatar-placeholder.svg';

function StreamerCard({ streamer }) {
  if (!streamer) return null;

  const { username, avatar, is_live, twitch_url } = streamer;
  const avatarSrc = avatar && avatar.trim() !== '' ? avatar : placeholderAvatar;

  const handleImageError = (event) => {
    event.currentTarget.src = placeholderAvatar;
    event.currentTarget.onerror = null;
  };

  return (
    <article className={`streamer-card ${is_live ? 'is-live' : 'is-offline'}`}>
      <div className="avatar-wrapper">
        <img
          src={avatarSrc}
          alt={`Avatar de ${username || 'Streamer'}`}
          className="streamer-avatar"
          onError={handleImageError}
          loading="lazy"
        />
        <span
          className={`status-badge ${is_live ? 'status-live' : 'status-offline'}`}
          aria-label={is_live ? 'Transmitindo ao vivo' : 'Offline'}
        >
          {is_live ? (
            <>
              <span className="pulse-dot" aria-hidden="true"></span>
              AO VIVO
            </>
          ) : (
            'OFFLINE'
          )}
        </span>
      </div>

      <div className="card-info">
        <h2 className="streamer-username" title={username}>
          {username}
        </h2>
      </div>

      <div className="card-actions">
        {twitch_url ? (
          <a
            href={twitch_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-twitch"
            aria-label={`Assistir canal de ${username} na Twitch (abre em nova aba)`}
          >
            Assistir na Twitch
          </a>
        ) : (
          <span className="btn btn-twitch btn-disabled" aria-disabled="true">
            Canal indisponível
          </span>
        )}
      </div>
    </article>
  );
}

export default StreamerCard;
