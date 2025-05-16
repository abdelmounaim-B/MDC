public with sharing class DynamicAuthProviderCreator {

    public class AuthProviderPayload {
        public String ProviderType = 'OpenIdConnect';
        public String FriendlyName;
        public String DeveloperName;
        public String ConsumerKey;
        public String ConsumerSecret;
        public String AuthorizeUrl;
        public String TokenUrl;
        public String DefaultScopes;
        public Boolean OptionsSendAccessTokenInHeader = true;
        public Boolean OptionsSendSecretInApis = true;
        public Boolean OptionsIsPkceEnabled = true;
    }

    public class AuthResult {
        public String id;
        public String developerName;
    }

    public static AuthResult createAuthProvider(AuthProviderPayload payload) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + '/services/data/v60.0/sobjects/AuthProvider');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 201) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            AuthResult r = new AuthResult();
            r.id = (String) result.get('id');
            r.developerName = payload.DeveloperName;
            return r;
        } else {
            System.debug('❌ Auth Provider creation failed: ' + res.getBody());
            return null;
        }
    }
}