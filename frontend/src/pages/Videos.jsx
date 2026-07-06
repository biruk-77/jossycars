import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function Videos({ t }) {
  const [tiktoks, setTiktoks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tiktok')
      .then(res => res.json())
      .then(data => {
        setTiktoks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex-1 section-container flex flex-col gap-6 animate-fade-in text-left">
      <div>
        <span className="text-dim-10 font-bold text-amber-500 tracking-widest uppercase">{t('vids-heading-sub')}</span>
        <h2 className="text-3xl font-display font-extrabold mt-1">{t('vids-heading-title')}</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <span className="text-sm">Loading Review Videos...</span>
        </div>
      ) : tiktoks.length === 0 ? (
        <div className="text-center py-20 border border-subtle rounded-xl bg-deep-black">
          <span className="text-neutral-500 text-sm">No reviews added yet.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-6">
          {tiktoks.map((id, index) => (
            <div key={id} className="relative aspect-video bg-card border border-subtle rounded-xl overflow-hidden flex flex-col shadow">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${id}`}
                className="w-full h-full border-none"
                allowFullScreen
                title={`TikTok review ${index + 1}`}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
