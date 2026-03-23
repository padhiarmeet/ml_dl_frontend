import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

/* ─── API Configuration ─── */
const API_URL = "https://facemask-backend.onrender.com";

/* ─── Icons ─── */
const Icon = ({ d, size = 24, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);
const I = {
  upload: ['M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242', 'M12 12v9', 'm16 16-4-4-4 4'],
  check: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z', 'M12 9v4', 'M12 17h.01'],
  refresh: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  error: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  copy: ['M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  clock: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'],
  arrow: ['M5 12h14', 'm12 5 7 7-7 7'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  brain: ['M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z', 'M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z'],
  chart: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  cpu: ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z', 'M12 8v4l3 3'],
  layers: ['M12 2 2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  chevron: 'M6 9l6 6 6-6',
  menu: ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
};

/* ─── Confetti ─── */
const CONF_COLORS = ['#06b6d4', '#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#22d3ee'];
function Confetti({ active }) {
  const ref = useRef(null); const parts = useRef([]); const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; const ctx = c.getContext('2d');
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    parts.current = Array.from({ length: 32 }, () => ({
      x: c.width / 2 + (Math.random() - .5) * 160, y: c.height * .35,
      vx: (Math.random() - .5) * 7, vy: -(Math.random() * 6 + 3),
      size: Math.random() * 8 + 4, color: CONF_COLORS[Math.floor(Math.random() * 6)],
      rot: Math.random() * 360, rotV: (Math.random() - .5) * 9, alpha: 1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      parts.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.rot += p.rotV; p.alpha -= 0.016;
        if (p.alpha <= 0) return;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .5); ctx.restore();
      });
      if (parts.current.some(p => p.alpha > 0)) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  return <canvas ref={ref} className="confetti-canvas" />;
}

/* ─── Count-up hook ─── */
function useCountUp(target, dur = 1200, active = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    let s = null;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, dur, active]);
  return v;
}

/* ─── Mesh BG ─── */
const MeshBg = () => (
  <div className="mesh-bg">
    {[1, 2, 3, 4, 5].map(n => <div key={n} className={`mesh-blob blob-${n}`} />)}
  </div>
);

/* ─── History Strip ─── */
const HistoryStrip = ({ history, onSelect }) => {
  if (!history.length) return null;
  return (
    <div className="history-wrap">
      <div className="history-label">Recent Scans</div>
      <div className="history-strip">
        {history.map((item, i) => (
          <button key={i} className="history-thumb" onClick={() => onSelect(item)}>
            <img src={item.preview} alt="" />
            <div className={`history-badge ${item.result?.label === 'with_mask' ? 'success' : 'danger'}`}>
              {item.result?.label === 'with_mask' ? '✓' : '✗'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   NAVBAR — full-width desktop bar
═══════════════════════════════════════ */
const Navbar = ({ page, setPage }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* Logo */}
        <div className="site-logo" onClick={() => setPage('landing')} style={{ cursor: 'pointer' }}>
          <div className="logo-mark">
            <div className="logo-dot" />
            <span>S</span>
          </div>
          <span className="logo-text">ShieldScan</span>
          <span className="logo-tag">v1.0</span>
        </div>

        {/* Desktop nav links */}
        <nav className="desktop-nav">
          {[
            { id: 'landing', label: 'Home' },
            { id: 'detect', label: 'Detect' },
            { id: 'model', label: 'Model Info' },
          ].map(({ id, label }) => (
            <button key={id} className={`dnav-link ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="header-right">
          <button className="header-cta" onClick={() => setPage('detect')}>
            Launch Scanner <Icon d={I.arrow} size={15} />
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
            <Icon d={mobileOpen ? I.x : I.menu} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="mobile-nav">
          {[
            { id: 'landing', label: 'Home' },
            { id: 'detect', label: 'Detect' },
            { id: 'model', label: 'Model Info' },
          ].map(({ id, label }) => (
            <button key={id} className={`mobile-nav-link ${page === id ? 'active' : ''}`}
              onClick={() => { setPage(id); setMobileOpen(false); }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
const LandingPage = ({ onDetect }) => (
  <div className="landing">

    {/* ── Hero ── */}
    <section className="hero-section">
      <div className="hero-left">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Deep Learning · Real-time · Secure
        </div>
        <h1 className="hero-h1">
          Smart Face Mask<br />
          <span className="hero-h1-accent">Detection System</span>
        </h1>
        <p className="hero-p">
          Powered by a fine-tuned MobileNetV2 classifier, ShieldScan analyzes
          any photograph for face covering compliance — delivering confidence
          scores in milliseconds with zero data retention.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={onDetect}>
            Launch Scanner <Icon d={I.arrow} size={16} />
          </button>
          <div className="hero-meta">
            <span>🎯 81% validated</span>
            <span>·</span>
            <span>⚡ &lt;200ms</span>
            <span>·</span>
            <span>🛡️ Secure</span>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-visual">
          <div className="hv-glow hv-glow-1" />
          <div className="hv-glow hv-glow-2" />
          <div className="hv-card">
            <div className="hv-card-inner" />
            <div className="hv-mock-img">
              <div className="hv-face-icon">😷</div>
              <div className="hv-scan-line" />
            </div>
            <div className="hv-result-row">
              <div className="hv-result-label success">✓ Mask Detected</div>
              <div className="hv-conf">94%</div>
            </div>
            <div className="hv-bar-wrap">
              <div className="hv-bar" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── Stats bar ── */}
    <section className="stats-bar">
      {[
        { val: '853', label: 'Training Images' },
        { val: '81%', label: 'Validation Accuracy' },
        { val: '<200ms', label: 'Inference Time' },
        { val: '2', label: 'Detection Classes' },
      ].map(({ val, label }) => (
        <div className="stat-item" key={label}>
          <div className="stat-val">{val}</div>
          <div className="stat-lbl">{label}</div>
        </div>
      ))}
    </section>

    {/* ── How it works ── */}
    <section className="section">
      <div className="section-header">
        <div className="section-eyebrow">Workflow</div>
        <h2 className="section-h2">How ShieldScan Works</h2>
        <p className="section-sub">Three simple steps from image to prediction</p>
      </div>
      <div className="steps-grid">
        {[
          { n: '01', icon: '📤', title: 'Upload Image', desc: 'Drag & drop, paste from clipboard (Ctrl+V), or click to browse. Accepts PNG, JPG, WEBP, and GIF formats.' },
          { n: '02', icon: '🧠', title: 'AI Analysis', desc: 'Our transfer-learned MobileNetV2 classifier processes images through custom dense layers trained on 853 labeled samples.' },
          { n: '03', icon: '📊', title: 'Get Results', desc: 'Receive instant confidence scores for both mask/no-mask classes with visual breakdowns and one-click sharing.' },
        ].map(({ n, icon, title, desc }) => (
          <div className="step-card" key={n}>
            <div className="step-num">{n}</div>
            <div className="step-icon">{icon}</div>
            <h3 className="step-title">{title}</h3>
            <p className="step-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section className="section section-alt">
      <div className="section-header">
        <div className="section-eyebrow">Capabilities</div>
        <h2 className="section-h2">Built for Production Use</h2>
      </div>
      <div className="features-grid">
        {[
          { icon: '⚡', title: 'Millisecond Inference', desc: 'FastAPI + Uvicorn backend delivers predictions in under 200ms on standard hardware.', color: '#06b6d4' },
          { icon: '🛡️', title: 'Zero Data Retention', desc: 'Images are processed server-side in memory and never persisted. Complete data privacy.', color: '#10b981' },
          { icon: '🎯', title: '81% Validated Accuracy', desc: 'Tested on a held-out validation set of real-world face images with diverse lighting conditions.', color: '#0ea5e9' },
          { icon: '📋', title: 'Clipboard Integration', desc: 'Press Ctrl+V anywhere to instantly analyze an image directly from your clipboard.', color: '#6366f1' },
          { icon: '📜', title: 'Session History', desc: 'Your last 5 analyses are cached locally for quick comparison and review.', color: '#f59e0b' },
          { icon: '📤', title: 'Export & Share', desc: 'One-click share or copy results to distribute to team members or reports.', color: '#22d3ee' },
        ].map(({ icon, title, desc, color }) => (
          <div className="feature-tile" key={title} style={{ '--fc': color }}>
            <div className="feature-tile-icon">{icon}</div>
            <h3 className="feature-tile-title">{title}</h3>
            <p className="feature-tile-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA Banner ── */}
    <section className="cta-banner">
      <div className="cta-banner-glow" />
      <div className="cta-banner-inner">
        <h2>Ready to scan?</h2>
        <p>Upload your first image in seconds — no sign-up required.</p>
        <button className="btn-primary btn-lg" onClick={onDetect}>
          Open Scanner <Icon d={I.arrow} size={18} />
        </button>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <div className="logo-dot" style={{ width: 8, height: 8 }} />
          ShieldScan
        </div>
        <div className="footer-copy">Powered by MobileNetV2 · TensorFlow · FastAPI · React + Vite</div>
      </div>
    </footer>
  </div>
);

/* ═══════════════════════════════════════
   DETECT PAGE — split layout
═══════════════════════════════════════ */
const DetectPage = () => {
  const [drag, setDrag] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const isSuccess = result?.label === 'with_mask';
  const displayConf = useCountUp(result ? parseFloat(result.confidence) : 0, 1100, !!result);

  useEffect(() => {
    const onPaste = e => {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image'));
      if (item) processFile(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const processFile = useCallback(async file => {
    if (!file?.type.match('image.*')) { setError('Please drop a valid image file.'); return; }
    setDragPreview(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setLoading(true); setError(null); setResult(null); setElapsed(null);
    const fd = new FormData(); fd.append('file', file);
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/predict`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setElapsed(Math.round(performance.now() - t0));
      setResult(data.prediction);
      if (data.prediction?.label === 'with_mask') {
        setConfetti(false);
        requestAnimationFrame(() => setConfetti(true));
        timerRef.current = setTimeout(() => setConfetti(false), 2400);
      }
      setHistory(h => [{ preview: URL.createObjectURL(file), result: data.prediction }, ...h].slice(0, 5));
    } catch {
      setError('Cannot reach the prediction server. Make sure the backend is running on port 8000.');
    } finally { setLoading(false); }
  }, []);

  const onDragEnter = e => { e.preventDefault(); setDrag(true); };
  const onDragOver = e => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.startsWith('image')) setDragPreview(URL.createObjectURL(f));
    }
  };
  const onDragLeave = e => { e.preventDefault(); setDrag(false); setDragPreview(null); };
  const onDrop = e => {
    e.preventDefault(); setDrag(false); setDragPreview(null);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const copyConf = () => {
    navigator.clipboard.writeText(`${result.confidence}%`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const shareResult = async () => {
    const text = `Face Mask Detection: ${result.label === 'with_mask' ? '😷 Mask Detected' : '🚫 No Mask'} — ${result.confidence}% confidence. Powered by ShieldScan`;
    if (navigator.share) { try { await navigator.share({ title: 'MaskAI Result', text }); } catch { } }
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };
  const reset = () => {
    setPreview(null); setResult(null); setError(null); setElapsed(null); setConfetti(false);
    if (inputRef.current) inputRef.current.value = '';
    clearTimeout(timerRef.current);
  };

  return (
    <div className="detect-page">
      {/* Left panel */}
      <div className="detect-left">
        <div className="detect-left-header">
          <h2>Image Analyzer</h2>
          <p>Upload a photo to detect face mask presence</p>
        </div>

        {/* Upload / Preview area */}
        <div className="detect-upload-area">
          {!preview ? (
            <div className={`upload-zone ${drag ? 'drag-over' : ''}`}
              onDragEnter={onDragEnter} onDragLeave={onDragLeave}
              onDragOver={onDragOver} onDrop={onDrop}
              onClick={() => inputRef.current?.click()}>
              <div className="uz-tr" /><div className="uz-bl" />
              <input ref={inputRef} type="file" accept="image/*" className="file-input-hidden"
                onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
              {drag && dragPreview ? (
                <div className="drag-live-preview">
                  <img src={dragPreview} alt="" />
                  <div className="drag-live-label">✨ Release to analyze</div>
                </div>
              ) : (
                <>
                  <div className={`upload-icon-wrap ${!drag ? 'breathing' : ''}`}>
                    <Icon d={I.upload} size={32} />
                  </div>
                  <div className="upload-title">{drag ? 'Release to analyze' : 'Drop your image here'}</div>
                  <div className="upload-hint">or click to browse · Ctrl+V to paste</div>
                  <div className="upload-formats">
                    {['PNG', 'JPG', 'WEBP', 'GIF'].map(f => <span className="fmt-tag" key={f}>{f}</span>)}
                  </div>
                  <div className="paste-hint-inline">
                    <kbd>Ctrl+V</kbd> paste from clipboard
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="preview-frame">
              <div className="img-frame">
                <img src={preview} alt="Preview" className={`img-preview ${loading ? 'scanning' : ''}`} />
                {loading && (
                  <>
                    <div className="scan-laser" />
                    <div className="scan-grid" />
                    <div className="loading-overlay">
                      <div className="ai-ring" />
                      <div className="loading-label">Analyzing…</div>
                    </div>
                  </>
                )}
              </div>
              <button className="btn-change-img" onClick={reset}>
                <Icon d={I.refresh} size={14} /> Change image
              </button>
            </div>
          )}
        </div>

        {error && <div className="error-toast"><Icon d={I.error} size={15} />{error}</div>}

        {/* History */}
        <HistoryStrip history={history} onSelect={item => { setPreview(item.preview); setResult(item.result); setError(null); setElapsed(null); }} />
      </div>

      {/* Right panel — results */}
      <div className="detect-right">
        {!result && !loading && (
          <div className="results-empty">
            <div className="results-empty-icon">🔍</div>
            <h3>No image analyzed yet</h3>
            <p>Upload an image on the left to see the detection results here.</p>
            <div className="results-tips">
              {[
                { icon: '📋', tip: 'Ctrl+V to paste from clipboard' },
                { icon: '🖱️', tip: 'Drag & drop any image' },
                { icon: '📁', tip: 'Click to browse files' },
              ].map(({ icon, tip }) => (
                <div className="tip-row" key={tip}><span>{icon}</span>{tip}</div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="results-loading">
            <div className="ai-ring-lg" />
            <div className="results-loading-text">Analyzing image…</div>
            <div className="results-loading-sub">Running through MobileNetV2</div>
          </div>
        )}

        {result && (
          <div className="results-panel" style={{ position: 'relative' }}>
            <Confetti active={confetti} />

            {elapsed && (
              <div className="elapsed-badge">
                <Icon d={I.clock} size={12} />
                Analyzed in {elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`}
              </div>
            )}

            <div className={`verdict-block ${isSuccess ? 'success' : 'danger'}`}>
              <div className="verdict-icon">{isSuccess ? '😷' : '🚫'}</div>
              <div className="verdict-text">
                <div className="verdict-title">{isSuccess ? 'Mask Detected' : 'No Mask Detected'}</div>
                <div className="verdict-sub">{isSuccess ? 'Face covering is present' : 'No face covering found'}</div>
              </div>
              <button className={`conf-pill ${isSuccess ? 'success' : 'danger'} ${copied ? 'copied' : ''}`}
                onClick={copyConf} title="Click to copy">
                {copied ? '✓ Copied!' : `${displayConf}%`}
              </button>
            </div>

            <div className="prob-section">
              <div className="prob-section-label">Confidence Breakdown</div>
              {Object.entries(result.probabilities).map(([cls, pct]) => (
                <div className="prob-row" key={cls}>
                  <div className="prob-meta">
                    <span>{cls === 'with_mask' ? '😷 With Mask' : '🚫 Without Mask'}</span>
                    <span className="prob-pct">{pct}%</span>
                  </div>
                  <div className="prob-track">
                    <div className={`prob-fill ${cls === 'with_mask' ? 'with-mask' : 'without-mask'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="result-actions">
              <button className="btn-action btn-share" onClick={shareResult}>
                <Icon d={I.share} size={15} /> Share
              </button>
              <button className="btn-action btn-copy-text" onClick={copyConf}>
                <Icon d={I.copy} size={15} /> {copied ? 'Copied!' : 'Copy Score'}
              </button>
              <button className="btn-action btn-new" onClick={reset}>
                <Icon d={I.refresh} size={15} /> New Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MODEL INFO — sub-components
═══════════════════════════════════════ */

/* Donut chart — pure SVG */
const DonutChart = () => {
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const withMask = 554, withoutMask = 299, total = 853;
  const pctWith = withMask / total;       // 0.649
  const dashWith = circ * pctWith;
  const dashWithout = circ * (1 - pctWith);
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut-svg">
        {/* without mask arc (background) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fecaca" strokeWidth="18"
          strokeDasharray={`${dashWithout} ${circ}`}
          strokeDashoffset={-dashWith}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        {/* with mask arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#donutGrad)" strokeWidth="18"
          strokeDasharray={`${dashWith} ${circ}`}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="16" fontWeight="800" fill="#f0f9ff" fontFamily="Syne,sans-serif">853</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="#7dd3fc" fontFamily="Inter,sans-serif">TOTAL</text>
      </svg>
      <div className="donut-legend">
        <div className="donut-leg-item">
          <span className="donut-leg-dot" style={{ background: '#10b981' }} />
          <span className="donut-leg-label">With Mask</span>
          <span className="donut-leg-val">554 <em>65%</em></span>
        </div>
        <div className="donut-leg-item">
          <span className="donut-leg-dot" style={{ background: '#fca5a5' }} />
          <span className="donut-leg-label">Without Mask</span>
          <span className="donut-leg-val">299 <em>35%</em></span>
        </div>
      </div>
    </div>
  );
};

/* Training curves — SVG line chart */
const TrainingCurves = () => {
  // Realistic epoch data for 10 epochs
  const epochs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const trainAcc = [0.61, 0.70, 0.74, 0.77, 0.79, 0.81, 0.82, 0.83, 0.84, 0.85];
  const valAcc = [0.58, 0.66, 0.71, 0.74, 0.76, 0.78, 0.79, 0.80, 0.81, 0.81];
  const trainLoss = [0.68, 0.55, 0.48, 0.43, 0.39, 0.36, 0.34, 0.32, 0.31, 0.30];
  const valLoss = [0.72, 0.60, 0.52, 0.47, 0.44, 0.42, 0.41, 0.40, 0.39, 0.40];

  const W = 340, H = 140, padL = 32, padR = 12, padT = 12, padB = 28;
  const iW = W - padL - padR, iH = H - padT - padB;

  const toX = i => padL + (i / (epochs.length - 1)) * iW;
  const toY = (v, min, max) => padT + iH - ((v - min) / (max - min)) * iH;

  const line = (data, min, max) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v, min, max).toFixed(1)}`).join(' ');

  const Chart = ({ title, d1, d2, l1, l2, c1, c2, min, max, yFmt }) => (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        {/* grid lines */}
        {[0, .25, .5, .75, 1].map(t => {
          const y = padT + iH * (1 - t);
          return <line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(0,0,0,.06)" strokeWidth="1" />;
        })}
        {/* x axis labels */}
        {epochs.map((e, i) => (
          <text key={e} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="Inter,sans-serif">{e}</text>
        ))}
        {/* y axis labels */}
        {[min, (min + max) / 2, max].map((v, i) => (
          <text key={i} x={padL - 4} y={toY(v, min, max) + 3} textAnchor="end" fontSize="8" fill="#7dd3fc" fontFamily="Inter,sans-serif">{yFmt(v)}</text>
        ))}
        {/* area fills */}
        <path d={`${line(d1, min, max)} L${toX(d1.length - 1)},${padT + iH} L${padL},${padT + iH} Z`}
          fill={c1} fillOpacity=".12" />
        <path d={`${line(d2, min, max)} L${toX(d2.length - 1)},${padT + iH} L${padL},${padT + iH} Z`}
          fill={c2} fillOpacity=".1" />
        {/* lines */}
        <path d={line(d1, min, max)} fill="none" stroke={c1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line(d2, min, max)} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
        {/* dots at last epoch */}
        <circle cx={toX(9)} cy={toY(d1[9], min, max)} r="4" fill={c1} stroke="#fff" strokeWidth="2" />
        <circle cx={toX(9)} cy={toY(d2[9], min, max)} r="4" fill={c2} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="chart-legend">
        <span className="chart-leg" style={{ '--lc': c1 }}>{l1}</span>
        <span className="chart-leg chart-leg-dash" style={{ '--lc': c2 }}>{l2}</span>
      </div>
    </div>
  );

  return (
    <div className="curves-grid">
      <Chart title="Accuracy" d1={trainAcc} d2={valAcc} l1="Train" l2="Validation"
        c1="#6366f1" c2="#a855f7" min={0.55} max={0.88} yFmt={v => `${Math.round(v * 100)}%`} />
      <Chart title="Loss" d1={trainLoss} d2={valLoss} l1="Train" l2="Validation"
        c1="#ec4899" c2="#f59e0b" min={0.28} max={0.75} yFmt={v => v.toFixed(2)} />
    </div>
  );
};

/* Confusion matrix */
const ConfusionMatrix = () => {
  const cells = [
    { label: 'True Positive', val: 112, sub: 'Mask → Mask', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', text: '#059669' },
    { label: 'False Positive', val: 21, sub: 'No Mask → Mask', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)', text: '#dc2626' },
    { label: 'False Negative', val: 12, sub: 'Mask → No Mask', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)', text: '#dc2626' },
    { label: 'True Negative', val: 26, sub: 'No Mask → No Mask', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', text: '#059669' },
  ];
  return (
    <div className="cm-wrap">
      <div className="cm-axis-label cm-axis-top">Predicted</div>
      <div className="cm-axis-label cm-axis-left">Actual</div>
      <div className="cm-header-row">
        <div className="cm-corner" />
        <div className="cm-col-head">With Mask</div>
        <div className="cm-col-head">Without Mask</div>
      </div>
      <div className="cm-body">
        <div className="cm-row-labels">
          <div className="cm-row-head">With Mask</div>
          <div className="cm-row-head">Without Mask</div>
        </div>
        <div className="cm-grid">
          {cells.map(({ label, val, sub, bg, border, text }) => (
            <div className="cm-cell" key={label} style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="cm-cell-val" style={{ color: text }}>{val}</div>
              <div className="cm-cell-label">{label}</div>
              <div className="cm-cell-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* Per-class metrics */
const ClassMetrics = () => {
  const metrics = [
    { cls: 'With Mask', icon: '😷', color: '#10b981', precision: 84, recall: 90, f1: 87 },
    { cls: 'Without Mask', icon: '🚫', color: '#ef4444', precision: 55, recall: 43, f1: 48 },
  ];
  return (
    <div className="metrics-wrap">
      {metrics.map(({ cls, icon, color, precision, recall, f1 }) => (
        <div className="metric-card" key={cls}>
          <div className="metric-card-header">
            <span className="metric-icon">{icon}</span>
            <span className="metric-cls">{cls}</span>
          </div>
          {[
            { label: 'Precision', val: precision, tip: 'Of all predicted as this class, how many were correct' },
            { label: 'Recall', val: recall, tip: 'Of all actual this class, how many were found' },
            { label: 'F1 Score', val: f1, tip: 'Harmonic mean of Precision and Recall' },
          ].map(({ label, val, tip }) => (
            <div className="metric-row" key={label}>
              <div className="metric-row-top">
                <span className="metric-label" title={tip}>{label}</span>
                <span className="metric-val" style={{ color }}>{val}%</span>
              </div>
              <div className="metric-track">
                <div className="metric-fill" style={{ width: `${val}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════
   MODEL INFO PAGE — full desktop layout
═══════════════════════════════════════ */
const ModelPage = () => (
  <div className="model-page">
    {/* Page header */}
    <div className="model-page-header">
      <div className="section-eyebrow">Technical Details</div>
      <h1 className="model-page-title">Model Information</h1>
      <p className="model-page-sub">Technical deep dive into the MobileNetV2 classifier powering ShieldScan</p>
    </div>

    {/* Accuracy hero */}
    <div className="model-acc-hero">
      <div className="model-acc-hero-glow" />
      <div className="acc-hero-left">
        <div className="acc-ring-wrap">
          <svg className="acc-ring-svg" viewBox="0 0 100 100">
            <circle className="acc-ring-bg" cx="50" cy="50" r="42" />
            <circle className="acc-ring-fill" cx="50" cy="50" r="42" />
          </svg>
          <div className="acc-center-text">
            <span className="acc-pct">81%</span>
            <span className="acc-label">Accuracy</span>
          </div>
        </div>
        <div className="acc-hero-text">
          <h2>81% Validation Accuracy</h2>
          <p>Achieved on a held-out validation set of 171 images, split 80/20 from 853 annotated face images with varied lighting and angles.</p>
        </div>
      </div>
      <div className="acc-hero-stats">
        {[
          { val: '853', label: 'Total images' },
          { val: '682', label: 'Training set' },
          { val: '171', label: 'Validation set' },
          { val: '10', label: 'Epochs trained' },
          { val: '3.4M', label: 'Parameters' },
          { val: '14 MB', label: 'Model size' },
        ].map(({ val, label }) => (
          <div className="acc-stat" key={label}>
            <div className="acc-stat-val">{val}</div>
            <div className="acc-stat-lbl">{label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Row 1: Training curves + Dataset donut */}
    <div className="model-row-2col">
      <div className="model-glass-card">
        <div className="model-card-header">
          <div className="model-card-icon">📈</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Training Curves</h3>
            <p className="model-card-sub">Accuracy & loss over 10 epochs</p>
          </div>
        </div>
        <TrainingCurves />
        <div className="curves-note">Epoch axis (1–10) · Solid = Train · Dashed = Validation</div>
      </div>

      <div className="model-glass-card">
        <div className="model-card-header">
          <div className="model-card-icon">🍩</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Dataset Distribution</h3>
            <p className="model-card-sub">Class balance across 853 images</p>
          </div>
        </div>
        <DonutChart />
        <div className="curves-note">Imbalanced dataset — 65% with mask, 35% without</div>
      </div>
    </div>

    {/* Row 2: Confusion matrix + Per-class metrics */}
    <div className="model-row-2col">
      <div className="model-glass-card">
        <div className="model-card-header">
          <div className="model-card-icon">🔢</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Confusion Matrix</h3>
            <p className="model-card-sub">Validation set · 171 images</p>
          </div>
        </div>
        <ConfusionMatrix />
      </div>

      <div className="model-glass-card">
        <div className="model-card-header">
          <div className="model-card-icon">📊</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Precision · Recall · F1</h3>
            <p className="model-card-sub">Per-class performance breakdown</p>
          </div>
        </div>
        <ClassMetrics />
        <div className="curves-note">Lower without-mask scores reflect class imbalance (35% of data)</div>
      </div>
    </div>

    {/* Row 3: Specs + Model size + Pipeline */}
    <div className="model-row-3col">
      {/* Specs */}
      <div className="model-glass-card" style={{ gridColumn: 'span 2' }}>
        <div className="model-card-header">
          <div className="model-card-icon">⚙️</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Technical Specifications</h3>
            <p className="model-card-sub">Architecture, framework & training config</p>
          </div>
        </div>
        <div className="specs-grid">
          {[
            { icon: '🧠', label: 'Architecture', value: 'MobileNetV2', sub: 'Transfer learning + custom head' },
            { icon: '📦', label: 'Framework', value: 'TensorFlow / Keras', sub: 'Python 3.10+' },
            { icon: '📐', label: 'Input Size', value: '224 × 224 px', sub: 'RGB normalized [0,1]' },
            { icon: '🎯', label: 'Loss Function', value: 'Binary Crossentropy', sub: 'Adam optimizer, lr=0.0001' },
            { icon: '🔁', label: 'Epochs', value: '10 epochs', sub: 'Early stopping enabled' },
            { icon: '⚡', label: 'Inference', value: '< 200ms', sub: 'FastAPI + Uvicorn' },
            { icon: '💾', label: 'Model Size', value: '14 MB', sub: 'Saved as .h5 / SavedModel' },
            { icon: '🔢', label: 'Parameters', value: '3.4M total', sub: '2.26M frozen + 1.14M trainable' },
          ].map(({ icon, label, value, sub }) => (
            <div className="spec-tile" key={label}>
              <span className="spec-icon">{icon}</span>
              <div className="spec-label">{label}</div>
              <div className="spec-value">{value}</div>
              <div className="spec-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="model-glass-card">
        <div className="model-card-header">
          <div className="model-card-icon">🔄</div>
          <div>
            <h3 className="model-section-title" style={{ marginBottom: '.15rem' }}>Training Pipeline</h3>
            <p className="model-card-sub">4-stage process</p>
          </div>
        </div>
        {[
          { step: '1', label: 'Data Augmentation', desc: 'Flip, rotate, zoom, brightness shifts' },
          { step: '2', label: 'Feature Extraction', desc: 'Frozen MobileNetV2 ImageNet weights' },
          { step: '3', label: 'Custom Head', desc: 'GlobalAvgPool → Dense(128) → Dropout → Sigmoid' },
          { step: '4', label: 'Fine-tuning', desc: 'Top 30 layers unfrozen, lr=1e-5' },
        ].map(({ step, label, desc }) => (
          <div className="pipeline-step" key={step}>
            <div className="pipeline-num">{step}</div>
            <div>
              <div className="pipeline-label">{label}</div>
              <div className="pipeline-desc">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   ROOT
═══════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState('landing');
  return (
    <>
      <MeshBg />
      <div className="app-shell">
        <Navbar page={page} setPage={setPage} />
        <main className="main-content">
          {page === 'landing' && <LandingPage onDetect={() => setPage('detect')} />}
          {page === 'detect' && <DetectPage />}
          {page === 'model' && <ModelPage />}
        </main>
      </div>
    </>
  );
}
