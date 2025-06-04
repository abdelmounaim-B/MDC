import { LightningElement, api, track } from "lwc";
import getAllActiveConfigData from "@salesforce/apex/ExternalAPIHandler.getAllActiveConfigData";
import Loader from "@salesforce/resourceUrl/Loader";

export default class ReportViewer extends LightningElement {
  @api recordId;

  @track isLoading = false;
  @track error;
  @track groupedReports = [];

  loaderUrl = Loader;

  chartJsLoaded = false;

  connectedCallback() {
    this.loadChartJs();
    this.loadGroupedData();
  }

  async loadGroupedData() {
    this.isLoading = true;
    try {
      const results = await getAllActiveConfigData({ recordId: this.recordId });

      const configs = results || [];

      this.groupedReports = configs.map((cfg) => {
        const groupByFields = (cfg.mappingFields || [])
          .filter((f) => f.Report_Type__c === "Group By - Bar")
          .map((f) => f.Field_Label__c);

        const groupCharts = groupByFields.map((field) => {
          const counts = {};
          cfg.data.forEach((row) => {
            const key = row[field] || "∅ (empty)";
            counts[key] = (counts[key] || 0) + 1;
          });

          return {
            chartId: `chart-${cfg.configId}-${field.replace(/\s+/g, "_")}`,
            field,
            labels: Object.keys(counts),
            values: Object.values(counts),
          };
        });

        return {
          configId: cfg.configId,
          configName: cfg.configName,
          charts: groupCharts,
          connectionName: cfg.connectionName,

        };
      });

      // Defer rendering until DOM is ready
      setTimeout(() => this.renderAllCharts(), 0);
    } catch (err) {
      this.error = err.body?.message || "Error loading grouped data.";
    } finally {
      this.isLoading = false;
    }
  }

  loadChartJs() {
    if (this.chartJsLoaded) return;

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js";
    script.onload = () => {
      this.chartJsLoaded = true;
    };
    script.onerror = () => {
      this.error = "Failed to load Chart.js";
    };
    document.head.appendChild(script);
  }

  renderAllCharts() {
    if (!this.chartJsLoaded) return;

    this.groupedReports.forEach((cfg) => {
      cfg.charts.forEach((chart) => {
        const canvas = this.template.querySelector(
          `[data-id="${chart.chartId}"]`
        );
        if (!canvas) return;

        new Chart(canvas.getContext("2d"), {
          type: "bar",
          data: {
            labels: chart.labels,
            datasets: [
              {
                label: chart.field,
                data: chart.values,
                backgroundColor: "rgba(190, 31, 185, 0.6)",
                borderColor: "rgb(226, 51, 173)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: chart.field },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Count" },
              },
            },
          },
        });
      });
    });
  }
}