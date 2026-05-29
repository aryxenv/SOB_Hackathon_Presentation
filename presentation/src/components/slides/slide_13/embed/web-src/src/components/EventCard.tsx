import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import type { Event } from '../types';
import { formatDateRange, localizedField } from '../utils/format';
import './EventCard.css';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export function EventCard({ event, featured }: EventCardProps) {
  const { locale, t } = useI18n();
  const title = localizedField(event.title, locale);
  const description = localizedField(event.description, locale);
  const location = localizedField(event.location, locale);
  const dates = formatDateRange(event.dateStart, event.dateEnd, locale);
  const statusKey = `event.status.${event.status}`;

  return (
    <article className={`event-card ${featured ? 'featured' : ''} status-${event.status}`}>
      <div className="event-card-header">
        <span className={`event-status-pill status-${event.status}`}>{t(statusKey)}</span>
        <span className="event-sport">{t(`sport.${event.sport}`)}</span>
      </div>
      <h2 className="event-title">{title}</h2>
      <p className="event-meta">
        <span>{dates}</span>
        <span className="event-location">{location}</span>
      </p>
      <p className="event-desc">{description}</p>
      {event.status !== 'past' && (
        <Link to={`/fan-wall?event=${event.id}`} className="event-link">
          {t('home.ctaFanWall')} →
        </Link>
      )}
    </article>
  );
}
