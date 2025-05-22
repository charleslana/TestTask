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
                        `Falha na requisição ${api.type} para ${response.url()}. Status ${response.status()}. Response ${await response.text()}`
                    );
                }
                console.log(await this.getLog(response));
                if (api.properties) {
                    const responseBody = await response.json();
                    this.validateProperties(responseBody, api.properties);
                }
                console.log(`Sucesso na requisição ${api.type}`);
            } else {
                throw new Error(`Não foi possível obter resposta da requisição ${api.type}`);
            }
        } catch (e) {
            error = `Erro durante a execução da requisição ${api.type}: ${e}`;
            console.log(error);
        } finally {
            const endTime = Date.now();
            duration = (endTime - startTime) / 1000;
            await this.page.setRequestInterception(false);
        }
        return { duration, error };
    }

    validateProperties(responseData, properties) {
        if (!properties || typeof properties !== 'object') return;

        for (const [key, expectedValue] of Object.entries(properties)) {
            if (!(key in responseData)) {
                throw new Error(`A propriedade '${key}' não está presente na resposta da API.`);
            }

            const actualValue = responseData[key];

            // Verifica se o valor esperado é um array
            if (Array.isArray(expectedValue)) {
                if (!Array.isArray(actualValue)) {
                    throw new Error(`A propriedade '${key}' esperava um array, mas recebeu um ${typeof actualValue}.`);
                }

                // Verifica cada item do array
                expectedValue.forEach((expectedItem, index) => {
                    if (!actualValue[index] || actualValue[index] !== expectedItem) {
                        throw new Error(`O item[${index}] da propriedade '${key}' é '${actualValue[index]}', mas esperado '${expectedItem}'.`);
                    }
                });

            } else if (typeof expectedValue === 'object' && expectedValue !== null) {
                // Verifica se o valor esperado é um objeto
                if (typeof actualValue !== 'object' || actualValue === null || Array.isArray(actualValue)) {
                    throw new Error(`A propriedade '${key}' esperava um objeto, mas recebeu um ${typeof actualValue}.`);
                }
                // Validar as propriedades do objeto
                this.validateProperties(actualValue, expectedValue);
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
                method: api.type,
                postData: this.getData(api),
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
                return JSON.stringify(api.data);
            case 'application/x-www-form-urlencoded':
                return new URLSearchParams(api.data).toString();
            case 'multipart/form-data':
                for (const key in api.data) {
                    if (Object.prototype.hasOwnProperty.call(api.data, key)) {
                        form.append(key, api.data[key]);
                    }
                }
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