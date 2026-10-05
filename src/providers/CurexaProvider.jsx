import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getAppointments,
  getBeds,
  getBillingInvoices,
  getDepartmentsAndDoctors,
  getLaboratoryOrders,
  getPatients,
  getPharmacyData,
  MOCK_TELEMETRY_BEDS,
  MOCK_HANDOVERS,
  MOCK_ON_CALL_DOCTORS,
  MOCK_WHATSAPP_LOGS,
} from '~/services/curexa';

const CurexaContext = createContext(null);

export function CurexaProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [portalMode, setPortalModeState] = useState('HOSPITAL'); // 'HOSPITAL' | 'PATIENT'

  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'Curexa Super Specialty Hospital',
    code: 'CUREXA-HQ',
    tagline: 'Center for Clinical Excellence & Tertiary Care',
    branch: 'Main Medical Campus',
  });

  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [wards, setWards] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Advanced modules state
  const [telemetryBeds, setTelemetryBeds] = useState(MOCK_TELEMETRY_BEDS);
  const [handovers, setHandovers] = useState(MOCK_HANDOVERS);
  const [onCallDoctors, setOnCallDoctors] = useState(MOCK_ON_CALL_DOCTORS);
  const [whatsappLogs, setWhatsappLogs] = useState(MOCK_WHATSAPP_LOGS);

  // Active selected patient for detailed 360 view
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);

  // Hydrate portal mode from AsyncStorage
  useEffect(() => {
    async function hydratePortalMode() {
      try {
        const stored = await AsyncStorage.getItem('devlomatix.curexa_portal_mode');
        if (stored === 'HOSPITAL' || stored === 'PATIENT') {
          setPortalModeState(stored);
        }
      } catch (e) {
        // ignore
      }
    }
    hydratePortalMode();
  }, []);

  const setPortalMode = async (newMode) => {
    setPortalModeState(newMode);
    try {
      await AsyncStorage.setItem('devlomatix.curexa_portal_mode', newMode);
    } catch (e) {
      // ignore
    }
  };

  // Patient Profile for Patient Portal
  const [currentPatientProfile, setCurrentPatientProfile] = useState({
    id: 'p-1',
    sku: 'PAT-2026-001',
    displayName: 'Eleanor Vance',
    gender: 'Female',
    age: 38,
    bloodGroup: 'O+',
    uhid: 'CUX-889102',
    phone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    emergencyContact: {
      name: 'Arthur Vance',
      relation: 'Spouse',
      phone: '+1 (555) 019-2834',
    },
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['Hypertension', 'Mild Asthma'],
    vitals: {
      bp: '128/84',
      heartRate: '76 bpm',
      spo2: '98%',
      temperature: '98.6 °F',
      respRate: '16 rpm',
      weight: '64 kg',
      height: '168 cm',
      bmi: '22.7',
      lastRecorded: 'Today, 08:45 AM',
    },
    insurance: {
      provider: 'Blue Cross Shield',
      policyNumber: 'BCS-9923841',
      validTill: '2027-12-31',
      coverage: '80%',
    },
  });

  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'rx-101',
      patientName: 'Eleanor Vance',
      patientSku: 'PAT-2026-001',
      doctorName: 'Dr. Sarah Lin, MD',
      specialty: 'Cardiology',
      diagnosis: 'Post-Catheterization Ischemia Prevention',
      prescribedAt: '2026-09-15',
      status: 'Active',
      medicines: [
        {
          name: 'Atorvastatin Calcium 20mg',
          dosage: '1 - 0 - 1',
          duration: '30 Days',
          timing: 'After Meals',
          takenMorning: true,
          takenNight: false,
        },
        {
          name: 'Aspirin Cardio 75mg',
          dosage: '0 - 1 - 0',
          duration: '30 Days',
          timing: 'After Lunch',
          takenAfternoon: false,
        },
        {
          name: 'Pantoprazole 40mg',
          dosage: '1 - 0 - 0',
          duration: '14 Days',
          timing: 'Before Breakfast',
          takenMorning: true,
        },
      ],
    },
    {
      id: 'rx-102',
      patientName: 'Robert Sterling',
      patientSku: 'PAT-2026-002',
      doctorName: 'Dr. Mark Bennett, MD',
      specialty: 'Neurology',
      diagnosis: 'Acute Migraine Prophylaxis',
      prescribedAt: '2026-09-15',
      status: 'Active',
      medicines: [
        {
          name: 'Sumatriptan 50mg',
          dosage: 'SOS (When Needed)',
          duration: '10 Days',
          timing: 'Onset of aura',
          takenMorning: false,
        },
        {
          name: 'Pantoprazole 40mg',
          dosage: '1 - 0 - 0',
          duration: '14 Days',
          timing: 'Before Breakfast',
          takenMorning: true,
        },
      ],
    },
  ]);

  const toggleDoseTaken = (rxId, medIndex, doseKey) => {
    setPrescriptions((prev) =>
      prev.map((rx) => {
        if (rx.id !== rxId) return rx;
        const updatedMeds = [...rx.medicines];
        if (updatedMeds[medIndex]) {
          updatedMeds[medIndex] = {
            ...updatedMeds[medIndex],
            [doseKey]: !updatedMeds[medIndex][doseKey],
          };
        }
        return { ...rx, medicines: updatedMeds };
      })
    );
  };

  const addPrescriptionLocally = (newRx) => {
    setPrescriptions((prev) => [newRx, ...prev]);
  };

  // Quick Action Modal states
  const [modalState, setModalState] = useState({
    addPatient: false,
    bookAppointment: false,
    admitBed: false,
    dispenseRx: false,
    createLabOrder: false,
    createInvoice: false,
  });

  const openModal = (modalName) => {
    setModalState((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModalState((prev) => ({ ...prev, [modalName]: false }));
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, bRes, mRes, lRes, iRes, dRes] = await Promise.all([
        getPatients(),
        getAppointments(),
        getBeds(),
        getPharmacyData(),
        getLaboratoryOrders(),
        getBillingInvoices(),
        getDepartmentsAndDoctors(),
      ]);

      if (pRes?.patients) setPatients(pRes.patients);
      if (aRes?.appointments) setAppointments(aRes.appointments);
      if (bRes?.wards) setWards(bRes.wards);
      if (mRes?.medicines) setMedicines(mRes.medicines);
      if (lRes?.orders) setLabOrders(lRes.orders);
      if (iRes?.invoices) setInvoices(iRes.invoices);
      if (dRes?.departments) setDepartments(dRes.departments);
    } catch (err) {
      console.error('Error loading Curexa data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetail(true);
  };

  const addPatientLocally = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
  };

  const addAppointmentLocally = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
  };

  const addLabOrderLocally = (newOrder) => {
    setLabOrders((prev) => [newOrder, ...prev]);
  };

  const addInvoiceLocally = (newInvoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const addHandoverLocally = (newHandover) => {
    setHandovers((prev) => [newHandover, ...prev]);
  };

  const addWhatsappLogLocally = (newLog) => {
    setWhatsappLogs((prev) => [newLog, ...prev]);
  };

  const updateTelemetryBedLocally = (bedId, updatedVitals) => {
    setTelemetryBeds((prev) =>
      prev.map((b) => (b.bedId === bedId ? { ...b, vitals: { ...b.vitals, ...updatedVitals } } : b))
    );
  };

  const value = {
    loading,
    portalMode,
    setPortalMode,
    hospitalInfo,
    selectedDepartment,
    setSelectedDepartment,
    patients,
    setPatients,
    appointments,
    setAppointments,
    wards,
    setWards,
    medicines,
    setMedicines,
    labOrders,
    setLabOrders,
    invoices,
    setInvoices,
    departments,
    setDepartments,
    telemetryBeds,
    setTelemetryBeds,
    handovers,
    setHandovers,
    onCallDoctors,
    setOnCallDoctors,
    whatsappLogs,
    setWhatsappLogs,
    selectedPatient,
    setSelectedPatient,
    showPatientDetail,
    setShowPatientDetail,
    viewPatientDetails,
    currentPatientProfile,
    setCurrentPatientProfile,
    prescriptions,
    setPrescriptions,
    addPrescriptionLocally,
    toggleDoseTaken,
    modalState,
    openModal,
    closeModal,
    loadAllData,
    addPatientLocally,
    addAppointmentLocally,
    addLabOrderLocally,
    addInvoiceLocally,
    addHandoverLocally,
    addWhatsappLogLocally,
    updateTelemetryBedLocally,
  };

  return <CurexaContext.Provider value={value}>{children}</CurexaContext.Provider>;
}

export function useCurexa() {
  const context = useContext(CurexaContext);
  if (!context) {
    throw new Error('useCurexa must be used within a CurexaProvider');
  }
  return context;
}
