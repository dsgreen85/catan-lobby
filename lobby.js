var express = require('express')
	, app = express()
	, server = require('http').createServer(app)
	, io = require('socket.io').listen(server)
	, config = require('./config');

var sioCookieParser = express.cookieParser(config.secret);

server.listen(config.port);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: config.secret, key: 'express.sid'}));

if( config.serve ) {
	console.log('serving static files');
	app.use('/test',function (req, res) {
        res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
    });
	app.use(express.static('web'));
}

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

	player = null;

	game = {
		name: name,
		max_players: max_players,
		players: [player],
		host: player
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
		sioCookieParser(socket.handshake, {}, function(err) {
			console.dir(err);
			console.dir(socket.handshake.cookies);
			console.dir(socket.handshake.signedCookies);
		});
	});

var game_names = {};
var games = [];

var game_list = io
	.of('/game-list')
	.on('connection', function(socket) {
		socket.emit('all-games', games);
	});