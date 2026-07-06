import React from 'react';
import { X, Scale } from 'lucide-react';

export default function CompareModal({ 
  isOpen, 
  onClose, 
  compareList, 
  navigateTo 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop px-4">
      <div className="w-full max-w-4xl bg-modal border border-medium rounded-2xl p-6 glass-panel relative animate-slide-up flex flex-col gap-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber" />
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">Side-By-Side Comparison</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-semi-trans text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <hr className="border-subtle" />

        <div className="grid grid-cols-3 gap-6 min-w-[700px]">
          {compareList.map((car) => {
            const photos = car.photos && car.photos.length > 0 
              ? car.photos 
              : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];
            return (
              <div key={car.id} className="bg-panel border border-subtle rounded-xl p-4 flex flex-col gap-4">
                <img 
                  src={photos[0]} 
                  alt={car.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <div className="text-center">
                  <h4 className="text-md font-bold font-display text-white line-clamp-1">{car.title}</h4>
                  <span className="text-sm font-bold text-amber block mt-1">{car.price}</span>
                </div>
                <hr className="border-subtle" />
                
                <div className="flex flex-col gap-2.5 text-xs text-left">
                  <div>
                    <span className="text-neutral-500 font-bold uppercase block text-[10px]">Transmission</span>
                    <span className="text-neutral-300 font-medium">
                      {/(?:automatic|auto)/i.test(car.details) ? 'Automatic' : 'Manual'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold uppercase block text-[10px]">Fuel Type</span>
                    <span className="text-neutral-300 font-medium">
                      {/(?:electric|ev)/i.test(car.details) ? 'Electric' : /(?:diesel)/i.test(car.details) ? 'Diesel' : 'Petrol / Benzene'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold uppercase block text-[10px]">Description</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed line-clamp-5 mt-1">
                      {car.details}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => { navigateTo(`/car/${car.id}`); onClose(); }}
                  className="w-full mt-2 py-2 bg-semi-trans hover:bg-amber hover:text-black border border-subtle transition-all rounded font-display text-xs uppercase font-bold"
                >
                  Inspect Car
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
