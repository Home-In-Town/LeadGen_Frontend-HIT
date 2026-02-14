import axios from 'axios';

// Use environment variable for API URL with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
export const API_URL = `${BASE_URL}/api/leads`;
const VOICE_API_URL = `${BASE_URL}/api/voice`;

// ====== USER ENDPOINTS ======
export const createUser = (data) => axios.post(`${API_URL}/users`, data);
export const getAllUsers = () => axios.get(`${API_URL}/users`);
export const uploadUser = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/users/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// ====== LEAD ENDPOINTS ======
export const createLeadFromUser = (userId, creatorData) => axios.post(`${API_URL}/from-user/${userId}`, creatorData);
export const updateWhatsapp = (id, reply) => axios.post(`${API_URL}/${id}/whatsapp-result`, { reply });
export const updateAiCall = (id, data) => axios.post(`${API_URL}/${id}/ai-call-result`, data);
export const updateLinkActivity = (id, data) => axios.post(`${API_URL}/${id}/link-activity`, data);
export const getSummary = (id) => axios.get(`${API_URL}/${id}/summary`);

// ====== VOICE CALL ENDPOINTS ======
export const getCallStatus = (leadId) => axios.get(`${VOICE_API_URL}/status/${leadId}`);
