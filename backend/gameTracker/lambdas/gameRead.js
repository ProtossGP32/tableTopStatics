const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

// Constants
const TABLE_NAME = "gameTracker-games";
const ACTION_KEY = "action";
const PARTITION_KEY = "year";
const SORT_KEY = "gameId";
const GAME_NAME = "primaryName";
const KEYS_ARRAY = [PARTITION_KEY, SORT_KEY];

// Lambda handler
exports.handler = (event, context, callback) => {
    console.log(`event: ${event.body}`);
    var bodyJSON = JSON.parse(event.body);

    readGames(bodyJSON).then((response) => {
        callback(null,
        {
            statusCode: 200,
            body: JSON.stringify(response)
        }
        );
    });
}

function readGames(jsonRequest) {
    
    // Retrieve the list of keys available in the jsonRequest
    var keys = Object.keys(jsonRequest);

    // Initialize the params for the game search
    const gameParams = {
        TableName: TABLE_NAME
    };

    const filterExpressionArray = [];
    const keyConditionArray = [];
    const expressionAttributeNamesMap = {};
    const expressionAttributeValuesMap = {};
    
    // Traverse all keys and assign them to the proper array/map
    for (const key of keys) {
        if (KEYS_ARRAY.includes(key)) {
            // Add the keys to the keyCondition
            keyConditionArray.push(`#${key} = :${key}`);
        } else if (key != ACTION_KEY) {
            // Add the keys to the filterExpressionArray
            filterExpressionArray.push(`#${key} = :${key}`);
        }
        
        if ((key != ACTION_KEY)) {
            expressionAttributeNamesMap[`#${key}`] = key;
            expressionAttributeValuesMap[`:${key}`] = jsonRequest[key];
        }
    }
    
    // DEBUG
    //console.log(`keyConditionExpression: ${keyConditionArray.join(" and ")}`);
    //console.log(`filterExpression: ${filterExpressionArray.join(" and ")}`);
    //console.log(`expressionAttributeNamesMap: ${JSON.stringify(expressionAttributeNamesMap)}`);
    //console.log(`expressionAttributeValuesMap: ${JSON.stringify(expressionAttributeValuesMap)}`);
    
    // Convert arrays to strings
    const keyConditionString = keyConditionArray.join(" and ");
    const filterExpressionString = filterExpressionArray.join(" and ");
    
    
    // Depending on the available fields in the request, launch a 'get', a 'query' or a 'scan'

    let query_success = keys.includes(PARTITION_KEY) && filterExpressionArray.length;
    let get_success = KEYS_ARRAY.every((key) => keys.includes(key)) && !filterExpressionArray.length;
    //console.log(`get_success: ${get_success}`);
    //console.log(`query_success: ${query_success}`);

    if (get_success) {
        console.log("Launching a 'get' command:");
        // Compose the keys Object
        const keyMap = new Map();
        keyMap.set(PARTITION_KEY, jsonRequest[PARTITION_KEY]);
        keyMap.set(SORT_KEY, jsonRequest[SORT_KEY]);
        // Convert the keyMap to a JSON object
        const keyObj = Object.fromEntries(keyMap);
        // Update the gameParams
        gameParams.Key = keyObj;
        // Do a get
        console.log(`gameParams: ${JSON.stringify(gameParams)}`);
        return ddb.get(gameParams).promise();

    } else if (query_success) {
        console.log("Launching a 'query' command:");
        // Update gameParams with the required 'query' params
        gameParams.KeyConditionExpression = keyConditionString;
        gameParams.FilterExpression = filterExpressionString;
        gameParams.ExpressionAttributeNames = expressionAttributeNamesMap;
        gameParams.ExpressionAttributeValues = expressionAttributeValuesMap;
        // Do a query
        return ddb.query(gameParams).promise();
    } else {
        console.log("Launching a 'scan' command:");
        // Update gameParams with the required 'scan' params
        gameParams.FilterExpression = filterExpressionString;
        gameParams.ExpressionAttributeNames = expressionAttributeNamesMap;
        gameParams.ExpressionAttributeValues = expressionAttributeValuesMap;
        // Do a scan
        return ddb.scan(gameParams).promise();
    }
}
