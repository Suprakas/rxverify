import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth.js';
import apiClient from '../../api/axios.js';
import Button from '../../components/Button/Button.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import './PharmacistDashboard.css';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Verify modal state
  const [selectedRx, setSelectedRx] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all'
        ? '/prescriptions'
        : `/prescriptions?status=${statusFilter}`;
      const res = await apiClient.get(url);
      setPrescriptions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      setVerifyError('Clinical verification notes are mandatory for regulatory audit compliance.');
      return;
    }

    setSubmittingVerify(true);
    setVerifyError(null);
    try {
      await apiClient.patch(`/prescriptions/${selectedRx._id || selectedRx.id}/verify`, {
        status: verifyStatus,
        verificationNotes: clinicalNotes.trim(),
      });
      setSuccessBanner(`Prescription ${selectedRx.rxNumber} has been recorded as "${verifyStatus.toUpperCase()}".`);
      setSelectedRx(null);
      setClinicalNotes('');
      fetchPrescriptions();
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Verification update failed.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const totalCount = prescriptions.length;
  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length;
  const verifiedCount = prescriptions.filter((p) => p.status === 'verified').length;
  const flaggedCount = prescriptions.filter((p) => p.status === 'flagged').length;

  const columns = [
    {
      header: 'Rx Identifier',
      accessor: 'rxNumber',
      render: (val, row) => (
        <div className="rx-pharma-col-rx">
          <span className="rx-pharma-rx-num">{val}</span>
          <span className="rx-pharma-rx-date">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      render: (val, row) => (
        <div className="rx-pharma-col-patient">
          <span className="rx-pharma-patient-name">{val}</span>
          {row.patientDob && (
            <span className="rx-pharma-patient-dob">DOB: {row.patientDob}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Medication & Regimen',
      accessor: 'medication',
      render: (val, row) => (
        <div className="rx-pharma-col-med">
          <strong className="rx-pharma-med-name">{val}</strong>
          <span className="rx-pharma-med-sig">{row.dosage}</span>
          <span className="rx-pharma-med-qty">
            Qty: {row.quantity} &bull; Refills: {row.refills}
          </span>
        </div>
      ),
    },
    {
      header: 'Prescriber',
      accessor: 'prescriberName',
      render: (val, row) => (
        <div className="rx-pharma-col-doc">
          <span>{val}</span>
          <span className="rx-pharma-doc-npi">NPI: {row.prescriberNpi}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Clinical Action',
      accessor: '_id',
      render: (_, row) => (
        <Button
          variant={row.status === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setSelectedRx(row);
            setVerifyStatus(row.status === 'pending' ? 'verified' : row.status);
            setClinicalNotes(row.verificationNotes || '');
            setVerifyError(null);
          }}
        >
          {row.status === 'pending' ? 'Verify Prescription' : 'Review Decision'}
        </Button>
      ),
    },
  ];

  return (
    <div className="rx-pharma-dash">
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <div className="rx-pharma-license-tag">
            <span className="rx-pharma-license-tag__dot" />
            <span>Licensed Pharmacist: {user?.name} (RPh #{user?.licenseNumber || 'ACTIVE'})</span>
          </div>
          <h1 className="rx-dash-title">Clinical Verification Queue</h1>
          <p className="rx-dash-desc">
            Authorized verification workstation. Review incoming electronic prescriptions, execute drug interaction screens, verify prescriber NPI credentials, and submit binding clinical determinations.
          </p>
        </div>
      </div>

      {successBanner && (
        <Alert variant="success" onClose={() => setSuccessBanner(null)}>
          {successBanner}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metrics */}
      <div className="rx-metrics-grid">
        <div className="rx-metric-card">
          <span className="rx-metric-label">Queue Total</span>
          <span className="rx-metric-value">{totalCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--pending">
          <span className="rx-metric-label">Pending Verification</span>
          <span className="rx-metric-value">{pendingCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--verified">
          <span className="rx-metric-label">Verified & Dispensed</span>
          <span className="rx-metric-value">{verifiedCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--flagged">
          <span className="rx-metric-label">Safety / Flagged</span>
          <span className="rx-metric-value">{flaggedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rx-dash-controls">
        <div className="rx-filter-tabs">
          {['pending', 'all', 'verified', 'flagged', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              className={`rx-filter-tab ${statusFilter === st ? 'rx-filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'pending' ? '⚡ Pending Review' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={prescriptions}
        loading={loading}
        emptyMessage={`No prescriptions found with status "${statusFilter}".`}
      />

      {/* Clinical Verification Modal */}
      {selectedRx && (
        <Modal
          isOpen={Boolean(selectedRx)}
          onClose={() => setSelectedRx(null)}
          title={`Clinical Verification: ${selectedRx.rxNumber}`}
          maxWidth="640px"
        >
          {verifyError && (
            <Alert variant="danger" onClose={() => setVerifyError(null)}>
              {verifyError}
            </Alert>
          )}

          <div className="rx-modal-details">
            <div className="rx-detail-row">
              <div>
                <span className="rx-detail-label">Patient Identity</span>
                <strong className="rx-detail-val">{selectedRx.patientName}</strong>
                {selectedRx.patientDob && (
                  <span className="rx-detail-sub">DOB: {selectedRx.patientDob}</span>
                )}
              </div>
              <div>
                <span className="rx-detail-label">Prescriber Verification</span>
                <strong className="rx-detail-val">{selectedRx.prescriberName}</strong>
                <span className="rx-detail-sub">NPI: {selectedRx.prescriberNpi}</span>
              </div>
            </div>

            <div className="rx-detail-box">
              <span className="rx-detail-label">Prescribed Drug & Regimen</span>
              <p className="rx-detail-med-name">{selectedRx.medication}</p>
              <p className="rx-detail-sig">{selectedRx.dosage}</p>
              <div className="rx-detail-inline">
                <span>Dispense Qty: <strong>{selectedRx.quantity}</strong></span>
                <span>Authorized Refills: <strong>{selectedRx.refills}</strong></span>
                <span>Diagnosis: <strong>{selectedRx.diagnosis || 'Clinical Rx'}</strong></span>
              </div>
            </div>

            <div className="rx-safety-checks">
              <div className="rx-safety-card">
                <span className="rx-safety-title">Allergy Cross-Check</span>
                <span className={`rx-safety-status rx-safety-status--${selectedRx.allergyCheck}`}>
                  {selectedRx.allergyCheck === 'passed' ? '✓ No Known Allergy Flags' : '⚠ Caution'}
                </span>
              </div>
              <div className="rx-safety-card">
                <span className="rx-safety-title">Drug Interaction Screen</span>
                <span className={`rx-safety-status rx-safety-status--${selectedRx.interactionCheck}`}>
                  {selectedRx.interactionCheck === 'none_detected'
                    ? '✓ No Interactions Detected'
                    : selectedRx.interactionCheck === 'moderate'
                    ? '⚠ Moderate Interaction Warning'
                    : '⛔ Severe Interaction Alert'}
                </span>
              </div>
            </div>

            {selectedRx.verifiedByName && (
              <div className="rx-verified-by-box">
                <span className="rx-detail-label">Previous Assessment</span>
                <p><strong>Verified by:</strong> {selectedRx.verifiedByName}</p>
                {selectedRx.verificationNotes && (
                  <p className="rx-previous-notes">"{selectedRx.verificationNotes}"</p>
                )}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="rx-verify-form">
              <FormField label="Clinical Pharmacist Determination" required>
                <div className="rx-decision-buttons">
                  <button
                    type="button"
                    className={`rx-decision-btn rx-decision-btn--verified ${verifyStatus === 'verified' ? 'rx-decision-btn--active' : ''}`}
                    onClick={() => setVerifyStatus('verified')}
                  >
                    ✓ Approve & Verify
                  </button>
                  <button
                    type="button"
                    className={`rx-decision-btn rx-decision-btn--flagged ${verifyStatus === 'flagged' ? 'rx-decision-btn--active' : ''}`}
                    onClick={() => setVerifyStatus('flagged')}
                  >
                    ⚠ Flag for Prescriber
                  </button>
                  <button
                    type="button"
                    className={`rx-decision-btn rx-decision-btn--rejected ${verifyStatus === 'rejected' ? 'rx-decision-btn--active' : ''}`}
                    onClick={() => setVerifyStatus('rejected')}
                  >
                    ✕ Reject
                  </button>
                </div>
              </FormField>

              <FormField
                label="Clinical Pharmacist Rationale & Notes"
                htmlFor="clinicalNotes"
                required
                hint="Audit documentation required by Pharmacy Board & HIPAA"
              >
                <textarea
                  id="clinicalNotes"
                  className="rx-textarea"
                  rows={3}
                  placeholder="Record clinical verification rationale, dosage confirmation, or prescriber outreach details..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </FormField>

              <div className="rx-modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedRx(null)}
                  disabled={submittingVerify}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={verifyStatus === 'rejected' ? 'danger' : 'primary'}
                  loading={submittingVerify}
                >
                  Commit {verifyStatus.charAt(0).toUpperCase() + verifyStatus.slice(1)} Decision
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
