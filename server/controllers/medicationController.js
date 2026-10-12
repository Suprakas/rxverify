import { Medication } from '../models/Medication.js';

export async function getMedications(req, res, next) {
  try {
    const query = {};
    if (req.query.requiresPrescription !== undefined) {
      query.requiresPrescription = req.query.requiresPrescription === 'true';
    }
    const medications = await Medication.find(query);
    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMedicationById(req, res, next) {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med) {
      return res.status(404).json({
        success: false,
        error: 'Medication not found',
      });
    }
    res.status(200).json({
      success: true,
      data: med,
    });
  } catch (err) {
    next(err);
  }
}
