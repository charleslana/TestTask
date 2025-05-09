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
        }
    },
    beforeDestroy() {
        window.electron.ipcRenderer.removeAllListeners('enable-start-button');
    }
});