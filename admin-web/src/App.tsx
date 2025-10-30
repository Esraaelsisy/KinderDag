import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Venues from './pages/Venues';
import Events from './pages/Events';
import AddEvent from './pages/AddEvent';
import EditEvent from './pages/EditEvent';
import Categories from './pages/Categories';
import Collections from './pages/Tags';
import Banners from './pages/Banners';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
        <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/venues" />} />
        <Route path="/" element={session ? <Navigate to="/venues" /> : <Navigate to="/login" />} />
        <Route path="/venues" element={session ? <Venues /> : <Navigate to="/login" />} />
        <Route path="/events" element={session ? <Events /> : <Navigate to="/login" />} />
        <Route path="/events/add" element={session ? <AddEvent /> : <Navigate to="/login" />} />
        <Route path="/events/edit/:id" element={session ? <EditEvent /> : <Navigate to="/login" />} />
        <Route path="/categories" element={session ? <Categories /> : <Navigate to="/login" />} />
        <Route path="/collections" element={session ? <Collections /> : <Navigate to="/login" />} />
        <Route path="/banners" element={session ? <Banners /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
