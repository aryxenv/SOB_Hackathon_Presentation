import type { Player } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { Modal } from './Modal';
import './CardRevealModal.css';
import type { MouseEventHandler } from 'react';
import { useEffect, useState } from 'react';

interface CardRevealModalProps {
  card: Player;
  onClose: () => void;
  onOpenDeck: () => void;
}

export function CardRevealModal({ card, onClose, onOpenDeck }: CardRevealModalProps) {
  const { t } = useI18n();
  const [showDeckButton, setShowDeckButton] = useState(false);

  useEffect(() => {
    setShowDeckButton(false);
    const timeout = window.setTimeout(() => setShowDeckButton(true), 2100);
    return () => window.clearTimeout(timeout);
  }, [card.id]);

  const handleCardMove: MouseEventHandler<HTMLElement> = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 7;
    const ry = (px - 0.5) * 10;
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };

  const handleCardLeave: MouseEventHandler<HTMLElement> = (event) => {
    const el = event.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
  };

  return (
    <Modal title={t('engagement.revealModalTitle')} onClose={onClose} variant="donate" size="md">
      <div className="reveal-modal">
        <div className="reveal-fireworks" aria-hidden>
          <span className="burst burst-a" />
          <span className="burst burst-b" />
          <span className="burst burst-c" />
        </div>
        <div className="reveal-arena" aria-hidden>
          <span className="arena-ring" />
          <span className="arena-gate left" />
          <span className="arena-gate right" />
          <span className="arena-beam" />
        </div>
        <div className="reveal-pack-shell">
          <div className="reveal-card-stack" aria-hidden>
            <span className="stack-card back-one" />
            <span className="stack-card back-two" />
          </div>
          <div className="reveal-card-motion">
            <div className="reveal-card" onMouseMove={handleCardMove} onMouseLeave={handleCardLeave}>
              <span className="reveal-card-rim" aria-hidden />
              <span className="reveal-card-shine" aria-hidden />
              <div className="reveal-card-placeholder" aria-hidden />
              <p className="reveal-card-name">{card.name}</p>
              <p className="reveal-card-club">{card.team}</p>
              <span className="reveal-card-sport">{card.sport}</span>
            </div>
          </div>
        </div>
        {showDeckButton ? (
          <button
            type="button"
            className="reveal-open-deck-btn"
            onClick={() => {
              onClose();
              onOpenDeck();
            }}
          >
            {t('engagement.openDeckAfterReveal')}
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
