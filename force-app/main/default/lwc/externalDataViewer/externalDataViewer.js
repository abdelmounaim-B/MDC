import { LightningElement, api, track } from 'lwc';
import getAllActiveConfigData from '@salesforce/apex/ExternalAPIHandler.getAllActiveConfigData';
import SUM from '@salesforce/label/c.SUM';
import Average from '@salesforce/label/c.Average';
import Loader from '@salesforce/resourceUrl/Loader';
import canDisplayHideColumns from '@salesforce/customPermission/Can_Display_Hide_Jisr_Table_Columns';
import canSeeJistTables from '@salesforce/customPermission/Can_See_Jisr_Tables';




export default class ExternalDataViewer extends LightningElement {
    @api recordId;
    @track configsData = [];
    @track isLoading = false;
    @track showSettings = false;
    canDisplayHideColumns = canDisplayHideColumns;
    canSeeJistTables = canSeeJistTables;

    loaderUrl = Loader;

    connectedCallback() {
        this.loadAllConfigsData();
    }

    async loadAllConfigsData() {
        this.isLoading = true;
        try { 
            const configs = await getAllActiveConfigData({ recordId: this.recordId });
            this.configsData = configs.map(cfg => {
                const dataWithPlaceholder = [...cfg.data];
                const emptyRow = { id: 'totals-placeholder' };
                const mappingFields = cfg.mappingFields || [];

                if (cfg.data.length > 0) {
                    const sample = cfg.data[0];
                    Object.keys(sample).forEach(field => {
                        emptyRow[field] = '';
                    });

                    const firstField = Object.keys(sample)[0];
                    if (firstField) {
                        emptyRow[firstField] = 'Totals';

                    }

                    // Populate SUM fields
                    mappingFields
                        .filter(f => f.JisrTest__Report_Type__c === 'SUM')
                        .map(f => f.JisrTest__Field_Label__c)
                        .forEach(field => {
                            const total = cfg.data.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
                            emptyRow[field] = `${SUM}: ${total}`;
                        });

                    // Populate AVERAGE fields
                    mappingFields
                        .filter(f => f.JisrTest__Report_Type__c === 'Average')
                        .map(f => f.JisrTest__Field_Label__c)
                        .forEach(field => {
                            const total = cfg.data.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
                            const average = total / cfg.data.length;
                            emptyRow[field] = `${Average}: ${average.toFixed(2)}`;
                        });
                } else {
                    console.log(`⚠️ No data found for config: ${cfg.configName}`);
                }

                dataWithPlaceholder.push(emptyRow);
                
                return {
                    configId: cfg.configId,
                    configName: cfg.configName,
                    data: dataWithPlaceholder,
                    error: cfg.error,
                    availableColumns: [],
                    filteredColumns: [],
                    connectionName: cfg.connectionName,

                };
            });

            this.configsData.forEach(cfg => {
                this.initializeColumns(cfg);
                this.prepareDisplayData(cfg);
            });        } catch (error) {
        } finally {
            this.isLoading = false;
        }
    }

  
    

    initializeColumns(cfg) {
        if (!cfg.data || cfg.data.length === 0) {
            cfg.data = [];
            return;
        }

        const sampleRecord = cfg.data[0];
        const allColumns = Object.keys(sampleRecord).map(key => ({
            label: key,
            fieldName: key,
            type: 'text',
            visible: true,
            cellAttributes: {
                style: 'background-color:rgb(246, 241, 251);'
            }

        }));

        

        cfg.availableColumns = allColumns;
        cfg.filteredColumns = allColumns.filter(col => col.visible);
    }

    toggleColumn(event) {
    const configId = event.target.dataset.configid;
    const field = event.target.dataset.field;

    let cfg = this.configsData.find(c => c.configId === configId);
    if (!cfg) return;

    // Update visibility
    cfg.availableColumns = cfg.availableColumns.map(col => {
        if (col.fieldName === field) {
            col.visible = event.target.checked;
        }
        return col;
    });

    cfg.filteredColumns = cfg.availableColumns.filter(col => col.visible);

    // 🔥 Re-prepare display data so rows match new columns
    this.prepareDisplayData(cfg);

    // Force refresh
    this.configsData = [...this.configsData];
}
    toggleSettings() {
        this.showSettings = !this.showSettings;
    }

    prepareDisplayData(cfg) {
    cfg.displayData = cfg.data.map((row, index) => {
        return {
            id: row.id || index,
            cells: cfg.filteredColumns.map(col => ({
                key: col.fieldName,
                value: row[col.fieldName] || ''
            }))
        };
    });
}

    get mainContentClass() {
  return this.showSettings
    ? 'slds-size_3-of-4 slds-p-around_medium'
    : 'slds-size_1-of-1 slds-p-around_medium';
}
}