import { LightningElement, api, track } from 'lwc';
import generateOAuthStartUrl from '@salesforce/apex/ExternalAuthFlowLauncher.generateOAuthStartUrl';

export default class ExternalAuthLauncher extends LightningElement {
    @api recordId;
    @track isLoading = true;
    @track message = 'Launching OAuth Flow...';

    connectedCallback() {
        this.launchAuthFlow();
    }

    /**
     * Launches the OAuth flow automatically on component load.
     */
    launchAuthFlow() {
        generateOAuthStartUrl({ recordId: this.recordId })
            .then(url => {
                console.log('Starting OAuth flow:', url);
                window.open(url, '_blank'); // Opens in a new tab
                this.isLoading = false;
                this.message = 'The authentication flow has been launched. If you have completed it, click Next to proceed.';
            })
            .catch(error => {
                console.error('❌ Error launching OAuth flow:', error);
                this.isLoading = false;
                this.message = 'Error launching authentication flow: ' + error.body.message;
            });
    }
}