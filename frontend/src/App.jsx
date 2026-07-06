import React, { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { useRouter } from './hooks/useRouter';
import { useAuth } from './hooks/useAuth';
import { useCars } from './hooks/useCars';

import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CompareModal from './components/CompareModal';

import Home from './pages/Home';
import CarDetail from './pages/CarDetail';
import Calculator from './pages/Calculator';
import Videos from './pages/Videos';
import About from './pages/About';
import Admin from './pages/Admin';

import { TRANSLATIONS } from './i18n';

export default function App() {
  const { path, navigate: navigateTo } = useRouter();
  const { user, login, signup, logout } = useAuth();
  const { 
    cars, 
    filtered, 
    loading: loadingCars, 
    filters, 
    setFilters, 
    compareList, 
    toggleCompare, 
    refetch: refetchCars 
  } = useCars();

  const [lang, setLang] = useState(localStorage.getItem('rceth_lang') || 'en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Translation helper
  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const handleLangToggle = () => {
    const next = lang === 'am' ? 'en' : 'am';
    setLang(next);
    localStorage.setItem('rceth_lang', next);
  };

  const handleAuthSubmit = async (mode, form) => {
    if (mode === 'login') {
      await login(form.username, form.password);
    } else {
      await signup(form);
    }
  };

  const handleLogout = () => {
    logout();
    if (path === '/admin') navigateTo('/');
  };

  // Route matching helper
  const renderRoute = () => {
    if (path === '/') {
      return (
        <Home 
          cars={cars} 
          filteredCars={filtered} 
          loadingCars={loadingCars} 
          filters={filters} 
          setFilters={setFilters} 
          compareList={compareList} 
          toggleCompare={toggleCompare} 
          navigateTo={navigateTo} 
          lang={lang} 
          t={t} 
        />
      );
    }

    if (path.startsWith('/car/')) {
      const carId = path.substring(5);
      return (
        <CarDetail 
          carId={carId} 
          cars={cars} 
          navigateTo={navigateTo} 
          t={t} 
        />
      );
    }

    if (path === '/calculator') {
      return <Calculator />;
    }

    if (path === '/videos') {
      return <Videos t={t} />;
    }

    if (path === '/about') {
      return <About t={t} />;
    }

    if (path === '/admin') {
      if (user?.role !== 'admin') {
        return (
          <main className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-400">
            <h2 className="text-2xl font-display font-black text-white">Access Denied</h2>
            <p className="text-sm mt-2 mb-6">You must be logged in as an administrator to view this page.</p>
            <button onClick={() => navigateTo('/')} className="btn-premium">Return Home</button>
          </main>
        );
      }
      return <Admin user={user} refetchCars={refetchCars} />;
    }

    // 404 fallback
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-400">
        <h2 className="text-3xl font-display font-black text-white">Page Not Found</h2>
        <p className="text-sm mt-2 mb-6">The requested path was not recognized.</p>
        <button onClick={() => navigateTo('/')} className="btn-premium">Return Home</button>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-deep-black text-white flex flex-col font-sans">
      {/* HEADER NAVBAR */}
      <Header 
        currentPath={path} 
        navigateTo={navigateTo} 
        lang={lang} 
        handleLangToggle={handleLangToggle} 
        user={user} 
        handleLogout={handleLogout} 
        setAuthModalOpen={setAuthModalOpen} 
        setAuthMode={setAuthMode}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        t={t}
      />

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md-hidden bg-panel border-b border-subtle px-6 py-6 flex flex-col gap-4 animate-fade-in z-30 text-left">
          <button 
            onClick={() => navigateTo('/')}
            className={`text-left font-display text-sm font-bold uppercase tracking-widest ${path === '/' ? 'text-amber-500' : 'text-neutral-300'}`}
          >
            {t('nav-home')}
          </button>
          <button 
            onClick={() => navigateTo('/calculator')}
            className={`text-left font-display text-sm font-bold uppercase tracking-widest ${path === '/calculator' ? 'text-amber-500' : 'text-neutral-300'}`}
          >
            FINANCING
          </button>
          <button 
            onClick={() => navigateTo('/videos')}
            className={`text-left font-display text-sm font-bold uppercase tracking-widest ${path === '/videos' ? 'text-amber-500' : 'text-neutral-300'}`}
          >
            {t('nav-videos')}
          </button>
          <button 
            onClick={() => navigateTo('/about')}
            className={`text-left font-display text-sm font-bold uppercase tracking-widest ${path === '/about' ? 'text-amber-500' : 'text-neutral-300'}`}
          >
            {t('nav-about')}
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigateTo('/admin')}
              className="text-left font-display text-sm font-bold uppercase tracking-widest text-red-400"
            >
              ADMIN DASHBOARD
            </button>
          )}
          <hr className="border-subtle my-2" />
          <div className="flex items-center justify-between">
            <button 
              onClick={handleLangToggle}
              className="px-3 py-1 bg-semi-trans border border-medium rounded text-xs font-bold font-display"
            >
              Language: {lang === 'am' ? 'English' : 'አማርኛ'}
            </button>

            {user ? (
              <button 
                onClick={handleLogout}
                className="px-3 py-1-5 bg-red-trans text-red-300 rounded text-xs font-bold font-display"
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                className="px-4 py-2 bg-amber text-black rounded font-bold font-display text-xs"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* CORE PAGES RENDER */}
      <div className="flex-1 flex flex-col">
        {renderRoute()}
      </div>

      {/* FOOTER */}
      <Footer t={t} />

      {/* FLOATING COMPARE BAR */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-4 bg-glass border border-amber-subtle p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wide">
            <Scale className="w-4 h-4 text-amber" /> 
            <span>Comparing <strong className="text-amber">{compareList.length}</strong> vehicle{compareList.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3.5 py-1.5 bg-amber hover:bg-amber-600 text-black text-xs font-bold uppercase rounded tracking-wider transition-all"
            >
              Compare
            </button>
            <button
              onClick={() => toggleCompare(compareList[0]) /* Reset compare items */}
              className="p-1.5 bg-semi-trans hover:bg-medium-trans border border-subtle text-neutral-400 hover:text-white rounded"
              title="Clear Comparison"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* LOGIN/SIGNUP AUTH MODAL */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        authMode={authMode} 
        setAuthMode={setAuthMode} 
        handleAuthSubmit={handleAuthSubmit} 
      />

      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      <CompareModal 
        isOpen={showCompareModal} 
        onClose={() => setShowCompareModal(false)} 
        compareList={compareList} 
        navigateTo={navigateTo} 
      />
    </div>
  );
}
