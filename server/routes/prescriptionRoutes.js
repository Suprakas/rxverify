import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  verifyPrescription,
  createPrescriptionSchema,
  verifyPrescriptionSchema,
} from '../controllers/prescriptionController.js';
import { requireAuth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All prescription routes require an authenticated user
router.use(requireAuth);

// List prescriptions (patient sees their own; pharmacist & admin see queue/all)
router.get('/', authorize('patient', 'pharmacist', 'admin'), getPrescriptions);

// Get single prescription
router.get('/:id', authorize('patient', 'pharmacist', 'admin'), getPrescriptionById);

// Create prescription (patient or pharmacist)
router.post(
  '/',
  authorize('patient', 'pharmacist'),
  validate(createPrescriptionSchema),
  createPrescription
);

// Verify prescription (pharmacist only, strictly enforced)
router.patch(
  '/:id/verify',
  authorize('pharmacist'),
  validate(verifyPrescriptionSchema),
  verifyPrescription
);

export default router;