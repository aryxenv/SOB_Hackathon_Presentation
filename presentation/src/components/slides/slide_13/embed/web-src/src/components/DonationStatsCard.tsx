import { useDonationStats } from '../hooks/useDonationStats';
import { useI18n } from '../i18n/I18nContext';
import { FontSwitcher } from './FontSwitcher';
import './DonationStatsCard.css';

export function DonationStatsCard() {
  const { t } = useI18n();
  const { totalAmount, topDonorAlias, topDonorAmount } = useDonationStats();

  return (
    <div className="donation-stats-card" aria-live="polite">
      <div className="donation-stats-item">
        <span className="donation-stats-label">{t('donationStats.totalLabel')}</span>
        <strong className="donation-stats-value">
          {t('donationStats.totalValue', { amount: totalAmount.toFixed(0) })}
        </strong>
      </div>
      <div className="donation-stats-item">
        <span className="donation-stats-label">{t('donationStats.topLabel')}</span>
        <strong className="donation-stats-value">
          {topDonorAlias
            ? t('donationStats.topValue', {
                alias: topDonorAlias,
                amount: topDonorAmount.toFixed(0),
              })
            : t('donationStats.none')}
        </strong>
      </div>
      {topDonorAlias && (
        <p className="donation-stats-note">{t('donationStats.fontPerkNote')}</p>
      )}
      <FontSwitcher />
    </div>
  );
}
