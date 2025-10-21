import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/activities', label: 'Activities' },
    { path: '/categories', label: 'Categories' },
    { path: '/tags', label: 'Tags' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', padding: '24px', borderRight: '1px solid #334155' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' }}>
          KinderDag Admin
        </h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                color: location.pathname === item.path ? 'white' : '#94a3b8',
                backgroundColor: location.pathname === item.path ? '#3b82f6' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 'auto',
            position: 'absolute',
            bottom: '24px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            width: '202px',
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
