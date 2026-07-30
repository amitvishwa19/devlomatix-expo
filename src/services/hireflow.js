import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

function extractData(response) {
  if (!response) return null;
  if (response.data !== undefined) return response.data;
  return response;
}

function extractArray(response) {
  const data = extractData(response);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.jobs)) return data.jobs;
    if (Array.isArray(data.candidates)) return data.candidates;
    if (Array.isArray(data.applications)) return data.applications;
    if (Array.isArray(data.departments)) return data.departments;
    if (Array.isArray(data.interviews)) return data.interviews;
    if (Array.isArray(data.activities)) return data.activities;
    if (Array.isArray(data.result)) return data.result;
  }
  return [];
}

export async function getSummary(workspaceId) {
  const res = await api.get(apiUrls.hireflowSummary, { params: { workspaceId } });
  return { success: true, data: extractData(res.data) };
}

export async function getJobs(workspaceId) {
  const res = await api.get(apiUrls.hireflowJobs, { params: { workspaceId } });
  return { success: true, data: extractArray(res.data) };
}

export async function getJob(id) {
  const res = await api.get(`${apiUrls.hireflowJobById}/${id}`);
  return { success: true, data: extractData(res.data) };
}

export async function createJob(body) {
  const res = await api.post(apiUrls.hireflowJobs, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateJob(id, body) {
  const res = await api.put(`${apiUrls.hireflowJobById}/${id}`, body);
  return { success: true, data: extractData(res.data) };
}

export async function deleteJob(id) {
  const res = await api.delete(`${apiUrls.hireflowJobById}/${id}`);
  return { success: true, data: extractData(res.data) };
}

export async function getCandidates(workspaceId) {
  const res = await api.get(apiUrls.hireflowCandidates, { params: { workspaceId } });
  return { success: true, data: extractArray(res.data) };
}

export async function getCandidate(id) {
  const res = await api.get(`${apiUrls.hireflowCandidateById}/${id}`);
  return { success: true, data: extractData(res.data) };
}

export async function createCandidate(body) {
  const res = await api.post(apiUrls.hireflowCandidates, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateCandidate(id, body) {
  const res = await api.put(`${apiUrls.hireflowCandidateById}/${id}`, body);
  return { success: true, data: extractData(res.data) };
}

export async function deleteCandidate(id) {
  const res = await api.delete(`${apiUrls.hireflowCandidateById}/${id}`);
  return { success: true, data: extractData(res.data) };
}

export async function getApplications(workspaceId, jobId) {
  const params = { workspaceId };
  if (jobId) params.jobId = jobId;
  const res = await api.get(apiUrls.hireflowApplications, { params });
  return { success: true, data: extractArray(res.data) };
}

export async function createApplication(body) {
  const res = await api.post(apiUrls.hireflowApplications, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateApplicationStage(body) {
  const res = await api.put(apiUrls.hireflowApplications, body);
  return { success: true, data: extractData(res.data) };
}

export async function getDepartments(workspaceId) {
  const res = await api.get(apiUrls.hireflowDepartments, { params: { workspaceId } });
  return { success: true, data: extractArray(res.data) };
}

export async function createDepartment(body) {
  const res = await api.post(apiUrls.hireflowDepartments, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateDepartment(id, body) {
  const res = await api.put(`${apiUrls.hireflowDepartmentById}/${id}`, body);
  return { success: true, data: extractData(res.data) };
}

export async function deleteDepartment(id) {
  const res = await api.delete(`${apiUrls.hireflowDepartmentById}/${id}`);
  return { success: true, data: extractData(res.data) };
}

export async function getInterviews(workspaceId) {
  const res = await api.get(apiUrls.hireflowInterviews, { params: { workspaceId } });
  return { success: true, data: extractArray(res.data) };
}

export async function createInterview(body) {
  const res = await api.post(apiUrls.hireflowInterviews, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateInterview(id, body) {
  const res = await api.put(`${apiUrls.hireflowInterviewById}/${id}`, body);
  return { success: true, data: extractData(res.data) };
}

export async function createScorecard(body) {
  const res = await api.post(apiUrls.hireflowScorecards, body);
  return { success: true, data: extractData(res.data) };
}

export async function createNote(body) {
  const res = await api.post(apiUrls.hireflowNotes, body);
  return { success: true, data: extractData(res.data) };
}

export async function createOffer(body) {
  const res = await api.post(apiUrls.hireflowOffers, body);
  return { success: true, data: extractData(res.data) };
}

export async function updateOffer(body) {
  const res = await api.put(apiUrls.hireflowOffers, body);
  return { success: true, data: extractData(res.data) };
}

export async function getActivities(workspaceId) {
  const res = await api.get(apiUrls.hireflowActivities, { params: { workspaceId } });
  return { success: true, data: extractArray(res.data) };
}