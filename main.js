const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } = require('electron');
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
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    attachLoadErrorHandler(mainWindow);
    mainWindow.loadFile('workspaces.html');
    mainWindow.webContents.on('did-finish-load', () => {
        const currentURL = mainWindow.webContents.getURL();
        const isWorkspacePage = currentURL.endsWith('workspaces.html');

        const template = [
            {
                label: 'TestTask',
                submenu: [
                    {
                        label: 'Voltar ao início',
                        accelerator: 'CmdOrCtrl+Shift+S',
                        click: () => {
                            mainWindow.loadFile('workspaces.html');
                        }
                    },
                    {
                        type: 'separator'
                    },
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
                                message: 'Deseja realmente limpar a sessão? Isso removerá todos os workspaces listados'
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
                    }
                ]
            },
            {
                label: 'Exemplos de workspaces',
                submenu: [
                    {
                        label: 'Importar Exemplo Clique',
                        enabled: isWorkspacePage,
                        click: () => mainWindow.webContents.send('import-example', '1-Click')
                    },
                    {
                        label: 'Importar Exemplo Preencher',
                        enabled: isWorkspacePage,
                        click: () => mainWindow.webContents.send('import-example', '2-Preencher')
                    },
                    {
                        label: 'Importar Exemplo Aguardar elemento aparecer',
                        enabled: isWorkspacePage,
                        click: () => mainWindow.webContents.send('import-example', '3-Aguardar elemento aparecer')
                    },
                    {
                        label: 'Importar Exemplo Aguardar elemento desaparecer',
                        enabled: isWorkspacePage,
                        click: () => mainWindow.webContents.send('import-example', '4-Aguardar elemento desaparecer')
                    }
                ]
            },
            {
                label: 'Sobre',
                submenu: [
                    {
                        label: 'Ver Informações',
                        click: () => createAboutWindow()
                    }
                ]
            }
        ];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    });
}

function createBusyWindow() {
    busyWindow = new BrowserWindow({
        width: 1280,
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

function createConfigWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        resizable: true,
        maximizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('config.html');
}

function createReportWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('report.html');
}

function attachLoadErrorHandler(win) {
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Erro] ${validatedURL} falhou: ${errorDescription}`);
        win.webContents.executeJavaScript(`alert("Erro ao carregar a página: ${errorDescription} : ${validatedURL}");`);
    });
}

async function runTestOnce(test, config, base, event, lastTest) {
    let result;

    result = await base.goto(test.url);
    result.actionType = 'navigate';
    lastTest.tests.push(result);

    if (result.fail) {
        event.sender.send('test-failed', result.fail);
        return;
    }

    for (const action of test.actions) {
        if (Boolean(action.disabled)) continue;

        switch (action.type) {
            case 'type':
                result = await base.type(action.selector, action.text);
                result.actionType = 'type';
                break;
            case 'fill':
                result = await base.fill(action.selector, action.text);
                result.actionType = 'fill';
                break;
            case 'click':
                result = await base.click(action.selector);
                result.actionType = 'click';
                break;
            case 'enter':
                result = await base.enter();
                result.actionType = 'enter';
                break;
            case 'navigate':
                result = await base.goto(action.selector);
                result.actionType = 'navigate';
                break;
            case 'assertText':
                result = await base.assertText(action.selector, action.text);
                result.actionType = 'assertText';
                break;
            case 'waitForVisible':
                result = await base.waitForVisible(action.selector, true);
                result.actionType = 'waitForVisible';
                break;
            case 'waitForNotVisible':
                result = await base.waitForVisible(action.selector, false);
                result.actionType = 'waitForNotVisible';
                break;
            default:
                throw new Error('Nenhuma ação foi encontrada');
        }

        lastTest.tests.push(result);
        if (result.fail) {
            event.sender.send('test-failed', result.fail);
            break;
        }
    }
}

ipcMain.on('start-puppeteer', async (event, { test, config }) => {
    console.log('Iniciando automação no Puppeteer!');
    console.log(test);
    console.log(config);

    process.env.ELECTRON_START = 'puppeteer';

    const electronPath = process.execPath;

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

    const lastTest = {
        tests: [],
        totalTime: 0,
        lastScreenshot: null,
    };
    let isClose = true;
    let isLastScreenshot = false;
    let iterationCount = 1;
    let isMobile = false;

    // configs
    if (config) {
        base.navigateTimeout = config.navigateTimeout;
        base.defaultTimeout = config.defaultTimeout;
        base.page.setDefaultTimeout(base.defaultTimeout);
        base.navigateWaitUntil = config.navigateWaitUntil;
        base.selectedScreenshot = config.selectedScreenshot;
        isClose = config.isCloseBrowser;
        isLastScreenshot = config.selectedScreenshot === 'lastScreenshot';
        base.fullScreenshot = config.fullScreenshot;
        iterationCount = config.iteration;
        isMobile = config.isMobile;
    }

    if (isMobile) {
        await page.setViewport({
            width: 375,
            height: 720,
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        });
    }

    try {
        for (let i = 0; i < iterationCount; i++) {
            const client = await page.createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await runTestOnce(test, config, base, event, lastTest);
        }
    } catch (error) {
        console.error('Erro no Puppeteer:', error);
        event.sender.send('test-failed', error);
    } finally {
        if (isLastScreenshot) {
            const lastScreenshot = await base.screenshotWithBase64();
            lastTest.lastScreenshot = lastScreenshot;
        }
        const executionTime = lastTest.tests.reduce((sum, current) => {
            return sum + (current.executionTime || 0);
        }, 0);
        lastTest.totalTime = executionTime;
        console.log(`O teste levou ${executionTime} ms para executar.`);
        event.sender.send('enable-start-button');
        event.sender.send('test-completed', lastTest);

        if (isClose) {
            await browser.close();
            await browser.disconnect();
            if (electronProcess) {
                electronProcess.kill();
            }
        }
    }

});

ipcMain.on('about', async (event) => {
    createAboutWindow();
});

ipcMain.on('config', async (event) => {
    createConfigWindow();
});

ipcMain.on('report', async (event) => {
    createReportWindow();
});

ipcMain.handle('load-example', async (event, exampleName) => {
    try {
        const filePath = path.join(__dirname, 'examples', `${exampleName}.json`);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        return data;
    } catch (err) {
        console.error('Erro ao carregar exemplo:', err);
        return null;
    }
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
    globalShortcut.register('F12', () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
        }
    });

    globalShortcut.register('Ctrl+Shift+I', () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
        }
    });
    if (process.env.ELECTRON_START === 'puppeteer') {
        createBusyWindow();
    } else {
        createWindow();
    }
});