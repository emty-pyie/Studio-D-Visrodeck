// src/pages/labs/WorkspaceSetup.jsx — Electron edition
// Uses native OS folder picker via IPC. No HTTP, no streaming.

import { useState } from "react";

export default function WorkspaceSetup({ onSelect, onBrowse }) {
  const [manualPath, setManualPath] = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const handleBrowse = async () => {
    setLoading(true);
    try {
      await onBrowse();
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const p = manualPath.trim();
    if (!p) { setError("Enter a directory path."); return; }
    setError("");
    onSelect(p);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ws-root">
        <div className="ws-card">
          <div className="ws-header">
            <div className="ws-brand">
              <span className="ws-logo">VISRODECK</span>
              <span className="ws-sep">/</span>
              <span className="ws-sub">STUDIO</span>
            </div>
            <span className="ws-badge">DESKTOP</span>
          </div>

          <div className="ws-body">
            <h1 className="ws-title">Open Workspace</h1>
            <p className="ws-desc">Select a local project directory to open in Studio.</p>

            <div className="ws-row">
              <div className="ws-input-wrap">
                <span className="ws-input-icon">⌂</span>
                <input className="ws-input" type="text"
                  placeholder="/path/to/your/project"
                  value={manualPath}
                  onChange={e=>setManualPath(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleOpen()}
                />
              </div>
              <button className="ws-btn ws-btn-browse" onClick={handleBrowse} disabled={loading}>
                {loading ? <span className="ws-spin"/> : "Browse"}
              </button>
            </div>

            {error && <div className="ws-error">{error}</div>}

            <div className="ws-actions">
              <button className="ws-btn ws-btn-open" onClick={handleOpen} disabled={!manualPath.trim()}>
                Open Workspace →
              </button>
            </div>

            <div className="ws-info">
              <span className="ws-info-dot"/>
              Native terminal · File explorer · Node graph map
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
.ws-root{min-height:100vh;background:#0a0a0b;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;padding:24px;-webkit-app-region:drag;}
.ws-card{width:100%;max-width:520px;background:#111113;border:1px solid #2a2a2e;border-radius:6px;overflow:hidden;-webkit-app-region:no-drag;}
.ws-header{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #1e1e22;}
.ws-brand{display:flex;align-items:baseline;gap:7px;}
.ws-logo{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.2em;color:#fff;}
.ws-sep{color:#333;font-size:13px;}
.ws-sub{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.15em;color:#444;}
.ws-badge{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.15em;color:#3ddc84;border:1px solid rgba(61,220,132,.2);padding:3px 8px;border-radius:20px;}
.ws-body{padding:28px 22px 24px;}
.ws-title{font-size:22px;font-weight:700;letter-spacing:-.03em;color:#fff;margin-bottom:8px;}
.ws-desc{font-size:12px;color:#555;margin-bottom:22px;line-height:1.6;}
.ws-row{display:flex;gap:8px;margin-bottom:10px;}
.ws-input-wrap{flex:1;position:relative;display:flex;align-items:center;}
.ws-input-icon{position:absolute;left:10px;font-size:12px;color:#333;pointer-events:none;}
.ws-input{width:100%;background:#0a0a0b;border:1px solid #2a2a2e;color:#e2e2e2;font-family:'JetBrains Mono',monospace;font-size:11px;padding:9px 10px 9px 28px;border-radius:3px;outline:none;transition:border-color .15s;}
.ws-input:focus{border-color:#444;}
.ws-input::placeholder{color:#333;}
.ws-error{font-family:'JetBrains Mono',monospace;font-size:10px;color:#e05c5c;padding:6px 10px;background:rgba(224,92,92,.06);border:1px solid rgba(224,92,92,.2);border-radius:2px;margin-bottom:10px;}
.ws-actions{margin-top:18px;display:flex;justify-content:flex-end;}
.ws-btn{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.08em;padding:8px 14px;border-radius:3px;cursor:pointer;border:1px solid;transition:all .12s;outline:none;display:flex;align-items:center;gap:5px;}
.ws-btn:disabled{opacity:.3;cursor:not-allowed;}
.ws-btn-browse{background:transparent;color:#666;border-color:#2a2a2e;}
.ws-btn-browse:hover:not(:disabled){color:#e2e2e2;border-color:#444;}
.ws-btn-open{background:#fff;color:#0a0a0b;border-color:#fff;font-size:12px;padding:10px 20px;}
.ws-btn-open:hover:not(:disabled){background:#d4d4d4;border-color:#d4d4d4;}
.ws-info{display:flex;align-items:center;gap:6px;margin-top:18px;font-family:'JetBrains Mono',monospace;font-size:9px;color:#2a2a2e;}
.ws-info-dot{width:4px;height:4px;border-radius:50%;background:#3ddc84;flex-shrink:0;}
.ws-spin{display:inline-block;width:9px;height:9px;border:1.5px solid #555;border-top-color:#e2e2e2;border-radius:50%;animation:wsspin .6s linear infinite;}
@keyframes wsspin{to{transform:rotate(360deg)}}
`;
