// src/pages/labs/StudioPage.jsx — Phase 4 COMPLETE
// Multi-tab terminal · Settings · Jane AI · Node graph · Extensions · Interpreters

import { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import FileExplorer  from "./FileExplorer";
import ContextMenu   from "./ContextMenu";
import MapPanel      from "./MapPanel";
import TitleBar      from "./TitleBar";
import WorkspaceSetup from "./WorkspaceSetup";
import MultiTerminal from "./MultiTerminal";
import SettingsPanel from "./SettingsPanel";
import JanePanel     from "./JanePanel";

const s = window.studio;

const DEFAULT_SETTINGS = {
  theme:       "dark",
  fontSize:    13,
  lineHeight:  1.65,
  fontFamily:  "JetBrains Mono",
  minimap:     false,
  wordWrap:    false,
  lineNumbers: true,
  bracketPairs:true,
  smoothScroll:true,
  autoSave:    false,
  formatOnSave:false,
  cursorBlink: true,
  tabSize:     2,
  cursorStyle: "bar",
  interpreter: "node",
};

const INTERP_CMD = {
  node:"node", python:"python3", ts:"ts-node", deno:"deno run", bun:"bun"
};

function getLang(name = "") {
  const e = name.split(".").pop()?.toLowerCase();
  return { js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",
    json:"json",md:"markdown",css:"css",html:"html",sh:"shell",py:"python" }[e] ?? "plaintext";
}

// ── Editor pane ───────────────────────────────────────────────
function EditorArea({ openFiles, activeFile, onChange, onClose, onSelect, settings }) {
  if (!activeFile) return (
    <div className="ea-empty">
      <div className="ea-empty-in">
        <span className="ea-empty-icon">[ ]</span>
        <p>Open a file from the explorer</p>
        <small>Right-click to create files &amp; folders</small>
      </div>
    </div>
  );
  return (
    <div className="ea-pane">
      <div className="ea-tabs">
        {openFiles.map(f => (
          <div key={f.path} className={`ea-tab${activeFile.path===f.path?" on":""}`}
            onClick={() => onSelect(f)}>
            <span className="ea-tab-name">{f.name}</span>
            {f.dirty && <span className="ea-tab-dot">●</span>}
            <span className="ea-tab-x"
              onClick={e => { e.stopPropagation(); onClose(f); }}>×</span>
          </div>
        ))}
      </div>
      <div className="ea-wrap">
        <Editor
          key={activeFile.path}
          defaultLanguage={getLang(activeFile.name)}
          value={activeFile.content ?? ""}
          onChange={v => onChange(activeFile.path, v ?? "")}
          theme="vs-dark"
          options={{
            fontFamily: `"${settings.fontFamily}","Fira Code",monospace`,
            fontSize:   settings.fontSize,
            lineHeight: settings.lineHeight,
            minimap:    { enabled: settings.minimap },
            wordWrap:   settings.wordWrap ? "on" : "off",
            lineNumbers:settings.lineNumbers ? "on" : "off",
            scrollBeyondLastLine: false,
            padding:    { top: 16, bottom: 16 },
            renderLineHighlight: "gutter",
            cursorBlinking: settings.cursorBlink ? "smooth" : "solid",
            cursorStyle: settings.cursorStyle,
            smoothScrolling: settings.smoothScroll,
            bracketPairColorization: { enabled: settings.bracketPairs },
            tabSize: settings.tabSize,
            overviewRulerBorder: false,
          }}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function StudioPage() {
  const [workspace,   setWorkspace]   = useState(null);
  const [showSetup,   setShowSetup]   = useState(true);
  const [tree,        setTree]        = useState([]);
  const [openFiles,   setOpenFiles]   = useState([]);
  const [activeFile,  setActiveFile]  = useState(null);
  const [isRunning,   setIsRunning]   = useState(false);
  const [outputLines, setOutputLines] = useState([]);
  const [debugLines,  setDebugLines]  = useState([]);
  const [ctxMenu,     setCtxMenu]     = useState(null);
  const [mapOpen,     setMapOpen]     = useState(true);
  const [showSettings,setShowSettings]= useState(false);
  const [showJane,    setShowJane]    = useState(false);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);

  const unsubRef = useRef([]);

  const dbg = msg => setDebugLines(d =>
    [...d.slice(-499), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ── IPC subscriptions (tree + pty exit) ──────────────────
  useEffect(() => {
    const unTree = s?.fs.onTreeUpdate(t => setTree(t));
    const unExit = s?.pty.onExit(code => {
      setIsRunning(false);
      dbg(`Exit: ${code}`);
    });
    unsubRef.current = [unTree, unExit].filter(Boolean);
    return () => unsubRef.current.forEach(fn => { try { fn(); } catch (_) {} });
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") { e.preventDefault(); setShowSettings(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") { e.preventDefault(); setShowJane(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === "m") { e.preventDefault(); setMapOpen(v => !v); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // ── Workspace ─────────────────────────────────────────────
  const openWorkspace = async dir => {
    setWorkspace(dir); setShowSetup(false);
    dbg(`Workspace: ${dir}`);
    const r = await s.workspace.set(dir);
    if (r?.tree) setTree(r.tree);
  };

  // ── File ops ──────────────────────────────────────────────
  const openFile = async node => {
    const ex = openFiles.find(f => f.path === node.path);
    if (ex) { setActiveFile(ex); return; }
    const r = await s.fs.read(node.path);
    if (r?.content !== undefined) {
      const file = { ...node, content: r.content, dirty: false };
      setOpenFiles(f => [...f, file]);
      setActiveFile(file);
    }
  };

  const changeFile = (path, val) => {
    setOpenFiles(f => f.map(x => x.path === path ? { ...x, content: val, dirty: true } : x));
    setActiveFile(a => a?.path === path ? { ...a, content: val, dirty: true } : a);
  };

  const closeTab = node => {
    const next = openFiles.filter(f => f.path !== node.path);
    setOpenFiles(next);
    setActiveFile(p => p?.path === node.path ? (next[next.length - 1] ?? null) : p);
  };

  const save = useCallback(async (file) => {
    const t = file || activeFile; if (!t) return;
    await s.fs.write(t.path, t.content);
    setOpenFiles(f => f.map(x => x.path === t.path ? { ...x, dirty: false } : x));
    setActiveFile(a => a?.path === t.path ? { ...a, dirty: false } : a);
    dbg(`Saved: ${t.name}`);
  }, [activeFile]);

  // ── Run / Stop ────────────────────────────────────────────
  const run = async () => {
    setIsRunning(true); setOutputLines([]);
    if (activeFile?.dirty) await save();
    const interpCmd = INTERP_CMD[settings.interpreter] || "node";
    const cmd = activeFile ? `${interpCmd} "${activeFile.path}"` : `${interpCmd} index.js`;
    s.pty.run(cmd); dbg(`Run [${interpCmd}]: ${cmd}`);
  };
  const stop = () => { s.pty.stop(); setIsRunning(false); dbg("Stopped"); };

  // ── Context menu ──────────────────────────────────────────
  const openCtx = (e, node) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, node }); };
  const closeCtx = () => setCtxMenu(null);

  const ctxAction = async action => {
    const node = ctxMenu?.node; closeCtx();
    const sep = workspace?.includes("\\") ? "\\" : "/";
    const dir = n => n?.type === "directory"
      ? n.path
      : n?.path.split(/[\\/]/).slice(0, -1).join(sep) || workspace;

    if (action === "new_file") {
      const name = window.prompt("File name:"); if (!name) return;
      const fp = dir(node) + sep + name;
      await s.fs.write(fp, ""); openFile({ type: "file", name, path: fp });
    }
    if (action === "new_folder") {
      const name = window.prompt("Folder name:"); if (!name) return;
      await s.fs.mkdir(dir(node) + sep + name);
    }
    if (action === "rename") {
      const n = window.prompt("Rename to:", node?.name); if (!n || n === node?.name) return;
      await s.fs.rename(node.path, n);
      setOpenFiles(f => f.filter(x => x.path !== node.path));
      if (activeFile?.path === node.path) setActiveFile(null);
    }
    if (action === "delete") {
      if (!window.confirm(`Delete "${node?.name}"?`)) return;
      await s.fs.delete(node.path);
      setOpenFiles(f => f.filter(x => !x.path.startsWith(node.path)));
      if (activeFile?.path.startsWith(node.path)) setActiveFile(null);
    }
    if (action === "open_terminal") {
      const d = dir(node);
      s.pty.cd(d);
    }
    if (action === "copy_path") navigator.clipboard.writeText(node?.path ?? "");
  };

  useEffect(() => {
    const fn = () => ctxMenu && closeCtx();
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, [ctxMenu]);

  // ── Render ────────────────────────────────────────────────
  if (showSetup) return (
    <WorkspaceSetup
      onSelect={openWorkspace}
      onBrowse={async () => { const p = await s.dialog.openFolder(); if (p) openWorkspace(p); }}
    />
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="vr-root" onClick={closeCtx}>

        <TitleBar
          workspace={workspace}
          isRunning={isRunning}
          onRun={run}
          onStop={stop}
          onChangeWorkspace={() => setShowSetup(true)}
          onSettings={() => setShowSettings(true)}
          onJane={() => setShowJane(v => !v)}
        />

        <div className="vr-body">
          <FileExplorer
            tree={tree}
            activeFile={activeFile}
            onSelect={openFile}
            onContextMenu={openCtx}
            workspace={workspace}
            onRootContextMenu={e => openCtx(e, {
              type: "directory", path: workspace,
              name: workspace?.split(/[\\/]/).pop()
            })}
          />

          <main className="vr-main">
            <div className="vr-split">
              <EditorArea
                openFiles={openFiles}
                activeFile={activeFile}
                onChange={changeFile}
                onClose={closeTab}
                onSelect={setActiveFile}
                settings={settings}
              />

              <button className="vr-map-btn"
                onClick={() => setMapOpen(o => !o)}
                title={mapOpen ? "Collapse map (Ctrl+M)" : "Expand map (Ctrl+M)"}>
                {mapOpen ? "›" : "‹"}
              </button>

              {mapOpen && (
                <MapPanel workspace={workspace} activeFile={activeFile} tree={tree} />
              )}
            </div>

            <MultiTerminal
              workspace={workspace}
              isRunning={isRunning}
              outputLines={outputLines}
              debugLines={debugLines}
            />
          </main>
        </div>

        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x} y={ctxMenu.y}
            node={ctxMenu.node}
            onAction={ctxAction}
            onClose={closeCtx}
          />
        )}

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSave={s => setSettings(s)}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showJane && (
          <JanePanel
            activeFile={activeFile}
            onClose={() => setShowJane(false)}
          />
        )}
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{
  --bg:#0a0a0b;--bg1:#111113;--bg2:#161618;--bg3:#1c1c1f;
  --bdr:#2a2a2e;--bdr2:#1e1e22;
  --text:#e2e2e2;--t2:#888;--t3:#4a4a50;
  --white:#fff;--red:#e05c5c;--yel:#e8c06a;--green:#3ddc84;
  --mono:'JetBrains Mono',monospace;--ui:'Space Grotesk',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.vr-root{display:flex;flex-direction:column;height:100vh;width:100%;background:var(--bg);color:var(--text);font-family:var(--ui);overflow:hidden;user-select:none;}
.vr-body{display:flex;flex:1;overflow:hidden;}
.vr-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.vr-split{flex:1;display:flex;overflow:hidden;border-bottom:1px solid var(--bdr);position:relative;}

/* Editor */
.ea-pane{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.ea-empty{flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg);}
.ea-empty-in{text-align:center;}
.ea-empty-icon{display:block;font-family:var(--mono);font-size:28px;color:#222;margin-bottom:12px;}
.ea-empty-in p{font-family:var(--mono);font-size:11px;color:#333;}
.ea-empty-in small{font-family:var(--mono);font-size:9px;color:#222;margin-top:5px;display:block;}
.ea-tabs{display:flex;height:32px;background:var(--bg1);border-bottom:1px solid var(--bdr);overflow-x:auto;flex-shrink:0;}
.ea-tabs::-webkit-scrollbar{height:0;}
.ea-tab{display:flex;align-items:center;gap:5px;padding:0 12px;height:100%;font-family:var(--mono);font-size:11px;color:var(--t3);border-right:1px solid var(--bdr2);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:color .1s;}
.ea-tab:hover{color:var(--t2);background:var(--bg2);}
.ea-tab.on{color:var(--text);background:var(--bg);border-bottom:1px solid var(--white);}
.ea-tab-dot{color:var(--yel);font-size:9px;}
.ea-tab-x{color:var(--t3);font-size:14px;opacity:0;transition:opacity .1s;padding:0 2px;}
.ea-tab:hover .ea-tab-x{opacity:1;}
.ea-tab-x:hover{color:var(--red);}
.ea-wrap{flex:1;overflow:hidden;}

/* Map toggle */
.vr-map-btn{position:absolute;right:280px;top:50%;transform:translateY(-50%);width:14px;height:44px;background:var(--bg2);border:1px solid var(--bdr);border-radius:2px;color:var(--t3);font-size:10px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;transition:all .15s;z-index:10;}
.vr-map-btn:hover{color:var(--text);background:var(--bg3);}
`;
