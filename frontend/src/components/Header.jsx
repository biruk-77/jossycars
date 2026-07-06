import React from 'react';
import { Shield, User as UserIcon, Menu, X } from 'lucide-react';

export default function Header({ 
  currentPath, 
  navigateTo, 
  lang, 
  handleLangToggle, 
  user, 
  handleLogout, 
  setAuthModalOpen, 
  setAuthMode,
  mobileMenuOpen,
  setMobileMenuOpen,
  t
}) {
  return (
    <header className="sticky top-0 z-40 bg-header border-b border-subtle px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/')}>
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-logo font-display font-extrabold text-black tracking-tighter text-lg shadow-lg">
          J
        </div>
        <div>
          <div className="font-display font-black tracking-widest text-sm text-white">JOSSY REAL CARS</div>
          <div className="text-dim-9 tracking-wider text-amber-500 font-bold uppercase">LUXURY SHOWCASE</div>
        </div>
      </div>

      {/* Desktop Router Links */}
      <nav className="hidden md-flex items-center gap-8">
        <button 
          onClick={() => navigateTo('/')}
          className={`font-display text-xs font-bold uppercase tracking-widest transition-all ${
            currentPath === '/' ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t('nav-home')}
        </button>
        <button 
          onClick={() => navigateTo('/calculator')}
          className={`font-display text-xs font-bold uppercase tracking-widest transition-all ${
            currentPath === '/calculator' ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          FINANCING
        </button>
        <button 
          onClick={() => navigateTo('/videos')}
          className={`font-display text-xs font-bold uppercase tracking-widest transition-all ${
            currentPath === '/videos' ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t('nav-videos')}
        </button>
        <button 
          onClick={() => navigateTo('/about')}
          className={`font-display text-xs font-bold uppercase tracking-widest transition-all ${
            currentPath === '/about' ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t('nav-about')}
        </button>
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigateTo('/admin')}
            className={`flex items-center gap-1 font-display text-xs font-bold uppercase tracking-widest transition-all ${
              currentPath === '/admin' ? 'text-red-400 font-extrabold' : 'text-red-400/80 hover:text-red-300'
            }`}
          >
            <Shield className="w-3-5 h-3-5" /> ADMIN
          </button>
        )}
      </nav>

      {/* Right Header Panel */}
      <div className="hidden md-flex items-center gap-4">
        <button 
          onClick={handleLangToggle}
          className="px-3 py-1 bg-semi-trans hover:bg-medium-trans border border-medium rounded text-xs font-bold font-display uppercase tracking-widest"
        >
          {lang === 'am' ? 'EN' : 'አማ'}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-400">
              Hi, <span className="text-white font-semibold">{user.name || user.username}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1-5 bg-red-trans border border-red-subtle text-red-300 hover:text-white rounded text-xs font-bold font-display uppercase tracking-widest transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-600 text-black rounded font-bold font-display text-xs uppercase tracking-widest transition-all"
          >
            <UserIcon className="w-3-5 h-3-5" /> Client Portal
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md-hidden p-2 text-neutral-400 hover:text-white"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </header>
  );
}
