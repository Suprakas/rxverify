import mongoose from 'mongoose';
import { getIsMongooseConnected, memoryStore } from '../utils/db.js';

export const prescriptionHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    by: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

export const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      default: '',
    },
    patientDob: {
      type: String,
      default: '',
    },
    rxNumber: {
      type: String,
      default: () => `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    fileKey: {
      type: String,
      default: null,
    },
    originalName: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'IN_REVIEW',
        'APPROVED',
        'REJECTED',
        'CHANGES_REQUESTED',
        // Backwards compatibility aliases
        'pending',
        'verified',
        'flagged',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    reviewerId: {
      type: String,
      default: null,
    },
    reviewerName: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    history: {
      type: [prescriptionHistorySchema],
      default: [],
    },

    // Clinical prescription metadata
    medication: {
      type: String,
      default: '',
    },
    dosage: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 30,
    },
    refills: {
      type: Number,
      default: 0,
    },
    prescriberName: {
      type: String,
      default: '',
    },
    prescriberNpi: {
      type: String,
      default: '',
    },
    clinicName: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    allergyCheck: {
      type: String,
      default: 'passed',
    },
    interactionCheck: {
      type: String,
      default: 'none_detected',
    },
    verificationNotes: {
      type: String,
      default: null,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    verifiedByName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const MongoosePrescriptionModel =
  mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export const Prescription = {
  async find(query = {}) {
    if (getIsMongooseConnected()) {
      return MongoosePrescriptionModel.find(query).sort({ createdAt: -1 });
    }
    let list = [...memoryStore.prescriptions];
    if (query.patientId) {
      list = list.filter((p) => p.patientId === query.patientId);
    }
    if (query.status) {
      list = list.filter((p) => p.status === query.status);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(id) {
    if (getIsMongooseConnected()) {
      return MongoosePrescriptionModel.findById(id);
    }
    return memoryStore.prescriptions.find((p) => p._id === id || p.id === id) || null;
  },

  async create(data) {
    if (getIsMongooseConnected()) {
      return MongoosePrescriptionModel.create(data);
    }
    const rxId = `rx_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const newRx = {
      _id: rxId,
      id: rxId,
      rxNumber: data.rxNumber || `RX-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: data.status || 'SUBMITTED',
      history: data.history || [
        {
          status: data.status || 'SUBMITTED',
          by: data.patientName || 'Patient',
          at: new Date(),
          comment: 'Prescription document submitted for verification',
        },
      ],
      reviewerId: data.reviewerId || null,
      reviewerName: data.reviewerName || null,
      notes: data.notes || '',
      allergyCheck: data.allergyCheck || 'passed',
      interactionCheck: data.interactionCheck || 'none_detected',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    memoryStore.prescriptions.unshift(newRx);
    return newRx;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (getIsMongooseConnected()) {
      return MongoosePrescriptionModel.findByIdAndUpdate(id, updateData, options);
    }
    const index = memoryStore.prescriptions.findIndex((p) => p._id === id || p.id === id);
    if (index === -1) return null;

    const existing = memoryStore.prescriptions[index];
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };

    // If history is appended via $push
    if (updateData.$push?.history) {
      updated.history = [...(existing.history || []), updateData.$push.history];
    }

    memoryStore.prescriptions[index] = updated;
    return updated;
  },
};

export default Prescription;
