// electron/main.js — Phase 4
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path  = require("path");
const fs    = require("fs");
const os    = require("os");
const pty   = require("node-pty");
const https = require("https");

const isDev = !app.isPackaged;

let win       = null;
let ptyProc   = null;
let workspace = null;

const IGNORED = new Set([
  "node_modules",".git",".DS_Store","dist","build",
  ".next",".nuxt",".vite","__pycache__",".cache",
  "coverage",".nyc_output",".turbo",
]);

function getShell() {
  if (os.platform() === "win32") return "powershell.exe";
  return process.env.SHELL || "/bin/bash";
}

// ── File tree ─────────────────────────────────────────────────
function buildTree(dir, depth = 0) {
  if (depth > 6) return [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter(e => !IGNORED.has(e.name) && !e.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(e => {
      const fp = path.join(dir, e.name);
      return e.isDirectory()
        ? { type:"directory", name:e.name, path:fp, children:buildTree(fp, depth+1) }
        : { type:"file",      name:e.name, path:fp };
    });
}

function pushTree() {
  if (workspace && win?.webContents)
    win.webContents.send("fs:treeUpdate", buildTree(workspace));
}

// ── PTY ───────────────────────────────────────────────────────
function spawnPty(cwd) {
  if (ptyProc) { try { ptyProc.kill(); } catch (_) {} ptyProc = null; }
  ptyProc = pty.spawn(getShell(), [], {
    name: "xterm-256color", cols: 120, rows: 30,
    cwd: cwd || os.homedir(),
    env: { ...process.env, TERM: "xterm-256color" },
  });
  ptyProc.onData(data => win?.webContents?.send("pty:data", data));
  ptyProc.onExit(({ exitCode }) => {
    win?.webContents?.send("pty:exit", exitCode);
    ptyProc = null;
  });
}

// ── Jane AI via Anthropic API ─────────────────────────────────
function callAnthropic(systemPrompt, userMsg, history) {
  return new Promise((resolve, reject) => {
    // Read key from env — set ANTHROPIC_API_KEY in your shell profile
    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    if (!apiKey) { resolve("Set ANTHROPIC_API_KEY env var to use Jane."); return; }

    const messages = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg }
    ];

    const body = JSON.stringify({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1024,
      system: systemPrompt || "You are Jane, a helpful coding assistant in Visrodeck Studio. Be concise and practical.",
      messages,
    });

    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || "No response");
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── IPC ───────────────────────────────────────────────────────
ipcMain.handle("dialog:openFolder", async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"], title: "Select Workspace",
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("workspace:set", async (_, dir) => {
  if (!dir || !fs.existsSync(dir)) return { ok: false };
  workspace = dir;
  spawnPty(dir);
  return { ok: true, tree: buildTree(dir) };
});

ipcMain.handle("fs:tree",   (_, d)       => ({ tree: buildTree(d || workspace) }));
ipcMain.handle("fs:read",   (_, fp)      => { try { return { content: fs.readFileSync(fp,"utf8") }; } catch(e){ return {error:e.message}; } });
ipcMain.handle("fs:write",  (_, {fp,content}) => { try { fs.mkdirSync(path.dirname(fp),{recursive:true}); fs.writeFileSync(fp,content,"utf8"); pushTree(); return{ok:true}; } catch(e){ return{error:e.message}; } });
ipcMain.handle("fs:mkdir",  (_, d)       => { try { fs.mkdirSync(d,{recursive:true}); pushTree(); return{ok:true}; } catch(e){ return{error:e.message}; } });
ipcMain.handle("fs:rename", (_, {from,name}) => { try { const dest=path.join(path.dirname(from),name); fs.renameSync(from,dest); pushTree(); return{ok:true,path:dest}; } catch(e){ return{error:e.message}; } });
ipcMain.handle("fs:delete", (_, fp)      => { try { const s=fs.statSync(fp); s.isDirectory()?fs.rmSync(fp,{recursive:true,force:true}):fs.unlinkSync(fp); pushTree(); return{ok:true}; } catch(e){ return{error:e.message}; } });

ipcMain.on("pty:input",  (_, data)       => ptyProc?.write(data));
ipcMain.on("pty:resize", (_, {cols,rows})=> ptyProc?.resize(cols, rows));
ipcMain.on("pty:run",    (_, cmd)        => { if(!ptyProc)spawnPty(workspace||os.homedir()); const full=workspace?`cd "${workspace}" && ${cmd}\r`:`${cmd}\r`; ptyProc?.write(full); });
ipcMain.on("pty:stop",   ()              => ptyProc?.write("\x03"));
ipcMain.on("pty:cd",     (_, dir)        => ptyProc?.write(`cd "${dir}"\r`));

// Jane AI
ipcMain.handle("jane:ask", async (_, { system, userMsg, history }) => {
  try { return await callAnthropic(system, userMsg, history || []); }
  catch(e) { return `Error: ${e.message}`; }
});

ipcMain.on("win:minimize",  () => win?.minimize());
ipcMain.on("win:maximize",  () => win?.isMaximized() ? win.unmaximize() : win?.maximize());
ipcMain.on("win:close",     () => win?.close());
ipcMain.handle("win:isMaximized", () => win?.isMaximized() ?? false);
ipcMain.on("shell:open",    (_, p) => shell.openPath(p));

// ── Window ────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
    show: false,
  });
  isDev ? win.loadURL("http://localhost:5173") : win.loadFile(path.join(__dirname, "../dist/index.html"));
  win.once("ready-to-show", () => { win.show(); spawnPty(os.homedir()); });
  win.on("closed", () => { try { ptyProc?.kill(); } catch(_){} win = null; });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { try{ptyProc?.kill();}catch(_){} if(process.platform!=="darwin")app.quit(); });
app.on("activate", () => { if(BrowserWindow.getAllWindows().length===0) createWindow(); });
