var { DeviceManager } = require('../lib/DeviceManager.js');
var { SmartCoolingBoxPubNubWrapper } = require('../lib/pubNubConnector/SmartCoolingBoxPubNubWrapper.js');

var log4js = require('log4js');

// Get the loggers
var logger = log4js.getLogger();

// Get the device manager to access the sensors etc.
var dm = new DeviceManager('localhost', 4223);
var pubnub = new SmartCoolingBoxPubNubWrapper('pub-c-da11d0a7-08c7-421b-81bb-850fc4e390a1', 'sub-c-efadf9a2-cfcb-11e7-9f31-2ae01b29664a');

/* Initialize Device Manager and PubNub.
 * Call function start() when both are finished */
logger.info("Init PubNub...");
Promise.all([
    //dm.initialize(),
    pubnub.initialize()]).then(start).catch(handleError);


var items = [
    { id: 1, type: 1 },
    { id: 2, type: 2 },
    { id: 3, type: 3 },
    { id: 4, type: 1 },
    { id: 5, type: 2 },
    { id: 6, type: 3 },
    { id: 7, type: 1 },
    { id: 8, type: 2 },
    { id: 9, type: 3 }
]

var boxes = [1, 2, 3, 4, 5];

var itemsInBoxes = new Map();

function isInBox(itemId) {
    if (itemsInBoxes.has(itemId))
        return itemsInBoxes.get(itemId);
    else return null;
}


function getItemsInBox(boxId) {
    var itemsInBox = new Set();

    itemsInBoxes.forEach((value, key) => {
        console.log(value);
        if (value == boxId)
            itemsInBox.add(items.filter((i) => { return i.id == key })[0]);
    });

    return itemsInBox;
}

function removeFromBox(itemId) {
    console.log("Rmoving from box");
    var boxId = isInBox(itemId);
    if (boxId !== null) {
        itemsInBoxes.delete(itemId);
        console.log("Notify item removed");
        pubnub.notifyItemRemoved(boxId, itemId, getItemsInBox(boxId));
    }
}

function addToBox(boxId, itemId) {
    console.log("Adding item " + itemId + " to box " + boxId);
    var oldBoxId = isInBox(itemId);
    if (oldBoxId == null) {
        itemsInBoxes.set(itemId, boxId);
        console.log("Notify item added");
        pubnub.notifyItemAdded(boxId, itemId, getItemsInBox(boxId));
    }

}

function addOrRemoveRandomly() {
    // Get random number
    var randomIndex = Math.round(Math.random() * (items.length - 1));
    var item = items[randomIndex];

    console.dir(randomIndex);
    console.dir(item);

    var isInBoxNr = isInBox(item.id);

    console.log(isInBoxNr);

    // Is already in box, takeout
    if (isInBoxNr !== null) {
        removeFromBox(item.id);
    }
    // Not yet in a box
    else {
        boxId = Math.round(Math.random() * (boxes.length - 1)) + 1;
        addToBox(boxId, item.id);
    }
}

function start() {


    logger.info("Started");

    pubnub.subscribe("added-item-to-channel", handleTestMessage);

    setInterval(() => {
        var boxId = Math.round(Math.random() * (boxes.length - 1)) + 1;
        var temperature = 5 + Math.round(Math.random() * 30);

        if (temperature <= 17) {
            pubnub.notifyTemperatureNormal(boxId, temperature);
        }
        else {
            pubnub.notifyTemperatureExceeded(boxId, temperature);
        }

    }, 15000);

    setInterval(() => {
        var boxId = Math.round(Math.random() * (boxes.length - 1)) + 1;
        var light = 1000 + Math.round(Math.random() * 15000);

        if (light <= 10000) {
            pubnub.notifyLightNormal(boxId, light);
        }
        else {
            pubnub.notifyLightExceeded(boxId, light);
        }

    }, 20000);

    setInterval(() => {

        var boxId = Math.round(Math.random() * (boxes.length - 1)) + 1;
        var concussionInG = Math.random() * 8;

        if (concussionInG > 1.5) {
            pubnub.notifyConcussionDetected(boxId, concussionInG.toFixed(2));
        }


    }, 10000);


    setInterval(() => {
        addOrRemoveRandomly();
    }, 2500)

}

function handleTestMessage(message) {
    console.dir(message);
}

function handleError(err) {
    logger.error(err);

}
