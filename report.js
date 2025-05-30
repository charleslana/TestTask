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
            const duration = this.lastTest.tests.reduce((acc, item) => acc + (item.executionTime || 0), 0);
            return this.formatExecutionTime(duration);
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
            this.scrollPosition = window.scrollY;
            this.selectedScreenshot = screenshot;
            this.showModal = true;
            document.body.classList.add('modal-open');
            document.body.style.top = `-${this.scrollPosition}px`;
        },
        closeModal() {
            this.showModal = false;
            this.selectedScreenshot = null;
            this.currentZoom = 1;
            document.body.classList.remove('modal-open');
            window.scrollTo(0, this.scrollPosition);
        },
        openReportModal() {
            this.scrollPosition = window.scrollY;
            this.showExportModal = true;
            document.body.classList.add('modal-open');
            document.body.style.top = `-${this.scrollPosition}px`;
        },
        closeExportModal() {
            this.showExportModal = false;
            this.showSuccessNotification = false;
            document.body.classList.remove('modal-open');
            window.scrollTo(0, this.scrollPosition);
        },
        exportPDF() {
            this.showSuccessNotification = false;
            const element = this.$refs.pdfContent;
            setTimeout(() => {
                element.style.display = 'block';
                const now = new Date();
                const filename = `testtask-relatorio-e2e-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}-${now.toTimeString().slice(0, 8).replace(/:/g, '_')}.pdf`;
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
            }, 100);
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
                clickWaitForResponse: 'Clique e espera pela resposta',
                iframeClick: 'Clicar no iframe',
                navigateBack: 'Navegar para trás',
                navigateForward: 'Navegar para frente',
                focus: 'Focar'
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
        },
        formatExecutionTime(ms) {
            if (ms < 1000) {
                return `${ms.toFixed(2)}ms`;
            }
            const seconds = ms / 1000;
            return `${seconds.toFixed(2)}s`;
        },
        exportCSV() {
            this.showSuccessNotification = false;
            const rows = this.prepareCSVData();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

            const now = new Date();
            const timestamp = now.toTimeString().slice(0, 8).replace(/:/g, "_");
            const filename = `testtask-relatorio-e2e-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}-${timestamp}.csv`;

            XLSX.writeFile(workbook, filename);
            this.showSuccessNotification = true;
        },

        exportXLS() {
            this.showSuccessNotification = false;
            const rows = this.prepareCSVData();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

            const now = new Date();
            const timestamp = now.toTimeString().slice(0, 8).replace(/:/g, "_");
            const filename = `testtask-relatorio-e2e-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}-${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);
            this.showSuccessNotification = true;
        },
        prepareCSVData() {
            const data = [];
            data.push(["Ação", "Descrição", "Status", "Tempo"]);
            this.lastTest.tests.forEach(result => {
                data.push([
                    this.translateActionType(result.actionType),
                    result.description,
                    result.fail ? `${result.fail}` : 'Passou',
                    this.formatExecutionTime(result.executionTime)
                ]);
            });
            return data;
        },
    },
    mounted() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        window.electronAPI.onThemeChange((newTheme) => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        this.lastTest = this.getLastTest();
    }
});
