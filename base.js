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
    fullScreenshot = false;

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
        const description = `Clique no seletor ${selector}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            await this.page.click(selector);
            success = 'Clique realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao clicar: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async waitForSelector(selector, isVisible = true) {
        try {
            let element;
            if (isVisible) {
                element = await this.page.waitForSelector(selector, { visible: true });
            } else {
                element = await this.page.waitForSelector(selector, { hidden: true });
            }
            console.log('Seletor aguardando espera com sucesso!');
            return element;
        } catch (err) {
            throw err;
        }
    }

    async clickByXpath(selector) {
        try {
            await this.waitForSelector(selector);
            await this.page.click(`::-p-xpath(${selector})`);
            console.log('Clique realizado com sucesso!');
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
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async screenshot(screenshotName = 'screenshot') {
        try {
            await this.page.screenshot({ path: `${screenshotName}.png`, fullPage: this.fullScreenshot });
            console.log('Screenshot tirada com sucesso!');
        } catch (err) {
            throw err;
        }
    }

    async screenshotWithBase64() {
        try {
            const screenshotBase64 = await this.page.screenshot({ encoding: 'base64', fullPage: this.fullScreenshot });
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

    async waitForVisible(selector, isVisible) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Aguardar o seletor ${selector}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector, isVisible);
            success = 'Espera aguardada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao aguardar: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async clear(selector) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Limpar o seletor ${selector}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            await this.page.click(selector, { count: 3 });
            await this.page.keyboard.press('Backspace');
            success = 'Limpeza realizada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao limpar: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async reload() {
        const startTime = Date.now();
        let executionTime = 0;
        const description = 'Atualizar página';
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            await this.page.reload({ waitUntil: this.navigateWaitUntil, timeout: this.navigateTimeout });
            success = 'Página atualizada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao atualizar página: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async select(selector, value) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Selecionar no seletor ${selector} com valor ${value}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            selector = this.getSelectorWithXpath(selector);
            await this.waitForSelector(selector);
            await this.page.select(selector, value);
            success = 'Seleção realizada com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao digitar: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async dragAndDrop(fromElement, toElement) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Arrastar o seletor com ${fromElement} e soltar com seletor ${toElement}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            fromElement = this.getSelectorWithXpath(fromElement);
            toElement = this.getSelectorWithXpath(toElement);
            await this.dragDrop(fromElement, toElement);
            success = 'Arrastar e soltar realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao arrastar e soltar: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async dragDrop(fromElement, toElement) {
        const startElement = await this.waitForSelector(fromElement);
        const targetElement = await this.waitForSelector(toElement);
        const startBoundingBox = await startElement.boundingBox();
        const targetBoundingBox = await targetElement.boundingBox();
        const startX = startBoundingBox.x + startBoundingBox.width / 2;
        const startY = startBoundingBox.y + startBoundingBox.height / 2;
        const endX = targetBoundingBox.x + targetBoundingBox.width / 2;
        const endY = targetBoundingBox.y + targetBoundingBox.height / 2;
        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();
        await this.page.mouse.move(endX, endY, { steps: 10 });
        await this.page.mouse.up();
    }

    async iframeType(iframeSelector, selector, text) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Digitar o seletor com ${selector}, iframe selector ${iframeSelector} com texto ${text}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            iframeSelector = this.getSelectorWithXpath(iframeSelector);
            selector = this.getSelectorWithXpath(selector);
            await this.handleIframeType(iframeSelector, selector, text);
            success = 'Digitar com iframe realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao digitar com iframe: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async handleIframeType(iframeSelector, selector, text) {
        const frame = await this.findFrame(iframeSelector);
        if (frame) {
            const elementHandle = await frame.$(selector);
            if (elementHandle) {
                await elementHandle.type(text);
            } else {
                throw new Error(`Elemento ${selector} não encontrado no iframe`);
            }
        } else {
            throw new Error(`Iframe com seletor ${iframeSelector} não encontrado`);
        }
    }

    async findFrame(selector) {
        const frameHandle = await this.waitForSelector(selector);
        if (frameHandle) {
            const frame = await frameHandle.contentFrame();
            return frame;
        }
        return null;
    }

    async clickWaitForResponse(selector, urlPattern) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Clique no seletor ${selector} e aguarde a resposta da url ${urlPattern}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            const regexPattern = new RegExp(urlPattern.replace(/\*\*/g, '.*?'));
            const responsePromise = this.page.waitForResponse(response =>
                regexPattern.test(response.url())
            );
            await this.click(selector);
            await responsePromise;
            success = 'Clique realizado e espera pela resposta feito com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao realizar clique e esperar a URL ${urlPattern}: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async iframeClick(iframeSelector, selector) {
        const startTime = Date.now();
        let executionTime = 0;
        const description = `Clicar no seletor ${selector} dentro do iframe ${iframeSelector}`;
        let success = null;
        let fail = null;
        let screenshot = null;
        try {
            iframeSelector = this.getSelectorWithXpath(iframeSelector);
            selector = this.getSelectorWithXpath(selector);
            await this.handleIframeClick(iframeSelector, selector);
            success = 'Clique no iframe realizado com sucesso!';
            console.log(success);
        } catch (err) {
            fail = `Erro ao clicar no iframe: ${err}`;
            console.error(fail);
        } finally {
            const endTime = Date.now();
            executionTime = endTime - startTime;
            screenshot = await this.getScreenshot();
        }
        return { executionTime, description, success, fail, screenshot }
    }

    async handleIframeClick(iframeSelector, selector) {
        const frame = await this.findFrame(iframeSelector);
        if (frame) {
            const elementHandle = await frame.$(selector);
            if (elementHandle) {
                await elementHandle.click();
            } else {
                throw new Error(`Elemento ${selector} não encontrado no iframe`);
            }
        } else {
            throw new Error(`Iframe com seletor ${iframeSelector} não encontrado`);
        }
    }
}