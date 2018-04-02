var { PubNubConnector } = require('../lib/pubNubConnector/PubNubConnector.js');

// Replace your keys here
var pubnub = new PubNubConnector('pub-c-da11d0a7-08c7-421b-81bb-850fc4e390a1', 'sub-c-efadf9a2-cfcb-11e7-9f31-2ae01b29664a');

/* Initialize Device Manager and PubNub.
 * Call function start() when both are finished */
Promise.all([pubnub.initialize()]).then(start);

/* This function executes the example */
function start() {

    console.log("Started...");

    setInterval(() => {
        send("temperature_channel", "group01", Math.random() * 20);
    }, 2000);

    setInterval(() => {
        send("temperature_channel", "group02", Math.random() * 20);
    }, 2300);
}

function send(channel, device, value) {

    var valueObj = { device: device, value: value.value };

    pubnub.publish(valueObj, channel, function (status, response) {
        if (status.statusCode == 200) {
            console.log("Message sent!");
        } else { }
    });
}