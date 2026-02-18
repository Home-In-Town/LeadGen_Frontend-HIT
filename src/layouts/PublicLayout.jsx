import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';

const PublicLayout = () => {
  const isAuthenticated = !!localStorage.getItem('currentUser');

  // Optional: Redirect authenticated users to dashboard?
  // User's request implied seeing "Landing Page" but without "Navbar".
  // If we redirect authenticated users, they can't see Landing Page.
  // The request "when i'm on landing page the navbar shows... fix it so that... only 'dashboard' shows"
  // implies hiding the navbar on landing page (even if logged in).
  
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {!isLandingPage && <Header showNav={false} />}
      <main className={!isLandingPage ? "px-4" : ""}>
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;
