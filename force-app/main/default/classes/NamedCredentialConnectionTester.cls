public with sharing class NamedCredentialConnectionTester {

    public class Request {
        @InvocableVariable(required=true)
        public String namedCredentialDevName;
    }

    public class Response {
        @InvocableVariable
        public String status;
    }

    @InvocableMethod(label='Test NC Connection (Flow)')
    public static List<Response> testConnection(List<Request> requests) {
        List<Response> results = new List<Response>();
        for (Request req : requests) {
            Response res = new Response();
            res.status = runTest(req.namedCredentialDevName);
            results.add(res);
        }
        return results;
    }

    @AuraEnabled
    public static String testNamedCredentialAura(String namedCredentialDevName) {
        return runTest(namedCredentialDevName);
    }

    /**
     * Tests the connection and logs the result to Connection_Test_Log__c.
     * @param ncName The developer name of the Named Credential.
     * @return The connection status message.
     */
    private static String runTest(String ncName) {
        // Initialize the log record
        Connection_Test_Log__c logRecord = new Connection_Test_Log__c();
        String resultMessage = 'Unknown Error';

        try {
            // Validate Named Credential is provided
            if (String.isBlank(ncName)) {
                logRecord.Status__c = 'Failure';
                logRecord.Message__c = 'Named Credential Developer Name is missing.';
                insert logRecord;
                return 'Named Credential Developer Name is missing.';
            }

            // Retrieve the related Connection record
            Connection__c connection = [
                SELECT Id
                FROM Connection__c
                WHERE Named_Credential__c = :ncName
                LIMIT 1
            ];

            if (connection == null) {
                logRecord.Status__c = 'Failure';
                logRecord.Message__c = 'No Connection record found for the specified Named Credential: ' + ncName;
                insert logRecord;
                return 'No Connection record found for the specified Named Credential.';
            }

            // Link log record to connection
            logRecord.Connection__c = connection.Id;

            // Prepare HTTP request for Named Credential
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:' + ncName + '/heahealthckeck');
            req.setMethod('GET');

            Http http = new Http();
            try {
                // Send the HTTP request
                HttpResponse res = http.send(req);
                Integer code = res.getStatusCode();
                logRecord.Status_Code__c = code;

                if (code == 401 || code == 403) {
                    logRecord.Status__c = 'Failure';
                    logRecord.Message__c = 'Authentication Failed. Status Code: ' + code;
                    resultMessage = 'Authentication Failed';
                } else {
                    logRecord.Status__c = 'Success';
                    logRecord.Message__c = 'Connection authenticated successfully. Status Code: ' + code;
                    resultMessage = 'Authenticated';
                }

            } catch (System.CalloutException e) {
                // If a callout exception occurs (like network error)
                logRecord.Status__c = 'Error';
                logRecord.Message__c = 'Error during connection test: ' + e.getMessage();
                logRecord.Status_Code__c = null;
                resultMessage = 'Error during connection test';
            }

        } catch (QueryException qe) {
            // Handle case where Connection is not found
            logRecord.Status__c = 'Failure';
            logRecord.Message__c = 'Connection record not found for Named Credential: ' + ncName;
            resultMessage = 'No Connection record found for the specified Named Credential.';
        } catch (Exception ex) {
            // Catch any unexpected errors
            logRecord.Status__c = 'Error';
            logRecord.Message__c = 'Unexpected Error: ' + ex.getMessage();
            resultMessage = 'Unexpected Error: ' + ex.getMessage();
        } finally {
            try {
                // Always save the log
                insert logRecord;
            } catch (Exception logEx) {
                System.debug('Error saving connection test log: ' + logEx.getMessage());
            }
        }

        return resultMessage;
    }
}