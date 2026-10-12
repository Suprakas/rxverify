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
import './PatientDashboard.css';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // New Rx Modal
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

  // View details modal
  const [selectedRx, setSelectedRx] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/prescriptions');
      setPrescriptions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your prescriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleNewRxSubmit = async (e) => {
    e.preventDefault();
    if (!newRxForm.medication || !newRxForm.dosage || !newRxForm.prescriberName) {
      setNewRxError('Please complete medication name, dosage regimen, and doctor name.');
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
      setSuccessBanner('Prescription submitted successfully for clinical pharmacist verification.');
      fetchPrescriptions();
    } catch (err) {
      setNewRxError(err.response?.data?.error || 'Failed to submit prescription.');
    } finally {
      setSubmittingNewRx(false);
    }
  };

  const totalRx = prescriptions.length;
  const verifiedRx = prescriptions.filter((p) => p.status === 'verified').length;
  const pendingRx = prescriptions.filter((p) => p.status === 'pending').length;
  const flaggedRx = prescriptions.filter((p) => p.status === 'flagged').length;

  const columns = [
    {
      header: 'Rx Identifier',
      accessor: 'rxNumber',
      render: (val, row) => (
        <div className="rx-patient-col-rx">
          <span className="rx-patient-rx-num">{val}</span>
          <span className="rx-patient-rx-date">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Medication & Regimen',
      accessor: 'medication',
      render: (val, row) => (
        <div className="rx-patient-col-med">
          <strong className="rx-patient-med-name">{val}</strong>
          <span className="rx-patient-med-sig">{row.dosage}</span>
          <span className="rx-patient-med-meta">
            Qty: {row.quantity} &bull; Refills: {row.refills}
          </span>
        </div>
      ),
    },
    {
      header: 'Prescribing Physician',
      accessor: 'prescriberName',
      render: (val, row) => (
        <div className="rx-patient-col-doc">
          <span>{val}</span>
          <span className="rx-patient-doc-clinic">{row.clinicName || 'Clinic'}</span>
        </div>
      ),
    },
    {
      header: 'Verification Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedRx(row)}
        >
          View Status & Notes
        </Button>
      ),
    },
  ];

  return (
    <div className="rx-patient-dash">
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <h1 className="rx-dash-title">Patient Portal & Prescriptions</h1>
          <p className="rx-dash-desc">
            Welcome back, {user?.name}. Monitor active medications, clinical verification decisions by licensed pharmacists, and submit new prescription intake requests.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsNewRxModalOpen(true)}
        >
          + Request Verification
        </Button>
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

      <div className="rx-metrics-grid">
        <div className="rx-metric-card">
          <span className="rx-metric-label">My Prescriptions</span>
          <span className="rx-metric-value">{totalRx}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--pending">
          <span className="rx-metric-label">Pending Verification</span>
          <span className="rx-metric-value">{pendingRx}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--verified">
          <span className="rx-metric-label">Verified & Ready</span>
          <span className="rx-metric-value">{verifiedRx}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--flagged">
          <span className="rx-metric-label">Action / Needs Review</span>
          <span className="rx-metric-value">{flaggedRx}</span>
        </div>
      </div>

      <div className="rx-patient-table-section">
        <h2 className="rx-section-title">My Prescription Records</h2>
        <DataTable
          columns={columns}
          data={prescriptions}
          loading={loading}
          emptyMessage="You have no prescription records submitted yet. Click '+ Request Verification' above to submit one."
        />
      </div>

      {/* Selected Rx Detail Modal */}
      {selectedRx && (
        <Modal
          isOpen={Boolean(selectedRx)}
          onClose={() => setSelectedRx(null)}
          title={`Prescription: ${selectedRx.rxNumber}`}
          maxWidth="580px"
        >
          <div className="rx-modal-details">
            <div className="rx-detail-box">
              <span className="rx-detail-label">Medication & Regimen</span>
              <p className="rx-detail-med-name">{selectedRx.medication}</p>
              <p className="rx-detail-sig">{selectedRx.dosage}</p>
              <div className="rx-detail-inline">
                <span>Quantity: <strong>{selectedRx.quantity}</strong></span>
                <span>Refills Remaining: <strong>{selectedRx.refills}</strong></span>
              </div>
            </div>

            <div className="rx-detail-row">
              <div>
                <span className="rx-detail-label">Doctor</span>
                <strong className="rx-detail-val">{selectedRx.prescriberName}</strong>
                <span className="rx-detail-sub">NPI: {selectedRx.prescriberNpi}</span>
              </div>
              <div>
                <span className="rx-detail-label">Current Verification Status</span>
                <StatusBadge status={selectedRx.status} />
              </div>
            </div>

            {selectedRx.verificationNotes && (
              <div className="rx-verified-by-box">
                <span className="rx-detail-label">Pharmacist Clinical Notes</span>
                {selectedRx.verifiedByName && (
                  <p><strong>Reviewed by:</strong> {selectedRx.verifiedByName}</p>
                )}
                <p className="rx-previous-notes">"{selectedRx.verificationNotes}"</p>
              </div>
            )}

            <div className="rx-modal-actions">
              <Button variant="secondary" onClick={() => setSelectedRx(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit New Prescription Modal */}
      {isNewRxModalOpen && (
        <Modal
          isOpen={isNewRxModalOpen}
          onClose={() => setIsNewRxModalOpen(false)}
          title="Submit Prescription for Clinical Verification"
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

              <FormField label="Prescriber 10-Digit NPI" htmlFor="prescriberNpi" required hint="Found on your prescription label or slip">
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

            <FormField label="Clinic or Practice Name" htmlFor="clinicName">
              <Input
                id="clinicName"
                type="text"
                placeholder="e.g. Metro Health Internal Medicine"
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
