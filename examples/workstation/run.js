var config = require('./workstationImplementation.js').config;
var context = require('./lib/context.js');
var { WorkstationCore } = require('./lib/WorkstationCore.js');
var { Game } = require('./lib/Game.js');

var game = new Game();
var wsc = new WorkstationCore();

wsc.init().then(() => {
    game.startOrJoin(config.gameId, wsc);
})