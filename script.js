new Vue({
    el: '#app',
    data: {
        isDisabled: false,
        testNotification: false,
        testFail: '',
        workspace: {
            id: '',
            name: '',
            test: {
                url: '',
                actions: []
            }
        },
        modalAction: false,
        actions: [
            { type: 'click', name: 'Clicar' },
            { type: 'fill', name: 'Preencher' },
            { type: 'type', name: 'Digitar' },
            { type: 'enter', name: 'Enter' },
            { type: 'navigate', name: 'Navegar' },
            { type: 'assertText', name: 'Validar texto' },
            { type: 'waitForVisible', name: 'Aguardar elemento aparecer' },
            { type: 'waitForNotVisible', name: 'Aguardar elemento desaparecer' },
            { type: 'clear', name: 'Limpar' },
            { type: 'reload', name: 'Atualizar página' },
            { type: 'select', name: 'Select' },
            { type: 'dragAndDrop', name: 'Arrastar e Soltar' },
            { type: 'iframeType', name: 'Digitar no iframe' },
            { type: 'clickWaitForResponse', name: 'Clique e espera pela resposta' }
        ],
        searchTerm: '',
        actionCurrent: null,
        modalConfigAction: false,
        actionForm: {
            selector: '',
            text: '',
            selector2: ''
        },
        editIndex: null,
        modalDeleteConfirm: false,
        deleteIndex: null,
        totalTime: 0,
        modalUrlList: false,
        urls: [],
        newUrl: '',
        editUrlIndex: null,
        isModalInfo: false,
    },
    mounted() {
        window.electron.ipcRenderer.on('enable-start-button', () => {
            this.isDisabled = false;
        });
        window.electron.ipcRenderer.on('test-failed', (message) => {
            this.testFail = message;
        });
        window.electron.ipcRenderer.on('test-completed', (lastTest) => {
            this.saveLastTest(lastTest);
            this.testNotification = true;
        });
        this.recoveryTest();
    },
    watch: {
        'workspace.test': {
            handler(newTest) {
                if (this.selectedWorkspaceIndex !== null) {
                    const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
                    if (workspaces[this.selectedWorkspaceIndex]) {
                        workspaces[this.selectedWorkspaceIndex].test = newTest;
                        localStorage.setItem('workspaces', JSON.stringify(workspaces));
                    }
                }
            },
            deep: true
        }
    },
    computed: {
        filteredActions() {
            return this.actions.filter(action =>
                action.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        },
        isValidActionForm() {
            if (this.actionCurrent?.type === 'enter' || this.actionCurrent?.type === 'reload') return true;
            if (!this.actionForm.selector.trim()) return false;
            if (['fill', 'type', 'assertText', 'select', 'dragAndDrop', 'iframeType', 'clickWaitForResponse'].includes(this.actionCurrent?.type)) {
                return !!this.actionForm.text.trim();
            }
            if (['iframeType'].includes(this.actionCurrent?.type)) {
                return !!this.actionForm.selector2.trim();
            }
            return true;
        },
        actionLabel() {
            if (this.actionCurrent?.type === 'navigate') {
                return 'URL';
            } else {
                return 'Seletor';
            }
        },
        actionPlaceholder() {
            if (this.actionCurrent?.type === 'navigate') {
                return 'Ex: https://meusite.com';
            } else {
                return 'Ex: #meu-seletor';
            }
        },
        textPlaceholder() {
            if (this.actionCurrent?.type === 'assertText') {
                return 'Texto a validar';
            } else if (this.actionCurrent?.type === 'fill' || this.actionCurrent?.type === 'type' || this.actionCurrent?.type === 'iframeType') {
                return 'Texto a digitar';
            } else if (this.actionCurrent?.type === 'select' || this.actionCurrent?.type === 'dragAndDrop') {
                return 'Valor';
            } else if (this.actionCurrent?.type === 'clickWaitForResponse') {
                return 'Ex: **/api/path/**';
            }
            return '';
        }
    },
    methods: {
        getConfig() {
            const configStr = localStorage.getItem('confige2e');
            try {
                return JSON.parse(configStr);
            } catch (e) {
                console.error('Config inválido:', e);
                return {};
            }
        },
        startTest() {
            this.isDisabled = true;
            this.testNotification = false;
            this.testFail = '';
            this.removeLastTest();
            window.electron.ipcRenderer.send('start-puppeteer', { test: this.workspace.test, config: this.getConfig() });
        },
        showAbout() {
            window.electron.ipcRenderer.send('about');
        },
        toggleMenu() {
            const target = document.getElementById('navbarBasicExample');
            target.classList.toggle('is-active');
        },
        closeNotification() {
            this.testNotification = false;
        },
        recoveryTest() {
            const index = localStorage.getItem('selectedWorkspaceIndex');
            if (index !== null) {
                this.selectedWorkspaceIndex = parseInt(index);
                const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
                if (workspaces[this.selectedWorkspaceIndex]) {
                    this.workspace = workspaces[this.selectedWorkspaceIndex];
                }
            }
        },
        toggleModalAction() {
            this.modalAction = !this.modalAction;
            if (this.modalAction) {
                this.$nextTick(() => {
                    const modalBody = document.getElementById('modal-card-body');
                    if (modalBody) {
                        modalBody.scrollTop = 0;
                    }
                });
                this.searchTerm = '';
            }
        },
        closeModalAction() {
            this.modalAction = false;
            this.searchTerm = '';
        },
        selectAction(action) {
            this.actionCurrent = action;
            this.actionForm = { selector: '', text: '', selector2: '' };
            this.modalConfigAction = true;
        },
        editAction(index) {
            const action = this.workspace.test.actions[index];
            this.editIndex = index;
            this.actionCurrent = this.actions.find(a => a.type === action.type);
            this.actionForm = {
                selector: action.selector || '',
                text: action.text || '',
                selector2: action.selector2 || ''
            };
            this.modalConfigAction = true;
        },
        deleteAction(index) {
            this.workspace.test.actions.splice(index, 1);
        },
        confirmAction() {
            const actionToSave = {
                type: this.actionCurrent.type,
                selector: this.actionForm.selector,
                text: this.actionForm.text || '',
                selector2: this.actionForm.selector2 || '',
                disabled: false
            };

            if (this.actionCurrent.type !== 'enter' && this.actionCurrent.type !== 'reload') {
                actionToSave.selector = this.actionForm.selector;
                if (this.actionForm.text) {
                    actionToSave.text = this.actionForm.text;
                }
                if (this.actionForm.selector2) {
                    actionToSave.selector2 = this.actionForm.selector2;
                }
            }

            if (this.editIndex !== null) {
                this.$set(this.workspace.test.actions, this.editIndex, actionToSave);
                this.editIndex = null;
            } else {
                this.workspace.test.actions.push(actionToSave);
            }

            this.closeModalConfig();
            this.closeModalAction();
        },
        closeModalConfig() {
            this.modalConfigAction = false;
            this.actionForm = { selector: '', text: '', selector2: '' };
            this.actionCurrent = null;
            this.editIndex = null;
        },
        showModalDeleteConfirm(index) {
            this.deleteIndex = index;
            this.modalDeleteConfirm = true;
        },
        closeModalDeleteConfirm() {
            this.modalDeleteConfirm = false;
            this.deleteIndex = null;
        },
        confirmDeleteAction() {
            if (this.deleteIndex !== null) {
                this.workspace.test.actions.splice(this.deleteIndex, 1);
            }
            this.closeModalDeleteConfirm();
        },
        removeSelectedWorkspace() {
            localStorage.removeItem('selectedWorkspaceIndex');
            window.location.href = 'workspaces.html';
        },
        openTestConfig() {
            window.electron.ipcRenderer.send('config');
        },
        saveLastTest(lastTest) {
            this.totalTime = this.formatExecutionTime(lastTest.totalTime);
            localStorage.setItem('lastTest', JSON.stringify(lastTest));
        },
        getLastTest() {
            const lastTest = JSON.parse(localStorage.getItem('lastTest') || '[]');
            return lastTest;
        },
        removeLastTest() {
            this.totalTime = 0;
            localStorage.removeItem('lastTest');
        },
        formatExecutionTime(ms) {
            if (ms < 1000) {
                return `${ms.toFixed(2)}ms`;
            }
            const seconds = ms / 1000;
            return `${seconds.toFixed(2)}s`;
        },
        openLastTestReport() {
            window.electron.ipcRenderer.send('report');
        },
        openUrlModal() {
            this.loadUrls();
            this.modalUrlList = true;
            this.newUrl = '';
            this.editUrlIndex = null;
            this.$nextTick(() => {
                const modalBody = this.$refs.modalBody;
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            });
        },
        closeUrlModal() {
            this.modalUrlList = false;
        },
        loadUrls() {
            const saved = localStorage.getItem('savedUrls');
            this.urls = saved ? JSON.parse(saved) : [];
        },
        saveUrls() {
            localStorage.setItem('savedUrls', JSON.stringify(this.urls));
        },
        addUrl() {
            const url = this.newUrl.trim();
            if (!url) return;
            if (this.editUrlIndex !== null) {
                this.urls.splice(this.editUrlIndex, 1, url);
            } else {
                this.urls.push(url);
            }
            this.saveUrls();
            this.newUrl = '';
            this.editUrlIndex = null;
        },
        editUrl(index) {
            this.newUrl = this.urls[index];
            this.editUrlIndex = index;
            this.$nextTick(() => {
                const input = this.$refs.urlInput;
                if (input) {
                    input.scrollIntoView({ behavior: 'auto', block: 'start' });
                    input.focus();
                }
            });
        },
        deleteUrl(index) {
            this.urls.splice(index, 1);
            this.saveUrls();
        },
        selectUrl(url) {
            this.workspace.test.url = url;
            this.closeUrlModal();
        },
        duplicateAction(index) {
            const actionToDuplicate = this.workspace.test.actions[index];
            const newAction = {
                ...actionToDuplicate,
                selector: actionToDuplicate.selector,
                text: actionToDuplicate.text,
                selector2: actionToDuplicate.selector2,
                disabled: false,
            };
            this.workspace.test.actions.splice(index + 1, 0, newAction);
        },
    },
    beforeDestroy() {
        window.electron.ipcRenderer.removeAllListeners('enable-start-button');
    }
});