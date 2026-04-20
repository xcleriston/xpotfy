import sqlite3
from pathlib import Path

def check_database_structure():
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
            
        print("\n=== ESTRUTURA DO BANCO DE DADOS ===\n")
        
        for table in tables:
            table_name = table[0]
            print(f"=== TABELA: {table_name} ===")
            
            # Obtém as colunas da tabela
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("Colunas:")
            for col in columns:
                col_id, col_name, col_type, not_null, default_val, pk = col
                print(f"  - {col_name} ({col_type}){' PRIMARY KEY' if pk else ''}{' NOT NULL' if not_null else ''}")
            
            print()
            
    except Exception as e:
        print(f"Erro ao acessar o banco de dados: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_database_structure()
