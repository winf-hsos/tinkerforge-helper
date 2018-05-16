var db = require('./utils/database.js');
var context = require('./context.js');

class Queue {
    constructor(name, workstation, maxSize = 1000) {
        this.queue = [];
        this.maxSize = maxSize;
        this.name = name;

        this.workstation = workstation;
    }

    add(order) {
        if (!this.contains(order) && this.queue.length < this.maxSize) {

            return this.removeFromOtherQueues(order).then(() => {

                this.queue.push(order);
                Promise.all([
                    db.addEvent(context.gameId, context.workstation.id, order.id, "Added order to " + this.name, context.time),
                    db.syncQueueOnline(this),
                    db.updateOrderStatus(order, "Waiting"),
                    db.updateOrderLocation(order, this.name)
                ]).then(() => {
                    // Notify workstation
                    this.workstation.orderAddedToQueue(this, order);
                    return true;
                })


            });
        }
        else {
            context.error("Error: " + this.name + " is full! Only " + this.maxSize + " item(s) allowed!");
            return Promise.resolve(false);
        }
    }

    removeFromOtherQueues(order) {
        var qArray = [this.workstation.inputQueue, this.workstation.outputQueue, this.workstation.processingQueue];

        var proms = [];

        qArray.forEach((q) => {
            if (q.name !== this.name) {
                proms.push(q.remove(order));
            }
        })

        return Promise.all(proms);
    }

    remove(order) {
        var index = -1;
        for (var i = 0; i < this.queue.length; i++) {
            if (this.queue[i].id == order.id) {
                index = i;
                break;
            }
        }

        if (index > -1) {
            this.queue.splice(index, 1);

            return Promise.all([
                db.syncQueueOnline(this),
                db.updateOrderLocation(order, null),
                db.addEvent(context.gameId, context.workstation.id, order.id, "Removed order from " + this.name, context.time)
            ]).then(() => {
                // Notify workstation
                this.workstation.orderRemovedFromQueue(this, order);
                return order;
            })
        }
        else return Promise.resolve(null);
    }

    removeFirst() {
        if (this.queue.length > 0) {
            var first = this.queue.shift();

            return Promise.all([
                db.syncQueueOnline(this),
                db.updateOrderLocation(first, this.name)])
                .then(() => {
                    return first;
                });
        }
        else return Promise.resolve(null);
    }

    removeLast() {
        if (this.queue.length > 0) {
            var last = this.queue.pop();


            return Promise.all([
                db.syncQueueOnline(this),
                db.updateOrderLocation(last, this.name)
            ]).then(() => {
                return last;
            })

        }
        else return Promise.resolve(null);
    }

    getFirst() {
        if (this.queue.length > 0) {
            var first = this.queue[0];
            return first;
        }
        else return null;

    }

    getSize() {
        return this.queue.length;
    }

    contains(order) {
        var hits = this.queue.filter((i) => { return i.id == order.id; })

        if (hits.length > 0)
            return true
        else return false;
    }

}

exports.Queue = Queue;