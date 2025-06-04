public with sharing class ConnectionCallbackUrlUtility {

    @AuraEnabled
    public static String getCallbackUrl(String connectionId) {
        System.debug('🔧 [Debug] Connection ID Received: ' + connectionId);

        if (String.isBlank(connectionId)) {
            throw new AuraHandledException('Connection ID is missing.');
        }

        Connection__c connection = [
            SELECT Named_Credential__c 
            FROM Connection__c 
            WHERE Id = :connectionId 
            LIMIT 1
        ];

        System.debug('🔧 [Debug] Connection Record: ' + connection);

        if (String.isBlank(connection.Named_Credential__c)) {
            throw new AuraHandledException('Named Credential not set for this connection.');
        }

        // Find the Named Credential by Name
        List<NamedCredential> namedCredentials = [
            SELECT Id, DeveloperName, AuthProviderId 
            FROM NamedCredential 
            WHERE DeveloperName = :connection.Named_Credential__c
            LIMIT 1
        ];

        if (namedCredentials.isEmpty()) {
            throw new AuraHandledException('Named Credential not found with the specified name.');
        }

        NamedCredential namedCredential = namedCredentials[0];
        System.debug('🔧 [Debug] Named Credential: ' + namedCredential);

        if (namedCredential.AuthProviderId == null) {
            throw new AuraHandledException('Auth Provider not linked to the Named Credential.');
        }

        // Retrieve the associated Auth Provider
        AuthProvider authProvider = [
            SELECT DeveloperName, OauthKickoffUrl, DefaultScopes 
            FROM AuthProvider 
            WHERE Id = :namedCredential.AuthProviderId
            LIMIT 1
        ];

        System.debug('🔧 [Debug] Auth Provider: ' + authProvider);

        // Generate Callback URL
        String orgId = UserInfo.getOrganizationId();
        String domain = URL.getOrgDomainUrl().toExternalForm();
        String path = '/services/auth/xds/' + orgId + '/' + authProvider.DeveloperName;
        String startUrl = '/' + String.valueOf(namedCredential.Id).left(15);

        // Add Scope if available
        String scopeParam = '';
        if (authProvider.DefaultScopes != null) {
            scopeParam = '&scope=' + EncodingUtil.urlEncode(authProvider.DefaultScopes, 'UTF-8');
        }

        String callbackUrl = domain + path + '?startURL=' + EncodingUtil.urlEncode(startUrl, 'UTF-8') + scopeParam;
        System.debug('✅ [Debug] Generated Callback URL: ' + callbackUrl);

        return callbackUrl;
    }
}