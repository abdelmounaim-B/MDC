import { LightningElement, api, track } from 'lwc';
import getExternalDataWithMappings from '@salesforce/apex/ExternalAPIHandler.getExternalDataWithMappings';
import SUM from '@salesforce/label/c.SUM';
import Average from '@salesforce/label/c.Average';
import Loader from '@salesforce/resourceUrl/Loader';
import canDisplayHideColumns from '@salesforce/customPermission/Can_Display_Hide_Jisr_Table_Columns';

export default class JisrTable extends LightningElement {
  @api recordId;
  @api configId;
  @track config = null;
  @track isLoading = false;
  @track showSettings = false;
  @track availableColumns = [];
  @track filteredColumns = [];
  @track displayData = [];
  loaderUrl = Loader;
  canDisplayHideColumns = canDisplayHideColumns;

  connectedCallback() {
    if (this.configId) {
      this.loadSelectedConfig();
    }
  }

  toggleColumn(event) {
    const field = event.target.dataset.field;

    this.availableColumns = this.availableColumns.map(col => {
      if (col.fieldName === field) {
        col.visible = event.target.checked;
      }
      return col;
    });

    this.filteredColumns = this.availableColumns.filter(col => col.visible);
    this.prepareDisplayData();
  }

  prepareDisplayData() {
    this.displayData = this.config.rawData.map((row, index) => ({
      id: row.id || index,
      cells: this.filteredColumns.map(col => ({
        key: col.fieldName,
        value: row[col.fieldName] || ''
      }))
    }));
  }

  async loadSelectedConfig() {
    if (!this.configId) return;

    this.isLoading = true;
    try {
      const result = await getExternalDataWithMappings({ configId: this.configId, recordId: this.recordId });
      const data = result.data || [];
      const mappingFields = result.mappingFields || [];


      const dataWithTotals = [...data];
      const emptyRow = { id: 'totals-placeholder' };

      if (data.length > 0) {
        const sample = data[0];
        Object.keys(sample).forEach(field => (emptyRow[field] = ''));
        const first = Object.keys(sample)[0];
        if (first) emptyRow[first] = 'Totals';

       // 🔢 SUM fields
        mappingFields
        .filter(f => f.JisrTest__Report_Type__c === 'SUM')
        .map(f => f.JisrTest__Field_Label__c)
        .forEach(field => {
          const total = data.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
          emptyRow[field] = `${SUM}: ${total}`; // 👈 Add this line
        });

        // 📊 AVERAGE fields
        mappingFields
        .filter(f => f.JisrTest__Report_Type__c === 'Average')
        .map(f => f.JisrTest__Field_Label__c)
        .forEach(field => {
          const total = data.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
          const average = total / data.length;
          emptyRow[field] = `${Average}: ${average.toFixed(2)}`; // 👈 Add this line
        });
      }

      dataWithTotals.push(emptyRow);

      const columns = Object.keys(dataWithTotals[0] || {}).map(key => ({
        label: key,
        fieldName: key
      }));

      this.config = {
        configName: result.configName || `Config ${this.configId}`,
        rawData: dataWithTotals
      };

      this.availableColumns = Object.keys(dataWithTotals[0] || {}).map(key => ({
        label: key,
        fieldName: key,
        visible: true
      }));

      this.filteredColumns = [...this.availableColumns];
      this.prepareDisplayData();
    } catch (e) {
      console.error('Error loading selected config:', e);
    } finally {
      this.isLoading = false;
    }
  }

  get mainContentClass() {
    return this.showSettings
      ? 'slds-size_3-of-4 slds-p-around_medium'
      : 'slds-size_1-of-1 slds-p-around_medium';
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }
}