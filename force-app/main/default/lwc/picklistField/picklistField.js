// picklistField.js
import { LightningElement, api } from 'lwc';

export default class PicklistField extends LightningElement {
    @api value;
    @api options;
    @api recordId;
    @api fieldName;

    handleChange(event) {
    this.dispatchEvent(new CustomEvent('picklistchange', {
        detail: { recordId: this.recordId, fieldName: this.fieldName, value: event.detail.value },
        bubbles: true,
        composed: true
    }));
}
}