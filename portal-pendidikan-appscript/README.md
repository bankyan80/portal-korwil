# Portal Pendidikan - Google Apps Script

Portal Pendidikan Kecamatan Lemahabang - Dinas Pendidikan Kabupaten Cirebon  
Versi Google Apps Script dengan **Login Google Account** dan **Import data dari Firestore**.

---

## 📦 Isi Folder

| File | Kegunaan |
|------|----------|
| `Code.gs` | Backend (server-side) - Auth Google, CRUD, Import/Export data |
| `Index.html` | Halaman portal publik (Hero, Menu, Informasi, Galeri, dll) |
| `Admin.html` | Panel admin dengan login Google otomatis |
| `migrate-from-firestore.mjs` | Script Node.js untuk migrasi data dari Firestore |
| `README.md` | Dokumentasi ini |

---

## 🚀 Cara Deployment ke Google Apps Script

### 1. Buat Project Baru
- Buka [script.google.com](https://script.google.com/)
- Klik **"+ New project"** atau buka yang sudah ada
- Hapus kode `function myFunction()` default

### 2. Copy File
**File `Code.gs`:**
- Buka file `Code.gs` dari folder ini
- **Copy seluruh isinya** dan paste ke editor script (file bernama `Code.gs`)

**File `Index.html` (Halaman Portal):**
- Klik menu **File → New → HTML file**
- Beri nama: `Index`
- **Copy seluruh isi** file `Index.html` → paste

**File `Admin.html` (Panel Admin):**
- Klik menu **File → New → HTML file**
- Beri nama: `Admin`
- **Copy seluruh isi** file `Admin.html` → paste

### 3. Hubungkan Google Sheet (Database)
- Klik menu **"+ Service"** (di editor script)
- Pilih **"Google Sheets API"** → Add
- Klik tombol **"Add"** untuk membuat Spreadsheet baru
  - Atau buka [sheets.new](https://sheets.new) → copy ID sheet-nya
  - Di file `Code.gs`, fungsi `getSheet_()` akan otomatis membuat sheet-sheet yang diperlukan

### 4. Deploy sebagai Web App
- Klik **"Deploy" → "New deployment"**
- Pilih **Type: Web app**
- Set:
  - **Execute as:** `Me` (email Anda)
  - **Who has access:** `Anyone` (agar user Google lain bisa login)
- Klik **"Deploy"**
- **Copy URL** yang muncul (misal: `https://script.google.com/macros/s/.../exec`)

### 5. Buka Aplikasi
- Buka URL hasil deploy → akan tampil halaman portal publik
- Tambahkan `?page=admin` di URL untuk masuk ke panel admin
  - Contoh: `https://script.google.com/macros/s/.../exec?page=admin`

---

## 🔐 Login Google

- Panel admin otomatis mendeteksi **email Google** yang sedang login
- Untuk pertama kali, user dengan role `admin` perlu didaftarkan:
  1. Buka Google Sheet yang terhubung
  2. Buka sheet **`users`**
  3. Isi baris baru: `email` = email Google Anda, `displayName` = Nama, `role` = admin
- User yang belum terdaftar akan melihat pesan "belum terdaftar"

---

## 📥 Migrasi Data dari Firestore

### Langkah 1: Export dari Firebase Console
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Pilih project **kedinasan-e5317**
3. Klik **Firestore Database**
4. Untuk setiap koleksi yang akan diexport:
   - Klik koleksi → klik **"Export"** → Download sebagai JSON
   - Atau gunakan **Cloud Firestore Export** (ke GCS bucket)

### Langkah 2: Jalankan Script Migrasi (Alternatif 1)
```bash
cd portal-pendidikan-appscript
npm install firebase-admin
```
- Download **Service Account** dari Firebase Console:
  - Project Settings → Service Accounts
  - **Generate new private key** → simpan sebagai `service-account.json`
  - Letakkan di folder `portal-pendidikan-appscript/`
- Jalankan:
```bash
node migrate-from-firestore.mjs
```
- Hasil: file `firestore-data.json` akan ter-generate

### Langkah 3: Import via Panel Admin (Alternatif 2)
1. Buka panel admin (`?page=admin`)
2. Buka menu **Import Data** (sudah tersedia di Dashboard)
3. Copy isi file `firestore-data.json` dan paste
4. Klik Import

### Langkah 4: Import Manual via Sheet (Alternatif 3)
Jika ukuran data kecil, bisa langsung copy-paste ke Google Sheet:
1. Buka Google Sheet yang terhubung
2. Untuk setiap sheet (menus, announcements, gallery, dll):
   - Hapus semua baris (kecuali header)
   - Copy data dari file JSON dan paste

---

## 📋 Struktur Data

### Sheets yang digunakan:
| Sheet | Header Kolom |
|-------|-------------|
| `menus` | id, title, icon, url, active, order, category |
| `announcements` | id, title, content, createdAt, pinned, author |
| `gallery` | id, title, description, imageUrl, category, authorName, authorRole, status, createdAt |
| `organizations` | id, name, logo, leader, contact, active |
| `links` | id, name, logo, url, active, order |
| `users` | id, email, username, displayName, role, createdAt |
| `settings` | id, key, value |

### Mapping Firestore → Sheets:
| Firestore Collection | Sheet | Keterangan |
|---------------------|-------|-----------|
| `menus` | menus | Langsung |
| `announcements` | announcements | Langsung |
| `gallery` | gallery | `images[0]` jadi `imageUrl` |
| `organizations` | organizations | Langsung |
| `institution_links` | links | Ganti nama sheet |
| `settings` | settings | Key-value pairs |

---

## 🔧 Troubleshooting

### "Eksekusi dimulai" terus muncul?
Ini normal saat pertama kali menjalankan Apps Script. Tunggu beberapa saat hingga proses selesai.

### Error: "Tidak terdeteksi login Google"
- Pastikan **Deploy as:** `Me` dan **Access:** `Anyone`
- User harus sudah login ke akun Google di browser yang sama
- Coba buka di **Incognito/Private window** dan login Google dulu

### Data tidak muncul di halaman portal?
- Buka Google Sheet yang terhubung, periksa apakah ada data di sheet-sheet yang sesuai
- Jalankan fungsi `seedDefaultData()` di editor script untuk mengisi data contoh

### Ingin menjalankan fungsi manual?
Di editor script Google Apps Script, pilih fungsi dari dropdown lalu klik **Run** (▷).

---

## 📞 Kontak

Dinas Pendidikan Kabupaten Cirebon  
Tim Kerja Kecamatan Lemahabang