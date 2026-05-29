import type { Player } from '../types';
import { Modal } from './Modal';
import './AthleteCardModal.css';
import { useRef } from 'react';
import type { MouseEventHandler } from 'react';

interface AthleteCardModalProps {
  card: Player;
  onClose: () => void;
}

export function AthleteCardModal({ card, onClose }: AthleteCardModalProps) {
  const cardNo = card.id.replace('ath-', '').slice(-6);
  const dialogRef = useRef<HTMLElement | null>(null);

  const resolveDialog = (source: HTMLElement): HTMLElement | null => {
    if (!dialogRef.current) {
      dialogRef.current = source.closest('.modal-dialog') as HTMLElement | null;
    }
    return dialogRef.current;
  };

  const handleCardMove: MouseEventHandler<HTMLElement> = (event) => {
    const dialog = resolveDialog(event.currentTarget);
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, px));
    const clampedY = Math.max(0, Math.min(1, py));
    const rx = (0.5 - clampedY) * 4.5;
    const ry = (clampedX - 0.5) * 6.5;
    dialog.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    dialog.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    dialog.style.setProperty('--mx', `${(clampedX * 100).toFixed(1)}%`);
    dialog.style.setProperty('--my', `${(clampedY * 100).toFixed(1)}%`);
  };

  const handleCardLeave: MouseEventHandler<HTMLElement> = (event) => {
    const dialog = resolveDialog(event.currentTarget);
    if (!dialog) return;
    dialog.style.setProperty('--rx', '0deg');
    dialog.style.setProperty('--ry', '0deg');
    dialog.style.setProperty('--mx', '50%');
    dialog.style.setProperty('--my', '50%');
  };

  return (
    <Modal
      title="Athlete card"
      onClose={onClose}
      variant="profile"
      size="md"
      hideHeader
      dialogClassName="athlete-card-dialog"
    >
      <article
        className="athlete-card-modal-face"
        onMouseMove={handleCardMove}
        onMouseLeave={handleCardLeave}
      >
        <button type="button" className="athlete-card-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="athlete-card-modal-shine" aria-hidden />
        <p className="athlete-card-modal-kicker">Card #{cardNo}</p>
        <div className="athlete-card-modal-placeholder" aria-hidden />
        <h3>{card.name}</h3>
        <p>{card.team}</p>
        <span>{card.sport}</span>
        <p className="athlete-card-modal-bio">{card.bio.en || card.bio.fr || card.bio.nl}</p>
      </article>
    </Modal>
  );
}
