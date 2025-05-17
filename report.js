new Vue({
    el: '#report',
    data: {
        lastTest: {},
        selectedScreenshot: null,
        showModal: false
    },
    computed: {
        totalDuration() {
            if (!this.lastTest.tests) return 0;
            return this.lastTest.tests.reduce((acc, item) => acc + (item.executionTime || 0), 0) / 1000;
        }
    },
    methods: {
        getLastTest() {
            const lastTest = JSON.parse(localStorage.getItem('lastTest') || '[]');
            return lastTest;
        },
        formatBreakLines(text) {
            if (!text) return '';
            return text.replace(/\n/g, '<br>');
        },
        changeScreenshot(screenshot) {
            this.selectedScreenshot = screenshot;
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.selectedScreenshot = null;
        }
    },
    mounted() {
        this.lastTest = this.getLastTest();
    }
});
