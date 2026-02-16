import { Link, useNavigate } from 'react-router-dom';

const Header = ({ showNav }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      navigate('/');
    }
  };

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
         <h1 style={{ marginBottom: 0, fontSize: '1.5rem', background: 'none', WebkitTextFillColor: 'initial', color: 'var(--text-main)' }}>
           HIT Lead Gen
         </h1>
      </div>
      
      {showNav && (
        <nav>
          <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', padding: 0, margin: 0, alignItems: 'center' }}>
             <li><Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 500 }}>Dashboard</Link></li>
             <li><Link to="/add-user" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Users</Link></li>
             <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Settings</a></li>
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
