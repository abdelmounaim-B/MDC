import { LightningElement, api, track } from 'lwc';
import Loader from '@salesforce/resourceUrl/Loader';
import getFieldMappingReportData from '@salesforce/apex/ExternalAPIHandler.getFieldMappingReportData';

export default class JisrReport extends LightningElement {
    @api recordId;
    @api fieldMappingId;

    @track isLoading = false;
    @track error = null;
    @track reportTitle = '';
    @track chartRendered = false;

    loaderUrl = Loader;
    apexChartsLoaded = false;
    chartData;
    reportType;

    connectedCallback() {
        this.loadApexCharts();
        this.loadReportData();
    }

    loadApexCharts() {
        if (this.apexChartsLoaded) return;

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';

        script.onload = () => {
            this.apexChartsLoaded = true;
            this.renderChart();
        };

        script.onerror = () => {
            this.error = 'Failed to load ApexCharts from CDN.';
        };

        document.head.appendChild(script);
    }

    async loadReportData() {
        if (!this.fieldMappingId || !this.recordId) return;

        this.isLoading = true;
        try {
            const result = await getFieldMappingReportData({
                fieldMappingId: this.fieldMappingId,
                recordId: this.recordId
            });

            this.reportTitle = `${result.configName} — ${result.fieldLabel}`;
            this.chartData = result.data;
            this.reportType = result.reportType;

            setTimeout(() => this.renderChart(), 0);
        } catch (e) {
            this.error = e.body?.message || 'Error loading report data';
        } finally {
            this.isLoading = false;
        }
    }

    renderChart() {
        if (!this.apexChartsLoaded || !this.chartData) return;

        const labels = Object.keys(this.chartData);
        const values = Object.values(this.chartData);

        const chartEl = this.template.querySelector('[data-id="chart"]');
        if (!chartEl) return;

        const options = {
            chart: {
                type: this.reportType.includes('Bar') ? 'bar' : 'donut',
                height: 300
            },
            series: this.reportType.includes('Bar') ? [{ name: 'Count', data: values }] : values,
            labels,
            title: {
                text: this.reportTitle,
                align: 'center'
            },
            legend: {
                position: 'right'
            },
            xaxis: {
                categories: labels,
                labels: {
                    rotate: -45
                }
            },
            colors: [ '#8a1476', '#991783', '#a91990', '#be2ea5', '#c441ad', '#ca54b6']
          };

        const chart = new window.ApexCharts(chartEl, options);
        chart.render();
        this.chartRendered = true;
    }
}