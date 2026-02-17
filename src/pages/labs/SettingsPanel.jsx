// src/pages/labs/SettingsPanel.jsx
import { useState } from "react";

const THEMES = [
  { id:"dark",    label:"Dark",         bg:"#0a0a0b", accent:"#fff"    },
  { id:"darker",  label:"Darker",       bg:"#050506", accent:"#3ddc84" },
  { id:"midnight",label:"Midnight Blue",bg:"#060812", accent:"#5b9cf6" },
  { id:"carbon",  label:"Carbon",       bg:"#0d0d0d", accent:"#e8c06a" },
];

const INTERPRETERS = [
  { id:"node",   label:"Node.js",   cmd:"node",   icon:"⬡", color:"#68c142" },
  { id:"python", label:"Python 3",  cmd:"python3",icon:"🐍", color:"#3776ab" },
  { id:"ts",     label:"ts-node",   cmd:"ts-node",icon:"⬡", color:"#3178c6" },
  { id:"deno",   label:"Deno",      cmd:"deno run",icon:"🦕",color:"#fff" },
  { id:"bun",    label:"Bun",       cmd:"bun",    icon:"🥟", color:"#f5c542" },
];

const EXTENSIONS = [
  { id:"prettier", label:"Prettier",        desc:"Code formatter",           enabled:true  },
  { id:"eslint",   label:"ESLint",          desc:"JS/TS linting",            enabled:true  },
  { id:"gitblame", label:"Git Blame",       desc:"Inline git annotations",   enabled:false },
  { id:"bracket",  label:"Bracket Pairs",   desc:"Colorized bracket pairs",  enabled:true  },
  { id:"minimap",  label:"Minimap",         desc:"Editor overview ruler",    enabled:false },
  { id:"autosave", label:"Auto Save",       desc:"Save on focus loss",       enabled:false },
  { id:"wordwrap", label:"Word Wrap",       desc:"Wrap long lines",          enabled:true  },
  { id:"ligatures",label:"Font Ligatures",  desc:"JetBrains Mono ligatures", enabled:true  },
];

const KEYBINDINGS = [
  { action:"Run file",      key:"Ctrl+Enter" },
  { action:"Save file",     key:"Ctrl+S"     },
  { action:"Command palette",key:"Ctrl+P"   },
  { action:"Jane AI",       key:"Ctrl+J"     },
  { action:"Toggle map",    key:"Ctrl+M"     },
  { action:"New terminal",  key:"Ctrl+`"     },
  { action:"Close tab",     key:"Ctrl+W"     },
  { action:"Settings",      key:"Ctrl+,"     },
];

export default function SettingsPanel({ onClose, settings, onSave }){
  const [tab,setTab]      = useState("appearance");
  const [local,setLocal]  = useState(settings);
  const [exts,setExts]    = useState(EXTENSIONS);

  const set = (key,val) => setLocal(s=>({...s,[key]:val}));
  const toggleExt = id => setExts(e=>e.map(x=>x.id===id?{...x,enabled:!x.enabled}:x));

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-overlay" onClick={onClose}>
        <div className="sp-panel" onClick={e=>e.stopPropagation()}>
          <div className="sp-header">
            <span className="sp-title">SETTINGS</span>
            <button className="sp-close" onClick={onClose}>✕</button>
          </div>

          <div className="sp-body">
            <div className="sp-sidebar">
              {[
                {id:"appearance",icon:"◑",label:"Appearance"},
                {id:"editor",    icon:"✎",label:"Editor"},
                {id:"interpreter",icon:"▶",label:"Interpreters"},
                {id:"extensions",icon:"⊞",label:"Extensions"},
                {id:"keybindings",icon:"⌨",label:"Keybindings"},
              ].map(t=>(
                <button key={t.id} className={`sp-stab${tab===t.id?" on":""}`}
                  onClick={()=>setTab(t.id)}>
                  <span className="sp-stab-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="sp-content">

              {/* APPEARANCE */}
              {tab==="appearance"&&(
                <div className="sp-section">
                  <div className="sp-sec-title">THEME</div>
                  <div className="sp-themes">
                    {THEMES.map(t=>(
                      <button key={t.id} className={`sp-theme${local.theme===t.id?" on":""}`}
                        onClick={()=>set("theme",t.id)}>
                        <span className="sp-theme-swatch" style={{background:t.bg,boxShadow:`inset 0 0 0 1px ${t.accent}44`}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:t.accent,display:"block",margin:"auto"}}/>
                        </span>
                        <span className="sp-theme-name">{t.label}</span>
                        {local.theme===t.id&&<span className="sp-theme-check">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="sp-sec-title" style={{marginTop:20}}>FONT SIZE</div>
                  <div className="sp-slider-row">
                    <span className="sp-slider-val">{local.fontSize}px</span>
                    <input type="range" min="10" max="20" step="1"
                      value={local.fontSize} onChange={e=>set("fontSize",+e.target.value)}
                      className="sp-slider"/>
                    <span className="sp-slider-lab">10–20</span>
                  </div>

                  <div className="sp-sec-title" style={{marginTop:20}}>LINE HEIGHT</div>
                  <div className="sp-slider-row">
                    <span className="sp-slider-val">{local.lineHeight.toFixed(1)}</span>
                    <input type="range" min="1.2" max="2.0" step="0.1"
                      value={local.lineHeight} onChange={e=>set("lineHeight",+e.target.value)}
                      className="sp-slider"/>
                    <span className="sp-slider-lab">1.2–2.0</span>
                  </div>

                  <div className="sp-sec-title" style={{marginTop:20}}>FONT FAMILY</div>
                  <select className="sp-select" value={local.fontFamily}
                    onChange={e=>set("fontFamily",e.target.value)}>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Fira Code">Fira Code</option>
                    <option value="Cascadia Code">Cascadia Code</option>
                    <option value="Source Code Pro">Source Code Pro</option>
                    <option value="Inconsolata">Inconsolata</option>
                  </select>
                </div>
              )}

              {/* EDITOR */}
              {tab==="editor"&&(
                <div className="sp-section">
                  {[
                    {k:"minimap",      label:"Minimap",           desc:"Show overview ruler"},
                    {k:"wordWrap",     label:"Word Wrap",          desc:"Wrap long lines"},
                    {k:"lineNumbers",  label:"Line Numbers",       desc:"Show line numbers"},
                    {k:"bracketPairs", label:"Bracket Colorization",desc:"Color matching brackets"},
                    {k:"smoothScroll", label:"Smooth Scrolling",   desc:"Animated scrolling"},
                    {k:"autoSave",     label:"Auto Save",          desc:"Save on focus change"},
                    {k:"formatOnSave", label:"Format on Save",     desc:"Run formatter on save"},
                    {k:"cursorBlink",  label:"Cursor Blink",       desc:"Animate cursor"},
                  ].map(item=>(
                    <div key={item.k} className="sp-toggle-row">
                      <div>
                        <div className="sp-toggle-label">{item.label}</div>
                        <div className="sp-toggle-desc">{item.desc}</div>
                      </div>
                      <button className={`sp-toggle${local[item.k]?" on":""}`}
                        onClick={()=>set(item.k,!local[item.k])}>
                        <span className="sp-toggle-thumb"/>
                      </button>
                    </div>
                  ))}

                  <div className="sp-sec-title" style={{marginTop:20}}>TAB SIZE</div>
                  <div className="sp-radio-row">
                    {[2,4,8].map(n=>(
                      <button key={n} className={`sp-radio${local.tabSize===n?" on":""}`}
                        onClick={()=>set("tabSize",n)}>{n}</button>
                    ))}
                  </div>

                  <div className="sp-sec-title" style={{marginTop:20}}>CURSOR STYLE</div>
                  <div className="sp-radio-row">
                    {["bar","block","underline"].map(c=>(
                      <button key={c} className={`sp-radio${local.cursorStyle===c?" on":""}`}
                        onClick={()=>set("cursorStyle",c)}>{c}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERPRETERS */}
              {tab==="interpreter"&&(
                <div className="sp-section">
                  <div className="sp-sec-title">ACTIVE INTERPRETER</div>
                  <div className="sp-interps">
                    {INTERPRETERS.map(it=>(
                      <button key={it.id}
                        className={`sp-interp${local.interpreter===it.id?" on":""}`}
                        onClick={()=>set("interpreter",it.id)}>
                        <span className="sp-interp-icon" style={{fontSize:16}}>{it.icon}</span>
                        <div className="sp-interp-info">
                          <span className="sp-interp-name" style={{color:local.interpreter===it.id?it.color:"#e2e2e2"}}>{it.label}</span>
                          <span className="sp-interp-cmd">{it.cmd}</span>
                        </div>
                        {local.interpreter===it.id&&<span className="sp-interp-active">●</span>}
                      </button>
                    ))}
                  </div>
                  <div className="sp-hint">
                    The selected interpreter is used when you hit <kbd>RUN</kbd>. Make sure the executable is in your PATH.
                  </div>
                </div>
              )}

              {/* EXTENSIONS */}
              {tab==="extensions"&&(
                <div className="sp-section">
                  <div className="sp-sec-title">BUILT-IN EXTENSIONS</div>
                  {exts.map(ext=>(
                    <div key={ext.id} className="sp-ext-row">
                      <div className="sp-ext-info">
                        <span className="sp-ext-name">{ext.label}</span>
                        <span className="sp-ext-desc">{ext.desc}</span>
                      </div>
                      <button className={`sp-toggle${ext.enabled?" on":""}`}
                        onClick={()=>toggleExt(ext.id)}>
                        <span className="sp-toggle-thumb"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* KEYBINDINGS */}
              {tab==="keybindings"&&(
                <div className="sp-section">
                  <div className="sp-sec-title">KEYBOARD SHORTCUTS</div>
                  {KEYBINDINGS.map(kb=>(
                    <div key={kb.action} className="sp-kb-row">
                      <span className="sp-kb-action">{kb.action}</span>
                      <kbd className="sp-kbd">{kb.key}</kbd>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          <div className="sp-footer">
            <button className="sp-cancel" onClick={onClose}>Cancel</button>
            <button className="sp-save" onClick={()=>{ onSave(local); onClose(); }}>Save Changes</button>
          </div>
        </div>
      </div>
    </>
  );
}

const CSS=`
.sp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:sp-fade .15s ease;}
@keyframes sp-fade{from{opacity:0}to{opacity:1}}
.sp-panel{width:680px;max-height:80vh;background:#111113;border:1px solid #2a2a2e;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.9);animation:sp-in .15s ease;}
@keyframes sp-in{from{transform:scale(.96) translateY(-10px)}to{transform:scale(1) translateY(0)}}
.sp-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1e1e22;flex-shrink:0;}
.sp-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.2em;color:#e2e2e2;}
.sp-close{background:transparent;border:none;color:#444;font-size:14px;cursor:pointer;padding:4px 8px;border-radius:2px;transition:all .12s;outline:none;}
.sp-close:hover{color:#e2e2e2;background:#222;}
.sp-body{display:flex;flex:1;overflow:hidden;}
.sp-sidebar{width:160px;border-right:1px solid #1e1e22;padding:8px 0;flex-shrink:0;}
.sp-stab{display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;background:transparent;border:none;border-radius:0;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;color:#555;text-align:left;transition:all .1s;outline:none;}
.sp-stab:hover{color:#888;background:#161618;}
.sp-stab.on{color:#e2e2e2;background:#1c1c1f;border-right:2px solid #fff;}
.sp-stab-icon{font-size:13px;width:16px;text-align:center;}
.sp-content{flex:1;overflow-y:auto;padding:20px;}
.sp-content::-webkit-scrollbar{width:3px;}
.sp-content::-webkit-scrollbar-thumb{background:#2a2a2e;}
.sp-section{display:flex;flex-direction:column;gap:0;}
.sp-sec-title{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.18em;color:#444;margin-bottom:10px;text-transform:uppercase;}
/* Themes */
.sp-themes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;}
.sp-theme{display:flex;align-items:center;gap:10px;background:#161618;border:1px solid #2a2a2e;border-radius:4px;padding:10px;cursor:pointer;transition:all .12s;outline:none;}
.sp-theme:hover{border-color:#444;}
.sp-theme.on{border-color:#fff;}
.sp-theme-swatch{width:32px;height:32px;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sp-theme-name{font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;flex:1;text-align:left;}
.sp-theme.on .sp-theme-name{color:#e2e2e2;}
.sp-theme-check{font-size:11px;color:#3ddc84;}
/* Slider */
.sp-slider-row{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
.sp-slider-val{font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e2e2;width:36px;flex-shrink:0;}
.sp-slider{flex:1;accent-color:#fff;height:3px;cursor:pointer;}
.sp-slider-lab{font-family:'JetBrains Mono',monospace;font-size:9px;color:#444;width:42px;text-align:right;}
/* Select */
.sp-select{background:#0a0a0b;border:1px solid #2a2a2e;color:#e2e2e2;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 10px;border-radius:3px;outline:none;width:100%;cursor:pointer;}
/* Toggle */
.sp-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1a1a1d;}
.sp-toggle-label{font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e2e2;margin-bottom:2px;}
.sp-toggle-desc{font-family:'JetBrains Mono',monospace;font-size:9px;color:#444;}
.sp-toggle{width:36px;height:20px;background:#1c1c1f;border:1px solid #2a2a2e;border-radius:10px;cursor:pointer;position:relative;transition:all .2s;outline:none;padding:0;}
.sp-toggle.on{background:#fff;border-color:#fff;}
.sp-toggle-thumb{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#444;transition:all .2s;}
.sp-toggle.on .sp-toggle-thumb{left:18px;background:#0a0a0b;}
/* Radio */
.sp-radio-row{display:flex;gap:6px;}
.sp-radio{background:#161618;border:1px solid #2a2a2e;color:#555;font-family:'JetBrains Mono',monospace;font-size:11px;padding:5px 14px;border-radius:3px;cursor:pointer;transition:all .12s;outline:none;}
.sp-radio:hover{border-color:#444;color:#888;}
.sp-radio.on{background:#fff;border-color:#fff;color:#0a0a0b;}
/* Interpreters */
.sp-interps{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.sp-interp{display:flex;align-items:center;gap:12px;background:#161618;border:1px solid #2a2a2e;border-radius:4px;padding:10px 14px;cursor:pointer;transition:all .12s;outline:none;text-align:left;}
.sp-interp:hover{border-color:#444;}
.sp-interp.on{border-color:#ffffff44;background:#1c1c1f;}
.sp-interp-icon{flex-shrink:0;}
.sp-interp-info{flex:1;}
.sp-interp-name{display:block;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;margin-bottom:2px;}
.sp-interp-cmd{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#555;}
.sp-interp-active{color:#3ddc84;font-size:10px;}
.sp-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:#444;line-height:1.6;padding:10px;background:#0a0a0b;border:1px solid #1a1a1d;border-radius:3px;}
.sp-hint kbd{background:#1c1c1f;border:1px solid #2a2a2e;padding:1px 5px;border-radius:2px;color:#888;}
/* Extensions */
.sp-ext-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1a1a1d;}
.sp-ext-name{display:block;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e2e2;margin-bottom:2px;}
.sp-ext-desc{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#444;}
/* Keybindings */
.sp-kb-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #1a1a1d;}
.sp-kb-action{font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;}
.sp-kbd{font-family:'JetBrains Mono',monospace;font-size:10px;color:#e2e2e2;background:#1c1c1f;border:1px solid #2a2a2e;padding:3px 8px;border-radius:3px;}
/* Footer */
.sp-footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #1e1e22;flex-shrink:0;}
.sp-cancel{background:transparent;border:1px solid #2a2a2e;color:#555;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:7px 16px;border-radius:3px;cursor:pointer;transition:all .12s;outline:none;}
.sp-cancel:hover{color:#888;border-color:#444;}
.sp-save{background:#fff;border:1px solid #fff;color:#0a0a0b;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:7px 18px;border-radius:3px;cursor:pointer;transition:all .12s;outline:none;}
.sp-save:hover{background:#d4d4d4;border-color:#d4d4d4;}
`;
