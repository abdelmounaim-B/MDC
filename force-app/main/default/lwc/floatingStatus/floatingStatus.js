import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import STATUS_FIELD from '@salesforce/schema/Connection__c.Status__c';

export default class FloatingStatus extends LightningElement {
    @api recordId;
    
    @track statusMessage = 'Loading status...';
    @track statusStyle = 'background-color: grey; color: white; border: 2px solid transparent; border-radius: 12px;';

    // Wire the connection record and get the Status__c field value
    @wire(getRecord, { recordId: '$recordId', fields: [STATUS_FIELD] })
    connectionRecord({ error, data }) {
        if (data) {
            const status = getFieldValue(data, STATUS_FIELD);
            this.updateStatus(status);
        } else if (error) {
            this.statusMessage = 'Unable to load status.';
            this.statusStyle = 'background-color: grey; color: white; border: 2px solid grey;';
        }
    }

    /**
     * Updates the status message and style directly using inline styles.
     * This ensures that Shadow DOM encapsulation does not block the styles.
     * @param {string} status - The value of the Status__c field.
     */
    updateStatus(status) {
        switch (status) {
            case 'Pending':
                this.statusMessage = 'Awaiting connection...';
                this.statusStyle = `
                    background-color: #6c757d;
                    color: white;
                    border: 2px solid #007bff;
                    border-radius: 12px;
                    top: 10px;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 1.2rem;
                    animation: smoothFloat 3s ease-in-out infinite;
                `;
                break;
            case 'Connected':
                this.statusMessage = 'Successfully connected.';
                this.statusStyle = `
                    background-color: #28a745;
                    color: white;
                    border: 2px solid #218838;
                    border-radius: 20px;
                    top: 10px;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 1.2rem;
                    animation: smoothFloat 3s ease-in-out infinite;
                `;
                break;
            case 'Failed':
                this.statusMessage = 'Connection failed. Please try again.';
                this.statusStyle = `
                    background-color: #dc3545;
                    color: white;
                    border: 2px solid #bd2130;
                    border-radius: 8px;
                    top: 10px;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 1.2rem;
                    animation: smoothFloat 3s ease-in-out infinite;
                `;
                break;
            case 'Draft':
                this.statusMessage = 'The connection is still in draft, please complete the setup!.';
                this.statusStyle = `
                    background-color: #ffc107;
                    color: black;
                    border: 2px solid #000000;
                    border-radius: 15px;
                    top: 10px;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 1.2rem;
                    animation: smoothFloat 3s ease-in-out infinite;
                `;
                break;
            default:
                this.statusMessage = 'Unknown status.';
                this.statusStyle = `
                    background-color: grey;
                    color: white;
                    border: 2px solid grey;
                    border-radius: 12px;
                    top: 10px;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    font-weight: bold;
                    font-size: 1.2rem;
                    animation: smoothFloat 3s ease-in-out infinite;
                `;
                break;
        }
    }

    renderedCallback() {
        const style = document.createElement('style');
        style.innerText = `
            @keyframes smoothFloat {
                0% { transform: translateY(0); }
                25% { transform: translateY(-2px); }
                50% { transform: translateY(4px); }
                75% { transform: translateY(-2px); }
                100% { transform: translateY(0); }
            }
        `;
        this.template.querySelector('.floating-status').appendChild(style);
    }
}
