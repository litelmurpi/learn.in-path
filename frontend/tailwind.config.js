/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"], // Sesuaikan dengan path file Anda
  theme: {
    extend: {
      colors: {
        'primary': '#112140',
        'secondary': '#33415C',
        'light-gray': '#EBEBEB',
        'dark-gray': '#5C677D',
        'white': '#FFFFFF',
        'black': '#000000',
        'blue': '#001233',

        // Warna untuk kalender/progress (sesuai gambar)
        'track-primary': '#A3D1FF',
        'track-secondary': '#439BFF', // Warna biru untuk highlight tanggal
        'track-tertiary': '#439BFF',
        'track-quaternary': '#1372DE',
      },
      fontFamily: {
        // Ganti 'Inter' dengan font yang Anda gunakan jika ada
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}