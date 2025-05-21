new Vue({
    el: '#report',
    data: {
        lastTest: {},
        selectedScreenshot: null,
        showModal: false,
        showExportModal: false,
        showSuccessNotification: false,
        currentZoom: 1,
    },
    computed: {
        totalDuration() {
            if (!this.lastTest.tests) return 0;
            return this.lastTest.tests.reduce((acc, item) => acc + (item.executionTime || 0), 0) / 1000;
        },
        testsPassed() {
            if (!this.lastTest || !this.lastTest.tests) return 0;
            return this.lastTest.tests.filter(test => !test.fail).length;
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
            this.currentZoom = 1;
        },
        closeExportModal() {
            this.showExportModal = false;
            this.showSuccessNotification = false;
        },
        exportPDF() {
            this.showSuccessNotification = false;
            const element = this.$refs.pdfContent;
            element.style.display = 'block';

            const now = new Date();
            const filename = `testtask-relatorio-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}-${now.toTimeString().slice(0, 8).replace(/:/g, '_')}.pdf`;

            const options = {
                margin: [10, 10, 20, 10],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(options).from(element).save().then(() => {
                element.style.display = 'none';
                this.showSuccessNotification = true;
            });
        },
        translateActionType(type) {
            const map = {
                type: 'Digitar',
                fill: 'Preencher',
                click: 'Clicar',
                enter: 'Pressionar Enter',
                navigate: 'Navegar',
                assertText: 'Validar Texto',
                waitForVisible: 'Aguardar elemento aparecer',
                waitForNotVisible: 'Aguardar elemento desaparecer',
                clear: 'Limpar',
                reload: 'Atualizar página',
                select: 'Select',
                dragAndDrop: 'Arrastar e Soltar',
                iframeType: 'Digitar no iframe',
                clickWaitForResponse: 'Clique e espera pela resposta'
            };
            return map[type] || 'Ação desconhecida';
        },
        zoomIn() {
            this.currentZoom += 0.1;
        },
        zoomOut() {
            if (this.currentZoom > 0.2) {
                this.currentZoom -= 0.1;
            }
        },
        resetZoom() {
            this.currentZoom = 1;
        }
    },
    mounted() {
        this.lastTest = this.getLastTest();
    }
});
