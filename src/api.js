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
export const getCallLogs = (params) => voiceApi.get('/call-logs', { params });
export const getLeadCallHistory = (leadId) => voiceApi.get(`/leads/${leadId}/calls`);

// ====== VOICE SETTINGS ENDPOINTS ======
export const getVoiceSettings = () => voiceApi.get('/settings');
export const updateVoiceSettings = (data) => voiceApi.put('/settings', data);
export const resetVoiceSettings = () => voiceApi.delete('/settings');

// ====== VOICE DOCUMENTS ENDPOINTS ======
export const uploadVoiceDocument = (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return voiceApi.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const listVoiceDocuments = () => voiceApi.get('/documents');
export const deleteVoiceDocument = (docId) => voiceApi.delete(`/documents/${docId}`);

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
export const getChatConversations = (userId, role, cursor) => chatApi.get('/conversations', { params: { userId, role, ...(cursor ? { cursor } : {}) } });
export const getChatMessages = (leadId, cursor) => chatApi.get(`/${leadId}/messages`, { params: { ...(cursor ? { cursor } : {}) } });
export const sendChatMessage = (leadId, data) => chatApi.post(`/${leadId}/send`, data);
export const sendChatTemplate = (leadId, data) => chatApi.post(`/${leadId}/send-template`, data);
export const newChatConversation = (data) => chatApi.post('/new-conversation', data);
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

// ====== CAMPAIGN ENDPOINTS ======
const campaignApi = createApiInstance('/campaigns');
export const uploadCampaign = (file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    return campaignApi.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const listCampaigns = (params) => campaignApi.get('', { params });
export const getCampaignProgress = (id) => campaignApi.get(`/${id}/progress`);
export const getCampaignDeadLetters = (id) => campaignApi.get(`/${id}/dead-letters`);
export const retryCampaign = (id) => campaignApi.post(`/${id}/retry`);
export const pauseCampaign = (id) => campaignApi.post(`/${id}/pause`);
export const resumeCampaign = (id) => campaignApi.post(`/${id}/resume`);
export const deleteCampaign = (id) => campaignApi.delete(`/${id}`);

// ====== AUTH API (cookie-based, no 401 redirect) ======
// Uses a plain axios instance — 401 here means wrong credentials, not expired session
const _authAxios = axios.create({ baseURL: `${BASE_URL}/api/auth`, withCredentials: true });

export const authApi = {
    register: (data) => _authAxios.post('/register', data),
    verifyOtp: (phone, code) => _authAxios.post('/verify-otp', { phone, code }),
    login: (phone, mpin) => _authAxios.post('/login', { phone, mpin }),
    forgotMpin: (phone) => _authAxios.post('/forgot-mpin', { phone }),
    resetMpin: (phone, code, newMpin) => _authAxios.post('/reset-mpin', { phone, code, newMpin }),
    checkEmail: (email, mobile) => _authAxios.post('/check-email', { email, ...(mobile ? { mobile } : {}) }),
    verifyEmailOtp: (accessToken, name, mobile, email) => _authAxios.post('/verify-email-otp', { accessToken, name, mobile, email }),
    sendEmailOtp: (email) => _authAxios.post('/send-email-otp', { email }),
    verifyEmailOtpCode: (email, otp, reqId, name) => _authAxios.post('/verify-email-otp-code', { email, otp, reqId, name }),
    getSession: () => _authAxios.get('/session'),
    logout: () => _authAxios.post('/logout'),
    // New PIN-based auth flow
    setupPin: (tempToken, pin, name, mobile) => _authAxios.post('/setup-pin', { tempToken, pin, name, mobile }),
    loginWithPin: (email, pin) => _authAxios.post('/login-pin', { email, pin }),
    forgotPin: (email) => _authAxios.post('/forgot-pin', { email }),
    verifyResetOtp: (accessToken, email) => _authAxios.post('/verify-reset-otp', { accessToken, email }),
    resetPin: (tempToken, newPin) => _authAxios.post('/reset-pin', { tempToken, newPin }),
};

// ====== FACEBOOK INTEGRATION ENDPOINTS ======
const facebookApi = createApiInstance('/facebook');

// OAuth flow
export const initiateFBConnect  = () => {
    // Redirect browser to backend /connect which initiates OAuth
    window.location.href = `${BASE_URL}/api/facebook/connect`;
};

// Status: connection info + pages + forms + mappings
export const getFBStatus        = ()     => facebookApi.get('/status');
// Disconnect
export const disconnectFacebook = ()     => facebookApi.post('/disconnect');
// Fetch real-time leads from a specific form
export const getFBFormLeads     = (formId, limit = 25) =>
    facebookApi.get('/leads', { params: { formId, limit } });

// Form mapping CRUD
export const getFBMappings      = ()     => facebookApi.get('/mapping');
export const createFBMapping    = (data) => facebookApi.post('/mapping', data);
export const deleteFBMapping    = (id)   => facebookApi.delete(`/mapping/${id}`);
export const toggleFBMapping    = (id)   => facebookApi.patch(`/mapping/${id}/toggle`);
// Historical lead import
export const importFBHistorical = (days = 30, runAutomation = true) =>
    facebookApi.post(`/import-historical?days=${days}&runAutomation=${runAutomation}`);
export const subscribeFBWebhook = () => facebookApi.post('/subscribe-webhook');
export const getFBWebhookStatus = () => facebookApi.get('/webhook-status');
// Campaign management
export const syncFBCampaigns        = ()                  => facebookApi.post('/campaigns/sync');
export const getFBCampaigns         = (params)            => facebookApi.get('/campaigns', { params });
export const updateFBCampaignConfig = (campaignId, data)  => facebookApi.put(`/campaigns/${campaignId}/config`, data);

// ====== EMAIL TEMPLATE ENDPOINTS ======
const emailTemplateApi = createApiInstance('/email-templates');
export const listEmailTemplates   = ()       => emailTemplateApi.get('');
export const createEmailTemplate  = (data)   => emailTemplateApi.post('', data);
export const updateEmailTemplate  = (id, data) => emailTemplateApi.put(`/${id}`, data);
export const deleteEmailTemplate  = (id)     => emailTemplateApi.delete(`/${id}`);
export const testEmailTemplate    = (id)     => emailTemplateApi.post(`/${id}/test`);

// ====== AUTOMATION HISTORY ======
export const getLeadAutomationHistory = (leadId) => leadsApi.get(`/${leadId}/automation-history`);

const whatsappApi = createApiInstance('/whatsapp');

// Phone number management
export const listWAPhoneNumbers   = ()     => whatsappApi.get('/phone-numbers');
export const addWAPhoneNumber     = (data) => whatsappApi.post('/phone-numbers', data);
export const removeWAPhoneNumber  = (id)   => whatsappApi.delete(`/phone-numbers/${id}`);
export const setDefaultWAPhone    = (id)   => whatsappApi.patch(`/phone-numbers/${id}/default`);
export const connectMetaOAuth     = (code) => whatsappApi.post('/connect/meta-oauth', { code });

// Template management
export const listWATemplates      = ()          => whatsappApi.get('/templates');
export const createWATemplate     = (data)      => whatsappApi.post('/templates', data);
export const deleteWATemplate     = (name)      => whatsappApi.delete(`/templates/${name}`);
