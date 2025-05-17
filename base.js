// Importando o Puppeteer
/**
 * @typedef {import('puppeteer-core').Page} Page
 */

export class Base {
    constructor(page) {
        this.page = page;
        this.page.setDefaultTimeout(this.defaultTimeout);
    }

    /** @type {Page} */
    page;

    defaultTimeout = 10000;
    navigateTimeout = 15000;
    navigateWaitUntil = 'domcontentloaded';
    selectedScreenshot = 'everyScreenshot';

    async goto(url) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Navegação para ${url}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            const isUrlAccessible = await this.checkUrl(url);
            if (!isUrlAccessible) {
                throw new Error(`Falha ao acessar a URL: ${url}`);
            }
            await this.page.goto(url, { waitUntil: this.navigateWaitUntil, timeout: this.navigateTimeout });
            success = 'Navegação realizada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro na navegação: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async click(selector) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Click no seletor ${selector}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            await this.page.click(selector);
            success = 'Click realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao clicar: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async waitForSelector(selector) {
        try {
            const element = await this.page.waitForSelector(selector, { visible: true });
            console.log('Seletor encontrado com sucesso!');
            return element;
        } catch (err) {
            throw err;
        }
    }

    async clickByXpath(selector) {
        try {
            await this.waitForSelector(selector);
            await this.page.click(`::-p-xpath(${selector})`);
            console.log('Click realizado com sucesso!');
        } catch (err) {
            throw err;
        }
    }

    async type(selector, text) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Digitar no seletor ${selector} com texto ${text}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            await this.page.type(selector, text);
            success = 'Digitação realizada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao digitar: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async typeByXpath(selector) {
        try {
            await this.waitForSelector(selector);
            await this.page.type(`::-p-xpath(${selector})`, text);
            console.log('Digitação realizada com sucesso!');
        } catch (err) {
            throw err;
        }
    }

    async fill(selector, text) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Preencher no seletor ${selector} com texto ${text}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            const locator = this.page.locator(selector);
            await locator.fill(text);
            success = 'Preenchimento realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao preencher: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async screenshot(screenshotName = 'screenshot') {
        try {
            await this.page.screenshot({ path: `${screenshotName}.png`, fullPage: true });
            console.log('Screenshot tirada com sucesso!');
        } catch (err) {
            throw err;
        }
    }

    async screenshotWithBase64() {
        try {
            const screenshotBase64 = await this.page.screenshot({ encoding: 'base64', fullPage: true });
            console.log('Screenshot base64 tirada com sucesso!');
            return `data:image/png;base64,${screenshotBase64}`;
        } catch (err) {
            throw err;
        }
    }

    async getText(selector) {
        try {
            const element = await this.waitForSelector(selector);
            console.log('Texto encontrado com sucesso!');
            return this.page.evaluate(el => el.textContent, element);
        } catch (err) {
            throw err;
        }
    }

    async assertText(selector, expectedText) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Validar texto no seletor ${selector} com texto ${expectedText}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            const actualText = await this.getText(selector);
            if (actualText.trim() !== expectedText) {
                throw new Error(`Falha na asserção: esperado "${expectedText}", mas recebido "${actualText}"`);
            }
            success = `Asserção bem-sucedida: "${actualText}" corresponde a "${expectedText}"`;
            console.log(success);
        } catch (err) {
            fail = `Erro ao validar texto: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async enter() {
        const startTime = Date.now();
        let executionTime = 0;
        const description = 'Pressionando a tecla Enter';
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            await this.page.keyboard.press('Enter');
            success = 'Tecla enter pressionada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao teclar Enter: ${err}`;
            console.error(fail);
            throw fail;
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async checkUrl(url) {
        try {
            const response = await fetch(url);
            return response.status === 200;
        } catch (err) {
            console.error(`Erro ao verificar a URL ${url}:`, err);
            return false;
        }
    }

    getSelectorWithXpath(originalSelector) {
        const selector = originalSelector.startsWith('//') || originalSelector.startsWith('(')
            ? `::-p-xpath(${originalSelector})`
            : originalSelector;
        return selector;
    }

    async getScreenshot() {
        if (this.selectedScreenshot === 'everyScreenshot') {
            return await this.screenshotWithBase64();
        }
        return null;
    }
}