// src/pages/labs/StudioPage.jsx  — Electron, fresh build
import { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import FileExplorer  from "./FileExplorer";
import ContextMenu   from "./ContextMenu";
import MapPanel      from "./MapPanel";
import TitleBar      from "./TitleBar";
import WorkspaceSetup from "./WorkspaceSetup";

const s = window.studio; // preload bridge

function getLang(name = "") {
  const e = name.split(".").pop()?.toLowerCase();
  return {js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",
    json:"json",md:"markdown",css:"css",html:"html",sh:"shell",py:"python"}[e]??"plaintext";
}

// ─── Editor pane ─────────────────────────────────────────────
function EditorArea({ openFiles, activeFile, onChange, onClose, onSelect }) {
  if (!activeFile) return (
    <div className="e-empty">
      <div className="e-empty-in">
        <span className="e-empty-icon">[ ]</span>
        <p>Open a file from the explorer</p>
        <small>Right-click to create files &amp; folders</small>
      </div>
    </div>
  );
  return (
    <div className="e-pane">
      <div className="e-tabs">
        {openFiles.map(f => (
          <div key={f.path} className={`e-tab ${activeFile.path===f.path?"on":""}`} onClick={()=>onSelect(f)}>
            <span className="e-tab-name">{f.name}</span>
            {f.dirty && <span className="e-tab-dot">●</span>}
            <span className="e-tab-x" onClick={ev=>{ev.stopPropagation();onClose(f);}}>×</span>
          </div>
        ))}
      </div>
      <div className="e-wrap">
        <Editor key={activeFile.path}
          defaultLanguage={getLang(activeFile.name)}
          value={activeFile.content??""}
          onChange={v=>onChange(activeFile.path,v??"")}
          theme="vs-dark"
          options={{
            fontFamily:'"JetBrains Mono","Fira Code",monospace',
            fontSize:13, lineHeight:1.65,
            minimap:{enabled:false}, scrollBeyondLastLine:false,
            padding:{top:16,bottom:16}, renderLineHighlight:"gutter",
            cursorBlinking:"smooth", smoothScrolling:true,
            bracketPairColorization:{enabled:true}, overviewRulerBorder:false,
          }}
        />
      </div>
    </div>
  );
}

// ─── Bottom panel ─────────────────────────────────────────────
function BottomPanel({ termRef, outputLines, debugLines, isRunning }) {
  const [tab, setTab] = useState("terminal");
  return (
    <div className="bp-root">
      <div className="bp-tabs">
        {["terminal","output","debug"].map(t=>(
          <button key={t} className={`bp-tab ${tab===t?"on":""}`} onClick={()=>setTab(t)}>
            {t.toUpperCase()}
            {t==="output"&&outputLines.length>0&&<span className="bp-n">{outputLines.length}</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <span className="bp-status">
          <span style={{width:5,height:5,borderRadius:"50%",background:isRunning?"#3ddc84":"#333",display:"inline-block",marginRight:5}}/>
          {isRunning?"RUNNING":"READY"}
        </span>
      </div>
      <div className="bp-body">
        {/* Always mounted — critical for xterm focus */}
        <div ref={termRef} className="bp-term" style={{display:tab==="terminal"?"flex":"none"}}/>
        {tab==="output"&&(
          <div className="bp-log">
            {outputLines.length===0
              ? <div className="bp-hint">No output yet — hit RUN</div>
              : outputLines.map((l,i)=>(
                <div key={i} className={`bp-row ${l.type}`}>
                  <span className="bp-badge">{l.type==="err"?"ERR":"OUT"}</span>
                  <span>{l.text}</span>
                </div>
              ))}
          </div>
        )}
        {tab==="debug"&&(
          <div className="bp-log">
            {debugLines.length===0
              ? <div className="bp-hint">Debug events here</div>
              : debugLines.map((l,i)=>(
                <div key={i} className="bp-row dbg">
                  <span className="bp-badge">DBG</span><span>{l}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function StudioPage() {
  const [workspace,  setWorkspace]  = useState(null);
  const [showSetup,  setShowSetup]  = useState(true);
  const [tree,       setTree]       = useState([]);
  const [openFiles,  setOpenFiles]  = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [outputLines,setOutputLines]= useState([]);
  const [debugLines, setDebugLines] = useState([]);
  const [ctxMenu,    setCtxMenu]    = useState(null);
  const [mapOpen,    setMapOpen]    = useState(true);

  const termContRef = useRef(null);
  const termRef     = useRef(null);
  const fitRef      = useRef(null);
  const cleanupRef  = useRef([]);

  const dbg = msg => setDebugLines(d=>[...d.slice(-499),`[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ── Terminal init ───────────────────────────────────────────
  useEffect(()=>{
    if (!termContRef.current || termRef.current) return;

    const term = new Terminal({
      theme:{
        background:"#0a0a0b", foreground:"#e2e2e2", cursor:"#fff",
        selectionBackground:"#ffffff22",
        black:"#111", brightBlack:"#3a3a3d",
        red:"#e05c5c",   brightRed:"#ff7070",
        green:"#3ddc84", brightGreen:"#50f09b",
        yellow:"#e8c06a",brightYellow:"#f0d080",
        blue:"#5b9cf6",  brightBlue:"#7ab4ff",
        magenta:"#b87fd4",brightMagenta:"#d09ee8",
        cyan:"#4ec9c9",  brightCyan:"#66e0e0",
        white:"#d4d4d4", brightWhite:"#fff",
      },
      fontFamily:'"JetBrains Mono","Cascadia Code","Fira Code",monospace',
      fontSize:12.5, lineHeight:1.55, letterSpacing:0.3,
      cursorBlink:true, cursorStyle:"bar",
      allowTransparency:true, scrollback:5000, convertEol:true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termContRef.current);
    setTimeout(()=>{ try{fit.fit();}catch(_){} },80);
    termRef.current = term;
    fitRef.current  = fit;

    // Resize observer — also sends new size to pty
    const ro = new ResizeObserver(()=>{
      try {
        fit.fit();
        s?.pty.resize(term.cols, term.rows);
      } catch(_){}
    });
    ro.observe(termContRef.current);

    term.writeln("\x1b[1;37m  VISRODECK STUDIO\x1b[0m  \x1b[2mDesktop Edition\x1b[0m");
    term.writeln("\x1b[2m  ──────────────────────────────────\x1b[0m");
    term.writeln("\x1b[32m  ✓ Native terminal ready\x1b[0m\r\n");

    // ── TERMINAL INPUT → pty (the key fix) ──────────────────
    const dataSub = term.onData(data => { s?.pty.write(data); });

    // ── pty output → terminal ────────────────────────────────
    const unData = s?.pty.onData(chunk => {
      term.write(chunk);
      const clean = chunk.replace(/\x1b\[[0-9;]*[mGKHFJABCDu]/g,"").trim();
      if (clean) setOutputLines(o=>[...o.slice(-999),{type:"out",text:clean}]);
    });

    const unExit = s?.pty.onExit(code => {
      setIsRunning(false);
      term.writeln(`\r\n\x1b[2m[process exited: ${code}]\x1b[0m\r\n`);
      dbg(`Exit: ${code}`);
    });

    const unTree = s?.fs.onTreeUpdate(newTree => setTree(newTree));

    cleanupRef.current = [
      ()=>dataSub.dispose(),
      unData, unExit, unTree,
    ].filter(Boolean);

    return ()=>{
      ro.disconnect();
      cleanupRef.current.forEach(fn=>{ try{fn();}catch(_){} });
      term.dispose(); termRef.current = null;
    };
  },[]);

  // ── Workspace ───────────────────────────────────────────────
  const openWorkspace = async dir => {
    setWorkspace(dir); setShowSetup(false);
    dbg(`Workspace: ${dir}`);
    termRef.current?.writeln(`\r\n\x1b[37m  Workspace: \x1b[1m${dir}\x1b[0m\r\n`);
    const r = await s.workspace.set(dir);
    if (r?.tree) setTree(r.tree);
  };

  // ── File ops ────────────────────────────────────────────────
  const openFile = async node => {
    const ex = openFiles.find(f=>f.path===node.path);
    if (ex) { setActiveFile(ex); return; }
    const r = await s.fs.read(node.path);
    if (r?.content !== undefined) {
      const file = {...node, content:r.content, dirty:false};
      setOpenFiles(f=>[...f,file]);
      setActiveFile(file);
    }
  };

  const changeFile = (path,val) => {
    setOpenFiles(f=>f.map(x=>x.path===path?{...x,content:val,dirty:true}:x));
    setActiveFile(a=>a?.path===path?{...a,content:val,dirty:true}:a);
  };

  const closeTab = node => {
    const next = openFiles.filter(f=>f.path!==node.path);
    setOpenFiles(next);
    setActiveFile(p=>p?.path===node.path?(next[next.length-1]??null):p);
  };

  const save = useCallback(async file => {
    const t = file||activeFile; if(!t) return;
    await s.fs.write(t.path, t.content);
    setOpenFiles(f=>f.map(x=>x.path===t.path?{...x,dirty:false}:x));
    setActiveFile(a=>a?.path===t.path?{...a,dirty:false}:a);
    dbg(`Saved: ${t.name}`);
  },[activeFile]);

  useEffect(()=>{
    const fn=e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="s"){ e.preventDefault(); save(); } };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[save]);

  // ── Run / Stop ──────────────────────────────────────────────
  const run = async () => {
    setIsRunning(true); setOutputLines([]);
    if (activeFile?.dirty) await save();
    const cmd = activeFile ? `node "${activeFile.path}"` : "node index.js";
    s.pty.run(cmd); dbg(`Run: ${cmd}`);
  };
  const stop = () => { s.pty.stop(); setIsRunning(false); dbg("Stopped"); };

  // ── Context menu ────────────────────────────────────────────
  const openCtx = (e,node) => { e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,node}); };
  const closeCtx = () => setCtxMenu(null);

  const ctxAction = async action => {
    const node = ctxMenu?.node; closeCtx();
    const sep = workspace?.includes("\\")?"\\":"/";
    const dir = n => n?.type==="directory"?n.path:n?.path.split(/[\\/]/).slice(0,-1).join(sep)||workspace;

    if (action==="new_file") {
      const name=window.prompt("File name:"); if(!name)return;
      const fp = dir(node)+sep+name;
      await s.fs.write(fp,"");
      openFile({type:"file",name,path:fp});
    }
    if (action==="new_folder") {
      const name=window.prompt("Folder name:"); if(!name)return;
      await s.fs.mkdir(dir(node)+sep+name);
    }
    if (action==="rename") {
      const n=window.prompt("Rename to:",node?.name); if(!n||n===node?.name)return;
      await s.fs.rename(node.path,n);
      setOpenFiles(f=>f.filter(x=>x.path!==node.path));
      if(activeFile?.path===node.path) setActiveFile(null);
    }
    if (action==="delete") {
      if(!window.confirm(`Delete "${node?.name}"?`))return;
      await s.fs.delete(node.path);
      setOpenFiles(f=>f.filter(x=>!x.path.startsWith(node.path)));
      if(activeFile?.path.startsWith(node.path)) setActiveFile(null);
    }
    if (action==="open_terminal") {
      const d=dir(node); s.pty.cd(d);
      termRef.current?.writeln(`\r\n\x1b[2m[cd ${d}]\x1b[0m`);
    }
    if (action==="copy_path") navigator.clipboard.writeText(node?.path??"");
  };

  useEffect(()=>{
    const fn=()=>ctxMenu&&closeCtx();
    window.addEventListener("click",fn);
    return ()=>window.removeEventListener("click",fn);
  },[ctxMenu]);

  // ── Render ──────────────────────────────────────────────────
  if (showSetup) return (
    <WorkspaceSetup
      onSelect={openWorkspace}
      onBrowse={async()=>{ const p=await s.dialog.openFolder(); if(p) openWorkspace(p); }}
    />
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="vr-root" onClick={closeCtx}>
        <TitleBar workspace={workspace} isRunning={isRunning}
          onRun={run} onStop={stop}
          onChangeWorkspace={()=>setShowSetup(true)} />

        <div className="vr-body">
          <FileExplorer tree={tree} activeFile={activeFile}
            onSelect={openFile} onContextMenu={openCtx}
            workspace={workspace}
            onRootContextMenu={e=>openCtx(e,{type:"directory",path:workspace,name:workspace?.split(/[\\/]/).pop()})}
          />
          <main className="vr-main">
            <div className="vr-split">
              <EditorArea openFiles={openFiles} activeFile={activeFile}
                onChange={changeFile} onClose={closeTab} onSelect={setActiveFile}/>
              <button className="vr-map-btn" onClick={()=>setMapOpen(o=>!o)}
                title={mapOpen?"Collapse map":"Expand map"}>
                {mapOpen?"›":"‹"}
              </button>
              {mapOpen&&<MapPanel workspace={workspace} activeFile={activeFile} tree={tree}/>}
            </div>
            <BottomPanel termRef={termContRef} outputLines={outputLines}
              debugLines={debugLines} isRunning={isRunning}/>
          </main>
        </div>

        {ctxMenu&&<ContextMenu x={ctxMenu.x} y={ctxMenu.y} node={ctxMenu.node}
          onAction={ctxAction} onClose={closeCtx}/>}
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--bg:#0a0a0b;--bg1:#111113;--bg2:#161618;--bg3:#1c1c1f;--bdr:#2a2a2e;--bdr2:#1e1e22;--text:#e2e2e2;--t2:#888;--t3:#4a4a50;--white:#fff;--red:#e05c5c;--yel:#e8c06a;--mono:'JetBrains Mono',monospace;--ui:'Space Grotesk',sans-serif;}
.vr-root{display:flex;flex-direction:column;height:100vh;width:100%;background:var(--bg);color:var(--text);font-family:var(--ui);overflow:hidden;user-select:none;}
.vr-body{display:flex;flex:1;overflow:hidden;}
.vr-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.vr-split{flex:1;display:flex;overflow:hidden;border-bottom:1px solid var(--bdr);position:relative;}

/* Editor */
.e-pane{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.e-empty{flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg);}
.e-empty-in{text-align:center;}
.e-empty-icon{font-family:var(--mono);font-size:28px;color:var(--t3);display:block;margin-bottom:10px;}
.e-empty-in p{font-family:var(--mono);font-size:11px;color:var(--t3);}
.e-empty-in small{font-family:var(--mono);font-size:9px;color:var(--t3);opacity:.4;margin-top:5px;display:block;}
.e-tabs{display:flex;height:32px;background:var(--bg1);border-bottom:1px solid var(--bdr);overflow-x:auto;flex-shrink:0;}
.e-tabs::-webkit-scrollbar{height:0;}
.e-tab{display:flex;align-items:center;gap:5px;padding:0 12px;height:100%;font-family:var(--mono);font-size:11px;color:var(--t3);border-right:1px solid var(--bdr2);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:color .1s;}
.e-tab:hover{color:var(--t2);background:var(--bg2);}
.e-tab.on{color:var(--text);background:var(--bg);border-bottom:1px solid var(--white);}
.e-tab-dot{color:var(--yel);font-size:9px;}
.e-tab-x{color:var(--t3);font-size:14px;opacity:0;transition:opacity .1s;padding:0 2px;}
.e-tab:hover .e-tab-x{opacity:1;}
.e-tab-x:hover{color:var(--red);}
.e-wrap{flex:1;overflow:hidden;}

/* Map toggle */
.vr-map-btn{position:absolute;right:280px;top:50%;transform:translateY(-50%);width:14px;height:44px;background:var(--bg2);border:1px solid var(--bdr);border-radius:2px;color:var(--t3);font-size:10px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;transition:all .15s;z-index:10;}
.vr-map-btn:hover{color:var(--text);background:var(--bg3);}

/* Bottom panel */
.bp-root{height:220px;display:flex;flex-direction:column;flex-shrink:0;}
.bp-tabs{display:flex;align-items:center;height:30px;background:var(--bg1);border-bottom:1px solid var(--bdr);flex-shrink:0;}
.bp-tab{display:flex;align-items:center;gap:5px;height:100%;padding:0 16px;font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--t3);background:transparent;border:none;border-right:1px solid var(--bdr2);cursor:pointer;transition:color .1s;outline:none;}
.bp-tab:hover{color:var(--t2);}
.bp-tab.on{color:var(--text);border-bottom:1px solid var(--white);background:var(--bg);}
.bp-n{background:var(--bg3);border:1px solid var(--bdr);font-size:8px;padding:1px 4px;border-radius:2px;color:var(--t2);}
.bp-status{font-family:var(--mono);font-size:8px;letter-spacing:.1em;color:var(--t3);padding:0 14px;display:flex;align-items:center;}
.bp-body{flex:1;overflow:hidden;}
.bp-term{width:100%;height:100%;padding:6px 10px;box-sizing:border-box;flex-direction:column;pointer-events:auto;cursor:text;}
.bp-term .xterm{height:100%;}
.bp-term .xterm-viewport{background:transparent!important;}
.bp-term .xterm-screen{cursor:text!important;}
.bp-log{height:100%;overflow-y:auto;padding:8px 12px;box-sizing:border-box;}
.bp-log::-webkit-scrollbar{width:3px;}
.bp-log::-webkit-scrollbar-thumb{background:var(--bdr);}
.bp-hint{font-family:var(--mono);font-size:10px;color:var(--t3);padding:16px 0;}
.bp-row{display:flex;gap:10px;align-items:baseline;font-family:var(--mono);font-size:11px;padding:2px 0;border-bottom:1px solid var(--bdr2);line-height:1.5;}
.bp-row.err{color:var(--red);}
.bp-row.dbg{color:var(--t3);}
.bp-badge{font-size:7px;font-weight:700;letter-spacing:.1em;color:var(--t3);flex-shrink:0;width:22px;}
`;
