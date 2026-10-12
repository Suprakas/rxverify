import React from 'react';
import './Input.css';

const Input = React.forwardRef(function Input(
  {
    type = 'text',
    hasError = false,
    className = '',
    disabled = false,
    size = 'md',
    ...rest
  },
  ref
) {
  const classes = [
    'rx-input',
    `rx-input--${size}`,
    hasError ? 'rx-input--error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={classes}
      {...rest}
    />
  );
});

export default Input;
