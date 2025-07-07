const TOKEN_KEY = 'authToken';

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function isAuthenticated() {
    return !!getToken();
}

export { saveToken, getToken, removeToken, isAuthenticated };
