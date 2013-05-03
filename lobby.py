import tornado.web
import tornado.ioloop
import tornado.options
import tornado.httpserver
import tornado.websocket

import handlers

app = tornado.web.Application([
	(r'/create-game', handlers.CreateGame),
	(r'/join-game', handlers.JoinGame),
	(r'/socket', handlers.Socket),
])