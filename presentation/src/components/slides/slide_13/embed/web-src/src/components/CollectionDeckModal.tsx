import { useEffect, useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useProfileIdentity } from '../hooks/useProfile';
import { useI18n } from '../i18n/I18nContext';
import { getMyDonatedEuros, useDonationFeed } from '../lib/donationFeed';
import { getCollectedCardsForIdentity, getFavoriteClub, setFavoriteClub } from '../lib/engagement';
import { AthleteCardModal } from './AthleteCardModal';
import { Modal } from './Modal';
import './CollectionDeckModal.css';

interface CollectionDeckModalProps {
  onClose: () => void;
  showProfileSummary?: boolean;
}

const FALLBACK_IDENTITY = {
  name: 'Supporter #719',
  email: 'supporter@sob.local',
};
const CARDS_PER_PAGE = 5;

export function CollectionDeckModal({ onClose, showProfileSummary = false }: CollectionDeckModalProps) {
  const { t } = useI18n();
  const identity = useProfileIdentity();
  const { players } = useData();
  const donations = useDonationFeed();
  const user = identity ?? FALLBACK_IDENTITY;
  const myDonatedEuros = useMemo(() => getMyDonatedEuros(donations), [donations]);

  const cards = useMemo(
    () => getCollectedCardsForIdentity(user.email, user.name, players),
    [players, user.email, user.name],
  );

  const clubOptions = useMemo(
    () =>
      Array.from(new Set(players.map((player) => player.team).filter((team) => team.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [players],
  );

  const [favoriteClub, setFavoriteClubState] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorite'>('all');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const stored = getFavoriteClub(user.email, user.name);
    if (stored) {
      setFavoriteClubState(stored);
      return;
    }
    if (clubOptions.length > 0) {
      setFavoriteClubState(clubOptions[0]);
    }
  }, [clubOptions, user.email, user.name]);

  const clubProgress = useMemo(() => {
    if (!favoriteClub) return null;
    const total = players.filter((player) => player.team === favoriteClub).length;
    const collected = cards.filter((player) => player.team === favoriteClub).length;
    return {
      total,
      collected,
      left: Math.max(0, total - collected),
    };
  }, [cards, favoriteClub, players]);

  const visibleCards = useMemo(() => {
    if (filterMode === 'favorite' && favoriteClub) {
      return cards.filter((card) => card.team === favoriteClub);
    }
    return cards;
  }, [cards, favoriteClub, filterMode]);

  useEffect(() => {
    setPage(1);
  }, [filterMode, favoriteClub, cards.length]);

  const totalPages = Math.max(1, Math.ceil(visibleCards.length / CARDS_PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const pagedCards = useMemo(() => {
    const start = (pageSafe - 1) * CARDS_PER_PAGE;
    return visibleCards.slice(start, start + CARDS_PER_PAGE);
  }, [pageSafe, visibleCards]);

  const selectedCard = useMemo(
    () => (selectedCardId ? cards.find((card) => card.id === selectedCardId) ?? null : null),
    [cards, selectedCardId],
  );

  return (
    <Modal title={t('engagement.deckTitle')} onClose={onClose} variant="profile" size="md">
      <div className="deck-modal">
        {showProfileSummary ? (
          <div className="deck-summary">
            <span>{t('engagement.totalDonatedLabel')}</span>
            <strong>{t('donationStats.totalValue', { amount: myDonatedEuros })}</strong>
          </div>
        ) : null}

        <label className="deck-club-select">
          <span>{t('engagement.favoriteClub')}</span>
          <select
            value={favoriteClub}
            onChange={(event) => {
              const next = event.target.value;
              setFavoriteClubState(next);
              setFavoriteClub(user.email, user.name, next);
            }}
          >
            {clubOptions.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </label>

        {clubProgress ? (
          <p className="deck-club-progress">
            {t('engagement.clubProgress', {
              left: clubProgress.left,
              club: favoriteClub,
              collected: clubProgress.collected,
              total: clubProgress.total,
            })}
          </p>
        ) : null}

        <div className="deck-filters">
          <button
            type="button"
            className={filterMode === 'all' ? 'is-on' : ''}
            onClick={() => setFilterMode('all')}
          >
            {t('engagement.showAllCards')}
          </button>
          <button
            type="button"
            className={filterMode === 'favorite' ? 'is-on' : ''}
            onClick={() => setFilterMode('favorite')}
          >
            {t('engagement.showFavoriteCards')}
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="deck-empty">{t('engagement.deckEmpty')}</p>
        ) : (
          <div className="deck-grid">
            {pagedCards.map((card) => (
              <article
                key={card.id}
                className="deck-card"
                onClick={() => setSelectedCardId(card.id)}
              >
                <span className="deck-card-no">#{card.id.replace('ath-', '').slice(-5)}</span>
                <p className="deck-athlete">{card.name}</p>
                <p className="deck-meta">{card.team}</p>
                <span className="deck-sport">{card.sport}</span>
              </article>
            ))}
          </div>
        )}
        {visibleCards.length > 0 ? (
          <div className="deck-pagination">
            <button type="button" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('engagement.pagePrev')}
            </button>
            <span>
              {t('engagement.pageLabel', { current: pageSafe, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('engagement.pageNext')}
            </button>
          </div>
        ) : null}
        {cards.length > 0 && visibleCards.length === 0 ? <p className="deck-empty">{t('engagement.favoriteDeckEmpty')}</p> : null}
      </div>
      {selectedCard ? <AthleteCardModal card={selectedCard} onClose={() => setSelectedCardId(null)} /> : null}
    </Modal>
  );
}
