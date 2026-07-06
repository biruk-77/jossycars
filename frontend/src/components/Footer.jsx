import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer({ t }) {
  return (
    <footer className="bg-header border-t border-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md-grid-cols-3 gap-8 text-left">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-logo font-display font-extrabold text-black text-base shadow">
              J
            </div>
            <span className="font-display font-black tracking-widest text-sm text-white">JOSSY REAL CARS</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
            Ethiopia's premier hub for ultra-premium imported vehicles. We combine transparent pricing with verified specifications.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <h4 className="font-display font-bold uppercase tracking-wider text-white">Location & Showroom</h4>
          <div className="flex items-center gap-2 text-neutral-400">
            <MapPin className="w-4 h-4 text-amber shrink-0" />
            <span>Bole Medhanialem, Century Mall 2nd Floor, Addis Ababa, Ethiopia</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <Mail className="w-4 h-4 text-amber shrink-0" />
            <span>contact@jossyrealcars.com</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <h4 className="font-display font-bold uppercase tracking-wider text-white">Contact & Support</h4>
          <div className="flex items-center gap-2 text-amber font-semibold">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{t('footer-call')}: +251 911 000 000</span>
          </div>
          <div className="flex gap-4 mt-2">
            <a href="https://t.me/jossycarmar" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-semi-trans hover:bg-amber hover:text-black flex items-center justify-center text-neutral-400 transition-all">
              <i className="fa-brands fa-telegram"></i>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-semi-trans hover:bg-amber hover:text-black flex items-center justify-center text-neutral-400 transition-all">
              <i className="fa-brands fa-tiktok"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-semi-trans hover:bg-amber hover:text-black flex items-center justify-center text-neutral-400 transition-all">
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-subtle px-6 py-6 text-center text-dim-11 text-neutral-500 tracking-wider">
        {t('footer-copy')}
      </div>
    </footer>
  );
}
