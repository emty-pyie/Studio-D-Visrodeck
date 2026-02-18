// src/pages/labs/FileExplorer.jsx
import { useState } from "react";

const EXT_COLOR = {
  js:"#f5c542",jsx:"#61dafb",ts:"#3178c6",tsx:"#61dafb",
  json:"#cbcb41",md:"#e2e2e2",css:"#5b9cf6",html:"#e44d26",
  sh:"#3ddc84",py:"#3776ab",txt:"#888",svg:"#ffb13b",env:"#eee",
};
function extColor(n){ return EXT_COLOR[n.split(".").pop()?.toLowerCase()]||"#555"; }

function FileIcon({ name, isDir, open }){
  if(isDir) return <span style={{fontSize:9,color:"#555",marginRight:4,flexShrink:0,width:10,display:"inline-block"}}>{open?"▾":"▸"}</span>;
  return <span style={{color:extColor(name),fontSize:10,marginRight:5,flexShrink:0}}>◈</span>;
}

function TreeNode({ node, depth=0, activeFile, onSelect, onCtx }){
  const [open, setOpen] = useState(depth<1);
  if(node.type==="directory") return (
    <div>
      <div className="fe-row" style={{paddingLeft:depth*14+8}}
        onClick={()=>setOpen(o=>!o)}
        onContextMenu={e=>{e.stopPropagation();onCtx(e,node);}}>
        <FileIcon name={node.name} isDir open={open}/>
        <span className="fe-dname">{node.name}</span>
      </div>
      {open && node.children?.map(c=>(
        <TreeNode key={c.path} node={c} depth={depth+1}
          activeFile={activeFile} onSelect={onSelect} onCtx={onCtx}/>
      ))}
    </div>
  );
  const active = activeFile?.path===node.path;
  return (
    <div className={`fe-row fe-file${active?" active":""}`}
      style={{paddingLeft:depth*14+8}}
      onClick={()=>onSelect(node)}
      onContextMenu={e=>{e.stopPropagation();onCtx(e,node);}}>
      <FileIcon name={node.name}/>
      <span className="fe-fname">{node.name}</span>
    </div>
  );
}

export default function FileExplorer({ tree, activeFile, onSelect, onContextMenu, workspace, onRootContextMenu }){
  const proj = workspace ? workspace.split(/[\\/]/).pop() : "—";
  return (
    <>
      <style>{CSS}</style>
      <aside className="fe-root" onContextMenu={onRootContextMenu}>
        <div className="fe-head">
          <span className="fe-label">EXPLORER</span>
          <span className="fe-proj" title={workspace}>{proj}</span>
        </div>
        <div className="fe-body">
          {tree.length===0
            ? <div className="fe-empty"><span>No files</span><small>Right-click to create</small></div>
            : tree.map(n=>(
              <TreeNode key={n.path} node={n}
                activeFile={activeFile} onSelect={onSelect} onCtx={onContextMenu}/>
            ))
          }
        </div>
      </aside>
    </>
  );
}

const CSS=`
.fe-root{width:210px;flex-shrink:0;background:#111113;border-right:1px solid #2a2a2e;display:flex;flex-direction:column;overflow:hidden;}
.fe-head{padding:10px 12px 8px;border-bottom:1px solid #1e1e22;flex-shrink:0;}
.fe-label{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:4px;}
.fe-proj{display:block;font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fe-body{flex:1;overflow-y:auto;padding:4px 0;}
.fe-body::-webkit-scrollbar{width:3px;}
.fe-body::-webkit-scrollbar-thumb{background:#2a2a2e;}
.fe-empty{padding:18px 12px;text-align:center;}
.fe-empty span{display:block;font-family:'JetBrains Mono',monospace;font-size:11px;color:#333;margin-bottom:5px;}
.fe-empty small{font-family:'JetBrains Mono',monospace;font-size:9px;color:#222;}
.fe-row{display:flex;align-items:center;min-height:22px;padding-right:6px;cursor:pointer;transition:background .08s;}
.fe-row:hover{background:#161618;}
.fe-file.active{background:#1c1c1f;}
.fe-dname{font-family:'JetBrains Mono',monospace;font-size:11px;color:#aaa;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fe-fname{font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e2e2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
`;
