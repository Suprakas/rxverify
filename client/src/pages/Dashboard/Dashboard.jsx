import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth.js';
import apiClient from '../../api/axios.js';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const { user, isPharmacist, isPatient, isAdmin } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify modal state (Pharmacist)
  const [selectedRx, setSelectedRx] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  // New Prescription modal state (Patient)
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [newRxForm, setNewRxForm] = useState({
    medication: '',
    dosage: '',
    quantity: 30,
    refills: 1,
    prescriberName: '',
    prescriberNpi: '',
    clinicName: '',
    diagnosis: '',
  });
  const [submittingNewRx, setSubmittingNewRx] = useState(false);
  const [newRxError, setNewRxError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

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
      setError(err.response?.data?.error || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Handle Pharmacist verification submission
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      setVerifyError('Clinical verification notes are required by pharmacy regulations.');
      return;
    }

    setSubmittingVerify(true);
    setVerifyError(null);
    try {
      await apiClient.patch(`/prescriptions/${selectedRx._id || selectedRx.id}/verify`, {
        status: verifyStatus,
        verificationNotes: clinicalNotes.trim(),
      });
      setSuccessBanner(`Prescription ${selectedRx.rxNumber} has been updated to "${verifyStatus}".`);
      setSelectedRx(null);
      setClinicalNotes('');
      fetchPrescriptions();
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Verification update failed.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Handle Patient new prescription submission
  const handleNewRxSubmit = async (e) => {
    e.preventDefault();
    if (!newRxForm.medication || !newRxForm.dosage || !newRxForm.prescriberName) {
      setNewRxError('Please fill in medication, dosage, and prescriber name.');
      return;
    }
    if (newRxForm.prescriberNpi.trim().length !== 10) {
      setNewRxError('Prescriber NPI must be exactly 10 digits.');
      return;
    }

    setSubmittingNewRx(true);
    setNewRxError(null);
    try {
      await apiClient.post('/prescriptions', {
        ...newRxForm,
        quantity: Number(newRxForm.quantity),
        refills: Number(newRxForm.refills),
      });
      setIsNewRxModalOpen(false);
      setNewRxForm({
        medication: '',
        dosage: '',
        quantity: 30,
        refills: 1,
        prescriberName: '',
        prescriberNpi: '',
        clinicName: '',
        diagnosis: '',
      });
      setSuccessBanner('Prescription submitted successfully for clinical verification.');
      fetchPrescriptions();
    } catch (err) {
      setNewRxError(err.response?.data?.error || 'Failed to submit prescription.');
    } finally {
      setSubmittingNewRx(false);
    }
  };

  // Metrics
  const totalCount = prescriptions.length;
  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length;
  const verifiedCount = prescriptions.filter((p) => p.status === 'verified').length;
  const flaggedCount = prescriptions.filter((p) => p.status === 'flagged').length;

  const tableColumns = [
    {
      header: 'Rx Identifier',
      accessor: 'rxNumber',
      render: (val, row) => (
        <div className="rx-col-rx">
          <span className="rx-col-rx__num">{val}</span>
          <span className="rx-col-rx__date">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      render: (val, row) => (
        <div className="rx-col-patient">
          <span className="rx-col-patient__name">{val}</span>
          {row.patientDob && (
            <span className="rx-col-patient__dob">DOB: {row.patientDob}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Medication & Regimen',
      accessor: 'medication',
      render: (val, row) => (
        <div className="rx-col-med">
          <strong className="rx-col-med__name">{val}</strong>
          <span className="rx-col-med__sig">{row.dosage}</span>
          <span className="rx-col-med__qty">
            Qty: {row.quantity} &bull; Refills: {row.refills}
          </span>
        </div>
      ),
    },
    {
      header: 'Prescriber',
      accessor: 'prescriberName',
      render: (val, row) => (
        <div className="rx-col-prescriber">
          <span>{val}</span>
          <span className="rx-col-prescriber__npi">NPI: {row.prescriberNpi}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (_, row) => (
        <div className="rx-table-actions">
          {isPharmacist ? (
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
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedRx(row);
                setClinicalNotes(row.verificationNotes || '');
              }}
            >
              View Details
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="rx-dashboard">
      {/* Top Banner / Hero */}
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <h1 className="rx-dash-title">
            {isPharmacist && 'Clinical Verification Queue'}
            {isPatient && 'My Prescriptions'}
            {isAdmin && 'Pharmacy Operations & Verification Overview'}
          </h1>
          <p className="rx-dash-desc">
            {isPharmacist &&
              'Review incoming electronic prescriptions, audit clinical drug interactions, verify prescriber credentials, and record verification decisions.'}
            {isPatient &&
              'Track clinical verification status for your active prescriptions. Direct coordination with licensed pharmacy staff.'}
            {isAdmin &&
              'Central management overview of prescription verification throughput, safety flags, and clinical staff audit.'}
          </p>
        </div>

        {isPatient && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewRxModalOpen(true)}
          >
            + Request Verification
          </Button>
        )}
      </div>

      {successBanner && (
        <Alert
          variant="success"
          onClose={() => setSuccessBanner(null)}
        >
          {successBanner}
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Metrics Strip */}
      <div className="rx-metrics-grid">
        <div className="rx-metric-card">
          <span className="rx-metric-label">Total Prescriptions</span>
          <span className="rx-metric-value">{totalCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--pending">
          <span className="rx-metric-label">Pending Verification</span>
          <span className="rx-metric-value">{pendingCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--verified">
          <span className="rx-metric-label">Verified & Approved</span>
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
          {['all', 'pending', 'verified', 'flagged', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              className={`rx-filter-tab ${statusFilter === st ? 'rx-filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prescriptions Table */}
      <DataTable
        columns={tableColumns}
        data={prescriptions}
        loading={loading}
        emptyMessage="No prescriptions match the selected status filter."
      />

      {/* Pharmacist / Review Modal */}
      {selectedRx && (
        <Modal
          isOpen={Boolean(selectedRx)}
          onClose={() => setSelectedRx(null)}
          title={`Prescription Review: ${selectedRx.rxNumber}`}
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
                <span className="rx-detail-label">Patient</span>
                <strong className="rx-detail-val">{selectedRx.patientName}</strong>
                {selectedRx.patientDob && (
                  <span className="rx-detail-sub">DOB: {selectedRx.patientDob}</span>
                )}
              </div>
              <div>
                <span className="rx-detail-label">Prescriber</span>
                <strong className="rx-detail-val">{selectedRx.prescriberName}</strong>
                <span className="rx-detail-sub">NPI: {selectedRx.prescriberNpi}</span>
              </div>
            </div>

            <div className="rx-detail-box">
              <span className="rx-detail-label">Rx Regimen & Instructions</span>
              <p className="rx-detail-med-name">{selectedRx.medication}</p>
              <p className="rx-detail-sig">{selectedRx.dosage}</p>
              <div className="rx-detail-inline">
                <span>Quantity: <strong>{selectedRx.quantity}</strong></span>
                <span>Refills: <strong>{selectedRx.refills}</strong></span>
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
                <span className="rx-detail-label">Previous Pharmacist Assessment</span>
                <p><strong>Verified by:</strong> {selectedRx.verifiedByName}</p>
                {selectedRx.verificationNotes && (
                  <p className="rx-previous-notes">"{selectedRx.verificationNotes}"</p>
                )}
              </div>
            )}

            {isPharmacist ? (
              <form onSubmit={handleVerifySubmit} className="rx-verify-form">
                <FormField label="Clinical Determination" required>
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
                  hint="Mandatory HIPAA/Pharmacy Board documentation for audit"
                >
                  <textarea
                    id="clinicalNotes"
                    className="rx-textarea"
                    rows={3}
                    placeholder="Enter clinical rationale, dosage confirmation, or prescriber outreach notes..."
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
                    Commit {verifyStatus.charAt(0).toUpperCase() + verifyStatus.slice(1)} Record
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rx-modal-actions">
                <Button variant="secondary" onClick={() => setSelectedRx(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Patient: Request Prescription Verification Modal */}
      {isNewRxModalOpen && (
        <Modal
          isOpen={isNewRxModalOpen}
          onClose={() => setIsNewRxModalOpen(false)}
          title="Submit Prescription for Verification"
          maxWidth="580px"
        >
          {newRxError && (
            <Alert variant="danger" onClose={() => setNewRxError(null)}>
              {newRxError}
            </Alert>
          )}

          <form onSubmit={handleNewRxSubmit} className="rx-new-rx-form">
            <FormField label="Medication Name & Strength" htmlFor="medication" required>
              <Input
                id="medication"
                type="text"
                placeholder="e.g. Amoxicillin 500mg capsules"
                value={newRxForm.medication}
                onChange={(e) => setNewRxForm({ ...newRxForm, medication: e.target.value })}
              />
            </FormField>

            <FormField label="Prescribed Dosage & Regimen" htmlFor="dosage" required>
              <Input
                id="dosage"
                type="text"
                placeholder="e.g. Take 1 capsule three times daily for 10 days"
                value={newRxForm.dosage}
                onChange={(e) => setNewRxForm({ ...newRxForm, dosage: e.target.value })}
              />
            </FormField>

            <div className="rx-form-grid-2">
              <FormField label="Dispense Quantity" htmlFor="quantity" required>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newRxForm.quantity}
                  onChange={(e) => setNewRxForm({ ...newRxForm, quantity: e.target.value })}
                />
              </FormField>

              <FormField label="Authorized Refills" htmlFor="refills">
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={newRxForm.refills}
                  onChange={(e) => setNewRxForm({ ...newRxForm, refills: e.target.value })}
                />
              </FormField>
            </div>

            <div className="rx-form-grid-2">
              <FormField label="Doctor / Prescriber Name" htmlFor="prescriberName" required>
                <Input
                  id="prescriberName"
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendleton, MD"
                  value={newRxForm.prescriberName}
                  onChange={(e) => setNewRxForm({ ...newRxForm, prescriberName: e.target.value })}
                />
              </FormField>

              <FormField label="Prescriber 10-Digit NPI" htmlFor="prescriberNpi" required hint="Found on prescription slip">
                <Input
                  id="prescriberNpi"
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 1942083115"
                  value={newRxForm.prescriberNpi}
                  onChange={(e) => setNewRxForm({ ...newRxForm, prescriberNpi: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Clinic or Hospital Name" htmlFor="clinicName">
              <Input
                id="clinicName"
                type="text"
                placeholder="e.g. Metro Health Family Clinic"
                value={newRxForm.clinicName}
                onChange={(e) => setNewRxForm({ ...newRxForm, clinicName: e.target.value })}
              />
            </FormField>

            <div className="rx-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setIsNewRxModalOpen(false)}
                disabled={submittingNewRx}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submittingNewRx}
              >
                Submit for Pharmacist Review
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
