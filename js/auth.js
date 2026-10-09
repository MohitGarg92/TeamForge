
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sid = document.getElementById('studentId').value.trim();
            // Call backend mock-login endpoint
            try {
                const resp = await fetch('http://localhost:3000/api/auth/mock-login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        googleId: sid,
                        email: `${sid}@example.com`,
                        fullName: 'Mock User'
                    })
                });
                const data = await resp.json();
                if (resp.ok) {
                    // Successful login – redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (err) {
                console.error(err);
                alert('Network error during login');
            }
        });
    }
});
