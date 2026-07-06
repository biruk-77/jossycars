import React, { useState } from 'react';
import { Search, SlidersHorizontal, Scale, RefreshCw } from 'lucide-react';
import Showroom3D from '../Showroom3D';

export default function Home({ 
  cars, 
  filteredCars, 
  loadingCars, 
  filters, 
  setFilters, 
  compareList, 
  toggleCompare, 
  navigateTo, 
  lang, 
  t 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [load3D, setLoad3D] = useState(false);

  return (
    <main className="flex-1 flex flex-col animate-fade-in">
      {/* ══ HERO SECTION (3D Showroom + Brand Text) ══ */}
      <section id="home" className="hero">
        {load3D ? (
          <Showroom3D />
        ) : (
          <div 
            className="hero-viewer relative w-full h-full flex items-center justify-center bg-gradient-dark"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 75% 50%, rgba(217, 119, 6, 0.1) 0%, transparent 60%)'
            }}
          >
            <div className="absolute inset-0 bg-black/20 z-0"></div>
            <div 
              className="relative z-10 text-center flex flex-col items-center gap-5 p-8 rounded-2xl glass-panel max-w-sm border border-medium shadow-2xl mx-4"
              style={{
                marginLeft: typeof window !== 'undefined' && window.innerWidth > 1024 ? '35%' : '0'
              }}
            >
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-amber-dim border border-amber-subtle text-amber-500 animate-pulse">
                <i className="fa-solid fa-cube text-xl"></i>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-display font-bold text-white uppercase tracking-wider">3D Showroom</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Interact with the vehicles in high-fidelity 3D. Control paint swatches, material glossiness, lighting, and camera paths.
                </p>
              </div>
              <button 
                onClick={() => setLoad3D(true)}
                className="w-full py-3 bg-amber hover:bg-amber-600 text-black text-xs font-bold font-display uppercase tracking-widest rounded transition-all duration-300 shadow-md hover:scale-102"
              >
                Activate 3D Experience
              </button>
              <div className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
                Requires ~40MB download
              </div>
            </div>
          </div>
        )}

        <div className="hero-brand" id="hero-brand">
          <span className="hero-label">
            <span className="hero-dot"></span> {t('hero-premium-label')}
          </span>
          <h1 className="hero-title">
            {lang === 'am' ? (
              t('hero-title-main')
            ) : (
              <>
                Ethiopia's<br />
                Finest<br />
                <em>Dealership.</em>
              </>
            )}
          </h1>
          <p className="hero-sub">{t('hero-sub-text')}</p>
          <div className="hero-actions">
            <button 
              onClick={() => document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="hero-btn-primary"
            >
              {t('hero-btn-browse')}
            </button>
            <a href="https://t.me/jossycarmar" target="_blank" rel="noreferrer" className="hero-btn-ghost">
              {t('hero-btn-contact')}
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>500+</strong>
              <span>{t('hero-stat-sold')}</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat">
              <strong>5yr</strong>
              <span>{t('hero-stat-exp')}</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat">
              <strong>100%</strong>
              <span>{t('hero-stat-verified')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ INVENTORY SECTION ══ */}
      <section id="inventory-section" className="section-container">
        <div className="flex flex-col md-flex-row md-items-end justify-between gap-6 mb-8">
          <div className="text-left">
            <span className="text-dim-10 font-bold text-amber-500 tracking-widest uppercase">{t('inv-collection')}</span>
            <h2 className="text-3xl font-display font-extrabold mt-1">{t('inv-heading')}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md-w-auto">
            <div className="relative flex-1 md-flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder={t('search-placeholder')}
                className="form-input pl-10 pr-4 py-2-5 max-w-full md-w-64"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2-5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${
                showFilters ? 'bg-amber border-amber text-black' : 'bg-semi-trans border-medium hover:border-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> {t('fbar-toggle-text')}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-panel border border-subtle rounded-xl p-6 mb-8 grid grid-cols-1 sm-grid-cols-2 md-grid-cols-4 gap-6 animate-slide-up text-left">
            <div className="flex flex-col gap-2">
              <label className="text-dim-11 font-semibold text-neutral-400 uppercase">{t('fbar-trans-label')}</label>
              <select
                value={filters.transmission}
                onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
                className="form-input"
              >
                <option value="">{t('fbar-trans-all')}</option>
                <option value="automatic">{t('fbar-trans-auto')}</option>
                <option value="manual">{t('fbar-trans-manual')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-dim-11 font-semibold text-neutral-400 uppercase">{t('fbar-fuel-label')}</label>
              <select
                value={filters.fuel}
                onChange={(e) => setFilters({ ...filters, fuel: e.target.value })}
                className="form-input"
              >
                <option value="">{t('fbar-fuel-all')}</option>
                <option value="petrol">{t('fbar-fuel-petrol')}</option>
                <option value="diesel">{t('fbar-fuel-diesel')}</option>
                <option value="electric">{t('fbar-fuel-electric')}</option>
                <option value="hybrid">{t('fbar-fuel-hybrid')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-dim-11 font-semibold text-neutral-400 uppercase">{t('fbar-year-label')}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder={t('fbar-year-min')}
                  value={filters.yearMin}
                  onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })}
                  className="form-input py-2 px-3 text-xs"
                />
                <span className="text-neutral-500 text-xs">{t('fbar-year-sep')}</span>
                <input
                  type="number"
                  placeholder={t('fbar-year-max')}
                  value={filters.yearMax}
                  onChange={(e) => setFilters({ ...filters, yearMax: e.target.value })}
                  className="form-input py-2 px-3 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-dim-11 font-semibold text-neutral-400 uppercase">{t('fbar-price-label')}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder={t('fbar-price-min')}
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                  className="form-input py-2 px-3 text-xs"
                />
                <span className="text-neutral-500 text-xs">{t('fbar-year-sep')}</span>
                <input
                  type="number"
                  placeholder={t('fbar-price-max')}
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  className="form-input py-2 px-3 text-xs"
                />
              </div>
            </div>

            <div className="sm-col-span-2 md-col-span-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  q: '', transmission: '', fuel: '', yearMin: '', yearMax: '', priceMin: '', priceMax: ''
                })}
                className="px-4 py-2 bg-semi-trans border border-medium rounded-lg text-xs font-bold uppercase hover:bg-medium-trans transition-all"
              >
                {t('fbar-clear-text')}
              </button>
            </div>
          </div>
        )}

        {/* Cars Grid */}
        {loadingCars ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <span className="text-sm">Fetching catalog...</span>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 border border-subtle rounded-xl bg-deep-black">
            <div className="text-neutral-500 text-sm">No vehicles match your search options.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-8">
            {filteredCars.map((car) => {
              const photos = car.photos && car.photos.length > 0 
                ? car.photos 
                : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];
              const isCompared = compareList.some(item => item.id === car.id);
              return (
                <div 
                  key={car.id} 
                  onClick={() => navigateTo(`/car/${car.id}`)}
                  className="group bg-card border border-subtle rounded-xl overflow-hidden hover:border-amber-subtle transition-all duration-300 flex flex-col cursor-pointer text-left"
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-900">
                    <img 
                      src={photos[0]} 
                      alt={car.title}
                      className="w-full h-full object-cover group-hover-scale-105 transition-all duration-500"
                    />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(car);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-lg border backdrop-blur-md transition-all ${
                        isCompared 
                          ? 'bg-amber border-amber text-black scale-105 shadow-md' 
                          : 'bg-backdrop border-subtle text-neutral-300 hover:text-white'
                      }`}
                      title={isCompared ? 'Added to Compare' : 'Add to Compare'}
                    >
                      <Scale className="w-4 h-4" />
                    </button>

                    {photos.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-backdrop px-2-5 py-1 rounded text-dim-10 font-bold text-white tracking-widest">
                        {photos.length} PHOTOS
                      </span>
                    )}
                    <span className="absolute top-3 left-3 bg-amber text-black px-2-5 py-1 rounded text-dim-10 font-bold tracking-widest uppercase">
                      VERIFIED
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white transition-colors font-display line-clamp-1">
                          {car.title}
                        </h3>
                        <span className="text-base font-bold text-amber whitespace-nowrap shrink-0">{car.price}</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                        {car.details}
                      </p>
                    </div>
                    <button className="w-full py-2-5 border border-medium hover:border-amber hover:bg-amber hover:text-black transition-all rounded font-display text-xs uppercase font-bold tracking-wider">
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
