// src/pages/labs/TitleBar.jsx
// Custom frameless window titlebar — drag region + window controls + run button

import { useState, useEffect } from "react";

const api = window.studio;

export default function TitleBar({ workspace, isRunning, onRun, onStop, onChangeWorkspace }) {
  const [maximized, setMaximized] = useState(false);
  const project = workspace ? workspace.split(/[\\/]/).pop() : null;

  useEffect(()=>{
    api?.win.isMaximized().then(v=>setMaximized(v));
  },[]);

  return (
    <>
      <style>{CSS}</style>
      <div className="tb-root">
        {/* Drag region (left side) */}
        <div className="tb-drag">
          <span className="tb-logo">VISRODECK</span>
          <span className="tb-sep">/</span>
          <span className="tb-sub">STUDIO</span>
          {project && (
            <button className="tb-project" onClick={onChangeWorkspace}>
              <span className="tb-dot"/>
              {project}
            </button>
          )}
        </div>

        {/* Center controls */}
        <div className="tb-center">
          <div className="tb-interp"><span className="tb-interp-dot"/>NODE.JS</div>
          <button className="tb-run" onClick={onRun} disabled={isRunning}>
            {isRunning ? <><span className="tb-spin"/>RUNNING</> : <>▶ RUN</>}
          </button>
          <button className="tb-stop" onClick={onStop} disabled={!isRunning}>■ STOP</button>
          <button className="tb-jane">✦ JANE</button>
        </div>

        {/* Window controls (right side — no drag) */}
        <div className="tb-winctrl">
          <button className="tb-wbtn tb-min" onClick={()=>api?.win.minimize()} title="Minimize">─</button>
          <button className="tb-wbtn tb-max" onClick={()=>{api?.win.maximize();setMaximized(m=>!m);}} title="Maximize">
            {maximized ? "❐" : "□"}
          </button>
          <button className="tb-wbtn tb-close" onClick={()=>api?.win.close()} title="Close">✕</button>
        </div>
      </div>
    </>
  );
}

const CSS = `
.tb-root {
  height: 38px;
  display: flex;
  align-items: center;
  background: #0d0d0f;
  border-bottom: 1px solid #2a2a2e;
  flex-shrink: 0;
  -webkit-app-region: drag;   /* makes it draggable */
  user-select: none;
}

/* Drag left side */
.tb-drag {
  display: flex; align-items: center; gap: 7px;
  padding: 0 14px; flex: 1;
  -webkit-app-region: drag;
}
.tb-logo {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 600;
  letter-spacing: .2em; color: #fff;
}
.tb-sep { color: #2a2a2e; font-size: 14px; }
.tb-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: .18em; color: #3a3a40;
}
.tb-project {
  display: flex; align-items: center; gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #666;
  background: #161618; border: 1px solid #2a2a2e;
  padding: 2px 8px; border-radius: 2px;
  cursor: pointer; transition: border-color .15s; outline: none;
  -webkit-app-region: no-drag;
}
.tb-project:hover { border-color: #444; color: #e2e2e2; }
.tb-dot { width: 4px; height: 4px; border-radius: 50%; background: #3ddc84; flex-shrink: 0; box-shadow: 0 0 4px #3ddc84; }

/* Center — no drag */
.tb-center {
  display: flex; align-items: center; gap: 6px;
  padding: 0 10px;
  -webkit-app-region: no-drag;
}
.tb-interp {
  display: flex; align-items: center; gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px; font-weight: 600; letter-spacing: .1em;
  color: #3a3a40; background: #161618;
  border: 1px solid #1e1e22; padding: 2px 8px; border-radius: 2px;
}
.tb-interp-dot { width: 4px; height: 4px; border-radius: 50%; background: #68c142; }

.tb-run {
  display: flex; align-items: center; gap: 4px;
  background: #fff; color: #0a0a0b;
  border: 1px solid #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; font-weight: 700; letter-spacing: .08em;
  padding: 4px 12px; border-radius: 2px; cursor: pointer;
  transition: all .12s; outline: none;
}
.tb-run:hover:not(:disabled) { background: #ccc; border-color: #ccc; }
.tb-run:disabled { opacity: .3; cursor: not-allowed; }

.tb-stop {
  background: transparent; color: #e05c5c;
  border: 1px solid rgba(224,92,92,.3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; font-weight: 700; letter-spacing: .08em;
  padding: 4px 10px; border-radius: 2px; cursor: pointer;
  transition: all .12s; outline: none;
}
.tb-stop:hover:not(:disabled) { background: rgba(224,92,92,.1); }
.tb-stop:disabled { opacity: .25; cursor: not-allowed; }

.tb-jane {
  background: transparent; color: #3a3a40;
  border: 1px solid #2a2a2e;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; font-weight: 600;
  padding: 4px 10px; border-radius: 2px; cursor: pointer;
  transition: all .12s; outline: none;
}
.tb-jane:hover { color: #888; border-color: #3a3a40; }

.tb-spin {
  display: inline-block; width: 7px; height: 7px;
  border: 1.5px solid #0a0a0b; border-top-color: transparent;
  border-radius: 50%; animation: tbspin .55s linear infinite;
}
@keyframes tbspin { to{transform:rotate(360deg)} }

/* Window controls */
.tb-winctrl {
  display: flex; align-items: center;
  padding-right: 2px;
  -webkit-app-region: no-drag;
}
.tb-wbtn {
  width: 42px; height: 38px;
  background: transparent; border: none;
  font-size: 11px; cursor: pointer;
  transition: background .12s; outline: none;
  display: flex; align-items: center; justify-content: center;
  color: #555; font-family: 'JetBrains Mono', monospace;
}
.tb-wbtn:hover { color: #e2e2e2; }
.tb-min:hover  { background: #222226; }
.tb-max:hover  { background: #222226; }
.tb-close:hover{ background: #c42b1c; color: #fff; }
`;
