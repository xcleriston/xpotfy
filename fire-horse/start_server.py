import uvicorn
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configuração básica de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Cria o aplicativo FastAPI
app = FastAPI(
    title="Fire Horse API",
    description="API para o sistema de apostas Fire Horse",
    version="1.0.0"
)

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua por origens específicas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rota raiz
@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Fire Horse",
        "documentation": "/docs",
        "version": "1.0.0"
    }

def start_server():
    try:
        logger.info("Iniciando o servidor FastAPI...")
        
        # Configuração do servidor Uvicorn
        config = uvicorn.Config(
            app=app,
            host="0.0.0.0",
            port=8080,
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
    start_server()
