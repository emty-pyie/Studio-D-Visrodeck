// src/pages/labs/FileViewer.jsx
// Handles non-code files: markdown, html preview, json formatter, images, binary

import { useState, useEffect } from "react";

export default function FileViewer({ file }) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const [preview, setPreview] = useState(null);

  // HTML live preview
  if (ext === "html") {
    return (
      <div className="fv-root">
        <div className="fv-header">
          <span className="fv-title">HTML PREVIEW</span>
          <span className="fv-file">{file.name}</span>
        </div>
        <iframe
          className="fv-iframe"
          srcDoc={file.content}
          sandbox="allow-scripts allow-same-origin"
          title={file.name}
        />
        <style>{FV_CSS}</style>
      </div>
    );
  }

  // Markdown rendered
  if (ext === "md") {
    return (
      <div className="fv-root">
        <div className="fv-header">
          <span className="fv-title">MARKDOWN PREVIEW</span>
          <span className="fv-file">{file.name}</span>
        </div>
        <div className="fv-md" dangerouslySetInnerHTML={{
          __html: file.content
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br/><br/>')
        }} />
        <style>{FV_CSS}</style>
      </div>
    );
  }

  // JSON formatted
  if (ext === "json") {
    let formatted = file.content;
    try { formatted = JSON.stringify(JSON.parse(file.content), null, 2); } catch {}
    return (
      <div className="fv-root">
        <div className="fv-header">
          <span className="fv-title">JSON VIEWER</span>
          <span className="fv-file">{file.name}</span>
        </div>
        <pre className="fv-json"><code>{formatted}</code></pre>
        <style>{FV_CSS}</style>
      </div>
    );
  }

  // Images
  if (["png","jpg","jpeg","gif","webp","svg","ico"].includes(ext)) {
    return (
      <div className="fv-root">
        <div className="fv-header">
          <span className="fv-title">IMAGE</span>
          <span className="fv-file">{file.name}</span>
        </div>
        <div className="fv-img-wrap">
          <img src={`file://${file.path}`} alt={file.name} className="fv-img" />
        </div>
        <style>{FV_CSS}</style>
      </div>
    );
  }

  // Binary/unsupported
  return (
    <div className="fv-root">
      <div className="fv-header">
        <span className="fv-title">BINARY FILE</span>
        <span className="fv-file">{file.name}</span>
      </div>
      <div className="fv-binary">
        <div className="fv-binary-icon">◯</div>
        <p>Cannot preview this file type</p>
        <small>.{ext} files are not editable in the IDE</small>
      </div>
      <style>{FV_CSS}</style>
    </div>
  );
}

const FV_CSS = `
.fv-root{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#0a0a0b;}
.fv-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#111113;border-bottom:1px solid #2a2a2e;flex-shrink:0;}
.fv-title{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.18em;color:#444;}
.fv-file{font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;}
.fv-iframe{flex:1;width:100%;border:none;background:#fff;}
.fv-md{flex:1;overflow-y:auto;padding:24px 32px;font-family:'Space Grotesk',sans-serif;font-size:14px;line-height:1.8;color:#e2e2e2;}
.fv-md::-webkit-scrollbar{width:3px;}
.fv-md::-webkit-scrollbar-thumb{background:#2a2a2e;}
.fv-md h1{font-size:28px;font-weight:700;margin-bottom:16px;color:#fff;}
.fv-md h2{font-size:22px;font-weight:600;margin-top:24px;margin-bottom:12px;color:#fff;}
.fv-md h3{font-size:18px;font-weight:600;margin-top:20px;margin-bottom:10px;color:#d4d4d4;}
.fv-md code{font-family:'JetBrains Mono',monospace;font-size:12px;background:#1c1c1f;border:1px solid #2a2a2e;padding:2px 6px;border-radius:2px;color:#3ddc84;}
.fv-json{flex:1;overflow:auto;padding:16px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:#e2e2e2;background:#0a0a0b;}
.fv-json::-webkit-scrollbar{width:3px;height:3px;}
.fv-json::-webkit-scrollbar-thumb{background:#2a2a2e;}
.fv-img-wrap{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;padding:20px;background:#0a0a0b;}
.fv-img{max-width:100%;max-height:100%;object-fit:contain;border:1px solid #2a2a2e;border-radius:4px;}
.fv-binary{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;}
.fv-binary-icon{font-size:64px;color:#222;margin-bottom:16px;}
.fv-binary p{font-family:'JetBrains Mono',monospace;font-size:13px;color:#444;margin-bottom:6px;}
.fv-binary small{font-family:'JetBrains Mono',monospace;font-size:10px;color:#222;}
`;
