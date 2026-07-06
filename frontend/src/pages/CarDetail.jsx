import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Phone } from 'lucide-react';

export default function CarDetail({ 
  carId, 
  cars, 
  navigateTo, 
  t 
}) {
  const car = cars.find(c => c.id === carId);

  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!car) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-400">
        <h2 className="text-2xl font-display font-black text-white">Car Not Found</h2>
        <p className="text-sm mt-2 mb-6">The requested vehicle listing is not available or has been removed.</p>
        <button onClick={() => navigateTo('/')} className="btn-premium">Return to Catalog</button>
      </main>
    );
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    setLeadSuccess(false);
    setLoading(true);

    if (!leadForm.name || !leadForm.phone) {
      setLeadError('Please fill out all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          phone: leadForm.phone,
          carId: car.id,
          carTitle: car.title,
          carPrice: car.price
        })
      });

      if (res.ok) {
        setLeadSuccess(true);
        setLeadForm({ name: '', phone: '' });
      } else {
        const errData = await res.json();
        setLeadError(errData.error || 'Failed to submit callback request.');
      }
    } catch (err) {
      setLeadError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const photos = car.photos && car.photos.length > 0 
    ? car.photos 
    : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];

  return (
    <main className="flex-1 section-container max-w-5xl mx-auto py-10 flex flex-col lg-flex-row gap-10">
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col gap-6 text-left">
        <button 
          onClick={() => navigateTo('/')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest transition-all mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>

        <div className="aspect-video bg-neutral-900 border border-subtle rounded-xl overflow-hidden relative shadow-lg">
          <img 
            src={photos[0]}
            alt={car.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-4 left-4 bg-amber text-black px-3 py-1 rounded text-xs font-bold tracking-widest uppercase shadow">
            VERIFIED DEALER LISTING
          </span>
        </div>

        {/* Gallery thumbnails */}
        {photos.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {photos.map((p, idx) => (
              <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-subtle bg-neutral-900">
                <img src={p} alt="" className="w-full h-full object-cover hover:scale-105 transition-all duration-300" />
              </div>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">{car.title}</h1>
          <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Import ID: {car.id}</div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-amber uppercase tracking-widest">Specifications & Vehicle Overview</h3>
          <div className="bg-panel border border-subtle rounded-xl p-5 shadow-sm">
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {car.details}
            </p>
          </div>
        </div>
      </div>

      {/* Right Callback Sidebar CARD */}
      <div className="w-full lg-w-360 text-left shrink-0">
        <div className="sticky top-24 bg-card border border-subtle rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Market Value</span>
            <div className="text-3xl font-black text-amber mt-1">{car.price}</div>
          </div>
          <hr className="border-subtle" />

          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Request Agent Callback</h4>
              <p className="text-dim-11 text-neutral-400 mt-1">Submit your phone and our sales team will contact you directly within 2 hours.</p>
            </div>
            
            {leadSuccess ? (
              <div className="bg-semi-trans border border-emerald-500/20 rounded-lg p-4 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>Request submitted successfully. An agent will call you.</span>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-dim-10 font-bold text-neutral-400 uppercase">Your Name</label>
                  <input 
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="Abebe Kebede"
                    className="form-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-dim-10 font-bold text-neutral-400 uppercase">Phone Number</label>
                  <input 
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+251 911..."
                    className="form-input text-xs"
                  />
                </div>

                {leadError && (
                  <div className="text-xs text-red-400 font-medium">⚠️ {leadError}</div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-amber disabled:bg-neutral-800 text-black text-xs font-bold uppercase rounded font-display tracking-widest transition-all"
                >
                  {loading ? 'Submitting...' : 'Submit Callback Request'}
                </button>
              </form>
            )}

            <hr className="border-subtle" />
            <a 
              href="tel:+251911000000"
              className="w-full py-3 bg-semi-trans hover:bg-medium-trans border border-medium text-neutral-300 hover:text-white rounded font-display text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call Agent Directly
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
