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

    updateGames(bodyJSON).then((response) => {
        callback(null,
        {
            statusCode: 200,
            body: JSON.stringify(response)
        }
        );
    });
}

function updateGames(jsonRequest) {
    // Retrieve the list of keys available in the jsonRequests
    var keys = Object.keys(jsonRequest);

    // Initialize the params for the game update
    const gameParams = {
        TableName: TABLE_NAME
    };

    // Compose the keys Object
    const keyMap = new Map();
    const conditionArray = [];
    const updateExpressionArray = [];
    const expressionAttributeNamesMap = {};
    const expressionAttributeValuesMap = {};

    // Traverse all keys and assign them to the proper array/map
    for (const key of keys) {
        if (KEYS_ARRAY.includes(key)) {
            // Add the keys to the keyMap
            keyMap.set(key, jsonRequest[key]);
            conditionArray.push(`#${key} = :${key}`);
        } else if (key != ACTION_KEY) {
            // Add the keys to the updateExpression
            updateExpressionArray.push(`#${key} = :${key}`);
        }

        // Add the expression attribute name and values
        if (key != ACTION_KEY) {
            expressionAttributeNamesMap[`#${key}`] = key;
            expressionAttributeValuesMap[`:${key}`] = jsonRequest[key];
        }
    }

    // Convert the keyMap to a JSON object
    const keyObj = Object.fromEntries(keyMap);

    // Convert arrays to strings
    const updateExpressionString = "set " + updateExpressionArray.join(", ");
    const conditionalString = conditionArray.join(" and ");
    console.log(`updateExpression: ${updateExpressionString}`);
    
    // Update the gameParams
    gameParams.Key = keyObj;
    gameParams.ConditionExpression = conditionalString;
    gameParams.UpdateExpression = updateExpressionString;
    gameParams.ExpressionAttributeNames = expressionAttributeNamesMap;
    gameParams.ExpressionAttributeValues = expressionAttributeValuesMap;
    
    // Launch the update
    return ddb.update(gameParams).promise();
}