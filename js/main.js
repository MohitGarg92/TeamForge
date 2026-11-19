// Use the same origin unless running the legacy local static frontend.
const API_BASE = document.querySelector('meta[name="teamforge-api"]')?.content ||
    (window.location.hostname === 'localhost' && window.location.port === '5500' ? 'http://localhost:3000' : '');

// Pages anyone can open without logging in
// Match login.html or /login (some dev servers strip .html)
const isPublicPage =
    !window.location.pathname.includes('/pages/') ||
    /\/login(\.html)?$/.test(window.location.pathname);

// Hide protected pages until login is confirmed (avoids a flash of content)
if (!isPublicPage) document.documentElement.style.visibility = 'hidden';

const api = {
    user: null,
    _auth: null,

    request: async (path, { method = 'GET', body } = {}) => {
        const options = { method, credentials: 'include' };
        if (body !== undefined) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        let response;
        try {
            response = await fetch(`${API_BASE}/api${path}`, options);
        } catch {
            throw new Error('Could not reach TeamForge. Please try again.');
        }
        if (response.status === 401 && !isPublicPage) api.goToLogin();
        if (response.status === 204) return;
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            const error = new Error(result?.error || 'The request failed. Please try again.');
            error.code = result?.code;
            throw error;
        }
        if (result === null) throw new Error('TeamForge returned an unexpected response. Please try again.');
        return result;
    },

    goToLogin: () => {
        window.location.href = window.location.pathname.includes('/pages/')
            ? 'login.html'
            : 'pages/login.html';
    },

    // Asks the backend who is logged in; sends visitors to the login page if nobody is
    requireAuth: () => {
        if (!api._auth) {
            api._auth = (async () => {
                try {
                    api.user = await api.request('/auth/me');
                    document.documentElement.style.visibility = '';
                    const welcome = document.getElementById('welcomeUser');
                    if (welcome) welcome.innerText = `Welcome, ${api.user.full_name}`;
                    return api.user;
                } catch (e) {
                    document.documentElement.style.visibility = '';
                    const main = document.querySelector('.section');
                    if (main) {
                        const notice = document.createElement('div');
                        showPageMessage(notice, e.message, true);
                        main.prepend(notice);
                    }
                    return null;
                }
            })();
        }
        return api._auth;
    },

    logout: async () => {
        try {
            await api.request('/auth/logout');
        } catch (error) {
            window.alert(error.message);
            return;
        }
        window.location.href = window.location.pathname.includes('/pages/')
            ? '../index.html'
            : 'index.html';
    }
};

function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value ?? '';
    return element.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeLink(value, label) {
    if (!value) return '';
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        return `<a class="text-red" href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    } catch {
        return '';
    }
}

function skillTags(skills) {
    return skills.map(skill => `<span class="tag">${escapeHtml(skill)}</span>`).join('');
}

function requestStatus(status) {
    const labels = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };
    return labels[status] || '';
}

function teamDetailsUrl(teamId) {
    // Static servers can strip the query when redirecting an .html URL.
    return `team-details.html#id=${encodeURIComponent(teamId)}`;
}

function completeProfileUrl(teamId) {
    return teamId ? `edit-profile.html#next=team&id=${encodeURIComponent(teamId)}` : 'edit-profile.html#next=create-team';
}

function showPageMessage(container, message, isError = false) {
    const paragraph = document.createElement('p');
    paragraph.className = isError ? 'text-red' : 'text-muted';
    paragraph.setAttribute('role', isError ? 'alert' : 'status');
    paragraph.textContent = message;
    container.replaceChildren(paragraph);
}

document.addEventListener('DOMContentLoaded', () => {
    // Logout button handler
    if (!isPublicPage) api.requireAuth();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }

    // Mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // Navbar scroll shadow
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Scroll reveal animation (IntersectionObserver)
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
