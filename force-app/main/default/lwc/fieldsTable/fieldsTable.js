import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import MAPPING_OBJECT from '@salesforce/schema/External_System_Field_Mapping__c';
import REPORT_TYPE_FIELD from '@salesforce/schema/External_System_Field_Mapping__c.Report_Type__c';

const COLUMNS = [
    {
        label: 'JSON Path',
        fieldName: 'Field_JSON_Path__c',
        type: 'text',
        editable: true
    },
    {
        label: 'Label',
        fieldName: 'Field_Label__c',
        type: 'text',
        editable: true
    },
    {
        label: 'Report Type',
        fieldName: 'Report_Type__c',
        type: 'customPicklist',
        wrapText: true,
        typeAttributes: {
            value: { fieldName: 'Report_Type__c' },
            recordId: { fieldName: 'tempId' },
            fieldName: 'Report_Type__c',
            options: { fieldName: 'picklistOptions' },
            onChange: 'handlePicklistChange'
        }
    },
    {
        type: 'button-icon',
        initialWidth: 50,
        typeAttributes: {
            iconName: 'utility:delete',
            name: 'delete',
            title: 'Supprimer',
            variant: 'border-filled',
            alternativeText: 'Supprimer'
        }
    }
];

export default class FieldsTable extends LightningElement {
    @api recordId;
    @api recordsToCreate = [];

    @track mappings = [];
    @track deletedIds = [];
    @track draftValues = [];
    @track picklistOptions = [];

    columns = COLUMNS;
    isLoading = true;
    nextTempId = 1;

    @wire(getObjectInfo, { objectApiName: MAPPING_OBJECT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: REPORT_TYPE_FIELD
    })
    picklistHandler({ data, error }) {
        if (data) {
            this.picklistOptions = data.values.map(option => ({
                label: option.label,
                value: option.value
            }));
            this.fetchMappings();
        } else if (error) {
            console.error('Error loading picklist values', error);
        }
    }

    fetchMappings() {
        this.isLoading = false;
        this.mappings = [];
        this.addMapping();
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;


        if (actionName === 'delete') {
            if (row.Id) {
                this.deletedIds.push(row.Id);
            }
            this.mappings = this.mappings.filter(m => m.tempId !== row.tempId);
        }
        console.log('Row action:',  row);
    }

    handlePicklistChange(event) {
    const { recordId, fieldName, value } = event.detail;

    // Find existing draft for the row (if any)
    let existing = this.draftValues.find(d => d.Id === recordId);

    let updatedDraft = {
        ...(existing || { Id: recordId }),
        [fieldName]: value
    };
        
        console.log('Updated draft:', JSON.stringify(updatedDraft) );

    this.updateDraftValues([updatedDraft]);
}


    handleCellChange(event) {
        const updatedValues = event.detail.draftValues;
        this.updateDraftValues(updatedValues);
    }

    updateDraftValues(updatedValues) {
    updatedValues.forEach(newVal => {
        const index = this.draftValues.findIndex(d => d.Id === newVal.Id);
        console.log('Draft values before update:', JSON.stringify(this.draftValues) );
        if (index !== -1) {
            this.draftValues[index] = { ...this.draftValues[index], ...newVal };
        } else {
            this.draftValues.push(newVal);
        }
        console.log('Draft values:', JSON.stringify(this.draftValues) );
    });

    this.mappings = this.mappings.map(map => {
        const updates = this.draftValues.filter(d => d.Id === map.tempId);
        let merged = { ...map };
        updates.forEach(draft => {
            merged = { ...merged, ...draft };
        });
        return merged;
    });
}


    addMapping() {
        this.mappings = [
            ...this.mappings,
            {
                Id: null,
                tempId: `temp-${this.nextTempId++}`,
                Field_JSON_Path__c: '',
                Field_Label__c: '',
                Report_Type__c: '',
                picklistOptions: this.picklistOptions
            }
        ];
    }

    async saveMappings() {
        this.isLoading = true;

        try {
            this.mappings = this.mappings.map(map => {
                const updated = this.draftValues.find(d => d.Id === map.tempId);
                return updated ? { ...map, ...updated } : map;
            });

            const formatted = this.mappings.map(m => {
                const { tempId, picklistOptions, ...clean } = m;
                if (!clean.Id || clean.Id.startsWith('temp-')) {
                    delete clean.Id;
                }
                return clean;
            });

            this.recordsToCreate = formatted;

            console.log('💾 Records to create (Flow output):', JSON.stringify(this.recordsToCreate, null, 2));

        } catch (error) {
            console.error('Error formatting records:', error);
        }

        this.isLoading = false;
    }
}