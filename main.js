const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const childProcess = require('child_process');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { Base } = require('./base');
const packageJson = require('./package.json');
const os = require('os');

let busyWindow;
let electronProcess;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile('workspaces.html');
    mainWindow.webContents.on('did-finish-load', () => {
        const currentURL = mainWindow.webContents.getURL();
        const isWorkspacePage = currentURL.endsWith('workspaces.html');

        const template = [
            {
                label: 'TestTask',
                submenu: [
                    {
                        label: 'Fechar',
                        accelerator: 'Ctrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: 'Opções',
                submenu: [
                    {
                        label: 'Recarregar',
                        accelerator: 'Ctrl+R',
                        click: () => mainWindow.reload()
                    },
                    {
                        label: 'Forçar Recarregamento',
                        accelerator: 'Shift+Ctrl+R',
                        click: () => mainWindow.webContents.reloadIgnoringCache()
                    },
                    {
                        label: 'Limpar Sessão',
                        enabled: isWorkspacePage,
                        click: async () => {
                            const { response } = await dialog.showMessageBox(mainWindow, {
                                type: 'warning',
                                buttons: ['Cancelar', 'Confirmar'],
                                defaultId: 0,
                                cancelId: 0,
                                title: 'Confirmar',
                                message: 'Deseja realmente limpar a sessão? Isso removerá todos os dados armazenados localmente.'
                            });
                            if (response === 1) {
                                mainWindow.webContents.executeJavaScript('localStorage.clear(); location.reload();');
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Alternar Developer Tools',
                        accelerator: 'Ctrl+Shift+I',
                        click: () => mainWindow.webContents.toggleDevTools()
                    },
                    {
                        label: 'Alternar Developer Tools (F12)',
                        accelerator: 'F12',
                        click: () => mainWindow.webContents.toggleDevTools()
                    }
                ]
            },
            {
                label: 'Exemplos de workspaces',
                submenu: [
                    {
                        label: 'Importar Exemplo 1',
                        enabled: isWorkspacePage,
                        click: () => console.log('Exemplo 1 selecionado')
                    },
                    {
                        label: 'Importar Exemplo 2',
                        enabled: isWorkspacePage,
                        click: () => console.log('Exemplo 2 selecionado')
                    }
                ]
            },
            {
                label: 'Sobre',
                click: () => createAboutWindow()
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    });
}

function createBusyWindow() {
    busyWindow = new BrowserWindow({
        width: 1200,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    busyWindow.setMenu(null);
    busyWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Aguarde...</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                h1 {
                    font-size: 2em;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <h1>Aguarde...</h1>
        </body>
        </html>
    `));
}

function createAboutWindow() {
    const win = new BrowserWindow({
        width: 400,
        height: 200,
        resizable: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('about.html');
}

ipcMain.on('start-puppeteer', async (event, { test }) => {
    console.log('Iniciando automação no Puppeteer!');
    console.log(test);

    process.env.ELECTRON_START = 'puppeteer';

    //const electronPath = path.join(
    //    __dirname,
    //    'node_modules',
    //    'electron',
    //    'dist',
    //    `electron${process.platform === 'win32' ? '.exe' : ''}`
    //);

    const electronPath = process.execPath;

    //try {
    //    const stats = fs.statSync(electronPath);
    //    console.log(`Electron executable found at: ${electronPath}`);
    //    event.sender.send('log-message', `Electron executable found at: ${electronPath}`);
    //} catch (err) {
    //    console.error(`Electron executable not found at: ${electronPath}`);
    //    event.sender.send('log-message', `Electron executable not found at: ${electronPath}`);
    //    return;
    //}

    electronProcess = childProcess.spawn(electronPath, ['.', '--remote-debugging-port=9222']);

    event.sender.send('disable-start-button');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });
    const pages = await browser.pages();
    const page = pages[0];
    const base = new Base(page);
    const startTime = Date.now();

    try {
        await base.goto(test.url); //https://front.serverest.dev

        for (const action of test.actions) {
            if (Boolean(action.disabled)) {
                continue;
            }
            const selector = action.selector.trim().startsWith('//')
                ? `::-p-xpath(${action.selector})`
                : action.selector;

            switch (action.type) {
                case 'type':
                    await base.type(selector, action.text);
                    break;
                case 'fill':
                    await base.fill(selector, action.text);
                    break;
                case 'click':
                    await base.click(selector);
                    break;
                case 'enter':
                    await base.enter();
                    break;
                case 'navigate':
                    await base.goto(action.selector);
                    break;
                case 'assertText':
                    await base.assertText(selector, action.text);
                    break;
            }
        }

        // await base.fill('#email', 'email@email.com');
        // await base.type('#password', 'password');
        // await base.click('::-p-xpath(//button[@data-testid="entrar"])');
        // await base.assertText('.alert-dismissible > span', 'Email e/ou senha inválidos');
    } catch (error) {
        console.error('Erro no Puppeteer:', error);
        event.sender.send('test-failed', error);
    } finally {
        await base.screenshot();
        await browser.close();
        await browser.disconnect();
        if (electronProcess) {
            electronProcess.kill();
        }
        event.sender.send('enable-start-button');
        event.sender.send('test-completed');
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        console.log(`O teste levou ${executionTime} ms para executar.`);
    }
});

ipcMain.on('about', async (event) => {
    createAboutWindow();
    //if (busyWindow) {
    //    busyWindow.close();
    //}
});

ipcMain.handle('get-app-version', () => {
    return packageJson.version;
});

ipcMain.handle('export-workspace', async (event, workspace) => {
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    const defaultPath = path.join(downloadsPath, `${workspace.name}.json`);

    const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Exportar Workspace',
        defaultPath,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
        return true;
    }
    return false;
});

ipcMain.handle('import-workspace', async () => {
    const downloadsPath = path.join(os.homedir(), 'Downloads');

    const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'Importar Workspace',
        defaultPath: downloadsPath,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (!canceled && filePaths.length > 0) {
        const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
        try {
            const json = JSON.parse(fileContent);
            const isValid = json.name && json.version && json.testType && json.test?.actions && typeof json.test.url === 'string';
            return isValid ? json : null;
        } catch (e) {
            return null;
        }
    }
    return null;
});

app.whenReady().then(() => {
    if (process.env.ELECTRON_START === 'puppeteer') {
        createBusyWindow();
    } else {
        createWindow();
    }
});