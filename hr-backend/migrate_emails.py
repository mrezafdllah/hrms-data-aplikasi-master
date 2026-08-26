"""
Migration: Update emails of 3 key users to real Gmail addresses.
Super Admin:  admin@hr.com    -> mreza.fadhilah88@gmail.com
Admin HR:     hr@hr.com       -> muhammadrezacaster13@gmail.com
Karyawan:     john@hr.com     -> mreza.fadillah12@gmail.com
"""
import os
from dotenv import load_dotenv
from db_helper import get_db_connection

load_dotenv()

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    email_updates = [
        ("admin@hr.com", "mreza.fadhilah88@gmail.com", "Super Admin"),
        ("hr@hr.com", "muhammadrezacaster13@gmail.com", "Admin HR"),
        ("john@hr.com", "mreza.fadillah12@gmail.com", "Karyawan (John Adams)"),
    ]
    
    for old_email, new_email, label in email_updates:
        try:
            cursor.execute(
                "UPDATE users SET email = %s, updated_at = CURRENT_TIMESTAMP WHERE email = %s;",
                (new_email, old_email)
            )
            if cursor.rowcount > 0:
                print(f"  [OK] [{label}] {old_email} -> {new_email}")
            else:
                print(f"  - [{label}] {old_email} not found (mungkin sudah diupdate sebelumnya)")
        except Exception as e:
            print(f"  [FAIL] [{label}] Error: {e}")
            conn.rollback()
    
    conn.commit()
    print("\nEmail migration completed.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
