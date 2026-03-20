import axios from 'axios';

// Use environment variable for API URL with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';
const SALES_WEBSITE_URL = import.meta.env.VITE_SALES_WEBSITE_URL || 'https://www.homeintown.in';

// Helper to create an axios instance with shared interceptors
const createApiInstance = (path) => {
    const instance = axios.create({
        baseURL: `${BASE_URL}/api${path}`
    });

    // Request interceptor: Add the auth token
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor: Handle 401 Unauthorized
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                console.error(`Session expired on ${path}. Redirecting...`);
                
                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');

                // Redirect to Sales Website
                window.location.href = `${SALES_WEBSITE_URL}/dashboard?msg=session_expired`;
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

// Create instances for different modules
const leadsApi = createApiInstance('/leads');
const voiceApi = createApiInstance('/voice');
const automationApi = createApiInstance('/lead-automation');
const googleApi = createApiInstance('/google');

// Default export (leadsApi)
export default leadsApi;

export const API_URL = `${BASE_URL}/api/leads`;

// ====== USER ENDPOINTS ======
export const createUser = (data) => leadsApi.post(`/users`, data);
export const getAllUsers = (params) => leadsApi.get(`/users`, { params });
export const uploadUser = (file, creatorData) => {
    const formData = new FormData();
    formData.append('file', file);
    if (creatorData) {
        formData.append('createdBy', JSON.stringify(creatorData));
    }
    return leadsApi.post(`/users/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteUser = (id) => leadsApi.delete(`/users/${id}`);

// ====== LEAD ENDPOINTS ======
export const getAllLeads = (params) => leadsApi.get('', { params });
export const createLeadFromUser = (userId, creatorData) => leadsApi.post(`/from-user/${userId}`, creatorData);
export const updateWhatsapp = (id, reply) => leadsApi.post(`/${id}/whatsapp-result`, { reply });
export const updateAiCall = (id, data) => leadsApi.post(`/${id}/ai-call-result`, data);
export const updateLinkActivity = (id, data) => leadsApi.post(`/${id}/link-activity`, data);
export const getSummary = (id) => leadsApi.get(`/${id}/summary`);
export const deleteLead = (id) => leadsApi.delete(`/${id}`);

// ====== VOICE CALL ENDPOINTS ======
export const getCallStatus = (leadId) => voiceApi.get(`/status/${leadId}`);

// ====== LEAD AUTOMATION ENDPOINTS ======
export const getWhatsappTemplates = () => automationApi.get(`/templates`);
export const getLeadAutomations = (leadId) => automationApi.get(`/lead/${leadId}`);
export const getCreatorAutomations = (userId) => automationApi.get(`/creator/${userId}`);
export const createLeadAutomation = (data) => automationApi.post('', data);
export const deleteLeadAutomation = (id) => automationApi.delete(`/${id}`);

// ====== GOOGLE INTEGRATION ======
export const getGoogleMappings = () => googleApi.get('/mapping');
export const createGoogleMapping = (data) => googleApi.post('/mapping', data);
export const deleteGoogleMapping = (id) => googleApi.delete(`/mapping/${id}`);

// ====== SHARED: PROJECT LIST (used by Google & Facebook integration pages) ======
const projectsApi = createApiInstance('/projects');
export const getBuilderProjects = () => projectsApi.get('/list');

