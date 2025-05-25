new Vue({
    el: '#app',
    data: {
        isDisabled: false,
        testNotification: false,
        testFail: '',
        totalTime: 0,
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
        deleteIndex: null,
        isModalInfo: false,
    },
    computed: {
        isApiTestValid() {
            return this.apiTest.url && this.apiTest.method && this.apiTest.expectStatusCode;
        },
        hasEnabledTests() {
            return this.apiTests.some(test => !test.disabled);
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
                properties: [],
                disabled: false,
            };
            this.editIndex = null;
            this.apiTestModal = true;
            this.resetScrollModal();
        },
        resetScrollModal() {
            this.$nextTick(() => {
                const modalBody = document.getElementById('modal-card-body');
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            });
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
        addBodyField() {
            this.tempBodyFields.push({ key: '', value: '', disabled: false });
        },
        removeBodyField(index) {
            this.tempBodyFields.splice(index, 1);
        },
        toggleBodyFieldDisable(index) {
            const field = this.tempBodyFields[index];
            field.disabled = !field.disabled;
        },
        addPropertyField() {
            this.tempProperties.push({ key: '', value: '', disabled: false });
        },
        removePropertyField(index) {
            this.tempProperties.splice(index, 1);
        },
        togglePropertyFieldDisable(index) {
            const field = this.tempProperties[index];
            field.disabled = !field.disabled;
        },
        editTest(index) {
            const test = this.apiTests[index];
            this.apiTest = { ...test };

            this.tempBodyFields = test.bodyFields.map(field => ({ ...field }));
            this.tempProperties = test.properties.map(prop => ({ ...prop }));

            this.editIndex = index;
            this.apiTestModal = true;
            this.resetScrollModal();
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
            this.isDisabled = true;
            this.testNotification = false;
            this.testFail = '';
            window.electron.ipcRenderer.send('start-api-tests', this.apiTests);
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
        },
        cleanFields(fields) {
            return (fields || []).map(f => {
                const { disabled, ...rest } = f;
                return rest;
            });
        },
        openLastTestReport() {
            window.electron.ipcRenderer.send('report');
        },
    },
    mounted() {
        window.electron.ipcRenderer.on('enable-start-button', () => {
            this.isDisabled = false;
        });
        window.electron.ipcRenderer.on('test-failed', (error) => {
            this.testFail = error;
            this.testNotification = true;
        });
        window.electron.ipcRenderer.on('test-completed', (lastTest) => {
            //salvar teste aqui
            this.testNotification = true;
        });
        this.loadApiTests();
    }
});