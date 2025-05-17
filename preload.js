const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    exportWorkspace: (workspace) => ipcRenderer.invoke('export-workspace', workspace),
    importWorkspace: () => ipcRenderer.invoke('import-workspace'),
    loadExample: (exampleName) => ipcRenderer.invoke('load-example', exampleName),

    onImportExample: (callback) => {
        ipcRenderer.on('import-example', async (_event, exampleName) => {
            const data = await ipcRenderer.invoke('load-example', exampleName);
            callback(data);
        });
    }
});