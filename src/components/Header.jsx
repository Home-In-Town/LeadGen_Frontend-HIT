import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ showNav }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    textDecoration: 'none',
    color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: isActive(path) ? '600' : '500',
    borderBottom: isActive(path) ? '2px solid var(--primary)' : '2px solid transparent',
    paddingBottom: '0.25rem',
    transition: 'all 0.2s ease'
  });

  return (
    <header style={{ 
      marginBottom: "2rem", 
      paddingBottom: "1rem", 
      borderBottom: "1px solid var(--border-subtle)",
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link to={showNav ? "/dashboard" : "/"} style={{ textDecoration: 'none' }}>
           <h1 style={{ marginBottom: 0, fontSize: '1.5rem', background: 'none', WebkitTextFillColor: 'initial', color: 'var(--text-main)' }}>
             HIT Lead Gen
           </h1>
        </Link>
      </div>
      
      {showNav && (
        <nav>
          <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', padding: 0, margin: 0, alignItems: 'center' }}>
             <li>
               <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
             </li>
             <li>
               <Link to="/history" style={linkStyle('/history')}>History</Link>
             </li>
             <li>
               <a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>Settings</a>
             </li>
             <li>
               <button 
                 onClick={handleLogout}
                 style={{ 
                   background: 'none', 
                   border: '1px solid var(--border-subtle)', 
                   padding: '0.25rem 0.75rem', 
                   borderRadius: '4px',
                   color: 'var(--text-muted)',
                   cursor: 'pointer',
                   fontSize: '0.9rem'
                 }}
               >
                 Logout
               </button>
             </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
