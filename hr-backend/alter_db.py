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
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;")
        cursor.execute("ALTER TABLE users ALTER COLUMN employee_id TYPE TEXT;")
        
        # Add UNIQUE constraint to employee_id if not present
        cursor.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'users_employee_id_key'
            ) THEN 
                ALTER TABLE users ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);
            END IF;
        END $$;
        """)
        print("Kolom profil baru & constraint UNIQUE pada employee_id berhasil dipastikan.")

        # Rename password column to hashed_password in users table
        cursor.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
                ALTER TABLE users RENAME COLUMN password TO hashed_password;
            END IF;
        END $$;
        """)
        print("Kolom password berhasil diubah namanya menjadi hashed_password jika kolom lama ada.")

        # Add columns to companies table for soft delete
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;")
        print("Kolom soft delete berhasil ditambahkan ke tabel companies jika belum ada.")
        
        conn.commit()
        print("Migrasi database sukses!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Gagal melakukan migrasi database: {e}")

if __name__ == "__main__":
    alter_db()
