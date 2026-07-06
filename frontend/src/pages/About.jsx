import React from 'react';

export default function About({ t }) {
  return (
    <main className="flex-1 section-container flex flex-col gap-12 animate-fade-in text-left">
      <div className="max-w-3xl flex flex-col gap-4">
        <span className="text-dim-10 font-bold text-amber-500 tracking-widest uppercase">{t('about-heading-sub')}</span>
        <h2 className="text-3xl sm-text-4xl font-display font-extrabold">{t('about-heading-title')}</h2>
        <p className="text-neutral-300 text-base leading-relaxed">
          {t('about-body-text')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-8">
        <div className="bg-panel border border-subtle rounded-xl p-6 flex flex-col gap-2">
          <div className="text-3xl font-bold font-display text-amber-500">800+</div>
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{t('about-stat-sold')}</div>
          <p className="text-dim-10 text-neutral-500 mt-2">Delivered to satisfied buyers nationwide across Ethiopia.</p>
        </div>
        <div className="bg-panel border border-subtle rounded-xl p-6 flex flex-col gap-2">
          <div className="text-3xl font-bold font-display text-white">100%</div>
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{t('about-stat-clients')}</div>
          <p className="text-dim-10 text-neutral-500 mt-2">Excellent feedback rating and professional agent support.</p>
        </div>
        <div className="bg-panel border border-subtle rounded-xl p-6 flex flex-col gap-2">
          <div className="text-3xl font-bold font-display text-white">12+ Yrs</div>
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{t('about-stat-years')}</div>
          <p className="text-dim-10 text-neutral-500 mt-2">Deep market understanding of imports and custom clearing processes.</p>
        </div>
        <div className="bg-panel border border-subtle rounded-xl p-6 flex flex-col gap-2">
          <div className="text-3xl font-bold font-display text-amber-500">Verified</div>
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{t('about-stat-verified')}</div>
          <p className="text-dim-10 text-neutral-500 mt-2">Every listing undergoes diagnostic verification before post.</p>
        </div>
      </div>
    </main>
  );
}
