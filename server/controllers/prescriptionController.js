import { z } from 'zod';
import { Prescription } from '../models/Prescription.js';

export const createPrescriptionSchema = z.object({
  medication: z.string().trim().min(2, 'Medication name is required'),
  dosage: z.string().trim().min(2, 'Dosage and instructions are required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  refills: z.number().int().min(0).default(0),
  prescriberName: z.string().trim().min(2, 'Prescriber name is required'),
  prescriberNpi: z.string().trim().length(10, 'NPI must be exactly 10 digits'),
  clinicName: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  patientName: z.string().trim().optional(),
  patientDob: z.string().trim().optional(),
});

export const verifyPrescriptionSchema = z.object({
  status: z.enum(['verified', 'flagged', 'rejected']),
  verificationNotes: z.string().trim().min(3, 'Clinical notes are required for prescription verification'),
  allergyCheck: z.enum(['passed', 'warning', 'unknown']).optional(),
  interactionCheck: z.enum(['none_detected', 'moderate', 'severe']).optional(),
});

export async function getPrescriptions(req, res, next) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let filter = {};

    // Patient can strictly only see their own prescriptions
    if (userRole === 'patient') {
      filter.patientId = userId;
    }

    if (req.query.status && ['pending', 'verified', 'flagged', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const prescriptions = await Prescription.find(filter);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPrescriptionById(req, res, next) {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    // Role check: patient can only see their own
    if (req.user.role === 'patient' && rx.patientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: you cannot view prescriptions belonging to other patients',
      });
    }

    res.status(200).json({
      success: true,
      data: rx,
    });
  } catch (err) {
    next(err);
  }
}

export async function createPrescription(req, res, next) {
  try {
    const {
      medication,
      dosage,
      quantity,
      refills,
      prescriberName,
      prescriberNpi,
      clinicName,
      diagnosis,
    } = req.body;

    const patientId = req.user.id;
    const patientName = req.body.patientName || req.user.name;
    const patientDob = req.body.patientDob || req.user.dateOfBirth || '';

    const newRx = await Prescription.create({
      rxNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId,
      patientName,
      patientDob,
      prescriberName,
      prescriberNpi,
      clinicName: clinicName || 'Standard Outpatient Care',
      medication,
      dosage,
      quantity,
      refills: refills || 0,
      diagnosis: diagnosis || 'General Clinical Indication',
      status: 'pending',
      allergyCheck: 'passed',
      interactionCheck: 'none_detected',
    });

    res.status(201).json({
      success: true,
      data: newRx,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPrescription(req, res, next) {
  try {
    // Server enforces that only pharmacists can verify prescriptions
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only licensed pharmacists can verify, flag, or reject prescriptions',
      });
    }

    const { status, verificationNotes, allergyCheck, interactionCheck } = req.body;
    const rx = await Prescription.findById(req.params.id);

    if (!rx) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    const updated = await Prescription.findByIdAndUpdate(
      rx._id || rx.id,
      {
        status,
        verificationNotes,
        allergyCheck: allergyCheck || rx.allergyCheck,
        interactionCheck: interactionCheck || rx.interactionCheck,
        verifiedBy: req.user.id,
        verifiedByName: req.user.name,
        verificationDate: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
