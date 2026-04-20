import sys
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adiciona o diretório src ao path para que possamos importar os módulos
sys.path.append(str(Path(__file__).parent))

from src.db.base import Base, engine, SessionLocal
from src.models.models import init_db

# Configuração de logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Inicializa o banco de dados criando todas as tabelas."""
    try:
        # Cria o diretório do banco de dados se não existir
        db_dir = Path("data")
        db_dir.mkdir(exist_ok=True)
        
        logger.info("Criando tabelas no banco de dados...")
        
        # Cria todas as tabelas definidas nos modelos
        Base.metadata.create_all(bind=engine)
        
        # Inicializa o banco de dados com dados iniciais, se necessário
        db = SessionLocal()
        try:
            # Adicione aqui a lógica para inserir dados iniciais, se necessário
            pass
            db.commit()
            logger.info("Banco de dados inicializado com sucesso!")
        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao inicializar o banco de dados: {e}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Falha ao criar as tabelas: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
