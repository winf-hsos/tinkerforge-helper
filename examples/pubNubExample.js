var { PubNubConnector } = require('../lib/pubNubConnector/PubNubConnector.js');
var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();
var pubnub = new PubNubConnector();


/* Initialize Device Manager and start
 * when finished */
Promise.all([dm.initialize(), pubnub.initialize()]).then(start);

function start() {

    var temperatureSensor = dm.get("zHA");
    temperatureSensor.setCallbackInterval(1000);
    temperatureSensor.registerListener(handleNewTemperatureValue);

    pubnub.subscribe("temperature_channel", handleTemperatureMessageFromPubNub);
}

function handleTemperatureMessageFromPubNub(message) {
    console.log(message);
}

function handleNewTemperatureValue(value) {
    var message = {
        eon: {
            'temperature' : value.value
        }
    };
    
    pubnub.publish(message, "temperature_channel");
}
