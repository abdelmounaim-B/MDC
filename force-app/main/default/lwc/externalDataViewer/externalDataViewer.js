import { LightningElement, api, track } from 'lwc';
import getAllActiveConfigData from '@salesforce/apex/ExternalAPIHandler.getAllActiveConfigData';

export default class ExternalDataViewer extends LightningElement {
    @api recordId;
    @track configsData = [];  
    @track isLoading = false;
    @track showSettings = false;

    connectedCallback() {
        this.loadAllConfigsData(); 
    }

    async loadAllConfigsData() {
        this.isLoading = true;
        try {
            const configs = await getAllActiveConfigData({ recordId: this.recordId });
            this.configsData = configs.map(cfg => ({
                configId: cfg.configId,
                configName: cfg.configName,
                data: cfg.data,
                error: cfg.error,
                availableColumns: [],
                filteredColumns: []
            }));

            this.configsData.forEach(cfg => this.initializeColumns(cfg));
        } catch (error) {
            console.error('Error loading config data:', error);
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
            visible: true
        }));

        cfg.availableColumns = allColumns;
        cfg.filteredColumns = allColumns.filter(col => col.visible);
    }

    toggleColumn(event) {
        const configId = event.target.dataset.configid;
        const field = event.target.dataset.field;

        let cfg = this.configsData.find(c => c.configId === configId);
        if (!cfg) return;

        cfg.availableColumns = cfg.availableColumns.map(col => {
            if (col.fieldName === field) {
                col.visible = event.target.checked;
            }
            return col;
        });
        cfg.filteredColumns = cfg.availableColumns.filter(col => col.visible);

        this.configsData = [...this.configsData]; // refresh reactive property
    }

    toggleSettings() {
        this.showSettings = !this.showSettings;
    }
}
