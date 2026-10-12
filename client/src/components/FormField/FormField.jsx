import React from 'react';
import './FormField.css';

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className = '',
  children
}) {
  return (
    <div className={`rx-form-field ${error ? 'rx-form-field--has-error' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="rx-form-field__label">
          {label}
          {required && <span className="rx-form-field__required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="rx-form-field__control">
        {children}
      </div>

      {hint && !error && (
        <p className="rx-form-field__hint">{hint}</p>
      )}

      {error && (
        <p className="rx-form-field__error" role="alert">{error}</p>
      )}
    </div>
  );
}
