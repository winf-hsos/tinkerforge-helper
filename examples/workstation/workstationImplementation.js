var context = require('./lib/context.js');

/* In this file, implement the functions that acatually
 * make the workstation work smart */

/* Global constants */
var config = {
    version: 0.2,
    gameMaster: true,
    gameId: 10,
    workstationId: 'pi10'
}

/* BASIC LOGIC OF WORKSTATION */

/* GLOBAL VARIABLES WE NEED */
var waitForInputQueueConfirmation = false;
var orderForInputQueue = null;

function initComplete() {
    /* TASK 1
     * TODO: When the workstation is done initializing, 
     * light up the button in white color and print the current 
     * software version on the first line of the display! */
    context.warn("Workstation is initialized, do something about it (TASK 1)!");
}

/* What should happen when the workstation is running (game has started)? */
function workstationRunning() {
    context.log("Workstation is now running");
}

function workstationIdle() {
    /* TASK 2
     * TODO: When the workstation becomes idle, check if there is are orders 
     * in the input queue, and if so, take the first order and put it in the processing queue! */

    context.warn("Workstation is idle, do something about it (TASK 2)!");
}

function workstationFailed() {
    /* TASK 7
     * TODO: When the workstation fails, start repairing it immediately! */
    context.warn("Workstation is broken, do something about it (TASK 7)!");

}

/* What do we do with a scanned order that is already on the workstation? */
function orderScanned(order) {

    /* TASK 4
     * TODO: When an order was scanned, and it is currently in the workstation’s output queue, 
       remove it from there to complete it at this workstation! */


    /* TASK 5
     * TODO: When an order was scanned, but the order it is currently processing, output an error!
       */
}

function orderAddedToInputQueue(order) {
    context.log("New order input queue: " + order.id);

    /* TASK 8
     * TODO: Make sure that an order can only be processed once on the same workstation! */


    /* TASK 3 
     * TODO: When an order is added to the input queue, 
     * check if the workstation is idle. If there is nothing in 
     * the processing queue, add the order to the processing queue */
    context.warn("A new order was just added to the input queue - what should happen now? (TASK 3)");
}

function orderRemovedFromInputQueue(order) {
    // TODO: Implement logic as and if needed!
}

function orderAddedToProcessingQueue(order) {
    /* TASK 6:
     * TODO: When an order was placed on the processing queue, 
     * start processing immediately! */
    context.warn("An order was added to the processing queue, do something! (TASK 6)!");
}

function orderRemovedFromProcessingQueue(order) {
    // TODO: Implement logic as and if needed!
}

function orderAddedToOutputQueue(order) {
    // TODO: Implement logic as and if needed!
}

function orderRemovedFromOutputQueue(order) {
    // TODO: Implement logic as and if needed!
}

function finishedProcessing(order) {
    context.log("Finished processing order >" + order.id + "<");
}

function finishedRepair() {
    // TODO: Implement logic as and if needed!
}

function workstationProcessing() {
    // TODO: Implement logic as and if needed!
}

function workstationSetup() {
    // TODO: Implement logic as and if needed!
}

function workstationRepairing() {
    // TODO: Implement logic as and if needed!
}

function repairPctChanged(pct) {
    context.log("Repaired: " + pct.toFixed(1) + "%");
}

function setupPctChanged(pct) {
    context.log("Setup: " + pct.toFixed(1) + "%");
}

function finishedSetup() {
    /* TASK 11
     * TODO: When setup completes, check if there 
     * is something on the processing queue, and if yes, start processing! */
    context.warn("Setup has finished - what should happen now? (TASK 11)");
}

function processingPctChanged(order, pct) {
    context.log("Processed of order " + order.id + ": " + pct.toFixed(1) + "%");
}

/* This function is called when the status of 
 * the workstation changes */
function statusChanged(newStatus) {
    context.log("Status changed: " + newStatus);
}

function setupChanged(newSetup) {
    // TODO: Implement logic as and if needed!
}

function setupRequired(currentSetup, nextOrder) {

    /* TASK 12
     * TODO: If a setup is required to proceed with processing 
     * the next order, perform the setup! */
    context.warn("Setup required from >" + currentSetup + "< to >" + nextOrder.type + "< if we want to proceed! What to do?? (TASK 12");
}

/* This function is called when the button is
 * pressed or released */
function buttonChanged(valueObj) {
    // TODO: Implement logic as and if needed!   
}

function potiChanged(valueObj) {
    /* TASK 9
     * TODO: Show the current temperature and 
     * intensity on the display */
}

function temperatureChanged(temperature) {
    /* TASK 9
    * TODO: Show the current temperature and 
    * intensity on the display */
}

/* END OF IMPLEMENTATION */

/* Constants */
exports.config = config;

/* Functions */

/* Workstation progress callbacks */
exports.processingPctChanged = processingPctChanged;
exports.repairPctChanged = repairPctChanged;
exports.setupPctChanged = setupPctChanged;

/* Workstation finished callbacks */
exports.initComplete = initComplete;
exports.finishedProcessing = finishedProcessing;
exports.finishedSetup = finishedSetup;
exports.finishedRepair = finishedRepair;

/* Workstation status callbacks */
exports.workstationRunning = workstationRunning;
exports.workstationIdle = workstationIdle;
exports.workstationFailed = workstationFailed;
exports.workstationSetup = workstationSetup;
exports.workstationRepairing = workstationRepairing;
exports.workstationProcessing = workstationProcessing;

exports.statusChanged = statusChanged;
exports.setupChanged = setupChanged;
exports.setupRequired = setupRequired;

/* Workstation Device Callbacks */
exports.buttonChanged = buttonChanged;
exports.potiChanged = potiChanged;
exports.temperatureChanged = temperatureChanged;

/* Order Changes Callbacks */
exports.orderScanned = orderScanned;
exports.orderAddedToInputQueue = orderAddedToInputQueue;
exports.orderAddedToOutputQueue = orderAddedToOutputQueue;
exports.orderAddedToProcessingQueue = orderAddedToProcessingQueue;
exports.orderRemovedFromInputQueue = orderRemovedFromInputQueue;
exports.orderRemovedFromProcessingQueue = orderRemovedFromProcessingQueue;
exports.orderRemovedFromOutputQueue = orderRemovedFromOutputQueue;