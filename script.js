//const startButton = document.getElementById('start-button');
//startButton.addEventListener('click', () => {
//    window.electron.ipcRenderer.send('start-puppeteer');
//});

//document.getElementById('about-button').addEventListener('click', () => {
//    window.electron.ipcRenderer.send('about');
//});

//window.electron.ipcRenderer.on('disable-start-button', () => {
//    startButton.disabled = true;
//});

//window.electron.ipcRenderer.on('enable-start-button', () => {
//    startButton.disabled = false;
//});

//window.electron.ipcRenderer.on('log-message', (message) => {
//    console.log(message);
//});

new Vue({
    el: '#app',
    data: {
        isDisabled: false,
        testNotification: false,
        testFail: '',
        test: {
            url: '',
            actions: []
        },
        modalAction: false,
        actions: [
            { type: 'click', name: 'Clicar' },
            { type: 'fill', name: 'Preencher' },
            { type: 'type', name: 'Digitar' },
            { type: 'enter', name: 'Enter' },
            { type: 'navigate', name: 'Navegar' },
        ],
        searchTerm: '',
        actionCurrent: null,
        modalConfigAction: false,
        actionForm: {
            selector: '',
            text: ''
        },
        editIndex: null,
        modalDeleteConfirm: false,
        deleteIndex: null
    },
    mounted() {
        window.electron.ipcRenderer.on('enable-start-button', () => {
            this.isDisabled = false;
        });
        window.electron.ipcRenderer.on('test-failed', (message) => {
            this.testFail = message;
        });
        window.electron.ipcRenderer.on('test-completed', () => {
            this.testNotification = true;
        });
        this.recoveryTest();
    },
    watch: {
        test: {
            handler(newValue) {
                localStorage.setItem('test', JSON.stringify(newValue));
            },
            deep: true
        },
    },
    computed: {
        filteredActions() {
            return this.actions.filter(action =>
                action.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        },
        isValidActionForm() {
            if (!this.actionForm.selector.trim()) return false;
            if (['fill', 'type'].includes(this.actionCurrent?.type)) {
                return !!this.actionForm.text.trim();
            }
            return true;
        }
    },
    methods: {
        startTest() {
            this.isDisabled = true;
            this.testNotification = false;
            this.testFail = '';
            window.electron.ipcRenderer.send('start-puppeteer', { test: this.test });
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
            const test = localStorage.getItem('test');
            if (test) {
                this.test = JSON.parse(test);
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
            }
        },
        selectAction(action) {
            this.actionCurrent = action;
            this.actionForm = { selector: '', text: '' };
            this.modalConfigAction = true;
        },
        editAction(index) {
            const action = this.test.actions[index];
            this.editIndex = index;
            this.actionCurrent = this.actions.find(a => a.type === action.type);
            this.actionForm = {
                selector: action.selector,
                text: action.text || ''
            };
            this.modalConfigAction = true;
        },
        deleteAction(index) {
            this.test.actions.splice(index, 1);
        },
        confirmAction() {
            const actionToSave = {
                type: this.actionCurrent.type,
                selector: this.actionForm.selector,
                text: this.actionForm.text || '',
                disabled: false
            };

            if (this.editIndex !== null) {
                this.$set(this.test.actions, this.editIndex, actionToSave);
                this.editIndex = null;
            } else {
                this.test.actions.push(actionToSave);
            }

            this.closeModalConfig();
            this.toggleModalAction();
        },
        closeModalConfig() {
            this.modalConfigAction = false;
            this.actionForm = { selector: '', text: '' };
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
                this.test.actions.splice(this.deleteIndex, 1);
            }
            this.closeModalDeleteConfirm();
        },
    },
    beforeDestroy() {
        window.electron.ipcRenderer.removeAllListeners('enable-start-button');
    }
});