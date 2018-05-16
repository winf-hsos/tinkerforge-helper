var db = require('./utils/database.js');
var context = require('./context.js');

class Order {
    constructor(id, type) {
        this.id = id;
        this.type = type;
    }

    processedOnWorkstation(workstationId) {
        if (this.finishedWorkstations) {
            var wasOnWorkstation = this.finishedWorkstations.some((wsId) => {
                return wsId == workstationId;
            });

            return wasOnWorkstation;
        }
        else return false;
    }

    getOnlineInfo(gameId) {
        var _this = this;

        return db.firestore.collection("games/" + gameId.toString() + "/orders").doc(_this.id.toString()).get().then(function (order) {
            if (order.exists) {

                // Update the quantity
                if (typeof order.data().quantity !== "undefined")
                    _this.quantity = order.data().quantity;

                // Update the finished workstations
                if (typeof order.data().finishedWorkstations !== "undefined")
                    _this.finishedWorkstations = order.data().finishedWorkstations;

                // Update the finished workstations
                if (typeof order.data().processingPct !== "undefined")
                    _this.processingPct = order.data().processingPct;

                // Update the finished workstations
                if (typeof order.data().location !== "undefined")
                    _this.location = order.data().location;

                // Update the finished workstations
                if (typeof order.data().status !== "undefined")
                    _this.status = order.data().status;

                return _this;
            } else {
                // doc.data() will be undefined in this case
                console.error("Order with ID >" + _this.id + "< not found online!");
                return _this;
            }
        })


    }


    toJson() {
        return {
            id: this.id,
            type: this.type,
            quantity: this.quantity || null
        }
    }

}

exports.Order = Order;