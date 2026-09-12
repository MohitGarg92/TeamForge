
document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const user = api.getData().students.find(s => s.studentId === api.getCurrentUser());
    if(user && document.getElementById('profileCard')) {
        const skills = user.skills.map(s => `<span class="tag">${s}</span>`).join('');
        document.getElementById('profileCard').innerHTML = `
            <h3>${user.name}</h3>
            <p><strong>ID:</strong> ${user.studentId}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <div class="mt-1"><strong>Skills:</strong><br>${skills}</div>
            <div class="mt-1">
                <a href="https://${user.github}" target="_blank" class="text-red">GitHub Profile</a>
            </div>
        `;
    }
});
