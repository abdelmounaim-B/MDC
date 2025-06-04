public with sharing class ExternalAPIHandler {
    private static final Integer CACHE_EXPIRATION_SECONDS = 28800; // 8 hours


    @AuraEnabled
    public static List < Map < String, Object >> getExternalData(String configId, Id recordId) {

        External_System_Configuration__c config = getConfig(configId);
        if (config == null) {
            throw new AuraHandledException('Configuration not found');
        }

        Connection__c connection = getConnection(config.Connection__c);
        String externalId = getExternalId(connection, recordId);
        String response = makeApiCall(config, connection, externalId);

        // Parse and Filter Data
        List < Map < String, Object >> dataList = parseApiResponse(config, response);
        List < Map < String, Object >> filteredData = filterColumns(configId, dataList);

        return filteredData;
    }

    // Get Configuration Record
    private static External_System_Configuration__c getConfig(String configId) {
        return [
            SELECT Connection__c, Endpoint_Path__c, List_Location__c
            FROM External_System_Configuration__c
            WHERE Id =: configId LIMIT 1
        ];
    }
    
    // Get Connection and Named Credentials
    private static Connection__c getConnection(Id connectionId) {
        return [
            SELECT Named_Credential__c
            FROM Connection__c
            WHERE Id =: connectionId LIMIT 1
        ];
    }

    // Get External System ID
    private static String getExternalId(Connection__c connection, Id recordId) {
        External_System_IDs__c externalIdRecord = [
            SELECT External_System_Id__c
            FROM External_System_IDs__c
            WHERE Connection__c =: connection.Id
            AND Account__c =: recordId
            LIMIT 1
        ];

        if (externalIdRecord == null || String.isBlank(externalIdRecord.External_System_Id__c)) {
            throw new AuraHandledException('External ID not found for this record');
        }
        return externalIdRecord.External_System_Id__c;
    }

    private static String makeApiCall(External_System_Configuration__c config, Connection__c connection, String externalId) {
        String cacheKey = config.Id + externalId;

        // Check if the response is already cached
        if (Cache.Org.contains(cacheKey)) {
            String cachedResp = (String) Cache.Org.get(cacheKey);
            System.debug('Cache Hit: ' + cacheKey);
            return cachedResp;
        }

        System.debug('Cache Miss: ' + cacheKey);
        String endpoint = config.Endpoint_Path__c.replace('{id}', externalId);
        System.debug('API Endpoint: ' + endpoint);

        if (connection.Named_Credential__c == null) {
            throw new CalloutException('Named Credential is not set on Connection record.');
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:' + connection.Named_Credential__c + endpoint);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HttpResponse res = http.send(req);
        System.debug('API Response Status Code: ' + res.getStatusCode());

        if (res.getStatusCode() == 200) {
            // Only cache the response if it is successful
            Cache.Org.put(cacheKey, res.getBody(), CACHE_EXPIRATION_SECONDS);
            System.debug('Response cached successfully: ' + cacheKey);
            return res.getBody();
        } else {
            System.debug('API Call Failed: ' + res.getStatusCode() + ' - ' + res.getBody());
            throw new CalloutException('API Call Failed: ' + res.getStatusCode() + ' - ' + res.getBody());
        }
    }


    // Parse API Response with Explicit Data Types
    private static List < Map < String, Object >> parseApiResponse(External_System_Configuration__c config, String response) {
        Map < String, Object > jsonResponse = (Map < String, Object > ) JSON.deserializeUntyped(response);

        // Get List Data using Explicit Types
        List < Map < String, Object >> dataList = new List < Map < String, Object >> ();

        if (jsonResponse.containsKey(config.List_Location__c)) {
            Object listData = jsonResponse.get(config.List_Location__c);
            if (listData instanceof List < Object > ) {
                for (Object item: (List < Object > ) listData) {
                    if (item instanceof Map < String, Object > ) {
                        dataList.add((Map < String, Object > ) item);
                    }
                }
            }
        }

        if (dataList.isEmpty()) {
            throw new AuraHandledException('No data found at the specified List Location');
        }
        return dataList;
    }

    private static List<Map<String, Object>> filterColumns(String configId, List<Map<String, Object>> dataList) {
    List<External_System_Field_Mapping__c> fieldMappings = [
        SELECT Field_JSON_Path__c, Field_Label__c
        FROM External_System_Field_Mapping__c
        WHERE External_System_Configuration__c = :configId AND Is_Active__c = true
        ORDER BY Order__c ASC
    ];

    List<Map<String, Object>> filteredList = new List<Map<String, Object>>();
    for (Map<String, Object> record : dataList) {
        Map<String, Object> filteredRecord = new Map<String, Object>();
        for (External_System_Field_Mapping__c mapping : fieldMappings) {
            String path = mapping.Field_JSON_Path__c;
            if (String.isBlank(path)) continue;

            List<String> parts = path.split('\\.');
            Object value;

            if (parts.size() == 1) {
                value = record.get(parts[0]);
            } else if (parts.size() == 2) {
                Object nested = record.get(parts[0]);
                if (nested instanceof Map<String, Object>) {
                    value = ((Map<String, Object>) nested).get(parts[1]);
                } else {
                    value = null;
                }
            } else {
                // Future handling for deeper levels can go here
                value = null;
            }

            filteredRecord.put(mapping.Field_Label__c, value != null ? String.valueOf(value) : null);
        }
        filteredList.add(filteredRecord);
    }
    return filteredList;
}

    // Configuration Options Wrapper Class
    public class ConfigOptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public ConfigOptionWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    @AuraEnabled
    public static List < ConfigOptionWrapper > getConfigurations() {
        List < ConfigOptionWrapper > configOptions = new List < ConfigOptionWrapper > ();

        List < External_System_Configuration__c > configurations = [
            SELECT Id, Name
            FROM External_System_Configuration__c
            ORDER BY Name ASC
        ];

        for (External_System_Configuration__c config: configurations) {
            configOptions.add(new ConfigOptionWrapper(config.Name, config.Id));
        }
        return configOptions;
    }

    @AuraEnabled(cacheable = true)
    public static List < ConfigDataWrapper > getAllActiveConfigData(Id recordId) {
        List < ConfigDataWrapper > results = new List < ConfigDataWrapper > ();

        List < External_System_Configuration__c > activeConfigs = [
			SELECT Id, Name, Object_Label__c, Connection__r.Name
            FROM External_System_Configuration__c
            WHERE Is_Active__c = true
            ORDER BY Name
        ];

        for (External_System_Configuration__c config: activeConfigs) {
            try {
                List < External_System_Field_Mapping__c > fieldMappings = [
                    SELECT Field_JSON_Path__c, Field_Label__c, Report_Type__c, Order__c
                    FROM External_System_Field_Mapping__c
                    WHERE External_System_Configuration__c =: config.Id and Is_Active__c = true
                    ORDER By Order__c DESC
                ];

                List < Map < String, Object >> data = getExternalData(config.Id, recordId);
                String connName = config.Connection__r != null ? config.Connection__r.Name : 'Unknown';
				results.add(new ConfigDataWrapper(config.Id, config.Object_Label__c, connName, data, fieldMappings));
                
            } catch (Exception e) {
				results.add(new ConfigDataWrapper(config.Id, config.Object_Label__c, 'Unknown', new List<Map<String, Object>>(), e.getMessage()));
            }
        }

        return results;
    }


    public class ConfigDataWrapper {
        @AuraEnabled public String configId;
        @AuraEnabled public String configName;
        @AuraEnabled public String connectionName;
        @AuraEnabled public List < Map < String, Object >> data;
        @AuraEnabled public String error;
        @AuraEnabled public List < External_System_Field_Mapping__c > mappingFields;

        public ConfigDataWrapper(
            String configId,
            String configName,
            String connectionName,
            List < Map < String, Object >> data,
            List < External_System_Field_Mapping__c > mappingFields
        ) {
            this.configId = configId;
            this.configName = configName;
            this.connectionName = connectionName;
            this.data = data;
            this.mappingFields = mappingFields;
            this.error = null;
        }

        public ConfigDataWrapper(
            String configId,
            String configName,
            String connectionName,
            List < Map < String, Object >> data,
            String error
        ) {
            this.configId = configId;
            this.configName = configName;
            this.connectionName = connectionName;
            this.data = data;
            this.error = error;
            this.mappingFields = new List < External_System_Field_Mapping__c > ();
        }
    }

    @AuraEnabled
    // getAllActiveConfigurations
    public static List < External_System_Configuration__c > getAllActiveConfigurations() {
        return [
            SELECT Id, Name, Object_Label__c, Connection__r.Name
            FROM External_System_Configuration__c
            WHERE Is_Active__c = true
            ORDER BY Name ASC
        ];
    }

}