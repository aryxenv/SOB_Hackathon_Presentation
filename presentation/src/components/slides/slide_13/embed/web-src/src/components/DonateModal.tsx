import { useMemo, useState } from 'react';
import {
  DONATION_TIERS,
  EUROS_PER_VOTE,
  votesForAmount,
} from '../lib/donations';
import { recordDonation, type PaymentFrequency } from '../lib/storage';
import {
  DEMO_MAX_SINGLE_DONATION_EUROS,
  DEMO_MAX_TOTAL_DONATION_EUROS,
  exceedsSingleDonationCap,
  getMyDonatedEuros,
  recordFeedDonation,
  useDonationFeed,
  wouldExceedTotalDemoCap,
} from '../lib/donationFeed';
import { useProfileIdentity } from '../hooks/useProfile';
import { useVotes } from '../hooks/useVotes';
import { useI18n } from '../i18n/I18nContext';
import { Modal } from './Modal';
import './FormFields.css';
import './DonateModal.css';

export interface DonationResult {
  votesGranted: number;
  donationId: string;
  email: string;
  name: string;
}

interface DonateModalProps {
  onClose: () => void;
  onPaymentSuccess: (result: DonationResult) => void;
}

type AmountMode = 'tier' | 'custom';

const DEFAULT_TIER = DONATION_TIERS[1].amount;
const FALLBACK_EMAIL = 'supporter@sob.local';

function createInitialFormState() {
  return {
    frequency: 'one-time' as PaymentFrequency,
    amountMode: 'tier' as AmountMode,
    selectedTier: DEFAULT_TIER,
    customAmount: '',
    donorName: '',
    formError: null as string | null,
  };
}

export function DonateModal({ onClose, onPaymentSuccess }: DonateModalProps) {
  const { t } = useI18n();
  const { refresh } = useVotes();
  const donations = useDonationFeed();
  const myDonatedEuros = useMemo(() => getMyDonatedEuros(donations), [donations]);
  const remainingTotalEuros = Math.max(0, DEMO_MAX_TOTAL_DONATION_EUROS - myDonatedEuros);
  const maxThisDonationEuros = Math.min(DEMO_MAX_SINGLE_DONATION_EUROS, remainingTotalEuros);
  const profile = useProfileIdentity();
  const isLoggedIn = profile !== null;

  const [frequency, setFrequency] = useState<PaymentFrequency>('one-time');
  const [amountMode, setAmountMode] = useState<AmountMode>('tier');
  const [selectedTier, setSelectedTier] = useState(DEFAULT_TIER);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(() => profile?.name?.trim() ?? '');
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    const initial = createInitialFormState();
    setFrequency(initial.frequency);
    setAmountMode(initial.amountMode);
    setSelectedTier(initial.selectedTier);
    setCustomAmount(initial.customAmount);
    setDonorName(profile?.name?.trim() ?? '');
    setFormError(initial.formError);
  };

  const amount = useMemo(() => {
    if (amountMode === 'custom') {
      return Number.parseFloat(customAmount) || 0;
    }
    return selectedTier;
  }, [amountMode, customAmount, selectedTier]);

  const votes = useMemo(() => votesForAmount(amount), [amount]);

  const validate = (): boolean => {
    if (amount < EUROS_PER_VOTE) {
      setFormError(t('donate.errorMinAmount', { min: EUROS_PER_VOTE }));
      return false;
    }
    if (votes < 1) {
      setFormError(t('donate.errorMinAmount', { min: EUROS_PER_VOTE }));
      return false;
    }
    if (exceedsSingleDonationCap(amount)) {
      setFormError(
        t('donate.errorSingleDonationCap', {
          max: DEMO_MAX_SINGLE_DONATION_EUROS,
        }),
      );
      return false;
    }
    if (wouldExceedTotalDemoCap(amount, donations)) {
      setFormError(
        t('donate.errorDemoCap', {
          max: DEMO_MAX_TOTAL_DONATION_EUROS,
          remaining: remainingTotalEuros,
        }),
      );
      return false;
    }
    const trimmedName = donorName.trim();
    if (trimmedName.length < 2) {
      setFormError(t('donate.errorName'));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleDonate = async () => {
    if (!validate() || processing) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    const displayName = donorName.trim();
    const donor = {
      email: isLoggedIn ? profile.email.trim() : FALLBACK_EMAIL,
      name: displayName,
    };
    const feedResult = await recordFeedDonation(amount, displayName);
    if (!feedResult.ok) {
      setProcessing(false);
      if (feedResult.reason === 'single_cap') {
        setFormError(
          t('donate.errorSingleDonationCap', {
            max: DEMO_MAX_SINGLE_DONATION_EUROS,
          }),
        );
      } else if (feedResult.reason === 'cap') {
        setFormError(
          t('donate.errorDemoCap', {
            max: DEMO_MAX_TOTAL_DONATION_EUROS,
            remaining: remainingTotalEuros,
          }),
        );
      } else {
        setFormError(t('donate.errorRemote'));
      }
      return;
    }
    const donationId = recordDonation(amount, votes, frequency, donor);
    refresh();
    setProcessing(false);
    resetForm();
    onPaymentSuccess({
      votesGranted: votes,
      donationId,
      email: donor.email,
      name: donor.name,
    });
  };

  const selectTier = (tierAmount: number) => {
    setAmountMode('tier');
    setSelectedTier(tierAmount);
    setCustomAmount('');
  };

  return (
    <Modal title={t('donate.title')} onClose={onClose} variant="donate">
      <div className="donate-modal">
        <div className="donate-hero">
          <span className="donate-hero-icon" aria-hidden>
            ♥
          </span>
          <p className="donate-hero-text">{t('donate.subtitle')}</p>
        </div>

        <label className="donate-name-field">
          <span className="donate-section-label">{t('donate.name')}</span>
          <span className="donate-name-hint">{t('donate.nameOnGlobe')}</span>
          <input
            type="text"
            className="donate-name-input"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder={t('donate.namePlaceholder')}
            maxLength={28}
            autoComplete="name"
          />
        </label>

        <fieldset className="frequency-fieldset">
          <legend>{t('donate.frequency')}</legend>
          <div className="frequency-toggle">
            <button
              type="button"
              className={frequency === 'one-time' ? 'freq-btn active' : 'freq-btn'}
              onClick={() => setFrequency('one-time')}
            >
              {t('donate.oneTime')}
            </button>
            <button
              type="button"
              className={frequency === 'monthly' ? 'freq-btn active' : 'freq-btn'}
              onClick={() => setFrequency('monthly')}
            >
              {t('donate.monthly')}
            </button>
          </div>
        </fieldset>

        <h3 className="donate-section-label">{t('donate.choose')}</h3>
        <div className="tier-grid">
          {DONATION_TIERS.map((tier) => {
            const isSelected = amountMode === 'tier' && selectedTier === tier.amount;
            return (
              <button
                key={tier.amount}
                type="button"
                className={`tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => selectTier(tier.amount)}
              >
                <span className="tier-price">€{tier.amount}</span>
                <span className="tier-name">{t(tier.labelKey)}</span>
              </button>
            );
          })}
        </div>

        <div className="custom-section">
          <button
            type="button"
            className={`custom-toggle ${amountMode === 'custom' ? 'active' : ''}`}
            onClick={() => setAmountMode('custom')}
          >
            {t('donate.customToggle')}
          </button>
          {amountMode === 'custom' && (
            <label className="custom-amount">
              {t('donate.custom')}
              <div className="custom-input-wrap">
                <span className="currency">€</span>
                <input
                  type="number"
                  min={EUROS_PER_VOTE}
                  max={maxThisDonationEuros}
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="25"
                  autoFocus
                />
              </div>
            </label>
          )}
        </div>

        <div className="donate-summary">
          <div className="summary-row">
            <span>{t('donate.summaryAmount')}</span>
            <strong>
              €{amount.toFixed(0)}
              {frequency === 'monthly' ? t('donate.perMonth') : ''}
            </strong>
          </div>
          {frequency === 'monthly' && (
            <p className="monthly-note">{t('donate.monthlyNote')}</p>
          )}
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button
          type="button"
          className="btn btn-primary btn-block donate-submit"
          onClick={handleDonate}
          disabled={processing || votes < 1}
        >
          {processing ? (
            <span className="donate-processing">
              <span className="spinner" aria-hidden />
              {t('donate.processing')}
            </span>
          ) : (
            t('donate.submitWithAmount', {
              amount: amount.toFixed(0),
              suffix: frequency === 'monthly' ? t('donate.perMonth') : '',
            })
          )}
        </button>

        <p className="donate-note">{t('donate.mockNote')}</p>
      </div>
    </Modal>
  );
}
