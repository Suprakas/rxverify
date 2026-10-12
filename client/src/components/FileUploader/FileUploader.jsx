import React, { useState, useRef, useEffect } from 'react';
import Button from '../Button/Button.jsx';
import './FileUploader.css';

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const DEFAULT_ACCEPTED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function FileUploader({
  selectedFile,
  onFileSelect,
  onClear,
  progress = 0,
  isUploading = false,
  error = null,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  className = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (selectedFile && selectedFile.type?.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const validateFile = (file) => {
    if (!file) return null;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isExtAllowed = DEFAULT_ACCEPTED_EXTS.includes(ext);
    const isTypeAllowed = DEFAULT_ACCEPTED_TYPES.includes(file.type.toLowerCase()) || isExtAllowed;

    if (!isTypeAllowed) {
      return 'Unsupported file format. Please upload a PDF, JPG, or PNG document.';
    }

    if (file.size > maxSize) {
      const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
      return `File exceeds maximum allowed size of ${maxMb} MB (file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
    }

    return null;
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const validationErr = validateFile(file);

    if (validationErr) {
      setClientError(validationErr);
      if (onClear) onClear();
    } else {
      setClientError(null);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setClientError(null);
    if (onClear) onClear();
  };

  const displayError = clientError || error;

  return (
    <div className={`rx-file-uploader ${className}`.trim()}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="rx-file-input-hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />

      {!selectedFile ? (
        <div
          className={`rx-dropzone ${isDragOver ? 'rx-dropzone--active' : ''} ${disabled ? 'rx-dropzone--disabled' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleBrowseClick();
          }}
          aria-label="Upload prescription file dropzone"
        >
          <div className="rx-dropzone__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="rx-dropzone__content">
            <strong className="rx-dropzone__prompt">
              Drag & drop your prescription document here
            </strong>
            <span className="rx-dropzone__sub">
              or <span className="rx-dropzone__browse">browse files</span> from your device
            </span>
            <span className="rx-dropzone__restrictions">
              Supported formats: PDF, JPG, PNG &bull; Max size: 5 MB
            </span>
          </div>
        </div>
      ) : (
        <div className="rx-file-preview-card">
          <div className="rx-preview-content">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Prescription preview"
                className="rx-preview-img"
              />
            ) : (
              <div className="rx-preview-doc-icon">
                <span className="rx-doc-badge">PDF</span>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            )}

            <div className="rx-preview-meta">
              <strong className="rx-preview-filename">{selectedFile.name}</strong>
              <span className="rx-preview-filesize">
                {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || 'Document'}
              </span>
              <span className="rx-preview-ready">✓ Ready for submission</span>
            </div>
          </div>

          {!isUploading && (
            <div className="rx-preview-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBrowseClick}
              >
                Change File
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemove}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="rx-upload-progress">
          <div className="rx-progress-label-row">
            <span className="rx-progress-text">Uploading prescription to secure clinical vault...</span>
            <span className="rx-progress-percent">{Math.round(progress)}%</span>
          </div>
          <div className="rx-progress-track">
            <div
              className="rx-progress-bar"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      )}

      {/* Validation Message */}
      {displayError && (
        <p className="rx-upload-error-msg" role="alert">
          <span aria-hidden="true">⚠ </span>
          {displayError}
        </p>
      )}
    </div>
  );
}
