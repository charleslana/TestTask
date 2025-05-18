new Vue({
    el: '#config',
    data: {
        navigateTimeout: 15000,
        defaultTimeout: 10000,
        navigateWaitUntil: 'domcontentloaded',
        selectedScreenshot: 'lastScreenshot',
        isCloseBrowser: true,
        fullScreenshot: false,
        iteration: 1
    },
    computed: {
        isFullScreenshotEnabled() {
            return this.selectedScreenshot !== 'neverScreenshot';
        }
    },
    methods: {
        saveConfig() {
            const confige2e = {
                navigateTimeout: this.navigateTimeout,
                defaultTimeout: this.defaultTimeout,
                navigateWaitUntil: this.navigateWaitUntil,
                selectedScreenshot: this.selectedScreenshot,
                isCloseBrowser: this.isCloseBrowser,
                fullScreenshot: this.fullScreenshot,
                iteration: this.iteration,
            };

            localStorage.setItem('confige2e', JSON.stringify(confige2e));
            alert('Configurações salvas com sucesso!');
        },
        loadConfig() {
            const configSalva = localStorage.getItem('confige2e');

            if (configSalva) {
                try {
                    const config = JSON.parse(configSalva);

                    this.navigateTimeout = config.navigateTimeout ?? this.navigateTimeout;
                    this.defaultTimeout = config.defaultTimeout ?? this.defaultTimeout;
                    this.navigateWaitUntil = config.navigateWaitUntil ?? this.navigateWaitUntil;
                    this.selectedScreenshot = config.selectedScreenshot ?? this.selectedScreenshot;
                    this.isCloseBrowser = config.isCloseBrowser ?? this.isCloseBrowser;
                    this.fullScreenshot = config.fullScreenshot ?? this.fullScreenshot;
                    this.iteration = config.iteration ?? this.iteration;
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
