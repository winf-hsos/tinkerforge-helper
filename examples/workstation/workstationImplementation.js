var context = require('./lib/context.js');

/* In this file, implement the functions that acatually
 * make the workstation work smart */

/* Global constants */
var config = {
    version: 0.15,
    gameMaster: true,
    gameId: 2,
    workstationId: 'pi10'
}

/* BASIC LOGIC OF WORKSTATION */

/* GLOBAL VARIABLES WE NEED */
var waitForInputQueueConfirmation = false;
var orderForInputQueue = null;

/* What should happen when the initialization is complete */
function initComplete() {
    context.log("Workstation initialization complete");
    context.button.setColor(255, 255, 255);
    context.display.write(0, 0, "Workstation V" + context.workstation.version);
}

function workstationRunning() {
    context.log("Workstation running");
}

function workstationIdle() {
    context.log("Workstation is idle");

    if (context.inputQueue.getSize() > 0) {
        var nextOrder = context.inputQueue.getFirst();
        context.processingQueue.add(nextOrder);
    }
    else {
        context.log("Nothing more to process");
    }
}

function workstationFailed() {
    context.error("Workstation failed - starting repair");
    context.workstation.repair();
}

function orderScanned(order) {

    // Check if the order was already processed at this workstation
    if (order.processedOnWorkstation(context.workstation.id)) {
        context.error("The order was already processed on this workstation. Discarding it.");
        return;
    }

    // Don't do anything if we are currently waiting for a button press
    if (waitForInputQueueConfirmation)
        return;

    //context.log(order);

    // TODO: If item is not anyhwere on the workstation
    if (!context.inputQueue.contains(order)
        && !context.outputQueue.contains(order)
        && !context.processingQueue.contains(order)) {

        // Ask the worker to confirm putting order in input queue
        context.log("Order with ID >" + order.id + "< is not on this workstation yet! Confirm in the next 5 seconds to add the order to the input queue!");

        // Remember the order 
        orderForInputQueue = order;

        // Set the mode to waiting for confirmation
        waitForInputQueueConfirmation = true;

        // Make the button blink
        context.button.blink(255, 255, 255);

        // Wait only for 5 seconds, if no confirmation after that go back to normal
        setTimeout(() => {
            _stopWaitingForInputQueueConfirmation(context);
        }, 5000);
    }

    // TODO: If item is in output queue, take it out!
    if (context.outputQueue.contains(order)) {
        context.outputQueue.remove(order);
    }

    // TODO: If item is processing - error
}

function orderAddedToInputQueue(order) {
    context.log("New order input queue: " + order.id);

    // If workstation is idle..
    if (context.status == "IDLE") {
        context.log("Workstation is idle, adding order to processing queue");
        if (context.processingQueue.getSize() == 0)
            context.processingQueue.add(order);
        else {
            context.log("Cannot add order to processing queue, queue is full. Keeping order in input queue");
        }
    }
}

function orderAddedToProcessingQueue(order) {
    context.workstation.startProcessing();
}

function orderAddedToOutputQueue(order) {
    context.log("An order was added to output queue!")
}

function finishedProcessing(order) {
    context.log("Finished processing!")
}

function finishedSetup() {
    context.workstation.startProcessing();
}

/* Local helper function */
function _stopWaitingForInputQueueConfirmation() {
    waitForInputQueueConfirmation = false;
    context.button.setColor(255, 255, 255);
    orderForInputQueue = null;
}

/* This function is called when the processing
 * is finished */
function processingComplete(processedItem) {
    context.log("Processing complete");
}

/* This function is called when the status of 
 * the workstation changes */
function statusChanged(oldStatus, newStatus) {
    context.log("Status changed: " + newStatus);
}

/* This function is called when the button is
 * pressed or released */
function buttonChanged(valueObj) {

    if (valueObj.value == "RELEASED") {

        if (waitForInputQueueConfirmation) {
            context.log("Adding order to input queue: >" + orderForInputQueue.id + "<");
            context.inputQueue.add(orderForInputQueue);
            _stopWaitingForInputQueueConfirmation();
        } else
            context.workstation._fail();
    }
}

function potiChanged(valueObj) {
    context.log(valueObj.value);
}

function temperatureChanged(temperature) {
    context.log("New temperature: " + temperature);
}


/* Use this function to test the different devices */
function test() {

    // With log() you can log something to the console
    context.log("Log something to the console");

    // Access the different hardware components
    var button = context.button;
    var poti = context.poti;
    var display = context.display;
    var nfc = context.nfc;

    // Output speech via the speaker
    //context.say("Initialization complete!");
}


/* Constants */
exports.config = config;

/* Functions */
exports.processingComplete = processingComplete;
exports.initComplete = initComplete;
exports.workstationRunning = workstationRunning;
exports.workstationIdle = workstationIdle;
exports.workstationFailed = workstationFailed;
exports.statusChanged = statusChanged;
exports.buttonChanged = buttonChanged;
exports.potiChanged = potiChanged;
exports.temperatureChanged = temperatureChanged;
exports.orderScanned = orderScanned;
exports.orderAddedToInputQueue = orderAddedToInputQueue;
exports.orderAddedToOutputQueue = orderAddedToOutputQueue;
exports.orderAddedToProcessingQueue = orderAddedToProcessingQueue;
exports.finishedProcessing = finishedProcessing;
exports.finishedSetup = finishedSetup;