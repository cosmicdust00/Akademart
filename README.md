# Akademart

Deployed Project: https://akademart.alamsyah.net (database graph di-deploy di Neo4j Aura, logika backend dan frontend dijalankan di VPS, dan image hosting dijalankan di supabase).

## Masukan Perbaikan dari Dosen (Pak Yan)
- Tambahkan test-case perbandingan keunggulan database graph (neo4j) dengan database SQL (postgres) dari proyek
- Lengkapi apa yang belum selesai secara lengkap

## Test-Case Perbandingan Performa Database Neo4j (NoSQL) dengan PostgreSQL (SQL)

Dalam melakukan uji coba performa, kami akan melakukan percobaan dengan melakukan operasi JOIN secara intensif yang merupakan keunggulan dari Neo4j, lalu kita akan lakukan hal yang sama pada database PostgreSQL. Environment yang kita gunakan dalam melakukan percobaan adalah secara lokal (agar bersih dari variabel network, murni performa database) dengan menggunakan Docker di mana akan dibuat dua buah container (satu untuk Neo4j dan satu untuk PostgreSQL), kita inisiasi container dengan menjalankan command berikut,

1. Inisiasi container PostgreSQL:
```bash
docker run -d --name postgres-akademart -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```
2. Inisiasi juga container Neo4j:
```bash
docker run -d --name neo4j-bench -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/rahasia neo4j
```
3. Lalu kita masuk ke folder `/benchmark` yang ada dalam repo yang sudah di-clone dan jalankan:
```bash
cd benchmark
pnpm install # atau npm install jika menggunakan npm
```
4. Lakukan seeding database yang akan diuji terlebih dahulu dan tunggu hingga selesai:
```bash
node seed.js
```
4. Jalankan server-bench (pastikan container menyala) dengan menggunakan command:
```bash
node server-bench.js
```
5. Lalu pada terminal session yang lain lakukan test k6 (grafana) dengan menggunakan command:
```bash
k6 run k6-test.js
```

Jika sudah melakukan hal-hal di atas, maka kita bisa dapatkan hasilnya yang kira-kira seperti ini:
![Pasted image 20260522190746](https://raw.githubusercontent.com/cosmic-experiment/assets/main/obsidian/Pasted%20image%2020260522190746.png)
Bisa dilihat pada hasil di atas jika operasi JOIN yang intensif akan dieksekusi oleh neo4j dengan waktu rata-rata(avg) 5 kali lebih cepat dibandingkan dengan database postgres, ini menunjukkan jika operasi database yang membutuhkan banyak operasi relasi dan JOIN sangat cocok diimplementasikan dengan menggunakan database graph seperti Neo4j.

Pengujian dengan k6 ini akan menembak API yang melakukan operasi JOIN tersebut secara intensif dan menguji waktu respons end-to-end dari keseluruhan sistem.
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
- pnpm (kita preferer menggunakan package manager pnpm karena lebih ringan secara disk, cepat, dan juga aman berdasarkan supply-chain attack yang akhir-akhir ini terjadi)
- Frontend: React, Vite, React Router, Tailwind CSS, Axios
- Backend: Node.js, Express, Neo4j Driver, dotenv, CORS, Multer
- Autentikasi: JSON Web Token (`jsonwebtoken`)
- Database graph: Neo4j
- Upload file: Supabase integration via backend

## Persiapan & Instalasi
1. Clone githubnya dan masuk ke folder root (Akademart):
   ```bash
   git clone https://github.com/cosmicdust00/Akademart.git
   cd Akademart
   ```
2. Install dependensi frontend dan backend menggunakan pnpm (jika belum ada install dulu melalui npm):
   ```bash
   npm install pnpm # Jika belum menginstall pnpm
   pnpm install
   ```
   Atau jika tidak menggunakan `pnpm` maka masuk ke backend dan lakukan npm install:
   ```bash
   npm install
   ```
3. Buat file `.env` di folder `backend/` dengan isi minimal:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password
   NEO4J_DATABASE=your_database_id (usually same with username)
   PORT=5000
   JWT_SECRET=yourJWT_secret
   SUPABASE_URL=link_supabase_image
   SUPABASE_KEY=insert_theAPIkey
   ```
4. Masuk ke folder frontend (jika menggunakan npm):
   ```bash
   cd ../frontend
   ```
5. Install dependensi frontend (jika menggunakan npm):
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
pnpm dev # atau npm run dev untuk npm
```
Server backend akan berjalan pada `http://localhost:5000` secara default.

### Frontend
```bash
cd frontend
pnpm dev # atau npm run dev untuk npm
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
- Jika menggunakan browser, buka halaman frontend dan lakukan register atau login sebelum mengakses rute yang terproteksi.
- Desain UI/UX dari `frontend` di-generate menggunakan LLM seperti Antigravity dan beberapa logika controller pada database dan fetching pada frontend dibantu dan didebug dengan menggunakan Gemini. Terkadang apa yang di-generate oleh LLM itu menghasilkan sesuatu yang tidak relevan dengan konteks sehingga kita perlu melakukan code cleanup pada apa yang sudah di-generate oleh LLM tersebut.

---
