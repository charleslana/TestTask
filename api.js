new Vue({
    el: '#app',
    data: {
        isDisabled: false,
        testNotification: false,
        testFail: '',
        totalTime: 0,
        workspace: {},
        apiTests: [],
        apiTest: {
            url: '',
            method: 'GET',
            headers: [],
            bodyFields: [],
            contentType: 'application/json',
            expectStatusCode: 200,
            properties: [],
            extractList: [],
            disabled: false,
            validateFieldNotExists: false,
        },
        tempHeaders: [],
        tempBodyFields: [],
        tempProperties: [],
        tempExtractList: [],
        apiTestModal: false,
        editIndex: null,
        modalDeleteConfirm: false,
        deleteIndex: null,
        isModalInfo: false,
        modalCopyWorkspace: false,
        selectedWorkspace: null,
        availableWorkspaces: [],
        selectedApiIndex: null
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
                headers: [],
                bodyFields: [],
                contentType: 'application/json',
                expectStatusCode: 200,
                properties: [],
                extractList: [],
                disabled: false,
                validateFieldNotExists: false,
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
            this.apiTest.extractList = this.tempExtractList;
            this.apiTest.headers = this.tempHeaders;

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
            this.tempBodyFields.push({ key: '', value: '', disabled: false, isAlias: false });
            this.$nextTick(() => {
                const refs = this.$refs.bodyField;
                const lastEl = Array.isArray(refs) ? refs[refs.length - 1] : refs;

                console.log('Refs:', refs);
                if (lastEl && typeof lastEl.scrollIntoView === 'function') {
                    lastEl.scrollIntoView({ block: 'center' });
                    const input = lastEl?.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                } else {
                    console.warn('Elemento não encontrado para scroll:', lastEl);
                }
            });
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
            this.$nextTick(() => {
                const refs = this.$refs.propertyField;
                const lastEl = Array.isArray(refs) ? refs[refs.length - 1] : refs;

                console.log('Refs:', refs);
                if (lastEl && typeof lastEl.scrollIntoView === 'function') {
                    lastEl.scrollIntoView({ block: 'center' });
                    const input = lastEl?.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                } else {
                    console.warn('Elemento não encontrado para scroll:', lastEl);
                }
            });
        },
        removePropertyField(index) {
            this.tempProperties.splice(index, 1);
        },
        togglePropertyFieldDisable(index) {
            const field = this.tempProperties[index];
            field.disabled = !field.disabled;
        },
        addHeaderField() {
            this.tempHeaders.push({ key: '', value: '', disabled: false, isAlias: false });
            this.$nextTick(() => {
                const refs = this.$refs.headerField;
                const lastEl = Array.isArray(refs) ? refs[refs.length - 1] : refs;

                if (lastEl && typeof lastEl.scrollIntoView === 'function') {
                    lastEl.scrollIntoView({ block: 'center' });
                    const input = lastEl?.querySelector('input');
                    if (input) input.focus();
                }
            });
        },
        removeHeaderField(index) {
            this.tempHeaders.splice(index, 1);
        },
        toggleHeaderDisable(index) {
            this.tempHeaders[index].disabled = !this.tempHeaders[index].disabled;
        },
        editTest(index) {
            const test = this.apiTests[index];
            this.apiTest = { ...test };

            this.tempBodyFields = test.bodyFields.map(field => ({ ...field }));
            this.tempProperties = test.properties.map(prop => ({ ...prop }));
            this.tempExtractList = (test.extractList || []).map(item => ({ ...item }));
            this.tempHeaders = test.headers?.map(h => ({ ...h })) || [];

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
                    this.workspace = workspaces[selectedIndex];
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
            this.tempExtractList = [];
            this.tempHeaders = [];
        },
        startTest() {
            this.isDisabled = true;
            this.testNotification = false;
            this.testFail = '';
            window.electron.ipcRenderer.send('start-api-tests', { apiRequests: this.apiTests, config: this.getConfig() });
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
        openLastTestReport() {
            window.electron.ipcRenderer.send('report-api');
        },
        formatExecutionTime(ms) {
            if (ms < 1000) {
                return `${ms.toFixed(2)}ms`;
            }
            const seconds = ms / 1000;
            return `${seconds.toFixed(2)}s`;
        },
        saveLastTest(lastTest) {
            this.totalTime = this.formatExecutionTime(lastTest.totalTime);
            localStorage.setItem('lastApiTest', JSON.stringify(lastTest));
        },
        getConfig() {
            const configStr = localStorage.getItem('configapi');
            try {
                return JSON.parse(configStr);
            } catch (e) {
                console.error('Config inválido:', e);
                return {};
            }
        },
        openTestConfig() {
            window.electron.ipcRenderer.send('config-api');
        },
        addExtractField() {
            this.tempExtractList.push({ key: '', alias: '' });
            this.$nextTick(() => {
                const refs = this.$refs.aliasField;
                const lastEl = Array.isArray(refs) ? refs[refs.length - 1] : refs;

                console.log('Refs:', refs);
                if (lastEl && typeof lastEl.scrollIntoView === 'function') {
                    lastEl.scrollIntoView({ block: 'center' });
                    const input = lastEl?.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                } else {
                    console.warn('Elemento não encontrado para scroll:', lastEl);
                }
            });
        },
        removeExtractField(index) {
            this.tempExtractList.splice(index, 1);
        },
        copyToAnotherWorkspace(apiIndex) {
            const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
            const selectedWorkspaceIndex = parseInt(localStorage.getItem('selectedWorkspaceIndex'));
            this.availableWorkspaces = workspaces.reduce((acc, ws, wsIndex) => {
                if (ws.testType === 'api' && wsIndex !== selectedWorkspaceIndex) {
                    acc.push({ index: wsIndex, workspace: ws });
                }
                return acc;
            }, []);
            this.selectedWorkspace = null;
            this.selectedApiIndex = apiIndex;
            this.modalCopyWorkspace = true;
        },
        closeCopyModal() {
            this.modalCopyWorkspace = false;
        },
        copyActionToWorkspace() {
            const apiToCopy = this.apiTests[this.selectedApiIndex];
            const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
            const targetWorkspace = workspaces[this.selectedWorkspace];
            if (targetWorkspace) {
                if (!targetWorkspace.apiTests) {
                    targetWorkspace.apiTests = [];
                }
                targetWorkspace.apiTests.push(JSON.parse(JSON.stringify(apiToCopy)));
                localStorage.setItem('workspaces', JSON.stringify(workspaces));
            }
            alert('API copiada com sucesso!');
            this.closeCopyModal();
        }
    },
    mounted() {
        window.electron.ipcRenderer.on('enable-start-button', () => {
            this.isDisabled = false;
        });
        window.electron.ipcRenderer.on('test-failed', (error, lastTest) => {
            this.saveLastTest(lastTest);
            this.testFail = error;
            this.testNotification = true;
        });
        window.electron.ipcRenderer.on('test-completed', (lastTest) => {
            this.saveLastTest(lastTest);
            this.testNotification = true;
        });
        this.loadApiTests();
    }
});