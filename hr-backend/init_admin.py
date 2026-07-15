import os
import psycopg2
from dotenv import load_dotenv
from auth import get_password_hash

load_dotenv()

def init_admin():
    conn = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_DATABASE")
    )
    cursor = conn.cursor()
    
    # 1. Buat default roles jika belum ada
    default_roles = [
        ("Super Admin", "Super Administrator dengan akses penuh ke semua fitur"),
        ("Admin HR", "Admin HR dengan akses ke Users, Positions, Jobs"),
        ("Karyawan", "Karyawan biasa, hanya bisa lihat dashboard dan profil sendiri"),
    ]
    for role_name, description in default_roles:
        cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO roles (role_name, description) VALUES (%s, %s);",
                (role_name, description)
            )
    conn.commit()
    
    # Fetch roles
    cursor.execute("SELECT role_name, id FROM roles;")
    roles_dict = {row[0]: row[1] for row in cursor.fetchall()}
    
    # 2. Buat companies jika belum ada
    companies = [
        ("PT Cybers Blitz Nusantara", "Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said, Jakarta Selatan", "021-5551234", "info@cybersblitz.com"),
        ("Blitz Digital Studio", "SCBD Lot 14, Jl. Jend. Sudirman, Jakarta Pusat", "021-5555678", "studio@blitzdigital.com"),
        ("Workwave Tech", "Dago Bandung, Jl. Ir. H. Juanda No. 120, Bandung", "022-7778888", "contact@workwave.co")
    ]
    for company_name, address, phone, email in companies:
        cursor.execute("SELECT id FROM companies WHERE company_name = %s", (company_name,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO companies (company_name, address, phone, email) VALUES (%s, %s, %s, %s);",
                (company_name, address, phone, email)
            )
    conn.commit()
    
    # Fetch companies
    cursor.execute("SELECT company_name, id FROM companies;")
    companies_dict = {row[0]: row[1] for row in cursor.fetchall()}
    
    # 3. Buat jobs jika belum ada
    jobs = [
        ("PT Cybers Blitz Nusantara", "Engineering", "Development and operations department"),
        ("PT Cybers Blitz Nusantara", "Product Design", "UI/UX research and design department"),
        ("Blitz Digital Studio", "Finance", "Accounting and finance department"),
        ("Blitz Digital Studio", "Creative Studio", "Media production and art studio")
    ]
    for comp_name, job_name, description in jobs:
        comp_id = companies_dict.get(comp_name)
        if comp_id:
            cursor.execute("SELECT id FROM jobs WHERE job_name = %s AND company_id = %s", (job_name, comp_id))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO jobs (company_id, job_name, description) VALUES (%s, %s, %s);",
                    (comp_id, job_name, description)
                )
    conn.commit()
    
    # Fetch jobs
    cursor.execute("SELECT j.job_name, c.company_name, j.id FROM jobs j JOIN companies c ON j.company_id = c.id;")
    jobs_dict = {(row[0], row[1]): row[2] for row in cursor.fetchall()}
    
    # 4. Buat positions jika belum ada
    positions = [
        ("Engineering", "PT Cybers Blitz Nusantara", "Frontend Developer", "Responsible for frontend web development"),
        ("Engineering", "PT Cybers Blitz Nusantara", "Backend Developer", "Responsible for API and system backend development"),
        ("Engineering", "PT Cybers Blitz Nusantara", "Sr. Software Engineer", "Responsible for software architecture and leading teams"),
        ("Product Design", "PT Cybers Blitz Nusantara", "UI/UX Designer", "Responsible for creating UI/UX layouts"),
        ("Product Design", "PT Cybers Blitz Nusantara", "UX Researcher", "Responsible for user testing and research"),
        ("Finance", "Blitz Digital Studio", "Financial Analyst", "Responsible for analyzing studio finances"),
        ("Finance", "Blitz Digital Studio", "Accountant", "Responsible for accounting and corporate cash flow")
    ]
    for job_name, comp_name, pos_name, description in positions:
        job_id = jobs_dict.get((job_name, comp_name))
        if job_id:
            cursor.execute("SELECT id FROM positions WHERE position_name = %s AND job_id = %s", (pos_name, job_id))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO positions (job_id, position_name, description) VALUES (%s, %s, %s);",
                    (job_id, pos_name, description)
                )
    conn.commit()
    
    # Fetch positions
    cursor.execute("""
        SELECT p.position_name, j.job_name, c.company_name, p.id 
        FROM positions p 
        JOIN jobs j ON p.job_id = j.id 
        JOIN companies c ON j.company_id = c.id;
    """)
    positions_dict = {(row[0], row[1], row[2]): row[3] for row in cursor.fetchall()}
    
    # 5. Buat users jika belum ada (atau update)
    admin_users = [
        ("Super Administrator", "admin@hr.com", "admin123", "Super Admin", None, None, None),
        ("HR Specialist", "hr@hr.com", "hr123", "Admin HR", None, None, None),
    ]
    
    employees = [
        ("John Adams", "john@hr.com", "user123", "Karyawan", "Financial Analyst", "Finance", "Blitz Digital Studio"),
        ("Emily Johnson", "emily@hr.com", "user123", "Karyawan", "Accountant", "Finance", "Blitz Digital Studio"),
        ("Michael Brown", "michael@hr.com", "user123", "Karyawan", "Sr. Software Engineer", "Engineering", "PT Cybers Blitz Nusantara"),
        ("Jessica Lee", "jessica@hr.com", "user123", "Karyawan", "UI/UX Designer", "Product Design", "PT Cybers Blitz Nusantara"),
        ("David Martinez", "david@hr.com", "user123", "Karyawan", "Sr. Software Engineer", "Engineering", "PT Cybers Blitz Nusantara"),
        ("James Clark", "james@hr.com", "user123", "Karyawan", "Frontend Developer", "Engineering", "PT Cybers Blitz Nusantara"),
        ("Emily Davis", "emily.d@hr.com", "user123", "Karyawan", "Backend Developer", "Engineering", "PT Cybers Blitz Nusantara"),
    ]
    
    all_users = admin_users + employees
    for name, email, pwd, role_name, pos_name, job_name, comp_name in all_users:
        role_id = roles_dict.get(role_name)
        pos_id = None
        if pos_name and job_name and comp_name:
            pos_id = positions_dict.get((pos_name, job_name, comp_name))
            
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing = cursor.fetchone()
        
        hashed_pwd = get_password_hash(pwd)
        if not existing:
            cursor.execute(
                """INSERT INTO users (role_id, position_id, full_name, email, password, status) 
                   VALUES (%s, %s, %s, %s, %s, %s);""",
                (role_id, pos_id, name, email, hashed_pwd, "Active")
            )
        else:
            cursor.execute(
                """UPDATE users SET role_id = %s, position_id = %s, full_name = %s, password = %s, status = 'Active' 
                   WHERE email = %s;""",
                (role_id, pos_id, name, hashed_pwd, email)
            )
    conn.commit()
    print("Database seeding completed successfully.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    init_admin()
