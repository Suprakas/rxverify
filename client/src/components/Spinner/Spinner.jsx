import React from 'react';
import './Spinner.css';

export default function Spinner({ size = 'md', className = '', color = 'currentColor' }) {
  return (
    <span
      className={`rx-spinner rx-spinner--${size} ${className}`.trim()}
      style={{ borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  );
}
