# -*- coding: utf-8 -*-
#test on python 3.4 ,python of lower version  has different module organization.
import argparse
import http.server
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import os

parser = argparse.ArgumentParser(description='Serve player webpage')
parser.add_argument('--host', help='address to serve on', type=str, default='127.0.0.1', action='store')
parser.add_argument('--port', help='port to serve on',    type=int, default=8080,        action='store')
parser.add_argument("path",nargs="?")
args = parser.parse_args()

Handler = http.server.SimpleHTTPRequestHandler

if args.path is None:
    path = os.path.join(os.path.dirname(__file__), './build/')
else:
    path = args.path

print("serving: " + path)
os.chdir(path)

Handler.extensions_map={
        '.manifest': 'text/cache-manifest',
	'.html': 'text/html',
        '.png':  'image/png',
	'.jpg':  'image/jpg',
        '.svg':  'image/svg+xml',
	'.css':  'text/css',
	'.js':   'application/x-javascript',
	'.wasm': 'application/wasm',
	'': 'application/octet-stream', # Default
    }

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer((args.host, args.port), Handler)

print("serving at %s:%d" % (args.host, args.port))
httpd.serve_forever()
