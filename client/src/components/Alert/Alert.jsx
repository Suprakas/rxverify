import React from 'react';
import './Alert.css';

export default function Alert({
  variant = 'danger',
  title,
  children,
  onClose,
  className = ''
}) {
  const classes = [
    'rx-alert',
    `rx-alert--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      <div className="rx-alert__content">
        {title && <strong className="rx-alert__title">{title}</strong>}
        <div className="rx-alert__body">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="rx-alert__close"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
}
