import sqlite3
import os
from pathlib import Path

def check_database():
    db_path = Path("data/fire_horse.db")
    if not db_path.exists():
        print("Database file not found!")
        return
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Get the list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables in the database:")
        for table in tables:
            print(f"- {table[0]}")
            
            # Get the table structure
            cursor.execute(f"PRAGMA table_info({table[0]});")
            columns = cursor.fetchall()
            print("  Columns:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            print()
            
    except Exception as e:
        print(f"Error accessing database: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_database()
