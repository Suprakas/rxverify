import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth.js';
import apiClient from '../../api/axios.js';
import Button from '../../components/Button/Button.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRx, setLoadingRx] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'users'
  const [selectedAuditRx, setSelectedAuditRx] = useState(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoadingRx(true);
    setLoadingUsers(true);

    try {
      const [rxRes, userRes] = await Promise.all([
        apiClient.get('/prescriptions'),
        apiClient.get('/auth/users'),
      ]);
      setPrescriptions(rxRes.data.data || []);
      setUsers(userRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch administrative data');
    } finally {
      setLoadingRx(false);
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics
  const totalPrescriptions = prescriptions.length;
  const verifiedCount = prescriptions.filter((p) => p.status === 'verified').length;
  const flaggedCount = prescriptions.filter((p) => p.status === 'flagged').length;
  const totalPharmacists = users.filter((u) => u.role === 'pharmacist').length;
  const totalPatients = users.filter((u) => u.role === 'patient').length;

  const rxAuditColumns = [
    {
      header: 'Rx ID & Date',
      accessor: 'rxNumber',
      render: (val, row) => (
        <div className="rx-admin-col-meta">
          <span className="rx-admin-id">{val}</span>
          <span className="rx-admin-sub">{new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (val, row) => (
        <div>
          <strong>{val}</strong>
          {row.patientDob && <div className="rx-admin-sub">DOB: {row.patientDob}</div>}
        </div>
      ),
    },
    {
      header: 'Medication',
      accessor: 'medication',
      render: (val, row) => (
        <div>
          <span className="rx-admin-med-name">{val}</span>
          <div className="rx-admin-sub">Qty: {row.quantity} &bull; Refills: {row.refills}</div>
        </div>
      ),
    },
    {
      header: 'Prescriber & NPI',
      accessor: 'prescriberName',
      render: (val, row) => (
        <div>
          <span>{val}</span>
          <div className="rx-admin-sub">NPI: {row.prescriberNpi}</div>
        </div>
      ),
    },
    {
      header: 'Verification Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Reviewing Pharmacist',
      accessor: 'verifiedByName',
      render: (val, row) => (
        <div>
          <span>{val || '—'}</span>
          {row.verificationDate && (
            <div className="rx-admin-sub">{new Date(row.verificationDate).toLocaleTimeString()}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Audit Action',
      accessor: '_id',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedAuditRx(row)}
        >
          View Audit Record
        </Button>
      ),
    },
  ];

  const userColumns = [
    {
      header: 'Full Name',
      accessor: 'name',
      render: (val) => <strong>{val}</strong>,
    },
    {
      header: 'Email Address',
      accessor: 'email',
    },
    {
      header: 'Role Authority',
      accessor: 'role',
      render: (val) => <StatusBadge variant={val} status={val} />,
    },
    {
      header: 'Professional License #',
      accessor: 'licenseNumber',
      render: (val) => (val ? <span className="rx-admin-mono">{val}</span> : '—'),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (val) => val || '—',
    },
    {
      header: 'Registered Date',
      accessor: 'createdAt',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div className="rx-admin-dash">
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <div className="rx-admin-tag">
            <span>Pharmacy System Administrator: {user?.name}</span>
          </div>
          <h1 className="rx-dash-title">Pharmacy Operations & Audit Center</h1>
          <p className="rx-dash-desc">
            Executive governance dashboard. Monitor verification throughput, audit pharmacist clinical determinations, inspect patient intake compliance, and verify role-based security enforcement.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={fetchData}>
          ↻ Refresh All Logs
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metrics */}
      <div className="rx-metrics-grid">
        <div className="rx-metric-card">
          <span className="rx-metric-label">Total Prescriptions</span>
          <span className="rx-metric-value">{totalPrescriptions}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--verified">
          <span className="rx-metric-label">Verified & Dispensed</span>
          <span className="rx-metric-value">{verifiedCount}</span>
        </div>
        <div className="rx-metric-card rx-metric-card--flagged">
          <span className="rx-metric-label">Clinical Safety Flags</span>
          <span className="rx-metric-value">{flaggedCount}</span>
        </div>
        <div className="rx-metric-card">
          <span className="rx-metric-label">Staff & Users</span>
          <span className="rx-metric-value">{users.length}</span>
          <span className="rx-admin-stat-sub">{totalPharmacists} RPh &bull; {totalPatients} Patients</span>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="rx-dash-controls">
        <div className="rx-filter-tabs">
          <button
            type="button"
            className={`rx-filter-tab ${activeTab === 'audit' ? 'rx-filter-tab--active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            📋 Master Prescription Audit Trail ({prescriptions.length})
          </button>
          <button
            type="button"
            className={`rx-filter-tab ${activeTab === 'users' ? 'rx-filter-tab--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User & Staff Directory ({users.length})
          </button>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'audit' && (
        <div className="rx-admin-table-container">
          <DataTable
            columns={rxAuditColumns}
            data={prescriptions}
            loading={loadingRx}
            emptyMessage="No prescription audit entries found in database."
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="rx-admin-table-container">
          <DataTable
            columns={userColumns}
            data={users}
            loading={loadingUsers}
            emptyMessage="No users registered in system directory."
          />
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAuditRx && (
        <Modal
          isOpen={Boolean(selectedAuditRx)}
          onClose={() => setSelectedAuditRx(null)}
          title={`Audit Record: ${selectedAuditRx.rxNumber}`}
          maxWidth="620px"
        >
          <div className="rx-modal-details">
            <div className="rx-detail-row">
              <div>
                <span className="rx-detail-label">Patient Record</span>
                <strong className="rx-detail-val">{selectedAuditRx.patientName}</strong>
                {selectedAuditRx.patientDob && (
                  <span className="rx-detail-sub">DOB: {selectedAuditRx.patientDob}</span>
                )}
              </div>
              <div>
                <span className="rx-detail-label">Prescribing Provider</span>
                <strong className="rx-detail-val">{selectedAuditRx.prescriberName}</strong>
                <span className="rx-detail-sub">NPI: {selectedAuditRx.prescriberNpi}</span>
              </div>
            </div>

            <div className="rx-detail-box">
              <span className="rx-detail-label">Medication & Regimen</span>
              <p className="rx-detail-med-name">{selectedAuditRx.medication}</p>
              <p className="rx-detail-sig">{selectedAuditRx.dosage}</p>
              <div className="rx-detail-inline">
                <span>Dispense Qty: <strong>{selectedAuditRx.quantity}</strong></span>
                <span>Refills: <strong>{selectedAuditRx.refills}</strong></span>
                <span>Diagnosis: <strong>{selectedAuditRx.diagnosis || 'Clinical Rx'}</strong></span>
              </div>
            </div>

            <div className="rx-safety-checks">
              <div className="rx-safety-card">
                <span className="rx-safety-title">Allergy Screen Status</span>
                <span className={`rx-safety-status rx-safety-status--${selectedAuditRx.allergyCheck}`}>
                  {selectedAuditRx.allergyCheck === 'passed' ? '✓ Passed Allergy Check' : '⚠ Warning Flag'}
                </span>
              </div>
              <div className="rx-safety-card">
                <span className="rx-safety-title">Interaction Screen</span>
                <span className={`rx-safety-status rx-safety-status--${selectedAuditRx.interactionCheck}`}>
                  {selectedAuditRx.interactionCheck === 'none_detected'
                    ? '✓ No Interactions Detected'
                    : selectedAuditRx.interactionCheck === 'moderate'
                    ? '⚠ Moderate Interaction Warning'
                    : '⛔ Severe Interaction Alert'}
                </span>
              </div>
            </div>

            <div className="rx-verified-by-box">
              <span className="rx-detail-label">Reviewing Pharmacist Determination</span>
              <p>
                <strong>Status:</strong> <StatusBadge status={selectedAuditRx.status} />
              </p>
              <p style={{ marginTop: '4px' }}>
                <strong>Verified by:</strong> {selectedAuditRx.verifiedByName || 'Pending Pharmacist Review'}
              </p>
              {selectedAuditRx.verificationDate && (
                <p className="rx-admin-sub">
                  Timestamp: {new Date(selectedAuditRx.verificationDate).toLocaleString()}
                </p>
              )}
              {selectedAuditRx.verificationNotes && (
                <p className="rx-previous-notes" style={{ marginTop: '8px' }}>
                  "{selectedAuditRx.verificationNotes}"
                </p>
              )}
            </div>

            <div className="rx-modal-actions">
              <Button variant="secondary" onClick={() => setSelectedAuditRx(null)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
