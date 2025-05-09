// Importando o Puppeteer
/**
 * @typedef {import('puppeteer-core').Page} Page
 */

export class Base {
    constructor(page) {
        this.page = page;
        this.page.setDefaultTimeout(10000);
    }

    /** @type {Page} */
    page;

    async goto(url) {
        await this.page.goto(url);
        console.log('Navegação realizada com sucesso!');
    }

    async click(selector) {
        await this.waitForSelector(selector);
        await this.page.click(selector);
        console.log('Click realizado com sucesso!');
    }

    async clickByXpath(selector) {
        await this.waitForSelector(selector);
        await this.page.click(`::-p-xpath(${selector})`);
        console.log('Click realizado com sucesso!');
    }

    async type(selector, text) {
        await this.waitForSelector(selector);
        await this.page.type(selector, text);
        console.log('Digitação realizada com sucesso!');
    }

    async typeByXpath(selector) {
        await this.waitForSelector(selector);
        await this.page.type(`::-p-xpath(${selector})`, text);
        console.log('Digitação realizada com sucesso!');
    }

    async fill(selector, text) {
        await this.waitForSelector(selector);
        const locator = this.page.locator(selector);
        await locator.fill(text);
        console.log('Preenchimento realizado com sucesso!');
    }

    async screenshot() {
        await this.page.screenshot({ path: 'screenshot.png', fullPage: true });
        console.log('Screenshot tirada com sucesso!');
    }

    async waitForSelector(selector) {
        const element = await this.page.waitForSelector(selector, { visible: true });
        console.log('Seletor encontrado com sucesso!');
        return element;
    }

    async getText(selector) {
        const element = await this.waitForSelector(selector);
        console.log('Texto encontrado com sucesso!');
        return this.page.evaluate(el => el.textContent, element);
    }

    async assertText(selector, expectedText) {
        const actualText = await this.getText(selector);
        if (actualText.trim() !== expectedText) {
            throw new Error(`Falha na asserção: esperado "${expectedText}", mas recebido "${actualText}"`);
        } else {
            console.log(`Asserção bem-sucedida: "${actualText}" corresponde a "${expectedText}"`);
        }
    }

    async enter() {
        await this.page.keyboard.press('Enter');
        console.log('Tecla enter pressionada com sucesso!');
    }
}