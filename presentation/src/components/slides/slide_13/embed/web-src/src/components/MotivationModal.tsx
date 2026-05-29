import { useState, type FormEvent } from 'react';
import { BONUS_VOTE_FOR_MOTIVATION } from '../lib/donations';
import { DONOR_REGIONS, regionLabel, type DonorRegion } from '../lib/regions';
import { recordMotivation } from '../lib/storage';
import { isValidEmail } from '../lib/validation';
import { useVotes } from '../hooks/useVotes';
import { useI18n } from '../i18n/I18nContext';
import { Modal } from './Modal';
import './FormFields.css';
import './MotivationModal.css';

interface MotivationModalProps {
  votesGranted: number;
  donationId: string;
  prefillName: string;
  prefillEmail: string;
  onClose: () => void;
}

export function MotivationModal({
  votesGranted,
  donationId,
  prefillName,
  prefillEmail,
  onClose,
}: MotivationModalProps) {
  const { t, locale } = useI18n();
  const { refresh } = useVotes();

  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [region, setRegion] = useState<DonorRegion | ''>('');
  const [motivation, setMotivation] = useState('');
  const [connection, setConnection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setError(t('motivation.errorName'));
      return false;
    }
    if (!isValidEmail(email)) {
      setError(t('motivation.errorEmail'));
      return false;
    }
    if (!region) {
      setError(t('motivation.errorRegion'));
      return false;
    }
    if (motivation.trim().length < 10) {
      setError(t('motivation.required'));
      return false;
    }
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    recordMotivation({
      donationId,
      name: name.trim(),
      email: email.trim(),
      region,
      motivation: motivation.trim(),
      connection: connection.trim(),
    });
    refresh();
    setDone(true);
    setTimeout(onClose, 2200);
  };

  return (
    <Modal title={t('motivation.title')} onClose={onClose} variant="donate">
      <div className="motivation-modal">
        <div className="payment-success">
          <span className="success-check" aria-hidden>
            ✓
          </span>
          <p className="success-title">{t('donate.paymentSuccess')}</p>
          <p className="success-votes">{t('donate.votesReceived', { count: votesGranted })}</p>
        </div>

        {done ? (
          <div className="motivation-done" role="status">
            <span className="success-check small" aria-hidden>
              ✓
            </span>
            <p>{t('motivation.success', { count: BONUS_VOTE_FOR_MOTIVATION })}</p>
          </div>
        ) : (
          <>
            <div className="bonus-callout">
              <span className="bonus-plus">+{BONUS_VOTE_FOR_MOTIVATION}</span>
              <p>{t('motivation.bonusCallout', { count: BONUS_VOTE_FOR_MOTIVATION })}</p>
            </div>

            <p className="motivation-intro">{t('motivation.subtitle')}</p>
            <form onSubmit={handleSubmit} className="motivation-form">
              <div className="form-row">
                <label className="form-field">
                  <span>{t('motivation.name')}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    autoComplete="name"
                  />
                </label>
                <label className="form-field">
                  <span>{t('motivation.email')}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="form-field">
                <span>{t('motivation.region')}</span>
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value as DonorRegion | '');
                    setError(null);
                  }}
                >
                  <option value="">{t('motivation.regionPlaceholder')}</option>
                  {DONOR_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {regionLabel(r, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>{t('motivation.motivationLabel')}</span>
                <textarea
                  value={motivation}
                  onChange={(e) => {
                    setMotivation(e.target.value);
                    setError(null);
                  }}
                  placeholder={t('motivation.placeholder')}
                  rows={4}
                  maxLength={500}
                />
              </label>
              <p className="char-count">{motivation.length}/500</p>

              <label className="form-field">
                <span>{t('motivation.connection')}</span>
                <input
                  type="text"
                  value={connection}
                  onChange={(e) => setConnection(e.target.value)}
                  placeholder={t('motivation.connectionPlaceholder')}
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block">
                {t('motivation.submit', { count: BONUS_VOTE_FOR_MOTIVATION })}
              </button>
              <button type="button" className="btn-skip" onClick={onClose}>
                {t('motivation.skip')}
              </button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
