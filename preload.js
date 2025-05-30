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
    },

    onThemeChange: (callback) => {
        ipcRenderer.on('set-theme', (_event, theme) => {
            callback(theme);
        });
    },

    focusFix: () => ipcRenderer.send('focus-fix')
});

contextBridge.executeInMainWorld({
    func: () => {
        const originalAlert = window.alert;
        const originalConfirm = window.confirm;

        window.alert = function (message) {
            const result = originalAlert(message);
            window.electronAPI?.focusFix();
            return result;
        };

        window.confirm = function (message) {
            const result = originalConfirm(message);
            window.electronAPI?.focusFix();
            return result;
        };
    }
});
