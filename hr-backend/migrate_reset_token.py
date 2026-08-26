"""
Migration: Add reset_token and reset_token_expires columns to users table.
Run this once to update an existing database without rebuilding.
"""
import os
from dotenv import load_dotenv
from db_helper import get_db_connection

load_dotenv()

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    migrations = [
        ("reset_token", "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);"),
        ("reset_token_expires", "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;"),
        ("joined_date", "ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_date DATE;"),
    ]
    
    for col_name, sql in migrations:
        try:
            cursor.execute(sql)
            print(f"  [OK] Column '{col_name}' ensured.")
        except Exception as e:
            print(f"  [FAIL] Column '{col_name}' failed: {e}")
            conn.rollback()
    
    conn.commit()
    print("\nMigration completed successfully.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
