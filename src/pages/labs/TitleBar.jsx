// src/pages/labs/TitleBar.jsx
import { useState, useEffect } from "react";
const s = window.studio;

export default function TitleBar({ workspace, isRunning, onRun, onStop, runDisabled, onChangeWorkspace, onSettings, onJane }) {
  const [max, setMax] = useState(false);
  const proj = workspace ? workspace.split(/[\\/]/).pop() : null;
  useEffect(() => { s?.win.isMaximized().then(v => setMax(v)); }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="tb-root">
        <div className="tb-drag">
          <span className="tb-logo">VISRODECK</span>
          <span className="tb-sep">/</span>
          <span className="tb-sub">STUDIO</span>
          {proj && (
            <button className="tb-proj" onClick={onChangeWorkspace}>
              <span className="tb-proj-dot" />{proj}
            </button>
          )}
        </div>
        <div className="tb-center">
          <div className="tb-interp"><span className="tb-idot" />NODE.JS</div>
          <button className="tb-run" onClick={onRun} disabled={runDisabled}
            title={runDisabled ? "Select a runnable file (.js, .py, .ts, .sh)" : "Run file (Ctrl+Enter)"}>
            {isRunning ? <><span className="tb-spin" />RUNNING</> : <>▶ RUN</>}
          </button>
          <button className="tb-stop" onClick={onStop} disabled={!isRunning}>■ STOP</button>
          <button className="tb-jane" onClick={onJane}>✦ JANE</button>
          <button className="tb-settings" onClick={onSettings} title="Settings (Ctrl+,)">⚙</button>
        </div>
        <div className="tb-wc">
          <button className="tb-wb tb-min" onClick={() => s?.win.minimize()}>─</button>
          <button className="tb-wb tb-max" onClick={() => { s?.win.maximize(); setMax(m => !m); }}>
            {max ? "❐" : "□"}
          </button>
          <button className="tb-wb tb-cls" onClick={() => s?.win.close()}>✕</button>
        </div>
      </div>
    </>
  );
}

const CSS = `
.tb-root{height:38px;display:flex;align-items:center;background:#0d0d0f;border-bottom:1px solid #2a2a2e;flex-shrink:0;-webkit-app-region:drag;user-select:none;}
.tb-drag{display:flex;align-items:center;gap:7px;padding:0 14px;flex:1;-webkit-app-region:drag;}
.tb-logo{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.2em;color:#fff;}
.tb-sep{color:#222;font-size:14px;}
.tb-sub{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.18em;color:#333;}
.tb-proj{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#555;background:#161618;border:1px solid #2a2a2e;padding:2px 8px;border-radius:2px;cursor:pointer;transition:all .15s;outline:none;-webkit-app-region:no-drag;}
.tb-proj:hover{border-color:#444;color:#e2e2e2;}
.tb-proj-dot{width:4px;height:4px;border-radius:50%;background:#3ddc84;flex-shrink:0;box-shadow:0 0 4px #3ddc84;}
.tb-center{display:flex;align-items:center;gap:6px;padding:0 10px;-webkit-app-region:no-drag;}
.tb-interp{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:.1em;color:#333;background:#161618;border:1px solid #1e1e22;padding:2px 8px;border-radius:2px;}
.tb-idot{width:4px;height:4px;border-radius:50%;background:#68c142;}
.tb-run{display:flex;align-items:center;gap:4px;background:#fff;color:#0a0a0b;border:1px solid #fff;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.08em;padding:4px 12px;border-radius:2px;cursor:pointer;transition:all .12s;outline:none;}
.tb-run:hover:not(:disabled){background:#d4d4d4;border-color:#d4d4d4;}
.tb-run:disabled{opacity:.25;cursor:not-allowed;}
.tb-stop{background:transparent;color:#e05c5c;border:1px solid rgba(224,92,92,.3);font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.08em;padding:4px 10px;border-radius:2px;cursor:pointer;transition:all .12s;outline:none;}
.tb-stop:hover:not(:disabled){background:rgba(224,92,92,.1);}
.tb-stop:disabled{opacity:.25;cursor:not-allowed;}
.tb-jane{background:transparent;color:#b87fd4;border:1px solid rgba(184,127,212,.2);font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;padding:4px 10px;border-radius:2px;cursor:pointer;transition:all .12s;outline:none;}
.tb-jane:hover{background:rgba(184,127,212,.08);border-color:rgba(184,127,212,.4);}
.tb-settings{background:transparent;color:#444;border:none;font-size:13px;padding:4px 8px;cursor:pointer;transition:color .12s;outline:none;border-radius:2px;}
.tb-settings:hover{color:#888;background:#161618;}
.tb-spin{display:inline-block;width:7px;height:7px;border:1.5px solid #0a0a0b;border-top-color:transparent;border-radius:50%;animation:tbspin .55s linear infinite;}
@keyframes tbspin{to{transform:rotate(360deg)}}
.tb-wc{display:flex;align-items:center;padding-right:2px;-webkit-app-region:no-drag;}
.tb-wb{width:42px;height:38px;background:transparent;border:none;font-size:11px;cursor:pointer;transition:background .12s;outline:none;display:flex;align-items:center;justify-content:center;color:#444;font-family:'JetBrains Mono',monospace;}
.tb-wb:hover{color:#e2e2e2;}
.tb-min:hover,.tb-max:hover{background:#222226;}
.tb-cls:hover{background:#c42b1c;color:#fff;}
`;
