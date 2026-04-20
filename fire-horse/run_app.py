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

def main():
    try:
        logger.info("Iniciando o servidor FastAPI...")
        
        # Configuração do servidor Uvicorn
        config = uvicorn.Config(
            app="src.api.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
        
        server = uvicorn.Server(config)
        logger.info(f"Servidor configurado na porta {config.port}")
        
        # Inicia o servidor
        server.run()
        
    except Exception as e:
        logger.error(f"Erro ao iniciar o servidor: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
