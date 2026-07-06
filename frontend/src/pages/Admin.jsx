import React, { useState, useEffect } from 'react';
import { Shield, Lock, Plus, FileText, Calendar, Trash2, RefreshCw } from 'lucide-react';

export default function Admin({ user, refetchCars }) {
  const [syncChannel, setSyncChannel] = useState('jossycarmar');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  
  const [newCarForm, setNewCarForm] = useState({
    title: '', price: '', details: '', photos: '', link: ''
  });
  const [carSubmitSuccess, setCarSubmitSuccess] = useState('');
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const token = user.token;
      
      const resInq = await fetch('/api/inquiries', { headers: { 'Authorization': `Bearer ${token}` } });
      const inqs = await resInq.json();
      setAdminInquiries(inqs);

      const resUsers = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const usrs = await resUsers.json();
      setAdminUsers(usrs);
    } catch (err) {
      console.error('Failed to load admin logs', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleSync = async () => {
    if (!user || user.role !== 'admin') return;
    setSyncLoading(true);
    setSyncResult('');
    try {
      const res = await fetch('/api/cars/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ channel: syncChannel })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data.message || 'Sync successful!');
        refetchCars();
      } else {
        setSyncResult(data.error || 'Sync failed');
      }
    } catch (err) {
      setSyncResult('Network error during sync');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCarCreate = async (e) => {
    e.preventDefault();
    setCarSubmitSuccess('');
    const { title, price, details, photos, link } = newCarForm;
    if (!title || !price) return;

    const photosArray = photos 
      ? photos.split(',').map(p => p.trim()) 
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title, price, details, photos: photosArray, link })
      });

      if (res.ok) {
        setCarSubmitSuccess('Listing created successfully!');
        setNewCarForm({ title: '', price: '', details: '', photos: '', link: '' });
        refetchCars();
      } else {
        const err = await res.json();
        setCarSubmitSuccess(`Error: ${err.error}`);
      }
    } catch (err) {
      setCarSubmitSuccess('Failed to connect to backend.');
    }
  };

  const deleteInquiry = async (inqId) => {
    try {
      const res = await fetch(`/api/inquiries/${inqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex-1 section-container flex flex-col gap-10 animate-fade-in text-left">
      <div className="flex flex-col md-flex-row md-items-center justify-between gap-4">
        <div>
          <span className="text-dim-10 font-bold text-red-400 tracking-widest uppercase">SYSTEM CONTROL PANEL</span>
          <h2 className="text-3xl font-display font-extrabold mt-1">Admin Operations Center</h2>
        </div>
        
        <div className="bg-deep-black border border-subtle rounded-xl p-4 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-dim-9 font-bold text-neutral-500 uppercase tracking-widest">Telegram Channel ID</span>
            <input 
              type="text" 
              value={syncChannel}
              onChange={(e) => setSyncChannel(e.target.value)}
              className="bg-row border border-medium rounded px-2-5 py-1 text-xs text-white max-w-[150px] mt-1"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="mt-4 px-4 py-1-5 bg-amber disabled:bg-neutral-800 text-black text-xs font-bold font-display uppercase tracking-widest rounded flex items-center gap-2"
          >
            {syncLoading ? <RefreshCw className="w-3-5 h-3-5 animate-spin" /> : <RefreshCw className="w-3-5 h-3-5" />}
            Sync
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="bg-semi-trans border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300">
          ℹ {syncResult}
        </div>
      )}

      <div className="grid grid-cols-1 md-grid-cols-2 gap-8">
        <div className="bg-card border border-subtle rounded-xl p-6 flex flex-col gap-4 shadow">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-white">SQL Injection Prevention HUD</div>
              <div className="text-dim-10 text-neutral-500 uppercase font-bold mt-0-5">Database Security Status: SECURE</div>
            </div>
          </div>
          <hr className="border-subtle" />
          <div className="flex flex-col gap-3">
            <div className="text-xs text-neutral-300">
              The database was cleanly migrated to SQLite, implementing strict **parameterized execution statements** in all queries:
            </div>
            <div className="bg-row p-3 rounded font-mono text-dim-11 text-neutral-400 border border-subtle">
              <div>db.get('SELECT * FROM users WHERE username = ?', [username])</div>
            </div>
            <div className="text-xs text-neutral-400">
              🛡️ This technique separates user variables from statement code, rendering injection hacks completely inert.
            </div>
          </div>
        </div>

        <div className="bg-card border border-subtle rounded-xl p-6 flex flex-col gap-4 shadow">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-500" />
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-white">API Rate Limiting Metrics</div>
              <div className="text-dim-10 text-neutral-500 uppercase font-bold mt-0-5">DOS Protection Status: ACTIVE</div>
            </div>
          </div>
          <hr className="border-subtle" />
          <div className="flex flex-col gap-3">
            <div className="text-xs text-neutral-300">
              Express-rate-limit intercepts incoming endpoint calls to prevent brute-force scrapers:
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-row p-3 rounded border border-subtle">
                <div className="text-dim-10 text-neutral-500 uppercase tracking-widest font-bold">General API Routes</div>
                <div className="text-base font-bold text-white mt-1">150 reqs / 15m</div>
              </div>
              <div className="bg-row p-3 rounded border border-subtle">
                <div className="text-dim-10 text-neutral-500 uppercase tracking-widest font-bold">Auth Endpoints</div>
                <div className="text-base font-bold text-amber-500 mt-1">20 reqs / 15m</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg-grid-cols-3 gap-8">
        <div className="lg-col-span-1 bg-card border border-subtle rounded-xl p-6 flex flex-col gap-4 shadow">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">New Listing</h3>
          </div>
          <hr className="border-subtle" />
          <form onSubmit={handleCarCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-dim-10 font-bold text-neutral-400 uppercase">Title</label>
              <input
                type="text"
                required
                value={newCarForm.title}
                onChange={(e) => setNewCarForm({ ...newCarForm, title: e.target.value })}
                placeholder="Toyota Land Cruiser 2026"
                className="form-input py-2 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-dim-10 font-bold text-neutral-400 uppercase">Price</label>
              <input
                type="text"
                required
                value={newCarForm.price}
                onChange={(e) => setNewCarForm({ ...newCarForm, price: e.target.value })}
                placeholder="12.5 Million Br"
                className="form-input py-2 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-dim-10 font-bold text-neutral-400 uppercase">Details</label>
              <textarea
                rows={3}
                value={newCarForm.details}
                onChange={(e) => setNewCarForm({ ...newCarForm, details: e.target.value })}
                placeholder="Transmission: Auto, Fuel: Benzene, Plate: Code 2..."
                className="form-input py-2 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-dim-10 font-bold text-neutral-400 uppercase">Photo URLs (comma separated)</label>
              <input
                type="text"
                value={newCarForm.photos}
                onChange={(e) => setNewCarForm({ ...newCarForm, photos: e.target.value })}
                placeholder="https://link1.com, https://link2.com"
                className="form-input py-2 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-dim-10 font-bold text-neutral-400 uppercase">Telegram Link</label>
              <input
                type="text"
                value={newCarForm.link}
                onChange={(e) => setNewCarForm({ ...newCarForm, link: e.target.value })}
                placeholder="https://t.me/jossycarmar/123"
                className="form-input py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 py-2 bg-amber text-black text-xs font-bold uppercase rounded font-display tracking-widest transition-all"
            >
              Create Listing
            </button>
          </form>
          {carSubmitSuccess && (
            <div className="text-xs text-amber-500 font-medium">{carSubmitSuccess}</div>
          )}
        </div>

        <div className="lg-col-span-2 bg-card border border-subtle rounded-xl p-6 flex flex-col gap-4 shadow">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Customer Leads ({adminInquiries.length})
            </h3>
          </div>
          <hr className="border-subtle" />
          {adminInquiries.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral-500">No leads captured.</div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
              {adminInquiries.map((inq) => (
                <div key={inq.id} className="bg-row border border-subtle rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{inq.name}</span>
                      <span className="text-dim-10 bg-semi-trans px-2 py-0-5 rounded text-neutral-400">{inq.phone}</span>
                    </div>
                    <div className="text-dim-10 text-neutral-400 mt-1">
                      Vehicle: <span className="text-amber-500 font-semibold">{inq.carTitle}</span> ({inq.carPrice})
                    </div>
                    <div className="text-dim-9 text-neutral-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(inq.date).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteInquiry(inq.id)}
                    className="p-2 hover:bg-semi-trans rounded-lg text-red-400 hover:text-red-300 transition-all"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
