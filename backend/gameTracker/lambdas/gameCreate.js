const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log(event.body);
    
    var bodyJSON = JSON.parse(event.body);
    

    createGame(bodyJSON).then((response) => {
        callback(null,
        {
            statusCode: 200,
            body: JSON.stringify(response)
        }
        );
    });
}

function createGame(jsonRequest) {
    
    // Retrieve the list of keys available in the jsonRequest
    var keys = Object.keys(jsonRequest);
    
    if (!(keys.includes("year")) || !(keys.includes("gameId"))) {
        // Can't create a Game without the primary and sort keys
        return Promise.resolve("Can't create game, missing keys");
    }
    
    // Initialize a new Game object to create
    var gameToCreate = {};
    
    for (const key of keys) {
        // Filter the 'action' key as it isn't
        if (key == "action") {
            continue;
        }
        gameToCreate[key] = jsonRequest[key];
    }
    
    return ddb.put({
        TableName: 'gameTracker-games',
        Item: gameToCreate
    }).promise();
    
}
