# Akademart

## Deskripsi Proyek
Akademart adalah aplikasi marketplace yang terdiri dari:
- Frontend React + Vite + Tailwind CSS
- Backend Express + Neo4j
- Autentikasi JWT
- Recommendation engine berbasis grafik
- Upload gambar produk dengan Supabase (berbasis `multer` dan `@supabase/supabase-js`)

Proyek ini memisahkan frontend dan backend dalam struktur monorepo:
- `frontend/` untuk antarmuka pengguna
- `backend/` untuk API dan koneksi Neo4j

## Fitur Utama
- Registrasi dan login pengguna
- Otentikasi JWT untuk semua rute terproteksi
- Lihat katalog produk dan detail produk
- Interaksi pengguna: view, like, dislike, buy
- Rekomendasi produk
- Dashboard penjual untuk kelola produk dan stok
- Profil pengguna dapat diperbarui

## Teknologi
- Frontend: React, Vite, React Router, Tailwind CSS, Axios
- Backend: Node.js, Express, Neo4j Driver, dotenv, CORS, Multer
- Autentikasi: JSON Web Token (`jsonwebtoken`)
- Database graph: Neo4j
- Upload file: Supabase integration via backend

## Persiapan & Instalasi
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Install dependensi backend:
   ```bash
   pnpm install
   ```
   Atau jika tidak menggunakan `pnpm`:
   ```bash
   npm install
   ```
3. Buat file `.env` di folder `backend/` dengan isi minimal:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password
   PORT=5000
   ```
4. Masuk ke folder frontend:
   ```bash
   cd ../frontend
   ```
5. Install dependensi frontend:
   ```bash
   pnpm install
   ```
   Atau:
   ```bash
   npm install
   ```
6. (Opsional) Buat file `.env` di `frontend/` jika ingin mengubah alamat API default:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## Menjalankan Aplikasi
### Backend
```bash
cd backend
pnpm dev
```
Server backend akan berjalan pada `http://localhost:5000` secara default.

### Frontend
```bash
cd frontend
pnpm dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173` atau port lain yang disediakan Vite.

## Arsitektur Sistem
Arsitektur aplikasi terdiri dari dua bagian utama:

1. Frontend React
   - `frontend/src/App.jsx` mengatur routing dan proteksi halaman.
   - `frontend/src/context/AuthContext.jsx` mengelola sesi pengguna dan otentikasi.
   - `frontend/src/services/api.js` mengirim request ke backend dan menambahkan token JWT.

2. Backend Express
   - `backend/server.js` memulai server Express dan menghubungkan ke Neo4j.
   - `backend/src/config/neo4j.js` membuat koneksi Neo4j menggunakan environment variable.
   - `backend/src/routes/*` mendefinisikan endpoint REST untuk autentikasi, produk, interaksi, rekomendasi, dan penjual.
   - `backend/src/controllers/*` memproses logika bisnis dan operasi database.

### Diagram Arsitektur
```
[Browser React] --axios--> [Frontend Vite React App]
      |                          |
      v                          v
  Auth / Page                  API Client
      |                          |
      +-- JWT Token --------> [Backend Express]
                                |
                                +--> [Neo4j Database]
                                |
                                +--> [Supabase Image Upload]
```

## Endpoint Penting
- `POST /api/auth/register` - daftar pengguna
- `POST /api/auth/login` - login dan ambil JWT
- `GET /api/auth/profile` - ambil profil user
- `GET /api/products` - daftar produk
- `GET /api/products/:id` - detail produk
- `POST /api/products` - buat produk baru (protected)
- `POST /api/interactions/view` - catat tampilan produk
- `POST /api/recom` - ambil rekomendasi produk
- `GET /api/seller/products` - data produk penjual

## Catatan Penting
- Pastikan Neo4j berjalan dan kredensial `.env` benar.
- `frontend` menggunakan token JWT yang disimpan di `localStorage` dengan kunci `akademart_token`.
- Jika menggunakan browser, buka halaman frontend dan login sebelum mengakses rute yang terproteksi.

---
