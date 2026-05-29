import { Suspense, lazy, useMemo, useState } from 'react';
import { CardRevealModal } from '../components/CardRevealModal';
import { CollectionDeckModal } from '../components/CollectionDeckModal';
import { DonateModal, type DonationResult } from '../components/DonateModal';
import { useData } from '../hooks/useData';
import { useI18n } from '../i18n/I18nContext';
import { EURO_PER_LIT_ATHLETE } from '../lib/donations';
import { getGlobalDonatedEuros, useDonationFeed } from '../lib/donationFeed';
import { revealAthleteForDonation } from '../lib/engagement';
import './ExchangeShopPage.css';

const PERSON_POINT_COUNT = 7000;
const DEFAULT_PRELIT_ATHLETES = 100;

const DonationSphere = lazy(async () => {
  const mod = await import('../components/DonationSphereClean');
  return { default: mod.DonationSphere };
});

export function ExchangeShopPage() {
  const { t } = useI18n();
  const { players } = useData();
  const donations = useDonationFeed();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [donateFormKey, setDonateFormKey] = useState(0);
  const [revealedPlayerId, setRevealedPlayerId] = useState<string | null>(null);
  // Progress + total reflect the shared feed so every screen shows the same numbers.
  const totalAmount = useMemo(() => getGlobalDonatedEuros(donations), [donations]);
  const donatedAthletes = donations.length;
  const litAthletes = Math.min(DEFAULT_PRELIT_ATHLETES + donatedAthletes, PERSON_POINT_COUNT);
  const globePercentage = useMemo(() => Math.min(100, Math.round((litAthletes / PERSON_POINT_COUNT) * 1000) / 10), [litAthletes]);
  const checkpoints = [30, 50, 70, 100];

  const handlePaymentSuccess = (_result: DonationResult) => {
    const revealed = revealAthleteForDonation(_result.donationId, players);
    setRevealedPlayerId(revealed?.playerId ?? null);
    setShowRevealModal(Boolean(revealed?.playerId));
    setShowDonateModal(false);
    setDonateFormKey((k) => k + 1);
  };

  const revealedPlayer = useMemo(
    () => (revealedPlayerId ? players.find((player) => player.id === revealedPlayerId) ?? null : null),
    [players, revealedPlayerId],
  );
  const suppressSpherePulse = showDeckModal || showRevealModal || showDonateModal;

  return (
    <div className="support-sphere-page page-enter">
      <section className="goal-line-wrap" aria-label="Donation goal progress">
        <div className="goal-line-header">
          <p className="goal-line-title">{t('shop.sphereRule')}</p>
          <p className="goal-line-total">
            {t('donationStats.totalLabel')}: <strong>{t('donationStats.totalValue', { amount: totalAmount })}</strong>
          </p>
        </div>
        <div className="goal-line-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={globePercentage}>
          <span className="goal-line-fill" style={{ width: `${globePercentage}%` }} />
          {checkpoints.map((checkpoint) => (
            <span
              key={checkpoint}
              className={`goal-line-marker ${globePercentage >= checkpoint ? 'is-on' : ''}`}
              style={{ left: `${checkpoint}%` }}
            />
          ))}
        </div>
        <div className="goal-line-checkpoint-row">
          {checkpoints.map((checkpoint) => (
            <span
              key={`chip-${checkpoint}`}
              className={`goal-line-checkpoint-chip ${globePercentage >= checkpoint ? 'is-on' : ''} ${checkpoint === 100 ? 'is-end' : ''}`}
              style={{ left: `${checkpoint}%` }}
            >
              {checkpoint}%
            </span>
          ))}
        </div>
        <p className="goal-line-percent">{t('support.progressPercent', { percent: globePercentage })}</p>
      </section>

      <Suspense fallback={<div className="sphere-loading" />}>
        <DonationSphere suppressPulse={suppressSpherePulse} />
      </Suspense>

      <div className="support-cta-wrap">
        <button type="button" className="btn btn-primary support-cta" onClick={() => setShowDonateModal(true)}>
          {t('support.cta')}
        </button>
        <button type="button" className="btn btn-secondary-outline support-deck-btn" onClick={() => setShowDeckModal(true)}>
          {t('engagement.deckButton')}
        </button>
        <p className="support-cta-note">{t('support.ctaHintEuro', { amount: EURO_PER_LIT_ATHLETE })}</p>
      </div>

      {showDonateModal && (
        <DonateModal
          key={donateFormKey}
          onClose={() => setShowDonateModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {showDeckModal && <CollectionDeckModal onClose={() => setShowDeckModal(false)} />}
      {showRevealModal && revealedPlayer ? (
        <CardRevealModal
          card={revealedPlayer}
          onClose={() => setShowRevealModal(false)}
          onOpenDeck={() => setShowDeckModal(true)}
        />
      ) : null}
    </div>
  );
}
