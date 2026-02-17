// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studio", {
  win: {
    minimize:    () => ipcRenderer.send("win:minimize"),
    maximize:    () => ipcRenderer.send("win:maximize"),
    close:       () => ipcRenderer.send("win:close"),
    isMaximized: () => ipcRenderer.invoke("win:isMaximized"),
  },
  dialog: {
    openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  },
  workspace: {
    set: (dir) => ipcRenderer.invoke("workspace:set", dir),
  },
  fs: {
    tree:   (dir)          => ipcRenderer.invoke("fs:tree", dir),
    read:   (fp)           => ipcRenderer.invoke("fs:read", fp),
    write:  (fp, content)  => ipcRenderer.invoke("fs:write", { fp, content }),
    mkdir:  (dir)          => ipcRenderer.invoke("fs:mkdir", dir),
    rename: (from, name)   => ipcRenderer.invoke("fs:rename", { from, name }),
    delete: (fp)           => ipcRenderer.invoke("fs:delete", fp),
    onTreeUpdate: (cb) => {
      const h = (_, tree) => cb(tree);
      ipcRenderer.on("fs:treeUpdate", h);
      return () => ipcRenderer.removeListener("fs:treeUpdate", h);
    },
  },
  pty: {
    write:  (data)       => ipcRenderer.send("pty:input", data),
    resize: (cols, rows) => ipcRenderer.send("pty:resize", { cols, rows }),
    run:    (cmd)        => ipcRenderer.send("pty:run", cmd),
    stop:   ()           => ipcRenderer.send("pty:stop"),
    cd:     (dir)        => ipcRenderer.send("pty:cd", dir),
    onData: (cb) => {
      const h = (_, d) => cb(d);
      ipcRenderer.on("pty:data", h);
      return () => ipcRenderer.removeListener("pty:data", h);
    },
    onExit: (cb) => {
      const h = (_, code) => cb(code);
      ipcRenderer.on("pty:exit", h);
      return () => ipcRenderer.removeListener("pty:exit", h);
    },
  },
  shell: { open: (p) => ipcRenderer.send("shell:open", p) },
});
