import { LightningElement, api, track } from 'lwc';
import getExternalData from '@salesforce/apex/ExternalAPIHandler.getExternalData';

export default class ReportViewer extends LightningElement {
  @api recordId;
  @api configId;

  @track data = [];
  @track error;
  @track isLoading = false;

  @track totalSum = 0;
  @track averageAmount = 0;

  connectedCallback() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await getExternalData({ configId: 'a03gK00000216JyQAI', recordId: this.recordId });

      if (!result || !Array.isArray(result)) {
        this.error = 'Unexpected data format returned.';
        this.data = [];
        this.totalSum = 0;
        this.averageAmount = 0;
        return;
      }

      this.data = [...result];

      if (this.data.length === 0) {
        this.error = 'No data found.';
        this.totalSum = 0;
        this.averageAmount = 0;
        return;
      }

      if (!this.data[0].hasOwnProperty('Total Amount')) {
        this.error = 'Total Amount field not found in data.';
        this.totalSum = 0;
        this.averageAmount = 0;
        return;
      }

      this.calculateSumAndAverage();
    } catch (err) {
      this.error = err.body?.message || 'Error loading data';
    } finally {
      this.isLoading = false;
    }
  }

  calculateSumAndAverage() {
    const totalAmountValues = this.data
      .map(row => parseFloat(row['Total Amount']))
      .filter(value => !isNaN(value));

    if (totalAmountValues.length > 0) {
      this.totalSum = totalAmountValues.reduce((acc, val) => acc + val, 0);
      this.averageAmount = (this.totalSum / totalAmountValues.length).toFixed(2);
    } else {
      this.totalSum = 0;
      this.averageAmount = 0;
    }
  }
}
