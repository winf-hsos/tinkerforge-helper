var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class NFCWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        this.scanCallback;
    }

    scan(callback) {
        this.scanCallback = callback;
        this.device.on(tinkerforge.BrickletNFC.CALLBACK_READER_STATE_CHANGED, this.readerStateChanged.bind(this));
        this.device.setMode(tinkerforge.BrickletNFC.MODE_READER);
    }

    setIdle() {
        return this.device.setMode(tinkerforge.BrickletNFC.MODE_STOP);
    }

    getMode() {
        return this.device.getMode();
    }

    readerStateChanged(state, idle) {

        var _this = this;

        if (state == tinkerforge.BrickletNFC.READER_STATE_IDLE) {
            this.device.readerRequestTagID();
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_REQUEST_TAG_ID_READY) {
            this.device.readerGetTagIDLowLevel(
                function (tagType, tagIdLength, tagIdData) {

                    if (tagType != tinkerforge.BrickletNFC.TAG_TYPE_TYPE2) {
                        console.log('Tag is not type-2');
                        return;
                    }

                    // Request page 5
                    _this.device.readerRequestPage(5, 4);
                },
                function (error) {
                    console.log('Error: ' + error);
                }
            );
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_REQUEST_TAG_ID_ERROR) {
            console.log('Request tag ID error');
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_REQUEST_PAGE_READY) {
            _this.device.readerReadPageLowLevel(
                function (dataLength, dataChunkOffset, dataChunkData) {

                    _this.scanCallback({ id: dataChunkData[0].toString(16), type: dataChunkData[1].toString(16) });

                    //this.device.readerWritePage(1, page);

                },
                function (error) {
                    console.log('Error: ' + error);
                }
            );
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_WRITE_PAGE_READY) {
            console.log('Write page ready');
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_REQUEST_PAGE_ERROR) {
            console.log('Request page error');
        }
        else if (state == tinkerforge.BrickletNFC.READER_STATE_WRITE_PAGE_ERROR) {
            console.log('Write page error');
        }
    }

}

exports.NFCWrapper = NFCWrapper;