import sys
from pathlib import Path

# Adiciona o diretório src ao path para que possamos importar os módulos
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from src.db.base import SessionLocal, engine, Base
from src.models.models import User, Account, Strategy, Event, Market, Runner, Bet, RunnerOdds

def test_connection():
    print("Testando conexão com o banco de dados...")
    
    # Tenta se conectar ao banco de dados
    try:
        db = SessionLocal()
        print("Conexão com o banco de dados estabelecida com sucesso!")
        
        # Tenta fazer uma consulta simples
        user_count = db.query(User).count()
        print(f"Total de usuários no banco de dados: {user_count}")
        
        # Lista todas as tabelas
        print("\nTabelas no banco de dados:")
        for table in Base.metadata.tables:
            print(f"- {table}")
        
        return True
        
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_connection()
