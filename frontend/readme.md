# Learn.in Path - Frontend

<div align="center">
  <img src="logo.png" alt="Learn.in Path Logo" width="200"/>
  
  <h3>Aplikasi Tracking Waktu Belajar</h3>
  <p>Catat, pantau, dan analisis waktu belajar Anda dengan mudah</p>
  
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Struktur Folder](#-struktur-folder)
- [Penggunaan](#-penggunaan)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Kontribusi](#-kontribusi)
- [Tim Pengembang](#-tim-pengembang)
- [Lisensi](#-lisensi)

## 🎯 Tentang Proyek

Learn.in Path adalah aplikasi web yang dirancang untuk membantu pengguna mencatat dan memantau waktu belajar mereka. Dengan antarmuka yang intuitif dan fitur visualisasi data, pengguna dapat dengan mudah melacak progres belajar mereka dari waktu ke waktu.

### Mengapa Learn.in Path?

- **Mudah Digunakan**: Interface yang sederhana dan user-friendly
- **Visualisasi Data**: Heatmap kalender untuk melihat intensitas belajar
- **Statistik Lengkap**: Pantau streak, total jam, dan rata-rata belajar
- **Responsif**: Dapat diakses dari berbagai perangkat

## ✨ Fitur

### 🔐 Autentikasi

- [x] Registrasi pengguna baru
- [x] Login dengan email dan password
- [x] Remember me functionality
- [x] Logout dengan konfirmasi
- [x] Token-based authentication

### 📊 Dashboard

- [x] Greeting dinamis berdasarkan waktu
- [x] Statistik harian, bulanan, dan streak
- [x] Aktivitas terkini (5 sesi terakhir)
- [x] Heatmap kalender intensitas belajar
- [x] Navigasi kalender (bulan sebelum/sesudah)

### 📝 Manajemen Sesi Belajar

- [x] Catat sesi belajar baru
- [x] Input topik, durasi, tanggal, dan catatan
- [x] Validasi input form
- [x] Modal form yang responsif

### 📈 Visualisasi Data

- [x] Heatmap kalender dengan intensitas warna
- [x] Statistik bulanan (total jam, sesi, hari belajar)
- [x] Highlight tanggal hari ini
- [x] Tooltip informasi saat hover

## 🛠️ Teknologi

### Frontend

- **HTML5** - Struktur halaman
- **CSS3** - Styling dasar
- **JavaScript ES6+** - Logika aplikasi
- **TailwindCSS** - Framework CSS utility-first
- **Font Awesome** - Icon library

### Dependencies

- **Inter Font** - Typography dari Google Fonts
- **Font Awesome 6.0** - Ikon untuk UI elements

### Development Tools

- **npm/npx** - Package manager
- **http-server** - Local development server
- **Tailwind CLI** - Build tool untuk CSS

## 🚀 Instalasi

### Prerequisites

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Git

### Langkah Instalasi

1. **Clone Repository**

   ```bash
   git clone https://github.com/litelmurpi/learn-in-path-frontend.git
   cd learn-in-path-frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build Tailwind CSS**

   ```bash
   npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
   ```

4. **Jalankan Development Server**

   ```bash
   # Menggunakan http-server
   npx http-server -p 8080 -c-1

   # Atau menggunakan PHP
   php -S localhost:8080/src/signUp.html
   ```

5. **Akses Aplikasi**
   ```
   http://localhost:8080
   ```

## ⚙️ Konfigurasi

### 1. API Configuration (`apiConfig.js`)

```javascript
const API_BASE_URL = "http://127.0.0.1:8000/api";
export { API_BASE_URL };
```

### 2. Tailwind Configuration (`tailwind.config.js`)

```javascript
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#1F2937",
        secondary: "#3B82F6",
        "dark-gray": "#6B7280",
        "light-gray": "#F3F4F6",
      },
    },
  },
  plugins: [],
};
```

### 3. Environment Variables

Buat file `.env` di root directory:

```env
API_URL=http://127.0.0.1:8000/api
APP_ENV=development
```

## 📁 Struktur Folder

```
learn-in-path-frontend/
├── src/
│   ├── apiConfig.js          # Konfigurasi API endpoint
│   ├── apiService.js         # Service untuk API calls
│   ├── auth.js               # Fungsi autentikasi
│   ├── dashboard.js          # Logika dashboard
│   ├── login.js              # Logika halaman login
│   ├── signUp.js             # Logika halaman registrasi
│   ├── userInfo.js           # Manajemen info user
│   ├── input.css             # Source Tailwind CSS
│   ├── login.html            # Halaman login
│   ├── signUp.html           # Halaman registrasi
│   └── dasboard_login.html   # Halaman dashboard
├── dist/
│   └── output.css            # Compiled Tailwind CSS
├── package.json              # NPM dependencies
├── tailwind.config.js        # Konfigurasi Tailwind
└── README.md                 # Dokumentasi
```

## 💻 Penggunaan

### Registrasi Pengguna Baru

1. Akses halaman registrasi (`signUp.html`)
2. Isi form dengan:
   - Nama Lengkap
   - Username
   - Email
   - Password (minimal 8 karakter)
   - Konfirmasi Password
3. Centang persetujuan ketentuan layanan
4. Klik tombol "Daftar"

### Login

1. Akses halaman login (`login.html`)
2. Masukkan:
   - Username
   - Email
   - Password
3. Centang "Ingat Saya" jika ingin email tersimpan
4. Klik tombol "Masuk"

### Mencatat Sesi Belajar

1. Di dashboard, klik tombol "Mulai!"
2. Isi form modal:
   - Topik Pembelajaran
   - Durasi (Jam dan Menit)
   - Tanggal
   - Catatan (opsional)
3. Klik "Simpan Sesi"

### Melihat Statistik

- **Streak**: Hari berturut-turut belajar
- **Total Bulan Ini**: Total jam belajar bulan berjalan
- **Sesi Hari Ini**: Total jam belajar hari ini
- **Heatmap**: Intensitas belajar per hari

## 🔌 API Endpoints

### Authentication

```javascript
POST / api / register; // Registrasi user baru
POST / api / login; // Login user
POST / api / logout; // Logout user
```

### Study Logs

```javascript
GET / api / study - logs; // Get all study-logs (paginated)
POST / api / study - logs; // Create new log
GET / api / study - logs / { id }; // Get specific log
PUT / api / study - logs / { id }; // Update log
DELETE / api / study - logs / { id }; // Delete log
```

### Dashboard

```javascript
GET / api / dashboard / heatmap; // Get heatmap data
GET / api / dashboard / stats; // Get statistics
```

## 📸 Screenshots

### Halaman Login

![Login Page](screenshots/login.png)

### Halaman Registrasi

![Register Page](screenshots/register.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Modal Catat Sesi

![Session Modal](screenshots/modal.png)

## 🤝 Kontribusi

Kontribusi selalu diterima! Untuk berkontribusi:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Panduan Kontribusi

- Ikuti style guide yang ada
- Tambahkan dokumentasi untuk fitur baru
- Test semua perubahan sebelum PR
- Tulis commit message yang jelas

## 👥 Tim Pengembang

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/litelmurpi">
        <img src="https://github.com/litelmurpi.png" width="100px;" alt=""/>
        <br />
        <sub><b>litelmurpi</b></sub>
      </a>
      <br />
      <a href="#" title="Code">💻</a>
      <a href="#" title="Documentation">📖</a>
    </td>
  </tr>
</table>

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/litelmurpi">litelmurpi</a>
  <br />
  <a href="#learn-in-path---frontend">Back to top</a>
</div>
