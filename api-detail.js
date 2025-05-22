export class ApiDetail {
    constructor(url, type, data, contentType, expectStatusCode, properties) {
        this.url = url;
        this.type = type;
        this.data = data || {};
        this.contentType = contentType;
        this.expectStatusCode = expectStatusCode;
        this.properties = properties || [];
    }
}