import { useI18n } from '../i18n/I18nContext';
import './DonateVoteBanner.css';

interface DonateVoteBannerProps {
  eventName: string;
  onDonateClick: () => void;
  onDismiss?: () => void;
}

export function DonateVoteBanner({ eventName, onDonateClick, onDismiss }: DonateVoteBannerProps) {
  const { t } = useI18n();

  return (
    <div className="donate-vote-banner">
      <div className="banner-body">
        <p className="banner-eyebrow">{t('fanwall.bannerCta')}</p>
        <p className="banner-text">{t('fanwall.banner', { event: eventName })}</p>
        <button type="button" className="btn btn-primary banner-cta" onClick={onDonateClick}>
          {t('fanwall.bannerCta')}
        </button>
      </div>
      {onDismiss && (
        <button type="button" className="banner-close" onClick={onDismiss} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
}
