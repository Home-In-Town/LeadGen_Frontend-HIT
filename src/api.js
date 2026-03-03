import axios from 'axios';

// Use environment variable for API URL with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
export const API_URL = `${BASE_URL}/api/leads`;
const VOICE_API_URL = `${BASE_URL}/api/voice`;

// ====== USER ENDPOINTS ======
export const createUser = (data) => axios.post(`${API_URL}/users`, data);
export const getAllUsers = (params) => axios.get(`${API_URL}/users`, { params });
export const uploadUser = (file, creatorData) => {
    const formData = new FormData();
    formData.append('file', file);
    if (creatorData) {
        formData.append('createdBy', JSON.stringify(creatorData));
    }
    return axios.post(`${API_URL}/users/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteUser = (id) => axios.delete(`${API_URL}/users/${id}`);

// ====== LEAD ENDPOINTS ======
export const getAllLeads = (params) => axios.get(API_URL, { params });
export const createLeadFromUser = (userId, creatorData) => axios.post(`${API_URL}/from-user/${userId}`, creatorData);
export const updateWhatsapp = (id, reply) => axios.post(`${API_URL}/${id}/whatsapp-result`, { reply });
export const updateAiCall = (id, data) => axios.post(`${API_URL}/${id}/ai-call-result`, data);
export const updateLinkActivity = (id, data) => axios.post(`${API_URL}/${id}/link-activity`, data);
export const getSummary = (id) => axios.get(`${API_URL}/${id}/summary`);
export const deleteLead = (id) => axios.delete(`${API_URL}/${id}`);

// ====== VOICE CALL ENDPOINTS ======
export const getCallStatus = (leadId) => axios.get(`${VOICE_API_URL}/status/${leadId}`);

// ====== LEAD AUTOMATION ENDPOINTS ======
const AUTOMATION_API_URL = `${BASE_URL}/api/lead-automation`;
export const getWhatsappTemplates = () => axios.get(`${AUTOMATION_API_URL}/templates`);
export const getLeadAutomations = (leadId) => axios.get(`${AUTOMATION_API_URL}/lead/${leadId}`);
export const createLeadAutomation = (data) => axios.post(AUTOMATION_API_URL, data);
export const deleteLeadAutomation = (id) => axios.delete(`${AUTOMATION_API_URL}/${id}`);
