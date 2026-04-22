# Jogja Furniture Enterprise v2

Sistem Manajemen Bisnis Furniture & Interior Terintegrasi (WMS, CMS, CRM, & Reporting).

## 🚀 Fitur Utama

- **Role-Based Access Control (RBAC)**:
  - **Superadmin**: Kontrol penuh sistem, manajemen user, dan log aktivitas.
  - **Admin Gudang**: Manajemen stok, barang masuk/keluar, supplier, dan laporan inventori.
  - **Admin Website**: Manajemen konten produk, kategori, layanan, dan testimoni.
  - **Marketing**: Manajemen order, data customer, dan dashboard penjualan.
- **Inventory Management (WMS)**:
  - Pencatatan barang masuk (PO) dan barang keluar (Sales).
  - Ringkasan stok real-time dengan status kritis.
  - Histori transaksi stok lengkap.
- **Order & Sales Management**:
  - Pembuatan order dengan fitur autocomplete produk.
  - Manajemen status pembayaran (Unpaid, Partial, Paid).
  - Cetak Invoice profesional.
- **Professional Reporting**:
  - Export PDF untuk Ringkasan Stok & Histori Transaksi.
  - Header laporan dinamis sesuai data perusahaan di database.
- **CMS & SEO Optimized**:
  - Manajemen katalog produk untuk website.
  - Meta tags dinamis dan optimasi visual.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MySQL (Database).
- **Frontend Admin**: Vanilla JS, CSS3, HTML5, TomSelect, Chart.js.
- **Libraries**: `html2pdf.js` untuk pelaporan PDF.

## 📦 Panduan Online (Hosting Indonesia)

Untuk mengonlinekan project ini di hosting Indonesia (seperti Niagahoster, DomaiNesia, IDCloudHost, dll), ikuti langkah berikut:

### 1. Persiapan Database (cPanel/DirectAdmin)
- Buat database MySQL baru melalui cPanel.
- Buat user database dan hubungkan ke database tersebut dengan hak akses penuh (*All Privileges*).
- Buka **phpMyAdmin**, pilih database tersebut, lalu **Import** file `backend/database_v2.sql`.

### 2. Konfigurasi Backend
- Upload seluruh folder `backend` ke direktori tujuan (misal: `/home/user/public_nodejs/backend`).
- Ubah nama `.env.example` menjadi `.env`.
- Edit file `.env` dan sesuaikan konfigurasi database:
  ```env
  DB_HOST=localhost
  DB_USER=user_database_anda
  DB_PASS=password_database_anda
  DB_NAME=nama_database_anda
  PORT=3000
  JWT_SECRET=rahasia_anda_bebas
  ```
- Di cPanel, cari menu **Setup Node.js App**.
- Klik **Create Application**:
  - **Application root**: `backend`
  - **Application URL**: (kosongkan atau sesuaikan)
  - **Application startup file**: `server.js`
- Klik **Run JS Install** atau jalankan `npm install` melalui terminal SSH.

### 3. Konfigurasi Frontend & Admin
- Upload folder `frontend` (untuk website publik) dan `admin` (untuk dashboard) ke `public_html`.
- Pastikan endpoint API di file JavaScript (biasanya di `admin/js/admin.js` atau config frontend) mengarah ke URL backend Node.js yang sudah Anda setup.
- Jika backend berjalan di subdomain (misal: `api.domainanda.com`), pastikan konfigurasi CORS di `backend/server.js` mengizinkan domain utama Anda.

### 4. Aktivasi
- Restart aplikasi Node.js di cPanel.
- Akses website dan login ke panel admin menggunakan kredensial default.

---
*Created by Antigravity for Jogja Furniture Enterprise.*
