import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AddUserPage from './pages/AddUserPage';
import DashboardPage from './pages/DashboardPage';
import LeadGenerationPage from './pages/LeadGenerationPage';

import RoleSelectionPage from './pages/RoleSelectionPage';
import BuilderLoginPage from './pages/BuilderLoginPage';
import AgentLoginPage from './pages/AgentLoginPage';

function App() {
  return (
    <Router>
      <div>
        {/* Header - Global */}
        <header style={{ 
          marginBottom: "2rem", 
          paddingBottom: "1rem", 
          borderBottom: "1px solid var(--border-subtle)",
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
             <h1 style={{ marginBottom: 0, fontSize: '1.5rem', background: 'none', WebkitTextFillColor: 'initial', color: 'var(--text-main)' }}>
               HIT Lead Gen
             </h1>
          </div>
          <nav>
            <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', padding: 0, margin: 0 }}>
               <li><a href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 500 }}>Dashboard</a></li>
               <li><a href="/add-user" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Users</a></li>
               <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Settings</a></li>
            </ul>
          </nav>
        </header>

        {/* Content Routes */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />
          <Route path="/builder-login" element={<BuilderLoginPage />} />
          <Route path="/agent-login" element={<AgentLoginPage />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lead/:id" element={<LeadGenerationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
