
document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const data = api.getData();
    const user = data.students.find(s => s.studentId === api.getCurrentUser()) || {name: "Student"};
    document.getElementById('welcomeUser').innerText = `Welcome, ${user.name}`;
    
    const workingProjects = data.teams.slice(0,3);
    const wpContainer = document.getElementById('workingProjects');
    workingProjects.forEach(t => {
        wpContainer.innerHTML += `
            <div class="card">
                <h3>${t.name}</h3>
                <p class="text-muted">${t.hackathon}</p>
                <p>Members: ${t.currentMembers} / ${t.capacity}</p>
                <p>Status: <strong>${t.status.toUpperCase()}</strong></p>
                <a href="team-details.html?id=${t.id}" class="btn-outline mt-1" style="display:block">View Team</a>
            </div>
        `;
    });
});
