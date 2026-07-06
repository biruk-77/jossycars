import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  authMode, 
  setAuthMode, 
  handleAuthSubmit 
}) {
  const [form, setForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await handleAuthSubmit(authMode, form);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop px-4">
      <div className="w-full max-w-sm bg-modal border border-medium rounded-2xl p-6 glass-panel relative animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-semi-trans text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-display font-bold text-center text-white mb-6 uppercase tracking-wider">
          {authMode === 'login' ? 'Client Access' : 'Create Account'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authMode === 'signup' && (
            <>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-dim-10 font-bold text-neutral-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Abebe Balcha" 
                  className="form-input text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-dim-10 font-bold text-neutral-400 uppercase">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+251911000000" 
                  className="form-input text-xs"
                />
              </div>
            </>
          )}
          
          <div className="flex flex-col gap-1 text-left">
            <label className="text-dim-10 font-bold text-neutral-400 uppercase">Username</label>
            <input 
              type="text" 
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="john_doe" 
              className="form-input text-xs"
            />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <label className="text-dim-10 font-bold text-neutral-400 uppercase">Password</label>
            <input 
              type="password" 
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" 
              className="form-input text-xs"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 text-center font-medium mt-1">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-amber disabled:bg-neutral-800 text-black text-xs font-bold uppercase rounded font-display tracking-widest transition-all"
          >
            {loading ? 'Authenticating...' : authMode === 'login' ? 'Authenticate' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-400 mt-4">
          {authMode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button 
                onClick={() => { setAuthMode('signup'); setError(''); }}
                className="text-amber font-bold hover:underline"
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button 
                onClick={() => { setAuthMode('login'); setError(''); }}
                className="text-amber font-bold hover:underline"
              >
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
