export class ApiDetail {
    constructor(url, method, data, contentType, expectStatusCode, properties) {
        this.url = url;
        this.method = method;
        this.data = data || {};
        this.contentType = contentType;
        this.expectStatusCode = expectStatusCode;
        this.properties = properties || [];
    }
}