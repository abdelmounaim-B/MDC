public with sharing class getConsumerUtils {
    
    public class AuthProviderSecretRequest {
        @InvocableVariable(label='Auth Provider Developer Name') 
        public String authProviderDevName;
    }

    public class AuthProviderSecretResult {
        @InvocableVariable(label='Consumer Secret') 
        public String consumerSecret;
    }

    @InvocableMethod(label='Get Consumer Secret from Auth Provider')
    public static List<AuthProviderSecretResult> getConsumerSecret(List<AuthProviderSecretRequest> requests) {
        List<AuthProviderSecretResult> results = new List<AuthProviderSecretResult>();
        
        for (AuthProviderSecretRequest request : requests) {
            AuthProviderSecretResult result = new AuthProviderSecretResult();
            try {
                // Query the Auth Provider securely
                AuthProvider authProvider = [
                    SELECT ConsumerSecret 
                    FROM AuthProvider 
                    WHERE DeveloperName = :request.authProviderDevName 
                    LIMIT 1
                ];
                result.consumerSecret = authProvider.ConsumerSecret;
            } catch (Exception e) {
                result.consumerSecret = 'Error: ' + e.getMessage();
            }
            results.add(result);
        }

        return results;
    }
}