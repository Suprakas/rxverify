import React from 'react';
import './Skeleton.css';

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((key) => (
        <span
          key={key}
          className={`rx-skeleton rx-skeleton--${variant} ${className}`.trim()}
          style={{
            width: width || (variant === 'circle' ? '40px' : '100%'),
            height: height || (variant === 'text' ? '1rem' : variant === 'circle' ? '40px' : '80px')
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
