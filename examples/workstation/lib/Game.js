var db = require('./utils/database.js');
var context = require('./context.js');

class Game {

    constructor() {
    }

    startOrJoin(gameId, workstation) {

        var _this = this;

        context.workstation = workstation;
        context.gameId = gameId;

        this.gameId = gameId;
        this.workstation = workstation;


        if (workstation.gameMaster == true) {
            this._setupGame(gameId, workstation.id).then(() => {
                context.log("Game setup complete - wait for other workstations to join! Hit 'Start Game' when all have joined!");
                listenToGameStart();
            });
        }
        else {
            this._joinGame(gameId, workstation.id).then(() => {
                context.log("Joined game with ID >" + gameId + "<. Waiting for game to start...");
                listenToGameStart();
            });
        }

        function listenToGameStart() {
            // Listen to game start
            db.firestore.collection("games").doc(gameId.toString()).onSnapshot(function (doc) {
                if (typeof doc.data().status !== "undefined") {
                    if (doc.data().status == "Started" && !workstation.running) {
                        context.log("Game started! Workstation is ready to go!");

                        if (workstation.gameMaster == true) {
                            _this._startUpdateTimeInterval();
                        }

                        workstation.run();
                        listenToGameEnd();
                    }
                }
            });
        }

        function listenToGameEnd() {
            // Listen to game end
            db.firestore.collection("games").doc(gameId.toString()).onSnapshot(function (doc) {
                if (typeof doc.data().status !== "undefined") {
                    if (doc.data().status == "Finished" && workstation.running) {
                        context.log("Game finished!");

                        if (workstation.gameMaster == true) {
                            clearInterval(_this.timeInterval);
                        }
                        workstation.stop();
                    }
                }
            });

        }
    }

   
    _startUpdateTimeInterval() {
        this.time = 0;
        var updateIntervalInMs = 3000;

        this.timeInterval = setInterval(() => {
            this.time += updateIntervalInMs / 1000;
            context.time = this.time;
            db.updateTime(this.gameId, this.time);
        }, updateIntervalInMs);
    }


    _setupGame(gameId, workstationId) {
        return db.deleteGame(gameId).then(() => {
            return db.createGame(gameId).then(() => {

                return Promise.all([
                    db.createWorkstation(gameId, workstationId, true),
                    db.createOrders(gameId, './orders.json'),
                    db.addEvent(gameId, workstationId, '-', 'Workstation joined', 0)
                ]);
            })
        });
    }

    _joinGame(gameId, workstationId) {
        return Promise.all([
            db.createWorkstation(gameId, workstationId, false),
            db.addEvent(gameId, workstationId, '-', 'Workstation joined', 0)
        ]);
    }

}

exports.Game = Game;