import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  verifyPrescription,
  createPrescriptionSchema,
  verifyPrescriptionSchema,
} from '../controllers/prescriptionController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All prescription routes require an authenticated user
router.use(authenticate);

// List prescriptions (filtered per role)
router.get('/', getPrescriptions);

// Get single prescription
router.get('/:id', getPrescriptionById);

// Create prescription (patient or pharmacist)
router.post('/', validate(createPrescriptionSchema), createPrescription);

// Verify prescription (pharmacist only, strictly enforced)
router.patch(
  '/:id/verify',
  authorizeRoles('pharmacist'),
  validate(verifyPrescriptionSchema),
  verifyPrescription
);

export default router;
