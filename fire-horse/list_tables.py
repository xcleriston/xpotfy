import sqlite3
from pathlib import Path

def list_tables():
    db_path = Path("data/fire_horse.db")
    if not db_path.exists():
        print("Arquivo do banco de dados não encontrado!")
        return
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Obtém a lista de tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("Nenhuma tabela encontrada no banco de dados.")
            return
            
        print("Tabelas no banco de dados:")
        for table in tables:
            print(f"- {table[0]}")
            
            # Obtém as colunas da tabela
            cursor.execute(f"PRAGMA table_info({table[0]});")
            columns = cursor.fetchall()
            print(f"  Colunas: {', '.join([col[1] for col in columns])}")
            
    except Exception as e:
        print(f"Erro ao acessar o banco de dados: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    list_tables()
