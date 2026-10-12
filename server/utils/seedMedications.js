import 'dotenv/config';
import { connectDB } from './db.js';
import { Medication } from '../models/Medication.js';

export const sampleMedications = [
  { name: 'Amoxicillin 500mg Capsules', sku: 'MED-AMOX-500', requiresPrescription: true, stock: 240 },
  { name: 'Lisinopril 10mg Tablets', sku: 'MED-LISI-010', requiresPrescription: true, stock: 310 },
  { name: 'Metformin HCl 500mg Tablets', sku: 'MED-METF-500', requiresPrescription: true, stock: 450 },
  { name: 'Atorvastatin Calcium 20mg Tablets', sku: 'MED-ATOR-020', requiresPrescription: true, stock: 180 },
  { name: 'Levothyroxine Sodium 50mcg Tablets', sku: 'MED-LEVO-050', requiresPrescription: true, stock: 220 },
  { name: 'Amlodipine Besylate 5mg Tablets', sku: 'MED-AMLO-005', requiresPrescription: true, stock: 300 },
  { name: 'Albuterol Sulfate Inhaler 90mcg/actuation', sku: 'MED-ALBU-090', requiresPrescription: true, stock: 75 },
  { name: 'Omeprazole 20mg Delayed-Release Capsules', sku: 'MED-OMEP-020', requiresPrescription: false, stock: 160 },
  { name: 'Sertraline HCl 50mg Tablets', sku: 'MED-SERT-050', requiresPrescription: true, stock: 195 },
  { name: 'Gabapentin 300mg Capsules', sku: 'MED-GABA-300', requiresPrescription: true, stock: 280 },
  { name: 'Losartan Potassium 50mg Tablets', sku: 'MED-LOSA-050', requiresPrescription: true, stock: 140 },
  { name: 'Ibuprofen 200mg Coated Tablets', sku: 'MED-IBUP-200', requiresPrescription: false, stock: 600 },
  { name: 'Acetaminophen 500mg Extra Strength', sku: 'MED-APAP-500', requiresPrescription: false, stock: 550 },
  { name: 'Azithromycin 250mg Tablets (Z-Pak)', sku: 'MED-AZIT-250', requiresPrescription: true, stock: 90 },
  { name: 'Hydrochlorothiazide 25mg Tablets', sku: 'MED-HCTZ-025', requiresPrescription: true, stock: 210 },
];

export async function seedMedications() {
  try {
    const existingCount = await Medication.countDocuments();
    if (existingCount >= 15) {
      console.log(`[RxVerify] Medications already seeded (${existingCount} items present).`);
      return;
    }

    for (const med of sampleMedications) {
      const existing = await Medication.findOne({ sku: med.sku });
      if (!existing) {
        await Medication.create(med);
      }
    }
    console.log(`[RxVerify] Successfully seeded 15 sample medications.`);
  } catch (err) {
    console.error('[RxVerify] Error seeding medications:', err.message);
  }
}

if (process.argv[1]?.endsWith('seedMedications.js')) {
  await connectDB();
  await seedMedications();
  process.exit(0);
}

export default seedMedications;