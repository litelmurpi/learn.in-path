<div align="center">
  
# 📚 LEARN.IN PATH

### Bangun Konsistensi dan Lacak Kemajuan Belajarmu dengan Visualisasi Menarik

[![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

<img src="https://github.com/user-attachments/assets/placeholder-dashboard.png" alt="Dashboard Preview" width="800">

</div>

---

## 🎯 Latar Belakang

Banyak pelajar dan mahasiswa menghadapi tantangan dalam mengelola waktu dan menjaga motivasi belajar. **LEARN.IN PATH** hadir sebagai solusi untuk membantu Anda membangun "Jalur Belajar" pribadi, di mana setiap usaha akan tercatat dan setiap langkah bisa dirayakan.

## 📖 Deskripsi

**LEARN.IN PATH** adalah aplikasi jurnal belajar digital berbasis web yang dirancang untuk membantu pelajar, mahasiswa, dan self-learner dalam membangun konsistensi serta melacak kemajuan belajar mereka secara mudah dan visual. Aplikasi ini memungkinkan Anda untuk memvisualisasikan bukti konsistensi belajar sejelas heatmap di GitHub.

## ✨ Fitur Utama

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/journal.png" width="60" height="60" alt="Journal"/>
      <br>
      <b>📝 Jurnal Harian</b>
      <br>
      <sub>Catat aktivitas belajar harian Anda dengan detail topik, durasi, dan catatan tambahan</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/calendar.png" width="60" height="60" alt="Calendar"/>
      <br>
      <b>📊 Kalender Heatmap</b>
      <br>
      <sub>Visualisasikan intensitas belajar Anda setiap hari dalam sebulan</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/fire.png" width="60" height="60" alt="Streak"/>
      <br>
      <b>🔥 Streak Counter</b>
      <br>
      <sub>Lacak rentetan hari belajar Anda secara beruntun untuk menjaga motivasi</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/analytics.png" width="60" height="60" alt="Statistics"/>
      <br>
      <b>📈 Statistik Pembelajaran</b>
      <br>
      <sub>Dapatkan insight dari pola belajar Anda melalui grafik dan data statistik</sub>
    </td>
  </tr>
</table>

## 🚀 Cara Instalasi & Menjalankan Project

### Prerequisites

Pastikan Anda sudah menginstall:
- **PHP** >= 8.0 ([Download](https://www.php.net/downloads))
- **Composer** ([Download](https://getcomposer.org/download/))
- **Node.js** >= 14.x & NPM ([Download](https://nodejs.org/))
- **MySQL** >= 5.7 atau MariaDB ([Download](https://www.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))

### 📥 Clone Repository

```bash
git clone https://github.com/litelmurpi/learn.in-path.git
cd learn.in-path
```

### 🔧 Setup Backend (Laravel)

1. **Masuk ke folder backend**
   ```bash
   cd backend
   ```

2. **Install dependencies PHP**
   ```bash
   composer install
   ```

3. **Copy file environment**
   ```bash
   cp .env.example .env
   ```

4. **Generate application key**
   ```bash
   php artisan key:generate
   ```

5. **Setup Database**
   
   Buat database MySQL baru:
   ```sql
   CREATE DATABASE learnin_path;
   ```
   
   Edit file `.env` dan sesuaikan konfigurasi database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=learnin_path
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Jalankan migrasi database**
   ```bash
   php artisan migrate
   ```

7. **Seed database (opsional, untuk data dummy)**
   ```bash
   php artisan db:seed
   ```

8. **Generate storage link**
   ```bash
   php artisan storage:link
   ```

9. **Jalankan backend server**
   ```bash
   php artisan serve
   ```
   Backend akan berjalan di `http://127.0.0.1:8000`

### 💻 Setup Frontend

1. **Buka terminal baru dan masuk ke folder frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build Tailwind CSS**
   ```bash
   npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
   ```
   
   Command ini akan:
   - Mengcompile Tailwind CSS dari `src/input.css`
   - Output ke `dist/output.css`
   - Mode `--watch` akan otomatis recompile saat ada perubahan

4. **Jalankan Development Server**
   
   Buka terminal baru (biarkan Tailwind watch tetap jalan) dan jalankan:
   ```bash
   php -S localhost:8080
   ```
   
   Frontend akan berjalan di `http://localhost:8080`

### ✅ Verifikasi Instalasi

1. **Backend**: Buka `http://127.0.0.1:8000` - Anda akan melihat Laravel welcome page
2. **Frontend**: Buka `http://localhost:8080` - Anda akan melihat halaman login LEARN.IN PATH
3. **API Test**: Buka `http://127.0.0.1:8000/api/test` untuk memastikan API berjalan

### 🏃‍♂️ Running Development

Untuk development, Anda memerlukan 3 terminal:

**Terminal 1 - Backend:**
```bash
cd backend
php artisan serve
```

**Terminal 2 - Tailwind CSS Watch:**
```bash
cd frontend
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

**Terminal 3 - Frontend Server:**
```bash
cd frontend
php -S localhost:8080
```

### 🐛 Troubleshooting

<details>
<summary><b>Error: SQLSTATE[HY000] [2002] Connection refused</b></summary>

- Pastikan MySQL service sudah berjalan
- Windows: Buka Services dan cari MySQL
- Mac: `brew services start mysql`
- Linux: `sudo systemctl start mysql`
</details>

<details>
<summary><b>Error: CORS Policy Block</b></summary>

1. Pastikan backend berjalan di `http://127.0.0.1:8000`
2. Pastikan frontend berjalan di `http://localhost:8080`
3. Update file `backend/config/cors.php`:
   ```php
   'allowed_origins' => [
       'http://127.0.0.1:8080',
       'http://localhost:8080',
   ],
   ```
4. Update `.env` di backend:
   ```env
   FRONTEND_URL=http://localhost:8080
   SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8080,127.0.0.1,127.0.0.1:8080
   ```
</details>

<details>
<summary><b>Error: 419 Page Expired</b></summary>

Clear cache Laravel:
```bash
cd backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```
</details>

<details>
<summary><b>Tailwind CSS tidak ter-compile</b></summary>

1. Pastikan path file benar:
   - Input: `frontend/src/input.css`
   - Output: `frontend/dist/output.css`

2. Pastikan `tailwind.config.js` ada dan configured:
   ```javascript
   module.exports = {
     content: ["./**/*.{html,js}"],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

3. Re-install dependencies:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```
</details>

### 🔒 Environment Variables

Pastikan konfigurasi `.env` di backend sudah sesuai:

```env
# Frontend URL untuk CORS
FRONTEND_URL=http://localhost:8080

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8080,127.0.0.1,127.0.0.1:8080
SESSION_DOMAIN=localhost
```

## 🛠️ Teknologi yang Digunakan

### Frontend
<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/SweetAlert2-FF6384?style=flat-square&logo=javascript&logoColor=white" alt="SweetAlert2">
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/Sanctum-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel Sanctum">
</p>

### Database
<p>
  <img src="https://img.shields.io/badge/MySQL-00000F?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
</p>

## 📊 Status Pengembangan

### ✅ Fitur yang Sudah Selesai
- [x] Autentikasi Pengguna (Login & Register)
- [x] Desain Skema Database
- [x] Manajemen Sesi Belajar
- [x] Visualisasi Heatmap di Dashboard
- [x] API Authentication dengan Sanctum

### 🚧 Tahap Pengembangan Saat Ini
- [ ] Dashboard Utama (90%)
- [ ] Input Jurnal & Tracking Durasi (85%)
- [ ] Statistik & Analytics (40%) ⚠️
  - [x] API endpoints
  - [x] Basic heatmap
  - [ ] Charts & graphs
  - [ ] Detailed analytics page
  - [ ] Export features

### 🎯 Tujuan Lanjutan
- [ ] Sistem Goal Setting & Reminder
- [ ] Fitur Ekspor Data (PDF/CSV)
- [ ] Implementasi Gamifikasi (Achievement System)
- [ ] Mobile App (React Native)

## 🎮 Demo

<div align="center">
  
### 🔗 [Demo Video](https://www.youtube.com/watch?v=demo-link)

*Live demo akan segera tersedia di: https://learninpath.demo.com*

</div>

## 📚 API Documentation

API documentation tersedia di [API.md](API.md) atau dapat diakses melalui Postman:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/your-collection-id)

## 🧪 Testing

```bash
# Backend tests
cd backend
php artisan test

# Run dengan coverage report
php artisan test --coverage
```

## 🤝 Contributing

Kami sangat menghargai kontribusi Anda! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk mengetahui cara berkontribusi.

## 👥 Tim Pengembang

<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/identicons/wasima.png" width="100px;" alt="Wasima Juhaina"/>
      <br />
      <b>Wasima Juhaina</b>
      <br />
      <sub>Frontend Developer</sub>
      <br />
      <a href="https://github.com/wasima">GitHub</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/114564508?v=4" width="100px;" alt="Yudistira Azfa"/>
      <br />
      <b>Yudistira Azfa</b>
      <br />
      <sub>Backend Developer</sub>
      <br />
      <a href="https://github.com/litelmurpi">GitHub</a>
    </td>
    <td align="center">
      <img src="https://github.com/identicons/ratih.png" width="100px;" alt="Ratih Intan"/>
      <br />
      <b>Ratih Intan</b>
      <br />
      <sub>UI/UX Designer</sub>
      <br />
      <a href="https://github.com/ratih">GitHub</a>
    </td>
  </tr>
</table>

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP Framework
- [Tailwind CSS](https://tailwindcss.com) - For styling
- [SweetAlert2](https://sweetalert2.github.io) - For beautiful alerts
- [Icons8](https://icons8.com) - For icons

---

<div align="center">
  
### 🌟 Bangun konsistensi belajarmu bersama LEARN.IN PATH! 🌟

Made with ❤️ by Tim LEARN.IN PATH

[Report Bug](https://github.com/litelmurpi/learn.in-path/issues) · [Request Feature](https://github.com/litelmurpi/learn.in-path/issues)

</div>
