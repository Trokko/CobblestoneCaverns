from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

LOG_FILE = 'ai_log.txt'

class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS so the browser can POST from the game page
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path != '/log':
            self.send_response(404)
            self.end_headers()
            return
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(body + '\n')
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

if __name__ == '__main__':
    port = 9001
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Dev log server listening on port {port} (POST /log)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        print('Server stopped')