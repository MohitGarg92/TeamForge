
const api = {
  // Retrieve the currently authenticated user (returns internal DB id or null)
  getCurrentUser: async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
      if (!res.ok) return null;
      const user = await res.json();
      return user.id; // we just need a truthy value for auth check
    } catch (e) {
      console.error('Error checking auth', e);
      return null;
    }
  },
  // Perform mock login – creates/updates a student and stores session cookie
  login: async (studentId) => {
    const resp = await fetch('http://localhost:3000/api/auth/mock-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: studentId,
        email: `${studentId}@example.com`,
        fullName: 'Mock User'
      })
    });
    return resp.ok;
  },
  // Logout – clears session on server and redirects to home page
  logout: async () => {
    await fetch('http://localhost:3000/api/auth/logout', { credentials: 'include' });
    window.location.href = '../index.html';
  },
  // Guard for protected pages; redirects to login if not authenticated
  requireAuth: async () => {
    const user = await api.getCurrentUser();
    if (!user) window.location.href = 'login.html';
  }
};

    getData: () => JSON.parse(localStorage.getItem("ptm_data")),
    saveData: (data) => localStorage.setItem("ptm_data", JSON.stringify(data)),
    getCurrentUser: () => localStorage.getItem("loggedInUser"),
    login: (studentId) => { localStorage.setItem("loggedInUser", studentId); },
    logout: () => { localStorage.removeItem("loggedInUser"); window.location.href = "../index.html"; },
    requireAuth: () => { if(!api.getCurrentUser()) window.location.href = "login.html"; }
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); api.logout(); });
});
