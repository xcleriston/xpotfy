import requests
from flask import Flask, request, Response, jsonify
import random
from typing import Optional
import logging
import os
from datetime import datetime

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('proxy_server.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)

# Lista de proxies brasileiros (exemplo)
# Em um ambiente real, você deveria usar uma API de proxies ou um serviço de proxies
BRAZILIAN_PROXIES = [
    '177.105.123.45:8080',
    '189.123.45.67:3128',
    '191.234.56.78:8080'
]

def get_random_proxy() -> str:
    """Retorna um proxy brasileiro aleatório."""
    return random.choice(BRAZILIAN_PROXIES)

def validate_url(url: str) -> bool:
    """Valida se a URL é válida."""
    try:
        from urllib.parse import urlparse
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

@app.route('/proxy', methods=['GET'])
def proxy():
    try:
        # Obtém a URL do parâmetro 'url'
        url = request.args.get('url')
        if not url:
            logging.error("URL parameter is required")
            return jsonify({"error": "URL parameter is required"}), 400

        if not validate_url(url):
            logging.error(f"Invalid URL: {url}")
            return jsonify({"error": "Invalid URL format"}), 400

        # Obtém um proxy brasileiro aleatório
        proxy = get_random_proxy()
        
        # Configura o proxy para a requisição
        proxies = {
            'http': f'http://{proxy}',
            'https': f'http://{proxy}'
        }

        # Faz a requisição usando o proxy
        try:
            response = requests.get(
                url,
                proxies=proxies,
                timeout=10,
                verify=True  # Verifica certificados SSL
            )
            
            # Retorna a resposta do servidor
            return Response(
                response.content,
                status=response.status_code,
                headers=dict(response.headers)
            )
        
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed with proxy {proxy}: {str(e)}")
            return jsonify({"error": f"Proxy request failed: {str(e)}"}), 502

    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check."""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

if __name__ == '__main__':
    # Carrega configurações de variáveis de ambiente
    host = os.getenv('PROXY_HOST', '0.0.0.0')
    port = int(os.getenv('PROXY_PORT', 5000))
    
    logging.info(f"Starting Brazilian Proxy Server on {host}:{port}")
    app.run(host=host, port=port, debug=False)
