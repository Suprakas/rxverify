import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  getMyPrescriptions,
  uploadPrescription,
  getPrescriptionFile,
  verifyPrescription,
  createPrescription,
  verifyPrescriptionSchema,
} from '../controllers/prescriptionController.js';
import { requireAuth, authorize } from '../middleware/auth.js';
import { prescriptionUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(requireAuth);

// 1. Upload prescription document (Patient only)
router.post(
  '/',
  authorize('patient'),
  prescriptionUpload.single('file'),
  uploadPrescription
);

// 2. Patient view own prescriptions
router.get(
  '/mine',
  authorize('patient'),
  getMyPrescriptions
);

// 3. Authenticated route to securely serve uploaded prescription document
// Strictly accessible ONLY by owner patient or pharmacist/admin. Never served statically.
router.get(
  '/:id/file',
  authorize('patient', 'pharmacist', 'admin'),
  getPrescriptionFile
);

// 4. List prescriptions (queue for pharmacist & admin)
router.get(
  '/',
  authorize('patient', 'pharmacist', 'admin'),
  getPrescriptions
);

// 5. Single prescription details
router.get(
  '/:id',
  authorize('patient', 'pharmacist', 'admin'),
  getPrescriptionById
);

// 6. Verify determination (Pharmacist only)
router.patch(
  '/:id/verify',
  authorize('pharmacist'),
  validate(verifyPrescriptionSchema),
  verifyPrescription
);

export default router;