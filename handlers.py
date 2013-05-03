import tornado.web
import tornado.ioloop
import tornado.options
import tornado.httpserver
import tornado.websocket

import requests
import json

from simpleauth import generate_token

class Session(object):
	pass

session = {}
games = {}

class User(object):
	def __init__(self):
		self.id = None
		self.name = None
		self.icon = 'human'
		self.ready = False
		self.game = None
		self.connection = None

	def __eq__(self, other):
		return self.id == other.id

class Guest(User):
	def __init__(self):
		super().__init__()

		self.id = generate_token(10)
		self.name = 'guest-{id}'.format(id=self.id)
		self.icon = 'guest'

class Game(object):
	def __init__(self, name, creator, max_players):
		self.name = name
		self.creator = creator
		self.max_players = max_players

		self.add_player(creator)
		creator.ready = True

	def add_player(self, user):
		if user in self.players:
			return False

		self.players.append(user)
		user.game = self
		user.ready = False
		return True

	def all_ready(self):
		return min(user.ready for user in self.players)

def get_user(handler):
	global session

	cookie = handler.get_cookie('lobby-user-token', None)
	if cookie:
		print(cookie)
	user = session.get(cookie, None)

	if user is None:
		user = Guest()
		cookie = generate_token()
		#TODO secure cookies
		handler.set_cookie('lobby-user-token', cookie)
		session[cookie] = user

	return user

class RequestHandler(tornado.web.RequestHandler):
	def error(self, msg):
		self.clear()
		self.set_status(400)
		self.finish(json.dumps({
			'type': 'error',
			'error': msg
		}))


	def prepare(self):
		self.user = get_user(self)
		if self.user.connection is None:
			self.set_status(400)
			self.error('Not connected')


class Create(RequestHandler):
	def post(self):
		global games

		user = self.user
		name = self.get_argument('name')
		max_players = self.get_argument('max_players')

		game = Game(name, user, max_players)

		if not (0 < max_players <= 4):
			self.error('Invalid max_players')

		if name in games:
			self.error('Game already exists')

		games[name] = game

class Join(RequestHandler):
	def post(self):
		global games

		user = self.user
		name = self.get_argument('name')

		if name not in games:
			self.error('Game doesn\'t exist')

		game = games[name]
		game.add_player(user)

class Start(RequestHandler):
	def post(self):
		user = self.user
		game = user.game
		if game is None:
			self.error('Not in game')

		if game.creator is not user:
			self.error('Not game owner')

		if not game.all_ready():
			self.error('Players are not ready')

		for user in game.players:
			user.game_token = generate_token()

		res = requests.post(
			'{game_host}/create'.format(game_host='http://localhost:8080'),
			data={
				'token': 'fja4hu35mt7tv',
				'players': json.dumps([{
					'name': user.name,
					'icon': user.icon,
					'token': user.game_token
				} for user in game.players])
			}
		)

		if res.status_code != 200:
			self.error(res.text)

		game_info = {
			'name': game.name,
			'host': 'http://localhost:8080',
		}

		for user in game.players:
			user.send({
				'type': 'game_start',
				'game': game_info
			})
			user.connection.set_cookie('game-token', user.game_token)

class Ready(RequestHandler):
	def post(self):
		user = self.user
		if user.game is None:
			self.error('Not in game')

		user.ready = True

class Unready(RequestHandler):
	def post(self):
		user = self.user
		if user.game is None:
			self.error('Not in game')

		user.ready = False


class Socket(tornado.websocket.WebSocketHandler):
	def open(self):
		self.user = get_user(self)
		self.user.connection = self

	def send(self, msg):
		self.write_message(json.dumps(msg))

	def close(self):
		if self.user is not None:
			self.user.connection = None

