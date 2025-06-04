import { LightningElement, api, track } from 'lwc';
import getAllActiveConfigData from '@salesforce/apex/ExternalAPIHandler.getAllActiveConfigData';
import Loader from '@salesforce/resourceUrl/Loader';
import canSeeJisrBarrsReports from '@salesforce/customPermission/Can_see_Jisr_Barrs_Repports';

export default class jisrAllBarRepports extends LightningElement {
  @api recordId;
  @track isLoading = false;
  @track error = null;
  @track groupedReports = [];
  canSeeJisrBarrsReports = canSeeJisrBarrsReports;

  loaderUrl = Loader;
  apexChartsLoaded = false;

  connectedCallback() {
    this.loadApexCharts();
    this.loadGroupedData();
  }

  loadApexCharts() {
    if (this.apexChartsLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
    script.onload = () => {
      if (typeof window.ApexCharts !== 'undefined') {
        this.apexChartsLoaded = true;
        this.renderAllCharts();
      } else {
        this.error = 'ApexCharts not available via CDN.';
      }
    };
    script.onerror = () => {
      this.error = 'Failed to load ApexCharts from CDN.';
    };
    document.head.appendChild(script);
  }

  async loadGroupedData() {
    this.isLoading = true;
    try {
      const results = await getAllActiveConfigData({ recordId: this.recordId });

      this.groupedReports = results.map(cfg => {
        const groupByFields = (cfg.mappingFields || [])
          .filter(f => f.JisrTest__Report_Type__c === 'Group By - Bar')
          .map(f => f.JisrTest__Field_Label__c);

        const charts = groupByFields.map(field => {
          const counts = {};
          cfg.data.forEach(row => {
            const key = row[field] || '∅ (empty)';
            counts[key] = (counts[key] || 0) + 1;
          });

          return {
            chartId: `apex-${cfg.configId}-${field.replace(/\s+/g, '_')}`,
            field,
            labels: Object.keys(counts),
            values: Object.values(counts)
          };
        });

        return {
          configId: cfg.configId,
          configName: cfg.configName,
          connectionName: cfg.connectionName,
          charts
        };
      });

      setTimeout(() => this.renderAllCharts(), 0);
    } catch (err) {
      this.error = err.body?.message || 'Error loading grouped data.';
    } finally {
      this.isLoading = false;
    }
  }

  renderAllCharts() {
    if (!this.apexChartsLoaded) return;

    this.groupedReports.forEach(cfg => {
      cfg.charts.forEach(chart => {
        const target = this.template.querySelector(`[data-id="${chart.chartId}"]`);
        if (!target) return;

        const options = {
          chart: {
            type: 'bar',
            height: 250
          },
          series: [{
            name: 'Count',
            data: chart.values
          }],
          xaxis: {
            categories: chart.labels,
            labels: {
              rotate: -45
            }
          },
          title: {
            text: chart.field,
            align: 'left'
          },
          colors: ['#b81b9d']
        };

        const chartInstance = new window.ApexCharts(target, options);
        chartInstance.render();
      });
    });
  }
}