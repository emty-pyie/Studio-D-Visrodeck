// src/pages/labs/EditorContextMenu.jsx
import { useEffect, useRef } from "react";

export default function EditorContextMenu({ x, y, file, canRun, onAction, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.right > window.innerWidth) ref.current.style.left = (window.innerWidth - r.width - 4) + "px";
    if (r.bottom > window.innerHeight) ref.current.style.top = (window.innerHeight - r.height - 4) + "px";
  }, [x, y]);

  const items = [
    canRun && { id: "run", icon: "▶", label: "Run File", key: "Ctrl+Enter" },
    { id: "format", icon: "✎", label: "Format Document" },
    { id: "copy_path", icon: "⎘", label: "Copy Path" },
  ].filter(Boolean);

  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} className="ectx-root" style={{ left: x, top: y }}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}>
        {file && (
          <div className="ectx-title">
            <span className="ectx-icon">◈</span>
            <span className="ectx-name">{file.name}</span>
          </div>
        )}
        {items.map(item => (
          <button key={item.id} className="ectx-item" onClick={() => onAction(item.id)}>
            <span className="ectx-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.key && <span className="ectx-key">{item.key}</span>}
          </button>
        ))}
      </div>
    </>
  );
}

const CSS = `
.ectx-root{position:fixed;z-index:9999;min-width:200px;background:#1c1c1f;border:1px solid #2a2a2e;border-radius:5px;box-shadow:0 8px 32px rgba(0,0,0,.8);padding:4px;animation:ectx-in .09s ease;}
@keyframes ectx-in{from{opacity:0;transform:scale(.96) translateY(-3px)}to{opacity:1;transform:scale(1) translateY(0)}}
.ectx-title{display:flex;align-items:center;gap:7px;padding:6px 10px 5px;border-bottom:1px solid #2a2a2e;margin-bottom:3px;}
.ectx-icon{font-size:10px;color:#555;}
.ectx-name{font-family:'JetBrains Mono',monospace;font-size:10px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}
.ectx-item{display:flex;align-items:center;gap:9px;width:100%;padding:6px 10px;background:transparent;border:none;border-radius:3px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;color:#d4d4d4;text-align:left;transition:background .08s;outline:none;}
.ectx-item:hover{background:#2a2a2e;color:#fff;}
.ectx-item-icon{font-size:10px;color:#444;width:14px;text-align:center;flex-shrink:0;}
.ectx-item:hover .ectx-item-icon{color:#888;}
.ectx-key{margin-left:auto;font-size:9px;color:#444;font-weight:600;letter-spacing:.06em;}
`;
