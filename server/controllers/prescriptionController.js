import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { Prescription } from '../models/Prescription.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

export const createPrescriptionSchema = z.object({
  medication: z.string().trim().optional(),
  dosage: z.string().trim().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  refills: z.coerce.number().int().min(0).optional(),
  prescriberName: z.string().trim().optional(),
  prescriberNpi: z.string().trim().optional(),
  clinicName: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const verifyPrescriptionSchema = z.object({
  status: z.enum([
    'APPROVED',
    'REJECTED',
    'CHANGES_REQUESTED',
    'IN_REVIEW',
    // Backwards-compatible aliases
    'verified',
    'flagged',
    'rejected',
  ]),
  notes: z.string().trim().min(3, 'Clinical notes are required for prescription verification'),
  verificationNotes: z.string().trim().optional(),
  allergyCheck: z.enum(['passed', 'warning', 'unknown']).optional(),
  interactionCheck: z.enum(['none_detected', 'moderate', 'severe']).optional(),
});

/**
 * Upload a new prescription document (Patient only)
 * POST /prescriptions
 */
export async function uploadPrescription(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Prescription document is required. Please upload a PDF, JPG, or PNG file (max 5 MB).',
      });
    }

    const {
      medication,
      dosage,
      quantity,
      refills,
      prescriberName,
      prescriberNpi,
      clinicName,
      diagnosis,
      notes,
    } = req.body;

    const patientId = req.user.id;
    const patientName = req.user.name;

    const rxNumber = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPrescription = await Prescription.create({
      rxNumber,
      patientId,
      patientName,
      fileKey: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'SUBMITTED',
      notes: notes || '',
      history: [
        {
          status: 'SUBMITTED',
          by: patientName,
          at: new Date(),
          comment: notes || 'Prescription document uploaded by patient',
        },
      ],
      // Optional clinical metadata if provided during upload
      medication: medication || 'Prescription Intake Document',
      dosage: dosage || 'Pending Clinical Pharmacist Transcription',
      quantity: quantity ? Number(quantity) : 30,
      refills: refills ? Number(refills) : 0,
      prescriberName: prescriberName || 'Pending Verification',
      prescriberNpi: prescriberNpi || 'N/A',
      clinicName: clinicName || '',
      diagnosis: diagnosis || 'Clinical Rx Intake',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully and queued for clinical review.',
      data: newPrescription,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all prescriptions belonging to the authenticated patient
 * GET /prescriptions/mine
 */
export async function getMyPrescriptions(req, res, next) {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Securely stream/serve an uploaded prescription document
 * GET /prescriptions/:id/file
 * Strictly accessible ONLY by the owner (patient) or a pharmacist/admin.
 * Never served as public static files.
 */
export async function getPrescriptionFile(req, res, next) {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    if (!rx.fileKey) {
      return res.status(404).json({
        success: false,
        error: 'No uploaded document associated with this prescription',
      });
    }

    // Role-based access control: only the patient owner or a pharmacist/admin
    const isOwner = req.user.role === 'patient' && rx.patientId === req.user.id;
    const isClinicalStaff = req.user.role === 'pharmacist' || req.user.role === 'admin';

    if (!isOwner && !isClinicalStaff) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: you do not have permission to view this prescription document',
      });
    }

    const filePath = path.resolve(UPLOAD_DIR, rx.fileKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Prescription file not found on server storage',
      });
    }

    // Secure headers: stream inline with correct content type
    const mimeType = rx.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(rx.originalName || 'prescription')}"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
}

/**
 * List prescriptions (role-filtered)
 * GET /prescriptions
 */
export async function getPrescriptions(req, res, next) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let filter = {};

    // Patient can strictly only see their own prescriptions
    if (userRole === 'patient') {
      filter.patientId = userId;
    }

    if (req.query.status) {
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

/**
 * Get prescription details by ID
 * GET /prescriptions/:id
 */
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

/**
 * Verify prescription determination (Pharmacist only)
 * PATCH /prescriptions/:id/verify
 */
export async function verifyPrescription(req, res, next) {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only licensed pharmacists can verify, flag, or reject prescriptions',
      });
    }

    const { status, notes, verificationNotes, allergyCheck, interactionCheck } = req.body;
    const finalNotes = notes || verificationNotes || '';

    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    // Normalizing status to Phase 3 enums
    let normalizedStatus = status;
    if (status === 'verified') normalizedStatus = 'APPROVED';
    if (status === 'flagged') normalizedStatus = 'CHANGES_REQUESTED';
    if (status === 'rejected') normalizedStatus = 'REJECTED';

    const historyEntry = {
      status: normalizedStatus,
      by: req.user.name,
      at: new Date(),
      comment: finalNotes,
    };

    const currentHistory = Array.isArray(rx.history) ? rx.history : [];

    const updated = await Prescription.findByIdAndUpdate(
      rx._id || rx.id,
      {
        status: normalizedStatus,
        reviewerId: req.user.id,
        reviewerName: req.user.name,
        notes: finalNotes,
        verificationNotes: finalNotes,
        verifiedBy: req.user.id,
        verifiedByName: req.user.name,
        verificationDate: new Date(),
        allergyCheck: allergyCheck || rx.allergyCheck,
        interactionCheck: interactionCheck || rx.interactionCheck,
        history: [...currentHistory, historyEntry],
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Prescription updated to ${normalizedStatus}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create manual prescription intake (Patient or Pharmacist fallback)
 * POST /prescriptions/manual
 */
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
      notes,
    } = req.body;

    const patientId = req.user.id;
    const patientName = req.body.patientName || req.user.name;

    const newRx = await Prescription.create({
      rxNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId,
      patientName,
      medication: medication || 'Prescription Intake',
      dosage: dosage || '',
      quantity: quantity ? Number(quantity) : 30,
      refills: refills ? Number(refills) : 0,
      prescriberName: prescriberName || '',
      prescriberNpi: prescriberNpi || '',
      clinicName: clinicName || '',
      diagnosis: diagnosis || '',
      status: 'SUBMITTED',
      notes: notes || '',
      history: [
        {
          status: 'SUBMITTED',
          by: patientName,
          at: new Date(),
          comment: notes || 'Prescription intake created',
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: newRx,
    });
  } catch (err) {
    next(err);
  }
}
