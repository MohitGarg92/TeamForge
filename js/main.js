// main.js – Core API helpers (localStorage-based until backend is fully wired)

const api = {
    getData: () => {
        let raw = localStorage.getItem("ptm_data");
        if (!raw) {
            if (typeof defaultMockData !== 'undefined') {
                localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
                return defaultMockData;
            }
            return { students: [], teams: [], requests: [] };
        }
        try {
            let data = JSON.parse(raw);
            const isStale = !data.students || data.students.some(s => 
                s.name.includes("Alice") || 
                s.name.includes("Demo") || 
                s.studentId === "102024000" ||
                s.studentId === "102024001"
            );
            if (isStale && typeof defaultMockData !== 'undefined') {
                localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
                localStorage.setItem("ptm_version", "teamforge_v5");
                return defaultMockData;
            }
            return data;
        } catch (e) {
            if (typeof defaultMockData !== 'undefined') {
                localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
                return defaultMockData;
            }
            return { students: [], teams: [], requests: [] };
        }
    },
    saveData: (data) => localStorage.setItem("ptm_data", JSON.stringify(data)),
    getCurrentUser: () => {
        let curr = localStorage.getItem("loggedInUser");
        if (!curr || !["1024031006", "1024030609", "1024030222", "1024030226"].includes(curr)) {
            curr = "1024031006"; // Default to Mohit Garg
            localStorage.setItem("loggedInUser", curr);
        }
        return curr;
    },
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
        let curr = localStorage.getItem("loggedInUser");
        if (!curr || !["1024031006", "1024030609", "1024030222", "1024030226"].includes(curr)) {
            localStorage.setItem("loggedInUser", "1024031006"); // Set Mohit Garg as active
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
