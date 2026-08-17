import { Outlet } from 'react-router-dom';

const PublicLayout = () => {

  // Optional: Redirect authenticated users to dashboard?
  // User's request implied seeing "Landing Page" but without "Navbar".
  // If we redirect authenticated users, they can't see Landing Page.
  // The request "when i'm on landing page the navbar shows... fix it so that... only 'dashboard' shows"
  // implies hiding the navbar on landing page (even if logged in).
  
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default PublicLayout;
