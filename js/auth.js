// auth.js – Login and Register handlers (localStorage-based)

document.addEventListener('DOMContentLoaded', () => {
    // --- Login ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sid = document.getElementById('studentId').value.trim();
            if (!sid) return;

            const data = api.getData();
            const student = data.students.find(s => s.studentId === sid);

            if (student) {
                api.login(sid);
                window.location.href = 'dashboard.html';
            } else {
                alert('Student ID not found. Please register first.');
            }
        });
    }

    // --- Register ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('regName').value.trim();
            const studentId = document.getElementById('regStudentId').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const github = document.getElementById('regGithub').value.trim();
            const skillsRaw = document.getElementById('regSkills').value.trim();
            const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

            if (!fullName || !studentId || !email) {
                alert('Please fill in all required fields.');
                return;
            }

            const data = api.getData();

            // Check if student already exists
            if (data.students.find(s => s.studentId === studentId)) {
                alert('A student with this ID already exists. Please login instead.');
                return;
            }

            // Add new student
            data.students.push({
                id: String(data.students.length + 1),
                name: fullName,
                studentId: studentId,
                email: email,
                skills: skills,
                github: github || "",
                linkedin: "",
                phone: ""
            });
            api.saveData(data);
            api.login(studentId);
            window.location.href = 'dashboard.html';
        });
    }
});
