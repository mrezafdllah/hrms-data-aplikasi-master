# LAPORAN KEGIATAN MAGANG INDUSTRI
## Posisi: Backend Developer (FastAPI & PostgreSQL)
## Proyek: Aplikasi HRMS (Human Resource Management System)

Dokumen ini berisi draf laporan kegiatan harian magang industri yang telah disesuaikan dengan posisi **Backend Developer** untuk proyek HRMS. 

Format tabel di bawah ini telah diringkas sehingga **setiap hari hanya memuat 1 baris (1 kolom kegiatan)**, namun tetap terbagi kolom **Waktu Mulai** dan **Waktu Selesai** (09.00 s.d. 16.00) agar mudah disalin langsung ke template Word/Excel laporan Anda.

---

### MINGGU 1 (1 s.d. 3 Juli 2026)

| Hari | Kegiatan / Pekerjaan | Mulai | Selesai |
| :--- | :--- | :---: | :---: |
| **SENIN** | - | - | - |
| **SELASA** | - | - | - |
| **RABU** | Perkenalan dengan pembimbing industri, pengenalan alur kerja, dan setup environment lokal (Python, PostgreSQL, Postman). | 09.00 | 16.00 |
| **KAMIS** | Diskusi pembagian modul backend HRMS, jobdesk developer, dan penyusunan draf awal rancangan kebutuhan database relasional. | 09.00 | 16.00 |
| **JUMAT** | Penyusunan dokumen kebutuhan API (API Requirements Document) dan presentasi progres rancangan backend via Zoom. | 09.00 | 16.00 |

---

### MINGGU 2 (6 s.d. 10 Juli 2026)

| Hari | Kegiatan / Pekerjaan | Mulai | Selesai |
| :--- | :--- | :---: | :---: |
| **SENIN** | Perbaikan dokumen kebutuhan API dan perancangan diagram ERD database HRMS (users, roles, companies, positions, schedules). | 09.00 | 16.00 |
| **SELASA** | Pembuatan skrip DDL SQL (schema.sql) untuk inisialisasi tabel database dan setup repository Git `hr-backend` berbasis FastAPI. | 09.00 | 16.00 |
| **RABU** | Pembuatan modul koneksi database (db_helper.py) di FastAPI menggunakan psycopg2 dan presentasi arsitektur database backend. | 09.00 | 16.00 |
| **KAMIS** | Penyesuaian relasi tabel database dan pembuatan skrip data dummy (init_admin.py) untuk inisiasi data awal roles/admin. | 09.00 | 16.00 |
| **JUMAT** | Penyelesaian file konfigurasi lingkungan (.env) dan pembuatan dokumentasi petunjuk setup proyek lokal (README.md). | 09.00 | 16.00 |

---

### MINGGU 3 (13 s.d. 17 Juli 2026)

| Hari | Kegiatan / Pekerjaan | Mulai | Selesai |
| :--- | :--- | :---: | :---: |
| **SENIN** | Rapat koordinasi tim dan perancangan draf kontrak API (API Contract) autentikasi & otorisasi multi-role format JSON. | 09.00 | 16.00 |
| **SELASA** | Implementasi hashing password, JWT token helper di auth.py, dan endpoint registrasi serta login user. | 09.00 | 16.00 |
| **RABU** | Pengujian fungsionalitas API autentikasi menggunakan Postman dan demonstrasi integrasi login dengan frontend. | 09.00 | 16.00 |
| **KAMIS** | Konfigurasi middleware CORS di FastAPI dan pembuatan dependency pembatas hak akses user (role permission helper). | 09.00 | 16.00 |
| **JUMAT** | Perancangan router modular (APIRouter) dan implementasi controller CRUD awal untuk data perusahaan (companies). | 09.00 | 16.00 |

---

### MINGGU 4 (20 s.d. 24 Juli 2026)

| Hari | Kegiatan / Pekerjaan | Mulai | Selesai |
| :--- | :--- | :---: | :---: |
| **SENIN** | Pembuatan API endpoint CRUD lengkap untuk data perusahaan (/api/companies) beserta query join PostgreSQL. | 09.00 | 16.00 |
| **SELASA** | Pembuatan model Pydantic dan API endpoints CRUD data lowongan kerja (/api/jobs) serta posisi jabatan (/api/positions). | 09.00 | 16.00 |
| **RABU** | Penyempurnaan API data master relasional, uji coba dengan Postman, dan integrasi Swagger UI untuk dokumentasi API. | 09.00 | 16.00 |
| **KAMIS** | Implementasi API endpoint upload berkas foto profil karyawan (/api/users/upload) dengan validasi format berkas. | 09.00 | 16.00 |
| **JUMAT** | Pembuatan query dinamis pencarian/filter data karyawan (GET /api/users) dan endpoint pembaruan profil mandiri (/api/profile). | 09.00 | 16.00 |

---

### MINGGU 5 (27 s.d. 31 Juli 2026)

| Hari | Kegiatan / Pekerjaan | Mulai | Selesai |
| :--- | :--- | :---: | :---: |
| **SENIN** | Perancangan skema API jadwal kalender dan implementasi API CRUD penjadwalan kerja karyawan (/api/schedules). | 09.00 | 16.00 |
| **SELASA** | Pembuatan API CRUD pengumuman internal (/api/notices) dan penambahan penanganan kesalahan database (error handling). | 09.00 | 16.00 |
| **RABU** | Uji review mandiri seluruh modul API backend dan koordinasi progres akhir integrasi dengan tim frontend/mobile. | 09.00 | 16.00 |
| **KAMIS** | Optimasi database dengan indexing pada foreign key PostgreSQL dan melengkapi dokumentasi error di Swagger OpenAPI. | 09.00 | 16.00 |
| **JUMAT** | Pembersihan kode (formatting PEP 8), final push repositori Git stabil, dan penyusunan laporan magang bulanan. | 09.00 | 16.00 |
