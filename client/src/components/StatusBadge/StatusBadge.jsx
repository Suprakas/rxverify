import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, variant, className = '', children }) {
  const badgeVariant = variant || (typeof status === 'string' ? status.toLowerCase() : 'default');
  const label = children || status;

  return (
    <span className={`rx-badge rx-badge--${badgeVariant} ${className}`.trim()}>
      <span className="rx-badge__dot" aria-hidden="true" />
      <span className="rx-badge__label">{label}</span>
    </span>
  );
}
