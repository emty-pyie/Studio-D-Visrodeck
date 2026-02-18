// src/pages/labs/StudioPage.jsx — PRODUCTION READY
// Fixes: black screen crashes, terminal binding, run detection, file viewers

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
import SettingsPanel from "./SettingsPanel";
import JanePanel     from "./JanePanel";
import FileViewer    from "./FileViewer";
import EditorContextMenu from "./EditorContextMenu";

const s = window.studio;

const DEFAULT_SETTINGS = {
  theme:"dark",fontSize:13,lineHeight:1.65,fontFamily:"JetBrains Mono",
  minimap:false,wordWrap:false,lineNumbers:true,bracketPairs:true,
  smoothScroll:true,autoSave:false,formatOnSave:false,cursorBlink:true,
  tabSize:2,cursorStyle:"bar",interpreter:"auto",
};

// Language run commands
const RUN_COMMANDS = {
  javascript: (f) => `node "${f}"`,
  typescript: (f) => `ts-node "${f}"`,
  python:     (f) => `python3 "${f}"`,
  shell:      (f) => `bash "${f}"`,
  html:       null, // special: live preview
  markdown:   null, // special: viewer
};

function getLang(name = "") {
  const e = name.split(".").pop()?.toLowerCase();
  const map = {
    js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",
    json:"json",md:"markdown",css:"css",html:"html",sh:"shell",py:"python",
    txt:"plaintext",log:"plaintext",gitignore:"plaintext",env:"plaintext",
  };
  return map[e] || "plaintext";
}

function canRun(name) {
  const lang = getLang(name);
  return RUN_COMMANDS[lang] !== undefined;
}

// ── Editor with context menu ──────────────────────────────────
function EditorArea({ openFiles, activeFile, onChange, onClose, onSelect, settings, onEditorCtx }) {
  const editorRef = useRef(null);

  if (!activeFile) return (
    <div className="ea-empty">
      <div className="ea-empty-in">
        <span className="ea-empty-icon">[ ]</span>
        <p>Open a file from the explorer</p>
        <small>Right-click to create files &amp; folders</small>
      </div>
    </div>
  );

  const lang = getLang(activeFile.name);
  const isViewable = ["markdown","html","json","image","pdf"].includes(lang);

  return (
    <div className="ea-pane">
      <div className="ea-tabs">
        {openFiles.map(f => (
          <div key={f.path} className={`ea-tab${activeFile.path===f.path?" on":""}`}
            onClick={() => onSelect(f)}>
            <span className="ea-tab-name">{f.name}</span>
            {f.dirty && <span className="ea-tab-dot">●</span>}
            <span className="ea-tab-x" onClick={e=>{e.stopPropagation();onClose(f);}}>×</span>
          </div>
        ))}
      </div>

      {/* File viewer for non-code files */}
      {isViewable ? (
        <FileViewer file={activeFile} />
      ) : (
        <div className="ea-wrap" onContextMenu={onEditorCtx}>
          <Editor
            key={activeFile.path}
            defaultLanguage={lang}
            value={activeFile.content ?? ""}
            onChange={v => onChange(activeFile.path, v ?? "")}
            onMount={editor => { editorRef.current = editor; }}
            theme="vs-dark"
            options={{
              fontFamily:`"${settings.fontFamily}","Fira Code",monospace`,
              fontSize:settings.fontSize,
              lineHeight:settings.lineHeight,
              minimap:{enabled:settings.minimap},
              wordWrap:settings.wordWrap?"on":"off",
              lineNumbers:settings.lineNumbers?"on":"off",
              scrollBeyondLastLine:false,
              padding:{top:16,bottom:16},
              renderLineHighlight:"gutter",
              cursorBlinking:settings.cursorBlink?"smooth":"solid",
              cursorStyle:settings.cursorStyle,
              smoothScrolling:settings.smoothScroll,
              bracketPairColorization:{enabled:settings.bracketPairs},
              tabSize:settings.tabSize,
              overviewRulerBorder:false,
              contextmenu:false, // we handle it
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Bottom terminal (FIXED binding) ───────────────────────────
function BottomPanel({ isRunning, outputLines, debugLines }) {
  const [tab,setTab] = useState("terminal");
  const termContRef = useRef(null);
  const termRef     = useRef(null);
  const fitRef      = useRef(null);
  const boundRef    = useRef(false);

  // CRITICAL FIX: Single terminal instance, bind ONCE
  useEffect(() => {
    if (!termContRef.current || termRef.current || boundRef.current) return;

    const term = new Terminal({
      theme:{
        background:"#0a0a0b",foreground:"#e2e2e2",cursor:"#fff",
        selectionBackground:"#ffffff22",
        black:"#111",brightBlack:"#3a3a3d",
        red:"#e05c5c",brightRed:"#ff7070",
        green:"#3ddc84",brightGreen:"#50f09b",
        yellow:"#e8c06a",brightYellow:"#f0d080",
        blue:"#5b9cf6",brightBlue:"#7ab4ff",
        magenta:"#b87fd4",brightMagenta:"#d09ee8",
        cyan:"#4ec9c9",brightCyan:"#66e0e0",
        white:"#d4d4d4",brightWhite:"#fff",
      },
      fontFamily:'"JetBrains Mono","Cascadia Code","Fira Code",monospace',
      fontSize:12.5,lineHeight:1.55,letterSpacing:0.3,
      cursorBlink:true,cursorStyle:"bar",
      allowTransparency:true,scrollback:5000,convertEol:true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termContRef.current);
    setTimeout(()=>{ try{fit.fit();}catch(_){} },80);

    termRef.current = term;
    fitRef.current  = fit;

    const ro = new ResizeObserver(()=>{
      try{ fit.fit(); s?.pty.resize(term.cols,term.rows); }catch(_){}
    });
    ro.observe(termContRef.current);

    term.writeln("\x1b[1;37m  VISRODECK STUDIO\x1b[0m  \x1b[2mv4\x1b[0m");
    term.writeln("\x1b[2m  ────────────────────────\x1b[0m\r\n");

    // BIND input → pty
    const dataSub = term.onData(data => { s?.pty.write(data); });

    // BIND pty output → terminal
    const unData = s?.pty.onData(chunk => { term.write(chunk); });
    const unExit = s?.pty.onExit(code => {
      term.writeln(`\r\n\x1b[2m[exited: ${code}]\x1b[0m\r\n`);
    });

    boundRef.current = true;

    return ()=>{
      ro.disconnect();
      dataSub.dispose();
      unData?.();
      unExit?.();
      term.dispose();
      termRef.current = null;
      boundRef.current = false;
    };
  },[]);

  return (
    <>
      <style>{BP_CSS}</style>
      <div className="bp-root">
        <div className="bp-tabs">
          {["terminal","output","debug"].map(t=>(
            <button key={t} className={`bp-tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
              {t.toUpperCase()}
              {t==="output"&&outputLines.length>0&&<span className="bp-badge">{outputLines.length}</span>}
            </button>
          ))}
          <div style={{flex:1}}/>
          <div className={`bp-status${isRunning?" running":""}`}>
            <span/>{isRunning?"RUNNING":"READY"}
          </div>
        </div>
        <div className="bp-body">
          <div ref={termContRef} className="bp-term" style={{display:tab==="terminal"?"flex":"none"}}/>
          {tab==="output"&&(
            <div className="bp-log">
              {outputLines.length===0
                ?<div className="bp-hint">No output yet — hit RUN</div>
                :outputLines.map((l,i)=>(
                  <div key={i} className={`bp-row ${l.type}`}>
                    <span className="bp-badge-row">{l.type==="err"?"ERR":"OUT"}</span>
                    <span>{l.text}</span>
                  </div>
                ))}
            </div>
          )}
          {tab==="debug"&&(
            <div className="bp-log">
              {debugLines.length===0
                ?<div className="bp-hint">Debug events here</div>
                :debugLines.map((l,i)=>(
                  <div key={i} className="bp-row dbg">
                    <span className="bp-badge-row">DBG</span><span>{l}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
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
  const [editorCtx,   setEditorCtx]   = useState(null);
  const [mapOpen,     setMapOpen]     = useState(true);
  const [showSettings,setShowSettings]= useState(false);
  const [showJane,    setShowJane]    = useState(false);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);

  const dbg = msg => setDebugLines(d=>[...d.slice(-499),`[${new Date().toLocaleTimeString()}] ${msg}`]);

  // IPC subs
  useEffect(()=>{
    const unTree=s?.fs.onTreeUpdate(t=>setTree(t));
    const unExit=s?.pty.onExit(code=>{setIsRunning(false);dbg(`Exit: ${code}`);});
    return()=>{unTree?.();unExit?.();};
  },[]);

  // Keyboard
  useEffect(()=>{
    const fn=e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();save();}
      if((e.ctrlKey||e.metaKey)&&e.key===","){e.preventDefault();setShowSettings(v=>!v);}
      if((e.ctrlKey||e.metaKey)&&e.key==="j"){e.preventDefault();setShowJane(v=>!v);}
      if((e.ctrlKey||e.metaKey)&&e.key==="m"){e.preventDefault();setMapOpen(v=>!v);}
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();run();}
    };
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[activeFile,isRunning]);

  const openWorkspace=async dir=>{
    setWorkspace(dir);setShowSetup(false);dbg(`Workspace: ${dir}`);
    const r=await s.workspace.set(dir);
    if(r?.tree)setTree(r.tree);
  };

  const openFile=async node=>{
    const ex=openFiles.find(f=>f.path===node.path);
    if(ex){setActiveFile(ex);return;}
    const r=await s.fs.read(node.path);
    if(r?.content!==undefined){
      const file={...node,content:r.content,dirty:false};
      setOpenFiles(f=>[...f,file]);
      setActiveFile(file);
    }
  };

  const changeFile=(path,val)=>{
    setOpenFiles(f=>f.map(x=>x.path===path?{...x,content:val,dirty:true}:x));
    setActiveFile(a=>a?.path===path?{...a,content:val,dirty:true}:a);
  };

  const closeTab=node=>{
    const next=openFiles.filter(f=>f.path!==node.path);
    setOpenFiles(next);
    setActiveFile(p=>p?.path===node.path?(next[next.length-1]??null):p);
  };

  const save=useCallback(async file=>{
    const t=file||activeFile;if(!t)return;
    await s.fs.write(t.path,t.content);
    setOpenFiles(f=>f.map(x=>x.path===t.path?{...x,dirty:false}:x));
    setActiveFile(a=>a?.path===t.path?{...a,dirty:false}:a);
    dbg(`Saved: ${t.name}`);
  },[activeFile]);

  const run=async()=>{
    if(!activeFile||isRunning)return;
    const lang=getLang(activeFile.name);
    const cmdFn=RUN_COMMANDS[lang];
    if(!cmdFn){dbg("Cannot run this file type");return;}
    setIsRunning(true);setOutputLines([]);
    if(activeFile.dirty)await save();
    const cmd=cmdFn(activeFile.path);
    s.pty.run(cmd);dbg(`Run: ${cmd}`);
  };

  const stop=()=>{s.pty.stop();setIsRunning(false);dbg("Stopped");};

  const openCtx=(e,node)=>{e.preventDefault();setCtxMenu({x:e.clientX,y:e.clientY,node});};
  const closeCtx=()=>setCtxMenu(null);
  const openEditorCtx=(e)=>{e.preventDefault();setEditorCtx({x:e.clientX,y:e.clientY});};
  const closeEditorCtx=()=>setEditorCtx(null);

  const ctxAction=async action=>{
    const node=ctxMenu?.node;closeCtx();
    const sep=workspace?.includes("\\")?"\\":"/";
    const dir=n=>n?.type==="directory"?n.path:n?.path.split(/[\\/]/).slice(0,-1).join(sep)||workspace;

    if(action==="new_file"){
      const name=window.prompt("File name:");if(!name)return;
      const fp=dir(node)+sep+name;
      await s.fs.write(fp,"");openFile({type:"file",name,path:fp});
    }
    if(action==="new_folder"){
      const name=window.prompt("Folder name:");if(!name)return;
      await s.fs.mkdir(dir(node)+sep+name);
    }
    if(action==="rename"){
      const n=window.prompt("Rename to:",node?.name);if(!n||n===node?.name)return;
      await s.fs.rename(node.path,n);
      setOpenFiles(f=>f.filter(x=>x.path!==node.path));
      if(activeFile?.path===node.path)setActiveFile(null);
    }
    if(action==="delete"){
      if(!window.confirm(`Delete "${node?.name}"?`))return;
      await s.fs.delete(node.path);
      setOpenFiles(f=>f.filter(x=>!x.path.startsWith(node.path)));
      if(activeFile?.path.startsWith(node.path))setActiveFile(null);
    }
    if(action==="open_terminal"){const d=dir(node);s.pty.cd(d);}
    if(action==="copy_path")navigator.clipboard.writeText(node?.path??"");
  };

  const editorCtxAction=(action)=>{
    closeEditorCtx();
    if(action==="run")run();
    if(action==="format")dbg("Format (TODO)");
    if(action==="copy_path")navigator.clipboard.writeText(activeFile?.path??"");
  };

  useEffect(()=>{
    const fn=()=>{if(ctxMenu)closeCtx();if(editorCtx)closeEditorCtx();};
    window.addEventListener("click",fn);
    return()=>window.removeEventListener("click",fn);
  },[ctxMenu,editorCtx]);

  if(showSetup)return(
    <WorkspaceSetup
      onSelect={openWorkspace}
      onBrowse={async()=>{const p=await s.dialog.openFolder();if(p)openWorkspace(p);}}
    />
  );

  const runnable=activeFile&&canRun(activeFile.name);

  return (
    <>
      <style>{CSS}</style>
      <div className="vr-root" onClick={()=>{closeCtx();closeEditorCtx();}}>
        <TitleBar workspace={workspace} isRunning={isRunning}
          onRun={run} onStop={stop} runDisabled={!runnable||isRunning}
          onChangeWorkspace={()=>setShowSetup(true)}
          onSettings={()=>setShowSettings(true)}
          onJane={()=>setShowJane(v=>!v)}
        />
        <div className="vr-body">
          <FileExplorer tree={tree} activeFile={activeFile}
            onSelect={openFile} onContextMenu={openCtx}
            workspace={workspace}
            onRootContextMenu={e=>openCtx(e,{type:"directory",path:workspace,name:workspace?.split(/[\\/]/).pop()})}
          />
          <main className="vr-main">
            <div className="vr-split">
              <EditorArea openFiles={openFiles} activeFile={activeFile}
                onChange={changeFile} onClose={closeTab} onSelect={setActiveFile}
                settings={settings} onEditorCtx={openEditorCtx}/>
              <button className="vr-map-btn" onClick={()=>setMapOpen(o=>!o)}>{mapOpen?"›":"‹"}</button>
              {mapOpen&&<MapPanel workspace={workspace} activeFile={activeFile} tree={tree}/>}
            </div>
            <BottomPanel isRunning={isRunning} outputLines={outputLines} debugLines={debugLines}/>
          </main>
        </div>
        {ctxMenu&&<ContextMenu x={ctxMenu.x} y={ctxMenu.y} node={ctxMenu.node} onAction={ctxAction} onClose={closeCtx}/>}
        {editorCtx&&<EditorContextMenu x={editorCtx.x} y={editorCtx.y} file={activeFile} canRun={runnable} onAction={editorCtxAction} onClose={closeEditorCtx}/>}
        {showSettings&&<SettingsPanel settings={settings} onSave={s=>setSettings(s)} onClose={()=>setShowSettings(false)}/>}
        {showJane&&<JanePanel activeFile={activeFile} onClose={()=>setShowJane(false)}/>}
      </div>
    </>
  );
}

const CSS=`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--bg:#0a0a0b;--bg1:#111113;--bg2:#161618;--bg3:#1c1c1f;--bdr:#2a2a2e;--bdr2:#1e1e22;--text:#e2e2e2;--t2:#888;--t3:#4a4a50;--white:#fff;--red:#e05c5c;--yel:#e8c06a;--green:#3ddc84;--mono:'JetBrains Mono',monospace;--ui:'Space Grotesk',sans-serif;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.vr-root{display:flex;flex-direction:column;height:100vh;width:100%;background:var(--bg);color:var(--text);font-family:var(--ui);overflow:hidden;user-select:none;}
.vr-body{display:flex;flex:1;overflow:hidden;}
.vr-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.vr-split{flex:1;display:flex;overflow:hidden;border-bottom:1px solid var(--bdr);position:relative;}
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
.vr-map-btn{position:absolute;right:280px;top:50%;transform:translateY(-50%);width:14px;height:44px;background:var(--bg2);border:1px solid var(--bdr);border-radius:2px;color:var(--t3);font-size:10px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;transition:all .15s;z-index:10;}
.vr-map-btn:hover{color:var(--text);background:var(--bg3);}`;

const BP_CSS=`.bp-root{height:220px;display:flex;flex-direction:column;flex-shrink:0;}
.bp-tabs{display:flex;align-items:center;height:30px;background:var(--bg1);border-bottom:1px solid var(--bdr);flex-shrink:0;}
.bp-tab{display:flex;align-items:center;gap:5px;height:100%;padding:0 14px;font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:.12em;color:#3a3a40;background:transparent;border:none;border-right:1px solid var(--bdr2);cursor:pointer;transition:color .1s;outline:none;}
.bp-tab:hover{color:#666;}
.bp-tab.on{color:var(--text);border-bottom:1px solid var(--white);background:var(--bg);}
.bp-badge{background:#222226;border:1px solid var(--bdr);font-size:8px;padding:1px 4px;border-radius:2px;color:#888;}
.bp-status{display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:8px;font-weight:600;letter-spacing:.1em;padding:0 14px;color:#3a3a40;}
.bp-status span{width:4px;height:4px;border-radius:50%;background:#333;display:block;}
.bp-status.running{color:var(--green);}
.bp-status.running span{background:var(--green);box-shadow:0 0 4px var(--green);}
.bp-body{flex:1;overflow:hidden;}
.bp-term{width:100%;height:100%;padding:6px 10px;box-sizing:border-box;flex-direction:column;pointer-events:auto;cursor:text;}
.bp-term .xterm{height:100%;}
.bp-term .xterm-viewport{background:transparent!important;}
.bp-term .xterm-screen{cursor:text!important;}
.bp-log{height:100%;overflow-y:auto;padding:8px 12px;box-sizing:border-box;}
.bp-log::-webkit-scrollbar{width:3px;}
.bp-log::-webkit-scrollbar-thumb{background:var(--bdr);}
.bp-hint{font-family:var(--mono);font-size:10px;color:#3a3a40;padding:14px 0;}
.bp-row{display:flex;gap:10px;align-items:baseline;font-family:var(--mono);font-size:11px;padding:2px 0;border-bottom:1px solid #1a1a1d;line-height:1.5;}
.bp-row.err{color:var(--red);}
.bp-row.dbg{color:#3a3a40;}
.bp-badge-row{font-size:7px;font-weight:700;letter-spacing:.1em;color:#3a3a40;flex-shrink:0;width:22px;}`;
