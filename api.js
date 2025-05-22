new Vue({
    el: '#app',
    data: {
        isDisabled: false,
        apiTests: [],
        apiTest: {
            url: '',
            method: 'GET',
            bodyFields: [],
            contentType: 'application/json',
            expectStatusCode: 200,
            properties: [],
            disabled: false
        },
        tempBodyFields: [],
        tempProperties: [],
        apiTestModal: false,
        editIndex: null,
        modalDeleteConfirm: false,
        deleteIndex: null
    },
    computed: {
        isApiTestValid() {
            return this.apiTest.url && this.apiTest.method && this.apiTest.expectStatusCode;
        }
    },
    methods: {
        toggleMenu() {
            const target = document.getElementById('navbarBasicExample');
            target.classList.toggle('is-active');
        },
        openApiTestModal() {
            this.apiTest = {
                url: '',
                method: 'GET',
                bodyFields: [],
                contentType: 'application/json',
                expectStatusCode: 200,
                properties: []
            };
            this.editIndex = null;
            this.apiTestModal = true;
        },
        closeApiTestModal() {
            this.apiTestModal = false;
            this.clearTempFields();
        },
        saveApiTest() {
            this.apiTest.bodyFields = this.tempBodyFields;
            this.apiTest.properties = this.tempProperties;

            if (this.editIndex !== null) {
                this.apiTests[this.editIndex] = { ...this.apiTest };
                this.editIndex = null;
            } else {
                this.apiTests.push({ ...this.apiTest });
            }
            this.closeApiTestModal();
            this.saveApiTests();
        },
        buildBody() {
            const body = {};
            this.apiTest.bodyFields.forEach(field => {
                if (field.key) {
                    body[field.key] = field.value || '';
                }
            });
            return body;
        },
        addBodyField() {
            this.tempBodyFields.push({ key: '', value: '' });
        },
        removeBodyField(index) {
            this.tempBodyFields.splice(index, 1);
        },
        addPropertyField() {
            this.tempProperties.push({ key: '', value: '' });
        },
        removePropertyField(index) {
            this.tempProperties.splice(index, 1);
        },
        editTest(index) {
            this.apiTest = { ...this.apiTests[index] };
            this.tempBodyFields = [...this.apiTest.bodyFields];
            this.tempProperties = [...this.apiTest.properties];
            this.editIndex = index;
            this.apiTestModal = true;
        },
        duplicateTest(index) {
            const testToDuplicate = { ...this.apiTests[index] };
            this.apiTests.splice(index + 1, 0, testToDuplicate);
            this.saveApiTests();
        },
        saveApiTests() {
            const selectedIndex = localStorage.getItem('selectedWorkspaceIndex');
            if (selectedIndex !== null) {
                const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
                if (workspaces[selectedIndex]) {
                    workspaces[selectedIndex].apiTests = this.apiTests;
                    localStorage.setItem('workspaces', JSON.stringify(workspaces));
                }
            }
        },
        loadApiTests() {
            const selectedIndex = localStorage.getItem('selectedWorkspaceIndex');
            if (selectedIndex !== null) {
                const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
                if (workspaces[selectedIndex]) {
                    this.apiTests = workspaces[selectedIndex].apiTests || [];
                }
            }
        },
        removeSelectedWorkspace() {
            localStorage.removeItem('selectedWorkspaceIndex');
            window.location.href = 'workspaces.html';
        },
        clearTempFields() {
            this.tempBodyFields = [];
            this.tempProperties = [];
        },
        startTest() {
            console.log('iniciando');
        },
        openModalDeleteConfirm(index) {
            this.deleteIndex = index;
            this.modalDeleteConfirm = true;
        },
        closeModalDeleteConfirm() {
            this.modalDeleteConfirm = false;
            this.deleteIndex = null;
        },
        confirmDeleteAction() {
            if (this.deleteIndex !== null) {
                this.apiTests.splice(this.deleteIndex, 1);
                this.saveApiTests();
                this.closeModalDeleteConfirm();
            }
        },
        toggleDisabled(test) {
            test.disabled = !test.disabled;
            this.saveApiTests();
        }
    },
    mounted() {
        this.loadApiTests();
    }
});