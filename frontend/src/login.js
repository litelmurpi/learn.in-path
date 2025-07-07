import { login } from './apiService.js';
import { saveToken } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email-address');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const credentials = {
            email: emailInput.value,
            password: passwordInput.value,
        };

        try {
            const data = await login(credentials);
            
            if(data.token) {
                saveToken(data.token);
                alert('Login berhasil!');
                window.location.href = 'dasboard_login.html'; // Arahkan ke dasbor setelah login
            } else {
                throw new Error('Token tidak diterima dari server.');
            }

        } catch (error) {
            alert(`Login gagal: ${error.message}`);
        }
    });
});
