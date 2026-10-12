import mongoose from 'mongoose';
import { getIsMongooseConnected, memoryStore } from '../utils/db.js';

export const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    requiresPrescription: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const MongooseMedicationModel =
  mongoose.models.Medication || mongoose.model('Medication', medicationSchema);

if (!memoryStore.medications) {
  memoryStore.medications = [];
}

export const Medication = {
  async find(query = {}) {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.find(query).sort({ name: 1 });
    }
    let list = [...memoryStore.medications];
    if (query.requiresPrescription !== undefined) {
      list = list.filter((m) => m.requiresPrescription === query.requiresPrescription);
    }
    if (query.sku) {
      list = list.filter((m) => m.sku === query.sku);
    }
    return list;
  },

  async findOne(query = {}) {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.findOne(query);
    }
    return memoryStore.medications.find((m) => {
      for (const key of Object.keys(query)) {
        if (m[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  async findById(id) {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.findById(id);
    }
    return memoryStore.medications.find((m) => m._id === id || m.id === id) || null;
  },

  async create(data) {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.create(data);
    }
    const newMed = {
      _id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
      sku: data.sku.toUpperCase(),
    };
    memoryStore.medications.push(newMed);
    return newMed;
  },

  async insertMany(items) {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.insertMany(items);
    }
    const inserted = items.map((data, idx) => ({
      _id: `med_${Date.now()}_${idx}`,
      id: `med_${Date.now()}_${idx}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
      sku: data.sku.toUpperCase(),
    }));
    memoryStore.medications.push(...inserted);
    return inserted;
  },

  async countDocuments() {
    if (getIsMongooseConnected()) {
      return MongooseMedicationModel.countDocuments();
    }
    return memoryStore.medications.length;
  },
};

export default Medication;