new Vue({
    el: '#config-api',
    data: {
        defaultTimeout: 10000,
        selectedScreenshot: 'everyScreenshot',
        isCloseBrowser: true,
        fullScreenshot: false,
        iteration: 1,
    },
    computed: {
        isFullScreenshotEnabled() {
            return this.selectedScreenshot !== 'neverScreenshot';
        }
    },
    watch: {
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
            const configapi = {
                defaultTimeout: this.defaultTimeout,
                selectedScreenshot: this.selectedScreenshot,
                isCloseBrowser: this.isCloseBrowser,
                fullScreenshot: this.fullScreenshot,
                iteration: this.iteration,
            };

            localStorage.setItem('configapi', JSON.stringify(configapi));
            alert('Configurações salvas com sucesso!');
        },
        loadConfig() {
            const getConfig = localStorage.getItem('configapi');

            if (getConfig) {
                try {
                    const config = JSON.parse(getConfig);

                    this.defaultTimeout = config.defaultTimeout ?? this.defaultTimeout;
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
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        window.electronAPI.onThemeChange((newTheme) => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        this.loadConfig();
        const btn = document.getElementById('saveSettings');
        if (btn) {
            btn.addEventListener('click', this.saveConfig);
        }
    }
});
