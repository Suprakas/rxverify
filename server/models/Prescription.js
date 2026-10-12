import mongoose from 'mongoose';
import { getIsMongooseConnected, memoryStore } from '../utils/db.js';

export const prescriptionSchema = new mongoose.Schema(
  {
    rxNumber: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientDob: {
      type: String,
      default: '',
    },
    prescriberName: {
      type: String,
      required: true,
    },
    prescriberNpi: {
      type: String,
      required: true,
    },
    clinicName: {
      type: String,
      default: '',
    },
    medication: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    refills: {
      type: Number,
      default: 0,
    },
    diagnosis: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'flagged', 'rejected'],
      default: 'pending',
    },
    allergyCheck: {
      type: String,
      enum: ['passed', 'warning', 'unknown'],
      default: 'passed',
    },
    interactionCheck: {
      type: String,
      enum: ['none_detected', 'moderate', 'severe'],
      default: 'none_detected',
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    verifiedByName: {
      type: String,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: null,
    },
    verificationDate: {
      type: Date,
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
    const newRx = {
      _id: `rx_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`,
      id: `rx_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`,
      rxNumber: data.rxNumber || `RX-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: 'pending',
      allergyCheck: data.allergyCheck || 'passed',
      interactionCheck: data.interactionCheck || 'none_detected',
      verifiedBy: null,
      verifiedByName: null,
      verificationNotes: null,
      verificationDate: null,
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
    memoryStore.prescriptions[index] = {
      ...memoryStore.prescriptions[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return memoryStore.prescriptions[index];
  },
};

export default Prescription;
