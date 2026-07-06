import { useState, useEffect, useMemo } from 'react';

export function useCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', transmission: '', fuel: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '' });
  const [compareList, setCompareList] = useState([]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cars?channel=jossycarmar');
      const data = await res.json();
      setCars(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCars(); }, []);

  const filtered = useMemo(() => {
    let r = cars;
    const { q, transmission, fuel, yearMin, yearMax, priceMin, priceMax } = filters;
    if (q) { const lq = q.toLowerCase(); r = r.filter(c => c.title.toLowerCase().includes(lq) || (c.details||'').toLowerCase().includes(lq)); }
    if (transmission) {
      r = r.filter(c => {
        const d = (c.details||'').toLowerCase();
        return transmission === 'automatic' ? /automatic|auto\b/.test(d) : /\bmanual\b/.test(d);
      });
    }
    if (fuel) {
      const fMap = { petrol: /petrol|benzene|gasoline/, diesel: /diesel/, electric: /electric|\bev\b/, hybrid: /hybrid/ };
      r = r.filter(c => fMap[fuel]?.test((c.details||'').toLowerCase()) ?? true);
    }
    if (yearMin || yearMax) {
      r = r.filter(c => {
        const m = (c.details||'').match(/\b(20\d{2}|19\d{2})\b/);
        const yr = m ? parseInt(m[1]) : 0;
        if (!yr) return true;
        if (yearMin && yr < +yearMin) return false;
        if (yearMax && yr > +yearMax) return false;
        return true;
      });
    }
    if (priceMin || priceMax) {
      r = r.filter(c => {
        const ps = (c.price||'').toLowerCase().replace(/,/g,'');
        const mm = ps.match(/([\d.]+)\s*(?:million|mill\b|mil\b)/);
        let val = mm ? parseFloat(mm[1])*1e6 : parseFloat(ps.match(/(\d+)/)?.[1]||0);
        if (val < 10000) val *= 1e6;
        if (!val) return true;
        if (priceMin && val < +priceMin*1e6) return false;
        if (priceMax && val > +priceMax*1e6) return false;
        return true;
      });
    }
    return r;
  }, [cars, filters]);

  const toggleCompare = (car) => {
    if (compareList.some(c => c.id === car.id)) {
      setCompareList(p => p.filter(c => c.id !== car.id));
    } else {
      if (compareList.length >= 3) return false;
      setCompareList(p => [...p, car]);
    }
    return true;
  };

  return { cars, filtered, loading, filters, setFilters, compareList, toggleCompare, refetch: fetchCars };
}
