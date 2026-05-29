import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useVotes } from '../hooks/useVotes';
import type { Player } from '../types';
import { localizedField } from '../utils/format';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  onNeedDonate?: () => void;
}

export function PlayerCard({ player, rank, onNeedDonate }: PlayerCardProps) {
  const { locale, t } = useI18n();
  const { credits, counts, vote } = useVotes();
  const [flash, setFlash] = useState<string | null>(null);

  const region = localizedField(player.region, locale);
  const bio = localizedField(player.bio, locale);
  const voteCount = counts[player.id] ?? 0;

  const handleVote = () => {
    if (credits <= 0) {
      onNeedDonate?.();
      setFlash(t('players.voteNeedDonate'));
      setTimeout(() => setFlash(null), 4000);
      return;
    }
    const ok = vote(player.id);
    if (ok) {
      setFlash(t('players.voteSuccess', { remaining: credits - 1 }));
    } else {
      onNeedDonate?.();
      setFlash(t('players.voteFail'));
    }
    setTimeout(() => setFlash(null), 3000);
  };

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showRank = rank !== undefined && rank <= 3 && voteCount > 0;
  const rankClass = showRank ? ` rank-${rank}` : '';

  return (
    <article className={`player-card${rankClass}`}>
      {showRank && (
        <span className={`player-rank rank-${rank}`} aria-label={`Rank ${rank}`}>
          #{rank}
        </span>
      )}
      <div className="player-avatar" aria-hidden>
        {initials}
      </div>
      <div className="player-body">
        <h3 className="player-name">{player.name}</h3>
        <p className="player-meta">
          <span>{t(`sport.${player.sport}`)}</span>
          <span>·</span>
          <span>{player.team}</span>
          <span>·</span>
          <span>{region}</span>
        </p>
        <p className="player-bio">{bio}</p>
        <div className="player-footer">
          <span className="player-votes">{t('players.votes', { count: voteCount })}</span>
          <button type="button" className="btn-vote" onClick={handleVote}>
            {t('players.vote')}
          </button>
        </div>
        {flash && (
          <p className={`player-flash ${credits <= 0 ? 'player-flash-warn' : ''}`} role="status">
            {flash}
          </p>
        )}
      </div>
    </article>
  );
}
