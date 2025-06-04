// lookupField.js
import { LightningElement, api } from 'lwc';

export default class LookupField extends LightningElement {
    @api recordId;
    @api fieldName;
    @api objectName;
    @api iconName;
    @api value;


    handleSelect(event) {
        const selectedId = event.detail.recordId;
        this.dispatchEvent(new CustomEvent('lookupchange', {
            detail: { recordId: this.recordId, fieldName: this.fieldName, value: selectedId },
            bubbles: true, // Allow event to propagate up
            composed: true  // Cross Shadow DOM boundary
        }));
        console.log("recordId:" + this.recordId + " // " + "fieldName:" + this.fieldName + " // " + "value:" + selectedId);   
    }
    @api isDisabled = false; // Flag to control editability

    get computedClass() {
        return this.isDisabled ? 'disabled' : '';
    }


    matchingInfo = {
        primaryField: { fieldPath: 'Name', mode: 'startsWith' },
        additionalFields: [{ 
            fieldPath: 'N_piece_cni__c',
        },
    ],
    };


}