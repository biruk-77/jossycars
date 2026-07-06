import React, { useEffect, useRef, useState } from 'react';

const ENV_MAPS = [
  { name: 'Studio Black', path: '/ferndale_studio_04_4k_1k.hdr' },
  { name: 'Warm Studio', path: '/brown_photostudio_02_1k.hdr' },
  { name: 'Outdoor Studio', path: '/car2_1k.hdr' }
];

const COLORS = [
  { hex: '#f5c400', exposure: '1.25', name: 'Imperial Gold' },
  { hex: '#e85d04', exposure: '1.3', name: 'Sunset Orange' },
  { hex: '#0d0d0d', exposure: '1.6', name: 'Obsidian Black' },
  { hex: '#f0f0f0', exposure: '1.1', name: 'Polar White' },
  { hex: '#b22222', exposure: '1.3', name: 'Crimson Red' },
  { hex: '#1a4a8a', exposure: '1.3', name: 'Royal Blue' },
  { hex: '#2d6a2d', exposure: '1.3', name: 'Emerald Green' },
  { hex: '#c0c0c0', exposure: '1.2', name: 'Sterling Silver' }
];

const CINE_SHOTS = [
  { id: 'reveal', name: 'Cinematic Reveal', icon: 'fa-expand' },
  { id: 'drop', name: 'Gravity Drop', icon: 'fa-cloud-arrow-down' },
  { id: 'orbit', name: 'Continuous Orbit', icon: 'fa-rotate' },
  { id: 'lowsweep', name: 'Chassis Sweep', icon: 'fa-arrow-trend-up' },
  { id: 'driveby', name: 'High-Speed Pass', icon: 'fa-car-side' },
  { id: 'interior', name: 'Cockpit View', icon: 'fa-couch' },
  { id: 'wheel', name: 'Alloy Focus', icon: 'fa-circle-notch' }
];

export default function Showroom3D() {
  const modelViewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Custom paint configuration
  const [activeColor, setActiveColor] = useState('#f5c400');
  const [activeExposure, setActiveExposure] = useState('1.25');
  const [roughness, setRoughness] = useState(0.4);
  const [metalness, setMetalness] = useState(0.9);
  
  // Controls panels toggle
  const [activePanel, setActivePanel] = useState(null); // 'paint' | 'shots' | 'drone' | 'env'
  const [activeShot, setActiveShot] = useState('none');
  
  // Camera & Viewer states
  const [envMap, setEnvMap] = useState('/ferndale_studio_04_4k_1k.hdr');
  const [shadowIntensity, setShadowIntensity] = useState(3.0);
  const [shadowSoftness, setShadowSoftness] = useState(0.5);
  const [panY, setPanY] = useState(0.08);
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);

  // GSAP Cine refs
  const cineTimelineRef = useRef(null);
  const cycleTimerRef = useRef(null);

  const activeColorRef = useRef(activeColor);
  const activeExposureRef = useRef(activeExposure);
  const roughnessRef = useRef(roughness);
  const metalnessRef = useRef(metalness);

  useEffect(() => {
    activeColorRef.current = activeColor;
    activeExposureRef.current = activeExposure;
    roughnessRef.current = roughness;
    metalnessRef.current = metalness;
  }, [activeColor, activeExposure, roughness, metalness]);

  // Apply colors & materials directly into Model-Viewer three.js internals
  const applyMaterialProperties = (hex, exp, rough, metal) => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    if (mv.model) {
      const SKIP = ['glass','window','wind','windshield','tire','tyre','rubber','tread',
        'wheel','rim','brake','disc','caliper','interior','seat','dashboard',
        'leather','carpet','chrome','exhaust','underbody','floor','plate'];

      const r = parseInt(hex.slice(1,3), 16) / 255;
      const g = parseInt(hex.slice(3,5), 16) / 255;
      const b = parseInt(hex.slice(5,7), 16) / 255;

      mv.model.materials.forEach(mat => {
        const name = (mat.name || '').toLowerCase();
        if (SKIP.some(s => name.includes(s))) return;
        const pbr = mat.pbrMetallicRoughness;
        if (pbr.roughnessFactor > 0.85 && pbr.baseColorFactor?.[0] < 0.08) return;
        
        // Base paint color
        pbr.setBaseColorFactor([r, g, b, 1]);
        
        // Dynamic custom properties
        if (rough !== undefined) pbr.setRoughnessFactor(rough);
        if (metal !== undefined) pbr.setMetallicFactor(metal);
      });
    }

    if (exp !== undefined) {
      mv.setAttribute('exposure', exp);
    }
  };

  // Run Entrance transition using GSAP
  const runEntranceTransition = () => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    const gsap = window.gsap;
    if (!gsap) return;

    const isMobile = window.innerWidth <= 1024;
    const params = {
      theta: -180,
      phi: 88,
      radius: 18,
      fov: 7,
      tx: 0,
      ty: 0.08,
      tz: 0
    };

    const applyModelSettings = () => {
      mv.cameraOrbit = `${params.theta}deg ${params.phi}deg ${params.radius}%`;
      mv.cameraTarget = `${params.tx}m ${params.ty}m ${params.tz}m`;
      mv.setAttribute('field-of-view', `${params.fov}deg`);
    };

    applyModelSettings();

    const tl = gsap.timeline({
      defaults: { ease: 'power4.inOut' },
      onUpdate: applyModelSettings
    });

    tl.to(params, {
      theta: 35,
      radius: 12,
      fov: 6,
      phi: 76,
      duration: 1.3,
      ease: 'power3.inOut'
    }, 0.2);

    tl.to(params, {
      theta: 378,
      radius: 50,
      fov: 18,
      phi: 70,
      duration: 1.2,
      ease: 'power2.inOut'
    }, 1.4);

    const targetFov = isMobile ? 45 : 32;
    tl.to(params, {
      theta: 378,
      phi: 72,
      radius: 105,
      fov: targetFov,
      tx: -0.25,
      duration: 1.8,
      ease: 'power3.out'
    }, 2.5);
  };

  const handleSwatchClick = (color) => {
    setActiveColor(color.hex);
    setActiveExposure(color.exposure);
    applyMaterialProperties(color.hex, color.exposure, roughness, metalness);
    setIsAutoOrbit(true);
  };

  const stopCine = () => {
    if (cineTimelineRef.current) {
      cineTimelineRef.current.kill();
      cineTimelineRef.current = null;
    }
    setActiveShot('none');
  };

  const playCine = (shotName) => {
    stopCine();
    setActiveShot(shotName);
    setIsAutoOrbit(false);

    const mv = modelViewerRef.current;
    if (!mv) return;

    const gsap = window.gsap;
    if (!gsap) return;

    const c = { theta: 30, phi: 75, radius: 100, py: 0.08 };
    const push = () => {
      mv.cameraOrbit = `${c.theta}deg ${c.phi}deg ${c.radius}%`;
      mv.cameraTarget = `0m ${c.py}m 0m`;
    };

    const tl = gsap.timeline({
      onUpdate: push,
      onComplete: () => {
        setActiveShot('none');
        setIsAutoOrbit(true);
      }
    });
    cineTimelineRef.current = tl;

    switch (shotName) {
      case 'reveal':
        Object.assign(c, { theta: 5, phi: 82, radius: 5, py: 0.05 });
        push();
        tl.to(c, { radius: 22, phi: 80, duration: 2, ease: 'power1.out' })
          .to(c, { radius: 115, theta: 28, phi: 72, py: 0.35, duration: 4.5, ease: 'power4.out' });
        break;
      case 'drop':
        Object.assign(c, { theta: 22, phi: 2, radius: 135, py: 0 });
        push();
        tl.to(c, { phi: 18, radius: 120, duration: 0.9, ease: 'power3.in' })
          .to(c, { phi: 74, radius: 92, theta: 30, py: 0.25, duration: 2.8, ease: 'power2.inOut' })
          .to(c, { radius: 100, duration: 0.7, ease: 'back.out(1.4)' });
        break;
      case 'orbit':
        Object.assign(c, { theta: 0, phi: 77, radius: 90, py: 0.22 });
        push();
        tl.to(c, { theta: 360, duration: 10, ease: 'none', repeat: -1 });
        break;
      case 'lowsweep':
        Object.assign(c, { theta: -60, phi: 86, radius: 45, py: -0.08 });
        push();
        tl.to(c, { theta: 0, phi: 85, radius: 50, duration: 2.2, ease: 'power2.in' })
          .to(c, { theta: 145, phi: 74, radius: 88, py: 0.3, duration: 4.8, ease: 'power2.inOut' });
        break;
      case 'driveby':
        Object.assign(c, { theta: -88, phi: 86, radius: 102, py: 0.12 });
        push();
        tl.to(c, { theta: -12, radius: 66, duration: 1.4, ease: 'power3.in' })
          .to(c, { theta: 18, duration: 0.5, ease: 'linear' })
          .to(c, { theta: 90, radius: 102, phi: 84, duration: 2.2, ease: 'power3.out' });
        break;
      case 'interior':
        Object.assign(c, { theta: 14, phi: 72, radius: 114, py: 0.28 });
        push();
        tl.to(c, { theta: -89, phi: 65, radius: 15, py: 1.0, duration: 3.0, ease: 'power3.in' })
          .to(c, { radius: 8, phi: 63, py: 1.2, duration: 1.5, ease: 'power2.in' })
          .call(() => {
            mv.cameraOrbit = '-89.1deg 62.6deg 1.184m';
            mv.cameraTarget = '0m 1.2m 0m';
          });
        break;
      case 'wheel':
        mv.cameraOrbit = '-633.8deg 86.9deg 2.663m';
        mv.cameraTarget = '-0.903m 0.25m 1.687m';
        Object.assign(c, { theta: 86, phi: 87, radius: 18, py: 0.25 });
        tl.to(c, { theta: 160, phi: 84, radius: 16, py: 0.1, duration: 3.2, ease: 'power1.inOut', delay: 0.5 })
          .to(c, { theta: 30, phi: 73, radius: 104, py: 0.3, duration: 2.5, ease: 'power4.out' });
        break;
      default:
        break;
    }
  };

  const handleCineClick = (shotName) => {
    playCine(shotName);
  };

  const rotateCamera = (d) => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    const o = mv.getCameraOrbit();
    mv.cameraOrbit = `${(o.theta * 180 / Math.PI) + d}deg auto auto`;
    setIsAutoOrbit(false);
  };

  const panCamera = (dy) => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    const nextPanY = Math.max(-1.5, Math.min(1.5, panY + dy));
    setPanY(nextPanY);
    mv.cameraTarget = `0m ${nextPanY}m 0m`;
    setIsAutoOrbit(false);
  };

  const resetCamera = () => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    setPanY(0.08);
    mv.cameraOrbit = '18deg 72deg 105%';
    mv.cameraTarget = '-0.25m 0.08m 0m';
    setIsAutoOrbit(true);
    stopCine();
  };

  // Handlers for paint configurations
  const handleRoughnessChange = (val) => {
    setRoughness(val);
    applyMaterialProperties(activeColor, activeExposure, val, metalness);
  };

  const handleMetalnessChange = (val) => {
    setMetalness(val);
    applyMaterialProperties(activeColor, activeExposure, roughness, val);
  };

  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    let dismissed = false;
    const onProgress = (e) => {
      const pct = Math.round(e.detail.totalProgress * 100);
      setLoadingProgress(pct);
      if (pct >= 100 && !dismissed) {
        dismissed = true;
        setTimeout(() => {
          setLoading(false);
          runEntranceTransition();
          applyMaterialProperties(activeColorRef.current, activeExposureRef.current, roughnessRef.current, metalnessRef.current);
        }, 600);
      }
    };

    const onLoad = () => {
      applyMaterialProperties(activeColorRef.current, activeExposureRef.current, roughnessRef.current, metalnessRef.current);
    };

    const handleUserInteraction = () => {
      setIsAutoOrbit(false);
      stopCine();
    };

    mv.addEventListener('progress', onProgress);
    mv.addEventListener('load', onLoad);
    mv.addEventListener('user-interaction', handleUserInteraction);

    return () => {
      mv.removeEventListener('progress', onProgress);
      mv.removeEventListener('load', onLoad);
      mv.removeEventListener('user-interaction', handleUserInteraction);
      stopCine();
      if (cineTimelineRef.current) {
        cineTimelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div className="hero-viewer relative w-full h-full" id="car-viewer-wrap">
      {loading && (
        <div className="loader">
          <div className="loader-ring"></div>
          <p className="loader-brand">JOSSY REAL CARS</p>
          <p className="loader-text">Loading Ultra-Quality 3D Asset<span className="loader-dots">...</span></p>
          <div className="loader-track">
            <div className="loader-fill" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <p className="loader-pct">{loadingProgress}%</p>
        </div>
      )}

      {/* Model Viewer Component */}
      <model-viewer
        ref={modelViewerRef}
        id="car-model-viewer"
        src="/car.glb"
        alt="Jossy Real Cars - 3D Interactive Showroom"
        auto-rotate={isAutoOrbit && !loading ? 'true' : undefined}
        auto-rotate-delay="2000"
        rotation-per-second="2.7deg"
        camera-controls="true"
        shadow-intensity={shadowIntensity.toString()}
        shadow-softness={shadowSoftness.toString()}
        environment-image={envMap}
        skybox-height="1.5m"
        tone-mapping="aces"
        exposure={activeExposure}
        field-of-view="32deg"
        min-field-of-view="20deg"
        max-field-of-view="72deg"
        min-camera-orbit="auto 0deg 5%"
        max-camera-orbit="auto 88deg 200%"
        camera-orbit="18deg 72deg 105%"
        camera-target={`-0.25m ${panY}m 0m`}
        interaction-prompt-threshold="500"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', '--poster-color': '#FAF8F5' }}
      />

      {/* 🛠️ ADVANCED DOCK CONTROLS PANEL */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-3">
        {/* Paint Swatches Menu */}
        <div className={`relative ${activePanel === 'paint' ? 'open' : ''}`}>
          <button 
            onClick={() => setActivePanel(activePanel === 'paint' ? null : 'paint')}
            className="ctrl-btn flex items-center gap-2"
          >
            <span className="paint-dot" style={{ background: activeColor }}></span>
            Custom Paint
          </button>
          
          {activePanel === 'paint' && (
            <div className="absolute bottom-12 left-0 bg-white border border-subtle rounded-xl p-4 min-w-[280px] shadow-2xl flex flex-col gap-4 animate-fade-in text-left">
              <span className="text-dim-10 font-bold text-neutral-400 uppercase tracking-widest block">Palette Options</span>
              <div className="paint-grid">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`swatch ${activeColor === color.hex ? 'active' : ''}`}
                    onClick={() => handleSwatchClick(color)}
                    style={{ background: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <hr className="border-subtle" />
              <span className="text-dim-10 font-bold text-neutral-400 uppercase tracking-widest block">Material Specularity</span>
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                  <span>ROUGHNESS</span>
                  <span>{roughness.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.05" max="0.95" step="0.05" 
                  value={roughness} 
                  onChange={(e) => handleRoughnessChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-semi-trans h-1 rounded"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                  <span>METALLIC</span>
                  <span>{metalness.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.05" max="1" step="0.05" 
                  value={metalness} 
                  onChange={(e) => handleMetalnessChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-semi-trans h-1 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cine Camera Shots Dropdown */}
        <div className={`relative ${activePanel === 'shots' ? 'open' : ''}`}>
          <button 
            onClick={() => setActivePanel(activePanel === 'shots' ? null : 'shots')}
            className="ctrl-btn"
          >
            <i className="fa-solid fa-film"></i> Cinematic Shots
          </button>
          
          {activePanel === 'shots' && (
            <div className="absolute bottom-12 left-0 bg-white border border-subtle rounded-xl p-3 min-w-[230px] shadow-2xl flex flex-col gap-1.5 animate-fade-in text-left">
              <span className="text-dim-10 font-bold text-neutral-400 uppercase tracking-widest block px-2.5 py-1">Cinematic Presets</span>
              {CINE_SHOTS.map((shot) => (
                <button 
                  key={shot.id}
                  className={`shot-item ${activeShot === shot.id ? 'playing' : ''}`}
                  onClick={() => { handleCineClick(shot.id); setActivePanel(null); }}
                >
                  <i className={`fa-solid ${shot.icon}`}></i> {shot.name}
                </button>
              ))}
              <hr className="shots-sep" />
              <button 
                className="shot-item shot-stop" 
                onClick={() => { resetCamera(); setActivePanel(null); }}
              >
                <i className="fa-solid fa-stop"></i> Reset View
              </button>
            </div>
          )}
        </div>

        {/* Lighting & Environment Map */}
        <div className={`relative ${activePanel === 'env' ? 'open' : ''}`}>
          <button 
            onClick={() => setActivePanel(activePanel === 'env' ? null : 'env')}
            className="ctrl-btn"
          >
            <i className="fa-solid fa-sun"></i> Studio Lighting
          </button>
          
          {activePanel === 'env' && (
            <div className="absolute bottom-12 left-0 bg-white border border-subtle rounded-xl p-4 min-w-[250px] shadow-2xl flex flex-col gap-3 animate-fade-in text-left">
              <span className="text-dim-10 font-bold text-neutral-400 uppercase tracking-widest block">Environment Profile</span>
              <div className="flex flex-col gap-1.5">
                {ENV_MAPS.map((e) => (
                  <button
                    key={e.name}
                    onClick={() => setEnvMap(e.path)}
                    className={`py-2 px-3 rounded text-xs font-bold uppercase transition-all text-left flex items-center justify-between ${
                      envMap === e.path 
                        ? 'bg-amber text-black' 
                        : 'bg-semi-trans hover:bg-medium-trans text-neutral-300'
                    }`}
                  >
                    <span>{e.name}</span>
                    {envMap === e.path && <i className="fa-solid fa-check"></i>}
                  </button>
                ))}
              </div>

              <hr className="border-subtle" />

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                  <span>SHADOW BLUR</span>
                  <span>{shadowSoftness}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={shadowSoftness} 
                  onChange={(e) => setShadowSoftness(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-semi-trans h-1 rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎮 D-PAD CAMERA CONTROLS (FLOAT RIGHT) */}
      <div className="cam-dpad">
        <button className="cam-btn" onClick={() => panCamera(+0.12)} title="Pan Up">
          <i className="fa-solid fa-chevron-up"></i>
        </button>
        <div className="cam-row">
          <button className="cam-btn" onClick={() => rotateCamera(-15)} title="Rotate Left">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button className="cam-btn cam-reset" onClick={resetCamera} title="Reset Camera">
            <i className="fa-solid fa-camera-rotate"></i>
          </button>
          <button className="cam-btn" onClick={() => rotateCamera(+15)} title="Rotate Right">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <button className="cam-btn" onClick={() => panCamera(-0.12)} title="Pan Down">
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      </div>
    </div>
  );
}
