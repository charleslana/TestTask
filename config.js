new Vue({
    el: '#config',
    data: {
        navigateTimeout: 15000,
        defaultTimeout: 10000,
        navigateWaitUntil: 'domcontentloaded',
        selectedScreenshot: 'everyScreenshot',
        isCloseBrowser: true,
        fullScreenshot: false,
        iteration: 1,
        isMobile: false,
        isClearStorage: true,
    },
    computed: {
        isFullScreenshotEnabled() {
            return this.selectedScreenshot !== 'neverScreenshot';
        }
    },
    watch: {
        navigateTimeout(newValue) {
            this.navigateTimeout = this.validateValue(newValue);
        },
        defaultTimeout(newValue) {
            this.defaultTimeout = this.validateValue(newValue);
        },
        iteration(newValue) {
            this.iteration = this.validateValue(newValue);
        }
    },
    methods: {
        validateValue(value) {
            return Math.max(1, Number(value));
        },
        saveConfig() {
            const confige2e = {
                navigateTimeout: this.navigateTimeout,
                defaultTimeout: this.defaultTimeout,
                navigateWaitUntil: this.navigateWaitUntil,
                selectedScreenshot: this.selectedScreenshot,
                isCloseBrowser: this.isCloseBrowser,
                fullScreenshot: this.fullScreenshot,
                iteration: this.iteration,
                isMobile: this.isMobile,
                isClearStorage: this.isClearStorage,
            };

            localStorage.setItem('confige2e', JSON.stringify(confige2e));
            alert('Configurações salvas com sucesso!');
        },
        loadConfig() {
            const getConfig = localStorage.getItem('confige2e');

            if (getConfig) {
                try {
                    const config = JSON.parse(getConfig);

                    this.navigateTimeout = config.navigateTimeout ?? this.navigateTimeout;
                    this.defaultTimeout = config.defaultTimeout ?? this.defaultTimeout;
                    this.navigateWaitUntil = config.navigateWaitUntil ?? this.navigateWaitUntil;
                    this.selectedScreenshot = config.selectedScreenshot ?? this.selectedScreenshot;
                    this.isCloseBrowser = config.isCloseBrowser ?? this.isCloseBrowser;
                    this.fullScreenshot = config.fullScreenshot ?? this.fullScreenshot;
                    this.iteration = config.iteration ?? this.iteration;
                    this.isMobile = config.isMobile ?? this.isMobile;
                    this.isClearStorage = config.isClearStorage ?? this.isClearStorage;
                } catch (e) {
                    console.error('Erro ao carregar configuração:', e);
                }
            }
        }
    },
    mounted() {
        this.loadConfig();
        const btn = document.getElementById('saveSettings');
        if (btn) {
            btn.addEventListener('click', this.saveConfig);
        }
    }
});
