import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  title: string;
  headerMeta?: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'sm';
  variant?: 'default' | 'donate' | 'profile';
  hideHeader?: boolean;
  dialogClassName?: string;
}

export function Modal({
  title,
  headerMeta,
  onClose,
  children,
  size = 'md',
  variant = 'default',
  hideHeader = false,
  dialogClassName,
}: ModalProps) {
  const dialogClass = `modal-dialog ${size} ${variant}${dialogClassName ? ` ${dialogClassName}` : ''}`;

  const modalContent = (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hideHeader ? undefined : 'modal-title'}
        aria-label={hideHeader ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader ? (
          <header className={`modal-header ${variant}`}>
            <div className="modal-header-title-group">
              <h2 id="modal-title">{title}</h2>
              {headerMeta ? <p className="modal-header-meta">{headerMeta}</p> : null}
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
        ) : null}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
