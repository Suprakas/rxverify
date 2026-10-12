import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axios.js';
import FileUploader from '../../components/FileUploader/FileUploader.jsx';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import './Upload.css';

export default function Upload() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [medication, setMedication] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [notes, setNotes] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedRx, setUploadedRx] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setUploadError('Please select or drop a prescription file (PDF, JPG, or PNG) before submitting.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (medication.trim()) formData.append('medication', medication.trim());
    if (prescriberName.trim()) formData.append('prescriberName', prescriberName.trim());
    if (notes.trim()) formData.append('notes', notes.trim());

    try {
      const response = await apiClient.post('/prescriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setUploadedRx(response.data.data);
      setSelectedFile(null);
      setMedication('');
      setPrescriberName('');
      setNotes('');
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message || 'Prescription upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rx-upload-page">
      <div className="rx-dash-hero">
        <div className="rx-dash-hero__text">
          <h1 className="rx-dash-title">Upload Prescription Document</h1>
          <p className="rx-dash-desc">
            Submit your official paper prescription slip, electronic clinical document, or digital doctor order for pharmacy verification. Licensed pharmacists verify medication dosing, refills, and contraindications before dispensing.
          </p>
        </div>
        <Link to="/my-prescriptions">
          <Button variant="secondary" size="md">
            View My Prescriptions →
          </Button>
        </Link>
      </div>

      {uploadedRx && (
        <Alert
          variant="success"
          title="Prescription Uploaded Successfully!"
          onClose={() => setUploadedRx(null)}
          className="rx-upload-success-alert"
        >
          <p>
            Your prescription <strong>{uploadedRx.rxNumber}</strong> ({uploadedRx.originalName}) has been securely deposited into the pharmacy review queue with status <strong>{uploadedRx.status}</strong>.
          </p>
          <div className="rx-alert-btn-row">
            <Link to="/my-prescriptions">
              <Button variant="primary" size="sm">
                Go to My Prescriptions List
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUploadedRx(null)}
            >
              Upload Another
            </Button>
          </div>
        </Alert>
      )}

      {uploadError && (
        <Alert
          variant="danger"
          title="Upload Error"
          onClose={() => setUploadError(null)}
        >
          {uploadError}
        </Alert>
      )}

      <div className="rx-upload-form-card">
        <form onSubmit={handleSubmit} className="rx-upload-form">
          <div className="rx-upload-section">
            <h2 className="rx-upload-section-title">1. Document File</h2>
            <p className="rx-upload-section-sub">
              Drag and drop your scanned script, hospital discharge slip, or take a clear photo of the prescription.
            </p>

            <FileUploader
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                setUploadError(null);
              }}
              onClear={() => setSelectedFile(null)}
              progress={uploadProgress}
              isUploading={isUploading}
              error={null}
              disabled={isUploading}
            />
          </div>

          <div className="rx-upload-section">
            <h2 className="rx-upload-section-title">2. Prescription Details (Optional)</h2>
            <p className="rx-upload-section-sub">
              Providing details helps expedite clinical transcription by our pharmacist staff.
            </p>

            <div className="rx-form-grid-2">
              <FormField
                label="Medication Name / Strength"
                htmlFor="medication"
                hint="e.g. Amoxicillin 500mg, Lisinopril 10mg"
              >
                <Input
                  id="medication"
                  type="text"
                  placeholder="e.g. Amoxicillin 500mg"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  disabled={isUploading}
                />
              </FormField>

              <FormField
                label="Doctor / Prescriber Name"
                htmlFor="prescriberName"
                hint="Printed on prescription letterhead"
              >
                <Input
                  id="prescriberName"
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendleton, MD"
                  value={prescriberName}
                  onChange={(e) => setPrescriberName(e.target.value)}
                  disabled={isUploading}
                />
              </FormField>
            </div>

            <FormField
              label="Notes or Instructions for the Pharmacist"
              htmlFor="notes"
              hint="Include details like preferred pharmacy pickup, known drug allergies, or refill requests"
            >
              <textarea
                id="notes"
                className="rx-textarea"
                rows={3}
                placeholder="e.g. Please verify if generic substitute is available. First time taking this medication."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isUploading}
              />
            </FormField>
          </div>

          <div className="rx-upload-submit-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isUploading}
              disabled={!selectedFile || isUploading}
              className="rx-upload-submit-btn"
            >
              Submit Prescription for Verification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
