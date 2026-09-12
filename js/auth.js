
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sid = document.getElementById('studentId').value;
            // Mock authentication
            api.login(sid);
            window.location.href = "dashboard.html";
        });
    }
});
