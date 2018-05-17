var admin = require('firebase-admin');
var serviceAccount = require('../auth/workstation-hsos-firebase-adminsdk-gcqz4-edca75f041.json');
var context = require('../context.js');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://workstation-hsos.firebaseio.com'
});

var firestore = admin.firestore();

function createWorkstation(gameId, workstationId, gameMaster) {

    var workstation = {
        id: workstationId,
        gameMaster: gameMaster
    }

    return firestore.collection("games/" + gameId.toString() + "/workstations").doc(workstationId).set(workstation)
}

function createOrders(gameId, ordersFile) {

    /* Init orders */
    require('fs').readFile(ordersFile, 'utf8', function (err, data) {
        if (err)
            console.log(err);

        var obj = JSON.parse(data);

        var proms = [];

        obj.orders.forEach((i) => {
            proms.push(firestore.collection("games/" + gameId.toString() + "/orders").doc(i.id.toString()).set(i));
        })

        return Promise.all(proms);
    });
}

function createGame(gameId) {

    var game = {
        id: gameId,
        status: 'Not started',
        time: 0.0
    }

    return firestore.collection("games").doc(gameId.toString()).set(game);
}

function deleteGame(gameId) {
    return Promise.all([
        _deleteOrdersForGame(gameId),
        _deleteWorkstationsForGame(gameId),
        _deleteEventsForGame(gameId),
        _deleteFieldsForGame(gameId)
    ]);

}

function _deleteOrdersForGame(gameId) {
    var proms = [];

    // Clear orders
    return firestore.collection("games/" + gameId.toString() + "/orders").get().then((orders) => {
        orders.forEach((i) => {
            proms.push(firestore.collection("games/" + gameId.toString() + "/orders").doc(i.id).delete());
        })
        return Promise.all(proms);
    })
}

function _deleteWorkstationsForGame(gameId) {
    var proms = [];

    // Clear workstations
    return firestore.collection("games/" + gameId.toString() + "/workstations").get().then((workstations) => {
        workstations.forEach((w) => {
            proms.push(firestore.collection("games/" + gameId.toString() + "/workstations").doc(w.id).delete());
        })
        return Promise.all(proms);
    })
}

function _deleteEventsForGame(gameId) {

    var proms = [];

    // Clear events
    return firestore.collection("games/" + gameId.toString() + "/events").get().then((events) => {
        events.forEach((e) => {
            proms.push(firestore.collection("games/" + gameId.toString() + "/events").doc(e.id).delete());
        })
        return Promise.all(proms);
    })
}


function _deleteFieldsForGame(gameId) {
    return firestore.collection("games").doc(gameId.toString()).set({
        started: null,
        id: null
    })
}

function addEvent(gameId, workstationId, orderId, event, time) {
    var event = {
        workstationId: workstationId,
        orderId: orderId,
        event: event,
        time: time,
        timestamp: Date.now()
    }

    return firestore.collection("games/" + gameId.toString() + "/events").add(event);
}

function updateTime(gameId, time) {
    return firestore.collection("games").doc(gameId.toString()).update({ time: time });
}

function syncQueueOnline(queue) {

    var workstationUpdate = {};

    var orderArray = [];
    queue.queue.forEach((order) => {
        orderArray.push(order.toJson());
    })

    if (queue.name == "inputQueue") {
        workstationUpdate.inputQueue = orderArray;
    }
    else if (queue.name == "outputQueue") {
        workstationUpdate.outputQueue = orderArray;
    }
    else if (queue.name == "processingQueue") {
        workstationUpdate.processingQueue = orderArray;
    }

    return firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update(workstationUpdate);

}

function syncProcessedOrdersOnline(processedOrders) {

    var workstationUpdate = {};

    var orderArray = [];
    processedOrders.forEach((order) => {
        orderArray.push(order.toJson());
    })

    workstationUpdate.processedOrders = orderArray;

    return firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update(workstationUpdate);


}

function updateOrderLocation(order, queueName) {

    var workstationId = context.workstation.id;
    var location = queueName == null ? "-" : queueName + "@" + workstationId;

    return firestore.collection("games/" + context.gameId.toString() + "/orders").doc(order.id).update({ location: location });
}

function updateOrderStatus(order, status) {
    return firestore.collection("games/" + context.gameId.toString() + "/orders").doc(order.id).update({ status: status });
}

function syncWorkstationOnline() {

    var workstationUpdate = {};
    workstationUpdate.status = context.status;
    workstationUpdate.setup = context.setup;
    workstationUpdate.temperature = context.temperature || 0.0;
    workstationUpdate.intensity = context.intensity;

    return firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update(workstationUpdate);
}


function updateOrderFinishedWorkstation(order) {

    var finishedWorkstations = order.finishedWorkstations || [];

    finishedWorkstations.push(context.workstation.id);

    return Promise.all([

        firestore.collection("games/" + context.gameId.toString() + "/orders")
            .doc(order.id, toString()).update({ status: "Waiting", finishedWorkstations: finishedWorkstations })
    ]);
}

function updateOrderProcessingPct(order, pct) {
    return Promise.all([
        firestore.collection("games/" + context.gameId.toString() + "/orders").doc(order.id).update({ processingPct: pct }),
        firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update({ processingPct: pct })
    ]);
}

function updateWorkstationRepairPct(pct) {
    return firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update({ repairPct: pct });
}

function updateWorkstationSetupPct(pct) {
    return firestore.collection("games/" + context.gameId.toString() + "/workstations").doc(context.workstation.id).update({ setupPct: pct });
}

function checkIfFinished() {
    var numOrders;
    var allProcessed = true;

    // Get the number of orders
    return firestore.collection("games").doc(context.gameId.toString()).collection("orders").get().then((orders) => {

        numOrders = orders.size;

        // Get all workstations
        return firestore.collection("games").doc(context.gameId.toString()).collection("workstations").get().then((workstations) => {

            workstations.forEach((w) => {
                allProcessed = w.data().processedOrders.length == numOrders;
            })

            if (allProcessed == true) {
                context.log("Game finished!");
                return finishGame();
            }
            else {
                context.log("Not all orders have been processed yet!");
                return false;
            }
        })
    })
}

function finishGame() {
    return Promise.all([
        firestore.collection("games").doc(context.gameId.toString()).update({ status: 'Finished' }),
        addEvent(context.gameId, context.workstation.id, '-', "Game finished", context.time)
    ]);
}


exports.deleteGame = deleteGame;
exports.createGame = createGame;
exports.createWorkstation = createWorkstation;
exports.createOrders = createOrders;
exports.addEvent = addEvent;
exports.updateTime = updateTime;
exports.syncQueueOnline = syncQueueOnline;
exports.syncWorkstationOnline = syncWorkstationOnline;
exports.syncProcessedOrdersOnline = syncProcessedOrdersOnline;
exports.updateOrderLocation = updateOrderLocation;
exports.updateOrderStatus = updateOrderStatus;
exports.updateOrderFinishedWorkstation = updateOrderFinishedWorkstation;
exports.updateOrderProcessingPct = updateOrderProcessingPct;
exports.updateWorkstationRepairPct = updateWorkstationRepairPct;
exports.updateWorkstationSetupPct = updateWorkstationSetupPct;
exports.checkIfFinished = checkIfFinished;
exports.firestore = firestore;