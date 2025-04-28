import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import ChainGuardLandingPage from './App';
import Privacy from './pages/Privacy';
import Impressum from './pages/Impressum';
import Whistleblower from './pages/Whistleblower';
import Danke from './pages/Danke';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<ChainGuardLandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/whistleblower" element={<Whistleblower />} />
            <Route path="/datenschutz" element={<Privacy />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/danke" element={<Danke />} />
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