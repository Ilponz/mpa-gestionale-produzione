#!/usr/bin/env python3
"""
M.P.A. Gestionale Produzione - Server di Sviluppo Locale
Avvia un server HTTP locale e apre automaticamente il browser all'indirizzo dell'applicazione.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Aggiunge intestazioni per evitare il caching durante lo sviluppo
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/app/"
        print("=" * 65)
        print("  M.P.A. DI MAURIZIO CAVALLARO - GESTIONALE PRODUZIONE 4.0")
        print("=" * 65)
        print(f"  Server attivo su: {url}")
        print("  Premi CTRL+C per arrestare il server")
        print("=" * 65)
        
        # Apertura automatica nel browser
        webbrowser.open(url)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer arrestato.")
            sys.exit(0)

if __name__ == '__main__':
    run()
