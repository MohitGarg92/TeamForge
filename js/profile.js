// profile.js – Display and edit profile

document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const data = api.getData();
    const user = data.students.find(s => s.studentId === api.getCurrentUser());

    // --- Profile View ---
    if (user && document.getElementById('profileCard')) {
        const skills = user.skills.map(s => `<span class="tag">${s}</span>`).join('');
        document.getElementById('profileCard').innerHTML = `
            <h3>${user.name}</h3>
            <p><strong>Student ID:</strong> ${user.studentId}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
            <div class="mt-1"><strong>Skills:</strong><br>${skills || '<span class="text-muted">No skills added</span>'}</div>
            <div class="mt-1">
                ${user.github ? `<a href="https://${user.github}" target="_blank" class="text-red">GitHub</a>` : ''}
                ${user.linkedin ? `<a href="https://${user.linkedin}" target="_blank" class="text-red" style="margin-left:1rem">LinkedIn</a>` : ''}
            </div>
        `;
    }
});
