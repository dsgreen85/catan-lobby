var express = require('express')
	, app = express()
	, server = require('http').createServer(app)
	, io = require('socket.io').listen(server)
	, config = require('./config');

server.listen(config.port);
app.use(express.bodyParser());

app.post('/create-game', function (req, res) {
	var name = req.body.name;
	var max_players = req.body.max_players;

	if( name in game_names ) {
		res.send(400, { 
			error_code: 'game-exists',
			error: 'Game with that name already exists', 
		});
		return;
	}

	// TODO: actually create game.
	game = {
		name: name,
		max_players: max_players,
		players: [],
	}

	games.push(game);
	game_names[name] = game;

	res.send(200, {
		game: game
	});

	game_list.emit('new-game', game);
});

var main = io
	.of('/main')
	.on('connection', function(socket) {

	});

var game_names = {};
var games = [];

var game_list = io
	.of('/game-list')
	.on('connection', function(socket) {
		socket.emit('all-games', games);
	});