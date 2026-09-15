import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getAppointments,
  getBeds,
  getBillingInvoices,
  getDepartmentsAndDoctors,
  getLaboratoryOrders,
  getPatients,
  getPharmacyData,
} from '~/services/curexa';

const CurexaContext = createContext(null);

export function CurexaProvider({ children }) {
  const [loading, setLoading] = useState(false);
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

  // Active selected patient for detailed 360 view
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);

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

  const value = {
    loading,
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
    selectedPatient,
    setSelectedPatient,
    showPatientDetail,
    setShowPatientDetail,
    viewPatientDetails,
    modalState,
    openModal,
    closeModal,
    loadAllData,
    addPatientLocally,
    addAppointmentLocally,
    addLabOrderLocally,
    addInvoiceLocally,
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
