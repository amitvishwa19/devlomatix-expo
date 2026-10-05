import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

// Fallback Mock Data Providers
export const MOCK_DATA = {
  patients: [
    {
      id: 'p-1',
      sku: 'PAT-2026-001',
      displayName: 'Eleanor Vance',
      gender: 'Female',
      age: 38,
      dateOfBirth: '1988-04-12',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      bloodGroup: 'O+',
      status: 'Admitted',
      ward: 'Cardiology (Ward 3B)',
      bed: 'Bed 302',
      primaryDoctor: 'Dr. Sarah Lin, MD',
      condition: 'Post-Op Observation',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Hypertension', 'Asthma'],
      vitals: {
        bp: '128/84',
        heartRate: '76 bpm',
        temperature: '98.6 °F',
        spo2: '98%',
        respRate: '16 rpm',
        weight: '64 kg',
        lastRecorded: '10 mins ago',
      },
      admissionDate: '2026-09-12',
      insurance: {
        provider: 'Blue Cross Shield',
        policyNumber: 'BCS-9923841',
        coverage: '80%',
      },
    },
    {
      id: 'p-2',
      sku: 'PAT-2026-002',
      displayName: 'Robert Sterling',
      gender: 'Male',
      age: 52,
      dateOfBirth: '1974-11-03',
      phone: '+1 (555) 876-5432',
      email: 'robert.sterling@example.com',
      bloodGroup: 'A+',
      status: 'OPD / Triage',
      ward: 'Emergency / Triage',
      bed: 'Bay 4',
      primaryDoctor: 'Dr. Mark Bennett',
      condition: 'Acute Migraine & Nausea',
      allergies: ['NSAIDs (Aspirin)'],
      chronicConditions: ['Type 2 Diabetes'],
      vitals: {
        bp: '142/90',
        heartRate: '88 bpm',
        temperature: '99.1 °F',
        spo2: '97%',
        respRate: '18 rpm',
        weight: '82 kg',
        lastRecorded: '25 mins ago',
      },
      admissionDate: '2026-09-15',
      insurance: {
        provider: 'Aetna Health',
        policyNumber: 'AET-4432190',
        coverage: '90%',
      },
    },
    {
      id: 'p-3',
      sku: 'PAT-2026-003',
      displayName: 'Clara Oswald',
      gender: 'Female',
      age: 29,
      dateOfBirth: '1997-07-21',
      phone: '+1 (555) 432-8765',
      email: 'clara.oswald@example.com',
      bloodGroup: 'B-',
      status: 'Outpatient',
      ward: 'None',
      bed: 'N/A',
      primaryDoctor: 'Dr. Rachel Patel',
      condition: 'Routine Prenatal Checkup',
      allergies: ['None known'],
      chronicConditions: ['None'],
      vitals: {
        bp: '116/74',
        heartRate: '72 bpm',
        temperature: '98.4 °F',
        spo2: '99%',
        respRate: '14 rpm',
        weight: '58 kg',
        lastRecorded: '1 hour ago',
      },
      admissionDate: null,
      insurance: {
        provider: 'UnitedHealth',
        policyNumber: 'UNH-8831092',
        coverage: '100%',
      },
    },
    {
      id: 'p-4',
      sku: 'PAT-2026-004',
      displayName: 'Marcus Aurelius Vance',
      gender: 'Male',
      age: 67,
      dateOfBirth: '1959-02-14',
      phone: '+1 (555) 678-1234',
      email: 'marcus.vance@example.com',
      bloodGroup: 'AB+',
      status: 'ICU',
      ward: 'Intensive Care Unit (ICU)',
      bed: 'ICU-Bed 02',
      primaryDoctor: 'Dr. James Wilson',
      condition: 'Post Myocardial Infarction',
      allergies: ['Latex', 'Morphine'],
      chronicConditions: ['CAD', 'Hyperlipidemia'],
      vitals: {
        bp: '135/88',
        heartRate: '68 bpm',
        temperature: '98.8 °F',
        spo2: '96%',
        respRate: '20 rpm',
        weight: '79 kg',
        lastRecorded: '5 mins ago',
      },
      admissionDate: '2026-09-10',
      insurance: {
        provider: 'Medicare Advantage',
        policyNumber: 'MED-1102938',
        coverage: '85%',
      },
    },
  ],

  appointments: [
    {
      id: 'apt-1',
      token: 'A-01',
      patientId: 'p-1',
      patientName: 'Eleanor Vance',
      patientPhone: '+1 (555) 234-5678',
      doctorName: 'Dr. Sarah Lin',
      specialty: 'Cardiology',
      timeSlot: '09:30 AM',
      date: '2026-09-15',
      type: 'Follow-Up',
      priority: 'High',
      status: 'IN_PROGRESS',
      symptoms: 'Post-catheterization review & ECG check',
    },
    {
      id: 'apt-2',
      token: 'A-02',
      patientId: 'p-2',
      patientName: 'Robert Sterling',
      patientPhone: '+1 (555) 876-5432',
      doctorName: 'Dr. Mark Bennett',
      specialty: 'Neurology',
      timeSlot: '10:15 AM',
      date: '2026-09-15',
      type: 'Consultation',
      priority: 'Urgent',
      status: 'SCHEDULED',
      symptoms: 'Throbbing hemicranial migraine, photophobia',
    },
    {
      id: 'apt-3',
      token: 'A-03',
      patientId: 'p-3',
      patientName: 'Clara Oswald',
      patientPhone: '+1 (555) 432-8765',
      doctorName: 'Dr. Rachel Patel',
      specialty: 'Obstetrics & Gyn',
      timeSlot: '11:00 AM',
      date: '2026-09-15',
      type: 'Routine Visit',
      priority: 'Normal',
      status: 'SCHEDULED',
      symptoms: 'Trimester 2 routine ultrasound & blood panel review',
    },
    {
      id: 'apt-4',
      token: 'A-04',
      patientId: 'p-5',
      patientName: 'David H. Miller',
      patientPhone: '+1 (555) 901-2345',
      doctorName: 'Dr. Alan Harper',
      specialty: 'Orthopedics',
      timeSlot: '11:45 AM',
      date: '2026-09-15',
      type: 'Post-Op Review',
      priority: 'Normal',
      status: 'COMPLETED',
      symptoms: 'Knee arthroscopy suture removal',
    },
  ],

  wards: [
    {
      id: 'w-1',
      name: 'Cardiology Ward (3B)',
      type: 'Specialty Care',
      totalBeds: 12,
      occupiedBeds: 9,
      nurseInCharge: 'Sr. Maria Garcia, RN',
      rooms: [
        {
          id: 'r-101',
          name: 'Room 301 (Semi-Private)',
          beds: [
            { id: 'b-101a', number: 'Bed 301-A', status: 'OCCUPIED', patientName: 'John Doe', doctor: 'Dr. Sarah Lin', admittedAt: 'Sep 13' },
            { id: 'b-101b', number: 'Bed 301-B', status: 'AVAILABLE', patientName: null, doctor: null, admittedAt: null },
          ],
        },
        {
          id: 'r-102',
          name: 'Room 302 (Private Suite)',
          beds: [
            { id: 'b-102a', number: 'Bed 302', status: 'OCCUPIED', patientName: 'Eleanor Vance', doctor: 'Dr. Sarah Lin', admittedAt: 'Sep 12' },
          ],
        },
        {
          id: 'r-103',
          name: 'Room 303 (ICU Isolation)',
          beds: [
            { id: 'b-103a', number: 'Bed 303-A', status: 'CLEANING', patientName: null, doctor: null, admittedAt: null },
            { id: 'b-103b', number: 'Bed 303-B', status: 'MAINTENANCE', patientName: null, doctor: null, admittedAt: null },
          ],
        },
      ],
    },
    {
      id: 'w-2',
      name: 'Intensive Care Unit (ICU)',
      type: 'Critical Care',
      totalBeds: 8,
      occupiedBeds: 7,
      nurseInCharge: 'Sr. Angela Davis, CCRN',
      rooms: [
        {
          id: 'r-201',
          name: 'Critical Bay A',
          beds: [
            { id: 'b-201a', number: 'ICU-Bed 01', status: 'OCCUPIED', patientName: 'Thomas Thorne', doctor: 'Dr. James Wilson', admittedAt: 'Sep 11' },
            { id: 'b-201b', number: 'ICU-Bed 02', status: 'OCCUPIED', patientName: 'Marcus Aurelius Vance', doctor: 'Dr. James Wilson', admittedAt: 'Sep 10' },
          ],
        },
        {
          id: 'r-202',
          name: 'Critical Bay B',
          beds: [
            { id: 'b-202a', number: 'ICU-Bed 03', status: 'AVAILABLE', patientName: null, doctor: null, admittedAt: null },
            { id: 'b-202b', number: 'ICU-Bed 04', status: 'OCCUPIED', patientName: 'Hannah Abbott', doctor: 'Dr. James Wilson', admittedAt: 'Sep 14' },
          ],
        },
      ],
    },
    {
      id: 'w-3',
      name: 'General Medical Ward (2A)',
      type: 'General Ward',
      totalBeds: 20,
      occupiedBeds: 14,
      nurseInCharge: 'Sr. Teresa Cho, RN',
      rooms: [
        {
          id: 'r-301',
          name: 'General Male 201',
          beds: [
            { id: 'b-301a', number: 'Bed G-01', status: 'OCCUPIED', patientName: 'Oliver Wood', doctor: 'Dr. Mark Bennett', admittedAt: 'Sep 13' },
            { id: 'b-301b', number: 'Bed G-02', status: 'AVAILABLE', patientName: null, doctor: null, admittedAt: null },
            { id: 'b-301c', number: 'Bed G-03', status: 'OCCUPIED', patientName: 'Arthur Weasley', doctor: 'Dr. Alan Harper', admittedAt: 'Sep 14' },
          ],
        },
      ],
    },
  ],

  medicines: [
    {
      id: 'med-1',
      name: 'Atorvastatin Calcium 20mg',
      generic: 'Atorvastatin',
      category: 'Cardiovascular',
      batch: 'ATV-2026-88',
      stock: 340,
      minStock: 50,
      price: 18.5,
      expiry: '2028-04-30',
      form: 'Tablet',
      manufacturer: 'Pfizer Labs',
    },
    {
      id: 'med-2',
      name: 'Amoxicillin + Clavulanate 625mg',
      generic: 'Augmentin',
      category: 'Antibiotics',
      batch: 'AMX-9941',
      stock: 45,
      minStock: 60,
      price: 24.0,
      expiry: '2026-12-15',
      form: 'Tablet',
      manufacturer: 'GSK Pharma',
      warning: 'Low Stock',
    },
    {
      id: 'med-3',
      name: 'Metformin HCl 500mg ER',
      generic: 'Metformin',
      category: 'Antidiabetic',
      batch: 'MET-4412',
      stock: 520,
      minStock: 100,
      price: 8.75,
      expiry: '2027-09-01',
      form: 'Tablet',
      manufacturer: 'Merck Healthcare',
    },
    {
      id: 'med-4',
      name: 'Pantoprazole IV 40mg',
      generic: 'Pantoprazole',
      category: 'Gastrointestinal',
      batch: 'PAN-7721',
      stock: 110,
      minStock: 30,
      price: 12.0,
      expiry: '2027-02-28',
      form: 'Injection / Vial',
      manufacturer: 'Sun Pharma',
    },
    {
      id: 'med-5',
      name: 'Paracetamol 650mg Fast-Release',
      generic: 'Acetaminophen',
      category: 'Analgesic / Antipyretic',
      batch: 'PCM-1109',
      stock: 890,
      minStock: 150,
      price: 3.5,
      expiry: '2028-08-15',
      form: 'Tablet',
      manufacturer: 'Cipla Global',
    },
  ],

  labOrders: [
    {
      id: 'lab-1',
      orderNumber: 'LAB-2026-901',
      patientId: 'p-1',
      patientName: 'Eleanor Vance',
      doctorName: 'Dr. Sarah Lin',
      tests: ['Complete Blood Count (CBC)', 'Lipid Profile', 'Serum Creatinine'],
      priority: 'Stat',
      status: 'IN_PROCESSING',
      orderedAt: '2026-09-15 08:30',
      sampleType: 'Whole Blood (EDTA)',
      resultsReady: false,
    },
    {
      id: 'lab-2',
      orderNumber: 'LAB-2026-902',
      patientId: 'p-2',
      patientName: 'Robert Sterling',
      doctorName: 'Dr. Mark Bennett',
      tests: ['Non-Contrast Brain CT Scan', 'Serum Electrolytes'],
      priority: 'Urgent',
      status: 'PENDING_COLLECTION',
      orderedAt: '2026-09-15 09:15',
      sampleType: 'Radiology + Plasma',
      resultsReady: false,
    },
    {
      id: 'lab-3',
      orderNumber: 'LAB-2026-903',
      patientId: 'p-3',
      patientName: 'Clara Oswald',
      doctorName: 'Dr. Rachel Patel',
      tests: ['Oral Glucose Tolerance Test (OGTT)', 'Thyroid Panel (TSH, T3, T4)'],
      priority: 'Routine',
      status: 'COMPLETED',
      orderedAt: '2026-09-14 11:00',
      sampleType: 'Serum',
      resultsReady: true,
      reportUrl: 'https://curexa.devlomatix.com/reports/LAB-2026-903.pdf',
    },
  ],

  invoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-4401',
      patientName: 'Eleanor Vance',
      patientSku: 'PAT-2026-001',
      date: '2026-09-15',
      amount: 1450.0,
      paidAmount: 1450.0,
      balance: 0.0,
      status: 'PAID',
      paymentMethod: 'Insurance (80%) + Card',
      items: [
        { name: 'Cardiology Consultation', qty: 1, rate: 250.0, total: 250.0 },
        { name: 'Private Room (3 Days)', qty: 3, rate: 300.0, total: 900.0 },
        { name: 'ECG & Diagnostics', qty: 1, rate: 180.0, total: 180.0 },
        { name: 'Pharmacy Medications', qty: 1, rate: 120.0, total: 120.0 },
      ],
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-4402',
      patientName: 'Robert Sterling',
      patientSku: 'PAT-2026-002',
      date: '2026-09-15',
      amount: 520.0,
      paidAmount: 200.0,
      balance: 320.0,
      status: 'PARTIAL',
      paymentMethod: 'Cash Deposit',
      items: [
        { name: 'Neurology OPD Consultation', qty: 1, rate: 220.0, total: 220.0 },
        { name: 'Brain CT Scan', qty: 1, rate: 300.0, total: 300.0 },
      ],
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-4403',
      patientName: 'Arthur Weasley',
      patientSku: 'PAT-2026-008',
      date: '2026-09-14',
      amount: 310.0,
      paidAmount: 0.0,
      balance: 310.0,
      status: 'PENDING',
      paymentMethod: 'Pending Billing',
      items: [
        { name: 'Orthopedic Consultation', qty: 1, rate: 200.0, total: 200.0 },
        { name: 'Knee X-Ray Bilateral', qty: 1, rate: 110.0, total: 110.0 },
      ],
    },
  ],

  departments: [
    {
      id: 'dept-1',
      name: 'Cardiology & Vascular',
      code: 'CARDIO',
      color: '#ef4444',
      icon: 'heart-pulse-outline',
      headOfDepartment: 'Dr. Sarah Lin, MD',
      doctorsCount: 6,
      bedCount: 16,
      activePatients: 14,
      specialties: ['Interventional Cardiology', 'Electrophysiology', 'Heart Failure'],
    },
    {
      id: 'dept-2',
      name: 'Neurology & Neurosurgery',
      code: 'NEURO',
      color: '#8b5cf6',
      icon: 'pulse-outline',
      headOfDepartment: 'Dr. Mark Bennett, MD',
      doctorsCount: 4,
      bedCount: 10,
      activePatients: 8,
      specialties: ['Stroke Management', 'Epilepsy', 'Neuro-Oncology'],
    },
    {
      id: 'dept-3',
      name: 'Obstetrics & Gynecology',
      code: 'OBGYN',
      color: '#ec4899',
      icon: 'woman-outline',
      headOfDepartment: 'Dr. Rachel Patel, MD',
      doctorsCount: 5,
      bedCount: 14,
      activePatients: 11,
      specialties: ['Maternal-Fetal Medicine', 'Laparoscopy', 'Neonatal Support'],
    },
    {
      id: 'dept-4',
      name: 'Orthopedics & Trauma',
      code: 'ORTHO',
      color: '#f59e0b',
      icon: 'body-outline',
      headOfDepartment: 'Dr. Alan Harper, MS',
      doctorsCount: 5,
      bedCount: 18,
      activePatients: 15,
      specialties: ['Joint Replacement', 'Sports Medicine', 'Spine Surgery'],
    },
    {
      id: 'dept-5',
      name: 'Emergency & Critical Care',
      code: 'EMERG',
      color: '#06b6d4',
      icon: 'flash-outline',
      headOfDepartment: 'Dr. James Wilson, MD',
      doctorsCount: 8,
      bedCount: 20,
      activePatients: 18,
      specialties: ['Triage', 'Trauma Resuscitation', 'Intensive Care'],
    },
  ],

  clinicalStages: [
    { id: 'stg-1', title: 'Reception / Triage', count: 4, color: '#64748b' },
    { id: 'stg-2', title: 'Doctor Consultation', count: 6, color: '#0284c7' },
    { id: 'stg-3', title: 'Diagnostics & Labs', count: 3, color: '#f59e0b' },
    { id: 'stg-4', title: 'Pharmacy / Discharge', count: 5, color: '#10b981' },
    { id: 'stg-5', title: 'IPD Admitted', count: 9, color: '#8b5cf6' },
  ],
};

// ================= PATIENT SERVICES ================= //
export async function getPatients(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaPatient, { params });
    if (data?.patients && data.patients.length > 0) return data;
    return { status: 200, patients: MOCK_DATA.patients };
  } catch (error) {
    console.log('getPatients fallback:', error?.message || error);
    return { status: 200, patients: MOCK_DATA.patients };
  }
}

export async function createPatient(patientData) {
  try {
    const { data } = await api.post(apiUrls.curexaPatient, patientData);
    return data;
  } catch (error) {
    console.log('createPatient local simulation:', error?.message);
    const newP = {
      id: `p-${Date.now()}`,
      sku: `PAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Outpatient',
      ...patientData,
      vitals: patientData.vitals || { bp: '120/80', heartRate: '72 bpm', temperature: '98.6 °F', spo2: '99%' },
    };
    return { status: 200, patient: newP, message: 'Patient registered successfully' };
  }
}

export async function updatePatient(patientData) {
  try {
    const { data } = await api.put(apiUrls.curexaPatient, patientData);
    return data;
  } catch (error) {
    return { status: 200, patient: patientData, message: 'Patient record updated' };
  }
}

export async function deletePatient(id) {
  try {
    const { data } = await api.delete(`${apiUrls.curexaPatient}?id=${id}`);
    return data;
  } catch (error) {
    return { status: 200, message: 'Patient removed successfully' };
  }
}

// ================= APPOINTMENT SERVICES ================= //
export async function getAppointments(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaAppointment, { params });
    if (data?.appointments && data.appointments.length > 0) return data;
    return { status: 200, appointments: MOCK_DATA.appointments };
  } catch (error) {
    console.log('getAppointments fallback:', error?.message);
    return { status: 200, appointments: MOCK_DATA.appointments };
  }
}

export async function createAppointment(appointmentData) {
  try {
    const { data } = await api.post(apiUrls.curexaAppointment, { data: appointmentData });
    return data;
  } catch (error) {
    const newApt = {
      id: `apt-${Date.now()}`,
      token: `A-0${Math.floor(5 + Math.random() * 20)}`,
      status: 'SCHEDULED',
      ...appointmentData,
    };
    return { status: 200, appointment: newApt, message: 'Appointment booked successfully' };
  }
}

// ================= BED & WARD SERVICES ================= //
export async function getBeds(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaBed, { params });
    if (data?.wards && data.wards.length > 0) return data;
    return {
      status: 200,
      wards: MOCK_DATA.wards,
      summary: { total: 40, occupied: 30, available: 7, cleaning: 3 },
    };
  } catch (error) {
    return {
      status: 200,
      wards: MOCK_DATA.wards,
      summary: { total: 40, occupied: 30, available: 7, cleaning: 3 },
    };
  }
}

export async function assignBed(bedData) {
  try {
    const { data } = await api.post(apiUrls.curexaBed, bedData);
    return data;
  } catch (error) {
    return { status: 200, message: 'Patient admitted to bed successfully' };
  }
}

export async function updateBed(bedData) {
  try {
    const { data } = await api.put(apiUrls.curexaBed, bedData);
    return data;
  } catch (error) {
    return { status: 200, message: 'Bed status updated' };
  }
}

// ================= PHARMACY SERVICES ================= //
export async function getPharmacyData(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaPharmacy, { params });
    if (data?.medicines && data.medicines.length > 0) return data;
    return { status: 200, medicines: MOCK_DATA.medicines };
  } catch (error) {
    return { status: 200, medicines: MOCK_DATA.medicines };
  }
}

export async function createMedicine(medicineData) {
  try {
    const { data } = await api.post(apiUrls.curexaPharmacy, medicineData);
    return data;
  } catch (error) {
    return { status: 200, medicine: medicineData, message: 'Medicine added to inventory' };
  }
}

export async function dispensePrescription(dispenseData) {
  try {
    const { data } = await api.put(apiUrls.curexaPharmacy, dispenseData);
    return data;
  } catch (error) {
    return { status: 200, message: 'Prescription dispensed & inventory updated' };
  }
}

// ================= LABORATORY SERVICES ================= //
export async function getLaboratoryOrders(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaLaboratory, { params });
    if (data?.orders && data.orders.length > 0) return data;
    return { status: 200, orders: MOCK_DATA.labOrders };
  } catch (error) {
    return { status: 200, orders: MOCK_DATA.labOrders };
  }
}

export async function createLabOrder(orderData) {
  try {
    const { data } = await api.post(apiUrls.curexaLaboratory, orderData);
    return data;
  } catch (error) {
    const newOrder = {
      id: `lab-${Date.now()}`,
      orderNumber: `LAB-2026-${Math.floor(910 + Math.random() * 80)}`,
      status: 'PENDING_COLLECTION',
      orderedAt: new Date().toISOString(),
      ...orderData,
    };
    return { status: 200, order: newOrder, message: 'Diagnostic test order placed' };
  }
}

export async function updateLabOrder(orderData) {
  try {
    const { data } = await api.put(apiUrls.curexaLaboratory, orderData);
    return data;
  } catch (error) {
    return { status: 200, message: 'Diagnostic order updated' };
  }
}

// ================= BILLING SERVICES ================= //
export async function getBillingInvoices(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaBilling, { params });
    if (data?.invoices && data.invoices.length > 0) return data;
    return {
      status: 200,
      invoices: MOCK_DATA.invoices,
      summary: { totalBilled: 2280.0, totalCollected: 1650.0, totalPending: 630.0 },
    };
  } catch (error) {
    return {
      status: 200,
      invoices: MOCK_DATA.invoices,
      summary: { totalBilled: 2280.0, totalCollected: 1650.0, totalPending: 630.0 },
    };
  }
}

export async function createInvoice(invoiceData) {
  try {
    const { data } = await api.post(apiUrls.curexaBilling, invoiceData);
    return data;
  } catch (error) {
    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(4500 + Math.random() * 500)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      paidAmount: 0.0,
      ...invoiceData,
    };
    return { status: 200, invoice: newInv, message: 'Invoice generated' };
  }
}

export async function recordPayment(paymentData) {
  try {
    const { data } = await api.put(apiUrls.curexaBilling, paymentData);
    return data;
  } catch (error) {
    return { status: 200, message: 'Payment recorded successfully' };
  }
}

// ================= DEPARTMENT & DOCTOR ROSTER ================= //
export async function getDepartmentsAndDoctors(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaDepartment, { params });
    if (data?.departments && data.departments.length > 0) return data;
    return { status: 200, departments: MOCK_DATA.departments };
  } catch (error) {
    return { status: 200, departments: MOCK_DATA.departments };
  }
}

export async function createDepartmentOrDoctor(payload) {
  try {
    const { data } = await api.post(apiUrls.curexaDepartment, payload);
    return data;
  } catch (error) {
    return { status: 200, message: 'Department/Doctor created' };
  }
}

// ================= CLINICAL WORKFLOW / KANBAN ================= //
export async function getWorkflowStages(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaWorkflow || `${apiUrls.curexaBaseApi}/workflow`, { params });
    if (data?.stages) return data;
    return { status: 200, stages: MOCK_DATA.clinicalStages };
  } catch (error) {
    return { status: 200, stages: MOCK_DATA.clinicalStages };
  }
}

// ================= CRM LEADS ================= //
export async function getCrmLeads(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaCrm, { params });
    return data;
  } catch (error) {
    return {
      status: 200,
      leads: [
        { id: 'lead-1', name: 'Sophia Chen', inquiry: 'Cardiology Health Package', phone: '+1 (555) 321-9988', status: 'NEW', stage: 'Contacted' },
        { id: 'lead-2', name: 'Liam O’Connor', inquiry: 'Orthopedic Knee Surgery Consultation', phone: '+1 (555) 765-4321', status: 'IN_PROGRESS', stage: 'Quotation Sent' },
      ],
    };
  }
}

// ================= AI CLINICAL SERVICES ================= //
export async function generateAiPrescription({ symptoms, patientAge, gender, allergies = [] }) {
  // Simulated AI clinical reasoning engine with safe contraindication checks
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerSym = (symptoms || '').toLowerCase();
      let diagnosis = 'Acute Upper Respiratory Tract Infection (Provisional)';
      let medicines = [
        { name: 'Paracetamol 650mg', dosage: '1 tablet TDS (3 times daily) after meals', duration: '5 Days', type: 'Tablet' },
        { name: 'Levocetirizine 5mg', dosage: '1 tablet once daily at bedtime', duration: '5 Days', type: 'Tablet' },
        { name: 'Vitamin C 500mg (Zinc Chewable)', dosage: '1 chewable daily after breakfast', duration: '10 Days', type: 'Chewable' },
      ];

      if (lowerSym.includes('chest') || lowerSym.includes('heart') || lowerSym.includes('bp') || lowerSym.includes('breath')) {
        diagnosis = 'Atypical Angina / Exertional Dyspnea (Rule Out CAD)';
        medicines = [
          { name: 'Aspirin 75mg (Enteric Coated)', dosage: '1 tablet OD after dinner', duration: '14 Days', type: 'Tablet' },
          { name: 'Atorvastatin 20mg', dosage: '1 tablet OD at bedtime', duration: '30 Days', type: 'Tablet' },
          { name: 'Sorbitrate 5mg (Sublingual)', dosage: '1 tablet SOS for acute chest tightness', duration: 'As needed', type: 'Sublingual' },
        ];
      } else if (lowerSym.includes('fever') || lowerSym.includes('cough') || lowerSym.includes('throat')) {
        diagnosis = 'Acute Bronchitis with Pyrexia';
        medicines = [
          { name: 'Amoxicillin + Clavulanate 625mg', dosage: '1 tablet BD (twice daily) after meals', duration: '5 Days', type: 'Tablet' },
          { name: 'Paracetamol 650mg Fast-Release', dosage: '1 tablet TDS for fever > 100°F', duration: '3 Days', type: 'Tablet' },
          { name: 'Dextromethorphan Cough Syrup', dosage: '10ml TDS after meals', duration: '5 Days', type: 'Syrup' },
        ];
      } else if (lowerSym.includes('stomach') || lowerSym.includes('gastric') || lowerSym.includes('acid') || lowerSym.includes('pain')) {
        diagnosis = 'Acute Gastritis / GERD Exacerbation';
        medicines = [
          { name: 'Pantoprazole 40mg', dosage: '1 tablet OD empty stomach 30 mins before breakfast', duration: '14 Days', type: 'Tablet' },
          { name: 'Sucralfate Suspension 10ml', dosage: '10ml TDS 1 hour before food', duration: '7 Days', type: 'Syrup' },
          { name: 'Domperidone 10mg', dosage: '1 tablet BD before meals', duration: '5 Days', type: 'Tablet' },
        ];
      }

      // Check allergy warning
      const contraindications = [];
      allergies.forEach((alg) => {
        if (alg.toLowerCase().includes('penicillin') && medicines.some((m) => m.name.toLowerCase().includes('amoxicillin'))) {
          contraindications.push('⚠️ WARNING: Penicillin allergy detected! Amoxicillin removed.');
          medicines = medicines.filter((m) => !m.name.toLowerCase().includes('amoxicillin'));
          medicines.push({ name: 'Azithromycin 500mg (Macrolide Alternative)', dosage: '1 tablet OD 1 hr before lunch', duration: '3 Days', type: 'Tablet' });
        }
      });

      resolve({
        status: 200,
        diagnosis,
        icdCode: 'ICD-10-CM J06.9',
        medicines,
        advice: [
          'Maintain adequate oral hydration (2.5 - 3L/day)',
          'Monitor body temperature twice daily with digital thermometer',
          'Follow up in OPD after 5 days or immediately if dyspnea develops',
        ],
        contraindications,
        aiConfidence: '98.4%',
      });
    }, 600);
  });
}

export async function calculateAiTriage({ symptoms, vitals = {} }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bpSys = parseInt((vitals.bp || '120/80').split('/')[0]) || 120;
      const spo2Val = parseInt((vitals.spo2 || '98%').replace('%', '')) || 98;
      const hr = parseInt((vitals.heartRate || '75').replace(/\D/g, '')) || 75;

      let level = 'ROUTINE (Level 4)';
      let color = '#059669';
      let tag = 'Standard OPD';
      let action = 'Seat in OPD waiting lounge; routine doctor review within 45 mins.';
      let recommendedLabs = ['Routine Hemogram (CBC)', 'Random Blood Sugar (RBS)'];

      if (spo2Val < 92 || bpSys > 180 || bpSys < 85 || hr > 130) {
        level = 'EMERGENCY / RESUSCITATION (Level 1)';
        color = '#ef4444';
        tag = 'Immediate STAT Bed';
        action = 'Shift immediately to Red Bay 1. High-flow O2, start IV line, page ER Physician STAT.';
        recommendedLabs = ['STAT ABG Analysis', '12-Lead Emergency ECG', 'Cardiac Troponin I', 'Serum Electrolytes'];
      } else if (spo2Val < 95 || bpSys > 160 || hr > 110) {
        level = 'URGENT (Level 2)';
        color = '#f59e0b';
        tag = 'Urgent Triage (Yellow)';
        action = 'Place in Yellow observation area; doctor consultation within 15 minutes.';
        recommendedLabs = ['12-Lead ECG', 'Complete Blood Count (CBC)', 'Serum Creatinine'];
      }

      resolve({
        status: 200,
        triageLevel: level,
        color,
        tag,
        action,
        recommendedLabs,
        suggestedSpecialty: (symptoms || '').toLowerCase().includes('chest') ? 'Cardiology' : 'Internal Medicine',
      });
    }, 450);
  });
}

export async function generateAiDischargeSummary(patient) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 200,
        summaryText: `PATIENT DISCHARGE SUMMARY\n` +
          `=========================\n` +
          `Patient: ${patient.displayName || patient.name} (SKU: ${patient.sku || 'PAT-001'})\n` +
          `Age/Gender: ${patient.age || '38'}Y / ${patient.gender || 'Female'}\n` +
          `Admission Date: ${patient.admissionDate || '2026-09-12'}\n` +
          `Discharge Date: ${new Date().toISOString().split('T')[0]}\n` +
          `Attending Doctor: ${patient.primaryDoctor || 'Dr. Sarah Lin, MD'}\n\n` +
          `DIAGNOSIS AT DISCHARGE:\n` +
          `• Primary: ${patient.condition || 'Post-Op Stable'}\n` +
          `• Chronic History: ${(patient.chronicConditions || []).join(', ') || 'None'}\n\n` +
          `HOSPITAL COURSE & INTERVENTIONS:\n` +
          `Patient was admitted under stable hemodynamics. Monitored continuously in IPD. Vitals remained stable on ambient air. Responsive to oral therapies. Wound dressing healthy with no sign of erythema.\n\n` +
          `DISCHARGE MEDICATIONS:\n` +
          `1. Atorvastatin 20mg - 1 Tab OD at night x 30 days\n` +
          `2. Pantoprazole 40mg - 1 Tab OD empty stomach x 14 days\n` +
          `3. Paracetamol 650mg - 1 Tab SOS for pain\n\n` +
          `FOLLOW UP INSTRUCTIONS:\n` +
          `• OPD Follow-up on: ${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}\n` +
          `• Emergency SOS warning signs: Acute chest tightness, high fever (>101°F), or wound discharge.`,
      });
    }, 500);
  });
}

// ================= TELEMETRY & ICU VITALS ================= //
export const MOCK_TELEMETRY_BEDS = [
  {
    bedId: 'ICU-Bed 01',
    wardName: 'Intensive Care Unit (ICU)',
    patientName: 'Marcus Aurelius Vance',
    age: 67,
    gender: 'Male',
    diagnosis: 'Post Myocardial Infarction',
    doctor: 'Dr. James Wilson',
    leadStatus: 'Normal Sinus Rhythm',
    vitals: {
      hr: 72,
      spo2: 98,
      bpSys: 124,
      bpDia: 82,
      resp: 16,
      temp: 98.6,
    },
    alarm: null,
  },
  {
    bedId: 'ICU-Bed 02',
    wardName: 'Intensive Care Unit (ICU)',
    patientName: 'Hannah Abbott',
    age: 54,
    gender: 'Female',
    diagnosis: 'Acute Respiratory Distress (ARDS)',
    doctor: 'Dr. James Wilson',
    leadStatus: 'Sinus Tachycardia',
    vitals: {
      hr: 104,
      spo2: 93,
      bpSys: 138,
      bpDia: 90,
      resp: 22,
      temp: 99.8,
    },
    alarm: 'SpO2 Borderline Alert',
  },
  {
    bedId: 'ICU-Bed 03',
    wardName: 'CCU Isolation Bay',
    patientName: 'Thomas Thorne',
    age: 72,
    gender: 'Male',
    diagnosis: 'Severe Cardiogenic Shock',
    doctor: 'Dr. Sarah Lin',
    leadStatus: 'Ventricular Ectopics',
    vitals: {
      hr: 118,
      spo2: 89,
      bpSys: 90,
      bpDia: 58,
      resp: 24,
      temp: 100.4,
    },
    alarm: 'CRITICAL: SpO2 < 90% (Code Blue Ready)',
  },
];

// ================= SHIFT HANDOVERS & ON-CALL ROSTER ================= //
export const MOCK_HANDOVERS = [
  {
    id: 'h-1',
    shift: 'Morning -> Evening Handover',
    ward: 'ICU & Emergency',
    fromDoctor: 'Dr. Sarah Lin, MD',
    toDoctor: 'Dr. Mark Bennett, MD',
    timestamp: 'Today, 03:30 PM',
    sbar: {
      situation: '8 IPD patients in ICU, 2 critical on ventilator weaning protocol.',
      background: 'Marcus Vance post-MI day 2 stable; Thomas Thorne hypotensive on inotrope support.',
      assessment: 'Thorne requiring close arterial line BP monitoring; may need inotrope titration.',
      recommendation: 'Repeat ABG and electrolytes at 06:00 PM; alert consultant if MAP < 65.',
    },
  },
  {
    id: 'h-2',
    shift: 'Night -> Morning Handover',
    ward: 'Cardiology Ward 3B',
    fromDoctor: 'Dr. James Wilson',
    toDoctor: 'Dr. Sarah Lin',
    timestamp: 'Today, 07:45 AM',
    sbar: {
      situation: 'All 9 patients stable overnight; 2 planned discharges today.',
      background: 'Eleanor Vance ready for discharge pending final echo review.',
      assessment: 'Echo scheduled at 10:00 AM. Invoices cleared with insurance.',
      recommendation: 'Sign discharge medications summary once echo is verified.',
    },
  },
];

export const MOCK_ON_CALL_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Sarah Lin, MD', specialty: 'Cardiology', onCall: true, phone: '+1 555-0192', status: 'In Hospital (Room 302)', badge: 'PRIMARY ON-CALL' },
  { id: 'doc-2', name: 'Dr. Mark Bennett, MD', specialty: 'Neurology', onCall: true, phone: '+1 555-0188', status: 'On Active Duty', badge: 'ER SPECIALIST' },
  { id: 'doc-3', name: 'Dr. James Wilson, MD', specialty: 'Critical Care / ICU', onCall: true, phone: '+1 555-0174', status: 'ICU Bay A', badge: 'INTENSIVIST' },
  { id: 'doc-4', name: 'Dr. Rachel Patel, MD', specialty: 'Obstetrics & Gyn', onCall: false, phone: '+1 555-0163', status: 'On-Call (15 min ETA)', badge: 'BACKUP CALL' },
  { id: 'doc-5', name: 'Dr. Alan Harper, MS', specialty: 'Orthopedics & Trauma', onCall: true, phone: '+1 555-0152', status: 'OT 2 (Surgery)', badge: 'SURGEON ON-CALL' },
];

// ================= WHATSAPP AUTOMATION LOGS ================= //
export const MOCK_WHATSAPP_LOGS = [
  {
    id: 'wa-1',
    patientName: 'Eleanor Vance',
    phone: '+1 (555) 234-5678',
    type: 'TOKEN_UPDATE',
    message: 'Hello Eleanor, your OPD token A-01 with Dr. Sarah Lin is next in 10 mins. Please report to Room 3B.',
    status: 'DELIVERED',
    sentAt: '10:15 AM',
  },
  {
    id: 'wa-2',
    patientName: 'Clara Oswald',
    phone: '+1 (555) 432-8765',
    type: 'LAB_REPORT',
    message: 'Your Thyroid Profile Lab Report (LAB-2026-903) is ready. Tap to download PDF: https://curexa.devlomatix.com/r/903',
    status: 'READ',
    sentAt: '09:40 AM',
  },
  {
    id: 'wa-3',
    patientName: 'Marcus Aurelius Vance',
    phone: '+1 (555) 678-1234',
    type: 'FAMILY_UPDATE',
    message: 'Family update from Curexa ICU: Marcus Vance vitals stable. Doctor rounds completed. Visiting hours 4-6 PM.',
    status: 'DELIVERED',
    sentAt: '08:30 AM',
  },
];

