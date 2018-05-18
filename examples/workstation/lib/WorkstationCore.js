var { DeviceManager } = require('../../../lib/DeviceManager.js');
var { Queue } = require('./Queue.js');
var { Order } = require('./Order.js');
var wsImplementation = require('../workstationImplementation.js');
var config = require('../workstationImplementation.js').config;
var db = require('./utils/database.js');
var d3 = require("d3-random");
var context = require('./context.js');

class WorkstationCore {

    constructor() {

        // Set Workstation ID
        this.id = config.workstationId;

        // Info for the game
        this.gameMaster = config.gameMaster;
        this.version = config.version;

        // Get the device manager to access the hardware
        this.dm = new DeviceManager('localhost', 4223);

        // Initialize the input and output queues
        this.inputQueue = new Queue("inputQueue", this);
        this.outputQueue = new Queue("outputQueue", this);
        this.processingQueue = new Queue("processingQueue", this, 1);

        this.processedOrders = [];

        // The current order processing on this workstation
        this.orderProcessing = null;

        // Update the context object
        context.inputQueue = this.inputQueue;
        context.outputQueue = this.outputQueue;
        context.processingQueue = this.processingQueue;
        context.workstationId = this.id;
        context.workstation = this;

        // Intially, set running to false
        this.running = false;

        // Initialize last scanned ID
        this.lastScannedId = -1;

        this._waitForInputQueueConfirmation = false;
    }

    init() {
        var _this = this;
        return this._init().then(() => {
            if (typeof wsImplementation.initComplete != "undefined") {
                wsImplementation.initComplete();
            }
            else
                context.warn("The workstation was initialized. If you want to do something with this event, implement >initComplete()< to make me smarter!");
        });
    }

    run() {
        this.running = true;

        if (typeof wsImplementation.workstationRunning != "undefined") {
            wsImplementation.workstationRunning();
        }
        else
            context.warn("The workstation started running. If you want to do something with this event, implement >workstationRunning()< to make me smarter!");

        this._setStatus("IDLE");
        this._setSetup(1);
        this._setTemperature(0.0);
        db.syncWorkstationOnline();

        // Set interval for temperature check
        this._temperatureCheckInterval = setInterval(this._updateTemperature.bind(this), 1000);

        // Set interval for failure check
        this._failureCheckInterval = setInterval(this._checkFailure.bind(this), 2000);
    }

    stop() {
        context.log("Workstation shuts down...");
        process.exit(0);
    }

    repair() {
        if (this.status !== "FAILED") {
            context.error("Cannot repair, workstation is not broken!");
            return;
        }

        this._setStatus("REPAIR");
        this._setupDuration = d3.randomNormal(30, 10)();
        this._setupDurationLeft = this._setupDuration;

        var _this = this;

        this._repairInterval = setInterval(() => {

            _this._setupDurationLeft -= 1;

            var repairPct = Math.min(1, (1 - (_this._setupDurationLeft / _this._setupDuration))) * 100;

            if (typeof wsImplementation.repairPctChanged != "undefined") {
                wsImplementation.repairPctChanged(repairPct);
            }
            else
                context.warn("The workstation made progress repairing. If you want to do something with this event, implement >repairPctChanged(pct)< to make me smarter!");

            db.updateWorkstationRepairPct(repairPct);

            if (_this._setupDurationLeft <= 0) {
                clearInterval(_this._repairInterval);
                _this._finishedRepair();
            }
        }, 1000);
    }

    startProcessing() {

        if (this.status == "FAILED") {
            context.error("Error: Workstation is currently down and not available for processing!");
            return;
        }

        if (this.status == "SETUP") {
            context.error("Error: Workstation is currently set up and not available for processing!");
            return;
        }

        if (this.status == "PROCESSING") {
            context.error("Error: Workstation is currently processing and not available for further processing!");
            return;
        }

        if (this.processingQueue.getSize() == 0) {
            context.error("Error: Cannot process, nothing in processing queue!");
            return;
        }

        var nextOrder = this.processingQueue.getFirst();

        // Check if setup is necessary
        if (nextOrder.type.toString() !== this.setup.toString()) {

            if (typeof wsImplementation.setupRequired != "undefined") {
                wsImplementation.setupRequired(this.setup, nextOrder);
            }
            else {
                context.warn("The workstation must (and will) perform setup to process the next order. If you want to do something different, implement >setupRequired(currentSetup, nextOrder)< to make me smarter!");
                context.log("Current setup >" + this.setup + "< does not match the next order's required setup >" + nextOrder.type + "<. Must modify setup first!");
                this.setupTo(nextOrder.type);
            }

            return;
        }

        this._setStatus("PROCESSING");

        this.orderProcessing = this.processingQueue.getFirst();

        this.totalToProcess = this.orderProcessing.quantity * 100;
        this._stillToProcess = this.totalToProcess;

        var _this = this;

        db.updateOrderStatus(this.orderProcessing, "Processing").then(() => {
            _this._processingInterval = setInterval(() => {
                // When set to 100 speed, we eliminate 100 units per second
                // When set to 50, we make 50 units per second
                // When running at 0, we make nothing
                var avgUnitsPerSecond = 100 * (_this.intensity / 100);

                _this._stillToProcess -= avgUnitsPerSecond;

                var processingPct = Math.min(1, (1 - (_this._stillToProcess / _this.totalToProcess))) * 100;


                if (typeof wsImplementation.processingPctChanged != "undefined") {
                    wsImplementation.processingPctChanged(this.orderProcessing, processingPct);
                }
                else
                    context.warn("The workstation made progress processing an order. If you want to do something with this event, implement >processingPctChanged(order, pct)< to make me smarter!");

                //context.log("Processed: " + processingPct.toFixed(1) + "%");

                db.updateOrderProcessingPct(this.orderProcessing, processingPct);

                if (_this._stillToProcess <= 0) {
                    clearInterval(_this._processingInterval);
                    _this._finishedProcessing();
                }
            }, 1000);

        });
    }

    _stopProcessing() {
        clearInterval(this._processingInterval);
        return db.updateOrderProcessingPct(this.orderProcessing, null);
    }

    _finishedProcessing() {

        // Put to output queue (removes it from processing queue)
        Promise.all([
            this.outputQueue.add(this.orderProcessing),
            db.updateOrderProcessingPct(this.orderProcessing, null)
        ]).then(() => {
            this._setStatus("IDLE");

            if (typeof wsImplementation.finishedProcessing != "undefined") {
                wsImplementation.finishedProcessing(this.orderProcessing);
            }
            else
                context.warn("The workstation finished processing. If you want to do something with this event, implement >finishedProcessing(order)< to make me smarter!");

            this.orderProcessing = null;


        })

    }

    _finishedRepair() {
        this._setStatus("IDLE");
        Promise.all(
            [
                db.updateWorkstationRepairPct(null),
                db.addEvent(context.gameId, this.id, '-', "Workstation repaired", context.time)
            ]).then(() => {
                if (typeof wsImplementation.finishedRepair != "undefined") {
                    wsImplementation.finishedRepair();
                }
                else
                    context.warn("The workstation finished repairing. If you want to do something with this event, implement >finishedRepair()< to make me smarter!");

            });
    }

    _finishedSetup() {
        this._setStatus("IDLE");
        Promise.all(
            [
                db.updateWorkstationSetupPct(null),
                db.addEvent(context.gameId, this.id, '-', "Workstation setup to type >" + this.setup + "< finished", context.time)
            ]).then(() => {
                if (typeof wsImplementation.finishedSetup != "undefined") {
                    wsImplementation.finishedSetup();
                }
                else
                    context.warn("The workstation finished setup. If you want to do something with this event, implement >finishedSetup()< to make me smarter!");

            });

    }

    _fail() {

        if (this.status !== "PROCESSING") {
            context.error("Workstation can only fail during processing!");
            return;
        }

        var _this = this;

        // If an order is currently processing, put back to inputQueue
        if (this.orderProcessing !== null) {
            Promise.all([
                this._stopProcessing(),
                this.inputQueue.add(this.orderProcessing)
            ]).then(() => {
                continueFail();
            })
        }
        else {
            continueFail();
        }

        function continueFail() {
            _this._setStatus("FAILED");
        }
    }

    /* Public funtion to setup the workstation */
    setupTo(toType) {

        if (this.status !== "IDLE") {
            context.error("Cannot setup, workstation is not in idle state!");
            return;
        }

        this._setStatus("SETUP");

        var durations = [
            [0, 0, 0, 0],
            [0, 0, 20, 30],
            [0, 20, 0, 60],
            [0, 30, 50, 0]
        ];

        var meanDuration = durations[this.setup][toType];
        //console.log(meanDuration);

        this._setupDuration = d3.randomNormal(meanDuration, meanDuration / 10)();
        this._setupDurationLeft = this._setupDuration;

        var _this = this;

        this._setupInterval = setInterval(() => {

            _this._setupDurationLeft -= 1;

            var setupPct = Math.min(1, (1 - (_this._setupDurationLeft / _this._setupDuration))) * 100;

            if (typeof wsImplementation.setupPctChanged != "undefined") {
                wsImplementation.setupPctChanged(setupPct);
            }
            else
                context.warn("The workstation made progress setting up. If you want to do something with this event, implement >setupPctChanged(pct)< to make me smarter!");

            db.updateWorkstationSetupPct(setupPct);

            if (_this._setupDurationLeft <= 0) {
                clearInterval(_this._setupInterval);
                _this._setSetup(toType);
                _this._finishedSetup();
            }
        }, 1000);
    }

    _setSetup(setup) {

        // If the setup is being initialized, don't sync
        if (typeof this.setup == "undefined") {
            this.setup = setup;
            context.setup = setup;
            return;
        }
        else {
            this.setup = setup;
            context.setup = setup;
        }

        db.syncWorkstationOnline();

        if (typeof wsImplementation.setupChanged != "undefined") {
            wsImplementation.setupChanged(this.setup);
        }
        else
            context.warn("The workstation setup has changed. If you want to do something with this event, implement >setupChanged(setup)< to make me smarter!");
    }

    _setStatus(status) {

        var oldStatus = this.status;

        // If the status is being initialized, don't sync
        if (typeof this.status == "undefined") {
            this.status = status;
            context.status = status;
            return;
        }
        else {
            this.status = status;
            context.status = status;
        }

        db.syncWorkstationOnline();

        if (status == "IDLE") {
            if (typeof wsImplementation.workstationIdle != "undefined") {
                wsImplementation.workstationIdle();
            }
            else
                context.warn("The workstation became idle. If you want to do something with this event, implement >workstationIdle()< to make me smarter!");
        }
        else if (status == "PROCESSING") {
            if (typeof wsImplementation.workstationProcessing != "undefined") {
                wsImplementation.workstationProcessing();
            }
            else
                context.warn("The workstation is now processing. If you want to do something with this event, implement >workstationProcessing()< to make me smarter!");
        }
        else if (status == "SETUP") {
            if (typeof wsImplementation.workstationSetup != "undefined") {
                wsImplementation.workstationSetup();
            }
            else
                context.warn("The workstation is currently changing its setup. If you want to do something with this event, implement >workstationSetup()< to make me smarter!");
        }
        else if (status == "FAILED") {

            db.addEvent(context.gameId, this.id, '-', "Workstation failed", context.time).then(() => {
                if (typeof wsImplementation.workstationFailed != "undefined") {
                    wsImplementation.workstationFailed();
                }
                else
                    context.warn("The workstation failed and needs repair. If you want to do something with this event, implement >workstationFailed()< to make me smarter!");
            });
        }

        else if (status == "REPAIR") {

            db.addEvent(context.gameId, this.id, '-', "Workstation repairing", context.time).then(() => {
                if (typeof wsImplementation.workstationRepairing != "undefined") {
                    wsImplementation.workstationRepairing();
                }
                else
                    context.warn("The workstation is repairing. If you want to do something with this event, implement >workstationRepairing()< to make me smarter!");
            });
        }

        if (this.status !== oldStatus) {
            if (typeof wsImplementation.statusChanged != "undefined") {
                wsImplementation.statusChanged(this.status);
            }
            else
                context.warn("The workstation's status changed. If you want to do something with this event, implement >statusChanged(newStatus)< to make me smarter!");

        }
    }

    _updateTemperature() {

        var newTemperature;

        // If not processing, heat goes down
        if (this.status !== "PROCESSING") {
            newTemperature = Math.min(Math.max(context.temperature - d3.randomNormal(1, 0.1)(), 0), 100);

            if (newTemperature == context.temperature)
                return;
        }
        else {
            // Probability for temperature increase is higher with more intensity
            var p = this.intensity / 100;

            // If intensity of over 40, a chance is there we overheat
            if (p > 0.4) {

                var decide = Math.random();
                if (decide < p) {
                    newTemperature = Math.min(Math.max(context.temperature + d3.randomNormal(2, 0.25)(), 0), 100);
                }
                else return;
            }
            else {
                var decide = Math.random();
                if (decide < 1 - p) {
                    newTemperature = Math.min(Math.max(context.temperature - d3.randomNormal(0.5, 0.05)(), 0), 100);
                }
                else return;
            }
        }

        this._setTemperature(newTemperature);

    }

    _checkFailure() {

        if (this.status !== "PROCESSING")
            return;

        // No failures below 80
        if (this.temperature < 80) {
            return;
        }
        else {
            var p = ((this.temperature - 80) / 20) * 0.075;
            var decide = Math.random();
            if (decide < p) {
                this._fail();
            }
        }

    }

    _setTemperature(temperature) {

        // If the temperature is being initialized, don't sync
        if (typeof this.temperature == "undefined") {
            this.temperature = temperature;
            context.temperature = temperature;
            return;
        }
        else {
            this.temperature = temperature;
            context.temperature = temperature;
        }

        db.syncWorkstationOnline();

        if (typeof wsImplementation.temperatureChanged != "undefined") {
            wsImplementation.temperatureChanged(this.temperature);
        }
        else
            context.warn("The workstation's temperature level has changed. If you want to do something with this event, implement >temperatureChanged(temperature)< to make me smarter!");
    }

    _init() {
        var _this = this;
        return new Promise((resolve, reject) => {
            Promise.all([this.dm.initialize()])
                .then(() => {
                    _this.button = _this.dm.getByDeviceIdentifier(282);
                    _this.nfc = _this.dm.getByDeviceIdentifier(286);
                    _this.display = _this.dm.getByDeviceIdentifier(263);
                    _this.poti = _this.dm.getByDeviceIdentifier(267);

                    // Set references for context as well
                    context.button = _this.button;
                    context.nfc = _this.nfc;
                    context.display = _this.display;
                    context.poti = _this.poti;

                    _this.button.registerListener(_this._buttonChanged.bind(_this));
                    _this.poti.registerListener(_this._potiChanged.bind(_this));

                    _this.poti.device.getPosition((value) => {
                        _this.intensity = value;
                        context.intensity = _this.intensity;
                    });

                    // TODO: Set poti to 50%
                    _this.nfc.scan(_this._scanCompleted.bind(_this), _this._scanError.bind(_this));

                    resolve();

                }).catch(this._handleError);
        })
    }

    _buttonChanged(valueObj) {
        if (!this.running)
            return;

        if (valueObj.value == "RELEASED") {
            if (this._waitForInputQueueConfirmation) {
                context.log("Adding order to input queue: >" + this._orderForInputQueue.id + "<");
                context.inputQueue.add(this._orderForInputQueue);
                this._stopWaitingForInputQueueConfirmation();
            }
        }

        if (!this._waitForInputQueueConfirmation) {

            if (typeof wsImplementation.buttonChanged != "undefined") {
                wsImplementation.buttonChanged(valueObj);
            }
            else
                context.warn("The button was pressed or released for no known reason. If you want to do something with this event, implement >buttonChanged(valueObj)< to make me smarter!");
        }
    }

    _potiChanged(valueObj) {

        this.intensity = valueObj.value;
        context.intensity = this.intensity;

        if (!this.running)
            return;

        
        db.syncWorkstationOnline().then(() => {
            if (typeof wsImplementation.potiChanged != "undefined") {
                wsImplementation.potiChanged(valueObj);
            }
            else
                context.warn("The potentiometer was changed. If you want to do something with this event, implement >potiChanged(valueObj)< to make me smarter!");
        })
    }

    _scanCompleted(valueObj) {
        //context.log("Scanned an object: " + valueObj);
        if (!this.running) {
            // Immediately scan again
            this.nfc.scan(this._scanCompleted.bind(this), this._scanError.bind(this));
            return;
        }


        if (this.lastScannedId !== valueObj.id) {

            // Create event for online dashboard
            db.addEvent(context.gameId, this.id, valueObj.id, "Scanned order", context.time);

            // Construct item
            var order = new Order(valueObj.id, valueObj.type);
            order.getOnlineInfo(context.gameId).then((updatedOrder) => {

                // Check if this order is already on another workstation
                if (order.isOnDifferentWorkstation()) {
                    context.error("Error: The order with ID >" + order.id + "< is already on a different workstation! Discarding scan!");
                    return;
                }
                else {
                    this._orderScanned(order);
                }
            });
        }

        // Remember this ID
        this.lastScannedId = valueObj.id;

        // After 5 seconds, let the same order be scanned again
        setTimeout(() => { this.lastScannedId = -1; }, 5000);

        // Immediately scan again
        this.nfc.scan(this._scanCompleted.bind(this), this._scanError.bind(this));
    }

    _orderScanned(order) {

        var _this = this;

        // Don't do anything if we are currently waiting for a button press
        if (this._waitForInputQueueConfirmation)
            return;

        // If item is not yet somewhere on this workstation
        // NOTE: This is already correctly implemented - DO NOT CHANGE!
        if (!this.inputQueue.contains(order)
            && !this.outputQueue.contains(order)
            && !this.processingQueue.contains(order)) {

            // Ask the worker to confirm putting order in input queue
            context.log("Order with ID >" + order.id + "< is not on this workstation yet! Confirm in the next 5 seconds to add the order to the input queue!");

            // Remember the order 
            this._orderForInputQueue = order;

            // Set the mode to waiting for confirmation
            this._waitForInputQueueConfirmation = true;

            // Make the button blink
            context.button.blink(255, 255, 255);

            // Wait only for 5 seconds, if no confirmation after that go back to normal
            setTimeout(() => {
                _this._stopWaitingForInputQueueConfirmation();
            }, 5000);

        }
        else {
            // TODO: Move to correct location
            if (typeof wsImplementation.orderScanned != "undefined") {
                wsImplementation.orderScanned(order);
            }
            else
                context.warn("The NFC reader scanned an order that is already on this workstation. If you want to do something with this event, implement >orderScanned(order)< to make me smarter!");

        }
    }

    /* Local helper function */
    _stopWaitingForInputQueueConfirmation() {
        this._waitForInputQueueConfirmation = false;
        context.button.setColor(255, 255, 255);
        this._orderForInputQueue = null;
    }


    _scanError(errorCode, errorMessage) {
        this.nfc.scan(this._scanCompleted.bind(this), this._scanError.bind(this));
    }

    orderAddedToQueue(queue, order) {

        if (queue.name == "inputQueue") {
            if (typeof wsImplementation.orderAddedToInputQueue != "undefined") {
                wsImplementation.orderAddedToInputQueue(order);
            }
            else
                context.warn("A new order was added to the input queue. If you want to do something with this event, implement >orderAddedToInputQueue(order)< to make me smarter!");
        }
        else if (queue.name == "outputQueue") {
            if (typeof wsImplementation.orderAddedToOutputQueue != "undefined") {
                wsImplementation.orderAddedToOutputQueue(order);
            }
            else
                context.warn("A new order was added to the output queue. If you want to do something with this event, implement >orderAddedToOutputQueue(order)< to make me smarter!");
        }
        else if (queue.name == "processingQueue") {
            if (typeof wsImplementation.orderAddedToProcessingQueue != "undefined") {
                wsImplementation.orderAddedToProcessingQueue(order);
            }
            else
                context.warn("A new order was added to the processing queue. If you want to do something with this event, implement >orderAddedToProcessingQueue(order)< to make me smarter!");
        }
    }

    orderRemovedFromQueue(queue, order) {

        if (queue.name == "inputQueue") {
            if (typeof wsImplementation.orderRemovedFromInputQueue != "undefined") {
                wsImplementation.orderRemovedFromInputQueue(order);
            }
            else
                context.warn("An order was removed from to the input queue. If you want to do something with this event, implement >orderRemovedFromInputQueue(order)< to make me smarter!");
        }
        else if (queue.name == "outputQueue") {
            this.processedOrders.push(order);
            Promise.all([
                db.updateOrderFinishedWorkstation(order),
                db.updateOrderStatus(order, null),
                db.syncProcessedOrdersOnline(this.processedOrders),
                db.checkIfFinished()
            ]).then(() => {
                if (typeof wsImplementation.orderRemovedFromOutputQueue != "undefined") {
                    wsImplementation.orderRemovedFromOutputQueue(order);
                }
                else
                    context.warn("An order was removed from to the output queue. If you want to do something with this event, implement >orderRemovedFromOutputQueue(order)< to make me smarter!");
            })
        }
        else if (queue.name == "processingQueue") {
            if (typeof wsImplementation.orderRemovedFromProcessingQueue != "undefined") {
                wsImplementation.orderRemovedFromProcessingQueue(order);
            }
            else
                context.warn("An order was removed from the processing queue. If you want to do something with this event, implement >orderRemovedFromProcessingQueue(order)< to make me smarter!");
        }

    }

    getLastProcessedOrder() {
        if (this.processedOrders.length > 0)
            return this.processedOrders[this.processedOrders.length - 1];
        else return null;
    }

    _handleError(error) {
        logger.error(error);
    }
}

exports.WorkstationCore = WorkstationCore;