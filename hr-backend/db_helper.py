import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        try:
            return psycopg2.connect(db_url)
        except Exception as e:
            print(f"Koneksi menggunakan DATABASE_URL gagal: {e}")
            raise e
            
    # Fallback to individual parameters
    try:
        return psycopg2.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_DATABASE")
        )
    except Exception as e:
        print(f"Koneksi menggunakan parameter individual gagal: {e}")
        raise e
