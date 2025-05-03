import React, { useEffect, useState } from 'react';
import Measures from './pages/Measures';
function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-between z-50 text-sm">
      <p className="mb-2 md:mb-0">
        Diese Website verwendet nur funktionale Cookies, um dir das bestmögliche Erlebnis zu bieten.
      </p>
      <button
        onClick={acceptCookies}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
      >
        Verstanden
      </button>
    </div>
  );
}
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import ChainGuardLandingPage from './App';
import Privacy from './pages/Privacy';
import Impressum from './pages/Impressum';
import Whistleblower from './components/Whistleblower.jsx';
import Danke from './pages/Danke';
import Analyse from './pages/Analyse';
import { supabase } from './client.js';
import LKGCompliancePage from './pages/LKGCompliancePage.jsx';
import DocumentManagementPage from './pages/DocumentManagementPage.jsx';
import Kommunikation from './pages/Kommunikation.jsx';

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-600">Lade...</div>;

  if (!session || !session.user.email_confirmed_at) {
    return (
      <div className="p-10 text-center text-red-600">
        Zugriff verweigert. Bitte bestätige deine E-Mail-Adresse.
      </div>
    );
  }

  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <CookieBanner />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<ChainGuardLandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/measures"
              element={
                <ProtectedRoute>
                  <Measures />
                </ProtectedRoute>
              }
            />
            <Route path="/whistleblower" element={<Whistleblower />} />
            <Route path="/datenschutz" element={<Privacy />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/danke" element={<Danke />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/lkg-compliance" element={<LKGCompliancePage />} />
            <Route path="/documents" element={<DocumentManagementPage />} />
            <Route path="/kommunikation" element={<Kommunikation />} />
          </Routes>
        </div>
        <footer className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2025 ChainGuard. Made with ❤️ in Germany. |
          <Link to="/impressum" className="mx-1 underline hover:text-gray-700 dark:hover:text-gray-200">Impressum</Link>|
          <Link to="/datenschutz" className="mx-1 underline hover:text-gray-700 dark:hover:text-gray-200">Datenschutz</Link>
        </footer>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);