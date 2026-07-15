import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def migrate_db():
    try:
        from db_helper import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Read and execute schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        cursor.execute(schema_sql)
        conn.commit()
        print("Migration berhasil! Semua tabel telah dibuat.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_db()
