const puppeteer = require('puppeteer-core');
const childProcess = require('child_process');
const path = require('path');

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

(async () => {
    const electronPath = require('electron');
    const electronProcess = childProcess.spawn(electronPath, ['.', '--remote-debugging-port=9222']);
    await delay(2000);

    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });

    const pages = await browser.pages();
    const page = pages[0];

    await page.goto('https://front.serverest.dev');

    page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('Screenshot tirada com sucesso!');

    await delay(2000);
    await browser.disconnect();
    electronProcess.kill();
})();