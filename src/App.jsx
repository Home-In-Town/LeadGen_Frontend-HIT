import { useState, useEffect, lazy, Suspense, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import NotificationToastContainer from './components/NotificationToast';

// ── Error Boundary — catches unhandled React errors in any page ───────────────
// Prevents a single page crash from taking down the entire dashboard.
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
                    <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                    <div className="text-center">
                        <p className="text-lg font-black text-slate-900 dark:text-white">Something went wrong</p>
                        <p className="text-sm text-slate-500 mt-1">{this.state.error?.message || 'An unexpected error occurred'}</p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="rounded-2xl bg-primary px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-charcoal"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Eagerly loaded (above the fold / always needed)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LeadChatSidebar from './components/lead/LeadChatSidebar';


// Lazy-loaded pages — only downloaded when the route is visited
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AddUserPage = lazy(() => import('./pages/AddUserPage'));
const LeadGenerationPage = lazy(() => import('./pages/LeadGenerationPage'));
const CRMPage = lazy(() => import('./pages/CRMPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const LeadAutomationPage = lazy(() => import('./pages/LeadAutomationPage'));
const ChatSelectionPage = lazy(() => import('./pages/ChatSelectionPage'));
const ChatDashboard = lazy(() => import('./pages/ChatDashboard'));
const EmailDashboardPage = lazy(() => import('./pages/EmailDashboardPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const FacebookIntegrationPage = lazy(() => import('./pages/FacebookIntegrationPage'));
const GoogleIntegrationPage = lazy(() => import('./pages/GoogleIntegrationPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const CallLogsPage = lazy(() => import('./pages/CallLogsPage'));
const CampaignPage = lazy(() => import('./pages/CampaignPage'));
const WhatsAppSetupPage = lazy(() => import('./pages/WhatsAppSetupPage'));
const WhatsAppTemplatesPage = lazy(() => import('./pages/WhatsAppTemplatesPage'));
const EmailTemplatesPage    = lazy(() => import('./pages/EmailTemplatesPage'));
const ProfilePage           = lazy(() => import('./pages/ProfilePage'));
const ProjectsPage          = lazy(() => import('./pages/ProjectsPage'));
const ProjectSettingsPage   = lazy(() => import('./pages/ProjectSettingsPage'));
const AddProjectPage        = lazy(() => import('./pages/AddProjectPage'));

function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );
}

function ToastRenderer() {
    const { toasts, dismissToast } = useNotifications();
    return <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

function ChatSidebarController() {
    const [config, setConfig] = useState({ isOpen: false, leadId: null, leadName: null });

    useEffect(() => {
        const handleOpen = (e) => {
            setConfig({ isOpen: true, leadId: e.detail.id, leadName: e.detail.name });
        };
        window.addEventListener('open-lead-chat', handleOpen);
        return () => window.removeEventListener('open-lead-chat', handleOpen);
    }, []);

    return (
        <LeadChatSidebar
            isOpen={config.isOpen}
            leadId={config.leadId}
            leadName={config.leadName}
            onClose={() => setConfig(prev => ({ ...prev, isOpen: false }))}
        />
    );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastRenderer />
          <ChatSidebarController />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-service" element={<TermsOfServicePage />} />
              </Route>

              {/* Protected Routes with Dashboard Navbar */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/add-user" element={<AddUserPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/lead/:id" element={<LeadGenerationPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/lead-automation" element={<LeadAutomationPage />} />
                <Route path="/lead-automation/:leadId" element={<LeadAutomationPage />} />
                <Route path="/chat" element={<ChatSelectionPage />} />
                <Route path="/chat/whatsapp" element={<ChatDashboard />} />
                <Route path="/chat/whatsapp/:leadId" element={<ChatDashboard />} />
                <Route path="/chat/email" element={<EmailDashboardPage />} />
                <Route path="/chat/email/:leadId" element={<EmailDashboardPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/integrations/facebook" element={<FacebookIntegrationPage />} />
                <Route path="/integrations/google" element={<GoogleIntegrationPage />} />
                <Route path="/call-logs" element={<CallLogsPage />} />
                <Route path="/campaigns" element={<CampaignPage />} />
                <Route path="/whatsapp-setup" element={<WhatsAppSetupPage />} />
                <Route path="/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
                <Route path="/email-templates" element={<EmailTemplatesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<AddProjectPage />} />
                <Route path="/projects/:hitProjectId" element={<ProjectSettingsPage />} />
              </Route>

              {/* Legacy redirects */}
              <Route path="/history" element={<Navigate to="/crm" replace />} />
              <Route path="/select-role" element={<Navigate to="/login" replace />} />
              <Route path="/builder-login" element={<Navigate to="/login" replace />} />
              <Route path="/agent-login" element={<Navigate to="/login" replace />} />
              <Route path="/admin-login" element={<Navigate to="/login" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
