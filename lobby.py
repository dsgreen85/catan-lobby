import tornado.web
import tornado.ioloop
import tornado.options
import tornado.httpserver
import tornado.websocket

import handlers

app = tornado.web.Application([
	(r'/create', handlers.Create),
	(r'/join', handlers.Join),
	(r'/ready', handlers.Ready),
	(r'/unready', handlers.Ready),
	(r'/start', handlers.Start),
	(r'/socket', handlers.Socket),
])

if __name__ == '__main__':
	app.listen(8001)
	print('Listening on port 8001')
	iol = tornado.ioloop.IOLoop.instance()
	tornado.ioloop.PeriodicCallback(lambda: None,500,iol).start()
	iol.start()