new Vue({
    el: '#about',
    data: {
        version: ''
    },
    async mounted() {
        if (window.electronAPI) {
            this.version = await window.electronAPI.getAppVersion();
        } else {
            this.version = 'erro';
        }
    }
});