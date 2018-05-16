var { PubNubConnector } = require('./PubNubConnector.js');

class WorkstationPubNubWrapper {

    constructor(publishKey, subscribeKey) {
        this.pubnub = new PubNubConnector(publishKey, subscribeKey);
    }

    initialize() {
        return this.pubnub.initialize();
    }

    subscribe(channel, callback) {
        this.pubnub.subscribe(channel, callback);
    }

    notifyItemAdded(boxId, itemId, itemsInBox) {
        var message = { text: "Item with ID >" + itemId + "< added to box with ID >" + boxId + "<", boxId: boxId, itemId: itemId, products: JSON.stringify(Array.from(itemsInBox)) };
        this.pubnub.publish(message, "added-item-to-channel");
    }

    notifyItemRemoved(boxId, itemId, itemsInBox) {
        var message = { text: "Item with ID >" + itemId + "< removed from box with ID >" + boxId + "<", boxId: boxId, itemId: itemId, products: JSON.stringify(Array.from(itemsInBox)) };
        this.pubnub.publish(message, "removed-item-from-channel");
    }

    notifyTemperatureExceeded(boxId, temperature) {
        var message = { text: "The current temperature >" + temperature + "< in box with ID>" + boxId + "< exceedes the threshold!", temperature: temperature, type: "exceeded", boxId: boxId };
        this.pubnub.publish(message, "temperature-channel");
    }

    notifyTemperatureNormal(boxId, temperature) {
        var message = { text: "The current temperature >" + temperature + "< in box with ID>" + boxId + "< is in the accepted range again!", temperature: temperature, type: "normal", boxId: boxId };
        this.pubnub.publish(message, "temperature-channel");
    }

    notifyConcussionDetected(boxId, concussionInG) {
        var message = { text: "A concussion of >" + concussionInG + "< was detected in box with ID>" + boxId + "< !", concussion: concussionInG, boxId: boxId };
        this.pubnub.publish(message, "concussion-channel");
    }

    notifyLightExceeded(boxId, light) {
        var message = { text: "The current light level of >" + light + "< in box with ID>" + boxId + "< is too high!", light: light, boxId: boxId, type: "exceeded" };
        this.pubnub.publish(message, "light-channel");
    }

    notifyLightNormal(boxId, light) {
        var message = { text: "The current light level of >" + light + "< in box with ID>" + boxId + "< is in the accepted range again!", light: light, boxId: boxId, type: "normal" };
        this.pubnub.publish(message, "light-channel");
    }

}

exports.WorkstationPubNubWrapper = WorkstationPubNubWrapper;