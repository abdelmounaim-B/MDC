public with sharing class ExternalAuthFlowLauncher {

    @AuraEnabled
    public static String generateOAuthStartUrl(String recordId) {
        try {
            // Step 1: Fetch the record with Named Credential Developer Name
            Connection__c connection = [
                SELECT Named_Credential__c
                FROM Connection__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            if (connection == null || String.isBlank(connection.Named_Credential__c)) {
                throw new AuraHandledException('Named Credential is not specified on the record.');
            }

            // Step 2: Fetch the Named Credential using the Developer Name from the record
            NamedCredential namedCredential = [
                SELECT Id, AuthProviderId
                FROM NamedCredential
                WHERE DeveloperName = :connection.Named_Credential__c
                LIMIT 1
            ];

            if (namedCredential == null || String.isBlank(namedCredential.AuthProviderId)) {
                throw new AuraHandledException('Auth Provider is not linked with the Named Credential.');
            }

            // Step 3: Fetch the Auth Provider using the AuthProviderId from Named Credential
            AuthProvider authProvider = [
                SELECT Id, DeveloperName, OauthKickoffUrl, DefaultScopes
                FROM AuthProvider
                WHERE Id = :namedCredential.AuthProviderId
                LIMIT 1
            ];

            if (authProvider == null) {
                throw new AuraHandledException('Auth Provider not found.');
            }

            // Step 4: Construct the OAuth URL
            String orgId = UserInfo.getOrganizationId();
            String domain = URL.getOrgDomainUrl().toExternalForm();
            String path = '/services/auth/xds/' + orgId + '/' + authProvider.DeveloperName;
            String startUrl = '/' + String.valueOf(namedCredential.Id).left(15);

            // Optional Scopes
            String scopeParam = '';
            if (authProvider.DefaultScopes != null) {
                scopeParam = '&scope=' + EncodingUtil.urlEncode(authProvider.DefaultScopes, 'UTF-8');
            }

            // Return the constructed URL
            return domain + path + '?startURL=' + EncodingUtil.urlEncode(startUrl, 'UTF-8') + scopeParam;
        } catch (Exception ex) {
            throw new AuraHandledException('Error generating OAuth URL: ' + ex.getMessage());
        }
    }
}