import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios.js';
import Button from '../../components/Button/Button.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import './MyPrescriptions.css';

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // File viewing modal state
  const [selectedRx, setSelectedRx] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  const fetchMyPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/prescriptions/mine');
      setPrescriptions(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load your prescriptions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPrescriptions();
  }, [fetchMyPrescriptions]);

  // Securely load uploaded file via authenticated route
  const handleViewFile = async (rx) => {
    setSelectedRx(rx);
    setLoadingFile(true);
    setFileError(null);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    try {
      const response = await apiClient.get(`/prescriptions/${rx._id || rx.id}/file`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      setFileError(
        err.response?.data?.error ||
          'Failed to retrieve prescription file from secure storage.'
      );
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCloseModal = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setSelectedRx(null);
    setFileError(null);
  };

  return (
    <div className="rx-my-prescriptions-page">
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <h1 className="rx-dash-title">My Prescriptions Vault</h1>
          <p className="rx-dash-desc">
            Review status updates, pharmacist clinical review notes, and secure digital records for all prescriptions uploaded to your patient profile.
          </p>
        </div>
        <Link to="/upload">
          <Button variant="primary" size="md">
            + Upload Prescription
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="rx-prescriptions-error-state">
          <Alert
            variant="danger"
            title="Unable to load prescriptions"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
          <Button variant="secondary" size="sm" onClick={fetchMyPrescriptions}>
            ↻ Retry Loading
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="rx-prescriptions-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rx-prescription-card rx-prescription-card--loading">
              <div className="rx-rx-header-row">
                <Skeleton width="180px" height="24px" />
                <Skeleton width="100px" height="24px" variant="rect" />
              </div>
              <Skeleton width="60%" height="18px" />
              <Skeleton width="40%" height="16px" />
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Skeleton width="120px" height="36px" variant="rect" />
                <Skeleton width="100px" height="36px" variant="rect" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && prescriptions.length === 0 && (
        <div className="rx-empty-state-card">
          <div className="rx-empty-state-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="rx-empty-state-title">No Prescriptions Uploaded Yet</h2>
          <p className="rx-empty-state-text">
            You do not have any active or previous prescription documents in your vault. Upload your script document to initiate clinical pharmacy verification and order fulfillment.
          </p>
          <Link to="/upload">
            <Button variant="primary" size="md">
              Upload Your First Prescription
            </Button>
          </Link>
        </div>
      )}

      {/* Prescriptions List */}
      {!loading && !error && prescriptions.length > 0 && (
        <div className="rx-prescriptions-list">
          {prescriptions.map((rx) => {
            const hasDocument = Boolean(rx.fileKey);
            const isImage = rx.mimeType?.startsWith('image/');
            const isPdf = rx.mimeType === 'application/pdf';

            return (
              <div key={rx._id || rx.id} className="rx-prescription-card">
                <div className="rx-rx-header-row">
                  <div className="rx-rx-title-group">
                    <span className="rx-rx-number">{rx.rxNumber}</span>
                    <span className="rx-rx-date">
                      Uploaded on {new Date(rx.createdAt).toLocaleDateString()} at{' '}
                      {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <StatusBadge status={rx.status} />
                </div>

                <div className="rx-rx-body-grid">
                  <div className="rx-rx-info-block">
                    <span className="rx-info-label">Medication / Regimen</span>
                    <strong className="rx-info-primary">{rx.medication || 'Prescription Document'}</strong>
                    {rx.dosage && <span className="rx-info-sub">{rx.dosage}</span>}
                  </div>

                  <div className="rx-rx-info-block">
                    <span className="rx-info-label">Doctor / Clinic</span>
                    <span className="rx-info-primary">{rx.prescriberName || 'Pending Verification'}</span>
                    {rx.clinicName && <span className="rx-info-sub">{rx.clinicName}</span>}
                  </div>

                  {hasDocument && (
                    <div className="rx-rx-info-block">
                      <span className="rx-info-label">Attached Document</span>
                      <span className="rx-info-primary rx-file-badge">
                        📄 {rx.originalName} ({(rx.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Pharmacist Review Notes */}
                {(rx.notes || rx.verificationNotes) && (
                  <div className="rx-pharmacist-notes-callout">
                    <div className="rx-notes-header">
                      <strong>Pharmacist Review Notes</strong>
                      {rx.reviewerName && <span>Reviewed by {rx.reviewerName}</span>}
                    </div>
                    <p className="rx-notes-text">
                      "{rx.notes || rx.verificationNotes}"
                    </p>
                  </div>
                )}

                {/* Review History Trail */}
                {Array.isArray(rx.history) && rx.history.length > 0 && (
                  <div className="rx-history-timeline">
                    <span className="rx-timeline-title">Audit Trail & Status History</span>
                    <div className="rx-timeline-entries">
                      {rx.history.map((h, hIdx) => (
                        <div key={hIdx} className="rx-timeline-entry">
                          <span className="rx-timeline-dot" />
                          <div className="rx-timeline-content">
                            <span className="rx-timeline-status">{h.status}</span>
                            <span className="rx-timeline-meta">
                              by {h.by} &bull; {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {h.comment && <p className="rx-timeline-comment">{h.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="rx-rx-actions-row">
                  {hasDocument ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewFile(rx)}
                    >
                      👁 View Secure Document
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedRx(rx)}
                    >
                      View Intake Details
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Secure Document Viewer Modal */}
      {selectedRx && (
        <Modal
          isOpen={Boolean(selectedRx)}
          onClose={handleCloseModal}
          title={`Prescription Document: ${selectedRx.rxNumber}`}
          maxWidth="720px"
        >
          <div className="rx-document-modal-content">
            <div className="rx-doc-modal-meta">
              <div>
                <strong>{selectedRx.originalName || 'Prescription Slip'}</strong>
                <span className="rx-doc-sub">
                  Status: <StatusBadge status={selectedRx.status} />
                </span>
              </div>
              {previewBlobUrl && (
                <a
                  href={previewBlobUrl}
                  download={selectedRx.originalName || 'prescription'}
                  className="rx-download-link"
                >
                  <Button variant="secondary" size="sm">
                    ⬇ Download Copy
                  </Button>
                </a>
              )}
            </div>

            {loadingFile && (
              <div className="rx-file-loading-area">
                <Skeleton width="100%" height="320px" variant="rect" />
                <p>Retrieving encrypted file from local uploads vault...</p>
              </div>
            )}

            {fileError && (
              <Alert variant="danger">
                {fileError}
              </Alert>
            )}

            {!loadingFile && !fileError && previewBlobUrl && (
              <div className="rx-file-render-area">
                {selectedRx.mimeType?.startsWith('image/') ? (
                  <img
                    src={previewBlobUrl}
                    alt={selectedRx.originalName || 'Prescription Image'}
                    className="rx-rendered-img"
                  />
                ) : selectedRx.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewBlobUrl}
                    title="PDF Prescription Preview"
                    className="rx-rendered-iframe"
                  />
                ) : (
                  <div className="rx-rendered-fallback">
                    <p>Document preview loaded ({selectedRx.mimeType}).</p>
                    <a href={previewBlobUrl} download={selectedRx.originalName}>
                      <Button variant="primary" size="md">
                        Download Document
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="rx-modal-actions">
              <Button variant="secondary" onClick={handleCloseModal}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
