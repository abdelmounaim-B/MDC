import { LightningElement, api } from 'lwc';

export default class RedirectToRecord extends LightningElement {
    // Record ID to redirect to, passed from the Flow
    @api recordId;
    
    // Loading state for spinner display
    isLoading = true;

    // Automatically triggered when the component loads
    connectedCallback() {
        this.redirectToRecord();
    }

    /**
     * Redirects the user to the specified record page.
     * Uses window.location.href for direct redirection in the same tab.
     */
    redirectToRecord() {
        // Ensure the Record ID is available
        if (this.recordId) {
            // Construct the URL for the record detail page
            const url = `/lightning/r/${this.recordId}/view`;
            // Redirect to the record page
            window.location.href = url;
        }

        // Hide the spinner regardless of the outcome
        this.isLoading = false;
    }
}