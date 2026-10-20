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
    // Logout button handler
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
