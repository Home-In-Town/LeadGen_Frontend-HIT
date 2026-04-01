import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';

// Helper to create an axios instance with shared interceptors
const createApiInstance = (path) => {
    const instance = axios.create({
        baseURL: `${BASE_URL}/api${path}`,
        withCredentials: true  // Send cookie on every request
    });

    // Response interceptor: Handle 401 — redirect to /login
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                // Avoid redirect loop if already on login page
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
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

// ====== NOTIFICATION ENDPOINTS ======
const notificationApi = createApiInstance('/notifications');
export const getNotifications = (userId) => notificationApi.get('', { params: { userId } });
export const markNotificationRead = (id) => notificationApi.patch(`/${id}/read`);
export const markAllNotificationsRead = (userId) => notificationApi.patch(`/read-all`, { userId });

// ====== SHARED: PROJECT LIST (used by Google & Facebook integration pages) ======
const projectsApi = createApiInstance('/projects');
export const getBuilderProjects = () => projectsApi.get('/list');

// ====== CHAT ENDPOINTS ======
const chatApi = createApiInstance('/chat');
export const getChatConversations = (userId, role) => chatApi.get('/conversations', { params: { userId, role } });
export const getChatMessages = (leadId) => chatApi.get(`/${leadId}/messages`);
export const sendChatMessage = (leadId, data) => chatApi.post(`/${leadId}/send`, data);
export const markChatAsRead = (leadId) => chatApi.post(`/${leadId}/read`);

// ====== EMAIL DASHBOARD ENDPOINTS ======
const emailApi = createApiInstance('/email');
export const getEmailFolder = (folder, params) => emailApi.get(`/folder/${folder}`, { params });
export const getEmailById = (id) => emailApi.get(`/${id}`);
export const sendEmail = (data) => emailApi.post('/send', data);
export const testEmailConnection = () => emailApi.get('/test-connection');
export const disconnectEmail = () => emailApi.delete('/disconnect');
export const getEmailConnectionStatus = () => emailApi.get('/connection-status');

// ====== OAUTH ENDPOINTS (email integration) ======
export const getGoogleAuthUrl = (ownerId) => `${BASE_URL}/api/auth/google/login?ownerId=${ownerId}`;
export const getMicrosoftAuthUrl = (ownerId) => `${BASE_URL}/api/auth/microsoft/login?ownerId=${ownerId}`;

// ====== AUTH API (cookie-based, no 401 redirect) ======
// Uses a plain axios instance — 401 here means wrong credentials, not expired session
const _authAxios = axios.create({ baseURL: `${BASE_URL}/api/auth`, withCredentials: true });

export const authApi = {
    register: (data) => _authAxios.post('/register', data),
    verifyOtp: (phone, code) => _authAxios.post('/verify-otp', { phone, code }),
    login: (phone, mpin) => _authAxios.post('/login', { phone, mpin }),
    forgotMpin: (phone) => _authAxios.post('/forgot-mpin', { phone }),
    resetMpin: (phone, code, newMpin) => _authAxios.post('/reset-mpin', { phone, code, newMpin }),
    getSession: () => _authAxios.get('/session'),
    logout: () => _authAxios.post('/logout'),
};
