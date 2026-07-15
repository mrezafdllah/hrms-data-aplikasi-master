import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def alter_db():
    try:
        from db_helper import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Mulai memperbarui struktur database...")
        
        # Add columns to users table
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_place VARCHAR(150);")
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;")
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;")
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);")
        print("Kolom profil baru berhasil ditambahkan jika belum ada.")
        
        # Create tasks table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            task_name VARCHAR(255) NOT NULL,
            description TEXT,
            task_date DATE NOT NULL DEFAULT CURRENT_DATE,
            status VARCHAR(50) NOT NULL DEFAULT 'Pending',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        print("Tabel tasks berhasil dibuat jika belum ada.")
        
        conn.commit()
        print("Migrasi database sukses!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Gagal melakukan migrasi database: {e}")

if __name__ == "__main__":
    alter_db()
