import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from auth import verify_password, get_password_hash, create_access_token, get_current_user, require_super_admin, require_admin_hr_or_super, ACCESS_TOKEN_EXPIRE_MINUTES

load_dotenv()

app = FastAPI(title="Aplikasi HR API")

# Create uploads folder if not exists
IS_VERCEL = "VERCEL" in os.environ
UPLOAD_DIR = "/tmp/uploads" if IS_VERCEL else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure CORS
origins = ["http://localhost:5173", "http://localhost:8081", "http://localhost:19006"]
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        from db_helper import get_db_connection as connect_db
        return connect_db()
    except Exception as e:
        print(f"Gagal koneksi ke database: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Error")

# ================= MODELS =================

# -- Roles --
class RoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    role_name: str
    description: Optional[str] = None

# -- Companies --
class CompanyCreate(BaseModel):
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CompanyUpdate(BaseModel):
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# -- Jobs --
class JobCreate(BaseModel):
    company_id: int
    job_name: str
    description: Optional[str] = None

class JobUpdate(BaseModel):
    company_id: int
    job_name: str
    description: Optional[str] = None

# -- Positions --
class PositionCreate(BaseModel):
    job_id: int
    position_name: str
    description: Optional[str] = None

class PositionUpdate(BaseModel):
    job_id: int
    position_name: str
    description: Optional[str] = None

# -- Users --
class UserCreate(BaseModel):
    company_id: Optional[int] = None
    role_id: Optional[int] = None
    position_id: Optional[int] = None
    full_name: str
    email: str
    hashed_password: str
    status: str = "Active"
    birth_place: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class UserUpdate(BaseModel):
    company_id: Optional[int] = None
    role_id: Optional[int] = None
    position_id: Optional[int] = None
    full_name: str
    email: str
    status: str = "Active"
    birth_place: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

# -- Profile --
class ProfileUpdate(BaseModel):
    full_name: str
    email: str
    birth_place: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    position_id: Optional[int] = None

# -- Schedules --
class ScheduleCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    schedule_date: date
    start_time: time
    end_time: time

class ScheduleUpdate(BaseModel):
    user_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    schedule_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

# -- Notices --
class NoticeCreate(BaseModel):
    subject: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    priority: str = "Medium"
    audience: str = "All Departments"

class NoticeUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: Optional[str] = None
    audience: Optional[str] = None



# -- Tasks --
class TaskCreate(BaseModel):
    user_id: int
    task_name: str
    description: Optional[str] = None
    task_date: date
    status: str = "Pending"

class TaskUpdate(BaseModel):
    user_id: Optional[int] = None
    task_name: Optional[str] = None
    description: Optional[str] = None
    task_date: Optional[date] = None
    status: Optional[str] = None

# -- Login --
class LoginRequest(BaseModel):
    email: str
    password: str

# ================= AUTHENTICATION =================
@app.post("/api/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT u.*, r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.email = %s;
        """, (req.email,))
        user = cursor.fetchone()
        if not user or not verify_password(req.password, user['hashed_password']):
            raise HTTPException(status_code=401, detail="Email atau password salah")
            
        role_name = user.get('role_name') or 'Karyawan'
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['email'], "role": role_name, "user_id": user['id']}, 
            expires_delta=access_token_expires
        )
        return {
            "status": "Success", 
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": role_name, 
            "name": user['full_name'],
            "user_id": user['id']
        }
    finally:
        cursor.close()
        conn.close()

# ================= PROFILE (untuk Karyawan) =================
@app.get("/api/profile")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT u.id, u.full_name, u.email, u.status, u.created_at,
                   u.birth_place, u.birth_date, u.address, u.profile_picture, u.position_id,
                   r.role_name, c.company_name, p.position_name,
                   j.job_name
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LEFT JOIN positions p ON u.position_id = p.id 
            LEFT JOIN jobs j ON p.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id AND c.deleted_at IS NULL
            WHERE u.email = %s;
        """, (current_user['email'],))
        profile = cursor.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return {"status": "Success", "data": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/profile")
def update_my_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if current_user['role'] in ['Super Admin', 'Admin HR'] and profile.position_id is not None:
            cursor.execute("""
                UPDATE users 
                SET full_name = %s, email = %s, birth_place = %s, birth_date = %s, address = %s, profile_picture = %s, position_id = %s, updated_at = CURRENT_TIMESTAMP
                WHERE email = %s;
            """, (profile.full_name, profile.email, profile.birth_place, profile.birth_date, profile.address, profile.profile_picture, profile.position_id, current_user['email']))
        else:
            cursor.execute("""
                UPDATE users 
                SET full_name = %s, email = %s, birth_place = %s, birth_date = %s, address = %s, profile_picture = %s, updated_at = CURRENT_TIMESTAMP
                WHERE email = %s;
            """, (profile.full_name, profile.email, profile.birth_place, profile.birth_date, profile.address, profile.profile_picture, current_user['email']))
        conn.commit()
        return {"status": "Success", "message": "Profil berhasil diperbarui"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/upload-profile-picture")
def upload_profile_picture(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        file_extension = file.filename.split(".")[-1]
        file_name = f"profile_{current_user['user_id']}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"status": "Success", "file_path": f"/uploads/{file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= DASHBOARD =================
@app.get("/api/dashboard-stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT COUNT(*) FROM users;")
        total_users = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL;")
        total_companies = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) FROM positions;")
        total_positions = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) FROM jobs;")
        total_jobs = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE status = 'Active';")
        active_users = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE status != 'Active';")
        inactive_users = cursor.fetchone()['count']
        
        cursor.execute("""
            SELECT r.role_name as name, COUNT(u.id) as value 
            FROM roles r 
            LEFT JOIN users u ON u.role_id = r.id 
            GROUP BY r.role_name;
        """)
        role_stats = cursor.fetchall()

        if current_user['role'] == 'Karyawan':
            cursor.execute("""
                SELECT status as name, COUNT(*) as value 
                FROM tasks 
                WHERE user_id = %s
                GROUP BY status;
            """, (current_user['user_id'],))
        else:
            cursor.execute("""
                SELECT status as name, COUNT(*) as value 
                FROM tasks 
                GROUP BY status;
            """)
        task_stats = cursor.fetchall()
        
        return {
            "status": "Success",
            "data": {
                "totalUsers": int(total_users),
                "totalCompanies": int(total_companies),
                "totalPositions": int(total_positions),
                "totalJobs": int(total_jobs),
                "activeUsers": int(active_users),
                "inactiveUsers": int(inactive_users),
                "roleStats": role_stats,
                "taskStats": task_stats
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= ROLES (Super Admin only) =================
@app.get("/api/roles")
def get_all_roles(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM roles ORDER BY id ASC;")
        roles = cursor.fetchall()
        return {"status": "Success", "data": roles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/roles")
def add_role(role: RoleCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO roles (role_name, description) VALUES (%s, %s) RETURNING id;",
            (role.role_name, role.description)
        )
        conn.commit()
        return {"status": "Success", "message": "Role berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/roles/{id}")
def update_role(id: int, role: RoleUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE roles SET role_name = %s, description = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
            (role.role_name, role.description, id)
        )
        conn.commit()
        return {"status": "Success", "message": "Role berhasil diupdate"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/roles/{id}")
def delete_role(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM roles WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Role berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= COMPANIES (Super Admin only) =================
@app.get("/api/companies")
def get_all_companies(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY id DESC;")
        companies = cursor.fetchall()
        return {"status": "Success", "data": companies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/companies")
def add_company(company: CompanyCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO companies (company_name, address, phone, email) VALUES (%s, %s, %s, %s) RETURNING id;",
            (company.company_name, company.address, company.phone, company.email)
        )
        conn.commit()
        return {"status": "Success", "message": "Company berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/companies/{id}")
def update_company(id: int, company: CompanyUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE companies SET company_name = %s, address = %s, phone = %s, email = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
            (company.company_name, company.address, company.phone, company.email, id)
        )
        conn.commit()
        return {"status": "Success", "message": "Company berhasil diupdate"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/companies/{id}")
def delete_company(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE companies 
            SET deleted_at = CURRENT_TIMESTAMP, 
                deleted_by = %s 
            WHERE id = %s;
        """, (current_user['user_id'], id))
        conn.commit()
        return {"status": "Success", "message": "Company berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= JOBS (Super Admin & Admin HR) =================
@app.get("/api/jobs")
def get_all_jobs(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT j.*, c.company_name 
            FROM jobs j 
            LEFT JOIN companies c ON j.company_id = c.id 
            WHERE c.id IS NULL OR c.deleted_at IS NULL
            ORDER BY j.id DESC;
        """)
        jobs = cursor.fetchall()
        return {"status": "Success", "data": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/jobs")
def add_job(job: JobCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO jobs (company_id, job_name, description) VALUES (%s, %s, %s) RETURNING id;",
            (job.company_id, job.job_name, job.description)
        )
        conn.commit()
        return {"status": "Success", "message": "Job berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/jobs/{id}")
def update_job(id: int, job: JobUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE jobs SET company_id = %s, job_name = %s, description = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
            (job.company_id, job.job_name, job.description, id)
        )
        conn.commit()
        return {"status": "Success", "message": "Job berhasil diupdate"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/jobs/{id}")
def delete_job(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM jobs WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Job berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= POSITIONS (Super Admin & Admin HR) =================
@app.get("/api/positions")
def get_all_positions(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT p.*, j.job_name, j.company_id, c.company_name 
            FROM positions p 
            LEFT JOIN jobs j ON p.job_id = j.id 
            LEFT JOIN companies c ON j.company_id = c.id 
            WHERE c.id IS NULL OR c.deleted_at IS NULL
            ORDER BY p.id DESC;
        """)
        positions = cursor.fetchall()
        return {"status": "Success", "data": positions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/positions")
def add_position(position: PositionCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO positions (job_id, position_name, description) VALUES (%s, %s, %s) RETURNING id;",
            (position.job_id, position.position_name, position.description)
        )
        conn.commit()
        return {"status": "Success", "message": "Position berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/positions/{id}")
def update_position(id: int, position: PositionUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE positions SET job_id = %s, position_name = %s, description = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
            (position.job_id, position.position_name, position.description, id)
        )
        conn.commit()
        return {"status": "Success", "message": "Position berhasil diupdate"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/positions/{id}")
def delete_position(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM positions WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Position berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= USERS (Super Admin & Admin HR) =================
@app.get("/api/users")
def get_all_users(current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT u.id, u.full_name, u.email, u.status, j.company_id, u.role_id, u.position_id,
                   u.birth_place, u.birth_date, u.address, u.profile_picture,
                   u.created_at, u.updated_at,
                   r.role_name, c.company_name, p.position_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LEFT JOIN positions p ON u.position_id = p.id 
            LEFT JOIN jobs j ON p.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id AND c.deleted_at IS NULL
            ORDER BY u.id DESC;
        """)
        users = cursor.fetchall()
        return {"status": "Success", "data": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/users")
def add_user(user: UserCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validasi keselarasan Company dan Position
        if user.position_id:
            cursor.execute("""
                SELECT j.company_id 
                FROM positions p
                JOIN jobs j ON p.job_id = j.id
                WHERE p.id = %s;
            """, (user.position_id,))
            res = cursor.fetchone()
            if res:
                pos_company_id = res[0]
                if user.company_id and user.company_id != pos_company_id:
                    raise HTTPException(status_code=400, detail="Posisi yang dipilih tidak sesuai dengan Perusahaan yang dipilih")

        hashed_pwd = get_password_hash(user.hashed_password)
        cursor.execute(
            """INSERT INTO users (role_id, position_id, full_name, email, hashed_password, status, birth_place, birth_date, address, profile_picture) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;""",
            (user.role_id, user.position_id, user.full_name, user.email, hashed_pwd, user.status, user.birth_place, user.birth_date, user.address, user.profile_picture)
        )
        conn.commit()
        return {"status": "Success", "message": "User berhasil ditambahkan"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/users/{id}")
def update_user(id: int, user: UserUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validasi keselarasan Company dan Position
        if user.position_id:
            cursor.execute("""
                SELECT j.company_id 
                FROM positions p
                JOIN jobs j ON p.job_id = j.id
                WHERE p.id = %s;
            """, (user.position_id,))
            res = cursor.fetchone()
            if res:
                pos_company_id = res[0]
                if user.company_id and user.company_id != pos_company_id:
                    raise HTTPException(status_code=400, detail="Posisi yang dipilih tidak sesuai dengan Perusahaan yang dipilih")

        cursor.execute(
            """UPDATE users SET role_id = %s, position_id = %s, 
               full_name = %s, email = %s, status = %s, 
               birth_place = %s, birth_date = %s, address = %s, profile_picture = %s,
               updated_at = CURRENT_TIMESTAMP 
               WHERE id = %s;""",
            (user.role_id, user.position_id, user.full_name, user.email, user.status, user.birth_place, user.birth_date, user.address, user.profile_picture, id)
        )
        conn.commit()
        return {"status": "Success", "message": "User berhasil diupdate"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/users/{id}")
def delete_user(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "User berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= TASKS =================
@app.get("/api/tasks")
def get_tasks(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Jika Karyawan, hanya lihat tugas milik sendiri
        if current_user['role'] == 'Karyawan':
            cursor.execute("""
                SELECT t.*, u.full_name as user_name 
                FROM tasks t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.user_id = %s
                ORDER BY t.task_date DESC, t.id DESC;
            """, (current_user['user_id'],))
        else:
            # Admin / Super Admin melihat semua
            cursor.execute("""
                SELECT t.*, u.full_name as user_name 
                FROM tasks t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.task_date DESC, t.id DESC;
            """)
        tasks = cursor.fetchall()
        return {"status": "Success", "data": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/tasks")
def create_task(task: TaskCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO tasks (user_id, task_name, description, task_date, status, created_by)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
        """, (task.user_id, task.task_name, task.description, task.task_date, task.status, current_user['user_id']))
        conn.commit()
        return {"status": "Success", "message": "Tugas berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/tasks/{id}")
def update_task(id: int, task: TaskUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Cek apakah tugas ada
        cursor.execute("SELECT * FROM tasks WHERE id = %s;", (id,))
        existing_task = cursor.fetchone()
        if not existing_task:
            raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
            
        # Pengecekan role
        if current_user['role'] == 'Karyawan':
            # Karyawan hanya bisa ubah status tugas miliknya sendiri
            if existing_task[1] != current_user['user_id']: # index 1 adalah user_id
                raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk mengubah tugas ini")
            
            cursor.execute("""
                UPDATE tasks 
                SET status = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s;
            """, (task.status, id))
        else:
            # Admin/Super Admin bisa ubah semua fields
            cursor.execute("""
                UPDATE tasks 
                SET user_id = COALESCE(%s, user_id),
                    task_name = COALESCE(%s, task_name),
                    description = COALESCE(%s, description),
                    task_date = COALESCE(%s, task_date),
                    status = COALESCE(%s, status),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s;
            """, (task.user_id, task.task_name, task.description, task.task_date, task.status, id))
            
        conn.commit()
        return {"status": "Success", "message": "Tugas berhasil diperbarui"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/tasks/{id}")
def delete_task(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tasks WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Tugas berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/tasks/stats")
def get_task_stats(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if current_user['role'] == 'Karyawan':
            cursor.execute("""
                SELECT status as name, COUNT(*) as value 
                FROM tasks 
                WHERE user_id = %s
                GROUP BY status;
            """, (current_user['user_id'],))
        else:
            cursor.execute("""
                SELECT status as name, COUNT(*) as value 
                FROM tasks 
                GROUP BY status;
            """)
        stats = cursor.fetchall()
        return {"status": "Success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= SCHEDULES =================
@app.get("/api/schedules")
def get_all_schedules(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if current_user['role'] == 'Karyawan':
            cursor.execute("""
                SELECT s.*, u.full_name as user_name
                FROM schedules s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.user_id = %s
                ORDER BY s.schedule_date DESC, s.start_time ASC;
            """, (current_user['user_id'],))
        else:
            cursor.execute("""
                SELECT s.*, u.full_name as user_name
                FROM schedules s
                LEFT JOIN users u ON s.user_id = u.id
                ORDER BY s.schedule_date DESC, s.start_time ASC;
            """)
        schedules = cursor.fetchall()
        for s in schedules:
            if s.get('start_time'):
                s['start_time'] = s['start_time'].strftime('%H:%M')
            if s.get('end_time'):
                s['end_time'] = s['end_time'].strftime('%H:%M')
            if s.get('schedule_date'):
                s['schedule_date'] = s['schedule_date'].isoformat()
        return {"status": "Success", "data": schedules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/schedules")
def create_schedule(schedule: ScheduleCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO schedules (user_id, title, description, schedule_date, start_time, end_time, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (schedule.user_id, schedule.title, schedule.description, schedule.schedule_date, schedule.start_time, schedule.end_time, current_user['user_id']))
        conn.commit()
        return {"status": "Success", "message": "Jadwal berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/schedules/{id}")
def update_schedule(id: int, schedule: ScheduleUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM schedules WHERE id = %s;", (id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
            
        cursor.execute("""
            UPDATE schedules 
            SET user_id = COALESCE(%s, user_id),
                title = COALESCE(%s, title),
                description = COALESCE(%s, description),
                schedule_date = COALESCE(%s, schedule_date),
                start_time = COALESCE(%s, start_time),
                end_time = COALESCE(%s, end_time),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """, (schedule.user_id, schedule.title, schedule.description, schedule.schedule_date, schedule.start_time, schedule.end_time, id))
        conn.commit()
        return {"status": "Success", "message": "Jadwal berhasil diperbarui"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/schedules/{id}")
def delete_schedule(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM schedules WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Jadwal berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ================= NOTICES (Noticeboard) =================
@app.get("/api/notices")
def get_all_notices(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT COUNT(*) FROM notices;")
        count = cursor.fetchone()['count']
        if count == 0:
            cursor.execute("""
                INSERT INTO notices (subject, description, start_date, end_date, priority, audience)
                VALUES 
                ('Urgent Holiday Schedule', 'Jadwal libur mendadak karena renovasi kantor.', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 'High', 'All Departments'),
                ('Holiday Party RSVP', 'Silakan melakukan konfirmasi kehadiran untuk pesta akhir tahun.', CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'Low', 'Design Department'),
                ('Sistem Evaluasi Kinerja Baru', 'Sosialisasi sistem evaluasi kinerja baru akan diadakan hari Jumat ini.', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 'Medium', 'All Departments');
            """)
            conn.commit()
            
        cursor.execute("SELECT * FROM notices ORDER BY id DESC;")
        notices = cursor.fetchall()
        for n in notices:
            if n.get('start_date'):
                n['start_date'] = n['start_date'].isoformat()
            if n.get('end_date'):
                n['end_date'] = n['end_date'].isoformat()
        return {"status": "Success", "data": notices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/notices")
def create_notice(notice: NoticeCreate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO notices (subject, description, start_date, end_date, priority, audience, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (notice.subject, notice.description, notice.start_date, notice.end_date, notice.priority, notice.audience, current_user['user_id']))
        conn.commit()
        return {"status": "Success", "message": "Notice berhasil ditambahkan"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.put("/api/notices/{id}")
def update_notice(id: int, notice: NoticeUpdate, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM notices WHERE id = %s;", (id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Notice tidak ditemukan")
            
        cursor.execute("""
            UPDATE notices 
            SET subject = COALESCE(%s, subject),
                description = COALESCE(%s, description),
                start_date = COALESCE(%s, start_date),
                end_date = COALESCE(%s, end_date),
                priority = COALESCE(%s, priority),
                audience = COALESCE(%s, audience),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """, (notice.subject, notice.description, notice.start_date, notice.end_date, notice.priority, notice.audience, id))
        conn.commit()
        return {"status": "Success", "message": "Notice berhasil diperbarui"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/notices/{id}")
def delete_notice(id: int, current_user: dict = Depends(require_admin_hr_or_super)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM notices WHERE id = %s;", (id,))
        conn.commit()
        return {"status": "Success", "message": "Notice berhasil dihapus"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()