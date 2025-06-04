public with sharing class AuthProviderUtils {

    public class CreateAuthProviderRequest {
        @InvocableVariable(label='Connection Name') public String connectionName;
        @InvocableVariable(label='Authorize URL') public String authorizeUrl;
        @InvocableVariable(label='Token URL') public String tokenUrl;
        @InvocableVariable(label='Client ID') public String consumerKey;
        @InvocableVariable(label='Client Secret') public String consumerSecret;
        @InvocableVariable(label='Scopes') public String scopes;
    }

    public class CreateResult {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String authProviderName;
        @InvocableVariable public String authCallbackUrl;
        @InvocableVariable public String error;
    }

    @InvocableMethod(label='Create Auth Provider with Callback URL')
    public static List<CreateResult> createAuthProvider(List<CreateAuthProviderRequest> inputs) {
        List<CreateResult> results = new List<CreateResult>();

        for (CreateAuthProviderRequest input : inputs) {
            CreateResult result = new CreateResult();

            try {
                String cleanName = input.connectionName != null ? input.connectionName.replaceAll('[^a-zA-Z0-9]', '') : 'SYS';
                String devName = 'AP_' + cleanName + '_' + DateTime.now().getTime();
                String label = 'Auth Provider for ' + input.connectionName;

                MetadataService.MetadataPort service = new MetadataService.MetadataPort();
                service.SessionHeader = new MetadataService.SessionHeader_element();
                service.SessionHeader.sessionId = UserInfo.getSessionId();

                MetadataService.AuthProvider ap = new MetadataService.AuthProvider();
                ap.fullName = devName;
                ap.friendlyName = label;
                ap.consumerKey = input.consumerKey;
                ap.consumerSecret = input.consumerSecret;
                ap.authorizeUrl = input.authorizeUrl;
                ap.tokenUrl = input.tokenUrl;
                ap.providerType = 'OpenIdConnect';
				ap.defaultScopes = input.scopes != null ? input.scopes.trim() : null;

                List<MetadataService.SaveResult> saveResults = service.createMetadata(
                    new MetadataService.Metadata[] { ap });

                if (!saveResults.isEmpty() && saveResults[0].success) {
                    result.success = true;
                    result.authProviderName = devName;
                    result.authCallbackUrl = URL.getOrgDomainUrl().toExternalForm() + '/services/authcallback/' + devName;
                } else {
                    result.success = false;
                    result.error = saveResults[0].errors[0].message;
                }

            } catch (Exception e) {
                result.success = false;
                result.error = e.getMessage();
            }

            results.add(result);
        }

        return results;
    }

}