// main.js – Core API helpers (localStorage-based until backend is fully wired)

const api = {
    getData: () => JSON.parse(localStorage.getItem("ptm_data")),
    saveData: (data) => localStorage.setItem("ptm_data", JSON.stringify(data)),
    getCurrentUser: () => localStorage.getItem("loggedInUser"),
    login: (studentId) => {
        localStorage.setItem("loggedInUser", studentId);
    },
    logout: () => {
        localStorage.removeItem("loggedInUser");
        // Navigate to home – works from both /pages/ and root
        if (window.location.pathname.includes('/pages/')) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "index.html";
        }
    },
    requireAuth: () => {
        if (!api.getCurrentUser()) {
            window.location.href = "login.html";
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }
});
