class Wrapper {
    constructor(device) {
        this.device = device;
        this.listener = [];
    }

    registerListener(callback) {
        this.listener.push(callback);
    }

    removeListener(callback) {

        var deleteIndex = -1;
        this.listener.forEach((listener, index) => {
            if (listener === callback)
                deleteIndex = index;
        });

        this.listener.splice(deleteIndex, 1);
    }

    valueChanged(value, err) {
        if (err)
            console.log(err)
        else
            this.listener.forEach((listener) => {
                listener(value);
            });
    }

}

exports.Wrapper = Wrapper;