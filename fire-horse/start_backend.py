import uvicorn
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.append(str(Path(__file__).parent))

if __name__ == "__main__":
    print("Iniciando servidor FastAPI...")
    uvicorn.run(
        "src.api.v1.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="debug"
    )
