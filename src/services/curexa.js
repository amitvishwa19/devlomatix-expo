import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

// Patient Service API calls
export async function getPatients(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaPatient, { params });
    return data;
  } catch (error) {
    console.error('getPatients API error:', error?.message || error);
    return null;
  }
}

export async function createPatient(patientData) {
  try {
    const { data } = await api.post(apiUrls.curexaPatient, patientData);
    return data;
  } catch (error) {
    console.error('createPatient API error:', error?.message || error);
    return null;
  }
}

export async function updatePatient(patientData) {
  try {
    const { data } = await api.put(apiUrls.curexaPatient, patientData);
    return data;
  } catch (error) {
    console.error('updatePatient API error:', error?.message || error);
    return null;
  }
}

export async function deletePatient(id) {
  try {
    const { data } = await api.delete(`${apiUrls.curexaPatient}?id=${id}`);
    return data;
  } catch (error) {
    console.error('deletePatient API error:', error?.message || error);
    return null;
  }
}

// Appointment Service API calls
export async function getAppointments(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaAppointment, { params });
    return data;
  } catch (error) {
    console.error('getAppointments API error:', error?.message || error);
    return null;
  }
}

export async function createAppointment(appointmentData) {
  try {
    const { data } = await api.post(apiUrls.curexaAppointment, { data: appointmentData });
    return data;
  } catch (error) {
    console.error('createAppointment API error:', error?.message || error);
    return null;
  }
}

// Bed & Ward Service API calls
export async function getBeds(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaBed, { params });
    return data;
  } catch (error) {
    console.error('getBeds API error:', error?.message || error);
    return null;
  }
}

export async function assignBed(bedData) {
  try {
    const { data } = await api.post(apiUrls.curexaBed, bedData);
    return data;
  } catch (error) {
    console.error('assignBed API error:', error?.message || error);
    return null;
  }
}

export async function updateBed(bedData) {
  try {
    const { data } = await api.put(apiUrls.curexaBed, bedData);
    return data;
  } catch (error) {
    console.error('updateBed API error:', error?.message || error);
    return null;
  }
}

// Pharmacy Service API calls
export async function getPharmacyData(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaPharmacy, { params });
    return data;
  } catch (error) {
    console.error('getPharmacyData API error:', error?.message || error);
    return null;
  }
}

export async function createMedicine(medicineData) {
  try {
    const { data } = await api.post(apiUrls.curexaPharmacy, medicineData);
    return data;
  } catch (error) {
    console.error('createMedicine API error:', error?.message || error);
    return null;
  }
}

export async function dispensePrescription(dispenseData) {
  try {
    const { data } = await api.put(apiUrls.curexaPharmacy, dispenseData);
    return data;
  } catch (error) {
    console.error('dispensePrescription API error:', error?.message || error);
    return null;
  }
}

// Laboratory Service API calls
export async function getLaboratoryOrders(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaLaboratory, { params });
    return data;
  } catch (error) {
    console.error('getLaboratoryOrders API error:', error?.message || error);
    return null;
  }
}

export async function createLabOrder(orderData) {
  try {
    const { data } = await api.post(apiUrls.curexaLaboratory, orderData);
    return data;
  } catch (error) {
    console.error('createLabOrder API error:', error?.message || error);
    return null;
  }
}

export async function updateLabOrder(orderData) {
  try {
    const { data } = await api.put(apiUrls.curexaLaboratory, orderData);
    return data;
  } catch (error) {
    console.error('updateLabOrder API error:', error?.message || error);
    return null;
  }
}

// Billing Service API calls
export async function getBillingInvoices(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaBilling, { params });
    return data;
  } catch (error) {
    console.error('getBillingInvoices API error:', error?.message || error);
    return null;
  }
}

export async function createInvoice(invoiceData) {
  try {
    const { data } = await api.post(apiUrls.curexaBilling, invoiceData);
    return data;
  } catch (error) {
    console.error('createInvoice API error:', error?.message || error);
    return null;
  }
}

export async function recordPayment(paymentData) {
  try {
    const { data } = await api.put(apiUrls.curexaBilling, paymentData);
    return data;
  } catch (error) {
    console.error('recordPayment API error:', error?.message || error);
    return null;
  }
}

// CRM Service API calls
export async function getCrmLeads(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaCrm, { params });
    return data;
  } catch (error) {
    console.error('getCrmLeads API error:', error?.message || error);
    return null;
  }
}

export async function createCrmLead(leadData) {
  try {
    const { data } = await api.post(apiUrls.curexaCrm, leadData);
    return data;
  } catch (error) {
    console.error('createCrmLead API error:', error?.message || error);
    return null;
  }
}

export async function updateCrmLeadStage(leadData) {
  try {
    const { data } = await api.put(apiUrls.curexaCrm, leadData);
    return data;
  } catch (error) {
    console.error('updateCrmLeadStage API error:', error?.message || error);
    return null;
  }
}

// Department & Doctor Roster API calls
export async function getDepartmentsAndDoctors(params = {}) {
  try {
    const { data } = await api.get(apiUrls.curexaDepartment, { params });
    return data;
  } catch (error) {
    console.error('getDepartmentsAndDoctors API error:', error?.message || error);
    return null;
  }
}

export async function createDepartmentOrDoctor(payload) {
  try {
    const { data } = await api.post(apiUrls.curexaDepartment, payload);
    return data;
  } catch (error) {
    console.error('createDepartmentOrDoctor API error:', error?.message || error);
    return null;
  }
}

export async function updateDoctorRoster(rosterData) {
  try {
    const { data } = await api.put(apiUrls.curexaDepartment, rosterData);
    return data;
  } catch (error) {
    console.error('updateDoctorRoster API error:', error?.message || error);
    return null;
  }
}
