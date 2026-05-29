import { Link } from 'react-router-dom';
import { DonationStatsCard } from '../components/DonationStatsCard';
import { EventCard } from '../components/EventCard';
import { useData } from '../hooks/useData';
import { useVotes } from '../hooks/useVotes';
import { useI18n } from '../i18n/I18nContext';
import './HomePage.css';

export function HomePage() {
  const { t } = useI18n();
  const { events, loading, error } = useData();
  const { credits } = useVotes();

  const current = events.find((e) => e.status === 'current');
  const upcoming = events.filter((e) => e.status === 'upcoming');

  if (loading) return <p className="page-loading">Loading…</p>;
  if (error) return <p className="page-error">{error}</p>;

  return (
    <div className="home-page page-enter">
      <DonationStatsCard />
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">{t('app.name')}</span>
          <h1>{t('app.tagline')}</h1>
          <p className="hero-sub">{t('donate.subtitle')}</p>
          <div className="hero-cta">
            <Link to="/fan-wall" className="btn btn-primary">
              {t('home.ctaFanWall')}
            </Link>
          </div>
          {credits > 0 && (
            <p className="votes-banner">{t('home.votesRemaining', { count: credits })}</p>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('home.currentEvent')}</h2>
        {current ? (
          <EventCard event={current} featured />
        ) : (
          <p className="empty-note">{t('home.noCurrent')}</p>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="section-title">{t('home.upcoming')}</h2>
          <div className="event-list">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
