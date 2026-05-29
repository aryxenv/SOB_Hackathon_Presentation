import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DonateModal, type DonationResult } from '../components/DonateModal';
import { DonateVoteBanner } from '../components/DonateVoteBanner';
import { MotivationModal } from '../components/MotivationModal';
import { PlayerCard } from '../components/PlayerCard';
import { VoteCounter } from '../components/VoteCounter';
import { useData } from '../hooks/useData';
import { useVotes } from '../hooks/useVotes';
import { useI18n } from '../i18n/I18nContext';
import { localizedField, formatDateRange } from '../utils/format';
import './FanWallPage.css';

export function FanWallPage() {
  const { locale, t } = useI18n();
  const { events, players, loading, error } = useData();
  const { counts } = useVotes();
  const [searchParams] = useSearchParams();

  const currentEvent = events.find((e) => e.status === 'current');
  const defaultEventId =
    searchParams.get('event') ?? currentEvent?.id ?? events.find((e) => e.status !== 'past')?.id ?? 'all';

  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('all');
  const [eventId, setEventId] = useState(defaultEventId);
  const [region, setRegion] = useState('all');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [lastDonationVotes, setLastDonationVotes] = useState(0);
  const [lastDonationId, setLastDonationId] = useState('');
  const [lastDonorName, setLastDonorName] = useState('');
  const [lastDonorEmail, setLastDonorEmail] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [donateFormKey, setDonateFormKey] = useState(0);

  useEffect(() => {
    setEventId(defaultEventId);
  }, [defaultEventId]);

  const activeEvents = events.filter((e) => e.status !== 'past');

  const selectedEvent =
    eventId !== 'all' ? events.find((e) => e.id === eventId) : currentEvent ?? activeEvents[0];
  const eventName = selectedEvent
    ? localizedField(selectedEvent.title, locale)
    : t('fanwall.anyEvent');

  const eventPlayers = useMemo(() => {
    if (eventId !== 'all') {
      return players.filter((p) => p.eventId === eventId);
    }
    if (currentEvent) {
      return players.filter((p) => p.eventId === currentEvent.id);
    }
    const activeIds = new Set(activeEvents.map((e) => e.id));
    return players.filter((p) => activeIds.has(p.eventId));
  }, [players, eventId, currentEvent, activeEvents]);

  const sports = useMemo(() => {
    const set = new Set(eventPlayers.map((p) => p.sport));
    return ['all', ...Array.from(set).sort()];
  }, [eventPlayers]);

  const regions = useMemo(() => {
    const set = new Set(eventPlayers.map((p) => localizedField(p.region, locale)));
    return ['all', ...Array.from(set).sort()];
  }, [eventPlayers, locale]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = eventPlayers.filter((p) => {
      if (sport !== 'all' && p.sport !== sport) return false;
      if (region !== 'all' && localizedField(p.region, locale) !== region) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const votesA = counts[a.id] ?? 0;
      const votesB = counts[b.id] ?? 0;
      if (votesB !== votesA) return votesB - votesA;
      return a.name.localeCompare(b.name);
    });
  }, [eventPlayers, sport, region, search, locale, counts]);

  const openDonateModal = () => setShowDonateModal(true);

  const handlePaymentSuccess = (result: DonationResult) => {
    setShowDonateModal(false);
    setBannerDismissed(true);
    setLastDonationVotes(result.votesGranted);
    setLastDonationId(result.donationId);
    setLastDonorName(result.name);
    setLastDonorEmail(result.email);
    setDonateFormKey((k) => k + 1);
    setShowMotivationModal(true);
  };

  if (loading) return <p className="page-loading">Loading…</p>;
  if (error) return <p className="page-error">{error}</p>;

  const showTopBanner = !bannerDismissed;

  return (
    <div className="fan-wall-page page-enter">
      <header className="fan-wall-header">
        <h1 className="page-title">{t('fanwall.title')}</h1>
        {selectedEvent && (
          <div className="event-context">
            <div className="event-context-top">
              <span className={`event-status-pill status-${selectedEvent.status}`}>
                {t(`event.status.${selectedEvent.status}`)}
              </span>
            </div>
            <p className="event-context-title">{eventName}</p>
            <p className="event-context-meta">
              {formatDateRange(selectedEvent.dateStart, selectedEvent.dateEnd, locale)}
              {' · '}
              {localizedField(selectedEvent.location, locale)}
            </p>
          </div>
        )}
      </header>

      <VoteCounter showDonateButton onDonateClick={openDonateModal} />

      {showTopBanner && (
        <DonateVoteBanner
          eventName={eventName}
          onDonateClick={openDonateModal}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <section className="players-section" aria-labelledby="athletes-heading">
        <div className="players-section-head">
          <h2 id="athletes-heading">{t('fanwall.playersSection')}</h2>
          <span className="player-count">{filtered.length}</span>
        </div>

        <div className="filters-panel">
          <label className="search-field">
            <span className="visually-hidden">{t('players.search')}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('players.search')}
              autoComplete="off"
            />
          </label>

          <div className="filter-row">
            <label>
              {t('players.filterSport')}
              <select value={sport} onChange={(e) => setSport(e.target.value)}>
                {sports.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? t('players.all') : t(`sport.${s}`)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t('players.filterEvent')}
              <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="all">{t('players.all')}</option>
                {activeEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {localizedField(e.title, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="filter-full">
            {t('players.filterRegion')}
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? t('players.all') : r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="player-list stagger-list">
          {filtered.length === 0 ? (
            <p className="empty-note">{t('players.empty')}</p>
          ) : (
            filtered.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                rank={index + 1}
                onNeedDonate={openDonateModal}
              />
            ))
          )}
        </div>
      </section>

      {showDonateModal && (
        <DonateModal
          key={donateFormKey}
          onClose={() => setShowDonateModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {showMotivationModal && (
        <MotivationModal
          votesGranted={lastDonationVotes}
          donationId={lastDonationId}
          prefillName={lastDonorName}
          prefillEmail={lastDonorEmail}
          onClose={() => setShowMotivationModal(false)}
        />
      )}
    </div>
  );
}
