import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getIsMongooseConnected, memoryStore } from '../utils/db.js';

export const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
      type: String,
      enum: ['patient', 'pharmacist', 'admin'],
      default: 'patient',
    },
    licenseNumber: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const MongooseUserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Robust Model interface that uses Mongoose or memoryStore
export const User = {
  async findOne(query) {
    if (getIsMongooseConnected()) {
      return MongooseUserModel.findOne(query);
    }
    const found = memoryStore.users.find((u) => {
      for (const key of Object.keys(query)) {
        if (key === 'email' && u.email.toLowerCase() !== query[key].toLowerCase()) return false;
        if (key === '_id' && u._id !== query[key] && u.id !== query[key]) return false;
        if (key === 'refreshToken' && u.refreshToken !== query[key]) return false;
      }
      return true;
    });
    if (!found) return null;
    return {
      ...found,
      comparePassword: async (pwd) => bcrypt.compare(pwd, found.password),
    };
  },

  async findById(id) {
    if (getIsMongooseConnected()) {
      return MongooseUserModel.findById(id);
    }
    const found = memoryStore.users.find((u) => u._id === id || u.id === id);
    if (!found) return null;
    return {
      ...found,
      comparePassword: async (pwd) => bcrypt.compare(pwd, found.password),
    };
  },

  async create(userData) {
    if (getIsMongooseConnected()) {
      return MongooseUserModel.create(userData);
    }
    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.push(newUser);
    return {
      ...newUser,
      comparePassword: async (pwd) => bcrypt.compare(pwd, newUser.password),
    };
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (getIsMongooseConnected()) {
      return MongooseUserModel.findByIdAndUpdate(id, updateData, options);
    }
    const index = memoryStore.users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;
    memoryStore.users[index] = {
      ...memoryStore.users[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return memoryStore.users[index];
  },

  async find(query = {}) {
    if (getIsMongooseConnected()) {
      return MongooseUserModel.find(query);
    }
    return memoryStore.users.map((u) => ({
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      licenseNumber: u.licenseNumber,
      phone: u.phone,
      dateOfBirth: u.dateOfBirth,
      createdAt: u.createdAt,
    }));
  },
};

export default User;
