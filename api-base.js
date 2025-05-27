// Importando o Puppeteer
/**
 * @typedef {import('puppeteer-core').Page} Page
 */

import { Base } from './base.js';
import { readFileSync } from 'fs';

const jsonPath = new URL('./package.json', import.meta.url);
const packageJson = JSON.parse(readFileSync(jsonPath, 'utf-8'));

export class ApiBase extends Base {
    constructor(page) {
        super(page);
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
        const description = `Requisição ${api.method} para ${api.url}`;
        let success = null;
        let screenshot = null;
        let error;
        let extractedValues;
        try {
            await this.page.setRequestInterception(true);
            this.requestData(api);
            const response = await this.page.goto(api.url);
            if (response) {
                if (response.status() !== api.expectStatusCode) {
                    throw new Error(
                        `Falha na requisição ${api.method} para ${response.url()}. Status ${response.status()} mas esperado ${api.expectStatusCode}. Response ${await response.text()}`
                    );
                }
                console.log('Resposta da requisição:');
                console.log(await this.getLog(response));
                if (api.properties) {
                    const responseBody = await response.json();
                    if (api.properties) {
                        api.properties = api.properties.map(({ key, value, disabled }) => {
                            if (key === '$' && typeof value === 'string') {
                                return { key, value: [value], disabled };
                            }
                            return { key, value, disabled };
                        });
                    }
                    this.validateProperties(responseBody, api.properties, api.validateFieldNotExists);
                    if (api.extractList && api.extractList.length > 0) {
                        extractedValues = this.extractFields(responseBody, api.extractList);
                        console.log('Campos extraídos:', extractedValues);
                    }
                }
                success = `Sucesso na requisição ${api.method}`;
                console.log(success);
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
            screenshot = await this.getScreenshot();
        }
        return { duration, error, success, description, screenshot, extractedValues };
    }

    resolvePath(obj, path) {
        const segments = path
            .replace(/\[(\d+)\]/g, '.$1')
            .replace(/^\$/, '')
            .replace(/^\./, '')
            .split('.');

        return segments.reduce((acc, segment) => {
            if (acc && typeof acc === 'object' && segment in acc) {
                return acc[segment];
            }
            return undefined;
        }, obj);
    }

    validateProperties(responseData, properties, validateFieldNotExists) {
        if (!properties || !properties.length) return;

        const validatedKeys = [];

        for (const { key, value: expectedValue, disabled } of properties) {
            if (disabled) continue;
            console.log(`Verificando propriedade: ${key}, valor esperado:`, expectedValue);

            let actualValue;

            try {
                if (key === '$') {
                    // Se root for array, usa direto
                    if (Array.isArray(responseData)) {
                        actualValue = responseData;
                    } else if (Array.isArray(responseData.data)) {
                        // Caso comum: pegar a propriedade "data" que é array
                        actualValue = responseData.data;
                    } else if (Array.isArray(responseData.json)) {
                        // Alternativa: "json" pode ter o array
                        actualValue = responseData.json;
                    } else {
                        throw new Error(`Validação com "$" exige que o root ou 'data' ou 'json' seja um array.`);
                    }
                } else if (key.startsWith('$')) {
                    // Exemplo $.data.something
                    const path = key.slice(2); // remove "$."
                    actualValue = this.resolvePath(responseData, path);
                } else if (key.startsWith('.')) {
                    const path = key.slice(1);
                    actualValue = responseData?.[path];
                } else {
                    actualValue = key.split('.').reduce((acc, part) => {
                        if (part.includes('[')) {
                            const [arr, index] = part.split(/\[|\]/).filter(Boolean);
                            return acc?.[arr]?.[parseInt(index)];
                        }
                        return acc?.[part];
                    }, responseData);
                }
            } catch (e) {
                throw new Error(`Erro ao acessar a propriedade '${key}': ${e.message}`);
            }

            if (actualValue === undefined) {
                throw new Error(`A propriedade '${key}' não está presente na resposta da API.`);
            }

            const actualStr = JSON.stringify(actualValue);
            const expectedStr = JSON.stringify(expectedValue);

            if (actualStr !== expectedStr) {
                throw new Error(`Valor da propriedade '${key}' é '${actualStr}', mas esperado '${expectedStr}'.`);
            }
        }

        if (validateFieldNotExists) {
            const flattenKeys = (obj, prefix = '') =>
                Object.keys(obj).flatMap(key => {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        return flattenKeys(obj[key], path);
                    }
                    return path;
                });

            const allKeys = flattenKeys(responseData);
            const normalizedValidatedKeys = validatedKeys
                .filter(k => k !== '$')
                .map(k => k.replace(/^\$?\./, ''));

            const extraKeys = allKeys.filter(k => !normalizedValidatedKeys.includes(k));

            if (extraKeys.length) {
                throw new Error(`A resposta da API contém propriedades não esperadas: ${extraKeys.join(', ')}`);
            }
        }

        console.log('Propriedades validadas com sucesso');
    }

    async requestData(api) {
        const headers = {
            'User-Agent': `TestTask/${packageJson.version}`,
            ...this.customHeaders,
        };
        if (api.contentType === 'multipart/form-data') {
            headers['Content-Type'] = `${api.contentType}; boundary=${this.getBoundary()}`;
        } else {
            headers['Content-Type'] = api.contentType;
        }
        this.page.once('request', interceptedRequest => {
            const requestData = {
                url: interceptedRequest.url(),
                method: api.method,
                headers: {
                    ...interceptedRequest.headers(),
                    ...headers,
                },
                body: api.bodyFields ? this.getData(api) : null,
            };

            console.log('Enviando requisição:');
            console.log(JSON.stringify(requestData, null, 2));

            interceptedRequest.continue({
                method: requestData.method,
                postData: requestData.body,
                headers: requestData.headers,
            });
        });
    }

    addHeader(key, value) {
        this.customHeaders[key] = value;
    }

    getData(api) {
        const buildNestedObject = (target, path, value) => {
            const keys = path
                .replace(/\[(\d+)\]/g, '.$1')
                .replace(/^\$/, '')
                .replace(/^\./, '')
                .split('.');

            let current = target;
            keys.forEach((key, index) => {
                const isLast = index === keys.length - 1;
                const nextKey = keys[index + 1];

                if (!isLast) {
                    const isArray = /^\d+$/.test(nextKey);
                    if (!(key in current)) {
                        current[key] = isArray ? [] : {};
                    }
                    current = current[key];
                } else {
                    current[key] = value;
                }
            });
        };

        switch (api.contentType) {
            case 'application/json':
                if (api.bodyFields.length === 1 && api.bodyFields[0].key === '$') {
                    const val = api.bodyFields[0].value;
                    if (typeof val === 'string') {
                        return JSON.stringify([val]);
                    }
                    return JSON.stringify(val);
                }
                const jsonBody = {};
                api.bodyFields.filter(field => !field.disabled).forEach(field => {
                    buildNestedObject(jsonBody, field.key, field.value);
                });
                return JSON.stringify(jsonBody);

            case 'application/x-www-form-urlencoded':
                const urlParams = new URLSearchParams();
                api.bodyFields.filter(field => !field.disabled).forEach(field => {
                    urlParams.append(field.key, field.value);
                });
                return urlParams.toString();

            case 'multipart/form-data':
                const form = new FormData();
                api.bodyFields.filter(field => !field.disabled).forEach(field => {
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

    extractFields(responseData, extractList) {
        const result = {};
        for (const { key, alias } of extractList) {
            try {
                let value;
                if (key === '$') {
                    value = Array.isArray(responseData)
                        ? responseData
                        : Array.isArray(responseData.data)
                            ? responseData.data
                            : Array.isArray(responseData.json)
                                ? responseData.json
                                : null;

                    if (!value) throw new Error(`Não é possível extrair array usando '$'.`);
                } else {
                    const normalizedPath = key
                        .replace(/^\$/, '')
                        .replace(/^\./, '')
                        .replace(/\[(\d+)\]/g, '.$1');

                    value = normalizedPath
                        .split('.')
                        .reduce((acc, part) => acc?.[part], responseData);
                }

                result[alias] = value;
            } catch (err) {
                console.warn(`Erro ao extrair "${key}" como "${alias}": ${err.message}`);
                result[alias] = undefined;
            }
        }
        return result;
    }

}