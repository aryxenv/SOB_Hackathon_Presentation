import { useI18n } from '../i18n/I18nContext';
import { useVotes } from '../hooks/useVotes';
import './VoteCounter.css';

interface VoteCounterProps {
  onDonateClick?: () => void;
  showDonateButton?: boolean;
  compact?: boolean;
  donateLabel?: string;
}

export function VoteCounter({ onDonateClick, showDonateButton, compact, donateLabel }: VoteCounterProps) {
  const { t } = useI18n();
  const { credits } = useVotes();

  if (compact) {
    return (
      <div className="vote-counter compact" title={t('votes.available', { count: credits })}>
        <span className="vote-counter-icon" aria-hidden>
          ♥
        </span>
        <span className="vote-counter-value">{credits}</span>
      </div>
    );
  }

  return (
    <div className="vote-counter">
      <div className="vote-counter-info">
        <span className="vote-counter-icon" aria-hidden>
          ♥
        </span>
        <span className="vote-counter-text">{t('votes.available', { count: credits })}</span>
      </div>
      {showDonateButton && onDonateClick && (
        <button type="button" className="vote-counter-donate" onClick={onDonateClick}>
          {donateLabel ?? t('fanwall.bannerCta')}
        </button>
      )}
    </div>
  );
}
