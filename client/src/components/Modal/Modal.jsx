import React, { useEffect } from 'react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
  className = ''
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="rx-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`rx-modal-dialog ${className}`.trim()}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'rx-modal-title' : undefined}
      >
        <div className="rx-modal__header">
          {title && <h3 id="rx-modal-title" className="rx-modal__title">{title}</h3>}
          <button
            type="button"
            className="rx-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="rx-modal__body">
          {children}
        </div>

        {footer && (
          <div className="rx-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
