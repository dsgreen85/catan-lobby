import tornado.web
import tornado.ioloop
import tornado.options
import tornado.httpserver
import tornado.websocket

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

	def __eq__(self, other):
		return self.id == other.id

class Guest(object):
	def __init__(self):
		self.id = generate_token(10)
		self.name = 'guest-{id}'.format(id=self.id)
		self.icon = 'guest'

class Game(object):
	def __init__(self, name, creator, max_players):
		self.name = name
		self.creator = creator
		self.max_players = max_players
		self.players = [creator]

	def add_player(self, user):
		if user in self.players:
			return False

		self.players.append(user)
		return True

def get_user(handler):
	global session

	cookie = handler.get_cookie('lobby-user-token', None)
	user = session.get(cookie, None)

	if user is None:
		user = Guest()
		cookie = generate_token()
		#TODO secure cookies
		handler.set_cookie('lobby-user-token', cookie, httpOnly=True)
		session[cookie] = user

class CreateGame(tornado.web.RequestHandler):
	def post(self):
		global games

		user = get_user(self)
		name = self.get_argument('name')
		max_players = self.get_argument('max_players')

		game = Game(name, user, max_players)

		if not (0 < max_players <= 4):
			raise Exception('TODO: 400 error code')

		if name in games:
			raise Exception('TODO: 400 error code')

		games[name] = game

class JoinGame(tornado.web.RequestHandler):
	def post(self):
		global games

		user = get_user(self)
		name = self.get_argument('name')

		if name not in games:
			raise Exception('TODO: 400 error code')

		game = games[name]
		game.add_player(user)




class Socket(tornado.websocket.WebSocketHandler):
	def open(self):
		self.user = get_user(self)
