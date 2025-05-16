public with sharing class NamedCredentialUtils {

    public class CreateResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String namedCredentialName;
        @AuraEnabled public String error;
    }

    public static CreateResult createNamedCredential(
        String name,
        String label,
        String endpoint,
        String protocol,
        String principalType,
        String username,
        String password,
        String authProviderDevName,
        String oauthScope
    ) {
        CreateResult result = new CreateResult();

        try {
            MetadataService.MetadataPort service = new MetadataService.MetadataPort();
            service.SessionHeader = new MetadataService.SessionHeader_element();
            service.SessionHeader.sessionId = UserInfo.getSessionId();

            MetadataService.NamedCredential nc = new MetadataService.NamedCredential();
            nc.fullName = name;
            nc.label = label;
            nc.endpoint = endpoint;
            nc.protocol = protocol;
            nc.principalType = principalType;
            nc.oauthScope = 'full_access';

            if (protocol == 'PasswordAuthentication') {
                nc.username = username;
                nc.password = password;
            }

            if (protocol == 'OAuth' && authProviderDevName != null) {
                nc.authProvider = authProviderDevName;
            }

            nc.allowMergeFieldsInHeader = false;
            nc.allowMergeFieldsInBody = false;

            List<MetadataService.SaveResult> results = service.createMetadata(
                new MetadataService.Metadata[] { nc });

            if (!results.isEmpty() && results[0].success) {
                result.success = true;
                result.namedCredentialName = name;
            } else {
                result.success = false;
                result.error = results[0].errors[0].message;
            }

        } catch (Exception e) {
            result.success = false;
            result.error = e.getMessage();
        }

        return result;
    }
}