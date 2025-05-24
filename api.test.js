const puppeteer = require('puppeteer-core');
const childProcess = require('child_process');
const path = require('path');
const { ApiBase } = require('./api-base');
const { ApiDetail } = require('./api-detail');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {
    const electronPath = require('electron');
    const electronProcess = childProcess.spawn(electronPath, ['.', '--remote-debugging-port=9222']);
    await delay(2000);

    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
    const pages = await browser.pages();
    const page = pages[0];

    const apiBase = new ApiBase(page);
    apiBase.addHeader('x-api-key', 'reqres-free-v1');

    const apiRequests = [
        new ApiDetail('https://postman-echo.com/get', 'GET', null, 'application/json', 200),
        new ApiDetail('https://postman-echo.com/post', 'POST', [{ key: '.foo', value: 'FOO' }, { key: '.bar', value: 'BAR' }], 'application/json', 200, [{ key: 'data.foo', value: 'FOO' }, { key: 'data.bar', value: 'BAR2' }]),
        new ApiDetail('https://reqres.in/api/users/2', 'PUT', [{ key: '.name', value: 'NAME' }, { key: '.job', value: 'JOB' }], 'application/json', 200),
        new ApiDetail('https://reqres.in/api/login', 'POST', [{ key: '.email', value: 'george.bluth@reqres.in' }, { key: '.password', value: 'PASSWORD' }], 'application/json', 200),
        new ApiDetail('https://reqres.in/api/users/2', 'PATCH', [{ key: '.name', value: 'NAME' }, { key: '.job', value: 'JOB' }], 'application/json', 200),
        new ApiDetail('https://postman-echo.com/delete', 'DELETE', null, 'application/json', 200),
    ];

    for (const api of apiRequests) {
        const result = await apiBase.request(api);
        console.log(`Request to ${api.url} took ${result.duration}s with error: ${result.error || 'No error'}`);
    }

    await browser.disconnect();
    electronProcess.kill();
})();