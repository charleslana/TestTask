// Importando o Puppeteer
/**
 * @typedef {import('puppeteer-core').Page} Page
 */

export class ApiBase {
    constructor(page) {
        this.page = page;
        this.page.setDefaultTimeout(this.defaultTimeout);
    }

    /** @type {Page} */
    page;

    defaultTimeout = 10000;
    customHeaders = {};

    async request(api) {
        const startTime = Date.now();
        let duration = 0;
        let error;
        try {
            await this.page.setRequestInterception(true);
            this.requestData(api);
            const response = await this.page.goto(api.url);
            if (response) {
                if (response.status() !== api.expectStatusCode) {
                    throw new Error(
                        `Falha na requisição ${api.method} para ${response.url()}. Status ${response.status()}. Response ${await response.text()}`
                    );
                }
                console.log(await this.getLog(response));
                if (api.properties) {
                    const responseBody = await response.json();
                    this.validateProperties(responseBody, api.properties);
                }
                console.log(`Sucesso na requisição ${api.method}`);
            } else {
                throw new Error(`Não foi possível obter resposta da requisição ${api.method}`);
            }
        } catch (e) {
            error = `Erro durante a execução da requisição ${api.method}: ${e}`;
            console.log(error);
        } finally {
            const endTime = Date.now();
            duration = (endTime - startTime) / 1000;
            await this.page.setRequestInterception(false);
        }
        return { duration, error };
    }

    validateProperties(responseData, properties) {
        if (!properties || !properties.length) {
            return; // Retorne se não houver propriedades
        }

        for (const { key, value: expectedValue } of properties) {
            console.log(`Verificando propriedade: ${key}, valor esperado:`, expectedValue);

            if (!(key in responseData)) {
                throw new Error(`A propriedade '${key}' não está presente na resposta da API.`);
            }

            const actualValue = JSON.stringify(responseData[key]);

            // Se o valor esperado for um objeto, vamos compará-los como strings
            if (typeof expectedValue === 'object' && expectedValue !== null) {
                if (typeof actualValue !== 'object' || actualValue === null) {
                    throw new Error(`A propriedade '${key}' esperava um objeto, mas recebeu um ${typeof actualValue}.`);
                }
                // Comparando objetos
                if (actualValue !== expectedValue) {
                    throw new Error(`Valor da propriedade '${key}' é '${actualValue}', mas esperado '${expectedValue}'.`);
                }
            } else {
                // Validação de igualdade simples
                if (actualValue !== expectedValue) {
                    throw new Error(`Valor da propriedade '${key}' é '${actualValue}', mas esperado '${expectedValue}'.`);
                }
            }
        }
        console.log('Propriedades validadas com sucesso');
    }

    async requestData(api) {
        const headers = {
            Authorization: `Bearer ${api.authorization}`,
            ...this.customHeaders,
        };
        if (api.contentType === 'multipart/form-data') {
            headers['Content-Type'] = `${api.contentType}; boundary=${this.getBoundary()}`;
        } else {
            headers['Content-Type'] = api.contentType;
        }
        this.page.once('request', interceptedRequest => {
            interceptedRequest.continue({
                method: api.method,
                postData: api.bodyFields ? this.getData(api) : null,
                headers: {
                    ...interceptedRequest.headers(),
                    ...headers,
                },
            });
        });
    }

    addHeader(key, value) {
        this.customHeaders[key] = value;
    }

    getData(api) {
        const form = new FormData();
        switch (api.contentType) {
            case 'application/json':
                const jsonBody = {};
                api.bodyFields.forEach(field => {
                    jsonBody[field.key] = field.value;
                });
                return JSON.stringify(jsonBody);

            case 'application/x-www-form-urlencoded':
                const urlParams = new URLSearchParams();
                api.bodyFields.forEach(field => {
                    urlParams.append(field.key, field.value);
                });
                return urlParams.toString();

            case 'multipart/form-data':
                api.bodyFields.forEach(field => {
                    form.append(field.key, field.value);
                });
                return this.formDataToMultipartString(form);

            default:
                return '';
        }
    }

    formDataToMultipartString(formData) {
        const boundary = `----WebKitFormBoundary${Math.random().toString().substring(2)}`;
        let multipartString = '';
        for (const [key, value] of formData.entries()) {
            multipartString += `--${boundary}\r\n`;
            multipartString += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
            multipartString += `${value}\r\n`;
        }
        multipartString += `--${boundary}--`;
        return multipartString;
    }

    getBoundary() {
        return `----WebKitFormBoundary${Math.random().toString().substring(2)}`;
    }

    async getLog(response) {
        return {
            url: response.url(),
            statusCode: response.status(),
            bodyText: await response.text(),
            bodyJson: await response.json(),
        };
    }
}