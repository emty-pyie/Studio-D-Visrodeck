// src/pages/labs/MultiTerminal.jsx
// Multi-tab terminal — each tab is an independent pty session

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const s = window.studio;
let tabCounter = 1;

function createTab(id) {
  return { id, label: `bash ${id}`, term: null, fit: null, unsub: [] };
}

function TermInstance({ tab, active, containerRef }) {
  return (
    <div
      ref={containerRef}
      className="mt-term-host"
      style={{ display: active ? "flex" : "none" }}
    />
  );
}

export default function MultiTerminal({ workspace, isRunning, outputLines, debugLines }) {
  const [tabs, setTabs]         = useState([{ id: 1, label: "bash 1" }]);
  const [activeId, setActiveId] = useState(1);
  const [panelTab, setPanelTab] = useState("terminal");

  // Map of tabId → { term, fit, containerRef, unsubs }
  const instancesRef = useRef({});

  const initTerm = useCallback((id, el) => {
    if (!el || instancesRef.current[id]?.term) return;

    const term = new Terminal({
      theme: {
        background: "#0a0a0b", foreground: "#e2e2e2", cursor: "#fff",
        selectionBackground: "#ffffff22",
        black: "#111",   brightBlack: "#3a3a3d",
        red: "#e05c5c",  brightRed: "#ff7070",
        green: "#3ddc84",brightGreen: "#50f09b",
        yellow: "#e8c06a",brightYellow: "#f0d080",
        blue: "#5b9cf6", brightBlue: "#7ab4ff",
        magenta: "#b87fd4",brightMagenta: "#d09ee8",
        cyan: "#4ec9c9", brightCyan: "#66e0e0",
        white: "#d4d4d4",brightWhite: "#fff",
      },
      fontFamily: '"JetBrains Mono","Cascadia Code","Fira Code",monospace',
      fontSize: 12.5, lineHeight: 1.55, letterSpacing: 0.3,
      cursorBlink: true, cursorStyle: "bar",
      allowTransparency: true, scrollback: 5000, convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    setTimeout(() => { try { fit.fit(); } catch (_) {} }, 80);

    const ro = new ResizeObserver(() => {
      try { fit.fit(); s?.pty.resize(term.cols, term.rows); } catch (_) {}
    });
    ro.observe(el);

    term.writeln(`\x1b[1;37m  VISRODECK STUDIO\x1b[0m  \x1b[2mTerminal ${id}\x1b[0m`);
    term.writeln(`\x1b[2m  ────────────────────────────\x1b[0m\r\n`);

    // input → pty
    const dataSub = term.onData(data => s?.pty.write(data));

    // pty output → all tabs share the same pty for now
    const unData = s?.pty.onData(chunk => {
      if (id === activeId || !instancesRef.current[activeId]?.term) {
        term.write(chunk);
      }
    });

    const unExit = s?.pty.onExit(code => {
      term.writeln(`\r\n\x1b[2m[exited: ${code}]\x1b[0m\r\n`);
    });

    instancesRef.current[id] = { term, fit, ro, unsubs: [
      () => dataSub.dispose(), unData, unExit
    ].filter(Boolean) };
  }, [activeId]);

  // Init first tab
  const firstTabRef = useRef(null);
  useEffect(() => {
    if (firstTabRef.current) initTerm(1, firstTabRef.current);
  }, [initTerm]);

  const addTab = () => {
    const id = ++tabCounter;
    setTabs(t => [...t, { id, label: `bash ${id}` }]);
    setActiveId(id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const inst = instancesRef.current[id];
    if (inst) {
      inst.unsubs.forEach(fn => { try { fn(); } catch (_) {} });
      inst.ro?.disconnect();
      inst.term?.dispose();
      delete instancesRef.current[id];
    }
    setTabs(t => t.filter(x => x.id !== id));
    setActiveId(prev => prev === id ? tabs.find(x => x.id !== id)?.id ?? 1 : prev);
  };

  // Tab container refs
  const tabRefs = useRef({});
  const setTabRef = (id) => (el) => {
    if (el && !tabRefs.current[id]) {
      tabRefs.current[id] = el;
      initTerm(id, el);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="mt-root">
        <div className="mt-tabs-row">
          {["terminal","output","debug"].map(t => (
            <button key={t} className={`mt-panel-tab${panelTab===t?" on":""}`}
              onClick={() => setPanelTab(t)}>
              {t.toUpperCase()}
              {t === "output" && outputLines.length > 0 &&
                <span className="mt-badge">{outputLines.length}</span>}
            </button>
          ))}

          {panelTab === "terminal" && (
            <>
              <div className="mt-divider"/>
              {tabs.map(tab => (
                <div key={tab.id}
                  className={`mt-term-tab${activeId===tab.id?" on":""}`}
                  onClick={() => setActiveId(tab.id)}>
                  <span className="mt-term-tab-dot"/>
                  <span>{tab.label}</span>
                  {tabs.length > 1 && (
                    <span className="mt-term-tab-x"
                      onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</span>
                  )}
                </div>
              ))}
              <button className="mt-new-tab" onClick={addTab} title="New terminal">+</button>
            </>
          )}

          <div style={{ flex: 1 }}/>
          <div className={`mt-status${isRunning?" running":""}`}>
            <span/>{isRunning ? "RUNNING" : "READY"}
          </div>
        </div>

        <div className="mt-body">
          {panelTab === "terminal" && tabs.map(tab => (
            <div key={tab.id}
              ref={setTabRef(tab.id)}
              className="mt-term-host"
              style={{ display: activeId === tab.id ? "flex" : "none" }}
            />
          ))}

          {panelTab === "output" && (
            <div className="mt-log">
              {outputLines.length === 0
                ? <div className="mt-hint">No output yet — hit RUN</div>
                : outputLines.map((l, i) => (
                  <div key={i} className={`mt-row ${l.type}`}>
                    <span className="mt-badge-row">{l.type === "err" ? "ERR" : "OUT"}</span>
                    <span>{l.text}</span>
                  </div>
                ))}
            </div>
          )}

          {panelTab === "debug" && (
            <div className="mt-log">
              {debugLines.length === 0
                ? <div className="mt-hint">Debug events here</div>
                : debugLines.map((l, i) => (
                  <div key={i} className="mt-row dbg">
                    <span className="mt-badge-row">DBG</span>
                    <span>{l}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const CSS = `
.mt-root{height:220px;display:flex;flex-direction:column;flex-shrink:0;}
.mt-tabs-row{display:flex;align-items:center;height:30px;background:#111113;border-bottom:1px solid #2a2a2e;flex-shrink:0;overflow-x:auto;}
.mt-tabs-row::-webkit-scrollbar{height:0;}
.mt-panel-tab{display:flex;align-items:center;gap:5px;height:100%;padding:0 14px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.12em;color:#3a3a40;background:transparent;border:none;border-right:1px solid #1e1e22;cursor:pointer;transition:color .1s;outline:none;white-space:nowrap;flex-shrink:0;}
.mt-panel-tab:hover{color:#666;}
.mt-panel-tab.on{color:#e2e2e2;border-bottom:1px solid #fff;background:#0a0a0b;}
.mt-badge{background:#222226;border:1px solid #2a2a2e;font-size:8px;padding:1px 4px;border-radius:2px;color:#888;}
.mt-divider{width:1px;height:18px;background:#2a2a2e;margin:0 4px;flex-shrink:0;}
.mt-term-tab{display:flex;align-items:center;gap:5px;height:100%;padding:0 10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#3a3a40;cursor:pointer;transition:all .1s;white-space:nowrap;flex-shrink:0;border-right:1px solid #1a1a1d;}
.mt-term-tab:hover{color:#666;background:#161618;}
.mt-term-tab.on{color:#e2e2e2;background:#0a0a0b;border-bottom:1px solid #3ddc84;}
.mt-term-tab-dot{width:4px;height:4px;border-radius:50%;background:#3ddc84;flex-shrink:0;}
.mt-term-tab.on .mt-term-tab-dot{box-shadow:0 0 5px #3ddc84;}
.mt-term-tab-x{color:#333;font-size:13px;line-height:1;margin-left:2px;padding:0 2px;transition:color .1s;}
.mt-term-tab-x:hover{color:#e05c5c;}
.mt-new-tab{height:100%;padding:0 10px;background:transparent;border:none;border-right:1px solid #1a1a1d;color:#333;font-size:16px;cursor:pointer;transition:color .1s;outline:none;flex-shrink:0;}
.mt-new-tab:hover{color:#888;background:#161618;}
.mt-status{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:.1em;padding:0 14px;color:#3a3a40;}
.mt-status span{width:4px;height:4px;border-radius:50%;background:#333;display:block;}
.mt-status.running{color:#3ddc84;}
.mt-status.running span{background:#3ddc84;box-shadow:0 0 4px #3ddc84;}
.mt-body{flex:1;overflow:hidden;}
.mt-term-host{width:100%;height:100%;padding:6px 10px;box-sizing:border-box;flex-direction:column;pointer-events:auto;cursor:text;}
.mt-term-host .xterm{height:100%;}
.mt-term-host .xterm-viewport{background:transparent!important;}
.mt-term-host .xterm-screen{cursor:text!important;}
.mt-log{height:100%;overflow-y:auto;padding:8px 12px;box-sizing:border-box;}
.mt-log::-webkit-scrollbar{width:3px;}
.mt-log::-webkit-scrollbar-thumb{background:#2a2a2e;}
.mt-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3a3a40;padding:14px 0;}
.mt-row{display:flex;gap:10px;align-items:baseline;font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 0;border-bottom:1px solid #1a1a1d;line-height:1.5;}
.mt-row.err{color:#e05c5c;}
.mt-row.dbg{color:#3a3a40;}
.mt-badge-row{font-size:7px;font-weight:700;letter-spacing:.1em;color:#3a3a40;flex-shrink:0;width:22px;}
`;
