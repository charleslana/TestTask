new Vue({
    el: '#about',
    data: {
        version: ''
    },
    async mounted() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        window.electronAPI.onThemeChange((newTheme) => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        if (window.electronAPI) {
            this.version = await window.electronAPI.getAppVersion();
        } else {
            this.version = 'erro';
        }
    }
});