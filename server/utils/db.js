import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let isMongooseConnected = false;

// Fallback in-memory database store for sandbox environment
export const memoryStore = {
  users: [],
  prescriptions: [],
  initialized: false,
};

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rxverify';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongooseConnected = true;
    console.log(`[RxVerify] MongoDB connected successfully to ${mongoUri}`);
  } catch (err) {
    isMongooseConnected = false;
    console.warn(`[RxVerify] Note: External MongoDB not reachable (${err.message}). Using secure in-memory data store for sandbox preview.`);
  }

  // Seed default test accounts if needed
  await seedInitialData();
}

export function getIsMongooseConnected() {
  return isMongooseConnected;
}

export async function seedInitialData() {
  if (memoryStore.initialized) return;

  const adminPass = await bcrypt.hash('Admin@12345', 10);
  const pharmaPass = await bcrypt.hash('Pharma@12345', 10);
  const patientPass = await bcrypt.hash('Patient@12345', 10);

  const initialUsers = [
    {
      _id: 'usr_admin_001',
      id: 'usr_admin_001',
      name: 'Dr. Eleanor Vance',
      email: 'admin@rxverify.com',
      password: adminPass,
      role: 'admin',
      licenseNumber: 'PHA-ADM-001',
      phone: '+1 (555) 019-2831',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      refreshToken: null,
    },
    {
      _id: 'usr_pharma_001',
      id: 'usr_pharma_001',
      name: 'Marcus Chen, PharmD',
      email: 'pharmacist@rxverify.com',
      password: pharmaPass,
      role: 'pharmacist',
      licenseNumber: 'RPH-492018',
      phone: '+1 (555) 382-9912',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      refreshToken: null,
    },
    {
      _id: 'usr_patient_001',
      id: 'usr_patient_001',
      name: 'Sarah Jenkins',
      email: 'patient@rxverify.com',
      password: patientPass,
      role: 'patient',
      licenseNumber: null,
      phone: '+1 (555) 723-1184',
      dateOfBirth: '1988-04-12',
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
      refreshToken: null,
    },
  ];

  const initialPrescriptions = [
    {
      _id: 'rx_9021',
      id: 'rx_9021',
      rxNumber: 'RX-2026-9021',
      patientId: 'usr_patient_001',
      patientName: 'Sarah Jenkins',
      patientDob: '1988-04-12',
      prescriberName: 'Dr. Arthur Pendleton, MD',
      prescriberNpi: '1942083115',
      clinicName: 'Metro Health Internal Medicine',
      medication: 'Amoxicillin 500mg capsules',
      dosage: '1 capsule by mouth every 8 hours for 10 days',
      quantity: 30,
      refills: 2,
      diagnosis: 'Acute Bacterial Sinusitis',
      status: 'pending',
      allergyCheck: 'passed',
      interactionCheck: 'none_detected',
      verifiedBy: null,
      verifiedByName: null,
      verificationNotes: null,
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      _id: 'rx_9022',
      id: 'rx_9022',
      rxNumber: 'RX-2026-9022',
      patientId: 'usr_patient_001',
      patientName: 'Sarah Jenkins',
      patientDob: '1988-04-12',
      prescriberName: 'Dr. Maya Lin, Cardiologist',
      prescriberNpi: '1827409122',
      clinicName: 'Heart & Vascular Specialty Institute',
      medication: 'Lisinopril 10mg tablets',
      dosage: 'Take 1 tablet daily by mouth in the morning',
      quantity: 90,
      refills: 3,
      diagnosis: 'Essential Hypertension',
      status: 'verified',
      allergyCheck: 'passed',
      interactionCheck: 'none_detected',
      verifiedBy: 'usr_pharma_001',
      verifiedByName: 'Marcus Chen, PharmD',
      verificationNotes: 'Dosing and prescriber credentials confirmed. Patient educated on avoiding potassium supplements.',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      _id: 'rx_9023',
      id: 'rx_9023',
      rxNumber: 'RX-2026-9023',
      patientId: 'usr_patient_001',
      patientName: 'Sarah Jenkins',
      patientDob: '1988-04-12',
      prescriberName: 'Dr. Kevin Zhao, Orthopedic Surgery',
      prescriberNpi: '1103984729',
      clinicName: 'Summit Orthopedics & Sports Medicine',
      medication: 'Tramadol 50mg tablets',
      dosage: 'Take 1 tablet every 6 hours as needed for severe post-op pain',
      quantity: 20,
      refills: 0,
      diagnosis: 'Post-op Knee Arthroscopy Pain',
      status: 'flagged',
      allergyCheck: 'passed',
      interactionCheck: 'moderate',
      verifiedBy: 'usr_pharma_001',
      verifiedByName: 'Marcus Chen, PharmD',
      verificationNotes: 'Flagged for interaction review: patient profile mentions concurrent SSRI prescription. Calling prescriber to confirm.',
      createdAt: new Date(Date.now() - 3600000 * 5),
      updatedAt: new Date(Date.now() - 3600000 * 3),
    },
  ];

  memoryStore.users = initialUsers;
  memoryStore.prescriptions = initialPrescriptions;
  memoryStore.initialized = true;
}
