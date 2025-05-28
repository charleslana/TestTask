const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut, shell } = require('electron');
const path = require('path');
const childProcess = require('child_process');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { Base } = require('./base');
const packageJson = require('./package.json');
const os = require('os');
const { ApiBase } = require('./api-base');

let busyWindow;
let electronProcess;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'public/icon.png'),
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
                        label: 'Exemplos testes E2E',
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
                            },
                            {
                                label: 'Importar Exemplo Digitar',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '5-Digitar')
                            },
                            {
                                label: 'Importar Exemplo Limpar campo',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '6-Limpar campo')
                            },
                            {
                                label: 'Importar Exemplo Pressionar Enter',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '7-Exemplo Pressionar Enter')
                            },
                            {
                                label: 'Importar Exemplo Atualizar página',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '8-Exemplo Atualizar página')
                            },
                            {
                                label: 'Importar Exemplo Validação de texto',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '9-Exemplo Validação de texto')
                            },
                            {
                                label: 'Importar Exemplo Select',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '10-Exemplo Select')
                            },
                            {
                                label: 'Importar Exemplo Arrastar e Soltar',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '11-Exemplo Arrastar e Soltar')
                            },
                            {
                                label: 'Importar Exemplo Digitar Iframe',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '12-Exemplo Digitar Iframe')
                            },
                            {
                                label: 'Importar Exemplo Clique e espera resposta',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '13-Exemplo Clique e espera resposta')
                            },
                            {
                                label: 'Importar Exemplo Saucedemo',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '14-Saucedemo')
                            },
                            {
                                label: 'Importar Exemplo Clicar Iframe',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '15-Exemplo Clicar Iframe')
                            }
                        ]
                    },
                    {
                        label: 'Exemplos testes API',
                        submenu: [
                            {
                                label: 'Importar Exemplo testes de api',
                                enabled: isWorkspacePage,
                                click: () => mainWindow.webContents.send('import-example', '1000-testes de api')
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Sobre',
                submenu: [
                    {
                        label: 'Ver Informações',
                        click: () => createAboutWindow()
                    },
                    {
                        label: 'GitHub do Dev',
                        click: () => {
                            shell.openExternal('https://github.com/charleslana');
                        }
                    },
                    {
                        label: 'LinkedIn do Dev',
                        click: () => {
                            shell.openExternal('https://www.linkedin.com/in/charleslana');
                        }
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
        icon: path.join(__dirname, 'public/icon.png'),
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
        icon: path.join(__dirname, 'public/icon.png'),
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
        icon: path.join(__dirname, 'public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('config.html');
}

function createConfigApiWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        resizable: true,
        maximizable: true,
        icon: path.join(__dirname, 'public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('config-api.html');
}

function createReportWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('report.html');
}

function createReportApiWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('report-api.html');
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
            case 'clear':
                result = await base.clear(action.selector);
                result.actionType = 'clear';
                break;
            case 'reload':
                result = await base.reload();
                result.actionType = 'reload';
                break;
            case 'select':
                result = await base.select(action.selector, action.text);
                result.actionType = 'select';
                break;
            case 'dragAndDrop':
                result = await base.dragAndDrop(action.selector, action.text);
                result.actionType = 'dragAndDrop';
                break;
            case 'iframeType':
                result = await base.iframeType(action.selector2, action.selector, action.text);
                result.actionType = 'iframeType';
                break;
            case 'clickWaitForResponse':
                result = await base.clickWaitForResponse(action.selector, action.text);
                result.actionType = 'clickWaitForResponse';
                break;
            case 'iframeClick':
                result = await base.iframeClick(action.selector2, action.selector);
                result.actionType = 'iframeClick';
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

async function handleApiTests(apiRequests, apiBase) {
    const results = [];
    const allExtractedValues = {};

    for (const apiRequest of apiRequests) {
        if (apiRequest.disabled) continue;

        for (const field of apiRequest.bodyFields || []) {
            if (!field.disabled && field.isAlias) {
                const alias = field.value;
                if (allExtractedValues[alias]) {
                    field.value = allExtractedValues[alias];
                }
            }
        }

        for (const header of apiRequest.headers || []) {
            if (!header.disabled && header.key && header.value) {
                for (const [alias, value] of Object.entries(allExtractedValues)) {
                    if (header.value.includes(alias)) {
                        header.value = header.value.replace(alias, value);
                    }
                }
                apiBase.addHeader(header.key, header.value);
            }
        }

        const result = await apiBase.request(apiRequest);

        if (result.extractedValues) {
            for (const [alias, value] of Object.entries(result.extractedValues)) {
                allExtractedValues[alias] = value;
            }
        }

        results.push({
            url: apiRequest.url,
            duration: result.duration,
            error: result.error,
            success: result.success,
            description: result.description,
            screenshot: result.screenshot,
            extractedValues: result.extractedValues,
        });
    }

    return results;
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
    let isClearStorage = true;

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
        isClearStorage = config.isClearStorage;
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
            await page.goto("about:blank");
            await runTestOnce(test, config, base, event, lastTest);
            if (isClearStorage) {
                const cookies = await browser.cookies();
                for (const cookie of cookies) {
                    await browser.deleteCookie(cookie);
                }
                await page.evaluate(() => {
                    localStorage.clear();
                });
                await page.evaluate(() => {
                    sessionStorage.clear();
                });
            }
        }
    } catch (error) {
        console.error('Erro no Puppeteer:', error);
        event.sender.send('test-failed', error);
    } finally {
        if (isLastScreenshot) {
            const lastScreenshot = await base.screenshotWithBase64();
            lastTest.lastScreenshot = lastScreenshot;
        }

        if (isClose) {
            await browser.close();
            await browser.disconnect();
            if (electronProcess) {
                electronProcess.kill();
            }
        }

        const executionTime = lastTest.tests.reduce((sum, current) => {
            return sum + (current.executionTime || 0);
        }, 0);
        lastTest.totalTime = executionTime;
        console.log(`O teste levou ${executionTime} ms para executar.`);
        event.sender.send('test-completed', lastTest);
        event.sender.send('enable-start-button');
    }

});

ipcMain.on('start-api-tests', async (event, payload) => {
    const { apiRequests, config } = payload;
    console.log('Iniciando testes de API!');
    console.log(apiRequests);
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
    const apiBase = new ApiBase(page);

    const lastTest = {
        tests: [],
        totalTime: 0,
        lastScreenshot: null,
    };

    let isClose = true;
    let isLastScreenshot = false;
    let iterationCount = 1;

    // configs
    if (config) {
        apiBase.defaultTimeout = config.defaultTimeout;
        apiBase.page.setDefaultTimeout(apiBase.defaultTimeout);
        apiBase.selectedScreenshot = config.selectedScreenshot;
        isClose = config.isCloseBrowser;
        isLastScreenshot = config.selectedScreenshot === 'lastScreenshot';
        apiBase.fullScreenshot = config.fullScreenshot;
        iterationCount = config.iteration;
    }

    let hasErrors = false;
    let errors = [];

    try {
        let results = [];
        for (let i = 0; i < iterationCount; i++) {
            const iterationResults = await handleApiTests(apiRequests, apiBase);
            results.push(...iterationResults);
        }

        lastTest.tests = results;

        hasErrors = results.some(r => r.error != null);
        if (hasErrors) {
            errors = results
                .filter(r => r.error != null)
                .map(r => ({ url: r.url, error: r.error }));
        }
    } catch (error) {
        console.error('Erro ao executar testes de API:', error);
        hasErrors = true;
        errors = [{ error: 'Erro ao iniciar os testes de API' }];
    } finally {
        try {
            if (isLastScreenshot) {
                const lastScreenshot = await apiBase.screenshotWithBase64();
                lastTest.lastScreenshot = lastScreenshot;
            }
        } catch (e) {
            console.error('Erro ao capturar o screenshot final:', e);
        }

        try {
            if (isClose) {
                await browser.close();
                await browser.disconnect();
                if (electronProcess) {
                    electronProcess.kill();
                }
            }
        } catch (e) {
            console.error('Erro ao fechar o navegador/processo:', e);
        }

        const executionTime = lastTest.tests.reduce((sum, current) => {
            return sum + (current.duration || 0);
        }, 0);
        lastTest.totalTime = executionTime;

        console.log(`O teste levou ${executionTime} ms para executar.`);

        if (hasErrors) {
            event.sender.send('test-failed', errors, lastTest);
        } else {
            event.sender.send('test-completed', lastTest);
        }

        event.sender.send('enable-start-button');
    }
});

ipcMain.on('about', async (event) => {
    createAboutWindow();
});

ipcMain.on('config', async (event) => {
    createConfigWindow();
});

ipcMain.on('config-api', async (event) => {
    createConfigApiWindow();
});

ipcMain.on('report', async (event) => {
    createReportWindow();
});

ipcMain.on('report-api', async (event) => {
    createReportApiWindow();
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
            const hasBasicFields = json.name && json.version && json.testType && json.test?.actions && typeof json.test.url === 'string';
            const isValidApi = json.testType === 'api' ? Array.isArray(json.apiTests) : true;
            const isValid = hasBasicFields && isValidApi;
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

    globalShortcut.register('F5', () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.reload();
        }
    });

    if (process.env.ELECTRON_START === 'puppeteer') {
        createBusyWindow();
    } else {
        createWindow();
    }
});