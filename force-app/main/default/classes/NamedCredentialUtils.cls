public with sharing class NamedCredentialUtils {

    public class CreateInput {
        @InvocableVariable(required=true)
        public String connectionName;

        @InvocableVariable
        public String label;

        @InvocableVariable
        public String endpoint;

        @InvocableVariable
        public String protocol;

        @InvocableVariable
        public String principalType;

        @InvocableVariable
        public String username;

        @InvocableVariable
        public String password;

        @InvocableVariable
        public String authProviderDevName;

        @InvocableVariable
        public String oauthScope;
    }

    public class CreateOutput {
        @InvocableVariable
        public Boolean success;

        @InvocableVariable
        public String namedCredentialName;

        @InvocableVariable
        public String error;
    }

    @InvocableMethod(label='Create Named Credential' description='Creates a Named Credential via Metadata API')
    public static List<CreateOutput> createNamedCredential(List<CreateInput> inputList) {
        List<CreateOutput> results = new List<CreateOutput>();

        for (CreateInput input : inputList) {
            CreateOutput result = new CreateOutput();

            try {
                MetadataService.MetadataPort service = new MetadataService.MetadataPort();
                service.SessionHeader = new MetadataService.SessionHeader_element();
                service.SessionHeader.sessionId = UserInfo.getSessionId();

                MetadataService.NamedCredential nc = new MetadataService.NamedCredential();
                nc.fullName = input.name;
                nc.label = input.label;
                nc.endpoint = input.endpoint;
                nc.protocol = input.protocol;
                nc.principalType = input.principalType;
                nc.oauthScope = input.oauthScope;

                if (input.protocol == 'PasswordAuthentication') {
                    nc.username = input.username;
                    nc.password = input.password;
                }

                if (input.protocol == 'OAuth' && input.authProviderDevName != null) {
                    nc.authProvider = input.authProviderDevName;
                }

                nc.allowMergeFieldsInHeader = false;
                nc.allowMergeFieldsInBody = false;

                List<MetadataService.SaveResult> saveResults = service.createMetadata(
                    new MetadataService.Metadata[] { nc });

                if (!saveResults.isEmpty() && saveResults[0].success) {
                    result.success = true;
                    result.namedCredentialName = input.name;
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
