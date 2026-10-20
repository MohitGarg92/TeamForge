// auth.js – Login and Register handlers (localStorage-based with Demo Support)

// Quick Demo Login helper (callable directly from UI buttons)
function quickLogin(studentId) {
    const input = document.getElementById('studentId');
    if (input) input.value = studentId;

    const data = api.getData();
    let student = data.students.find(s => s.studentId === studentId);
    
    if (!student && typeof defaultMockData !== 'undefined') {
        const found = defaultMockData.students.find(s => s.studentId === studentId);
        if (found) {
            data.students.push(found);
            api.saveData(data);
            student = found;
        }
    }

    api.login(studentId);
    window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Login Form ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sid = document.getElementById('studentId').value.trim();
            if (!sid) return;

            const data = api.getData();
            let student = data.students.find(s => s.studentId === sid);

            if (student) {
                api.login(sid);
                window.location.href = 'dashboard.html';
            } else {
                // Friendly auto-provisioning for presentation testing:
                // If a teacher or student types any novel student ID, auto-create a profile!
                const newStudent = {
                    id: String(data.students.length + 1),
                    name: `Student (${sid})`,
                    studentId: sid,
                    email: `${sid}@thapar.edu`,
                    skills: ["C++", "Web Development", "Python"],
                    github: "",
                    linkedin: "",
                    phone: ""
                };
                data.students.push(newStudent);
                api.saveData(data);
                api.login(sid);
                window.location.href = 'dashboard.html';
            }
        });
    }

    // --- Register Form ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('regName').value.trim();
            const studentId = document.getElementById('regStudentId').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const github = document.getElementById('regGithub') ? document.getElementById('regGithub').value.trim() : "";
            const skillsRaw = document.getElementById('regSkills') ? document.getElementById('regSkills').value.trim() : "";
            const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

            if (!fullName || !studentId || !email) {
                alert('Please fill in all required fields.');
                return;
            }

            const data = api.getData();

            // Check if student already exists
            const existing = data.students.find(s => s.studentId === studentId);
            if (existing) {
                // Update their name/email/skills and log them in
                existing.name = fullName;
                existing.email = email;
                if (skills.length > 0) existing.skills = skills;
                if (github) existing.github = github;
                api.saveData(data);
                api.login(studentId);
                window.location.href = 'dashboard.html';
                return;
            }

            // Add new student
            data.students.push({
                id: String(data.students.length + 1),
                name: fullName,
                studentId: studentId,
                email: email,
                skills: skills,
                github: github,
                linkedin: "",
                phone: ""
            });
            api.saveData(data);
            api.login(studentId);
            window.location.href = 'dashboard.html';
        });
    }
});
