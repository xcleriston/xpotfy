import uvicorn
import logging
import sys
from pathlib import Path

# Configuração básica de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def start_server():
    try:
        logger.info("Iniciando o servidor Fire Horse API...")
        
        # Configuração do servidor Uvicorn
        uvicorn.run(
            "src.api.v1.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
        
    except Exception as e:
        logger.error(f"Erro ao iniciar o servidor: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    start_server()
