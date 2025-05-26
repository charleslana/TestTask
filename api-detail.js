export class ApiDetail {
    constructor(url, method, bodyFields, contentType, expectStatusCode, properties, extractList) {
        this.url = url;
        this.method = method;
        this.bodyFields = bodyFields || [];
        this.contentType = contentType;
        this.expectStatusCode = expectStatusCode;
        this.properties = properties || [];
        this.extractList = extractList || [];
    }
}