import React from 'react';
import Spinner from '../Spinner/Spinner.jsx';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  ...rest
}) {
  const classes = [
    'rx-btn',
    `rx-btn--${variant}`,
    `rx-btn--${size}`,
    fullWidth ? 'rx-btn--full' : '',
    loading ? 'rx-btn--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <span className="rx-btn__loading-wrapper">
          <Spinner size={size === 'lg' ? 'md' : 'sm'} color="currentColor" />
          <span className="rx-btn__text">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
