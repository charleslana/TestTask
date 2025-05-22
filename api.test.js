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
        new ApiDetail('https://postman-echo.com/post', 'POST', { foo: 'FOO', bar: 'BAR' }, 'application/json', 200, { data: { foo: 'FOO', bar: 'BAR2' }, }),
        new ApiDetail('https://reqres.in/api/users/2', 'PUT', { name: 'NAME', job: 'JOB' }, 'application/json', 200),
        new ApiDetail('https://reqres.in/api/login', 'POST', { email: 'george.bluth@reqres.in', password: 'PASSWORD' }, 'application/json', 200),
        new ApiDetail('https://reqres.in/api/users/2', 'PATCH', { name: 'NAME', job: 'JOB' }, 'application/json', 200),
        new ApiDetail('https://postman-echo.com/delete', 'DELETE', null, 'application/json', 200),
    ];

    for (const api of apiRequests) {
        const result = await apiBase.request(api);
        console.log(`Request to ${api.url} took ${result.duration}s with error: ${result.error || 'No error'}`);
    }

    await browser.disconnect();
    electronProcess.kill();
})();